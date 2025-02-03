import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

// Load environment variables from .env file
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({path:envFile});

// Ensure the token is present
if (!process.env.DISCORD_TOKEN) {
    console.error("Missing DISCORD_TOKEN in .env file");
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
client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

// Basic message handler
client.on("messageCreate", (message) => {
    if (message.author.bot) return; // Ignore bot messages

    if (message.content.toLowerCase() === "!ping") {
        message.reply("Pong!");
    }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error("Failed to login:", err);
    process.exit(1);
});
