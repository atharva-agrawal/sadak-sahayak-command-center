import { useState } from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { backendBaseUrl, backendScopes, loginRequest } from "../authConfig";

export function LoginPage() {
  const { instance, accounts } = useMsal();
  const [testMessage, setTestMessage] = useState("");

  const startLogin = async () => {
    await instance.loginRedirect(loginRequest);
  };

  const testBackendAuth = async () => {
    const account = accounts[0];
    if (!account) {
      setTestMessage("No signed-in account found.");
      return;
    }

    if (backendScopes.length === 0) {
      setTestMessage("Set VITE_AZURE_API_SCOPE in .env.local first.");
      return;
    }

    try {
      const tokenResponse = await instance.acquireTokenSilent({
        account,
        scopes: backendScopes,
      });

      const authCheckResponse = await fetch(`${backendBaseUrl}/auth-check`, {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!authCheckResponse.ok) {
        const text = await authCheckResponse.text();
        setTestMessage(`Stage 1 failed (token verify ${authCheckResponse.status}): ${text.slice(0, 200)}`);
        return;
      }

      const casesResponse = await fetch(`${backendBaseUrl}/cases?limit=6`, {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      });

      if (!casesResponse.ok) {
        const text = await casesResponse.text();
        setTestMessage(`Stage 1 passed. Stage 2 failed (/cases ${casesResponse.status}): ${text.slice(0, 200)}`);
        return;
      }

      const data = (await casesResponse.json()) as unknown[];
      setTestMessage(`Stage 1 passed. Stage 2 passed. Received ${data.length} case records.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setTestMessage(`Token/API test failed: ${message}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-[#050B14]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-[#0A1222]">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Sadak Sahayak Command Center</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Sign in with your Azure AD account to access the dashboard.
        </p>

        <AuthenticatedTemplate>
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            You are signed in. Continue to dashboard.
          </p>
          <a
            href="/"
            className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Open Dashboard
          </a>
          <button
            type="button"
            onClick={testBackendAuth}
            className="mt-3 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Test Backend Auth
          </button>
          {testMessage ? (
            <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {testMessage}
            </p>
          ) : null}
        </AuthenticatedTemplate>

        <UnauthenticatedTemplate>
          <button
            type="button"
            onClick={startLogin}
            className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Sign in with Microsoft
          </button>
        </UnauthenticatedTemplate>
      </div>
    </div>
  );
}
