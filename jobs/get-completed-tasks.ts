import * as aws from "@pulumi/aws";
import axios from "axios";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const lambda = new aws.lambda.CallbackFunction(
    "jobs-get-completed-tasks",
    {
        callback: async ({
            todoistProjectId,
            reportLastGenerated,
        }: {
            todoistProjectId: string;
            reportLastGenerated: string;
        }) => {
            const since = "2007-4-29T10:13";
            const response = await axios.get(
                `https://api.todoist.com/sync/v8/completed/get_all?project_id=${todoistProjectId}&since=${reportLastGenerated}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.todoistToken}`,
                    },
                },
            );
            return response.data.items;
        },
        environment: {
            variables: {
                todoistToken: config.requireSecret("todoistToken"),
            },
        },
    },
);
