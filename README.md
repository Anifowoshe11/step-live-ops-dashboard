# STEP Network Live Ops

Vite + React dashboard for STEP Network live operations reporting.

## Firebase Authentication

The app keeps Firebase Email/Password authentication enabled.

Required Vercel environment variables:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

Optional environment variables:

```bash
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
```

## Local Development

1. Copy `.env.example` to `.env.local`.
2. Fill in the Firebase web app values from Firebase Console.
3. Enable Email/Password under Firebase Authentication -> Sign-in method.
4. Run:

```bash
npm install
npm run dev
```

`.env`, `.env.local`, and other local env files are ignored by git and should never be committed.

## Vercel Deployment

1. Import this repository into Vercel.
2. Use the Vite framework preset if Vercel asks for one.
3. Add these environment variables in Vercel Project Settings -> Environment Variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - Optional: `VITE_FIREBASE_STORAGE_BUCKET`
   - Optional: `VITE_FIREBASE_MESSAGING_SENDER_ID`
4. Redeploy after saving the variables.

The dashboard data proxy for production lives at `api/sheets.js`, which Vercel serves as `/api/sheets`.

## Build

```bash
npm run build
```
