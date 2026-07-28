import { backendBaseUrl, backendScopes } from "../authConfig";

export type OfficerQueryStats = {
  user_id: string;
  user_name: string | null;
  total_queries: number;
  last_query_text: string;
  last_query_time: string | null;
};

export async function fetchOfficerQueryStats(token: string): Promise<OfficerQueryStats[]> {
  const url = `${backendBaseUrl}/chats/officer-queries`;
  console.log("🌐 [fetchOfficerQueryStats] Fetching:", url);
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("🚨 [fetchOfficerQueryStats] Response not OK:", response.status, text);
    throw new Error(`Failed to load officer query stats (${response.status}): ${text}`);
  }

  const data = (await response.json()) as OfficerQueryStats[];
  console.log("📦 [fetchOfficerQueryStats] Got", data.length, "officer records");
  return data;
}

export { backendScopes };
