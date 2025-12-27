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

### 3. Configuration
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
    "channelName": "koth-announcements"
}
```

### 4. Deployment & Running
First, register the slash commands to your server:
```bash
npm run deploy
```

Then, start the bot:
```bash
npm start
```

---

## 🎮 How to Test

1.  **Initial Setup**: Use `/setking @user` to manually crown the first King.
2.  **Challenge**: As another user, run `/challenge` (target the King). Choose `BO3` or `BO5`.
3.  **Accept**: The King must run `/accept` to start the match.
4.  **Report**: After the match, run `/report`. 
    -   Example: In a BO3, reporting `2` for yourself and `1` for the opponent will crown you as the new King.
5.  **Verify**:
    -   Check if the "King of the Hill" role moved to the winner.
    -   Check if the winner's nickname updated to include `[1]` (win streak).
    -   Check the `#koth-announcements` channel for the update.

---

## 🛠️ Project Architecture

-   **`index.ts`**: Main entry point. Uses static imports for commands and events.
-   **`gameState.ts`**: In-memory state management for the King, streaks, and active challenges.
-   **`commands/`**: Contains slash command logic.
-   **`events/`**: Contains Discord event handlers (Ready, InteractionCreate).
-   **`types.d.ts`**: Module augmentation to provide type-safety for `client.commands`.

---

## 📝 Roadmap (What's Left to Do)

This project is currently a functional MVP. Here is what is recommended for the next developer:

1.  **Persistence**: Currently, the game state is in-memory. If the bot restarts, the King and streaks are lost. 
    -   *Task*: Integrate a database (SQLite, MongoDB, or PostgreSQL) or a simple JSON file store.
2.  **Original Nickname Recovery**: When a King loses, the bot doesn't know what their original nickname was before the `[Streak]` was added.
    -   *Task*: Store the user's original nickname in the database before changing it.
3.  **Leaderboard**: 
    -   *Task*: Implement a `/leaderboard` command to show all-time high streaks.
4.  **Match History**:
    -   *Task*: Log all completed matches to a channel or database.
5.  **Auto-Setup**:
    -   *Task*: Add a `/setup` command that automatically creates the required role and channel if they don't exist.
6.  **Permissions**:
    -   *Task*: Refine who can report matches (currently both participants can, which might lead to conflicts).
