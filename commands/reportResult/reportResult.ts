import { SlashCommandBuilder, ChatInputCommandInteraction, } from 'discord.js';
import { getState, } from '../../gameState';
import { validateChallenge, getMatchResults, processMatchEnd, handleRoleAndNicknameUpdates, announceResult } from './helpers';


export const data = new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report the results of the challenge')
    .addIntegerOption(option =>
        option.setName('my_score')
            .setDescription('Your score')
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName('opponent_score')
            .setDescription('Opponent\'s score')
            .setRequired(true));



export const execute = async (interaction: ChatInputCommandInteraction) => {
    const state = getState();
    const user = interaction.user;

    // 1. Validation
    const validationError = validateChallenge(state, user.id);
    if (validationError) {
        return interaction.reply({ content: validationError, ephemeral: true });
    }

    const myScore = interaction.options.getInteger('my_score', true);
    const opponentScore = interaction.options.getInteger('opponent_score', true);

    // 2. Determine Results
    const results = getMatchResults(state.activeChallenge!, user.id, myScore, opponentScore);
    if (results.error) {
        return interaction.reply({ content: results.error, ephemeral: true });
    }

    const { winnerId, isNewKing, oldKingId } = processMatchEnd(state, results.winnerId!);

    // 3. Role & Nickname Management
    const guild = interaction.guild;
    if (guild) {
        await handleRoleAndNicknameUpdates(guild, oldKingId, winnerId!, isNewKing);
    }

    // 4. Announcement
    announceResult(interaction, winnerId!, oldKingId, isNewKing);

    await interaction.reply({ content: 'Match reported successfully!', ephemeral: true });
};
