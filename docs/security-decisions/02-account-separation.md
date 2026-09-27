# Account Separation

## Context

As the project evolved toward a cross-account IAM architecture, I decided to use separate AWS accounts for different responsibilities rather than managing all resources within a single account.

I introduced AWS Organizations to provide the organizational foundation for this multi-account architecture.

The current and target account structure is:

```text id="3b0j9c"
AWS Organization
│
├── Management Account
│
├── Security Account
│
└── Workload Account
```

The Management and Workload Accounts are currently implemented. The Security Account is part of the target architecture and will be introduced at a later stage.

## Decision

I decided to separate the responsibilities of the accounts as follows:

| Account            | Responsibility                                   |
| ------------------ | ------------------------------------------------ |
| Management Account | AWS Organization management                      |
| Security Account   | Security administration and cross-account access |
| Workload Account   | Application infrastructure and data              |

The Workload Account is therefore kept separate from the account responsible for organizational management.

The Security Account will eventually provide a dedicated location for security-related administration and trusted access to resources in the Workload Account.

## Rationale

I chose account separation to establish stronger security boundaries between different responsibilities.

An account boundary provides isolation that is different from simply separating resources or IAM roles within the same account.

The intended architecture is:

```text id="u9e5lq"
Management Account
       │
       │ Organization management
       │
       ▼

Security Account
       │
       │ sts:AssumeRole
       ▼
Workload Account
       │
       ├── IAM
       ├── S3
       └── Application Infrastructure
```

This allows the project to demonstrate cross-account access as an explicit security boundary rather than implementing the entire scenario inside one AWS account.

## Security Considerations

The separation supports several security principles that I want to demonstrate through the project.

### Separation of Responsibilities

Organizational management, security administration, and workload resources have different responsibilities.

Keeping them in separate accounts makes those responsibilities explicit.

### Blast-Radius Reduction

A compromise or misconfiguration affecting one account does not automatically provide unrestricted access to resources in the other accounts.

Cross-account access can instead be explicitly granted through IAM trust and permission policies.

### Least Privilege

The future Security Account will not receive unrestricted access to the Workload Account simply because the accounts belong to the same Organization.

Access will be explicitly defined using IAM policies and role assumption.

### Cross-Account Trust

The intended access path is:

```text id="0c89x8"
Trusted Principal
      │
      │ sts:AssumeRole
      ▼
Role in Workload Account
      │
      ▼
Specific Workload Resources
```

The trust relationship and permissions will therefore be configured explicitly when the cross-account IAM stage is implemented.

## Current Scope

I intentionally implemented the account structure progressively.

Currently:

```text id="kvq9cb"
AWS Organization
│
├── Management Account
│   └── Organization management
│
└── Workload Account
    └── Project infrastructure
```

The following components are not yet implemented:

```text id="3y7j3r"
[ ] Security Account
[ ] Cross-account IAM role
[ ] STS AssumeRole
[ ] Security Account → Workload Account access
```

These will be introduced in later stages of the project.

## Relationship With CDK Deployment

This account-separation decision does not currently mean that CDK itself is deployed cross-account.

For the initial implementation, I chose to bootstrap and operate CDK from the Workload Account.

The current CDK model is:

```text id="pxn4hj"
CloudEngineer
      │
      ▼
Workload Account
      │
      ▼
CDK / CloudFormation
```

I deliberately kept cross-account CDK deployment separate from the cross-account application access that the project is ultimately intended to demonstrate.

This avoids introducing additional CDK trust relationships before they are required.

## Result

The project now has a multi-account foundation that can progressively evolve toward the intended cross-account IAM architecture.

The decision establishes the following separation:

```text id="5h6y3m"
Management
    │
    │ Organization
    │ management
    ▼
Security
    │
    │ Cross-account
    │ access
    ▼
Workload
    │
    └── Application resources
```

The next architectural stage will introduce the Security Account and implement the IAM trust relationship required for controlled cross-account access.
