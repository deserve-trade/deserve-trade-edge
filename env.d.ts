// Ambient environment variable typings for Cloudflare Workers + Remix/React Router.
// Wrangler's generated `worker-configuration.d.ts` intentionally leaves Env empty unless
// you declare vars in wrangler.jsonc. We keep typings here so `wrangler types` can run
// without leaking secrets into config.

declare global {
  interface Env {
    DOMAIN: string;
    API_URL: string;
    PHANTOM_APP_ID: string;
    PHANTOM_REDIRECT_URL: string;

    // Supabase (server-side only)
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // APIs
    COINGECKO_API_KEY: string;

    // Telegram notifications
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_ADMIN_CHAT_IDS: string;
  }
}

export {};
