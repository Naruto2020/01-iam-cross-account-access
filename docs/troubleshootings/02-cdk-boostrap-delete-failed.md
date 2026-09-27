# 01 — CDK Bootstrap Delete Failed

## Problem

The first attempt to bootstrap AWS CDK in the Workload Account failed because an existing `CDKToolkit` CloudFormation stack was in the `DELETE_FAILED` state.

The bootstrap was executed with the normal engineering identity:

```bash
cdk bootstrap aws://494166748570/eu-west-1 \
  --profile CloudEngineer-494166748570 \
  --trust 362403300269 \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

The command did not complete successfully because the existing CDK bootstrap stack could not be deleted.

## Environment

```text
Account: 494166748570
Account Name: Workload
Region: eu-west-1
Identity: CloudEngineer
Permission Set: PowerUserAccess
```

The existing bootstrap stack was:

```text
CDKToolkit
```

Its state was:

```text
DELETE_FAILED
```

## Investigation

The failed CloudFormation stack contained several CDK bootstrap resources, including:

```text
CloudFormationExecutionRole
ImagePublishingRole
FilePublishingRole
LookupRole
```

The failure was particularly associated with the `CloudFormationExecutionRole`.

Its physical resource was:

```text
cdk-hnb659fds-cfn-exec-role-494166748570-eu-west-1
```

The underlying failure indicated that the current `CloudEngineer` identity was not authorized to perform:

```text
iam:DetachRolePolicy
```

This was an important distinction in the troubleshooting process.

Although the bootstrap command specified:

```text
--cloudformation-execution-policies
arn:aws:iam::aws:policy/AdministratorAccess
```

that policy applies to the **CloudFormation execution role created for CDK**, not to the human identity executing the bootstrap command.

Therefore, the `CloudEngineer` identity remained subject to its own `PowerUserAccess` permissions.

## Root Cause

The immediate cause was insufficient IAM permissions for the identity attempting to clean up the existing failed bootstrap resources.

The relevant operation was:

```text
iam:DetachRolePolicy
```

The `CloudEngineer` permission set did not provide the required IAM administrative permission.

The situation can be represented as:

```text
CloudEngineer
    │
    │ PowerUserAccess
    ▼
CDK Bootstrap
    │
    ▼
Existing CDKToolkit
    │
    ▼
CloudFormationExecutionRole
    │
    └── requires IAM policy detachment
             │
             ▼
       iam:DetachRolePolicy
             │
             X
          Access denied
```

As a result, CloudFormation could not completely delete the existing `CDKToolkit` stack.

## Resolution

Instead of increasing the privileges of the normal `CloudEngineer` identity, I kept it at `PowerUserAccess` and used the separate administrative identity:

```text
WorkloadAdmin
└── AdministratorAccess
```

I used this administrative identity to remove the failed `CDKToolkit` stack.

After the stack was deleted, I verified that the previous CDK bootstrap SSM parameter was no longer present:

```bash
aws ssm get-parameter \
  --name /cdk-bootstrap/hnb659fds/version \
  --profile CloudEngineer-494166748570 \
  --region eu-west-1
```

The result was:

```text
ParameterNotFound
```

This confirmed that the previous bootstrap state had been removed.

## Clean Bootstrap

After the failed bootstrap resources had been removed, I performed a clean bootstrap using the administrative identity:

```bash
cdk bootstrap aws://494166748570/eu-west-1 \
  --profile WorkloadAdmin-494166748570 \
  --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess
```

The bootstrap completed successfully.

The resulting CDK bootstrap environment reported:

```text
Trusted accounts for deployment: none
Trusted accounts for lookup: none
CloudFormation execution policy:
arn:aws:iam::aws:policy/AdministratorAccess
```

The bootstrap version was subsequently verified as:

```text
32
```

## Why I Did Not Elevate CloudEngineer

The failure could have been addressed by giving the normal engineering identity broader administrative permissions.

I deliberately did not do that.

The project already uses two separate permission sets:

```text
CloudEngineer
└── PowerUserAccess

WorkloadAdmin
└── AdministratorAccess
```

The normal engineering identity is used for day-to-day infrastructure work, while the administrative identity is reserved for operations requiring elevated privileges.

This keeps administrative access separate from the normal engineering workflow.

## Important Distinction

This incident also clarified the difference between the identity executing CDK and the role that CloudFormation uses to execute the deployed infrastructure changes.

```text
Human identity
     │
     │ starts CDK bootstrap
     ▼
CloudFormation
     │
     ▼
CDK CloudFormation execution role
     │
     └── uses its configured execution policy
```

The following option:

```text
--cloudformation-execution-policies
```

does **not** grant that policy to the human identity running the CDK command.

It defines the permissions available to the CDK CloudFormation execution role.

Therefore:

```text
CloudEngineer
    └── PowerUserAccess
```

remained unchanged even though the CDK execution role was configured with:

```text
AdministratorAccess
```

## Follow-Up Validation

After the cleanup and successful bootstrap, I switched back to the normal engineering identity and validated the CDK environment:

```bash
cdk diff --profile CloudEngineer-494166748570
```

The command completed successfully.

This demonstrated that the normal engineering identity could perform regular CDK validation after the administrative bootstrap operation had been completed.

The resulting workflow became:

```text
WorkloadAdmin
     │
     └── Bootstrap / administrative recovery
                    │
                    ▼
              CDK environment
                    │
                    ▼
CloudEngineer
     │
     └── Normal CDK validation
              │
              ▼
          cdk diff
```

## Lesson Learned

The failure demonstrated that CDK bootstrap involves multiple layers of permissions:

1. The human identity running the CDK command.
2. The CloudFormation execution role created by CDK.
3. The IAM permissions required to create, modify, or remove bootstrap resources.

It also reinforced the importance of separating normal engineering access from administrative access.

The issue was resolved without broadening the permissions of the normal `CloudEngineer` identity.
