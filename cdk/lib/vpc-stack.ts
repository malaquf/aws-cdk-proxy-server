import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import {Stack, StackProps, Tags} from 'aws-cdk-lib';
import { InterfaceVpcEndpointAwsService, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';

export class VpcStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        
        const vpc = new Vpc(this, 'Vpc', {
            maxAzs: 1, // increase it for resilience
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'private',
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS,
                }
            ]
        });

        // allows access to EC2 in private subnet through SSM
        vpc.addInterfaceEndpoint('SSMInterfaceVpcEndpoint', {
            service: new InterfaceVpcEndpointAwsService('ssm'),
            subnets: { subnetType: SubnetType.PUBLIC},
            privateDnsEnabled: true,
            open: true
        });
        vpc.addInterfaceEndpoint('Ec2InterfaceVpcEndpoint', {
            service: new InterfaceVpcEndpointAwsService('ec2'),
            subnets: { subnetType: SubnetType.PUBLIC},
            privateDnsEnabled: true,
            open: true
        });
        vpc.addInterfaceEndpoint('SSMMessagesInterfaceVpcEndpoint', {
            service: new InterfaceVpcEndpointAwsService('ssmmessages'),
            subnets: { subnetType: SubnetType.PUBLIC},
            privateDnsEnabled: true,
            open: true
        });
        vpc.addInterfaceEndpoint('EC2MessagesInterfaceVpcEndpoint', {
            service: new InterfaceVpcEndpointAwsService('ec2messages'),
            subnets: { subnetType: SubnetType.PUBLIC},
            privateDnsEnabled: true,
            open: true
        });

        new StringParameter(this, 'VpcId', {
            parameterName: '/VpcId',
            stringValue: vpc.vpcId
        });

    }
}
