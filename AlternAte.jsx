import { useState, useEffect, useRef, useCallback } from "react";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --color-base: #faf7f2;
      --color-base-dark: #f2ede4;
      --color-base-deeper: #e8e0d0;
      --color-ink: #1c1814;
      --color-ink-secondary: #6b6057;
      --color-ink-faint: #b8ae9f;
      --color-botanical: #5a7a52;
      --color-botanical-light: #8aab80;
      --color-botanical-wash: #d6e8d0;
      --color-highlight: #d4622a;
      --color-highlight-light: #e8895a;
      --color-highlight-wash: #fae8dc;
      --color-calm: #6a8fa8;
      --color-calm-light: #9bbdd4;
      --color-calm-wash: #daeaf5;
      --color-flag-low: #c9a227;
      --color-flag-medium: #d4622a;
      --color-flag-high: #b83232;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-body: 'DM Sans', sans-serif;
      --font-mono: 'DM Mono', monospace;
      --radius-card: 14px;
      --radius-pill: 9999px;
      --shadow-card: 0 2px 16px rgba(28,24,20,0.08), 0 1px 4px rgba(28,24,20,0.04);
      --shadow-card-hover: 0 8px 32px rgba(28,24,20,0.12), 0 2px 8px rgba(28,24,20,0.06);
      --transition-smooth: cubic-bezier(0.16, 1, 0.3, 1);
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: var(--font-body);
      background-color: var(--color-base);
      color: var(--color-ink);
      font-size: 15px;
      line-height: 1.6;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Grain texture overlay */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.028;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      background-size: 200px 200px;
    }

    /* ── Ambient ribbon animation ── */
    @keyframes ribbonShift {
      0%   { transform: translateX(-8px) scaleX(1); }
      33%  { transform: translateX(5px) scaleX(1.03); }
      66%  { transform: translateX(-3px) scaleX(0.98); }
      100% { transform: translateX(-8px) scaleX(1); }
    }
    @keyframes segPulse {
      0%, 100% { opacity: 0.12; }
      50%       { opacity: 0.22; }
    }
    @keyframes dotDrift {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(22px, 10px); }
    }
    @keyframes ribbonFill {
      from { width: 0; opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes spinDots {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40%            { transform: scale(1); opacity: 1; }
    }
    @keyframes expand {
      from { width: 140px; }
      to   { width: 220px; }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-4px); }
      80% { transform: translateX(4px); }
    }
    @keyframes cardFlipIn {
      from { opacity: 0; transform: translateY(24px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes resultExpand {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 4000px; }
    }

    /* Flip card */
    .flip-card { perspective: 1000px; cursor: pointer; }
    .flip-card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      transition: transform 0.45s cubic-bezier(0.16,1,0.3,1);
      transform-style: preserve-3d;
    }
    .flip-card.flipped .flip-card-inner { transform: rotateY(180deg); }
    .flip-card-front, .flip-card-back {
      position: absolute;
      inset: 0;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
      border-radius: var(--radius-card);
    }
    .flip-card-back { transform: rotateY(180deg); }

    /* Perforated edge */
    .perforated-left {
      border-left: 2px dashed color-mix(in srgb, var(--color-botanical) 40%, transparent);
    }
    .perforated-bottom {
      border-bottom: 2px dashed color-mix(in srgb, var(--color-botanical) 30%, transparent);
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: var(--color-base-dark); }
    ::-webkit-scrollbar-thumb { background: var(--color-ink-faint); border-radius: 3px; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `}</style>
);

// ─── NUTRIENT RIBBON ──────────────────────────────────────────────────────────
const NutrientRibbon = ({ macros, score, size = "full", animated = true }) => {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    if (animated) { const t = setTimeout(() => setFilled(true), 80); return () => clearTimeout(t); }
    else setFilled(true);
  }, [animated]);

  const total = macros ? (macros.protein_g || 0) * 4 + (macros.carbs_g || 0) * 4 + (macros.fat_g || 0) * 9 : 0;
  const protPct = total > 0 ? ((macros.protein_g || 0) * 4 / total) * 100 : 33;
  const carbPct = total > 0 ? ((macros.carbs_g || 0) * 4 / total) * 100 : 34;
  const fatPct  = total > 0 ? ((macros.fat_g || 0)  * 9 / total) * 100 : 33;

  const heights = { full: 14, mini: 6, hero: 10 };
  const h = heights[size] || 14;
  const displayScore = score ?? (macros ? Math.round(Math.min(100, Math.max(0, 40 + protPct * 0.5 + (100 - carbPct) * 0.2))) : null);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{
        flex: 1, height: h, borderRadius: 9999, overflow: "hidden",
        background: "color-mix(in srgb, var(--color-ink-faint) 30%, transparent)",
        display: "flex"
      }}>
        {[
          { pct: protPct, color: "var(--color-botanical)", delay: 0 },
          { pct: carbPct, color: "var(--color-calm)", delay: 80 },
          { pct: fatPct,  color: "var(--color-highlight-light)", delay: 160 },
        ].map((seg, i) => (
          <div key={i} style={{
            height: "100%",
            width: filled ? `${seg.pct}%` : "0%",
            background: seg.color,
            transition: filled ? `width 0.7s ${seg.delay}ms var(--transition-smooth)` : "none",
            opacity: 0.85,
          }} />
        ))}
      </div>
      {size !== "mini" && displayScore !== null && (
        <div style={{
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
          background: "color-mix(in srgb, var(--color-botanical) 15%, transparent)",
          color: "var(--color-botanical)", padding: "2px 8px", borderRadius: 9999,
          whiteSpace: "nowrap", minWidth: 38, textAlign: "center"
        }}>
          {displayScore}
        </div>
      )}
    </div>
  );
};

// ─── AMBIENT RIBBON (hero background) ─────────────────────────────────────────
const AmbientRibbons = () => (
  <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
    {[
      { top: "18%", delay: 0, w1: 42, w2: 35, w3: 23 },
      { top: "42%", delay: 2.5, w1: 28, w2: 45, w3: 27 },
      { top: "68%", delay: 5, w1: 38, w2: 28, w3: 34 },
      { top: "85%", delay: 1.5, w1: 20, w2: 50, w3: 30 },
    ].map((r, i) => (
      <div key={i} style={{
        position: "absolute", top: r.top, left: "-5%", width: "110%", height: 10,
        borderRadius: 9999, display: "flex", overflow: "hidden",
        animation: `ribbonShift ${8 + i * 1.5}s ease-in-out infinite`,
        animationDelay: `${r.delay}s`,
        animationName: "ribbonShift, segPulse",
        opacity: 0.14,
      }}>
        {[
          { w: r.w1, c: "var(--color-botanical)" },
          { w: r.w2, c: "var(--color-calm)" },
          { w: r.w3, c: "var(--color-highlight)" },
        ].map((s, j) => (
          <div key={j} style={{ width: `${s.w}%`, background: s.c, height: "100%" }} />
        ))}
      </div>
    ))}
    {/* dot grid drift */}
    <svg style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06,
      animation: "dotDrift 22s ease-in-out infinite alternate"
    }}>
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="var(--color-ink)" />
        </pattern>
      </defs>
      <rect width="200%" height="200%" fill="url(#dotgrid)" />
    </svg>
  </div>
);

// ─── DEMO DATA ────────────────────────────────────────────────────────────────
const DEMO_RESULT = {
  title: "Beef Ramen Bowl",
  summary: "A comforting, sodium-rich bowl that can be balanced with lighter protein and vegetable additions.",
  macro_estimate: { calories: 620, protein_g: 28, carbs_g: 72, fat_g: 22 },
  flags: [
    { type: "Sodium", severity: "high", note: "Traditional ramen broth is often very high in sodium, worth monitoring." },
    { type: "Refined noodles", severity: "low", note: "Standard ramen noodles are refined wheat; whole-grain or soba adds fiber." },
    { type: "Saturated fat", severity: "medium", note: "Pork-based broth contributes notable saturated fat to the overall meal." }
  ],
  alternatives: [
    {
      name: "Miso Ramen with Tofu & Extra Veg",
      why: "Miso broth is lower in saturated fat, and tofu adds protein with less cholesterol than pork-based broth.",
      swap_steps: ["Replace pork broth with low-sodium miso paste dissolved in dashi", "Swap beef for firm tofu, lightly pan-seared", "Add bok choy and shiitake mushrooms for volume"],
      macro_estimate: { calories: 480, protein_g: 26, carbs_g: 62, fat_g: 14 }
    },
    {
      name: "Soba Noodle Bowl with Poached Egg",
      why: "Buckwheat soba offers more fiber and a lower glycemic index while keeping the warm noodle-bowl experience.",
      swap_steps: ["Use cold-brew dashi (kombu + bonito) as a lighter base", "Substitute 100% buckwheat soba for ramen noodles", "Keep soft-boiled egg and nori; add thinly sliced cucumber"],
      macro_estimate: { calories: 420, protein_g: 22, carbs_g: 58, fat_g: 11 }
    },
    {
      name: "Chicken Ramen with Zucchini Noodle Blend",
      why: "Blending half ramen with zucchini noodles cuts carbs while retaining the slurpable texture you love.",
      swap_steps: ["Use clear chicken broth with ginger and garlic instead of tonkotsu", "Blend 50% ramen noodles with 50% spiralized zucchini", "Top with shredded poached chicken, the egg, and nori"],
      macro_estimate: { calories: 390, protein_g: 34, carbs_g: 38, fat_g: 10 }
    }
  ],
  confidence_notes: "Macro estimates are approximate based on typical restaurant serving sizes. Homemade versions may vary significantly."
};

// ─── GOAL OPTIONS ─────────────────────────────────────────────────────────────
const GOALS = [
  { id: "balance", label: "Balance" },
  { id: "more_protein", label: "More Protein" },
  { id: "lower_carbs", label: "Lower Carbs" },
  { id: "more_energy", label: "More Energy" },
];

const RESTRICTIONS = ["Vegetarian","Vegan","Gluten-Free","Dairy-Free","Nut-Free","Halal","Kosher","Low-Sodium"];
const EXAMPLES = ["Ramen","Cheeseburger","Bánh Mì","Salad Bowl","Pad Thai","Tacos"];

// ─── MEAL INPUT CARD ──────────────────────────────────────────────────────────
const MealInputCard = ({ onAnalyze, loading, compact = false }) => {
  const [meal, setMeal] = useState("");
  const [goal, setGoal] = useState("balance");
  const [restrictions, setRestrictions] = useState([]);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  const handleExample = (ex) => { setMeal(ex); setError(""); };
  const toggleRestriction = (r) => setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleSubmit = () => {
    if (!meal.trim()) {
      setShake(true); setError("Please describe your meal.");
      setTimeout(() => setShake(false), 600); return;
    }
    if (meal.length > 2000) { setError("Too long — keep it under 2000 characters."); return; }
    setError("");
    onAnalyze({ mealText: meal, goal, restrictions: { tags: restrictions } });
  };

  return (
    <div style={{
      background: "var(--color-base)", border: "1px solid var(--color-base-deeper)",
      borderRadius: "var(--radius-card)", padding: compact ? 20 : 28,
      boxShadow: "var(--shadow-card)", position: "relative", zIndex: 2
    }}>
      <div style={{ position: "relative" }}>
        <textarea
          value={meal}
          onChange={e => { setMeal(e.target.value); setError(""); }}
          placeholder="Describe your meal or ingredients… e.g. beef ramen with soft-boiled egg, nori, bamboo shoots"
          rows={compact ? 3 : 4}
          maxLength={2000}
          style={{
            width: "100%", padding: "14px 16px", border: `1.5px solid ${error ? "var(--color-flag-high)" : "var(--color-base-deeper)"}`,
            borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 15, color: "var(--color-ink)",
            background: "var(--color-base)", resize: "none", outline: "none", lineHeight: 1.6,
            transition: "border-color 0.2s",
            animation: shake ? "shake 0.5s ease" : "none"
          }}
          onFocus={e => e.target.style.borderColor = "var(--color-botanical)"}
          onBlur={e => e.target.style.borderColor = error ? "var(--color-flag-high)" : "var(--color-base-deeper)"}
        />
        <div style={{
          position: "absolute", bottom: 10, right: 12, fontFamily: "var(--font-mono)",
          fontSize: 10, color: meal.length > 1800 ? "var(--color-flag-high)" : "var(--color-ink-faint)"
        }}>
          {meal.length}/2000
        </div>
      </div>

      {/* Example chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <span style={{ fontSize: 12, color: "var(--color-ink-secondary)", alignSelf: "center", marginRight: 2 }}>Try:</span>
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => handleExample(ex)} style={{
            fontFamily: "var(--font-body)", fontSize: 12, padding: "4px 12px",
            border: "1px solid var(--color-base-deeper)", borderRadius: 9999,
            background: "var(--color-base-dark)", color: "var(--color-ink-secondary)",
            cursor: "pointer", transition: "all 0.18s"
          }}
          onMouseEnter={e => { e.target.style.background = "var(--color-botanical-wash)"; e.target.style.borderColor = "var(--color-botanical-light)"; e.target.style.color = "var(--color-botanical)"; }}
          onMouseLeave={e => { e.target.style.background = "var(--color-base-dark)"; e.target.style.borderColor = "var(--color-base-deeper)"; e.target.style.color = "var(--color-ink-secondary)"; }}
          >{ex}</button>
        ))}
      </div>

      {/* Goal selector */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Goal</div>
        <div style={{ display: "flex", gap: 4, background: "var(--color-base-dark)", borderRadius: 10, padding: 3 }}>
          {GOALS.map(g => (
            <button key={g.id} onClick={() => setGoal(g.id)} style={{
              flex: 1, padding: "7px 6px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "var(--font-body)", fontSize: 13, fontWeight: goal === g.id ? 600 : 400,
              background: goal === g.id ? "var(--color-base)" : "transparent",
              color: goal === g.id ? "var(--color-botanical)" : "var(--color-ink-secondary)",
              boxShadow: goal === g.id ? "var(--shadow-card)" : "none",
              transition: "all 0.2s"
            }}>{g.label}</button>
          ))}
        </div>
      </div>

      {/* Restriction chips */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-ink-secondary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Restrictions</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {RESTRICTIONS.map(r => {
            const active = restrictions.includes(r);
            return (
              <button key={r} onClick={() => toggleRestriction(r)} style={{
                fontFamily: "var(--font-body)", fontSize: 12, padding: "5px 12px",
                border: `1.5px solid ${active ? "var(--color-botanical)" : "var(--color-base-deeper)"}`,
                borderRadius: 9999, cursor: "pointer", fontWeight: active ? 600 : 400,
                background: active ? "var(--color-botanical-wash)" : "transparent",
                color: active ? "var(--color-botanical)" : "var(--color-ink-secondary)",
                transition: "all 0.18s"
              }}>{r}</button>
            );
          })}
        </div>
      </div>

      {error && <div style={{ marginTop: 10, fontSize: 13, color: "var(--color-flag-high)" }}>{error}</div>}

      {/* CTA */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          marginTop: 18, width: "100%", padding: "14px 24px",
          background: loading ? "var(--color-ink-secondary)" : "var(--color-highlight)",
          color: "var(--color-base)", border: "none", borderRadius: 9999,
          fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.25s var(--transition-smooth)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          animation: loading ? "expand 0.3s forwards" : "none",
          boxShadow: loading ? "none" : "0 4px 16px color-mix(in srgb, var(--color-highlight) 35%, transparent)"
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
      >
        {loading ? (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 7, height: 7, borderRadius: "50%", background: "var(--color-base)",
                animation: `spinDots 1.2s ease-in-out infinite`, animationDelay: `${i * 0.2}s`
              }} />
            ))}
          </>
        ) : "Analyze Meal →"}
      </button>
    </div>
  );
};

// ─── FLAGS PANEL ──────────────────────────────────────────────────────────────
const FlagsPanel = ({ flags }) => {
  const colors = { high: "var(--color-flag-high)", medium: "var(--color-flag-medium)", low: "var(--color-flag-low)" };
  const sorted = [...flags].sort((a, b) => ["high","medium","low"].indexOf(a.severity) - ["high","medium","low"].indexOf(b.severity));

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>Flags</span>
        <div style={{
          background: "var(--color-base-dark)", color: "var(--color-ink-secondary)",
          fontFamily: "var(--font-mono)", fontSize: 11, padding: "2px 8px", borderRadius: 9999
        }}>{flags.length}</div>
      </div>
      {sorted.length === 0 ? (
        <div style={{ color: "var(--color-botanical)", fontSize: 14 }}>✓ No notable flags for this meal.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sorted.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                clipPath: "polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)",
                background: `color-mix(in srgb, ${colors[f.severity]} 18%, transparent)`,
                color: colors[f.severity], padding: "3px 14px",
                fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap"
              }}>{f.severity}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{f.type}</div>
                <div style={{ color: "var(--color-ink-secondary)", fontSize: 13, marginTop: 2 }}>{f.note}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── ALTERNATIVE CARDS ────────────────────────────────────────────────────────
const AlternativeCards = ({ alternatives }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
    {alternatives.map((alt, i) => <AltCard key={i} alt={alt} idx={i} />)}
  </div>
);

const AltCard = ({ alt, idx }) => {
  const [flipped, setFlipped] = useState(false);
  const m = alt.macro_estimate;

  return (
    <div
      className={`flip-card ${flipped ? "flipped" : ""}`}
      style={{ height: 280, animation: `cardFlipIn 0.5s ${idx * 0.12}s both` }}
      onClick={() => setFlipped(f => !f)}
    >
      <div className="flip-card-inner">
        {/* Front */}
        <div className="flip-card-front perforated-bottom" style={{
          background: "var(--color-base)", border: "1px solid var(--color-base-deeper)",
          padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "var(--shadow-card)"
        }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-botanical)", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Alt {String(idx + 1).padStart(2, "0")}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, lineHeight: 1.3, marginBottom: 10 }}>{alt.name}</div>
            <div style={{ color: "var(--color-ink-secondary)", fontSize: 13, lineHeight: 1.5 }}>{alt.why}</div>
          </div>
          <div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {m.protein_g && <MacroPill label="P" value={`${m.protein_g}g`} color="var(--color-botanical)" />}
              {m.carbs_g && <MacroPill label="C" value={`${m.carbs_g}g`} color="var(--color-calm)" />}
              {m.fat_g && <MacroPill label="F" value={`${m.fat_g}g`} color="var(--color-highlight-light)" />}
              {m.calories && <MacroPill label="kcal" value={m.calories} color="var(--color-ink-faint)" />}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-ink-faint)", textAlign: "center" }}>Tap to see swap steps →</div>
          </div>
        </div>
        {/* Back */}
        <div className="flip-card-back" style={{
          background: "var(--color-botanical-wash)", border: "1px solid var(--color-botanical-light)",
          padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "var(--shadow-card)"
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-botanical)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Swap Steps</div>
            <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {alt.swap_steps.map((s, j) => (
                <li key={j} style={{ fontSize: 13, lineHeight: 1.5, color: "var(--color-ink)" }}>{s}</li>
              ))}
            </ol>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-botanical)", cursor: "pointer", marginTop: 12 }}>← Tap to flip back</div>
        </div>
      </div>
    </div>
  );
};

const MacroPill = ({ label, value, color }) => (
  <div style={{
    fontFamily: "var(--font-mono)", fontSize: 11, padding: "3px 10px", borderRadius: 9999,
    background: `color-mix(in srgb, ${color} 15%, transparent)`,
    color: color === "var(--color-ink-faint)" ? "var(--color-ink-secondary)" : color,
    fontWeight: 500, display: "flex", gap: 4, alignItems: "center"
  }}>
    <span style={{ opacity: 0.7, fontSize: 9 }}>{label}</span>{value}
  </div>
);

// ─── RESULTS VIEW ─────────────────────────────────────────────────────────────
const ResultsView = ({ result, onSave, canSave, isDemo }) => {
  const [tab, setTab] = useState("overview");
  const [saved, setSaved] = useState(false);
  const tabs = ["overview", "breakdown", "alternatives", "compare"];

  const handleSave = () => { onSave(); setSaved(true); };

  return (
    <div style={{ animation: "resultExpand 0.5s var(--transition-smooth) both", overflow: "hidden" }}>
      {isDemo && (
        <div style={{
          background: "var(--color-highlight-wash)", border: "1px solid var(--color-highlight-light)",
          borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13,
          color: "var(--color-highlight)", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>👋 This is a demo. Sign in to analyze your own meals and save results.</span>
        </div>
      )}

      {/* Results Header */}
      <div style={{
        background: "var(--color-base)", border: "1px solid var(--color-base-deeper)",
        borderRadius: "var(--radius-card)", padding: 24, marginBottom: 16,
        boxShadow: "var(--shadow-card)"
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, marginBottom: 6 }}>{result.title}</div>
        <div style={{ color: "var(--color-ink-secondary)", fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>{result.summary}</div>
        <NutrientRibbon macros={result.macro_estimate} animated={true} />
        <div style={{ fontSize: 10, color: "var(--color-ink-faint)", marginTop: 10, fontStyle: "italic" }}>
          Estimates only. Not medical advice. Consult a qualified professional for dietary guidance.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, background: "var(--color-base-dark)", borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: tab === t ? 600 : 400, textTransform: "capitalize",
            background: tab === t ? "var(--color-base)" : "transparent",
            color: tab === t ? "var(--color-ink)" : "var(--color-ink-secondary)",
            boxShadow: tab === t ? "var(--shadow-card)" : "none", transition: "all 0.2s"
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ background: "var(--color-base)", border: "1px solid var(--color-base-deeper)", borderRadius: "var(--radius-card)", padding: 24, boxShadow: "var(--shadow-card)" }}>
        {tab === "overview" && (
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Macro Estimate</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
              {[
                { label: "Calories", val: result.macro_estimate.calories, unit: "kcal", color: "var(--color-ink)" },
                { label: "Protein", val: result.macro_estimate.protein_g, unit: "g", color: "var(--color-botanical)" },
                { label: "Carbs", val: result.macro_estimate.carbs_g, unit: "g", color: "var(--color-calm)" },
                { label: "Fat", val: result.macro_estimate.fat_g, unit: "g", color: "var(--color-highlight)" },
              ].map(m => (
                <div key={m.label} style={{ background: "var(--color-base-dark)", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500, color: m.color }}>
                    {m.val ?? "—"}<span style={{ fontSize: 12, marginLeft: 2 }}>{m.unit}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-ink-secondary)", marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
            {result.confidence_notes && (
              <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--color-calm-wash)", borderRadius: 8, fontSize: 13, color: "var(--color-calm)", lineHeight: 1.5 }}>
                <strong style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>Confidence Note</strong><br />
                {result.confidence_notes}
              </div>
            )}
          </div>
        )}
        {tab === "breakdown" && <FlagsPanel flags={result.flags} />}
        {tab === "alternatives" && <AlternativeCards alternatives={result.alternatives} />}
        {tab === "compare" && <CompareTab result={result} />}
      </div>

      {/* Save button */}
      {canSave && !saved && (
        <button onClick={handleSave} style={{
          marginTop: 14, padding: "12px 28px", background: "transparent",
          border: "2px solid var(--color-botanical)", borderRadius: 9999,
          color: "var(--color-botanical)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14,
          cursor: "pointer", transition: "all 0.2s", display: "block", marginLeft: "auto"
        }}
        onMouseEnter={e => { e.target.style.background = "var(--color-botanical-wash)"; }}
        onMouseLeave={e => { e.target.style.background = "transparent"; }}
        >Save Analysis</button>
      )}
      {saved && (
        <div style={{ marginTop: 14, textAlign: "right", color: "var(--color-botanical)", fontSize: 14, fontWeight: 600 }}>
          ✓ Analysis saved to your history
        </div>
      )}
    </div>
  );
};

// ─── COMPARE TAB ──────────────────────────────────────────────────────────────
const CompareTab = ({ result, compareResult }) => {
  const r = compareResult || {
    verdict_title: "Original vs. Best Alternative",
    verdict_summary: `The "${result.alternatives[0].name}" option best supports your goal while preserving the meal's core experience.`,
    side_by_side: {
      a: { title: result.title, macro_estimate: result.macro_estimate, flags: result.flags },
      b: { title: result.alternatives[0].name, macro_estimate: result.alternatives[0].macro_estimate, flags: [] }
    },
    tradeoffs: [
      "The original offers deeper flavor complexity from pork fat.",
      "The alternative reduces saturated fat by roughly 35%.",
      "Sodium remains a factor in both; choose low-sodium broth regardless.",
      "Protein levels are comparable — both support muscle maintenance."
    ],
    recommendation: `Start with the "${result.alternatives[0].name}" swap for an immediate nutritional improvement without sacrificing comfort.`
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "start", marginBottom: 20 }}>
        <CompareSide data={r.side_by_side.a} label="A" />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
          <div style={{ width: 1, height: 60, background: "var(--color-botanical)", opacity: 0.4 }} />
          <div style={{
            background: "var(--color-botanical-wash)", border: "1px solid var(--color-botanical-light)",
            color: "var(--color-botanical)", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 9999, margin: "8px 0"
          }}>VS</div>
          <div style={{ width: 1, height: 60, background: "var(--color-botanical)", opacity: 0.4 }} />
        </div>
        <CompareSide data={r.side_by_side.b} label="B" />
      </div>
      <div style={{
        background: "color-mix(in srgb, var(--color-highlight) 12%, var(--color-base))",
        border: "1px solid var(--color-highlight-light)", borderRadius: 10,
        padding: "14px 18px", textAlign: "center", marginBottom: 16
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 600 }}>{r.verdict_title}</div>
        <div style={{ fontSize: 13, color: "var(--color-ink-secondary)", marginTop: 4 }}>{r.verdict_summary}</div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-ink-secondary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Tradeoffs</div>
        {r.tradeoffs.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, lineHeight: 1.5 }}>
            <span style={{ color: "var(--color-botanical)", fontWeight: 700 }}>·</span>
            <span style={{ color: "var(--color-ink-secondary)" }}>{t}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 16px", background: "var(--color-botanical-wash)", borderRadius: 8, fontSize: 14, color: "var(--color-botanical)", fontWeight: 600, lineHeight: 1.5 }}>
        {r.recommendation}
      </div>
    </div>
  );
};

const CompareSide = ({ data, label }) => (
  <div style={{ background: "var(--color-base-dark)", borderRadius: 10, padding: 16 }}>
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-ink-faint)", marginBottom: 4 }}>Meal {label}</div>
    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, marginBottom: 12, lineHeight: 1.3 }}>{data.title}</div>
    <NutrientRibbon macros={data.macro_estimate} animated size="full" />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12 }}>
      {[["Calories", data.macro_estimate.calories, "kcal"], ["Protein", data.macro_estimate.protein_g, "g"], ["Carbs", data.macro_estimate.carbs_g, "g"], ["Fat", data.macro_estimate.fat_g, "g"]].map(([l, v, u]) => (
        <div key={l} style={{ fontSize: 12 }}>
          <span style={{ color: "var(--color-ink-faint)" }}>{l}: </span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{v ?? "—"}{u}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── HISTORY CARD ─────────────────────────────────────────────────────────────
const HistoryCard = ({ analysis, onView, onCompare }) => {
  const d = new Date(analysis.created_at);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{
      background: "var(--color-base)", border: "1px solid var(--color-base-deeper)",
      borderRadius: "var(--radius-card)", padding: 18, boxShadow: "var(--shadow-card)",
      transition: "all 0.2s", cursor: "pointer"
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
    onClick={() => onView(analysis)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {analysis.result_json.title}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{
              fontSize: 11, padding: "2px 10px", borderRadius: 9999,
              background: "var(--color-botanical-wash)", color: "var(--color-botanical)", fontWeight: 600
            }}>{GOALS.find(g => g.id === analysis.goal)?.label || analysis.goal}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-ink-faint)" }}>{dateStr}</span>
          </div>
        </div>
      </div>
      <NutrientRibbon macros={analysis.result_json.macro_estimate} size="mini" animated />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <button
          onClick={e => { e.stopPropagation(); onCompare(analysis); }}
          style={{
            fontSize: 12, padding: "4px 12px", border: "1px solid var(--color-base-deeper)",
            borderRadius: 9999, background: "transparent", color: "var(--color-ink-secondary)",
            cursor: "pointer", fontFamily: "var(--font-body)", transition: "all 0.18s"
          }}
          onMouseEnter={e => { e.target.style.borderColor = "var(--color-botanical)"; e.target.style.color = "var(--color-botanical)"; }}
          onMouseLeave={e => { e.target.style.borderColor = "var(--color-base-deeper)"; e.target.style.color = "var(--color-ink-secondary)"; }}
        >Compare</button>
      </div>
    </div>
  );
};

// ─── NAV ──────────────────────────────────────────────────────────────────────
const Nav = ({ page, setPage, user, onLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "color-mix(in srgb, var(--color-base) 95%, transparent)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid var(--color-base-darker, var(--color-base-deep))" : "none",
      padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
      transition: "all 0.3s"
    }}>
      <div
        onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, fontStyle: "italic" }}>Altern</span>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--color-botanical)",
          color: "var(--color-base)", padding: "1px 6px", borderRadius: 4, fontStyle: "normal"
        }}>Ate</span>
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        {[
          { id: "home", label: "Home" },
          { id: "app", label: "Try It" },
          ...(user ? [{ id: "history", label: "History" }, { id: "settings", label: "Settings" }] : [])
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setPage(id)} style={{
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: page === id ? 600 : 400,
            color: page === id ? "var(--color-ink)" : "var(--color-ink-secondary)",
            background: "transparent", border: "none", cursor: "pointer",
            padding: "6px 12px", borderRadius: 8, transition: "all 0.18s"
          }}>{label}</button>
        ))}
        {user ? (
          <button onClick={onLogout} style={{
            fontFamily: "var(--font-body)", fontSize: 13, padding: "6px 14px",
            border: "1px solid var(--color-base-deeper)", borderRadius: 9999,
            background: "transparent", color: "var(--color-ink-secondary)", cursor: "pointer"
          }}>Sign Out</button>
        ) : (
          <button onClick={() => setPage("auth")} style={{
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, padding: "7px 16px",
            border: "none", borderRadius: 9999, background: "var(--color-ink)",
            color: "var(--color-base)", cursor: "pointer", transition: "all 0.2s"
          }}>Sign In</button>
        )}
      </div>
    </nav>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ setPage, onAnalyze, loading, result }) => {
  const goalsRef = useRef(null);
  const howRef = useRef(null);
  const [goalsVisible, setGoalsVisible] = useState(false);
  const [howVisible, setHowVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.target === goalsRef.current && e.isIntersecting) setGoalsVisible(true);
        if (e.target === howRef.current && e.isIntersecting) setHowVisible(true);
      });
    }, { threshold: 0.15 });
    if (goalsRef.current) obs.observe(goalsRef.current);
    if (howRef.current) obs.observe(howRef.current);
    return () => obs.disconnect();
  }, []);

  const goals = [
    { title: "Make healthier swaps feel effortless", desc: "We suggest changes that fit your life, not a different life." },
    { title: "Preserve the vibe of what you love", desc: "Same comfort, same craving, better ingredients." },
    { title: "Clarity without judgment", desc: "Practical information, zero guilt, no medical claims." },
    { title: "Respect restrictions and culture", desc: "Your dietary needs and food culture are always respected." },
    { title: "Make comparison fast", desc: "Side-by-side analysis so you can decide in seconds." },
  ];

  return (
    <div>
      {/* HERO */}
      <section style={{
        position: "relative", minHeight: "100vh", display: "flex", alignItems: "center",
        padding: "100px 24px 60px", overflow: "hidden", background: "var(--color-base)"
      }}>
        <AmbientRibbons />
        <div style={{ maxWidth: 820, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ animation: "fadeUp 0.8s 0.1s both" }}>
            <div style={{
              display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500,
              color: "var(--color-botanical)", letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "4px 14px", border: "1px solid var(--color-botanical-light)",
              borderRadius: 9999, marginBottom: 20, background: "var(--color-botanical-wash)"
            }}>Meal Analysis · Smarter Swaps</div>
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 700,
            lineHeight: 1.1, marginBottom: 20, animation: "fadeUp 0.8s 0.2s both",
            color: "var(--color-ink)"
          }}>
            Eat what you love.<br />
            <em style={{ color: "var(--color-botanical)" }}>Eat it smarter.</em>
          </h1>
          <p style={{
            fontSize: 17, color: "var(--color-ink-secondary)", maxWidth: 520, lineHeight: 1.6,
            marginBottom: 36, animation: "fadeUp 0.8s 0.3s both"
          }}>
            Enter any meal, choose your goal, and get 3 practical alternatives that preserve the taste you love while nudging the nutrition in the right direction.
          </p>
          <div style={{ animation: "fadeUp 0.8s 0.4s both" }}>
            <MealInputCard onAnalyze={onAnalyze} loading={loading} />
          </div>
          {result && (
            <div style={{ marginTop: 20 }}>
              <ResultsView result={result} canSave={false} isDemo={true} onSave={() => {}} />
            </div>
          )}
        </div>
      </section>

      {/* OUR GOALS */}
      <section ref={goalsRef} style={{ background: "var(--color-base-dark)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ marginBottom: 48, opacity: goalsVisible ? 1 : 0, transform: goalsVisible ? "none" : "translateY(20px)", transition: "all 0.6s var(--transition-smooth)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-botanical)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Our Purpose</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700 }}>Our Goals</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {goals.map((g, i) => (
              <div
                key={i}
                className="perforated-left"
                style={{
                  background: "var(--color-base)", borderRadius: "0 var(--radius-card) var(--radius-card) 0",
                  padding: "18px 24px", boxShadow: "var(--shadow-card)",
                  opacity: goalsVisible ? 1 : 0, transform: goalsVisible ? "none" : "translateX(-20px)",
                  transition: `all 0.5s ${0.1 + i * 0.08}s var(--transition-smooth)`,
                  cursor: "default"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-botanical)", minWidth: 24, opacity: 0.6 }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 3 }}>{g.title}</div>
                    <div style={{ color: "var(--color-ink-secondary)", fontSize: 13 }}>{g.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howRef} style={{ padding: "80px 24px", background: "var(--color-base)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ marginBottom: 48, opacity: howVisible ? 1 : 0, transform: howVisible ? "none" : "translateY(20px)", transition: "all 0.6s var(--transition-smooth)" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-calm)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Simple Process</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700 }}>How it works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { n: "01", title: "Enter your meal", desc: "Type any meal, dish, or ingredient list. No special format needed.", icon: <MealIcon /> },
              { n: "02", title: "Set your goal", desc: "Pick a direction: balance, more protein, lower carbs, or more energy.", icon: <GoalIcon /> },
              { n: "03", title: "Get smarter alternatives", desc: "Receive 3 practical swaps that preserve the vibe but improve the nutrition.", icon: <SwapIcon /> },
            ].map((s, i) => (
              <div key={i} style={{
                padding: 24, background: "var(--color-base-dark)", borderRadius: "var(--radius-card)",
                opacity: howVisible ? 1 : 0, transform: howVisible ? "none" : "translateY(24px)",
                transition: `all 0.5s ${0.15 + i * 0.12}s var(--transition-smooth)`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ color: "var(--color-base-deeper)", fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 500, lineHeight: 1, color: "var(--color-ink-faint)" }}>{s.n}</div>
                  <div style={{ color: "var(--color-botanical)" }}>{s.icon}</div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{s.title}</div>
                <div style={{ color: "var(--color-ink-secondary)", fontSize: 13, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 40, textAlign: "center", opacity: howVisible ? 1 : 0,
            transition: "opacity 0.5s 0.5s"
          }}>
            <button onClick={() => setPage("app")} style={{
              fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 600, padding: "14px 36px",
              border: "none", borderRadius: 9999, background: "var(--color-highlight)",
              color: "var(--color-base)", cursor: "pointer",
              boxShadow: "0 4px 20px color-mix(in srgb, var(--color-highlight) 35%, transparent)",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.target.style.transform = ""; }}
            >Start Analyzing →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "var(--color-base-darker, var(--color-base-dark))", borderTop: "1px solid var(--color-base-deeper)", padding: "32px 24px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontStyle: "italic", marginBottom: 4 }}>
              Altern<span style={{ fontStyle: "normal", fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--color-botanical)", color: "var(--color-base)", padding: "1px 5px", borderRadius: 4 }}>Ate</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--color-ink-faint)", fontStyle: "italic" }}>Eat what you love. Eat it smarter.</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--color-ink-faint)", maxWidth: 400, lineHeight: 1.5, textAlign: "right" }}>
            AlternAte does not provide medical, dietary, or clinical advice. All suggestions are for informational purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
};

// Simple SVG icons (no icon library)
const MealIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M7 12h10M12 7v10" />
  </svg>
);
const GoalIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 12h16M12 4l8 8-8 8" />
  </svg>
);
const SwapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M7 16V8m0 0L4 11m3-3l3 3M17 8v8m0 0l3-3m-3 3l-3-3" />
  </svg>
);

// ─── APP PAGE ─────────────────────────────────────────────────────────────────
const AppPage = ({ user, onAnalyze, loading, result, onSave }) => (
  <div style={{ minHeight: "100vh", background: "var(--color-base)", paddingTop: 80 }}>
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-botanical)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Workspace</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700 }}>Analyze a Meal</h1>
        <p style={{ color: "var(--color-ink-secondary)", fontSize: 14, marginTop: 6 }}>
          {user ? `Signed in as ${user.email}. Your analyses will be saved.` : "You're in demo mode. Sign in to save your analyses."}
        </p>
      </div>
      <MealInputCard onAnalyze={onAnalyze} loading={loading} />
      {result && (
        <div style={{ marginTop: 28 }}>
          <ResultsView result={result} canSave={!!user} onSave={onSave} isDemo={!user} />
        </div>
      )}
    </div>
  </div>
);

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
const HistoryPage = ({ analyses, onView, onCompare }) => {
  const [search, setSearch] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");

  const filtered = analyses.filter(a => {
    const matchSearch = !search || a.result_json.title.toLowerCase().includes(search.toLowerCase()) || a.meal_text.toLowerCase().includes(search.toLowerCase());
    const matchGoal = filterGoal === "all" || a.goal === filterGoal;
    return matchSearch && matchGoal;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-base)", paddingTop: 80 }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-calm)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Your Record</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700 }}>History</h1>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search meals…"
            style={{
              flex: 1, minWidth: 200, padding: "10px 14px", border: "1.5px solid var(--color-base-deeper)",
              borderRadius: 9999, fontFamily: "var(--font-body)", fontSize: 13, background: "var(--color-base)",
              color: "var(--color-ink)", outline: "none"
            }}
          />
          <div style={{ display: "flex", gap: 4 }}>
            {[{ id: "all", label: "All" }, ...GOALS].map(g => (
              <button key={g.id} onClick={() => setFilterGoal(g.id)} style={{
                padding: "8px 14px", borderRadius: 9999, border: "1.5px solid",
                borderColor: filterGoal === g.id ? "var(--color-botanical)" : "var(--color-base-deeper)",
                background: filterGoal === g.id ? "var(--color-botanical-wash)" : "transparent",
                color: filterGoal === g.id ? "var(--color-botanical)" : "var(--color-ink-secondary)",
                fontFamily: "var(--font-body)", fontSize: 12, fontWeight: filterGoal === g.id ? 600 : 400,
                cursor: "pointer", transition: "all 0.18s"
              }}>{g.label}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--color-ink-faint)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: "0 auto", display: "block" }}>
                <circle cx="24" cy="24" r="18" />
                <path d="M16 24h16M24 16v16" strokeDasharray="3 3" />
              </svg>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--color-ink-secondary)", marginBottom: 8 }}>No analyses yet</div>
            <div style={{ fontSize: 13, color: "var(--color-ink-faint)" }}>{search ? "Try a different search." : "Your saved analyses will appear here."}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filtered.map(a => <HistoryCard key={a.id} analysis={a} onView={onView} onCompare={onCompare} />)}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
const SettingsPage = ({ user, settings, onSave }) => {
  const [goal, setGoal] = useState(settings.goal || "balance");
  const [restrictions, setRestrictions] = useState(settings.restrictions || []);
  const [name, setName] = useState(settings.name || "");
  const [saved, setSaved] = useState(false);

  const toggle = r => setRestrictions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  const save = () => { onSave({ goal, restrictions, name }); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-base)", paddingTop: 80 }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-ink-secondary)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Preferences</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700 }}>Settings</h1>
        </div>
        <Card>
          <Label>Display Name</Label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle()} />
          <Label mt={20}>Default Goal</Label>
          <div style={{ display: "flex", gap: 4, background: "var(--color-base-dark)", borderRadius: 10, padding: 3 }}>
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)} style={{
                flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "var(--font-body)", fontSize: 12, fontWeight: goal === g.id ? 600 : 400,
                background: goal === g.id ? "var(--color-base)" : "transparent",
                color: goal === g.id ? "var(--color-botanical)" : "var(--color-ink-secondary)",
                boxShadow: goal === g.id ? "var(--shadow-card)" : "none", transition: "all 0.2s"
              }}>{g.label}</button>
            ))}
          </div>
          <Label mt={20}>Default Restrictions</Label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {RESTRICTIONS.map(r => {
              const active = restrictions.includes(r);
              return (
                <button key={r} onClick={() => toggle(r)} style={{
                  fontFamily: "var(--font-body)", fontSize: 12, padding: "5px 12px",
                  border: `1.5px solid ${active ? "var(--color-botanical)" : "var(--color-base-deeper)"}`,
                  borderRadius: 9999, cursor: "pointer",
                  background: active ? "var(--color-botanical-wash)" : "transparent",
                  color: active ? "var(--color-botanical)" : "var(--color-ink-secondary)",
                  transition: "all 0.18s"
                }}>{r}</button>
              );
            })}
          </div>
          <button onClick={save} style={{
            marginTop: 24, padding: "12px 28px", background: "var(--color-highlight)",
            color: "var(--color-base)", border: "none", borderRadius: 9999,
            fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer",
            transition: "all 0.2s"
          }}>
            {saved ? "✓ Saved!" : "Save Settings"}
          </button>
        </Card>
      </div>
    </div>
  );
};

const Card = ({ children }) => (
  <div style={{ background: "var(--color-base)", border: "1px solid var(--color-base-deeper)", borderRadius: "var(--radius-card)", padding: 24, boxShadow: "var(--shadow-card)" }}>{children}</div>
);
const Label = ({ children, mt = 0 }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-ink-secondary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8, marginTop: mt }}>{children}</div>
);
const inputStyle = () => ({
  width: "100%", padding: "10px 14px", border: "1.5px solid var(--color-base-deeper)",
  borderRadius: 8, fontFamily: "var(--font-body)", fontSize: 14, color: "var(--color-ink)",
  background: "var(--color-base)", outline: "none"
});

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
const AuthPage = ({ onAuth, setPage }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await onAuth(mode, email, password, name);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--color-base)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "24px", position: "relative", overflow: "hidden"
    }}>
      <AmbientRibbons />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, animation: "fadeUp 0.6s both" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "inline-flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, fontStyle: "italic" }}>Altern</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, background: "var(--color-botanical)", color: "var(--color-base)", padding: "1px 7px", borderRadius: 4 }}>Ate</span>
          </div>
          <p style={{ color: "var(--color-ink-secondary)", fontSize: 14 }}>
            {mode === "signin" ? "Sign in to save and compare analyses" : "Create an account — it's free"}
          </p>
        </div>
        <div style={{
          background: "var(--color-base)", border: "1px solid var(--color-base-deeper)",
          borderRadius: "var(--radius-card)", padding: 28, boxShadow: "var(--shadow-card)"
        }}>
          {mode === "signup" && (
            <>
              <Label>Display Name</Label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={{ ...inputStyle(), marginBottom: 14 }} />
            </>
          )}
          <Label>Email</Label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" style={{ ...inputStyle(), marginBottom: 14 }} />
          <Label>Password</Label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" style={{ ...inputStyle(), marginBottom: 6 }} />
          {error && <div style={{ fontSize: 13, color: "var(--color-flag-high)", marginBottom: 12 }}>{error}</div>}
          <button onClick={handle} disabled={loading} style={{
            width: "100%", padding: "13px", background: "var(--color-highlight)", color: "var(--color-base)",
            border: "none", borderRadius: 9999, fontFamily: "var(--font-body)", fontWeight: 600,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer", marginTop: 10, transition: "all 0.2s",
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => { setMode(m => m === "signin" ? "signup" : "signin"); setError(""); }} style={{
              fontFamily: "var(--font-body)", fontSize: 13, color: "var(--color-ink-secondary)",
              background: "none", border: "none", cursor: "pointer", textDecoration: "underline"
            }}>
              {mode === "signin" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button onClick={() => setPage("app")} style={{
              fontFamily: "var(--font-body)", fontSize: 12, color: "var(--color-ink-faint)",
              background: "none", border: "none", cursor: "pointer"
            }}>Continue as guest (demo mode)</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MOCK LLM ANALYSIS ────────────────────────────────────────────────────────
const mockAnalyze = async ({ mealText, goal, restrictions }) => {
  await new Promise(r => setTimeout(r, 1800 + Math.random() * 800));
  const protein = goal === "more_protein" ? 42 : 26;
  const carbs = goal === "lower_carbs" ? 32 : 58;
  const fat = 14;
  const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);
  return {
    title: mealText.length < 40 ? mealText : mealText.slice(0, 36) + "…",
    summary: `This meal ${goal === "balance" ? "offers a reasonable nutritional profile" : goal === "more_protein" ? "can be optimized for higher protein" : goal === "lower_carbs" ? "has room to reduce carbohydrate load" : "may benefit from more complex energy sources"} with a few practical improvement opportunities.`,
    macro_estimate: { calories, protein_g: protein, carbs_g: carbs, fat_g: fat },
    flags: [
      { type: "Processing level", severity: "low", note: "Consider swapping any highly processed components for whole-food alternatives where possible." },
      { type: "Fiber content", severity: goal === "lower_carbs" ? "medium" : "low", note: "Adding vegetables or legumes could meaningfully boost fiber intake." }
    ],
    alternatives: [
      {
        name: `${mealText.split(" ")[0]} Bowl (High-Protein Remix)`,
        why: `Swapping the base protein source for a leaner option closely supports your "${goal}" goal while keeping the same meal format.`,
        swap_steps: ["Replace the main protein with grilled chicken breast or firm tofu", "Use a legume-based side (lentils, edamame) instead of refined grains", "Add a tahini or miso-based dressing for healthy fats"],
        macro_estimate: { calories: Math.round(calories * 0.85), protein_g: Math.round(protein * 1.35), carbs_g: Math.round(carbs * 0.8), fat_g: Math.round(fat * 0.7) }
      },
      {
        name: `Lighter ${mealText.split(" ")[0]} Wrap`,
        why: "Wrapping the same flavors in a whole-grain tortilla with added vegetables reduces caloric density while preserving the experience.",
        swap_steps: ["Use a whole-grain or spinach wrap as the vessel", "Load with shredded cabbage, grated carrot, and cucumber for volume", "Use Greek yogurt thinned with lemon as a sauce substitute"],
        macro_estimate: { calories: Math.round(calories * 0.72), protein_g: Math.round(protein * 1.1), carbs_g: Math.round(carbs * 0.75), fat_g: Math.round(fat * 0.65) }
      },
      {
        name: `Deconstructed ${mealText.split(" ")[0]} Grain Bowl`,
        why: "A grain bowl format lets you maximize vegetable volume and control each macro component independently.",
        swap_steps: ["Build on a base of quinoa or farro (more protein than white rice)", "Add at least 2 cups of raw or roasted vegetables", "Finish with a small portion of the original protein and a citrus vinaigrette"],
        macro_estimate: { calories: Math.round(calories * 0.78), protein_g: Math.round(protein * 1.2), carbs_g: Math.round(carbs * 0.85), fat_g: Math.round(fat * 0.6) }
      }
    ],
    confidence_notes: "Macro estimates are approximate. Actual values depend significantly on preparation methods, portion sizes, and specific ingredient brands."
  };
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [homeResult, setHomeResult] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [settings, setSettings] = useState({ goal: "balance", restrictions: [], name: "" });
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [compareQueue, setCompareQueue] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const handleAnalyze = useCallback(async (input, isHome = false) => {
    if (input.mealText.length > 2000) return;
    setLoading(true);
    try {
      const res = await mockAnalyze(input);
      if (isHome) setHomeResult(res);
      else setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleHomeAnalyze = useCallback((input) => handleAnalyze(input, true), [handleAnalyze]);
  const handleAppAnalyze = useCallback((input) => handleAnalyze(input, false), [handleAnalyze]);

  const handleSave = useCallback(() => {
    if (!result || !user) return;
    const newAnalysis = {
      id: Date.now().toString(),
      user_id: user.id,
      meal_text: result.title,
      goal: settings.goal,
      restrictions: { tags: [] },
      result_json: result,
      created_at: new Date().toISOString()
    };
    setAnalyses(prev => [newAnalysis, ...prev]);
  }, [result, user, settings]);

  const handleAuth = async (mode, email, password, name) => {
    await new Promise(r => setTimeout(r, 1000));
    const mockUser = { id: "user_" + Math.random().toString(36).slice(2), email, name };
    setUser(mockUser);
    setSettings(s => ({ ...s, name: name || email.split("@")[0] }));
    setPage("app");
  };

  const handleLogout = () => { setUser(null); setPage("home"); setAnalyses([]); };

  const handleViewAnalysis = (analysis) => {
    setResult(analysis.result_json);
    setPage("app");
  };

  const handleCompare = (analysis) => {
    setCompareQueue(prev => {
      if (prev.find(a => a.id === analysis.id)) return prev;
      const next = [...prev, analysis].slice(-2);
      if (next.length === 2) setShowCompareModal(true);
      return next;
    });
  };

  const handleSaveSettings = (s) => setSettings(s);

  return (
    <div>
      <GlobalStyles />
      <Nav page={page} setPage={setPage} user={user} onLogout={handleLogout} />

      {page === "home" && (
        <HomePage
          setPage={setPage}
          onAnalyze={handleHomeAnalyze}
          loading={loading}
          result={homeResult}
        />
      )}

      {page === "app" && (
        <AppPage
          user={user}
          onAnalyze={handleAppAnalyze}
          loading={loading}
          result={result}
          onSave={handleSave}
        />
      )}

      {page === "history" && !user && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, flexDirection: "column", gap: 16, padding: 40 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, textAlign: "center" }}>Sign in to view your history</div>
          <button onClick={() => setPage("auth")} style={{
            padding: "12px 28px", background: "var(--color-highlight)", color: "var(--color-base)",
            border: "none", borderRadius: 9999, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer"
          }}>Sign In</button>
        </div>
      )}

      {page === "history" && user && (
        <HistoryPage analyses={analyses} onView={handleViewAnalysis} onCompare={handleCompare} />
      )}

      {page === "settings" && !user && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80, flexDirection: "column", gap: 16, padding: 40 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, textAlign: "center" }}>Sign in to access settings</div>
          <button onClick={() => setPage("auth")} style={{
            padding: "12px 28px", background: "var(--color-highlight)", color: "var(--color-base)",
            border: "none", borderRadius: 9999, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer"
          }}>Sign In</button>
        </div>
      )}

      {page === "settings" && user && (
        <SettingsPage user={user} settings={settings} onSave={handleSaveSettings} />
      )}

      {page === "auth" && <AuthPage onAuth={handleAuth} setPage={setPage} />}

      {/* Compare Modal */}
      {showCompareModal && compareQueue.length === 2 && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(28,24,20,0.55)", backdropFilter: "blur(4px)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }} onClick={() => setShowCompareModal(false)}>
          <div style={{
            background: "var(--color-base)", borderRadius: "var(--radius-card)", padding: 28,
            maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 64px rgba(28,24,20,0.2)", animation: "fadeUp 0.4s both"
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>Comparison</div>
              <button onClick={() => setShowCompareModal(false)} style={{
                background: "none", border: "none", color: "var(--color-ink-secondary)",
                fontSize: 20, cursor: "pointer", padding: "4px 8px", lineHeight: 1
              }}>×</button>
            </div>
            <CompareTab result={compareQueue[0].result_json} compareResult={{
              verdict_title: "Side-by-Side Comparison",
              verdict_summary: "Here's how your two saved analyses stack up against each other.",
              side_by_side: {
                a: { title: compareQueue[0].result_json.title, macro_estimate: compareQueue[0].result_json.macro_estimate, flags: compareQueue[0].result_json.flags },
                b: { title: compareQueue[1].result_json.title, macro_estimate: compareQueue[1].result_json.macro_estimate, flags: compareQueue[1].result_json.flags }
              },
              tradeoffs: ["Both meals offer different nutritional profiles worth considering.", "Check the flagged ingredients in each to identify your main tradeoffs.", "Consider which macro balance better supports your current goal."],
              recommendation: "Choose based on your most pressing goal today — either meal can be improved with the suggested swaps."
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
