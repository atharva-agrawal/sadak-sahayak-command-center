import { createBrowserRouter } from "react-router";
import { Layout } from "./Layout";
import { Dashboard } from "./pages/Dashboard";
import { CasesManagement } from "./pages/CasesManagement";
import { RevenueDashboard } from "./pages/RevenueDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "cases", Component: CasesManagement },
      { path: "revenue", Component: RevenueDashboard },
    ],
  },
]);
