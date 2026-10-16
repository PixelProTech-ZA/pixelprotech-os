/* PIXEL APPS — company apps built from the PixelProTech Corporate Capability Profile 2026,
   plus the Pixel Reactor visual lab. Content is taken from the profile; nothing here simulates live data. */
(function(){
"use strict";
const OS=window.PixelOS;
if(!OS||!OS.api) return;
const {registerApp,svgIcon,escapeHtml:esc,openWindow,notify}=OS.api;
const $=(s,r)=>(r||document).querySelector(s);
const $$=(s,r)=>[...(r||document).querySelectorAll(s)];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const fx=()=>OS.fx;

const CO={
  name:"PixelProTech Solutions (Pty) Ltd",reg:"2026/622131/07",date:"04 August 2026",web:"pixelprotechsolutions.co.za",
  email:"pixelprotechsolutions@proton.me",phone:"065 197 1461",
  services:[
    ["FIELD IT SUPPORT",["Computer support","Laptop support","Hardware diagnostics","Software troubleshooting","Operating system support","Device configuration","Printer & peripheral support"]],
    ["BUSINESS TECHNOLOGY",["Workstation setup","Office technology setup","IT environment assessments","Business technology troubleshooting","Backup planning","System documentation"]],
    ["NETWORK & CONNECTIVITY",["Network troubleshooting","Wi-Fi diagnostics","Connectivity problems","Router / network configuration","Performance investigation"]],
    ["DATA, SOFTWARE & SECURITY",["Backup assistance","Recovery assistance","Software configuration","Security-related troubleshooting","System maintenance"]],
    ["DIGITAL SYSTEMS",["Progressive Web Applications","Business tools","Operational dashboards","Digital utilities","Custom web systems"]]
  ],
  method:[["REQUEST","Client describes the problem or requirement."],["ASSESS","Initial technical assessment of the environment."],["DIAGNOSE","Probable causes isolated through structured testing."],["APPROVE","Client approves scope before work proceeds."],["REPAIR / BUILD","The appropriate fix, configuration or build is carried out."],["TEST","The result is tested — not assumed to be correct."],["DOCUMENT","The work performed is recorded."],["HANDOVER","System is returned in a verified, usable state."]],
  pde:[["SYMPTOM","What is the client experiencing?"],["ENVIRONMENT","What hardware, software, network and operating conditions exist?"],["TEST","What evidence can confirm or eliminate possible causes?"],["FAULT","What has actually been established?"],["ACTION","What repair, configuration or replacement is appropriate?"],["VERIFICATION","Does the system now operate correctly?"]],
  builds:[["PIXEL WIFI — NETWORK X-RAY","dev","DEVELOPMENT","Real Wi-Fi and network diagnostics. Never fakes a reading — shows “NOT TESTABLE” instead of guessing."],["DOCUMENT ENGINE","dep","DEPLOYED","Browser-based document conversion, repair and OCR scanning. No upload, no account, no monthly fee."],["CV BUILDER","dep","DEPLOYED","Browser-based CV builder for South African job seekers. Real PDF and Word export, no signup, drafts saved on your device only."],["PIXELPROTECH OS","pro","PROTOTYPE","A browser-based desktop environment with honestly labelled capabilities — no simulated telemetry."]],
  why:[["FIELD-FIRST","We work in the environment where the technology is actually being used."],["EVIDENCE-BASED","We test and diagnose rather than guessing."],["BUILT","PixelProTech develops its own digital tools and systems."],["DOCUMENTED","Technical work should leave a clear record."],["PRACTICAL","Solutions should solve the client’s actual problem without unnecessary complexity."],["LOCAL","Our operating focus is Gauteng, enabling local technical support and relationships."]],
  serve:[["SMALL & GROWING BUSINESSES","Businesses without a dedicated internal IT department."],["PROFESSIONAL OFFICES","Organisations dependent on reliable computers, networks, printers and connectivity."],["RETAIL & OPERATIONS","Businesses where technology directly affects daily operations."],["COMMUNITY & EDUCATIONAL ENVIRONMENTS","Organisations requiring practical technology support and maintenance."],["INDIVIDUAL PROFESSIONALS","People whose work depends on reliable personal technology."]],
  calls:[["UNRELIABLE COMPUTERS","Structured diagnosis, fault identification, repair or configuration."],["UNSTABLE WI-FI / NETWORKS","Connectivity investigation, testing and appropriate network intervention."],["UNNECESSARY REPLACEMENT COSTS","Establish the technical fault before recommending replacement, where practical."],["REPEATED TECHNOLOGY PROBLEMS","Document the issue, the intervention and the verification."],["BUSINESS NEEDS A DIGITAL TOOL","Assess whether an existing solution fits, or whether a custom digital system is appropriate."]],
  engage:[["CONTACT PIXELPROTECH","Describe the problem or requirement."],["ASSESSMENT","PixelProTech determines the appropriate technical assessment."],["TECHNICAL ACTION","Repair, configure, optimise, support or build according to the requirement."],["VERIFY & HAND OVER","Test the result and document the completed work."]],
  // approximate coordinates (lat, lon) — schematic only
  areas:{
    Johannesburg:[["Sandton",-26.107,28.056],["Randburg",-26.094,28.006],["Roodepoort",-26.162,27.867],["Midrand",-25.999,28.126],["Fourways",-26.013,28.011],["Johannesburg CBD",-26.204,28.047]],
    "Pretoria / Centurion":[["Centurion",-25.860,28.189],["Hatfield",-25.748,28.238],["Menlyn",-25.783,28.277],["Brooklyn",-25.769,28.241],["Montana",-25.676,28.263],["Pretoria CBD",-25.746,28.188]]
  }
};
const iconHex=svgIcon('<path d="M12 3l7 4v10l-7 4-7-4V7z"/><path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4"/>');
const iconEngine=svgIcon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2M3 12h2M19 12h2M12 3v2M12 19v2"/>');
const iconMap=svgIcon('<path d="M12 21s7-6 7-11.5a7 7 0 10-14 0C5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/>');
const iconReactor=svgIcon('<path d="M12 2l8 4.6v9.2L12 20.4 4 15.8V6.6z"/><path d="M12 11l8-4.4M12 11v9.4M12 11L4 6.6"/>');

function spotlight(root){
  root.addEventListener("pointermove",e=>{const c=e.target.closest(".pp-card");if(!c)return;const r=c.getBoundingClientRect();
    c.style.setProperty("--mx",(e.clientX-r.left)+"px");c.style.setProperty("--my",(e.clientY-r.top)+"px");});
}
function copy(text,label){
  const ok=()=>notify("Copied",label||text);
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok,fail); else fail();
  function fail(){const t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();try{document.execCommand("copy");ok();}catch(e){notify("Copy failed","Select and copy manually.");}t.remove();}
}
const stagger=html=>html.replace(/<(div|h2|p|dl) class="(pp-[a-z0-9 -]+)"/g,(m,t,c)=>`<${t} class="${c}"`);

/* ============================================================
   COMPANY PROFILE
   ============================================================ */
registerApp({id:"pp-profile",name:"PixelProTech Profile",category:"Company",icon:iconHex,width:780,height:640,
launch(body,win){
  body.classList.add("bleed");
  const tabs=["OVERVIEW","SERVICES","METHOD","BUILDS","WHY","CLIENTS","CREDENTIALS","ENGAGE"];
  const sel=[];Object.values(CO.areas).forEach(a=>a.forEach(x=>sel.push(x[0])));
  const P={
    OVERVIEW:()=>`<div class="pp-h">// COMPANY</div><h2 class="pp-h2">Technology should work.<br>When it doesn’t, we find out why.</h2>
      <p class="pp-p">PixelProTech Solutions (Pty) Ltd is a South African field IT engineering and digital systems company, formally incorporated on 04 August 2026 and operating out of Centurion, Gauteng. The company provides on-site computer, network and business technology support, alongside internally developed digital tools and Progressive Web Applications built to solve real, specific technical problems.</p>
      <p class="pp-p">PixelProTech’s operating focus is Gauteng — Johannesburg and Pretoria in particular — with work carried out directly in the environment where the technology is used, rather than remotely or through a fixed workshop model.</p>
      <p class="pp-p">The company’s approach combines structured field diagnostics with an internal engineering practice: where an existing tool does not fit a client’s requirement, PixelProTech is positioned to build one.</p>
      <div class="pp-btn-row"><button class="btn primary" data-open="pp-engine">Open Diagnostic Engine</button><button class="btn" data-open="pp-coverage">Gauteng coverage</button><button class="btn" data-open="pp-reactor">Pixel Reactor</button></div>`,
    SERVICES:()=>`<div class="pp-h">// SERVICE MATRIX</div><h2 class="pp-h2">What we do</h2><div class="pp-grid">${CO.services.map(([h,l])=>`<div class="pp-card"><h4>${h}</h4><ul>${l.map(x=>`<li>${x}</li>`).join("")}</ul></div>`).join("")}</div><div class="pp-note">Only genuinely deliverable services are listed above.</div>`,
    METHOD:()=>`<div class="pp-h">// OPERATING PROCESS</div><h2 class="pp-h2">The Pixel Method</h2><p class="pp-p">PixelProTech does not simply send someone to look at a computer. Every engagement follows the same structured sequence, from first contact to verified handover.</p>
      <div class="pp-steps">${CO.method.map((m,i)=>`<div class="pp-step" style="--k:${i}"><div class="n">${i+1}</div><b>${m[0]}</b><span>${m[1]}</span></div>`).join("")}</div>
      <div class="pp-h" style="margin-top:20px">// PROPRIETARY METHODOLOGY</div><h2 class="pp-h2">Pixel Diagnostic Engine™</h2>
      <p class="pp-p">PixelProTech’s structured technical assessment methodology. Used to capture reported symptoms, understand the operating environment, isolate probable causes, determine appropriate tests, establish the required corrective action, and document the outcome.</p>
      <div class="pp-grid">${CO.pde.map((m,i)=>`<div class="pp-card"><h4>0${i+1} · ${m[0]}</h4><p>${m[1]}</p></div>`).join("")}</div>
      <div class="pp-note">This is a documented engineering workflow used internally to structure field diagnostics — not a certified, automated or independently validated system.</div>`,
    BUILDS:()=>`<div class="pp-h">// ENGINEERING PROOF</div><h2 class="pp-h2">Digital systems built by PixelProTech</h2><p class="pp-p">Most IT support companies resell someone else’s software. PixelProTech writes its own — proof of engineering depth, not a sales pitch.</p>
      <div class="pp-note">Screenshots to be added as builds are finalised for public release.</div>
      <div class="pp-resp">${CO.builds.map(b=>`<div class="pp-card"><h3>${b[0]}<span class="pp-badge ${b[1]}">${b[2]}</span></h3><p>${b[3]}</p></div>`).join("")}</div>
      <div class="pp-h" style="margin-top:6px">// RUNNING INSIDE THIS OS</div>
      <div class="pp-btn-row"><button class="btn" data-open="hamba-rides">Hamba Rides</button><button class="btn" data-open="orchard-shift">Orchard Shift</button><button class="btn" data-open="homebase">Homebase</button></div>`,
    WHY:()=>`<div class="pp-h">// TRUST PROTOCOL</div><h2 class="pp-h2">Why PixelProTech</h2><div class="pp-grid">${CO.why.map(w=>`<div class="pp-card"><h4 style="color:var(--tl)">${w[0]}</h4><p>${w[1]}</p></div>`).join("")}</div>
      <div class="pp-h" style="margin-top:16px">// COMMERCIAL RATIONALE</div><h2 class="pp-h2">Why clients call</h2>
      <div class="pp-resp">${CO.calls.map(c=>`<div class="pp-card"><div class="lab">PIXEL RESPONSE</div><h3>${c[0]}</h3><p>${c[1]}</p></div>`).join("")}</div>
      <div class="pp-note">PixelProTech turns technology problems into defined technical actions.</div>`,
    CLIENTS:()=>`<div class="pp-h">// TARGET ENVIRONMENTS</div><h2 class="pp-h2">Who we serve</h2><div class="pp-resp">${CO.serve.map(c=>`<div class="pp-card"><h3>${c[0]}</h3><p>${c[1]}</p></div>`).join("")}</div>
      <div class="pp-h" style="margin-top:8px">// COVERAGE MATRIX</div><h2 class="pp-h2">Gauteng operating coverage</h2>
      <div class="pp-grid">${Object.entries(CO.areas).map(([k,v])=>`<div class="pp-card"><h4>${k.toUpperCase()}</h4><ul>${v.map(x=>`<li>${x[0]}</li>`).join("")}</ul></div>`).join("")}</div>
      <div class="pp-note">Additional Gauteng locations are serviced according to requirement, availability and scope. Gauteng is the operating territory PixelProTech is building into deeply — not a claim of province-wide unlimited coverage.</div>
      <div class="pp-btn-row"><button class="btn" data-open="pp-coverage">See the coverage map</button></div>`,
    CREDENTIALS:()=>`<div class="pp-h">// VERIFIED INFORMATION</div><h2 class="pp-h2">Company credentials</h2>
      <dl class="pp-kv"><div><dt>LEGAL NAME</dt><dd>${CO.name}</dd></div><div><dt>REGISTRATION</dt><dd>${CO.reg}</dd></div><div><dt>REGISTRATION DATE</dt><dd>${CO.date}</dd></div><div><dt>B-BBEE</dt><dd class="gold">Level 1 — 135% Procurement Recognition</dd></div><div><dt>OPERATING REGION</dt><dd>Gauteng, South Africa</dd></div><div><dt>WEBSITE</dt><dd>${CO.web}</dd></div></dl>
      <div class="pp-note" style="margin-top:18px">Additional certifications and supplier registrations will be added to this profile as they are obtained.</div>`,
    ENGAGE:()=>`<div class="pp-h">// SUPPORT CONSOLE</div><h2 class="pp-h2">Have a technology problem?</h2><p class="pp-p" style="color:var(--tl)">Start with the problem. We’ll determine the technical response.</p>
      <div class="pp-steps" style="margin-bottom:18px">${CO.engage.map((m,i)=>`<div class="pp-step" style="--k:${i}"><div class="n">0${i+1}</div><b>${m[0]}</b><span>${m[1]}</span></div>`).join("")}</div>
      <dl class="pp-kv pp-contact" style="margin-bottom:16px"><div><dt>WEBSITE</dt><dd>${CO.web}</dd></div><div><dt>EMAIL</dt><dd><a href="mailto:${CO.email}">${CO.email}</a></dd></div><div><dt>PHONE</dt><dd><a href="tel:+27651971461">${CO.phone}</a></dd></div><div><dt>AREAS</dt><dd>Johannesburg • Pretoria • Centurion • Gauteng</dd></div></dl>
      <div class="pp-card" style="margin-top:6px"><h4 style="color:var(--tl)">DESCRIBE THE PROBLEM</h4>
        <div class="pp-field"><label>YOUR NAME</label><input id="rq-name" autocomplete="off"></div>
        <div class="pp-field"><label>AREA</label><select id="rq-area">${sel.map(s=>`<option>${s}</option>`).join("")}<option>Other (Gauteng)</option></select></div>
        <div class="pp-field"><label>WHAT IS THE PROBLEM OR REQUIREMENT?</label><textarea id="rq-msg"></textarea></div>
        <div class="pp-btn-row"><button class="btn primary" id="rq-mail">Compose email</button><button class="btn" id="rq-copy">Copy request</button><button class="btn" id="cp-mail">Copy email</button><button class="btn" id="cp-tel">Copy phone</button></div>
        <div class="pp-note">Composing opens your own email app. Nothing is sent from this OS.</div></div>`
  };
  body.innerHTML=`<div class="pp-app"><div class="pp-hero"><div class="pp-eyebrow">[ SYS ] PIXEL DIAGNOSTIC ENGINE™ · REG ${CO.reg} · GAUTENG, ZA</div>
    <div class="pp-title"><span class="pp-glitch" data-t="PIXELPROTECH SOLUTIONS">PIXELPROTECH SOLUTIONS</span> <small>(PTY) LTD</small></div>
    <div class="pp-sub">FIELD IT ENGINEERING & DIGITAL SYSTEMS</div><p>Supporting, repairing and building technology across Gauteng.</p></div>
    <div class="pp-tabs">${tabs.map((t,i)=>`<button class="pp-tab${i?"":" on"}" data-tab="${t}">${t}</button>`).join("")}</div>
    <div class="pp-scroll"><div class="pp-panel" id="pp-panel"></div></div></div>`;
  const panel=$("#pp-panel",body),scroller=$(".pp-scroll",body);
  function show(t){
    panel.innerHTML=P[t]();$$(".pp-tab",body).forEach(b=>b.classList.toggle("on",b.dataset.tab===t));
    $$("#pp-panel>*",body).forEach((n,i)=>n.style.setProperty("--i",i));scroller.scrollTop=0;
    $$("[data-open]",panel).forEach(b=>b.onclick=()=>openWindow(b.dataset.open));
    if(t==="ENGAGE"){
      const msg=()=>`PixelProTech request\nName: ${$("#rq-name",panel).value||"-"}\nArea: ${$("#rq-area",panel).value}\n\n${$("#rq-msg",panel).value||"(describe the problem)"}`;
      $("#rq-mail",panel).onclick=()=>{location.href=`mailto:${CO.email}?subject=${encodeURIComponent("Technology support request")}&body=${encodeURIComponent(msg())}`;};
      $("#rq-copy",panel).onclick=()=>copy(msg(),"Request copied");
      $("#cp-mail",panel).onclick=()=>copy(CO.email);$("#cp-tel",panel).onclick=()=>copy(CO.phone);
    }
    fx()&&fx().burst&&(()=>{const r=body.getBoundingClientRect();fx().burst(r.left+r.width/2,r.top+110,10,120);})();
  }
  $$(".pp-tab",body).forEach(b=>b.onclick=()=>show(b.dataset.tab));
  spotlight(body);show("OVERVIEW");
}});

/* ============================================================
   DIAGNOSTIC ENGINE — a working template for the six-stage workflow; records stay on this device
   ============================================================ */
registerApp({id:"pp-engine",name:"Diagnostic Engine",category:"Company",icon:iconEngine,width:760,height:620,
launch(body,win){
  body.classList.add("bleed");
  const KEY="pixelos.pde.records.v1";
  const st={step:0,symptom:"",reporter:"",location:"",env:{hardware:"",os:"",network:"",conditions:[],notes:""},tests:[],fault:"",action:"",verified:null,vnote:"",saved:false};
  const COND=["Power / charger","Peripherals","Wi-Fi","Wired network","Recent update","Recent install","Storage nearly full","Overheating","Physical damage","Backup exists"];
  const RES=[["confirms","Confirms cause","ok"],["eliminates","Eliminates cause","warn"],["inconclusive","Inconclusive","no"]];
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]");}catch(e){return[];}};
  const save=a=>{try{localStorage.setItem(KEY,JSON.stringify(a.slice(0,50)));return true;}catch(e){notify("Storage unavailable","Record could not be saved on this device.");return false;}};
  body.innerHTML=`<div class="de"><div class="de-rail" id="de-rail"></div><div class="de-main"><div class="de-body" id="de-body"></div><div class="de-foot"><button class="btn" id="de-prev">Back</button><span class="dim mono" style="font-size:9.5px">Documented workflow · not a certified or automated system</span><button class="btn primary" id="de-next">Next</button></div></div></div>`;
  const rail=$("#de-rail",body),main=$("#de-body",body),prev=$("#de-prev",body),next=$("#de-next",body);
  function rec(){
    const d=new Date(),p=n=>String(n).padStart(2,"0");
    const ref=`PDE-${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
    const t=st.tests.length?st.tests.map((x,i)=>`  ${i+1}. ${x.t} → ${RES.find(r=>r[0]===x.r)[1]}`).join("\n"):"  (none recorded)";
    return `PIXELPROTECH SOLUTIONS (PTY) LTD · REG ${CO.reg}
PIXEL DIAGNOSTIC ENGINE™ — FIELD RECORD
Reference: ${ref}
Recorded: ${d.toLocaleString()}
Reported by: ${st.reporter||"-"}   Location: ${st.location||"-"}

01 SYMPTOM
  ${st.symptom||"-"}
02 ENVIRONMENT
  Hardware: ${st.env.hardware||"-"}
  Software / OS: ${st.env.os||"-"}
  Network: ${st.env.network||"-"}
  Conditions: ${st.env.conditions.join(", ")||"-"}
  Notes: ${st.env.notes||"-"}
03 TEST
${t}
04 FAULT (established)
  ${st.fault||"-"}
05 ACTION
  ${st.action||"-"}
06 VERIFICATION
  ${st.verified===true?"VERIFIED — system operates correctly":st.verified===false?"NOT VERIFIED — further work required":"not recorded"}
  ${st.vnote||""}`.trimEnd();
  }
  function render(){
    rail.innerHTML=CO.pde.map((s,i)=>`<button class="de-node ${i<st.step?"done":""} ${i===st.step?"cur":""}" data-i="${i}"><div class="hx">0${i+1}</div><span>${s[0]}</span></button>`).join("");
    $$(".de-node",rail).forEach(b=>b.onclick=()=>{st.step=+b.dataset.i;render();});
    const s=CO.pde[st.step];
    let h=`<div class="de-q"><small>STAGE 0${st.step+1} OF 06</small>${s[0]} — ${s[1]}</div><div style="height:12px"></div>`;
    if(st.step===0)h+=`<div class="pp-field"><label>CLIENT / REPORTED BY</label><input id="f-rep" value="${esc(st.reporter)}"></div><div class="pp-field"><label>LOCATION (SITE / SUBURB)</label><input id="f-loc" value="${esc(st.location)}"></div><div class="pp-field"><label>WHAT IS THE CLIENT EXPERIENCING? (their words, symptoms only — not the cause)</label><textarea id="f-sym" style="min-height:110px">${esc(st.symptom)}</textarea></div>`;
    if(st.step===1)h+=`<div class="pp-field"><label>HARDWARE</label><input id="f-hw" placeholder="make / model / age" value="${esc(st.env.hardware)}"></div><div class="pp-field"><label>SOFTWARE / OPERATING SYSTEM</label><input id="f-os" value="${esc(st.env.os)}"></div><div class="pp-field"><label>NETWORK</label><input id="f-net" placeholder="router, ISP, wired / Wi-Fi" value="${esc(st.env.network)}"></div><div class="de-chips">${COND.map(c=>`<button class="de-chip ${st.env.conditions.includes(c)?"on":""}" data-c="${c}">${c}</button>`).join("")}</div><div class="pp-field"><label>NOTES</label><textarea id="f-en">${esc(st.env.notes)}</textarea></div>`;
    if(st.step===2)h+=`<p class="pp-p">Record each test and what it showed. Evidence either confirms a probable cause or eliminates it.</p><div class="pp-field"><label>TEST PERFORMED</label><input id="f-t" placeholder="e.g. Swapped charger; ran memory test; tested on wired link"></div><div class="de-chips">${RES.map((r,i)=>`<button class="de-chip ${i===0?"on":""}" data-r="${r[0]}">${r[1]}</button>`).join("")}<button class="btn" id="f-add" style="margin-left:auto">Add test</button></div><div id="f-list">${st.tests.map((x,i)=>`<div class="de-ev"><span class="tag ${RES.find(r=>r[0]===x.r)[2]}">${RES.find(r=>r[0]===x.r)[1]}</span><span>${esc(x.t)}</span><em data-d="${i}">remove</em></div>`).join("")||'<div class="dim">No tests recorded yet.</div>'}</div>`;
    if(st.step===3)h+=`<p class="pp-p">Only what the evidence has actually established.</p><div class="pp-field"><label>FAULT</label><textarea id="f-fault" style="min-height:120px">${esc(st.fault)}</textarea></div>`;
    if(st.step===4)h+=`<p class="pp-p">The approved repair, configuration or replacement (client approves scope before work proceeds).</p><div class="pp-field"><label>ACTION</label><textarea id="f-act" style="min-height:120px">${esc(st.action)}</textarea></div>`;
    if(st.step===5)h+=`<div class="de-chips"><button class="de-chip ${st.verified===true?"on":""}" data-v="1">Verified — operates correctly</button><button class="de-chip ${st.verified===false?"on":""}" data-v="0">Not verified — more work needed</button></div><div class="pp-field"><label>HOW WAS IT VERIFIED?</label><textarea id="f-vn">${esc(st.vnote)}</textarea></div><div class="app-section-h">FIELD RECORD</div><div class="de-rec" id="f-rec">${esc(rec())}</div><div class="pp-btn-row"><button class="btn primary" id="f-save">Save on this device</button><button class="btn" id="f-copy">Copy</button><button class="btn" id="f-dl">Download .txt</button></div><div class="de-hist" id="f-hist"></div>`;
    main.innerHTML=h;prev.disabled=st.step===0;next.textContent=st.step===5?"Start new":"Next";
    bind();
  }
  function bind(){
    const m=main,v=(id,fn)=>{const e=$(id,m);if(e)e.oninput=()=>fn(e.value);};
    v("#f-rep",x=>st.reporter=x);v("#f-loc",x=>st.location=x);v("#f-sym",x=>st.symptom=x);v("#f-hw",x=>st.env.hardware=x);v("#f-os",x=>st.env.os=x);v("#f-net",x=>st.env.network=x);v("#f-en",x=>st.env.notes=x);v("#f-fault",x=>st.fault=x);v("#f-act",x=>st.action=x);
    $$("[data-c]",m).forEach(b=>b.onclick=()=>{const c=b.dataset.c,a=st.env.conditions;a.includes(c)?a.splice(a.indexOf(c),1):a.push(c);b.classList.toggle("on");});
    let res="confirms";$$("[data-r]",m).forEach(b=>b.onclick=()=>{res=b.dataset.r;$$("[data-r]",m).forEach(x=>x.classList.toggle("on",x===b));});
    const add=$("#f-add",m);if(add)add.onclick=()=>{const t=$("#f-t",m).value.trim();if(!t)return;st.tests.push({t,r:res});render();};
    $$("[data-d]",m).forEach(e=>e.onclick=()=>{st.tests.splice(+e.dataset.d,1);render();});
    if(st.step===5){
      const upd=()=>{$("#f-rec",m).textContent=rec();};
      $$("[data-v]",m).forEach(b=>b.onclick=()=>{st.verified=b.dataset.v==="1";$$("[data-v]",m).forEach(x=>x.classList.toggle("on",x===b));upd();
        if(st.verified&&fx()){const r=b.getBoundingClientRect();fx().burst(r.left+r.width/2,r.top+r.height/2,60,300);}});
      v("#f-vn",x=>{st.vnote=x;upd();});
      $("#f-copy",m).onclick=()=>copy(rec(),"Field record copied");
      $("#f-dl",m).onclick=()=>{const b=new Blob([rec()],{type:"text/plain"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=(rec().match(/PDE-[\d-]+/)||["pde-record"])[0]+".txt";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);};
      $("#f-save",m).onclick=()=>{const a=load();a.unshift({ts:Date.now(),text:rec()});if(save(a)){notify("Saved","Field record stored on this device only.");hist();}};
      hist();
    }
  }
  function hist(){
    const el=$("#f-hist",main);if(!el)return;const a=load();
    el.innerHTML=a.length?`<div class="app-section-h">SAVED ON THIS DEVICE (${a.length})</div>`+a.map((r,i)=>`<div class="de-ev"><span class="mono dim">${new Date(r.ts).toLocaleString()}</span><span>${esc((r.text.match(/PDE-[\d-]+/)||[""])[0])}</span><span style="margin-left:auto"><button class="btn" data-cp="${i}">Copy</button> <button class="btn" data-rm="${i}">Delete</button></span></div>`).join(""):"";
    $$("[data-cp]",el).forEach(b=>b.onclick=()=>copy(a[+b.dataset.cp].text,"Saved record copied"));
    $$("[data-rm]",el).forEach(b=>b.onclick=()=>{a.splice(+b.dataset.rm,1);save(a);hist();});
  }
  prev.onclick=()=>{if(st.step>0){st.step--;render();}};
  next.onclick=()=>{
    if(st.step<5){st.step++;render();if(fx()){const r=rail.getBoundingClientRect();fx().burst(r.left+40,r.top+60+st.step*44,16,140);}}
    else{Object.assign(st,{step:0,symptom:"",reporter:"",location:"",env:{hardware:"",os:"",network:"",conditions:[],notes:""},tests:[],fault:"",action:"",verified:null,vnote:""});render();}
  };
  render();
}});

/* ============================================================
   GAUTENG COVERAGE — schematic radar map. Positions approximate; decorative sweep, not live data.
   ============================================================ */
registerApp({id:"pp-coverage",name:"Gauteng Coverage",category:"Company",icon:iconMap,width:760,height:560,
launch(body,win){
  body.classList.add("bleed");
  const nodes=[];Object.entries(CO.areas).forEach(([g,a])=>a.forEach(x=>nodes.push({n:x[0],lat:x[1],lon:x[2],g,hq:x[0]==="Centurion",ping:-9})));
  body.innerHTML=`<div class="cv"><div class="cv-map"><canvas></canvas><div class="cv-badge">GAUTENG OPERATING COVERAGE · SCHEMATIC</div><div class="cv-info" id="cv-info">Positions are approximate. Additional Gauteng locations are serviced according to requirement, availability and scope — not a claim of province-wide unlimited coverage.</div></div><div class="cv-side">${Object.entries(CO.areas).map(([g,a],gi)=>`<h5 class="${gi?"t":""}">${g.toUpperCase()}</h5>${a.map(x=>`<button data-n="${x[0]}">${x[0]}</button>`).join("")}`).join("")}</div></div>`;
  const cv=$("canvas",body),ctx=cv.getContext("2d");let W=0,H=0,dpr=1,sel=null,hov=null,mx=-1,my=-1,raf=0,pos=[];
  const LAT0=-26.27,LAT1=-25.62,LON0=27.8,LON1=28.34,k=Math.cos(26*Math.PI/180);
  function fit(){const r=cv.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;
    const pad=48,sw=(LON1-LON0)*k,sh=LAT1-LAT0,s=Math.min((W-pad*2)/sw,(H-pad*2-20)/Math.abs(sh));
    const ox=(W-sw*s)/2,oy=(H-Math.abs(sh)*s)/2-6;
    pos=nodes.map(n=>({x:ox+(n.lon-LON0)*k*s,y:oy+(LAT1-n.lat)*s*-1*-1}));
    pos=nodes.map(n=>({x:ox+(n.lon-LON0)*k*s,y:oy+(n.lat-LAT1)*-1*s*-1+0}));
    // north up: higher lat (less negative) at top
    pos=nodes.map(n=>({x:ox+(n.lon-LON0)*k*s,y:oy+(LAT1-n.lat)*s}));
    pos=pos.map(p=>({x:p.x,y:p.y}));
  }
  const ro=new ResizeObserver(fit);ro.observe(cv);fit();
  const hq=nodes.findIndex(n=>n.hq);
  cv.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;hov=null;
    pos.forEach((p,i)=>{if(Math.hypot(p.x-mx,p.y-my)<14)hov=i;});cv.style.cursor=hov!==null?"pointer":"default";});
  cv.addEventListener("click",()=>{if(hov!==null)pick(hov);});
  function pick(i){sel=i;$$(".cv-side button",body).forEach(b=>b.classList.toggle("on",b.dataset.n===nodes[i].n));
    $("#cv-info",body).textContent=nodes[i].n+" — "+nodes[i].g+(nodes[i].hq?" · operating base (Centurion, Gauteng).":" · serviced according to requirement, availability and scope.");
    const r=cv.getBoundingClientRect();fx()&&fx().burst(r.left+pos[i].x,r.top+pos[i].y,28,170);}
  $$(".cv-side button",body).forEach(b=>b.onclick=()=>pick(nodes.findIndex(n=>n.n===b.dataset.n)));
  const t0=performance.now();
  function draw(){
    raf=requestAnimationFrame(draw);
    const t=(performance.now()-t0)/1000;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    // contour rings around the HQ
    const h=pos[hq]||{x:W/2,y:H/2};
    ctx.lineWidth=1;
    for(let i=1;i<=6;i++){ctx.strokeStyle=`rgba(0,212,170,${.09-i*.01})`;ctx.beginPath();ctx.arc(h.x,h.y,i*70,0,6.283);ctx.stroke();}
    // radar sweep from Centurion
    const a=(t*.7)%(6.283);
    const g=ctx.createConicGradient?ctx.createConicGradient(a-1.4,h.x,h.y):null;
    if(g){g.addColorStop(0,"rgba(0,212,170,0)");g.addColorStop(.22,"rgba(0,212,170,.22)");g.addColorStop(.222,"rgba(0,212,170,0)");g.addColorStop(1,"rgba(0,212,170,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(h.x,h.y,Math.hypot(W,H),0,6.283);ctx.fill();}
    // arcs HQ -> nodes with travelling pixels
    nodes.forEach((n,i)=>{if(i===hq)return;const p=pos[i],mxp=(h.x+p.x)/2,myp=(h.y+p.y)/2-Math.hypot(p.x-h.x,p.y-h.y)*.22;
      ctx.strokeStyle=n.g==="Johannesburg"?"rgba(123,47,255,.45)":"rgba(0,212,170,.4)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(h.x,h.y);ctx.quadraticCurveTo(mxp,myp,p.x,p.y);ctx.stroke();
      const u=((t*.35+i*.173)%1),q=1-u,x=q*q*h.x+2*q*u*mxp+u*u*p.x,y=q*q*h.y+2*q*u*myp+u*u*p.y;
      ctx.fillStyle="#fff";ctx.fillRect(x-1.5,y-1.5,3,3);});
    // nodes
    nodes.forEach((n,i)=>{const p=pos[i];
      let ang=Math.atan2(p.y-h.y,p.x-h.x);if(ang<0)ang+=6.283;const d=((a-ang)%6.283+6.283)%6.283;if(d<.05&&n.ping<t-1)n.ping=t;
      const col=n.hq?"#D8B96A":n.g==="Johannesburg"?"#A66BFF":"#00D4AA",pr=(t-n.ping);
      if(pr>=0&&pr<1.6){ctx.strokeStyle=col;ctx.globalAlpha=1-pr/1.6;ctx.beginPath();ctx.arc(p.x,p.y,8+pr*30,0,6.283);ctx.stroke();ctx.globalAlpha=1;}
      const r=(n.hq?7:4.5)+(hov===i||sel===i?2.5:0);
      ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=14;ctx.beginPath();
      for(let k2=0;k2<6;k2++){const aa=-Math.PI/2+k2*Math.PI/3;ctx.lineTo(p.x+r*Math.cos(aa),p.y+r*Math.sin(aa));}ctx.closePath();ctx.fill();ctx.shadowBlur=0;
      ctx.font="500 10px 'JetBrains Mono',monospace";ctx.fillStyle=hov===i||sel===i||n.hq?"#fff":"rgba(241,238,250,.65)";
      const left=p.x>W-90||n.n==="Pretoria CBD";ctx.textAlign=left?"right":"left";ctx.fillText((n.hq?"◆ ":"")+n.n.toUpperCase(),p.x+(left?-r-6:r+6),p.y+3.5);});
  }
  draw();win.onClose(()=>{cancelAnimationFrame(raf);ro.disconnect();});
}});

/* ============================================================
   PIXEL REACTOR — instanced hex-prism lattice (WebGL2). Generative visual; labelled as such.
   Optional live microphone drives the heights locally (nothing recorded or sent).
   ============================================================ */
registerApp({id:"pp-reactor",name:"Pixel Reactor",category:"Visual Lab",icon:iconReactor,width:940,height:620,
launch(body,win){
  body.classList.add("bleed");
  body.innerHTML=`<div class="rx"><canvas></canvas><div class="rx-hud"><button class="btn" id="rx-diag">▶ Run diagnostic demo</button><button class="btn" id="rx-mic">Mic reactive: off</button><button class="btn" id="rx-orb">Auto-orbit: on</button></div><div class="rx-stage" id="rx-stage"></div><div class="rx-note">GENERATIVE VISUAL · NOT TELEMETRY · DRAG TO ORBIT · SCROLL TO ZOOM · MOVE TO RIPPLE · CLICK FOR SHOCKWAVE</div></div>`;
  const cv=$("canvas",body),gl=cv.getContext("webgl2",{antialias:true});
  if(!gl){$(".rx",body).insertAdjacentHTML("beforeend",'<div class="rx-err">WebGL2 is not available in this browser, so the reactor cannot run here.</div>');return;}
  const COLS=60,ROWS=42,R=.5;
  const VS=`#version 300 es
precision highp float;
in vec3 aPos;in vec3 aNrm;in vec2 aAux;
uniform mat4 uVP;uniform float uT,uAmp;uniform vec3 uM;uniform vec3 uP[4];uniform float uAud[16];uniform float uLvl;uniform vec4 uD;
out vec3 vN;out vec2 vA;out float vH;out float vF;out float vS;out float vDist;out vec3 vW;
float hs(float n){return fract(sin(n*12.9898)*43758.5453);}
void main(){
 int id=gl_InstanceID;int col=id%${COLS},row=id/${COLS};
 float dx=1.7320508*${R.toFixed(2)},dz=1.5*${R.toFixed(2)};
 vec2 c=vec2((float(col)+.5*float(row&1)-${(COLS/2).toFixed(1)})*dx,(float(row)-${(ROWS/2).toFixed(1)})*dz);
 float r=length(c);
 float h=.5+.28*sin(c.x*.33+uT*.8)+.22*sin(c.y*.41-uT*.62)+.2*sin(r*.45-uT*1.5);
 float band=uAud[int(clamp(floor(r/24.*16.),0.,15.))];
 h+=band*3.2+uLvl*.6;
 float dm=distance(c,uM.xy);
 h+=uM.z*(2.2*exp(-dm*dm/5.)+.45*sin(dm*2.4-uT*9.)*exp(-dm*.45));
 for(int i=0;i<4;i++){float age=uT-uP[i].z;if(age>0.&&age<4.){float rr=age*13.;float dd=distance(c,uP[i].xy);h+=3.4*exp(-(dd-rr)*(dd-rr)/2.)*(1.-age/4.);}}
 // diagnostic demo
 float F=0.,S=0.;
 if(uD.x>.5){
  float dt=uT-uD.y,isF=step(.9,hs(float(id)*1.37)),hh=hs(float(id)*3.1);
  float rep=max(0.,dt-4.8)*9.;
  F=isF*smoothstep(0.,1.4,dt)*(1.-step(r,rep))*(1.-step(8.6,dt));
  h+=F*(1.4+2.2*hh)*(.65+.35*sin(uT*28.+float(id)));
  float sr=(dt-1.4)*9.;S=exp(-(r-sr)*(r-sr)/1.6)*step(1.4,dt)*step(dt,4.2);
  float rr2=exp(-(r-rep)*(r-rep)/1.6)*step(4.8,dt)*step(dt,8.);S=max(S,rr2);
  float ver=smoothstep(6.8,7.2,dt)*(1.-smoothstep(7.8,8.6,dt));S=max(S,ver*.9);
 }
 h*=uAmp;h=max(h,.08);
 vec3 p=vec3(aPos.x+c.x,aPos.y*h,aPos.z+c.y);
 vN=aNrm;vA=aAux;vH=h;vF=F;vS=S;vW=p;vDist=r;
 gl_Position=uVP*vec4(p,1.);}`;
  const FS=`#version 300 es
precision highp float;
in vec3 vN;in vec2 vA;in float vH;in float vF;in float vS;in float vDist;in vec3 vW;
uniform vec3 uCam;uniform float uT;out vec4 o;
void main(){
 vec3 PP=vec3(.482,.184,1.),TL=vec3(0.,.831,.667),GD=vec3(.847,.725,.416),RD=vec3(1.,.3,.3);
 float k=clamp(vH/3.2,0.,1.);
 vec3 base=mix(PP*.55,TL*.9,smoothstep(.1,.55,k));base=mix(base,GD,smoothstep(.6,1.,k));
 base=mix(base,RD,vF);
 float top=step(.5,vN.y);
 float L=.4+.6*max(dot(normalize(vN),normalize(vec3(.4,.8,.3))),0.);
 vec3 col=base*L*(top>.5?1.15:.5+.5*vA.y);
 float rim=top>.5?smoothstep(.76,1.,vA.x):smoothstep(.88,1.,vA.y);
 col+=mix(TL,vec3(1.),vS)*rim*(.55+1.5*vS+vF*.6);
 col+=vS*TL*.55*top;
 float fog=1.-exp(-length(vW-uCam)*.011);
 col=mix(col,vec3(.02,.02,.032),fog*.85);
 o=vec4(col,1.);}`;
  function mk(t,s){const x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(x));}return x;}
  const pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){$(".rx",body).insertAdjacentHTML("beforeend",'<div class="rx-err">The reactor shader failed to compile on this device.</div>');return;}
  gl.useProgram(pr);
  // hex prism geometry
  const pos=[],nrm=[],aux=[];
  const V=[];for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;V.push([R*Math.cos(a),R*Math.sin(a)]);}
  const R0=R*.94;V.forEach((v,i)=>{V[i]=[v[0]*.94,v[1]*.94];});
  for(let i=0;i<6;i++){const a=V[i],b=V[(i+1)%6];
    [[0,0,0],[a[0],a[1],1],[b[0],b[1],1]].forEach(q=>{pos.push(q[0],1,q[1]);nrm.push(0,1,0);aux.push(q[2],1);});}
  for(let i=0;i<6;i++){const a=V[i],b=V[(i+1)%6],ma=Math.PI/6+(i+.5)*Math.PI/3,nx=Math.cos(ma),nz=Math.sin(ma);
    [[a,0],[b,0],[b,1],[a,0],[b,1],[a,1]].forEach(q=>{pos.push(q[0][0],q[1],q[0][1]);nrm.push(nx,0,nz);aux.push(0,q[1]);});}
  const nv=pos.length/3;
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  [["aPos",pos,3],["aNrm",nrm,3],["aAux",aux,2]].forEach(([n,d,s])=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW);const l=gl.getAttribLocation(pr,n);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,s,gl.FLOAT,false,0,0);});
  const U={};["uVP","uT","uAmp","uM","uP","uAud","uLvl","uD","uCam"].forEach(n=>U[n]=gl.getUniformLocation(pr,n));
  // camera
  const cam={yaw:.6,pitch:.62,dist:40},drag={on:false,x:0,y:0,moved:0};let orbit=true;
  const mouse={nx:0,ny:0,in:false,act:0},gm=[0,0];
  const pulses=[[0,0,-99],[0,0,-99],[0,0,-99],[0,0,-99]];let pi=0;
  const aud=new Float32Array(16);let lvl=0,analyser=null,stream=null,actx=null;
  let diagT0=-99,diagOn=0;const stageEl=$("#rx-stage",body);
  const t0=performance.now();let raf=0,last=t0;
  function mul(a,b){const o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;}
  function persp(f,a,n,fa){const t=1/Math.tan(f/2),m=new Float32Array(16);m[0]=t/a;m[5]=t;m[10]=(fa+n)/(n-fa);m[11]=-1;m[14]=2*fa*n/(n-fa);return m;}
  function look(e,c,u){let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];let l=Math.hypot(...z);z=z.map(v=>v/l);
    let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];l=Math.hypot(...x);x=x.map(v=>v/l);
    const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*e[0]+x[1]*e[1]+x[2]*e[2]),-(y[0]*e[0]+y[1]*e[1]+y[2]*e[2]),-(z[0]*e[0]+z[1]*e[1]+z[2]*e[2]),1]);}
  const FOV=.8;
  function ground(nx,ny,eye,asp){ // ray from camera through ndc -> y=0 plane
    const f=[-eye[0],-eye[1]+1,-eye[2]];let l=Math.hypot(...f);const F=f.map(v=>v/l);
    let rt=[F[1]*0-F[2]*1,F[2]*0-F[0]*0,F[0]*1-F[1]*0];rt=[-F[2],0,F[0]];l=Math.hypot(...rt);rt=rt.map(v=>v/l);
    const up=[rt[1]*F[2]-rt[2]*F[1],rt[2]*F[0]-rt[0]*F[2],rt[0]*F[1]-rt[1]*F[0]];
    const th=Math.tan(FOV/2),d=[F[0]+nx*th*asp*rt[0]+ny*th*up[0],F[1]+nx*th*asp*rt[1]+ny*th*up[1],F[2]+nx*th*asp*rt[2]+ny*th*up[2]];
    if(d[1]>=-1e-4)return null;const tt=-eye[1]/d[1];return[eye[0]+d[0]*tt,eye[2]+d[2]*tt];}
  function size(){const r=cv.getBoundingClientRect(),dp=Math.min(devicePixelRatio||1,2),w=Math.max(2,r.width*dp|0),h=Math.max(2,r.height*dp|0);if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}}
  cv.addEventListener("pointerdown",e=>{drag.on=true;drag.x=e.clientX;drag.y=e.clientY;drag.moved=0;cv.setPointerCapture(e.pointerId);});
  cv.addEventListener("pointermove",e=>{const r=cv.getBoundingClientRect();mouse.nx=(e.clientX-r.left)/r.width*2-1;mouse.ny=-((e.clientY-r.top)/r.height*2-1);mouse.in=true;
    if(drag.on){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved+=Math.abs(dx)+Math.abs(dy);cam.yaw-=dx*.006;cam.pitch=clamp(cam.pitch+dy*.005,.15,1.4);drag.x=e.clientX;drag.y=e.clientY;}});
  cv.addEventListener("pointerup",e=>{if(drag.on&&drag.moved<5&&gm){pulses[pi%4]=[gm[0],gm[1],(performance.now()-t0)/1000];pi++;}drag.on=false;});
  cv.addEventListener("pointerleave",()=>{mouse.in=false;});
  cv.addEventListener("wheel",e=>{e.preventDefault();cam.dist=clamp(cam.dist*(1+Math.sign(e.deltaY)*.08),14,80);},{passive:false});
  $("#rx-orb",body).onclick=e=>{orbit=!orbit;e.target.textContent="Auto-orbit: "+(orbit?"on":"off");};
  $("#rx-diag",body).onclick=()=>{diagT0=(performance.now()-t0)/1000;diagOn=1;};
  $("#rx-mic",body).onclick=async e=>{
    if(analyser){stop();e.target.textContent="Mic reactive: off";return;}
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true});actx=new(window.AudioContext||window.webkitAudioContext)();
      const s=actx.createMediaStreamSource(stream);analyser=actx.createAnalyser();analyser.fftSize=128;s.connect(analyser);e.target.textContent="Mic reactive: ON (local only)";}
    catch(err){notify("Microphone","Permission denied or unavailable — the reactor keeps running on its own waves.");}
  };
  function stop(){if(stream)stream.getTracks().forEach(t=>t.stop());if(actx)actx.close();analyser=stream=actx=null;aud.fill(0);lvl=0;}
  const stages=[[0,"01 SYMPTOM"],[1.4,"02 ENVIRONMENT"],[2.4,"03 TEST"],[3.8,"04 FAULT"],[4.8,"05 ACTION"],[6.8,"06 VERIFICATION"],[8.6,""]];
  gl.enable(gl.DEPTH_TEST);
  const buf=new Uint8Array(64);
  function frame(){
    raf=requestAnimationFrame(frame);
    const nowp=performance.now(),t=(nowp-t0)/1000,dt=Math.min(.05,(nowp-last)/1000);last=nowp;
    if(!$("canvas",body)||!body.isConnected)return;
    size();
    if(orbit&&!drag.on)cam.yaw+=dt*.07;
    if(analyser){analyser.getByteFrequencyData(buf);let s=0;for(let i=0;i<16;i++){const v=(buf[i*2]+buf[i*2+1])/510;aud[i]+=(v-aud[i])*.4;s+=v;}lvl+=(s/16-lvl)*.3;}
    if(diagOn){const d=t-diagT0;let lab="";stages.forEach(s=>{if(d>=s[0])lab=s[1];});stageEl.textContent=lab&&d<8.6?lab:"";if(d>9){diagOn=0;stageEl.textContent="";}}
    const eye=[Math.sin(cam.yaw)*Math.cos(cam.pitch)*cam.dist,Math.sin(cam.pitch)*cam.dist,Math.cos(cam.yaw)*Math.cos(cam.pitch)*cam.dist];
    const asp=cv.width/cv.height,vp=mul(persp(FOV,asp,.5,300),look(eye,[0,1,0],[0,1,0]));
    if(mouse.in){const g=ground(mouse.nx,mouse.ny,eye,asp);if(g){gm[0]=g[0];gm[1]=g[1];}mouse.act+=(1-mouse.act)*.15;}else mouse.act*=.92;
    gl.viewport(0,0,cv.width,cv.height);gl.clearColor(.02,.02,.032,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(pr);gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(U.uVP,false,vp);gl.uniform1f(U.uT,t);gl.uniform1f(U.uAmp,1);gl.uniform3f(U.uM,gm[0],gm[1],drag.on?0:mouse.act);
    gl.uniform3fv(U.uP,new Float32Array(pulses.flat()));gl.uniform1fv(U.uAud,aud);gl.uniform1f(U.uLvl,lvl);gl.uniform4f(U.uD,diagOn,diagT0,0,0);gl.uniform3f(U.uCam,eye[0],eye[1],eye[2]);
    gl.drawArraysInstanced(gl.TRIANGLES,0,nv,COLS*ROWS);
  }
  frame();
  win.onClose(()=>{cancelAnimationFrame(raf);raf=0;stop();const ext=gl.getExtension("WEBGL_lose_context");if(ext)ext.loseContext();});
}});

})();
