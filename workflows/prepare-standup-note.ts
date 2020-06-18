import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as sfn from "../sfn";
import * as getCompletedTasks from "../jobs/get-completed-tasks";
import * as getSectionTasks from "../jobs/get-section-tasks";

/**
 * Parameters:
 *   - todoistProjectId
 *
 *  e.g.:
{
  "todoistProjectId": "2198536455"
}
 */
const definition = ([
    getCompletedTasksLambdaArn,
    getSectionTasksLambdaArn,
]: string[]) => ({
    StartAt: "GetCompletedTasks",
    States: {
        GetCompletedTasks: {
            Type: "Task",
            Resource: getCompletedTasksLambdaArn,
            Parameters: {
                "todoistProjectId.$": "$.todoistProjectId",
            },
            ResultPath: "$.completed",
            Next: "GetCurrentTasks",
        },
        GetCurrentTasks: {
            Type: "Task",
            Resource: getSectionTasksLambdaArn,
            Parameters: {
                "todoistProjectId.$": "$.todoistProjectId",
            },
            ResultPath: "$.current",
            End: true,
        },
    },
});

export default new aws.sfn.StateMachine("prepare-standup-note", {
    roleArn: sfn.role.arn,
    definition: pulumi
        .all([getCompletedTasks.lambda.arn, getSectionTasks.lambda.arn])
        .apply(definition)
        .apply(JSON.stringify),
});
