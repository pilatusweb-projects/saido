# Saido on corporate networks

## What you see

```
Access to fetch at 'https://identitytoolkit.googleapis.com/...' has been blocked by CORS policy
```

That almost always means the **browser never got a normal response from Google** — often a **firewall, proxy, or SSL inspection** on the company network. It is usually **not** fixed by `NEXT_PUBLIC_APP_URL`.

If signup works at home but not on company Wi‑Fi, the app and Vercel config are likely fine.

## What Saido does now

1. Tries normal Firebase Auth in the browser (works at home).
2. On network/CORS failure, calls **`/api/auth/signup`** or **`/api/auth/login`** on your Vercel app (same origin, no CORS to Google from the browser for that step).
3. Vercel server talks to Google, then returns a token so the browser can finish sign-in.

You must set **`FIREBASE_SERVICE_ACCOUNT_KEY`** on Vercel for step 2 (see README).

If step 3 still fails with CORS, the network also blocks `signInWithCustomToken` — IT must whitelist Google Auth (below).

## Checklist (Firebase / Google Cloud)

### 1. Authorized domains (you are likely missing this)

Firebase Console → **Authentication** → **Settings** → **Authorized domains** → **Add domain**:

- **`saido-26.vercel.app`** ← required for Vercel; default `firebaseapp.com` / `web.app` are not enough
- `localhost`

Your screenshot shows only `localhost`, `saido-26.firebaseapp.com`, and `saido-26.web.app`. **Add `saido-26.vercel.app` now.**

### 2. API key HTTP referrers

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Browser API key → **HTTP referrers**:

```
https://saido-26.vercel.app/*
https://*.vercel.app/*
http://localhost:3000/*
```

### 3. Service account on Vercel

Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**.

Vercel → **Environment variables** → add:

- Name: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Value: entire JSON file contents (one line is OK)

Redeploy.

### 4. Test server reachability

Open: `https://saido-26.vercel.app/api/auth/network-check`

Expect: `"serverCanReachFirebaseAuth": true`

## For IT (firewall allowlist)

Allow **HTTPS outbound** from user browsers to:

| Host | Purpose |
|------|---------|
| `identitytoolkit.googleapis.com` | Firebase Auth (signup, login, tokens) |
| `securetoken.googleapis.com` | Auth tokens |
| `firestore.googleapis.com` | Database (participants + live host charts; host writes use Vercel APIs) |
| `www.googleapis.com` | Google APIs |
| `saido-26.vercel.app` | Saido app (your deployment) |

Optional: allow `*.googleapis.com` and `*.vercel.app` if policy allows.

**Do not** rely only on allowing `saido-26.vercel.app` — Auth still contacts Google APIs from the browser for sign-in tokens. **Host** create/launch/poll actions go through `saido-26.vercel.app/api/*` (no client Firestore write required). Participants still need `firestore.googleapis.com` for live join/vote.

## Quick tests

| Test | Result |
|------|--------|
| Signup on phone hotspot (same laptop) | Works → company firewall |
| `network-check` OK but signup fails | Browser blocks Google Auth |
| Signup on localhost at office | Works → add Vercel referrers / domain |
| Nothing works except VPN | Full Google API block |

## Browser extension noise

`A listener indicated an asynchronous response...` is usually a **password manager or extension**, not Saido. Try Incognito with extensions disabled.
