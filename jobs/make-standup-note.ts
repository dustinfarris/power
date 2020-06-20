import * as aws from "@pulumi/aws";
import { Marked } from "@ts-stack/markdown";

import { TodoistItem } from "../types";

// TODO: don't hardcode this
const waitingLabelId = 2149820020;

const makeListItem = (item: TodoistItem) => {
    let content = `<li>${item.content}`;
    if ((item.children ?? []).length > 0) {
        content += "<ul>";
        item.children.forEach((item) => (content += makeListItem(item)));
        content += "</ul>";
    }
    return `${Marked.parse(content)}</li>`;
};

export const lambda = new aws.lambda.CallbackFunction(
    "jobs-make-standup-note",
    {
        callback: async ({
            last,
            current,
        }: {
            last: TodoistItem[];
            current: TodoistItem[];
        }) => {
            Marked.setOptions({ isNoP: true });
            let content = "<h2>Last</h2><ul>";
            last.forEach((item) => (content += makeListItem(item)));
            content += "</ul><h2>Current</h2><ul>";
            current.forEach((item) => (content += makeListItem(item)));
            content += "</ul>";
            const dt = new Date();
            const month = dt.getMonth() + 1;
            const day = dt.getDate();
            const year = dt.getFullYear();
            return {
                content,
                title: `Standup, ${month}/${day}/${year}`,
            };
        },
    },
);
