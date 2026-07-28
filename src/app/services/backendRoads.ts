import { backendBaseUrl, backendScopes } from "../authConfig";

export type MonitoredRoad = {
  id: number;
  name: string;
  description: string | null;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  priority_weight: number;
};

export async function fetchMonitoredRoads(token: string): Promise<MonitoredRoad[]> {
  const url = `${backendBaseUrl}/roads`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to load monitored roads (${response.status}): ${text}`);
  }
  return (await response.json()) as MonitoredRoad[];
}

export { backendScopes };
