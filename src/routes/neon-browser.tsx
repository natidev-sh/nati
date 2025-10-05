import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import NeonBrowserPage from "../pages/neon-browser";
import { z } from "zod";

export const neonBrowserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/neon-browser",
  component: NeonBrowserPage,
  validateSearch: z.object({
    appId: z.number().optional(),
  }),
});
