# IAM Identity Center Setup

## Overview

After establishing the AWS Organization, I configured **AWS IAM Identity Center** to provide controlled access to the Workload Account.

The objective was to avoid using the AWS root user or long-lived IAM user credentials for normal infrastructure work.

I created a dedicated Identity Center user and assigned separate permission sets for **normal engineering activities** and **administrative operations**.

## Identity Center Configuration

The IAM Identity Center instance is hosted in the Management Account and is used to provide access to the Workload Account.

The current structure is:

```text id="q5n6je"
IAM Identity Center
│
└── User: steve_k
    │
    └── Workload Account
        │
        ├── CloudEngineer
        │   └── PowerUserAccess
        │
        └── WorkloadAdmin
            └── AdministratorAccess
```

### Identity Center User

I created the following Identity Center user:

* **Username:** `steve_k`
* **Status:** `ENABLED`

This identity is used to access the Workload Account through IAM Identity Center.

## CloudEngineer Permission Set

I created the `CloudEngineer` permission set for normal cloud engineering activities.

It uses the AWS managed policy:

```text
PowerUserAccess
```

The purpose of this permission set is to allow infrastructure development and management without providing unrestricted IAM administration.

I use this permission set as my **normal engineering identity** when working on the project.

For example, the `CloudEngineer` role is the identity I use when running normal CDK operations such as:

```bash
cdk diff --profile CloudEngineer-494166748570
```

## WorkloadAdmin Permission Set

I also created a separate `WorkloadAdmin` permission set using:

```text
AdministratorAccess
```

I introduced this separate administrative identity after encountering an IAM permission problem during the initial CDK bootstrap cleanup.

The `CloudEngineer` permission set did not have sufficient permissions to perform certain IAM operations required to remove the failed CDK bootstrap resources.

Instead of increasing the permissions of `CloudEngineer`, I created a separate administrative permission set.

This provides a clear separation between:

```text id="8b6y0e"
Normal engineering work
        │
        ▼
CloudEngineer
PowerUserAccess


Administrative operations
        │
        ▼
WorkloadAdmin
AdministratorAccess
```

## Why I Kept the Permission Sets Separate

I deliberately did not assign `AdministratorAccess` to `CloudEngineer`.

The two permission sets have different purposes:

| Permission Set  | Policy                | Purpose                                                         |
| --------------- | --------------------- | --------------------------------------------------------------- |
| `CloudEngineer` | `PowerUserAccess`     | Normal infrastructure development and management                |
| `WorkloadAdmin` | `AdministratorAccess` | Administrative, bootstrap, recovery, and exceptional operations |

This separation reduces the need to use administrative privileges during normal development.

It also provides a practical example of **privilege separation** within the project.

The administrative identity is used only when the required operation cannot be performed with the normal engineering permissions.

## Workload Account Assignment

Both permission sets are assigned to `steve_k` in the Workload Account.

The resulting access model is:

```text id="f47hxx"
Workload Account
│
└── steve_k
    │
    ├── CloudEngineer
    │   └── PowerUserAccess
    │
    └── WorkloadAdmin
        └── AdministratorAccess
```

The permissions are therefore associated with the account access provided through IAM Identity Center rather than with a long-lived IAM user created specifically for the project.

## Implementation Status

```text id="6wqjmb"
[✓] IAM Identity Center enabled
[✓] Identity Center user created
[✓] Workload Account assigned
[✓] CloudEngineer permission set created
[✓] WorkloadAdmin permission set created
[✓] CloudEngineer assigned to Workload Account
[✓] WorkloadAdmin assigned to Workload Account
[✓] Engineering and administrative access separated
```

## Result

I now have two distinct access paths to the Workload Account:

```text id="g4u2zj"
                    Workload Account
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
         CloudEngineer          WorkloadAdmin
         PowerUserAccess       AdministratorAccess
                │                     │
                ▼                     ▼
        Normal engineering      Administrative /
        operations              recovery operations
```

This access model became particularly important during the CDK bootstrap process, where administrative permissions were required to recover from a failed bootstrap deployment.

The next implementation step is to configure **AWS CLI access through IAM Identity Center**, allowing the same permission sets to be used from the development environment.
