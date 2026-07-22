import { backendBaseUrl, backendScopes } from "../authConfig";

export type Assignment = {
  id: number;
  road_id: number;
  road_name: string;
  officer_id: string;
  officer_name: string;
  assigned_by_id: string;
  assigned_by_name: string;
  assigned_at: string;
  responded_at: string | null;
  released_at: string | null;
  status: "PENDING" | "ACTIVE" | "REJECTED" | "RELEASED" | string;
  rejection_reason: string | null;
  notes: string | null;
};

export type AssignmentListResponse = {
  assignments: Assignment[];
};

export type AssignmentCreatePayload = {
  road_id: number;
  road_name: string;
  officer_id: string;
  officer_name: string;
  assigned_by_id?: string;
  assigned_by_name?: string;
  notes?: string;
};

export async function fetchAssignments(token: string, status?: string): Promise<Assignment[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const url = `${backendBaseUrl}/assignments${query}`;
  console.log("🌐 [fetchAssignments] Fetching:", url);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("🚨 [fetchAssignments] Response not OK:", response.status, text);
    throw new Error(`Failed to load assignments (${response.status}): ${text}`);
  }

  const data = (await response.json()) as AssignmentListResponse;
  return data.assignments;
}

export async function createAssignment(token: string, payload: AssignmentCreatePayload): Promise<Assignment> {
  const url = `${backendBaseUrl}/assignments`;
  console.log("🌐 [createAssignment] Creating:", url, payload);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("🚨 [createAssignment] Response not OK:", response.status, text);
    throw new Error(`Failed to create assignment (${response.status}): ${text}`);
  }

  return (await response.json()) as Assignment;
}

export { backendScopes };
