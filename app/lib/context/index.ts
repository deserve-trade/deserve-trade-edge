import { createContext } from "react-router";
// import type { User } from "~/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dbContext = createContext<SupabaseClient>();

export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();


// export const apiContext = createContext<{ get<T>(url: string, params?: any): Promise<T | any> }>();