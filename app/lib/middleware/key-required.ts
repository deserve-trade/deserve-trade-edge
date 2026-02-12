import { redirect, type RouterContextProvider } from "react-router";

// Server-side Authentication Middleware
export async function keyRequired({ request, context }: { request: Request; context: Readonly<RouterContextProvider> }) {
  const urlParams = new URL(request.url).searchParams;
  const key = urlParams.get('key');
  console.log(key)
  if (key !== 'yourverysecretkey') {
    return redirect('/');
  }
  // return context
}