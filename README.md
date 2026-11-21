# SINGULAR POINT // RESEARCH TERMINAL
Setup: cp .env.local.example .env.local (add key), npm install, npm run dev. Install as an app: open in Chrome/Edge/Safari and choose Install or Add to Home Screen. Deploy: push to Vercel, set ANTHROPIC_API_KEY.
/api/channel uses an in-memory store (single instance). For Vercel/multi-instance, swap for Redis, Supabase or a WebSocket service.
iPhone: open the deployed HTTPS URL in Safari, tap Share, then Add to Home Screen. Camera needs HTTPS and Allow when prompted.
