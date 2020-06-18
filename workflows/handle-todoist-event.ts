import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as db from "../db";
import * as sfn from "../sfn";

import * as inspectProjectResult from "../jobs/inspect-project-result";
import * as createNote from "../jobs/create-note";
import * as updateTask from "../jobs/update-task";

const handleTodoistEventDefinition = ([
    inspectProjectResultArn,
    createNoteArn,
    updateTaskArn,
    tasksTableName,
    projectsTableName,
]: string[]) => ({
    StartAt: "InspectEvent",
    States: {
        InspectEvent: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.event_name",
                    StringEquals: "item:added",
                    Next: "LookupProject",
                },
            ],
            Default: "Skip",
        },
        LookupProject: {
            Type: "Task",
            Resource: "arn:aws:states:::dynamodb:getItem",
            Parameters: {
                TableName: projectsTableName,
                Key: {
                    TodoistProjectId: {
                        "S.$": "$.event_data.project_id",
                    },
                },
            },
            ResultPath: "$.projectLookupResult",
            Next: "InspectProjectResult",
        },
        InspectProjectResult: {
            Type: "Task",
            Resource: inspectProjectResultArn,
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
                    Next: "CreateNote",
                },
            ],
            Default: "Skip",
        },
        CreateNote: {
            Type: "Task",
            Resource: createNoteArn,
            Parameters: {
                todoistTask: {
                    "id.$": "$.event_data.id",
                    "content.$": "$.event_data.content",
                    "url.$": "$.event_data.url",
                },
                "notebookGuid.$": "$.project.EvernoteNotebookGuid",
            },
            ResultPath: "$.evernote",
            Next: "UpdateTask",
        },
        UpdateTask: {
            Type: "Task",
            Resource: updateTaskArn,
            Parameters: {
                task: {
                    "id.$": "$.event_data.id",
                    "content.$": "$.event_data.content",
                },
                note: {
                    "guid.$": "$.evernote.noteGuid",
                },
            },
            ResultPath: "$.updateTaskResult",
            Next: "Save",
        },
        Save: {
            Type: "Task",
            Resource: "arn:aws:states:::dynamodb:putItem",
            Parameters: {
                TableName: tasksTableName,
                Item: {
                    TodoistTaskId: {
                        "S.$": "$.event_data.id",
                    },
                    EvernoteNoteGuid: {
                        "S.$": "$.evernote.noteGuid",
                    },
                },
            },
            End: true,
        },
        Skip: {
            Type: "Succeed",
        },
    },
});

export const stateMachine = new aws.sfn.StateMachine("handle-todoist-event", {
    roleArn: sfn.role.arn,
    definition: pulumi
        .all([
            inspectProjectResult.lambda.arn,
            createNote.lambda.arn,
            updateTask.lambda.arn,
            db.tasksTable.name,
            db.projectsTable.name,
        ])
        .apply(handleTodoistEventDefinition)
        .apply(JSON.stringify),
});
