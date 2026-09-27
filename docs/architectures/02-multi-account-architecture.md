# 02 — Multi-Account Architecture

The first architecture layer established the IAM baseline inside a single **Workload Account**.

At that stage, the architecture was intentionally simple:

```text
Workload Account

EC2
 │
 ▼
Instance Profile
 │
 ▼
WorkloadRole
 │
 ▼
S3
```

This provided the initial workload-side IAM model and established the principle that permissions should be attached to an IAM role with only the access required by the workload.

As the project evolved toward cross-account access, I introduced **AWS Organizations** and a multi-account structure.

## Architectural Evolution

The architecture evolved from a single-account workload model into a multi-account foundation:

```text
Layer 1
Workload IAM Baseline
        │
        ▼
Layer 2
Multi-Account Architecture
        │
        ▼
Layer 3
Cross-Account IAM
```

The purpose of this evolution is to introduce an account-level security boundary before implementing cross-account IAM.

## Current Multi-Account Architecture

The current AWS Organization contains two accounts:

```text
┌──────────────────────────────────────────────┐
│              AWS Organization                │
│                                              │
│  ┌────────────────────┐                      │
│  │ Management Account │                      │
│  │                    │                      │
│  │ steve-cloud        │                      │
│  │ 362403300269       │                      │
│  └────────────────────┘                      │
│                                              │
│  ┌────────────────────┐                      │
│  │ Workload Account   │                      │
│  │                    │                      │
│  │ Workload           │                      │
│  │ 494166748570       │                      │
│  │                    │                      │
│  │  ┌──────────────┐  │                      │
│  │  │     S3       │  │                      │
│  │  │ CrossAccount │  │                      │
│  │  │    Bucket    │  │                      │
│  │  └──────────────┘  │                      │
│  │                    │                      │
│  │  ┌──────────────┐  │                      │
│  │  │ WorkloadRole │  │                      │
│  │  └──────────────┘  │                      │
│  └────────────────────┘                      │
│                                              │
└──────────────────────────────────────────────┘
```

The **Management Account** is responsible for managing the AWS Organization.

The **Workload Account** contains the infrastructure used by the application/workload.

The Workload Account remains the location of the S3 resource and the workload IAM role established in the first architecture layer.

## Why the Architecture Evolved

The original workload baseline was sufficient to demonstrate IAM relationships within one account.

However, the objective of the project is to implement **cross-account IAM access**.

A cross-account architecture requires distinct AWS accounts so that account boundaries can become part of the security model.

I therefore introduced AWS Organizations as the foundation for the next stage of the architecture.

This creates a separation between:

* organization management,
* workload infrastructure,
* and, eventually, security administration.

The multi-account structure also provides the foundation for introducing explicit cross-account trust rather than simulating the concept entirely within a single account.

## Security Account — Target Architecture

The next architectural evolution is to introduce a dedicated **Security Account**.

The intended organization becomes:

```text
┌──────────────────────────────────────────────┐
│              AWS Organization                │
│                                              │
│  ┌────────────────────┐                      │
│  │ Management Account │                      │
│  └────────────────────┘                      │
│                                              │
│  ┌────────────────────┐                      │
│  │ Security Account   │                      │
│  │                    │                      │
│  │ Security identity  │                      │
│  │ / administration   │                      │
│  └─────────┬──────────┘                      │
│            │                                 │
│            │ AssumeRole                      │
│            ▼                                 │
│  ┌────────────────────┐                      │
│  │ Workload Account   │                      │
│  │                    │                      │
│  │ WorkloadRole       │                      │
│  │        │           │                      │
│  │        ▼           │                      │
│  │       S3           │                      │
│  └────────────────────┘                      │
│                                              │
└──────────────────────────────────────────────┘
```

The Security Account is **not yet implemented**.

It represents the next architectural layer rather than the current deployed state.

## Relationship With the Original Workload Baseline

The introduction of multiple accounts does not replace the workload IAM model established in Layer 1.

The workload-side relationship remains:

```text
EC2
 │
 ▼
Instance Profile
 │
 ▼
WorkloadRole
 │
 ▼
S3
```

The new architecture adds an additional access path from another account:

```text
Security Account
       │
       │ sts:AssumeRole
       ▼
Workload Account
       │
       ▼
WorkloadRole
       │
       ▼
S3
```

This means that the existing workload role becomes part of a larger trust and authorization model.

The next layer will therefore focus on how an identity originating in the Security Account can be explicitly trusted and authorized to assume a role in the Workload Account.

## Cross-Account CDK Is a Separate Concern

The multi-account architecture does not currently imply cross-account CDK deployment.

At this stage, CDK operates within the Workload Account:

```text
CloudEngineer
      │
      ▼
Workload Account
      │
      ▼
AWS CDK
      │
      ▼
CloudFormation
```

I deliberately did not configure cross-account CDK trust during the initial bootstrap.

Cross-account **application access** and cross-account **infrastructure deployment** are separate architectural concerns.

The project currently focuses on establishing the account and IAM foundations first.

## Current State

The current architecture has reached the following point:

```text
┌─────────────────────────────────────────────┐
│              AWS Organization               │
│                                             │
│  Management Account                         │
│          │                                  │
│          │                                  │
│  Workload Account                           │
│      │                                      │
│      ├── IAM Identity Center                │
│      │                                      │
│      ├── WorkloadRole                       │
│      │                                      │
│      └── CrossAccountBucket                 │
│                                             │
└─────────────────────────────────────────────┘
```

Implemented:

* AWS Organization
* Management Account
* Workload Account
* IAM Identity Center
* `CloudEngineer` permission set
* `WorkloadAdmin` permission set
* CDK bootstrap
* Workload IAM baseline
* Workload S3 infrastructure

Not yet implemented:

* Security Account
* Cross-account IAM role
* STS `AssumeRole` access
* Cross-account S3 access
* MFA-related controls
* CloudTrail/security monitoring

## Future Evolution

The architecture will continue to evolve from the current multi-account foundation toward the final cross-account model:

```text
01 — Workload IAM Baseline
             │
             ▼
02 — Multi-Account Architecture
             │
             ▼
03 — Cross-Account IAM
             │
             ▼
04 — STS AssumeRole
             │
             ▼
05 — Least-Privilege Hardening
             │
             ▼
06 — MFA & Additional Security Controls
             │
             ▼
07 — CloudTrail & Security Monitoring
```

The objective is to preserve the workload IAM baseline while progressively introducing account-level separation, explicit cross-account trust, temporary credentials, and additional security controls.
