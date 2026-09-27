# ==============================================================================
# DISNEY LORCANA PLAYLAB CLOUD - Lean Multi-AZ VPC + ALB + EC2 ASG Deployer
# AWS Academy Learner Lab Optimized ( Budget Protection)
# ==============================================================================

[CmdletBinding()]
param(
    [string]$Region = "us-east-1",
    [string]$VpcCidr = "10.0.0.0/16",
    [string]$Subnet1Cidr = "10.0.1.0/24",
    [string]$Subnet2Cidr = "10.0.2.0/24",
    [string]$InstanceType = "t3.micro"
)

$ErrorActionPreference = "Stop"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "[*] Deploying Disney Lorcana Lean Multi-AZ VPC + ASG Stack" -ForegroundColor Yellow
Write-Host "Region: $Region | Instance Type: $InstanceType | Cost: ~$0.033/hr (Lean VPC)" -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Verify AWS Identity & Learner Lab Session
Write-Host "`n[1/7] [+] Verifying AWS CLI credentials..." -ForegroundColor Green
$callerIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
$AccountId = $callerIdentity.Account
Write-Host "  [OK] Connected as Account: $AccountId" -ForegroundColor Gray

# Get LabInstanceProfile ARN
$LabInstanceProfileArn = "arn:aws:iam::$($AccountId):instance-profile/LabInstanceProfile"
Write-Host "  [OK] Using IAM Instance Profile: $LabInstanceProfileArn" -ForegroundColor Gray

# Guard: re-running would create a duplicate VPC (quota is 5 per region)
$existingVpc = aws ec2 describe-vpcs --filters "Name=tag:Name,Values=lorcana-lean-vpc" --region $Region --query "Vpcs[0].VpcId" --output text
if ($existingVpc -and $existingVpc -ne "None") {
    Write-Host "[ABORT] lorcana-lean-vpc already exists ($existingVpc). Run '.\lab.ps1 destroy' first." -ForegroundColor Red
    exit 1
}

# Secrets in SSM: created once, never overwritten (put-parameter without --overwrite)
function New-SsmParam([string]$Name, [string]$Type, [string]$Value) {
    $ErrorActionPreference = "Continue" # PS 5.1 turns native stderr into a terminating error under Stop
    $out = aws ssm put-parameter --name $Name --type $Type --value $Value --region $Region 2>&1
    if ($LASTEXITCODE -ne 0 -and "$out" -notmatch "ParameterAlreadyExists") { throw "SSM put-parameter $Name failed: $out" }
}
function New-Secret { $b = New-Object byte[] 48; [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b) }
$SqsUrl = aws sqs get-queue-url --queue-name lorcana-deck-analyzer --region $Region --query QueueUrl --output text
New-SsmParam "/lorcana/jwt-secret" "SecureString" (New-Secret)
New-SsmParam "/lorcana/admin-passcode" "SecureString" (New-Secret)
New-SsmParam "/lorcana/sqs-url" "String" $SqsUrl
Write-Host "  [OK] SSM parameters /lorcana/* ready" -ForegroundColor Gray

# 2. Create Lean Multi-AZ VPC (Zero NAT Gateway = $0.00)
Write-Host "`n[2/7] [+] Creating Lean Multi-AZ VPC..." -ForegroundColor Green
$vpcTag = 'ResourceType=vpc,Tags=[{Key=Name,Value=lorcana-lean-vpc}]'
$vpcRes = aws ec2 create-vpc --cidr-block $VpcCidr --region $Region --tag-specifications $vpcTag --output json | ConvertFrom-Json
$VpcId = $vpcRes.Vpc.VpcId
Write-Host "  [OK] Created VPC: $VpcId" -ForegroundColor Gray

# Enable DNS Support & Hostnames
aws ec2 modify-vpc-attribute --vpc-id $VpcId --enable-dns-support '{\"Value\":true}' --region $Region | Out-Null
aws ec2 modify-vpc-attribute --vpc-id $VpcId --enable-dns-hostnames '{\"Value\":true}' --region $Region | Out-Null

# Create Internet Gateway
$igwTag = 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=lorcana-igw}]'
$igwRes = aws ec2 create-internet-gateway --region $Region --tag-specifications $igwTag --output json | ConvertFrom-Json
$IgwId = $igwRes.InternetGateway.InternetGatewayId
aws ec2 attach-internet-gateway --vpc-id $VpcId --internet-gateway-id $IgwId --region $Region | Out-Null
Write-Host "  [OK] Attached Internet Gateway: $IgwId" -ForegroundColor Gray

# Create Multi-AZ Public Subnets (us-east-1a and us-east-1b)
$az1 = $Region + "a"
$az2 = $Region + "b"
$sub1Tag = 'ResourceType=subnet,Tags=[{Key=Name,Value=lorcana-public-1a}]'
$sub2Tag = 'ResourceType=subnet,Tags=[{Key=Name,Value=lorcana-public-1b}]'

$sub1Res = aws ec2 create-subnet --vpc-id $VpcId --cidr-block $Subnet1Cidr --availability-zone $az1 --region $Region --tag-specifications $sub1Tag --output json | ConvertFrom-Json
$Subnet1Id = $sub1Res.Subnet.SubnetId
aws ec2 modify-subnet-attribute --subnet-id $Subnet1Id --map-public-ip-on-launch --region $Region | Out-Null

$sub2Res = aws ec2 create-subnet --vpc-id $VpcId --cidr-block $Subnet2Cidr --availability-zone $az2 --region $Region --tag-specifications $sub2Tag --output json | ConvertFrom-Json
$Subnet2Id = $sub2Res.Subnet.SubnetId
aws ec2 modify-subnet-attribute --subnet-id $Subnet2Id --map-public-ip-on-launch --region $Region | Out-Null
Write-Host "  [OK] Created Subnet 1: $Subnet1Id ($az1)" -ForegroundColor Gray
Write-Host "  [OK] Created Subnet 2: $Subnet2Id ($az2)" -ForegroundColor Gray

# Create Route Table and Route to IGW
$rtTag = 'ResourceType=route-table,Tags=[{Key=Name,Value=lorcana-public-rt}]'
$rtRes = aws ec2 create-route-table --vpc-id $VpcId --region $Region --tag-specifications $rtTag --output json | ConvertFrom-Json
$RouteTableId = $rtRes.RouteTable.RouteTableId
aws ec2 create-route --route-table-id $RouteTableId --destination-cidr-block "0.0.0.0/0" --gateway-id $IgwId --region $Region | Out-Null
aws ec2 associate-route-table --subnet-id $Subnet1Id --route-table-id $RouteTableId --region $Region | Out-Null
aws ec2 associate-route-table --subnet-id $Subnet2Id --route-table-id $RouteTableId --region $Region | Out-Null
Write-Host "  [OK] Configured Route Table with default 0.0.0.0/0 route: $RouteTableId" -ForegroundColor Gray

# 3. Create Security Groups (ALB SG & EC2 SG)
Write-Host "`n[3/7] [+] Configuring Security Groups..." -ForegroundColor Green
$albSgRes = aws ec2 create-security-group --group-name "lorcana-alb-sg" --description "Security group for Lorcana ALB" --vpc-id $VpcId --region $Region --output json | ConvertFrom-Json
$AlbSgId = $albSgRes.GroupId
aws ec2 authorize-security-group-ingress --group-id $AlbSgId --protocol tcp --port 80 --cidr "0.0.0.0/0" --region $Region | Out-Null

$ec2SgRes = aws ec2 create-security-group --group-name "lorcana-ec2-sg" --description "Security group for Lorcana EC2 Instances" --vpc-id $VpcId --region $Region --output json | ConvertFrom-Json
$Ec2SgId = $ec2SgRes.GroupId
aws ec2 authorize-security-group-ingress --group-id $Ec2SgId --protocol tcp --port 80 --source-group $AlbSgId --region $Region | Out-Null
Write-Host "  [OK] ALB SG: $AlbSgId (Inbound 80 from anywhere)" -ForegroundColor Gray
Write-Host "  [OK] EC2 SG: $Ec2SgId (Inbound 80 strictly from ALB SG)" -ForegroundColor Gray

# 4. Create Application Load Balancer & Target Group
Write-Host "`n[4/7] [+] Provisioning Application Load Balancer..." -ForegroundColor Green
$tgRes = aws elbv2 create-target-group `
    --name "lorcana-tg" `
    --protocol HTTP `
    --port 80 `
    --vpc-id $VpcId `
    --target-type instance `
    --health-check-protocol HTTP `
    --health-check-path "/api/health" `
    --health-check-interval-seconds 15 `
    --health-check-timeout-seconds 5 `
    --healthy-threshold-count 2 `
    --unhealthy-threshold-count 2 `
    --region $Region `
    --output json | ConvertFrom-Json
$TargetGroupArn = $tgRes.TargetGroups[0].TargetGroupArn

$albRes = aws elbv2 create-load-balancer `
    --name "lorcana-alb" `
    --subnets $Subnet1Id $Subnet2Id `
    --security-groups $AlbSgId `
    --scheme internet-facing `
    --type application `
    --region $Region `
    --output json | ConvertFrom-Json
$AlbArn = $albRes.LoadBalancers[0].LoadBalancerArn
$AlbDnsName = $albRes.LoadBalancers[0].DNSName

# Create Listener
aws elbv2 create-listener `
    --load-balancer-arn $AlbArn `
    --protocol HTTP `
    --port 80 `
    --default-actions Type=forward,TargetGroupArn=$TargetGroupArn `
    --region $Region | Out-Null
Write-Host "  [OK] Target Group: lorcana-tg" -ForegroundColor Gray
Write-Host "  [OK] Application Load Balancer: $AlbDnsName" -ForegroundColor Yellow

# 5. Fetch Latest Amazon Linux 2023 AMI
Write-Host "`n[5/7] [+] Fetching Latest Amazon Linux 2023 AMI..." -ForegroundColor Green
$amiRes = aws ssm get-parameters --names "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64" --region $Region --output json | ConvertFrom-Json
$AmiId = $amiRes.Parameters[0].Value
Write-Host "  [OK] Found AMI: $AmiId" -ForegroundColor Gray

# Prepare User Data Script from external file
$userDataPath = Join-Path $PSScriptRoot "ec2_user_data.sh"
$UserDataScript = Get-Content $userDataPath -Raw
$UserDataBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($UserDataScript))

# 6. Create Launch Template & Auto Scaling Group
Write-Host "`n[6/7] [+] Creating Launch Template & Auto Scaling Group..." -ForegroundColor Green
$ltData = @{
    ImageId = $AmiId
    InstanceType = $InstanceType
    SecurityGroupIds = @($Ec2SgId)
    IamInstanceProfile = @{ Arn = $LabInstanceProfileArn }
    MetadataOptions = @{ HttpTokens = "required"; HttpPutResponseHopLimit = 1; HttpEndpoint = "enabled" }
    UserData = $UserDataBase64
    TagSpecifications = @(
        @{
            ResourceType = "instance"
            Tags = @(
                @{ Key = "Name"; Value = "lorcana-asg-worker" }
                @{ Key = "Project"; Value = "DisneyLorcanaPlayLab" }
            )
        }
    )
} | ConvertTo-Json -Compress -Depth 10

# Write temp lt file
$ltFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $ltFile -Value $ltData -Encoding Ascii

aws ec2 create-launch-template `
    --launch-template-name "lorcana-lt" `
    --version-description "v1-docker-ready" `
    --launch-template-data "file://$ltFile" `
    --region $Region | Out-Null
Remove-Item -Path $ltFile -Force

# Create ASG (Min: 2, Max: 4, Desired: 2) — Multi-AZ (1 EC2 in Subnet 1a, 1 EC2 in Subnet 1b)
aws autoscaling create-auto-scaling-group `
    --auto-scaling-group-name "lorcana-asg" `
    --launch-template "LaunchTemplateName=lorcana-lt,Version=`$Latest" `
    --min-size 2 `
    --max-size 4 `
    --desired-capacity 2 `
    --target-group-arns $TargetGroupArn `
    --vpc-zone-identifier "$Subnet1Id,$Subnet2Id" `
    --health-check-type "ELB" `
    --health-check-grace-period 120 `
    --region $Region | Out-Null

# 7. Configure Target Tracking Scaling Policy (CPU > 60%)
Write-Host "`n[7/7] [+] Configuring CPU Target Tracking Scaling Policy (CPU > 60%)..." -ForegroundColor Green
$policyConfig = @{
    TargetValue = 60.0
    PredefinedMetricSpecification = @{
        PredefinedMetricType = "ASGAverageCPUUtilization"
    }
    DisableScaleIn = $false
} | ConvertTo-Json -Compress

aws autoscaling put-scaling-policy `
    --auto-scaling-group-name "lorcana-asg" `
    --policy-name "cpu-target-tracking-60" `
    --policy-type "TargetTrackingScaling" `
    --target-tracking-configuration $policyConfig `
    --region $Region | Out-Null

Write-Host "  [OK] Auto Scaling Policy configured (Scale-out when CPU > 60%)" -ForegroundColor Gray

# HA evidence: alarm when any target is unhealthy (no SNS action, report evidence only)
$AlarmName = "lorcana-unhealthy-hosts"
$tgDim = $TargetGroupArn.Substring($TargetGroupArn.IndexOf("targetgroup/"))
$lbDim = $AlbArn.Substring($AlbArn.IndexOf("app/"))
aws cloudwatch put-metric-alarm `
    --alarm-name $AlarmName `
    --namespace "AWS/ApplicationELB" `
    --metric-name "UnHealthyHostCount" `
    --dimensions "Name=TargetGroup,Value=$tgDim" "Name=LoadBalancer,Value=$lbDim" `
    --statistic Maximum --period 60 --evaluation-periods 1 `
    --threshold 0 --comparison-operator GreaterThanThreshold `
    --treat-missing-data notBreaching `
    --region $Region | Out-Null
Write-Host "  [OK] CloudWatch alarm: $AlarmName (UnHealthyHostCount > 0)" -ForegroundColor Gray

# Save State to JSON File
$state = @{
    Region = $Region
    AccountId = $AccountId
    VpcId = $VpcId
    Subnet1Id = $Subnet1Id
    Subnet2Id = $Subnet2Id
    RouteTableId = $RouteTableId
    InternetGatewayId = $IgwId
    AlbSecurityGroupId = $AlbSgId
    Ec2SecurityGroupId = $Ec2SgId
    AlbArn = $AlbArn
    AlbDnsName = $AlbDnsName
    TargetGroupArn = $TargetGroupArn
    LaunchTemplateName = "lorcana-lt"
    AutoScalingGroupName = "lorcana-asg"
    AlarmName = $AlarmName
    DeployedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
$state | ConvertTo-Json -Depth 5 | Set-Content -Path $stateFile -Encoding utf8

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "[+] DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "ALB URL: http://$AlbDnsName" -ForegroundColor Yellow
Write-Host "Health Check: http://$AlbDnsName/health" -ForegroundColor Yellow
Write-Host "State Saved: $stateFile" -ForegroundColor Gray
Write-Host '[!] Run lab_stop.ps1 to scale to 0 and protect your $50 budget!' -ForegroundColor Magenta
Write-Host "=======================================================" -ForegroundColor Cyan
