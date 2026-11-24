# IAM Identity Center Permission Set — CDK Implementation

## 1. Context

During the implementation of the cross-account IAM access architecture, I initially configured an IAM Identity Center permission set manually through the AWS Management Console.

The initial permission set, `SecurityAuditAccess`, was created to provide the Security administrator with the ability to assume the `SecurityAuditRole` in the Workload account.

This approach allowed me to explore IAM Identity Center, understand how permission sets work, and validate the required access configuration.

However, as the project evolved, I decided to manage the permission set through AWS CDK rather than keeping its configuration exclusively in the AWS Console.

## 2. Architecture decision

**Decision: Manage IAM Identity Center permission sets and account assignments through AWS CDK.**

The main reason was to keep the infrastructure configuration centralized, version-controlled, and reproducible.

Keeping the permission set configured manually would introduce a configuration dependency outside the project's Infrastructure as Code.

This would mean that part of the cross-account access architecture could only be understood or reproduced by inspecting the AWS Console.

By implementing the permission set in CDK, its configuration becomes part of the project's source code and can be reviewed alongside the other IAM resources.

### Reasons for choosing CDK

- **Infrastructure as Code:** Permission set configuration is defined in TypeScript rather than existing only in the AWS Console.
- **Version control:** Changes to permissions can be tracked through Git.
- **Reproducibility:** The permission set and its account assignment can be deployed through the CDK application.
- **Consistency:** Identity Center configuration follows the same IaC approach as the Workload account infrastructure.
- **Reviewability:** The inline policy explicitly documents which cross-account action is allowed and which role it targets.

## 3. Implementation

I created a dedicated `IdentityCenterStack` rather than adding Identity Center resources to `WorkloadStack`.

The reason is that these stacks manage resources in different AWS accounts:

| Stack | Deployment account | Responsibility |
|---|---|---|
| IdentityCenterStack | Management | IAM Identity Center permission set and account assignment |
| WorkloadStack | Workload | S3 bucket, IAM roles and workload permissions |

The Identity Center stack is deployed in the Management account, while the permission set assignment targets the Security account.

### 3.1 Permission set

I used the CDK L1 construct `sso.CfnPermissionSet`.

The permission set is named:

`SecurityAuditAccess1`

It contains an inline policy allowing only:

- Action: `sts:AssumeRole`
- Resource: `arn:aws:iam::494166748570:role/SecurityAuditRole`

This follows the principle of least privilege: the Security administrator receives permission to assume the specific audit role rather than unrestricted role-assumption permissions.

### 3.2 Account assignment

I used `sso.CfnAssignment` to assign the permission set to the existing `security_admin` user.

The assignment uses:

- `principalId`: the existing Identity Store user ID.
- `principalType`: `USER`.
- `targetId`: the Security account ID.
- `targetType`: `AWS_ACCOUNT`.
- `permissionSetArn`: the ARN of the permission set created by CDK.

The user itself remains managed through IAM Identity Center. I did not introduce user creation into the CDK stack.

### 3.3 Identity Center-generated IAM role

When the permission set is provisioned in the Security account, IAM Identity Center automatically creates an IAM role.

The generated role follows this naming pattern:

`AWSReservedSSO_SecurityAuditAccess1_<suffix>`

I retrieved the generated role name through the AWS Access Portal session and used its IAM ARN as the trusted principal in the Workload account's `SecurityAuditRole`.

This allows the Identity Center administrator to assume the audit role across accounts.

## 4. Deployment process

The implementation follows this sequence:

1. Deploy `IdentityCenterStack` in the Management account.
2. IAM Identity Center provisions the permission set in the Security account.
3. Retrieve the generated IAM role ARN.
4. Configure the Workload `SecurityAuditRole` trust relationship with that ARN.
5. Review the Workload stack using `cdk diff`.
6. Deploy `WorkloadStack`.

The stacks remain independently deployable.

## 5. Trade-offs and considerations

Moving the permission set to CDK provides better infrastructure management, but it also introduces some considerations.

**Generated role ARN**

The IAM role created by Identity Center contains a generated suffix. Its ARN should not be assumed to remain identical if the permission set is deleted and recreated.

**Existing Identity Center user**

The `security_admin` user is not managed by this stack. The CDK implementation manages the permission set and its assignment, not the user's lifecycle.

**Separation of responsibilities**

Identity Center manages the Security administrator's initial permissions, while the Workload account manages the target role and its audit permissions.

## 6. Current implementation status

- [x] Create `IdentityCenterStack`.
- [x] Define `SecurityAuditAccess1` using CDK.
- [x] Configure its restricted inline AssumeRole policy.
- [x] Assign the permission set to the existing `security_admin` user.
- [x] Deploy `IdentityCenterStack` in the Management account.
- [x] Retrieve the generated IAM role name.
- [x] Configure the Workload `SecurityAuditRole` trust relationship.
- [x] Deploy `WorkloadStack`.
- [x] Verify that the subsequent CDK refactoring produces no infrastructure differences.
- [ ] Test the complete cross-account AssumeRole flow.

## 7. Conclusion

I chose to implement IAM Identity Center permission sets through AWS CDK because they are part of the security architecture and should be managed as code alongside the other infrastructure resources.

This approach makes the cross-account access configuration easier to review, maintain, and reproduce, while preserving the separation between the Management, Security, and Workload accounts.
