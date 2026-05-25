import { InteractionRequiredAuthError, type IPublicClientApplication, type AccountInfo } from "@azure/msal-browser";

export async function acquireBackendAccessToken(
  instance: IPublicClientApplication,
  accounts: AccountInfo[],
  scopes: string[],
) {
  const account = accounts[0];
  if (!account) {
    console.error("❌ [acquireBackendAccessToken] No signed-in account");
    throw new Error("No signed-in account available.");
  }

  if (scopes.length === 0) {
    console.error("❌ [acquireBackendAccessToken] No scopes configured");
    throw new Error("Missing backend API scope. Set VITE_AZURE_API_SCOPE in .env.local.");
  }

  try {
    console.log("🔑 [acquireBackendAccessToken] Acquiring token silently...");
    const tokenResponse = await instance.acquireTokenSilent({
      account,
      scopes,
    });
    console.log("✅ [acquireBackendAccessToken] Token acquired:", tokenResponse.accessToken.slice(0, 20) + "...");
    return tokenResponse.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      console.warn("⚠️  [acquireBackendAccessToken] InteractionRequired - redirecting to login");
      await instance.acquireTokenRedirect({ account, scopes });
      return "";
    }

    const message = error instanceof Error ? error.message : "Unknown token error";
    console.error("❌ [acquireBackendAccessToken] Error:", message);
    throw new Error(`Token acquisition failed: ${message}`);
  }
}
