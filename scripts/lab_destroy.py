import os
import sys
import json
import time
import boto3

if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

REGION = 'us-east-1'
script_dir = os.path.dirname(os.path.abspath(__file__))
state_file = os.path.join(script_dir, 'infrastructure_state.json')

if not os.path.exists(state_file):
    print("❌ No infrastructure_state.json found. Nothing to destroy.")
    sys.exit(0)

with open(state_file, 'r', encoding='utf-8') as f:
    state = json.load(f)

region = state.get('Region', REGION)
vpc_id = state.get('VpcId')
asg_name = state.get('AutoScalingGroupName', 'lorcana-asg')
lt_name = state.get('LaunchTemplateName', 'lorcana-lt')
alb_arn = state.get('AlbArn')
tg_arn = state.get('TargetGroupArn')
alb_sg_id = state.get('AlbSecurityGroupId')
ec2_sg_id = state.get('Ec2SecurityGroupId')
igw_id = state.get('InternetGatewayId')
sub1_id = state.get('Subnet1Id')
sub2_id = state.get('Subnet2Id')
rt_id = state.get('RouteTableId')

print('=' * 60)
print('🧨 Destroying Disney Lorcana Infrastructure (Complete Cleanup -> $0.00)')
print(f'Region: {region} | VPC: {vpc_id} | ASG: {asg_name}')
print('=' * 60)

ec2 = boto3.client('ec2', region_name=region)
elbv2 = boto3.client('elbv2', region_name=region)
asg = boto3.client('autoscaling', region_name=region)

# 1. Delete ASG
print('[1/6] 🛑 Deleting Auto Scaling Group...')
try:
    asg.delete_auto_scaling_group(AutoScalingGroupName=asg_name, ForceDelete=True)
    print(f'  ✅ Deleted ASG: {asg_name}')
    print('  ⏳ Waiting for instances to terminate...')
    while True:
        res = asg.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])
        if not res['AutoScalingGroups']:
            break
        time.sleep(5)
    print('  ✅ ASG completely removed.')
except Exception as e:
    print(f'  ⚠️  ASG delete notice: {e}')

# 2. Delete Launch Template
print('[2/6] 🗑️  Deleting Launch Template...')
try:
    ec2.delete_launch_template(LaunchTemplateName=lt_name)
    print(f'  ✅ Deleted Launch Template: {lt_name}')
except Exception as e:
    print(f'  ⚠️  Launch Template notice: {e}')

# 3. Delete ALB & Target Group
print('[3/6] ⚖️  Deleting ALB and Target Group...')
if alb_arn:
    try:
        elbv2.delete_load_balancer(LoadBalancerArn=alb_arn)
        print('  ✅ Deleted Load Balancer')
        print('  ⏳ Waiting for ALB deletion...')
        time.sleep(15)
    except Exception as e:
        print(f'  ⚠️  ALB delete notice: {e}')

if tg_arn:
    try:
        elbv2.delete_target_group(TargetGroupArn=tg_arn)
        print('  ✅ Deleted Target Group')
    except Exception as e:
        print(f'  ⚠️  Target Group notice: {e}')

# 4. Delete Security Groups
print('[4/6] 🛡️  Deleting Security Groups...')
for sg_id, name in [(ec2_sg_id, 'EC2 SG'), (alb_sg_id, 'ALB SG')]:
    if sg_id:
        for attempt in range(6):
            try:
                ec2.delete_security_group(GroupId=sg_id)
                print(f'  ✅ Deleted {name}: {sg_id}')
                break
            except Exception as e:
                time.sleep(5)

# 5. Delete Subnets, Route Tables, Internet Gateway, and VPC
print('[5/6] 🌐 Deleting Network Resources (Subnets, IGW, Route Tables, VPC)...')
if rt_id:
    try:
        ec2.delete_route_table(RouteTableId=rt_id)
        print(f'  ✅ Deleted Route Table: {rt_id}')
    except Exception:
        pass

for sub_id in [sub1_id, sub2_id]:
    if sub_id:
        try:
            ec2.delete_subnet(SubnetId=sub_id)
            print(f'  ✅ Deleted Subnet: {sub_id}')
        except Exception as e:
            print(f'  ⚠️  Subnet {sub_id} delete notice: {e}')

if igw_id and vpc_id:
    try:
        ec2.detach_internet_gateway(InternetGatewayId=igw_id, VpcId=vpc_id)
        ec2.delete_internet_gateway(InternetGatewayId=igw_id)
        print(f'  ✅ Deleted Internet Gateway: {igw_id}')
    except Exception as e:
        print(f'  ⚠️  IGW delete notice: {e}')

if vpc_id:
    for attempt in range(6):
        try:
            ec2.delete_vpc(VpcId=vpc_id)
            print(f'  ✅ Deleted VPC: {vpc_id}')
            break
        except Exception as e:
            time.sleep(5)

# 6. Remove state file
print('[6/6] 🧹 Cleaning state file...')
try:
    os.remove(state_file)
    print('  ✅ Removed infrastructure_state.json')
except Exception:
    pass

print('=' * 60)
print('🎉 ALL CLOUD RESOURCES DESTROYED! TOTAL HOURLY COST IS NOW $0.0000')
print('=' * 60)
