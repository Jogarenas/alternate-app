import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES  — Syne + Instrument Sans + JetBrains Mono
   Palette: Forest green · Off-white · Charcoal · Sage accents
   Zero orange anywhere
═══════════════════════════════════════════════════════════════ */
const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* ── Greens */
      --g900: #0e2a16;
      --g800: #183d22;
      --g700: #1f5230;
      --g600: #2d6e42;
      --g500: #3a8a54;
      --g400: #5ca872;
      --g300: #8ecfa0;
      --g200: #c2e8cc;
      --g100: #e8f5ec;
      --g50:  #f3faf5;

      /* ── Neutrals */
      --n950: #0c0f0d;
      --n900: #141a16;
      --n800: #232b25;
      --n700: #374039;
      --n500: #5f6b62;
      --n400: #8a9a8d;
      --n300: #b8c4ba;
      --n200: #dde6de;
      --n100: #f0f5f0;
      --n50:  #f8fbf8;
      --white: #ffffff;

      /* ── Semantic */
      --bg:       var(--n50);
      --surface:  var(--white);
      --border:   var(--n200);
      --ink:      var(--n900);
      --ink2:     var(--n500);
      --ink3:     var(--n400);
      --accent:   var(--g600);
      --accent-l: var(--g400);
      --accent-w: var(--g100);

      --rad: 12px;
      --rad-lg: 18px;
      --pill: 9999px;
      --sh: 0 1px 3px rgba(14,42,22,.06), 0 4px 16px rgba(14,42,22,.05);
      --sh2: 0 4px 12px rgba(14,42,22,.08), 0 16px 48px rgba(14,42,22,.1);
      --ease: cubic-bezier(.16,1,.3,1);
    }

    html { scroll-behavior: smooth; }
    body {
      font-family: 'Instrument Sans', sans-serif;
      background: var(--bg);
      color: var(--ink);
      font-size: 15px;
      line-height: 1.65;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* Grain */
    body::after {
      content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 9999;
      opacity: .018;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
    }

    @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes pulse    { 0%,100%{opacity:.08} 50%{opacity:.18} }
    @keyframes drift    { 0%{transform:translate(0,0)} 100%{transform:translate(20px,10px)} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes expand   { from{max-height:0;opacity:0} to{max-height:6000px;opacity:1} }
    @keyframes shake    { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
    @keyframes ripple   { 0%{transform:scale(0);opacity:.4} 100%{transform:scale(3);opacity:0} }
    @keyframes barGrow  { from{width:0} }
    @keyframes slideR   { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:none} }

    .flip-card { perspective: 1000px; cursor: pointer; }
    .flip-inner { position:relative; width:100%; height:100%; transition:transform .5s var(--ease); transform-style:preserve-3d; }
    .flip-card.flipped .flip-inner { transform: rotateY(180deg); }
    .flip-front, .flip-back { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:var(--rad-lg); }
    .flip-back { transform: rotateY(180deg); }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--n100); }
    ::-webkit-scrollbar-thumb { background: var(--n300); border-radius: 3px; }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
  `}</style>
);

/* ── Gemini API call ─────────────────────────────────────────── */
const callGemini = async (prompt) => {
  const res = await fetch(
    `https://api.anthropic.com/v1/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are AlternAte, a meal analysis assistant. You provide practical nutritional analysis and suggest smarter food swaps. Rules:
1. ALWAYS return STRICT JSON only — no markdown fences, no text before or after the JSON.
2. For specific products (e.g. "Pepsi"), suggest the best direct product alternative first (e.g. "Diet Pepsi"), then healthier alternatives.
3. Preserve the "vibe" — same convenience level, similar taste profile.
4. Use hedged language: "may support", "often associated with" — never medical claims.
5. If macros are uncertain, use null and explain in confidence_notes.`,
        messages: [{ role: "user", content: prompt }]
      })
    }
  );
  const data = await res.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

const analyzeWithGemini = async ({ mealText, goal, restrictions }) => {
  const restrictionStr = restrictions.tags.length > 0 ? restrictions.tags.join(", ") : "none";
  const prompt = `Analyze this food/meal: "${mealText}"
User goal: ${goal}
Dietary restrictions: ${restrictionStr}

IMPORTANT: If the input is a specific product (like "Pepsi", "Big Mac", "Oreos"), the FIRST alternative must be the most well-known direct healthier version of that exact product (e.g. "Diet Pepsi" for "Pepsi", "McChicken Salad" for "Big Mac"). Then provide genuinely healthier alternatives.

Return this exact JSON structure:
{
  "title": "short descriptive name",
  "summary": "1-2 sentence practical summary relative to the goal",
  "macro_estimate": {
    "calories": number_or_null,
    "protein_g": number_or_null,
    "carbs_g": number_or_null,
    "fat_g": number_or_null,
    "sugar_g": number_or_null
  },
  "health_score": number_between_0_and_100,
  "flags": [
    { "type": "nutrient or ingredient name", "severity": "low|medium|high", "note": "one practical sentence" }
  ],
  "alternatives": [
    {
      "name": "alternative name",
      "why": "one sentence explaining the nutritional benefit",
      "swap_steps": ["step 1", "step 2", "step 3"],
      "macro_estimate": { "calories": number_or_null, "protein_g": number_or_null, "carbs_g": number_or_null, "fat_g": number_or_null, "sugar_g": number_or_null },
      "health_score": number_between_0_and_100,
      "improvement_tags": ["Lower Sugar", "More Protein", "etc"]
    }
  ],
  "confidence_notes": "brief note on estimate accuracy"
}
Provide exactly 3 alternatives. Return only the JSON.`;

  return callGemini(prompt);
};

/* ── Background ambient ─────────────────────────────────────── */
const HeroBg = () => (
  <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none", zIndex:0 }}>
    {[{top:"15%",d:9,dl:0},{top:"40%",d:11,dl:2.5},{top:"65%",d:8.5,dl:5},{top:"82%",d:13,dl:1.5}].map((r,i)=>(
      <div key={i} style={{
        position:"absolute", top:r.top, left:"-5%", width:"110%", height:7,
        borderRadius:9999, overflow:"hidden", display:"flex",
        animation:`pulse ${r.d}s ease-in-out ${r.dl}s infinite`,
      }}>
        {[[38,"var(--g600)"],[40,"var(--g400)"],[22,"var(--g300)"]].map(([w,c],j)=>(
          <div key={j} style={{width:`${w}%`, background:c, height:"100%"}}/>
        ))}
      </div>
    ))}
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.04,
      animation:"drift 26s ease-in-out infinite alternate"}}>
      <defs><pattern id="dg" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="var(--g600)"/>
      </pattern></defs>
      <rect width="200%" height="200%" fill="url(#dg)"/>
    </svg>
  </div>
);

/* ── Nutrient Ribbon ─────────────────────────────────────────── */
const Ribbon = ({ macros, size="full", animated=true }) => {
  const [on, setOn] = useState(!animated);
  useEffect(() => { if (animated) { const t = setTimeout(()=>setOn(true), 80); return ()=>clearTimeout(t); }}, [animated]);
  const tot = macros ? (macros.protein_g||0)*4+(macros.carbs_g||0)*4+(macros.fat_g||0)*9 : 0;
  const p = tot>0 ? ((macros?.protein_g||0)*4/tot)*100 : 33;
  const c = tot>0 ? ((macros?.carbs_g||0)*4/tot)*100 : 34;
  const f = tot>0 ? ((macros?.fat_g||0)*9/tot)*100 : 33;
  const h = size==="mini" ? 5 : 11;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,width:"100%"}}>
      <div style={{flex:1,height:h,borderRadius:9999,overflow:"hidden",
        background:"var(--n200)",display:"flex"}}>
        {[[p,"var(--g600)",0],[c,"var(--g400)",80],[f,"var(--g300)",160]].map(([pct,col,dl],i)=>(
          <div key={i} style={{height:"100%",width:on?`${pct}%`:"0%",background:col,
            transition:on?`width .7s ${dl}ms var(--ease)`:"none"}}/>
        ))}
      </div>
      {size==="full" && (
        <div style={{display:"flex",gap:8,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--ink2)"}}>
          <span style={{color:"var(--g600)"}}>P</span>
          <span style={{color:"var(--g400)"}}>C</span>
          <span style={{color:"var(--n400)"}}>F</span>
        </div>
      )}
    </div>
  );
};

/* ── Scroll visibility hook ─────────────────────────────────── */
const useVis = (t=.12) => {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting) setV(true); },{threshold:t});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[t]);
  return [ref,v];
};

/* ── Counter ─────────────────────────────────────────────────── */
const Counter = ({target,suffix="",prefix="",dur=1600,visible}) => {
  const [v,setV]=useState(0); const s=useRef(false);
  useEffect(()=>{
    if(!visible||s.current) return; s.current=true;
    const t0=performance.now();
    const tick=now=>{ const p=Math.min((now-t0)/dur,1); setV(Math.round((1-Math.pow(1-p,3))*target));
      if(p<1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  },[visible,target,dur]);
  return <span>{prefix}{v.toLocaleString()}{suffix}</span>;
};

/* ── Constants ───────────────────────────────────────────────── */
const GOALS = [
  {id:"balance",label:"Balance"},
  {id:"more_protein",label:"More Protein"},
  {id:"lower_carbs",label:"Lower Carbs"},
  {id:"more_energy",label:"More Energy"},
];
const RESTR = ["Vegetarian","Vegan","Gluten-Free","Dairy-Free","Nut-Free","Halal","Kosher","Low-Sodium"];
const CHIPS = ["Pepsi","Ramen","Cheeseburger","Pad Thai","Salad Bowl","Tacos","Pizza","Burrito Bowl","Oreos","Banana Bread"];

/* ── Atoms ───────────────────────────────────────────────────── */
const Tag = ({children,c="var(--g600)",bg="var(--g100)"}) => (
  <span style={{display:"inline-block",fontFamily:"'JetBrains Mono',monospace",fontSize:10,
    fontWeight:500,letterSpacing:".06em",textTransform:"uppercase",
    padding:"3px 10px",borderRadius:9999,background:bg,color:c}}>
    {children}
  </span>
);

const FL = ({children,mt=0}) => (
  <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,
    color:"var(--n400)",letterSpacing:".1em",textTransform:"uppercase",
    marginBottom:8,marginTop:mt}}>{children}</div>
);

const Card = ({children,style:s={}}) => (
  <div style={{background:"var(--surface)",border:"1px solid var(--border)",
    borderRadius:"var(--rad-lg)",boxShadow:"var(--sh)",...s}}>{children}</div>
);

const Btn = ({children,onClick,v="pri",s={}}) => {
  const base = {fontFamily:"'Syne',sans-serif",fontWeight:700,cursor:"pointer",
    border:"none",transition:"all .2s var(--ease)",borderRadius:9999,
    display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,
    letterSpacing:".01em"};
  const vs = {
    pri: {...base,background:"var(--g800)",color:"var(--white)",padding:"13px 28px",fontSize:14,
      boxShadow:"0 4px 20px rgba(14,42,22,.22)"},
    ghost: {...base,background:"transparent",color:"var(--ink)",
      border:"1.5px solid var(--border)",padding:"11px 22px",fontSize:14},
    green: {...base,background:"var(--g600)",color:"var(--white)",padding:"11px 22px",fontSize:14},
    outline: {...base,background:"transparent",color:"var(--g600)",
      border:"1.5px solid var(--g600)",padding:"10px 20px",fontSize:13},
  };
  return (
    <button onClick={onClick} style={{...(vs[v]||vs.pri),...s}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px) scale(1.01)"}
      onMouseLeave={e=>e.currentTarget.style.transform=""}>
      {children}
    </button>
  );
};

const Spinner = () => (
  <div style={{width:18,height:18,border:"2.5px solid rgba(255,255,255,.3)",
    borderTopColor:"var(--white)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
);

/* ── Health Score Ring ───────────────────────────────────────── */
const ScoreRing = ({score, size=52}) => {
  const r=18, c=2*Math.PI*r;
  const dash = (score/100)*c;
  const color = score>=70?"var(--g500)":score>=40?"var(--g400)":"var(--n400)";
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--n200)" strokeWidth="3.5"/>
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{transition:"stroke-dasharray .8s var(--ease)"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",
        justifyContent:"center",fontFamily:"'JetBrains Mono',monospace",
        fontSize:11,fontWeight:500,color}}>{score}</div>
    </div>
  );
};

/* ── Macro bar ───────────────────────────────────────────────── */
const MacroBar = ({label,val,unit,max,color}) => {
  const pct = max > 0 ? Math.min((val/max)*100,100) : 0;
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:"var(--ink2)"}}>{label}</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
          fontWeight:500,color:"var(--ink)"}}>{val!=null?`${val}${unit}`:"—"}</span>
      </div>
      <div style={{height:5,borderRadius:9999,background:"var(--n200)",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:9999,
          animation:"barGrow .7s var(--ease) both"}}/>
      </div>
    </div>
  );
};

/* ── Meal Input Card ─────────────────────────────────────────── */
const MealInput = ({onAnalyze, loading}) => {
  const [meal,setMeal]=useState("");
  const [goal,setGoal]=useState("balance");
  const [restr,setRestr]=useState([]);
  const [shake,setShake]=useState(false);
  const [err,setErr]=useState("");
  const toggle=r=>setRestr(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r]);
  const submit=()=>{
    if(!meal.trim()){setShake(true);setErr("Please describe your meal.");setTimeout(()=>setShake(false),500);return;}
    if(meal.length>2000){setErr("Too long — keep it under 2000 chars.");return;}
    setErr("");onAnalyze({mealText:meal,goal,restrictions:{tags:restr}});
  };
  return (
    <Card style={{padding:28}}>
      <div style={{position:"relative"}}>
        <textarea value={meal} onChange={e=>{setMeal(e.target.value);setErr("");}}
          placeholder="Type any food, drink, or meal… e.g. Pepsi, beef ramen, cheeseburger, banana bread"
          rows={4} maxLength={2000}
          style={{width:"100%",padding:"14px 16px",
            border:`1.5px solid ${err?"#c0392b":"var(--border)"}`,
            borderRadius:"var(--rad)",fontFamily:"'Instrument Sans',sans-serif",fontSize:15,
            color:"var(--ink)",background:"var(--n50)",resize:"none",outline:"none",
            lineHeight:1.6,transition:"border-color .2s",
            animation:shake?"shake .4s ease":"none"}}
          onFocus={e=>e.target.style.borderColor="var(--g600)"}
          onBlur={e=>e.target.style.borderColor=err?"#c0392b":"var(--border)"}/>
        <div style={{position:"absolute",bottom:10,right:12,
          fontFamily:"'JetBrains Mono',monospace",fontSize:9,
          color:meal.length>1800?"#c0392b":"var(--n400)"}}>
          {meal.length}/2000
        </div>
      </div>

      {/* Example chips */}
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:12,alignItems:"center"}}>
        <span style={{fontSize:11,color:"var(--ink3)",fontFamily:"'Syne',sans-serif",
          fontWeight:600,letterSpacing:".05em",textTransform:"uppercase"}}>Try:</span>
        {CHIPS.map(ch=>(
          <button key={ch} onClick={()=>{setMeal(ch);setErr("");}}
            style={{fontFamily:"'Instrument Sans',sans-serif",fontSize:12,
              padding:"4px 12px",border:"1px solid var(--border)",borderRadius:9999,
              background:"var(--surface)",color:"var(--ink2)",cursor:"pointer",transition:"all .18s"}}
            onMouseEnter={e=>{e.target.style.background="var(--g100)";e.target.style.color="var(--g700)";e.target.style.borderColor="var(--g300)";}}
            onMouseLeave={e=>{e.target.style.background="var(--surface)";e.target.style.color="var(--ink2)";e.target.style.borderColor="var(--border)";}}>
            {ch}
          </button>
        ))}
      </div>

      {/* Goal */}
      <div style={{marginTop:18}}>
        <FL>Your Goal</FL>
        <div style={{display:"flex",gap:3,background:"var(--n100)",borderRadius:"var(--rad)",padding:3}}>
          {GOALS.map(g=>(
            <button key={g.id} onClick={()=>setGoal(g.id)} style={{
              flex:1,padding:"8px 6px",borderRadius:9,border:"none",cursor:"pointer",
              fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:goal===g.id?700:500,
              background:goal===g.id?"var(--surface)":"transparent",
              color:goal===g.id?"var(--g700)":"var(--n500)",
              boxShadow:goal===g.id?"var(--sh)":"none",transition:"all .2s"}}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Restrictions */}
      <div style={{marginTop:16}}>
        <FL>Dietary Restrictions</FL>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {RESTR.map(r=>{const a=restr.includes(r);return(
            <button key={r} onClick={()=>toggle(r)} style={{
              fontFamily:"'Instrument Sans',sans-serif",fontSize:12,padding:"5px 12px",
              border:`1.5px solid ${a?"var(--g500)":"var(--border)"}`,borderRadius:9999,
              cursor:"pointer",fontWeight:a?600:400,
              background:a?"var(--g100)":"transparent",
              color:a?"var(--g700)":"var(--ink2)",transition:"all .18s"}}>
              {r}
            </button>);})}
        </div>
      </div>

      {err&&<div style={{marginTop:10,fontSize:13,color:"#c0392b"}}>{err}</div>}

      <button onClick={submit} disabled={loading} style={{
        marginTop:20,width:"100%",padding:"15px",
        background:loading?"var(--n700)":"var(--g800)",
        color:"var(--white)",border:"none",borderRadius:9999,
        fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,
        cursor:loading?"not-allowed":"pointer",
        transition:"all .25s var(--ease)",
        display:"flex",alignItems:"center",justifyContent:"center",gap:10,
        letterSpacing:".02em",
        boxShadow:loading?"none":"0 4px 24px rgba(14,42,22,.25)"}}>
        {loading ? <><Spinner/><span>Analyzing with AI…</span></> : "Analyze Meal →"}
      </button>
    </Card>
  );
};

/* ── Flags ───────────────────────────────────────────────────── */
const Flags = ({flags}) => {
  const cols={high:"#c0392b",medium:"var(--g700)",low:"var(--g500)"};
  const bgs={high:"#fdf2f2",medium:"var(--g100)",low:"var(--g50)"};
  const sorted=[...flags].sort((a,b)=>["high","medium","low"].indexOf(a.severity)-["high","medium","low"].indexOf(b.severity));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {sorted.length===0?(
        <div style={{display:"flex",alignItems:"center",gap:8,color:"var(--g600)",fontSize:14}}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          No notable flags for this meal.
        </div>
      ):sorted.map((f,i)=>(
        <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",
          padding:"12px 14px",background:bgs[f.severity],borderRadius:"var(--rad)",
          border:`1px solid ${f.severity==="high"?"#f5c6c6":f.severity==="medium"?"var(--g200)":"var(--g200)"}`}}>
          <div style={{clipPath:"polygon(5px 0%,100% 0%,calc(100% - 5px) 100%,0% 100%)",
            background:cols[f.severity],color:"white",padding:"2px 12px",
            fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:500,
            letterSpacing:".06em",textTransform:"uppercase",whiteSpace:"nowrap",marginTop:1}}>
            {f.severity}
          </div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,marginBottom:2}}>{f.type}</div>
            <div style={{color:"var(--ink2)",fontSize:13,lineHeight:1.5}}>{f.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Alt Card ────────────────────────────────────────────────── */
const AltCard = ({alt,idx}) => {
  const [fl,setFl]=useState(false);
  const m=alt.macro_estimate;
  return (
    <div className={`flip-card${fl?" flipped":""}`}
      style={{height:300,animation:`fadeUp .5s ${idx*.1}s both`}}
      onClick={()=>setFl(f=>!f)}>
      <div className="flip-inner">
        {/* Front */}
        <div className="flip-front" style={{
          background:"var(--surface)",border:"1px solid var(--border)",
          padding:22,display:"flex",flexDirection:"column",justifyContent:"space-between",
          boxShadow:"var(--sh)"}}>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <Tag>Alt {String(idx+1).padStart(2,"0")}</Tag>
              {alt.health_score && <ScoreRing score={alt.health_score} size={44}/>}
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,
              lineHeight:1.25,marginBottom:8,color:"var(--ink)"}}>{alt.name}</div>
            <div style={{color:"var(--ink2)",fontSize:13,lineHeight:1.55}}>{alt.why}</div>
          </div>
          <div>
            {alt.improvement_tags?.length>0 && (
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                {alt.improvement_tags.map((t,i)=>(
                  <span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:9999,
                    background:"var(--g100)",color:"var(--g700)",
                    fontFamily:"'JetBrains Mono',monospace",fontWeight:500}}>
                    ↑ {t}
                  </span>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {m?.calories&&<MPill l="kcal" v={m.calories} c="var(--n500)"/>}
              {m?.protein_g&&<MPill l="P" v={`${m.protein_g}g`} c="var(--g600)"/>}
              {m?.carbs_g&&<MPill l="C" v={`${m.carbs_g}g`} c="var(--g400)"/>}
              {m?.fat_g&&<MPill l="F" v={`${m.fat_g}g`} c="var(--n400)"/>}
            </div>
            <div style={{fontSize:10,color:"var(--n400)",textAlign:"center",fontFamily:"'JetBrains Mono',monospace"}}>
              tap for swap steps →
            </div>
          </div>
        </div>
        {/* Back */}
        <div className="flip-back" style={{
          background:"var(--g800)",border:"1px solid var(--g700)",
          padding:22,display:"flex",flexDirection:"column",justifyContent:"space-between",
          boxShadow:"var(--sh)"}}>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,
              color:"var(--g300)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:12}}>
              Swap Steps
            </div>
            <ol style={{paddingLeft:18,display:"flex",flexDirection:"column",gap:10}}>
              {alt.swap_steps?.map((step,j)=>(
                <li key={j} style={{fontSize:13,lineHeight:1.55,color:"var(--n100)"}}>{step}</li>
              ))}
            </ol>
          </div>
          <div style={{fontSize:11,color:"var(--g300)",fontFamily:"'JetBrains Mono',monospace"}}>
            ← tap to flip back
          </div>
        </div>
      </div>
    </div>
  );
};

const MPill = ({l,v,c}) => (
  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"3px 9px",
    borderRadius:9999,background:`color-mix(in srgb,${c} 12%,transparent)`,
    color:c,fontWeight:500,display:"flex",gap:3,alignItems:"center"}}>
    <span style={{opacity:.6,fontSize:8}}>{l}</span>{v}
  </div>
);

/* ── Compare view ────────────────────────────────────────────── */
const CompareView = ({result}) => {
  const alt = result.alternatives?.[0];
  if (!alt) return <div style={{color:"var(--ink2)",fontSize:14}}>Run an analysis first to compare.</div>;
  const sides=[
    {title:result.title,m:result.macro_estimate,score:result.health_score,label:"Original"},
    {title:alt.name,m:alt.macro_estimate,score:alt.health_score,label:"Best Swap"},
  ];
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 40px 1fr",gap:12,alignItems:"start",marginBottom:20}}>
        {sides.map((s,i)=>i===1?null:(
          <div key={i} style={{background:"var(--n50)",borderRadius:"var(--rad)",padding:16}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
              color:"var(--n400)",marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>
              {i===0?"Original":"Best Swap"}
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,
              marginBottom:12,lineHeight:1.25}}>
              {s.title}
            </div>
            {s.score && <ScoreRing score={s.score} size={44}/>}
            <div style={{marginTop:12}}>
              <Ribbon macros={s.m} animated/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:10}}>
              {[["Cal",s.m?.calories,"kcal"],["Prot",s.m?.protein_g,"g"],["Carb",s.m?.carbs_g,"g"],["Fat",s.m?.fat_g,"g"]].map(([l,v,u])=>(
                <div key={l} style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:"var(--n400)",fontSize:9}}>{l} </span>
                  <span style={{fontWeight:500}}>{v!=null?`${v}${u}`:"—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:40}}>
          <div style={{width:1,flex:1,background:"var(--g300)",opacity:.4}}/>
          <div style={{background:"var(--g100)",border:"1px solid var(--g300)",color:"var(--g700)",
            fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:500,
            padding:"4px 6px",borderRadius:6,margin:"6px 0",textAlign:"center",lineHeight:1.3}}>
            VS
          </div>
          <div style={{width:1,flex:1,background:"var(--g300)",opacity:.4}}/>
        </div>
        {sides.filter((_,i)=>i===1).map((s,i)=>(
          <div key={i} style={{background:"var(--g100)",borderRadius:"var(--rad)",padding:16,
            border:"1px solid var(--g200)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
              color:"var(--g600)",marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>
              Best Swap
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,
              marginBottom:12,lineHeight:1.25,color:"var(--g800)"}}>
              {s.title}
            </div>
            {s.score && <ScoreRing score={s.score} size={44}/>}
            <div style={{marginTop:12}}>
              <Ribbon macros={s.m} animated/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:10}}>
              {[["Cal",s.m?.calories,"kcal"],["Prot",s.m?.protein_g,"g"],["Carb",s.m?.carbs_g,"g"],["Fat",s.m?.fat_g,"g"]].map(([l,v,u])=>(
                <div key={l} style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:"var(--g600)",fontSize:9}}>{l} </span>
                  <span style={{fontWeight:500,color:"var(--g800)"}}>{v!=null?`${v}${u}`:"—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {result.alternatives?.[0]?.why && (
        <div style={{padding:"14px 18px",background:"var(--g800)",borderRadius:"var(--rad)",
          color:"var(--g200)",fontSize:14,lineHeight:1.55}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,color:"var(--white)"}}>
            Recommendation:{" "}
          </span>
          {result.alternatives[0].why}
        </div>
      )}
    </div>
  );
};

/* ── Results panel ───────────────────────────────────────────── */
const Results = ({result, onSave, canSave, isDemo}) => {
  const [tab,setTab]=useState("overview");
  const [saved,setSaved]=useState(false);
  const tabs=["overview","breakdown","alternatives","compare"];
  const m=result.macro_estimate;
  return (
    <div style={{animation:"expand .5s var(--ease) both",overflow:"hidden"}}>
      {isDemo && (
        <div style={{background:"var(--g100)",border:"1px solid var(--g200)",borderRadius:"var(--rad)",
          padding:"10px 16px",marginBottom:14,fontSize:13,color:"var(--g700)",
          display:"flex",alignItems:"center",gap:8}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Demo mode — sign in to save and compare analyses.
        </div>
      )}

      {/* Results header */}
      <Card style={{padding:24,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,
              lineHeight:1.15,marginBottom:6}}>{result.title}</div>
            <div style={{color:"var(--ink2)",fontSize:14,marginBottom:16,lineHeight:1.55}}>
              {result.summary}
            </div>
            <Ribbon macros={m}/>
          </div>
          {result.health_score && <ScoreRing score={result.health_score} size={58}/>}
        </div>
        <div style={{fontSize:10,color:"var(--n400)",marginTop:12,
          fontFamily:"'JetBrains Mono',monospace"}}>
          Estimates only · Not medical advice · Consult a professional for dietary guidance
        </div>
      </Card>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,background:"var(--n100)",borderRadius:"var(--rad)",
        padding:3,marginBottom:12}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",
            fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:tab===t?700:500,
            textTransform:"capitalize",
            background:tab===t?"var(--surface)":"transparent",
            color:tab===t?"var(--g800)":"var(--n500)",
            boxShadow:tab===t?"var(--sh)":"none",transition:"all .2s"}}>
            {t}
          </button>
        ))}
      </div>

      <Card style={{padding:24}}>
        {tab==="overview" && (
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:18}}>
              Nutritional Overview
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:10,marginBottom:20}}>
              {[["Calories",m?.calories,"kcal","var(--n700)"],
                ["Protein",m?.protein_g,"g","var(--g600)"],
                ["Carbs",m?.carbs_g,"g","var(--g400)"],
                ["Fat",m?.fat_g,"g","var(--n400)"],
                ["Sugar",m?.sugar_g,"g","var(--n500)"]].map(([l,v,u,c])=>(
                <div key={l} style={{background:"var(--n50)",borderRadius:"var(--rad)",
                  padding:"14px 12px",textAlign:"center",border:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,
                    fontWeight:500,color:c,lineHeight:1}}>
                    {v!=null?v:<span style={{opacity:.3}}>—</span>}
                    {v!=null&&<span style={{fontSize:10,marginLeft:2}}>{u}</span>}
                  </div>
                  <div style={{fontSize:10,color:"var(--n400)",marginTop:4,
                    fontFamily:"'Syne',sans-serif",fontWeight:600,
                    letterSpacing:".04em",textTransform:"uppercase"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{marginBottom:4}}>
              <MacroBar label="Protein" val={m?.protein_g} unit="g" max={60} color="var(--g600)"/>
              <MacroBar label="Carbohydrates" val={m?.carbs_g} unit="g" max={150} color="var(--g400)"/>
              <MacroBar label="Fat" val={m?.fat_g} unit="g" max={80} color="var(--n400)"/>
              {m?.sugar_g!=null && <MacroBar label="Sugar" val={m.sugar_g} unit="g" max={50} color="var(--n500)"/>}
            </div>
            {result.confidence_notes && (
              <div style={{marginTop:14,padding:"12px 14px",background:"var(--n50)",
                borderRadius:"var(--rad)",fontSize:13,color:"var(--ink2)",lineHeight:1.5,
                border:"1px solid var(--border)"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:9,fontWeight:700,
                  letterSpacing:".1em",textTransform:"uppercase",color:"var(--n400)",
                  marginBottom:4}}>Confidence Note</div>
                {result.confidence_notes}
              </div>
            )}
          </div>
        )}
        {tab==="breakdown" && (
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:16}}>
              Ingredient Flags{" "}
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,
                fontWeight:400,color:"var(--n400)"}}>{result.flags?.length||0}</span>
            </div>
            <Flags flags={result.flags||[]}/>
          </div>
        )}
        {tab==="alternatives" && (
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:16}}>
              Smarter Swaps
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
              {(result.alternatives||[]).map((a,i)=><AltCard key={i} alt={a} idx={i}/>)}
            </div>
          </div>
        )}
        {tab==="compare" && <CompareView result={result}/>}
      </Card>

      {canSave && !saved && (
        <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
          <Btn v="outline" onClick={()=>{onSave();setSaved(true);}}>Save Analysis</Btn>
        </div>
      )}
      {saved && (
        <div style={{marginTop:12,textAlign:"right",color:"var(--g600)",fontSize:13,
          fontFamily:"'JetBrains Mono',monospace",fontWeight:500}}>
          ✓ saved to history
        </div>
      )}
    </div>
  );
};

/* ── History card ────────────────────────────────────────────── */
const HistCard = ({a, onView, onCompare}) => {
  const date=new Date(a.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  return (
    <div onClick={()=>onView(a)}
      style={{background:"var(--surface)",border:"1px solid var(--border)",
        borderRadius:"var(--rad-lg)",padding:18,boxShadow:"var(--sh)",
        cursor:"pointer",transition:"all .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--sh2)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="var(--sh)";}}>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,
        marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {a.result_json.title}
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12}}>
        <Tag>{GOALS.find(g=>g.id===a.goal)?.label||a.goal}</Tag>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--n400)"}}>{date}</span>
      </div>
      <Ribbon macros={a.result_json.macro_estimate} size="mini" animated/>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
        <button onClick={e=>{e.stopPropagation();onCompare(a);}}
          style={{fontSize:12,padding:"4px 12px",border:"1px solid var(--border)",
            borderRadius:9999,background:"transparent",color:"var(--ink2)",
            cursor:"pointer",fontFamily:"'Syne',sans-serif",fontWeight:600,transition:"all .18s"}}
          onMouseEnter={e=>{e.target.style.borderColor="var(--g500)";e.target.style.color="var(--g600)";}}
          onMouseLeave={e=>{e.target.style.borderColor="var(--border)";e.target.style.color="var(--ink2)";}}>
          Compare
        </button>
      </div>
    </div>
  );
};

/* ── Logo mark ───────────────────────────────────────────────── */
const Logo = ({onClick}) => (
  <div onClick={onClick} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
    {/* Icon mark */}
    <div style={{width:30,height:30,borderRadius:8,background:"var(--g800)",
      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
      boxShadow:"0 2px 8px rgba(14,42,22,.25)"}}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2C5 2 3 4.5 3 7.5S5.5 13 8 14c2.5-1 5-3.5 5-6.5S11 2 8 2z" fill="var(--g300)" opacity=".6"/>
        <path d="M8 4.5c0 0-1.5 1.5-1.5 3S7.5 11 8 11.5C8.5 11 10 9.5 10 7.5S8 4.5 8 4.5z" fill="var(--white)"/>
        <circle cx="8" cy="7.5" r="1.5" fill="var(--g400)"/>
      </svg>
    </div>
    <div style={{display:"flex",alignItems:"baseline",gap:0}}>
      <span style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,
        color:"var(--g900)",letterSpacing:"-.02em"}}>Altern</span>
      <span style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,
        color:"var(--g500)",letterSpacing:"-.02em"}}>Ate</span>
    </div>
  </div>
);

/* ── Nav ─────────────────────────────────────────────────────── */
const Nav = ({page, setPage, user, onLogout}) => {
  const [sc,setSc]=useState(false);
  useEffect(()=>{
    const fn=()=>setSc(window.scrollY>30);
    window.addEventListener("scroll",fn); return ()=>window.removeEventListener("scroll",fn);
  },[]);
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
      background:sc?"color-mix(in srgb,var(--surface) 94%,transparent)":"transparent",
      backdropFilter:sc?"blur(16px)":"none",
      borderBottom:sc?"1px solid var(--border)":"none",
      transition:"all .3s",
      padding:"0 clamp(16px,4vw,48px)",height:60,
      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <Logo onClick={()=>setPage("home")}/>
      <div style={{display:"flex",gap:2,alignItems:"center"}}>
        {[{id:"home",l:"Home"},{id:"app",l:"Analyze"},
          ...(user?[{id:"history",l:"History"},{id:"settings",l:"Settings"}]:[])
        ].map(({id,l})=>(
          <button key={id} onClick={()=>setPage(id)} style={{
            fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:page===id?700:500,
            color:page===id?"var(--g800)":"var(--n500)",background:"transparent",
            border:"none",cursor:"pointer",padding:"6px 12px",borderRadius:8,
            transition:"all .18s"}}>
            {l}
          </button>
        ))}
        {user ? (
          <button onClick={onLogout} style={{fontFamily:"'Syne',sans-serif",fontSize:13,
            fontWeight:600,padding:"7px 14px",border:"1px solid var(--border)",
            borderRadius:9999,background:"transparent",color:"var(--ink2)",
            cursor:"pointer",marginLeft:4}}>
            Sign Out
          </button>
        ) : (
          <Btn v="pri" onClick={()=>setPage("auth")} s={{padding:"8px 18px",fontSize:13,marginLeft:4}}>
            Sign In
          </Btn>
        )}
      </div>
    </nav>
  );
};

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════ */
const Home = ({setPage, onAnalyze, loading, result}) => {
  const [sRef,sVis]=useVis(.18);
  const [gRef,gVis]=useVis(.1);
  const [hRef,hVis]=useVis(.1);
  const [iRef,iVis]=useVis(.1);

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{position:"relative",minHeight:"100vh",display:"flex",
        alignItems:"center",padding:"100px clamp(16px,5vw,72px) 60px",
        overflow:"hidden",background:"var(--bg)"}}>
        <HeroBg/>
        <div style={{maxWidth:1040,margin:"0 auto",width:"100%",position:"relative",zIndex:1,
          display:"grid",gridTemplateColumns:"1fr 1fr",gap:56,alignItems:"center"}}>
          <div>
            <div style={{animation:"fadeUp .7s .05s both"}}>
              <Tag>AI-Powered Meal Analysis</Tag>
            </div>
            <h1 style={{fontFamily:"'Syne',sans-serif",
              fontSize:"clamp(38px,5.2vw,66px)",fontWeight:800,lineHeight:1.05,
              marginTop:20,marginBottom:22,animation:"fadeUp .7s .15s both",
              letterSpacing:"-.03em",color:"var(--n900)"}}>
              Eat what you love.<br/>
              <span style={{color:"var(--g600)"}}>Eat it smarter.</span>
            </h1>
            <p style={{fontSize:16,color:"var(--ink2)",lineHeight:1.7,
              maxWidth:420,marginBottom:34,animation:"fadeUp .7s .25s both"}}>
              Type any food, drink, or meal. Get a real AI analysis powered by Gemini, with practical swaps that preserve the taste while improving the nutrition.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",animation:"fadeUp .7s .35s both"}}>
              <Btn onClick={()=>setPage("app")}>Analyze a Meal</Btn>
              <Btn v="ghost" onClick={()=>document.getElementById("how")?.scrollIntoView({behavior:"smooth"})}>
                How it works ↓
              </Btn>
            </div>
            {/* Mini stats row */}
            <div style={{display:"flex",gap:28,marginTop:38,animation:"fadeUp .7s .45s both",
              paddingTop:28,borderTop:"1px solid var(--border)"}}>
              {[["350 kcal","avg daily reduction"],["3×","more protein possible"],["78%","users love the taste"]].map(([n,l])=>(
                <div key={n}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,
                    color:"var(--g700)",lineHeight:1}}>{n}</div>
                  <div style={{fontSize:11,color:"var(--n400)",marginTop:4,lineHeight:1.4,
                    fontFamily:"'JetBrains Mono',monospace"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{animation:"fadeUp .7s .2s both"}}>
            <MealInput onAnalyze={onAnalyze} loading={loading}/>
            {result && (
              <div style={{marginTop:18}}>
                <Results result={result} canSave={false} isDemo onSave={()=>{}}/>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── HEALTH CRISIS STATS ── */}
      <section ref={sRef} style={{background:"var(--g900)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{marginBottom:52,opacity:sVis?1:0,transform:sVis?"none":"translateY(18px)",
            transition:"all .6s var(--ease)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--g300)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>
              The state of our health
            </div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,52px)",
              fontWeight:800,color:"var(--white)",lineHeight:1.1,letterSpacing:"-.025em"}}>
              The data is clear.<br/>
              <span style={{color:"var(--g300)"}}>What we eat is hurting us.</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>
            {[{n:50,s:"%",label:"of Americans have prediabetes or diabetes",src:"CDC, 2024"},
              {n:75,s:"%",label:"of adults have at least one chronic condition",src:"CDC, 2023"},
              {n:90,s:"%",label:"of US healthcare spending treats chronic disease",src:"realfood.gov"},
              {n:68,s:"%",label:"of a US child's diet is ultra-processed food",src:"JAMA, 2023"},
            ].map((st,i)=>(
              <div key={i} style={{padding:"40px 28px",
                borderRight:i<3?"1px solid rgba(255,255,255,.06)":"none",
                opacity:sVis?1:0,transform:sVis?"none":"translateY(22px)",
                transition:`all .55s ${.08+i*.1}s var(--ease)`}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontStyle:"normal",
                  fontSize:"clamp(52px,6vw,80px)",fontWeight:800,lineHeight:1,
                  color:"var(--g300)",marginBottom:14,letterSpacing:"-.04em"}}>
                  {sVis&&<Counter target={st.n} suffix={st.s} visible={sVis}/>}
                </div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.6)",lineHeight:1.55,marginBottom:8}}>{st.label}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
                  color:"rgba(255,255,255,.25)",letterSpacing:".06em"}}>{st.src}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION BRIDGE ── */}
      <section style={{background:"var(--g700)",padding:"60px clamp(16px,5vw,72px)",textAlign:"center"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(24px,3.8vw,48px)",
            fontWeight:800,color:"var(--white)",lineHeight:1.1,letterSpacing:"-.025em"}}>
            Small swaps.<br/><span style={{color:"var(--g200)"}}>Massive impact over time.</span>
          </h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,.7)",marginTop:16,lineHeight:1.65}}>
            AlternAte uses AI to find the version of your favourite meals that supports your health — without lecturing you or stripping away the joy of food.
          </p>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ── */}
      <section ref={iRef} style={{background:"var(--n100)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{marginBottom:48,opacity:iVis?1:0,transform:iVis?"none":"translateY(16px)",
            transition:"all .55s var(--ease)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--g600)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>
              What AlternAte delivers
            </div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,3.6vw,46px)",
              fontWeight:800,lineHeight:1.1,letterSpacing:"-.025em"}}>
              Real improvements,<br/><span style={{color:"var(--g600)"}}>without losing what you love.</span>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
            {[{n:350,s:"kcal",label:"average daily calorie reduction when swaps are applied",c:"var(--g700)"},
              {n:2,s:"×",label:"protein improvement possible in most meals",c:"var(--g600)"},
              {n:78,s:"%",label:"of users say alternatives tasted just as good",c:"var(--g500)"},
              {n:3,s:" swaps",label:"per day to meaningfully shift your nutritional balance",c:"var(--g400)"},
            ].map((item,i)=>(
              <Card key={i} style={{padding:"28px 22px",
                opacity:iVis?1:0,transform:iVis?"none":"translateY(18px)",
                transition:`all .5s ${.08+i*.1}s var(--ease)`}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(36px,4vw,56px)",
                  fontWeight:800,color:item.c,lineHeight:1,marginBottom:10,letterSpacing:"-.03em"}}>
                  {iVis&&<Counter target={item.n} suffix={item.s} visible={iVis} dur={1400}/>}
                </div>
                <div style={{fontSize:13,color:"var(--ink2)",lineHeight:1.55}}>{item.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR GOALS ── */}
      <section ref={gRef} style={{background:"var(--bg)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto",
          display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"start"}}>
          <div style={{position:"sticky",top:80,
            opacity:gVis?1:0,transform:gVis?"none":"translateY(16px)",
            transition:"all .55s var(--ease)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--g500)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:14}}>Our Purpose</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,3.8vw,50px)",
              fontWeight:800,lineHeight:1.08,letterSpacing:"-.025em",marginBottom:18}}>
              Our<br/><span style={{color:"var(--g600)"}}>Goals</span>
            </h2>
            <p style={{fontSize:15,color:"var(--ink2)",lineHeight:1.7,maxWidth:340}}>
              We built AlternAte because nutrition advice is often overwhelming, judgmental, and disconnected from how real people actually eat.
            </p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {[{n:"01",t:"Make swaps feel effortless",d:"Suggestions that fit your existing life — not a completely different one."},
              {n:"02",t:"Preserve the vibe you love",d:"Same comfort, same craving — better ingredients behind the scenes."},
              {n:"03",t:"Clarity without judgment",d:"Practical information, zero guilt, no medical claims."},
              {n:"04",t:"Respect restrictions & culture",d:"Your dietary needs and food traditions are always honoured."},
              {n:"05",t:"Make comparison fast",d:"Side-by-side AI analysis so you decide in seconds."},
            ].map((g,i)=>(
              <div key={i} style={{
                padding:"18px 22px",
                borderLeft:`3px solid color-mix(in srgb,var(--g400) ${gVis?50:0}%,transparent)`,
                background:gVis?"var(--surface)":"transparent",
                borderRadius:"0 var(--rad) var(--rad) 0",
                opacity:gVis?1:0,transform:gVis?"none":"translateX(-16px)",
                transition:`all .48s ${.06+i*.09}s var(--ease)`,
                cursor:"default",border:`1px solid var(--border)`,
                borderLeft:`3px solid ${gVis?"var(--g400)":"transparent"}`}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)";e.currentTarget.style.background="var(--g50)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.background="var(--surface)";}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
                    color:"var(--g400)",paddingTop:2,flexShrink:0}}>{g.n}</span>
                  <div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:3}}>{g.t}</div>
                    <div style={{color:"var(--ink2)",fontSize:13,lineHeight:1.5}}>{g.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" ref={hRef} style={{background:"var(--g900)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto"}}>
          <div style={{marginBottom:52,opacity:hVis?1:0,transform:hVis?"none":"translateY(16px)",
            transition:"all .55s var(--ease)"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--g300)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>Simple by design</div>
            <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(26px,4vw,52px)",
              fontWeight:800,color:"var(--white)",lineHeight:1.1,letterSpacing:"-.025em"}}>
              How it works
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
            {[{n:"01",t:"Enter your food",d:"Type any food, drink, or full meal. Pepsi, ramen, a cheeseburger — anything at all.",
                icon:<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="14" cy="14" r="11"/><path d="M9 14h10M14 9v10"/></svg>},
              {n:"02",t:"Set your goal",d:"Choose a direction — balance, more protein, lower carbs, or more energy.",
                icon:<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 14h18M14 5l9 9-9 9"/></svg>},
              {n:"03",t:"Get AI-powered swaps",d:"Gemini AI analyzes your meal and returns 3 smart alternatives that preserve the taste.",
                icon:<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 19V9m0 0-3 3m3-3 3 3M20 9v10m0 0 3-3m-3 3-3-3"/></svg>},
            ].map((s,i)=>(
              <div key={i} style={{padding:"44px 32px",
                borderRight:i<2?"1px solid rgba(255,255,255,.07)":"none",
                opacity:hVis?1:0,transform:hVis?"none":"translateY(20px)",
                transition:`all .5s ${.1+i*.15}s var(--ease)`}}>
                <div style={{color:"var(--g300)",marginBottom:18}}>{s.icon}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:36,fontWeight:500,
                  color:"rgba(255,255,255,.08)",lineHeight:1,marginBottom:16}}>{s.n}</div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,
                  color:"var(--white)",marginBottom:10}}>{s.t}</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,.55)",lineHeight:1.65}}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:52,textAlign:"center",opacity:hVis?1:0,
            transition:"opacity .5s .5s var(--ease)"}}>
            <Btn onClick={()=>setPage("app")} s={{background:"var(--g500)",
              boxShadow:"0 4px 20px rgba(58,138,84,.3)"}}>
              Start Analyzing →
            </Btn>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{background:"var(--g600)",padding:"72px clamp(16px,5vw,72px)",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(24px,4vw,52px)",
          fontWeight:800,color:"var(--white)",lineHeight:1.08,letterSpacing:"-.025em",marginBottom:16}}>
          Your next meal is already good.<br/>
          <span style={{color:"var(--g200)"}}>Let's make it a little better.</span>
        </h2>
        <p style={{fontSize:16,color:"rgba(255,255,255,.75)",marginBottom:32}}>
          Free to use. Powered by Gemini AI. No subscriptions.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("auth")}
            s={{background:"var(--white)",color:"var(--g700)",boxShadow:"0 4px 20px rgba(0,0,0,.15)"}}>
            Create Free Account
          </Btn>
          <Btn v="ghost" onClick={()=>setPage("app")}
            s={{borderColor:"rgba(255,255,255,.4)",color:"var(--white)"}}>
            Try as Guest
          </Btn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:"var(--n900)",padding:"40px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1040,margin:"0 auto",display:"flex",
          justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{width:22,height:22,borderRadius:5,background:"var(--g700)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1C4 1 2 3 2 5.5S4.2 10 6 10.5C7.8 10 10 8 10 5.5S8 1 6 1z" fill="var(--g300)" opacity=".7"/>
                  <circle cx="6" cy="5.5" r="1.5" fill="var(--white)"/>
                </svg>
              </div>
              <span style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,
                color:"var(--white)",letterSpacing:"-.01em"}}>
                Altern<span style={{color:"var(--g400)"}}>Ate</span>
              </span>
            </div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.3)",fontFamily:"'JetBrains Mono',monospace"}}>
              Eat what you love. Eat it smarter.
            </div>
          </div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.25)",maxWidth:400,lineHeight:1.65,textAlign:"right"}}>
            AlternAte does not provide medical, dietary, or clinical advice. All analysis is for informational purposes only. Powered by Gemini AI.
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ── App workspace page ──────────────────────────────────────── */
const AppPage = ({user, onAnalyze, loading, result, onSave}) => (
  <div style={{minHeight:"100vh",background:"var(--bg)",paddingTop:80}}>
    <div style={{maxWidth:900,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
      <div style={{marginBottom:30,animation:"fadeUp .6s both"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--g500)",
          letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Workspace</div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,
          letterSpacing:"-.03em"}}>Analyze a Meal</h1>
        <p style={{color:"var(--ink2)",fontSize:14,marginTop:6}}>
          {user?`Signed in as ${user.email} — analyses are saved.`:"Demo mode — sign in to save analyses."}
        </p>
        <div style={{marginTop:12,padding:"10px 14px",background:"var(--g100)",
          borderRadius:"var(--rad)",fontSize:13,color:"var(--g700)",
          display:"inline-flex",alignItems:"center",gap:8,
          border:"1px solid var(--g200)"}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.5 5H13L9.5 7.5L11 11.5L7 9L3 11.5L4.5 7.5L1 5H5.5L7 1Z" fill="currentColor" opacity=".7"/>
          </svg>
          Powered by Gemini AI — enter any food, drink, or meal for a real analysis
        </div>
      </div>
      <div style={{animation:"fadeUp .6s .1s both"}}>
        <MealInput onAnalyze={onAnalyze} loading={loading}/>
      </div>
      {result && (
        <div style={{marginTop:28}}>
          <Results result={result} canSave={!!user} onSave={onSave} isDemo={!user}/>
        </div>
      )}
    </div>
  </div>
);

/* ── History page ────────────────────────────────────────────── */
const HistPage = ({analyses, onView, onCompare}) => {
  const [q,setQ]=useState("");
  const [fg,setFg]=useState("all");
  const fil=analyses.filter(a=>{
    const ms=!q||a.result_json.title.toLowerCase().includes(q.toLowerCase());
    const mg=fg==="all"||a.goal===fg;
    return ms&&mg;
  });
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",paddingTop:80}}>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:30}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--g500)",
            letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Your Record</div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,letterSpacing:"-.03em"}}>History</h1>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search analyses…"
            style={{flex:1,minWidth:180,padding:"9px 14px",border:"1.5px solid var(--border)",
              borderRadius:9999,fontFamily:"'Instrument Sans',sans-serif",fontSize:13,
              background:"var(--surface)",color:"var(--ink)",outline:"none"}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"all",label:"All"},...GOALS].map(g=>(
              <button key={g.id} onClick={()=>setFg(g.id)} style={{
                padding:"7px 14px",borderRadius:9999,
                border:`1.5px solid ${fg===g.id?"var(--g500)":"var(--border)"}`,
                background:fg===g.id?"var(--g100)":"transparent",
                color:fg===g.id?"var(--g700)":"var(--ink2)",
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:fg===g.id?700:500,
                cursor:"pointer",transition:"all .18s"}}>{g.label}</button>
            ))}
          </div>
        </div>
        {fil.length===0?(
          <div style={{textAlign:"center",padding:"72px 20px"}}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none"
              stroke="var(--n300)" strokeWidth="1.5" strokeLinecap="round"
              style={{margin:"0 auto 18px",display:"block"}}>
              <circle cx="24" cy="24" r="18"/>
              <path d="M16 24h16M24 16v16" strokeDasharray="4 3"/>
            </svg>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,
              color:"var(--ink2)",marginBottom:8}}>
              {q?"No matching analyses":"No analyses yet"}
            </div>
            <div style={{fontSize:13,color:"var(--n400)"}}>
              {q?"Try a different search.":"Analyze a meal to build your history."}
            </div>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
            {fil.map(a=><HistCard key={a.id} a={a} onView={onView} onCompare={onCompare}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Settings page ───────────────────────────────────────────── */
const SettPage = ({user, settings, onSave}) => {
  const [goal,setGoal]=useState(settings.goal||"balance");
  const [restr,setRestr]=useState(settings.restrictions||[]);
  const [name,setName]=useState(settings.name||"");
  const [saved,setSaved]=useState(false);
  const toggle=r=>setRestr(p=>p.includes(r)?p.filter(x=>x!==r):[...p,r]);
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",paddingTop:80}}>
      <div style={{maxWidth:560,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:30}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--n400)",
            letterSpacing:".12em",textTransform:"uppercase",marginBottom:10}}>Preferences</div>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:36,fontWeight:800,letterSpacing:"-.03em"}}>Settings</h1>
        </div>
        <Card style={{padding:26}}>
          <FL>Display Name</FL>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"
            style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--border)",
              borderRadius:"var(--rad)",fontFamily:"'Instrument Sans',sans-serif",fontSize:14,
              color:"var(--ink)",background:"var(--n50)",outline:"none",marginBottom:18}}/>
          <FL mt={0}>Default Goal</FL>
          <div style={{display:"flex",gap:3,background:"var(--n100)",borderRadius:"var(--rad)",
            padding:3,marginBottom:18}}>
            {GOALS.map(g=>(
              <button key={g.id} onClick={()=>setGoal(g.id)} style={{
                flex:1,padding:"7px 4px",borderRadius:9,border:"none",cursor:"pointer",
                fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:goal===g.id?700:500,
                background:goal===g.id?"var(--surface)":"transparent",
                color:goal===g.id?"var(--g700)":"var(--n500)",
                boxShadow:goal===g.id?"var(--sh)":"none",transition:"all .2s"}}>{g.label}</button>
            ))}
          </div>
          <FL>Default Restrictions</FL>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:24}}>
            {RESTR.map(r=>{const a=restr.includes(r);return(
              <button key={r} onClick={()=>toggle(r)} style={{
                fontFamily:"'Instrument Sans',sans-serif",fontSize:12,padding:"5px 12px",
                border:`1.5px solid ${a?"var(--g500)":"var(--border)"}`,borderRadius:9999,
                cursor:"pointer",background:a?"var(--g100)":"transparent",
                color:a?"var(--g700)":"var(--ink2)",transition:"all .18s"}}>
                {r}
              </button>);})}
          </div>
          <button onClick={()=>{onSave({goal,restrictions:restr,name});setSaved(true);setTimeout(()=>setSaved(false),2500);}}
            style={{padding:"12px 28px",background:saved?"var(--g600)":"var(--g800)",
              color:"var(--white)",border:"none",borderRadius:9999,
              fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,
              cursor:"pointer",transition:"all .25s",letterSpacing:".01em"}}>
            {saved?"✓ Saved!":"Save Settings"}
          </button>
        </Card>
      </div>
    </div>
  );
};

/* ── Auth page ───────────────────────────────────────────────── */
const AuthPage = ({onAuth, setPage}) => {
  const [mode,setMode]=useState("signin");
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [name,setName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const handle=async()=>{
    if(!email||!pw){setErr("Please fill in all fields.");return;}
    if(pw.length<6){setErr("Password must be at least 6 chars.");return;}
    setLoading(true);setErr("");
    try{await onAuth(mode,email,pw,name);}
    catch(e){setErr(e.message||"Something went wrong.");}
    finally{setLoading(false);}
  };
  const inp={width:"100%",padding:"11px 14px",border:"1.5px solid var(--border)",
    borderRadius:"var(--rad)",fontFamily:"'Instrument Sans',sans-serif",fontSize:14,
    color:"var(--ink)",background:"var(--n50)",outline:"none",marginBottom:14};
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",
      alignItems:"center",justifyContent:"center",padding:24,
      position:"relative",overflow:"hidden"}}>
      <HeroBg/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420,animation:"fadeUp .6s both"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:10}}>
            <Logo onClick={()=>setPage("home")}/>
          </div>
          <p style={{color:"var(--ink2)",fontSize:14}}>
            {mode==="signin"?"Sign in to save and compare your analyses":"Create a free account — takes 10 seconds"}
          </p>
        </div>
        <Card style={{padding:28}}>
          {mode==="signup" && (
            <><FL>Name</FL>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/></>
          )}
          <FL>Email</FL>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inp}/>
          <FL>Password</FL>
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="••••••••" style={{...inp,marginBottom:6}}/>
          {err&&<div style={{fontSize:13,color:"#c0392b",marginBottom:10}}>{err}</div>}
          <button onClick={handle} disabled={loading} style={{
            width:"100%",padding:"13px",background:"var(--g800)",color:"var(--white)",
            border:"none",borderRadius:9999,fontFamily:"'Syne',sans-serif",fontWeight:700,
            fontSize:15,cursor:loading?"not-allowed":"pointer",marginTop:10,
            transition:"all .2s",opacity:loading?.7:1,letterSpacing:".02em",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,
            boxShadow:"0 4px 20px rgba(14,42,22,.2)"}}>
            {loading?<><Spinner/><span>Loading…</span></>:mode==="signin"?"Sign In →":"Create Account →"}
          </button>
          <div style={{textAlign:"center",marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
            <button onClick={()=>{setMode(m=>m==="signin"?"signup":"signin");setErr("");}}
              style={{fontFamily:"'Instrument Sans',sans-serif",fontSize:13,color:"var(--ink2)",
                background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
              {mode==="signin"?"No account? Create one free":"Already have an account? Sign in"}
            </button>
            <button onClick={()=>setPage("app")}
              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--n400)",
                background:"none",border:"none",cursor:"pointer"}}>
              continue as guest →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ── Gate ────────────────────────────────────────────────────── */
const Gate = ({label, setPage}) => (
  <div style={{minHeight:"100vh",display:"flex",alignItems:"center",
    justifyContent:"center",flexDirection:"column",gap:16,padding:40,paddingTop:80}}>
    <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,textAlign:"center",letterSpacing:"-.02em"}}>
      Sign in to access your {label}
    </div>
    <Btn onClick={()=>setPage("auth")}>Sign In</Btn>
  </div>
);

/* ── Compare modal ───────────────────────────────────────────── */
const CompareModal = ({a, b, onClose}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(12,15,13,.65)",
    backdropFilter:"blur(6px)",zIndex:200,display:"flex",
    alignItems:"center",justifyContent:"center",padding:24}}
    onClick={onClose}>
    <div style={{background:"var(--surface)",borderRadius:"var(--rad-lg)",padding:28,
      maxWidth:720,width:"100%",maxHeight:"90vh",overflowY:"auto",
      boxShadow:"0 32px 80px rgba(12,15,13,.25)",animation:"fadeUp .4s both"}}
      onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,letterSpacing:"-.02em"}}>
          Side-by-Side Comparison
        </h2>
        <button onClick={onClose} style={{background:"none",border:"none",
          color:"var(--ink2)",fontSize:22,cursor:"pointer",lineHeight:1,
          padding:"4px 8px",borderRadius:6}}>×</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"start"}}>
        {[a,null,b].map((item,i)=>i===1?(
          <div key="vs" style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:36}}>
            <div style={{width:1,height:56,background:"var(--g300)",opacity:.4}}/>
            <div style={{background:"var(--g100)",border:"1px solid var(--g200)",color:"var(--g700)",
              fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:500,
              padding:"3px 8px",borderRadius:6,margin:"6px 0"}}>VS</div>
            <div style={{width:1,height:56,background:"var(--g300)",opacity:.4}}/>
          </div>
        ):(
          <div key={i} style={{background:"var(--n50)",borderRadius:"var(--rad)",padding:16,
            border:`1px solid ${i===0?"var(--border)":"var(--g200)"}`}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--n400)",
              marginBottom:4,textTransform:"uppercase",letterSpacing:".06em"}}>
              {i===0?"Meal A":"Meal B"}
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,
              marginBottom:12,lineHeight:1.25}}>{item.result_json.title}</div>
            {item.result_json.health_score&&<ScoreRing score={item.result_json.health_score} size={44}/>}
            <div style={{marginTop:12}}><Ribbon macros={item.result_json.macro_estimate} animated/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:10}}>
              {[["Cal",item.result_json.macro_estimate?.calories,"kcal"],
                ["Prot",item.result_json.macro_estimate?.protein_g,"g"],
                ["Carb",item.result_json.macro_estimate?.carbs_g,"g"],
                ["Fat",item.result_json.macro_estimate?.fat_g,"g"]].map(([l,v,u])=>(
                <div key={l} style={{fontSize:11,fontFamily:"'JetBrains Mono',monospace"}}>
                  <span style={{color:"var(--n400)",fontSize:9}}>{l} </span>
                  <span style={{fontWeight:500}}>{v!=null?`${v}${u}`:"—"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState(null);
  const [homeResult,setHomeResult]=useState(null);
  const [analyses,setAnalyses]=useState([]);
  const [settings,setSettings]=useState({goal:"balance",restrictions:[],name:""});
  const [cmpQ,setCmpQ]=useState([]);
  const [showCmp,setShowCmp]=useState(false);
  const [apiErr,setApiErr]=useState(null);

  const analyze = useCallback(async (input, isHome=false) => {
    if (input.mealText.length > 2000) return;
    setLoading(true); setApiErr(null);
    try {
      const r = await analyzeWithGemini(input);
      if (isHome) setHomeResult(r); else setResult(r);
    } catch(e) {
      console.error("Analysis error:", e);
      setApiErr("Analysis failed. Please check your connection and try again.");
    } finally { setLoading(false); }
  }, []);

  const handleSave = useCallback(() => {
    if (!result||!user) return;
    setAnalyses(p=>[{
      id:Date.now().toString(), user_id:user.id, meal_text:result.title,
      goal:settings.goal, restrictions:{tags:[]}, result_json:result,
      created_at:new Date().toISOString()
    },...p]);
  },[result,user,settings.goal]);

  const handleAuth = async (mode, email, pw, name) => {
    await new Promise(r=>setTimeout(r,900));
    setUser({id:"u_"+Math.random().toString(36).slice(2), email, name});
    setSettings(s=>({...s, name:name||email.split("@")[0]}));
    setPage("app");
  };

  const handleCmp = a => {
    setCmpQ(p=>{
      if (p.find(x=>x.id===a.id)) return p;
      const n=[...p,a].slice(-2);
      if (n.length===2) setShowCmp(true);
      return n;
    });
  };

  return (
    <div>
      <G/>
      <Nav page={page} setPage={setPage} user={user}
        onLogout={()=>{setUser(null);setPage("home");setAnalyses([]);}}/>

      {apiErr && (
        <div style={{position:"fixed",top:70,left:"50%",transform:"translateX(-50%)",zIndex:300,
          background:"#fdf2f2",border:"1px solid #f5c6c6",borderRadius:"var(--rad)",
          padding:"10px 18px",fontSize:13,color:"#c0392b",boxShadow:"var(--sh2)",
          display:"flex",gap:10,alignItems:"center"}}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {apiErr}
          <button onClick={()=>setApiErr(null)} style={{background:"none",border:"none",
            color:"#c0392b",cursor:"pointer",fontSize:16,lineHeight:1,padding:"0 2px"}}>×</button>
        </div>
      )}

      {page==="home"     && <Home setPage={setPage} onAnalyze={v=>analyze(v,true)} loading={loading} result={homeResult}/>}
      {page==="app"      && <AppPage user={user} onAnalyze={v=>analyze(v,false)} loading={loading} result={result} onSave={handleSave}/>}
      {page==="history"  && (user?<HistPage analyses={analyses} onView={a=>{setResult(a.result_json);setPage("app");}} onCompare={handleCmp}/>:<Gate label="history" setPage={setPage}/>)}
      {page==="settings" && (user?<SettPage user={user} settings={settings} onSave={s=>setSettings(s)}/>:<Gate label="settings" setPage={setPage}/>)}
      {page==="auth"     && <AuthPage onAuth={handleAuth} setPage={setPage}/>}

      {showCmp && cmpQ.length===2 && (
        <CompareModal a={cmpQ[0]} b={cmpQ[1]} onClose={()=>setShowCmp(false)}/>
      )}
    </div>
  );
}
