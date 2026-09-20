# IAM Cross-Account Access

## Project Overview

This project demonstrates how to design and implement **secure cross-account access in AWS** using Infrastructure as Code.

The target architecture uses an **AWS Organization** containing multiple accounts with separate responsibilities:

* **Management Account** — manages the AWS Organization.
* **Security Account** — provides security-related access and administration.
* **Workload Account** — hosts application resources and data.

The main use case is to allow a trusted principal from the **Security Account** to securely access specific data stored in an **S3 bucket in the Workload Account**, without granting unnecessary access to other resources.

The project starts with a workload-side IAM baseline and progressively evolves toward the final cross-account architecture.

```text
                         AWS Organization
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
       Management Account  Security Account  Workload Account
                                  │                 │
                                  │  AssumeRole     │
                                  └────────────────►│
                                                    │
                                                    ▼
                                                   S3
```

---

## Project Goals

The primary goal is to build AWS infrastructure using **AWS CDK with TypeScript**, which generates **AWS CloudFormation** infrastructure as code.

Through this project, I aim to develop a deeper understanding of:

* How cloud infrastructure is designed and provisioned.
* How AWS IAM trust and permission policies work.
* How AWS services interact through IAM roles.
* How Infrastructure as Code translates application-level definitions into AWS resources.
* How security principles such as least privilege and limited blast radius are applied to real infrastructure.

The project is intentionally implemented progressively, starting with a simple workload IAM model before introducing the complexity of cross-account access.

---

## Cloud Engineering + Cloud Security Engineering

This project is designed to demonstrate both **Cloud Engineering** and **Cloud Security Engineering** skills.

### Cloud Engineering

The project focuses on building and managing reliable AWS infrastructure using Infrastructure as Code, including:

* AWS CDK with TypeScript
* AWS CloudFormation
* AWS Organizations
* S3
* EC2
* IAM
* Infrastructure architecture and deployment

### Cloud Security Engineering

The project focuses on securing that infrastructure through:

* IAM trust policies
* IAM permission policies
* Least-privilege access
* Temporary credentials
* Cross-account role assumption
* MFA
* AWS STS
* Blast-radius reduction
* CloudTrail monitoring and security visibility

---

## Project Scope

The project will progressively cover the following areas:

### Infrastructure as Code

* CDK application initialization
* CDK App, Stack, and Constructs
* CloudFormation synthesis and deployment
* Infrastructure validation and troubleshooting

### Workload Infrastructure

* S3 bucket
* EC2 instance
* IAM Instance Profile
* Workload IAM role
* Secure workload-to-resource access

### IAM Fundamentals

* IAM roles
* Trust policies
* Permission policies
* Identity-based policies
* Resource-based policies
* Least privilege
* Temporary credentials vs. long-lived credentials

### AWS Multi-Account Architecture

* AWS Organizations
* Management Account
* Security Account
* Workload Account
* Separation of responsibilities between accounts

### Cross-Account IAM

* AWS STS
* `AssumeRole`
* Cross-account trust policies
* Source-side permissions
* Temporary credentials
* MFA
* Least-privilege cross-account access
* Blast-radius considerations

### Security Monitoring

* AWS CloudTrail
* Detection of role assumption activity
* Security-relevant events
* Investigation of potentially compromised credentials

---

## Project Evolution

The project is intentionally developed in stages.

```text
Layer 1
Workload IAM Baseline
        │
        ▼
Layer 2
AWS Multi-Account Architecture
        │
        ▼
Layer 3
Cross-Account IAM
        │
        ▼
Layer 4
STS AssumeRole & Temporary Credentials
        │
        ▼
Layer 5
Least-Privilege Hardening
        │
        ▼
Layer 6
MFA & Additional Security Controls
        │
        ▼
Layer 7
CloudTrail & Security Monitoring
        │
        ▼
Final
Secure Cross-Account Architecture
```

The detailed implementation history, architectural decisions, and troubleshooting records are maintained separately in the `docs/` directory.

---

## Documentation

The project documentation is organized chronologically by layer:

```text
docs/
├── implementation/
├── security-decisions/
├── architecture/
└── troubleshooting/
```

Each stage of the project can introduce new documentation without rewriting the previous stages. This provides a traceable record of how the infrastructure and security architecture evolved over time.
