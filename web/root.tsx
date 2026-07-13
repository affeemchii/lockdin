import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import {
  AppType,
  Provider as GadgetProvider,
} from "@gadgetinc/react-shopify-app-bridge";
import "./app.css";
import { Suspense } from "react";
import { api } from "./api";
import { AppBridgeNavigate } from "./components/AppBridgeNavigate";
import { FullPageSpinner } from "./components/FullPageSpinner";
import { ProductionErrorBoundary, DevelopmentErrorBoundary } from "gadget-server/react-router";

import type { Route } from "./+types/root";

const SHOPIFY_API_KEY = "19363d7f4de57a8eebeebaeb22c5ec8b";
const SHOPIFY_APP_BRIDGE_SRC = "https://cdn.shopify.com/shopifycloud/app-bridge.js";

export const links = () => [
  {
    rel: "stylesheet",
    href: "https://assets.gadget.dev/assets/reset.min.css"
  },
  {
    rel: "preload",
    href: "https://cdn.shopify.com/shopifycloud/polaris.js",
    as: "script"
  }
];

export const meta = () => [
  { charset: "utf-8" },
  {
    name: "viewport",
    content: "width=device-width, initial-scale=1",
  },
  {
    title: "Gadget Shopify React Router app",
  },
  {
    name: "shopify-api-key",
    suppressHydrationWarning: true,
    content: SHOPIFY_API_KEY
  },
];

export const loader = async ({ context }: Route.LoaderArgs) => {
  return { gadgetConfig: context.gadgetConfig };
};

export const Layout = ({ children }: { children: React.ReactNode; }) => {
  return (
    <html lang="en">
      <head suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              if (!document.querySelector('script[src="${SHOPIFY_APP_BRIDGE_SRC}"]')) {
                document.write('<script src="${SHOPIFY_APP_BRIDGE_SRC}" data-api-key="${SHOPIFY_API_KEY}"><\\/script>');
              }
            `,
          }}
        />
        <Meta />
        <Links />
        <script async src="https://cdn.shopify.com/shopifycloud/polaris.js" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />
      </head>
      <body>
        <Suspense fallback={<FullPageSpinner />}>
          {children}
        </Suspense>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};


export default function App({ loaderData }: Route.ComponentProps) {
  const { gadgetConfig } = loaderData;
  const location = useLocation();

  return (
    <GadgetProvider
      type={AppType.Embedded}
      shopifyApiKey={gadgetConfig.apiKeys.shopify ?? ""}
      api={api}
      location={location}
      shopifyInstallState={gadgetConfig.shopifyInstallState}
    >
      <AppBridgeNavigate />
      <Outlet />
    </GadgetProvider>
  );
}

export function HydrateFallback() {
  return <FullPageSpinner />;
}

// Default Gadget error boundary component
// This can be replaced with your own custom error boundary implementation
// For more info, checkout https://reactrouter.com/how-to/error-boundary#1-add-a-root-error-boundary
export const ErrorBoundary = process.env.NODE_ENV === "production" ? ProductionErrorBoundary : DevelopmentErrorBoundary;
