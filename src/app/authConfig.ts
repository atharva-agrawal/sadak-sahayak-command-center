import { type Configuration, LogLevel } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID ?? "";
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID ?? "";
const apiScope = import.meta.env.VITE_AZURE_API_SCOPE ?? "";

export const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:8000";
export const backendScopes = apiScope ? [apiScope] : [];

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: tenantId ? `https://login.microsoftonline.com/${tenantId}` : undefined,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      piiLoggingEnabled: false,
      loggerCallback: () => undefined,
    },
  },
};

export const loginRequest = {
  scopes: backendScopes.length > 0 ? backendScopes : ["User.Read"],
};
