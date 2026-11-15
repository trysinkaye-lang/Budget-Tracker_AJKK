# Our Budget — Couples Finance Tracker

A responsive, offline-first budgeting system for Kristy and Andre. Both names remain editable in **Settings**. It separates budget plans from real cash, keeps personal/shared wallets accurate, protects savings from spendable balances, and maintains a complete transaction ledger.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app starts with the ₱1,000 + ₱1,000 sample scenario. Use **Settings → Clear all data** for a blank workspace.

## Offline use

The production build includes a Progressive Web App service worker that precaches every screen and chart bundle.

```bash
npm run build
npm run preview
```

Open the printed address once, then use the browser's **Install Our Budget** option. After installation and the first successful load, the interface and locally stored data remain available without internet.

## Technology stack

- React 18 and TypeScript
- Vite 8
- Tailwind CSS 3
- Lucide React icons
- Recharts 3
- A generated service worker and Web App Manifest for offline caching and installation
- Browser localStorage for finance records
- Vitest for automated financial tests

For a future native Windows installer, Tauri 2 is the recommended wrapper because it can package the existing Vite build into a much smaller installer than Electron. SQLite can replace localStorage when durable backup and migration support are needed.

## Quality checks

```bash
npm test
npm run typecheck
npm run build
```

## Data storage

All records are stored in browser `localStorage` under `our-budget:data:v1`. There is no authentication, backend, bank integration, or cloud synchronization in this initial version.
