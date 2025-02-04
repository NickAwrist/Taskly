import { type Interaction, REST, Routes, ApplicationCommandType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import logger from './utils/logger.ts';

interface Command {
    data: { name: string; toJSON: () => any };
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
    cooldown?: number;
}

const commands = new Map<string, Command>();

// Function to load and register commands dynamically
export const registerCommands = async (client_id: string, discord_token: string) => {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const commandModule = await import(filePath);
        const command = commandModule.command || commandModule;

        if (command.data && command.execute) {
            commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
        } else {
            console.warn(`Command file ${file} is missing a required "data" or "execute" export.`);
        }
    }

    const rest = new REST({ version: '10' }).setToken(discord_token);
    try {
        console.log('Registering application (/) commands...');
        await rest.put(Routes.applicationCommands(client_id), { body: Array.from(commands.values()).map(cmd => cmd.data.toJSON()) });
        console.log('Successfully registered application commands.');
    } catch (error) {
        logger.error('Error registering application commands:', error);
    }
};

const cooldowns = new Map<string, Map<string, number>>();

// Function to handle command execution
export async function handleCommands(interaction: Interaction) {
    if (!interaction.isCommand()) return;
    logger.info(`Received command ${interaction.commandName} from ${interaction.user.tag}`);

    const command = commands.get(interaction.commandName);
    if (!command) {
        logger.error(`Command "${interaction.commandName}" not found.`);
        return;
    }

    // Handle cooldowns
    if (command.cooldown) {
        if (!cooldowns.has(interaction.commandName)) {
            cooldowns.set(interaction.commandName, new Map());
        }

        const now: number = Date.now();
        const timestamps: Map<string, number> = cooldowns.get(interaction.commandName)!;
        const cooldownAmount: number = command.cooldown * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime: number = timestamps.get(interaction.user.id)! + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft: number = (expirationTime - now) / 1000;
                await interaction.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${interaction.commandName}\` command.`,
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    }

    try {
        await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            flags: MessageFlags.Ephemeral
        });
    }
}