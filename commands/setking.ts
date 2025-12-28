import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { getState, setKing, resetStreak } from '../gameState';
import config from '../config.json';
import { getCurrentKing } from '../utils/roleUtils';

export const data = new SlashCommandBuilder()
    .setName('setking')
    .setDescription('Manually set the King (Admin only)')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to crown')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    console.log('[SetKing] Starting execution...');
    const targetUser = interaction.options.getUser('user', true);
    const guild = interaction.guild;
    if (!guild) {
        console.warn('[SetKing] No guild found in interaction.');
        return;
    }

    console.log(`[SetKing] Targeting user: ${targetUser.tag}`);

    // Get current king from roles
    console.log('[SetKing] Fetching current King from role data...');
    const currentKingMember = await getCurrentKing(guild);
    const oldKingId = currentKingMember?.id;
    console.log(`[SetKing] Old King ID: ${oldKingId || 'None'}`);

    console.log('[SetKing] Resetting streak and updating state...');
    resetStreak();
    setKing(targetUser.id);

    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (role) {
        console.log(`[SetKing] Found role: ${config.roleName}`);
        if (oldKingId) {
            try {
                console.log(`[SetKing] Removing role from old King: ${oldKingId}`);
                const oldMember = await guild.members.fetch(oldKingId);
                if (oldMember) await oldMember.roles.remove(role);
            } catch (e) {
                console.error(`[SetKing] Failed to remove role from ${oldKingId}:`, e);
            }
        }

        try {
            console.log(`[SetKing] Adding role to new King: ${targetUser.tag}`);
            const newMember = await guild.members.fetch(targetUser.id);
            if (newMember) await newMember.roles.add(role);
        } catch (e) {
            console.error(`[SetKing] Failed to add role to ${targetUser.tag}:`, e);
        }
    } else {
        console.warn(`[SetKing] Role ${config.roleName} not found in guild.`);
    }

    console.log('[SetKing] Replying to user...');
    await interaction.editReply(`👑 All hail the new King, ${targetUser}!`);
    console.log('[SetKing] Execution finished.');
};
