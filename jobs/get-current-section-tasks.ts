import * as aws from "@pulumi/aws";
import axios from "axios";
import * as pulumi from "@pulumi/pulumi";

import { TodoistItem } from "../types";

const config = new pulumi.Config();

export const lambda = new aws.lambda.CallbackFunction(
    "jobs-get-current-section-tasks",
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
            const currentSection = response.data.sections.find(
                (section: { name: string }) => section.name === "CURRENT",
            );
            const withChildren = (item: TodoistItem) => ({
                ...item,
                children: response.data.items
                    .filter(
                        ({ parent_id }: { parent_id: number }) =>
                            parent_id == item.id,
                    )
                    .map(withChildren),
            });
            return response.data.items
                .filter(
                    ({ section_id, parent_id }: TodoistItem) =>
                        section_id == currentSection.id && !parent_id,
                )
                .map(withChildren);
        },
        environment: {
            variables: {
                todoistToken: config.requireSecret("todoistToken"),
            },
        },
    },
);
