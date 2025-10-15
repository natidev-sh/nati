import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import TeamsPage from "../pages/teams";

export const teamsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams",
  component: TeamsPage,
});
