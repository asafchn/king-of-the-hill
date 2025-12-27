# 👑 King of the Hill Discord Bot

A TypeScript-based Discord bot to manage "King of the Hill" challenges within a server. It tracks the current King, manages a special role, handles BO3/BO5 challenges, and maintains win streaks.

## 🚀 Quick Start

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.11.0 or higher)
- A Discord Bot Token (from the [Discord Developer Portal](https://discord.com/developers/applications))
- **Privileged Gateway Intents**: Ensure `Server Members Intent` is enabled in your bot's settings.

### 2. Installation
```bash
npm install
```

### 3. Database Setup
The bot uses **SQLite** for persistence. You don't need to install a separate database server.
- The database is automatically created as a file named `koth.db` in the root directory the first time the bot runs.
- If you want to reset the bot's state, simply delete the `koth.db` file.

### 4. Configuration
Create a `.env` file in the root directory:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_server_id_here
```

Update `config.json` with your desired role and channel names:
```json
{
    "roleName": "King of the Hill",
    "channelName": "koth-announcements",
    "reportChannelName": "koth-reports"
}
```

### 4. Deployment & Running
First, register the slash commands to your server:
```bash
npm run deploy
```

Then, start the bot:
```bash
npm run dev
```

---

## 🎮 How to Test

1.  **Initial Setup**: Use `/setking @user` to manually crown the first King.
2.  **Challenge**: As another user, run `/challenge` (target the King). Choose `BO3` or `BO5`.
3.  **Accept**: The King must run `/accept` to start the match.
4.  **Report**: An authorized user (e.g., Moderator) runs `/report` in the restricted reporting channel.
    -   Example: In a BO3, reporting `2` for the challenger and `1` for the defender will crown the challenger as the new King.
5.  **Verify**:
    -   Check if the "King of the Hill" role moved to the winner.
    -   Check if the winner's nickname updated to include `[1]` (win streak).
    -   Check the announcements channel for the update.
    -   Restart the bot and verify streaks are preserved (SQLite persistence).

---

## 🛠️ Project Architecture

-   **`database.ts`**: SQLite database initialization and schema management using `better-sqlite3`.
-   **`gameState.ts`**: Persistent state management for streaks and active challenges.
-   **`utils/roleUtils.ts`**: Helper for role-based King identification.
-   **`commands/`**: Contains slash command logic (Challenge, Accept, Report, King, SetKing).
-   **`events/`**: Discord event handlers (Ready, InteractionCreate).
-   **`types.d.ts`**: Type-safety for client commands.

---

## ✅ Completed Features

-   [x] **SQLite Persistence**: Game state (streaks, challenges) is stored locally in `koth.db`.
-   [x] **Role-Based King**: The current King is identified directly by their Discord role.
-   [x] **Restricted Reporting**: Reports are only accepted in a dedicated channel and can be restricted to specific roles.
-   [x] **Win Streaks**: Tracks and displays win streaks in nicknames and announcements.
-   [x] **Match Management**: BO3/BO5 challenge system with acceptance flow.
-   [x] **TypeScript**: Fully typed codebase for reliability.
