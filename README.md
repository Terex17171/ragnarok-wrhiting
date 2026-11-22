# Ragnarok Quiz Arena — rAthena data edition

Upload **the contents** of this folder to the root of your GitHub repository. Render Blueprint runs `npm install && npm run import:rathena`, downloading rAthena YAML databases and converting them to a local `rathena-data.json` catalog. The running server does not depend on rAthena availability. If download/import fails, the build fails instead of silently using the old 60-monster dataset.

Sources: https://github.com/rathena/rathena/tree/master/db/pre-re and https://github.com/rathena/rathena/tree/master/db/re . The upstream data is open-source; review its license and attribution before redistributing. Images are still fetched from Divine Pride, so **image availability and exact visual matching are not yet verified**. Region metadata is not present in these mob database files, so all imported monsters have region `Other`: select **All regions** to access the full catalog. Item type filtering is derived from rAthena item Type.

After deploy, open `/health` to inspect the actual catalog counts and `dataSource`. The importer has not been run in this environment because outbound network access is unavailable. If Render's upstream URLs or file layout change, the build will fail visibly; inspect Render build logs.

Existing game features: multiplayer synchronized questions, auto-next, answer reveal, avatar-only player identification, randomized questions without duplicates within a match.
