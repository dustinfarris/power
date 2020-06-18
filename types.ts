export interface Note {
    guid: string;
    url: string;
}

export interface Task {
    id: string;
    content: string;
    url?: string;
}
