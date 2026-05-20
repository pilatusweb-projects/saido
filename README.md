# Saido

Real-time audience engagement platform — live polls, QR join, and instant charts. Built with Next.js and Firebase.

## Features

- **Host authentication** — Email/password signup and login (Firebase Auth)
- **Session management** — Create sessions with unique 6-character join codes
- **QR codes** — Participants scan to join `/join/[code]`
- **Live polling** — Multiple choice polls; launch/close; one active poll per session
- **Real-time results** — Firestore `onSnapshot` + Chart.js bar charts
- **Participant flow** — No login required; optional name; one vote per poll
- **CSV export** — Download poll results and raw responses

## Tech stack

- Next.js (App Router) + React + Tailwind CSS
- Firebase Auth + Firestore
- react-chartjs-2, qrcode.react
- Deploy frontend to [Vercel](https://vercel.com)

## Getting started

### 1. Firebase project

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication → Email/Password**
3. Create a **Firestore** database (production mode)
4. Register a **Web app** and copy the config values

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` | From Firebase web app settings |
| `NEXT_PUBLIC_APP_URL` | App URL for QR codes (`http://localhost:3000` locally) |

### 3. Firestore rules and indexes

The Firebase CLI does **not** work on Node.js 24+ or 25 (you may see `SlowBuffer.prototype` errors). Use **Node 22** (project includes `.nvmrc`):

```bash
nvm install 22
nvm use 22
npm install
npm run firebase -- login
npm run firebase -- use --add   # select your Firebase project
npm run deploy:firestore
```

Or without a global install:

```bash
npx firebase-tools@14 login
npx firebase-tools@14 use --add
npx firebase-tools@14 deploy --only firestore:rules,firestore:indexes
```

**Alternative:** Paste [`firestore.rules`](firestore.rules) and [`firestore.indexes.json`](firestore.indexes.json) manually in Firebase Console → Firestore → Rules / Indexes.

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Hosting: Vercel + Firebase (no paid plan required)

| Service | Role | Paid plan? |
|---------|------|------------|
| **Vercel** | Hosts the Next.js app (UI) | Free tier is enough |
| **Firebase** | Auth + Firestore only | **Spark (free)** is enough |

You do **not** need Firebase Hosting, Blaze/billing, or a paid Firebase plan for Saido.  
`firebase deploy` in this repo only uploads **Firestore rules and indexes** — that works on the free Spark plan (as you already did).

Ignore upgrade prompts for Firebase App Hosting or Blaze unless you add paid features later.

## Deploy to Vercel

### Option A — GitHub (recommended)

1. Push this repo to GitHub (do **not** commit `.env.local`).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (auto-detected).
4. **Environment variables** — copy every key from `.env.local`:

   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_APP_URL` → set after first deploy, e.g. `https://your-project.vercel.app`

5. Click **Deploy**.
6. After deploy, set `NEXT_PUBLIC_APP_URL` to your real Vercel URL and **Redeploy** (so QR codes point to production).

### Option B — Vercel CLI

```bash
npx vercel login
npx vercel link
npx vercel env pull   # optional: pull remote env
# Add env vars in Vercel dashboard, then:
npx vercel --prod
```

### Firebase Auth: allow your Vercel domain

Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add:

- `your-project.vercel.app`
- Any custom domain you use

Without this, login may fail in production.

## Project structure

```
app/              # Routes (home, auth, dashboard, session, join)
components/       # UI, auth, session, poll, charts
hooks/            # usePollResults
lib/              # Firebase, Firestore helpers, export, codes
types/            # TypeScript interfaces
firestore.rules   # Security rules
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — create session / join by code |
| `/login`, `/signup` | Host authentication |
| `/dashboard` | List and create sessions (protected) |
| `/session/[id]` | Host control — polls, QR, live chart, export |
| `/join/[code]` | Participant join and vote |

## Test checklist

- [ ] Sign up, login, logout; session persists on refresh
- [ ] Create session → code and QR render correct join URL
- [ ] Create multiple polls; launch one → only one active
- [ ] Participant joins without login; votes once; duplicate blocked
- [ ] Second browser/device: chart updates within ~1 second
- [ ] Close poll → participant sees waiting state
- [ ] Export CSV matches vote counts
- [ ] Mobile layout readable for join and chart

## License

MIT
