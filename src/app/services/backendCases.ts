import { backendBaseUrl, backendScopes } from "../authConfig";

export type BackendCase = {
  id: number;
  user_id: string;
  reason: string;
  notes: string | null;
  latitude: number;
  longitude: number;
  timestamp: number;
  chat_history: string | null;
  language: string;
  created_at: string;
  user_name: string;
};

let casesCache: BackendCase[] | null = null;
let inflightCasesPromise: Promise<BackendCase[]> | null = null;

export async function fetchBackendCases(token: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params ?? {});
  if (!search.get("limit")) {
    search.set("limit", "200");
  }

  const response = await fetch(`${backendBaseUrl}/cases?${search.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load cases (${response.status})`);
  }

  return (await response.json()) as BackendCase[];
}

export async function fetchBackendCasesOnce(token: string) {
  if (casesCache) {
    return casesCache;
  }

  if (inflightCasesPromise) {
    return inflightCasesPromise;
  }

  inflightCasesPromise = fetchBackendCases(token, { limit: "200" })
    .then((data) => {
      casesCache = data;
      return data;
    })
    .finally(() => {
      inflightCasesPromise = null;
    });

  return inflightCasesPromise;
}

export function clearBackendCasesCache() {
  casesCache = null;
  inflightCasesPromise = null;
}

export { backendScopes };
