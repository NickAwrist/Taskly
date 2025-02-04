import { Collection, Db, ObjectId} from "mongodb";
import type {Task, User} from "../types";
import {connectToDatabase} from "./dbConnection";
import {config} from "../bot";

let tasksCollection: Collection<Task>;
let usersCollection: Collection<User>

// Initialize the tasks collection
const initTasksCollection = async () => {
    if (!tasksCollection) {
        const db = await connectToDatabase(config.MONGO_URI, config.DATABASE_NAME);
        tasksCollection = db.collection<Task>("tasks");
        usersCollection = db.collection<User>("users");
    }
};

// Function to create a new task
export const createTask = async (task: Omit<Task, "_id">): Promise<ObjectId> => {
    await initTasksCollection();
    const result = await tasksCollection.insertOne({
        ...task,
        _id: new ObjectId(),
    });
    return result.insertedId;
};

// Function to add a task to a user
export const addTaskToUser = async (userId: string, taskId: ObjectId): Promise<void> => {
    await initTasksCollection();
    await usersCollection.updateOne(
        { discord_id: userId },
        { $addToSet: { tasks: taskId } }
    );
}

// Function to get a task by its ID
export const getTaskById = async (taskId: ObjectId): Promise<Task | null> => {
    await initTasksCollection();
    return await tasksCollection.findOne({ _id: taskId });
};

// Function to update a task
export const updateTask = async (taskId: ObjectId, updates: Partial<Task>): Promise<void> => {
    await initTasksCollection();
    await tasksCollection.updateOne({ _id: taskId }, { $set: updates });
};

// Function to delete a task
export const deleteTask = async (taskId: ObjectId): Promise<void> => {
    await initTasksCollection();
    await tasksCollection.deleteOne({ _id: taskId });
};
