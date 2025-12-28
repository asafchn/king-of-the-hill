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
    const state = getState();

    // 2. Validation
    const validationError = validateChallenge(state);
    if (validationError) {
        return interaction.reply({ content: validationError, ephemeral: true });
    }

    const challengerScore = interaction.options.getInteger('challenger_score', true);
    const defenderScore = interaction.options.getInteger('defender_score', true);

    // 3. Determine Results
    const results = getMatchResults(state.activeChallenge!, challengerScore, defenderScore);
    if (results.error) {
        return interaction.reply({ content: results.error, ephemeral: true });
    }

    const { winnerId, isNewKing, oldKingId } = processMatchEnd(state, results.winnerId!);

    // 4. Role & Nickname Management
    const guild = interaction.guild;
    if (guild) {
        await handleRoleAndNicknameUpdates(guild, oldKingId, winnerId!, isNewKing);
    }

    // 5. Announcement
    announceResult(interaction, winnerId!, oldKingId, isNewKing);

    await interaction.reply({ content: 'Match reported successfully!', ephemeral: true });
};
