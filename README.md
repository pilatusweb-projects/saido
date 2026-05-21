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
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON — **required** for host session cookies, APIs, and corp-network auth |
| `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` | reCAPTCHA v3 site key for App Check (production) |
| `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` | Optional — local dev App Check debug token |

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

### Firebase Auth: allow your Vercel domain (required)

Firebase Console → [Authentication](https://console.firebase.google.com) → **Settings** → **Authorized domains** → **Add domain**:

- `saido-26.vercel.app` (your production URL, without `https://`)
- `localhost` (usually already there for local dev)
- Any custom domain you add later

Without this, signup/login fails with `auth/unauthorized-domain` (not always shown as CORS in the console).

### Google Cloud API key restrictions (if signup shows CORS / failed fetch)

If the API key has **HTTP referrer** restrictions, open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your **Browser key** → **Application restrictions** → **HTTP referrers** and add:

```
https://saido-26.vercel.app/*
https://*.vercel.app/*
http://localhost:3000/*
```

Or set **None** for application restrictions while testing (less secure; tighten referrers for production).

Ensure these APIs are **enabled** for project `saido-26`:

- Identity Toolkit API
- Token Service API

### Server-side auth for company networks (recommended on Vercel)

If signup works at home but shows **CORS** on the company network, add a Firebase **service account** so auth can run on Vercel (same origin) instead of only in the browser:

1. Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**
2. Vercel → **Environment variables** → `FIREBASE_SERVICE_ACCOUNT_KEY` = paste the full JSON
3. Redeploy

The app will automatically fall back to `/api/auth/signup` and `/api/auth/login` when the browser cannot reach Google.

Check: `https://saido-26.vercel.app/api/auth/network-check` → `serverCanReachFirebaseAuth: true`

Full IT allowlist and troubleshooting: [docs/CORPORATE_NETWORK.md](docs/CORPORATE_NETWORK.md)

### Signup blocked on company network (CORS / `identitytoolkit.googleapis.com`)

A **CORS error** on `identitytoolkit.googleapis.com` means the browser did not get a normal Google response (firewall/proxy/referrer block).

| Cause | What to do |
|-------|------------|
| Missing service account on Vercel | Add `FIREBASE_SERVICE_ACCOUNT_KEY` (above) |
| Domain not authorized | Add `saido-26.vercel.app` to Firebase **Authorized domains** |
| API key referrer block | Allow `https://saido-26.vercel.app/*` on the API key |
| Corporate firewall | IT must allow `identitytoolkit.googleapis.com` and related hosts ([list](docs/CORPORATE_NETWORK.md)) |

**Quick test:** signup on phone hotspot. If it works there, ask IT to unblock Google Auth APIs.

## Architecture (2026)

| Layer | Role |
|-------|------|
| **Middleware** | Protects `/dashboard` and `/session/*` — requires `__saido_session` cookie |
| **Session cookie** | After Firebase sign-in, `POST /api/auth/session` sets httpOnly cookie (14 days) |
| **Host mutations** | All create/update/delete via Admin SDK route handlers (`/api/sessions`, `/api/session/...`) |
| **Host reads** | Server Components load initial data; client `onSnapshot` for live updates when Firestore is reachable |
| **Participants** | Client Firestore on `/join/[code]` for realtime polls and votes (no login) |
| **App Check** | Optional reCAPTCHA v3 — enable in Firebase Console (monitoring mode first) |

### Firebase App Check setup

1. Firebase Console → **App Check** → register web app with **reCAPTCHA v3**
2. Add `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` to Vercel
3. Enable enforcement for **Authentication** and **Firestore** in **monitoring** mode first
4. For local dev: create a debug token in App Check → add `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN`

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
| `/session/[id]` | Host control — polls, QR, live chart, export (cookie + middleware) |
| `/session/[id]/present` | Presenter mode — fullscreen projection, live chart, join QR/code, launch/close (cookie + middleware) |
| `/go/[id]` | QR redirect → `/join/{code}` |
| `/join/[code]` | Participant join and vote |

## Test checklist

- [ ] Sign up, login → `__saido_session` cookie set (DevTools → Application → Cookies)
- [ ] `/dashboard` without cookie redirects to `/login`
- [ ] Logout clears cookie; protected routes redirect to login
- [ ] Create session → code and QR render correct join URL (`/go/{id}` in QR)
- [ ] Create multiple polls; launch one → only one active
- [ ] Participant joins without login; votes once; duplicate blocked
- [ ] Second browser/device: chart updates within ~1 second
- [ ] Close poll → participant sees waiting state
- [ ] Presenter mode opens in new tab; lobby shows code + QR; launch/close from presenter updates chart live
- [ ] Presenter fullscreen (F) and Exit return to control panel
- [ ] Export CSV matches vote counts
- [ ] Mobile layout readable for join and chart

## License

MIT
