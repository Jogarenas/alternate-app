# AlternAte — Setup & Deploy Guide

## How it works

```
Browser (React)  →  /api/analyze  →  Anthropic API (server-side)
                 →  /api/insights →  Anthropic API (server-side)
                 →  /api/compare  →  Anthropic API (server-side)
```

Your API key **never** leaves the server. The browser only calls your own `/api/*` routes.

---

## Local dev (VSCode)

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API key
```bash
cp .env.example .env.local
```
Open `.env.local` and replace the placeholder:
```
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxx
```
Get a key at https://console.anthropic.com

### 3. Run
```bash
npm run dev
```
Open http://localhost:3000 — Analyze Meal will now work.

---

## Deploy to Vercel

### Option A — Vercel CLI (fastest)
```bash
npm install -g vercel
vercel
```
When prompted, follow the steps. Then add your env variable:
```bash
vercel env add ANTHROPIC_API_KEY
# paste your key when prompted
# select: Production + Preview + Development
vercel --prod
```

### Option B — Vercel Dashboard (no CLI)
1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new → Import your repo
3. Click **Environment Variables** → add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key (starts with `sk-ant-`)
4. Click **Deploy**

That's it. Vercel auto-detects Next.js and builds correctly.

---

## Project structure

```
alternate/
├── pages/
│   ├── index.jsx          ← entire React app (single file)
│   └── api/
│       ├── analyze.js     ← meal analysis endpoint
│       ├── insights.js    ← pattern intelligence endpoint
│       └── compare.js     ← history compare verdict endpoint
├── .env.example           ← copy to .env.local, add your key
├── .env.local             ← YOUR KEY GOES HERE (gitignored)
├── .gitignore
├── next.config.js
└── package.json
```

## Important: never commit .env.local
The `.gitignore` already excludes it. Double-check before pushing.
