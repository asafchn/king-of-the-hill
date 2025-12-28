import db from './database';

export interface Challenge {
    challenger: string;
    defender: string;
    type: 'bo3' | 'bo5';
    scores: { challenger: number; defender: number };
    accepted: boolean;
    createdAt?: string;
    challengerVote?: string | null;
    defenderVote?: string | null;
}

export interface GameState {
    king: string | null;
    streak: number;
    activeChallenge: Challenge | null;
}

/**
 * Checks if the current King has failed to respond to a challenge within 3 days.
 * If so, resets the King and streak.
 */
const checkChallengeExpiration = (rawState: { king: string | null, streak: number }, rawChallenge: any) => {
    if (rawState.king && rawChallenge && rawChallenge.status === 'pending') {
        const createdAt = new Date(rawChallenge.created_at).getTime();
        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;

        if (now - createdAt > threeDays) {
            console.log(`[AUD] Challenge expired. King ${rawState.king} failed to respond in 3 days.`);
            db.prepare("UPDATE game_state SET current_king_id = NULL, streak = 0 WHERE id = 1").run();
            db.prepare("UPDATE matches SET status = 'cancelled' WHERE id = ?").run(rawChallenge.id);
            return true; // State was reset
        }
    }
    return false;
};

// Helper to get raw state from DB
const getRawState = () => {
    return db.prepare('SELECT current_king_id as king, streak FROM game_state WHERE id = 1').get() as { king: string | null, streak: number };
};

// Helper to get active challenge from DB
const getRawChallenge = () => {
    return db.prepare("SELECT * FROM matches WHERE status IN ('pending', 'active') LIMIT 1").get() as any;
};

export const getState = (): GameState => {
    let rawState = getRawState();
    const rawChallengeRow = getRawChallenge();

    // Run expiration check
    if (checkChallengeExpiration(rawState, rawChallengeRow)) {
        rawState = getRawState(); // Refresh state if reset
    }

    let activeChallenge: Challenge | null = null;
    if (rawChallengeRow && rawChallengeRow.status !== 'cancelled') {
        activeChallenge = {
            challenger: rawChallengeRow.challenger_id,
            defender: rawChallengeRow.defender_id,
            type: rawChallengeRow.type as 'bo3' | 'bo5',
            scores: { challenger: rawChallengeRow.challenger_score, defender: rawChallengeRow.defender_score },
            accepted: rawChallengeRow.status === 'active',
            createdAt: rawChallengeRow.created_at,
            challengerVote: rawChallengeRow.challenger_vote,
            defenderVote: rawChallengeRow.defender_vote
        };
    }

    return {
        king: rawState.king,
        streak: rawState.streak,
        activeChallenge: activeChallenge
    };
};

export const setKing = (userId: string): void => {
    const state = getRawState();
    if (state.king === userId) {
        db.prepare('UPDATE game_state SET streak = streak + 1 WHERE id = 1').run();
    } else {
        db.prepare('UPDATE game_state SET current_king_id = ?, streak = 1 WHERE id = 1').run(userId);
    }
};

export const resetStreak = (): void => {
    db.prepare('UPDATE game_state SET streak = 0 WHERE id = 1').run();
};

export const setChallenge = (challenge: Challenge): void => {
    // Clear any previous pending/active challenges first
    db.prepare("UPDATE matches SET status = 'cancelled' WHERE status IN ('pending', 'active')").run();
    db.prepare('INSERT INTO matches (challenger_id, defender_id, type, challenger_score, defender_score, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(challenge.challenger, challenge.defender, challenge.type, challenge.scores.challenger, challenge.scores.defender, challenge.accepted ? 'active' : 'pending');
};

export const castVote = (userId: string, winnerId: string): void => {
    const challenge = getState().activeChallenge;
    if (!challenge) return;

    if (userId === challenge.challenger) {
        db.prepare("UPDATE matches SET challenger_vote = ? WHERE status = 'active'").run(winnerId);
    } else if (userId === challenge.defender) {
        db.prepare("UPDATE matches SET defender_vote = ? WHERE status = 'active'").run(winnerId);
    }
};

export const clearVotes = (): void => {
    db.prepare("UPDATE matches SET challenger_vote = NULL, defender_vote = NULL WHERE status = 'active'").run();
};

export const fullReset = (): void => {
    db.prepare('UPDATE game_state SET current_king_id = NULL, streak = 0 WHERE id = 1').run();
    db.prepare("UPDATE matches SET status = 'cancelled' WHERE status IN ('pending', 'active')").run();
};

export const softReset = (): void => {
    db.prepare("UPDATE matches SET status = 'cancelled' WHERE status IN ('pending', 'active')").run();
};

export const clearChallenge = (): void => {
    db.prepare("UPDATE matches SET status = 'completed' WHERE status IN ('pending', 'active')").run();
};

export const updateScores = (challengerScore: number, defenderScore: number): void => {
    db.prepare("UPDATE matches SET challenger_score = ?, defender_score = ? WHERE status IN ('pending', 'active')")
        .run(challengerScore, defenderScore);
};

export const acceptChallenge = (): void => {
    db.prepare("UPDATE matches SET status = 'active' WHERE status = 'pending'").run();
}
