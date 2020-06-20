import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as db from "../db";
import * as sfn from "../sfn";
import * as getCompletedTasks from "../jobs/get-completed-tasks";
import * as getCurrentTasks from "../jobs/get-current-section-tasks";
import * as makeStandupNote from "../jobs/make-standup-note";
import * as inspectProjectResult from "../jobs/inspect-project-result";
import * as createNote from "../jobs/create-note";

import { eventTargetRole } from "../events";

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
    inspectProjectResultLambdaArn,
    getCompletedTasksLambdaArn,
    getCurrentTasksLambdaArn,
    makeStandupNoteLambdaArn,
    createNoteLambdaArn,
    projectsTableName,
    tasksTableName,
]: string[]) => ({
    StartAt: "LookupProject",
    States: {
        LookupProject: {
            Type: "Task",
            Resource: "arn:aws:states:::dynamodb:getItem",
            Parameters: {
                TableName: projectsTableName,
                Key: {
                    TodoistProjectId: {
                        "S.$": "$.todoistProjectId",
                    },
                },
            },
            ResultPath: "$.projectLookupResult",
            Next: "InspectProjectResult",
        },
        InspectProjectResult: {
            Type: "Task",
            Resource: inspectProjectResultLambdaArn,
            Parameters: {
                "projectLookupResult.$": "$.projectLookupResult",
            },
            ResultPath: "$.project",
            Next: "ProjectIsConnected",
        },
        ProjectIsConnected: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.project.TodoistProjectId",
                    StringGreaterThan: "",
                    Next: "GetCompletedTasks",
                },
            ],
            Default: "Skip",
        },
        GetCompletedTasks: {
            Type: "Task",
            Resource: getCompletedTasksLambdaArn,
            Parameters: {
                "todoistProjectId.$": "$.project.TodoistProjectId",
                "reportLastGenerated.$": "$.project.ReportLastGenerated",
            },
            ResultPath: "$.completed",
            Next: "GetCurrentTasks",
        },
        GetCurrentTasks: {
            Type: "Task",
            Resource: getCurrentTasksLambdaArn,
            Parameters: {
                "todoistProjectId.$": "$.todoistProjectId",
            },
            ResultPath: "$.current",
            Next: "MakeStandupNoteContent",
        },
        MakeStandupNoteContent: {
            Type: "Task",
            Resource: makeStandupNoteLambdaArn,
            Parameters: {
                "last.$": "$.completed",
                "current.$": "$.current",
            },
            ResultPath: "$.note",
            Next: "CreateNote",
        },
        CreateNote: {
            Type: "Task",
            Resource: createNoteLambdaArn,
            Parameters: {
                "title.$": "$.note.title",
                "content.$": "$.note.content",
                "notebookGuid.$": "$.project.EvernoteNotebookGuid",
            },
            ResultPath: "$.evernote",
            Next: "UpdateReportLastGenerated",
        },
        UpdateReportLastGenerated: {
            Type: "Task",
            Resource: "arn:aws:states:::dynamodb:updateItem",
            Parameters: {
                TableName: projectsTableName,
                Key: {
                    TodoistProjectId: {
                        "S.$": "$.todoistProjectId",
                    },
                },
                UpdateExpression: "set ReportLastGenerated = :val1",
                ExpressionAttributeValues: {
                    ":val1": {
                        "S.$": "$$.Execution.StartTime",
                    },
                },
            },
            End: true,
        },
        Skip: {
            Type: "Fail",
        },
    },
});

export const stateMachine = new aws.sfn.StateMachine("prepare-standup-note", {
    roleArn: sfn.role.arn,
    definition: pulumi
        .all([
            inspectProjectResult.lambda.arn,
            getCompletedTasks.lambda.arn,
            getCurrentTasks.lambda.arn,
            makeStandupNote.lambda.arn,
            createNote.lambda.arn,
            db.projectsTable.name,
            db.tasksTable.name,
        ])
        .apply(definition)
        .apply(JSON.stringify),
});

const schedule = new aws.cloudwatch.EventRule(
    "workflows-prepare-standup-note-schedule",
    {
        description: "Every weekday morning",
        scheduleExpression: "cron(30 15 ? * MON-FRI *)",
    },
);

new aws.cloudwatch.EventTarget(
    "workflows-prepare-standup-note-schedule-target",
    {
        rule: schedule.name,
        arn: stateMachine.id,
        roleArn: eventTargetRole.arn,
        input: JSON.stringify({ todoistProjectId: "2198536455" }),
    },
);
