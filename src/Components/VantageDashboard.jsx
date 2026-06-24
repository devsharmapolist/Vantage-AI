import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Activity, Mic, Video, Image as ImageIcon, FileText, MonitorSmartphone,
  ShieldCheck, ChevronRight, X, TrendingUp, TrendingDown, Zap, AlertTriangle,
  Gauge, Radio, Clock, CheckCircle2, LayoutDashboard, ScanSearch, History,
  BarChart2, Settings, Users, ChevronLeft,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Sector,
} from "recharts";

/* ── Design tokens ── */
const ACCENT = "#3FD6C4";

const MODALITY_CONFIG = {
  audio:      { label: "Audio",      icon: Mic,              color: "#3FD6C4", bg: "rgba(63,214,196,0.14)"  },
  video:      { label: "Video",      icon: Video,            color: "#9C8CFF", bg: "rgba(156,140,255,0.14)" },
  image:      { label: "Image",      icon: ImageIcon,        color: "#F2B84B", bg: "rgba(242,184,75,0.14)"  },
  text:       { label: "Text",       icon: FileText,         color: "#6F9CEB", bg: "rgba(111,156,235,0.14)" },
  screenshot: { label: "Screenshot", icon: MonitorSmartphone,color: "#FB7C86", bg: "rgba(251,124,134,0.14)" },
};

const SENTIMENT_CONFIG = {
  positive:  { label: "Positive",   color: "#5FD8A6" },
  neutral:   { label: "Neutral",    color: "#8993A8" },
  frustrated:{ label: "Frustrated", color: "#F2B84B" },
  negative:  { label: "Negative",   color: "#FB7C86" },
};

const INTENT_LEVEL_CONFIG = {
  High:   { color: "#FB7C86" },
  Medium: { color: "#F2B84B" },
  Low:    { color: "#5FD8A6" },
};

const STATUS_CONFIG = {
  new:        { label: "New",         color: "#8993A8" },
  in_progress:{ label: "In Progress", color: "#F2B84B" },
  escalated:  { label: "Escalated",   color: "#FB7C86" },
  resolved:   { label: "Resolved",    color: "#5FD8A6" },
};

const SENTIMENT_SCORE = { positive: 92, neutral: 58, frustrated: 34, negative: 14 };
const MODALITY_FILTERS = ["all", "audio", "video", "image", "text", "screenshot"];
const FILTER_LABELS = { all:"All", audio:"Audio", video:"Video", image:"Image", text:"Text", screenshot:"Screenshot" };
const STATUS_ACTIONS = [
  { key: "in_progress", label: "In Progress", Icon: Clock },
  { key: "escalated",   label: "Escalate",    Icon: AlertTriangle },
  { key: "resolved",    label: "Resolve",     Icon: CheckCircle2 },
];
const INTENT_CATEGORIES = ["Transactional", "Navigational", "Informational"];
const INTENT_CATEGORY_COLORS = { Transactional:"#3FD6C4", Navigational:"#9C8CFF", Informational:"#F2B84B" };
const TREND_WINDOW_MINUTES = 3;
const TREND_BUCKETS = 10;

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard",     Icon: LayoutDashboard, real: true  },
  { key: "analysis",  label: "Live Analysis", Icon: ScanSearch,      real: true  },
  { key: "history",   label: "Stream History",Icon: History,         real: true  },
  { key: "reports",   label: "Reports",       Icon: BarChart2,       real: false },
  { key: "team",      label: "Team",          Icon: Users,           real: false },
  { key: "settings",  label: "Settings",      Icon: Settings,        real: false },
];

/* ── Mock data ── */
const INSIGHT_TEMPLATES = [
  { modality:"screenshot", sentiment:"frustrated", intent:"Transactional", intentLevel:"High",   user:"User #4821", summary:"User stuck on checkout page for 4+ minutes, repeated field re-entry on payment form.",          snippet:"6 failed attempts on billing_zip. Cursor hovered over Apply Coupon for 47s.",              action:"Trigger proactive chat support and offer checkout assistance." },
  { modality:"audio",      sentiment:"negative",   intent:"Transactional", intentLevel:"High",   user:"User #3390", summary:"Caller's tone shows rising frustration discussing a billing discrepancy.",                        snippet:"Caller states they were charged twice. Prior calls unresolved. Pitch variance +38%.",       action:"Escalate to senior billing specialist and flag for priority callback." },
  { modality:"video",      sentiment:"neutral",    intent:"Informational", intentLevel:"Medium", user:"User #7712", summary:"Webinar attendee re-watched the pricing slide segment twice.",                                    snippet:"22s dwell on slide 14 (Enterprise tier), 2 replays of the 0:42–1:10 segment.",           action:"Send a follow-up email with a detailed Enterprise tier breakdown." },
  { modality:"text",       sentiment:"positive",   intent:"Transactional", intentLevel:"Low",    user:"User #5108", summary:"Chat user expressed satisfaction after successfully completing an upgrade.",                      snippet:"Message notes the upgrade flow was easier than expected. Confidence: 0.91.",              action:"Log as a successful conversion; no action required." },
  { modality:"image",      sentiment:"frustrated", intent:"Navigational",  intentLevel:"Medium", user:"User #2244", summary:"Uploaded screenshot shows a broken layout on the mobile dashboard view.",                        snippet:"Overlapping UI elements in nav bar at 390x844 viewport detected.",                        action:"Route to QA team with device and viewport metadata attached." },
  { modality:"screenshot", sentiment:"negative",   intent:"Transactional", intentLevel:"High",   user:"User #9981", summary:"Repeated rage-clicks detected on the Submit Order button.",                                     snippet:"11 clicks in 2.3s on a disabled submit button. Console error: card_expiry.",             action:"Auto-trigger an error tooltip and notify the support queue." },
  { modality:"audio",      sentiment:"neutral",    intent:"Informational", intentLevel:"Low",    user:"User #1167", summary:"Support call regarding a general feature inquiry, resolved smoothly.",                           snippet:"Caller confirmed CSV export support. Call resolved in 90s.",                              action:"No action needed; archive transcript for FAQ review." },
  { modality:"text",       sentiment:"frustrated", intent:"Navigational",  intentLevel:"Medium", user:"User #6635", summary:"User asked twice how to find account settings within five minutes.",                             snippet:"Two messages asking where settings are. Second notes it was 'very hidden.'",              action:"Flag the settings page for a navigation and IA review." },
  { modality:"video",      sentiment:"positive",   intent:"Informational", intentLevel:"Low",    user:"User #4470", summary:"Tutorial viewer completed the full onboarding video without skipping.",                          snippet:"100% completion, no skips, 2 replays on the integration setup step.",                    action:"Add user to the 'Power User' onboarding cohort." },
  { modality:"image",      sentiment:"neutral",    intent:"Transactional", intentLevel:"Medium", user:"User #8823", summary:"User uploaded a receipt photo to dispute a charge.",                                             snippet:"OCR extracted total $84.20 with a one-day date mismatch against billing record.",        action:"Route to billing reconciliation queue." },
  { modality:"screenshot", sentiment:"frustrated", intent:"Informational", intentLevel:"Medium", user:"User #3027", summary:"User repeatedly scrolled through the FAQ without finding an answer.",                            snippet:"4 full page traversals on /help/faq in 3 minutes, zero link clicks.",                    action:"Surface the live chat widget proactively on the FAQ page." },
  { modality:"audio",      sentiment:"frustrated", intent:"Transactional", intentLevel:"High",   user:"User #5560", summary:"Caller's voice indicates high stress discussing an account suspension.",                         snippet:"Caller states business depends on account being restored today. Stress markers elevated.", action:"Escalate to account recovery team immediately." },
  { modality:"text",       sentiment:"negative",   intent:"Navigational",  intentLevel:"High",   user:"User #7299", summary:"User threatened to cancel their subscription in chat.",                                          snippet:"Message states they will cancel and leave a review if issue not fixed today.",            action:"Escalate to retention specialist within 15 minutes." },
  { modality:"video",      sentiment:"neutral",    intent:"Transactional", intentLevel:"Low",    user:"User #1184", summary:"User watched the product demo at 1.5x speed with no pauses.",                                   snippet:"Playback at 1.5x, total watch time 3m12s of 4m48s runtime.",                            action:"No action needed; log engagement metric." },
  { modality:"image",      sentiment:"positive",   intent:"Informational", intentLevel:"Low",    user:"User #6602", summary:"User shared a screenshot praising the new dashboard layout.",                                    snippet:"Caption notes the redesigned layout looks much cleaner.",                                action:"Forward to the product team as a positive feedback signal." },
  { modality:"screenshot", sentiment:"negative",   intent:"Transactional", intentLevel:"High",   user:"User #1409", summary:"User's screen shows a payment declined error repeated four times.",                              snippet:"payment_declined 4 times in 90s on a corporate Amex card.",                              action:"Trigger alternate payment prompt and a support escalation." },
];

function buildInitialInsights() {
  const order    = [0,2,5,7,11,1,8,13,3,9,4,12];
  const mins     = [1,2,4,6,8,10,12,14,17,22,28,32];
  const statuses = ["new","new","in_progress","new","resolved","escalated","new","in_progress","new","new","escalated","resolved"];
  const base = Date.now();
  return order.map((ti,i)=>({ ...INSIGHT_TEMPLATES[ti], id:`seed-${i}`, timestamp:new Date(base-mins[i]*60000), status:statuses[i], isNew:false }));
}

/* ── Helpers ── */
function computeSentimentAvg(list) {
  if (!list.length) return 0;
  return Math.round(list.reduce((a,i)=>a+(SENTIMENT_SCORE[i.sentiment]??50),0)/list.length);
}
function formatClock(d){ return d.toLocaleTimeString("en-US",{hour12:false}); }
function timeAgo(date,now){
  const s=Math.max(0,Math.floor((now-date)/1000));
  if(s<5)return"just now"; if(s<60)return`${s}s ago`;
  const m=Math.floor(s/60); if(m<60)return`${m}m ago`;
  return`${Math.floor(m/60)}h ago`;
}
function formatBucketLabel(d){ return d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",hour12:false}); }
function buildSentimentTrend(insights,nowMs){
  let last=computeSentimentAvg(insights)||50;
  return Array.from({length:TREND_BUCKETS},(_,b)=>{
    const end=nowMs-(TREND_BUCKETS-1-b)*TREND_WINDOW_MINUTES*60000;
    const win=insights.filter(i=>i.timestamp.getTime()>end-TREND_WINDOW_MINUTES*60000&&i.timestamp.getTime()<=end);
    const score=win.length?computeSentimentAvg(win):last; last=score;
    return{label:formatBucketLabel(new Date(end)),score};
  });
}

/* ── Sub-components ── */
function Pill({label,color}){
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap" style={{color,backgroundColor:`${color}1F`}}>{label}</span>;
}

function ChartTooltip({active,payload,label}){
  if(!active||!payload?.length)return null;
  return(
    <div className="rounded-lg border border-[#232B3D] bg-[#1A2233] px-3 py-2 shadow-xl">
      <p className="text-[11px] font-mono text-[#8993A8] mb-1">{label}</p>
      <p className="text-sm font-mono font-semibold text-[#3FD6C4]">{payload[0].value} / 100</p>
    </div>
  );
}

function renderActiveDonutSlice(props){
  const{cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill}=props;
  return <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius+6} startAngle={startAngle} endAngle={endAngle} fill={fill}/>;
}

function KpiCard({icon:Icon,label,value,deltaLabel,deltaDirection,accent}){
  return(
    <div className="rounded-xl border border-[#232B3D] bg-[#121826] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[#8993A8]">{label}</span>
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{backgroundColor:`${accent}1F`}}>
          <Icon size={16} style={{color:accent}}/>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-mono text-3xl font-semibold tracking-tight text-[#E8ECF4]">{value}</span>
        {deltaLabel&&(
          <span className={`flex items-center gap-1 text-xs font-mono ${deltaDirection==="up"?"text-[#5FD8A6]":deltaDirection==="down"?"text-[#FB7C86]":"text-[#8993A8]"}`}>
            {deltaDirection==="up"&&<TrendingUp size={13}/>}
            {deltaDirection==="down"&&<TrendingDown size={13}/>}
            {deltaLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function FeedRow({insight,now,onSelect}){
  const mod=MODALITY_CONFIG[insight.modality];
  const Icon=mod.icon;
  const sent=SENTIMENT_CONFIG[insight.sentiment];
  const intentCfg=INTENT_LEVEL_CONFIG[insight.intentLevel];
  const statusCfg=STATUS_CONFIG[insight.status];
  return(
    <button onClick={()=>onSelect(insight)}
      className={`w-full text-left group flex items-stretch rounded-lg border bg-[#121826] border-[#232B3D] hover:border-[#3FD6C4]/40 transition-colors overflow-hidden ${insight.isNew?"vantage-flash":""}`}>
      <div className="w-1 shrink-0" style={{backgroundColor:mod.color}}/>
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 min-w-0">
        <div className="flex items-center gap-3 sm:w-40 shrink-0">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{backgroundColor:mod.bg}}>
            <Icon size={15} style={{color:mod.color}}/>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wide" style={{color:mod.color}}>{mod.label}</span>
            <span className="text-[11px] font-mono text-[#8993A8]">{formatClock(insight.timestamp)} · {timeAgo(insight.timestamp,now)}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#E8ECF4] leading-snug truncate">{insight.summary}</p>
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            <Pill label={sent.label} color={sent.color}/>
            <Pill label={`${insight.intentLevel} Intent`} color={intentCfg.color}/>
            <span className="text-[11px] font-mono text-[#8993A8]">{insight.user}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          {insight.status!=="new"&&<Pill label={statusCfg.label} color={statusCfg.color}/>}
          <ChevronRight size={16} className="text-[#8993A8] group-hover:text-[#E8ECF4] transition-colors"/>
        </div>
      </div>
    </button>
  );
}

function StreamFeed({insights,now,filter,setFilter,intentFilter,setIntentFilter,modalityCounts,onSelect,emptyMessage}){
  return(
    <div className="rounded-xl border border-[#232B3D] bg-[#0E131D] p-5">
      <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Multimodal Stream Feed</h2>
          <p className="text-xs text-[#8993A8] mt-0.5">Flagged events across all streams, sorted by recency.</p>
          {intentFilter!=="all"&&(
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[11px] text-[#8993A8]">Filtered by intent:</span>
              <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{color:INTENT_CATEGORY_COLORS[intentFilter],backgroundColor:`${INTENT_CATEGORY_COLORS[intentFilter]}1F`}}>
                {intentFilter}
                <button onClick={()=>setIntentFilter("all")} className="hover:opacity-70 p-0.5"><X size={11}/></button>
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {MODALITY_FILTERS.map(key=>{
            const cfg=MODALITY_CONFIG[key]; const Icon=cfg?.icon; const active=filter===key;
            return(
              <button key={key} onClick={()=>setFilter(key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${active?"bg-[#3FD6C4]/15 border-[#3FD6C4]/40 text-[#3FD6C4]":"bg-[#121826] border-[#232B3D] text-[#8993A8] hover:text-[#E8ECF4] hover:border-[#3FD6C4]/30"}`}>
                {Icon&&<Icon size={13}/>}
                <span>{FILTER_LABELS[key]}</span>
                <span className="font-mono text-[10px] opacity-70">{modalityCounts[key]}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 vantage-scroll">
        {insights.length===0
          ?<div className="text-center py-12 text-sm text-[#8993A8]">{emptyMessage||"No insights match this filter yet."}</div>
          :insights.map(i=><FeedRow key={i.id} insight={i} now={now} onSelect={onSelect}/>)
        }
      </div>
    </div>
  );
}

function CatScreen({title,status,color}){
  return(
    <div className="flex-1 flex flex-col items-center justify-center px-5 py-16 gap-5 select-none">
      <div className="relative">
        <img
          src="/construction-cat.jpg"
          alt="Construction cat"
          className="w-44 h-auto rounded-2xl shadow-2xl"
          style={{filter:"drop-shadow(0 0 24px rgba(63,214,196,0.18))"}}
        />
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide animate-pulse"
          style={{backgroundColor:`${color}22`,color,border:`1px solid ${color}55`}}>
          Live
        </div>
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-[#E8ECF4]">{title}</p>
        <p className="text-xs text-[#8993A8] mt-1">Our engineer is on it. Helmet on, drill running, zero progress.</p>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#232B3D] bg-[#0E131D]">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:color}}/>
        <span className="text-[11px] font-mono text-[#8993A8]">status: {status}</span>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function VantageDashboard(){
  const [initialInsights] = useState(()=>buildInitialInsights());
  const [insights,setInsights]       = useState(initialInsights);
  const [filter,setFilter]           = useState("all");
  const [intentFilter,setIntentFilter] = useState("all");
  const [hoveredSlice,setHoveredSlice] = useState(null);
  const [selectedId,setSelectedId]   = useState(null);
  const [panelOpen,setPanelOpen]     = useState(false);
  const [panelInsight,setPanelInsight] = useState(null);
  const [now,setNow]                 = useState(new Date());
  const [streamsProcessed,setStreamsProcessed] = useState(128430);
  const [analyzeText,setAnalyzeText] = useState("");
  const [analyzeUser,setAnalyzeUser] = useState("");
  const [analyzing,setAnalyzing]     = useState(false);
  const [analyzeError,setAnalyzeError] = useState("");
  const [activeModality,setActiveModality] = useState("text");
  const [activeNav,setActiveNav]     = useState("dashboard");
  const [sidebarCollapsed,setSidebarCollapsed] = useState(false);

  const counterRef    = useRef(1000);
  const closeTimeout  = useRef(null);

  const baselineScore = useMemo(()=>computeSentimentAvg(initialInsights),[initialInsights]);
  const currentScore  = useMemo(()=>computeSentimentAvg(insights),[insights]);
  const scoreDelta    = currentScore-baselineScore;
  const highIntentCount = useMemo(()=>insights.filter(i=>i.intentLevel==="High").length,[insights]);
  const urgentCount     = useMemo(()=>insights.filter(i=>i.intentLevel==="High"&&i.status==="new").length,[insights]);

  const modalityCounts = useMemo(()=>{
    const c={all:insights.length,audio:0,video:0,image:0,text:0,screenshot:0};
    insights.forEach(i=>{c[i.modality]=(c[i.modality]||0)+1;});
    return c;
  },[insights]);

  const filteredInsights = useMemo(()=>{
    let list=insights;
    if(filter!=="all") list=list.filter(i=>i.modality===filter);
    if(intentFilter!=="all") list=list.filter(i=>i.intent===intentFilter);
    return list;
  },[insights,filter,intentFilter]);

  const intentCounts = useMemo(()=>{
    const c={Transactional:0,Navigational:0,Informational:0};
    insights.forEach(i=>{c[i.intent]=(c[i.intent]||0)+1;});
    return c;
  },[insights]);

  const pieData = useMemo(()=>INTENT_CATEGORIES.map(cat=>({name:cat,value:intentCounts[cat]||0,color:INTENT_CATEGORY_COLORS[cat]})),[intentCounts]);
  const minuteTick = Math.floor(now.getTime()/30000);
  const trendData = useMemo(()=>buildSentimentTrend(insights,now.getTime()),[insights,minuteTick]);

  const activeSliceName = intentFilter!=="all"?intentFilter:hoveredSlice!==null?INTENT_CATEGORIES[hoveredSlice]:null;
  const donutCenterValue = activeSliceName?intentCounts[activeSliceName]:insights.length;
  const donutCenterLabel = activeSliceName||"Total Events";

  const displayedPanelInsight = panelInsight?insights.find(i=>i.id===panelInsight.id)||panelInsight:null;

  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id);},[]);

  useEffect(()=>{
    const id=setInterval(()=>{
      const tpl=INSIGHT_TEMPLATES[Math.floor(Math.random()*INSIGHT_TEMPLATES.length)];
      counterRef.current+=1;
      const newId=`live-${counterRef.current}`;
      const ni={...tpl,id:newId,timestamp:new Date(),status:"new",isNew:true};
      setInsights(prev=>[ni,...prev].slice(0,40));
      setStreamsProcessed(prev=>prev+Math.floor(Math.random()*120)+40);
      setTimeout(()=>setInsights(prev=>prev.map(i=>i.id===newId?{...i,isNew:false}:i)),2400);
    },6000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const fn=e=>{if(e.key==="Escape")closePanel();};
    window.addEventListener("keydown",fn);
    return()=>window.removeEventListener("keydown",fn);
  },[]);

  function openPanel(insight){
    if(closeTimeout.current)clearTimeout(closeTimeout.current);
    setPanelInsight(insight); setSelectedId(insight.id); setPanelOpen(true);
  }
  function closePanel(){
    setPanelOpen(false); setSelectedId(null);
    closeTimeout.current=setTimeout(()=>setPanelInsight(null),300);
  }
  function updateStatus(id,status){ setInsights(prev=>prev.map(i=>i.id===id?{...i,status}:i)); }
  function toggleIntentFilter(name){ setIntentFilter(prev=>prev===name?"all":name); }

  async function analyzeAndInject(){
    if(!analyzeText.trim())return;
    setAnalyzing(true); setAnalyzeError("");
    try{
      const response=await fetch("/api/analyze",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({text:analyzeText.trim()}),
      });
      const data=await response.json();
      const raw=data.content?.map(b=>b.text||"").join("")||"";
      const parsed=JSON.parse(raw.replace(/```json|```/g,"").trim());
      const vs=["positive","neutral","frustrated","negative"];
      const vi=["Transactional","Navigational","Informational"];
      const vl=["High","Medium","Low"];
      if(!vs.includes(parsed.sentiment)||!vi.includes(parsed.intent)||!vl.includes(parsed.intentLevel))
        throw new Error("Invalid fields");
      counterRef.current+=1;
      const newId=`ai-${counterRef.current}`;
      const ni={
        id:newId, modality:"text", sentiment:parsed.sentiment, intent:parsed.intent,
        intentLevel:parsed.intentLevel, summary:parsed.summary,
        snippet:`Original: "${analyzeText.trim().slice(0,100)}${analyzeText.length>100?"…":""}". ${parsed.snippet}`,
        action:parsed.action,
        user:analyzeUser.trim()||`User #${Math.floor(Math.random()*9000)+1000}`,
        timestamp:new Date(), status:"new", isNew:true,
      };
      setInsights(prev=>[ni,...prev].slice(0,40));
      setStreamsProcessed(prev=>prev+1);
      setAnalyzeText(""); setAnalyzeUser(""); openPanel(ni);
      setTimeout(()=>setInsights(prev=>prev.map(i=>i.id===newId?{...i,isNew:false}:i)),2400);
    }catch(e){
      setAnalyzeError("Analysis failed — check your connection and try again.");
    }finally{setAnalyzing(false);}
  }

  /* shared KPI bar */
  const KpiBar=(
    <section className="px-5 sm:px-8 py-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Gauge} label="Sentiment Score" value={`${currentScore}`} deltaLabel={`${scoreDelta>=0?"+":""}${scoreDelta} pts`} deltaDirection={scoreDelta>0?"up":scoreDelta<0?"down":"flat"} accent="#5FD8A6"/>
        <KpiCard icon={Radio} label="Streams Processed" value={streamsProcessed.toLocaleString()} deltaLabel="last 24h" deltaDirection="flat" accent="#3FD6C4"/>
        <KpiCard icon={Zap} label="High-Intent Triggers" value={`${highIntentCount}`} deltaLabel="active now" deltaDirection="flat" accent="#9C8CFF"/>
        <KpiCard icon={AlertTriangle} label="Urgent Pending Actions" value={`${urgentCount}`} deltaLabel={urgentCount>0?"needs review":"all clear"} deltaDirection={urgentCount>0?"down":"up"} accent="#FB7C86"/>
      </div>
    </section>
  );

  /* shared live analysis panel */
  const LiveAnalysisPanel=(
    <section className="px-5 sm:px-8 pt-6">
      <div className="rounded-xl border border-[#3FD6C4]/30 bg-[#121826] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-md bg-[#3FD6C4]/15 flex items-center justify-center">
            <Zap size={14} className="text-[#3FD6C4]"/>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Live Analysis</h2>
            <p className="text-xs text-[#8993A8]">Submit a data stream for real-time sentiment and intent analysis</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(MODALITY_CONFIG).map(([key,cfg])=>{
            const Icon=cfg.icon; const active=activeModality===key;
            return(
              <button key={key} onClick={()=>setActiveModality(key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                style={active?{backgroundColor:`${cfg.color}1F`,borderColor:`${cfg.color}60`,color:cfg.color}:{backgroundColor:"transparent",borderColor:"#232B3D",color:"#8993A8"}}>
                <Icon size={12}/>{cfg.label}
              </button>
            );
          })}
        </div>
        {activeModality==="text"?(
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="text" value={analyzeUser} onChange={e=>setAnalyzeUser(e.target.value)} placeholder="Your name (optional)"
              className="w-full sm:w-44 shrink-0 bg-[#0B0F17] border border-[#232B3D] rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] placeholder-[#8993A8] focus:outline-none focus:border-[#3FD6C4]/50 transition-colors"/>
            <input type="text" value={analyzeText} onChange={e=>setAnalyzeText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&!analyzing&&analyzeAndInject()}
              placeholder="e.g. I can't find the export button, this is really frustrating..."
              className="flex-1 bg-[#0B0F17] border border-[#232B3D] rounded-lg px-3 py-2.5 text-sm text-[#E8ECF4] placeholder-[#8993A8] focus:outline-none focus:border-[#3FD6C4]/50 transition-colors"/>
            <button onClick={analyzeAndInject} disabled={analyzing||!analyzeText.trim()}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{backgroundColor:analyzing?"#1A2233":ACCENT,color:analyzing?"#8993A8":"#0B0F17"}}>
              {analyzing?(<><span className="w-3.5 h-3.5 rounded-full border-2 border-[#8993A8] border-t-transparent animate-spin"/>Analyzing</>):(<><Zap size={14}/>Analyze</>)}
            </button>
          </div>
        ):(
          <div className="flex flex-col items-center justify-center py-4 gap-4 select-none">
            <div className="relative">
              <img
                src="/construction-cat.jpg"
                alt="Construction cat"
                className="w-32 h-auto rounded-xl shadow-xl"
                style={{filter:"drop-shadow(0 0 16px rgba(251,124,134,0.25))"}}
              />
              <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[#FB7C86]/20 text-[#FB7C86] border border-[#FB7C86]/40 animate-pulse">
                WIP
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[#E8ECF4]">{MODALITY_CONFIG[activeModality].label} analysis — under construction</p>
              <p className="text-xs text-[#8993A8] mt-1">Our engineer has the tools. Progress: <span className="text-[#F2B84B] font-mono">ERROR</span></p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#232B3D] bg-[#0B0F17]">
              <span className="w-2 h-2 rounded-full bg-[#FB7C86] animate-pulse"/>
              <span className="text-[11px] font-mono text-[#8993A8]">build_status: catastrophic_failure</span>
            </div>
          </div>
        )}
        {analyzeError&&<p className="mt-2 text-xs text-[#FB7C86] flex items-center gap-1.5"><AlertTriangle size={12}/>{analyzeError}</p>}
      </div>
    </section>
  );

  return(
    <div className="min-h-screen bg-[#0B0F17] text-[#E8ECF4] font-sans flex">
      <style>{`
        @keyframes vantageFlash{0%{background-color:rgba(63,214,196,0.20);}100%{background-color:transparent;}}
        .vantage-flash{animation:vantageFlash 2.4s ease-out;}
        .vantage-scroll::-webkit-scrollbar{width:6px;height:6px;}
        .vantage-scroll::-webkit-scrollbar-thumb{background:#232B3D;border-radius:9999px;}
        .vantage-scroll::-webkit-scrollbar-track{background:transparent;}
      `}</style>

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col shrink-0 border-r border-[#232B3D] bg-[#0E131D] transition-all duration-300"
        style={{width:sidebarCollapsed?64:220}}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[#232B3D]">
          <div className="w-8 h-8 rounded-lg bg-[#3FD6C4]/15 border border-[#3FD6C4]/30 flex items-center justify-center shrink-0">
            <Activity size={16} className="text-[#3FD6C4]"/>
          </div>
          {!sidebarCollapsed&&(
            <div className="overflow-hidden">
              <p className="text-sm font-semibold leading-none whitespace-nowrap">Vantage AI</p>
              <p className="text-[10px] text-[#8993A8] mt-1 whitespace-nowrap">Sentiment Engine</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map(({key,label,Icon,real})=>{
            const isActive=activeNav===key;
            return(
              <button key={key} onClick={()=>real&&setActiveNav(key)} title={sidebarCollapsed?label:undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  isActive?"bg-[#3FD6C4]/10 text-[#3FD6C4]"
                  :real?"text-[#8993A8] hover:text-[#E8ECF4] hover:bg-[#1A2233]"
                  :"text-[#4A5468] cursor-default"}`}>
                <Icon size={16} className="shrink-0"/>
                {!sidebarCollapsed&&<span className="flex-1 whitespace-nowrap">{label}</span>}
                {!sidebarCollapsed&&!real&&(
                  <span className="text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#1A2233] text-[#4A5468]">Soon</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[#232B3D] p-2 flex flex-col gap-1">
          <button onClick={()=>setSidebarCollapsed(p=>!p)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#8993A8] hover:text-[#E8ECF4] hover:bg-[#1A2233] transition-colors">
            {sidebarCollapsed?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}
            {!sidebarCollapsed&&<span className="text-xs">Collapse</span>}
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-[#3FD6C4]/20 border border-[#3FD6C4]/30 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-[#3FD6C4]">D</span>
            </div>
            {!sidebarCollapsed&&(
              <div>
                <p className="text-xs font-medium text-[#E8ECF4]">Dev</p>
                <p className="text-[10px] text-[#8993A8]">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[#232B3D] bg-[#0B0F17]/95 backdrop-blur px-5 sm:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:hidden">
              <div className="w-9 h-9 rounded-lg bg-[#3FD6C4]/15 border border-[#3FD6C4]/30 flex items-center justify-center">
                <Activity size={18} className="text-[#3FD6C4]"/>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight leading-none">Vantage AI</h1>
                <p className="text-xs text-[#8993A8] mt-1">Multimodal Sentiment &amp; Intent Engine</p>
              </div>
            </div>
            <div className="hidden md:block">
              <h1 className="text-base font-semibold">{NAV_ITEMS.find(n=>n.key===activeNav)?.label??"Dashboard"}</h1>
              <p className="text-xs text-[#8993A8] mt-0.5">Multimodal Sentiment &amp; Intent Engine</p>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#232B3D] bg-[#121826]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3FD6C4] opacity-75"/>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3FD6C4]"/>
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-[#3FD6C4]">Live</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#232B3D] bg-[#121826]">
                <ShieldCheck size={13} className="text-[#5FD8A6]"/>
                <span className="text-xs font-medium">Operational</span>
              </div>
              <div className="px-3 py-1.5 rounded-full border border-[#232B3D] bg-[#121826]">
                <span className="text-xs font-mono text-[#8993A8]">{formatClock(now)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── DASHBOARD ── */}
        {activeNav==="dashboard"&&(<>
          {LiveAnalysisPanel}
          {KpiBar}
          <section className="px-5 sm:px-8 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Trend chart */}
              <div className="lg:col-span-2 rounded-xl border border-[#232B3D] bg-[#121826] p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold">Sentiment Trend</h3>
                    <p className="text-xs text-[#8993A8] mt-0.5">Rolling average sentiment score across all streams</p>
                  </div>
                  <span className="font-mono text-[11px] text-[#8993A8]">last {TREND_BUCKETS*TREND_WINDOW_MINUTES}m</span>
                </div>
                <div className="h-[220px] -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{top:10,right:12,left:0,bottom:0}}>
                      <defs>
                        <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ACCENT} stopOpacity={0.35}/>
                          <stop offset="95%" stopColor={ACCENT} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#232B3D" strokeDasharray="3 3" vertical={false}/>
                      <XAxis dataKey="label" tick={{fill:"#8993A8",fontSize:11,fontFamily:"monospace"}} axisLine={{stroke:"#232B3D"}} tickLine={false}/>
                      <YAxis domain={[0,100]} tick={{fill:"#8993A8",fontSize:11,fontFamily:"monospace"}} axisLine={false} tickLine={false} width={34}/>
                      <Tooltip content={<ChartTooltip/>} cursor={{stroke:"#232B3D"}}/>
                      <Area type="monotone" dataKey="score" stroke={ACCENT} strokeWidth={2} fill="url(#sentimentGradient)" dot={{r:3,fill:ACCENT,strokeWidth:0}} activeDot={{r:5}}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Donut */}
              <div className="rounded-xl border border-[#232B3D] bg-[#121826] p-5 flex flex-col">
                <div className="mb-1">
                  <h3 className="text-sm font-semibold">Intent Distribution</h3>
                  <p className="text-xs text-[#8993A8] mt-0.5">Click a segment to filter the feed</p>
                </div>
                <div className="relative h-[170px] mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={78} paddingAngle={3} stroke="none"
                        activeIndex={hoveredSlice===null?-1:hoveredSlice} activeShape={renderActiveDonutSlice}
                        onMouseEnter={(_,idx)=>setHoveredSlice(idx)} onMouseLeave={()=>setHoveredSlice(null)}
                        onClick={(_,idx)=>toggleIntentFilter(INTENT_CATEGORIES[idx])}>
                        {pieData.map(e=><Cell key={e.name} fill={e.color} className="cursor-pointer" opacity={intentFilter==="all"||intentFilter===e.name?1:0.3}/>)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="font-mono text-2xl font-semibold text-[#E8ECF4]">{donutCenterValue}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[#8993A8] text-center px-4">{donutCenterLabel}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {INTENT_CATEGORIES.map((cat,idx)=>{
                    const count=intentCounts[cat]||0;
                    const pct=insights.length?Math.round(count/insights.length*100):0;
                    const active=intentFilter===cat;
                    return(
                      <button key={cat} onClick={()=>toggleIntentFilter(cat)} onMouseEnter={()=>setHoveredSlice(idx)} onMouseLeave={()=>setHoveredSlice(null)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${active?"bg-[#1A2233]":"hover:bg-[#1A2233]/60"}`}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:INTENT_CATEGORY_COLORS[cat]}}/>
                          <span className={active?"text-[#E8ECF4] font-medium":"text-[#8993A8]"}>{cat}</span>
                        </span>
                        <span className="font-mono text-[#8993A8]">{count} · {pct}%</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
          <main className="px-5 sm:px-8 pb-10">
            <StreamFeed insights={filteredInsights} now={now} filter={filter} setFilter={setFilter} intentFilter={intentFilter} setIntentFilter={setIntentFilter} modalityCounts={modalityCounts} onSelect={openPanel}/>
          </main>
        </>)}

        {/* ── LIVE ANALYSIS ── */}
        {activeNav==="analysis"&&(
          <div className="flex flex-col overflow-y-auto vantage-scroll">
            {LiveAnalysisPanel}
            {KpiBar}
            <main className="px-5 sm:px-8 pb-10">
              <p className="text-[11px] uppercase tracking-wide text-[#8993A8] font-semibold mb-3">AI-Analyzed Events</p>
              <StreamFeed
                insights={insights.filter(i=>i.id.startsWith("ai-"))}
                now={now} filter={filter} setFilter={setFilter}
                intentFilter={intentFilter} setIntentFilter={setIntentFilter}
                modalityCounts={modalityCounts} onSelect={openPanel}
                emptyMessage="No live analyses yet — type something above and hit Analyze."
              />
            </main>
          </div>
        )}

        {/* ── STREAM HISTORY ── */}
        {activeNav==="history"&&(
          <div className="flex flex-col overflow-y-auto vantage-scroll">
            {KpiBar}
            <main className="px-5 sm:px-8 pb-10">
              <StreamFeed insights={filteredInsights} now={now} filter={filter} setFilter={setFilter} intentFilter={intentFilter} setIntentFilter={setIntentFilter} modalityCounts={modalityCounts} onSelect={openPanel}/>
            </main>
          </div>
        )}

        {/* ── COMING SOON ── */}
        {["reports","team","settings"].includes(activeNav)&&(
          <CatScreen
            title={`${NAV_ITEMS.find(n=>n.key===activeNav)?.label} — coming soon`}
            status="napping_indefinitely"
            color="#9C8CFF"
          />
        )}

      </div>

      {/* ── Detail panel ── */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${panelOpen?"opacity-100 pointer-events-auto":"opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closePanel}/>
        <div className={`relative h-full w-full sm:w-[440px] bg-[#1A2233] border-l border-[#232B3D] flex flex-col transform transition-transform duration-300 ${panelOpen?"translate-x-0":"translate-x-full"}`}>
          {displayedPanelInsight&&(()=>{
            const cfg=MODALITY_CONFIG[displayedPanelInsight.modality];
            const Icon=cfg.icon;
            return(<>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#232B3D]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{backgroundColor:cfg.bg}}>
                    <Icon size={15} style={{color:cfg.color}}/>
                  </div>
                  <span className="text-sm font-semibold" style={{color:cfg.color}}>{cfg.label} Insight</span>
                </div>
                <button onClick={closePanel} className="w-8 h-8 rounded-md flex items-center justify-center text-[#8993A8] hover:text-[#E8ECF4] hover:bg-[#232B3D] transition-colors">
                  <X size={16}/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto vantage-scroll px-5 py-5 space-y-5">
                <div>
                  <p className="text-sm text-[#E8ECF4] leading-relaxed">{displayedPanelInsight.summary}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <Pill label={SENTIMENT_CONFIG[displayedPanelInsight.sentiment].label} color={SENTIMENT_CONFIG[displayedPanelInsight.sentiment].color}/>
                    <Pill label={`${displayedPanelInsight.intentLevel} Intent`} color={INTENT_LEVEL_CONFIG[displayedPanelInsight.intentLevel].color}/>
                    <Pill label={displayedPanelInsight.intent} color="#8993A8"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[#8993A8] uppercase tracking-wide text-[10px] mb-1">User</span>
                    <span className="font-mono text-[#E8ECF4]">{displayedPanelInsight.user}</span>
                  </div>
                  <div>
                    <span className="block text-[#8993A8] uppercase tracking-wide text-[10px] mb-1">Timestamp</span>
                    <span className="font-mono text-[#E8ECF4]">{formatClock(displayedPanelInsight.timestamp)}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[#8993A8] uppercase tracking-wide text-[10px] mb-2">Data Snippet</span>
                  <div className="rounded-lg border border-[#232B3D] bg-[#0B0F17] p-3">
                    <p className="font-mono text-xs text-[#8993A8] leading-relaxed">{displayedPanelInsight.snippet}</p>
                  </div>
                </div>
                <div>
                  <span className="flex items-center gap-1.5 text-[#8993A8] uppercase tracking-wide text-[10px] mb-2">
                    <Zap size={12} style={{color:ACCENT}}/>AI Recommended Action
                  </span>
                  <div className="rounded-lg border border-[#3FD6C4]/25 bg-[#3FD6C4]/[0.06] p-3">
                    <p className="text-xs text-[#E8ECF4] leading-relaxed">{displayedPanelInsight.action}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-[#232B3D]">
                <span className="block text-[#8993A8] uppercase tracking-wide text-[10px] mb-2">Update Status</span>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_ACTIONS.map(({key,label,Icon:SIcon})=>{
                    const active=displayedPanelInsight.status===key;
                    return(
                      <button key={key} onClick={()=>updateStatus(displayedPanelInsight.id,key)}
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-medium transition-colors ${active?"border-transparent":"border-[#232B3D] text-[#8993A8] hover:text-[#E8ECF4] hover:border-[#3FD6C4]/30"}`}
                        style={active?{backgroundColor:`${STATUS_CONFIG[key].color}1F`,color:STATUS_CONFIG[key].color}:undefined}>
                        <SIcon size={14}/>{label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>);
          })()}
        </div>
      </div>
    </div>
  );
}