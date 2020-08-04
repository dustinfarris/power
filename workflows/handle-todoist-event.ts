import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import * as db from "../db";
import * as sfn from "../sfn";

import * as inspectProjectResult from "../jobs/inspect-project-result";
import * as inspectTaskResult from "../jobs/inspect-task-result";
import * as testEquality from "../jobs/test-equality";
import * as makeTaskNote from "../jobs/make-task-note";
import * as createNote from "../jobs/create-note";
import * as updateTask from "../jobs/update-task";
import * as makeNoteTagsFromTask from "../jobs/make-note-tags-from-task";

const handleTodoistEventDefinition = ([
    inspectProjectResultArn,
    inspectTaskResultLambdaArn,
    testEqualityLambdaArn,
    makeTaskNoteLambdaArn,
    makeNoteTagsFromTaskLambdaArn,
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
                    Or: [
                        {
                            Variable: "$.event_name",
                            StringEquals: "item:added",
                        },
                        {
                            Variable: "$.event_name",
                            StringEquals: "item:updated",
                        },
                    ],
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
            // Next: "CompareTaskSectionToCurrent",
            Next: "LookupTask",
        },
        // TODO: reenable this if/when Todoist sends item:updated whenever an item is moved into a section
        // CompareTaskSectionToCurrent: {
        //     Type: "Task",
        //     Resource: testEqualityLambdaArn,
        //     Parameters: {
        //         "left.$": "$.project.TodoistCurrentSectionId",
        //         "right.$": "$.event_data.section_id",
        //     },
        //     ResultPath: "$.taskSectionEqualsProjectCurrent",
        //     Next: "TaskIsCurrent",
        // },
        // TaskIsCurrent: {
        //     Type: "Choice",
        //     Choices: [
        //         {
        //             Variable: "$.taskSectionEqualsProjectCurrent",
        //             BooleanEquals: true,
        //             Next: "LookupTask",
        //         },
        //     ],
        //     Default: "Skip",
        // },
        LookupTask: {
            Type: "Task",
            Resource: "arn:aws:states:::dynamodb:getItem",
            Parameters: {
                TableName: tasksTableName,
                Key: {
                    TodoistTaskId: {
                        "S.$": "$.event_data.id",
                    },
                },
            },
            ResultPath: "$.taskLookupResult",
            Next: "InspectTaskResult",
        },
        InspectTaskResult: {
            Type: "Task",
            Resource: inspectTaskResultLambdaArn,
            Parameters: {
                "taskLookupResult.$": "$.taskLookupResult",
            },
            ResultPath: "$.task",
            Next: "TaskIsNew",
        },
        TaskIsNew: {
            Type: "Choice",
            Choices: [
                {
                    Variable: "$.task.TodoistTaskId",
                    StringEquals: "", // Not found
                    Next: "MakeTaskNote",
                },
            ],
            Default: "Skip",
        },
        MakeTaskNote: {
            Type: "Task",
            Resource: makeTaskNoteLambdaArn,
            Parameters: {
                "item.$": "$.event_data",
            },
            ResultPath: "$.note",
            Next: "MakeNoteTagsFromTask",
        },
        MakeNoteTagsFromTask: {
            Type: "Task",
            Resource: makeNoteTagsFromTaskLambdaArn,
            Parameters: {
                "item.$": "$.event_data",
            },
            ResultPath: "$.tags",
            Next: "CreateNote",
        },
        CreateNote: {
            Type: "Task",
            Resource: createNoteArn,
            Parameters: {
                // TODO: convert from markdown
                "title.$": "$.note.title",
                "content.$": "$.note.content",
                "tags.$": "$.tags",
                // todoist:// scheme doesn't work on mac :(
                // `todoist://task?id=${todoistTask.id}`;
                "sourceUrl.$": "$.event_data.url",
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
                    TodoistParentId: {
                        "S.$": "$.event_data.parent_id",
                    },
                    TodoistContent: {
                        "S.$": "$.event_data.content",
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
            inspectTaskResult.lambda.arn,
            testEquality.lambda.arn,
            makeTaskNote.lambda.arn,
            makeNoteTagsFromTask.lambda.arn,
            createNote.lambda.arn,
            updateTask.lambda.arn,
            db.tasksTable.name,
            db.projectsTable.name,
        ])
        .apply(handleTodoistEventDefinition)
        .apply(JSON.stringify),
});
