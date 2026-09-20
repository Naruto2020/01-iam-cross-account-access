
========================================================================================

## 01 — Use an IAM Role for EC2 Instead of Long-Lived Credentials

========================================================================================

### Decision

The workload running on EC2 uses an IAM role, `WorkloadRole`, instead of storing an AWS access key ID and secret access key directly on the EC2 instance.

### Why?

Hardcoding long-lived AWS credentials on an EC2 instance creates an unnecessary credential-management and security risk.

If an attacker obtains those credentials, they can use them outside the EC2 instance until the credentials are revoked or otherwise become invalid. The impact depends on the permissions attached to the compromised credentials.

Using an IAM role provides the EC2 workload with **temporary credentials** rather than requiring long-lived access keys to be stored on the instance.

The access model is:

```text
EC2
 │
 │ uses
 ▼
Instance Profile
 │
 │ provides access to
 ▼
WorkloadRole
 │
 │ temporary credentials
 ▼
AWS Resources
```

### Least-Privilege Consideration

Using temporary credentials alone does not guarantee a secure configuration. The permissions granted to the role must also be limited to what the workload actually requires.

For this project, `WorkloadRole` is intentionally restricted:

```text
s3:GetObject
    → objects under logs/* only

s3:ListBucket
    → the specific workload bucket
```

Therefore, even if the temporary credentials associated with the role were compromised, the attacker's access would be constrained by the role's permissions.

### Security Principle

This decision demonstrates two complementary security principles:

1. **Avoid unnecessary long-lived credentials.**
2. **Apply least privilege to temporary credentials.**

Temporary credentials reduce credential-management risk, while least-privilege permissions limit the potential blast radius if those credentials are compromised.

This baseline will later be extended when the project introduces **cross-account IAM**, where the Security Account will need controlled access to resources in the Workload Account.
