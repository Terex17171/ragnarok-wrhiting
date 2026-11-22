# Ragnarok Quiz Arena — Multiplayer Render Blueprint

## Deploy
1. Upload **all the contents of this folder** to the root of a GitHub repository (including `render.yaml`, `server.js`, `data.js`, `package.json`, and `public/index.html`).
2. In Render choose **New → Blueprint**, connect your GitHub repository, and approve the service.
3. Render uses `render.yaml` to create a Node Web Service. Open the generated `.onrender.com` URL.
4. Create a room, share the room code/link, and start the game.

## Features
- One synchronized question for everyone; server-controlled timer 5–60 seconds (default 10).
- Host chooses question count, typing/multiple choice, Monsters/Items, region/type, Renewal/Pre-Renewal.
- Items restricted to Pre-Renewal. 70% spelling accuracy + 30% speed, with no speed credit for a totally wrong answer.
- Random monster name/avatar, shared live scoreboard, host-controlled next question.

## Important limits
- Rooms live in process memory: restarting/sleeping the server deletes rooms. Use one server instance.
- This is a curated starter dataset, not the full RateMyServer database. Sprite URLs currently use Divine Pride; verify image licenses and accessibility before public distribution.
- Players disconnected during a match cannot rejoin until the lobby.
- Render free plan may sleep when idle.

## Local test
`npm install && npm start`, then open http://localhost:3000. Health check: `/health`.
