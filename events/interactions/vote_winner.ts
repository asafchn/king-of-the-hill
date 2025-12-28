import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel, Guild } from 'discord.js';
import { getState, castVote, clearVotes } from '../../gameState';
import { processMatchEnd, handleRoleAndNicknameUpdates } from '../../commands/reportResult/helpers';
import config from '../../config.json';

/**
 * Sends the voting buttons to both players
 */
export async function sendReportButtons(guild: Guild, challengerId: string, defenderId: string) {
    const challenger = await guild.members.fetch(challengerId).catch(() => null);
    const defender = await guild.members.fetch(defenderId).catch(() => null);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`vote_winner_${challengerId}`)
            .setLabel(`Winner: ${challenger?.displayName || 'Challenger'}`)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`vote_winner_${defenderId}`)
            .setLabel(`Winner: ${defender?.displayName || 'Defender'}`)
            .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
        .setColor(0xFFFF00)
        .setTitle("⚔️ MATCH OVER?")
        .setDescription(`${challenger} and ${defender}, select the winner below to confirm the result. **Both players must agree!**`)
        .setTimestamp();

    if ((config as any).announcementImagePath) {
        embed.setImage((config as any).announcementImagePath);
    }

    const channel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;
    if (channel) {
        await channel.send({
            embeds: [embed],
            components: [row]
        });
    }
}

export async function handleVoteWinner(interaction: ButtonInteraction) {
    const { customId } = interaction;
    const winnerId = customId.split('_')[2];
    const guild = interaction.guild;
    if (!guild) return;

    await interaction.deferReply({ ephemeral: true });

    try {
        const state = await getState();
        const challenge = state.activeChallenge;

        if (!challenge || !challenge.accepted) {
            return interaction.editReply('No active match to report.');
        }

        if (interaction.user.id !== challenge.challenger && interaction.user.id !== challenge.defender) {
            return interaction.editReply('You are not in this match!');
        }

        await castVote(interaction.user.id, winnerId);
        await interaction.editReply(`You voted for <@${winnerId}> as the winner. Waiting for opponent...`);

        const updatedStateFull = await getState();
        const updatedState = updatedStateFull.activeChallenge;
        if (updatedState?.challengerVote && updatedState?.defenderVote) {
            const annChannel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;

            await interaction.message.edit({ components: [] }).catch(() => null);

            if (updatedState.challengerVote === updatedState.defenderVote) {
                const finalWinnerId = updatedState.challengerVote;
                const { isNewKing, oldKingId } = await processMatchEnd(await getState(), finalWinnerId);
                await handleRoleAndNicknameUpdates(guild, oldKingId, finalWinnerId, isNewKing);

                if (annChannel) {
                    const streak = (await getState()).streak;
                    const challengeButton = new ButtonBuilder()
                        .setCustomId('challenge_king')
                        .setLabel('Challenge the King')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚔️');
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(challengeButton);
                    // ... existing code ...
                    const embed = new EmbedBuilder()
                        .setColor(isNewKing ? 0xFFA500 : 0x00FF00)
                        .setTitle(isNewKing ? "👑 NEW KING!" : "👑 STILL KING!")
                        .setDescription(isNewKing
                            ? `<@${finalWinnerId}> has defeated <@${oldKingId}> and claimed the throne!`
                            : `<@${finalWinnerId}> defended the throne!`)
                        .addFields({ name: "Current Streak", value: `**${streak}**`, inline: true })
                        .setTimestamp();

                    // Add winner avatar
                    const winnerMember = await guild.members.fetch(finalWinnerId).catch(() => null);
                    if (winnerMember) embed.setThumbnail(winnerMember.user.displayAvatarURL());

                    if ((config as any).announcementImagePath) {
                        embed.setImage((config as any).announcementImagePath);
                    }

                    await annChannel.send({ embeds: [embed], components: [row] });
                }
            } else {
                await clearVotes();
                if (annChannel) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFF0000)
                        .setTitle("⚠️ VOTE CONFLICT!")
                        .setDescription(`<@${challenge.challenger}> and <@${challenge.defender}> disagreed on the winner. **Please vote again.**`)
                        .setTimestamp();

                    if ((config as any).announcementImagePath) {
                        embed.setImage((config as any).announcementImagePath);
                    }
                    await annChannel.send({ embeds: [embed] });
                }
                await sendReportButtons(guild, challenge.challenger, challenge.defender);
            }
        }
    } catch (error) {
        console.error("Error handling vote winner:", error);
        await interaction.editReply('❌ An error occurred while voting for the winner.');
    }
}