import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { getCurrentKing } from '../utils/roleUtils';
import { resetStreak, setKing } from '../gameState';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('setking')
    .setDescription('Manually set the current King (Admin only)')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('The user to crown as King')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const targetUser = interaction.options.getUser('user', true);
    const guild = interaction.guild;
    if (!guild) return;

    const currentKingMember = await getCurrentKing(guild);
    const oldKingId = currentKingMember?.id;

    resetStreak();
    setKing(targetUser.id);

    const role = guild.roles.cache.find(r => r.name === config.roleName);
    if (role) {
        if (oldKingId) {
            const oldMember = await guild.members.fetch(oldKingId).catch(() => null);
            if (oldMember) await oldMember.roles.remove(role).catch(() => null);
        }
        const newMember = await guild.members.fetch(targetUser.id).catch(() => null);
        if (newMember) await newMember.roles.add(role).catch(() => null);
    }

    await interaction.editReply(`👑 All hail the new King, ${targetUser}!`);
};
