import { mockCases, type ViolationCase } from "../mockCases";

export type AiInsightSeverity = "high" | "medium" | "low";

export type AiInsight = {
  id: string;
  title: string;
  message: string;
  severity: AiInsightSeverity;
  actionLabel?: string;
};

const FALLBACK_INSIGHTS: AiInsight[] = [
  {
    id: "fallback-1",
    title: "High severity watch",
    message: "Over-speeding and signal jump incidents are trending in recent records. Prioritize high-traffic junction patrols for the next shift.",
    severity: "high",
    actionLabel: "Review high severity cases",
  },
  {
    id: "fallback-2",
    title: "Field performance",
    message: "Recent challans show steady closure across zones. Keep focus on pending cases older than 24 hours to improve response time.",
    severity: "medium",
    actionLabel: "Open pending actions",
  },
  {
    id: "fallback-3",
    title: "Operations note",
    message: "Helmet and documentation violations remain frequent. A short awareness campaign near repeat hotspots can reduce repeat offenses.",
    severity: "low",
    actionLabel: "View hotspot map",
  },
];

export async function generateAiInsights(): Promise<AiInsight[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return FALLBACK_INSIGHTS;
  }

  const recentCases = [...mockCases]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 6)
    .map((item) => compactCase(item));

  const prompt = [
    "You are Sadak Sahayak AI for a police dashboard.",
    "Generate 3 to 4 short operational updates based on these latest cases.",
    "Keep each update practical and dashboard-ready.",
    "Return only valid JSON in this exact shape:",
    '[{"title":"...", "message":"...", "severity":"high|medium|low", "actionLabel":"..."}]',
    `Latest cases: ${JSON.stringify(recentCases)}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        input: [
          { role: "system", content: "You produce concise operational insights for police dashboards." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return FALLBACK_INSIGHTS;
    }

    const json = (await response.json()) as { output_text?: string };
    const text = json.output_text ?? "";
    const parsed = JSON.parse(text) as Array<{
      title?: string;
      message?: string;
      severity?: string;
      actionLabel?: string;
    }>;

    const normalized = parsed
      .slice(0, 4)
      .map((entry, index) => ({
        id: `llm-${index}`,
        title: entry.title?.trim() || "Operational update",
        message: entry.message?.trim() || "No summary available.",
        severity: normalizeSeverity(entry.severity),
        actionLabel: entry.actionLabel?.trim() || "Open case details",
      }))
      .filter((entry) => entry.message.length > 0);

    if (normalized.length === 0) {
      return FALLBACK_INSIGHTS;
    }

    return normalized;
  } catch {
    return FALLBACK_INSIGHTS;
  }
}

function compactCase(item: ViolationCase) {
  return {
    id: item.id,
    officer: item.user_name,
    violation: item.reason,
    severity: item.severity,
    status: item.status,
    location: item.location,
    createdAt: item.created_at,
  };
}

function normalizeSeverity(value?: string): AiInsightSeverity {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}
