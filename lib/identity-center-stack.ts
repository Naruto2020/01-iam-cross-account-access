import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { aws_sso as sso } from 'aws-cdk-lib';


export class IdentityCenterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const inlinePolicy =  {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'sts:AssumeRole',
          Resource: 'arn:aws:iam::494166748570:role/SecurityAuditRole',
        },
      ],
    };

    const securityAuditAccess1 = new sso.CfnPermissionSet(this, 'SecurityAuditAccess1', {
      instanceArn: 'arn:aws:sso:::instance/ssoins-68044ed9b460693f',
      name: 'SecurityAuditAccess1',
      description: 'Allows Security Admin to assume the SecurityAuditRole in the Workload account',
      inlinePolicy: inlinePolicy,

    });

    const securityAuditAccess1Assignment = new sso.CfnAssignment(this, 'SecurityAuditAccess1Assignment', {
      instanceArn: 'arn:aws:sso:::instance/ssoins-68044ed9b460693f',
      permissionSetArn: securityAuditAccess1.attrPermissionSetArn,
      principalId: '3225d414-80d1-703c-0a34-6ef48e50aeac',
      principalType: 'USER',
      targetId: '631749621147',
      targetType: 'AWS_ACCOUNT',
    });  
  }
}


