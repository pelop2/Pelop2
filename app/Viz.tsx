"use client";
import {useEffect,useRef} from "react";
import ReactMarkdown from "react-markdown";import remarkMath from "remark-math";import rehypeKatex from "rehype-katex";
import {LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,ResponsiveContainer,Label} from "recharts";
import * as THREE from "three";
const OK=new Set(["x","y","sin","cos","tan","sqrt","abs","exp","log","pi","pow","min","max"]);
function compile(s:string){const ids=s.toLowerCase().match(/[a-z_]+/g)||[];if(!/^[\w\s+\-*/().,^]*$/.test(s)||ids.some(i=>!OK.has(i)))return null;
 const js=s.replace(/\^/g,"**").replace(/\b(sin|cos|tan|sqrt|abs|exp|log|pow|min|max)\b/gi,m=>"Math."+m.toLowerCase()).replace(/\bpi\b/gi,"Math.PI");
 try{return new Function("x","y","return "+js) as (x:number,y:number)=>number}catch{return null}}
export function Graph({d}:{d:any}){const pts=Array.isArray(d?.points)?d.points:[];
 return <div className="my-2 h-56 w-full rounded border border-slate-200 bg-white p-2"><div className="mb-1 text-xs font-semibold">{d.title}</div>
 <ResponsiveContainer width="100%" height="88%"><LineChart data={pts}><CartesianGrid stroke="#e2e8f0"/><XAxis dataKey="x" type="number" domain={["auto","auto"]}><Label value={d.xLabel} offset={-2} position="insideBottom"/></XAxis><YAxis><Label value={d.yLabel} angle={-90} position="insideLeft"/></YAxis><Tooltip/><Line type="monotone" dataKey="y" stroke="var(--accent,#0284c7)" dot={pts.length<30} strokeWidth={2}/></LineChart></ResponsiveContainer></div>}
export function Viewer({d}:{d:any}){const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const el=ref.current!;const w=el.clientWidth||320,h=220;const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setSize(w,h);el.appendChild(r.domElement);
  const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,w/h,.1,100);cam.position.set(0,2,5);cam.lookAt(0,0,0);
  let g:THREE.BufferGeometry;const f=d.expr?compile(String(d.expr)):null;
  if(d.shape==="surface"&&f){g=new THREE.PlaneGeometry(4,4,60,60);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const v=f(p.getX(i),p.getZ(i));p.setY(i,isFinite(v)?Math.max(-3,Math.min(3,v)):0)}}
  else g=d.shape==="sphere"?new THREE.SphereGeometry(1.3,24,16):d.shape==="icosahedron"?new THREE.IcosahedronGeometry(1.4,1):new THREE.TorusGeometry(1.1,.4,16,48);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:d.color||"#0284c7",wireframe:true}));sc.add(m);
  let drag=false,raf=0;const down=()=>drag=true,up=()=>drag=false,mv=(e:PointerEvent)=>{if(drag){m.rotation.y+=e.movementX*.01;m.rotation.x+=e.movementY*.01}};
  r.domElement.addEventListener("pointerdown",down);window.addEventListener("pointerup",up);r.domElement.addEventListener("pointermove",mv);
  const loop=()=>{if(!drag)m.rotation.y+=.005;r.render(sc,cam);raf=requestAnimationFrame(loop)};loop();
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("pointerup",up);g.dispose();r.dispose();r.domElement.remove()}},[d]);
 return <div className="my-2 rounded border border-slate-200 bg-white"><div className="px-2 pt-1 text-xs font-semibold">{d.title||d.shape}</div><div ref={ref} className="h-[220px] w-full touch-none"/></div>}
export function Rich({text,onShare}:{text:string;onShare?:(k:string,p:any)=>void}){
 const parts=text.split(/```json:(graph|3d)\s*([\s\S]*?)```/);const out:any[]=[];
 for(let i=0;i<parts.length;i+=3){out.push(<ReactMarkdown key={i} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{parts[i]}</ReactMarkdown>);
  if(parts[i+1]){let d:any=null;try{d=JSON.parse(parts[i+2])}catch{}
   out.push(d?<div key={i+"v"}>{parts[i+1]==="graph"?<Graph d={d}/>:<Viewer d={d}/>}{onShare&&<button className="text-xs underline" onClick={()=>onShare(parts[i+1],d)}>Share to peer channel</button>}</div>:<pre key={i+"e"} className="text-xs text-red-600">Could not read visual block.</pre>)}}
 return <>{out}</>}
