import { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { handleShowKing } from './interactions/show_king';
import { handleChallengeKing } from './interactions/challange_king';
import { handleAcceptChallenge } from './interactions/accept_challange';
import { handleVoteWinner } from './interactions/vote_winner';
import { handleOpenCrownModal, handleCrownModalSubmit } from './interactions/crown_modal';

export async function handleButtonInteraction(interaction: ButtonInteraction) {
    const { customId } = interaction;
    switch (customId) {
        case 'show_king':
            await handleShowKing(interaction);
            break;
        case 'challenge_king':
            await handleChallengeKing(interaction);
            break;
        case 'accept_challenge':
            await handleAcceptChallenge(interaction);
            break;
        case 'vote_winner':
            await handleVoteWinner(interaction);
            break;
        case 'open_crown_modal':
            await handleOpenCrownModal(interaction);
            break;
        default:
            break;
    }

}

export async function handleModalInteraction(interaction: ModalSubmitInteraction) {
    if (interaction.customId === 'crown_modal') {
        await handleCrownModalSubmit(interaction);
    }
}
