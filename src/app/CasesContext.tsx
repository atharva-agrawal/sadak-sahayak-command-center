import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { backendScopes, fetchBackendCases, type BackendCase } from "./services/backendCases";
import { acquireBackendAccessToken } from "./services/authToken";

type CasesContextType = {
  cases: BackendCase[];
  loadError: string;
  isLoading: boolean;
};

const CasesContext = createContext<CasesContextType | undefined>(undefined);

export function CasesProvider({ children }: { children: ReactNode }) {
  const { instance, accounts } = useMsal();
  const [cases, setCases] = useState<BackendCase[]>([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCases = async () => {
      try {
        console.log("🌍 [CasesProvider] Fetching cases globally (once per app load)...");
        const accessToken = await acquireBackendAccessToken(instance, accounts, backendScopes);
        if (!accessToken) {
          setIsLoading(false);
          return;
        }
        const data = await fetchBackendCases(accessToken, { limit: "200" });
        console.log("✅ [CasesProvider] Received", data.length, "cases - stored globally");
        setCases(data);
        setLoadError("");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("❌ [CasesProvider] Error:", message);
        setLoadError(`Unable to load cases: ${message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadCases();
  }, []);

  return (
    <CasesContext.Provider value={{ cases, loadError, isLoading }}>
      {children}
    </CasesContext.Provider>
  );
}

export function useCases() {
  const context = useContext(CasesContext);
  if (!context) {
    throw new Error("useCases must be used within CasesProvider");
  }
  return context;
}
