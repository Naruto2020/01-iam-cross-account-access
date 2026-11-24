import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';

export const createSecurityAuditPolicies = (bucket: s3.IBucket) => ({
    s3SecurityAuditPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "s3:GetEncryptionConfiguration",
            "s3:GetBucketPublicAccessBlock",
            "s3:GetBucketVersioning",
            "s3:GetBucketPolicy",
            "s3:GetBucketLocation"
        ],
        resources: [bucket.bucketArn]
    }),

    iamListRolesPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "iam:ListRoles"
        ],
        resources: ["*"]
    }),


    iamInspectRolesPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            "iam:GetRole",
            "iam:GetRolePolicy"
        ],
        resources: ["arn:aws:iam::494166748570:role/*"]
    }),


    ec2DescribeInstancesPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeInstances"],
        resources:["*"] 
    }),

    
    ec2DescribeSecurityGroupsPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeSecurityGroups"],
        resources: ["*"]
    }),


    ec2DescribeNetworkInterfacesPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeNetworkInterfaces"],
        resources: ["*"]
    }),

    
    ec2DescribeVpcsPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeVpcs"],
        resources: ["*"]
    }),

 
    ec2DescribeSubnetsPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeSubnets"],
        resources: ["*"]
    }),

      
    ec2DescribeRouteTablesPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeRouteTables"],
        resources: ["*"]
    }),

    
    ec2DescribeNetworkAclsPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeNetworkAcls"],
        resources: ["*"]
    }),


    ec2DescribeInternetGatewaysPolicy: new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["ec2:DescribeInternetGateways"],
        resources: ["*"]
    }),
});
