import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import TeamViewPage from "../pages/team-view";

export const teamViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/teams/$teamId",
  component: TeamViewPage,
});
