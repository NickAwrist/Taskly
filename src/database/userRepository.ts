import { Collection } from 'mongodb';
import type {User} from '../types';
import { connectToDatabase} from "./dbConnection";
import { config } from "../bot";

let usersCollection: Collection<User>;

// Initialize the users collection
const initUsersCollection = async () => {
    if(!usersCollection){
        const db = await connectToDatabase(config.MONGO_URI, config.DATABASE_NAME);
        usersCollection = db.collection<User>('users');
    }
};

// Function to get all users
export const getAllUsers = async (): Promise<User[]> => {
    await initUsersCollection();
    return await usersCollection.find({}).toArray();
};

// Function to save a user. This will upsert the user if it already exists
export const saveUser = async (user: User): Promise<void> => {
    await initUsersCollection();
    await usersCollection.updateOne({
            discord_id: user.discord_id},
        {$set: user},
        {upsert: true}
    );
};

// Function to delete a user
export const deleteUser = async (discordId: string): Promise<void> => {
    await initUsersCollection();
    await usersCollection.deleteOne(
        {discord_id: discordId}
    );
};

// Function to get total number of users
export const getTotalUsers = async (): Promise<number> => {
    await initUsersCollection();
    return await usersCollection.countDocuments();
};