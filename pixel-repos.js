/* PIXEL REPOS — every PixelProTech-ZA web repo, running inside PixelProTech OS.
   Each repo was compiled into ONE offline file (app-<name>.html); the OS opens it in a window.
   Repos that cannot run in a browser (native desktop / Android) are listed honestly, never faked. */
(function(){
"use strict";
const OS=window.PixelOS;
if(!OS||!OS.api) return;
const {registerApp,openWindow,escapeHtml:esc}=OS.api;
const ORG="https://github.com/PixelProTech-ZA/";
const REPOS=[
{
"id": "app-bulk-email",
"repo": "Bulk-Email-Sender",
"name": "Bulk Email Sender",
"cat": "Office",
"w": 560,
"h": 700,
"file": "app-bulk-email.html",
"desc": "Batch recipient lists into mailto links.",
"note": "",
"mode": "capsule"
},
{
"id": "app-on-site-bios",
"repo": "ON-SITE-BIOS",
"name": "On-Site BIOS",
"cat": "Field Tech",
"w": 900,
"h": 640,
"file": "app-on-site-bios.html",
"desc": "Field diagnostic and decision system for on-site computer technicians.",
"note": "",
"mode": "capsule"
},
{
"id": "app-onyx",
"repo": "Onyx",
"name": "Onyx",
"cat": "Internet",
"w": 1000,
"h": 660,
"file": "app-onyx.html",
"desc": "Onyx — an operating workspace for browsing, projects, knowledge and development, by PixelProTech Solutions.",
"note": "Desktop (Electron) features need the native build; the web view runs here.",
"mode": "capsule"
},
{
"id": "app-pixel-calendar",
"repo": "PIXEL-CALENDAR",
"name": "Pixel Calendar",
"cat": "Tools",
"w": 960,
"h": 660,
"file": "app-pixel-calendar.html",
"desc": "Pixel Calendar — a local-first temporal instrument by PixelProTech Solutions.",
"note": "",
"mode": "capsule"
},
{
"id": "app-office-hr",
"repo": "PIXEL-OFFICE-HR-by-PixelProTech",
"name": "Pixel Office HR",
"cat": "Office",
"w": 960,
"h": 660,
"file": "app-office-hr.html",
"desc": "HR admin for small offices.",
"note": "",
"mode": "capsule"
},
{
"id": "app-warehouse-pro",
"repo": "PIXEL-WAREHOUSE-PRO",
"name": "Warehouse Pro",
"cat": "Office",
"w": 960,
"h": 660,
"file": "app-warehouse-pro.html",
"desc": "Browser-based warehouse receiving, inventory and barcode scanning platform by PixelProTech Solutions.",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-weather",
"repo": "PIXEL-WEATHER",
"name": "Pixel Weather",
"cat": "Tools",
"w": 900,
"h": 660,
"file": "app-pixel-weather.html",
"desc": "Pixel Weather — a living weather instrument by PixelProTech Solutions.",
"note": "",
"mode": "capsule"
},
{
"id": "app-mobile-academy",
"repo": "PIXELPROTECH-MOBILE-ACADEMY-PRO",
"name": "Mobile Academy Pro",
"cat": "Learn",
"w": 900,
"h": 660,
"file": "app-mobile-academy.html",
"desc": "PixelProTech Mobile Academy Pro — Learn, Diagnose, Repair, Upgrade smartphones professionally.",
"note": "",
"mode": "capsule"
},
{
"id": "app-community-radar",
"repo": "Pixel-Community-Radar",
"name": "Community Radar",
"cat": "Network",
"w": 960,
"h": 660,
"file": "app-community-radar.html",
"desc": "Live community intelligence platform. See what",
"note": "",
"mode": "capsule"
},
{
"id": "app-invoice-pro",
"repo": "Pixel-Invoice-Pro",
"name": "Invoice Pro",
"cat": "Office",
"w": 900,
"h": 660,
"file": "app-invoice-pro.html",
"desc": "Business & invoicing academy.",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-link",
"repo": "Pixel-Link",
"name": "Pixel Link",
"cat": "Network",
"w": 900,
"h": 660,
"file": "app-pixel-link.html",
"desc": "Securely connect and sync your desktop and phone — files, clipboard, notes, camera, and more, peer-to-peer.",
"note": "",
"mode": "capsule"
},
{
"id": "app-wake-os",
"repo": "Pixel-Wake-OS",
"name": "Wake OS",
"cat": "Tools",
"w": 640,
"h": 660,
"file": "app-wake-os.html",
"desc": "The morning operating system. Built by PixelProTech Solutions.",
"note": "",
"mode": "capsule"
},
{
"id": "app-smart-storage",
"repo": "PixelProTech-Solutions-Smart-Storage-Management-Mobile-Maintenance",
"name": "Smart Storage",
"cat": "Field Tech",
"w": 900,
"h": 660,
"file": "app-smart-storage.html",
"desc": "PixelProTech Solutions - Smart Mobile Storage Assistant for technicians and everyday users",
"note": "Android build (Capacitor) is the native form; the web app runs here.",
"mode": "capsule"
},
{
"id": "app-pixelview-pro",
"repo": "PixelViewPro",
"name": "PixelView Pro",
"cat": "Media",
"w": 1000,
"h": 660,
"file": "app-pixelview-pro.html",
"desc": "View, organise, explore.",
"note": "",
"mode": "capsule"
},
{
"id": "app-technician-command",
"repo": "Technician-Sign-In",
"name": "Technician Command Centre",
"cat": "Field Tech",
"w": 1000,
"h": 680,
"file": "app-technician-command.html",
"desc": "Repair intake, diagnostics and dispute-shield evidence.",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-vault",
"repo": "pixel-vault",
"name": "Pixel Vault",
"cat": "Tools",
"w": 900,
"h": 660,
"file": "app-pixel-vault.html",
"desc": "Local-first idea, code, and knowledge vault. Built by PixelProTech Solutions.",
"note": "",
"mode": "capsule"
},
{
"id": "app-free-tv",
"repo": "pixelpro-free-tv",
"name": "Free TV",
"cat": "Media",
"w": 1000,
"h": 660,
"file": "app-free-tv.html",
"desc": "South Africa",
"note": "Streams need a network connection.",
"mode": "capsule"
},
{
"id": "app-academy",
"repo": "pixelprotech-academy",
"name": "Academy",
"cat": "Learn",
"w": 900,
"h": 660,
"file": "app-academy.html",
"desc": "Digital skills courses.",
"note": "",
"mode": "capsule"
},
{
"id": "app-cert-forge",
"repo": "pixelprotech-cert-forge",
"name": "Certificate Forge",
"cat": "Office",
"w": 960,
"h": 660,
"file": "app-cert-forge.html",
"desc": "Forge certificates.",
"note": "",
"mode": "capsule"
},
{
"id": "app-cv-builder",
"repo": "pixelprotech-cv-builder",
"name": "CV Builder",
"cat": "Office",
"w": 960,
"h": 680,
"file": "app-cv-builder.html",
"desc": "Free CV Builder by Pixel Pro Tech Solutions – Build a professional CV in 60 seconds. South Africa",
"note": "",
"mode": "capsule"
},
{
"id": "app-diagnostic",
"repo": "pixelprotech-diagnostic",
"name": "Diagnostic",
"cat": "Field Tech",
"w": 860,
"h": 640,
"file": "app-diagnostic.html",
"desc": "System diagnostic scan.",
"note": "Hardware scan needs the desktop (Electron) build; this window says so honestly when it is missing.",
"mode": "capsule"
},
{
"id": "app-remote-assistant",
"repo": "pixelprotech-remote-assistant",
"name": "Remote Assistant",
"cat": "Field Tech",
"w": 900,
"h": 660,
"file": "app-remote-assistant.html",
"desc": "Professional remote device diagnostics — camera, microphone, speaker, screen, network, GPS, motion and AI-assisted reporting, installable on any device.",
"note": "",
"mode": "capsule"
},
{
"id": "app-technician-os",
"repo": "pixelprotech-technician-os",
"name": "Technician OS",
"cat": "Field Tech",
"w": 1000,
"h": 680,
"file": "app-technician-os.html",
"desc": "Technician workstation toolkit.",
"note": "",
"mode": "capsule"
},
{
"id": "app-html-workspace",
"repo": "x-Note-HTML-",
"name": "HTML Workspace",
"cat": "Dev",
"w": 1000,
"h": 660,
"file": "app-html-workspace.html",
"desc": "Write, run, and understand HTML. Learn at your own pace, or just get the job done.",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-code",
"repo": "x-Pixel-Code",
"name": "Pixel Code",
"cat": "Dev",
"w": 960,
"h": 660,
"file": "app-pixel-code.html",
"desc": "Learn real JavaScript on a signal bench — every lesson",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-diagnose",
"repo": "x-Pixel-Diagnose",
"name": "Pixel Diagnose",
"cat": "Field Tech",
"w": 900,
"h": 660,
"file": "app-pixel-diagnose.html",
"desc": "Real repair case files. Investigate a broken machine, find the fault, learn what every part actually does.",
"note": "",
"mode": "capsule"
},
{
"id": "app-html-learning",
"repo": "x-Pixel-HTML-Learning",
"name": "HTML Learning",
"cat": "Learn",
"w": 900,
"h": 660,
"file": "app-html-learning.html",
"desc": "Pixel HTML Learning — build it, see it, understand it.",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-rescue",
"repo": "Pixel-Rescue",
"name": "Pixel Rescue",
"cat": "Field Tech",
"w": 760,
"h": 680,
"file": "app-pixel-rescue.html",
"desc": "First aid for dead devices: what to stop, what is safe to try, when to hand over.",
"note": "",
"mode": "capsule"
},
{
"id": "app-pixel-wifi",
"repo": "PIXEL-WiFi",
"name": "Pixel WiFi",
"cat": "Network",
"w": 960,
"h": 680,
"file": "app-pixel-wifi.html",
"desc": "A real Wi-Fi and network diagnostic laboratory. See your connection, understand your network, know what to do next.",
"note": "Deep readings need the optional local bridge; without it the app reports NOT TESTABLE.",
"mode": "capsule"
},
{
"id": "app-pixel-office",
"repo": "Pixel-Office",
"name": "Pixel Office",
"cat": "Office",
"w": 1000,
"h": 680,
"file": "app-pixel-office.html",
"desc": "Office suite for schools and labs.",
"note": "",
"mode": "capsule"
},
{
"id": "app-globe-cameras",
"repo": "globe-cameras",
"name": "Globe Cameras",
"cat": "Internet",
"w": 1000,
"h": 680,
"file": "app-globe-cameras.html",
"desc": "Explore legitimate public cameras from around the world on one geographic interface. Real feeds, honest status, no fake data.",
"note": "Camera streams need a network connection.",
"mode": "capsule"
},
{
"id": "app-drive-manager",
"repo": "PixelProTech-DriveManager",
"name": "Drive Manager",
"cat": "Field Tech",
"w": 640,
"h": 520,
"file": "",
"desc": "Python desktop tool for USB and drive work (Windows).",
"note": "NATIVE BRIDGE REQUIRED",
"mode": "native"
},
{
"id": "app-freetv-android",
"repo": "pixelpro-freetv-android",
"name": "Free TV for Android",
"cat": "Media",
"w": 640,
"h": 520,
"file": "",
"desc": "Android APK wrapper of Free TV. The same content already runs in the OS as Free TV.",
"note": "ANDROID PACKAGE",
"mode": "native"
}
];

/* ---- one hand-drawn pictogram per app (same stroke language as the OS icons); seeded generative mark only as fallback for future repos ---- */
function seed(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return()=>{h^=h<<13;h>>>=0;h^=h>>>17;h^=h<<5;h>>>=0;return h/4294967296;};}
const PICTO={"app-bulk-email": "<rect x=\"3.5\" y=\"7\" width=\"17\" height=\"12\" rx=\"2\"/><path d=\"M4 8.5l8 6 8-6M7 4h10\"/>", "app-on-site-bios": "<rect x=\"7\" y=\"7\" width=\"10\" height=\"10\" rx=\"1.5\"/><path d=\"M10 3.5v3.5M14 3.5v3.5M10 17v3.5M14 17v3.5M3.5 10H7M3.5 14H7M17 10h3.5M17 14h3.5\"/>", "app-onyx": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"14\" rx=\"2\"/><path d=\"M3.5 9h17M7 7h.01M10 7h.01\"/><path d=\"M9 15.5l2-3 2 2 2-3\"/>", "app-pixel-calendar": "<rect x=\"4\" y=\"5.5\" width=\"16\" height=\"14.5\" rx=\"2\"/><path d=\"M4 10h16M8.5 3.5v4M15.5 3.5v4M8 14h2M12 14h2M16 14h.01\"/>", "app-office-hr": "<circle cx=\"9\" cy=\"9\" r=\"3\"/><path d=\"M3.5 19c.5-3.5 3-5 5.5-5s5 1.5 5.5 5\"/><circle cx=\"17\" cy=\"8\" r=\"2.2\"/><path d=\"M16 13.2c2.6-.2 4.2 1.4 4.5 4.3\"/>", "app-warehouse-pro": "<path d=\"M12 3.5l8 4v9l-8 4-8-4v-9z\"/><path d=\"M4 7.5l8 4 8-4M12 11.5v9\"/>", "app-pixel-weather": "<path d=\"M7 18.5h9.5a3.7 3.7 0 0 0 .4-7.4A5 5 0 0 0 7.3 10 4.2 4.2 0 0 0 7 18.5z\"/><path d=\"M17.5 4.5l-.7 1.2M21 8.5l-1.3.4M13.5 3.6l.2 1.3\"/>", "app-mobile-academy": "<rect x=\"7\" y=\"3\" width=\"10\" height=\"18\" rx=\"2\"/><path d=\"M10 7.5l2-1 2 1-2 1zM10.6 9.2v1.3c.4.4 2.4.4 2.8 0V9.2M11 18h2\"/>", "app-community-radar": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"4.5\"/><path d=\"M12 12l5.5-5.5\"/><circle cx=\"12\" cy=\"12\" r=\"1\" fill=\"currentColor\"/>", "app-invoice-pro": "<path d=\"M6 3.5h12v17l-2.5-1.7-1.8 1.7-1.7-1.7-1.8 1.7-1.7-1.7L6 20.5z\"/><path d=\"M9 8h6M9 11.5h6M9 15h3\"/>", "app-pixel-link": "<path d=\"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1\"/><path d=\"M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1\"/>", "app-wake-os": "<path d=\"M12 3.5v8\"/><path d=\"M7 6.5a8 8 0 1 0 10 0\"/>", "app-smart-storage": "<ellipse cx=\"12\" cy=\"6\" rx=\"7.5\" ry=\"2.8\"/><path d=\"M4.5 6v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12v6c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-6\"/>", "app-pixelview-pro": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"14\" rx=\"2\"/><circle cx=\"9\" cy=\"10\" r=\"1.6\"/><path d=\"M4 17l5-4.5 4 3.5 3-2.5 4 3.5\"/>", "app-technician-command": "<path d=\"M20 7.5a4.5 4.5 0 0 1-6 4.2L7 18.7A2 2 0 0 1 4.2 16l7-7A4.5 4.5 0 0 1 16.5 3l-2.8 2.8 1.5 1.5z\"/>", "app-pixel-vault": "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"15\" rx=\"2\"/><circle cx=\"12\" cy=\"12\" r=\"3.5\"/><path d=\"M12 8.5v1.2M12 14.3v1.2M8.5 12h1.2M14.3 12h1.2M7 19.5v1.5M17 19.5v1.5\"/>", "app-free-tv": "<rect x=\"3.5\" y=\"6.5\" width=\"17\" height=\"12\" rx=\"2\"/><path d=\"M8.5 3.5l3.5 3 3.5-3M9.5 21h5\"/>", "app-academy": "<path d=\"M2.5 9.5L12 5l9.5 4.5L12 14z\"/><path d=\"M6.5 11.8v4.2c0 1.2 2.5 2.5 5.5 2.5s5.5-1.3 5.5-2.5v-4.2M21.5 9.5v5\"/>", "app-cert-forge": "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"12\" rx=\"1.8\"/><path d=\"M7.5 9h9M7.5 12h5\"/><circle cx=\"16\" cy=\"17.5\" r=\"2.3\"/><path d=\"M14.8 19.5l-.8 2 2-1 2 1-.8-2\"/>", "app-cv-builder": "<path d=\"M7 3.5h7.5L19 8v12.5H7z\"/><path d=\"M14.5 3.5V8H19\"/><circle cx=\"12\" cy=\"12.2\" r=\"1.7\"/><path d=\"M9 17.5c.3-1.8 1.5-2.7 3-2.7s2.7.9 3 2.7\"/>", "app-diagnostic": "<path d=\"M3 12h4l2-5 4 10 2-5h6\"/>", "app-remote-assistant": "<path d=\"M4.5 14v-2a7.5 7.5 0 0 1 15 0v2\"/><rect x=\"3.5\" y=\"13.5\" width=\"3.5\" height=\"5.5\" rx=\"1.2\"/><rect x=\"17\" y=\"13.5\" width=\"3.5\" height=\"5.5\" rx=\"1.2\"/><path d=\"M18.5 19c0 1.5-2 2-5 2\"/>", "app-technician-os": "<rect x=\"3.5\" y=\"8\" width=\"17\" height=\"11\" rx=\"2\"/><path d=\"M9 8V6a1.5 1.5 0 0 1 1.500-1.5h3A1.500 1.500 0 0 1 15 6v2M3.500 13h17M11 13v2h2v-2\"/>", "app-html-workspace": "<path d=\"M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14\"/>", "app-pixel-code": "<rect x=\"3.5\" y=\"5\" width=\"17\" height=\"14\" rx=\"2\"/><path d=\"M7.5 10l3 2.5-3 2.5M12.5 15h4\"/>", "app-pixel-diagnose": "<circle cx=\"10.5\" cy=\"10.5\" r=\"6\"/><path d=\"M15 15l5 5M7.5 10.5h1.8l1-2 1.4 4 .9-2h1\"/>", "app-html-learning": "<path d=\"M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5v13c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z\"/><path d=\"M12 6v13.5\"/>", "app-pixel-rescue": "<circle cx=\"12\" cy=\"12\" r=\"8.5\"/><circle cx=\"12\" cy=\"12\" r=\"3.6\"/><path d=\"M6 6l3.5 3.5M18 6l-3.5 3.5M6 18l3.5-3.5M18 18l-3.5-3.5\"/>", "app-pixel-wifi": "<path d=\"M3.5 9.5a12 12 0 0 1 17 0M6.5 12.8a7.7 7.7 0 0 1 11 0M9.4 16a3.5 3.5 0 0 1 5.2 0\"/><circle cx=\"12\" cy=\"19\" r=\"1\" fill=\"currentColor\"/>", "app-pixel-office": "<rect x=\"3.5\" y=\"4.5\" width=\"17\" height=\"11\" rx=\"2\"/><path d=\"M9 20h6M12 15.5V20M7 9h6M7 12h10\"/>", "app-globe-cameras": "<circle cx=\"11\" cy=\"11\" r=\"7.5\"/><path d=\"M3.5 11h15M11 3.5c2.600 2.700 2.600 12.300 0 15M11 3.5c-2.600 2.700-2.600 12.300 0 15\"/><circle cx=\"17.500\" cy=\"17.500\" r=\"2.700\"/>", "app-drive-manager": "<rect x=\"9\" y=\"3.5\" width=\"6\" height=\"7\" rx=\"1\"/><path d=\"M10.800 6.500h.01M13.200 6.500h.01\"/><rect x=\"7\" y=\"10.500\" width=\"10\" height=\"10\" rx=\"2\"/>", "app-freetv-android": "<rect x=\"7\" y=\"3\" width=\"10\" height=\"18\" rx=\"2\"/><path d=\"M10 8.500l5 3.500-5 3.500z\"/>"};
function emblem(id){
  if(PICTO[id]) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${PICTO[id]}</svg>`;
  return genEmblem(id);
}
function genEmblem(id){
  const r=seed(id),f=n=>n.toFixed(2);
  const sides=3+Math.floor(r()*5), rot=r()*Math.PI*2, rad=3.6+r()*1.9;
  let poly="";for(let i=0;i<sides;i++){const a=rot+i*2*Math.PI/sides;poly+=(i?"L":"M")+f(12+Math.cos(a)*rad)+" "+f(12+Math.sin(a)*rad);}poly+="Z";
  const ticks=2+Math.floor(r()*3);let t="";
  for(let i=0;i<ticks;i++){const a=r()*Math.PI*2,r1=6.1,r2=6.1+1.1+r()*1.1;t+=`M${f(12+Math.cos(a)*r1)} ${f(12+Math.sin(a)*r1)}L${f(12+Math.cos(a)*r2)} ${f(12+Math.sin(a)*r2)}`;}
  const va=rot+Math.floor(r()*sides)*2*Math.PI/sides, dx=12+Math.cos(va)*rad, dy=12+Math.sin(va)*rad;
  const hexOpen=Math.floor(r()*6); // one hex edge left open: the "aperture" gap, different on every app
  const pts=[];for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;pts.push([12+Math.cos(a)*9.4,12+Math.sin(a)*9.4]);}
  let hex="";for(let i=0;i<6;i++){if(i===hexOpen)continue;const p=pts[i],q=pts[(i+1)%6];hex+=`M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`;}
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="${hex}"/><path d="${poly}"/><path d="${t}" opacity=".7"/><circle cx="${f(dx)}" cy="${f(dy)}" r="1.15" fill="currentColor" stroke="none"/></svg>`;
}

/* ---- register every repo as an OS app ---- */
const ALLOW="fullscreen; autoplay; gamepad; wake-lock; camera; microphone; geolocation; clipboard-read; clipboard-write; display-capture; web-share";
REPOS.forEach(a=>{
  a.icon=emblem(a.id);
  registerApp({
    id:a.id,name:a.name,category:a.cat,icon:a.icon,desc:a.desc,width:a.w,height:a.h,
    launch(body){
      if(a.mode==="capsule"){
        body.classList.add("game");
        body.innerHTML=`<iframe src="${a.file}" title="${esc(a.name)}" allow="${ALLOW}" allowfullscreen></iframe>`;
        const frame=body.querySelector("iframe"), win=body.closest(".pwin");
        win.addEventListener("mousedown",()=>setTimeout(()=>{try{frame.focus();frame.contentWindow.focus();}catch(e){}},0));
        frame.addEventListener("load",()=>{try{frame.contentWindow.focus();}catch(e){}});
      }else{
        body.innerHTML=`<div class="rp-native"><div class="rp-badge">${a.icon}</div><h3>${esc(a.name)}</h3>
          <div class="rp-tag warn">${esc(a.note)}</div><p>${esc(a.desc)}</p>
          <p class="rp-dim">This repo is not a browser app, so it cannot run inside a browser window. The OS does not pretend otherwise.</p>
          <a class="rp-btn" href="${ORG+a.repo}" target="_blank" rel="noopener">OPEN SOURCE REPO ↗</a></div>`;
      }
    }
  });
});

/* ---- App Directory ---- */
const css=document.createElement("style");
css.textContent=`
.rp{display:flex;flex-direction:column;height:100%;background:var(--bg2);color:var(--tx);font-family:var(--body)}
.rp-top{padding:14px 16px 10px;border-bottom:1px solid var(--br);display:flex;flex-direction:column;gap:10px}
.rp-head{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.rp-head b{font-family:var(--disp);font-size:13px;letter-spacing:.14em}
.rp-head span{font-family:var(--mono);font-size:10px;color:var(--tx3);letter-spacing:.08em}
.rp-q{width:100%;background:var(--glass);border:1px solid var(--br2);border-radius:9px;color:var(--tx);padding:9px 12px;font:13px var(--body);outline:none}
.rp-q:focus{border-color:var(--tl);box-shadow:0 0 0 3px var(--tl-a)}
.rp-chips{display:flex;gap:6px;flex-wrap:wrap}
.rp-chip{background:transparent;border:1px solid var(--br2);color:var(--tx2);border-radius:99px;padding:4px 10px;font:10px var(--mono);letter-spacing:.08em}
.rp-chip.on,.rp-chip:hover{border-color:var(--tl);color:var(--tl);background:var(--tl-a)}
.rp-grid{flex:1;overflow:auto;padding:14px 16px 18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;align-content:start}
.rp-card{background:var(--glass);border:1px solid var(--br);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,background .15s}
.rp-card:hover{border-color:var(--br3);background:var(--glass2)}
.rp-row{display:flex;gap:10px;align-items:center}
.rp-badge{width:40px;height:40px;flex:none;border-radius:10px;background:var(--glass2);border:1px solid var(--br2);display:flex;align-items:center;justify-content:center;color:var(--tl)}
.rp-badge svg{width:22px;height:22px}
.rp-card h4{font-size:13.5px;font-weight:600}
.rp-card .rp-cat{font:9px var(--mono);letter-spacing:.14em;color:var(--tx3)}
.rp-card p{font-size:11.5px;line-height:1.45;color:var(--tx2);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:50px}
.rp-tag{align-self:flex-start;font:9px var(--mono);letter-spacing:.1em;padding:3px 7px;border-radius:5px;border:1px solid var(--tl);color:var(--tl);background:var(--tl-a)}
.rp-tag.warn{border-color:var(--gd);color:var(--gd);background:var(--gd-a)}
.rp-note{font-size:10.5px;color:var(--gd);line-height:1.4}
.rp-act{display:flex;gap:6px;margin-top:auto}
.rp-btn{flex:1;text-align:center;text-decoration:none;background:var(--pp);border:0;color:#fff;border-radius:8px;padding:8px 10px;font:600 10.5px var(--mono);letter-spacing:.1em;display:inline-block}
.rp-btn:hover{filter:brightness(1.15)}
.rp-btn.ghost{background:transparent;border:1px solid var(--br2);color:var(--tx2);flex:none}
.rp-btn.ghost:hover{border-color:var(--tl);color:var(--tl)}
.rp-empty{grid-column:1/-1;text-align:center;color:var(--tx3);font:11px var(--mono);padding:40px 0}
.rp-native{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;background:var(--bg2);color:var(--tx)}
.rp-native h3{font-family:var(--disp);letter-spacing:.12em;font-size:15px}
.rp-native p{font-size:12.5px;color:var(--tx2);max-width:360px;line-height:1.5}
.rp-native .rp-dim{color:var(--tx3);font-size:11px}
.rp-native .rp-badge{width:64px;height:64px}.rp-native .rp-badge svg{width:36px;height:36px}
.rp-native .rp-btn{flex:none;padding:10px 18px}
`;
document.head.appendChild(css);

registerApp({
  id:"pixel-apps",name:"Pixel Apps",category:"System",
  icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><path d="M16.75 13.5l3.25 3.25-3.25 3.25-3.25-3.25z"/></svg>',
  desc:"Directory of every PixelProTech-ZA app that runs in this OS.",width:940,height:640,
  launch(body){
    body.classList.add("bleed");
    const cats=["ALL",...[...new Set(REPOS.map(a=>a.cat))].sort()];
    let cat="ALL",q="";
    body.innerHTML=`<div class="rp"><div class="rp-top"><div class="rp-head"><b>PIXEL APPS</b><span id="rp-count"></span></div>
      <input class="rp-q" placeholder="Search apps, repos, categories…" autocomplete="off"><div class="rp-chips"></div></div><div class="rp-grid"></div></div>`;
    const grid=body.querySelector(".rp-grid"),chips=body.querySelector(".rp-chips"),count=body.querySelector("#rp-count");
    function draw(){
      chips.innerHTML=cats.map(c=>`<button class="rp-chip${c===cat?" on":""}" data-c="${esc(c)}">${esc(c.toUpperCase())}</button>`).join("");
      const f=REPOS.filter(a=>(cat==="ALL"||a.cat===cat)&&(!q||(a.name+" "+a.cat+" "+a.desc+" "+a.repo).toLowerCase().includes(q)));
      const live=REPOS.filter(a=>a.mode==="capsule").length;
      count.textContent=`${live} RUN OFFLINE IN THE OS · ${REPOS.length-live} NATIVE-ONLY · ${REPOS.length} REPOS`;
      grid.innerHTML=f.length?f.map(a=>`<div class="rp-card"><div class="rp-row"><div class="rp-badge">${a.icon}</div><div><h4>${esc(a.name)}</h4><div class="rp-cat">${esc(a.cat.toUpperCase())}</div></div></div>
        <p>${esc(a.desc)}</p>
        <span class="rp-tag${a.mode==="capsule"?"":" warn"}">${a.mode==="capsule"?"RUNS OFFLINE IN OS":esc(a.note)}</span>
        ${a.mode==="capsule"&&a.note?`<div class="rp-note">${esc(a.note)}</div>`:""}
        <div class="rp-act"><button class="rp-btn" data-o="${a.id}">${a.mode==="capsule"?"OPEN":"DETAILS"}</button><a class="rp-btn ghost" href="${ORG+a.repo}" target="_blank" rel="noopener">REPO ↗</a></div></div>`).join(""):`<div class="rp-empty">NO APPS MATCH</div>`;
    }
    chips.addEventListener("click",e=>{const b=e.target.closest(".rp-chip");if(b){cat=b.dataset.c;draw();}});
    grid.addEventListener("click",e=>{const b=e.target.closest("[data-o]");if(b)openWindow(b.dataset.o);});
    body.querySelector(".rp-q").addEventListener("input",e=>{q=e.target.value.trim().toLowerCase();draw();});
    draw();
  }
});
OS.desktopIcons.push("pixel-apps");
OS.repos=REPOS;
})();
