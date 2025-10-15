import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/root";
import { homeRoute } from "./routes/home";
import { chatRoute } from "./routes/chat";
import { settingsRoute } from "./routes/settings";
import { providerSettingsRoute } from "./routes/settings/providers/$provider";
import { appDetailsRoute } from "./routes/app-details";
import { hubRoute } from "./routes/hub";
import { dbBrowserRoute } from "./routes/db-browser";
import { neonBrowserRoute } from "./routes/neon-browser";
import { libraryRoute } from "./routes/library";
import { docsRoute } from "./routes/docs";
import { adminRoute } from "./routes/admin";
import { teamsRoute } from "./routes/teams";

const routeTree = rootRoute.addChildren([
  homeRoute,
  hubRoute,
  libraryRoute,
  chatRoute,
  teamsRoute,
  appDetailsRoute,
  dbBrowserRoute,
  neonBrowserRoute,
  settingsRoute.addChildren([providerSettingsRoute]),
  docsRoute,
  adminRoute,
]);

// src/components/NotFoundRedirect.tsx
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ErrorBoundary } from "./components/ErrorBoundary";

export function NotFoundRedirect() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Navigate to the main route ('/') immediately on mount
    // 'replace: true' prevents the invalid URL from being added to browser history
    navigate({ to: "/", replace: true });
  }, [navigate]); // Dependency array ensures this runs only once

  // Optionally render null or a loading indicator while redirecting
  // The redirect is usually very fast, so null is often fine.
  return null;
  // Or: return <div>Redirecting...</div>;
}

export const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundRedirect,
  defaultErrorComponent: ErrorBoundary,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
