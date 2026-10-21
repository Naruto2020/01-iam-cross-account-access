# Organization Admin Access

## Overview

After configuring IAM Identity Center for the Workload Account, I extended the same access model to the **Management Account**.

The objective was to manage AWS Organizations without using the Management Account root credentials for normal organization administration.

Instead of granting broad administrative access to the Management Account, I created a dedicated **`OrganizationAdmin` permission set** with only the AWS Organizations permissions required by this project.

This extends the existing IAM Identity Center configuration without changing the previously created `CloudEngineer` and `WorkloadAdmin` permission sets.

---

## Management Account Access

The current AWS Organization contains two accounts:

```text
AWS Organization
│
├── Management Account
│   └── Organization administration
│
└── Workload Account
    └── Workload infrastructure
```

IAM Identity Center is hosted in the Management Account and is used to provide centralized human access to both accounts.

The existing Identity Center user is:

```text
steve_k
```

I assigned a new permission set to this user specifically for Management Account organization administration.

---

## OrganizationAdmin Permission Set

I created the `OrganizationAdmin` permission set.

Its purpose is to provide the minimum Organization-level permissions required for the current project.

The permission set uses the following inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "organizations:DescribeOrganization",
        "organizations:ListAccounts",
        "organizations:CreateAccount",
        "organizations:DescribeCreateAccountStatus"
      ],
      "Resource": "*"
    }
  ]
}
```

The permission set does **not** grant general administrative access to the Management Account.

This follows the principle of **least privilege**: the identity receives only the permissions required for the organization-management tasks currently needed by the project.

---

## Account Assignment

I assigned the `OrganizationAdmin` permission set to the existing Identity Center user:

```text
User:
steve_k

Permission Set:
OrganizationAdmin

AWS Account:
Management Account
362403300269
```

The resulting Identity Center access model is now:

```text
IAM Identity Center
│
└── steve_k
    │
    ├── Management Account
    │   └── OrganizationAdmin
    │       └── Organizations permissions
    │
    └── Workload Account
        ├── CloudEngineer
        │   └── PowerUserAccess
        │
        └── WorkloadAdmin
            └── AdministratorAccess
```

The `CloudEngineer` and `WorkloadAdmin` assignments were not modified.

---

## Assignment Verification

After creating the account assignment, I verified its provisioning status through IAM Identity Center.

The account assignment request returned:

```text
Status: IN_PROGRESS
```

After checking the creation status, the request reached:

```text
Status: SUCCEEDED
```

This confirmed that the `OrganizationAdmin` permission set was successfully provisioned for `steve_k` in the Management Account.

---

## AWS CLI Configuration

I then configured a dedicated AWS CLI profile for the Management Account assignment.

The profile is:

```text
OrganizationAdmin-362403300269
```

The profile uses:

```text
SSO session: organization-admin
Account:     362403300269
Role:        OrganizationAdmin
Region:      eu-west-1
```

I authenticated through IAM Identity Center and verified the resulting identity with:

```bash
aws sts get-caller-identity \
  --profile OrganizationAdmin-362403300269
```

The returned identity confirmed that the CLI was using the expected Management Account role:

```text
Account:
362403300269

ARN:
arn:aws:sts::362403300269:assumed-role/AWSReservedSSO_OrganizationAdmin_.../steve_k
```

This confirms that the CLI is no longer relying on the Management Account root identity for normal Organization administration.

---

## Complete CLI Access Model

The project now has three dedicated IAM Identity Center CLI profiles:

| CLI Profile                      |    AWS Account | Permission Set      | Purpose                                           |
| -------------------------------- | -------------: | ------------------- | ------------------------------------------------- |
| `OrganizationAdmin-362403300269` | `362403300269` | `OrganizationAdmin` | AWS Organizations administration                  |
| `CloudEngineer-494166748570`     | `494166748570` | `CloudEngineer`     | Normal cloud engineering                          |
| `WorkloadAdmin-494166748570`     | `494166748570` | `WorkloadAdmin`     | Administrative, bootstrap and recovery operations |

The existing `default` profile represents the Management Account root identity and is therefore not used for normal engineering or organization-management operations.

---

## Access Model

The complete human access model is now:

```text
                         IAM Identity Center
                                │
                             steve_k
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
       OrganizationAdmin   CloudEngineer    WorkloadAdmin
              │                 │                 │
              ▼                 └────────┬────────┘
      Management Account                 │
                                         ▼
                                  Workload Account
```

The permission boundaries are intentionally separated:

```text
Management Account
        │
        └── OrganizationAdmin
              └── AWS Organizations

Workload Account
        │
        ├── CloudEngineer
        │     └── Normal engineering
        │
        └── WorkloadAdmin
              └── Administrative / recovery operations
```

---

## Security Rationale

I deliberately created a dedicated `OrganizationAdmin` permission set instead of using the Management Account root identity or assigning broad administrative privileges.

This provides:

* **Least privilege** for Organization administration.
* **Separation of responsibilities** between Management and Workload accounts.
* **Separation of engineering and administrative access**.
* **Temporary credentials** through IAM Identity Center rather than long-lived IAM access keys.
* An explicit AWS CLI profile for Management Account operations.

The existing `CloudEngineer` permission set remains dedicated to normal workload engineering, while `WorkloadAdmin` remains available for administrative and recovery operations.

---

## Implementation Status

```text
[✓] OrganizationAdmin permission set created
[✓] Organizations inline policy attached
[✓] steve_k assigned to OrganizationAdmin
[✓] Management Account assignment completed
[✓] Assignment status verified as SUCCEEDED
[✓] AWS CLI SSO profile configured
[✓] OrganizationAdmin identity verified with STS
[✓] Management Account root removed from normal workflow
[✓] Existing Workload access unchanged
```

---

## Result

The project now has a clear separation between **Organization administration** and **Workload engineering**.

```text
AWS Organization
│
├── Management Account
│   └── steve_k
│       └── OrganizationAdmin
│
└── Workload Account
    └── steve_k
        ├── CloudEngineer
        └── WorkloadAdmin
```

The Management Account can now be administered through a dedicated least-privilege Identity Center permission set.

The next implementation step is to create the **Security Account**, which will extend the current two-account Organization into the intended multi-account architecture for cross-account IAM access.
