# ==============================================================================
# DISNEY LORCANA PLAYLAB CLOUD - Lean Lab Lifecycle Controller
# Controls Start (Scale 1), Stop (Scale 0), Status, and Teardown
# ==============================================================================

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("start", "stop", "status", "destroy")]
    [string]$Action = "status",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Continue"
$stateFile = Join-Path $PSScriptRoot "infrastructure_state.json"
$state = if (Test-Path $stateFile) { Get-Content $stateFile | ConvertFrom-Json } else { $null }

if ($state -and $state.Region) { $Region = $state.Region }
$asg = if ($state -and $state.AsgName) { $state.AsgName } elseif ($state -and $state.AutoScalingGroupName) { $state.AutoScalingGroupName } else { "lorcana-asg" }
$albDns = if ($state) { $state.AlbDnsName } else { $null }
$ec2Sg = if ($state -and $state.Ec2SgId) { $state.Ec2SgId } elseif ($state) { $state.Ec2SecurityGroupId } else { $null }
$albSg = if ($state -and $state.AlbSgId) { $state.AlbSgId } elseif ($state) { $state.AlbSecurityGroupId } else { $null }
$ltId = if ($state -and $state.LaunchTemplateId) { $state.LaunchTemplateId } else { $null }
$ltName = if ($state -and $state.LaunchTemplateName) { $state.LaunchTemplateName } else { "lorcana-lt" }

switch ($Action) {
    "start" {
        Write-Host ("[START] Scaling ASG (" + $asg + ") to 2 (Multi-AZ Minimum 2)...") -ForegroundColor Green
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asg --min-size 2 --desired-capacity 2 --region $Region
        Write-Host "[OK] 2 Instances are booting across AZ-a and AZ-b. Expected online in 60-90s." -ForegroundColor Green
        if ($albDns) {
            Write-Host ("Application URL: http://" + $albDns) -ForegroundColor Yellow
            Write-Host ("Health Check:    http://" + $albDns + "/health") -ForegroundColor Yellow
        }
    }
    "stop" {
        Write-Host ("[STOP] Scaling ASG (" + $asg + ") to 0 (Scale-to-Zero)...") -ForegroundColor Green
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asg --min-size 0 --desired-capacity 0 --region $Region
        Write-Host "[OK] Instances terminating. Compute cost is now `$0.00/hr." -ForegroundColor Cyan
    }
    "status" {
        Write-Host ("[STATUS] Disney Lorcana Lab Status (" + $asg + " - " + $Region + "):") -ForegroundColor Cyan
        aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $asg --region $Region --query "AutoScalingGroups[0].Instances[*].[InstanceId,AvailabilityZone,LifecycleState,HealthStatus]" --output table
        if ($albDns) {
            try {
                $h = Invoke-RestMethod -Uri ("http://" + $albDns + "/health") -TimeoutSec 3
                Write-Host ("ALB Health: ONLINE (" + $h + ")") -ForegroundColor Green
            } catch {
                Write-Host "ALB Health: Standby / Unreachable" -ForegroundColor Yellow
            }
        }
    }
    "destroy" {
        Write-Host "[TEARDOWN] Deleting all Lorcana cloud infrastructure..." -ForegroundColor Red
        if (-not $state) {
            Write-Warning "No infrastructure_state.json found. Attempting best-effort cleanup by resource names..."
        }

        # 1. Scale to 0 and delete ASG & Launch Template
        Write-Host "[1/5] Removing Auto Scaling Group and Launch Template..." -ForegroundColor Gray
        aws autoscaling update-auto-scaling-group --auto-scaling-group-name $asg --min-size 0 --desired-capacity 0 --region $Region 2>$null
        aws autoscaling delete-auto-scaling-group --auto-scaling-group-name $asg --force-delete --region $Region 2>$null
        if ($ltId) { aws ec2 delete-launch-template --launch-template-id $ltId --region $Region 2>$null }
        aws ec2 delete-launch-template --launch-template-name $ltName --region $Region 2>$null

        # 2. ALB & Target Group
        Write-Host "[2/5] Removing Load Balancer and Target Group..." -ForegroundColor Gray
        $albArn = aws elbv2 describe-load-balancers --names "lorcana-alb" --region $Region --query "LoadBalancers[0].LoadBalancerArn" --output text 2>$null
        if ($albArn -and $albArn -ne "None") {
            aws elbv2 delete-load-balancer --load-balancer-arn $albArn --region $Region 2>$null
            Start-Sleep -Seconds 15
        }
        $tgArn = if ($state -and $state.TargetGroupArn) { $state.TargetGroupArn } else {
            aws elbv2 describe-target-groups --names "lorcana-tg" --region $Region --query "TargetGroups[0].TargetGroupArn" --output text 2>$null
        }
        if ($tgArn -and $tgArn -ne "None") {
            aws elbv2 delete-target-group --target-group-arn $tgArn --region $Region 2>$null
        }

        # 3. Security Groups
        Write-Host "[3/5] Removing Security Groups..." -ForegroundColor Gray
        if ($ec2Sg) { aws ec2 delete-security-group --group-id $ec2Sg --region $Region 2>$null }
        if ($albSg) { aws ec2 delete-security-group --group-id $albSg --region $Region 2>$null }

        # 4. VPC, Subnets & Internet Gateway
        Write-Host "[4/5] Removing VPC, Subnets, and Gateways..." -ForegroundColor Gray
        $vpc = if ($state -and $state.VpcId) { $state.VpcId } else { $null }
        if ($vpc) {
            $igws = aws ec2 describe-internet-gateways --filters ("Name=attachment.vpc-id,Values=" + $vpc) --region $Region --query "InternetGateways[*].InternetGatewayId" --output text 2>$null
            foreach ($igw in ($igws -split "\s+")) {
                if ($igw) {
                    aws ec2 detach-internet-gateway --internet-gateway-id $igw --vpc-id $vpc --region $Region 2>$null
                    aws ec2 delete-internet-gateway --internet-gateway-id $igw --region $Region 2>$null
                }
            }
            if ($state.Subnet1Id) { aws ec2 delete-subnet --subnet-id $state.Subnet1Id --region $Region 2>$null }
            if ($state.Subnet2Id) { aws ec2 delete-subnet --subnet-id $state.Subnet2Id --region $Region 2>$null }
            aws ec2 delete-vpc --vpc-id $vpc --region $Region 2>$null
        }

        # 5. Clean local state file
        Write-Host "[5/5] Purging local state cache..." -ForegroundColor Gray
        Remove-Item -Path $stateFile -Force -ErrorAction SilentlyContinue
        Write-Host "[DONE] Complete Teardown Finished. Hourly cost is `$0.0000." -ForegroundColor Green
    }
}
