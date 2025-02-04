import {SlashCommandBuilder, ChatInputCommandInteraction} from 'discord.js';

import { config } from "../bot.ts";


export const data = new SlashCommandBuilder()
    .setName('todo')
    .setDescription('Create a new task')
    .addStringOption(option =>
        option
            .setName('title')
            .setDescription('Title of the task')
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName('description')
            .setDescription('Description of the task')
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName('priority')
            .setDescription('Priority level of the task')
            .setRequired(true)
            .addChoices(
                { name: 'Low', value: 'low' },
                { name: 'Medium', value: 'medium' },
                { name: 'High', value: 'high' }
            )
    )
    .addStringOption(option =>
        option
            .setName('date')
            .setDescription('Due date of the task (YYYY-MM-DD)')
            .setRequired(false)
    )
    .addUserOption(option =>
        option
            .setName('assignee')
            .setDescription('Add another user to the task')
            .setRequired(false)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const title = interaction.options.getString('title', true);
    const description = interaction.options.getString('description', true);
    const priority = interaction.options.getString('priority', true);
    const date = interaction.options.getString('date');
    const assignee = interaction.options.getUser('assignee');

    // Construct the to-do item message
    let todoMessage = `**Title:** ${title}\n**Description:** ${description}\n**Priority:** ${priority}`;
    if (date) {
        todoMessage += `\n**Due Date:** ${date}`;
    }
    if (assignee) {
        todoMessage += `\n**Assigned to:** ${assignee.tag}`;
    }

    // Respond to the interaction
    await interaction.reply({content: 'To-Do Item Created:', ephemeral: true});
    await interaction.followUp({content: todoMessage, ephemeral: true});
}
