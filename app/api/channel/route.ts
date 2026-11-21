// In-memory store: fine for one server instance. For multi-instance/Vercel, swap for Redis/Supabase/WebSocket service.
const store:Record<string,any[]>=(globalThis as any).__ch??((globalThis as any).__ch={});
export async function GET(r:Request){const u=new URL(r.url);const ch=u.searchParams.get("channel")||"main";
 return Response.json((store[ch]||[]).slice(-100));}
export async function POST(r:Request){const {channel,callsign,text,image,item}=await r.json();
 const ch=channel||"main";(store[ch]??=[]).push({id:crypto.randomUUID(),t:Date.now(),callsign:String(callsign||"ANON").slice(0,20),text:String(text||"").slice(0,4000),image:image||null,item:item||null});
 return Response.json({ok:true});}
