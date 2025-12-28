import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { softReset, getState } from '../gameState';
import { getCurrentKing } from '../utils/roleUtils';
import config from '../config.json';

export const data = new SlashCommandBuilder()
    .setName('resetchallenge')
    .setDescription('Clears the active challenge but keeps the current King and streak (Admin/Mod only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export const execute = async (interaction: ChatInputCommandInteraction) => {
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
        const resetEmbed = new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle("🔄 CHALLENGE RESET!")
            .setDescription("The current challenge has been cleared, but the King remains on the throne!")
            .setTimestamp();

        // Add user avatar
        resetEmbed.setThumbnail(interaction.user.displayAvatarURL());

        // Add server image from config
        if ((config as any).announcementImagePath) {
            resetEmbed.setImage((config as any).announcementImagePath);
        }

        await annChannel.send({ embeds: [resetEmbed] });

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

                const kingEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle("👑 STILL KING!")
                    .setDescription(`<@${kingMember.id}> is waiting for the next challenger!`)
                    .addFields({ name: "Current Streak", value: `**${state.streak}**`, inline: true })
                    .setTimestamp();

                // Also add images to the King re-announcement
                kingEmbed.setThumbnail(kingMember.user.displayAvatarURL());
                if ((config as any).announcementImagePath) {
                    kingEmbed.setImage((config as any).announcementImagePath);
                }

                await annChannel.send({
                    embeds: [kingEmbed],
                    components: [row]
                });
            }
        }
    }

    await interaction.editReply({ content: '✅ Active challenge has been cleared.' });
};
