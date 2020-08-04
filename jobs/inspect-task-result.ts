import * as aws from "@pulumi/aws";

export const lambda = new aws.lambda.CallbackFunction(
    "jobs-inspect-task-result",
    {
        callback: async (event: any) => {
            const item = event?.taskLookupResult?.Item;
            return {
                TodoistTaskId: item?.TodoistTaskId?.S ?? "",
                EvernoteNoteGuid: item?.EvernoteNoteGuid?.S ?? "",
                TodoistContent: item?.TodoistContent.S ?? "",
                TodoistParentId: item?.TodoistParentId.S ?? "",
            };
        },
    },
);
