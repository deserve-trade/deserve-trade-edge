import type { SupabaseClient } from "@supabase/supabase-js";
import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext, dbContext } from "~/lib/context";
import { useHyperTracker } from "~/lib/services/hypertracker";
// import { useApi } from "~/lib/services/api";
import { useSupabase } from "~/lib/services/supabase";

declare module "react-router" {
  export interface AppLoadContext {
    db: SupabaseClient;
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });
    context.set(dbContext, useSupabase(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY));
    return requestHandler(request, context);
  },
  async scheduled(event, env, ctx) {

    console.log("Running scheduled function");

    try {
      const hyperTracker = useHyperTracker(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.COINGECKO_API_KEY)

      const result = await hyperTracker.liquidationHeatMapPipeline('ETH')
      await hyperTracker.liquidationHeatMapChangeEventProcess('ETH', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_ADMIN_CHAT_IDS.split(','))
      console.log(result)
    } catch (error) {
      console.error(error)
    }

  }
} satisfies ExportedHandler<Env>;
