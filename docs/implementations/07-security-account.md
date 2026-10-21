# Security Account Setup

## Context

The Security Account is the third account of the AWS Organization, introduced after the Management Account and the Workload Account.

I introduced this account as an architectural evolution because the project requires a real cross-account IAM access model. The Security Account will provide a separate security administration context from the Management Account while allowing identities in the Security Account to access resources in the Workload Account through cross-account IAM.

The current organization is:

```text
AWS Organization
│
├── Management Account
│   └── steve-cloud
│
├── Security Account
│   └── Security
│
└── Workload Account
    └── Workload
```

## Security Account Purpose

The planned cross-account access model is:

```text
Security Account
       │
       │ AssumeRole
       ▼
Workload Account
       │
       ▼
      S3
```

The intended use case is that an identity operating from the Security Account will be able to assume a role in the Workload Account and obtain only the permissions required to read or list the workload S3 bucket.

This cross-account IAM relationship has **not yet been implemented**.

## Management Account Access

Before creating the Security Account, I extended the existing IAM Identity Center setup in the Management Account with a dedicated `OrganizationAdmin` permission set.

The permission set was intentionally kept limited to the AWS Organizations operations required for this project:

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
      ],
      "Resource": "*"
    }
  ]
}
```

I assigned `OrganizationAdmin` to my IAM Identity Center identity in the Management Account.

This allowed me to manage the AWS Organization without using the Management Account root identity for normal organization-management operations.

## Account Creation

I created the Security Account through AWS Organizations using the `OrganizationAdmin` identity.

Account details:

```text
Account Name: Security
Account ID:   631749621147
Status:       ACTIVE
Email:        christnanatatoo+security@gmail.com
```

The account was created directly under the organization root. No Organizational Unit was introduced for this project phase.

## Current Scope

The Security Account currently exists as an organizational and architectural boundary.

The following components are **not yet implemented**:

* Cross-account IAM access
* STS `AssumeRole`
* Security Account IAM roles
* Workload Account trust relationships for Security Account identities
* Cross-account S3 access

These components will be implemented progressively in the next phase.

## Result

The AWS Organization now contains three accounts with clearly separated responsibilities:

```text
Management Account
    │
    └── Organization management

Security Account
    │
    └── Security administration / future cross-account access

Workload Account
    │
    └── Application infrastructure and data
```

The Security Account establishes the account boundary required for the project's future cross-account IAM implementation without prematurely introducing cross-account roles or trust relationships.
