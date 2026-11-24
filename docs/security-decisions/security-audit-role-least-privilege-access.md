# SecurityAuditRole Least-Privilege Access

## Context

After introducing the Security Account and configuring the dedicated `security_admin` identity, I needed to define the permissions required for cross-account security auditing.

The objective was to allow a security identity in the Security Account to inspect selected resources in the Workload Account without granting unrestricted access to the target account.

The audit scope was limited to four areas:

- S3
- IAM
- EC2
- VPC

I therefore reviewed the required AWS API actions and their IAM resource-level authorization support before defining the permissions of the `SecurityAuditRole`.

## Security Decision

I decided to use custom IAM policies for the `SecurityAuditRole` rather than attach a broad managed policy.

The permissions were defined according to the specific inspection operations required by the project.

I also decided to apply resource-level restrictions wherever supported, while keeping `Resource: "*"` for actions that do not support resource-level permissions.

## Least-Privilege Policy

The custom policies cover the following operations.

### S3

The S3 audit permissions are restricted to the project's specific bucket ARN.

The selected actions are:

```text
s3:GetEncryptionConfiguration
s3:GetBucketPublicAccessBlock
s3:GetBucketVersioning
s3:GetBucketPolicy
s3:GetBucketLocation
```

The resource is defined in CDK using:

```typescript
resources: [`${bucket.bucketArn}`]
```

I deliberately did not use:

```text
arn:aws:s3:::*
```

This avoids granting inspection permissions over unrelated buckets in the Workload Account.

### IAM

The IAM audit permissions are restricted to role inspection.

The selected actions are:

```text
iam:ListRoles
iam:GetRole
iam:GetRolePolicy
```

Their resource scopes are:

| Action | Resource |
|---|---|
| `iam:ListRoles` | `*` |
| `iam:GetRole` | `arn:aws:iam::494166748570:role/*` |
| `iam:GetRolePolicy` | `arn:aws:iam::494166748570:role/*` |

`iam:ListRoles` requires `Resource: "*"` because it does not support resource-level permissions.

The other two actions are restricted to IAM roles in the Workload Account.

This allows the auditor to list roles and inspect their configurations, trust relationships, and inline policies without extending the audit scope to unrelated IAM operations.

### EC2

The EC2 audit permissions are limited to three inspection actions:

```text
ec2:DescribeInstances
ec2:DescribeSecurityGroups
ec2:DescribeNetworkInterfaces
```

These actions use:

```typescript
resources: ["*"]
```

### VPC

The VPC audit permissions are limited to five inspection actions:

```text
ec2:DescribeVpcs
ec2:DescribeSubnets
ec2:DescribeRouteTables
ec2:DescribeNetworkAcls
ec2:DescribeInternetGateways
```

These actions also use:

```typescript
resources: ["*"]
```

The VPC operations use the `ec2:` IAM action namespace because these APIs are provided through the Amazon EC2 service.

## Rationale

I chose this permission model according to the principle of least privilege.

The objective was not to reproduce a general-purpose security audit policy. It was to grant only the operations required by the four audit areas defined for this project.

### Resource-Level Restrictions

For S3 and IAM role inspection, I applied resource-level restrictions to avoid granting access to unrelated resources.

For EC2 and VPC, I reviewed the AWS Service Authorization Reference and confirmed that the selected Describe actions do not support resource-level scoping.

Consequently, using `Resource: "*"` is required for these actions.

Rather than attempting to apply unsupported resource restrictions, I limited the allowed actions to the exact Describe operations required by the audit scope.

### Region Condition

During the review of the EC2 Service Authorization Reference, I observed the availability of the `ec2:Region` condition key.

However, I decided not to introduce a Region condition because regional restriction was not part of the agreed audit scope.

The policies therefore do not include an `ec2:Region` condition.

### Role Separation

I also decided to keep the `SecurityAuditRole` separate from the existing `WorkloadRole`.

The two roles have different responsibilities:

```text
WorkloadRole
└── EC2 workload access
    └── Project S3 Bucket

SecurityAuditRole
└── Cross-account security auditing
    ├── S3
    ├── IAM
    ├── EC2
    └── VPC
```

This prevents application workload permissions from being mixed with cross-account security auditing permissions.

## Resulting Permission Scope

The final policy design contains 16 AWS API actions across four audit areas.

| Service | Actions | Resource scope |
|---|---:|---|
| S3 | 5 | Specific project bucket ARN |
| IAM | 3 | `*` for listing; Workload Account role ARNs for inspection |
| EC2 | 3 | `*` |
| VPC | 5 | `*` |
| **Total** | **16** | |

The resulting access model is:

```text
Security Account
    |
    v
security_admin
    |
    v
SecurityAuditAccess
    |
    | sts:AssumeRole
    v
Workload Account
    |
    v
SecurityAuditRole
    |
    ├── S3: Project bucket only
    ├── IAM: Roles and inline policies
    ├── EC2: Describe operations
    └── VPC: Describe operations
```

## Scope Boundary

The `SecurityAuditRole` is intended to provide read-only inspection capabilities for the four agreed audit areas.

The current scope does not include:

- S3 object access;
- auditing every S3 bucket in the account;
- IAM user or group inspection;
- managed IAM policy inspection;
- EC2 resource modification;
- VPC resource modification;
- CloudTrail auditing;
- additional audit categories.

These responsibilities remain outside the current implementation scope.

## Least-Privilege Observation

During the policy design, I distinguished between an API operation's ability to filter returned resources and IAM's ability to authorize access at the resource level.

For example, a Describe operation may accept resource identifiers or filters in its API request. However, this does not mean IAM supports restricting that action to individual resource ARNs.

The AWS Service Authorization Reference was therefore used to determine whether resource-level permissions were supported.

I also avoided adding permissions simply to make the audit role more convenient to use.

The resulting policy keeps the action list explicit and uses resource restrictions wherever the selected IAM actions support them.

## Implementation Status

The custom policy statements have been added to the CDK implementation and reviewed.

The policies have not yet been synthesized, deployed, or runtime-tested.

The actual authorization behavior will be validated during the next implementation and testing phase.

## Least-Privilege Conclusion

The `SecurityAuditRole` follows the same principle established with `OrganizationAdmin`: permissions should be determined by the specific task rather than by the broad administrative capabilities that might be convenient.

`OrganizationAdmin` provides only the required AWS Organizations operations in the Management Account.

`SecurityAuditRole` provides only the agreed security inspection operations in the Workload Account.

Both decisions maintain separation between operational responsibilities and avoid granting unrestricted administrative access where it is not required.