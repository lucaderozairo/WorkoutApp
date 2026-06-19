// @ts-nocheck
import { useState, useEffect } from "react";
import type { FC, ReactNode } from "react";
import {
  Home, Dumbbell, Users, User, Plus, ChevronRight, Zap, Search,
  Bell, Settings, MapPin, Cloud, Calendar, Target, Link2, Camera,
  BarChart2, Compass, MessageCircle, Filter, Flame, Bike, Mountain,
  Wind, Droplets, Sun, BookOpen, TrendingUp, ArrowLeft, Route,
  Activity, Heart, Moon, Scale, Brain, Waves, Pencil, ShieldCheck,
  CheckSquare, CheckCircle2, Circle, Apple, Check, Send, Paperclip,
  CheckCheck, MoreVertical, Save, RotateCcw, Layers, Minus, Trash2,
  Award, Star, Timer, Play, Pause, MoreHorizontal, Navigation, Menu, X,
} from "lucide-react";

type AppState = "empty" | "loading" | "mock";
type NavId = "messaging" | "route-planner" | "blueprints" | "active-session" | "health-detail" | "settings";
interface NavRoute { id: NavId; params?: Record<string, any>; }
type Device   = "phone" | "tablet" | "desktop";
type ViewMode = "native" | "web";
interface NP { pop: () => void; push: (r: NavRoute) => void; appState: AppState; params?: Record<string, any>; }

const T = {
  bg:"#F4F6FA", surf:"#FFFFFF", card:"#FFFFFF", card2:"#F0F3F8",
  border:"#E2E8F0", border2:"#CBD5E1", txt:"#0D1624", txt2:"#5A6E85",
  sub:"#9AABB8", mute:"#E8EDF4", accent:"#2563EB", accentD:"#DBEAFE",
  green:"#16A34A", greenD:"#DCFCE7", greenB:"#86EFAC",
  amber:"#D97706", amberD:"#FEF3C7",
  red:"#DC2626", redD:"#FEE2E2",
  purple:"#7C3AED", purpleD:"#EDE9FE",
  teal:"#0D9488", tealD:"#CCFBF1",
  inactive:"#B0BEC9", active:"#0D1624",
  dBg:"#06080D", dSurf:"#0B0F17", dCard:"#0F1620", dBorder:"#16243A",
  dSk:"#111E2E", dSkHi:"#192C42", dSub:"#2E4560",
  done:"#F0FDF4", doneBorder:"#86EFAC",
};
const sh = "0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)";
const shMd = "0 4px 12px rgba(0,0,0,0.08)";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  @keyframes shimmer{0%{background-position:-700px 0}100%{background-position:700px 0}}
  .sk{background:linear-gradient(90deg,#E2E8F0 0%,#E2E8F0 30%,#F8FAFC 50%,#E2E8F0 70%,#E2E8F0 100%);
    background-size:600px 100%;animation:shimmer 1.8s infinite linear;}
  .sk.dark{background:linear-gradient(90deg,#111E2E 0%,#111E2E 25%,#192C42 50%,#111E2E 75%,#111E2E 100%);
    background-size:1400px 100%;animation:shimmer 2.2s infinite linear;}
  .sk:nth-child(2n){animation-delay:-0.4s}.sk:nth-child(3n){animation-delay:-0.8s}
  .sk:nth-child(5n){animation-delay:-1.2s}.sk:nth-child(7n){animation-delay:-1.6s}
  .scroll-area{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;}
  .scroll-area::-webkit-scrollbar{display:none;}
  .h-scroll{display:flex;overflow-x:auto;scrollbar-width:none;gap:8px;}
  .h-scroll::-webkit-scrollbar{display:none;}
  .tab-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px 0 0;
    background:none;border:none;cursor:pointer;font-family:'Geist',sans-serif;
    font-size:10px;font-weight:500;letter-spacing:0.15px;}
  .tab-btn:active{opacity:0.6;}
  .pill-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:20px;
    border:none;cursor:pointer;font-family:'Geist',sans-serif;font-size:12px;font-weight:500;
    white-space:nowrap;flex-shrink:0;}
  .icon-btn{display:flex;align-items:center;justify-content:center;background:#fff;
    border-radius:10px;border:1px solid #E2E8F0;cursor:pointer;flex-shrink:0;
    box-shadow:0 1px 3px rgba(0,0,0,0.07);}
  .icon-btn:active{opacity:0.6;}
  .cta-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 18px;border-radius:12px;
    border:none;cursor:pointer;font-family:'Geist',sans-serif;font-size:13px;font-weight:600;}
  .ghost-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;
    cursor:pointer;font-family:'Geist',sans-serif;font-size:12px;font-weight:500;
    background:none;border:1px solid #CBD5E1;color:#5A6E85;}
  .row-item{display:flex;align-items:center;gap:12px;padding:13px 16px;
    border-bottom:1px solid #E2E8F0;cursor:pointer;}
  .row-item:last-child{border-bottom:none;}
  .row-item:active{background:#F0F3F8;}
  .wtab{flex:1;padding:8px 0;background:none;border:none;cursor:pointer;
    font-family:'Geist',sans-serif;font-size:12px;font-weight:500;}
  .cat-card{background:#fff;border-radius:14px;border:1px solid #E2E8F0;
    padding:12px 14px;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,0.07);
    display:flex;align-items:center;gap:10px;}
  .inp{border-radius:9px;border:1.5px solid #E2E8F0;padding:8px 10px;
    font-family:'Geist Mono',monospace;font-size:14px;font-weight:600;
    text-align:center;outline:none;width:100%;background:#F0F3F8;}
  .inp-done{background:#F0FDF4;border-color:#86EFAC;color:#16A34A;}
  .inp-active{background:#EFF6FF;border-color:#93C5FD;color:#2563EB;}
`;


// ── SVG MAP — Ham / Richmond TW10 7YE ─────────────────────────────
const MAP_BOUNDS = { N:51.447, S:51.413, W:-0.337, E:-0.293 };
interface SVGMapProps { width?: number; height?: number; }
const SVGMap: FC<SVGMapProps> = ({ width=375, height=240 }) => {
  const {N,S,W,E} = MAP_BOUNDS;
  const p = ([lat,lng]: [number,number]): [number,number] => [((lng-W)/(E-W))*width, ((N-lat)/(N-S))*height];
  const d = (pts: [number,number][]) => pts.map((pt,i)=>`${i===0?"M":"L"} ${p(pt).join(" ")}`).join(" ");
  const poly = (pts: [number,number][]) => pts.map(pt=>p(pt).join(",")).join(" ");
  const RP: [number,number][] = [[51.447,-0.302],[51.440,-0.300],[51.434,-0.299],[51.425,-0.302],[51.420,-0.303],[51.415,-0.303],[51.413,-0.303],[51.413,-0.293],[51.447,-0.293]];
  const HC: [number,number][] = [[51.432,-0.323],[51.434,-0.317],[51.432,-0.315],[51.429,-0.316],[51.428,-0.319],[51.430,-0.323]];
  const PM: [number,number][] = [[51.445,-0.320],[51.446,-0.310],[51.445,-0.302],[51.442,-0.303],[51.441,-0.310],[51.442,-0.319]];
  const TH: [number,number][] = [[51.447,-0.337],[51.447,-0.293],[51.446,-0.293],[51.447,-0.303],[51.446,-0.310],[51.447,-0.318],[51.446,-0.325],[51.447,-0.332],[51.447,-0.337]];
  const TB: [number,number][] = [[51.447,-0.337],[51.446,-0.330],[51.445,-0.323],[51.446,-0.316],[51.447,-0.310],[51.446,-0.303],[51.447,-0.293]];
  type RD = [[number,number][],number,string];
  const ROADS: RD[] = [
    [[[51.447,-0.321],[51.442,-0.320],[51.437,-0.321],[51.432,-0.321],[51.426,-0.321],[51.420,-0.320],[51.415,-0.319]],4,"#fff"],
    [[[51.447,-0.306],[51.442,-0.305],[51.437,-0.304],[51.432,-0.304],[51.425,-0.305],[51.420,-0.306]],4,"#fff"],
    [[[51.444,-0.325],[51.440,-0.324],[51.435,-0.323],[51.430,-0.322],[51.426,-0.322]],2.5,"#fff"],
    [[[51.437,-0.337],[51.436,-0.330],[51.435,-0.323],[51.433,-0.320]],2.5,"#fff"],
    [[[51.427,-0.316],[51.423,-0.311],[51.419,-0.307],[51.416,-0.304]],2.5,"#fff"],
    [[[51.440,-0.337],[51.440,-0.293]],1.5,"#ece8df"],[[[51.435,-0.337],[51.435,-0.293]],1.5,"#ece8df"],
    [[[51.430,-0.337],[51.430,-0.293]],1.5,"#ece8df"],[[[51.425,-0.337],[51.425,-0.293]],1.5,"#ece8df"],
    [[[51.447,-0.328],[51.415,-0.328]],1.5,"#ece8df"],[[[51.447,-0.314],[51.415,-0.314]],1.5,"#ece8df"],
    [[[51.447,-0.310],[51.415,-0.310]],1.5,"#ece8df"],
  ];
  const [pinX,pinY] = p([51.4301,-0.3150]);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{display:"block",flexShrink:0}}>
      <rect width={width} height={height} fill="#f0ece4"/>
      <polygon points={poly(TH)} fill="#aad3df"/>
      <path d={d(TB)} stroke="#74b9d4" strokeWidth="1" fill="none" opacity="0.6"/>
      <polygon points={poly(PM)} fill="#d1e8c2"/>
      <polygon points={poly(HC)} fill="#c8e6c2" stroke="#9ec89a" strokeWidth="0.5"/>
      <polygon points={poly(RP)} fill="#c8e6c2" stroke="#9ec89a" strokeWidth="1"/>
      {ROADS.map(([pts,sw,col],i)=><path key={i} d={d(pts)} stroke={col} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"/>)}
      {(()=>{const [x,y]=p([51.430,-0.298]);return <text x={x} y={y} fontSize="8.5" fill="#4a7c4f" fontFamily="sans-serif" fontStyle="italic" fontWeight="600" textAnchor="middle">Richmond Park</text>;})()}
      {(()=>{const [x,y]=p([51.446,-0.316]);return <text x={x} y={y} fontSize="8" fill="#5599bb" fontFamily="sans-serif" fontStyle="italic" textAnchor="middle">River Thames</text>;})()}
      {(()=>{const [x,y]=p([51.440,-0.321]);return <text x={x} y={y-4} fontSize="7.5" fill="#555" fontFamily="sans-serif" textAnchor="middle">Upper Ham Rd</text>;})()}
      {(()=>{const [x,y]=p([51.440,-0.305]);return <text x={x} y={y-4} fontSize="7.5" fill="#555" fontFamily="sans-serif" textAnchor="middle">Petersham Rd</text>;})()}
      <ellipse cx={pinX} cy={pinY+11} rx={5} ry={2.5} fill="rgba(0,0,0,0.18)"/>
      <path d={`M ${pinX} ${pinY+8} C ${pinX-10} ${pinY} ${pinX-10} ${pinY-16} ${pinX} ${pinY-16} C ${pinX+10} ${pinY-16} ${pinX+10} ${pinY} ${pinX} ${pinY+8}`} fill="#2563EB" stroke="white" strokeWidth="2"/>
      <circle cx={pinX} cy={pinY-9} r={4} fill="white"/>
      <rect x={0} y={height-14} width={width} height={14} fill="rgba(255,255,255,0.75)"/>
      <text x={width-5} y={height-3} fontSize="7.5" fill="#555" fontFamily="sans-serif" textAnchor="end">© OpenStreetMap · Ham, Richmond TW10 7YE</text>
    </svg>
  );
};


// ── Primitives ─────────────────────────────────────────────────────
const Sk: FC<{w?:string|number;h?:number;r?:number|string;d?:number;dark?:boolean;style?:React.CSSProperties}> =
  ({w="100%",h=12,r=6,d=0,dark=false,style={}}) => (
  <div className={dark?"sk dark":"sk"} style={{width:w,height:h,borderRadius:r,flexShrink:0,animationDelay:`${d}s`,...style}}/>
);
const Circ: FC<{s:number;d?:number;dark?:boolean}> = ({s,d=0,dark=false}) => <Sk w={s} h={s} r="50%" d={d} dark={dark}/>;

const Card: FC<{children:ReactNode;style?:React.CSSProperties;p?:number;r?:number}> =
  ({children,style={},p=16,r=18}) => (
  <div style={{background:T.card,borderRadius:r,border:`1px solid ${T.border}`,padding:p,boxShadow:sh,...style}}>{children}</div>
);
const Px: FC<{children:ReactNode;style?:React.CSSProperties}> = ({children,style={}}) => (
  <div style={{padding:"0 20px",...style}}>{children}</div>
);
const Txt: FC<{children:ReactNode;size?:number;weight?:number;color?:string;mono?:boolean;block?:boolean;style?:React.CSSProperties}> =
  ({children,size=13,weight=400,color=T.txt,mono=false,block=false,style={}}) => (
  <span style={{fontFamily:mono?"'Geist Mono',monospace":"'Geist',sans-serif",fontSize:size,fontWeight:weight,color,lineHeight:1.45,display:block?"block":undefined,...style}}>{children}</span>
);
const SL: FC<{children:ReactNode;action?:string;onAction?:()=>void}> = ({children,action,onAction}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <Txt size={11} weight={600} color={T.sub} style={{textTransform:"uppercase",letterSpacing:"0.65px"}}>{children}</Txt>
    {action&&<button onClick={onAction} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:12,fontWeight:500,color:T.accent}}>{action}</button>}
  </div>
);
const Pills: FC<{items:string[];active:string;onSelect:(s:string)=>void}> = ({items,active,onSelect}) => (
  <div className="h-scroll" style={{padding:"0 20px"}}>
    {items.map(item=>(
      <button key={item} className="pill-btn" onClick={()=>onSelect(item)}
        style={{background:active===item?T.accent:T.card,color:active===item?"#fff":T.txt2,border:`1px solid ${active===item?T.accent:T.border}`,boxShadow:active===item?"none":sh}}>
        {item}
      </button>
    ))}
  </div>
);
const EmptyBlock: FC<{icon:FC<any>;iconColor?:string;iconBg?:string;title:string;subtitle:string;cta?:string;onCta?:()=>void;ghost?:string;}> =
  ({icon:Icon,iconColor=T.sub,iconBg=T.card2,title,subtitle,cta,onCta,ghost}) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",padding:"26px 20px"}}>
    <div style={{width:60,height:60,borderRadius:"50%",background:iconBg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>
      <Icon size={24} color={iconColor} strokeWidth={1.5}/>
    </div>
    <Txt size={14} weight={600} block style={{marginBottom:5}}>{title}</Txt>
    <Txt size={12} color={T.txt2} block style={{maxWidth:220,lineHeight:1.65,marginBottom:18}}>{subtitle}</Txt>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      {cta&&<button className="cta-btn" onClick={onCta} style={{background:T.accent,color:"#fff"}}><Plus size={13}/>{cta}</button>}
      {ghost&&<button className="ghost-btn">{ghost}<ChevronRight size={13}/></button>}
    </div>
  </div>
);
const EmptyBars: FC<{count?:number}> = ({count=7}) => (
  <div style={{display:"flex",gap:3,alignItems:"flex-end",height:34}}>
    {Array.from({length:count}).map((_,i)=><div key={i} style={{flex:1,height:"28%",background:T.mute,borderRadius:"3px 3px 0 0"}}/>)}
  </div>
);


// ── StatusBar ──────────────────────────────────────────────────────
const StatusBar: FC<{isDark:boolean}> = ({isDark}) => (
  <div style={{height:52,padding:"14px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"relative",zIndex:10,background:isDark?T.dSurf:T.surf}}>
    <Txt size={14} weight={600} mono color={isDark?"#C8DCF0":T.txt}>9:41</Txt>
    <div style={{width:120,height:32,background:"#111",borderRadius:20,position:"absolute",top:10,left:"50%",transform:"translateX(-50%)"}}/>
    <div style={{display:"flex",gap:5,alignItems:"center"}}>
      <svg width="15" height="11" viewBox="0 0 15 11" fill={isDark?"#C8DCF0":T.txt} opacity={0.8}>
        <rect x="0" y="7" width="2.5" height="4" rx="0.8"/><rect x="4" y="4.5" width="2.5" height="6.5" rx="0.8"/>
        <rect x="8" y="2" width="2.5" height="9" rx="0.8"/><rect x="12" y="0" width="2.5" height="11" rx="0.8" opacity={0.3}/>
      </svg>
      <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
        <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke={isDark?"#C8DCF0":T.txt} strokeOpacity="0.5"/>
        <rect x="19.5" y="3" width="2" height="5" rx="1" fill={isDark?"#C8DCF0":T.txt} fillOpacity="0.4"/>
        <rect x="2" y="2" width={isDark?14:5} height="7" rx="1.5" fill={isDark?"#C8DCF0":T.txt}/>
      </svg>
    </div>
  </div>
);

// ── TopBar ─────────────────────────────────────────────────────────
const TAB_META: Record<string,{title:string;icons:FC<any>[]}> = {
  home:    {title:"",         icons:[Bell]},
  workout: {title:"Workouts", icons:[Search,Filter]},
  social:  {title:"Social",   icons:[Search,Bell]},
  profile: {title:"Profile",  icons:[Settings]},
};
const TopBar: FC<{tab:string;isDark:boolean;onMessage:()=>void}> = ({tab,isDark,onMessage}) => {
  const {title,icons} = TAB_META[tab] ?? TAB_META.home;
  return (
    <div style={{height:52,background:isDark?T.dSurf:T.surf,borderBottom:`1px solid ${isDark?T.dBorder:T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0}}>
      {isDark?<Sk w={title?100:0} h={18} r={5}/>:<Txt size={17} weight={700}>{title}</Txt>}
      <div style={{display:"flex",gap:8}}>
        {isDark
          ?[...icons,MessageCircle].map((_,i)=><Sk key={i} w={34} h={34} r={10} d={-(i+1)*0.2}/>)
          :icons.map((Icon,i)=><button key={i} className="icon-btn" style={{width:34,height:34}}><Icon size={15} color={T.txt2} strokeWidth={1.5}/></button>)
        }
        {!isDark&&<button onClick={onMessage} className="icon-btn" style={{width:34,height:34}}><MessageCircle size={15} color={T.txt2} strokeWidth={1.5}/></button>}
      </div>
    </div>
  );
};

// ── Mock data ────────────────────────────────────────────────────
const MOCK = {
  name: "Alex",
  greeting: "Good morning",
  date: "Thursday, 29 May",
  sleep: { score: 84, duration: "7h 24m", stages: { deep: 25, rem: 22, light: 45, awake: 8 }, bed: "22:48", wake: "06:12" },
  readiness: 82,
  streak: 6,
  weather: { temp: 18, condition: "Partly cloudy", wind: 12, humidity: 65, uv: 3 },
  upcoming: [
    { name: "Upper Body Strength", type: "Strength", day: "Tomorrow", time: "09:00", Icon: Dumbbell },
    { name: "5km Run", type: "Running", day: "Thursday", time: "07:00", Icon: Activity },
  ],
  week: [
    { d: "M", done: true,  label: "Str" },
    { d: "T", done: false, label: null },
    { d: "W", done: true,  label: "Run" },
    { d: "T", done: false, label: "Pln" },
    { d: "F", done: false, label: null },
    { d: "S", done: false, label: "Pln" },
    { d: "S", done: false, label: null },
  ],
  calendar: [
    { time: "10:00", name: "Team standup",      dot: T.accent },
    { time: "14:00", name: "Physio appointment", dot: T.green },
    { time: "19:00", name: "Dinner with Tom",    dot: T.amber },
  ],
  checklist: [
    { text: "Buy protein powder",    done: true },
    { text: "Book next physio",      done: false },
    { text: "Stretch after run",     done: false },
    { text: "Drink 2 L water",       done: false },
  ],
  recent: [
    { name: "Upper Body Strength", date: "Yesterday", duration: "52 min", stat: "18 sets", Icon: Dumbbell, color: T.accentD, ic: T.accent },
    { name: "5km Easy Run",        date: "Monday",    duration: "28 min", stat: "5.1 km",  Icon: Activity, color: T.greenD,  ic: T.green  },
  ],
};

const SkHomeScreen: FC<{push?:(r:NavRoute)=>void; device?:Device; dark?:boolean}> = ({push=()=>{}, device="phone", dark=false}) => {
  const isTablet  = device==="tablet";
  const isDesktop = device==="desktop";
  const isWide    = isTablet||isDesktop;
  const gridCols  = isDesktop?4:isTablet?4:2;
  const sleepSpan = Math.min(2,gridCols);

  const MainColumn = (
    <>
      <Px style={{marginBottom:20}}>
        <Sk dark={dark} w={130} h={11} r={5} style={{marginBottom:7}}/>
        <Sk dark={dark} w={isDesktop?260:190} h={isDesktop?32:24} r={5} d={-0.2}/>
        {isWide && <Sk dark={dark} w={360} h={13} r={4} d={-0.3} style={{marginTop:8}}/>}
      </Px>

      <Px style={{marginBottom:14}}>
        {isWide ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[0,1].map(col=>(
              <div key={col} style={{background:(dark?T.dCard:T.card),borderRadius:16,border:`1px solid ${(dark?T.dBorder:T.border)}`,overflow:"hidden"}}>
                <div style={{padding:"13px 16px",borderBottom:`1px solid ${(dark?T.dBorder:T.border)}`}}><Sk dark={dark} w={70} h={10}/></div>
                {[0,1].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<1?`1px solid ${(dark?T.dBorder:T.border)}`:"none"}}>
                  <Sk dark={dark} w={40} h={40} r={11} d={i*-0.2}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><Sk dark={dark} w="55%" h={12} d={i*-0.1}/><Sk dark={dark} w="38%" h={9} d={i*-0.3}/></div><div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}><Sk dark={dark} w={44} h={9}/><Sk dark={dark} w={32} h={8} d={-0.2}/></div>
                </div>)}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{display:"flex",marginBottom:12}}>
              <Sk dark={dark} w={110} h={32} r={"8px 0 0 8px"} style={{flexShrink:0}}/><Sk dark={dark} w={110} h={32} r={"0 8px 8px 0"} style={{flexShrink:0,opacity:0.4}}/>
            </div>
            <div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:0,overflow:"hidden"}}>
              {[0,1].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<1?`1px solid ${(dark?T.dBorder:T.border)}`:"none"}}>
                <Sk dark={dark} w={40} h={40} r={11} d={i*-0.2}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><Sk dark={dark} w="55%" h={12} d={i*-0.1}/><Sk dark={dark} w="38%" h={9} d={i*-0.3}/></div><div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}><Sk dark={dark} w={44} h={9}/><Sk dark={dark} w={32} h={8} d={-0.2}/></div>
              </div>)}
            </div>
          </>
        )}
      </Px>

      <Px style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Sk dark={dark} w={60} h={12}/><Sk dark={dark} w={40} h={12}/></div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${gridCols},1fr)`,gap:10}}>
          {/* Sleep */}
          <div style={{gridColumn:`span ${sleepSpan}`,background:(dark?T.dCard:T.card),borderRadius:16,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14,minHeight:170}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div style={{display:"flex",flexDirection:"column",gap:6}}><Sk dark={dark} w={40} h={10}/><Sk dark={dark} w={70} h={28} r={5} d={-0.2}/><Sk dark={dark} w={90} h={9} d={-0.1}/></div><Circ dark={dark} s={56} d={-0.3}/></div>
            <div style={{display:"flex",gap:3,height:28,borderRadius:6,overflow:"hidden",marginBottom:10}}>{[28,22,40,10].map((w,i)=><div key={i} className={dark?"sk dark":"sk"} style={{width:`${w}%`,height:"100%",animationDelay:`${i*-0.2}s`}}/>)}</div>
            <div style={{display:"flex",justifyContent:"space-between"}}>{[0,1,2,3].map(i=><Sk dark={dark} key={i} w={48} h={8} r={3} d={i*-0.15}/>)}</div>
          </div>
          {/* Weather */}
          <div style={{gridColumn:`span ${isDesktop?1:Math.min(2,gridCols)}`,background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14}}>
            <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",gap:10}}><Sk dark={dark} w={44} h={44} r={12}/><div style={{display:"flex",flexDirection:"column",gap:6}}><Sk dark={dark} w={60} h={22} r={4} d={-0.2}/><Sk dark={dark} w={80} h={9}/></div></div>
              <div style={{display:"flex",gap:10}}>{[0,1,2].map(i=><div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><Circ dark={dark} s={28} d={i*-0.15}/><Sk dark={dark} w={22} h={8} r={3} d={i*-0.2}/><Sk dark={dark} w={18} h={9} r={3} d={i*-0.1}/></div>)}</div>
            </div>
          </div>
          {/* Calendar */}
          <div style={{gridColumn:`span ${isDesktop?1:Math.min(2,gridCols)}`,background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14}}>
            <Sk dark={dark} w={60} h={10} style={{marginBottom:12}}/>
            {[0,1,2].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<2?10:0}}><Sk dark={dark} w={36} h={36} r={10} d={i*-0.2}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:5}}><Sk dark={dark} w="55%" h={11} d={i*-0.1}/><Sk dark={dark} w="38%" h={8} d={i*-0.25}/></div></div>)}
          </div>
          {/* Readiness + Streak (hidden on desktop — moved to side panel) */}
          {!isDesktop && (
            <div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14}}>
              <Sk dark={dark} w={40} h={9} style={{marginBottom:10}}/>
              <div style={{position:"relative",width:52,height:52,margin:"0 auto 8px"}}><div className={dark?"sk dark":"sk"} style={{width:"100%",height:"100%",borderRadius:"50%"}}/><div style={{position:"absolute",inset:8,borderRadius:"50%",background:(dark?T.dCard:T.card)}}/></div>
              <Sk dark={dark} w="60%" h={9} r={3} d={-0.2} style={{margin:"0 auto"}}/>
            </div>
          )}
          {!isDesktop && (
            <div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14}}>
              <Sk dark={dark} w={40} h={9} style={{marginBottom:10}}/><Sk dark={dark} w={44} h={28} r={5} d={-0.2} style={{marginBottom:8}}/><Sk dark={dark} w="70%" h={9} r={3} d={-0.1}/>
            </div>
          )}
          {/* Checklist */}
          <div style={{gridColumn:`span ${isDesktop?2:Math.min(2,gridCols)}`,background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14}}>
            <Sk dark={dark} w={60} h={10} style={{marginBottom:12}}/>
            {[0,1,2].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<2?10:0}}><Sk dark={dark} w={18} h={18} r={5} d={i*-0.2}/><Sk dark={dark} w="70%" h={10} d={i*-0.1}/></div>)}
          </div>
        </div>
      </Px>

      {/* Recent */}
      <Px>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Sk dark={dark} w={90} h={12}/><Sk dark={dark} w={44} h={12}/></div>
        {isDesktop ? (
          <div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,overflow:"hidden"}}>
            {[0,1,2].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<2?`1px solid ${(dark?T.dBorder:T.border)}`:"none"}}>
              <Sk dark={dark} w={32} h={32} r={9} d={i*-0.15}/><Sk dark={dark} w="30%" h={12} d={i*-0.1}/><Sk dark={dark} w="14%" h={11} d={i*-0.2}/><Sk dark={dark} w="14%" h={11} d={i*-0.25}/><Sk dark={dark} w="14%" h={11} d={i*-0.3}/>
            </div>)}
          </div>
        ) : (
          <div style={{display:isTablet?"grid":"block",gridTemplateColumns:isTablet?"1fr 1fr":undefined,gap:10}}>
            {[0,1].map(i=><div key={i} style={{background:(dark?T.dCard:T.card),borderRadius:16,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14,marginBottom:isTablet?0:(i<1?10:0)}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><Sk dark={dark} w={40} h={40} r={11} d={i*-0.2}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><Sk dark={dark} w="52%" h={12} d={i*-0.1}/><Sk dark={dark} w="36%" h={9} d={i*-0.3}/></div><Sk dark={dark} w={28} h={9}/></div>
              <div style={{display:"flex",gap:6}}>{[0,1,2].map(j=><div key={j} style={{flex:1,background:(dark?T.dSurf:T.surf),borderRadius:9,padding:"8px 10px"}}><Sk dark={dark} w="55%" h={13} r={4} style={{marginBottom:4}} d={j*-0.15}/><Sk dark={dark} w="70%" h={8} d={j*-0.25}/></div>)}</div>
            </div>)}
          </div>
        )}
      </Px>
    </>
  );

  if (isDesktop) {
    return (
      <div style={{padding:"24px 0 28px",background:(dark?T.dBg:T.bg)}}>
        <div style={{maxWidth:1204,margin:"0 auto",display:"flex",gap:24,padding:"0 24px"}}>
          <div style={{flex:1,minWidth:0}}>{MainColumn}</div>
          <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:10,paddingTop:48}}>
            {[0,1,2].map(i=>(
              <div key={i} style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:16}}>
                <Sk dark={dark} w={70} h={10} style={{marginBottom:10}}/>
                {i===0 && <div style={{position:"relative",width:52,height:52,margin:"0 auto 8px"}}><div className={dark?"sk dark":"sk"} style={{width:"100%",height:"100%",borderRadius:"50%"}}/><div style={{position:"absolute",inset:8,borderRadius:"50%",background:(dark?T.dCard:T.card)}}/></div>}
                {i===1 && <><div style={{display:"flex",gap:10,marginBottom:8}}><Sk dark={dark} w={36} h={36} r={10} d={-0.2}/><div style={{display:"flex",flexDirection:"column",gap:5}}><Sk dark={dark} w={90} h={11}/><Sk dark={dark} w={60} h={9} d={-0.1}/></div></div><Sk dark={dark} w={70} h={9} r={3}/></>}
                {i===2 && <><Sk dark={dark} w={50} h={26} r={5} d={-0.2} style={{marginBottom:8}}/><Sk dark={dark} w="60%" h={9} r={3}/></>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div style={{padding:"10px 0 28px",background:(dark?T.dBg:T.bg)}}>{MainColumn}</div>;
};

// ── Empty home ───────────────────────────────────────────────────

const EmptyHomeScreen: FC<{push?:(r:NavRoute)=>void}> = ({push=()=>{}}) => {
  const [weekTab,setWeekTab]=useState("upcoming");
  return (
    <div style={{padding:"10px 0 28px",background:T.bg}}>
      <Px style={{marginBottom:20}}>
        <Txt size={12} weight={500} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.65px",marginBottom:5}}>Good morning</Txt>
        <Txt size={24} weight={700} block>Welcome</Txt>
      </Px>
      <Px style={{marginBottom:14}}>
        <Card p={0} r={16}>
          <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
            {[["upcoming","Upcoming"],["week","This week"]].map(([id,label])=>(
              <button key={id} className="wtab" onClick={()=>setWeekTab(id)} style={{color:weekTab===id?T.accent:T.sub,borderBottom:weekTab===id?`2px solid ${T.accent}`:"2px solid transparent",fontWeight:weekTab===id?600:400}}>{label}</button>
            ))}
          </div>
          <div style={{padding:"8px 0"}}>
            <EmptyBlock icon={Calendar} iconBg={T.accentD} iconColor={T.accent} title="No planned sessions" subtitle="Schedule your first workout to see it here." cta="Plan a Session"/>
          </div>
        </Card>
      </Px>
      <Px style={{marginBottom:14}}>
        <SL>Widgets</SL>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Card p={14} r={16} style={{gridColumn:"span 2"}}>
            <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>Sleep</Txt>
            <div style={{height:28,borderRadius:8,background:T.mute,marginBottom:10,border:`1px dashed ${T.border2}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Txt size={10} color={T.sub}>Stages will appear here</Txt></div>
            <div style={{display:"flex",justifyContent:"space-around",marginBottom:14}}>{[["Deep","—"],["REM","—"],["Light","—"],["Awake","—"]].map(([s,v])=><div key={s} style={{textAlign:"center"}}><Txt size={13} weight={700} mono block>{v}</Txt><Txt size={9} color={T.sub}>{s}</Txt></div>)}</div>
            <div style={{padding:"10px 12px",background:T.card2,borderRadius:10,border:`1px dashed ${T.border2}`,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}><Link2 size={13} color={T.accent} strokeWidth={1.5}/><Txt size={11} color={T.txt2}>Connect a device to track sleep</Txt><ChevronRight size={12} color={T.sub} style={{marginLeft:"auto"}}/></div>
          </Card>
          <Card p={14} r={14} style={{gridColumn:"span 2"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:44,height:44,borderRadius:12,background:T.card2,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Cloud size={22} color={T.sub} strokeWidth={1.5}/></div>
                <div><div style={{display:"flex",alignItems:"baseline",gap:3}}><Txt size={28} weight={700} mono>—</Txt><Txt size={12} color={T.sub}>°C</Txt></div><Txt size={10} color={T.txt2}>Enable location</Txt></div>
              </div>
              <div style={{display:"flex",gap:10}}>{[[Wind,"—"],[Droplets,"—"],[Sun,"—"]].map(([Icon,v],i)=><div key={i} style={{textAlign:"center"}}><Icon size={14} color={T.sub} strokeWidth={1.5} style={{marginBottom:3}}/><Txt size={10} mono color={T.txt2} block>{v}</Txt></div>)}</div>
            </div>
          </Card>
          <Card p={14} r={14} style={{gridColumn:"span 2"}}>
            <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>Today</Txt>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}><Calendar size={18} color={T.sub} strokeWidth={1.5} style={{marginBottom:8}}/><Txt size={12} color={T.txt2}>No events today</Txt></div>
          </Card>
          <Card p={14} r={14}>
            <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.55px",marginBottom:10}}>Readiness</Txt>
            <div style={{position:"relative",width:52,height:52,margin:"0 auto 8px"}}><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke={T.mute} strokeWidth="6"/></svg><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><Txt size={14} weight={700} mono color={T.sub}>—</Txt></div></div>
            <Txt size={10} color={T.sub} block style={{textAlign:"center"}}>No data</Txt>
          </Card>
          <Card p={14} r={14}>
            <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.55px",marginBottom:10}}>Streak</Txt>
            <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:6}}><Txt size={28} weight={700} mono>0</Txt><Txt size={11} color={T.txt2}>days</Txt></div>
            <Txt size={10} color={T.sub}>No sessions yet</Txt>
          </Card>
          <Card p={14} r={14} style={{gridColumn:"span 2"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <Txt size={11} weight={600} color={T.sub} style={{textTransform:"uppercase",letterSpacing:"0.6px"}}>Checklist</Txt>
              <div style={{width:24,height:24,borderRadius:7,background:T.accentD,border:"1px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={12} color={T.accent} strokeWidth={2}/></div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0"}}><CheckSquare size={18} color={T.sub} strokeWidth={1.5} style={{marginBottom:8}}/><Txt size={12} color={T.txt2}>No items yet</Txt></div>
          </Card>
        </div>
      </Px>
      <Px>
        <SL action="See all">Last Sessions</SL>
        <Card p={0} r={14} style={{overflow:"hidden"}}><EmptyBlock icon={Activity} title="No recent sessions" subtitle="Complete your first workout to see it here." cta="Start a Workout"/></Card>
      </Px>
    </div>
  );
};

// ── Mock home ────────────────────────────────────────────────────
const STAGE_COLORS = ["#4F46E5","#7C3AED","#93C5FD","#E2E8F0"];


const MockHomeScreen: FC<{push?:(r:NavRoute)=>void; device?:Device; dark?:boolean}> = ({push=()=>{}, device="phone"}) => {
  const [weekTab,setWeekTab]=useState("upcoming");
  const [checklist,setChecklist]=useState(MOCK.checklist.map(i=>({...i})));
  const total = MOCK.sleep.stages;

  const isTablet  = device==="tablet";
  const isDesktop = device==="desktop";
  const isWide    = isTablet||isDesktop;
  const gridCols  = isDesktop?4:isTablet?3:2;
  const contentMax = isDesktop?900:undefined;

  // ── Reusable: Upcoming list ─────────────────────────────────────
  const UpcomingList = () => (
    <div>
      {MOCK.upcoming.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<MOCK.upcoming.length-1?`1px solid ${T.border}`:"none"}}>
          <div style={{width:40,height:40,borderRadius:11,background:T.accentD,border:"1px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><s.Icon size={18} color={T.accent} strokeWidth={1.5}/></div>
          <div style={{flex:1}}>
            <Txt size={13} weight={600} block style={{marginBottom:2}}>{s.name}</Txt>
            <Txt size={11} color={T.txt2}>{s.type}</Txt>
          </div>
          <div style={{textAlign:"right"}}>
            <Txt size={12} weight={600} mono block>{s.time}</Txt>
            <Txt size={10} color={T.sub}>{s.day}</Txt>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Reusable: Week strip ────────────────────────────────────────
  const WeekStrip = () => (
    <div style={{padding:"14px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        {MOCK.week.map(({d,done,label},i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:done?T.accentD:T.card2,border:`2px solid ${done?T.accent:T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {done?<CheckCircle2 size={14} color={T.accent} strokeWidth={2}/>:<Txt size={10} color={T.sub} mono>{d}</Txt>}
            </div>
            <Txt size={9} color={done?T.accent:label?T.amber:T.sub}>{label||"—"}</Txt>
          </div>
        ))}
      </div>
      <Txt size={11} color={T.txt2} block style={{textAlign:"center"}}>2 of 5 sessions completed this week</Txt>
    </div>
  );

  // ── Reusable: Readiness card ────────────────────────────────────
  const ReadinessCard = ({ p=14 }: { p?: number }) => (
    <Card p={p} r={14}>
      <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.55px",marginBottom:10}}>Readiness</Txt>
      <div style={{position:"relative",width:52,height:52,margin:"0 auto 8px"}}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke={T.mute} strokeWidth="6"/>
          <circle cx="26" cy="26" r="22" fill="none" stroke={T.green} strokeWidth="6" strokeDasharray={`${2*Math.PI*22*MOCK.readiness/100} ${2*Math.PI*22}`} strokeLinecap="round" transform="rotate(-90 26 26)"/>
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Txt size={14} weight={700} mono color={T.green}>{MOCK.readiness}</Txt>
        </div>
      </div>
      <Txt size={10} color={T.green} weight={600} block style={{textAlign:"center"}}>Good</Txt>
    </Card>
  );

  // ── Reusable: Streak card ────────────────────────────────────────
  const StreakCard = ({ p=14 }: { p?: number }) => (
    <Card p={p} r={14}>
      <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.55px",marginBottom:10}}>Streak</Txt>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
        <Flame size={20} color={T.amber} strokeWidth={1.5}/>
        <Txt size={26} weight={700} mono>{MOCK.streak}</Txt>
      </div>
      <Txt size={10} color={T.sub}>days in a row</Txt>
    </Card>
  );

  // ── Reusable: Next session card (desktop sidebar) ────────────────
  const NextSessionCard = () => {
    const s = MOCK.upcoming[0];
    return (
      <Card p={14} r={14}>
        <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.55px",marginBottom:10}}>Next session</Txt>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:36,height:36,borderRadius:10,background:T.accentD,border:"1px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><s.Icon size={16} color={T.accent} strokeWidth={1.5}/></div>
          <div>
            <Txt size={12} weight={600} block>{s.name}</Txt>
            <Txt size={10} color={T.txt2}>{s.type}</Txt>
          </div>
        </div>
        <Txt size={11} color={T.sub}>{s.day} · {s.time}</Txt>
      </Card>
    );
  };

  // ── Widgets — span depends on grid columns ───────────────────────
  const sleepSpan     = Math.min(2, gridCols);
  const weatherSpan   = isDesktop?1:Math.min(2,gridCols);
  const calendarSpan  = isDesktop?1:Math.min(2,gridCols);
  const checklistSpan = isDesktop?2:Math.min(2,gridCols);

  const SleepWidget = (
    <Card p={14} r={16} style={{gridColumn:`span ${sleepSpan}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:5}}>Sleep</Txt>
          <Txt size={32} weight={700} mono block style={{lineHeight:1}}>7h 24m</Txt>
          <Txt size={11} color={T.txt2}>{MOCK.sleep.bed} → {MOCK.sleep.wake}</Txt>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:T.purpleD,border:"2px solid #A78BFA",display:"flex",alignItems:"center",justifyContent:"center",marginLeft:"auto",marginBottom:4}}>
            <Txt size={18} weight={700} mono color={T.purple}>{MOCK.sleep.score}</Txt>
          </div>
          <Txt size={9} color={T.sub}>score</Txt>
        </div>
      </div>
      <div style={{display:"flex",borderRadius:8,overflow:"hidden",height:22,marginBottom:10}}>
        {[["Deep",total.deep,STAGE_COLORS[0]],["REM",total.rem,STAGE_COLORS[1]],["Light",total.light,STAGE_COLORS[2]],["Awake",total.awake,STAGE_COLORS[3]]].map(([,pct,color])=>(
          <div key={color as string} style={{width:`${pct}%`,background:color as string,height:"100%"}}/>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        {[["Deep","1h 51m",STAGE_COLORS[0]],["REM","1h 38m",STAGE_COLORS[1]],["Light","3h 20m",STAGE_COLORS[2]],["Awake","35m",STAGE_COLORS[3]]].map(([stage,val,color])=>(
          <div key={stage as string} style={{textAlign:"center"}}>
            <Txt size={13} weight={500} mono block style={{color:color as string}}>{val as string}</Txt>
            <Txt size={9} color={T.sub}>{stage as string}</Txt>
          </div>
        ))}
      </div>
    </Card>
  );

  const WeatherWidget = (
    <Card p={14} r={14} style={{gridColumn:`span ${weatherSpan}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:isDesktop?"wrap":"nowrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:44,height:44,borderRadius:12,background:"#E0F2FE",border:"1px solid #BAE6FD",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Cloud size={22} color="#0284C7" strokeWidth={1.5}/>
          </div>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:3}}>
              <Txt size={28} weight={700} mono>{MOCK.weather.temp}</Txt>
              <Txt size={12} color={T.sub}>°C</Txt>
            </div>
            <Txt size={10} color={T.txt2}>{MOCK.weather.condition}</Txt>
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          {[[Wind,`${MOCK.weather.wind} km/h`],[Droplets,`${MOCK.weather.humidity}%`],[Sun,`UV ${MOCK.weather.uv}`]].map(([Icon,val],i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <Icon size={14} color={T.sub} strokeWidth={1.5} style={{marginBottom:3}}/>
              <Txt size={10} mono color={T.txt2} block>{val as string}</Txt>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const CalendarWidget = (
    <Card p={14} r={14} style={{gridColumn:`span ${calendarSpan}`}}>
      <Txt size={11} weight={600} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>Today</Txt>
      {MOCK.calendar.map(({time,name,dot},i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<MOCK.calendar.length-1?9:0}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0}}/>
          <Txt size={12} weight={500} style={{flex:1}}>{name}</Txt>
          <Txt size={11} mono color={T.txt2}>{time}</Txt>
        </div>
      ))}
    </Card>
  );

  const ChecklistWidget = (
    <Card p={14} r={14} style={{gridColumn:`span ${checklistSpan}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <Txt size={11} weight={600} color={T.sub} style={{textTransform:"uppercase",letterSpacing:"0.6px"}}>Checklist</Txt>
        <div style={{width:24,height:24,borderRadius:7,background:T.accentD,border:"1px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Plus size={12} color={T.accent} strokeWidth={2}/></div>
      </div>
      {checklist.map((item,i)=>(
        <div key={i} onClick={()=>{const n=[...checklist];n[i]={...n[i],done:!n[i].done};setChecklist(n);}} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<checklist.length-1?10:0,cursor:"pointer"}}>
          {item.done
            ?<CheckCircle2 size={18} color={T.green} strokeWidth={2} style={{flexShrink:0}}/>
            :<Circle size={18} color={T.border2} strokeWidth={1.5} style={{flexShrink:0}}/>
          }
          <Txt size={13} color={item.done?T.sub:T.txt} style={{textDecoration:item.done?"line-through":"none",flex:1}}>{item.text}</Txt>
        </div>
      ))}
    </Card>
  );

  // ── Recent sessions — cards (phone/tablet) or table (desktop) ────
  const RecentSessions = () => isDesktop ? (
    <Card p={0} r={14} style={{overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"40px 1.6fr 1fr 1fr 1fr 24px",gap:0,padding:"10px 16px",background:T.card2,borderBottom:`1px solid ${T.border}`}}>
        {["","Session","Date","Duration","Volume / Distance",""].map((h,i)=>(
          <Txt key={i} size={10} weight={600} color={T.sub} style={{textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</Txt>
        ))}
      </div>
      {MOCK.recent.map((s,i)=>(
        <div key={i} style={{display:"grid",gridTemplateColumns:"40px 1.6fr 1fr 1fr 1fr 24px",gap:0,alignItems:"center",padding:"12px 16px",borderBottom:i<MOCK.recent.length-1?`1px solid ${T.border}`:"none",cursor:"pointer"}}>
          <div style={{width:32,height:32,borderRadius:9,background:s.color,display:"flex",alignItems:"center",justifyContent:"center"}}><s.Icon size={15} color={s.ic} strokeWidth={1.5}/></div>
          <Txt size={13} weight={600}>{s.name}</Txt>
          <Txt size={12} color={T.txt2}>{s.date}</Txt>
          <Txt size={12} mono color={T.txt2}>{s.duration}</Txt>
          <Txt size={12} mono color={T.txt2}>{s.stat}</Txt>
          <ChevronRight size={15} color={T.sub} strokeWidth={1.5}/>
        </div>
      ))}
    </Card>
  ) : (
    <div style={{display:isTablet?"grid":"block",gridTemplateColumns:isTablet?"1fr 1fr":undefined,gap:10}}>
      {MOCK.recent.map((s,i)=>(
        <Card key={i} style={{marginBottom:isTablet?0:(i<MOCK.recent.length-1?10:0)}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:40,height:40,borderRadius:11,background:s.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><s.Icon size={18} color={s.ic} strokeWidth={1.5}/></div>
            <div style={{flex:1}}>
              <Txt size={13} weight={600} block style={{marginBottom:2}}>{s.name}</Txt>
              <Txt size={11} color={T.txt2}>{s.date}</Txt>
            </div>
            <ChevronRight size={16} color={T.sub} strokeWidth={1.5}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[[s.duration,"Duration"],[s.stat,"Volume/Distance"],["Metric","Unit"]].map(([val,label],j)=>(
              <div key={j} style={{flex:1,background:T.card2,borderRadius:9,padding:"8px 10px"}}>
                <Txt size={13} weight={500} mono block style={{marginBottom:2}}>{val}</Txt>
                <Txt size={9} color={T.sub}>{label}</Txt>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );

  // ── Main column content ──────────────────────────────────────────
  const MainColumn = (
    <>
      {/* Greeting */}
      <Px style={{marginBottom:20}}>
        <Txt size={12} weight={500} color={T.sub} block style={{textTransform:"uppercase",letterSpacing:"0.65px",marginBottom:5}}>{MOCK.greeting} · {MOCK.date}</Txt>
        <Txt size={isDesktop?28:24} weight={700} block>Hello, {MOCK.name}</Txt>
        {isWide && (
          <Txt size={13} color={T.txt2} block style={{marginTop:6}}>
            You've completed 2 of 5 training sessions this week — readiness is {MOCK.readiness < 60 ? "low, consider an easier session" : "good, conditions favour a strong effort"}.
          </Txt>
        )}
      </Px>

      {/* Upcoming + Week */}
      <Px style={{marginBottom:14}}>
        {isWide ? (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <Card p={0} r={16}>
              <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`}}><Txt size={11} weight={600} color={T.sub} style={{textTransform:"uppercase",letterSpacing:"0.6px"}}>Upcoming</Txt></div>
              <UpcomingList/>
            </Card>
            <Card p={0} r={16}>
              <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`}}><Txt size={11} weight={600} color={T.sub} style={{textTransform:"uppercase",letterSpacing:"0.6px"}}>This week</Txt></div>
              <WeekStrip/>
            </Card>
          </div>
        ) : (
          <Card p={0} r={16}>
            <div style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
              {[["upcoming","Upcoming"],["week","This week"]].map(([id,label])=>(
                <button key={id} className="wtab" onClick={()=>setWeekTab(id)} style={{color:weekTab===id?T.accent:T.sub,borderBottom:weekTab===id?`2px solid ${T.accent}`:"2px solid transparent",fontWeight:weekTab===id?600:400}}>{label}</button>
              ))}
            </div>
            {weekTab==="upcoming" ? <UpcomingList/> : <WeekStrip/>}
          </Card>
        )}
      </Px>

      {/* Widget grid */}
      <Px style={{marginBottom:14}}>
        <SL>Widgets</SL>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${gridCols},1fr)`,gap:10}}>
          {SleepWidget}
          {WeatherWidget}
          {CalendarWidget}
          {!isDesktop && <ReadinessCard/>}
          {!isDesktop && <StreakCard/>}
          {ChecklistWidget}
        </div>
      </Px>

      {/* Recent sessions */}
      <Px>
        <SL action="See all">Last Sessions</SL>
        <RecentSessions/>
      </Px>
    </>
  );

  // ── Desktop: main column + right sidebar panel ───────────────────
  if (isDesktop) {
    return (
      <div style={{padding:"24px 0 28px",background:T.bg}}>
        <div style={{maxWidth:contentMax?contentMax+280+24:undefined,margin:"0 auto",display:"flex",gap:24,padding:"0 24px"}}>
          <div style={{flex:1,minWidth:0}}>{MainColumn}</div>
          <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",gap:10,paddingTop:48}}>
            <ReadinessCard p={16}/>
            <NextSessionCard/>
            <StreakCard p={16}/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:"10px 0 28px",background:T.bg}}>
      {MainColumn}
    </div>
  );
};


// ── Other screens (shared) ───────────────────────────────────────

function WorkoutScreen({appState,push,skelDark=false}:{appState:AppState;push:(r:NavRoute)=>void;skelDark?:boolean}) {
  const [view,setView]=useState("main");
  const isSkeleton=appState==="loading";
  const dark=isSkeleton&&skelDark;
  if(view==="history") return (
    <div style={{padding:"10px 0 28px",background:(dark?T.dBg:T.bg)}}>
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"0 20px",marginBottom:18}}>
        <button className="icon-btn" onClick={()=>setView("main")} style={{width:34,height:34,background:isSkeleton?(dark?T.dCard:T.card):"#fff",border:`1px solid ${(dark?T.dBorder:T.border)}`}}><ArrowLeft size={15} color={dark?"#C8DCF0":T.txt} strokeWidth={1.5}/></button>
        {isSkeleton?<Sk dark={dark} w={110} h={18} r={5}/>:<Txt size={17} weight={600}>All Sessions</Txt>}
      </div>
      <Px><div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:0,overflow:"hidden"}}><EmptyBlock icon={Activity} title="No sessions found" subtitle="Log workouts to build your history."/></div></Px>
    </div>
  );
  return (
    <div style={{padding:"10px 0 28px",background:(dark?T.dBg:T.bg)}}>
      <Px style={{marginBottom:20}}>
        {isSkeleton?<Sk dark={dark} w="100%" h={56} r={16} style={{marginBottom:10}}/>:<button onClick={()=>push({id:"active-session"})} style={{width:"100%",padding:"16px",background:T.accent,borderRadius:16,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'Geist',sans-serif",fontSize:15,fontWeight:700,color:"#fff",marginBottom:10,boxShadow:"0 4px 14px rgba(37,99,235,0.3)"}}><Zap size={18} fill="#fff" strokeWidth={0}/>Start a Workout</button>}
        <div style={{display:"flex",gap:8}}>
          {([[Calendar,"Plan Session",null as NavId|null],[Route,"Plan Route","route-planner" as NavId],[BookOpen,"Blueprints","blueprints" as NavId]] as [any,string,NavId|null][]).map(([Icon,label,navId])=>(
            <button key={label} onClick={()=>navId&&push({id:navId})} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:7,padding:"12px 8px",background:(dark?T.dCard:T.card),borderRadius:12,border:`1px solid ${(dark?T.dBorder:T.border)}`,cursor:"pointer",fontFamily:"inherit"}}>
              {isSkeleton?<Sk dark={dark} w={22} h={22} r={6}/>:<Icon size={17} color={T.txt2} strokeWidth={1.5}/>}
              {isSkeleton?<Sk dark={dark} w="80%" h={9} r={4}/>:<Txt size={11} color={T.txt2} weight={500}>{label}</Txt>}
            </button>
          ))}
        </div>
      </Px>
      <Px style={{marginBottom:14}}>
        {isSkeleton?<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Sk dark={dark} w={70} h={12}/><Sk dark={dark} w={34} h={12}/></div>:<SL action="Plan">Upcoming</SL>}
        <div style={{background:(dark?T.dCard:T.card),borderRadius:16,border:`1px solid ${(dark?T.dBorder:T.border)}`,overflow:"hidden"}}>
          {isSkeleton?[0,1].map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderBottom:i<1?`1px solid ${(dark?T.dBorder:T.border)}`:"none"}}><Sk dark={dark} w={38} h={38} r={11} d={i*-0.2}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}><Sk dark={dark} w="55%" h={11} d={i*-0.1}/><Sk dark={dark} w="38%" h={9} d={i*-0.3}/></div><Sk dark={dark} w={44} h={10}/></div>)
          :<EmptyBlock icon={Calendar} iconBg={T.accentD} iconColor={T.accent} title="No planned sessions" subtitle="Schedule a workout." cta="Plan a Session"/>}
        </div>
      </Px>
      <Px style={{marginBottom:14}}>
        {isSkeleton?<div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Sk dark={dark} w={54} h={12}/><Sk dark={dark} w={48} h={12}/></div>:<SL action="See all" onAction={()=>setView("history")}>Recent</SL>}
        <div style={{background:(dark?T.dCard:T.card),borderRadius:16,border:`1px solid ${(dark?T.dBorder:T.border)}`,overflow:"hidden"}}>
          {isSkeleton?[0,1].map(i=><div key={i} style={{padding:"13px 16px",borderBottom:i<1?`1px solid ${(dark?T.dBorder:T.border)}`:"none"}}><div style={{display:"flex",gap:12,marginBottom:12}}><Sk dark={dark} w={46} h={46} r={13} d={i*-0.2}/><div style={{flex:1,display:"flex",flexDirection:"column",gap:7}}><Sk dark={dark} w="52%" h={13} d={i*-0.1}/><Sk dark={dark} w="36%" h={10} d={i*-0.3}/></div><Sk dark={dark} w={30} h={10}/></div><div style={{display:"flex",gap:8}}>{[0,1,2].map(j=><div key={j} style={{flex:1,background:(dark?T.dSurf:T.surf),borderRadius:9,padding:"8px 10px"}}><Sk dark={dark} w="55%" h={13} r={4} style={{marginBottom:4}} d={j*-0.15}/><Sk dark={dark} w="70%" h={8} d={j*-0.25}/></div>)}</div></div>)
          :<EmptyBlock icon={Activity} title="No sessions yet" subtitle="Complete your first workout."/>}
        </div>
      </Px>
    </div>
  );
}


function SocialScreen({appState,push,skelDark=false}:{appState:AppState;push:(r:NavRoute)=>void;skelDark?:boolean}) {
  const [filter,setFilter]=useState("Feed");
  const isSkeleton=appState==="loading";
  const dark=isSkeleton&&skelDark;
  return (
    <div style={{padding:"10px 0 28px",background:(dark?T.dBg:T.bg)}}>
      {isSkeleton?<div className="h-scroll" style={{padding:"0 20px",marginBottom:20,gap:8}}>{[58,72,82].map((w,i)=><Sk dark={dark} key={i} w={w} h={30} r={20} d={i*-0.2} style={{flexShrink:0}}/>)}</div>
      :<div style={{marginBottom:20}}><Pills items={["Feed","Events","Clubs"]} active={filter} onSelect={setFilter}/></div>}
      <Px>
        <div style={{background:(dark?T.dCard:T.card),borderRadius:16,border:`1px solid ${(dark?T.dBorder:T.border)}`,overflow:"hidden"}}>
          {isSkeleton?<div style={{padding:"30px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:14}}><Circ dark={dark} s={56}/><Sk dark={dark} w="55%" h={14} r={4}/><Sk dark={dark} w="72%" h={10} r={4} d={-0.2}/></div>
          :<EmptyBlock icon={Users} iconBg={T.accentD} iconColor={T.accent} title="Your feed is empty" subtitle="Follow athletes, join clubs, and log activities." cta="Find Athletes" ghost="Discover Clubs"/>}
        </div>
      </Px>
    </div>
  );
}

const HEALTH_CATS=[
  {id:"vitals",   name:"Vitals",       Icon:Heart,      iconColor:T.red,    iconBg:T.redD},
  {id:"activity", name:"Activity",     Icon:Activity,   iconColor:T.accent, iconBg:T.accentD},
  {id:"sleep",    name:"Sleep",        Icon:Moon,       iconColor:T.purple, iconBg:T.purpleD},
  {id:"body",     name:"Body",         Icon:Scale,      iconColor:T.teal,   iconBg:T.tealD},
  {id:"recovery", name:"Recovery",     Icon:ShieldCheck,iconColor:T.green,  iconBg:T.greenD},
  {id:"nutrition",name:"Nutrition",    Icon:Apple,      iconColor:T.amber,  iconBg:T.amberD},
  {id:"mental",   name:"Mental",       Icon:Brain,      iconColor:T.purple, iconBg:T.purpleD},
  {id:"resp",     name:"Respiratory",  Icon:Waves,      iconColor:T.teal,   iconBg:T.tealD},
];


function ProfileScreen({appState,push,skelDark=false}:{appState:AppState;push:(r:NavRoute)=>void;skelDark?:boolean}) {
  const isSkeleton=appState==="loading";
  const dark=isSkeleton&&skelDark;
  return (
    <div style={{paddingBottom:28,background:(dark?T.dBg:T.bg)}}>
      <div style={{position:"relative",height:130,background:dark?"#080F1A":"linear-gradient(135deg,#1E3A5F 0%,#2D5A8E 100%)",marginBottom:50}}>
        <div style={{position:"absolute",bottom:-44,left:20}}>
          {isSkeleton?<div style={{width:88,height:88,borderRadius:"50%",border:`3px solid ${(dark?T.dBg:T.bg)}`,overflow:"hidden"}}><div className={dark?"sk dark":"sk"} style={{width:"100%",height:"100%"}}/></div>
          :<div style={{width:88,height:88,borderRadius:"50%",border:`3px solid ${T.bg}`,background:T.surf,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:shMd,cursor:"pointer"}}><Camera size={24} color={T.sub} strokeWidth={1.5}/></div>}
        </div>
      </div>
      <Px style={{marginBottom:16}}>
        {isSkeleton?<><Sk dark={dark} w={148} h={19} r={5} style={{marginBottom:7}}/><Sk dark={dark} w={90} h={10} r={4} d={-0.2}/></>
        :<><Txt size={21} weight={700} block style={{marginBottom:4}}>{appState==="mock"?MOCK.name:"Your Name"}</Txt><Txt size={12} color={T.txt2}>@{appState==="mock"?"alex_runs":"handle"} · Joined today</Txt></>}
      </Px>
      <Px style={{marginBottom:16}}>
        <div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:0}}>
          <div style={{display:"flex"}}>
            {(isSkeleton?[["—","Activities"],["—","Following"],["—","Followers"],["—","PRs"]]:
                     (appState==="mock"?[["12","Activities"],["34","Following"],["28","Followers"],["8","PRs"]]:
                      [["0","Activities"],["0","Following"],["0","Followers"],["0","PRs"]])).map(([val,label],i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"14px 0",borderRight:i<3?`1px solid ${(dark?T.dBorder:T.border)}`:"none"}}>
                {isSkeleton?<Sk dark={dark} w={30} h={18} r={4}/>:<Txt size={18} weight={700} mono>{val}</Txt>}
                {isSkeleton?<Sk dark={dark} w={50} h={9} d={-0.1}/>:<Txt size={10} color={T.txt2} weight={500}>{label}</Txt>}
              </div>
            ))}
          </div>
        </div>
      </Px>
      <Px style={{marginBottom:14}}>
        {isSkeleton?<Sk dark={dark} w={80} h={12} style={{marginBottom:12}}/>:<SL action="Manage sources">Health Data</SL>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {HEALTH_CATS.map(({id,name,Icon,iconColor,iconBg})=>(
            isSkeleton?<div key={id} style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}><Sk dark={dark} w={32} h={32} r={9}/><Sk dark={dark} w="60%" h={13} r={4} d={-0.1}/></div>
            :<div key={id} className="cat-card" onClick={()=>push({id:"health-detail",params:{catId:id,catName:name,catIcon:Icon,catColor:iconColor,catBg:iconBg}})}><div style={{width:32,height:32,borderRadius:9,background:iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={16} color={iconColor} strokeWidth={1.5}/></div><Txt size={13} weight={600}>{name}</Txt><ChevronRight size={14} color={T.sub} strokeWidth={1.5} style={{marginLeft:"auto"}}/></div>
          ))}
        </div>
      </Px>
      <Px>
        {isSkeleton?<Sk dark={dark} w={88} h={12} style={{marginBottom:12}}/>:<SL>Activity History</SL>}
        <div style={{background:(dark?T.dCard:T.card),borderRadius:14,border:`1px solid ${(dark?T.dBorder:T.border)}`,padding:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(26, 1fr)",gap:3}}>
            {Array.from({length:182}).map((_,i)=>(
              appState==="mock"
                ?<div key={i} style={{aspectRatio:"1",borderRadius:2,background:(i*7+3)%5>2?T.accent:T.mute,opacity:(i*7+3)%5>2?0.2+((i*7+3)%3)*0.25:0.4}}/>
                :isSkeleton
                  ?<div key={i} className={dark?"sk dark":"sk"} style={{aspectRatio:"1",borderRadius:2,opacity:(i*5+2)%4>1?1:0.3,animationDelay:`${-(i%9)*0.15}s`}}/>
                  :<div key={i} style={{aspectRatio:"1",borderRadius:2,background:T.mute,opacity:0.6}}/>
            ))}
          </div>
          <div style={{marginTop:10,display:"flex",justifyContent:"space-between"}}>{["Jan","Feb","Mar","Apr","May","Jun"].map(m=><Txt key={m} size={9} color={(dark?T.dSub:T.sub)} mono>{m}</Txt>)}</div>
        </div>
      </Px>
    </div>
  );
}

// ══ NAVIGATION SUB-SCREENS ══════════════════════════════════
const SettingsScreen:FC<NP>=({pop,appState})=>{
  const dark=false;
  const GROUPS=[
    {title:"Account",items:["Edit profile","Username & handle","Email & password"]},
    {title:"Notifications",items:["Workout reminders","PR alerts","Social activity","Coach messages"]},
    {title:"Units & display",items:["Distance (km)","Weight (kg)","Temperature (°C)","Dark mode"]},
    {title:"Privacy & data",items:["Data export","Delete account","Who can see my activity"]},
    {title:"Integrations",items:["Apple Health","Garmin Connect","Whoop","Strava"]},
    {title:"Support",items:["Help centre","Send feedback","About"]},
  ];
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"#F4F6FA",overflow:"hidden"}}>
      <div className="scroll-area" style={{padding:"10px 0 28px"}}>
        {GROUPS.map(({title,items})=>(
          <div key={title} style={{marginBottom:20}}>
            <div style={{padding:"0 20px",marginBottom:6}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:11,fontWeight:600,color:"#9AABB8",textTransform:"uppercase",letterSpacing:"0.65px"}}>{title}</span></div>
            <div style={{background:"#FFFFFF",border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,marginLeft:16,marginRight:16,borderRadius:14,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
              {items.map((item,i)=>(
                <div key={item} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",borderBottom:i<items.length-1?`1px solid ${dark?"#16243A":"#E2E8F0"}`:"none",cursor:"pointer"}}>
                  <span style={{fontFamily:"'Geist',sans-serif",fontSize:14,color:"#0D1624"}}>{item}</span>
                  <ChevronRight size={16} color={dark?"#2E4560":"#9AABB8"} strokeWidth={1.5}/>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── HEALTH CATEGORY DETAIL ────────────────────────────────────

const HealthDetailScreen:FC<NP>=({pop,appState,params})=>{
  const dark=false;
  const {catName="Category",catIcon:CatIcon=Heart,catColor="#DC2626",catBg="#FEE2E2",catId="vitals",metrics=[],sources=[]}=params||{};
  const METRIC_MAP:Record<string,string[]>={
    vitals:["Heart rate","HRV","SpO₂","Blood pressure","Resting HR"],
    activity:["Steps","Active calories","Exercise time","Stand hours","Move streak"],
    sleep:["Duration","Sleep score","REM","Deep","Light","Awake","Breathing rate"],
    body:["Weight","BMI","Body fat %","Lean mass","Muscle mass"],
    recovery:["Readiness score","Strain","Soreness (logged)","HRV trend"],
    nutrition:["Calories","Protein","Carbs","Fat","Water intake","Caffeine"],
    mental:["Mood","Stress level","Mindfulness minutes"],
    resp:["VO₂ max","Breathing rate","Lung capacity"],
  };
  const mets=METRIC_MAP[catId]||[];
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:"#F4F6FA",overflow:"hidden"}}>
      <div className="scroll-area" style={{padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
        {/* Header card */}
        <div style={{background:"#FFFFFF",borderRadius:16,border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:14,background:catBg,display:"flex",alignItems:"center",justifyContent:"center"}}><CatIcon size={22} color={catColor} strokeWidth={1.5}/></div>
            <div>
              <span style={{fontFamily:"'Geist',sans-serif",fontSize:18,fontWeight:700,color:"#0D1624",display:"block"}}>{catName}</span>
              <span style={{fontFamily:"'Geist',sans-serif",fontSize:12,color:"#9AABB8"}}>{mets.length} metrics · 0 sources connected</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button style={{flex:1,padding:"10px",background:dark?"#1A3A70":"#DBEAFE",border:`1px solid ${dark?"#2563EB":"#BFDBFE"}`,borderRadius:10,cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:12,fontWeight:600,color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Link2 size={13} strokeWidth={1.5}/>Connect source</button>
            <button style={{flex:1,padding:"10px",background:dark?"#0F1620":"#F0F3F8",border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,borderRadius:10,cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:12,fontWeight:600,color:"#0D1624",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><Pencil size={13} strokeWidth={1.5}/>Log manually</button>
          </div>
        </div>
        {/* Empty chart */}
        <div style={{background:"#FFFFFF",borderRadius:16,border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,padding:16,boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
          <span style={{fontFamily:"'Geist',sans-serif",fontSize:10,fontWeight:600,color:"#9AABB8",textTransform:"uppercase",letterSpacing:"0.65px",display:"block",marginBottom:12}}>Trend (30 days)</span>
          <div style={{height:100,background:dark?"#06080D":"#F0F3F8",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",border:`1px dashed ${dark?"#16243A":"#CBD5E1"}`}}>
            <span style={{fontFamily:"'Geist',sans-serif",fontSize:12,color:"#9AABB8"}}>No data · connect a source to see trends</span>
          </div>
        </div>
        {/* Metrics list */}
        <div>
          <span style={{fontFamily:"'Geist',sans-serif",fontSize:11,fontWeight:600,color:"#9AABB8",textTransform:"uppercase",letterSpacing:"0.65px",display:"block",marginBottom:8}}>Metrics</span>
          <div style={{background:"#FFFFFF",borderRadius:14,border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
            {mets.map((m,i)=>(
              <div key={m} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:i<mets.length-1?`1px solid ${dark?"#16243A":"#E2E8F0"}`:"none"}}>
                <span style={{fontFamily:"'Geist',sans-serif",fontSize:13,color:"#0D1624"}}>{m}</span>
                <span style={{fontFamily:"'Geist Mono',monospace",fontSize:12,color:"#9AABB8"}}>—</span>
              </div>
            ))}
          </div>
        </div>
        {/* Sources */}
        <div>
          <span style={{fontFamily:"'Geist',sans-serif",fontSize:11,fontWeight:600,color:"#9AABB8",textTransform:"uppercase",letterSpacing:"0.65px",display:"block",marginBottom:8}}>Sources</span>
          <div style={{background:"#FFFFFF",borderRadius:14,border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
            {["Apple Health","Garmin","Whoop","Manual log"].map((s,i)=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<3?`1px solid ${dark?"#16243A":"#E2E8F0"}`:"none"}}>
                <div style={{width:34,height:34,borderRadius:10,background:"#F0F3F8",border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,display:"flex",alignItems:"center",justifyContent:"center"}}><Link2 size={14} color="#9AABB8" strokeWidth={1.5}/></div>
                <span style={{flex:1,fontFamily:"'Geist',sans-serif",fontSize:13,color:"#0D1624"}}>{s}</span>
                <button style={{padding:"5px 12px",borderRadius:20,background:"none",border:`1px solid ${dark?"#16243A":"#E2E8F0"}`,cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:11,fontWeight:500,color:"#9AABB8"}}>Connect</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── BLUEPRINT BROWSER ─────────────────────────────────────────

const BlueprintScreen:FC<NP>=({pop,push,appState})=>{
  const dark=false;
  const [tab,setTab]=useState<"mine"|"discover">("mine");
  const PLANS=[
    {name:"Push Day A",sport:"Strength",exercises:"6 exercises · 22 sets",last:"Used 2 days ago",Icon:Dumbbell,color:"#DBEAFE",ic:"#2563EB"},
    {name:"Easy 5K Run",sport:"Running",exercises:"GPS · interval structure",last:"Used last week",Icon:Activity,color:"#DCFCE7",ic:"#16A34A"},
    {name:"Pull Day B",sport:"Strength",exercises:"5 exercises · 18 sets",last:"Used 3 days ago",Icon:Dumbbell,color:"#DBEAFE",ic:"#2563EB"},
    {name:"Long Run",sport:"Running",exercises:"GPS · easy pace",last:"Used Sunday",Icon:Activity,color:"#DCFCE7",ic:"#16A34A"},
  ];
  const DISCOVER=[
    {name:"5K to 10K Plan",sport:"Running",duration:"8 wks",Icon:Activity,color:"#DCFCE7",ic:"#16A34A"},
    {name:"Push/Pull/Legs",sport:"Strength",duration:"Ongoing",Icon:Dumbbell,color:"#DBEAFE",ic:"#2563EB"},
    {name:"Couch to 5K",sport:"Running",duration:"9 wks",Icon:Activity,color:"#DCFCE7",ic:"#16A34A"},
    {name:"Starting Strength",sport:"Strength",duration:"12 wks",Icon:Dumbbell,color:"#DBEAFE",ic:"#2563EB"},
    {name:"Cycling Base",sport:"Cycling",duration:"6 wks",Icon:Bike,color:"#EDE9FE",ic:"#7C3AED"},
    {name:"Triathlon Prep",sport:"Multi",duration:"16 wks",Icon:Activity,color:"#FEF3C7",ic:"#D97706"},
  ];
  const bg="#F4F6FA";
  const cardBg="#FFFFFF";
  const borderC=dark?"#16243A":"#E2E8F0";
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:bg,overflow:"hidden"}}>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:`1px solid ${borderC}`,background:dark?"#0B0F17":cardBg}}>
        {[["mine","My Blueprints"],["discover","Discover"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id as any)} style={{flex:1,padding:"10px 0",background:"none",border:"none",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:13,fontWeight:tab===id?600:400,color:tab===id?"#2563EB":"#9AABB8",borderBottom:tab===id?"2px solid #2563EB":"2px solid transparent"}}>{label}</button>
        ))}
      </div>
      <div className="scroll-area" style={{padding:"14px 16px"}}>
        {tab==="mine"?(
          <>
            <button style={{width:"100%",padding:"14px",background:"#2563EB",borderRadius:14,border:"none",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:14,boxShadow:"0 4px 14px rgba(37,99,235,0.25)"}}><Plus size={16}/>Create New Blueprint</button>
            {PLANS.map((p,i)=>(
              <div key={i} style={{background:cardBg,borderRadius:14,border:`1px solid ${borderC}`,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 3px rgba(0,0,0,0.07)",cursor:"pointer"}}>
                <div style={{width:42,height:42,borderRadius:12,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><p.Icon size={20} color={p.ic} strokeWidth={1.5}/></div>
                <div style={{flex:1}}>
                  <span style={{fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:600,color:"#0D1624",display:"block",marginBottom:2}}>{p.name}</span>
                  <span style={{fontFamily:"'Geist',sans-serif",fontSize:11,color:"#5A6E85",display:"block",marginBottom:2}}>{p.exercises}</span>
                  <span style={{fontFamily:"'Geist',sans-serif",fontSize:10,color:"#9AABB8"}}>{p.last}</span>
                </div>
                <button style={{padding:"7px 14px",background:"#2563EB",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:12,fontWeight:600,color:"#fff"}}>Start</button>
              </div>
            ))}
          </>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {DISCOVER.map((p,i)=>(
              <div key={i} style={{background:cardBg,borderRadius:14,border:`1px solid ${borderC}`,padding:14,cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
                <div style={{width:38,height:38,borderRadius:10,background:p.color,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}><p.Icon size={18} color={p.ic} strokeWidth={1.5}/></div>
                <span style={{fontFamily:"'Geist',sans-serif",fontSize:13,fontWeight:600,color:"#0D1624",display:"block",marginBottom:3}}>{p.name}</span>
                <span style={{fontFamily:"'Geist',sans-serif",fontSize:10,color:"#5A6E85",display:"block",marginBottom:4}}>{p.sport}</span>
                <span style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:"#9AABB8"}}>{p.duration}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── MESSAGING INLINE ──────────────────────────────────────────
interface Msg { id:number; from:"me"|"them"; text?:string; att?:{type:"workout"|"progress";title:string;sub:string;}; time:string; }
interface Thread { id:number; name:string; role:string; ini:string; color:string; unread:number; last:string; lastT:string; msgs:Msg[]; }
const THREADS_DATA:Thread[]=[
  {id:1,name:"Sarah Chen",role:"Personal Trainer",ini:"SC",color:"#7C3AED",unread:2,last:"Great session! Here's your plan for next week.",lastT:"10:42",
   msgs:[
    {id:1,from:"them",text:"Morning! Ready for today's session? I've adjusted your bench sets based on last week's RPE.",time:"8:05"},
    {id:2,from:"me",text:"Ready! Feeling good after yesterday's rest day.",time:"8:12"},
    {id:3,from:"them",att:{type:"workout",title:"Upper Body — Push Focus",sub:"6 exercises · 22 sets · ~65 min"},time:"8:14"},
    {id:4,from:"them",text:"Great session! Your bench hit 85kg — new PR 🎉",time:"10:40"},
    {id:5,from:"them",att:{type:"progress",title:"Bench Press · 8-week trend",sub:"+10 kg in 8 weeks"},time:"10:42"},
   ]},
  {id:2,name:"Marcus J.",role:"Running Club",ini:"MJ",color:"#16A34A",unread:0,last:"See you Saturday for the 10K!",lastT:"Yesterday",
   msgs:[{id:1,from:"them",text:"See you Saturday for the 10K!",time:"Yesterday"}]},
  {id:3,name:"Priya K.",role:"Athlete",ini:"PK",color:"#D97706",unread:1,last:"Can you share your 5K training plan?",lastT:"Mon",
   msgs:[{id:1,from:"them",text:"Can you share your 5K training plan? I saw your time on Strava!",time:"Mon"}]},
];

const InlineMessaging:FC<NP>=({pop,appState})=>{
  const dark=false;
  const [openT,setOpenT]=useState<Thread|null>(null);
  const [input,setInput]=useState("");
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const bg="#F4F6FA";
  const cardBg="#FFFFFF";
  const borderC=dark?"#16243A":"#E2E8F0";
  const send=()=>{if(!input.trim()||!openT)return;setMsgs(m=>[...m,{id:m.length+1,from:"me",text:input.trim(),time:"Now"}]);setInput("");};
  useEffect(()=>{if(openT)setMsgs(openT.msgs);},[openT]);
  if(openT) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:bg,overflow:"hidden"}}>
      <div style={{padding:"10px 16px",borderBottom:`1px solid ${borderC}`,background:dark?"#0B0F17":cardBg,display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setOpenT(null)} style={{width:34,height:34,borderRadius:10,background:"#F0F3F8",border:`1px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><ArrowLeft size={15} color={dark?"#C8DCF0":"#5A6E85"} strokeWidth={1.5}/></button>
        <div style={{width:36,height:36,borderRadius:"50%",background:openT.color,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:13,fontWeight:700,color:"#fff"}}>{openT.ini}</span></div>
        <div style={{flex:1}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:600,color:"#0D1624",display:"block"}}>{openT.name}</span><span style={{fontFamily:"'Geist',sans-serif",fontSize:11,color:"#16A34A"}}>{openT.role}</span></div>
      </div>
      <div className="scroll-area" style={{padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.map(m=>{
          const me=m.from==="me";
          return (
            <div key={m.id} style={{display:"flex",flexDirection:me?"row-reverse":"row",alignItems:"flex-end",gap:8}}>
              {!me&&<div style={{width:26,height:26,borderRadius:"50%",background:openT.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:9,fontWeight:700,color:"#fff"}}>{openT.ini}</span></div>}
              <div style={{maxWidth:"75%"}}>
                {m.text&&<div style={{padding:"10px 14px",borderRadius:me?"18px 18px 4px 18px":"18px 18px 18px 4px",background:me?"#2563EB":cardBg,border:me?"none":`1px solid ${borderC}`}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:13,color:me?"#fff":"#0D1624"}}>{m.text}</span></div>}
                {m.att&&<div style={{background:me?"rgba(255,255,255,0.18)":"#F8FAFC",borderRadius:12,padding:"10px 12px",border:`1px solid ${me?"rgba(255,255,255,0.25)":borderC}`,marginTop:6,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:30,height:30,borderRadius:8,background:m.att.type==="workout"?"#DBEAFE":"#DCFCE7",display:"flex",alignItems:"center",justifyContent:"center"}}>{m.att.type==="workout"?<Dumbbell size={14} color="#2563EB" strokeWidth={1.5}/>:<TrendingUp size={14} color="#16A34A" strokeWidth={1.5}/>}</div>
                    <div><span style={{fontFamily:"'Geist',sans-serif",fontSize:12,fontWeight:600,color:me?"#fff":"#0D1624",display:"block"}}>{m.att.title}</span><span style={{fontFamily:"'Geist',sans-serif",fontSize:10,color:me?"rgba(255,255,255,0.7)":"#9AABB8"}}>{m.att.sub}</span></div>
                  </div>
                </div>}
                <span style={{fontFamily:"'Geist Mono',monospace",fontSize:9,color:"#9AABB8",display:"block",textAlign:me?"right":"left",marginTop:3}}>{m.time}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{padding:"10px 12px 16px",background:dark?"#0B0F17":cardBg,borderTop:`1px solid ${borderC}`,display:"flex",gap:8}}>
        <button style={{width:36,height:36,borderRadius:10,background:"#F0F3F8",border:`1px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Paperclip size={15} color="#9AABB8" strokeWidth={1.5}/></button>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Message…" style={{flex:1,border:`1px solid ${borderC}`,borderRadius:20,padding:"9px 14px",fontFamily:"'Geist',sans-serif",fontSize:13,color:"#0D1624",background:"#F0F3F8",outline:"none"}}/>
        <button onClick={send} style={{width:36,height:36,borderRadius:"50%",background:input.trim()?"#2563EB":"#E8EDF4",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Send size={15} color={input.trim()?"#fff":"#9AABB8"} strokeWidth={2}/></button>
      </div>
    </div>
  );
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:bg,overflow:"hidden"}}>
      <div style={{padding:"10px 16px 12px",background:dark?"#0B0F17":cardBg}}>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"#F0F3F8",borderRadius:12,border:`1px solid ${borderC}`,padding:"9px 14px"}}><Search size={14} color="#9AABB8" strokeWidth={1.5}/><span style={{fontFamily:"'Geist',sans-serif",fontSize:13,color:"#9AABB8"}}>Search messages…</span></div>
      </div>
      <div className="scroll-area">
        {appState==="empty"?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px",textAlign:"center"}}>
            <div style={{width:60,height:60,borderRadius:"50%",background:"#DBEAFE",border:"1px solid #BFDBFE",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><MessageCircle size={26} color="#2563EB" strokeWidth={1.5}/></div>
            <span style={{fontFamily:"'Geist',sans-serif",fontSize:16,fontWeight:600,color:"#0D1624",display:"block",marginBottom:8}}>No messages yet</span>
            <span style={{fontFamily:"'Geist',sans-serif",fontSize:13,color:"#5A6E85",display:"block",maxWidth:220,lineHeight:1.65}}>Connect with athletes, trainers, and club members to start messaging.</span>
          </div>
        ):THREADS_DATA.map(t=>(
          <div key={t.id} onClick={()=>setOpenT(t)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:`1px solid ${borderC}`,cursor:"pointer"}}>
            <div style={{position:"relative"}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:t.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:700,color:"#fff"}}>{t.ini}</span></div>
              {t.unread>0&&<div style={{position:"absolute",top:-2,right:-2,width:18,height:18,borderRadius:"50%",background:"#2563EB",border:"2px solid #fff",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:9,fontWeight:700,color:"#fff"}}>{t.unread}</span></div>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:t.unread>0?700:500,color:"#0D1624"}}>{t.name}</span><span style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:"#9AABB8"}}>{t.lastT}</span></div>
              <span style={{fontFamily:"'Geist',sans-serif",fontSize:12,color:"#5A6E85",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.last}</span>
              <span style={{fontFamily:"'Geist',sans-serif",fontSize:10,color:"#9AABB8",marginTop:2,display:"block"}}>{t.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── ROUTE PLANNER INLINE ──────────────────────────────────────

const InlineRoutePlanner:FC<NP>=({pop,appState})=>{
  const dark=false;
  const showRoute=appState==="mock";
  const bg="#F4F6FA"; const borderC=dark?"#16243A":"#E2E8F0";
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:bg,overflow:"hidden"}}>
      <SVGMap height={230}/>
      <div className="scroll-area" style={{padding:"14px 16px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["Distance",showRoute?"8.4 km":"—"],["Elev gain",showRoute?"+186m":"—"],["Surface",showRoute?"Road":"—"]].map(([l,v])=>(
            <div key={l} style={{background:"#FFFFFF",borderRadius:12,border:`1px solid ${borderC}`,padding:"10px 12px",boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
              <span style={{fontFamily:"'Geist',sans-serif",fontSize:9,fontWeight:600,color:"#9AABB8",textTransform:"uppercase",letterSpacing:"0.6px",display:"block",marginBottom:4}}>{l}</span>
              <span style={{fontFamily:"'Geist Mono',monospace",fontSize:15,fontWeight:700,color:"#0D1624"}}>{v}</span>
            </div>
          ))}
        </div>
        <button style={{width:"100%",padding:"14px",background:"#2563EB",borderRadius:14,border:"none",cursor:showRoute?"pointer":"not-allowed",fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:700,color:"#fff",opacity:showRoute?1:0.5,boxShadow:showRoute?"0 4px 14px rgba(37,99,235,0.25)":"none"}}>Save Route</button>
      </div>
    </div>
  );
};

// ── ACTIVE SESSION INLINE ─────────────────────────────────────

const InlineActiveSession:FC<NP>=({pop,appState})=>{
  const dark=false;
  const [sec,setSec]=useState(42*60+18);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{if(paused||dark)return;const id=setInterval(()=>setSec(s=>s+1),1000);return()=>clearInterval(id);},[paused,dark]);
  const fmt=(s:number)=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s%3600/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const SETS=[{n:"W",w:60,r:8,done:true,rpe:null},{n:"2",w:80,r:5,done:true,rpe:7.0},{n:"3★",w:85,r:5,done:true,rpe:8.0},{n:"4",w:85,r:5,done:true,rpe:null},{n:"5",w:85,r:4,done:false,rpe:9.0}];
  const bg="#F4F6FA"; const cardBg="#FFFFFF"; const borderC=dark?"#16243A":"#E2E8F0";
  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",background:bg,overflow:"hidden"}}>
      <div style={{padding:"9px 16px",background:dark?"#0B0F17":cardBg,borderBottom:`1px solid ${borderC}`,display:"flex",alignItems:"center",gap:10}}>
        <div style={{padding:"4px 10px",borderRadius:20,background:"#FEF2F2",border:"1px solid #FECACA"}}><span style={{fontFamily:"'Geist',sans-serif",fontSize:11,fontWeight:600,color:"#DC2626"}}>Strength</span></div>
        <span style={{fontFamily:"'Geist',sans-serif",fontSize:12,color:"#5A6E85"}}>4/24 sets</span>
        <div style={{flex:1,height:4,borderRadius:2,background:"#E8EDF4"}}><div style={{width:"17%",height:"100%",background:"#2563EB",borderRadius:2}}/></div>
        <span style={{fontFamily:"'Geist Mono',monospace",fontSize:12,fontWeight:600}}>17%</span>
      </div>
      <div style={{padding:"10px 0",borderBottom:`1px solid ${borderC}`,background:dark?"#0B0F17":cardBg}}>
        <div style={{display:"flex",gap:10,padding:"0 16px",overflow:"hidden"}}>
          {[{n:"01",name:"Barbell Bench Press",done:"4/6",active:true},{n:"02",name:"Pull-ups",done:"0/4",active:false},{n:"03",name:"Superset",done:"—",active:false}].map((e,i)=>(
            <div key={i} style={{width:155,flexShrink:0,padding:"10px 12px",borderRadius:12,background:e.active?(dark?"#1A0A0A":"#FFF5F5"):cardBg,border:`1.5px solid ${e.active?"#F87171":borderC}`,position:"relative",overflow:"hidden"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:"#9AABB8"}}>{e.n}</span><span style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:e.active?"#EF4444":"#9AABB8",fontWeight:600}}>{e.done}</span></div>
              <span style={{fontFamily:"'Geist',sans-serif",fontSize:12,fontWeight:700,color:"#0D1624"}}>{e.name}</span>
              {e.active&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:3,background:"#EF4444"}}/>}
            </div>
          ))}
        </div>
      </div>
      <div className="scroll-area" style={{padding:"12px 16px"}}>
        <div style={{background:cardBg,borderRadius:16,border:`1px solid ${borderC}`,padding:14,marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.07)"}}>
          <span style={{fontFamily:"'Geist',sans-serif",fontSize:15,fontWeight:700,color:"#0D1624",display:"block",marginBottom:2}}>Barbell Bench Press</span>
          <span style={{fontFamily:"'Geist',sans-serif",fontSize:11,color:"#5A6E85",display:"block",marginBottom:12}}>Chest · 5×5 + isometric</span>
          {SETS.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:8,background:s.done?"#16A34A":i===4?"#2563EB":"#E8EDF4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontFamily:"'Geist Mono',monospace",fontSize:10,fontWeight:700,color:s.done||i===4?"#fff":"#9AABB8"}}>{s.n}</span></div>
              <div style={{flex:1,height:38,borderRadius:9,background:s.done?"#F0FDF4":i===4?"#EFF6FF":"#F0F3F8",border:`1.5px solid ${s.done?"#86EFAC":i===4?"#93C5FD":"#E2E8F0"}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Geist Mono',monospace",fontSize:13,fontWeight:600,color:s.done?"#16A34A":i===4?"#2563EB":"#5A6E85"}}>{s.w} kg</span></div>
              <span style={{color:"#9AABB8",fontSize:12}}>×</span>
              <div style={{flex:1,height:38,borderRadius:9,background:s.done?"#F0FDF4":i===4?"#EFF6FF":"#F0F3F8",border:`1.5px solid ${s.done?"#86EFAC":i===4?"#93C5FD":"#E2E8F0"}`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:"'Geist Mono',monospace",fontSize:13,fontWeight:600,color:s.done?"#16A34A":i===4?"#2563EB":"#5A6E85"}}>{s.r}</span></div>
              <div style={{width:28,height:28,borderRadius:7,background:s.done?"#DCFCE7":"transparent",border:`1.5px solid ${s.done?"#86EFAC":"#CBD5E1"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.done&&<Check size={13} color="#16A34A" strokeWidth={2.5}/>}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10,padding:"10px 16px 16px",background:dark?"#0B0F17":cardBg,borderTop:`1px solid ${borderC}`}}>
        <button onClick={()=>setPaused(p=>!p)} style={{width:120,height:50,borderRadius:14,border:`1px solid ${borderC}`,background:"#F0F3F8",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:13,fontWeight:600,color:"#0D1624",display:"flex",alignItems:"center",justifyContent:"center",gap:7,flexShrink:0}}>
          {paused?<Play size={15} strokeWidth={2}/>:<Pause size={15} strokeWidth={2}/>}{paused?"Resume":"Pause"}
        </button>
        <button style={{flex:1,height:50,borderRadius:14,border:"none",background:"#2563EB",cursor:"pointer",fontFamily:"'Geist',sans-serif",fontSize:14,fontWeight:700,color:"#fff",boxShadow:"0 4px 14px rgba(37,99,235,0.25)"}}>Finish workout</button>
      </div>
    </div>
  );
};

// ── NAV SCREEN ROUTER ─────────────────────────────────────────

const NavScreenRouter:FC<{route:NavRoute}&NP>=({route,pop,push,appState})=>{
  const props={pop,push,appState,params:route.params};
  switch(route.id){
    case "messaging": return <InlineMessaging {...props}/>;
    case "route-planner": return <InlineRoutePlanner {...props}/>;
    case "blueprints": return <BlueprintScreen {...props}/>;
    case "active-session": return <InlineActiveSession {...props}/>;
    case "health-detail": return <HealthDetailScreen {...props}/>;
    case "settings": return <SettingsScreen {...props}/>;
    default: return null;
  }
};

// nav screen titles
const NAV_TITLES:Record<NavId,string>={
  "messaging":"Messages","messaging-thread":"",
  "route-planner":"Route planner","blueprints":"Blueprints",
  "active-session":"Push · Week 4 · Day 1",
  "health-detail":"","settings":"Settings",
  "session-detail-strength":"Workout summary","session-detail-cardio":"Workout summary"
};


// ── App shell ────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("home");
  const [appState,setAppState]=useState<AppState>("mock");
  const [navStack,setNavStack]=useState<NavRoute[]>([]);
  const [device,setDevice]=useState<Device>("phone");
  const [viewMode,setViewMode]=useState<ViewMode>("native");
  const [skelTheme,setSkelTheme]=useState<"light"|"dark">("light");
  const [zoom,setZoom]=useState(1);
  const [navOpen,setNavOpen]=useState(false);
  const [vh,setVh]=useState(900);
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  useEffect(() => { setNavOpen(false); }, [device, viewMode]);
  const isDark=false;
  const isSkel=appState==="loading";
  const skelDark=isSkel&&skelTheme==="dark";

  const push=(r:NavRoute)=>setNavStack(s=>[...s,r]);
  const pop=()=>setNavStack(s=>s.slice(0,-1));
  const current=navStack.length>0?navStack[navStack.length-1]:null;
  const navTitle=current?(current.id==="health-detail"?current.params?.catName??"":NAV_TITLES[current.id]??""):"";
  const setStateAndReset=(s:AppState)=>{setAppState(s);setNavStack([]);}


  // ── Device dimensions ───────────────────────────────────────────
  const DIM = {
    phone:   { w: 390,  h: 844  },
    tablet:  { w: 768,  h: 1024 },
    desktop: { w: 1280, h: 820  },
  };
  const { w: DW, h: DH } = DIM[device];
  const isTablet  = device === "tablet";
  const isDesktop = device === "desktop";
  const isWide    = isTablet || isDesktop;

  // ── Navigation helpers (shared for all layouts) ─────────────────
  const TABS = [
    { id:"home",    label:"Home",    Icon:Home },
    { id:"workout", label:"Workout", Icon:Dumbbell },
    { id:"social",  label:"Social",  Icon:Users },
    { id:"profile", label:"Profile", Icon:User },
  ];

  const HomeComp = isSkel ? SkHomeScreen : MockHomeScreen;

  const ContentArea = () => (
    <div className="scroll-area">
      {current ? (
        <NavScreenRouter route={current} pop={pop} push={push} appState={appState}/>
      ) : (
        <>
          {tab==="home"    && <HomeComp push={push as any} device={device} dark={skelDark}/>}
          {tab==="workout" && <WorkoutScreen appState={appState} push={push} skelDark={skelTheme==="dark"}/>}
          {tab==="social"  && <SocialScreen  appState={appState} push={push} skelDark={skelTheme==="dark"}/>}
          {tab==="profile" && <ProfileScreen  appState={appState} push={push} skelDark={skelTheme==="dark"}/>}
        </>
      )}
    </div>
  );

  // ── Sidebar (tablet / desktop) ───────────────────────────────────
  const Sidebar = () => (
    <div style={{
      width: isDesktop ? 220 : 72, flexShrink: 0,
      background: skelDark ? T.dSurf : "#fff", borderRight: `1px solid ${skelDark?T.dBorder:"#E2E8F0"}`,
      display: "flex", flexDirection: "column",
      padding: isDesktop ? "24px 0" : "20px 0",
    }}>
      {isDesktop && (
        <div style={{ padding: "0 20px 24px", fontFamily: "'Geist',sans-serif", fontSize: 16, fontWeight: 700, color: skelDark?"#C8DCF0":T.txt }}>
          Forma
        </div>
      )}
      {TABS.map(({ id, label, Icon }) => {
        const active = tab === id && !current;
        return (
          <button key={id} onClick={() => { setTab(id); setNavStack([]); }} style={{
            display: "flex", alignItems: "center",
            gap: isDesktop ? 12 : 0, flexDirection: isDesktop ? "row" : "column",
            padding: isDesktop ? "10px 20px" : "10px 0",
            background: active ? (skelDark?T.dCard:T.accentD) : "none", border: "none", cursor: "pointer",
            borderRadius: isDesktop ? "10px" : "0",
            margin: isDesktop ? "2px 12px" : "4px 0",
            fontFamily: "'Geist',sans-serif",
            fontSize: isDesktop ? 13 : 10, fontWeight: active ? 600 : 400,
            color: active ? T.accent : (skelDark?T.dSub:T.inactive),
          }}>
            <Icon size={isDesktop ? 18 : 22} strokeWidth={active ? 2.2 : 1.5}/>
            {label}
          </button>
        );
      })}
      <div style={{ flex: 1 }}/>
      <button onClick={() => push({ id: "messaging" })} style={{
        display: "flex", alignItems: "center", gap: isDesktop ? 12 : 0,
        flexDirection: isDesktop ? "row" : "column",
        padding: isDesktop ? "10px 20px" : "10px 0",
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'Geist',sans-serif", fontSize: isDesktop ? 13 : 10,
        fontWeight: 400, color: skelDark?T.dSub:T.inactive,
        margin: isDesktop ? "2px 12px" : "4px 0",
      }}>
        <MessageCircle size={isDesktop ? 18 : 22} strokeWidth={1.5}/>
        Messages
      </button>
    </div>
  );

  // ── TopBar for wide layouts ──────────────────────────────────────
  const WideTopBar = () => {
    const screenTitle = current
      ? (current.id === "health-detail" ? current.params?.catName ?? "" : NAV_TITLES[current.id] ?? "")
      : (TAB_META[tab]?.title ?? "");
    const bg = skelDark ? T.dSurf : T.surf;
    const border = skelDark ? T.dBorder : T.border;
    const txt = skelDark ? "#C8DCF0" : T.txt;
    const txt2 = skelDark ? T.dSub : T.txt2;
    return (
      <div style={{
        height: 52, background: bg, borderBottom: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {current && (
            <button onClick={pop} className="icon-btn" style={{ width: 32, height: 32, background: skelDark?T.dCard:"#fff", border: `1px solid ${border}` }}>
              <ArrowLeft size={15} color={txt2} strokeWidth={1.5}/>
            </button>
          )}
          {skelDark
            ? <Sk dark w={120} h={18} r={5}/>
            : <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 16, fontWeight: 600, color: txt }}>{screenTitle}</span>
          }
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {skelDark ? (
            <><Sk dark w={34} h={34} r={10}/><Sk dark w={34} h={34} r={10} d={-0.2}/></>
          ) : (
            <>
              <button className="icon-btn" style={{ width: 34, height: 34 }}><Search size={15} color={T.txt2} strokeWidth={1.5}/></button>
              <button className="icon-btn" style={{ width: 34, height: 34 }}><Bell size={15} color={T.txt2} strokeWidth={1.5}/></button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Browser chrome ───────────────────────────────────────────────
  const BrowserChrome = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", width: DW, height: DH, background: skelDark?T.dSurf:T.surf, borderRadius: device==="phone" ? 44 : 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      {/* Browser bar */}
      <div style={{ height: 44, background: "#F0F0F0", borderBottom: "1px solid #D0D0D0", display: "flex", alignItems: "center", padding: "0 12px", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map((c,i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }}/>)}
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 6, height: 26, display: "flex", alignItems: "center", padding: "0 10px", border: "1px solid #D0D0D0", maxWidth: 400, margin: "0 auto" }}>
          <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 11, color: "#666" }}>forma.app</span>
        </div>
      </div>
      {children}
    </div>
  );

  // ── Native phone chrome ──────────────────────────────────────────
  const PhoneChrome = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      width: DW, height: DH, background: skelDark?T.dSurf:T.surf,
      borderRadius: 50, border: `1px solid ${skelDark?T.dBorder:T.border}`,
      overflow: "hidden", display: "flex", flexDirection: "column",
      boxShadow: ["0 0 0 8px rgba(255,255,255,0.5)","0 0 0 9px rgba(200,215,230,0.8)","0 40px 120px rgba(0,0,0,0.2)"].join(","),
    }}>
      {children}
    </div>
  );

  // ── Native tablet / desktop chrome ───────────────────────────────
  const WideChrome = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      width: DW, height: DH, background: skelDark?T.dSurf:T.surf,
      borderRadius: 14, border: `1px solid ${skelDark?T.dBorder:T.border}`,
      overflow: "hidden", display: "flex", flexDirection: "column",
      boxShadow: "0 30px 80px rgba(0,0,0,0.18)",
    }}>
      {/* Title bar */}
      <div style={{ height: 36, background: "#F5F5F5", borderBottom: "1px solid #E0E0E0", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57","#FEBC2E","#28C840"].map((c,i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }}/>)}
        </div>
        <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 12, color: "#666", marginLeft: 8 }}>Forma</span>
      </div>
      {children}
    </div>
  );

  // ── Inner app layout ─────────────────────────────────────────────
  const AppLayout = () => {
    if (isWide) {
      const isWeb = viewMode === "web";
      return (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Sidebar/>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {!isWeb && <WideTopBar/>}
            <ContentArea/>
          </div>
        </div>
      );
    }
    // Phone layout
    const isWeb = viewMode === "web";
    const barBg     = skelDark ? T.dSurf : T.surf;
    const barBorder = skelDark ? T.dBorder : T.border;
    const barTxt    = skelDark ? "#C8DCF0" : T.txt;
    const barTxt2   = skelDark ? T.dSub : T.txt2;

    const BackRow = () => current ? (
      <div style={{ height: 52, background: barBg, borderBottom: `1px solid ${barBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <button onClick={pop} className="icon-btn" style={{ width: 34, height: 34, background: skelDark?T.dCard:"#fff", border: `1px solid ${barBorder}` }}><ArrowLeft size={16} color={barTxt2} strokeWidth={1.5}/></button>
        <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 14, fontWeight: 600, color: barTxt }}>
          {current.id === "health-detail" ? current.params?.catName ?? "" : NAV_TITLES[current.id] ?? ""}
        </span>
        <div style={{ width: 34 }}/>
      </div>
    ) : null;

    if (isWeb) {
      const screenTitle = current ? navTitle : (TABS.find(t=>t.id===tab)?.label ?? "Forma");
      const drawerBg     = skelDark ? T.dSurf : "#fff";
      const drawerBorder = skelDark ? T.dBorder : "#E2E8F0";
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {/* Top bar with hamburger / back */}
          <div style={{ height: 52, background: barBg, borderBottom: `1px solid ${barBorder}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", flexShrink: 0 }}>
            {current ? (
              <button onClick={pop} className="icon-btn" style={{ width: 34, height: 34, background: skelDark?T.dCard:"#fff", border: `1px solid ${barBorder}` }}><ArrowLeft size={16} color={barTxt2} strokeWidth={1.5}/></button>
            ) : (
              <button onClick={() => setNavOpen(true)} className="icon-btn" style={{ width: 34, height: 34, background: skelDark?T.dCard:"#fff", border: `1px solid ${barBorder}` }}><Menu size={17} color={barTxt2} strokeWidth={1.5}/></button>
            )}
            <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 15, fontWeight: 600, color: barTxt }}>{screenTitle}</span>
          </div>

          <ContentArea/>

          {/* Backdrop */}
          {navOpen && (
            <div onClick={() => setNavOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 20 }}/>
          )}

          {/* Slide-out drawer */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: 0, width: 240,
            background: drawerBg, borderRight: `1px solid ${drawerBorder}`,
            display: "flex", flexDirection: "column", padding: "20px 0",
            boxShadow: "4px 0 24px rgba(0,0,0,0.15)", zIndex: 21,
            transform: navOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.22s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 24px" }}>
              <span style={{ fontFamily: "'Geist',sans-serif", fontSize: 16, fontWeight: 700, color: skelDark?"#C8DCF0":T.txt }}>Forma</span>
              <button onClick={() => setNavOpen(false)} className="icon-btn" style={{ width: 30, height: 30, background: skelDark?T.dCard:"#fff", border: `1px solid ${drawerBorder}` }}><X size={15} color={barTxt2} strokeWidth={1.5}/></button>
            </div>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id && !current;
              return (
                <button key={id} onClick={() => { setTab(id); setNavStack([]); setNavOpen(false); }} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 20px", margin: "2px 12px",
                  background: active ? (skelDark?T.dCard:T.accentD) : "none", border: "none", cursor: "pointer",
                  borderRadius: 10, fontFamily: "'Geist',sans-serif", fontSize: 14,
                  fontWeight: active ? 600 : 400, color: active ? T.accent : (skelDark?T.dSub:T.inactive),
                }}>
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.5}/>{label}
                </button>
              );
            })}
            <div style={{ flex: 1 }}/>
            <button onClick={() => { push({ id: "messaging" }); setNavOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 20px", margin: "2px 12px",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Geist',sans-serif", fontSize: 14, fontWeight: 400,
              color: skelDark?T.dSub:T.inactive,
            }}>
              <MessageCircle size={19} strokeWidth={1.5}/>Messages
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <StatusBar isDark={skelDark}/>
        {current ? <BackRow/> : <TopBar tab={tab} isDark={skelDark} onMessage={() => push({ id: "messaging" })}/>}
        <ContentArea/>
        {!current && (
          <div style={{ background: barBg, borderTop: `1px solid ${barBorder}`, display: "flex", flexShrink: 0, paddingTop: 2, paddingBottom: 4 }}>
            {TABS.map(({ id, label, Icon }) => {
              const active = tab === id;
              return (
                <button key={id} className="tab-btn" onClick={() => setTab(id)} style={{ color: active ? T.accent : T.inactive }}>
                  <Icon size={22} strokeWidth={active ? 2.2 : 1.5}/>{label}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ height: 14, background: barBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 134, height: 5, background: skelDark?T.dSub:T.border2, borderRadius: 3 }}/>
        </div>
      </>
    );
  };

  // ── Outer wrapper (device frame) ────────────────────────────────
  const Frame = ({ children }: { children: React.ReactNode }) => {
    if (viewMode === "web") return <BrowserChrome>{children}</BrowserChrome>;
    if (isWide)             return <WideChrome>{children}</WideChrome>;
    return <PhoneChrome>{children}</PhoneChrome>;
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start", minHeight: "100vh", paddingTop: 32, paddingBottom: 40,
      background: "radial-gradient(ellipse 70% 50% at 50% 0%, #C7D8F0 0%, #9AAEC8 100%)",
      fontFamily: "'Geist',sans-serif", gap: 20,
    }}>
      <style>{CSS}</style>

      {/* ── Controls ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>

        {/* State: Skeleton | Mock */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, gap: 2, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            {([["loading","Skeleton"],["mock","Mock data"]] as [AppState,string][]).map(([s,label]) => (
              <button key={s} onClick={() => setStateAndReset(s)} style={{
                padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500,
                background: appState === s ? "rgba(255,255,255,0.92)" : "transparent",
                color: appState === s ? "#0D1624" : "rgba(255,255,255,0.85)",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Skeleton theme: Light | Dark — only when Skeleton is active */}
          {isSkel && (
            <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, gap: 2, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
              {([["light","Light"],["dark","Dark"]] as ["light"|"dark",string][]).map(([t,label]) => (
                <button key={t} onClick={() => setSkelTheme(t)} style={{
                  padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500,
                  background: skelTheme === t ? "rgba(255,255,255,0.92)" : "transparent",
                  color: skelTheme === t ? "#0D1624" : "rgba(255,255,255,0.85)",
                }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {/* Device */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, gap: 2, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            {([["phone","Phone"],["tablet","Tablet"],["desktop","Desktop"]] as [Device,string][]).map(([d,label]) => (
              <button key={d} onClick={() => setDevice(d)} style={{
                padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500,
                background: device === d ? "rgba(255,255,255,0.92)" : "transparent",
                color: device === d ? "#0D1624" : "rgba(255,255,255,0.85)",
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* View mode */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, gap: 2, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
            {([["native","Native"],["web","Web"]] as [ViewMode,string][]).map(([v,label]) => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500,
                background: viewMode === v ? "rgba(255,255,255,0.92)" : "transparent",
                color: viewMode === v ? "#0D1624" : "rgba(255,255,255,0.85)",
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom controls */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: 4, gap: 2, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
          {([[1,"100%"],[0.75,"75%"],[0.5,"50%"]] as [number,string][]).map(([z,label]) => (
            <button key={label} onClick={() => setZoom(z)} style={{
              padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500,
              background: Math.abs(zoom - z) < 0.001 ? "rgba(255,255,255,0.92)" : "transparent",
              color: Math.abs(zoom - z) < 0.001 ? "#0D1624" : "rgba(255,255,255,0.85)",
            }}>
              {label}
            </button>
          ))}
          <button onClick={() => {
            const reserved = 220;
            const fit = Math.min(1, (vh - reserved) / DH);
            setZoom(Math.max(0.25, Math.round(fit * 100) / 100));
          }} style={{
            padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            fontFamily: "'Geist',sans-serif", fontSize: 12, fontWeight: 500,
            background: "transparent", color: "rgba(255,255,255,0.85)",
          }}>
            Fit
          </button>
        </div>
      </div>

      {/* ── Device frame (scaled) ─────────────────────────────────── */}
      <div style={{ width: DW * zoom, height: DH * zoom, overflow: "hidden" }}>
        <div style={{ width: DW, height: DH, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
          <Frame>
            <AppLayout/>
          </Frame>
        </div>
      </div>
    </div>
  );
}