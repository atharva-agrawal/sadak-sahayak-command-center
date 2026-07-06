import { mockCases, type ViolationCase } from "../mockCases";

export type AiInsightSeverity = "high" | "medium" | "low";

export type AiInsight = {
  id: string;
  title: string;
  message: string;
  severity: AiInsightSeverity;
  actionLabel?: string;
};

export type AiInsightsResult = {
  insights: AiInsight[];
  source: "ai" | "fallback";
  reason: string;
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

export async function generateAiInsights(): Promise<AiInsightsResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.info("[SadakSahayakAI] No VITE_OPENAI_API_KEY found. Using static fallback insights.");
    return { insights: FALLBACK_INSIGHTS, source: "fallback", reason: "Missing API key" };
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
    console.info("[SadakSahayakAI] OpenAI key found. Requesting AI-generated insights...");
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
      console.warn(
        `[SadakSahayakAI] OpenAI request failed with status ${response.status}. Using static fallback insights.`,
      );
      return { insights: FALLBACK_INSIGHTS, source: "fallback", reason: `API status ${response.status}` };
    }

    const json = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        type?: string;
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      }>;
      [key: string]: unknown;
    };
    const text = extractResponseText(json);
    console.log("[SadakSahayakAI] Raw responses payload:", json);
    console.log(
      `[SadakSahayakAI] output_text length: ${text.length} characters`
    );

    let parsed: Array<{
      title?: string;
      message?: string;
      severity?: string;
      actionLabel?: string;
    }>;

    const parsedText = extractJsonArray(text);
    if (!parsedText) {
      console.warn("[SadakSahayakAI] Could not extract JSON array from OpenAI response. Using static fallback insights.");
      return { insights: FALLBACK_INSIGHTS, source: "fallback", reason: "Invalid JSON from AI" };
    }
    console.log("[SadakSahayakAI] Extracted JSON candidate:", parsedText.slice(0, 1200));

    try {
      parsed = JSON.parse(parsedText) as Array<{
        title?: string;
        message?: string;
        severity?: string;
        actionLabel?: string;
      }>;
    } catch {
      console.warn("[SadakSahayakAI] OpenAI response was not valid JSON. Using static fallback insights.");
      return { insights: FALLBACK_INSIGHTS, source: "fallback", reason: "Invalid JSON from AI" };
    }

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
      console.warn("[SadakSahayakAI] OpenAI returned empty insights. Using static fallback insights.");
      return { insights: FALLBACK_INSIGHTS, source: "fallback", reason: "Empty AI output" };
    }

    console.info(`[SadakSahayakAI] Loaded ${normalized.length} AI-generated insight(s) from OpenAI.`);
    return { insights: normalized, source: "ai", reason: "AI-generated" };
  } catch (error) {
    console.error("[SadakSahayakAI] Error while generating AI insights. Using static fallback insights.", error);
    return { insights: FALLBACK_INSIGHTS, source: "fallback", reason: "Request error" };
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

function extractJsonArray(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Common case: plain JSON array
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed;
  }

  // Handle markdown fenced output
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    const fenced = fenceMatch[1].trim();
    if (fenced.startsWith("[") && fenced.endsWith("]")) {
      return fenced;
    }
  }

  // Last resort: pick first JSON-array-like span
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1).trim();
  }

  return null;
}

function extractResponseText(response: {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
}): string {
  if (response.output_text && response.output_text.trim()) {
    return response.output_text;
  }

  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n").trim();
}
