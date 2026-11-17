# DailySpend

A little space to keep track of where your money goes.

DailySpend is a premium, mobile-first personal expense journal. Records are saved on your device immediately, then copied to a Google Sheet you own when you connect your Google account.

## Folder structure

```
DailyExpense/
  server/                 OAuth + Google Sheets API (secrets stay here)
  src/
    components/           Dashboard, Expense, Analytics, Export, Navigation, UI
    pages/                Home, Expenses, Analytics, Settings, Add Expense
    services/             auth, sheets, sync, export
    database/indexedDB.ts local-first storage
    hooks/                useExpenses, useSync, useGoogleAccount
    types/                expense models
    utils/                currency, dates, validation
  public/icons/           PWA icons
  .env.example
```

## Installation

1. Install [Node.js 20+](https://nodejs.org/).
2. In this folder:

```bash
npm install
copy .env.example .env
npm run dev
```

On macOS/Linux use `cp .env.example .env`.

Open [http://localhost:5173](http://localhost:5173). The API runs on port 3001 and is proxied through Vite.

You can add expenses immediately. Google sync starts after OAuth is configured.

## Google Cloud OAuth setup

DailySpend never asks for your Gmail password. Tokens are stored in an **httpOnly cookie on the server**, not in frontend source or `VITE_` variables.

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or pick an existing one).
3. Enable **Google Sheets API** and **Google Drive API**.
4. APIs & Services → **OAuth consent screen**
   - User type: External (or Internal for Workspace).
   - App name: DailySpend.
   - Add your Gmail as a test user while the app is in Testing.
   - Scopes: `userinfo.email`, `userinfo.profile`, `drive.file`, `spreadsheets`.
5. APIs & Services → **Credentials** → Create credentials → **OAuth client ID**
   - Application type: **Web application**.
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3001`
   - Authorized redirect URIs:
     - `http://localhost:5173/api/auth/google/callback`
     - `http://localhost:3001/api/auth/google/callback`
   - For production, add your real origin and `https://YOUR_DOMAIN/api/auth/google/callback`.
6. Copy the client ID and client secret into `.env` (server only).
7. Set `SESSION_SECRET` to a long random string.
8. Restart `npm run dev`.
9. In DailySpend → Settings → **Connect Google Account**.

### Optional Google Picker

`GOOGLE_API_KEY` and `GOOGLE_PROJECT_NUMBER` are optional. You can still **create** a DailySpend Database spreadsheet or **paste** an existing Sheets URL.

## Google Sheets setup

After sign-in:

- **Create DailySpend Database** — creates a spreadsheet named `DailySpend Database` with an `Expenses` worksheet.
- **Connect existing spreadsheet** — paste a Sheets URL or ID your Google account can edit.

Columns:

`ID | Title | Description | Amount | Category | Date | CreatedAt | UpdatedAt`

You can open that file in Google Drive at any time. Disconnecting DailySpend does **not** delete it.

## Environment variables

See `.env.example`. Never put `GOOGLE_CLIENT_SECRET` or `SESSION_SECRET` in variables that start with `VITE_`.

```
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SESSION_SECRET=replace-with-a-long-random-string
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback
GOOGLE_API_KEY=
GOOGLE_PROJECT_NUMBER=
```

## How data stays in sync

- IndexedDB is the source of truth on the device.
- Each create, edit, or delete is queued.
- When you are online and Google is connected, the queue is sent to Sheets, then the sheet is pulled back.
- If the same record changed both locally and in Sheets, DailySpend marks a conflict instead of silently overwriting.
- Offline, you can still add expenses. They sync when the network returns.

## Deployment

1. Set production env vars on your host (Render, Railway, Fly, a VPS, etc.).
2. `GOOGLE_REDIRECT_URI` must match the Cloud Console redirect URI, for example `https://your-domain.com/api/auth/google/callback`.
3. `CLIENT_ORIGIN` should be `https://your-domain.com`.
4. Build and start:

```bash
npm install
npm run build
set NODE_ENV=production
npm start
```

On Linux: `NODE_ENV=production npm start`.

The Express server serves the Vite `dist/` folder in production and keeps OAuth on the same origin so cookies work.

## Install on a phone

**iPhone:** Safari → Share → Add to Home Screen.

**Android:** Chrome → menu → Install app / Add to Home screen.

The PWA uses standalone display, a cream theme, and an offline application shell. API calls and auth cookies are not cached as static assets.

## Scripts

| Command        | What it does                          |
| -------------- | ------------------------------------- |
| `npm run dev`  | Vite + API together                   |
| `npm run build`| Typecheck and production frontend     |
| `npm start`    | Serve API + built app                 |
