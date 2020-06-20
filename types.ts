export interface Note {
    guid: string;
    url: string;
}

export interface Task {
    id: string;
    content: string;
    parent_id?: string;
    url?: string;
}

export interface TodoistItem {
    id: number;
    content: string;
    parent_id?: number;
    section_id?: number;
    labels: number[];
    children: TodoistItem[];
}
