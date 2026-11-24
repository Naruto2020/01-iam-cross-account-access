
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';



export const createWorkloadRolePolicies = (bucket: s3.IBucket) => ({
    s3Policy: new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${bucket.bucketArn}/logs/*`]
    }),

    listBucketPolicy: new iam.PolicyStatement({
        actions: ["s3:ListBucket"],
        resources: [`${bucket.bucketArn}`]
    }),

});
