# DermoAI — Frontend

Next.js 16 (App Router) frontend for the DermoAI clinical decision-support system.

Full project documentation, setup instructions, screenshots, and analysis are in the [root README](../README.md).

## Quick start

```bash
npm install   # or pnpm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

```bash
npm run dev   # or pnpm dev  →  http://localhost:3000
npm run build
npm run lint
```

**Live deployment:** https://dermo.vercel.app
