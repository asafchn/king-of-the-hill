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
export const checkChallengeExpiration = async (rawState: { king: string | null, streak: number, last_challenge_accepted_at: string | number | Date }, rawChallenge: any): Promise<string | null> => {
    if (rawState.king && rawChallenge && rawChallenge.status === 'pending') {
        const lastAcceptedAt = new Date(rawState.last_challenge_accepted_at).getTime();

        const now = Date.now();
        const timeoutHours = config.inactivityTimeoutHours || 24;
        const timeoutMs = timeoutHours * 60 * 60 * 1000;

        if (now - lastAcceptedAt > timeoutMs) {
            const revokedId = rawState.king;
            console.log(`[AUD] Inactivity detected. King ${revokedId} hasn't accepted a challenge in ${timeoutHours} hours.`);
            await db.query("UPDATE game_state SET current_king_id = NULL, streak = 0 WHERE id = 1");
            await db.query("UPDATE matches SET status = 'cancelled' WHERE id = $1", [rawChallenge.id]);
            return revokedId;
        }
    }
    return null;
};

// Helper to get raw state from DB
const getRawState = async () => {
    const res = await db.query('SELECT current_king_id as king, streak, last_challenge_accepted_at FROM game_state WHERE id = 1');
    return res.rows[0] as { king: string | null, streak: number, last_challenge_accepted_at: string | number | Date };
};

// Helper to get active challenge from DB
const getRawChallenge = async () => {
    const res = await db.query("SELECT * FROM matches WHERE status IN ('pending', 'active') LIMIT 1");
    return res.rows[0] as any;
};

/**
 * Explicitly triggers the inactivity check and returns the revoked King's ID if any.
 */
export const checkAndRevoke = async (): Promise<string | null> => {
    const rawState = await getRawState();
    const rawChallengeRow = await getRawChallenge();
    return checkChallengeExpiration(rawState, rawChallengeRow);
};

export const getState = async (): Promise<GameState> => {
    let rawState = await getRawState();
    const rawChallengeRow = await getRawChallenge();

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
        king: rawState?.king || null,
        streak: rawState?.streak || 0,
        activeChallenge: activeChallenge
    };
};

export const setKing = async (userId: string): Promise<void> => {
    const state = await getRawState();
    if (state.king === userId) {
        // King defended throne: increment streak AND reset activity timer
        // Postgres to_timestamp is not needed if we pass a Date or ISO string, but passing simple Date() works with pg
        await db.query('UPDATE game_state SET streak = streak + 1, last_challenge_accepted_at = CURRENT_TIMESTAMP WHERE id = 1');
    } else {
        // New King: reset streak and timer
        await db.query('UPDATE game_state SET current_king_id = $1, streak = 1, last_challenge_accepted_at = CURRENT_TIMESTAMP WHERE id = 1', [userId]);
    }
};

export const resetStreak = async (): Promise<void> => {
    await db.query('UPDATE game_state SET streak = 0 WHERE id = 1');
};

export const setChallenge = async (challenge: Challenge): Promise<void> => {
    // Clear any previous pending/active challenges first
    await db.query("UPDATE matches SET status = 'cancelled' WHERE status IN ('pending', 'active')");
    await db.query(
        'INSERT INTO matches (challenger_id, defender_id, type, challenger_score, defender_score, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [challenge.challenger, challenge.defender, challenge.type, challenge.scores.challenger, challenge.scores.defender, challenge.accepted ? 'active' : 'pending']
    );
};

export const castVote = async (userId: string, winnerId: string): Promise<void> => {
    const state = await getState();
    const challenge = state.activeChallenge;
    if (!challenge) return;

    if (userId === challenge.challenger) {
        await db.query("UPDATE matches SET challenger_vote = $1 WHERE status = 'active'", [winnerId]);
    } else if (userId === challenge.defender) {
        await db.query("UPDATE matches SET defender_vote = $1 WHERE status = 'active'", [winnerId]);
    }
};

export const clearVotes = async (): Promise<void> => {
    await db.query("UPDATE matches SET challenger_vote = NULL, defender_vote = NULL WHERE status = 'active'");
};

export const fullReset = async (): Promise<void> => {
    await db.query('UPDATE game_state SET current_king_id = NULL, streak = 0 WHERE id = 1');
    await db.query("UPDATE matches SET status = 'cancelled' WHERE status IN ('pending', 'active')");
};

export const softReset = async (): Promise<void> => {
    await db.query("UPDATE matches SET status = 'cancelled' WHERE status IN ('pending', 'active')");
};

export const clearChallenge = async (): Promise<void> => {
    await db.query("UPDATE matches SET status = 'completed' WHERE status IN ('pending', 'active')");
};

export const updateScores = async (challengerScore: number, defenderScore: number): Promise<void> => {
    await db.query("UPDATE matches SET challenger_score = $1, defender_score = $2 WHERE status IN ('pending', 'active')", [challengerScore, defenderScore]);
};

export const acceptChallenge = async (): Promise<void> => {
    await db.query("UPDATE matches SET status = 'active' WHERE status = 'pending'");
    await db.query("UPDATE game_state SET last_challenge_accepted_at = CURRENT_TIMESTAMP WHERE id = 1");
}
