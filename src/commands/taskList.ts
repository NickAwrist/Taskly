import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageFlags
} from 'discord.js';
import type {Task, User} from "../types.ts";
import {getTaskById} from "../database/taskRepository.ts";
import {getUserById} from "../database/userRepository.ts";

export const data = new SlashCommandBuilder()
    .setName('tasks')
    .setDescription('List all your tasks');

export async function execute(interaction: ChatInputCommandInteraction) {

    const user : User | null = await getUserById(interaction.user.id);
    if(!user || user.tasks.length === 0) {
        await interaction.reply({
            content: "You don't have any tasks yet. Create one with `/todo`",
            flags: MessageFlags.Ephemeral
        });
        return;
    }

    const tasks : Awaited<Task | null>[] = await Promise.all(user.tasks.map(async (taskId) => await getTaskById(taskId)));

    // Sort tasks by priority value
    const priorityLevels = { "low": 1, "medium": 2, "high": 3 };
    tasks.sort((a, b) => {
        if(!a || !b) return 0;
        return priorityLevels[b.priority] - priorityLevels[a.priority];
    });

    let taskList = "";
    tasks.forEach((task) => {
        if(!task) return;
        const priorityCapitalized = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        let date = task.date || "No due date";
        let taskListTemplate = taskList;
        taskList += `**${task.title}** ${task.description}\n**Priority: ${priorityCapitalized}** \nDue: ${date}\n\n`;
        if(taskList.length > 4000) {
            taskList = taskListTemplate;
            return;
        }
    });
    taskList += `\n----------\nTotal tasks: ${user.tasks.length}`;


    // Create an embed for the task
    const taskListsEmbed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('Your Tasks\n----------')
        .setDescription(taskList);

    // Send embed with buttons
    await interaction.reply({
        embeds: [taskListsEmbed],
        flags: MessageFlags.Ephemeral
    });

}