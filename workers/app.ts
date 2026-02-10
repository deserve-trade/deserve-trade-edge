import type { SupabaseClient } from "@supabase/supabase-js";
import { createRequestHandler, RouterContextProvider } from "react-router";
import { cloudflareContext, dbContext } from "~/lib/context";
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
} satisfies ExportedHandler<Env>;
