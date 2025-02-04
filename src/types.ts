import type {ObjectId} from "mongodb";

export interface User {
    discord_id: string;
    tasks: ObjectId[];
    tasks_completed: number;
}

export interface Task {
    _id: ObjectId;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    completed: boolean;
    date?: string;
    assignee?: string[];
    createdAt: Date;
    completedAt?: Date;
    shared?: boolean;
}