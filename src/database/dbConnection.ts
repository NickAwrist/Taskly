import {MongoClient, Db} from 'mongodb';
import logger from "../utils/logger";

let db: Db;
export const connectToDatabase = async (MONGO_URI: string, DATABASE_NAME: string): Promise<Db> => {
    if(!db){
        logger.info('Connecting to MongoDB...');
        const client: MongoClient = new MongoClient(MONGO_URI);
        await client.connect();
        db = client.db(DATABASE_NAME);
        logger.info(`Connected to MongoDB. Database: ${DATABASE_NAME}`);
    }
    return db;
}