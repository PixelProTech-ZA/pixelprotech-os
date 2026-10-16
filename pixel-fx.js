/* PIXEL FX — cinematic visual layer for PixelProTech OS
   Foveated-mosaic shader wallpaper · de-rez window effects · particle boot · X-ray loupe.
   Purely visual: nothing here reports or simulates system telemetry. */
(function(){
"use strict";
const OS = window.PixelOS;
if(!OS || !OS.api) return;
const S = OS.settings;
const $ = (s,r)=> (r||document).querySelector(s);
const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : {matches:false};
const fxEnabled = ()=> S.fx !== false && !S.reduceMotion && !mq.matches;
const desktop = $("#desktop");
const T0 = performance.now()/1000;
const now = ()=> performance.now()/1000 - T0;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const easeOut=t=>1-Math.pow(1-t,3);
const easeInOut=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const COLS=["#7B2FFF","#00D4AA","#D8B96A","#FFFFFF","#00D4AA"];

const ptr={x:innerWidth*.62,y:innerHeight*.38,last:-99};
addEventListener("pointermove",e=>{ptr.x=e.clientX;ptr.y=e.clientY;ptr.last=now();},{passive:true});

/* =========================================================
   1. WALLPAPER — "Foveated Pixel Reality"
   The desktop is a mosaic whose pixel size is set by distance from the probe:
   fine at the cursor, chunky far away, in nested power-of-two frames.
   Click = diagnostic pulse (glitch ring that leaves a hex lattice). A scan beam sweeps periodically.
   ========================================================= */
const Wall=(function(){
  let cv,gl,prog,U={},raf=0,ok=false,scale=1,cw=0,ch=0,anyMax=false,lastMaxCheck=0;
  const pulses=[[0,0,-999],[0,0,-999],[0,0,-999],[0,0,-999]]; let pi=0;
  const focus={x:innerWidth*.5,y:innerHeight*.45};
  let scanT0=-999,nextScan=4,ema=16,lastTs=0,slow=0,fast=0,lastDraw=0;
  const VS="attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FS=`precision highp float;
uniform vec2 uRes;uniform float uScale,uT,uRad;uniform vec2 uF;uniform vec3 uP[4];uniform vec2 uScan;
#define PP vec3(.482,.184,1.)
#define TL vec3(0.,.831,.667)
#define GD vec3(.847,.725,.416)
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n2(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
vec3 world(vec2 c){
 vec2 p=c*.0022;float t=uT;
 vec2 q=vec2(fbm(p+vec2(0.,t*.04)),fbm(p+vec2(5.2,1.3)-vec2(t*.03,0.)));
 float f=fbm(p*1.2+2.6*q+vec2(t*.02,-t*.016));
 float ridge=1.-abs(2.*fbm(p*1.7+3.*q+t*.025)-1.);
 vec3 col=vec3(.02,.02,.032);
 col=mix(col,PP*.5,smoothstep(.30,.68,f));
 col=mix(col,TL*.6,smoothstep(.5,.85,q.x)*smoothstep(.32,.62,f)*.7);
 col+=PP*pow(ridge,8.)*.32;col+=GD*pow(ridge,22.)*.5;col+=TL*pow(ridge,40.)*.45;
 return col;}
float hexE(vec2 p){vec2 r=vec2(1.,1.7320508);vec2 h=r*.5;vec2 a=mod(p,r)-h;vec2 b=mod(p-h,r)-h;
 vec2 g=dot(a,a)<dot(b,b)?a:b;vec2 q=abs(g);return .5-max(dot(q,vec2(.5,.8660254)),q.x);}
void main(){
 vec2 px=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;
 float glitch=0.,ring=0.,lat=0.;vec3 add=vec3(0.);vec2 src=px;
 float lh=1.-smoothstep(0.,.05,hexE(px/40.));
 for(int i=0;i<4;i++){
  float age=uT-uP[i].z;
  if(age>0.&&age<3.2){
   float r=age*640.;float dd=distance(px,uP[i].xy);float fade=1.-age/3.2;
   float z=(dd-r)/(22.+age*14.);float band=exp(-z*z)*fade;
   ring+=band;glitch+=band;
   lat+=smoothstep(r+4.,r-140.,dd)*fade*lh*.9;
   src+=normalize(px-uP[i].xy+vec2(1e-4))*band*-18.;
  }}
 if(uScan.y>0.){
  float dx=px.x-uScan.x;float beam=exp(-(dx*dx)/9.);
  float halo=exp(-(dx*dx)/9800.)*.22;
  float trail=dx<0.?exp(dx/380.):0.;
  lat+=lh*trail*.85*uScan.y;
  float gb=exp(-(dx*dx)/1800.);glitch+=gb*.8*uScan.y;
  add+=((TL*2.4+vec3(.3))*beam+TL*halo)*uScan.y;
  src.x+=(h21(vec2(floor(px.y/5.),floor(uT*24.)))-.5)*38.*gb*uScan.y;
 }
 float d=max(abs(px.x-uF.x),abs(px.y-uF.y));
 float lvl=floor(min(d/uRad,4.));float cell=3.*exp2(lvl);
 vec2 id=floor(px/cell);vec2 loc=fract(px/cell);
 vec2 c=(id+.5)*cell+(src-px);
 vec3 col;
 if(glitch>.04){vec2 o=vec2(9.*glitch,0.);col=vec3(world(c+o).r,world(c).g,world(c-o).b);}
 else col=world(c);
 float hh=h21(id+lvl*7.);float lk=min(lvl,1.);
 col*=.9+.2*hh+.1*sin(uT*1.3+hh*40.)*lk;
 float e=min(min(loc.x,1.-loc.x),min(loc.y,1.-loc.y))*cell;
 float gapw=lvl*.55;
 col*=mix(1.,mix(.1,1.,smoothstep(gapw*.4,gapw+.5,e)),lk);
 col*=1.+.14*(.5-loc.y)*lk;
 col*=1.-.42*(lvl/4.);
 col+=TL*lat*.5+vec3(.2,.9,.8)*lat*.12;
 col+=(TL*1.5+.25)*ring*.55;col+=add;
 vec2 ff=abs(px-uF);float fe=max(ff.x,ff.y);
 col+=TL*.65*smoothstep(1.3,0.,abs(fe-uRad*.6))*step(uRad*.6-24.,min(ff.x,ff.y));
 col+=vec3(1.)*smoothstep(2.6,0.,length(px-uF))*.7;
 vec2 vv=(gl_FragCoord.xy/uRes-.5)*vec2(1.15,1.);
 col*=1.-.55*dot(vv,vv)*1.6;
 col+=(h21(gl_FragCoord.xy+uT)-.5)/200.;
 gl_FragColor=vec4(col,1.);}`;
  function sh(t,src){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn("PixelFX shader:",gl.getShaderInfoLog(s));return null;}return s;}
  function init(){
    if(ok) return true;
    try{
      cv=document.createElement("canvas");cv.id="fxWall";
      gl=cv.getContext("webgl",{antialias:false,alpha:false,powerPreference:"high-performance"});
      if(!gl) return false;
      const v=sh(gl.VERTEX_SHADER,VS),f=sh(gl.FRAGMENT_SHADER,FS); if(!v||!f) return false;
      prog=gl.createProgram();gl.attachShader(prog,v);gl.attachShader(prog,f);gl.linkProgram(prog);
      if(!gl.getProgramParameter(prog,gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(prog,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      ["uRes","uScale","uT","uRad","uF","uP","uScan"].forEach(n=>U[n]=gl.getUniformLocation(prog,n));
      desktop.insertBefore(cv,$("#wallpaper").nextSibling);desktop.classList.add("has-shader");
      scale=baseScale();ok=true;
      addEventListener("resize",()=>{if(!running()) drawStatic();});
      return true;
    }catch(e){console.warn("PixelFX wallpaper unavailable",e);return false;}
  }
  function baseScale(){const q=S.fxQuality||"auto";return q==="low"?.5:q==="high"?Math.min(devicePixelRatio||1,2):1;}
  function size(){
    const w=desktop.clientWidth,h=desktop.clientHeight;
    const W=Math.max(2,Math.floor(w*scale)),H=Math.max(2,Math.floor(h*scale));
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
    cw=w;ch=h;
  }
  function draw(t){
    size();gl.viewport(0,0,cv.width,cv.height);
    gl.uniform2f(U.uRes,cv.width,cv.height);gl.uniform1f(U.uScale,scale);gl.uniform1f(U.uT,t);
    gl.uniform1f(U.uRad,clamp(Math.min(cw,ch)*.2,105,190));
    gl.uniform2f(U.uF,focus.x,focus.y);
    gl.uniform3fv(U.uP,new Float32Array(pulses.flat()));
    const sa=t-scanT0,dur=2.8;
    gl.uniform2f(U.uScan,sa>=0&&sa<dur?lerp(-80,cw+80,sa/dur):-999,sa>=0&&sa<dur?Math.sin(Math.PI*clamp(sa/dur,0,1))**.5:0);
    gl.drawArrays(gl.TRIANGLES,0,3);
  }
  function running(){return raf!==0;}
  function drawStatic(){ if(!ok)return; focus.x=desktop.clientWidth*.62;focus.y=desktop.clientHeight*.4;draw(14.2); }
  function frame(ts){
    raf=requestAnimationFrame(frame);
    if(document.hidden) return;
    const t=now(),dt=Math.min(.1,(ts-lastTs)/1000||.016);lastTs=ts;
    if(t-lastMaxCheck>.4){lastMaxCheck=t;anyMax=!!document.querySelector(".pwin.maximized:not(.minimized)");}
    if(anyMax) return;
    // focus: follow pointer, else drift on its own
    let tx,ty;
    if(t-ptr.last<4.5){tx=ptr.x;ty=ptr.y;}
    else{const W=desktop.clientWidth,H=desktop.clientHeight;tx=W*(.5+.3*Math.sin(t*.23));ty=H*(.44+.24*Math.sin(t*.31+1));}
    const k=1-Math.exp(-dt*(t-ptr.last<4.5?9:2.2));
    focus.x+=(tx-focus.x)*k;focus.y+=(ty-focus.y)*k;
    if(t>nextScan){scanT0=t;nextScan=t+13;}
    draw(t);
    // adaptive resolution
    const ft=ts-lastDraw;lastDraw=ts;ema=ema*.92+Math.min(ft,80)*.08;
    if(S.fxQuality!=="high"&&S.fxQuality!=="low"){
      if(ema>27){slow++;fast=0;}else if(ema<15){fast++;slow=0;}else{slow=0;fast=0;}
      if(slow>40&&scale>.4){scale=Math.max(.4,scale*.8);slow=0;}
      if(fast>260&&scale<baseScale()){scale=Math.min(baseScale(),scale*1.25);fast=0;}
    }
  }
  return{
    get ok(){return ok;},
    start(){ if(!init()) return; if(!raf){lastTs=performance.now();raf=requestAnimationFrame(frame);} },
    stop(){ if(raf){cancelAnimationFrame(raf);raf=0;} drawStatic(); },
    refresh(){ if(!ok) return; scale=baseScale(); fxEnabled()?this.start():this.stop(); },
    pulse(x,y){ if(!ok||!fxEnabled()) return; pulses[pi%4]=[x,y,now()]; pi++; },
    scanNow(){ scanT0=now(); }
  };
})();

/* =========================================================
   2. PARTICLES (window rez / de-rez, bursts)
   ========================================================= */
const FX=(function(){
  let cv,ctx,W=0,H=0,dpr=1,raf=0;const parts=[],anims=[],edges=[];
  function ensure(){
    if(cv) {fit();return;}
    cv=document.createElement("canvas");cv.id="fxTop";desktop.appendChild(cv);ctx=cv.getContext("2d");fit();
    addEventListener("resize",fit);
  }
  function fit(){dpr=Math.min(devicePixelRatio||1,2);W=desktop.clientWidth;H=desktop.clientHeight;
    if(cv.width!==W*dpr||cv.height!==H*dpr){cv.width=W*dpr;cv.height=H*dpr;}}
  function spawn(p){ if(parts.length<1600){p.l=0;parts.push(p);} }
  function edge(x1,x2,y,a){edges.push({x1,x2,y,a});}
  function loop(ts){
    raf=requestAnimationFrame(loop);
    const dt=Math.min(.1,(ts-(loop.l||ts))/1000);loop.l=ts;
    for(let i=anims.length-1;i>=0;i--) if(anims[i](ts)===false) anims.splice(i,1);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    ctx.globalCompositeOperation="lighter";
    for(const e of edges){
      const g=ctx.createLinearGradient(e.x1,0,e.x2,0);
      g.addColorStop(0,"rgba(0,212,170,0)");g.addColorStop(.15,"rgba(0,212,170,"+e.a+")");g.addColorStop(.5,"rgba(255,255,255,"+e.a+")");g.addColorStop(.85,"rgba(123,47,255,"+e.a+")");g.addColorStop(1,"rgba(123,47,255,0)");
      ctx.fillStyle=g;ctx.fillRect(e.x1,e.y-1,e.x2-e.x1,2);
      ctx.globalAlpha=.18*e.a;ctx.fillRect(e.x1,e.y-9,e.x2-e.x1,18);ctx.globalAlpha=1;
    }
    edges.length=0;
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i];p.l+=dt;
      if(p.l>=p.m){parts.splice(i,1);continue;}
      if(p.tx!==undefined){
        const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy)||1;
        if(d<10){parts.splice(i,1);continue;}
        p.vx+=dx/d*p.pull*dt;p.vy+=dy/d*p.pull*dt;
      }
      if(p.drag){const f=Math.max(0,1-p.drag*dt);p.vx*=f;p.vy*=f;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      const a=1-p.l/p.m;
      ctx.globalAlpha=Math.min(1,a*1.6);ctx.fillStyle=COLS[p.c];
      ctx.fillRect(Math.round(p.x),Math.round(p.y),p.s,p.s);
    }
    ctx.globalAlpha=1;
    if(!parts.length&&!anims.length){cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,W,H);}
  }
  function kick(){ensure();if(!raf){loop.l=0;raf=requestAnimationFrame(loop);}}
  function add(fn){anims.push(fn);kick();}
  function burst(x,y,n,spd){
    if(!fxEnabled())return;ensure();
    for(let i=0;i<n;i++){const a=Math.random()*6.283,v=(spd||160)*(.3+Math.random());
      spawn({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,m:.5+Math.random()*.6,s:2+(Math.random()*2|0),c:Math.random()*COLS.length|0,drag:2.2});}
    kick();
  }
  return{add,spawn,edge,burst,kick,ensure};
})();

/* =========================================================
   3. WINDOW EFFECTS
   ========================================================= */
function rrand(a,b){return a+Math.random()*(b-a);}
function winOpen(el){
  if(!fxEnabled()) return;
  const r=el.getBoundingClientRect();
  Wall.pulse(r.left+r.width/2,r.top+r.height/2);
  el.style.clipPath="inset(0 0 100% 0 round 13px)";
  const dur=640,start=performance.now();
  for(let i=0;i<90;i++){ // pixels assemble toward the frame
    const a=Math.random()*6.283,d=rrand(160,420);
    FX.spawn({x:r.left+r.width/2+Math.cos(a)*d,y:r.top+r.height/2+Math.sin(a)*d,vx:0,vy:0,m:rrand(.4,.8),s:2,c:Math.random()*4|0,
      tx:rrand(r.left,r.right),ty:Math.random()<.5?r.top:r.bottom,pull:1400,drag:1.5});
  }
  el.animate([{transform:"translateX(-7px) skewX(1.6deg)",filter:"hue-rotate(50deg) saturate(2.2)"},{transform:"translateX(6px)",filter:"none"},{transform:"translateX(-2px)"},{transform:"none"}],{duration:380,easing:"steps(5)"});
  FX.add(ts=>{
    const p=clamp((performance.now()-start)/dur,0,1),e=easeOut(p),rr=el.getBoundingClientRect();
    el.style.clipPath=`inset(0 0 ${((1-e)*100).toFixed(2)}% 0 round 13px)`;
    const y=rr.top+rr.height*e;
    if(p<1){FX.edge(rr.left-6,rr.right+6,y,1-p*.6);
      const n=Math.min(10,2+rr.width/90|0);
      for(let k=0;k<n;k++)FX.spawn({x:rrand(rr.left,rr.right),y,vx:rrand(-50,50),vy:-rrand(30,170),m:rrand(.3,.8),s:2+(Math.random()*2|0),c:Math.random()*COLS.length|0,drag:1.2});}
    if(p>=1){el.style.clipPath="";return false;}
  });
}
function winClose(el,target,done){
  if(!fxEnabled()||!target){done();return;}
  el.style.pointerEvents="none";
  const dur=560,start=performance.now(),r0=el.getBoundingClientRect();
  Wall.pulse(r0.left+r0.width/2,r0.top+r0.height/2);
  FX.add(ts=>{
    const p=clamp((performance.now()-start)/dur,0,1),e=p*p*(3-2*p),rr=r0;
    el.style.clipPath=`inset(${(e*100).toFixed(2)}% 0 0 0 round 13px)`;
    const y=rr.top+rr.height*e;
    if(p<1){FX.edge(rr.left-6,rr.right+6,y,1-p*.5);
      const n=Math.min(14,3+rr.width/70|0);
      for(let k=0;k<n;k++)FX.spawn({x:rrand(rr.left,rr.right),y,vx:rrand(-90,90),vy:rrand(-30,60),m:rrand(.5,1),s:2+(Math.random()*2|0),c:Math.random()*COLS.length|0,tx:target.cx+rrand(-12,12),ty:target.cy,pull:rrand(900,2200),drag:.8});}
    if(p>=1){done();FX.burst(target.cx,target.cy,26,200);return false;}
  });
}
function winMinimize(el,target,done){
  if(!fxEnabled()||!target){done();return;}
  const r=el.getBoundingClientRect(),dx=target.cx-(r.left+r.width/2),dy=target.cy-(r.top+r.height/2);
  el.style.pointerEvents="none";
  const a=el.animate([{transform:"none",opacity:1,filter:"blur(0)"},{transform:`translate(${dx}px,${dy}px) scale(.05,.025)`,opacity:0,filter:"blur(5px)"}],{duration:440,easing:"cubic-bezier(.55,0,.75,.3)",fill:"forwards"});
  const st=performance.now();
  FX.add(()=>{const p=(performance.now()-st)/440;if(p>=1)return false;
    const cx=lerp(r.left+r.width/2,target.cx,easeInOut(p)),cy=lerp(r.top+r.height/2,target.cy,easeInOut(p));
    for(let k=0;k<5;k++)FX.spawn({x:cx+rrand(-r.width*.2,r.width*.2)*(1-p),y:cy+rrand(-8,8),vx:rrand(-30,30),vy:rrand(-30,30),m:.4,s:2+(Math.random()*2|0),c:Math.random()*4|0,drag:3});});
  a.onfinish=()=>{a.cancel();el.style.pointerEvents="";done();};
}
function winRestore(el,target){
  if(!fxEnabled()||!target) return;
  const r=el.getBoundingClientRect(),dx=target.cx-(r.left+r.width/2),dy=target.cy-(r.top+r.height/2);
  el.animate([{transform:`translate(${dx}px,${dy}px) scale(.05,.025)`,opacity:0,filter:"blur(5px)"},{transform:"none",opacity:1,filter:"blur(0)"}],{duration:460,easing:"cubic-bezier(.15,.9,.25,1)"});
  FX.burst(target.cx,target.cy,22,220);Wall.pulse(r.left+r.width/2,r.top+r.height/2);
}

/* =========================================================
   4. BOOT — particle vortex forms the hex mark; boot rows run the real Pixel Diagnostic Engine
      stages against this device; hex iris opens onto the desktop.
   ========================================================= */
function boot(cb){
  if(!fxEnabled()) return false;
  const bootEl=$("#boot");bootEl.classList.add("fx");
  const cvs=document.createElement("canvas");cvs.id="bootCanvas";bootEl.insertBefore(cvs,bootEl.firstChild);
  const ctx=cvs.getContext("2d");
  let W,H,dpr=Math.min(devicePixelRatio||1,2);
  function fit(){W=innerWidth;H=innerHeight;cvs.width=W*dpr;cvs.height=H*dpr;}
  fit();addEventListener("resize",fit);
  const mark=$(".boot-mark"),word=$(".boot-word"),log=$("#bootLog"),bar=$("#bootBar");
  const hint=document.createElement("div");hint.className="boot-hint";hint.textContent="CLICK OR PRESS ANY KEY TO SKIP";bootEl.appendChild(hint);
  // logo geometry (viewBox 100) -> targets
  const outer=[[50,4],[90,27],[90,73],[50,96],[10,73],[10,27],[50,4]];
  const inner=[[50,50],[50,14],[82,32],[82,68],[50,86],[18,68],[18,32],[50,50]];
  function along(poly,n){const out=[];let tot=0;const L=[];
    for(let i=0;i<poly.length-1;i++){const l=Math.hypot(poly[i+1][0]-poly[i][0],poly[i+1][1]-poly[i][1]);L.push(l);tot+=l;}
    for(let k=0;k<n;k++){let d=Math.random()*tot,i=0;while(d>L[i]){d-=L[i];i++;}const f=d/L[i];
      out.push([lerp(poly[i][0],poly[i+1][0],f),lerp(poly[i][1],poly[i+1][1],f)]);}return out;}
  const P=[];
  const N=Math.min(2600,Math.max(1400,W*H/700|0));
  along(outer,N*.34|0).forEach(t=>P.push({t,c:2}));
  along(inner,N*.26|0).forEach(t=>P.push({t,c:0}));
  for(let i=0;i<N*.4;i++){ // diamond fill
    const x=rrand(32,68),y=rrand(20,80);if(Math.abs(x-50)/18+Math.abs(y-50)/30>1)continue;
    if(x>45&&x<51&&y>37&&y<63)continue;P.push({t:[x,y],c:(y<50&&Math.random()<.6)?0:1});}
  P.forEach(p=>{p.a=Math.random()*6.283;p.R=Math.max(W,H)*rrand(.35,.8);p.d=Math.random()*.9;p.u=rrand(.95,1.5);p.s=Math.random()<.2?3:2;});
  const rows=bootRows(),elapsed0=performance.now();
  const final="PIXELPROTECH OS";const glyph="01<>/\\#%&$";
  let skip=false,tSkip=0,phase=0,tFin=0,done=false;
  const skipFn=()=>{if(!skip){skip=true;tSkip=(performance.now()-elapsed0)/1000;}};
  bootEl.addEventListener("pointerdown",skipFn);addEventListener("keydown",skipFn,{once:true});
  const iris=document.createElementNS("http://www.w3.org/2000/svg","svg");iris.id="irisRing";
  iris.innerHTML='<defs><linearGradient id="irg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7B2FFF"/><stop offset=".5" stop-color="#00D4AA"/><stop offset="1" stop-color="#D8B96A"/></linearGradient></defs><polygon fill="none" stroke="url(#irg)" stroke-width="3" style="filter:drop-shadow(0 0 12px #00D4AA)"/>';
  document.body.appendChild(iris);const poly=iris.querySelector("polygon");
  let rowsShown=0;
  function hexPts(cx,cy,r){const a=[];for(let k=0;k<6;k++){const t=-Math.PI/2+k*Math.PI/3;a.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}return a;}
  function frame(){
    if(done) return;
    requestAnimationFrame(frame);
    let t=(performance.now()-elapsed0)/1000;
    if(skip) t=Math.max(t,3.3)+((performance.now()-elapsed0)/1000-tSkip)*1.5; // fast-forward
    const mr=mark.getBoundingClientRect(),cx=mr.left+mr.width/2,cy=mr.top+mr.height/2,sc=mr.width/100;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.globalCompositeOperation="source-over";ctx.fillStyle="rgba(7,7,10,"+(t<2.7?.2:.45)+")";ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation="lighter";
    const burst=t>2.9?(t-2.9):0;
    for(const p of P){
      const u=clamp((t-p.d)/p.u,0,1),e=1-Math.pow(1-u,3),inv=1-e;
      const ang=p.a+inv*5.5,rr=p.R*inv;
      let x=cx+Math.cos(ang)*rr+(p.t[0]-50)*sc*e,y=cy+Math.sin(ang)*rr+(p.t[1]-50)*sc*e;
      if(u>=1){const w=Math.sin(t*3+p.a*9)*.6;x+=w;y+=Math.cos(t*2.6+p.a*7)*.6;}
      if(burst>0){const dx=x-cx,dy=y-cy,d=Math.hypot(dx,dy)||1;const k=burst*burst*(520+p.R*.3)/d;x+=dx*k*.02;y+=dy*k*.02;}
      ctx.globalAlpha=burst>0?Math.max(0,1-burst*1.4):.4+.6*e;
      ctx.fillStyle=COLS[p.c];ctx.fillRect(x|0,y|0,p.s,p.s);
    }
    ctx.globalAlpha=1;
    // crisp mark fades in once formed
    if(t>2.0) mark.classList.add("show");
    // wordmark scramble
    const wt=clamp((t-1.2)/1.0,0,1),rev=Math.floor(wt*final.length);let html="";
    for(let i=0;i<final.length;i++){const ch=i<rev?final[i]:(final[i]===" "?" ":glyph[Math.random()*glyph.length|0]);
      html+=i===12?`<span>${ch===" "?"&nbsp;":ch}`:ch===" "?" ":ch;}
    word.innerHTML=html+"</span>";
    word.style.opacity=wt>0?1:0;
    // diagnostic rows
    const want=skip?rows.length:Math.min(rows.length,Math.floor(Math.max(0,t-.5)/.34)+1);
    while(rowsShown<want){const r=rows[rowsShown],d=document.createElement("div");d.className="pend";
      d.innerHTML=`<span>${r[0]}</span><b>${r[1]}</b>`;log.appendChild(d);
      setTimeout(()=>d.className="done",230);rowsShown++;}
    bar.style.width=Math.round(clamp(t/3,0,1)*100)+"%";
    // finale: hex iris
    if(t>3.05){
      if(!phase){phase=1;tFin=t;Wall.pulse(innerWidth/2,innerHeight/2);setTimeout(cb,300);iris.style.display="block";}
      const f=clamp((t-tFin)/.85,0,1),e=f*f*f,R=lerp(0,Math.hypot(W,H)*.62,e);
      const pts=hexPts(W/2,H/2,R),path="M0 0H"+W+"V"+H+"H0Z M"+pts.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join("L")+"Z";
      bootEl.style.clipPath='path(evenodd,"'+path+'")';
      poly.setAttribute("points",pts.map(p=>p.join(",")).join(" "));
      iris.setAttribute("viewBox","0 0 "+W+" "+H);
      desktop.style.transform="scale("+lerp(1.07,1,e)+")";desktop.style.opacity=String(.4+.6*e);
      if(f>=1){
        done=true;bootEl.classList.add("hidden");bootEl.remove();iris.remove();desktop.style.transform="";desktop.style.opacity="";
        removeEventListener("resize",fit);
      }
    }
  }
  desktop.style.transform="scale(1.07)";desktop.style.opacity=".4";
  frame();
  return true;
}
function bootRows(){
  const c=OS.api.detectCapabilities(),en=Object.entries(c);
  const ok=en.filter(([k,v])=>/^(AVAILABLE|YES)/.test(v)).length;
  const bad=en.filter(([k,v])=>/^(NOT AVAILABLE|BLOCKED|NO)/.test(v)).map(([k])=>k);
  const br=(OS.api.getBrowserLabel()||"").split(".")[0];
  return[
    ["01 SYMPTOM",navigator.onLine?"cold start · online":"cold start · offline"],
    ["02 ENVIRONMENT",br+" · "+innerWidth+"×"+innerHeight],
    ["03 TEST",ok+"/"+en.length+" web APIs present"],
    ["04 FAULT",bad.length?bad.slice(0,2).join(", ")+(bad.length>2?" +"+(bad.length-2):""):"none established"],
    ["05 ACTION",Wall.ok?"shader wallpaper online":"2D fallback"],
    ["06 VERIFICATION","shell verified"]
  ];
}

/* =========================================================
   5. X-RAY LOUPE — a lens that edge-detects whatever is under it (live DOM, iframes included).
   ========================================================= */
const Loupe=(function(){
  let el,btn,on=false,r=260,built=false;
  function build(){
    if(built)return;built=true;
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("width","0");svg.setAttribute("height","0");svg.style.position="absolute";
    svg.innerHTML=`<filter id="pxXray" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0" result="g"/>
      <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" edgeMode="duplicate" preserveAlpha="true" in="g" result="e"/>
      <feComponentTransfer in="e" result="e2"><feFuncR type="linear" slope="0"/><feFuncG type="linear" slope="7"/><feFuncB type="linear" slope="5.5"/></feComponentTransfer>
      <feGaussianBlur in="e2" stdDeviation="1.1" result="b"/>
      <feMerge result="m"><feMergeNode in="b"/><feMergeNode in="e2"/></feMerge>
      <feColorMatrix in="m" type="matrix" values="1 0 0 0 .0 0 1 0 0 .03 0 0 1 0 .05 0 0 0 0 1"/></filter>`;
    document.body.appendChild(svg);
    el=document.createElement("div");el.id="loupe";
    el.innerHTML='<div class="loupe-lens"></div><div class="loupe-ring"></div><div class="loupe-tag">PIXEL X-RAY · EDGE VIEW</div>';
    document.body.appendChild(el);
    if(/Chrome|Edg|Chromium/.test(navigator.userAgent)&&!/OPR|Firefox/.test(navigator.userAgent)) el.classList.add("svgfx");
    btn=document.createElement("button");btn.id="loupeBtn";btn.title="X-Ray Loupe (X) — shift+scroll resizes";
    btn.innerHTML=OS.api.svgIcon('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5.5 5.5M8 10.5h5M10.5 8v5"/>');
    btn.onclick=()=>toggle();$("#tb-right").insertBefore(btn,$("#tb-net"));
    el.style.setProperty("--lr",r+"px");
    addEventListener("pointermove",e=>{if(on){el.style.transform=`translate(${e.clientX}px,${e.clientY}px)`;}},{passive:true});
    addEventListener("wheel",e=>{if(on&&e.shiftKey){r=clamp(r-Math.sign(e.deltaY||e.deltaX)*24,120,520);el.style.setProperty("--lr",r+"px");e.preventDefault();}},{passive:false});
    addEventListener("keydown",e=>{
      if(e.key.toLowerCase()==="x"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||"")&&!(document.activeElement&&document.activeElement.isContentEditable)) toggle();
    });
  }
  function toggle(v){build();on=v===undefined?!on:v;el.classList.toggle("on",on);btn.classList.toggle("on",on);
    if(on){el.style.transform=`translate(${ptr.x}px,${ptr.y}px)`;OS.api.notify("X-Ray Loupe","Edge view on. Move over any window. Shift+scroll resizes · X toggles.");FX.burst(ptr.x,ptr.y,30,260);}
  }
  return{build,toggle};
})();

/* =========================================================
   6. SMALL THINGS: icon tilt, background click pulses
   ========================================================= */
function wireDesktop(){
  const wrap=$("#desktopIcons");
  wrap.addEventListener("pointermove",e=>{const b=e.target.closest(".dicon");if(!b||!fxEnabled())return;
    const r=b.getBoundingClientRect();b.style.setProperty("--ry",((e.clientX-r.left)/r.width-.5)*26+"deg");b.style.setProperty("--rx",-((e.clientY-r.top)/r.height-.5)*26+"deg");});
  wrap.addEventListener("pointerout",e=>{const b=e.target.closest(".dicon");if(b){b.style.setProperty("--rx","0deg");b.style.setProperty("--ry","0deg");}});
  desktop.addEventListener("pointerdown",e=>{
    if(e.target.closest(".pwin,#taskbar,#launcher,.dicon,#notif-stack"))return;
    Wall.pulse(e.clientX,e.clientY);FX.burst(e.clientX,e.clientY,14,150);
  });
}

OS.fx={
  boot,winOpen,winClose,winMinimize,winRestore,
  pulse:(x,y)=>Wall.pulse(x,y),burst:(x,y,n,s)=>FX.burst(x,y,n,s),
  enabled:fxEnabled,
  loupe:Loupe,
  refresh(){Wall.refresh();}
};

Wall.start(); // wallpaper shader begins immediately (static frame if reduced motion)
if(!fxEnabled()) Wall.stop();
document.addEventListener("DOMContentLoaded",()=>{wireDesktop();Loupe.build();});
if(document.readyState!=="loading"){wireDesktop();Loupe.build();}
})();
