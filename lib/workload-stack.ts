import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

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
  }
}

