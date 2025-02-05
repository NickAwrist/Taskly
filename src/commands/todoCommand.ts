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
import type { Task } from "../types.ts";
import {
    createTask,
    addTaskToUser,
    getTaskById,
    updateTask,
    removeTaskFromUser,
    completeTask, deleteTask
} from "../database/taskRepository.ts";
import logger from "../utils/logger.ts";

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
            .setName('description')
            .setDescription('Description of the task')
            .setRequired(false)
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
    const priority = interaction.options.getString('priority', true).toLowerCase();
    const description = interaction.options.getString('description') || ' ';
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
            { name: "Shared with", value: assignee ? `<@${assignee.id}>` : "Self", inline: false }
        )
        .setColor("#e2c327")
        .setTimestamp();

    const _id = new ObjectId();

    // Create buttons
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`cancel_task:${_id}`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId(`complete_task:${_id}`)
            .setLabel("✅ Complete")
            .setStyle(ButtonStyle.Success)
    );

    // Send embed with buttons
    await interaction.reply({
        embeds: [taskEmbed],
        components: [buttons]
    });

    const messageId = await interaction.fetchReply().then(msg => msg.id);

    // Save task with messageId for tracking
    const newTask: Task = {
        _id,
        headUserId: interaction.user.id,
        title,
        description,
        priority,
        date,
        assignee: assignee ? [assignee.id] : [],
        createdAt: new Date(),
        messageId: messageId,
        completed: false,
        shared: !!assignee,
    };

    const taskId = await createTask(newTask);
    await addTaskToUser(interaction.user.id, interaction.user.username ,taskId);
    for(const userId of newTask.assignee) {
        if(userId === newTask.headUserId) continue;
        const user = await interaction.client.users.fetch(userId);
        await addTaskToUser(userId, user.username, taskId);
    }
}

export async function onTaskComplete(taskId: ObjectId, interaction: ButtonInteraction) {

    const completedTask: Task | null = await getTaskById(taskId);
    if(!completedTask) return;

    completedTask.completed = true;
    completedTask.completedAt = new Date();
    await updateTask(taskId, completedTask);

    await completeTask(taskId, interaction.user.id);
    for(const user of completedTask.assignee) {
        if(user === completedTask.headUserId) continue;
        await completeTask(taskId, user);
    }

    const messageId = completedTask.messageId;

    // Get the message from the channel
    const channel = interaction.channel;
    if(!channel) return;

    const message = await channel.messages.fetch(messageId);
    if(!message) return;

    // Update the embed to be green and say task completed with a check
    const taskEmbed = new EmbedBuilder()
        .setTitle(`✅ Task Completed: ${completedTask.title}`)
        .setDescription(completedTask.description)
        .addFields(
            { name: "Priority", value: completedTask.priority, inline: true },
            { name: "Due Date", value: completedTask.date ? completedTask.date.toDateString() : "No due date", inline: true },
            { name: "Shared with", value: completedTask.assignee.length > 0 ? `<@${completedTask.assignee.join('>, <@')}>` : "Self", inline: false },
            { name: "Completed At", value: completedTask.completedAt ? completedTask.completedAt.toDateString() : "No date", inline: true },
        )
        .setColor("#3ae2a3")
    await message.edit({embeds: [taskEmbed], components: []});
}

export async function onTaskDeletePart1(taskId: ObjectId, interaction: ButtonInteraction) {

    const task: Task | null = await getTaskById(taskId);
    if (!task) return;

    // Send a confirmation message as an embed
    const confirmEmbed = new EmbedBuilder()
        .setTitle(`❌ Task Cancelled: ${task.title}`)
        .setDescription("Are you sure you want to cancel this task?")
        .setColor("#e23a3a");

    const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`cancel_cancel_task:${taskId}`)
            .setLabel("❌ Cancel")
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`confirm_cancel_task:${taskId}`)
            .setLabel("✅ Confirm")
            .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmButtons]
    });
}

export async function onTaskDeletePart2(taskId: ObjectId, interaction: ButtonInteraction) {

    const task: Task | null = await getTaskById(taskId);
    if (!task) return;

    await removeTaskFromUser(interaction.user.id, taskId);
    for (const user of task.assignee) {
        if (user === task.headUserId) continue;
        await removeTaskFromUser(user, taskId);
    }

    await deleteTask(taskId);

    const messageId = task.messageId;

    // Get the message from the channel
    const channel = interaction.channel;
    if (!channel) return;

    const message = await channel.messages.fetch(messageId);
    if (!message) return;

    await interaction.message.delete();
    // Delete original message
    await message.delete();
}