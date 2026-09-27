# CDK Bootstrap

## Overview

After configuring AWS Organizations, IAM Identity Center, and AWS CLI access, I prepared the Workload Account for AWS CDK deployments.

I used **AWS CDK Bootstrap** to provision the resources required by CDK in the Workload Account and region where the project infrastructure is deployed.

The target environment is:

```text id="4j0f2w"
Account: 494166748570
Region:  eu-west-1
```

## Initial Bootstrap Attempt

I initially attempted to bootstrap the Workload Account using the `CloudEngineer` profile and included the Management Account as a trusted account for deployment.

The command was:

```bash id="s31j9c"
cdk bootstrap aws://494166748570/eu-west-1 \
  --profile CloudEngineer-494166748570 \
  --trust 362403300269 \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

The bootstrap did not complete because a previous `CDKToolkit` CloudFormation stack already existed in the Workload Account and was in a `DELETE_FAILED` state.

## Investigating the Failed CDKToolkit Stack

I inspected the resources belonging to the failed `CDKToolkit` stack.

One of the failed resources was the CDK CloudFormation execution role:

```text id="yl3u2k"
CloudFormationExecutionRole
```

The deletion failed because the `CloudEngineer` identity was not authorized to perform:

```text id="p9n7xh"
iam:DetachRolePolicy
```

This showed that `PowerUserAccess` was not sufficient to perform the IAM cleanup required by the failed bootstrap.

Other CDK bootstrap resources were also affected, including:

* `ImagePublishingRole`
* `FilePublishingRole`
* `LookupRole`

## Administrative Access

Rather than increasing the permissions of my normal `CloudEngineer` identity, I created a separate `WorkloadAdmin` permission set with:

```text id="nqv6s2"
AdministratorAccess
```

I then used the corresponding CLI profile:

```text id="q0y8xv"
WorkloadAdmin-494166748570
```

This allowed me to perform the administrative cleanup required to recover the failed bootstrap.

## Cleaning Up the Failed Bootstrap

I accessed the Workload Account using the `WorkloadAdmin` identity and removed the failed `CDKToolkit` stack.

The failed stack was completely deleted, including its associated resources.

I then verified that the CDK bootstrap SSM parameter no longer existed:

```bash id="a2jz5v"
aws ssm get-parameter \
  --name /cdk-bootstrap/hnb659fds/version \
  --profile CloudEngineer-494166748570 \
  --region eu-west-1
```

The command returned `ParameterNotFound`.

This confirmed that the previous CDK bootstrap state had been removed.

## Bootstrap Design Decision

Before performing the new bootstrap, I reconsidered the use of the `--trust` option.

The project's final architecture is intended to include a Security Account that will eventually access resources in the Workload Account.

However, **cross-account application access and cross-account CDK deployment are different concerns**.

At this stage, I decided to keep CDK deployment within the Workload Account rather than introduce cross-account CDK deployment prematurely.

Therefore, I did not configure the Management Account as a trusted CDK deployment account during the new bootstrap.

The current model is:

```text id="f7e5s1"
Development Environment
        │
        │ CloudEngineer
        ▼
Workload Account
        │
        ▼
      CDK
        │
        ▼
 CloudFormation
```

Cross-account CDK deployment can be introduced later if the project requires it.

## Successful Bootstrap

I performed a clean bootstrap using the administrative profile:

```bash id="7a5z0x"
cdk bootstrap aws://494166748570/eu-west-1 \
  --profile WorkloadAdmin-494166748570 \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

The bootstrap completed successfully:

```text id="f1i5q0"
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Execution policies:
arn:aws:iam::aws:policy/AdministratorAccess

Environment bootstrapped successfully.
```

The absence of trusted deployment accounts is intentional for the current same-account deployment model.

## CDK Bootstrap Resources

The bootstrap created the resources required by CDK, including the CloudFormation execution role and other CDK publishing and lookup resources.

For example:

```text id="5f6e3a"
CloudFormationExecutionRole
    │
    └── cdk-hnb659fds-cfn-exec-role-494166748570-eu-west-1

ContainerAssetsRepository
    │
    └── CDK container asset storage

CdkBootstrapVersion
    │
    └── /cdk-bootstrap/hnb659fds/version
```

I verified the bootstrap CloudFormation stack and its resources after the successful bootstrap.

## Bootstrap Version Verification

I also verified the CDK bootstrap version through AWS Systems Manager Parameter Store:

```bash id="r8b4wy"
aws ssm get-parameter \
  --name /cdk-bootstrap/hnb659fds/version \
  --profile WorkloadAdmin-494166748570 \
  --region eu-west-1
```

The returned bootstrap version was:

```text id="j7s0af"
32
```

This confirmed that the Workload Account was successfully bootstrapped for the current CDK environment.

## Important Permission Separation

The bootstrap process uses two different permission concepts that I kept separate.

### Human identity

The CLI profile used to initiate the bootstrap:

```text id="h10lvs"
WorkloadAdmin-494166748570
        │
        └── AdministratorAccess
```

This determines **who is allowed to perform the bootstrap operation**.

### CDK CloudFormation execution role

The bootstrap also creates a CloudFormation execution role with the configured execution policy:

```text id="o6nq2m"
CDK CloudFormation Execution Role
        │
        └── AdministratorAccess
```

This determines **what CloudFormation is allowed to do when deploying the CDK-generated infrastructure**.

These are separate roles with separate responsibilities.

The `AdministratorAccess` configured for the CDK execution role does **not** grant AdministratorAccess to my `CloudEngineer` identity.

My normal engineering access remains:

```text id="f1j2de"
CloudEngineer
    └── PowerUserAccess
```

while administrative operations use:

```text id="5b6w3p"
WorkloadAdmin
    └── AdministratorAccess
```

## Result

The Workload Account is now successfully bootstrapped for AWS CDK.

```text id="z5x7qd"
[✓] Previous failed CDKToolkit identified
[✓] IAM permission problem identified
[✓] WorkloadAdmin created for administrative operations
[✓] Failed CDKToolkit removed
[✓] Previous bootstrap state verified as removed
[✓] Workload Account bootstrapped
[✓] CDK bootstrap version 32 verified
[✓] No cross-account CDK trust configured
[✓] Same-account CDK deployment model established
```

The Workload Account is now ready for normal CDK operations using the `CloudEngineer` identity.

The next step was to verify this by running `cdk diff` with:

```bash id="n4u2qz"
cdk diff --profile CloudEngineer-494166748570
```

This successfully generated a CloudFormation change comparison for the `WorkloadStack`.
