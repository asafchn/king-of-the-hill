import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { softReset, getState } from '../gameState';
import { getCurrentKing } from '../utils/roleUtils';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('resetchallenge')
    .setDescription('Clears the active challenge but keeps the current King and streak (Admin/Mod only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });

    const member = interaction.member;
    const guild = interaction.guild;
    if (!guild || !member) return;

    // Permissions check
    const hasModRole = (member as any).roles.cache.some((r: any) => r.name === config.modRoleName);
    const isAdmin = (member as any).permissions.has(PermissionFlagsBits.Administrator);

    if (!hasModRole && !isAdmin) {
        return interaction.editReply({ content: '❌ You do not have permission to use this command.' });
    }

    softReset();

    // Re-announce the King with a new challenge button if there is one
    const annChannel = guild.channels.cache.find(c => c.name === config.channelName) as TextChannel;
    if (annChannel) {
        await annChannel.send('🔄 **CHALLENGE RESET!** The current challenge has been cleared, but the King remains on the throne!');

        const state = getState();
        if (state.king) {
            const kingMember = await getCurrentKing(guild);
            if (kingMember) {
                const challengeButton = new ButtonBuilder()
                    .setCustomId('challenge_king')
                    .setLabel('Challenge the King')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⚔️');
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(challengeButton);

                await annChannel.send({
                    content: `👑 **STILL KING!** ${kingMember} is waiting for the next challenger! \nCurrent Streak: **${state.streak}**`,
                    components: [row]
                });
            }
        }
    }

    await interaction.editReply({ content: '✅ Active challenge has been cleared.' });
};
