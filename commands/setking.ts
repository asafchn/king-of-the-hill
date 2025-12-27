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
    const targetUser = interaction.options.getUser('user', true);
    const guild = interaction.guild;
    if (!guild) return;

    // Get current king from roles
    const currentKingMember = await getCurrentKing(guild);
    const oldKingId = currentKingMember?.id;

    resetStreak();
    setKing(targetUser.id);

    const role = guild.roles.cache.find(r => r.name === config.roleName);

    if (role) {
        if (oldKingId) {
            try {
                const oldMember = await guild.members.fetch(oldKingId);
                if (oldMember) await oldMember.roles.remove(role);
            } catch (e) { }
        }

        try {
            const newMember = await guild.members.fetch(targetUser.id);
            if (newMember) await newMember.roles.add(role);
        } catch (e) { }
    }

    await interaction.reply(`👑 All hail the new King, ${targetUser}!`);
};
