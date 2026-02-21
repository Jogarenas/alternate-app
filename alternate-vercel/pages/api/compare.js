// pages/api/compare.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are AlternAte's comparison engine.
Compare two meal analyses and return ONLY a single valid JSON object.
No markdown. No medical claims.
Schema:
{"verdict_title":"string","verdict_summary":"string","tradeoffs":["","",""],"recommendation":"string","confidence_notes":"string","disclaimer":"string"}
Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { analysisA, analysisB, goal, restrictions } = req.body || {};
  if (!analysisA || !analysisB) return res.status(400).json({ error: "Both analyses required" });

  const restrictionStr = (restrictions?.tags || []).join(", ") || "none";
  const userPrompt = `Goal: ${goal || "balance"}\nRestrictions: ${restrictionStr}
Meal A: ${JSON.stringify({ title: analysisA.result?.title, nutrition: analysisA.result?.nutrition_estimate, flags: analysisA.result?.flags })}
Meal B: ${JSON.stringify({ title: analysisB.result?.title, nutrition: analysisB.result?.nutrition_estimate, flags: analysisB.result?.flags })}
Return ONLY the JSON.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content?.map((b) => b.text || "").join("") || "";
    res.status(200).json(extractJSON(raw));
  } catch (err) {
    console.error("compare error:", err);
    res.status(500).json({ error: err.message || "Compare failed" });
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
