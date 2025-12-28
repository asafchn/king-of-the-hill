import { Pool } from 'pg';
import dotenv from 'dotenv';
import config from './config.json';

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error("[DB] Error: DATABASE_URL is not defined in .env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_king_id TEXT,
                streak INTEGER DEFAULT 0,
                last_challenge_accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS matches (
                id SERIAL PRIMARY KEY,
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
        `);

        // Ensure initial row in game_state
        await pool.query(`
            INSERT INTO game_state (id, current_king_id, streak)
            VALUES (1, NULL, 0)
            ON CONFLICT (id) DO NOTHING;
        `);

        console.log("[DB] Database initialized (tables verified).");

        // Migrations: Add columns if they don't exist
        const addColumnIfNotExists = async (table: string, column: string, type: string) => {
            try {
                await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
                console.log(`[DB] Added missing column: ${column} to ${table}`);
            } catch (err: any) {
                // Ignore error if column already exists (code 42701 in postgres)
                if (err.code !== '42701') {
                    console.error(`[DB] Migration error for ${column}:`, err.message);
                }
            }
        };

        await addColumnIfNotExists('matches', 'challenger_vote', 'TEXT');
        await addColumnIfNotExists('matches', 'defender_vote', 'TEXT');
        await addColumnIfNotExists('game_state', 'last_challenge_accepted_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    } catch (err: any) {
        console.error("[DB] Initialization error:", err);
    }
};

// Initialize on start
initDb();

export default pool;
