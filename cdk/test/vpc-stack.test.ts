import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';


describe('vpc stack - snapshot test', () => {

    it('stack is still valid', () => {
        const app = new App();

        const stack = new VpcStack(app, 'MyTestStack');

        expect(Template.fromStack(stack)).toMatchSnapshot();
    });
});
