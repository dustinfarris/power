import * as aws from "@pulumi/aws";

export const lambda = new aws.lambda.CallbackFunction(
    "inspect-project-result",
    {
        callback: async (event: any) => {
            const item = event?.projectLookupResult?.Item;
            return {
                TodoistProjectId: item?.TodoistProjectId?.S ?? "",
                EvernoteNotebookGuid: item?.EvernoteNotebookGuid?.S ?? "",
                ReportLastGenerated: item?.ReportLastGenerated?.S ?? "",
            };
        },
    },
);
