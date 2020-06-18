import * as aws from "@pulumi/aws";

export const role = new aws.iam.Role("sfn-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "states.us-west-2.amazonaws.com",
    }),
});

new aws.iam.RolePolicyAttachment("sfn-role-dynamo-policy", {
    role,
    policyArn: aws.iam.ManagedPolicies.AmazonDynamoDBFullAccess,
});

new aws.iam.RolePolicyAttachment("sfn-role-lambda-policy", {
    role,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaRole,
});
