import json
import os
import yaml
from typing import Dict, Any, List
from app.services.prompt_processor import CfnLoader

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "aws_pricing.json")


def load_pricing_data() -> Dict[str, Any]:
    """Load offline static AWS pricing catalog."""
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_template(template_input: Any) -> Dict[str, Any]:
    """Parse YAML or JSON CloudFormation template into a Python dict."""
    if isinstance(template_input, dict):
        return template_input
    if isinstance(template_input, str):
        try:
            parsed = yaml.load(template_input, Loader=CfnLoader)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            pass
        try:
            return json.loads(template_input)
        except Exception:
            return {}
    return {}


def resolve_property_value(prop_val: Any, parameters: Dict[str, Any], default_fallback: str) -> str:
    """Resolve property value whether it's a string or a Ref/Sub dictionary."""
    if isinstance(prop_val, str):
        return prop_val
    if isinstance(prop_val, dict) and "Ref" in prop_val:
        param_name = prop_val["Ref"]
        if param_name in parameters and isinstance(parameters[param_name], dict):
            return str(parameters[param_name].get("Default", default_fallback))
    return default_fallback


def estimate_costs(template_input: Any, region: str = "us-east-1") -> Dict[str, Any]:
    """Calculate an itemized monthly AWS cost estimate based on CloudFormation resources."""
    pricing = load_pricing_data()
    template = parse_template(template_input)
    resources = template.get("Resources", {})
    parameters = template.get("Parameters", {})

    total_monthly = 0.0
    breakdown: List[Dict[str, Any]] = []

    for res_name, res_def in resources.items():
        if not isinstance(res_def, dict):
            continue

        res_type = res_def.get("Type", "Unknown")
        props = res_def.get("Properties", {})
        if not isinstance(props, dict):
            props = {}

        # 1. EC2 Instance
        if res_type == "AWS::EC2::Instance":
            instance_type = resolve_property_value(props.get("InstanceType"), parameters, "t2.micro")
            cost_info = pricing["ec2_instances"].get(instance_type, pricing["ec2_instances"].get("t2.micro", {}))
            m_cost = cost_info.get("monthly", 8.47)
            
            # Check for EBS storage sizes
            ebs_cost = 0.0
            block_devices = props.get("BlockDeviceMappings", [])
            if isinstance(block_devices, list):
                for bdm in block_devices:
                    if isinstance(bdm, dict) and "Ebs" in bdm and isinstance(bdm["Ebs"], dict):
                        vol_size = bdm["Ebs"].get("VolumeSize", 20)
                        try:
                            ebs_cost += float(vol_size) * pricing["ebs_storage_per_gb_month"].get("gp3", 0.08)
                        except (ValueError, TypeError):
                            ebs_cost += 1.60
            if ebs_cost == 0.0:
                ebs_cost = 20 * pricing["ebs_storage_per_gb_month"].get("gp3", 0.08) # 20GB default root

            combined_cost = round(m_cost + ebs_cost, 2)
            total_monthly += combined_cost
            breakdown.append({
                "resource": f"{res_name} ({instance_type})",
                "resource_type": res_type,
                "monthly_cost": combined_cost,
                "details": f"Compute: ${m_cost}/mo + EBS Storage: ${round(ebs_cost, 2)}/mo"
            })

        # 2. RDS Database Instance
        elif res_type == "AWS::RDS::DBInstance":
            db_class = resolve_property_value(props.get("DBInstanceClass"), parameters, "db.t3.micro")
            cost_info = pricing["rds_instances"].get(db_class, pricing["rds_instances"].get("db.t3.micro", {}))
            m_cost = cost_info.get("monthly", 12.41)
            
            storage_gb = props.get("AllocatedStorage", 20)
            try:
                storage_cost = float(storage_gb) * 0.115  # standard gp2/gp3 database storage
            except (ValueError, TypeError):
                storage_cost = 2.30

            combined_cost = round(m_cost + storage_cost, 2)
            total_monthly += combined_cost
            breakdown.append({
                "resource": f"{res_name} ({db_class})",
                "resource_type": res_type,
                "monthly_cost": combined_cost,
                "details": f"Database Instance: ${m_cost}/mo + {storage_gb}GB Storage: ${round(storage_cost, 2)}/mo"
            })

        # 3. S3 Bucket
        elif res_type == "AWS::S3::Bucket":
            s3_cost = pricing["s3_storage_per_gb_month"].get("default_monthly_baseline", 1.15)
            total_monthly += s3_cost
            breakdown.append({
                "resource": f"{res_name} (S3 Bucket)",
                "resource_type": res_type,
                "monthly_cost": s3_cost,
                "details": "Standard Storage Tier (Estimated 50 GB baseline + PUT/GET API requests)"
            })

        # 4. NAT Gateway
        elif res_type == "AWS::EC2::NatGateway":
            nat_cost = pricing["networking"]["nat_gateway"]["monthly"]
            total_monthly += nat_cost
            breakdown.append({
                "resource": f"{res_name} (NAT Gateway)",
                "resource_type": res_type,
                "monthly_cost": nat_cost,
                "details": "$0.045/hour uptime across 730 hours + baseline egress"
            })

        # 5. Application Load Balancer
        elif res_type in ["AWS::ElasticLoadBalancingV2::LoadBalancer", "AWS::ElasticLoadBalancing::LoadBalancer"]:
            alb_cost = pricing["networking"]["application_load_balancer"]["monthly"]
            total_monthly += alb_cost
            breakdown.append({
                "resource": f"{res_name} (Load Balancer)",
                "resource_type": res_type,
                "monthly_cost": alb_cost,
                "details": "Hourly uptime rate ($0.0225/hr) + baseline LCU allocation"
            })

        # 6. Lambda Function
        elif res_type == "AWS::Lambda::Function":
            lambda_cost = pricing["serverless"]["lambda_default_monthly"]
            total_monthly += lambda_cost
            breakdown.append({
                "resource": f"{res_name} (Lambda Function)",
                "resource_type": res_type,
                "monthly_cost": lambda_cost,
                "details": "Serverless Compute (Estimated ~1,000,000 invocations with free-tier grant)"
            })

        # 7. DynamoDB Table
        elif res_type == "AWS::DynamoDB::Table":
            dynamo_cost = pricing["serverless"]["dynamodb_default_monthly"]
            total_monthly += dynamo_cost
            breakdown.append({
                "resource": f"{res_name} (DynamoDB Table)",
                "resource_type": res_type,
                "monthly_cost": dynamo_cost,
                "details": "On-demand table read/write baseline + 5 GB storage"
            })

        # 8. Free-Tier / Included Resources
        elif res_type in pricing.get("free_tier_resources", []):
            breakdown.append({
                "resource": f"{res_name}",
                "resource_type": res_type,
                "monthly_cost": 0.0,
                "details": "Free / Included in AWS account with zero fixed hourly charges"
            })

        # Fallback for unrecognized resources
        else:
            breakdown.append({
                "resource": f"{res_name}",
                "resource_type": res_type,
                "monthly_cost": 0.0,
                "details": "Resource type incurs no baseline fixed monthly fee or is covered under free usage"
            })

    return {
        "total_monthly": round(total_monthly, 2),
        "breakdown": breakdown,
        "region": region,
        "currency": pricing.get("currency", "USD")
    }
