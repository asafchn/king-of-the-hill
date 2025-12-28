import db from './database';
import config from './config.json';

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
 * Checks if the current King has failed to accept a challenge within the configured time.
 * Logic: If a pending challenge exists AND the time since the last accepted challenge 
 * (or since being crowned) exceeds the timeout, revoke the title.
 */
export const checkChallengeExpiration = (rawState: { king: string | null, streak: number, last_challenge_accepted_at: string }, rawChallenge: any): string | null => {
    if (rawState.king && rawChallenge && rawChallenge.status === 'pending') {
        const lastAcceptedAt = new Date(rawState.last_challenge_accepted_at).getTime();
        const now = Date.now();
        const timeoutHours = config.inactivityTimeoutHours || 24;
        const timeoutMs = timeoutHours * 60 * 60 * 1000;

        if (now - lastAcceptedAt > timeoutMs) {
            const revokedId = rawState.king;
            console.log(`[AUD] Inactivity detected. King ${revokedId} hasn't accepted a challenge in ${timeoutHours} hours.`);
            db.prepare("UPDATE game_state SET current_king_id = NULL, streak = 0 WHERE id = 1").run();
            db.prepare("UPDATE matches SET status = 'cancelled' WHERE id = ?").run(rawChallenge.id);
            return revokedId;
        }
    }
    return null;
};

// Helper to get raw state from DB
const getRawState = () => {
    return db.prepare('SELECT current_king_id as king, streak, last_challenge_accepted_at FROM game_state WHERE id = 1').get() as { king: string | null, streak: number, last_challenge_accepted_at: string };
};

// Helper to get active challenge from DB
const getRawChallenge = () => {
    return db.prepare("SELECT * FROM matches WHERE status IN ('pending', 'active') LIMIT 1").get() as any;
};

/**
 * Explicitly triggers the inactivity check and returns the revoked King's ID if any.
 */
export const checkAndRevoke = (): string | null => {
    const rawState = getRawState();
    const rawChallengeRow = getRawChallenge();
    return checkChallengeExpiration(rawState, rawChallengeRow);
};

export const getState = (): GameState => {
    let rawState = getRawState();
    const rawChallengeRow = getRawChallenge();

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
        db.prepare('UPDATE game_state SET current_king_id = ?, streak = 1, last_challenge_accepted_at = CURRENT_TIMESTAMP WHERE id = 1').run(userId);
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
    db.prepare("UPDATE game_state SET last_challenge_accepted_at = CURRENT_TIMESTAMP WHERE id = 1").run();
}
