// pages/api/insights.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are AlternAte's pattern intelligence engine.
Analyze the user's recent meal history and return ONLY a single valid JSON object.
No markdown. No prose. No medical claims. Use "may support", "often associated with".
Never diagnose. Be encouraging and practical.
Schema:
{
  "title":"string",
  "biggest_pattern":{"headline":"string","detail":"string"},
  "wins":["string","string","string"],
  "risks":["string","string","string"],
  "high_leverage_change":{"headline":"string","detail":"string"},
  "challenges":[
    {"id":"c1","text":"string","why":"string"},
    {"id":"c2","text":"string","why":"string"},
    {"id":"c3","text":"string","why":"string"}
  ],
  "confidence_notes":"string",
  "disclaimer":"string"
}
Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { goal, restrictions, analyses } = req.body || {};

  if (!analyses || analyses.length < 3) {
    return res.status(400).json({ error: "Need at least 3 analyses" });
  }

  const restrictionStr = (restrictions?.tags || []).join(", ") || "none";
  const userPrompt = `Goal: ${goal || "balance"}
Restrictions: ${restrictionStr}
Recent meals (newest first):
${JSON.stringify(analyses, null, 2)}
Return ONLY the JSON.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content?.map((b) => b.text || "").join("") || "";
    res.status(200).json(extractJSON(raw));
  } catch (err) {
    console.error("insights error:", err);
    res.status(500).json({ error: err.message || "Insights failed" });
  }
}

function extractJSON(str) {
  const start = str.indexOf("{");
  if (start === -1) throw new Error("No JSON in response");
  let depth = 0, end = -1;
  for (let i = start; i < str.length; i++) {
    if (str[i] === "{") depth++;
    else if (str[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const jsonStr = end > -1 ? str.slice(start, end + 1) : str.slice(start);
  try { return JSON.parse(jsonStr); } catch (_) {}
  let f = jsonStr.replace(/,\s*$/, "");
  const ob = (f.match(/\{/g) || []).length - (f.match(/\}/g) || []).length;
  const ab = (f.match(/\[/g) || []).length - (f.match(/\]/g) || []).length;
  for (let i = 0; i < ab; i++) f += "]";
  for (let i = 0; i < ob; i++) f += "}";
  return JSON.parse(f);
}
