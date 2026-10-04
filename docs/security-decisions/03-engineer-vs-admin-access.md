# Engineer vs. Administrative Access

## Context

During the setup of the Workload Account, I needed an identity that could perform normal cloud engineering activities such as developing and validating AWS CDK infrastructure.

I initially used a `CloudEngineer` permission set with the AWS managed policy:

```text
PowerUserAccess
```

During the initial CDK bootstrap process, I encountered a failed `CDKToolkit` CloudFormation stack that required administrative IAM operations to clean up.

The `CloudEngineer` identity did not have sufficient permissions to perform those operations.

## Problem

The failed CDK bootstrap contained IAM resources that needed to be deleted.

One of the failed operations was:

```text
iam:DetachRolePolicy
```

The `CloudEngineer` identity was denied this operation because `PowerUserAccess` does not provide unrestricted IAM administration.

At this point, I had two possible approaches:

1. Increase the permissions of `CloudEngineer` to `AdministratorAccess`.
2. Keep `CloudEngineer` as the normal engineering identity and create a separate administrative identity.

## Decision

I decided to **keep `CloudEngineer` with `PowerUserAccess`** and create a separate `WorkloadAdmin` permission set with:

```text
AdministratorAccess
```

The resulting access model is:

```text
steve_k

   │

   └── Workload Account

        │

        ├── CloudEngineer
        │      └── PowerUserAccess
        │
        └── WorkloadAdmin
               └── AdministratorAccess
```

## Rationale

I chose this separation instead of simply upgrading `CloudEngineer` to `AdministratorAccess`.

The main reason is **privilege separation**.

Normal engineering activities do not inherently require unrestricted administrative access to every AWS resource, including IAM.

By keeping the engineering identity separate from the administrative identity, I can use the lower-privilege identity for routine work and explicitly switch to the administrative identity when an operation genuinely requires administrative permissions.

## Roles of Each Permission Set

### CloudEngineer

The `CloudEngineer` permission set is intended for normal cloud engineering activities.

```text
CloudEngineer

└── PowerUserAccess
```

I use this identity for operations such as:

* Developing CDK infrastructure
* Synthesizing CDK applications
* Reviewing infrastructure changes
* Running `cdk diff`
* Managing supported workload resources

For example:

```bash
cdk diff --profile CloudEngineer-494166748570
```

The successful `cdk diff` confirmed that the normal engineering identity can interact with the bootstrapped CDK environment.

### WorkloadAdmin

The `WorkloadAdmin` permission set is intended for administrative and exceptional operations.

```text
WorkloadAdmin

└── AdministratorAccess
```

I use this identity for operations such as:

* Recovering from infrastructure failures requiring IAM administration
* Cleaning up failed CDK bootstrap resources
* Performing administrative configuration
* Bootstrapping the Workload Account when administrative permissions are required

It is not intended to replace `CloudEngineer` for routine development.

## Practical Example

The failed CDK bootstrap provided a concrete example of why the separation was useful.

The sequence was:

```text
Initial CDK bootstrap

        │

        ▼

CDKToolkit → DELETE_FAILED

        │

        ▼

CloudEngineer

PowerUserAccess

        │

        └── iam:DetachRolePolicy → AccessDenied

        │

        ▼

Create separate WorkloadAdmin identity

        │

        ▼

Use WorkloadAdmin for administrative cleanup

        │

        ▼

Remove failed CDKToolkit

        │

        ▼

Successfully bootstrap CDK

        │

        ▼

Return to CloudEngineer

        │

        ▼

cdk diff
```

This demonstrated the practical difference between the two access levels.

## Security Consideration

I consider the two identities to represent different operational contexts rather than two equivalent ways of accessing the account.

```text
Normal operation

      │

      ▼

CloudEngineer

      │

      └── PowerUserAccess


Administrative operation

      │

      ▼

WorkloadAdmin

      │

      └── AdministratorAccess
```

The administrative permission set is therefore used deliberately rather than automatically for all operations.

This limits the use of unrestricted privileges during normal engineering activities.

## CDK CloudFormation Execution Role

The CDK deployment process introduces another security boundary that is separate from the human identities described above.

When I bootstrapped the Workload Account, CDK created a CloudFormation execution role used by CloudFormation to deploy the infrastructure defined by CDK.

For this portfolio project, I kept the execution policy as:

```text
AdministratorAccess
```

This permission applies to the **CDK CloudFormation execution role**, not to the `CloudEngineer` human identity.

The access model is therefore:

```text
CloudEngineer
└── PowerUserAccess
        │
        ▼
       CDK
        │
        ▼
CloudFormation
        │
        ▼
CDK CloudFormation Execution Role
└── AdministratorAccess
```

The execution role is specific to the bootstrapped AWS account and Region. Granting `AdministratorAccess` to this role does not give CloudFormation unrestricted access across the entire AWS Organization.

For the scope of this portfolio project, I chose to keep this configuration rather than attempt to define a complete custom deployment policy containing only the individual AWS API actions required by the current CDK stack.

This keeps the deployment model reliable and allows the project to focus on the IAM architecture, account separation, cross-account access, trust relationships, and least-privilege workload permissions.

This is a deliberate **portfolio-scope decision**, not a claim that `AdministratorAccess` is the preferred deployment configuration for production environments.

In a production environment, I would evaluate a more restrictive CloudFormation execution policy based on the organization's deployment model and security requirements, potentially combined with additional controls such as permissions boundaries and organizational guardrails.

The important distinction is that I have deliberately limited the **human engineering identity** while accepting broader permissions for the **infrastructure deployment execution role** at this stage of the project.

## Relationship With CDK

The distinction is particularly important for the CDK workflow.

I used `WorkloadAdmin` when administrative permissions were required to recover and bootstrap the CDK environment.

After the environment was successfully bootstrapped, I switched back to `CloudEngineer` and successfully ran:

```bash
cdk diff --profile CloudEngineer-494166748570
```

This demonstrated that the normal engineering workflow does not require me to operate permanently with the administrative identity.

The CDK CloudFormation execution role is a separate identity used by CloudFormation during infrastructure deployment.

Therefore, the following three security contexts are distinct:

```text
Human engineering identity
        │
        └── CloudEngineer
                └── PowerUserAccess


Human administrative identity
        │
        └── WorkloadAdmin
                └── AdministratorAccess


Infrastructure deployment identity
        │
        └── CloudFormation execution role
                └── AdministratorAccess
```

## Result

The final access model is:

```text
                         Workload Account
                                │
               ┌────────────────┼────────────────┐
               │                │                │
               ▼                ▼                ▼
        CloudEngineer     WorkloadAdmin    CloudFormation
        PowerUserAccess   AdministratorAccess   Execution Role
               │                │                │
               ▼                ▼                ▼
        Normal engineering   Administrative   Infrastructure
        operations           / recovery       deployment
```

I will maintain the separation between these operational contexts as the project evolves.

The use of `AdministratorAccess` by the CloudFormation execution role is intentionally limited to the current portfolio implementation. It does not change the principle of keeping routine human engineering access separate from administrative access.

Future cross-account access will be designed independently from these administrative permissions, using explicit IAM trust and permission policies rather than relying on broad administrative access.
