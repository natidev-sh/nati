import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import AdminPage from "../pages/admin";

export const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});
