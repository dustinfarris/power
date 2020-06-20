import * as aws from "@pulumi/aws";
import removeMarkdown from "remove-markdown";

import { TodoistItem } from "../types";

export const lambda = new aws.lambda.CallbackFunction("jobs-make-task-note", {
    callback: async ({ item }: { item: TodoistItem }) => {
        return {
            content: "",
            title: removeMarkdown(item.content),
        };
    },
});
