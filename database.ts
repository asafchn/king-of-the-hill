import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, 'koth.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
    CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_king_id TEXT,
        streak INTEGER DEFAULT 0,
        last_challenge_accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        challenger_id TEXT NOT NULL,
        defender_id TEXT NOT NULL,
        type TEXT NOT NULL,
        challenger_score INTEGER DEFAULT 0,
        defender_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
        challenger_vote TEXT,
        defender_vote TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Ensure initial row in game_state
    INSERT OR IGNORE INTO game_state (id, current_king_id, streak) VALUES (1, NULL, 0);
`);

// Migration: Add columns if they don't exist (handle existing databases)
const columns = db.prepare("PRAGMA table_info(matches)").all() as any[];
const columnNames = columns.map(c => c.name);

if (!columnNames.includes('challenger_vote')) {
    db.exec("ALTER TABLE matches ADD COLUMN challenger_vote TEXT;");
    console.log("[DB] Added missing column: challenger_vote");
}
if (!columnNames.includes('defender_vote')) {
    db.exec("ALTER TABLE matches ADD COLUMN defender_vote TEXT;");
    console.log("[DB] Added missing column: defender_vote");
}

const stateColumns = db.prepare("PRAGMA table_info(game_state)").all() as any[];
const stateColumnNames = stateColumns.map(c => c.name);
if (!stateColumnNames.includes('last_challenge_accepted_at')) {
    db.exec("ALTER TABLE game_state ADD COLUMN last_challenge_accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;");
    console.log("[DB] Added missing column: last_challenge_accepted_at");
}

export default db;
