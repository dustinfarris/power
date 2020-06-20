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
        title,
        content,
        sourceUrl,
        notebookGuid,
    }: {
        title: string;
        content?: string;
        sourceUrl?: string;
        notebookGuid?: string;
    }) => {
        const client = new evernote.Client({
            token: process.env.evernoteToken,
            sandbox: false,
        });
        const userStore = client.getUserStore();
        const noteStore = client.getNoteStore();
        const note = new evernote.Types.Note();
        note.title = title;
        note.content = makeNoteContent(content);
        note.notebookGuid = notebookGuid;
        note.attributes = new evernote.Types.NoteAttributes();
        note.attributes.sourceApplication = "farris.io";
        note.attributes.sourceURL = sourceUrl;
        const response = await noteStore.createNote(note);
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
