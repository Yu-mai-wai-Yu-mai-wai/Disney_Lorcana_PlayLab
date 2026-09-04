import os
import sys
import json
import base64
import time
import boto3

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

REGION = 'us-east-1'
VPC_CIDR = '10.0.0.0/16'
SUBNET1_CIDR = '10.0.1.0/24'
SUBNET2_CIDR = '10.0.2.0/24'
INSTANCE_TYPE = 't3.micro'

print('=' * 60)
print('🚀 Deploying Disney Lorcana Lean Multi-AZ VPC + ASG Stack (boto3)')
print(f'Region: {REGION} | Instance Type: {INSTANCE_TYPE} | Budget:  Protected')
print('=' * 60)

sts = boto3.client('sts', region_name=REGION)
identity = sts.get_caller_identity()
account_id = identity['Account']
print(f'[1/7] 🔍 Connected as Account: {account_id}')

ec2 = boto3.client('ec2', region_name=REGION)
elbv2 = boto3.client('elbv2', region_name=REGION)
asg = boto3.client('autoscaling', region_name=REGION)
ssm = boto3.client('ssm', region_name=REGION)

# Check if VPC already exists or create new
print('[2/7] 🌐 Creating Lean Multi-AZ VPC (Zero NAT Gateway = .00)...')
vpc = ec2.create_vpc(
    CidrBlock=VPC_CIDR,
    TagSpecifications=[{'ResourceType': 'vpc', 'Tags': [{'Key': 'Name', 'Value': 'lorcana-lean-vpc'}]}]
)
vpc_id = vpc['Vpc']['VpcId']
print(f'  ✅ Created VPC: {vpc_id}')

ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsSupport={'Value': True})
ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsHostnames={'Value': True})

igw = ec2.create_internet_gateway(
    TagSpecifications=[{'ResourceType': 'internet-gateway', 'Tags': [{'Key': 'Name', 'Value': 'lorcana-igw'}]}]
)
igw_id = igw['InternetGateway']['InternetGatewayId']
ec2.attach_internet_gateway(VpcId=vpc_id, InternetGatewayId=igw_id)
print(f'  ✅ Attached Internet Gateway: {igw_id}')

sub1 = ec2.create_subnet(
    VpcId=vpc_id,
    CidrBlock=SUBNET1_CIDR,
    AvailabilityZone=f'{REGION}a',
    TagSpecifications=[{'ResourceType': 'subnet', 'Tags': [{'Key': 'Name', 'Value': 'lorcana-public-1a'}]}]
)
sub1_id = sub1['Subnet']['SubnetId']
ec2.modify_subnet_attribute(SubnetId=sub1_id, MapPublicIpOnLaunch={'Value': True})

sub2 = ec2.create_subnet(
    VpcId=vpc_id,
    CidrBlock=SUBNET2_CIDR,
    AvailabilityZone=f'{REGION}b',
    TagSpecifications=[{'ResourceType': 'subnet', 'Tags': [{'Key': 'Name', 'Value': 'lorcana-public-1b'}]}]
)
sub2_id = sub2['Subnet']['SubnetId']
ec2.modify_subnet_attribute(SubnetId=sub2_id, MapPublicIpOnLaunch={'Value': True})
print(f'  ✅ Created Subnet 1: {sub1_id} ({REGION}a)')
print(f'  ✅ Created Subnet 2: {sub2_id} ({REGION}b)')

rt = ec2.create_route_table(
    VpcId=vpc_id,
    TagSpecifications=[{'ResourceType': 'route-table', 'Tags': [{'Key': 'Name', 'Value': 'lorcana-public-rt'}]}]
)
rt_id = rt['RouteTable']['RouteTableId']
ec2.create_route(RouteTableId=rt_id, DestinationCidrBlock='0.0.0.0/0', GatewayId=igw_id)
ec2.associate_route_table(SubnetId=sub1_id, RouteTableId=rt_id)
ec2.associate_route_table(SubnetId=sub2_id, RouteTableId=rt_id)
print(f'  ✅ Configured Route Table: {rt_id}')

# Security Groups
print('[3/7] 🛡️  Configuring Security Groups...')
alb_sg = ec2.create_security_group(
    GroupName='lorcana-alb-sg',
    Description='Security group for Lorcana ALB',
    VpcId=vpc_id
)
alb_sg_id = alb_sg['GroupId']
ec2.authorize_security_group_ingress(
    GroupId=alb_sg_id,
    IpPermissions=[{
        'IpProtocol': 'tcp',
        'FromPort': 80,
        'ToPort': 80,
        'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
    }]
)

ec2_sg = ec2.create_security_group(
    GroupName='lorcana-ec2-sg',
    Description='Security group for Lorcana EC2 Instances',
    VpcId=vpc_id
)
ec2_sg_id = ec2_sg['GroupId']
ec2.authorize_security_group_ingress(
    GroupId=ec2_sg_id,
    IpPermissions=[
        {
            'IpProtocol': 'tcp',
            'FromPort': 80,
            'ToPort': 80,
            'UserIdGroupPairs': [{'GroupId': alb_sg_id}]
        },
        {
            'IpProtocol': 'tcp',
            'FromPort': 3001,
            'ToPort': 3001,
            'UserIdGroupPairs': [{'GroupId': alb_sg_id}]
        }
    ]
)
print(f'  ✅ ALB SG: {alb_sg_id}')
print(f'  ✅ EC2 SG: {ec2_sg_id}')

# ALB & Target Group
print('[4/7] ⚖️  Provisioning Application Load Balancer...')
tg = elbv2.create_target_group(
    Name='lorcana-tg',
    Protocol='HTTP',
    Port=80,
    VpcId=vpc_id,
    TargetType='instance',
    HealthCheckProtocol='HTTP',
    HealthCheckPath='/health',
    HealthCheckIntervalSeconds=15,
    HealthCheckTimeoutSeconds=5,
    HealthyThresholdCount=2,
    UnhealthyThresholdCount=2
)
tg_arn = tg['TargetGroups'][0]['TargetGroupArn']

alb = elbv2.create_load_balancer(
    Name='lorcana-alb',
    Subnets=[sub1_id, sub2_id],
    SecurityGroups=[alb_sg_id],
    Scheme='internet-facing',
    Type='application'
)
alb_arn = alb['LoadBalancers'][0]['LoadBalancerArn']
alb_dns = alb['LoadBalancers'][0]['DNSName']

elbv2.create_listener(
    LoadBalancerArn=alb_arn,
    Protocol='HTTP',
    Port=80,
    DefaultActions=[{'Type': 'forward', 'TargetGroupArn': tg_arn}]
)
print(f'  ✅ Target Group: lorcana-tg')
print(f'  ✅ Application Load Balancer: {alb_dns}')

# AMI & Launch Template
print('[5/7] 📦 Fetching Latest Amazon Linux 2023 AMI...')
ami_param = ssm.get_parameter(Name='/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64')
ami_id = ami_param['Parameter']['Value']
print(f'  ✅ Found AMI: {ami_id}')

script_dir = os.path.dirname(os.path.abspath(__file__))
user_data_path = os.path.join(script_dir, 'ec2_user_data.sh')
with open(user_data_path, 'r', encoding='utf-8') as f:
    user_data_script = f.read()

user_data_b64 = base64.b64encode(user_data_script.encode('utf-8')).decode('utf-8')

# Delete existing LT if present
try:
    ec2.delete_launch_template(LaunchTemplateName='lorcana-lt')
except Exception:
    pass

print('[6/7] ⚙️  Creating Launch Template & Auto Scaling Group...')
ec2.create_launch_template(
    LaunchTemplateName='lorcana-lt',
    VersionDescription='v1-docker-ready',
    LaunchTemplateData={
        'ImageId': ami_id,
        'InstanceType': INSTANCE_TYPE,
        'SecurityGroupIds': [ec2_sg_id],
        'IamInstanceProfile': {'Arn': f'arn:aws:iam::{account_id}:instance-profile/LabInstanceProfile'},
        'UserData': user_data_b64,
        'TagSpecifications': [{
            'ResourceType': 'instance',
            'Tags': [
                {'Key': 'Name', 'Value': 'lorcana-asg-worker'},
                {'Key': 'Project', 'Value': 'DisneyLorcanaPlayLab'}
            ]
        }]
    }
)

# Delete existing ASG if present
try:
    asg.delete_auto_scaling_group(AutoScalingGroupName='lorcana-asg', ForceDelete=True)
    time.sleep(5)
except Exception:
    pass

asg.create_auto_scaling_group(
    AutoScalingGroupName='lorcana-asg',
    LaunchTemplate={'LaunchTemplateName': 'lorcana-lt', 'Version': ''},
    MinSize=1,
    MaxSize=3,
    DesiredCapacity=1,
    TargetGroupARNs=[tg_arn],
    VPCZoneIdentifier=f'{sub1_id},{sub2_id}',
    HealthCheckType='ELB',
    HealthCheckGracePeriod=120
)

# Scaling Policy
print('[7/7] 📈 Configuring CPU Target Tracking Scaling Policy (CPU > 60%)...')
asg.put_scaling_policy(
    AutoScalingGroupName='lorcana-asg',
    PolicyName='cpu-target-tracking-60',
    PolicyType='TargetTrackingScaling',
    TargetTrackingConfiguration={
        'PredefinedMetricSpecification': {'PredefinedMetricType': 'ASGAverageCPUUtilization'},
        'TargetValue': 60.0,
        'DisableScaleIn': False
    }
)
print('  ✅ Auto Scaling Policy configured (Scale-out when CPU > 60%)')

state = {
    'Region': REGION,
    'AccountId': account_id,
    'VpcId': vpc_id,
    'Subnet1Id': sub1_id,
    'Subnet2Id': sub2_id,
    'RouteTableId': rt_id,
    'InternetGatewayId': igw_id,
    'AlbSecurityGroupId': alb_sg_id,
    'Ec2SecurityGroupId': ec2_sg_id,
    'AlbArn': alb_arn,
    'AlbDnsName': alb_dns,
    'TargetGroupArn': tg_arn,
    'LaunchTemplateName': 'lorcana-lt',
    'AutoScalingGroupName': 'lorcana-asg',
    'DeployedAt': time.strftime('%Y-%m-%d %H:%M:%S')
}

state_file = os.path.join(script_dir, 'infrastructure_state.json')
with open(state_file, 'w', encoding='utf-8') as f:
    json.dump(state, f, indent=2)

print('=' * 60)
print('🎉 DEPLOYMENT COMPLETE!')
print(f'ALB URL: http://{alb_dns}')
print(f'Health Check: http://{alb_dns}/health')
print(f'State Saved: {state_file}')
print('💡 Run lab_stop.ps1 to scale to 0 and protect your  budget!')
print('=' * 60)
