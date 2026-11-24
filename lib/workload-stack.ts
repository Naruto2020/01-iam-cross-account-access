import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { createWorkloadRolePolicies } from './policies/workload-role-policy';
import { createSecurityAuditPolicies } from './policies/security-audit-policy';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class WorkloadStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = new s3.Bucket(this, 'CrossAccountBucket', {
            
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            enforceSSL: true,
            versioned: true,
        });

        const workloadRole = new iam.Role(this, "WorkloadRole", {
            assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
        });

        const workloadPolicies = createWorkloadRolePolicies(bucket);

        workloadRole.addToPolicy(workloadPolicies.s3Policy);
        workloadRole.addToPolicy(workloadPolicies.listBucketPolicy);

        const securityAuditRole = new iam.Role(this, 'SecurityAuditRole' , {
            assumedBy: new iam.ArnPrincipal(
                //'arn:aws:iam::631749621147:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_SecurityAuditAccess_675f4c3c8249bb98',
                'arn:aws:iam::631749621147:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_SecurityAuditAccess1_e3eb392ce853a23b'
            ),
        });


        const securityAuditRolePolicies = createSecurityAuditPolicies(bucket);


        securityAuditRole.addToPolicy(securityAuditRolePolicies.s3SecurityAuditPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.iamListRolesPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.iamInspectRolesPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeInstancesPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeSecurityGroupsPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeNetworkInterfacesPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeVpcsPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeSubnetsPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeRouteTablesPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeNetworkAclsPolicy);
        securityAuditRole.addToPolicy(securityAuditRolePolicies.ec2DescribeInternetGatewaysPolicy);    
    }
}

