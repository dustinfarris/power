import * as aws from "@pulumi/aws";
import * as evernote from "evernote";
import * as pulumi from "@pulumi/pulumi";

import { Task } from "../types";

const config = new pulumi.Config();

const makeNoteContent = (
    content = "",
): string => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">
<en-note>
${content}
</en-note>
`;

export const lambda = new aws.lambda.CallbackFunction("create-note", {
    callback: async ({
        todoistTask,
        notebookGuid,
    }: {
        todoistTask: Task;
        notebookGuid: string;
    }) => {
        const client = new evernote.Client({
            token: process.env.evernoteToken,
            sandbox: false,
        });
        console.log("authenticated with evernote");
        const userStore = client.getUserStore();
        const noteStore = client.getNoteStore();
        const note = new evernote.Types.Note();
        note.title = todoistTask.content;
        note.content = makeNoteContent();
        note.notebookGuid = notebookGuid;
        note.attributes = new evernote.Types.NoteAttributes();
        note.attributes.sourceApplication = "Todoist";
        note.attributes.sourceURL = todoistTask.url;
        console.log("creating note", note.content);
        const response = await noteStore.createNote(note);
        console.log("created note", response);
        return {
            noteGuid: response.guid,
        };
    },
    environment: {
        variables: {
            evernoteToken: config.requireSecret("evernoteToken"),
        },
    },
});
