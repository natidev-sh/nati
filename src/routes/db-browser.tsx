import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import DbBrowserPage from "../pages/db-browser";
import { z } from "zod";

export const dbBrowserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/db-browser",
  component: DbBrowserPage,
  validateSearch: z.object({
    appId: z.number().optional(),
  }),
});
