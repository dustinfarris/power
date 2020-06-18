import * as aws from "@pulumi/aws";
import axios from "axios";
import * as pulumi from "@pulumi/pulumi";

import { Task, Note } from "../types";

const config = new pulumi.Config();

// TODO: paramaterize this
const evernoteUserId = "48611447";

export const lambda = new aws.lambda.CallbackFunction("update-task", {
    callback: async ({ task, note }: { task: Task; note: Note }) => {
        const response = await axios.post(
            `https://api.todoist.com/rest/v1/tasks/${task.id}`,
            {
                content: `[${task.content}](evernote:///view/${evernoteUserId}/s200/${note.guid}/${note.guid}/)`,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.todoistToken}`,
                },
            },
        );
        console.log("todoist response", response);
    },
    environment: {
        variables: {
            todoistToken: config.requireSecret("todoistToken"),
        },
    },
});
