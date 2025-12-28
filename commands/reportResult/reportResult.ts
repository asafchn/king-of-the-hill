import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';
import { getState } from '../../gameState';
import { validateChallenge, getMatchResults, processMatchEnd, handleRoleAndNicknameUpdates, announceResult } from './helpers';
import config from '../../config.json';

export const data = new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report the results of the challenge (Admin/Authorized only)')
    .addIntegerOption(option =>
        option.setName('challenger_score')
            .setDescription('Score for the challenger')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('defender_score')
            .setDescription('Score for the defender')
            .setRequired(true));

export const execute = async (interaction: ChatInputCommandInteraction) => {
    console.log('[Report] Starting execution...');
    const state = getState();
    console.log(`[Report] Current state: ${JSON.stringify(state.activeChallenge || 'No active challenge')}`);

    // 2. Validation
    console.log('[Report] Validating challenge state...');
    const validationError = validateChallenge(state);
    if (validationError) {
        console.warn(`[Report] Validation failed: ${validationError}`);
        return interaction.editReply({ content: validationError });
    }

    const challengerScore = interaction.options.getInteger('challenger_score', true);
    const defenderScore = interaction.options.getInteger('defender_score', true);
    console.log(`[Report] Scores - Challenger: ${challengerScore}, Defender: ${defenderScore}`);

    // 3. Determine Results
    console.log('[Report] Determining match results...');
    const results = getMatchResults(state.activeChallenge!, challengerScore, defenderScore);
    if (!results || 'error' in results) {
        console.warn(`[Report] Logic error: ${results?.error}`);
        return interaction.editReply({ content: results?.error || 'Unknown error' });
    }

    console.log(`[Report] Winner ID: ${results.winnerId}`);
    const { winnerId, isNewKing, oldKingId } = processMatchEnd(state, results.winnerId!);

    // 4. Role & Nickname Management
    const guild = interaction.guild;
    if (guild) {
        console.log('[Report] Updating roles and nicknames...');
        await handleRoleAndNicknameUpdates(guild, oldKingId, winnerId!, isNewKing);
    }

    // 5. Announcement
    console.log('[Report] Sending announcement...');
    announceResult(interaction, winnerId!, oldKingId, isNewKing);

    console.log('[Report] Replying to user...');
    await interaction.editReply({ content: 'Match reported successfully!' });
    console.log('[Report] Execution finished.');
};
