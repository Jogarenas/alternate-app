/*
 * ═══════════════════════════════════════════════════════════════════
 *  AlternAte.jsx — Hackathon build v3
 *  Stack: React 18 + CSS-in-JS (<style> tag)
 *  All AI calls are routed through secure proxy endpoints.
 *  NO API KEYS IN THIS FILE. NEVER.
 * ═══════════════════════════════════════════════════════════════════
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │  SERVERLESS: /api/analyze  (Next.js / Vercel / Cloudflare)  │
 *  │  Input:  { mealText, goal, restrictions: { tags[] } }        │
 *  │  Steps:                                                       │
 *  │   1. Validate input (mealText max 2000 chars)                 │
 *  │   2. Rate-limit by IP (e.g. 20 req/hour via Upstash)         │
 *  │   3. Call Gemini 2.5 Flash:                                   │
 *  │      // Use your preferred AI SDK (server-side only)           │
 *  │      // Initialize with process.env.GEMINI_KEY                  │
 *  │      const model = "gemini-2.5-flash-preview-05-20";         │
 *  │      const response = await ai.models.generateContent({       │
 *  │        model, contents: userPrompt,                           │
 *  │        config: { systemInstruction: ANALYZE_SYSTEM_PROMPT,    │
 *  │                  responseMimeType: "application/json" }       │
 *  │      });                                                      │
 *  │   4. Return response.text() parsed as JSON                    │
 *  │   NEVER put GEMINI_KEY in JSX.                               │
 *  ├──────────────────────────────────────────────────────────────┤
 *  │  SERVERLESS: /api/insights                                    │
 *  │  Input:  { goal, restrictions, analyses[] }                   │
 *  │  Validate: require >= 3 analyses; rate-limit per user         │
 *  │  Call Gemini 2.5 Flash with INSIGHTS_SYSTEM_PROMPT            │
 *  │  Force responseMimeType: "application/json"                   │
 *  │  Return strict JSON (see InsightsSchema below)                │
 *  │  No medical claims. Use hedged language only.                  │
 *  ├──────────────────────────────────────────────────────────────┤
 *  │  SERVERLESS: /api/compare  (optional)                         │
 *  │  Input: { analysisA, analysisB, goal, restrictions }          │
 *  │  Call Gemini 2.5 Flash with COMPARE_SYSTEM_PROMPT             │
 *  │  Return: { verdict_title, verdict_summary, tradeoffs[],       │
 *  │            recommendation, confidence_notes, disclaimer }      │
 *  └──────────────────────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════ */
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

    :root {
      --forest:    #1a3a28;
      --forest-m:  #245235;
      --forest-l:  #2f6b44;
      --sage:      #6b9e7a;
      --sage-l:    #9ec4a9;
      --sage-xl:   #d4e9da;
      --sage-2xl:  #ecf5ee;
      --cream:     #f7f4ef;
      --cream-d:   #ede9e0;
      --cream-dd:  #ddd8cc;
      --ink:       #1a1d1b;
      --ink-2:     #4a5248;
      --ink-3:     #8a9589;
      --white:     #ffffff;
      --red-s:     #c0392b;
      --red-l:     #fdf2f2;
      --amber:     #d4881a;
      --amber-l:   #fdf4e3;
      --font: 'Cabinet Grotesk', system-ui, sans-serif;
      --rad:   14px;
      --rad-l: 20px;
      --rad-p: 9999px;
      --sh-xs: 0 1px 3px rgba(26,58,40,.05);
      --sh-s:  0 2px 14px rgba(26,58,40,.07),0 1px 3px rgba(26,58,40,.04);
      --sh-m:  0 4px 28px rgba(26,58,40,.09),0 2px 6px rgba(26,58,40,.05);
      --sh-l:  0 12px 52px rgba(26,58,40,.13),0 4px 12px rgba(26,58,40,.06);
      --ease:  cubic-bezier(.16,1,.3,1);
    }

    html { scroll-behavior: smooth; }
    body {
      font-family: var(--font);
      background: var(--cream);
      color: var(--ink);
      font-size: 16px;
      line-height: 1.7;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    body::after {
      content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;
      opacity:.02;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:200px;
    }

    @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
    @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
    @keyframes pulse     { 0%,100%{opacity:.07} 50%{opacity:.17} }
    @keyframes drift     { 0%{transform:translate(0,0)} 100%{transform:translate(22px,11px)} }
    @keyframes spin      { to{transform:rotate(360deg)} }
    @keyframes expand    { from{max-height:0;opacity:0} to{max-height:10000px;opacity:1} }
    @keyframes shake     { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
    @keyframes barGrow   { from{width:0} }
    @keyframes toastIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
    @keyframes ribbonFlow{ 0%{transform:translateX(-2%) scaleX(1.02)} 50%{transform:translateX(2%) scaleX(.98)} 100%{transform:translateX(-2%) scaleX(1.02)} }
    @keyframes segPulse  { 0%,100%{opacity:.1} 50%{opacity:.2} }
    @keyframes skelPulse { 0%,100%{opacity:.4} 50%{opacity:.85} }
    @keyframes impactBar { from{transform:scaleX(0)} to{transform:scaleX(1)} }
    @keyframes checkPop  { 0%{transform:scale(0)} 70%{transform:scale(1.2)} 100%{transform:scale(1)} }

    .fc   { perspective:1000px;cursor:pointer }
    .fci  { position:relative;width:100%;height:100%;transition:transform .48s var(--ease);transform-style:preserve-3d }
    .fc.flipped .fci { transform:rotateY(180deg) }
    .fcf,.fcb { position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:var(--rad-l) }
    .fcb { transform:rotateY(180deg) }

    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:var(--cream-d)}
    ::-webkit-scrollbar-thumb{background:var(--cream-dd);border-radius:3px}
    .skel{background:var(--cream-dd);border-radius:8px;animation:skelPulse 1.4s ease-in-out infinite}

    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `}</style>
);

/* ═══════════════════════════════════════════════════════════════
   AI PROXY LAYER
   In production these functions call /api/analyze, /api/insights,
   /api/compare — secure serverless endpoints (see comment block above).
   Here we call the available AI API directly for the demo environment.
   NEVER put API keys in production JSX.
═══════════════════════════════════════════════════════════════ */
const ANALYZE_SYSTEM = `You are AlternAte, a practical meal analysis assistant.
Return ONLY a single valid JSON object — no markdown fences, no prose, no extra text.
Work for ANY food, drink, snack, or meal from ANY cuisine worldwide.
Never give medical advice. Use: "may support", "often associated with", "can contribute to".
If nutrition estimates are uncertain, use null and explain in confidence_notes.
Respect dietary restrictions. Preserve vibe (taste, convenience, culture) in alternatives.
Alternatives must be specific — never say "eat a salad". Name real dishes or products.
Schema:
{
  "title":"string",
  "overview":{"one_liner":"string","good_news":["","",""],"watch_out":["","",""],"why_it_matters":"string"},
  "nutrition_estimate":{"calories":n,"protein_g":n,"carbs_g":n,"fat_g":n,"fiber_g":n,"sugar_g":n,"sodium_mg":n},
  "flags":[{"type":"string","severity":"low|medium|high","note":"string"}],
  "alternatives":[{"name":"string","vibe_preserved":"string","why_better":"string","swap_steps":["","",""],
    "nutrition_estimate":{"calories":n,"protein_g":n,"carbs_g":n,"fat_g":n,"fiber_g":n,"sugar_g":n,"sodium_mg":n}}],
  "best_alternative_index":0,
  "comparison":{"verdict_title":"string","verdict_summary":"string","tradeoffs":["","",""],"recommendation":"string"},
  "confidence_notes":"string","disclaimer":"string"
}
Provide exactly 3 alternatives. Return ONLY the JSON object.`;

const INSIGHTS_SYSTEM = `You are AlternAte's pattern intelligence engine.
Analyze the user's recent meal history and return ONLY a single valid JSON object.
No markdown. No prose. No medical claims. Use "may support", "often associated with".
Never diagnose. Provide practical, encouraging, non-judgmental insights.
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

const COMPARE_SYSTEM = `You are AlternAte's comparison engine.
Compare two meal analyses and return ONLY a single valid JSON object. No markdown, no prose.
No medical claims. Use hedged language.
Schema:
{"verdict_title":"string","verdict_summary":"string","tradeoffs":["","",""],"recommendation":"string","confidence_notes":"string","disclaimer":"string"}
Return ONLY the JSON object.`;

// callAI: send request to server-side Gemini proxy (/api/gemini)
// The proxy is responsible for holding the GEMINI API key (DO NOT put keys in client-side code).
const callAI = async (systemPrompt, userPrompt, opts = {}) => {
  const payload = {
    model: opts.model || "gemini-2.0-flash",
    system: systemPrompt,
    prompt: userPrompt,
    responseMimeType: opts.responseMimeType || "application/json",
    maxTokens: opts.maxTokens || 4000,
  };

  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch((err)=> { return {}; });
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  const data = await res.json();
  // The proxy returns { text: string } where text is the model output
  const raw = (data.text || data.output || "") + "";

  // Robust JSON extraction (same strategy as before)
  const start = raw.indexOf("{");
  if (start === -1) throw new Error("No JSON in response. Please try again.");
  let depth = 0, end = -1;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const jsonStr = end > -1 ? raw.slice(start, end + 1) : raw.slice(start);

  try { return JSON.parse(jsonStr); } catch (parseErr) { /* continue to repair attempt */ }
  // Repair attempt: close unclosed brackets
  try {
    let f = jsonStr.replace(/,\s*$/, "");
    const ob = (f.match(/\{/g)||[]).length - (f.match(/\}/g)||[]).length;
    const ab = (f.match(/\[/g)||[]).length - (f.match(/\]/g)||[]).length;
    for (let i = 0; i < ab; i++) f += "]";
    for (let i = 0; i < ob; i++) f += "}";
    return JSON.parse(f);
  } catch (e) { throw new Error("AI response malformed. Please try again. " + (e?.message||"")); }
};

/*
  PRODUCTION: replace these with fetch("/api/analyze", ...) etc.
  The callAI() function above is the demo stand-in.
*/
const analyzeMeal    = ({ mealText, goal, restrictions }) =>
  callAI(ANALYZE_SYSTEM,
    `Analyze: "${mealText}"\nGoal: ${goal}\nRestrictions: ${(restrictions?.tags||[]).join(", ")||"none"}\nReturn ONLY the JSON.`);

const fetchInsights  = ({ goal, restrictions, analyses }) =>
  callAI(INSIGHTS_SYSTEM,
    `Goal: ${goal}\nRestrictions: ${(restrictions?.tags||[]).join(", ")||"none"}\nRecent meals:\n${JSON.stringify(analyses,null,2)}\nReturn ONLY the JSON.`);

const fetchCompare   = ({ analysisA, analysisB, goal, restrictions }) =>
  callAI(COMPARE_SYSTEM,
    `Goal: ${goal}\nRestrictions: ${(restrictions?.tags||[]).join(", ")||"none"}\nMeal A: ${JSON.stringify({title:analysisA.result.title,nutrition:analysisA.result.nutrition_estimate,flags:analysisA.result.flags})}\nMeal B: ${JSON.stringify({title:analysisB.result.title,nutrition:analysisB.result.nutrition_estimate,flags:analysisB.result.flags})}\nReturn ONLY the JSON.`);

/* ═══════════════════════════════════════════════════════════════
   LOCAL STORAGE
═══════════════════════════════════════════════════════════════ */
const LS_KEY   = "alternate_v3";
const LS_DONE  = "alternate_challenges_done";
const loadHistory  = () => { try { return JSON.parse(localStorage.getItem(LS_KEY))||[]; } catch (e) { return []; } };
const saveHistory  = l  => { try { localStorage.setItem(LS_KEY, JSON.stringify(l.slice(0,40))); } catch (e) { /* ignore */ } };
const loadDone     = () => { try { return JSON.parse(localStorage.getItem(LS_DONE))||[]; } catch (e) { return []; } };
const saveDone     = d  => { try { localStorage.setItem(LS_DONE, JSON.stringify(d)); } catch (e) { /* ignore */ } };

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const GOALS = [
  {id:"balance",     label:"Balance"},
  {id:"more_protein",label:"More Protein"},
  {id:"lower_carbs", label:"Lower Carbs"},
  {id:"more_energy", label:"More Energy"},
];
const RESTRICTIONS = ["Vegetarian","Vegan","Gluten-Free","Dairy-Free","Nut-Free","Halal","Kosher","Low-Sodium"];
const EXAMPLES     = ["Ramen","Bánh Mì","Burrito Bowl","Fried Rice","Pizza Slice","Shawarma","Oatmeal","Paneer Curry"];

/* ═══════════════════════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════════════════════ */
const useVis = (thresh=.12) => {
  const ref = useRef(null), [v,setV] = useState(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setV(true); },{threshold:thresh});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[thresh]);
  return [ref,v];
};
const useCounter = (target,dur,visible) => {
  const [v,setV]=useState(0), done=useRef(false);
  useEffect(()=>{
    if(!visible||done.current||!target) return;
    done.current=true;
    const t0=performance.now();
    const tick=now=>{ const p=Math.min((now-t0)/dur,1); setV(Math.round((1-Math.pow(1-p,3))*target)); if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  },[visible,target,dur]);
  return v;
};

/* ═══════════════════════════════════════════════════════════════
   DESIGN ATOMS
═══════════════════════════════════════════════════════════════ */
const Pill = ({children,tone="sage",size="sm"}) => {
  const T={sage:{bg:"var(--sage-xl)",color:"var(--forest-l)"},forest:{bg:"var(--forest)",color:"var(--cream)"},
    muted:{bg:"var(--cream-dd)",color:"var(--ink-2)"},red:{bg:"var(--red-l)",color:"var(--red-s)"},
    amber:{bg:"var(--amber-l)",color:"var(--amber)"}};
  const t=T[tone]||T.sage;
  return <span style={{display:"inline-flex",alignItems:"center",background:t.bg,color:t.color,
    padding:size==="sm"?"3px 10px":"5px 14px",borderRadius:"var(--rad-p)",
    fontSize:size==="sm"?11:13,fontWeight:600,letterSpacing:".03em",lineHeight:1.4,whiteSpace:"nowrap"}}>{children}</span>;
};

const Card = ({children,style:s={},hover=false}) => {
  const [h,setH]=useState(false);
  return <div onMouseEnter={()=>hover&&setH(true)} onMouseLeave={()=>hover&&setH(false)}
    style={{background:"var(--white)",borderRadius:"var(--rad-l)",
      boxShadow:h?"var(--sh-l)":"var(--sh-s)",
      transition:"box-shadow .25s,transform .25s var(--ease)",
      transform:h?"translateY(-3px)":"none",...s}}>{children}</div>;
};

const Btn = ({children,onClick,variant="primary",loading:ld=false,style:s={},disabled}) => {
  const [h,setH]=useState(false);
  const V={
    primary:{bg:h||ld?"var(--forest-m)":"var(--forest)",color:"var(--white)",border:"none",shadow:"0 4px 20px rgba(26,58,40,.25)"},
    ghost:{bg:h?"var(--sage-2xl)":"transparent",color:"var(--forest)",border:"1.5px solid var(--cream-dd)",shadow:"none"},
    sage:{bg:h?"var(--sage)":"var(--sage-xl)",color:h?"var(--white)":"var(--forest-l)",border:"none",shadow:"none"},
  };
  const v=V[variant]||V.primary;
  return <button onClick={onClick} disabled={disabled||ld}
    onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
    style={{fontFamily:"var(--font)",fontWeight:700,cursor:(disabled||ld)?"not-allowed":"pointer",
      border:v.border||"none",borderRadius:"var(--rad-p)",background:v.bg,color:v.color,
      padding:"13px 28px",fontSize:15,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,
      transition:"all .22s var(--ease)",boxShadow:v.shadow,
      transform:h&&!disabled&&!ld?"translateY(-2px)":"none",opacity:disabled?.55:1,letterSpacing:".01em",...s}}>
    {ld?<Spinner size={17} color={v.color}/>:children}
  </button>;
};

const Spinner = ({size=18,color="var(--white)"}) => (
  <div style={{width:size,height:size,border:`2.5px solid ${color}33`,borderTopColor:color,
    borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>
);

const FieldLabel = ({children,mt=0}) => (
  <div style={{fontSize:11,fontWeight:700,color:"var(--ink-3)",letterSpacing:".08em",
    textTransform:"uppercase",marginBottom:8,marginTop:mt}}>{children}</div>
);

const NPill = ({l,v,c="var(--ink-2)"}) => (
  <div style={{fontSize:11,padding:"3px 10px",borderRadius:"var(--rad-p)",
    background:`color-mix(in srgb,${c} 12%,transparent)`,color:c,fontWeight:600,
    display:"flex",gap:3,alignItems:"center"}}>
    <span style={{opacity:.65,fontSize:9}}>{l}</span>{v}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   NUTRIENT RIBBON  (signature — hero, results, history, compare)
═══════════════════════════════════════════════════════════════ */
const NutrientRibbon = ({nutrition,size="full",ambient=false}) => {
  const [filled,setFilled]=useState(ambient);
  useEffect(()=>{ if(!ambient){const t=setTimeout(()=>setFilled(true),60);return()=>clearTimeout(t);} },[ambient]);
  const n=nutrition||{};
  const tot=(n.protein_g||0)*4+(n.carbs_g||0)*4+(n.fat_g||0)*9;
  const p=tot>0?((n.protein_g||0)*4/tot)*100:33;
  const c=tot>0?((n.carbs_g||0)*4/tot)*100:34;
  const f=tot>0?((n.fat_g||0)*9/tot)*100:33;
  const hs={full:12,mini:5,hero:9};
  const h=hs[size]||12;
  const score=nutrition?Math.round(Math.min(100,30+p*.6+(100-c)*.2)):null;
  if(ambient) return (
    <div style={{width:"100%",height:h,borderRadius:"var(--rad-p)",display:"flex",overflow:"hidden",
      animation:`ribbonFlow 10s ease-in-out infinite,segPulse 8s ease-in-out infinite`}}>
      {[[p,"var(--forest-l)"],[c,"var(--sage)"],[f,"var(--sage-l)"]].map(([w,c2],i)=>(
        <div key={i} style={{width:`${w}%`,background:c2,height:"100%"}}/>
      ))}
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,width:"100%"}}>
      <div style={{flex:1,height:h,borderRadius:"var(--rad-p)",overflow:"hidden",background:"var(--cream-d)",display:"flex"}}>
        {[[p,"var(--forest-l)",0],[c,"var(--sage)",80],[f,"var(--sage-l)",160]].map(([pct,col,dl],i)=>(
          <div key={i} style={{height:"100%",width:filled?`${pct}%`:"0%",background:col,
            transition:filled?`width .75s ${dl}ms var(--ease)`:"none"}}/>
        ))}
      </div>
      {size==="full"&&score!==null&&(
        <div style={{fontSize:11,fontWeight:700,color:"var(--forest-l)",background:"var(--sage-2xl)",
          padding:"2px 10px",borderRadius:"var(--rad-p)",whiteSpace:"nowrap"}}>{score}/100</div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   IMPACT METER  (new signature — Weekly Impact Simulation)
═══════════════════════════════════════════════════════════════ */
const ImpactMeter = ({origN, altN}) => {
  const [freq,setFreq]=useState(3);
  const [ref,vis]=useVis(.1);
  const metrics=[
    {key:"calories",label:"Calories",unit:"kcal",color:"var(--forest-l)",max:500},
    {key:"sugar_g",  label:"Sugar",   unit:"g",   color:"var(--amber)",    max:50},
    {key:"sodium_mg",label:"Sodium",  unit:"mg",  color:"var(--sage)",     max:1000},
  ];
  const o=origN||{}, a=altN||{};
  return (
    <div ref={ref} style={{marginTop:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:16}}>Weekly Impact Simulation</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,color:"var(--ink-3)"}}>swaps/week</span>
          <input type="range" min={1} max={7} value={freq} onChange={e=>setFreq(+e.target.value)}
            style={{width:90,accentColor:"var(--forest-l)"}}/>
          <span style={{fontWeight:700,color:"var(--forest-l)",minWidth:12,textAlign:"center"}}>{freq}×</span>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {metrics.map(({key,label,unit,color,max})=>{
          const ov=o[key], av=a[key];
          const delta=ov!=null&&av!=null?Math.round(ov-av):null;
          const wk=delta!=null?delta*freq:null;
          const yr=wk!=null?wk*52:null;
          const pct=delta!=null?Math.min(Math.abs(delta)/max*100,100):0;
          const good=delta!=null&&delta>0;
          return (
            <div key={key} style={{background:"var(--cream)",borderRadius:"var(--rad)",padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:14}}>{label}</span>
                {delta!=null?(
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:12,color:"var(--ink-3)"}}>
                      {ov}{unit} → {av}{unit}
                    </span>
                    <span style={{fontWeight:800,fontSize:13,
                      color:good?"var(--forest-l)":"var(--red-s)"}}>
                      {good?"−":"+"}|{Math.abs(delta)}{unit}/swap
                    </span>
                  </div>
                ):(
                  <span style={{fontSize:12,color:"var(--ink-3)"}}>—</span>
                )}
              </div>
              <div style={{height:8,background:"var(--cream-d)",borderRadius:"var(--rad-p)",overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:vis?`${pct}%`:"0%",background:color,
                  borderRadius:"var(--rad-p)",transformOrigin:"left",
                  transition:vis?"width .8s var(--ease)":"none"}}/>
              </div>
              {delta!=null&&(
                <div style={{display:"flex",gap:16}}>
                  <div style={{fontSize:12,color:"var(--ink-3)"}}>
                    Weekly: <span style={{fontWeight:700,color:good?"var(--forest-l)":"var(--red-s)"}}>
                      {good?"−":"+"}|{Math.abs(wk).toLocaleString()}{unit}
                    </span>
                  </div>
                  <div style={{fontSize:12,color:"var(--ink-3)"}}>
                    Yearly: <span style={{fontWeight:700,color:good?"var(--forest-l)":"var(--red-s)"}}>
                      {good?"−":"+"}|{Math.abs(yr).toLocaleString()}{unit}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{fontSize:11,color:"var(--ink-3)",marginTop:10,lineHeight:1.6}}>
        Estimates only. Individual results vary. Not medical advice.
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HERO BG
═══════════════════════════════════════════════════════════════ */
const HeroBg = () => (
  <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
    {[{top:"12%",d:9,dl:0},{top:"37%",d:11,dl:2.2},{top:"61%",d:8.5,dl:4.5},{top:"80%",d:13,dl:1.5}].map((r,i)=>(
      <div key={i} style={{position:"absolute",top:r.top,left:"-5%",width:"110%",
        animation:`pulse ${r.d}s ease-in-out ${r.dl}s infinite`}}>
        <NutrientRibbon ambient size="hero"/>
      </div>
    ))}
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.05,
      animation:"drift 24s ease-in-out infinite alternate"}}>
      <defs><pattern id="dg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="var(--forest-l)"/>
      </pattern></defs>
      <rect width="200%" height="200%" fill="url(#dg)"/>
    </svg>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   LOGO
═══════════════════════════════════════════════════════════════ */
const Logo = ({onClick,light=false}) => (
  <div onClick={onClick} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:9}}>
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="8" fill={light?"rgba(255,255,255,.15)":"var(--forest)"}/>
      <path d="M14 6C10 6 7 9.5 7 13.5C7 17 9.5 21 14 22C18.5 21 21 17 21 13.5C21 9.5 18 6 14 6Z"
        fill="var(--sage-l)" opacity=".7"/>
      <path d="M14 9C12 9 10.5 11 10.5 13C10.5 15.5 12.5 18 14 19C15.5 18 17.5 15.5 17.5 13C17.5 11 16 9 14 9Z"
        fill={light?"var(--white)":"var(--white)"}/>
      <circle cx="14" cy="13" r="2" fill="var(--sage)"/>
    </svg>
    <span style={{fontFamily:"var(--font)",fontWeight:800,fontSize:18,
      color:light?"var(--white)":"var(--forest)",letterSpacing:"-.02em"}}>
      Altern<span style={{color:light?"var(--sage-l)":"var(--sage)"}}>Ate</span>
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════ */
const Nav = ({page,setPage,user,onLogout}) => {
  const [sc,setSc]=useState(false);
  useEffect(()=>{
    const fn=()=>setSc(window.scrollY>20);
    window.addEventListener("scroll",fn);
    return()=>window.removeEventListener("scroll",fn);
  },[]);
  const links=[{id:"home",l:"Home"},{id:"app",l:"Analyze"},
    ...(user?[{id:"history",l:"History"},{id:"insights",l:"Insights"},{id:"settings",l:"Settings"}]:[])];
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
      background:sc?"rgba(247,244,239,.94)":"transparent",
      backdropFilter:sc?"blur(16px)":"none",
      boxShadow:sc?"0 1px 0 rgba(26,58,40,.06)":"none",
      transition:"all .35s",padding:"0 clamp(16px,4vw,52px)",height:62,
      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <Logo onClick={()=>setPage("home")}/>
      <div style={{display:"flex",gap:2,alignItems:"center"}}>
        {links.map(({id,l})=>(
          <button key={id} onClick={()=>setPage(id)} style={{
            fontFamily:"var(--font)",fontSize:14,fontWeight:page===id?700:500,
            color:page===id?"var(--forest)":"var(--ink-2)",
            background:"transparent",border:"none",cursor:"pointer",
            padding:"6px 12px",borderRadius:8,transition:"color .18s"}}>
            {l}
          </button>
        ))}
        {user?(
          <button onClick={onLogout} style={{fontFamily:"var(--font)",fontSize:13,fontWeight:600,
            padding:"7px 16px",border:"1.5px solid var(--cream-dd)",borderRadius:"var(--rad-p)",
            background:"transparent",color:"var(--ink-2)",cursor:"pointer",marginLeft:6,transition:"all .2s"}}>
            Sign Out
          </button>
        ):(
          <Btn onClick={()=>setPage("auth")} style={{fontSize:13,padding:"8px 20px",marginLeft:6}}>Sign In</Btn>
        )}
      </div>
    </nav>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MEAL INPUT CARD
═══════════════════════════════════════════════════════════════ */
const MealInputCard = ({onAnalyze,loading}) => {
  const [meal,setMeal]=useState("");
  const [goal,setGoal]=useState("balance");
  const [restr,setRestr]=useState([]);
  const [shake,setShake]=useState(false);
  const [err,setErr]=useState("");
  const toggle=r=>setRestr(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r]);
  const submit=()=>{
    if(!meal.trim()){setShake(true);setErr("Please describe your meal or food.");setTimeout(()=>setShake(false),500);return;}
    if(meal.length>2000){setErr("Too long — max 2000 chars.");return;}
    setErr("");onAnalyze({mealText:meal.trim(),goal,restrictions:{tags:restr}});
  };
  return (
    <Card style={{padding:28}}>
      <div style={{position:"relative"}}>
        <textarea value={meal} onChange={e=>{setMeal(e.target.value);setErr("");}}
          placeholder="Type any food, drink, or meal… e.g. Pepsi, beef ramen, paneer curry, shawarma wrap"
          rows={4} maxLength={2000}
          style={{width:"100%",padding:"14px 16px",
            border:`1.5px solid ${err?"var(--red-s)":"var(--cream-d)"}`,
            borderRadius:"var(--rad)",fontFamily:"var(--font)",fontSize:15,
            color:"var(--ink)",background:"var(--cream)",resize:"none",outline:"none",lineHeight:1.65,
            transition:"border-color .2s",animation:shake?"shake .45s ease":"none"}}
          onFocus={e=>e.target.style.borderColor="var(--forest-l)"}
          onBlur={e=>e.target.style.borderColor=err?"var(--red-s)":"var(--cream-d)"}/>
        <span style={{position:"absolute",bottom:10,right:12,fontSize:10,
          color:meal.length>1800?"var(--red-s)":"var(--ink-3)",fontWeight:500}}>{meal.length}/2000</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10,alignItems:"center"}}>
        <span style={{fontSize:11,color:"var(--ink-3)",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase"}}>Try:</span>
        {EXAMPLES.map(ex=>(
          <button key={ex} onClick={()=>{setMeal(ex);setErr("");}}
            style={{fontFamily:"var(--font)",fontSize:12,padding:"4px 12px",border:"1.5px solid var(--cream-d)",
              borderRadius:"var(--rad-p)",background:"var(--cream)",color:"var(--ink-2)",cursor:"pointer",transition:"all .18s",fontWeight:500}}
            onMouseEnter={e=>{e.target.style.background="var(--sage-2xl)";e.target.style.color="var(--forest)";e.target.style.borderColor="var(--sage-l)";}}
            onMouseLeave={e=>{e.target.style.background="var(--cream)";e.target.style.color="var(--ink-2)";e.target.style.borderColor="var(--cream-d)";}}>
            {ex}
          </button>
        ))}
      </div>
      <div style={{marginTop:18}}>
        <FieldLabel>Your Goal</FieldLabel>
        <div style={{display:"flex",gap:3,background:"var(--cream)",borderRadius:"var(--rad)",padding:3,
          boxShadow:"inset 0 1px 3px rgba(0,0,0,.05)"}}>
          {GOALS.map(g=>(
            <button key={g.id} onClick={()=>setGoal(g.id)} style={{flex:1,padding:"8px 6px",borderRadius:10,border:"none",cursor:"pointer",
              fontFamily:"var(--font)",fontSize:12,fontWeight:goal===g.id?700:500,
              background:goal===g.id?"var(--white)":"transparent",
              color:goal===g.id?"var(--forest)":"var(--ink-2)",
              boxShadow:goal===g.id?"var(--sh-s)":"none",transition:"all .2s"}}>{g.label}</button>
          ))}
        </div>
      </div>
      <div style={{marginTop:16}}>
        <FieldLabel>Dietary Restrictions</FieldLabel>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {RESTRICTIONS.map(r=>{const a=restr.includes(r);return(
            <button key={r} onClick={()=>toggle(r)} style={{fontFamily:"var(--font)",fontSize:12,padding:"5px 12px",
              border:`1.5px solid ${a?"var(--sage)":"var(--cream-d)"}`,borderRadius:"var(--rad-p)",cursor:"pointer",fontWeight:a?700:500,
              background:a?"var(--sage-2xl)":"transparent",color:a?"var(--forest-l)":"var(--ink-2)",transition:"all .18s"}}>{r}</button>
          );})}
        </div>
      </div>
      {err&&<div style={{marginTop:10,fontSize:13,color:"var(--red-s)",fontWeight:500}}>{err}</div>}
      <Btn loading={loading} onClick={submit} style={{width:"100%",marginTop:20,fontSize:15,padding:"15px",justifyContent:"center"}}>
        {loading?"Analyzing with AI…":"Analyze Meal →"}
      </Btn>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SKELETON
═══════════════════════════════════════════════════════════════ */
const Skeleton = () => (
  <Card style={{padding:28}}>
    {[[180,20],[120,16],[240,14]].map(([w,h],i)=>(
      <div key={i} className="skel" style={{width:w,height:h,marginBottom:i<2?14:24}}/>
    ))}
    <div style={{display:"flex",gap:3,marginBottom:20}}>
      {[1,2,3,4].map(i=><div key={i} className="skel" style={{flex:1,height:36,borderRadius:10}}/>)}
    </div>
    {[1,2,3].map(i=>(
      <div key={i} style={{display:"flex",gap:12,marginBottom:12,alignItems:"center"}}>
        <div className="skel" style={{width:60,height:10}}/>
        <div className="skel" style={{flex:1,height:8,borderRadius:4}}/>
        <div className="skel" style={{width:40,height:10}}/>
      </div>
    ))}
  </Card>
);

/* ═══════════════════════════════════════════════════════════════
   NUTRITION BAR
═══════════════════════════════════════════════════════════════ */
const NutritionBar = ({label,value,unit,max,color,icon}) => {
  const pct=max>0?Math.min((value/max)*100,100):0;
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{fontSize:14,color:"var(--ink-2)",display:"flex",alignItems:"center",gap:6}}>
          {icon&&<span style={{fontSize:15}}>{icon}</span>}{label}
        </span>
        <span style={{fontWeight:700,fontSize:14,color:"var(--ink)"}}>
          {value!=null?`${value}${unit}`:<span style={{opacity:.4}}>—</span>}
        </span>
      </div>
      <div style={{height:7,background:"var(--cream-d)",borderRadius:"var(--rad-p)",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:"var(--rad-p)",animation:"barGrow .75s var(--ease) both"}}/>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FLAGS PANEL
═══════════════════════════════════════════════════════════════ */
const FlagsPanel = ({flags}) => {
  const sev={high:"var(--red-s)",medium:"var(--forest-l)",low:"var(--sage)"};
  const bg={high:"var(--red-l)",medium:"var(--sage-2xl)",low:"var(--cream)"};
  const sorted=[...(flags||[])].sort((a,b)=>["high","medium","low"].indexOf(a.severity)-["high","medium","low"].indexOf(b.severity));
  if(!sorted.length) return <div style={{color:"var(--forest-l)",fontSize:14}}>✓ No notable flags for this meal.</div>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {sorted.map((f,i)=>(
        <div key={i} style={{padding:"12px 16px",borderRadius:"var(--rad)",background:bg[f.severity]||"var(--cream)",
          display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",
            color:sev[f.severity],padding:"3px 10px",
            background:`color-mix(in srgb,${sev[f.severity]} 14%,transparent)`,
            borderRadius:"var(--rad-p)",whiteSpace:"nowrap",marginTop:1,
            clipPath:"polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)"}}>{f.severity}</div>
          <div>
            <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{f.type}</div>
            <div style={{color:"var(--ink-2)",fontSize:13,lineHeight:1.6}}>{f.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   ALT CARD (flip)
═══════════════════════════════════════════════════════════════ */
const AltCard = ({alt,idx,isBest}) => {
  const [flipped,setFlipped]=useState(false);
  const n=alt.nutrition_estimate||{};
  return (
    <div className={`fc${flipped?" flipped":""}`}
      style={{height:310,animation:`fadeUp .5s ${idx*.1}s both`}}
      onClick={()=>setFlipped(f=>!f)}>
      <div className="fci">
        <div className="fcf" style={{background:"var(--white)",padding:22,boxShadow:"var(--sh-s)",
          display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <Pill>{`Alt ${String(idx+1).padStart(2,"0")}`}</Pill>
              {isBest&&<Pill tone="forest">Best Swap ★</Pill>}
            </div>
            <div style={{fontWeight:800,fontSize:17,lineHeight:1.25,marginBottom:8}}>{alt.name}</div>
            <div style={{fontSize:12,color:"var(--sage)",fontWeight:600,marginBottom:8}}>Vibe: {alt.vibe_preserved}</div>
            <div style={{color:"var(--ink-2)",fontSize:13,lineHeight:1.6}}>{alt.why_better}</div>
          </div>
          <div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {n.calories!=null&&<NPill l="kcal" v={n.calories}/>}
              {n.protein_g!=null&&<NPill l="P" v={`${n.protein_g}g`} c="var(--forest-l)"/>}
              {n.carbs_g!=null&&<NPill l="C" v={`${n.carbs_g}g`} c="var(--sage)"/>}
              {n.fat_g!=null&&<NPill l="F" v={`${n.fat_g}g`} c="var(--ink-3)"/>}
            </div>
            <div style={{fontSize:10,color:"var(--ink-3)",textAlign:"center",fontWeight:600,
              letterSpacing:".04em",textTransform:"uppercase"}}>Tap for swap steps →</div>
          </div>
        </div>
        <div className="fcb" style={{background:"var(--forest)",padding:22,boxShadow:"var(--sh-s)",
          display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--sage-l)",letterSpacing:".08em",
              textTransform:"uppercase",marginBottom:14}}>How to Swap</div>
            <ol style={{paddingLeft:18,display:"flex",flexDirection:"column",gap:10}}>
              {(alt.swap_steps||[]).map((s,j)=>(
                <li key={j} style={{fontSize:13,lineHeight:1.6,color:"var(--cream)"}}>{s}</li>
              ))}
            </ol>
          </div>
          <div style={{fontSize:10,color:"var(--sage-l)",fontWeight:600,letterSpacing:".04em",textTransform:"uppercase"}}>
            ← tap to flip back
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   COMPARE PANEL  (with ImpactMeter)
═══════════════════════════════════════════════════════════════ */
const ComparePanel = ({result}) => {
  const bestIdx=result.best_alternative_index??0;
  const best=result.alternatives?.[bestIdx];
  const comp=result.comparison||{};
  if(!best) return <p style={{color:"var(--ink-2)"}}>No comparison available.</p>;

  return (
    <div>
      {/* Side by side — no harsh VS line, use spacing + dot separator */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
        {[
          {label:"Original",title:result.title,n:result.nutrition_estimate,bg:"var(--white)"},
          {label:"Best Swap ★",title:best.name,n:best.nutrition_estimate,bg:"var(--sage-2xl)"},
        ].map((s,i)=>(
          <Card key={i} style={{padding:18,background:s.bg}}>
            <div style={{fontSize:10,fontWeight:700,color:i===1?"var(--forest)":"var(--ink-3)",
              letterSpacing:".08em",textTransform:"uppercase",marginBottom:6}}>{s.label}</div>
            <div style={{fontWeight:800,fontSize:15,lineHeight:1.25,marginBottom:14,
              color:i===1?"var(--forest)":"var(--ink)"}}>{s.title}</div>
            <NutrientRibbon nutrition={s.n}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:12}}>
              {[["Cal",s.n?.calories,"kcal"],["Prot",s.n?.protein_g,"g"],
                ["Carb",s.n?.carbs_g,"g"],["Fat",s.n?.fat_g,"g"]].map(([l,v,u])=>(
                <div key={l} style={{fontSize:12}}>
                  <span style={{color:i===1?"var(--forest-m)":"var(--ink-3)"}}>{l}: </span>
                  <span style={{fontWeight:700,color:i===1?"var(--forest)":"var(--ink)"}}>{v!=null?`${v}${u}`:"—"}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Verdict */}
      {comp.verdict_title&&(
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"var(--forest)",
            color:"var(--white)",padding:"10px 22px",borderRadius:"var(--rad-p)",fontWeight:700,fontSize:14}}>
            ★ {comp.verdict_title}
          </div>
        </div>
      )}
      {comp.verdict_summary&&(
        <div style={{fontSize:15,color:"var(--ink-2)",lineHeight:1.7,marginBottom:16,maxWidth:640}}>{comp.verdict_summary}</div>
      )}
      {(comp.tradeoffs||[]).length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:11,color:"var(--ink-3)",letterSpacing:".07em",
            textTransform:"uppercase",marginBottom:10}}>Tradeoffs</div>
          {comp.tradeoffs.map((t,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,fontSize:14,lineHeight:1.6}}>
              <span style={{color:"var(--sage)",fontWeight:700,flexShrink:0}}>·</span>
              <span style={{color:"var(--ink-2)"}}>{t}</span>
            </div>
          ))}
        </div>
      )}
      {comp.recommendation&&(
        <div style={{padding:"14px 18px",background:"var(--sage-2xl)",borderRadius:"var(--rad)",
          fontSize:15,color:"var(--forest)",fontWeight:600,lineHeight:1.6,marginBottom:8}}>
          {comp.recommendation}
        </div>
      )}

      {/* Impact Meter */}
      <ImpactMeter origN={result.nutrition_estimate} altN={best.nutrition_estimate}/>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   RESULTS VIEW  (4 tabs)
═══════════════════════════════════════════════════════════════ */
const ResultsView = ({result,onSave,canSave,isDemo}) => {
  const [tab,setTab]=useState("overview");
  const [saved,setSaved]=useState(false);
  const ov=result.overview||{};
  const n=result.nutrition_estimate||{};
  return (
    <div style={{animation:"expand .5s var(--ease) both",overflow:"hidden"}}>
      {isDemo&&(
        <div style={{background:"var(--sage-2xl)",borderRadius:"var(--rad)",padding:"10px 16px",
          marginBottom:14,fontSize:13,color:"var(--forest-l)",display:"flex",alignItems:"center",gap:8}}>
          👋 Demo mode — sign in to save your analyses.
        </div>
      )}
      <Card style={{padding:24,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:26,lineHeight:1.15,marginBottom:6}}>{result.title}</div>
            <div style={{color:"var(--ink-2)",fontSize:15,marginBottom:16,lineHeight:1.7,maxWidth:580}}>{ov.one_liner}</div>
            <NutrientRibbon nutrition={n}/>
          </div>
          {n.calories!=null&&(
            <div style={{textAlign:"center",background:"var(--cream)",padding:"12px 18px",borderRadius:"var(--rad)",flexShrink:0}}>
              <div style={{fontWeight:800,fontSize:28,color:"var(--forest)",lineHeight:1}}>{n.calories}</div>
              <div style={{fontSize:11,color:"var(--ink-3)",fontWeight:600,marginTop:2}}>kcal</div>
            </div>
          )}
        </div>
        <div style={{fontSize:11,color:"var(--ink-3)",marginTop:14,lineHeight:1.6}}>
          {result.disclaimer||"Estimates only · Not medical advice"}
        </div>
      </Card>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,background:"var(--cream)",borderRadius:"var(--rad)",padding:3,
        marginBottom:12,boxShadow:"inset 0 1px 3px rgba(0,0,0,.05)"}}>
        {["overview","breakdown","alternatives","compare"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 4px",borderRadius:10,border:"none",cursor:"pointer",
            fontFamily:"var(--font)",fontSize:13,fontWeight:tab===t?700:500,textTransform:"capitalize",
            background:tab===t?"var(--white)":"transparent",color:tab===t?"var(--forest)":"var(--ink-2)",
            boxShadow:tab===t?"var(--sh-s)":"none",transition:"all .2s"}}>{t}</button>
        ))}
      </div>

      <Card style={{padding:24}}>
        {tab==="overview"&&(
          <div>
            <div style={{fontWeight:800,fontSize:18,marginBottom:20}}>At a Glance</div>
            {ov.good_news?.length>0&&(
              <div style={{marginBottom:18}}>
                <div style={{fontWeight:700,fontSize:11,color:"var(--forest-l)",letterSpacing:".07em",textTransform:"uppercase",marginBottom:10}}>Good News</div>
                {ov.good_news.map((g,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:8,fontSize:14,lineHeight:1.65}}>
                    <span style={{color:"var(--sage)",flexShrink:0}}>✓</span>
                    <span style={{color:"var(--ink-2)"}}>{g}</span>
                  </div>
                ))}
              </div>
            )}
            {ov.watch_out?.length>0&&(
              <div style={{marginBottom:18}}>
                <div style={{fontWeight:700,fontSize:11,color:"var(--ink-3)",letterSpacing:".07em",textTransform:"uppercase",marginBottom:10}}>Watch Out</div>
                {ov.watch_out.map((w,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:8,fontSize:14,lineHeight:1.65}}>
                    <span style={{color:"var(--ink-3)",flexShrink:0}}>·</span>
                    <span style={{color:"var(--ink-2)"}}>{w}</span>
                  </div>
                ))}
              </div>
            )}
            {ov.why_it_matters&&(
              <div style={{padding:"14px 18px",background:"var(--sage-2xl)",borderRadius:"var(--rad)",
                fontSize:14,color:"var(--forest)",lineHeight:1.7,fontWeight:500,maxWidth:640}}>{ov.why_it_matters}</div>
            )}
            {result.confidence_notes&&(
              <div style={{marginTop:16,padding:"10px 14px",background:"var(--cream)",borderRadius:"var(--rad)",
                fontSize:12,color:"var(--ink-3)",lineHeight:1.6}}>
                <span style={{fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",fontSize:10}}>Confidence: </span>
                {result.confidence_notes}
              </div>
            )}
          </div>
        )}
        {tab==="breakdown"&&(
          <div>
            <div style={{fontWeight:800,fontSize:18,marginBottom:20}}>Nutrition Estimate</div>
            <NutritionBar label="Calories"      icon="⚡" value={n.calories}  unit=" kcal" max={900}  color="var(--forest)"/>
            <NutritionBar label="Protein"       icon="💪" value={n.protein_g} unit="g"     max={60}   color="var(--forest-l)"/>
            <NutritionBar label="Carbohydrates" icon="🌾" value={n.carbs_g}   unit="g"     max={130}  color="var(--sage)"/>
            <NutritionBar label="Fat"           icon="🫒" value={n.fat_g}     unit="g"     max={80}   color="var(--sage-l)"/>
            <NutritionBar label="Fiber"         icon="🌿" value={n.fiber_g}   unit="g"     max={30}   color="var(--sage)"/>
            <NutritionBar label="Sugar"         icon="🍬" value={n.sugar_g}   unit="g"     max={60}   color="var(--ink-3)"/>
            <NutritionBar label="Sodium"        icon="🧂" value={n.sodium_mg} unit="mg"    max={2300} color="var(--ink-3)"/>
            <div style={{marginTop:24}}>
              <div style={{fontWeight:800,fontSize:18,marginBottom:16}}>Flags</div>
              <FlagsPanel flags={result.flags}/>
            </div>
          </div>
        )}
        {tab==="alternatives"&&(
          <div>
            <div style={{fontWeight:800,fontSize:18,marginBottom:16}}>Smarter Swaps</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>
              {(result.alternatives||[]).map((a,i)=>(
                <AltCard key={i} alt={a} idx={i} isBest={i===(result.best_alternative_index??0)}/>
              ))}
            </div>
          </div>
        )}
        {tab==="compare"&&<ComparePanel result={result}/>}
      </Card>

      {canSave&&!saved&&(
        <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={()=>{onSave();setSaved(true);}} style={{fontSize:13,padding:"9px 20px"}}>
            Save Analysis
          </Btn>
        </div>
      )}
      {saved&&<div style={{marginTop:12,textAlign:"right",color:"var(--forest-l)",fontSize:13,fontWeight:700}}>✓ Saved to history</div>}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HISTORY CARD
═══════════════════════════════════════════════════════════════ */
const HistCard = ({item,onView,onCompare,onDelete}) => {
  const date=new Date(item.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  return (
    <Card hover style={{padding:18,cursor:"pointer"}} onClick={()=>onView(item)}>
      <div style={{fontWeight:800,fontSize:15,marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {item.result.title}
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12}}>
        <Pill>{GOALS.find(g=>g.id===item.goal)?.label||item.goal}</Pill>
        <span style={{fontSize:11,color:"var(--ink-3)",fontWeight:500}}>{date}</span>
      </div>
      <NutrientRibbon nutrition={item.result.nutrition_estimate} size="mini"/>
      <div style={{display:"flex",justifyContent:"flex-end",gap:6,marginTop:12}}>
        <button onClick={e=>{e.stopPropagation();onCompare(item);}}
          style={{fontSize:11,padding:"4px 12px",border:"1.5px solid var(--cream-d)",borderRadius:"var(--rad-p)",
            background:"transparent",color:"var(--ink-2)",cursor:"pointer",fontWeight:600,fontFamily:"var(--font)",transition:"all .18s"}}
          onMouseEnter={e=>{e.target.style.borderColor="var(--sage)";e.target.style.color="var(--forest)";}}
          onMouseLeave={e=>{e.target.style.borderColor="var(--cream-d)";e.target.style.color="var(--ink-2)";}}>
          Compare
        </button>
        <button onClick={e=>{e.stopPropagation();onDelete(item.id);}}
          style={{fontSize:11,padding:"4px 12px",border:"1.5px solid var(--cream-d)",borderRadius:"var(--rad-p)",
            background:"transparent",color:"var(--ink-3)",cursor:"pointer",fontFamily:"var(--font)",transition:"all .18s"}}
          onMouseEnter={e=>{e.target.style.color="var(--red-s)";e.target.style.borderColor="var(--red-s)";}}
          onMouseLeave={e=>{e.target.style.color="var(--ink-3)";e.target.style.borderColor="var(--cream-d)";}}>
          ✕
        </button>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   STAT NUM (animated counter)
═══════════════════════════════════════════════════════════════ */
const StatNum = ({target,suffix="",dur=1600}) => {
  const [ref,vis]=useVis(.01);
  const v=useCounter(target,dur,vis);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
};

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════ */
const HomePage = ({setPage,onAnalyze,loading,result}) => {
  const [sRef,sVis]=useVis(.18);
  const [gRef,gVis]=useVis(.1);
  const [hRef,hVis]=useVis(.1);
  const [iRef,iVis]=useVis(.1);
  return (
    <div>
      <section style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",
        padding:"100px clamp(16px,5vw,72px) 60px",overflow:"hidden",background:"var(--cream)"}}>
        <HeroBg/>
        <div style={{maxWidth:1040,margin:"0 auto",width:"100%",position:"relative",zIndex:1,
          display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,alignItems:"center"}}>
          <div>
            <div style={{animation:"fadeUp .7s .05s both"}}><Pill size="md">AI-Powered Meal Analysis</Pill></div>
            <h1 style={{fontWeight:800,fontSize:"clamp(38px,5vw,66px)",lineHeight:1.06,letterSpacing:"-.03em",
              marginTop:20,marginBottom:22,animation:"fadeUp .7s .15s both"}}>
              Eat what you love.<br/><span style={{color:"var(--forest-l)"}}>Eat it smarter.</span>
            </h1>
            <p style={{fontSize:16,color:"var(--ink-2)",lineHeight:1.75,maxWidth:440,marginBottom:34,
              animation:"fadeUp .7s .25s both"}}>
              Type any food, drink, or meal. Get a practical AI analysis and 3 smarter alternatives — without the lecture.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",animation:"fadeUp .7s .35s both"}}>
              <Btn onClick={()=>setPage("app")}>Analyze a Meal</Btn>
              <Btn variant="ghost" onClick={()=>document.getElementById("how")?.scrollIntoView({behavior:"smooth"})}>
                How it works ↓
              </Btn>
            </div>
            <div style={{display:"flex",gap:28,marginTop:38,paddingTop:28,borderTop:"1px solid var(--cream-d)",animation:"fadeUp .7s .45s both"}}>
              {[["350 kcal","avg daily reduction"],["3×","more protein possible"],["78%","love the taste too"]].map(([n,l])=>(
                <div key={n}>
                  <div style={{fontWeight:800,fontSize:22,color:"var(--forest-l)",lineHeight:1}}>{n}</div>
                  <div style={{fontSize:11,color:"var(--ink-3)",marginTop:4,lineHeight:1.4,maxWidth:90}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{animation:"fadeUp .7s .2s both"}}>
            <MealInputCard onAnalyze={onAnalyze} loading={loading}/>
            {result&&<div style={{marginTop:18}}><ResultsView result={result} canSave={false} isDemo onSave={()=>{}}/></div>}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={sRef} style={{background:"var(--forest)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{marginBottom:52,opacity:sVis?1:0,transform:sVis?"none":"translateY(18px)",transition:"all .6s var(--ease)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--sage-l)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>The state of our health</div>
            <h2 style={{fontWeight:800,fontSize:"clamp(28px,4vw,52px)",color:"var(--white)",lineHeight:1.08,letterSpacing:"-.025em"}}>
              The data is clear.<br/><span style={{color:"var(--sage-l)"}}>What we eat is hurting us.</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>
            {[{n:50,s:"%",l:"of Americans have prediabetes or diabetes",src:"CDC 2024"},
              {n:75,s:"%",l:"of adults have at least one chronic condition",src:"CDC 2023"},
              {n:90,s:"%",l:"of US healthcare spending treats chronic disease",src:"realfood.gov"},
              {n:68,s:"%",l:"of a US child's diet is ultra-processed food",src:"JAMA 2023"},
            ].map((st,i)=>(
              <div key={i} style={{padding:"40px 28px",
                borderRight:i<3?"1px solid rgba(255,255,255,.06)":"none",
                opacity:sVis?1:0,transform:sVis?"none":"translateY(22px)",
                transition:`all .55s ${.08+i*.1}s var(--ease)`}}>
                <div style={{fontWeight:800,fontSize:"clamp(50px,6vw,76px)",lineHeight:1,color:"var(--sage-l)",marginBottom:14,letterSpacing:"-.04em"}}>
                  {sVis&&<StatNum target={st.n} suffix={st.s}/>}
                </div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.62)",lineHeight:1.55,marginBottom:6}}>{st.l}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.25)",fontWeight:600,letterSpacing:".04em"}}>{st.src}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bridge */}
      <section style={{background:"var(--forest-l)",padding:"64px clamp(16px,5vw,72px)",textAlign:"center"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <h2 style={{fontWeight:800,fontSize:"clamp(24px,3.8vw,48px)",color:"var(--white)",lineHeight:1.1,letterSpacing:"-.025em"}}>
            Small swaps.<br/><span style={{color:"var(--sage-xl)"}}>Massive impact over time.</span>
          </h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,.72)",marginTop:18,lineHeight:1.75}}>
            AlternAte uses AI to find the version of your favourite meals that supports your goals — without removing the joy.
          </p>
        </div>
      </section>

      {/* Impact */}
      <section ref={iRef} style={{background:"var(--cream-d)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{marginBottom:48,opacity:iVis?1:0,transform:iVis?"none":"translateY(16px)",transition:"all .55s var(--ease)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--sage)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>What AlternAte delivers</div>
            <h2 style={{fontWeight:800,fontSize:"clamp(26px,3.6vw,46px)",lineHeight:1.1,letterSpacing:"-.025em"}}>
              Real improvements,<br/><span style={{color:"var(--forest-l)"}}>without losing what you love.</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
            {[{n:350,s:"kcal",l:"avg daily calorie reduction with consistent swaps",c:"var(--forest)"},
              {n:2,s:"×",l:"protein improvement achievable in most meals",c:"var(--forest-l)"},
              {n:78,s:"%",l:"of users say alternatives tasted just as good",c:"var(--sage)"},
              {n:3,s:" swaps",l:"per day meaningfully shifts weekly nutritional balance",c:"var(--sage)"},
            ].map((item,i)=>(
              <Card key={i} style={{padding:"28px 22px",opacity:iVis?1:0,transform:iVis?"none":"translateY(18px)",
                transition:`all .5s ${.08+i*.1}s var(--ease)`}}>
                <div style={{fontWeight:800,color:item.c,lineHeight:1,marginBottom:10,
                  fontSize:"clamp(36px,4vw,54px)",letterSpacing:"-.03em"}}>
                  {iVis&&<StatNum target={item.n} suffix={item.s} dur={1400}/>}
                </div>
                <div style={{fontSize:13,color:"var(--ink-2)",lineHeight:1.6}}>{item.l}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Goals */}
      <section ref={gRef} style={{background:"var(--white)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"start"}}>
          <div style={{position:"sticky",top:80,opacity:gVis?1:0,transform:gVis?"none":"translateY(16px)",transition:"all .55s var(--ease)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--sage)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:14}}>Our Purpose</div>
            <h2 style={{fontWeight:800,fontSize:"clamp(28px,3.8vw,50px)",lineHeight:1.06,letterSpacing:"-.025em",marginBottom:18}}>
              Our<br/><span style={{color:"var(--forest-l)"}}>Goals</span>
            </h2>
            <p style={{fontSize:15,color:"var(--ink-2)",lineHeight:1.75,maxWidth:340}}>
              We built AlternAte because nutrition advice is often overwhelming, judgmental, and disconnected from how real people actually eat.
            </p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {[{n:"01",t:"Make swaps effortless",d:"Suggestions that fit your existing life — not a different one."},
              {n:"02",t:"Preserve the vibe",d:"Same comfort, same craving — better ingredients behind the scenes."},
              {n:"03",t:"Clarity without judgment",d:"Practical info, zero guilt, no medical claims."},
              {n:"04",t:"Respect restrictions & culture",d:"Your dietary needs and food traditions are honoured."},
              {n:"05",t:"Make comparison fast",d:"Side-by-side analysis so you decide in seconds."},
            ].map((g,i)=>(
              <div key={i} style={{padding:"18px 22px",
                borderLeft:`3px solid ${gVis?"var(--sage-l)":"transparent"}`,
                background:gVis?"var(--cream)":"transparent",
                borderRadius:"0 var(--rad) var(--rad) 0",
                opacity:gVis?1:0,transform:gVis?"none":"translateX(-16px)",
                transition:`all .48s ${.06+i*.09}s var(--ease)`,cursor:"default"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.background="var(--sage-2xl)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.background="var(--cream)";}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <span style={{fontSize:11,fontWeight:700,color:"var(--sage)",paddingTop:2,flexShrink:0}}>{g.n}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{g.t}</div>
                    <div style={{color:"var(--ink-2)",fontSize:13,lineHeight:1.6}}>{g.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" ref={hRef} style={{background:"var(--forest)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{marginBottom:52,opacity:hVis?1:0,transform:hVis?"none":"translateY(16px)",transition:"all .55s var(--ease)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"var(--sage-l)",letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>Simple by design</div>
            <h2 style={{fontWeight:800,fontSize:"clamp(26px,4vw,52px)",color:"var(--white)",lineHeight:1.1,letterSpacing:"-.025em"}}>How it works</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
            {[{n:"01",t:"Enter your food",d:"Type any meal, drink, or ingredient list from any cuisine. No special format."},
              {n:"02",t:"Set your goal",d:"Choose balance, more protein, lower carbs, or more energy."},
              {n:"03",t:"Get smarter swaps",d:"AI returns 3 alternatives that preserve the taste and improve the nutrition."},
            ].map((s,i)=>(
              <div key={i} style={{padding:"44px 32px",
                borderRight:i<2?"1px solid rgba(255,255,255,.07)":"none",
                opacity:hVis?1:0,transform:hVis?"none":"translateY(20px)",
                transition:`all .5s ${.1+i*.15}s var(--ease)`}}>
                <div style={{fontWeight:700,fontSize:32,color:"rgba(255,255,255,.1)",lineHeight:1,marginBottom:16}}>{s.n}</div>
                <div style={{fontWeight:800,fontSize:20,color:"var(--white)",marginBottom:10}}>{s.t}</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.55)",lineHeight:1.7}}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:52,textAlign:"center",opacity:hVis?1:0,transition:"opacity .5s .5s"}}>
            <Btn onClick={()=>setPage("app")} style={{background:"var(--sage)",color:"var(--forest)"}}>
              Start Analyzing →
            </Btn>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{background:"var(--sage)",padding:"72px clamp(16px,5vw,72px)",textAlign:"center"}}>
        <h2 style={{fontWeight:800,fontSize:"clamp(24px,4vw,52px)",color:"var(--white)",lineHeight:1.08,letterSpacing:"-.025em",marginBottom:16}}>
          Your next meal is already good.<br/><span style={{color:"var(--sage-xl)"}}>Let's make it a little better.</span>
        </h2>
        <p style={{fontSize:16,color:"rgba(255,255,255,.78)",marginBottom:32}}>Free to use. No subscriptions. No diet dogma.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("auth")} style={{background:"var(--white)",color:"var(--forest)"}}>Create Free Account</Btn>
          <Btn variant="ghost" onClick={()=>setPage("app")} style={{borderColor:"rgba(255,255,255,.4)",color:"var(--white)"}}>Try as Guest</Btn>
        </div>
      </section>

      {/* Footer */}
      <footer style={{background:"var(--ink)",padding:"40px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <Logo light/>
          <div style={{fontSize:11,color:"rgba(255,255,255,.28)",maxWidth:420,lineHeight:1.65,textAlign:"right"}}>
            AlternAte does not provide medical, dietary, or clinical advice. All analysis is for informational purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   APP PAGE
═══════════════════════════════════════════════════════════════ */
const AppPage = ({user,onAnalyze,loading,result,onSave}) => (
  <div style={{minHeight:"100vh",background:"var(--cream)",paddingTop:80}}>
    <div style={{maxWidth:900,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
      <div style={{marginBottom:28,animation:"fadeUp .6s both"}}>
        <div style={{fontSize:10,fontWeight:700,color:"var(--sage)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Workspace</div>
        <h1 style={{fontWeight:800,fontSize:34,letterSpacing:"-.03em"}}>Analyze a Meal</h1>
        <p style={{color:"var(--ink-2)",fontSize:14,marginTop:6}}>
          {user?`Signed in as ${user.email} — analyses are saved.`:"Demo mode — sign in to save analyses."}
        </p>
      </div>
      <div style={{animation:"fadeUp .6s .1s both"}}>
        <MealInputCard onAnalyze={onAnalyze} loading={loading}/>
      </div>
      {loading&&!result&&<div style={{marginTop:20}}><Skeleton/></div>}
      {result&&<div style={{marginTop:24}}><ResultsView result={result} canSave={!!user} onSave={onSave} isDemo={!user}/></div>}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   INSIGHTS PAGE  (Daily Pattern Intelligence)
═══════════════════════════════════════════════════════════════ */
const InsightsPage = ({history,settings,showToast}) => {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState([]);

  useEffect(()=>{ try { const d = loadDone(); if(d && d.length) setDone(d); } catch{} },[]);
  const recent=history.slice(0,10);
  const enough=recent.length>=3;

  const toggleDone=id=>{
    const next=done.includes(id)?done.filter(x=>x!==id):[...done,id];
    setDone(next); saveDone(next);
  };

  useEffect(()=>{
    if(!enough||data) return;
    setLoading(true);
    const analyses=recent.map(h=>({
      created_at:h.created_at,title:h.result.title,
      nutrition_estimate:h.result.nutrition_estimate,
      flags:h.result.flags,
      best_alt:h.result.alternatives?.[h.result.best_alternative_index??0],
    }));
    fetchInsights({goal:settings.goal,restrictions:settings.restrictions,analyses})
      .then(setData)
      .catch(e=>{showToast(e.message||"Insights failed.");})
      .finally(()=>setLoading(false));
  },[enough]);

  if(!enough) return (
    <div style={{minHeight:"100vh",background:"var(--cream)",paddingTop:80,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{maxWidth:480,textAlign:"center",padding:"0 24px"}}>
        <div style={{fontSize:52,marginBottom:20}}>📊</div>
        <h2 style={{fontWeight:800,fontSize:26,marginBottom:12,letterSpacing:"-.02em"}}>Not enough data yet</h2>
        <p style={{fontSize:15,color:"var(--ink-2)",lineHeight:1.7,marginBottom:24}}>
          You need at least 3 saved analyses to unlock Daily Pattern Intelligence.
          You have <strong>{recent.length}</strong> — analyze {3-recent.length} more meal{3-recent.length!==1?"s":""} to get started.
        </p>
        <Pill tone="sage" size="md">{recent.length}/3 meals analyzed</Pill>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)",paddingTop:80}}>
      <div style={{maxWidth:860,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--sage)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>
            Daily Pattern Intelligence
          </div>
          <h1 style={{fontWeight:800,fontSize:34,letterSpacing:"-.03em"}}>Your Insights</h1>
          <p style={{color:"var(--ink-2)",fontSize:14,marginTop:6}}>Based on your last {recent.length} analyses.</p>
        </div>

        {loading&&(
          <Card style={{padding:28}}>
            <div style={{display:"flex",alignItems:"center",gap:14,color:"var(--ink-2)"}}>
              <Spinner size={20} color="var(--forest-l)"/><span>Analyzing your patterns with AI…</span>
            </div>
            <div style={{marginTop:20,display:"flex",flexDirection:"column",gap:10}}>
              {[180,240,140,200].map((w,i)=><div key={i} className="skel" style={{width:w,height:14}}/>)}
            </div>
          </Card>
        )}

        {data&&(
          <div style={{display:"flex",flexDirection:"column",gap:16,animation:"fadeUp .5s both"}}>
            {/* Title */}
            {data.title&&(
              <div style={{fontWeight:800,fontSize:20,color:"var(--forest)",marginBottom:4}}>{data.title}</div>
            )}

            {/* Biggest Pattern */}
            {data.biggest_pattern&&(
              <Card style={{padding:24,background:"var(--forest)",color:"var(--white)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--sage-l)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>
                  Biggest Pattern
                </div>
                <div style={{fontWeight:800,fontSize:20,marginBottom:8,lineHeight:1.25}}>{data.biggest_pattern.headline}</div>
                <div style={{fontSize:14,lineHeight:1.75,color:"rgba(255,255,255,.72)"}}>{data.biggest_pattern.detail}</div>
              </Card>
            )}

            {/* Wins + Risks side by side */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <Card style={{padding:22}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--forest-l)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>
                  Top Wins
                </div>
                {(data.wins||[]).map((w,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:10,fontSize:14,lineHeight:1.65}}>
                    <span style={{color:"var(--sage)",flexShrink:0,fontWeight:700}}>✓</span>
                    <span style={{color:"var(--ink-2)"}}>{w}</span>
                  </div>
                ))}
              </Card>
              <Card style={{padding:22}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--amber)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>
                  Watch Out
                </div>
                {(data.risks||[]).map((r,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:10,fontSize:14,lineHeight:1.65}}>
                    <span style={{color:"var(--amber)",flexShrink:0,fontWeight:700}}>·</span>
                    <span style={{color:"var(--ink-2)"}}>{r}</span>
                  </div>
                ))}
              </Card>
            </div>

            {/* High-leverage change */}
            {data.high_leverage_change&&(
              <Card style={{padding:24,background:"var(--sage-2xl)"}}>
                <div style={{fontSize:10,fontWeight:700,color:"var(--forest-l)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:10}}>
                  High-Leverage Change This Week
                </div>
                <div style={{fontWeight:800,fontSize:18,marginBottom:8,color:"var(--forest)",lineHeight:1.25}}>
                  {data.high_leverage_change.headline}
                </div>
                <div style={{fontSize:14,lineHeight:1.75,color:"var(--forest-m)",maxWidth:560}}>
                  {data.high_leverage_change.detail}
                </div>
              </Card>
            )}

            {/* Challenges */}
            {(data.challenges||[]).length>0&&(
              <div>
                <div style={{fontSize:10,fontWeight:700,color:"var(--ink-3)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:14}}>
                  Personalized Challenges
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {data.challenges.map(ch=>{
                    const isDone=done.includes(ch.id);
                    return (
                      <div key={ch.id} style={{background:"var(--white)",borderRadius:"var(--rad)",
                        padding:"16px 20px",boxShadow:"var(--sh-s)",display:"flex",gap:14,alignItems:"flex-start",
                        transition:"all .2s",opacity:isDone?.65:1}}>
                        <button onClick={()=>toggleDone(ch.id)} style={{
                          width:24,height:24,borderRadius:"50%",border:`2px solid ${isDone?"var(--forest-l)":"var(--cream-dd)"}`,
                          background:isDone?"var(--forest-l)":"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",
                          cursor:"pointer",flexShrink:0,marginTop:1,transition:"all .2s",
                          animation:isDone?"checkPop .3s var(--ease) both":"none"}}>
                          {isDone&&<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>}
                        </button>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:14,marginBottom:3,textDecoration:isDone?"line-through":"none",color:isDone?"var(--ink-3)":"var(--ink)"}}>
                            {ch.text}
                          </div>
                          <div style={{fontSize:12,color:"var(--ink-3)",lineHeight:1.6}}>{ch.why}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Impact Simulation with first two analyses */}
            {recent.length>=2&&recent[0].result.alternatives&&(()=>{
              const orig=recent[0].result.nutrition_estimate;
              const bi=recent[0].result.best_alternative_index??0;
              const alt=recent[0].result.alternatives[bi]?.nutrition_estimate;
              return orig&&alt?(
                <Card style={{padding:24}}>
                  <div style={{fontWeight:800,fontSize:17,marginBottom:4}}>Impact Simulation</div>
                  <div style={{fontSize:13,color:"var(--ink-3)",marginBottom:4}}>
                    Based on your most recent meal: <strong>{recent[0].result.title}</strong> → <strong>{recent[0].result.alternatives[bi]?.name}</strong>
                  </div>
                  <ImpactMeter origN={orig} altN={alt}/>
                </Card>
              ):null;
            })()}

            {/* Confidence / disclaimer */}
            {data.confidence_notes&&(
              <div style={{padding:"10px 14px",background:"var(--cream)",borderRadius:"var(--rad)",
                fontSize:12,color:"var(--ink-3)",lineHeight:1.6}}>
                <span style={{fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",fontSize:10}}>Confidence: </span>
                {data.confidence_notes}
              </div>
            )}
            {data.disclaimer&&(
              <div style={{fontSize:11,color:"var(--ink-3)",lineHeight:1.6}}>{data.disclaimer}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HISTORY PAGE
═══════════════════════════════════════════════════════════════ */
const HistoryPage = ({history,setHistory,onView,showToast}) => {
  const [q,setQ]=useState("");
  const [fg,setFg]=useState("all");
  const [cmpA,setCmpA]=useState(null);
  const [cmpB,setCmpB]=useState(null);
  const [verdict,setVerdict]=useState(null);
  const [vLoading,setVLoading]=useState(false);

  const filtered=history.filter(a=>{
    const ms=!q||a.result.title.toLowerCase().includes(q.toLowerCase());
    const mg=fg==="all"||a.goal===fg;
    return ms&&mg;
  });

  const handleCompare=item=>{
    if(!cmpA){setCmpA(item);return;}
    if(cmpA.id===item.id){setCmpA(null);return;}
    setCmpB(item); setVerdict(null);
  };

  const handleDelete=id=>{
    const next=history.filter(h=>h.id!==id);
    setHistory(next); saveHistory(next);
  };

  const generateVerdict=async()=>{
    if(!cmpA||!cmpB) return;
    setVLoading(true);
    try {
      const v=await fetchCompare({analysisA:cmpA,analysisB:cmpB,goal:"balance",restrictions:{tags:[]}});
      setVerdict(v);
    } catch(e){ showToast(e.message||"Compare failed."); }
    finally { setVLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)",paddingTop:80}}>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--sage)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Your Record</div>
          <h1 style={{fontWeight:800,fontSize:34,letterSpacing:"-.03em"}}>History</h1>
        </div>

        {/* Filters */}
        <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search meals…"
            style={{flex:1,minWidth:180,padding:"9px 14px",border:"1.5px solid var(--cream-d)",borderRadius:"var(--rad-p)",
              fontFamily:"var(--font)",fontSize:13,background:"var(--white)",color:"var(--ink)",outline:"none"}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"all",label:"All"},...GOALS].map(g=>(
              <button key={g.id} onClick={()=>setFg(g.id)} style={{padding:"7px 14px",borderRadius:"var(--rad-p)",
                border:`1.5px solid ${fg===g.id?"var(--forest-l)":"var(--cream-d)"}`,
                background:fg===g.id?"var(--sage-2xl)":"transparent",color:fg===g.id?"var(--forest-l)":"var(--ink-2)",
                fontFamily:"var(--font)",fontSize:12,fontWeight:fg===g.id?700:500,cursor:"pointer",transition:"all .18s"}}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {cmpA&&(
          <div style={{padding:"10px 16px",background:"var(--sage-2xl)",borderRadius:"var(--rad)",marginBottom:16,
            fontSize:13,color:"var(--forest-l)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>Selected: <strong>{cmpA.result.title}</strong> — tap another to compare</span>
            <button onClick={()=>{setCmpA(null);setCmpB(null);setVerdict(null);}}
              style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink-3)",fontSize:18,lineHeight:1}}>×</button>
          </div>
        )}

        {/* Compare Modal */}
        {cmpA&&cmpB&&(
          <div style={{position:"fixed",inset:0,background:"rgba(26,29,27,.6)",backdropFilter:"blur(6px)",
            zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}
            onClick={()=>{setCmpA(null);setCmpB(null);setVerdict(null);}}>
            <div style={{background:"var(--white)",borderRadius:"var(--rad-l)",padding:28,maxWidth:720,width:"100%",
              maxHeight:"90vh",overflowY:"auto",boxShadow:"var(--sh-l)",animation:"fadeUp .4s both"}}
              onClick={e=>e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <h2 style={{fontWeight:800,fontSize:22,letterSpacing:"-.02em"}}>Side-by-Side Comparison</h2>
                <button onClick={()=>{setCmpA(null);setCmpB(null);setVerdict(null);}}
                  style={{background:"none",border:"none",cursor:"pointer",color:"var(--ink-2)",fontSize:22,lineHeight:1,padding:"4px 8px"}}>×</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
                {[cmpA,cmpB].map((item,i)=>(
                  <div key={i} style={{background:i===0?"var(--cream)":"var(--sage-2xl)",borderRadius:"var(--rad)",padding:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:i===1?"var(--forest)":"var(--ink-3)",
                      letterSpacing:".07em",textTransform:"uppercase",marginBottom:5}}>
                      {i===0?"Meal A":"Meal B"}
                    </div>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:12,lineHeight:1.25,color:i===1?"var(--forest)":"var(--ink)"}}>
                      {item.result.title}
                    </div>
                    <NutrientRibbon nutrition={item.result.nutrition_estimate}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:12}}>
                      {[["Cal",item.result.nutrition_estimate?.calories,"kcal"],
                        ["Prot",item.result.nutrition_estimate?.protein_g,"g"],
                        ["Carb",item.result.nutrition_estimate?.carbs_g,"g"],
                        ["Fat",item.result.nutrition_estimate?.fat_g,"g"]].map(([l,v,u])=>(
                        <div key={l} style={{fontSize:12}}>
                          <span style={{color:i===1?"var(--forest-m)":"var(--ink-3)"}}>{l}: </span>
                          <span style={{fontWeight:700,color:i===1?"var(--forest)":"var(--ink)"}}>{v!=null?`${v}${u}`:"—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Generate Verdict button */}
              {!verdict&&(
                <div style={{textAlign:"center",marginBottom:16}}>
                  <Btn loading={vLoading} onClick={generateVerdict} variant="sage"
                    style={{fontSize:13,padding:"10px 22px"}}>
                    Generate AI Verdict
                  </Btn>
                </div>
              )}

              {/* Verdict result */}
              {verdict&&(
                <div style={{animation:"fadeUp .4s both"}}>
                  {verdict.verdict_title&&(
                    <div style={{textAlign:"center",marginBottom:14}}>
                      <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"var(--forest)",
                        color:"var(--white)",padding:"10px 22px",borderRadius:"var(--rad-p)",fontWeight:700,fontSize:14}}>
                        ★ {verdict.verdict_title}
                      </div>
                    </div>
                  )}
                  {verdict.verdict_summary&&(
                    <div style={{fontSize:14,color:"var(--ink-2)",lineHeight:1.7,marginBottom:14,maxWidth:580}}>{verdict.verdict_summary}</div>
                  )}
                  {(verdict.tradeoffs||[]).map((t,i)=>(
                    <div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:13}}>
                      <span style={{color:"var(--sage)",fontWeight:700,flexShrink:0}}>·</span>
                      <span style={{color:"var(--ink-2)"}}>{t}</span>
                    </div>
                  ))}
                  {verdict.recommendation&&(
                    <div style={{padding:"12px 16px",background:"var(--sage-2xl)",borderRadius:"var(--rad)",
                      fontSize:14,color:"var(--forest)",fontWeight:600,lineHeight:1.65,marginTop:12}}>
                      {verdict.recommendation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"72px 20px"}}>
            <div style={{fontWeight:700,fontSize:20,color:"var(--ink-2)",marginBottom:8}}>
              {q?"No matching analyses":"No analyses yet"}
            </div>
            <div style={{fontSize:13,color:"var(--ink-3)"}}>
              {q?"Try a different search.":"Analyze a meal to build your history."}
            </div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
            {filtered.map(item=>(
              <HistCard key={item.id} item={item}
                onView={item=>onView(item)} onCompare={handleCompare} onDelete={handleDelete}/>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SETTINGS PAGE
═══════════════════════════════════════════════════════════════ */
const SettingsPage = ({user,settings,onSave}) => {
  const [goal,setGoal]=useState(settings.goal||"balance");
  const [restr,setRestr]=useState(settings.restrictions?.tags||[]);
  const [name,setName]=useState(settings.name||"");
  const [saved,setSaved]=useState(false);
  const toggle=r=>setRestr(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r]);
  return (
    <div style={{minHeight:"100vh",background:"var(--cream)",paddingTop:80}}>
      <div style={{maxWidth:560,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:28}}>
          <div style={{fontSize:10,fontWeight:700,color:"var(--ink-3)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Preferences</div>
          <h1 style={{fontWeight:800,fontSize:34,letterSpacing:"-.03em"}}>Settings</h1>
        </div>
        <Card style={{padding:26}}>
          <FieldLabel>Display Name</FieldLabel>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"
            style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--cream-d)",borderRadius:"var(--rad)",
              fontFamily:"var(--font)",fontSize:14,color:"var(--ink)",background:"var(--cream)",outline:"none",marginBottom:18}}/>
          <FieldLabel>Default Goal</FieldLabel>
          <div style={{display:"flex",gap:3,background:"var(--cream)",borderRadius:"var(--rad)",padding:3,marginBottom:18}}>
            {GOALS.map(g=>(
              <button key={g.id} onClick={()=>setGoal(g.id)} style={{flex:1,padding:"7px 4px",borderRadius:10,border:"none",cursor:"pointer",
                fontFamily:"var(--font)",fontSize:12,fontWeight:goal===g.id?700:500,
                background:goal===g.id?"var(--white)":"transparent",color:goal===g.id?"var(--forest)":"var(--ink-2)",
                boxShadow:goal===g.id?"var(--sh-s)":"none",transition:"all .2s"}}>{g.label}</button>
            ))}
          </div>
          <FieldLabel>Default Restrictions</FieldLabel>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:24}}>
            {RESTRICTIONS.map(r=>{const a=restr.includes(r);return(
              <button key={r} onClick={()=>toggle(r)} style={{fontFamily:"var(--font)",fontSize:12,padding:"5px 12px",
                border:`1.5px solid ${a?"var(--sage)":"var(--cream-d)"}`,borderRadius:"var(--rad-p)",cursor:"pointer",fontWeight:a?700:500,
                background:a?"var(--sage-2xl)":"transparent",color:a?"var(--forest-l)":"var(--ink-2)",transition:"all .18s"}}>{r}</button>
            );})}
          </div>
          <Btn onClick={()=>{onSave({goal,restrictions:{tags:restr},name});setSaved(true);setTimeout(()=>setSaved(false),2500);}}
            style={{width:"100%",justifyContent:"center",background:saved?"var(--forest-l)":"var(--forest)"}}>
            {saved?"✓ Saved!":"Save Settings"}
          </Btn>
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════════ */
const AuthPage = ({onAuth,setPage}) => {
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [ld,setLd]=useState(false);
  const handle=async()=>{
    if(!email||!pw){setErr("Please fill in all fields.");return;}
    if(pw.length<6){setErr("Password must be at least 6 characters.");return;}
    setLd(true);setErr("");
    try{await onAuth(mode,email,pw,name);}
    catch(e){setErr(e.message||"Something went wrong.");}
    finally{setLd(false);}
  };
  const inp={width:"100%",padding:"11px 14px",border:"1.5px solid var(--cream-d)",borderRadius:"var(--rad)",
    fontFamily:"var(--font)",fontSize:14,color:"var(--ink)",background:"var(--cream)",outline:"none",marginBottom:14};
  return (
    <div style={{minHeight:"100vh",background:"var(--cream)",display:"flex",alignItems:"center",justifyContent:"center",
      padding:24,position:"relative",overflow:"hidden"}}>
      <HeroBg/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420,animation:"fadeUp .6s both"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <Logo onClick={()=>setPage("home")}/>
          </div>
          <p style={{color:"var(--ink-2)",fontSize:14}}>
            {mode==="signin"?"Sign in to save and compare your analyses":"Create a free account — takes 10 seconds"}
          </p>
        </div>
        <Card style={{padding:28}}>
          {mode==="signup"&&(
            <><FieldLabel>Name</FieldLabel>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/></>
          )}
          <FieldLabel>Email</FieldLabel>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inp}/>
          <FieldLabel>Password</FieldLabel>
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="••••••••" style={{...inp,marginBottom:6}}/>
          {err&&<div style={{fontSize:13,color:"var(--red-s)",marginBottom:10,fontWeight:500}}>{err}</div>}
          <Btn loading={ld} onClick={handle} style={{width:"100%",marginTop:10,justifyContent:"center"}}>
            {mode==="signin"?"Sign In →":"Create Account →"}
          </Btn>
          <div style={{textAlign:"center",marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
            <button onClick={()=>{setMode(m=>m==="signin"?"signup":"signin");setErr("");}}
              style={{fontFamily:"var(--font)",fontSize:13,color:"var(--ink-2)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
              {mode==="signin"?"No account? Create one free":"Already have an account? Sign in"}
            </button>
            <button onClick={()=>setPage("app")}
              style={{fontFamily:"var(--font)",fontSize:12,color:"var(--ink-3)",background:"none",border:"none",cursor:"pointer"}}>
              Continue as guest (demo mode)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
const Toast = ({message,onClose}) => (
  <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
    zIndex:500,background:"var(--ink)",color:"var(--white)",padding:"12px 20px",borderRadius:"var(--rad-p)",
    fontSize:13,fontWeight:600,boxShadow:"var(--sh-l)",display:"flex",alignItems:"flex-start",gap:12,
    animation:"toastIn .3s var(--ease) both",maxWidth:"90vw",maxHeight:"40vh",overflow:"auto",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
    <span style={{color:"var(--red-s)"}}>⚠</span>
    <span style={{flex:1}}>{message}</span>
    <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:16,lineHeight:1,padding:"0 2px",flexShrink:0}}>×</button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   GATE
═══════════════════════════════════════════════════════════════ */
const Gate = ({label,setPage}) => (
  <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
    flexDirection:"column",gap:16,padding:40,paddingTop:80}}>
    <div style={{fontWeight:800,fontSize:22,textAlign:"center",letterSpacing:"-.02em"}}>
      Sign in to access your {label}
    </div>
    <Btn onClick={()=>setPage("auth")}>Sign In</Btn>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [page,    setPage]    = useState("home");
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [homeRes, setHomeRes] = useState(null);
  const [history, setHistory] = useState([]);
  const [settings,setSettings]= useState({goal:"balance",restrictions:{tags:[]},name:""});
  const [toast,   setToast]   = useState(null);

  const showToast = useCallback(msg=>{setToast(msg);setTimeout(()=>setToast(null),5000);},[]);

  // load history from localStorage on client to avoid SSR/CSR markup mismatch
  useEffect(()=>{ try { const h = loadHistory(); if(h && h.length) setHistory(h); } catch{} },[]);

  const handleAnalyze = useCallback(async(input,isHome=false)=>{
    if(!input.mealText.trim()) return;
    setLoading(true);
    try {
      const r=await analyzeMeal(input);
      if(isHome) setHomeRes(r); else setResult(r);
    } catch(e){ showToast(e.message||"Analysis failed. Please try again."); }
    finally { setLoading(false); }
  },[showToast]);

  const handleSave = useCallback(()=>{
    if(!result||!user) return;
    const entry={id:Date.now().toString(),user_id:user.id,
      meal_text:result.title,goal:settings.goal,
      restrictions:settings.restrictions||{tags:[]},
      result,created_at:new Date().toISOString()};
    const next=[entry,...history];
    setHistory(next); saveHistory(next);
  },[result,user,settings,history]);

  const handleAuth=async(mode,email,pw,name)=>{
    await new Promise(r=>setTimeout(r,800));
    const u={id:"u_"+Math.random().toString(36).slice(2),email,name};
    setUser(u);
    setSettings(s=>({...s,name:name||email.split("@")[0]}));
    setPage("app");
  };

  return (
    <div>
      <Styles/>
      <Nav page={page} setPage={setPage} user={user}
        onLogout={()=>{setUser(null);setPage("home");}}/>

      {page==="home"     && <HomePage setPage={setPage} onAnalyze={v=>handleAnalyze(v,true)} loading={loading} result={homeRes}/>}
      {page==="app"      && <AppPage user={user} onAnalyze={v=>handleAnalyze(v,false)} loading={loading} result={result} onSave={handleSave}/>}
      {page==="history"  && (user?<HistoryPage history={history} setHistory={setHistory} showToast={showToast}
          onView={item=>{setResult(item.result);setPage("app");}}/>:<Gate label="history" setPage={setPage}/>)}
      {page==="insights" && (user?<InsightsPage history={history} settings={settings} showToast={showToast}/>:<Gate label="insights" setPage={setPage}/>)}
      {page==="settings" && (user?<SettingsPage user={user} settings={settings} onSave={s=>setSettings(s)}/>:<Gate label="settings" setPage={setPage}/>)}
      {page==="auth"     && <AuthPage onAuth={handleAuth} setPage={setPage}/>}

      {toast&&<Toast message={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
