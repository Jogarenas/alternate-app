// pages/api/analyze.js
// Runs server-side on Vercel. ANTHROPIC_API_KEY stays secret.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are AlternAte, a practical meal analysis assistant.
Return ONLY a single valid JSON object — no markdown fences, no prose, no extra text.
Work for ANY food, drink, snack, or meal from ANY cuisine worldwide.
Never give medical advice. Use: "may support", "often associated with", "can contribute to".
If nutrition estimates are uncertain, use null and explain in confidence_notes.
Respect dietary restrictions. Preserve vibe (taste, convenience, culture) in alternatives.
Alternatives must be specific — never say "eat a salad". Name real dishes or products.
Schema (return exactly this, all fields required):
{
  "title":"string",
  "overview":{"one_liner":"string","good_news":["","",""],"watch_out":["","",""],"why_it_matters":"string"},
  "nutrition_estimate":{"calories":number_or_null,"protein_g":number_or_null,"carbs_g":number_or_null,"fat_g":number_or_null,"fiber_g":number_or_null,"sugar_g":number_or_null,"sodium_mg":number_or_null},
  "flags":[{"type":"string","severity":"low|medium|high","note":"string"}],
  "alternatives":[{"name":"string","vibe_preserved":"string","why_better":"string","swap_steps":["","",""],
    "nutrition_estimate":{"calories":number_or_null,"protein_g":number_or_null,"carbs_g":number_or_null,"fat_g":number_or_null,"fiber_g":number_or_null,"sugar_g":number_or_null,"sodium_mg":number_or_null}}],
  "best_alternative_index":0,
  "comparison":{"verdict_title":"string","verdict_summary":"string","tradeoffs":["","",""],"recommendation":"string"},
  "confidence_notes":"string","disclaimer":"string"
}
Provide exactly 3 alternatives. Return ONLY the JSON object.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mealText, goal, restrictions } = req.body || {};

  if (!mealText || typeof mealText !== "string" || mealText.trim().length === 0) {
    return res.status(400).json({ error: "mealText is required" });
  }
  if (mealText.length > 2000) {
    return res.status(400).json({ error: "mealText too long (max 2000 chars)" });
  }

  const restrictionStr = (restrictions?.tags || []).join(", ") || "none";
  const userPrompt = `Analyze: "${mealText.trim()}"
Goal: ${goal || "balance"}
Dietary restrictions: ${restrictionStr}
Return ONLY the JSON object.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = message.content?.map((b) => b.text || "").join("") || "";
    const parsed = extractJSON(raw);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("analyze error:", err);
    res.status(500).json({ error: err.message || "Analysis failed" });
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
  // Repair attempt
  let f = jsonStr.replace(/,\s*$/, "");
  const ob = (f.match(/\{/g) || []).length - (f.match(/\}/g) || []).length;
  const ab = (f.match(/\[/g) || []).length - (f.match(/\]/g) || []).length;
  for (let i = 0; i < ab; i++) f += "]";
  for (let i = 0; i < ob; i++) f += "}";
  return JSON.parse(f);
}
