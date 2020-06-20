import * as aws from "@pulumi/aws";

export const eventTargetRole = new aws.iam.Role("event-target", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "events.amazonaws.com",
    }),
});

new aws.iam.RolePolicyAttachment("event-target-sfn-full-access", {
    role: eventTargetRole,
    policyArn: aws.iam.ManagedPolicies.AWSStepFunctionsFullAccess,
});
