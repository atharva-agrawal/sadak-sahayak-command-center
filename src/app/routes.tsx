import { createBrowserRouter, Navigate } from "react-router";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { Layout } from "./Layout";
import { Dashboard } from "./pages/Dashboard";
import { CasesManagement } from "./pages/CasesManagement";
import { RevenueDashboard } from "./pages/RevenueDashboard";
import { LoginPage } from "./pages/LoginPage";
import { AtmsDashboard } from "./pages/AtmsDashboard";
import { CasesProvider } from "./CasesContext";

const azureAuthEnabled = Boolean(
  import.meta.env.VITE_AZURE_CLIENT_ID && import.meta.env.VITE_AZURE_TENANT_ID,
);

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginRoute,
  },
  {
    path: "/",
    Component: ProtectedLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "cases", Component: CasesManagement },
      { path: "revenue", Component: RevenueDashboard },
      { path: "atms", Component: AtmsDashboard },
    ],
  },
]);

function LoginRoute() {
  if (!azureAuthEnabled) {
    return <Navigate to="/" replace />;
  }
  return <LoginPage />;
}

function ProtectedLayout() {
  if (!azureAuthEnabled) {
    return (
      <CasesProvider>
        <Layout />
      </CasesProvider>
    );
  }

  const { inProgress } = useMsal();

  if (inProgress !== "none") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700 dark:bg-[#050B14] dark:text-slate-200">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <AuthenticatedTemplate>
        <CasesProvider>
          <Layout />
        </CasesProvider>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <Navigate to="/login" replace />
      </UnauthenticatedTemplate>
    </>
  );
}
