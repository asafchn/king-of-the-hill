# 👑 King of the Hill Discord Bot

A robust, feature-rich "King of the Hill" bot for Discord servers. Track the King, handle challenges, record win streaks, and manage the throne with style!

## 🚀 Features

- **Challenge System**: Users can challenge the King. Best-of-3 or Best-of-5.
- **Match Reporting**: Interactive buttons for players to report "Winner" directly.
- **Auto-Revocation**: If the King doesn't accept a challenge within X hours, the throne is vacated.
- **Win Streaks**: Tracks how many times the King has defended the title.
- **Role Management**: Automatically assigns/removes the "King" role and updates nicknames with streaks (e.g., `Username [5]`).
- **Rich Visuals**: Beautiful embeds for all announcements, with optional custom server imagery.
- **Admin Controls**: Force set the King, reset the entire game, or handling manual overrides.
- **Database**: Persistent storage via SQLite (`koth.db`) ensures data survives restarts.

---

## ⚙️ Configuration (`config.json`)

The bot is fully configurable via `config.json`. Here is exactly what each parameter does:

| Parameter | Description |
| :--- | :--- |
| **`roleName`** | The **exact name** of the Discord role given to the current King. <br>_Example: `"King of the Hill"`_ |
| **`modRoleName`** | The **exact name** of the role required to run Admin commands (like `/reset`, `/setking`). <br>_Example: `"Mod"`_ |
| **`channelName`** | The **exact name** of the text channel where public announcements (New King, Streaks, Challenges) will be posted. <br>_Example: `"koth-announcements"`_ |
| **`reportChannelName`** | The **exact name** of the channel where match interactions are allowed. This keeps the main chat clean. <br>_Example: `"koth-reports"`_ |
| **`announcementImagePath`** | (Optional) An HTTP URL to an image/GIF that will appear at the bottom of announcement Embeds. Leave empty `""` to disable. |
| **`inactivityTimeoutHours`** | The number of hours the King has to **accept** a challenge before being auto-deposed for inactivity. <br>_Default: `24`_ |

---

## 🛠️ Server Setup Guide

Follow these steps to prepare your Discord server:

### 1. Create Roles
1.  Go to **Server Settings** -> **Roles**.
2.  Create a role for the King (e.g., call it `King of the Hill`).
    *   **Tip**: Make it display separately from online members!
3.  Create a role for Moderators (e.g., `Mod`).
    *   Give this role to your admins.
4.  **Important**: Ensure the **Bot's Role** is higher than the King role in the list, or the bot won't be able to assign/remove it!

### 2. Create Channels
1.  Create a text channel for announcements (e.g., `#koth-announcements`).
    *   *Permissions*: Everyone can View, Bot can Send Messages. Users usually Read Only.
2.  (Optional) Create a channel for reports/commands (e.g., `#koth-reports`).

### 3. Update `config.json`
Open the `config.json` file in this folder and update the values to match exactly what you created in steps 1 & 2.

```json
{
    "roleName": "King of the Hill",
    "modRoleName": "Mod",
    "channelName": "koth-announcements",
    "reportChannelName": "koth-reports",
    "announcementImagePath": "https://example.com/your-server-banner.png",
    "inactivityTimeoutHours": 24
}
```

### 4. Run the Bot
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Deploy commands (run this once or when you change commands):
    ```bash
    npm run deploy
    ```
3.  Start the bot:
    ```bash
    npm run dev
    ```

---

## 🎮 Commands

### Player Commands
- **/challenge**: Initiate a challenge against the current King.
- **/king**: View who is the current King and their streak.
- **/dashboard**: Open the control panel (buttons for Challenge, Stats, etc.).

### Admin Commands (Requires `modRoleName`)
- **/setking `@user`**: Forcefully crown a specific user as King (resets streak).
- **/reset**: **Nuclear option**. Wipes the entire game history, resets database, removes King role.
- **/resetchallenge**: Forcefully cancel an active challenge (if stuck).
