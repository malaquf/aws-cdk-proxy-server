import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {Stack, StackProps, Tags} from 'aws-cdk-lib';
import { InterfaceVpcEndpointAwsService, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AccountPrincipal, Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';

export class RoleStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        
        const role = new Role(this, 'ProxyUserRole', {
            assumedBy: new AccountPrincipal(this.account),
            roleName: 'proxy-user-role',
            description: 'Role for accessing proxy server',
        });

        new ManagedPolicy(this, 'ProxyServerSessionPolicy', {
            roles: [role],
            managedPolicyName: 'proxy-server-session-policy',
            statements: [
                new PolicyStatement({
                    sid: 'DescribeInstances',
                    effect: Effect.ALLOW,
                    actions: [
                        'ec2:DescribeInstances'
                    ],
                    resources: ['*']
                }),
                new PolicyStatement({
                    sid: 'StartSessionEC2',
                    effect: Effect.ALLOW,
                    actions: [
                        'ssm:StartSession',
                        'ec2-instance-connect:SendSSHPublicKey'
                    ],
                    resources: ['arn:aws:ec2:*:*:instance/*'],
                    conditions: 
                        { 'StringEquals' : { 'aws:ResourceTag/Name': 'proxy-server' }}
                }),
                new PolicyStatement({
                    sid: 'StartSessionSSM',
                    effect: Effect.ALLOW,
                    actions: [
                        'ssm:TerminateSession',
                        'ssm:ResumeSession'
                    ],
                    resources: ['arn:aws:ssm:*:*:session/$${aws:username}-*']
                })
            ],
            description: 'Provides permissions for starting sessions with proxy server'
        });
    }
}
