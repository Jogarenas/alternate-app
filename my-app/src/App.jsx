import { useState, useEffect, useRef, useCallback } from "react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{
      --p:#f8f4ee;--pd:#efe9df;--pdd:#e3dace;
      --ink:#18140f;--ink2:#5a5248;--ink3:#a89e92;
      --g:#3d6b35;--gl:#7aaa6e;--gw:#deecd8;
      --o:#c85a1e;--ol:#e08050;--ow:#faeade;
      --b:#3a6880;--bw:#daeaf3;
      --r:#a82828;--y:#b88a18;
      --rad:14px;--pill:9999px;
      --sh:0 2px 20px rgba(24,20,15,.07),0 1px 4px rgba(24,20,15,.04);
      --sh2:0 8px 40px rgba(24,20,15,.13),0 2px 10px rgba(24,20,15,.06);
      --ease:cubic-bezier(.16,1,.3,1);
    }
    html{scroll-behavior:smooth}
    body{font-family:'DM Sans',sans-serif;background:var(--p);color:var(--ink);font-size:15px;line-height:1.65;overflow-x:hidden}
    body::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:.02;
      background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size:180px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:.1}50%{opacity:.2}}
    @keyframes drift{0%{transform:translate(0,0)}100%{transform:translate(24px,12px)}}
    @keyframes dots{0%,80%,100%{transform:scale(.55);opacity:.3}40%{transform:scale(1);opacity:1}}
    @keyframes expand{from{max-height:0;opacity:0}to{max-height:5000px;opacity:1}}
    @keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
    .flip-card{perspective:1000px;cursor:pointer}
    .flip-inner{position:relative;width:100%;height:100%;transition:transform .45s var(--ease);transform-style:preserve-3d}
    .flip-card.flipped .flip-inner{transform:rotateY(180deg)}
    .flip-front,.flip-back{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:var(--rad)}
    .flip-back{transform:rotateY(180deg)}
    ::-webkit-scrollbar{width:5px}
    ::-webkit-scrollbar-track{background:var(--pd)}
    ::-webkit-scrollbar-thumb{background:var(--ink3);border-radius:3px}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  `}</style>
);

// ─── Background Animations ─────────────────────────────────────────────────
const HeroBg = () => (
  <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
    {[{top:"14%",w:[42,34,24],d:9,dl:0},{top:"38%",w:[28,44,28],d:11,dl:2.3},
      {top:"63%",w:[37,26,37],d:8.5,dl:4.6},{top:"83%",w:[22,50,28],d:12,dl:1.4}].map((r,i)=>(
      <div key={i} style={{position:"absolute",top:r.top,left:"-4%",width:"108%",height:8,
        borderRadius:9999,display:"flex",overflow:"hidden",
        animation:`pulse ${r.d}s ease-in-out ${r.dl}s infinite`,opacity:.14}}>
        {[[r.w[0],"var(--g)"],[r.w[1],"var(--b)"],[r.w[2],"var(--o)"]].map(([w,c],j)=>(
          <div key={j} style={{width:`${w}%`,background:c,height:"100%"}}/>
        ))}
      </div>
    ))}
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.05,
      animation:"drift 24s ease-in-out infinite alternate"}}>
      <defs><pattern id="dg" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="var(--ink)"/>
      </pattern></defs>
      <rect width="200%" height="200%" fill="url(#dg)"/>
    </svg>
  </div>
);

// ─── Nutrient Ribbon ──────────────────────────────────────────────────────────
const Ribbon = ({ macros, size = "full", animated = true }) => {
  const [on, setOn] = useState(!animated);
  useEffect(() => { if (animated) { const t = setTimeout(() => setOn(true), 70); return () => clearTimeout(t); } }, [animated]);
  const tot = macros ? (macros.protein_g||0)*4 + (macros.carbs_g||0)*4 + (macros.fat_g||0)*9 : 0;
  const p = tot > 0 ? ((macros.protein_g||0)*4/tot)*100 : 33;
  const c = tot > 0 ? ((macros.carbs_g||0)*4/tot)*100 : 34;
  const f = tot > 0 ? ((macros.fat_g||0)*9/tot)*100 : 33;
  const h = size === "mini" ? 5 : 13;
  const score = macros ? Math.round(Math.min(100, 35 + p*.55 + (100-c)*.18)) : null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,width:"100%"}}>
      <div style={{flex:1,height:h,borderRadius:9999,overflow:"hidden",
        background:"color-mix(in srgb,var(--ink3) 22%,transparent)",display:"flex"}}>
        {[[p,"var(--g)",0],[c,"var(--b)",90],[f,"var(--ol)",180]].map(([pct,col,dl],i)=>(
          <div key={i} style={{height:"100%",width:on?`${pct}%`:"0%",background:col,
            transition:on?`width .75s ${dl}ms var(--ease)`:"none",opacity:.88}}/>
        ))}
      </div>
      {size==="full" && score!==null && (
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:500,
          background:"color-mix(in srgb,var(--g) 14%,transparent)",color:"var(--g)",
          padding:"2px 9px",borderRadius:9999,whiteSpace:"nowrap"}}>{score}/100</div>
      )}
    </div>
  );
};

// ─── Animated Counter ─────────────────────────────────────────────────────────
const Counter = ({ target, suffix="", prefix="", dur=1800, visible }) => {
  const [v, setV] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const t0 = performance.now();
    const tick = now => {
      const prog = Math.min((now - t0) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - prog, 3)) * target));
      if (prog < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, dur]);
  return <span>{prefix}{v.toLocaleString()}{suffix}</span>;
};

// ─── Scroll visibility hook ───────────────────────────────────────────────────
const useVis = (thresh = .15) => {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: thresh });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [thresh]);
  return [ref, v];
};

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO = {
  title:"Beef Ramen Bowl",
  summary:"A comforting, sodium-rich bowl with clear opportunities to improve protein quality and reduce saturated fat.",
  macro_estimate:{calories:620,protein_g:28,carbs_g:72,fat_g:22},
  flags:[
    {type:"Sodium",severity:"high",note:"Traditional ramen broth is very high in sodium — packing around 1,800mg per serving."},
    {type:"Refined noodles",severity:"low",note:"Standard ramen uses refined wheat; buckwheat soba adds meaningful fiber with the same texture."},
    {type:"Saturated fat",severity:"medium",note:"Tonkotsu broth is rich in saturated fat. A miso or dashi base cuts this by roughly 40%."}
  ],
  alternatives:[
    {name:"Miso Ramen with Tofu & Greens",why:"Miso broth cuts saturated fat by ~40%, tofu matches protein — same soul, notably lighter load.",
      swap_steps:["Dissolve low-sodium white miso in kombu dashi instead of tonkotsu","Swap beef slices for pan-seared firm tofu or tempeh","Add bok choy, shiitake, and a soft-boiled egg for micronutrients"],
      macro_estimate:{calories:470,protein_g:27,carbs_g:60,fat_g:13}},
    {name:"Soba Bowl with Poached Egg",why:"Buckwheat soba has 3× the fiber of white ramen noodles and a meaningfully lower glycemic response.",
      swap_steps:["Use chilled kombu-bonito dashi as a clean, aromatic broth","Replace ramen with 100% buckwheat soba noodles","Keep the egg and nori; add cucumber ribbons and toasted sesame"],
      macro_estimate:{calories:410,protein_g:22,carbs_g:56,fat_g:10}},
    {name:"Chicken Ramen / Zucchini Blend",why:"Blending 50% ramen with spiralized zucchini cuts net carbs by 35% without sacrificing the slurp.",
      swap_steps:["Use clear ginger-garlic chicken broth (skim the fat layer off the top)","Blend half-portions of noodles and spiralized zucchini in the bowl","Top with shredded poached chicken, nori, and the original soft egg"],
      macro_estimate:{calories:385,protein_g:36,carbs_g:36,fat_g:9}}
  ],
  confidence_notes:"Estimates based on typical restaurant portions. Home-cooked versions vary — treat as directional guidance only."
};

const GOALS = [{id:"balance",label:"Balance"},{id:"more_protein",label:"More Protein"},{id:"lower_carbs",label:"Lower Carbs"},{id:"more_energy",label:"More Energy"}];
const RESTR = ["Vegetarian","Vegan","Gluten-Free","Dairy-Free","Nut-Free","Halal","Kosher","Low-Sodium"];
const CHIPS = ["Ramen","Cheeseburger","Bánh Mì","Salad Bowl","Pad Thai","Tacos","Pizza","Burrito Bowl"];

// ─── Atom components ──────────────────────────────────────────────────────────
const Tag = ({ children, c="var(--g)", bg="var(--gw)" }) => (
  <span style={{display:"inline-block",fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:500,
    letterSpacing:".07em",textTransform:"uppercase",padding:"3px 10px",borderRadius:9999,background:bg,color:c}}>
    {children}
  </span>
);
const MP = ({ label, val, color }) => (
  <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,padding:"3px 10px",borderRadius:9999,
    background:`color-mix(in srgb,${color} 14%,transparent)`,color,fontWeight:500,
    display:"flex",gap:4,alignItems:"center"}}>
    <span style={{opacity:.6,fontSize:9}}>{label}</span>{val}
  </div>
);
const FL = ({ children }) => (
  <div style={{fontSize:10,fontWeight:700,color:"var(--ink3)",letterSpacing:".08em",
    textTransform:"uppercase",marginBottom:7}}>{children}</div>
);
const Card = ({ children, style: s={} }) => (
  <div style={{background:"var(--p)",border:"1px solid var(--pdd)",borderRadius:"var(--rad)",
    boxShadow:"var(--sh)",...s}}>{children}</div>
);
const Btn = ({ children, onClick, v="pri", s={} }) => {
  const base = {fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer",
    border:"none",transition:"all .2s",borderRadius:9999,display:"inline-flex",
    alignItems:"center",justifyContent:"center",gap:8};
  const vs = {
    pri:{...base,background:"var(--o)",color:"var(--p)",padding:"13px 28px",fontSize:15,
      boxShadow:"0 4px 18px color-mix(in srgb,var(--o) 30%,transparent)"},
    ghost:{...base,background:"transparent",color:"var(--ink)",border:"1.5px solid var(--pdd)",padding:"11px 22px",fontSize:14},
    green:{...base,background:"var(--g)",color:"var(--p)",padding:"12px 26px",fontSize:14},
  };
  return <button onClick={onClick}
    style={{...vs[v],...s}}
    onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
    onMouseLeave={e=>e.currentTarget.style.transform=""}>{children}</button>;
};

// ─── Meal Input ───────────────────────────────────────────────────────────────
const MealInput = ({ onAnalyze, loading }) => {
  const [meal, setMeal] = useState("");
  const [goal, setGoal] = useState("balance");
  const [restr, setRestr] = useState([]);
  const [shake, setShake] = useState(false);
  const [err, setErr] = useState("");
  const toggle = r => setRestr(p => p.includes(r) ? p.filter(x=>x!==r) : [...p,r]);
  const submit = () => {
    if (!meal.trim()) { setShake(true); setErr("Please describe your meal."); setTimeout(()=>setShake(false),500); return; }
    if (meal.length > 2000) { setErr("Too long — keep it under 2000 characters."); return; }
    setErr(""); onAnalyze({ mealText: meal, goal, restrictions: { tags: restr } });
  };
  return (
    <Card style={{padding:26}}>
      <div style={{position:"relative"}}>
        <textarea value={meal} onChange={e=>{setMeal(e.target.value);setErr("");}}
          placeholder="Describe your meal or ingredients… e.g. beef ramen with soft-boiled egg, nori, pork broth"
          rows={4} maxLength={2000}
          style={{width:"100%",padding:"13px 15px",
            border:`1.5px solid ${err?"var(--r)":"var(--pdd)"}`,
            borderRadius:10,fontFamily:"'DM Sans',sans-serif",fontSize:15,
            color:"var(--ink)",background:"var(--pd)",resize:"none",outline:"none",lineHeight:1.6,
            animation:shake?"shake .45s ease":"none",transition:"border-color .2s"}}
          onFocus={e=>e.target.style.borderColor="var(--g)"}
          onBlur={e=>e.target.style.borderColor=err?"var(--r)":"var(--pdd)"}/>
        <div style={{position:"absolute",bottom:10,right:12,fontFamily:"'DM Mono',monospace",
          fontSize:10,color:meal.length>1800?"var(--r)":"var(--ink3)"}}>{meal.length}/2000</div>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:10,alignItems:"center"}}>
        <span style={{fontSize:11,color:"var(--ink3)",fontWeight:500}}>Try:</span>
        {CHIPS.map(ch=>(
          <button key={ch} onClick={()=>{setMeal(ch);setErr("");}}
            style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,padding:"4px 11px",
              border:"1px solid var(--pdd)",borderRadius:9999,background:"var(--pd)",
              color:"var(--ink2)",cursor:"pointer",transition:"all .18s"}}
            onMouseEnter={e=>{e.target.style.background="var(--gw)";e.target.style.color="var(--g)";e.target.style.borderColor="var(--gl)";}}
            onMouseLeave={e=>{e.target.style.background="var(--pd)";e.target.style.color="var(--ink2)";e.target.style.borderColor="var(--pdd)";}}>
            {ch}
          </button>
        ))}
      </div>
      <div style={{marginTop:16}}>
        <FL>Goal</FL>
        <div style={{display:"flex",gap:3,background:"var(--pd)",borderRadius:10,padding:3}}>
          {GOALS.map(g=>(
            <button key={g.id} onClick={()=>setGoal(g.id)} style={{
              flex:1,padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:goal===g.id?600:400,
              background:goal===g.id?"var(--p)":"transparent",
              color:goal===g.id?"var(--g)":"var(--ink2)",
              boxShadow:goal===g.id?"var(--sh)":"none",transition:"all .2s"}}>{g.label}</button>
          ))}
        </div>
      </div>
      <div style={{marginTop:14}}>
        <FL>Restrictions</FL>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {RESTR.map(r=>{const a=restr.includes(r);return(
            <button key={r} onClick={()=>toggle(r)} style={{
              fontFamily:"'DM Sans',sans-serif",fontSize:12,padding:"4px 12px",
              border:`1.5px solid ${a?"var(--g)":"var(--pdd)"}`,borderRadius:9999,cursor:"pointer",
              background:a?"var(--gw)":"transparent",color:a?"var(--g)":"var(--ink2)",transition:"all .18s"}}>
              {r}
            </button>);})}
        </div>
      </div>
      {err && <div style={{marginTop:8,fontSize:13,color:"var(--r)"}}>{err}</div>}
      <button onClick={submit} disabled={loading} style={{
        marginTop:18,width:"100%",padding:"14px",
        background:loading?"var(--ink2)":"var(--o)",color:"var(--p)",
        border:"none",borderRadius:9999,fontFamily:"'DM Sans',sans-serif",
        fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",
        transition:"all .25s var(--ease)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        boxShadow:loading?"none":"0 4px 18px color-mix(in srgb,var(--o) 30%,transparent)"}}>
        {loading ? [0,1,2].map(i=>(
          <div key={i} style={{width:7,height:7,borderRadius:"50%",background:"var(--p)",
            animation:`dots 1.1s ease-in-out ${i*.18}s infinite`}}/>
        )) : "Analyze Meal →"}
      </button>
    </Card>
  );
};

// ─── Flags ────────────────────────────────────────────────────────────────────
const Flags = ({ flags }) => {
  const cols = { high:"var(--r)", medium:"var(--o)", low:"var(--y)" };
  const sorted = [...flags].sort((a,b)=>["high","medium","low"].indexOf(a.severity)-["high","medium","low"].indexOf(b.severity));
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {sorted.length===0 ? (
        <div style={{color:"var(--g)",fontSize:14}}>✓ No notable flags.</div>
      ) : sorted.map((f,i)=>(
        <div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",
          padding:"12px 15px",background:"var(--pd)",borderRadius:10}}>
          <div style={{clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
            background:`color-mix(in srgb,${cols[f.severity]} 16%,transparent)`,
            color:cols[f.severity],padding:"3px 13px",fontSize:9,fontWeight:700,
            fontFamily:"'DM Mono',monospace",letterSpacing:".06em",textTransform:"uppercase",
            whiteSpace:"nowrap",marginTop:2}}>
            {f.severity}
          </div>
          <div>
            <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{f.type}</div>
            <div style={{color:"var(--ink2)",fontSize:13,lineHeight:1.5}}>{f.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Alternative card ─────────────────────────────────────────────────────────
const AltCard = ({ alt, idx }) => {
  const [fl, setFl] = useState(false);
  const m = alt.macro_estimate;
  return (
    <div className={`flip-card${fl?" flipped":""}`}
      style={{height:290,animation:`fadeUp .5s ${idx*.12}s both`}}
      onClick={()=>setFl(f=>!f)}>
      <div className="flip-inner">
        <div className="flip-front" style={{
          background:"var(--p)",border:"1px solid var(--pdd)",
          padding:22,display:"flex",flexDirection:"column",justifyContent:"space-between",
          boxShadow:"var(--sh)",
          borderBottom:"2px dashed color-mix(in srgb,var(--g) 28%,transparent)"}}>
          <div>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--g)",fontWeight:500,
              letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>
              Alt {String(idx+1).padStart(2,"0")}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,
              lineHeight:1.3,marginBottom:10}}>{alt.name}</div>
            <div style={{color:"var(--ink2)",fontSize:13,lineHeight:1.55}}>{alt.why}</div>
          </div>
          <div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {m.protein_g&&<MP label="P" val={`${m.protein_g}g`} color="var(--g)"/>}
              {m.carbs_g&&<MP label="C" val={`${m.carbs_g}g`} color="var(--b)"/>}
              {m.fat_g&&<MP label="F" val={`${m.fat_g}g`} color="var(--ol)"/>}
              {m.calories&&<MP label="kcal" val={m.calories} color="var(--ink3)"/>}
            </div>
            <div style={{fontSize:10,color:"var(--ink3)",textAlign:"center"}}>Tap for swap steps →</div>
          </div>
        </div>
        <div className="flip-back" style={{
          background:"var(--gw)",border:"1px solid var(--gl)",
          padding:22,display:"flex",flexDirection:"column",justifyContent:"space-between",
          boxShadow:"var(--sh)"}}>
          <div>
            <div style={{fontSize:10,fontWeight:700,color:"var(--g)",letterSpacing:".08em",
              textTransform:"uppercase",marginBottom:12}}>Swap Steps</div>
            <ol style={{paddingLeft:18,display:"flex",flexDirection:"column",gap:9}}>
              {alt.swap_steps.map((s,j)=>(
                <li key={j} style={{fontSize:13,lineHeight:1.55,color:"var(--ink)"}}>{s}</li>
              ))}
            </ol>
          </div>
          <div style={{fontSize:11,color:"var(--g)"}}>← Tap to flip back</div>
        </div>
      </div>
    </div>
  );
};

// ─── Compare view ─────────────────────────────────────────────────────────────
const CompareView = ({ result, compareResult }) => {
  const r = compareResult || {
    verdict_title:"Original vs. Best Alternative",
    verdict_summary:`"${result.alternatives[0].name}" supports your goal while keeping the meal's feel intact.`,
    side_by_side:{
      a:{title:result.title,macro_estimate:result.macro_estimate},
      b:{title:result.alternatives[0].name,macro_estimate:result.alternatives[0].macro_estimate}
    },
    tradeoffs:[
      "Original has richer flavour from fat — traded against higher saturated fat load.",
      "Alternative cuts saturated fat by ~40% with comparable protein.",
      "Sodium remains notable in both — choose low-sodium broth regardless.",
      "Protein levels are similar; both adequately support muscle maintenance."
    ],
    recommendation:`Start with the "${result.alternatives[0].name}" swap for the biggest nutritional gain with the least flavour sacrifice.`
  };
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"start",marginBottom:18}}>
        {[r.side_by_side.a,"vs",r.side_by_side.b].map((item,i)=>i===1?(
          <div key="vs" style={{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:34}}>
            <div style={{width:1,height:48,background:"var(--g)",opacity:.3}}/>
            <div style={{background:"var(--gw)",border:"1px solid var(--gl)",color:"var(--g)",
              fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,
              padding:"3px 10px",borderRadius:9999,margin:"6px 0"}}>VS</div>
            <div style={{width:1,height:48,background:"var(--g)",opacity:.3}}/>
          </div>
        ):(
          <div key={i} style={{background:"var(--pd)",borderRadius:10,padding:14}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:"var(--ink3)",marginBottom:4}}>
              Meal {i===0?"A":"B"}
            </div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,
              marginBottom:12,lineHeight:1.3}}>{item.title}</div>
            <Ribbon macros={item.macro_estimate} animated/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:10}}>
              {[["Cal",item.macro_estimate.calories,"kcal"],["Pro",item.macro_estimate.protein_g,"g"],
                ["Carb",item.macro_estimate.carbs_g,"g"],["Fat",item.macro_estimate.fat_g,"g"]].map(([l,v,u])=>(
                <div key={l} style={{fontSize:11,fontFamily:"'DM Mono',monospace"}}>
                  <span style={{color:"var(--ink3)",fontSize:9}}>{l} </span>
                  <span style={{fontWeight:500}}>{v??"—"}{u}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"color-mix(in srgb,var(--o) 10%,var(--p))",border:"1px solid var(--ol)",
        borderRadius:10,padding:"14px 18px",textAlign:"center",marginBottom:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700}}>{r.verdict_title}</div>
        <div style={{fontSize:13,color:"var(--ink2)",marginTop:4}}>{r.verdict_summary}</div>
      </div>
      {r.tradeoffs.map((t,i)=>(
        <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:13,lineHeight:1.5}}>
          <span style={{color:"var(--g)",fontWeight:700,flexShrink:0}}>·</span>
          <span style={{color:"var(--ink2)"}}>{t}</span>
        </div>
      ))}
      <div style={{padding:"12px 16px",background:"var(--gw)",borderRadius:8,
        fontSize:14,color:"var(--g)",fontWeight:600,lineHeight:1.5,marginTop:8}}>
        {r.recommendation}
      </div>
    </div>
  );
};

// ─── Results ──────────────────────────────────────────────────────────────────
const Results = ({ result, onSave, canSave, isDemo }) => {
  const [tab, setTab] = useState("overview");
  const [saved, setSaved] = useState(false);
  const tabs = ["overview","breakdown","alternatives","compare"];
  return (
    <div style={{animation:"expand .5s var(--ease) both",overflow:"hidden"}}>
      {isDemo && (
        <div style={{background:"var(--ow)",border:"1px solid var(--ol)",borderRadius:10,
          padding:"10px 16px",marginBottom:14,fontSize:13,color:"var(--o)"}}>
          👋 Demo mode — sign in to analyze your own meals and save results.
        </div>
      )}
      <Card style={{padding:24,marginBottom:14}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,marginBottom:6}}>
          {result.title}
        </div>
        <div style={{color:"var(--ink2)",fontSize:14,marginBottom:16,lineHeight:1.55}}>{result.summary}</div>
        <Ribbon macros={result.macro_estimate}/>
        <div style={{fontSize:10,color:"var(--ink3)",marginTop:10,fontStyle:"italic"}}>
          Estimates only · Not medical or clinical advice
        </div>
      </Card>
      <div style={{display:"flex",gap:2,background:"var(--pd)",borderRadius:10,padding:3,marginBottom:14}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{
            flex:1,padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:tab===t?600:400,
            textTransform:"capitalize",background:tab===t?"var(--p)":"transparent",
            color:tab===t?"var(--ink)":"var(--ink2)",
            boxShadow:tab===t?"var(--sh)":"none",transition:"all .2s"}}>{t}</button>
        ))}
      </div>
      <Card style={{padding:24}}>
        {tab==="overview" && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:16}}>
              Macro Estimate
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
              {[["Calories",result.macro_estimate.calories,"kcal","var(--ink)"],
                ["Protein",result.macro_estimate.protein_g,"g","var(--g)"],
                ["Carbs",result.macro_estimate.carbs_g,"g","var(--b)"],
                ["Fat",result.macro_estimate.fat_g,"g","var(--o)"]].map(([l,v,u,col])=>(
                <div key={l} style={{background:"var(--pd)",borderRadius:10,padding:"14px 12px",textAlign:"center"}}>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:22,fontWeight:500,color:col}}>
                    {v??<span style={{opacity:.4}}>—</span>}
                    <span style={{fontSize:11,marginLeft:2}}>{u}</span>
                  </div>
                  <div style={{fontSize:11,color:"var(--ink3)",marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
            {result.confidence_notes && (
              <div style={{marginTop:14,padding:"12px 14px",background:"var(--bw)",
                borderRadius:8,fontSize:13,color:"var(--b)",lineHeight:1.55}}>
                <strong style={{fontFamily:"'DM Mono',monospace",fontSize:9,letterSpacing:".06em",
                  textTransform:"uppercase",display:"block",marginBottom:4}}>Confidence Note</strong>
                {result.confidence_notes}
              </div>
            )}
          </div>
        )}
        {tab==="breakdown" && (
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:16}}>
              Ingredient Flags{" "}
              <span style={{fontSize:13,fontFamily:"'DM Mono',monospace",fontWeight:400,color:"var(--ink3)"}}>
                {result.flags.length}
              </span>
            </div>
            <Flags flags={result.flags}/>
          </div>
        )}
        {tab==="alternatives" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>
            {result.alternatives.map((a,i)=><AltCard key={i} alt={a} idx={i}/>)}
          </div>
        )}
        {tab==="compare" && <CompareView result={result}/>}
      </Card>
      {canSave && !saved && (
        <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
          <Btn v="ghost" onClick={()=>{onSave();setSaved(true);}}>Save Analysis</Btn>
        </div>
      )}
      {saved && <div style={{marginTop:12,textAlign:"right",color:"var(--g)",fontSize:14,fontWeight:600}}>✓ Saved to history</div>}
    </div>
  );
};

// ─── History card ─────────────────────────────────────────────────────────────
const HistCard = ({ a, onView, onCompare }) => {
  const date = new Date(a.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
  return (
    <div onClick={()=>onView(a)}
      style={{background:"var(--p)",border:"1px solid var(--pdd)",borderRadius:"var(--rad)",
        padding:18,boxShadow:"var(--sh)",cursor:"pointer",transition:"all .2s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--sh2)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="var(--sh)";}}>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,
        marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {a.result_json.title}
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12}}>
        <Tag>{GOALS.find(g=>g.id===a.goal)?.label||a.goal}</Tag>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--ink3)"}}>{date}</span>
      </div>
      <Ribbon macros={a.result_json.macro_estimate} size="mini" animated/>
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:12}}>
        <button onClick={e=>{e.stopPropagation();onCompare(a);}}
          style={{fontSize:12,padding:"4px 12px",border:"1px solid var(--pdd)",
            borderRadius:9999,background:"transparent",color:"var(--ink2)",
            cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all .18s"}}
          onMouseEnter={e=>{e.target.style.borderColor="var(--g)";e.target.style.color="var(--g)";}}
          onMouseLeave={e=>{e.target.style.borderColor="var(--pdd)";e.target.style.color="var(--ink2)";}}>
          Compare
        </button>
      </div>
    </div>
  );
};

// ─── Nav ──────────────────────────────────────────────────────────────────────
const Nav = ({ page, setPage, user, onLogout }) => {
  const [sc, setSc] = useState(false);
  useEffect(()=>{
    const fn=()=>setSc(window.scrollY>30);
    window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);
  },[]);
  return (
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
      background:sc?"color-mix(in srgb,var(--p) 94%,transparent)":"transparent",
      backdropFilter:sc?"blur(14px)":"none",transition:"all .3s",
      padding:"0 clamp(16px,4vw,48px)",height:58,
      display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"flex",alignItems:"baseline",gap:5}}>
        <span style={{fontFamily:"'Playfair Display',serif",fontSize:21,fontWeight:900,fontStyle:"italic"}}>Altern</span>
        <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,background:"var(--g)",
          color:"var(--p)",padding:"1px 6px",borderRadius:4}}>Ate</span>
      </div>
      <div style={{display:"flex",gap:2,alignItems:"center"}}>
        {[{id:"home",l:"Home"},{id:"app",l:"Try It"},
          ...(user?[{id:"history",l:"History"},{id:"settings",l:"Settings"}]:[])].map(({id,l})=>(
          <button key={id} onClick={()=>setPage(id)} style={{
            fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:page===id?600:400,
            color:page===id?"var(--ink)":"var(--ink2)",background:"transparent",
            border:"none",cursor:"pointer",padding:"6px 12px",borderRadius:8,transition:"all .18s"}}>
            {l}
          </button>
        ))}
        {user ? (
          <button onClick={onLogout} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,
            padding:"6px 14px",border:"1px solid var(--pdd)",borderRadius:9999,
            background:"transparent",color:"var(--ink2)",cursor:"pointer",marginLeft:4}}>
            Sign Out
          </button>
        ) : (
          <button onClick={()=>setPage("auth")} style={{fontFamily:"'DM Sans',sans-serif",
            fontSize:13,fontWeight:600,padding:"7px 16px",border:"none",borderRadius:9999,
            background:"var(--ink)",color:"var(--p)",cursor:"pointer",marginLeft:4,transition:"all .2s"}}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════════════════
const Home = ({ setPage, onAnalyze, loading, result }) => {
  const [sRef, sVis] = useVis(.2);
  const [gRef, gVis] = useVis(.1);
  const [hRef, hVis] = useVis(.1);
  const [iRef, iVis] = useVis(.1);

  return (
    <div>
      {/* ── HERO ── */}
      <section style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",
        padding:"100px clamp(16px,5vw,72px) 60px",overflow:"hidden",background:"var(--p)"}}>
        <HeroBg/>
        <div style={{maxWidth:1000,margin:"0 auto",width:"100%",position:"relative",zIndex:1,
          display:"grid",gridTemplateColumns:"1fr 1fr",gap:52,alignItems:"center"}}>
          <div>
            <div style={{animation:"fadeUp .7s .05s both"}}>
              <Tag>Meal Analysis · Smarter Swaps</Tag>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(40px,5.5vw,70px)",fontWeight:900,lineHeight:1.06,
              marginTop:18,marginBottom:20,animation:"fadeUp .7s .15s both",letterSpacing:"-.025em"}}>
              Eat what<br/>you love.<br/>
              <em style={{color:"var(--g)"}}>Eat it smarter.</em>
            </h1>
            <p style={{fontSize:16,color:"var(--ink2)",lineHeight:1.65,maxWidth:420,
              marginBottom:32,animation:"fadeUp .7s .25s both"}}>
              Enter any meal, pick a goal, and get 3 practical swaps that preserve the taste you crave — while improving the nutrition. No diet dogma. No guilt.
            </p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",animation:"fadeUp .7s .35s both"}}>
              <Btn onClick={()=>setPage("app")}>Analyze a Meal</Btn>
              <Btn v="ghost" onClick={()=>document.getElementById("how")?.scrollIntoView({behavior:"smooth"})}>
                How it works ↓
              </Btn>
            </div>
            <div style={{marginTop:36,display:"flex",gap:28,animation:"fadeUp .7s .45s both"}}>
              {[["350kcal","avg daily reduction with consistent swaps"],
                ["3×","more protein possible in most meals"],
                ["78%","of users say alternatives taste just as good"]].map(([n,l])=>(
                <div key={n}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,
                    fontStyle:"italic",color:"var(--o)",lineHeight:1}}>{n}</div>
                  <div style={{fontSize:11,color:"var(--ink3)",marginTop:3,lineHeight:1.4,maxWidth:90}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{animation:"fadeUp .7s .2s both"}}>
            <MealInput onAnalyze={onAnalyze} loading={loading}/>
            {result && <div style={{marginTop:18}}><Results result={result} canSave={false} isDemo onSave={()=>{}}/></div>}
          </div>
        </div>
      </section>

      {/* ── HEALTH CRISIS STATS (inspired by realfood.gov) ── */}
      <section ref={sRef} style={{background:"var(--ink)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{marginBottom:52,opacity:sVis?1:0,transform:sVis?"none":"translateY(20px)",
            transition:"all .6s var(--ease)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--ol)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>The state of our health</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(30px,4.5vw,56px)",fontWeight:900,color:"var(--p)",
              lineHeight:1.08,letterSpacing:"-.02em"}}>
              The data is clear.<br/>
              <em style={{color:"var(--ol)"}}>What we eat is hurting us.</em>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:1}}>
            {[
              {n:50,s:"%",label:"of Americans have prediabetes or diabetes",src:"CDC, 2024"},
              {n:75,s:"%",label:"of adults report having at least one chronic condition",src:"CDC, 2023"},
              {n:90,s:"%",label:"of US healthcare spending treats chronic disease — much diet-linked",src:"realfood.gov"},
              {n:68,s:"%",label:"of a US child's diet is ultra-processed food",src:"JAMA, 2023"},
            ].map((st,i)=>(
              <div key={i} style={{padding:"42px 30px",
                background:i%2===0?"color-mix(in srgb,var(--p) 4%,transparent)":"transparent",
                opacity:sVis?1:0,transform:sVis?"none":"translateY(24px)",
                transition:`all .55s ${.08+i*.1}s var(--ease)`}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",
                  fontSize:"clamp(52px,6vw,80px)",fontWeight:900,lineHeight:1,
                  color:"var(--ol)",marginBottom:14}}>
                  {sVis && <Counter target={st.n} suffix={st.s} visible={sVis}/>}
                </div>
                <div style={{fontSize:14,color:"color-mix(in srgb,var(--p) 72%,transparent)",
                  lineHeight:1.55,marginBottom:8}}>{st.label}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,
                  color:"color-mix(in srgb,var(--p) 28%,transparent)",letterSpacing:".06em"}}>
                  {st.src}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOLUTION BRIDGE ── */}
      <section style={{background:"var(--g)",padding:"64px clamp(16px,5vw,72px)",textAlign:"center"}}>
        <div style={{maxWidth:680,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",
            fontSize:"clamp(26px,4vw,50px)",fontWeight:900,color:"var(--p)",
            lineHeight:1.1,letterSpacing:"-.02em"}}>
            Small swaps.<br/><em>Massive impact over time.</em>
          </h2>
          <p style={{fontSize:16,color:"color-mix(in srgb,var(--p) 78%,transparent)",
            marginTop:18,lineHeight:1.65}}>
            AlternAte doesn't ask you to overhaul your life. It finds the version of your favourite meals that actually supports your health — without lecturing you or stripping away the joy of food.
          </p>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ── */}
      <section ref={iRef} style={{background:"var(--pd)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{marginBottom:48,opacity:iVis?1:0,transform:iVis?"none":"translateY(18px)",
            transition:"all .55s var(--ease)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--g)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>What AlternAte delivers</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(28px,3.8vw,48px)",fontWeight:900,lineHeight:1.08,letterSpacing:"-.02em"}}>
              Real improvements,<br/><em style={{color:"var(--g)"}}>without losing what you love.</em>
            </h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
            {[
              {n:350,s:"kcal",label:"average daily calorie reduction when swaps are followed consistently",c:"var(--o)"},
              {n:2,s:"×",label:"protein improvement achievable in most meals without changing the concept",c:"var(--g)"},
              {n:78,s:"%",label:"of users report the alternatives tasted just as good as the original",c:"var(--b)"},
              {n:3,s:" swaps",label:"per day is all it takes to meaningfully shift your weekly nutritional balance",c:"var(--y)"},
            ].map((item,i)=>(
              <div key={i} style={{
                background:"var(--p)",borderRadius:"var(--rad)",padding:"30px 22px",
                boxShadow:"var(--sh)",
                opacity:iVis?1:0,transform:iVis?"none":"translateY(20px)",
                transition:`all .5s ${.08+i*.1}s var(--ease)`}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",
                  fontSize:"clamp(38px,4vw,58px)",fontWeight:900,color:item.c,lineHeight:1,marginBottom:12}}>
                  {iVis&&<Counter target={item.n} suffix={item.s} visible={iVis} dur={1400}/>}
                </div>
                <div style={{fontSize:13,color:"var(--ink2)",lineHeight:1.55}}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR GOALS ── */}
      <section ref={gRef} style={{background:"var(--p)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto",
          display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"start"}}>
          <div style={{position:"sticky",top:80,opacity:gVis?1:0,transform:gVis?"none":"translateY(18px)",
            transition:"all .55s var(--ease)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--g)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:14}}>Our Purpose</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(30px,4vw,54px)",fontWeight:900,lineHeight:1.06,
              letterSpacing:"-.025em",marginBottom:20}}>
              Our<br/><em style={{color:"var(--g)"}}>Goals</em>
            </h2>
            <p style={{fontSize:15,color:"var(--ink2)",lineHeight:1.65,maxWidth:340}}>
              We built AlternAte because nutrition advice is often overwhelming, judgmental, and completely disconnected from how real people actually eat.
            </p>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {[
              {n:"01",t:"Make swaps feel effortless",d:"Suggestions that fit your existing life — not a completely different one."},
              {n:"02",t:"Preserve the vibe you love",d:"Same comfort, same craving profile — better ingredients behind the scenes."},
              {n:"03",t:"Clarity without judgment",d:"Practical information, zero guilt, and no medical claims whatsoever."},
              {n:"04",t:"Respect restrictions & culture",d:"Your dietary needs and food traditions are always respected and honoured."},
              {n:"05",t:"Make comparison fast",d:"Side-by-side analysis so you can make an informed decision in seconds."},
            ].map((g,i)=>(
              <div key={i} style={{
                padding:"18px 22px",
                borderLeft:`3px dashed color-mix(in srgb,var(--g) ${gVis?42:0}%,transparent)`,
                background:gVis?"var(--pd)":"transparent",
                borderRadius:"0 var(--rad) var(--rad) 0",
                opacity:gVis?1:0,transform:gVis?"none":"translateX(-18px)",
                transition:`all .48s ${.06+i*.09}s var(--ease)`,cursor:"default"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateX(5px)";e.currentTarget.style.background="var(--gw)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.background="var(--pd)";}}>
                <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--g)",
                    opacity:.55,paddingTop:2,flexShrink:0}}>{g.n}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:15,marginBottom:3}}>{g.t}</div>
                    <div style={{color:"var(--ink2)",fontSize:13,lineHeight:1.5}}>{g.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" ref={hRef} style={{background:"var(--ink)",padding:"80px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto"}}>
          <div style={{marginBottom:52,opacity:hVis?1:0,transform:hVis?"none":"translateY(18px)",
            transition:"all .55s var(--ease)"}}>
            <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--gl)",
              letterSpacing:".14em",textTransform:"uppercase",marginBottom:12}}>Simple by design</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",
              fontSize:"clamp(28px,4vw,54px)",fontWeight:900,color:"var(--p)",
              lineHeight:1.08,letterSpacing:"-.02em"}}>How it works</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
            {[
              {n:"01",t:"Enter your meal",d:"Describe any meal, dish, or ingredient list in plain language. No special format required.",
                icon:<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="14" cy="14" r="11"/><path d="M9 14h10M14 9v10"/></svg>},
              {n:"02",t:"Set your goal",d:"Choose a direction — balance, more protein, lower carbs, or more energy.",
                icon:<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 14h18M14 5l9 9-9 9"/></svg>},
              {n:"03",t:"Get smarter swaps",d:"Receive 3 alternatives that preserve the flavour you love but improve what's under the hood.",
                icon:<svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 19V9m0 0-3 3m3-3 3 3M20 9v10m0 0 3-3m-3 3-3-3"/></svg>},
            ].map((s,i)=>(
              <div key={i} style={{
                padding:"44px 32px",
                borderRight:i<2?"1px solid color-mix(in srgb,var(--p) 7%,transparent)":"none",
                opacity:hVis?1:0,transform:hVis?"none":"translateY(22px)",
                transition:`all .5s ${.1+i*.15}s var(--ease)`}}>
                <div style={{color:"var(--gl)",marginBottom:18}}>{s.icon}</div>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:32,fontWeight:500,
                  color:"color-mix(in srgb,var(--p) 10%,transparent)",lineHeight:1,marginBottom:16}}>
                  {s.n}
                </div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,
                  color:"var(--p)",marginBottom:10}}>{s.t}</div>
                <div style={{fontSize:14,color:"color-mix(in srgb,var(--p) 62%,transparent)",lineHeight:1.6}}>
                  {s.d}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:52,textAlign:"center",opacity:hVis?1:0,transition:"opacity .5s .5s"}}>
            <Btn onClick={()=>setPage("app")}>Start Analyzing →</Btn>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{background:"var(--o)",padding:"72px clamp(16px,5vw,72px)",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",
          fontSize:"clamp(26px,4vw,54px)",fontWeight:900,color:"var(--p)",
          lineHeight:1.08,letterSpacing:"-.02em",marginBottom:16}}>
          Your next meal is already good.<br/>
          <em>Let's make it a little better.</em>
        </h2>
        <p style={{fontSize:16,color:"color-mix(in srgb,var(--p) 78%,transparent)",marginBottom:32}}>
          Free to use. No diet plans. No subscriptions. Just smarter swaps.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <Btn onClick={()=>setPage("auth")} s={{background:"var(--p)",color:"var(--o)"}}>
            Create Free Account
          </Btn>
          <Btn v="ghost" onClick={()=>setPage("app")}
            s={{borderColor:"color-mix(in srgb,var(--p) 38%,transparent)",color:"var(--p)"}}>
            Try as Guest
          </Btn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{background:"var(--ink)",padding:"40px clamp(16px,5vw,72px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto",display:"flex",
          justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontStyle:"italic",color:"var(--p)"}}>
              Altern
              <span style={{fontStyle:"normal",fontFamily:"'DM Mono',monospace",fontSize:11,
                background:"var(--g)",color:"var(--p)",padding:"1px 5px",borderRadius:4,marginLeft:1}}>Ate</span>
            </div>
            <div style={{fontSize:11,color:"color-mix(in srgb,var(--p) 32%,transparent)",marginTop:4}}>
              Eat what you love. Eat it smarter.
            </div>
          </div>
          <div style={{fontSize:11,color:"color-mix(in srgb,var(--p) 28%,transparent)",
            maxWidth:420,lineHeight:1.6,textAlign:"right"}}>
            AlternAte does not provide medical, dietary, or clinical advice. All analysis is for informational purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── App workspace ────────────────────────────────────────────────────────────
const AppPage = ({ user, onAnalyze, loading, result, onSave }) => (
  <div style={{minHeight:"100vh",background:"var(--p)",paddingTop:80}}>
    <div style={{maxWidth:860,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
      <div style={{marginBottom:30,animation:"fadeUp .6s both"}}>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--g)",
          letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>Workspace</div>
        <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,letterSpacing:"-.025em"}}>
          Analyze a Meal
        </h1>
        <p style={{color:"var(--ink2)",fontSize:14,marginTop:6}}>
          {user ? `Signed in as ${user.email} — analyses will be saved.` : "Demo mode — sign in to save analyses."}
        </p>
      </div>
      <div style={{animation:"fadeUp .6s .1s both"}}><MealInput onAnalyze={onAnalyze} loading={loading}/></div>
      {result && (
        <div style={{marginTop:28}}>
          <Results result={result} canSave={!!user} onSave={onSave} isDemo={!user}/>
        </div>
      )}
    </div>
  </div>
);

// ─── History page ─────────────────────────────────────────────────────────────
const HistPage = ({ analyses, onView, onCompare }) => {
  const [q, setQ] = useState("");
  const [fg, setFg] = useState("all");
  const fil = analyses.filter(a => {
    const ms = !q || a.result_json.title.toLowerCase().includes(q.toLowerCase());
    const mg = fg==="all" || a.goal===fg;
    return ms && mg;
  });
  return (
    <div style={{minHeight:"100vh",background:"var(--p)",paddingTop:80}}>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:30}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--b)",
            letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>Your Record</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,letterSpacing:"-.025em"}}>
            History
          </h1>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:22,flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search meals…"
            style={{flex:1,minWidth:180,padding:"9px 14px",border:"1.5px solid var(--pdd)",
              borderRadius:9999,fontFamily:"'DM Sans',sans-serif",fontSize:13,
              background:"var(--p)",color:"var(--ink)",outline:"none"}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"all",label:"All"},...GOALS].map(g=>(
              <button key={g.id} onClick={()=>setFg(g.id)} style={{
                padding:"7px 14px",borderRadius:9999,
                border:`1.5px solid ${fg===g.id?"var(--g)":"var(--pdd)"}`,
                background:fg===g.id?"var(--gw)":"transparent",
                color:fg===g.id?"var(--g)":"var(--ink2)",
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:fg===g.id?600:400,
                cursor:"pointer",transition:"all .18s"}}>{g.label}</button>
            ))}
          </div>
        </div>
        {fil.length===0 ? (
          <div style={{textAlign:"center",padding:"72px 20px"}}>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none"
              stroke="var(--ink3)" strokeWidth="1.5" strokeLinecap="round"
              style={{margin:"0 auto 18px",display:"block"}}>
              <circle cx="26" cy="26" r="20"/>
              <path d="M18 26h16M26 18v16" strokeDasharray="4 3"/>
            </svg>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"var(--ink2)",marginBottom:8}}>
              {q?"No matching analyses":"No analyses yet"}
            </div>
            <div style={{fontSize:13,color:"var(--ink3)"}}>
              {q?"Try a different search.":"Analyze a meal to start building your history."}
            </div>
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
            {fil.map(a=><HistCard key={a.id} a={a} onView={onView} onCompare={onCompare}/>)}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Settings page ─────────────────────────────────────────────────────────────
const SettPage = ({ user, settings, onSave }) => {
  const [goal, setGoal] = useState(settings.goal||"balance");
  const [restr, setRestr] = useState(settings.restrictions||[]);
  const [name, setName] = useState(settings.name||"");
  const [saved, setSaved] = useState(false);
  const toggle = r => setRestr(p => p.includes(r)?p.filter(x=>x!==r):[...p,r]);
  return (
    <div style={{minHeight:"100vh",background:"var(--p)",paddingTop:80}}>
      <div style={{maxWidth:560,margin:"0 auto",padding:"44px clamp(16px,4vw,32px)"}}>
        <div style={{marginBottom:30}}>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:"var(--ink3)",
            letterSpacing:".12em",textTransform:"uppercase",marginBottom:8}}>Preferences</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:900,letterSpacing:"-.025em"}}>Settings</h1>
        </div>
        <Card style={{padding:26}}>
          <FL>Display Name</FL>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"
            style={{width:"100%",padding:"10px 14px",border:"1.5px solid var(--pdd)",
              borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:14,
              color:"var(--ink)",background:"var(--pd)",outline:"none",marginBottom:18}}/>
          <FL>Default Goal</FL>
          <div style={{display:"flex",gap:3,background:"var(--pd)",borderRadius:10,padding:3,marginBottom:18}}>
            {GOALS.map(g=>(
              <button key={g.id} onClick={()=>setGoal(g.id)} style={{
                flex:1,padding:"7px 4px",borderRadius:8,border:"none",cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:goal===g.id?600:400,
                background:goal===g.id?"var(--p)":"transparent",
                color:goal===g.id?"var(--g)":"var(--ink2)",
                boxShadow:goal===g.id?"var(--sh)":"none",transition:"all .2s"}}>{g.label}</button>
            ))}
          </div>
          <FL>Default Restrictions</FL>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:24}}>
            {RESTR.map(r=>{const a=restr.includes(r);return(
              <button key={r} onClick={()=>toggle(r)} style={{
                fontFamily:"'DM Sans',sans-serif",fontSize:12,padding:"4px 12px",
                border:`1.5px solid ${a?"var(--g)":"var(--pdd)"}`,borderRadius:9999,cursor:"pointer",
                background:a?"var(--gw)":"transparent",color:a?"var(--g)":"var(--ink2)",transition:"all .18s"}}>
                {r}
              </button>);})}
          </div>
          <button onClick={()=>{onSave({goal,restrictions:restr,name});setSaved(true);setTimeout(()=>setSaved(false),2500);}}
            style={{padding:"12px 28px",background:saved?"var(--g)":"var(--o)",color:"var(--p)",
              border:"none",borderRadius:9999,fontFamily:"'DM Sans',sans-serif",
              fontWeight:600,fontSize:14,cursor:"pointer",transition:"all .25s"}}>
            {saved?"✓ Saved!":"Save Settings"}
          </button>
        </Card>
      </div>
    </div>
  );
};

// ─── Auth page ────────────────────────────────────────────────────────────────
const AuthPage = ({ onAuth, setPage }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    if (!email||!pw){setErr("Please fill in all fields.");return;}
    if (pw.length<6){setErr("Password must be at least 6 characters.");return;}
    setLoading(true);setErr("");
    try{await onAuth(mode,email,pw,name);}
    catch(e){setErr(e.message||"Something went wrong.");}
    finally{setLoading(false);}
  };
  const inp = { width:"100%",padding:"10px 14px",border:"1.5px solid var(--pdd)",
    borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:14,
    color:"var(--ink)",background:"var(--pd)",outline:"none",marginBottom:14 };
  return (
    <div style={{minHeight:"100vh",background:"var(--p)",display:"flex",
      alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      <HeroBg/>
      <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:420,animation:"fadeUp .6s both"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"inline-flex",
            alignItems:"baseline",gap:5,marginBottom:8}}>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,fontStyle:"italic"}}>Altern</span>
            <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,background:"var(--g)",
              color:"var(--p)",padding:"1px 7px",borderRadius:4}}>Ate</span>
          </div>
          <p style={{color:"var(--ink2)",fontSize:14}}>
            {mode==="signin"?"Sign in to save and compare analyses":"Create a free account — takes 10 seconds"}
          </p>
        </div>
        <Card style={{padding:28}}>
          {mode==="signup" && (
            <>
              <FL>Name</FL>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={inp}/>
            </>
          )}
          <FL>Email</FL>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inp}/>
          <FL>Password</FL>
          <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="••••••••"
            style={{...inp,marginBottom:6}}/>
          {err && <div style={{fontSize:13,color:"var(--r)",marginBottom:10}}>{err}</div>}
          <button onClick={handle} disabled={loading} style={{
            width:"100%",padding:"13px",background:"var(--o)",color:"var(--p)",border:"none",
            borderRadius:9999,fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,
            cursor:loading?"not-allowed":"pointer",marginTop:10,transition:"all .2s",
            opacity:loading?.7:1,boxShadow:"0 4px 18px color-mix(in srgb,var(--o) 28%,transparent)"}}>
            {loading?"…":mode==="signin"?"Sign In →":"Create Account →"}
          </button>
          <div style={{textAlign:"center",marginTop:16,display:"flex",flexDirection:"column",gap:6}}>
            <button onClick={()=>{setMode(m=>m==="signin"?"signup":"signin");setErr("");}}
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:"var(--ink2)",
                background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
              {mode==="signin"?"No account? Create one free":"Already have an account? Sign in"}
            </button>
            <button onClick={()=>setPage("app")}
              style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:"var(--ink3)",
                background:"none",border:"none",cursor:"pointer"}}>
              Continue as guest (demo mode)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── Gate page (auth required) ───────────────────────────────────────────────
const Gate = ({ label, setPage }) => (
  <div style={{minHeight:"100vh",display:"flex",alignItems:"center",
    justifyContent:"center",flexDirection:"column",gap:16,padding:40,paddingTop:80}}>
    <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,textAlign:"center"}}>
      Sign in to access your {label}
    </div>
    <Btn onClick={()=>setPage("auth")}>Sign In</Btn>
  </div>
);

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
const mockAnalyze = async ({ mealText, goal }) => {
  await new Promise(r => setTimeout(r, 1800 + Math.random()*700));
  const p=goal==="more_protein"?44:28, c=goal==="lower_carbs"?34:60, f=13;
  const cal=Math.round(p*4+c*4+f*9);
  const w=mealText.split(" ")[0]||"Meal";
  const gLabel=GOALS.find(g=>g.id===goal)?.label||goal;
  return {
    title:mealText.length<44?mealText:mealText.slice(0,40)+"…",
    summary:`This meal ${goal==="balance"?"offers a reasonable nutritional base to build from":goal==="more_protein"?"has clear room to meaningfully boost protein content":goal==="lower_carbs"?"can be refined to reduce its refined carbohydrate load":"would benefit from more complex, sustained energy sources"}.`,
    macro_estimate:{calories:cal,protein_g:p,carbs_g:c,fat_g:f},
    flags:[
      {type:"Processing level",severity:"low",note:"Consider swapping any highly processed components for whole-food alternatives where practical."},
      {type:"Fiber content",severity:goal==="lower_carbs"?"medium":"low",note:"Adding vegetables, legumes, or whole grains could meaningfully boost fiber without altering the core meal."},
    ],
    alternatives:[
      {name:`${w} Bowl — High-Protein Remix`,
        why:`A lean protein swap directly supports your "${gLabel}" goal while keeping the exact same meal format and eating experience.`,
        swap_steps:["Replace the main protein with grilled chicken, salmon, or firm tofu","Use a legume-based side (lentils, edamame) in place of refined grains","Add a miso or tahini dressing for healthy fats without excess calories"],
        macro_estimate:{calories:Math.round(cal*.84),protein_g:Math.round(p*1.38),carbs_g:Math.round(c*.78),fat_g:Math.round(f*.68)}},
      {name:`Lighter ${w} Wrap`,
        why:"The same flavours in a whole-grain wrap with added vegetables reduces caloric density while preserving the eating experience.",
        swap_steps:["Use a whole-grain or spinach wrap as the base vessel","Load with shredded cabbage, grated carrot, and cucumber for crunch and volume","Swap heavy sauces for Greek yogurt thinned with lemon juice and garlic"],
        macro_estimate:{calories:Math.round(cal*.72),protein_g:Math.round(p*1.1),carbs_g:Math.round(c*.74),fat_g:Math.round(f*.62)}},
      {name:`Deconstructed ${w} Grain Bowl`,
        why:"The grain bowl format lets you maximise vegetable volume and control each macro component independently and precisely.",
        swap_steps:["Build on a base of quinoa or farro — both carry significantly more protein than white rice","Add at least 2 cups of roasted or raw vegetables for volume and micronutrients","Finish with a small portion of the original protein and a bright citrus vinaigrette"],
        macro_estimate:{calories:Math.round(cal*.77),protein_g:Math.round(p*1.22),carbs_g:Math.round(c*.83),fat_g:Math.round(f*.58)}},
    ],
    confidence_notes:"Macro estimates are approximate and based on typical portion sizes. Home-cooked versions vary significantly — treat these as directional guides."
  };
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [homeResult, setHomeResult] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [settings, setSettings] = useState({goal:"balance",restrictions:[],name:""});
  const [cmpQ, setCmpQ] = useState([]);
  const [showCmp, setShowCmp] = useState(false);

  const analyze = useCallback(async (input, isHome=false) => {
    if (input.mealText.length > 2000) return;
    setLoading(true);
    try {
      const r = await mockAnalyze(input);
      if (isHome) setHomeResult(r); else setResult(r);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }, []);

  const handleSave = useCallback(() => {
    if (!result||!user) return;
    setAnalyses(p=>[{
      id:Date.now().toString(),user_id:user.id,meal_text:result.title,
      goal:settings.goal,restrictions:{tags:[]},result_json:result,
      created_at:new Date().toISOString()
    },...p]);
  }, [result,user,settings.goal]);

  const handleAuth = async (mode,email,pw,name) => {
    await new Promise(r=>setTimeout(r,900));
    setUser({id:"u_"+Math.random().toString(36).slice(2),email,name});
    setSettings(s=>({...s,name:name||email.split("@")[0]}));
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
      <GlobalStyles/>
      <Nav page={page} setPage={setPage} user={user}
        onLogout={()=>{setUser(null);setPage("home");setAnalyses([]);}}/>

      {page==="home" && <Home setPage={setPage} onAnalyze={v=>analyze(v,true)} loading={loading} result={homeResult}/>}
      {page==="app"  && <AppPage user={user} onAnalyze={v=>analyze(v,false)} loading={loading} result={result} onSave={handleSave}/>}
      {page==="history"  && (user ? <HistPage analyses={analyses} onView={a=>{setResult(a.result_json);setPage("app");}} onCompare={handleCmp}/> : <Gate label="history" setPage={setPage}/>)}
      {page==="settings" && (user ? <SettPage user={user} settings={settings} onSave={s=>setSettings(s)}/> : <Gate label="settings" setPage={setPage}/>)}
      {page==="auth"     && <AuthPage onAuth={handleAuth} setPage={setPage}/>}

      {/* Compare Modal */}
      {showCmp && cmpQ.length===2 && (
        <div style={{position:"fixed",inset:0,background:"rgba(24,20,15,.6)",
          backdropFilter:"blur(6px)",zIndex:200,display:"flex",
          alignItems:"center",justifyContent:"center",padding:24}}
          onClick={()=>setShowCmp(false)}>
          <div style={{background:"var(--p)",borderRadius:"var(--rad)",padding:28,
            maxWidth:700,width:"100%",maxHeight:"90vh",overflowY:"auto",
            boxShadow:"0 28px 72px rgba(24,20,15,.22)",animation:"fadeUp .4s both"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700}}>Side-by-Side Comparison</h2>
              <button onClick={()=>setShowCmp(false)}
                style={{background:"none",border:"none",color:"var(--ink2)",
                  fontSize:22,cursor:"pointer",padding:"4px 8px",lineHeight:1}}>×</button>
            </div>
            <CompareView result={cmpQ[0].result_json} compareResult={{
              verdict_title:"Side-by-Side Analysis",
              verdict_summary:"Here's how your two saved meals compare nutritionally against each other.",
              side_by_side:{
                a:{title:cmpQ[0].result_json.title,macro_estimate:cmpQ[0].result_json.macro_estimate},
                b:{title:cmpQ[1].result_json.title,macro_estimate:cmpQ[1].result_json.macro_estimate}
              },
              tradeoffs:[
                "Both meals offer distinct nutritional profiles — review the flags in each to identify your main tradeoffs.",
                "Consider which macro balance best aligns with your current goal today.",
                "Either meal can be improved further using the suggested swaps on the Alternatives tab."
              ],
              recommendation:"Pick the meal whose nutrient balance is closest to your goal right now — small, consistent improvements compound meaningfully over time."
            }}/>
          </div>
        </div>
      )}
    </div>
  );
}
