# OrganizationAdmin Least-Privilege Access

## Context

To create the Security Account, I needed to perform AWS Organizations operations from the Management Account.

The existing `CloudEngineer` and `WorkloadAdmin` permission sets could not be used for this purpose because both permission sets are assigned to the Workload Account.

Their scope is therefore:

```text id="4f1qz8"
CloudEngineer
└── Workload Account
    └── PowerUserAccess

WorkloadAdmin
└── Workload Account
    └── AdministratorAccess
```

Neither permission set provides access to the Management Account, so neither can be used to administer the AWS Organization or create a new member account.

## Security Decision

Instead of granting broad administrative access to the Management Account, I created a dedicated IAM Identity Center permission set named `OrganizationAdmin`.

I assigned this permission set to my `steve_k` identity in the Management Account.

The purpose of this permission set is limited to AWS Organizations administration required by this project.

## Least-Privilege Policy

I deliberately did **not** attach `AdministratorAccess` to `OrganizationAdmin`.

Instead, I granted only the Organizations permissions required for the project:

```json id="l5f7s2"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "organizations:DescribeOrganization",
        "organizations:ListAccounts",
        "organizations:CreateAccount",
      ],
      "Resource": "*"
    }
  ]
}
```

These permissions allow me to:

* describe the current organization;
* list the accounts belonging to the organization;
* create a new member account.

The permission set does not grant general administrative access to the Management Account.

## Rationale

I chose this design according to the principle of **least privilege**.

The objective was to perform a specific administrative task—managing the AWS Organization—without giving the identity unrestricted access to the Management Account.

Granting `AdministratorAccess` would have provided many permissions unrelated to the task and would have increased the potential blast radius of a compromised or misused Management Account identity.

The resulting access model is:

```text id="y4i7wo"
steve_k
   │
   ▼
OrganizationAdmin
   │
   ▼
Management Account
   │
   └── AWS Organizations administration
```

This is intentionally separate from the workload administration model:

```text id="5f4v1k"
steve_k
   │
   ├── CloudEngineer
   │      └── Workload Account
   │
   └── WorkloadAdmin
          └── Workload Account
```

## Operational Result

Using `OrganizationAdmin`, I successfully created the Security Account:

```text
Account Name: Security
Account ID:   631749621147
Status:       ACTIVE
```

The permission set therefore provided sufficient access for the required organization-management task without requiring `AdministratorAccess`.

## Scope Boundary

`OrganizationAdmin` is not intended to provide:

* Workload Account administration;
* S3 access;
* cross-account IAM access;
* STS `AssumeRole`;
* IAM role administration in the Workload Account;
* general Management Account administration.

Those responsibilities remain separate and will be implemented independently as the architecture evolves.

## Least-Privilege Observation

During the Security Account creation process, I also needed to check the status of the asynchronous account-creation request.

The `OrganizationAdmin` permission set did not include `organizations:DescribeCreateAccountStatus`, and the operation was therefore denied.

Rather than automatically broadening the permission set, I used the already-authorized `organizations:ListAccounts` operation to verify that the Security Account eventually appeared in the organization with status `ACTIVE`.

This reinforced the original least-privilege decision: permissions should be added when they are actually required by the intended workflow, rather than granting broader access for convenience.
