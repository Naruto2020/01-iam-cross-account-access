import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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

        const s3Policy = new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [`${bucket.bucketArn}/logs/*`]
        });

        const listBucketPolicy = new iam.PolicyStatement({
            actions: ["s3:ListBucket"],
            resources: [`${bucket.bucketArn}`]
        });

        workloadRole.addToPolicy(s3Policy);
        workloadRole.addToPolicy(listBucketPolicy);

        const securityAuditRole = new iam.Role(this, 'SecurityAuditRole' , {
            assumedBy: new iam.ArnPrincipal(
                //'arn:aws:iam::631749621147:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_SecurityAuditAccess_675f4c3c8249bb98',
                'arn:aws:iam::631749621147:role/aws-reserved/sso.amazonaws.com/eu-west-1/AWSReservedSSO_SecurityAuditAccess1_e3eb392ce853a23b'
            ),
        });

        const s3SecurityAuditPolicy = new iam.PolicyStatement({
            
            effect: iam.Effect.ALLOW,
            actions: [
                "s3:GetEncryptionConfiguration",
                "s3:GetBucketPublicAccessBlock",
                "s3:GetBucketVersioning",
                "s3:GetBucketPolicy",
                "s3:GetBucketLocation"
            ],
            resources: [`${bucket.bucketArn}`]
        });

        const iamListRolesPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "iam:ListRoles"
            ],
            resources: ["*"]
        });

        const iamInspectRolesPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "iam:GetRole",
                "iam:GetRolePolicy"
            ],
            resources: ["arn:aws:iam::494166748570:role/*"]
        });

        const ec2DescribeInstancesPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeInstances"],
            resources:["*"] 
        });

        const ec2DescribeSecurityGroupsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeSecurityGroups"],
            resources: ["*"]
        });

        const ec2DescribeNetworkInterfacesPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeNetworkInterfaces"],
            resources: ["*"]
        });

        const ec2DescribeVpcsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeVpcs"],
            resources: ["*"]
        });

        const ec2DescribeSubnetsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeSubnets"],
            resources: ["*"]
        });

        const ec2DescribeRouteTablesPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeRouteTables"],
            resources: ["*"]
        });

        const ec2DescribeNetworkAclsPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeNetworkAcls"],
            resources: ["*"]
        });

        const ec2DescribeInternetGatewaysPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["ec2:DescribeInternetGateways"],
            resources: ["*"]
        });

        securityAuditRole.addToPolicy(s3SecurityAuditPolicy);
        securityAuditRole.addToPolicy(iamListRolesPolicy);
        securityAuditRole.addToPolicy(iamInspectRolesPolicy);
        securityAuditRole.addToPolicy(ec2DescribeInstancesPolicy);
        securityAuditRole.addToPolicy(ec2DescribeSecurityGroupsPolicy);
        securityAuditRole.addToPolicy(ec2DescribeNetworkInterfacesPolicy);
        securityAuditRole.addToPolicy(ec2DescribeVpcsPolicy);
        securityAuditRole.addToPolicy(ec2DescribeSubnetsPolicy);
        securityAuditRole.addToPolicy(ec2DescribeRouteTablesPolicy);
        securityAuditRole.addToPolicy(ec2DescribeNetworkAclsPolicy);
        securityAuditRole.addToPolicy(ec2DescribeInternetGatewaysPolicy);    
    }
}

