/* PIXEL GUIDE — the AI helper inside PixelProTech OS.
   Talks only to the PixelProTech Worker; the OpenRouter key is never in the browser.
   When the AI cannot be reached it searches the installed apps locally and says so. */
(function(){
"use strict";
const OS=window.PixelOS;
if(!OS||!OS.api) return;
const {registerApp,openWindow}=OS.api;

const DEFAULT_API="https://pixel-guide-api.lindokuhlerojasmabika.workers.dev";
const KEY="pixelguide.api", MAX_CHARS=800, TIMEOUT=30000;
const ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h16v11H10l-4.5 3.8V16.5H4z"/><path d="M12 7.8l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/></svg>';
const CHIPS=["What can this OS do?","Find an app for my CV","How do I use apps offline?","My Wi-Fi is not working"];

const chat=[];            // {role:"user"|"assistant"|"note", text, ai} — kept until the page reloads
let busy=false, view=null;

function stored(){ try{ return localStorage.getItem(KEY)||""; }catch(e){ return ""; } }
function apiBase(){ return (stored()||DEFAULT_API).replace(/\/+$/,""); }
const el=(tag,cls,text)=>{ const n=document.createElement(tag); if(cls) n.className=cls; if(text!=null) n.textContent=text; return n; };

async function call(path,options){
  const ctl=new AbortController(), t=setTimeout(()=>ctl.abort(),TIMEOUT);
  try{
    const res=await fetch(apiBase()+path,Object.assign({signal:ctl.signal,cache:"no-store"},options));
    const data=await res.json();
    return data;
  }finally{ clearTimeout(t); }
}

/* ---- offline answer: plain keyword match over the apps in this OS ---- */
const STOP=new Set("a an and app apps are can do does for how i in is it me my not of on or the this to use what with working find open need want please help".split(" "));
function localAnswer(q){
  const low=q.toLowerCase();
  if(/offline|download (all|the apps|apps)|without (the )?internet/.test(low))
    return "Apps are saved the first time you open them. To save them all, open Pixel Settings and use Offline apps.\n[[open:settings]]";
  const words=(low.match(/[a-z0-9]+/g)||[]).map(w=>w==="wi"||w==="fi"?"wifi":w).filter(w=>w.length>1&&!STOP.has(w));
  const hits=Object.values(OS.apps).filter(a=>a.id!=="pixel-guide").map(a=>{
    const name=String(a.name).toLowerCase().replace(/wi-fi/g,"wifi"), rest=(String(a.desc||"")+" "+String(a.category||"")).toLowerCase().replace(/wi-fi/g,"wifi");
    let s=0; new Set(words).forEach(w=>{ const re=new RegExp("\\b"+w); if(re.test(name)) s+=3; else if(re.test(rest)) s+=1; });
    return {a,s};
  }).filter(x=>x.s>0).sort((x,y)=>y.s-x.s).slice(0,3);
  return hits.length
    ? "These apps match your words:\n"+hits.map(x=>"[[open:"+x.a.id+"]]").join(" ")
    : "I found no app matching those words. Pixel Apps lets you browse by category. [[open:pixel-apps]]";
}

/* ---- rendering (text only: nothing from the AI is ever treated as HTML) ---- */
function bubble(m){
  const box=el("div","pg-msg pg-"+m.role);
  if(m.role==="assistant"&&!m.ai) box.appendChild(el("div","pg-tag","OFFLINE ANSWER · NOT AI"));
  const ids=[];
  const text=m.text.replace(/\[\[open:([\w-]+)\]\]/g,(_,id)=>{
    if(m.role!=="assistant"||!Object.prototype.hasOwnProperty.call(OS.apps,id)) return "";
    if(!ids.includes(id)) ids.push(id);
    return OS.apps[id].name;
  }).replace(/\*\*/g,"").trim();
  // a line that is only app names is redundant next to the buttons
  const names=ids.map(i=>OS.apps[i].name);
  const shown=text.split("\n").filter(line=>{ let r=line; names.forEach(n=>{ r=r.split(n).join(""); }); return !(names.length&&line.trim()&&!r.replace(/[\s,.;·-]/g,"")); }).join("\n").trim();
  if(shown) box.appendChild(el("div","pg-text",shown));
  if(ids.length){
    const row=el("div","pg-open");
    ids.slice(0,3).forEach(id=>{ const b=el("button","pg-btn","Open "+OS.apps[id].name); b.type="button"; b.onclick=()=>openWindow(id); row.appendChild(b); });
    box.appendChild(row);
  }
  return box;
}

function draw(){
  if(!view) return;
  const {log,input,send,chips,clear}=view;
  log.textContent="";
  log.appendChild(bubble({role:"assistant",ai:true,text:"Hi, I am Pixel Guide. Tell me what you want to do and I will point you to the right app or walk you through it."}));
  chat.forEach(m=>log.appendChild(bubble(m)));
  if(busy) log.appendChild(el("div","pg-msg pg-assistant pg-wait","Thinking…"));
  chips.hidden=chat.length>0;
  send.disabled=busy; clear.disabled=busy||!chat.length;
  log.scrollTop=log.scrollHeight;
  if(!busy&&window.innerWidth>=720) input.focus();
}

async function ask(q){
  q=q.trim().slice(0,MAX_CHARS);
  if(!q||busy) return;
  const history=chat.filter(m=>m.role==="user"||(m.role==="assistant"&&m.ai)).slice(-8)
    .map(m=>({role:m.role,content:m.text.slice(0,1500)}));
  chat.push({role:"user",text:q}); busy=true; draw();
  let reply=null, why="";
  try{
    const data=await call("/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:q,history})});
    if(data&&data.ok&&data.reply) reply=String(data.reply); else why=(data&&data.message)||"The AI service had a problem.";
  }catch(e){
    why=navigator.onLine?"The AI could not be reached.":"You are offline.";
  }
  if(reply) chat.push({role:"assistant",ai:true,text:reply});
  else { chat.push({role:"note",text:why}); chat.push({role:"assistant",ai:false,text:localAnswer(q)}); }
  busy=false; setStatus(reply?"on":"off",reply?"AI ONLINE":"AI UNAVAILABLE"); draw();
}

function setStatus(state,label){
  if(!view) return;
  view.status.dataset.state=state; view.status.textContent=label;
}
async function check(){
  setStatus("wait","CHECKING…");
  try{
    const d=await call("/health");
    if(d&&d.ok&&d.configured) setStatus("on","AI ONLINE");
    else if(d&&d.ok) setStatus("off","AI NOT SET UP");
    else setStatus("off","AI UNAVAILABLE");
  }catch(e){ setStatus("off","AI UNREACHABLE"); }
}

const css=document.createElement("style");
css.textContent=`
.pg{display:flex;flex-direction:column;height:100%;background:var(--bg2);color:var(--tx);font-family:var(--body)}
.pg-top{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--br);flex-wrap:wrap}
.pg-status{font:10px var(--mono);letter-spacing:.1em;color:var(--tx2);margin-right:auto}
.pg-status::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--tx3);margin-right:6px}
.pg-status[data-state="on"]::before{background:var(--tl)}.pg-status[data-state="off"]::before{background:var(--gd)}
.pg-log{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:9px;min-height:0}
.pg-msg{max-width:88%;padding:9px 12px;border-radius:12px;font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;display:flex;flex-direction:column;gap:8px;user-select:text}
.pg-assistant{align-self:flex-start;background:var(--glass);border:1px solid var(--br)}
.pg-user{align-self:flex-end;background:var(--pp-a);border:1px solid var(--pp)}
.pg-note{align-self:center;color:var(--gd);font-size:11.5px;text-align:center}
.pg-wait{color:var(--tx2)}
.pg-tag{font:9px var(--mono);letter-spacing:.12em;color:var(--gd)}
.pg-open,.pg-chips{display:flex;gap:6px;flex-wrap:wrap}
.pg-chips{padding:0 12px 8px}.pg-chips[hidden]{display:none}
.pg-btn{background:transparent;border:1px solid var(--tl);color:var(--tl);border-radius:8px;padding:6px 10px;font:11px var(--mono);cursor:pointer}
.pg-btn:hover{background:var(--tl-a)}.pg-btn:disabled{opacity:.4;cursor:default}
.pg-form{display:flex;gap:8px;padding:10px 12px 6px;border-top:1px solid var(--br)}
.pg-in{flex:1;min-width:0;background:var(--glass);border:1px solid var(--br2);border-radius:9px;color:var(--tx);padding:10px 12px;font:16px var(--body);outline:none}
.pg-in:focus{border-color:var(--tl);box-shadow:0 0 0 3px var(--tl-a)}
.pg-send{background:var(--pp);border:0;color:#fff;border-radius:9px;padding:0 16px;font:600 11px var(--mono);letter-spacing:.1em;cursor:pointer}
.pg-send:disabled{opacity:.5;cursor:default}
.pg-fine{padding:0 12px 10px;font-size:10.5px;line-height:1.4;color:var(--tx2)}
.pg-conn{padding:10px 12px;border-bottom:1px solid var(--br);display:flex;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--tx2)}
.pg-conn[hidden]{display:none}.pg-conn .pg-in{font-size:12px;padding:7px 10px;flex-basis:100%}
#pg-ask{background:var(--pp);border:0;color:#fff;border-radius:8px;padding:7px 11px;font:600 10.5px var(--mono);letter-spacing:.1em;cursor:pointer;flex:none}
@media(max-width:420px){#pg-ask{padding:7px 9px}}
`;
document.head.appendChild(css);

registerApp({
  id:"pixel-guide",name:"Pixel Guide",category:"System",icon:ICON,
  desc:"AI helper that knows the apps in this OS and helps you use them.",width:460,height:600,
  launch(body){
    body.classList.add("bleed");
    const root=el("div","pg");
    root.innerHTML=`
      <div class="pg-top"><span class="pg-status" role="status"></span>
        <button type="button" class="pg-btn" data-a="conn">Connection</button>
        <button type="button" class="pg-btn" data-a="clear">Clear chat</button></div>
      <div class="pg-conn" hidden><span>Address of your Pixel Guide Worker. Never paste an API key here.</span>
        <input class="pg-in" data-a="url" type="url" spellcheck="false">
        <button type="button" class="pg-btn" data-a="save">Save and test</button>
        <button type="button" class="pg-btn" data-a="reset">Use default</button></div>
      <div class="pg-log" aria-live="polite"></div>
      <div class="pg-chips"></div>
      <form class="pg-form"><input class="pg-in" data-a="q" maxlength="${MAX_CHARS}" placeholder="Ask Pixel Guide…" autocomplete="off" aria-label="Your question">
        <button class="pg-send">SEND</button></form>
      <div class="pg-fine">Messages are sent to PixelProTech's Cloudflare service and an AI provider (OpenRouter). Do not type passwords, PINs, ID or bank numbers. AI answers can be wrong.</div>`;
    body.appendChild(root);
    const q=s=>root.querySelector(s);
    view={log:q(".pg-log"),input:q('[data-a="q"]'),send:q(".pg-send"),chips:q(".pg-chips"),clear:q('[data-a="clear"]'),status:q(".pg-status")};
    const mine=view, conn=q(".pg-conn"), url=q('[data-a="url"]');
    CHIPS.forEach(c=>{ const b=el("button","pg-btn",c); b.type="button"; b.onclick=()=>ask(c); mine.chips.appendChild(b); });
    q(".pg-form").addEventListener("submit",e=>{ e.preventDefault(); if(busy) return; const v=mine.input.value; mine.input.value=""; ask(v); });
    mine.clear.onclick=()=>{ chat.length=0; draw(); };
    q('[data-a="conn"]').onclick=()=>{ conn.hidden=!conn.hidden; url.value=apiBase(); };
    q('[data-a="save"]').onclick=()=>{
      const v=url.value.trim().replace(/\/+$/,"");
      if(!/^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(v)){ setStatus("off","ADDRESS MUST START https://"); return; }
      try{ localStorage.setItem(KEY,v); }catch(e){ setStatus("off","COULD NOT SAVE"); return; }
      conn.hidden=true; check();
    };
    q('[data-a="reset"]').onclick=()=>{ try{ localStorage.removeItem(KEY); }catch(e){} url.value=apiBase(); conn.hidden=true; check(); };
    draw(); check();
  }
});

OS.desktopIcons.splice(1,0,"pixel-guide");

const right=document.getElementById("tb-right");
if(right){
  const b=el("button",null,"ASK AI"); b.id="pg-ask"; b.type="button"; b.title="Pixel Guide";
  b.onclick=()=>openWindow("pixel-guide");
  right.parentNode.insertBefore(b,right);
}
})();
