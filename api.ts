import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

import { APIGatewayEvent } from "aws-lambda";
import { APIGateway, StepFunctions } from "aws-sdk";

import * as handleTodoistEvent from "./workflows/handle-todoist-event";

const apiMethodHandlerRole = new aws.iam.Role("api-method-handler-role", {
    assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "lambda.amazonaws.com",
    }),
});

new aws.iam.RolePolicyAttachment("api-role-lambda-policy", {
    role: apiMethodHandlerRole,
    policyArn: aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole,
});

new aws.iam.RolePolicyAttachment("api-role-sfn-policy", {
    role: apiMethodHandlerRole,
    policyArn: aws.iam.ManagedPolicies.AWSStepFunctionsFullAccess,
});

const receiveTodoistEvent = new aws.lambda.CallbackFunction(
    "receive-todoist-event",
    {
        callback: async (event: APIGatewayEvent) => {
            const decoded = Buffer.from(event.body ?? "", "base64");
            const raw = JSON.parse(decoded.toString());
            // coercing numbers to strings for dynamodb's benefit
            const data = {
                ...raw,
                event_data: {
                    ...raw.event_data,
                    id: raw.event_data.id.toString(),
                    project_id: raw.event_data.project_id.toString(),
                },
            };
            console.log("data", data);
            const sfn = new StepFunctions();
            const response = await sfn
                .startExecution({
                    stateMachineArn: handleTodoistEvent.stateMachine.id.get(),
                    input: JSON.stringify(data),
                })
                .promise();
            return {
                statusCode: 200,
                body: "Received.  Thank you.",
            };
        },
        role: apiMethodHandlerRole,
    },
);

export default new awsx.apigateway.API("api", {
    routes: [
        {
            path: "/todoist-event",
            method: "POST",
            eventHandler: receiveTodoistEvent,
        },
    ],
});
