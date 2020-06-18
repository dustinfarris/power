import * as aws from "@pulumi/aws";

export const role = new aws.iam.Role("lambdaRole", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "lambda.amazonaws.com",
    }),
});

const lambdaRolePolicy = new aws.iam.RolePolicy("lambdaRolePolicy", {
    role: role.id,
    policy: {
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                Resource: "arn:aws:logs:*:*:*",
            },
        ],
    },
});
