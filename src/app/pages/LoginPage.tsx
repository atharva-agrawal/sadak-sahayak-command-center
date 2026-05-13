import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

export function LoginPage() {
  const { instance } = useMsal();

  const startLogin = async () => {
    await instance.loginRedirect(loginRequest);
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
