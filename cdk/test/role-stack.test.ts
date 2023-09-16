import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';
import { RoleStack } from '../lib/role-stack';


describe('role stack - snapshot test', () => {

    it('stack is still valid', () => {
        const app = new App();

        const stack = new RoleStack(app, 'MyTestStack');

        expect(Template.fromStack(stack)).toMatchSnapshot();
    });
});
