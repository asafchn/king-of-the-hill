export interface Challenge {
    challenger: string;
    defender: string;
    type: 'bo3' | 'bo5';
    scores: { challenger: number; defender: number };
    accepted: boolean;
}

export interface GameState {
    king: string | null;
    streak: number;
    activeChallenge: Challenge | null;
}

const gameState: GameState = {
    king: null,
    streak: 0,
    activeChallenge: null
};

export const getState = (): GameState => gameState;

export const setKing = (userId: string): void => {
    if (gameState.king === userId) {
        gameState.streak++;
    } else {
        gameState.king = userId;
        gameState.streak = 1;
    }
};

export const resetStreak = (): void => {
    gameState.streak = 0;
};

export const setChallenge = (challenge: Challenge): void => {
    gameState.activeChallenge = challenge;
};

export const clearChallenge = (): void => {
    gameState.activeChallenge = null;
};

export const updateScores = (challengerScore: number, defenderScore: number): void => {
    if (gameState.activeChallenge) {
        gameState.activeChallenge.scores.challenger = challengerScore;
        gameState.activeChallenge.scores.defender = defenderScore;
    }
};
