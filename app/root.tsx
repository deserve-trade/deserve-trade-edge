import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { TooltipProvider } from "./components/ui/tooltip";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AddressType, darkTheme, PhantomProvider } from "@phantom/react-sdk";
import { cloudflareContext } from "./lib/context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
    },
  },
})

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Inter:wght@400;600;700;900&display=swap",
  },
];

export function loader({ context }: Route.LoaderArgs) {
  const env = context.get(cloudflareContext).env;
  return {
    apiUrl: env.API_URL,
    phantomAppId: env.PHANTOM_APP_ID,
    phantomRedirectUrl: env.PHANTOM_REDIRECT_URL || `${env.DOMAIN}/auth/callback`,
  };
}


export function Layout({ children }: { children: React.ReactNode }) {
  const { apiUrl, phantomAppId, phantomRedirectUrl } = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ff6188" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="LacomLeague" />
        <meta name="application-name" content="deserve" />
        <meta property="og:site_name" content="deserve" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <PhantomProvider
            config={{
              providers: ["google", "apple", "injected", "deeplink"],
              appId: phantomAppId,
              addressTypes: [AddressType.solana],
              authOptions: {
                redirectUrl: phantomRedirectUrl,
              },
            }}
            theme={darkTheme}
            appIcon="/favicon.png"
            appName="deserve.trade"
          >
            <TooltipProvider>
              {children}
            </TooltipProvider>
          </PhantomProvider>
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
