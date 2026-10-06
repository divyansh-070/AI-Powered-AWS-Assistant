import json
import os
import yaml
from typing import Dict, Any, List
from app.services.prompt_processor import CfnLoader

RULES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "security_rules.json")


def load_security_rules() -> List[Dict[str, Any]]:
    """Load CIS AWS security rules catalog."""
    with open(RULES_FILE, "r", encoding="utf-8") as f:
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


def validate_security(template_input: Any) -> Dict[str, Any]:
    """Audit CloudFormation template against CIS security rules and compute security score."""
    rules = {r["id"]: r for r in load_security_rules()}
    template = parse_template(template_input)
    resources = template.get("Resources", {})

    issues: List[Dict[str, Any]] = []

    for res_name, res_def in resources.items():
        if not isinstance(res_def, dict):
            continue

        res_type = res_def.get("Type", "Unknown")
        props = res_def.get("Properties", {})
        if not isinstance(props, dict):
            props = {}

        # 1. Audit Security Groups
        if res_type == "AWS::EC2::SecurityGroup":
            ingress_list = props.get("SecurityGroupIngress", [])
            if isinstance(ingress_list, list):
                has_port_80 = False
                has_port_443 = False

                for rule in ingress_list:
                    if not isinstance(rule, dict):
                        continue

                    cidr = str(rule.get("CidrIp", ""))
                    cidr_v6 = str(rule.get("CidrIpv6", ""))
                    proto = str(rule.get("IpProtocol", "")).lower()
                    from_port = rule.get("FromPort")
                    to_port = rule.get("ToPort")

                    is_open = cidr in ["0.0.0.0/0", "::/0"] or cidr_v6 in ["::/0", "0.0.0.0/0"]

                    if is_open:
                        # Open all traffic (-1)
                        if proto in ["-1", "all"]:
                            issues.append({
                                "severity": rules["SEC-003"]["severity"],
                                "resource": res_name,
                                "issue": rules["SEC-003"]["description"],
                                "fix": rules["SEC-003"]["fix"]
                            })

                        # Open SSH (Port 22)
                        if (from_port == 22 or to_port == 22) or (
                            isinstance(from_port, (int, float)) and isinstance(to_port, (int, float)) and from_port <= 22 <= to_port
                        ):
                            issues.append({
                                "severity": rules["SEC-001"]["severity"],
                                "resource": res_name,
                                "issue": rules["SEC-001"]["description"],
                                "fix": rules["SEC-001"]["fix"]
                            })

                        # Open RDP (Port 3389)
                        if (from_port == 3389 or to_port == 3389) or (
                            isinstance(from_port, (int, float)) and isinstance(to_port, (int, float)) and from_port <= 3389 <= to_port
                        ):
                            issues.append({
                                "severity": rules["SEC-002"]["severity"],
                                "resource": res_name,
                                "issue": rules["SEC-002"]["description"],
                                "fix": rules["SEC-002"]["fix"]
                            })

                        # Track HTTP / HTTPS
                        if from_port == 80 or to_port == 80:
                            has_port_80 = True
                        if from_port == 443 or to_port == 443:
                            has_port_443 = True

                if has_port_80 and not has_port_443:
                    issues.append({
                        "severity": rules["SEC-009"]["severity"],
                        "resource": res_name,
                        "issue": rules["SEC-009"]["description"],
                        "fix": rules["SEC-009"]["fix"]
                    })

        # 2. Audit S3 Buckets
        elif res_type == "AWS::S3::Bucket":
            pab = props.get("PublicAccessBlockConfiguration")
            if not isinstance(pab, dict):
                issues.append({
                    "severity": rules["SEC-004"]["severity"],
                    "resource": res_name,
                    "issue": rules["SEC-004"]["description"],
                    "fix": rules["SEC-004"]["fix"]
                })
            else:
                is_secure_pab = (
                    pab.get("BlockPublicAcls") is True
                    and pab.get("BlockPublicPolicy") is True
                    and pab.get("IgnorePublicAcls") is True
                    and pab.get("RestrictPublicBuckets") is True
                )
                if not is_secure_pab:
                    issues.append({
                        "severity": rules["SEC-004"]["severity"],
                        "resource": res_name,
                        "issue": rules["SEC-004"]["description"],
                        "fix": rules["SEC-004"]["fix"]
                    })

            # Check S3 Encryption
            enc = props.get("BucketEncryption")
            if not isinstance(enc, dict):
                issues.append({
                    "severity": rules["SEC-005"]["severity"],
                    "resource": res_name,
                    "issue": rules["SEC-005"]["description"],
                    "fix": rules["SEC-005"]["fix"]
                })

        # 3. Audit RDS DBInstance
        elif res_type == "AWS::RDS::DBInstance":
            if props.get("PubliclyAccessible") is True:
                issues.append({
                    "severity": rules["SEC-006"]["severity"],
                    "resource": res_name,
                    "issue": rules["SEC-006"]["description"],
                    "fix": rules["SEC-006"]["fix"]
                })

            if props.get("StorageEncrypted") is not True:
                issues.append({
                    "severity": rules["SEC-007"]["severity"],
                    "resource": res_name,
                    "issue": rules["SEC-007"]["description"],
                    "fix": rules["SEC-007"]["fix"]
                })

        # 4. Audit EC2 Instances
        elif res_type == "AWS::EC2::Instance":
            block_devices = props.get("BlockDeviceMappings")
            if isinstance(block_devices, list):
                for bdm in block_devices:
                    if isinstance(bdm, dict) and "Ebs" in bdm and isinstance(bdm["Ebs"], dict):
                        if bdm["Ebs"].get("Encrypted") is not True:
                            issues.append({
                                "severity": rules["SEC-008"]["severity"],
                                "resource": res_name,
                                "issue": rules["SEC-008"]["description"],
                                "fix": rules["SEC-008"]["fix"]
                            })

        # 5. Audit IAM Policies
        elif res_type in ["AWS::IAM::Policy", "AWS::IAM::ManagedPolicy"]:
            doc = props.get("PolicyDocument", {})
            if isinstance(doc, dict):
                stmts = doc.get("Statement", [])
                if isinstance(stmts, dict):
                    stmts = [stmts]
                if isinstance(stmts, list):
                    for stmt in stmts:
                        if isinstance(stmt, dict):
                            act = stmt.get("Action", "")
                            res = stmt.get("Resource", "")
                            eff = stmt.get("Effect", "")
                            if eff == "Allow" and act == "*" and res == "*":
                                issues.append({
                                    "severity": rules["SEC-010"]["severity"],
                                    "resource": res_name,
                                    "issue": rules["SEC-010"]["description"],
                                    "fix": rules["SEC-010"]["fix"]
                                })

    # Deduplicate identical findings on same resource
    unique_issues: List[Dict[str, Any]] = []
    seen = set()
    for issue in issues:
        key = (issue["resource"], issue["issue"])
        if key not in seen:
            seen.add(key)
            unique_issues.append(issue)

    # Compute Security Score
    score = 100
    for issue in unique_issues:
        sev = issue.get("severity", "LOW")
        if sev == "HIGH":
            score -= 20
        elif sev == "MEDIUM":
            score -= 10
        elif sev == "LOW":
            score -= 5

    score = max(0, min(100, score))

    # Formulate summary
    if score >= 90 and not unique_issues:
        summary = "Outstanding Security Posture (Grade: A+). Zero CIS security benchmark violations detected."
    elif score >= 85:
        summary = f"Strong Security Posture (Grade: A - Score: {score}/100). Found {len(unique_issues)} minor recommendation(s)."
    elif score >= 70:
        summary = f"Good Posture with Remediation Required (Grade: B - Score: {score}/100). Found {len(unique_issues)} security finding(s)."
    elif score >= 50:
        summary = f"Moderate Security Warnings Present (Grade: C - Score: {score}/100). Found {len(unique_issues)} vulnerabilities."
    else:
        summary = f"High Risk - Critical Insecurities Detected (Grade: D/F - Score: {score}/100). Found {len(unique_issues)} vulnerabilities."

    return {
        "issues": unique_issues,
        "score": score,
        "summary": summary
    }
