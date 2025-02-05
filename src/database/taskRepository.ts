import { Collection, Db, ObjectId} from "mongodb";
import type {Task, User} from "../types";
import {connectToDatabase} from "./dbConnection";
import {config} from "../bot";
import logger from "../utils/logger.ts";
import {addCompletedTask} from "./userRepository.ts";

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
export const createTask = async (task: Task): Promise<ObjectId> => {
    await initTasksCollection();
    const result = await tasksCollection.insertOne({
        ...task,
        _id: task._id,
    });
    return result.insertedId;
};

// Function to add a task to a user
export const addTaskToUser = async (userId: string, username: string, taskId: ObjectId): Promise<void> => {
    await initTasksCollection();

    // If the user does not exist, make a new one
    const user = await usersCollection.findOne({ discord_id: userId });
    if (!user) {
        await usersCollection.insertOne({
            discord_id: userId,
            username: username,
            tasks: [],
            completed_tasks: [],
            tasks_completed: 0,
        });
    }

    await usersCollection.updateOne(
        { discord_id: userId },
        { $addToSet: { tasks: taskId } }
    );
}

export const completeTask = async (taskId: ObjectId, userId: string): Promise<void> => {
    await initTasksCollection();
    await tasksCollection.updateOne(
        { _id: taskId },
        { $set: { completed: true, completedAt: new Date() } }
    );
    await removeTaskFromUser(userId, taskId);
    await addCompletedTask(userId, taskId);
}

export const removeTaskFromUser = async (userId: string, taskId: ObjectId): Promise<void> => {
    await initTasksCollection();
    await usersCollection.updateOne(
        { discord_id: userId },
        { $pull: { tasks: taskId } }
    );
}

// Function to get a task by its ID
export const getTaskById = async (taskId: ObjectId): Promise<Task | null> => {
    await initTasksCollection();

    logger.info(`Getting task with id ${taskId}`);
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
