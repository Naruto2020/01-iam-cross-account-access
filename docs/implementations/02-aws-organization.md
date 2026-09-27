# AWS Organization Setup

## Overview

During the development of this project, I decided to introduce **AWS Organizations** to establish a multi-account foundation for the cross-account IAM architecture.

The project initially focused on building the workload-side IAM and infrastructure. As I evolved the architecture toward cross-account access, I decided that managing several AWS accounts independently would not provide the organizational structure needed to properly represent the target architecture.

I therefore introduced an **AWS Organization** to group the project accounts under a common organizational structure while maintaining separate account boundaries.

This provides the foundation for progressively implementing the cross-account architecture.

## Organization Structure

The current organization is:

```text
AWS Organization
│
├── Management Account
│
└── Workload Account
```

### Management Account

* **Account ID:** `362403300269`
* **Account name:** `steve-cloud`
* **Responsibility:** AWS Organization management

The Management Account is responsible for managing the AWS Organization itself. I do not use it to host the workload infrastructure for this project.

### Workload Account

* **Account ID:** `494166748570`
* **Account name:** `Workload`
* **Status:** `ACTIVE`
* **Responsibility:** Hosts the workload infrastructure and data used by the project

I placed the Workload Account directly under the Organization root.

I did not introduce an Organizational Unit (OU) at this stage because the current project scope does not require one.

## Target Multi-Account Architecture

The architecture is progressively evolving toward three distinct accounts:

```text
AWS Organization
│
├── Management Account
│
├── Security Account
│
└── Workload Account
```

The **Security Account has not yet been created**.

It is part of my target architecture because I intend to separate security administration from workload resources when I implement the cross-account IAM layer.

The expected relationship is:

```text
Security Account
       │
       │ sts:AssumeRole
       ▼
Workload Account
       │
       ▼
      S3
```

I will introduce the Security Account when the project reaches the cross-account IAM stage.

## Why I Introduced AWS Organizations

I introduced AWS Organizations to provide a structured foundation for a multi-account architecture rather than managing several AWS accounts independently.

This allows me to establish clear account boundaries for different responsibilities:

| Account    | Responsibility                                   |
| ---------- | ------------------------------------------------ |
| Management | Organization management                          |
| Security   | Security administration and cross-account access |
| Workload   | Application infrastructure and data              |

This separation provides a foundation for implementing:

* Cross-account IAM roles
* AWS STS `AssumeRole`
* Temporary credentials
* Least-privilege access
* Separation of responsibilities
* Reduced blast radius
* Centralized organizational controls

The Organization is therefore an **architectural evolution of the project**, rather than part of the initial implementation.

## Current Implementation Scope

At this stage, only the Management Account and Workload Account are part of the Organization:

```text
AWS Organization
│
├── Management Account
│   └── Organization management
│
└── Workload Account
    └── Project infrastructure
```

I have not yet implemented:

* A Security Account
* Cross-account role assumption
* STS `AssumeRole` between accounts
* Cross-account deployment
* Organizational Units

These components will be introduced progressively as the architecture evolves.

## Implementation Status

```text
[✓] AWS Organization created
[✓] Management Account identified
[✓] Workload Account created
[✓] Workload Account joined to the Organization
[✓] Workload Account verified as ACTIVE
[✓] Multi-account foundation established
[ ] Security Account
[ ] Cross-account IAM
[ ] STS AssumeRole
[ ] Cross-account access to S3
```

## Next Step

With the multi-account foundation established, I moved on to configuring **IAM Identity Center** for controlled access to the Workload Account.

I chose to use separate engineering and administrative permission sets so that normal infrastructure work does not require permanent administrative privileges.
