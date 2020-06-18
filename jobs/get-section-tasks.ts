import * as aws from "@pulumi/aws";
import axios from "axios";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const lambda = new aws.lambda.CallbackFunction(
    "jobs-get-section-tasks",
    {
        callback: async ({
            todoistProjectId,
        }: {
            todoistProjectId: string;
        }) => {
            const response = await axios.get(
                `https://api.todoist.com/sync/v8/projects/get_data?project_id=${todoistProjectId}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.todoistToken}`,
                    },
                },
            );
            console.log("section tasks", response.data);
            return response.data.items;
        },
        environment: {
            variables: {
                todoistToken: config.requireSecret("todoistToken"),
            },
        },
    },
);
