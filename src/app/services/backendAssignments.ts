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
  /** DSS-computed severity (HIGH / MEDIUM / LOW) — sent in FCM notification body */
  severity?: string;
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
  console.log("🌐 [createAssignment] POSTing to:", url);
  console.log("📦 [createAssignment] Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 [createAssignment] Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("🚨 [createAssignment] Server error response:", response.status, text);
      throw new Error(`Failed to create assignment (${response.status}): ${text}`);
    }

    const createdAssignment = (await response.json()) as Assignment;
    console.log("🎉 [createAssignment] Assignment successfully created on server:", createdAssignment);
    return createdAssignment;
  } catch (err) {
    console.error("💥 [createAssignment] Fetch error:", err);
    throw err;
  }
}

export type AssignmentStatusUpdatePayload = {
  status: "PENDING" | "ACTIVE" | "REJECTED" | "RELEASED" | string;
  rejection_reason?: string;
  notes?: string;
};

export async function updateAssignmentStatus(
  token: string,
  assignmentId: number,
  payload: AssignmentStatusUpdatePayload
): Promise<Assignment> {
  const url = `${backendBaseUrl}/assignments/${assignmentId}/status`;
  console.log(`🌐 [updateAssignmentStatus] PATCHing to ${url}:`, payload);

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 [updateAssignmentStatus] Response Status:", response.status, response.statusText);

    if (!response.ok) {
      const text = await response.text();
      console.error("🚨 [updateAssignmentStatus] Server error response:", response.status, text);
      throw new Error(`Failed to update assignment status (${response.status}): ${text}`);
    }

    const updatedAssignment = (await response.json()) as Assignment;
    console.log("🎉 [updateAssignmentStatus] Status successfully updated on server:", updatedAssignment);
    return updatedAssignment;
  } catch (err) {
    console.error("💥 [updateAssignmentStatus] Fetch error:", err);
    throw err;
  }
}

export { backendScopes };

