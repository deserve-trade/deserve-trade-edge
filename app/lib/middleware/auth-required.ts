import { redirect, type RouterContextProvider } from "react-router";
import { cloudflareContext } from "~/lib/context";

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (!part) continue;
    const [key, ...rest] = part.split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export async function authRequired({
  request,
  context,
}: {
  request: Request;
  context: Readonly<RouterContextProvider>;
}) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = getCookieValue(cookieHeader, "dt_session");
  const nextPath = new URL(request.url).pathname;

  if (!token) {
    return redirect(`/connect?next=${encodeURIComponent(nextPath)}`);
  }

  const apiUrl = context.get(cloudflareContext).env.API_URL;
  const baseUrl = apiUrl?.replace(/\/$/, "");
  if (!baseUrl) {
    return redirect(`/connect?next=${encodeURIComponent(nextPath)}`);
  }
  try {
    const response = await fetch(`${baseUrl}/auth/session`, {
      headers: {
        cookie: `dt_session=${token}`,
      },
    });

    if (!response.ok) {
      return redirect(`/connect?next=${encodeURIComponent(nextPath)}`);
    }
  } catch {
    return redirect(`/connect?next=${encodeURIComponent(nextPath)}`);
  }
}
