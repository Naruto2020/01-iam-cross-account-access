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

```text id="y5t5ij"
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

```text id="o9h5nm"
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

```bash id="wzq4fl"
cdk diff --profile CloudEngineer-494166748570
```

The successful `cdk diff` confirmed that the normal engineering identity can interact with the bootstrapped CDK environment.

### WorkloadAdmin

The `WorkloadAdmin` permission set is intended for administrative and exceptional operations.

```text id="r1j9bb"
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

```text id="c8m8lo"
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

```text id="b8qkcm"
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

## Relationship With CDK

The distinction is particularly important for the CDK workflow.

I used `WorkloadAdmin` when administrative permissions were required to recover and bootstrap the CDK environment.

After the environment was successfully bootstrapped, I switched back to `CloudEngineer` and successfully ran:

```bash id="4h4x8v"
cdk diff --profile CloudEngineer-494166748570
```

This demonstrated that the normal engineering workflow does not require me to operate permanently with the administrative identity.

## Result

The final access model is:

```text id="1t6w6x"
                         Workload Account
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
          CloudEngineer                  WorkloadAdmin
          PowerUserAccess              AdministratorAccess
                 │                             │
                 ▼                             ▼
        Normal engineering             Administrative /
        operations                      recovery operations
```

I will maintain this separation as the project evolves.

Future cross-account access will be designed independently from these administrative permissions, using explicit IAM trust and permission policies rather than relying on broad administrative access.
