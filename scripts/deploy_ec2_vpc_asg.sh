#!/bin/bash
# ==============================================================================
# DISNEY LORCANA PLAYLAB CLOUD - Lean Multi-AZ VPC + ALB + EC2 ASG Deployer (Bash)
# AWS Academy Learner Lab Optimized ($50 Budget Protection)
# ==============================================================================

set -e

REGION="us-east-1"
VPC_CIDR="10.0.0.0/16"
SUBNET1_CIDR="10.0.1.0/24"
SUBNET2_CIDR="10.0.2.0/24"
INSTANCE_TYPE="t3.micro"
LAB_ROLE_NAME="LabRole"

echo "======================================================="
echo "🚀 Deploying Disney Lorcana Lean Multi-AZ VPC + ASG Stack"
echo "Region: $REGION | Instance Type: $INSTANCE_TYPE"
echo "======================================================="

# 1. Identity & Credentials
echo -e "\n[1/7] 🔍 Verifying AWS CLI credentials..."
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
LAB_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${LAB_ROLE_NAME}"
echo "  ✅ Connected as Account: $ACCOUNT_ID"

# 2. Lean Multi-AZ VPC
echo -e "\n[2/7] 🌐 Creating Lean Multi-AZ VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --region $REGION --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=lorcana-lean-vpc}]" --query "Vpc.VpcId" --output text)
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support "{\"Value\":true}" --region $REGION
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames "{\"Value\":true}" --region $REGION

IGW_ID=$(aws ec2 create-internet-gateway --region $REGION --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=lorcana-igw}]" --query "InternetGateway.InternetGatewayId" --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $REGION

SUBNET1_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $SUBNET1_CIDR --availability-zone "${REGION}a" --region $REGION --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=lorcana-public-1a}]" --query "Subnet.SubnetId" --output text)
aws ec2 modify-subnet-attribute --subnet-id $SUBNET1_ID --map-public-ip-on-launch --region $REGION

SUBNET2_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block $SUBNET2_CIDR --availability-zone "${REGION}b" --region $REGION --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=lorcana-public-1b}]" --query "Subnet.SubnetId" --output text)
aws ec2 modify-subnet-attribute --subnet-id $SUBNET2_ID --map-public-ip-on-launch --region $REGION

RT_ID=$(aws ec2 create-route-table --vpc-id $VPC_ID --region $REGION --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=lorcana-public-rt}]" --query "RouteTable.RouteTableId" --output text)
aws ec2 create-route --route-table-id $RT_ID --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $REGION > /dev/null
aws ec2 associate-route-table --subnet-id $SUBNET1_ID --route-table-id $RT_ID --region $REGION > /dev/null
aws ec2 associate-route-table --subnet-id $SUBNET2_ID --route-table-id $RT_ID --region $REGION > /dev/null

# 3. Security Groups
echo -e "\n[3/7] 🛡️  Configuring Security Groups..."
ALB_SG_ID=$(aws ec2 create-security-group --group-name "lorcana-alb-sg" --description "Security group for Lorcana ALB" --vpc-id $VPC_ID --region $REGION --query "GroupId" --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $REGION > /dev/null

EC2_SG_ID=$(aws ec2 create-security-group --group-name "lorcana-ec2-sg" --description "Security group for Lorcana EC2 Instances" --vpc-id $VPC_ID --region $REGION --query "GroupId" --output text)
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 80 --source-group $ALB_SG_ID --region $REGION > /dev/null
aws ec2 authorize-security-group-ingress --group-id $EC2_SG_ID --protocol tcp --port 3001 --source-group $ALB_SG_ID --region $REGION > /dev/null

# 4. ALB & Target Group
echo -e "\n[4/7] ⚖️  Provisioning Application Load Balancer..."
TG_ARN=$(aws elbv2 create-target-group \
    --name "lorcana-tg" \
    --protocol HTTP \
    --port 80 \
    --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-protocol HTTP \
    --health-check-path "/health" \
    --health-check-interval-seconds 15 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 2 \
    --region $REGION \
    --query "TargetGroups[0].TargetGroupArn" --output text)

ALB_RES=$(aws elbv2 create-load-balancer \
    --name "lorcana-alb" \
    --subnets $SUBNET1_ID $SUBNET2_ID \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --region $REGION \
    --output json)

ALB_ARN=$(echo "$ALB_RES" | jq -r '.LoadBalancers[0].LoadBalancerArn')
ALB_DNS=$(echo "$ALB_RES" | jq -r '.LoadBalancers[0].DNSName')

aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region $REGION > /dev/null

# 5. Fetch AMI & Prepare Launch Template
echo -e "\n[5/7] 📦 Fetching Latest Amazon Linux 2023 AMI..."
AMI_ID=$(aws ssm get-parameters --names "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64" --region $REGION --query "Parameters[0].Value" --output text)

USER_DATA=$(cat << 'EOF' | base64 | tr -d '\n'
#!/bin/bash
yum update -y
yum install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user
dnf module reset nodejs -y || true
dnf module enable nodejs:20 -y || true
dnf install -y nodejs nginx
mkdir -p /var/www/lorcana-web
systemctl enable --now nginx
EOF
)

# 6. Launch Template & ASG
echo -e "\n[6/7] ⚙️  Creating Launch Template & Auto Scaling Group..."
aws ec2 create-launch-template \
    --launch-template-name "lorcana-lt" \
    --launch-template-data "{\"ImageId\":\"$AMI_ID\",\"InstanceType\":\"$INSTANCE_TYPE\",\"SecurityGroupIds\":[\"$EC2_SG_ID\"],\"IamInstanceProfile\":{\"Arn\":\"$LAB_ROLE_ARN\"},\"UserData\":\"$USER_DATA\"}" \
    --region $REGION > /dev/null

aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name "lorcana-asg" \
    --launch-template "LaunchTemplateName=lorcana-lt,Version=\$Latest" \
    --min-size 1 \
    --max-size 3 \
    --desired-capacity 1 \
    --target-group-arns $TG_ARN \
    --vpc-zone-identifier "$SUBNET1_ID,$SUBNET2_ID" \
    --health-check-type "ELB" \
    --health-check-grace-period 120 \
    --region $REGION > /dev/null

# 7. Scaling Policy
echo -e "\n[7/7] 📈 Configuring CPU Target Tracking Scaling Policy..."
aws autoscaling put-scaling-policy \
    --auto-scaling-group-name "lorcana-asg" \
    --policy-name "cpu-target-tracking-60" \
    --policy-type "TargetTrackingScaling" \
    --target-tracking-configuration '{"TargetValue":60.0,"PredefinedMetricSpecification":{"PredefinedMetricType":"ASGAverageCPUUtilization"},"DisableScaleIn":false}' \
    --region $REGION > /dev/null

# Save state
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cat << EOF > "$SCRIPT_DIR/infrastructure_state.json"
{
  "Region": "$REGION",
  "AccountId": "$ACCOUNT_ID",
  "VpcId": "$VPC_ID",
  "Subnet1Id": "$SUBNET1_ID",
  "Subnet2Id": "$SUBNET2_ID",
  "AlbArn": "$ALB_ARN",
  "AlbDnsName": "$ALB_DNS",
  "TargetGroupArn": "$TG_ARN",
  "AutoScalingGroupName": "lorcana-asg"
}
EOF

echo "======================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "ALB URL: http://$ALB_DNS"
echo "======================================================="
