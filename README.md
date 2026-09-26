# Idea Check — AI competitor analysis for any business

Enter a business → Apify researches the market → Claude writes a scored competitor analysis, recommendations and ready-to-post content → publish via webhook.

Full spec: [docs/PROJECT_SPEC.md](docs/PROJECT_SPEC.md)

## Quick start

```bash
npm run install:all
cp server/.env.example server/.env   # add ANTHROPIC_API_KEY, APIFY_TOKEN, MONGODB_URI
npm run dev                          # http://localhost:5173
```

Click **Fill with NIVAHN example** on the home page to try it with the seabuckthorn brand.

## Keys

| Variable | Where to get it |
|---|---|
| ANTHROPIC_API_KEY | console.anthropic.com → API keys |
| APIFY_TOKEN | console.apify.com → Settings → Integrations → Personal API token |
| MONGODB_URI | local MongoDB or MongoDB Atlas free cluster |
| PUBLISH_WEBHOOK_URL | optional, Make/Zapier/n8n custom webhook |

Never commit `server/.env`. Keys stay on the server; the browser never sees them.
