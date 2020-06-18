import * as aws from "@pulumi/aws";

export const tasksTable = new aws.dynamodb.Table("tasks", {
    attributes: [
        {
            name: "TodoistTaskId",
            type: "S",
        },
        {
            name: "EvernoteNoteGuid",
            type: "S",
        },
    ],
    hashKey: "TodoistTaskId",
    rangeKey: "EvernoteNoteGuid",
    billingMode: "PAY_PER_REQUEST",
});

export const projectsTable = new aws.dynamodb.Table("projects", {
    attributes: [
        {
            name: "TodoistProjectId",
            type: "S",
        },
    ],
    hashKey: "TodoistProjectId",
    billingMode: "PAY_PER_REQUEST",
});

// Connect projects to notebooks
// TODO: don't hardcode this
new aws.dynamodb.TableItem("projects-cu", {
    tableName: projectsTable.name,
    hashKey: projectsTable.hashKey,
    item: JSON.stringify({
        TodoistProjectId: { S: "2198536455" },
        EvernoteNotebookGuid: { S: "b69ff4d7-2e61-4c7b-a37f-23a4ae4d5784" },
    }),
});
