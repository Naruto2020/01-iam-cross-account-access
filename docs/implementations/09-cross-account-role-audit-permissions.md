# SecurityAuditRole — Cross-Account Role and Audit Permissions

## Context

After configuring the dedicated security auditor identity and the `SecurityAuditAccess` permission set in the Security Account, I moved to the target-side configuration required for cross-account security auditing.

The objective is to create a dedicated IAM role named `SecurityAuditRole` in the Workload Account.

This role will be assumed by the generated IAM Identity Center role from the Security Account through AWS Security Token Service (STS).

Unlike the source permission set, which only authorizes the role assumption request, the `SecurityAuditRole` defines the AWS operations that the security identity can perform after successfully assuming it.

The role follows the principle of least privilege by providing read-only inspection permissions for four areas of the Workload Account:

- **S3:** Inspect the security configuration and metadata of the project's S3 bucket.
- **IAM:** List IAM roles and inspect their configuration, trust relationships, and inline policies.
- **EC2:** Inspect EC2 instances, security groups, and network interfaces.
- **VPC:** Inspect VPCs, subnets, route tables, network ACLs, and internet gateways.

The implementation uses custom IAM policy statements defined in AWS CDK with TypeScript rather than attaching a broad managed policy.