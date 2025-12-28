import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, 'koth.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
    CREATE TABLE IF NOT EXISTS game_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        current_king_id TEXT,
        streak INTEGER DEFAULT 0
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

export default db;
