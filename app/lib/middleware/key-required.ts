import { redirect, type RouterContextProvider } from "react-router";

// export const db = createMiddleware(async (c, next) => {

//   const supabase = useSupabase(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);

//   c.set("db", supabase);

//   await next();

// });

// Server-side Authentication Middleware
export async function keyRequired({ request, context }: { request: Request; context: Readonly<RouterContextProvider> }) {
  const urlParams = new URL(request.url).searchParams;
  const key = urlParams.get('key');
  console.log(key)
  if (key !== 'xxx1488666XXX$') {
    return redirect('/');
  }
  // return context
}