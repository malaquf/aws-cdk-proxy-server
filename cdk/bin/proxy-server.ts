#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import {VpcStack} from "../lib/vpc-stack";
import {Ec2Stack} from "../lib/ec2-proxy";

const app = new cdk.App();
const PROPS_WITH_ENV = {
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT
    }
};

const vpcStack = new VpcStack(app, 'VpcStack', PROPS_WITH_ENV);
const ec2Stack = new Ec2Stack(app, 'Ec2Stack', PROPS_WITH_ENV);

ec2Stack.addDependency(vpcStack);