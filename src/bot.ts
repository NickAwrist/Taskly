import {Client, GatewayIntentBits, type Interaction} from "discord.js";
import dotenv from "dotenv";
import {connectToDatabase} from "./database/dbConnection.ts";
import logger from "./utils/logger.ts";
import {handleCommands, registerCommands} from "./commandHandler.ts";

// Load environment variables from .env file
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({path:envFile});

export const config = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
    APPLICATION_ID: process.env.APPLICATION_ID || "",
    MONGO_URI: process.env.MONGO_URI || "",
    DATABASE_NAME: process.env.DATABASE_NAME || "",
}

// Ensure the token is present
if (!config.DISCORD_TOKEN || !config.APPLICATION_ID || !config.MONGO_URI || !config.DATABASE_NAME) {
    logger.error("Missing environment variables");
    process.exit(1);
}

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// When the bot is ready
client.once("ready", async () => {
    //await connectToDatabase(config.MONGO_URI, config.DATABASE_NAME);

    logger.info("Registering commands...");
    await registerCommands(config.APPLICATION_ID, config.DISCORD_TOKEN);
    logger.info("Commands registered");


    handleInteractions(client);

    logger.info(`Logged in! as  + ${client.user?.tag}`);
});

// Login to Discord
client.login(config.DISCORD_TOKEN).catch((err) => {
    logger.error("Failed to login:", err);
    process.exit(1);
});

// Interaction Handling
export const handleInteractions = (client: Client): void => {
    client.on('interactionCreate', async (interaction: Interaction) => {
        if(interaction.isCommand()){
            await handleCommands(interaction);
        }
    });
}