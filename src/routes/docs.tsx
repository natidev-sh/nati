import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import DocsPage from "../pages/docs";
import { z } from "zod";

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsPage,
  validateSearch: z.object({
    provider: z.string().optional(),
  }),
});
