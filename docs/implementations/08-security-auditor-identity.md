
# Security Auditor Identity and Permission Set

## Context

After creating the Security Account, I started implementing the identity and permission configuration required for cross-account security auditing.

The objective is to use a dedicated IAM Identity Center identity in the Security Account to request access to a specific security audit role in the Workload Account.

This implementation follows the principle of least privilege and separates security auditing from normal engineering and administrative activities.

## Architecture and Access Flow

The intended access flow is:

```text
Security Account (631749621147)
│
└── IAM Identity Center
    │
    └── security_admin
        │
        └── SecurityAuditAccess
            │
            │ sts:AssumeRole
            ▼
        Workload Account (494166748570)
            │
            └── SecurityAuditRole
                │
                └── Authorized audit operations
```

The source identity and permission set have been configured. The target role's trust policy, permissions, and end-to-end access remain to be validated.

## Decision: Dedicated Security Auditor Identity

I created a dedicated IAM Identity Center user named `security_admin` in the Security Account.

The decision was made to avoid reusing an existing engineer or administrator identity for security auditing.

A dedicated identity makes the intended purpose of the access explicit and allows its permissions to be managed independently.

The name `security_admin` does not imply unrestricted administrative access. The identity is intended to operate with only the permissions required for the security auditing workflow.

## Permission Set: SecurityAuditAccess

### Configuration

I created an IAM Identity Center permission set named `SecurityAuditAccess`.

| Setting | Configuration |
|---|---|
| Permission set | `SecurityAuditAccess` |
| Session duration | 1 hour |
| AWS-managed policies | None attached |
| Customer-managed policies | None attached |
| Inline policy | Restricted `sts:AssumeRole` permission |
| Assigned identity | `security_admin` |
| Assigned account | Security (`631749621147`) |

### Why No Broad Managed Policies?

I deliberately did not attach `AdministratorAccess`, `PowerUserAccess`, or the AWS-managed `SecurityAudit` policy to this permission set.

The purpose of the source permission set is to allow the identity to request assumption of one specific role in the Workload Account. It does not need broad permissions in the Security Account to perform that task.

The permissions available after role assumption will be determined by the target role's own policies.

This separation keeps the source identity's permissions distinct from the permissions granted by the target role.

## Inline Policy

The permission set contains the following inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeWorkloadSecurityAuditRole",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::494166748570:role/SecurityAuditRole"
    }
  ]
}
```

The policy permits `sts:AssumeRole` only on the designated `SecurityAuditRole` ARN in the Workload Account.

It does not grant permission to assume arbitrary roles or directly read S3 objects.

An identity-side allow policy is not sufficient by itself to establish cross-account access. The target role must also trust the appropriate source principal, and the target role must have the required audit permissions.

## Account Assignment and Console Test

I assigned `SecurityAuditAccess` to `security_admin` in the Security Account through IAM Identity Center.

I then:

1. Signed in through the AWS Access Portal.
2. Selected the Security Account.
3. Selected the `SecurityAuditAccess` permission set.
4. Opened the AWS Management Console.
5. Inspected the resulting session identity.

The observed session principal was:

```text
arn:aws:sts::631749621147:assumed-role/AWSReservedSSO_SecurityAuditAccess_675f4c3c8249bb98/security_admin
```

The corresponding generated IAM role name was:

```text
AWSReservedSSO_SecurityAuditAccess_675f4c3c8249bb98
```

This confirmed that the identity could sign in to the Security Account using the intended permission set.

The generated IAM role ARN must be verified before it is used in the Workload Account role's trust policy.

## Observed Access Denied Results

During the console test, I opened the IAM dashboard and received `AccessDenied` errors for:

- `iam:GetAccountSummary`
- `iam:ListAccountAliases`

These errors were consistent with the permission set configuration. `SecurityAuditAccess` grants the narrowly scoped `sts:AssumeRole` permission but does not grant direct IAM inspection permissions in the Security Account.

I did not broaden the permission set merely to remove these errors.

This illustrates an important least-privilege principle: console visibility and permission to perform the intended task are separate concerns.

## Current Status

### Completed

- [x] Created the dedicated `security_admin` identity.
- [x] Created the `SecurityAuditAccess` permission set.
- [x] Set the session duration to one hour.
- [x] Left AWS-managed and customer-managed policy attachments empty.
- [x] Added the inline policy restricted to the designated Workload role ARN.
- [x] Assigned the permission set to `security_admin` in the Security Account.
- [x] Signed in through the AWS Access Portal and observed the resulting session principal.
- [x] Observed the expected denial of direct IAM dashboard actions.

### Pending

- [ ] Confirm that `SecurityAuditRole` exists in the Workload Account.
- [ ] Verify the generated source IAM role ARN.
- [ ] Verify and configure the target role's trust policy.
- [ ] Verify the permissions attached to the target role.
- [ ] Test cross-account role assumption.
- [ ] Test the intended allowed and denied audit actions.
- [ ] Validate the intended S3 access.

## Result

The Security Account now has a dedicated auditor identity and a narrowly scoped IAM Identity Center permission set.

The source-side configuration is complete, but successful console login does not prove that cross-account role assumption or S3 access works. Those validations will be performed in the next implementation phase.
