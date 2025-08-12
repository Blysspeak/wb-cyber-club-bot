# wb-cyber-club-bot

Quick start:

1. Create `.env` in project root (same level as package.json):

```
# Required
BOT_TOKEN=your_telegram_bot_token

# Optional
PORT=9001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

2. Install deps and run in dev:

```
yarn
yarn dev
```

3. Start in prod:

```
yarn start
``` 