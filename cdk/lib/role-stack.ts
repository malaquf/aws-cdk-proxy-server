import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {Stack, StackProps, Tags} from 'aws-cdk-lib';
import { InterfaceVpcEndpointAwsService, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AccountPrincipal, Effect, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';

export class RoleStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        
        const role = new Role(this, 'ProxyUserRole', {
            assumedBy: new AccountPrincipal(this.account),
            roleName: 'proxy-user-role',
            description: 'Role for accessing proxy server',
        });
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'ec2:DescribeInstances'
            ],
            resources: ['*']
        }));
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'ssm:StartSession',
                'ec2-instance-connect:SendSSHPublicKey'
            ],
            resources: ['arn:aws:ec2:*:*:instance/*'],
            conditions: [
                { 'StringEquals' : { 'aws:ResourceTag/Name': 'proxy-server' }}
            ]
        }));
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'ssm:StartSession'
            ],
            resources: ['arn:aws:ssm:*:*:document/AWS-StartSSHSession']
        }));
        role.addToPolicy(new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                'ssm:TerminateSession',
                'ssm:ResumeSession'
            ],
            resources: ['arn:aws:ssm:*:*:session/$${aws:username}-*']
        }));
    }
}
