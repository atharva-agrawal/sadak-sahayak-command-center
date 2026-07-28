import { backendBaseUrl, backendScopes } from "../authConfig";

export type BackendLocation = {
  id: number;
  user_id: string;
  user_name: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  recorded_at: string;
};

export type LocationListResponse = {
  locations: BackendLocation[];
};

export async function fetchBackendLocations(token: string): Promise<BackendLocation[]> {
  const url = `${backendBaseUrl}/location/all`;
  console.log("🌐 [fetchBackendLocations] Fetching:", url);
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("🚨 [fetchBackendLocations] Response not OK:", response.status, text);
    throw new Error(`Failed to load locations (${response.status}): ${text}`);
  }

  const data = (await response.json()) as LocationListResponse;
  console.log("📦 [fetchBackendLocations] Got", data.locations.length, "records");
  return data.locations;
}

export { backendScopes };
