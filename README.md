# Ragnarok Quiz Arena — RateMyServer importer edition

Upload all project files to GitHub repository root, then Render redeploys.

**Important:** This package does NOT contain the complete RateMyServer database. It includes an experimental importer (`npm run import:rms`). It tries to retrieve RateMyServer A–Z pages and only saves `rms-data.json` if at least 100 monsters and 100 items parse. RateMyServer may block automated requests or change its HTML. The current app falls back to the existing starter dataset unless `rms-data.json` is generated and included in deployment.

To try importing on a machine with network access: `npm install && npm run import:rms`. If successful, commit `rms-data.json` to GitHub and redeploy. Sprite URLs still use Divine Pride and are not validated against RateMyServer. Renewal import is experimental and not yet separated in quiz selection.

Existing multiplayer, auto next, answer reveal, avatar-only player identity, and shuffle remain unchanged.
