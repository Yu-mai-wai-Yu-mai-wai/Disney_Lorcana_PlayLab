# Ensure-Cache: Idempotent provisioning of ElastiCache Redis cluster for Lorcana PlayLab (T05)
# Usage: .\scripts\ensure_cache.ps1 [-Region <region>]

param(
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

function Invoke-Checked([string]$What, [scriptblock]$Cmd) {
    $out = & $Cmd 2>&1
    if ($LASTEXITCODE -ne 0) { throw "$What failed: $out" }
    return $out
}

$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
if (-not (Test-Path $stateFile)) {
    throw "infrastructure_state.json not found. Run deploy first."
}
$state = Get-Content $stateFile -Raw | ConvertFrom-Json
$vpcId = $state.VpcId
$ec2SgId = $state.Ec2SecurityGroupId
$subnet1 = $state.Subnet1Id
$subnet2 = $state.Subnet2Id

if (-not $vpcId -or -not $ec2SgId) {
    throw "Missing VpcId or Ec2SecurityGroupId in infrastructure_state.json"
}

Write-Host "[cache] Checking / creating ElastiCache security group..." -ForegroundColor Green
$cacheSgName = "lorcana-cache-sg"
$cacheSgId = aws ec2 describe-security-groups --filters "Name=group-name,Values=$cacheSgName" "Name=vpc-id,Values=$vpcId" --region $Region --query "SecurityGroups[0].GroupId" --output text 2>$null
if (-not $cacheSgId -or $cacheSgId -eq "None") {
    $cacheSgId = (Invoke-Checked "create security group $cacheSgName" {
        aws ec2 create-security-group --group-name $cacheSgName --description "Security group for Lorcana ElastiCache" --vpc-id $vpcId --region $Region --query "GroupId" --output text
    }).Trim()
    Invoke-Checked "authorize ingress from EC2 SG on port 6379" {
        aws ec2 authorize-security-group-ingress --group-id $cacheSgId --protocol tcp --port 6379 --source-group $ec2SgId --region $Region
    } | Out-Null
    Write-Host "  [OK] Created $cacheSgName ($cacheSgId)" -ForegroundColor Gray
} else {
    Write-Host "  [OK] Security group $cacheSgName ($cacheSgId) exists" -ForegroundColor Gray
}

Write-Host "[cache] Checking / creating cache subnet group..." -ForegroundColor Green
$subnetGroupName = "lorcana-cache-subnets"
$existingSubnetGroup = aws elasticache describe-cache-subnet-groups --cache-subnet-group-name $subnetGroupName --region $Region --query "CacheSubnetGroups[0].CacheSubnetGroupName" --output text 2>$null
if (-not $existingSubnetGroup -or $existingSubnetGroup -eq "None") {
    Invoke-Checked "create cache subnet group" {
        aws elasticache create-cache-subnet-group `
            --cache-subnet-group-name $subnetGroupName `
            --cache-subnet-group-description "Subnet group for Lorcana ElastiCache" `
            --subnet-ids $subnet1 $subnet2 `
            --region $Region
    } | Out-Null
    Write-Host "  [OK] Created cache subnet group $subnetGroupName" -ForegroundColor Gray
} else {
    Write-Host "  [OK] Cache subnet group $subnetGroupName exists" -ForegroundColor Gray
}

Write-Host "[cache] Checking / creating ElastiCache cluster..." -ForegroundColor Green
$clusterId = "lorcana-cache"
$existingCluster = aws elasticache describe-cache-clusters --cache-cluster-id $clusterId --region $Region --query "CacheClusters[0].CacheClusterStatus" --output text 2>$null

if (-not $existingCluster -or $existingCluster -eq "None") {
    Invoke-Checked "create cache cluster" {
        aws elasticache create-cache-cluster `
            --cache-cluster-id $clusterId `
            --engine redis `
            --cache-node-type cache.t3.micro `
            --num-cache-nodes 1 `
            --cache-subnet-group-name $subnetGroupName `
            --security-group-ids $cacheSgId `
            --region $Region
    } | Out-Null
    Write-Host "  [OK] Launched cache cluster $clusterId" -ForegroundColor Gray
} else {
    Write-Host "  [OK] Cache cluster $clusterId status: $existingCluster" -ForegroundColor Gray
}

# Wait for available status
Write-Host "[cache] Waiting for cluster $clusterId to become available..." -ForegroundColor Green
for ($i = 0; $i -lt 40; $i++) {
    $status = aws elasticache describe-cache-clusters --cache-cluster-id $clusterId --region $Region --query "CacheClusters[0].CacheClusterStatus" --output text 2>$null
    if ($status -eq "available") { break }
    Write-Host "  Status: $status (waiting 15s)..." -ForegroundColor Gray
    Start-Sleep -Seconds 15
}

$status = aws elasticache describe-cache-clusters --cache-cluster-id $clusterId --region $Region --query "CacheClusters[0].CacheClusterStatus" --output text 2>$null
if ($status -ne "available") {
    throw "Cache cluster $clusterId did not become available in time (current status: $status)"
}

$endpointAddress = aws elasticache describe-cache-clusters --cache-cluster-id $clusterId --show-cache-node-info --region $Region --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text
$endpointPort = aws elasticache describe-cache-clusters --cache-cluster-id $clusterId --show-cache-node-info --region $Region --query "CacheClusters[0].CacheNodes[0].Endpoint.Port" --output text
$cacheEndpoint = "$endpointAddress`:$endpointPort"

Write-Host "  [OK] ElastiCache available at: $cacheEndpoint" -ForegroundColor Green

# Update SSM Parameter
Invoke-Checked "put SSM /lorcana/cache-endpoint" {
    aws ssm put-parameter --name "/lorcana/cache-endpoint" --type "String" --value $cacheEndpoint --overwrite --region $Region
} | Out-Null
Write-Host "  [OK] SSM /lorcana/cache-endpoint updated -> $cacheEndpoint" -ForegroundColor Gray

Write-Host "[cache] ElastiCache Redis cluster verified and ready!" -ForegroundColor Green
