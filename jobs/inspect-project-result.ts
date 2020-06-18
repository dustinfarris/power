import * as aws from "@pulumi/aws";

export const lambda = new aws.lambda.CallbackFunction(
    "inspect-project-result",
    {
        callback: async (event: any) => {
            return {
                TodoistProjectId:
                    event?.projectLookupResult?.Item?.TodoistProjectId?.S ?? "",
                EvernoteNotebookGuid:
                    event?.projectLookupResult?.Item?.EvernoteNotebookGuid?.S ??
                    "",
            };
        },
    },
);
