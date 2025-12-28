import { ButtonInteraction, ModalSubmitInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder } from 'discord.js';
import { getCurrentKing } from '../../utils/roleUtils';
import { resetStreak, setKing } from '../../gameState';
import config from '../../config.json';

export async function handleOpenCrownModal(interaction: ButtonInteraction) {
    const modal = new ModalBuilder().setCustomId('crown_modal').setTitle('Crown New King');
    const input = new TextInputBuilder().setCustomId('user_id').setLabel("User ID").setStyle(TextInputStyle.Short).setRequired(true);
    modal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
    await interaction.showModal(modal);
}

export async function handleCrownModalSubmit(interaction: ModalSubmitInteraction) {
    const guild = interaction.guild || interaction.client.guilds.cache.first();
    if (!guild) return;

    const userId = interaction.fields.getTextInputValue('user_id');
    try {
        const targetUser = await interaction.client.users.fetch(userId);
        const currentKingMember = await getCurrentKing(guild);
        const oldKingId = currentKingMember?.id;

        await resetStreak();
        await setKing(targetUser.id);

        const role = guild.roles.cache.find(r => r.name === config.roleName);
        if (role) {
            if (oldKingId) {
                const oldMember = await guild.members.fetch(oldKingId).catch(() => null);
                if (oldMember) {
                    await oldMember.roles.remove(role).catch(() => null);
                    // Strip existing [n] streak suffix if it exists
                    const baseName = oldMember.displayName.replace(/\s\[\d+\]$/, '');
                    if (oldMember.nickname !== baseName) {
                        await oldMember.setNickname(baseName).catch(() => null);
                    }
                }
            }
            const newMember = await guild.members.fetch(targetUser.id).catch(() => null);
            if (newMember) await newMember.roles.add(role).catch(() => null);
        }

        await interaction.reply({ content: `👑 New King: ${targetUser}`, ephemeral: true });
    } catch (e) {
        await interaction.reply({ content: '❌ Error setting King. Invalid ID?', ephemeral: true });
    }
}