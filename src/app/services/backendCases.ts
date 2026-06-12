import { backendBaseUrl, backendScopes } from "../authConfig";

export type BackendCaseImage = {
  id: number;
  image_url: string;
  original_filename: string | null;
  content_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
};

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
  images?: BackendCaseImage[];
};

let casesCache: BackendCase[] | null = null;
let inflightCasesPromise: Promise<BackendCase[]> | null = null;

export async function fetchBackendCases(token: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params ?? {});
  if (!search.get("limit")) {
    search.set("limit", "200");
  }

  const url = `${backendBaseUrl}/cases?${search.toString()}`;
  console.log("🌐 [fetchBackendCases] Fetching:", url);
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("🚨 [fetchBackendCases] Response not OK:", response.status, text);
    throw new Error(`Failed to load cases (${response.status}): ${text}`);
  }

  const data = (await response.json()) as BackendCase[];
  console.log("📦 [fetchBackendCases] Got", data.length, "records");
  return data;
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
