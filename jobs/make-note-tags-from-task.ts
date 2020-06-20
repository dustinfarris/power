import * as aws from "@pulumi/aws";
import * as awsSdk from "aws-sdk";
import removeMarkdown from "remove-markdown";

import * as db from "../db";
import { Task } from "../types";

const makeTag = (content: string) => `CU: ${removeMarkdown(content)}`;

export const lambda = new aws.lambda.CallbackFunction(
    "jobs-make-note-tags-from-task",
    {
        callback: async ({ item }: { item: Task }) => {
            const dynamodb = new awsSdk.DynamoDB();
            let task = {
                id: item.id,
                content: item.content,
                parent_id: item.parent_id,
            };
            // let tags = [makeTag(task.content)];
            while (task.parent_id) {
                let taskResult = await dynamodb
                    .getItem({
                        Key: {
                            TodoistTaskId: { S: task.parent_id },
                        },
                        TableName: db.tasksTable.name.get(),
                    })
                    .promise();
                task = {
                    id: taskResult.Item?.TodoistTaskId?.S ?? "",
                    content: taskResult.Item?.TodoistContent?.S ?? "",
                    parent_id: taskResult.Item?.TodoistParentId.S,
                };
                // if (task.content) {
                //     tags.push(makeTag(task.content));
                // }
            }
            return [makeTag(task.content)];
        },
    },
);
