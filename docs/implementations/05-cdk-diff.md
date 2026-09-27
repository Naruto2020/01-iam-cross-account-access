# CDK Diff Validation

## Overview

After successfully bootstrapping the Workload Account, I used AWS CDK's `diff` command to validate the infrastructure defined in the project before deploying it.

The objective was to verify that my normal engineering identity, `CloudEngineer`, could interact with the bootstrapped CDK environment and to review the infrastructure changes that CDK would apply.

## Running CDK Diff

I ran the following command using the `CloudEngineer` CLI profile:

```bash
cdk diff --profile CloudEngineer-494166748570
```

The command completed successfully.

CDK first built and published the CloudFormation template and then created a **read-only CloudFormation change set** to obtain accurate replacement information.

No infrastructure was deployed by this command.

## Result

CDK reported one stack with differences:

```text
Stack WorkloadStack
aws://494166748570/eu-west-1

Number of stacks with differences: 1
```

The diff showed the resources and IAM policy changes that would be introduced by the current CDK application.

## IAM Changes

The diff showed the following IAM-related changes.

### WorkloadRole Trust Policy

The `WorkloadRole` is configured to allow the EC2 service to assume the role:

```text
Effect: Allow
Action: sts:AssumeRole
Principal: Service: ec2.amazonaws.com
```

This establishes the intended workload identity model where an EC2 instance can use the role without requiring long-lived AWS credentials.

### S3 Permissions

The role receives:

```text
s3:ListBucket
```

on the S3 bucket itself.

It also receives:

```text
s3:GetObject
```

but only for objects under:

```text
logs/*
```

This reflects the intended least-privilege model by separating bucket-level and object-level permissions and restricting object access to a specific prefix.

### HTTPS-Only S3 Access

The S3 bucket policy includes a deny statement for:

```text
s3:*
```

when:

```text
aws:SecureTransport = false
```

This ensures that S3 requests using insecure transport are explicitly denied.

## Resources to Be Created

The diff showed four main application resources:

```text
[+] AWS::S3::Bucket
    CrossAccountBucket

[+] AWS::S3::BucketPolicy
    CrossAccountBucket/Policy

[+] AWS::IAM::Role
    WorkloadRole

[+] AWS::IAM::Policy
    WorkloadRole/DefaultPolicy
```

The application therefore currently consists of:

```text
WorkloadStack
│
├── CrossAccountBucket
│   └── Bucket Policy
│
└── WorkloadRole
    └── Default Policy
```

## CDK Bootstrap Parameter

The synthesized stack also contains the CDK bootstrap version parameter:

```text
BootstrapVersion
```

This references:

```text
/cdk-bootstrap/hnb659fds/version
```

in AWS Systems Manager Parameter Store.

This allows CDK to verify that the target environment has the required bootstrap resources.

## Engineering Identity Verification

An important part of this validation was the identity used to run the command.

I deliberately ran `cdk diff` using:

```text
CloudEngineer-494166748570
```

rather than:

```text
WorkloadAdmin-494166748570
```

The command succeeded with the normal engineering identity.

This confirmed that the administrative permission set was not required for this normal CDK operation.

The access model is therefore:

```text
                    Workload Account
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       CloudEngineer              WorkloadAdmin
       PowerUserAccess           AdministratorAccess
              │                         │
              │                         │
       Normal CDK work          Bootstrap / recovery
```

## What `cdk diff` Does Not Do

`cdk diff` does **not** deploy the infrastructure.

It compares the infrastructure currently represented by the CloudFormation stack with the infrastructure defined by the current CDK application.

In this case, the command allowed me to review the proposed infrastructure before performing a deployment.

The successful diff therefore represents a validation step between CDK development and deployment:

```text
CDK Code
   │
   ▼
cdk synth / build
   │
   ▼
cdk diff
   │
   ▼
Review infrastructure changes
   │
   ▼
cdk deploy
```

The deployment step has not yet been performed at this stage.

## Implementation Status

```text
[✓] CDK application built
[✓] CDK template published
[✓] CloudFormation read-only change set created
[✓] CDK diff completed successfully
[✓] WorkloadRole trust relationship verified
[✓] S3 permissions reviewed
[✓] HTTPS-only S3 policy reviewed
[✓] Normal CloudEngineer identity successfully used
[ ] CDK deployment
[ ] EC2 workload deployment
[ ] Cross-account IAM
[ ] STS AssumeRole
```

## Result

The successful `cdk diff` confirmed that the Workload Account is correctly bootstrapped and that I can perform normal CDK validation using my `CloudEngineer` identity.

The current infrastructure changes are ready for review before the first CDK deployment.
