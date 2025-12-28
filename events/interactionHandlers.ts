import { ButtonInteraction, ModalSubmitInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder, ButtonBuilder, ButtonStyle, TextChannel, EmbedBuilder } from 'discord.js';
import { getCurrentKing } from '../utils/roleUtils';
import { getState, resetStreak, setKing, setChallenge, castVote, clearVotes, clearChallenge as clearGameChallenge, acceptChallenge } from '../gameState';
import { processMatchEnd, handleRoleAndNicknameUpdates } from '../commands/reportResult/helpers';
import config from '../config.json';
import db from '../database';

/**
 * Sends the voting buttons to both players
 */
async function sendReportButtons(guild: any, challengerId: string, defenderId: string) {
    const challenger = await guild.members.fetch(challengerId).catch(() => null);
    const defender = await guild.members.fetch(defenderId).catch(() => null);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId(`vote_winner_${challengerId}`)
            .setLabel(`Winner: ${challenger?.user.username || 'Challenger'}`)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`vote_winner_${defenderId}`)
            .setLabel(`Winner: ${defender?.user.username || 'Defender'}`)
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

export async function handleButtonInteraction(interaction: ButtonInteraction) {
    const { customId } = interaction;
    const guild = interaction.guild || interaction.client.guilds.cache.first();
    if (!guild) return;

    if (customId === 'show_king') {
        await interaction.deferReply({ ephemeral: true });
        const king = await getCurrentKing(guild);
        const streak = getState().streak;
        if (!king) {
            await interaction.editReply('There is no King currently reigning!');
        } else {
            await interaction.editReply(`👑 The current King is ${king} with a win streak of **${streak}**!`);
        }
    }

    if (customId === 'challenge_king') {
        const state = getState();
        const kingMember = await getCurrentKing(guild);
        if (!kingMember) return interaction.reply({ content: '❌ No King to challenge.', ephemeral: true });
        if (state.activeChallenge) return interaction.reply({ content: '❌ A challenge is already in progress.', ephemeral: true });
        if (interaction.user.id === kingMember.id) return interaction.reply({ content: '❌ You are the King!', ephemeral: true });

        setChallenge({
            challenger: interaction.user.id,
            defender: kingMember.id,
            type: 'bo3',
            scores: { challenger: 0, defender: 0 },
            accepted: false
        });

        await interaction.message.edit({ components: [] }).catch(() => null);

        await interaction.reply({ content: '⚔️ Challenge sent!', ephemeral: true });

        const annChannel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;
        if (annChannel) {
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("⚔️ NEW CHALLENGE!")
                .setDescription(`<@${interaction.user.id}> has challenged the King, <@${kingMember.id}>!`)
                .setTimestamp();

            if ((config as any).announcementImagePath) {
                embed.setImage((config as any).announcementImagePath);
            }
            await annChannel.send({ embeds: [embed] });
        }

        try {
            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('accept_challenge').setLabel('Accept Challenge').setStyle(ButtonStyle.Success).setEmoji('⚔️')
            );
            await kingMember.send({ content: `⚔️ **Challenged!** ${interaction.user.tag} wants the throne. 3 days to respond!`, components: [row] });
        } catch (e) {
            if (annChannel) await annChannel.send(`⚠️ Could not DM King ${kingMember}.`);
        }
    }

    if (customId === 'accept_challenge') {
        const state = getState();
        if (!state.activeChallenge || state.activeChallenge.accepted) {
            return interaction.reply({ content: '❌ Invalid or already accepted.', ephemeral: true });
        }

        if (interaction.user.id !== state.activeChallenge.defender) {
            return interaction.reply({ content: '❌ Only the challenged player can accept this!', ephemeral: true });
        }

        acceptChallenge();

        await interaction.message.edit({ components: [] }).catch(() => null);

        await interaction.reply({ content: '✅ Challenge accepted!', ephemeral: true });

        const channel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("✅ CHALLENGE ACCEPTED!")
                .setDescription(`The match between <@${state.activeChallenge.challenger}> and <@${state.activeChallenge.defender}> is **ON**!`)
                .setTimestamp();

            if ((config as any).announcementImagePath) {
                embed.setImage((config as any).announcementImagePath);
            }
            await channel.send({ embeds: [embed] });
        }

        await sendReportButtons(guild, state.activeChallenge.challenger, state.activeChallenge.defender);
    }

    if (customId.startsWith('vote_winner_')) {
        const winnerId = customId.split('_')[2];
        const state = getState();
        const challenge = state.activeChallenge;

        if (!challenge || !challenge.accepted) {
            return interaction.reply({ content: 'No active match to report.', ephemeral: true });
        }

        if (interaction.user.id !== challenge.challenger && interaction.user.id !== challenge.defender) {
            return interaction.reply({ content: 'You are not in this match!', ephemeral: true });
        }

        castVote(interaction.user.id, winnerId);
        await interaction.reply({ content: `You voted for <@${winnerId}> as the winner. Waiting for opponent...`, ephemeral: true });

        const updatedState = getState().activeChallenge;
        if (updatedState?.challengerVote && updatedState?.defenderVote) {
            const annChannel = guild.channels.cache.find((c: any) => c.name === config.channelName) as TextChannel;

            await interaction.message.edit({ components: [] }).catch(() => null);

            if (updatedState.challengerVote === updatedState.defenderVote) {
                const finalWinnerId = updatedState.challengerVote;
                const { isNewKing, oldKingId } = processMatchEnd(getState(), finalWinnerId);
                await handleRoleAndNicknameUpdates(guild, oldKingId, finalWinnerId, isNewKing);

                if (annChannel) {
                    const streak = getState().streak;
                    const challengeButton = new ButtonBuilder()
                        .setCustomId('challenge_king')
                        .setLabel('Challenge the King')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('⚔️');
                    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(challengeButton);

                    const embed = new EmbedBuilder()
                        .setColor(isNewKing ? 0xFFA500 : 0x00FF00)
                        .setTitle(isNewKing ? "👑 NEW KING!" : "👑 STILL KING!")
                        .setDescription(isNewKing
                            ? `<@${finalWinnerId}> has defeated <@${oldKingId}> and claimed the throne!`
                            : `<@${finalWinnerId}> defended the throne!`)
                        .addFields({ name: "Current Streak", value: `**${streak}**`, inline: true })
                        .setTimestamp();

                    if ((config as any).announcementImagePath) {
                        embed.setImage((config as any).announcementImagePath);
                    }

                    await annChannel.send({ embeds: [embed], components: [row] });
                }
            } else {
                clearVotes();
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
    }

    if (customId === 'open_crown_modal') {
        const modal = new ModalBuilder().setCustomId('crown_modal').setTitle('Crown New King');
        const input = new TextInputBuilder().setCustomId('user_id').setLabel("User ID").setStyle(TextInputStyle.Short).setRequired(true);
        modal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(input));
        await interaction.showModal(modal);
    }
}

export async function handleModalInteraction(interaction: ModalSubmitInteraction) {
    const guild = interaction.guild || interaction.client.guilds.cache.first();
    if (!guild) return;

    if (interaction.customId === 'crown_modal') {
        const userId = interaction.fields.getTextInputValue('user_id');
        try {
            const targetUser = await interaction.client.users.fetch(userId);
            const currentKingMember = await getCurrentKing(guild);
            const oldKingId = currentKingMember?.id;

            resetStreak();
            setKing(targetUser.id);

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
            await interaction.reply({ content: '❌ Error setting King.', ephemeral: true });
        }
    }
}
