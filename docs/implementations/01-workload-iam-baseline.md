
===================================================================

# 01 — IAM Cross-Account Access — Layer 1

===================================================================

## Project Initialization and Workload IAM Baseline

As a TypeScript developer, I decided to build this Infrastructure
as Code (IAC) project using **AWS CDK with TypeScript**.
This allows me to define and manage AWS infrastructure using
a programming language I already use professionally, while also
learning how CDK translate infrastructure definitions into 
AWS CloudFormation resources.

The overall project is designed to implement
**IAM cross-account access between a secutity Account and Workload Account**

Rather than starting immediately with cross-account access,
I decided to first establish the IAM baseline inside the
**Workload Account**. The Workload Account is where the
AWS resources that will eventually be accessed cross-account are
deployed. Starting from the workload side provides a concrete
IAM model that can later be extended to support secure access from
the Security Account.



The initial progression is therefore:

```text
Workload Account
      │
      ├── S3 Bucket
      │
      └── WorkloadRole
              │
              └── S3 permissions

                  ↓

        Introduce Security Account

                  ↓

        Cross-account IAM access
```


### Why create `WorkloadRole` first?

I created `WorkloadRole` as the initial IAM identity for workloads 
running in the Workload Account.

The role is trusted by the EC2 service and is given only the S3 
permissions required by the workload. In the initial design, the 
role can:

* read objects under the `logs/` prefix;
* list objects in the specific workload S3 bucket.

This establishes the **same-account IAM model** before introducing 
cross-account access.


Later in the project, this IAM model will evolve so that a principal 
in the **Security Account** can securely assume an appropriate role 
in the **Workload Account** using AWS STS.


This staged approach allows the project to demonstrate the evolution 
from:


```text
Same-account IAM
        ↓
Role trust + permissions
        ↓
Cross-account AssumeRole
        ↓
Temporary credentials
        ↓
Least-privilege cross-account access
```

The goal is therefore not simply to create a cross-account role, 
but to understand how a secure workload IAM model can evolve into 
a controlled **cross-account access architecture**.



=================================================================

## 02 — Create the S3 Workload Resource

=================================================================

After initializing the CDK project and defining the initial 
`WorkloadRole`, I created an S3 bucket in the Workload Account 
as the first workload resource.


S3 was selected as the initial workload resource because it provides 
a concrete resource on which IAM permissions can be defined and 
tested. It will also give us a clear target for the cross-account 
access that will be introduced later.

==================================================================

### S3 Security Configuration

==================================================================


The bucket was configured with the following security controls:

* **Block Public Access** enabled to prevent public access through 
  ACLs or bucket policies.

* **SSE-S3 encryption** enabled for server-side encryption.

* **Versioning** enabled to maintain previous versions of objects.

* **HTTPS-only access** enabled through `enforceSSL: true`.

* **No lifecycle expiration rule** was added at this stage because 
  the workload does not currently require automatic object expiration.

* No fixed physical bucket name was specified. CDK generates the bucket 
  name automatically, avoiding unnecessary global naming constraints 
  for this portfolio project.

The resulting baseline is:

```text
S3 Bucket
├── Block Public Access
├── SSE-S3 encryption
├── Versioning
├── HTTPS-only access
└── No lifecycle expiration
```

### WorkloadRole → S3 Permissions

The `WorkloadRole` was then given permissions to access this specific S3 bucket.

The permissions were deliberately scoped according to the workload's requirements:

```text
s3:GetObject
    → only objects under logs/*

s3:ListBucket
    → the specific workload bucket
```

This means that `WorkloadRole` can read objects from the `logs/` prefix but cannot 
use `s3:GetObject` to read objects from other prefixes in the bucket.

The `s3:ListBucket` permission applies to the specific bucket rather than to all 
S3 buckets in the AWS account.

At this stage, the permissions are implemented as an **identity-based policy attached to `WorkloadRole`**. 
A separate S3 bucket policy was not added for cross-account access yet because 
cross-account IAM will be introduced in a later layer.

### CDK Synthesis Verification

After implementing the S3 bucket and IAM permissions, I ran `cdk synth` and 
inspected the generated CloudFormation template.

The synthesized template confirmed that:

* the S3 bucket was created with the intended security configuration;
* the bucket policy denies requests made without secure transport;
* `WorkloadRole` trusts the EC2 service;
* `s3:GetObject` is restricted to `logs/*`;
* `s3:ListBucket` targets the specific bucket.

This verification step confirms that the CDK definitions are producing 
the intended AWS infrastructure before deployment.
