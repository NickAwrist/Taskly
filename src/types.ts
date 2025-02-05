import type {ObjectId} from "mongodb";

export interface User {
    discord_id: string;
    username: string;
    tasks: ObjectId[];
    completed_tasks: ObjectId[];
    tasks_completed: number;
}

export interface Task {
    _id: ObjectId;
    headUserId: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    date?: Date;
    assignee: string[];
    createdAt: Date;
    messageId: string;
    completed: boolean;
    completedAt?: Date;
    shared?: boolean;
}