import {Fn, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {
    AmazonLinuxImage,
    CfnInstance,
    InstanceClass,
    InstanceSize,
    InstanceType,
    Peer,
    Port,
    SecurityGroup,
    UserData,
    Vpc
} from "aws-cdk-lib/aws-ec2";
import {CfnInstanceProfile, ManagedPolicy, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class Ec2Stack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        /**
         * THIS STACK CURRENTLY CAN'T BE USED AT THE MOMENT
         * BECAUSE CDK IS NOT ATTACHING THE
         * INSTANCE PROFILE TO THE INSTANCE
         */

        const vpc = Vpc.fromLookup(this, 'ImportedVpc', {
            vpcId: StringParameter.valueFromLookup(this, '/VpcId'),
        });

        const ec2SecurityGroup = new SecurityGroup(this, "Ec2SecurityGroup", {
            vpc: vpc,
            description: "Security Group for Ec2 Proxy instance",
            disableInlineRules: true,
            securityGroupName: "Ec2ProxySecurityGroup",
            allowAllOutbound: false,
            allowAllIpv6Outbound: false,
        });
        ec2SecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(3128), 'squid proxy');

        const instanceRole = new Role(this, 'EC2ProxyRole', {
            roleName: 'EC2ProxyRole',
            description: 'EC2 Proxy Role',
            managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')],
            assumedBy: new ServicePrincipal('ec2.amazonaws.com')
        });

        const profile = new CfnInstanceProfile(this, `InstanceProfile`, {
            roles: [ instanceRole.roleName ]
        });

        const ssmaUserData = UserData.forLinux();
        ssmaUserData.addCommands(
            'yum update -y -q',
            'yum install ec2-instance-connect',
            'sudo systemctl enable amazon-ssm-agent',
            'sudo systemctl start amazon-ssm-agent',
            'sudo yum install squid',
            'sudo service squid restart'
        );

        new CfnInstance(this, 'ProxyServerInstance', {
            networkInterfaces: [
                {
                    deviceIndex: "0",
                    subnetId: vpc.privateSubnets[0].subnetId
                }
            ],
            iamInstanceProfile: profile.ref,
            imageId: new AmazonLinuxImage().getImage(this).imageId,
            instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.SMALL).toString(),
            userData: Fn.base64(ssmaUserData.render()),
            tags: [{key: 'Name', value: 'proxy-server'}],
            });
    }

}