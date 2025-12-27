import db from './database';

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

// Helper to get raw state from DB
const getRawState = () => {
    return db.prepare('SELECT current_king_id as king, streak FROM game_state WHERE id = 1').get() as { king: string | null, streak: number };
};

// Helper to get active challenge from DB
const getRawChallenge = () => {
    const row = db.prepare("SELECT * FROM matches WHERE status IN ('pending', 'active') LIMIT 1").get() as any;
    if (!row) return null;
    return {
        challenger: row.challenger_id,
        defender: row.defender_id,
        type: row.type as 'bo3' | 'bo5',
        scores: { challenger: row.challenger_score, defender: row.defender_score },
        accepted: row.status === 'active'
    };
};

export const getState = (): GameState => {
    const rawState = getRawState();
    const rawChallenge = getRawChallenge();
    return {
        king: rawState.king,
        streak: rawState.streak,
        activeChallenge: rawChallenge
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
