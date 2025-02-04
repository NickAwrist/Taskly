import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { ObjectId } from 'mongodb';
import type { Task } from "../types.ts";
import { createTask, addTaskToUser } from "../database/taskRepository.ts";

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
            .setDescription('Due date of the task (MM/DD/YYYY)')
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
    const priority = interaction.options.getString('priority', true).toLowerCase();
    const dateInput = interaction.options.getString('date');
    const assignee = interaction.options.getUser('assignee');

    if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
        await interaction.reply({
            content: 'Invalid priority level. Please choose from low, medium, or high.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    let date: Date | undefined;
    if (dateInput) {
        const dateParts = dateInput.split('/');
        if (dateParts.length === 3) {
            const month = parseInt(dateParts[0], 10) - 1;
            const day = parseInt(dateParts[1], 10);
            const year = parseInt(dateParts[2], 10);
            date = new Date(year, month, day);
            if (isNaN(date.getTime())) {
                await interaction.reply({
                    content: 'Invalid date format. Please use MM/DD/YYYY.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        } else {
            await interaction.reply({
                content: 'Invalid date format. Please use MM/DD/YYYY.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }
    }

    // Create an embed for the task
    const taskEmbed = new EmbedBuilder()
        .setTitle(`📌 Task: ${title}`)
        .setDescription(description)
        .addFields(
            { name: "Priority", value: priority, inline: true },
            { name: "Due Date", value: date ? date.toDateString() : "No due date", inline: true },
            { name: "Assigned To", value: assignee ? `<@${assignee.id}>` : "Self", inline: false }
        )
        .setColor("#e2c327")
        .setTimestamp();

    const _id = new ObjectId();

    // Create buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`complete_task:${_id}`)
            .setLabel("✅ Complete")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`cancel_task:${_id}`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger)
    );

    // Send embed with buttons
    const message = await interaction.reply({
        embeds: [taskEmbed],
        components: [buttons]
    });

    // Save task with messageId for tracking
    const newTask: Task = {
        _id,
        title,
        description,
        priority,
        date,
        assignee: assignee ? [assignee.id] : [],
        createdAt: new Date(),
        messageId: message.id,
        completed: false,
        shared: !!assignee,
    };

    const taskId = await createTask(newTask);
    await addTaskToUser(interaction.user.id, taskId);
}
