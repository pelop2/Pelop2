"use client";
import {useEffect,useRef,useState} from "react";
import {Rich} from "./Viz";
import {Camera,Send,Upload,X,Radio,Cpu} from "lucide-react";
type Mode="pelops_mei"|"yung_yun";
const M={pelops_mei:{name:"PELOPS II",sub:"Mei",a:"#0284c7",b:"#0ea5e9"},yung_yun:{name:"YUNG",sub:"Yun",a:"#4f46e5",b:"#d97706"}};
const shrink=(src:string,px:number,q=.8)=>new Promise<string>(res=>{const i=new Image();i.onload=()=>{const s=Math.min(1,px/Math.max(i.width,i.height));const c=document.createElement("canvas");c.width=i.width*s;c.height=i.height*s;c.getContext("2d")!.drawImage(i,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",q))};i.src=src});
const square=(src:string)=>new Promise<string>(res=>{const i=new Image();i.onload=()=>{const c=document.createElement("canvas");c.width=c.height=256;const s=Math.min(i.width,i.height);c.getContext("2d")!.drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,256,256);res(c.toDataURL("image/jpeg",.8))};i.src=src});
const read=(f:File)=>new Promise<string>(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result as string);fr.readAsDataURL(f)});
const steps=["INITIALIZING KERNEL","LOADING ARCHETYPE MATRIX","MOUNTING OPTICAL & RELAY BUS","TERMINAL READY"];

const PRE=[c=>(<><circle cx="24" cy="24" r="22" fill="none" stroke={c} strokeWidth="2"/><polygon points="24,8 40,36 8,36" fill="none" stroke={c} strokeWidth="2"/><circle cx="24" cy="26" r="4" fill={c}/></>),
c=>(<><rect x="4" y="4" width="40" height="40" rx="8" fill="none" stroke={c} strokeWidth="2"/><path d="M8 34 Q16 6 24 24 T40 14" fill="none" stroke={c} strokeWidth="2"/></>),
c=>(<><circle cx="24" cy="24" r="20" fill="none" stroke={c} strokeWidth="2"/><circle cx="24" cy="24" r="11" fill="none" stroke={c} strokeWidth="2"/><circle cx="24" cy="24" r="3" fill={c}/></>),
c=>(<><polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="none" stroke={c} strokeWidth="2"/><line x1="24" y1="4" x2="24" y2="44" stroke={c} strokeWidth="2"/></>)] as ((c:string)=>JSX.Element)[];
function Avatar({src,color,size=48}:{src?:string;color:string;size?:number}){
 if(src&&!src.startsWith("preset:"))return <img src={src} alt="" className="rounded-full object-cover" style={{width:size,height:size}}/>;
 return <svg width={size} height={size} viewBox="0 0 48 48">{PRE[src?+src.slice(7):0](color)}</svg>;
}
export default function Page(){
 const [mounted,setMounted]=useState(false);const [boot,setBoot]=useState(true);const [pct,setPct]=useState(0);
 const [mode,setMode]=useState<Mode>("pelops_mei");const [tab,setTab]=useState<"ai"|"peer">("ai");
 const [avatars,setAvatars]=useState<Record<string,string>>({});const [msgs,setMsgs]=useState<any[]>([]);
 const [input,setInput]=useState("");const [img,setImg]=useState<string|null>(null);const [busy,setBusy]=useState(false);
 const [cam,setCam]=useState(false);const [note,setNote]=useState("");const vid=useRef<HTMLVideoElement>(null);const stream=useRef<MediaStream|null>(null);
 const [callsign,setCallsign]=useState("MEI_LAB");const [channel,setChannel]=useState("main");const [peer,setPeer]=useState<any[]>([]);const [pin,setPin]=useState("");
 const th=M[mode];
 useEffect(()=>{setMounted(true);navigator.serviceWorker?.register("/sw.js").catch(()=>{});try{setAvatars(JSON.parse(localStorage.getItem("sp_avatars")||"{}"))}catch{}},[]);
 useEffect(()=>{if(!boot||!mounted)return;const t=setInterval(()=>setPct(p=>{if(p>=100){clearInterval(t);setTimeout(()=>setBoot(false),400);return 100}return p+4}),70);return()=>clearInterval(t)},[boot,mounted]);
 useEffect(()=>{if(tab!=="peer")return;const f=()=>fetch("/api/channel?channel="+channel).then(r=>r.json()).then(setPeer).catch(()=>{});f();const t=setInterval(f,2500);return()=>clearInterval(t)},[tab,channel]);
 useEffect(()=>()=>stream.current?.getTracks().forEach(t=>t.stop()),[]);
 const saveAv=(v?:string)=>{const n={...avatars};v?n[mode]=v:delete n[mode];setAvatars(n);try{localStorage.setItem("sp_avatars",JSON.stringify(n))}catch{setNote("Storage full: avatar kept for this session only.")}};
 const startCam=async()=>{setNote("");try{if(!navigator.mediaDevices?.getUserMedia)throw new Error("unsupported");let s:MediaStream;
  try{s=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}})}catch{s=await navigator.mediaDevices.getUserMedia({video:true})}
  stream.current=s;setCam(true);setTimeout(()=>{if(vid.current)vid.current.srcObject=s},50)}
  catch(e:any){setNote(e?.message==="unsupported"?"Camera is not supported in this browser. Use Upload Image.":e?.name==="NotAllowedError"?"Camera permission denied. Allow access in browser settings or use Upload Image.":"No camera found. Use Upload Image.")}};
 const stopCam=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;setCam(false)};
 const capture=async()=>{const v=vid.current;if(!v)return;const c=document.createElement("canvas");c.width=v.videoWidth;c.height=v.videoHeight;c.getContext("2d")!.drawImage(v,0,0);setImg(await shrink(c.toDataURL(),1024));stopCam()};
 const send=async()=>{if(busy||(!input&&!img))return;const um={role:"user",content:input,image:img};const hist=[...msgs,um];setMsgs([...hist,{role:"assistant",content:""}]);setInput("");setImg(null);setBusy(true);
  try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({mode,messages:hist.map(m=>({role:m.role,content:m.content,image:m.image}))})});
   const rd=r.body!.getReader();const dec=new TextDecoder();let acc="";
   while(true){const {done,value}=await rd.read();if(done)break;acc+=dec.decode(value,{stream:true});setMsgs([...hist,{role:"assistant",content:acc,mode}])}}
  catch{setNote("Request failed. Check the server log.")}setBusy(false)};
 const sendPeer=async()=>{if(!pin&&!img)return;await fetch("/api/channel",{method:"POST",body:JSON.stringify({channel,callsign,text:pin,image:img})});setPin("");setImg(null)};
 const shareItem=async(kind:string,payload:any)=>{await fetch("/api/channel",{method:"POST",body:JSON.stringify({channel,callsign,text:"Shared "+kind,item:{kind,payload}})});setNote("Sent to channel "+channel+".")};
 const pick=async(e:React.ChangeEvent<HTMLInputElement>,kind:"img"|"av")=>{const f=e.target.files?.[0];if(!f)return;const d=await read(f);kind==="img"?setImg(await shrink(d,1024)):saveAv(await square(d));e.target.value=""};
 if(!mounted)return null;
 const css={["--a" as any]:th.b,["--accent" as any]:th.a} as React.CSSProperties;
 if(boot)return(<div className="fixed inset-0 grid place-items-center bg-slate-50"><div className="w-80 rounded-lg border border-slate-200 bg-white p-6 text-center">
  <div className="mx-auto mb-4 w-fit animate-pulse"><Avatar src={avatars[mode]} color={th.a} size={72}/></div>
  <div className="mono mb-3 h-16 space-y-0.5 text-left text-xs text-slate-600">{steps.map((s,i)=>pct>=i*28&&<div key={s}>&gt; {s}</div>)}</div>
  <div className="h-1.5 rounded bg-slate-100"><div className="h-full rounded" style={{width:pct+"%",background:th.a}}/></div>
  <div className="mono mt-1 text-xs">{pct}%</div><button onClick={()=>setBoot(false)} className="mt-3 text-xs underline text-slate-500">Enter Terminal</button></div></div>);
 return(<div className="safe flex h-[100dvh] flex-col md:flex-row" style={css}>
 <aside className="max-h-44 w-full shrink-0 overflow-y-auto border-b border-slate-200 bg-white p-3 md:max-h-none md:w-64 md:border-b-0 md:border-r md:p-4">
  <div className="mb-4 flex items-center gap-2"><img src="/logo.png" alt="Singular Point logo" className="h-10 w-10 rounded-lg"/><div className="text-sm font-semibold leading-tight">SINGULAR POINT<br/><span className="mono text-xs font-normal text-slate-500">Research Terminal</span></div></div>
  <div className="mb-4 grid grid-cols-2 gap-1 rounded border border-slate-200 p-1 text-sm">{(Object.keys(M) as Mode[]).map(k=><button key={k} onClick={()=>setMode(k)} className="rounded py-1.5" style={mode===k?{background:M[k].a,color:"#fff"}:{}}>{M[k].name}</button>)}</div>
  <div className={"flex items-center gap-3 rounded border border-slate-200 p-3 "+(busy?"streaming":"")}><Avatar src={avatars[mode]} color={th.a}/><div><div className="font-semibold">{th.name}</div><div className="text-xs text-slate-500">{th.sub} · {busy?"transmitting":"standby"}</div></div></div>
  <div className="mt-3 flex gap-2 text-xs"><label className="cursor-pointer rounded border border-slate-200 px-2 py-1">Change picture<input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>pick(e,"av")}/></label><button className="rounded border border-slate-200 px-2 py-1" onClick={()=>saveAv()}>Reset</button></div>
  <div className="mt-3 flex gap-2">{PRE.map((_,i)=><button key={i} aria-label={"Preset "+(i+1)} onClick={()=>saveAv("preset:"+i)} className="rounded border border-slate-200 p-1"><Avatar src={"preset:"+i} color={th.a} size={28}/></button>)}</div>
  <button onClick={()=>{setPct(0);setBoot(true)}} className="mt-3 text-xs text-slate-500 underline">Replay boot</button>
  {note&&<p className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">{note}</p>}
 </aside>
 <main className="flex min-h-0 flex-1 flex-col">
  <div className="flex border-b border-slate-200 bg-white text-sm">{([["ai","AI Research Terminal",Cpu],["peer","Peer Researcher Channel",Radio]] as const).map(([k,l,I])=><button key={k} onClick={()=>setTab(k)} className="flex items-center gap-2 px-4 py-3" style={tab===k?{borderBottom:"2px solid "+th.a,color:th.a}:{}}><I size={14}/>{l}</button>)}</div>
  <div className="flex-1 space-y-3 overflow-y-auto p-4">
  {tab==="ai"?msgs.map((m,i)=><div key={i} className={"flex gap-2 "+(m.role==="user"?"justify-end":"")}>
    {m.role==="assistant"&&<Avatar src={avatars[m.mode||mode]} color={th.a} size={32}/>}
    <div className="max-w-xl whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-sm">{m.image&&<img src={m.image} alt="" className="mb-2 max-h-40 rounded"/>}<Rich text={m.content||"…"} onShare={shareItem}/></div></div>)
  :<>
   <div className="flex gap-2 text-sm"><input value={callsign} onChange={e=>setCallsign(e.target.value.toUpperCase())} className="mono w-36 rounded border border-slate-200 px-2 py-1" aria-label="Callsign"/><input value={channel} onChange={e=>setChannel(e.target.value)} className="mono w-36 rounded border border-slate-200 px-2 py-1" aria-label="Channel"/></div>
   {peer.map(p=><div key={p.id} className="max-w-xl rounded-lg border border-slate-200 bg-white p-3 text-sm"><div className="mono mb-1 text-xs text-slate-500">{p.callsign} · {new Date(p.t).toLocaleTimeString()}</div>{p.image&&<img src={p.image} alt="" className="mb-2 max-h-40 rounded"/>}{p.text}{p.item&&<div className="mt-2"><Rich text={"```json:"+p.item.kind+"\n"+JSON.stringify(p.item.payload)+"\n```"}/><button className="text-xs underline" style={{color:th.a}} onClick={()=>{setMsgs(x=>[...x,{role:"assistant",mode,content:"Shared by "+p.callsign+":\n```json:"+p.item.kind+"\n"+JSON.stringify(p.item.payload)+"\n```"}]);setTab("ai")}}>Load into Visualizer / Terminal</button></div>}{p.image&&<button className="mt-2 block text-xs underline" style={{color:th.a}} onClick={()=>{setImg(p.image);setTab("ai")}}>Load into Terminal</button>}</div>)}</>}
  </div>
  {cam&&<div className="border-t border-slate-200 bg-white p-3"><video ref={vid} autoPlay playsInline muted className="max-h-48 rounded"/><div className="mt-2 flex gap-2 text-sm"><button onClick={capture} className="rounded px-3 py-1 text-white" style={{background:th.a}}>Capture Frame</button><button onClick={stopCam} className="rounded border border-slate-200 px-3 py-1">Stop</button></div></div>}
  {img&&<div className="relative w-fit border-t border-slate-200 p-3"><img src={img} alt="" className="h-20 rounded"/><button onClick={()=>setImg(null)} aria-label="Clear" className="absolute right-1 top-1 rounded-full bg-white"><X size={14}/></button></div>}
  <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
   <button onClick={cam?stopCam:startCam} aria-label="Camera" className="rounded border border-slate-200 p-2"><Camera size={18}/></button>
   <label className="cursor-pointer rounded border border-slate-200 p-2" aria-label="Upload image"><Upload size={18}/><input type="file" accept="image/*" hidden onChange={e=>pick(e,"img")}/></label>
   <input value={tab==="ai"?input:pin} onChange={e=>tab==="ai"?setInput(e.target.value):setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(tab==="ai"?send():sendPeer())} placeholder={tab==="ai"?"Ask "+th.name+"…":"Message channel "+channel} className="min-w-0 flex-1 rounded border border-slate-200 px-3 text-sm"/>
   <button onClick={tab==="ai"?send:sendPeer} aria-label="Send" className="rounded px-3 text-white" style={{background:th.a}}><Send size={16}/></button></div>
 </main></div>);
}
