# Orbforge

A Path of Exile–inspired, text/menu-based RPG running as a Discord bot. See
[`orbforge-design-doc.md`](./orbforge-design-doc.md) for the full game design.

## Requirements

- Node.js 18+
- A MongoDB database (local, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)
- A Discord application + bot token ([Discord Developer Portal](https://discord.com/developers/applications))

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values:
   ```
   DISCORD_TOKEN=      # Bot > Token, in the Discord Developer Portal
   CLIENT_ID=          # General Information > Application ID
   GUILD_ID=           # Optional: a server ID for instant command registration during development.
                        # Leave blank to register commands globally (can take up to ~1hr to propagate).
   MONGODB_URI=        # Your MongoDB connection string
   ```
   If using MongoDB Atlas, add your server's IP (or `0.0.0.0/0` for development) under
   Network Access, and create a database user under Database Access.
3. Invite the bot to your server with the `applications.commands` and `bot` scopes
   (Send Messages, Use Application Commands).
4. Register the slash commands (run once, and again any time command definitions change):
   ```
   npm run register
   ```
5. Start the bot:
   ```
   npm start
   ```
   For local development with auto-restart on file changes:
   ```
   npm run dev
   ```

## Testing

```
npm test
```
Runs the full suite (`node --test`) against an in-memory MongoDB replica set — no
real database or Discord connection needed.

## Process management

`index.js` handles `SIGTERM`/`SIGINT` for a graceful shutdown (closes the DB
connection, destroys the Discord client) but does not itself restart on crash.
For production, run it under a process manager, e.g. [PM2](https://pm2.keymetrics.io/):
```
npm install -g pm2
pm2 start index.js --name orbforge
```

## Project structure

- `index.js` — entrypoint: Discord client, interaction routing, process lifecycle.
- `src/discord/commands/` — one file per slash command.
- `src/discord/embeds/` — Discord embed/component builders.
- `src/game/` — game logic (combat, crafting, skill tree, maps), framework-agnostic.
- `src/models/` — Mongoose schemas.
- `src/config/` — DB connection and game-balance constants.
- `tests/` — `node:test` suites, one per subsystem.
