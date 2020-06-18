import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as sfn from "../sfn";
import * as getCompletedTasks from "../jobs/get-completed-tasks";

/**
 * Parameters:
 *   - todoistProjectId
 *
 *  e.g.:
{
  "todoistProjectId": "2198536455"
}
 */
const definition = ([getCompletedTasksLambdaArn]: string[]) => ({
    StartAt: "GetCompletedTasks",
    States: {
        GetCompletedTasks: {
            Type: "Task",
            Resource: getCompletedTasksLambdaArn,
            Parameters: {
                "todoistProjectId.$": "$.todoistProjectId",
            },
            End: true,
        },
    },
});

export default new aws.sfn.StateMachine("prepare-standup-note", {
    roleArn: sfn.role.arn,
    definition: pulumi
        .all([getCompletedTasks.lambda.arn])
        .apply(definition)
        .apply(JSON.stringify),
});
