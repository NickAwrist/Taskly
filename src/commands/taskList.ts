import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags, ButtonInteraction
} from 'discord.js';
import { ObjectId } from 'mongodb';
import type {Task, User} from "../types.ts";
import {
    createTask,
    addTaskToUser,
    getTaskById,
    updateTask,
    removeTaskFromUser,
    completeTask, deleteTask
} from "../database/taskRepository.ts";
import {getUserById} from "../database/userRepository.ts";

export const data = new SlashCommandBuilder()
    .setName('tasks')
    .setDescription('List all your tasks');

export async function execute(interaction: ChatInputCommandInteraction) {

    const user : User = await getUserById(interaction.user.id);
    if(!user) {
        await interaction.reply({
            content: "You don't have any tasks yet. Create one with `/todo`",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const tasks : Awaited<Task | null>[] = await Promise.all(user.tasks.map(async (taskId) => await getTaskById(taskId)));

    let taskList = "";
    tasks.forEach((task) => {
        if(!task) return;
        const priorityCapitalized = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        taskList += `**${task.title}** - ${task.description}\n**${priorityCapitalized}** - ${task.date}\n\n`;
    });

    // Sort tasks by priority value
    tasks.sort((a, b) => {
        if(!a || !b) return 0;
        const priorityValues = { low: 1, medium: 2, high: 3 };
        return priorityValues[a.priority] - priorityValues[b.priority];
    });



    // Create an embed for the task
    const taskListsEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Your Tasks')
        .setDescription(taskList);


    // Send embed with buttons
    await interaction.reply({
        embeds: [taskListsEmbed],
    });

}