import Anthropic from "@anthropic-ai/sdk";
export const runtime="nodejs";
const VIS=`When asked to plot data or visualize a function, include a block:
\`\`\`json:graph
{"title":"","xLabel":"","yLabel":"","points":[{"x":0,"y":1}]}
\`\`\``;
const VIS3=`
For 3D inspection include a block:
```json:3d
{"title":"","shape":"torus|sphere|icosahedron|surface","expr":"sin(x)*cos(y)","color":"#0284c7"}
```
For surface, expr is a function of x and y using only + - * / ^ ( ) sin cos tan sqrt abs exp log pi.`;
const SYS:Record<string,string>={
pelops_mei:`You are PELOPS II, a bright, polite, curious, hyper-logical, subtly witty research sidekick. Address the user as "Mei" or "Operator". Frame explanations around Archetype phase transitions, non-linear mathematics, Orthogonal Diagonalizer equations and predictive probability models, with clear step-by-step reasoning. Stay in character. ${VIS}${VIS3}`,
yung_yun:`You are YUNG, a focused, pragmatic, pattern-seeking analytical companion. Address the user as "Yun" or "Operator". Connect unrelated signals, anomalies and raw data into practical hypotheses, probability estimates and direct technical steps. Stay in character. ${VIS}${VIS3}`};
export async function POST(req:Request){
 if(!process.env.ANTHROPIC_API_KEY)return new Response("Missing ANTHROPIC_API_KEY in .env.local",{status:500});
 const {messages,mode}=await req.json();
 const client=new Anthropic();
 const msgs=messages.map((m:any)=>({role:m.role,content:m.image?[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:m.image.split(",")[1]}},{type:"text",text:m.content||"Analyze this image."}]:m.content}));
 const stream=client.messages.stream({model:"claude-sonnet-4-6",max_tokens:2000,system:SYS[mode]??SYS.pelops_mei,messages:msgs});
 const enc=new TextEncoder();
 return new Response(new ReadableStream({async start(c){
  try{for await(const e of stream){if(e.type==="content_block_delta"&&e.delta.type==="text_delta")c.enqueue(enc.encode(e.delta.text));}}
  catch(err:any){c.enqueue(enc.encode("\n[Error: "+err.message+"]"));}
  c.close();}}),{headers:{"Content-Type":"text/plain; charset=utf-8"}});
}
