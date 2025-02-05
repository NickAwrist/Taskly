import {
    type Interaction,
} from "discord.js";
import {onTaskComplete, onTaskDeletePart1, onTaskDeletePart2} from "../commands/todoCommand.ts";
import {ObjectId} from "mongodb";
import logger from "../utils/logger.ts";


export async function handleButtonInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isButton()) return;

    const id = interaction.customId.split(':')[1];
    if (!id) {
        logger.error(`Button interaction ${interaction.customId} does not have an ID`);
        return;
    }
    const _id = ObjectId.createFromHexString(id);

    if(interaction.customId.startsWith('complete_task:')) {
        await onTaskComplete(_id, interaction);
        return;
    }else if(interaction.customId.startsWith('cancel_task:')) {
        await onTaskDeletePart1(_id, interaction);
        return;
    }else if(interaction.customId.startsWith('confirm_cancel_task:')) {
        await onTaskDeletePart2(_id, interaction);
        return;
    }else if(interaction.customId.startsWith('cancel_cancel_task:')) {
        await interaction.message.delete();
        return;
    }
}