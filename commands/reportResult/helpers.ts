import { Guild, GuildMember, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { clearChallenge, GameState, getState, setKing } from "../../gameState";
import config from '../../config.json';
import { updateStreakNickname } from "../../utils/roleUtils";

/**
 * Validates if a report can be made
 */
export function validateChallenge(state: GameState): string | null {
    if (!state.activeChallenge) return 'There is no active challenge to report on.';
    if (!state.activeChallenge.accepted) return 'The challenge has not been accepted yet.';
    return null;
}

/**
 * Calculates scores and determines the winner
 */
export function getMatchResults(challenge: any, challengerScore: number, defenderScore: number) {
    const maxScore = challenge.type === 'bo3' ? 2 : 3;

    if (challengerScore > maxScore || defenderScore > maxScore) {
        return { error: `Invalid scores! For ${challenge.type}, the max score is ${maxScore}.` };
    }

    let winnerId: string | null = null;
    if (challengerScore === maxScore) winnerId = challenge.challenger;
    else if (defenderScore === maxScore) winnerId = challenge.defender;

    if (!winnerId) {
        return { error: `The match is not over yet! Someone needs to reach ${maxScore} wins.` };
    }

    return { winnerId };
}

/**
 * Updates game state and returns transition details
 */
export function processMatchEnd(state: GameState, winnerId: string) {
    const oldKingId = state.king;
    const isNewKing = oldKingId !== winnerId;

    setKing(winnerId);
    clearChallenge();

    return { winnerId, oldKingId, isNewKing };
}

/**
 * Handles role swapping and nickname streak updates
 */
export async function handleRoleAndNicknameUpdates(guild: Guild, oldKingId: string | null, newKingId: string, isNewKing: boolean) {
    const role = guild.roles.cache.find(r => r.name === config.roleName);
    const channel = guild.channels.cache.find(c => c.name === config.channelName);

    if (!role) {
        if (channel && channel.isTextBased() && 'send' in channel) {
            await channel.send('⚠️ **Error:** "King of the Hill" role not found!');
        }
        return;
    }

    // Remove role from old king
    if (oldKingId && isNewKing) {
        try {
            const oldMember = await guild.members.fetch(oldKingId);
            if (oldMember) await oldMember.roles.remove(role);
        } catch (e) { console.error('Failed to remove role', e); }
    }

    // Add role and update nickname for new king
    try {
        const newMember = await guild.members.fetch(newKingId);
        if (newMember) {
            await newMember.roles.add(role);
            await updateStreakNickname(newMember, channel);
        }
    } catch (e) { console.error('Failed to update new king', e); }
}


/**
 * Sends the final announcement to the dedicated channel
 */
export async function announceResult(interaction: ChatInputCommandInteraction, winnerId: string, oldKingId: string | null, isNewKing: boolean) {
    const channel = interaction.guild?.channels.cache.find(c => c.name === config.channelName);
    if (!channel || !channel.isTextBased()) return;

    // Create Challenge King button
    const challengeButton = new ButtonBuilder()
        .setCustomId('challenge_king')
        .setLabel('Challenge the King')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⚔️');
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(challengeButton);

    const streak = getState().streak;
    const content = isNewKing
        ? `👑 **NEW KING!** <@${winnerId}> has defeated <@${oldKingId}> and claimed the throne! \nCurrent Streak: **${streak}**`
        : `👑 **STILL KING!** <@${winnerId}> defended the throne! \nCurrent Streak: **${streak}**`;

    await (channel as any).send({
        content,
        components: [row]
    });
}

