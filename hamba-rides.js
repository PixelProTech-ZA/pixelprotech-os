/* Hamba Rides. Created by Lindokuhle Mabika, PixelProTech Solutions (Pty) Ltd. https://pixelprotechsolutions.co.za */
'use strict';
/* ===== Utilities ===== */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function rngFrom(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=Math.random;
const rr=(a,b)=>a+(b-a)*rnd();
const pick=a=>a[(rnd()*a.length)|0];
function angDiff(a,b){let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d}

/* ===== Road graph =====
   Hand-drawn, schematic Johannesburg. Coordinates are authored in "map units"
   (x east, y south) and scaled to pixels. Not survey data. */
const S=3;
const ROAD={hwy:{w:150,v:430,name:'freeway'},main:{w:110,v:300,name:'main road'},local:{w:84,v:210,name:'street'}};
const nodes=[],edges=[],nodeKey=new Map();
function N(x,y){const k=x+','+y;let i=nodeKey.get(k);if(i!==undefined)return i;i=nodes.length;nodes.push({id:i,x:x*S,y:y*S,ox:x,oy:y,adj:[],deg:0,light:false,off:0,clear:60,district:null,hwyOnly:true});nodeKey.set(k,i);return i}
function E(a,b,type,tag){
  if(a===b)return;
  for(const e of edges){if((e.a===a&&e.b===b)||(e.a===b&&e.b===a))return}
  const A=nodes[a],B=nodes[b],dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy);
  const e={id:edges.length,a,b,type,w:ROAD[type].w,len,dx:dx/len,dy:dy/len,ang:Math.atan2(dy,dx),closed:0,tag:tag||''};
  edges.push(e);A.adj.push(e.id);B.adj.push(e.id);
}
function road(type,pts,tag){for(let i=0;i<pts.length-1;i++)E(N(pts[i][0],pts[i][1]),N(pts[i+1][0],pts[i+1][1]),type,tag)}
function grid(xs,ys,rowType,colType,mainRowY,mainColX){
  for(const y of ys){for(let i=0;i<xs.length-1;i++)E(N(xs[i],y),N(xs[i+1],y),y===mainRowY?'main':rowType)}
  for(const x of xs){for(let j=0;j<ys.length-1;j++)E(N(x,ys[j]),N(x,ys[j+1]),x===mainColX?'main':colType)}
}
/* Freeways */
road('hwy',[[900,6600],[900,5200],[950,4600],[1000,3600],[1100,2400],[1900,1400],[2900,900],[3250,600],[3600,300],[3900,300],[4400,300],[5200,300]],'N1');
road('hwy',[[5200,300],[5200,1400],[5100,2400],[5100,3600],[5000,5000],[4900,6400]],'N3');
road('hwy',[[900,6600],[2000,6250],[3300,6050],[4300,6200],[4900,6400]],'M2');
road('hwy',[[3000,5700],[3300,6050],[3900,6700],[4300,7500]],'M1');
road('hwy',[[3000,4300],[3000,3900]],'M1');
road('hwy',[[3000,3300],[3100,2700],[3500,2300]],'M1');
road('hwy',[[3500,1700],[3500,1200],[3500,700],[3250,600]],'M1');
/* Inner city: Braamfontein, Hillbrow, Newtown, CBD, Maboneng */
grid([2200,2600,3000,3400,3800,4200,4600],[4300,4600,4900,5300,5700],'local','local',4600,3000);
/* Melville */
grid([1500,1850],[4300,4600],'local','local',4600,null);
road('main',[[950,4600],[1500,4600]]);road('main',[[1850,4600],[2200,4600]]);road('local',[[1850,4300],[2200,4300]]);
/* Rosebank */
grid([2600,3000,3400],[3300,3600,3900],'local','local',3600,3000);
road('main',[[1000,3600],[1800,3600],[2600,3600]]);
road('main',[[3400,3600],[4100,3600],[5100,3600]]);
road('local',[[2600,3900],[2600,4300]]);road('local',[[3400,3900],[3400,4300]]);
road('main',[[1800,2500],[1800,3100],[1800,3600],[1850,4300]]);
/* Randburg */
grid([1500,1800,2100],[1900,2200,2500],'local','local',null,null);
road('main',[[1100,2400],[1500,2200]]);
road('main',[[2100,2200],[2600,2050],[3100,2000]]);
/* Sandton */
grid([3100,3500,3900],[1700,2000,2300],'local','local',null,3500);
road('main',[[3900,2300],[4500,2300],[5100,2400]]);
/* Midrand */
road('main',[[3900,300],[3900,700]]);road('main',[[4400,300],[4400,700]]);
road('main',[[3500,700],[3900,700],[4400,700]]);
road('local',[[3900,700],[3900,1000],[4400,1000],[4400,700]]);
road('main',[[4400,1000],[4800,1200],[5200,1400]]);
/* Soweto */
road('main',[[900,6600],[900,6900]]);
grid([500,900,1300],[6900,7200,7500],'local','local',null,null);
/* Links */
road('main',[[4600,4600],[5000,5000]]);
road('main',[[2200,5700],[2000,6250]]);
road('main',[[4600,5700],[4300,6200]]);

/* Node properties */
for(const n of nodes){n.deg=n.adj.length}
for(const e of edges){
  for(const id of [e.a,e.b]){const n=nodes[id];n.clear=Math.max(n.clear,e.w/2+14);if(e.type!=='hwy')n.hwyOnly=false}
}
for(const n of nodes){n.light=n.deg>=3;n.off=(n.id*7.3)%24}
function lightState(n,axis,t){const u=(t+n.off+axis*12)%24;return u<10?0:u<11.5?1:2} // 0 green,1 amber,2 red

/* ===== Districts ===== */
const DIST=[
  {id:'midrand',name:'Midrand',c:[4150,650],ground:'#c3cdb6',style:'park'},
  {id:'sandton',name:'Sandton',c:[3500,2000],ground:'#c4cdbb',style:'glass'},
  {id:'randburg',name:'Randburg',c:[1800,2200],ground:'#c9cfb4',style:'suburb'},
  {id:'rosebank',name:'Rosebank',c:[3000,3600],ground:'#c3cdb2',style:'mall'},
  {id:'melville',name:'Melville',c:[1675,4450],ground:'#cdcfb5',style:'low'},
  {id:'braam',name:'Braamfontein',c:[2400,4450],ground:'#cccdb8',style:'campus'},
  {id:'hillbrow',name:'Hillbrow',c:[3600,4450],ground:'#d1ccbc',style:'flats'},
  {id:'newtown',name:'Newtown',c:[2400,5300],ground:'#cfcbbb',style:'industrial'},
  {id:'cbd',name:'Johannesburg CBD',c:[3400,5300],ground:'#d0cdc2',style:'cbd'},
  {id:'maboneng',name:'Maboneng',c:[4400,5300],ground:'#d0c9b8',style:'brick'},
  {id:'soweto',name:'Soweto',c:[900,7200],ground:'#d1caae',style:'township'}
];
for(const d of DIST){d.px=d.c[0]*S;d.py=d.c[1]*S;d.nodes=[]}
function districtAt(x,y){let best=null,bd=1e18;for(const d of DIST){const dd=Math.hypot(x-d.px,y-d.py);if(dd<bd){bd=dd;best=d}}return{d:best,dist:bd}}
for(const n of nodes){const r=districtAt(n.x,n.y);n.district=r.d;n.dd=r.dist}
for(const n of nodes){if(!n.hwyOnly&&n.dd<1900&&n.deg>=2){n.district.nodes.push(n.id)}}

/* ===== Spatial hash of roads ===== */
const CELL=500;const eGrid=new Map();
function gkey(cx,cy){return cx*100003+cy}
for(const e of edges){
  const A=nodes[e.a];const steps=Math.ceil(e.len/150);
  for(let i=0;i<=steps;i++){
    const x=A.x+e.dx*e.len*i/steps,y=A.y+e.dy*e.len*i/steps;
    const cx0=Math.floor((x-200)/CELL),cx1=Math.floor((x+200)/CELL),cy0=Math.floor((y-200)/CELL),cy1=Math.floor((y+200)/CELL);
    for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){const k=gkey(cx,cy);let l=eGrid.get(k);if(!l){l=[];eGrid.set(k,l)}if(l[l.length-1]!==e.id&&!l.includes(e.id))l.push(e.id)}
  }
}
function segClosest(e,x,y){const A=nodes[e.a];const t=clamp(((x-A.x)*e.dx+(y-A.y)*e.dy),0,e.len);const px=A.x+e.dx*t,py=A.y+e.dy*t;return{t,px,py,d:Math.hypot(x-px,y-py)}}
/* Nearest road: returns {e,t,d,margin} where margin=d-halfwidth */
function nearestRoad(x,y){
  const l=eGrid.get(gkey(Math.floor(x/CELL),Math.floor(y/CELL)));
  let best=null,bm=1e18;
  if(l)for(const id of l){const e=edges[id];const c=segClosest(e,x,y);const m=c.d-e.w/2;if(m<bm){bm=m;best={e,t:c.t,d:c.d,margin:m,px:c.px,py:c.py}}}
  return best;
}
/* Minimum road margin anywhere nearby (used when placing buildings) */
function roadMargin(x,y){
  const cx=Math.floor(x/CELL),cy=Math.floor(y/CELL);let bm=1e18;
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const l=eGrid.get(gkey(cx+i,cy+j));if(!l)continue;for(const id of l){const e=edges[id];const c=segClosest(e,x,y);const m=c.d-e.w/2;if(m<bm)bm=m}}
  return bm;
}
function nearestNode(x,y){let b=0,bd=1e18;for(const n of nodes){const d=(n.x-x)*(n.x-x)+(n.y-y)*(n.y-y);if(d<bd){bd=d;b=n.id}}return b}

/* ===== Pathfinding (Dijkstra, closed roads avoided) ===== */
function dijkstra(src,avoidClosed=true){
  const n=nodes.length,dist=new Float64Array(n).fill(1e18),prev=new Int32Array(n).fill(-1),prevE=new Int32Array(n).fill(-1),done=new Uint8Array(n);
  dist[src]=0;
  for(let it=0;it<n;it++){
    let u=-1,bd=1e18;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<bd){bd=dist[i];u=i}
    if(u<0)break;done[u]=1;
    for(const id of nodes[u].adj){const e=edges[id];if(avoidClosed&&e.closed>0)continue;const v=e.a===u?e.b:e.a;const nd=dist[u]+e.len;if(nd<dist[v]){dist[v]=nd;prev[v]=u;prevE[v]=id}}
  }
  return{dist,prev,prevE};
}
function pathTo(dm,dst){const p=[];let c=dst;while(c>=0){p.push(c);c=dm.prev[c]}return p.reverse()}

/* ===== Buildings ===== */
const buildings=[];const bGrid=new Map();const BC=700;
const reserved=[]; // circles kept free of ordinary buildings
function addBuilding(b){
  b.cos=Math.cos(b.ang);b.sin=Math.sin(b.ang);b.id=buildings.length;buildings.push(b);
  const r=Math.hypot(b.hw,b.hh);
  for(let cx=Math.floor((b.x-r)/BC);cx<=Math.floor((b.x+r)/BC);cx++)for(let cy=Math.floor((b.y-r)/BC);cy<=Math.floor((b.y+r)/BC);cy++){const k=gkey(cx,cy);let l=bGrid.get(k);if(!l){l=[];bGrid.set(k,l)}l.push(b.id)}
}
function corners(b){const c=[];for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]]){const lx=sx*b.hw,ly=sy*b.hh;c.push([b.x+lx*b.cos-ly*b.sin,b.y+lx*b.sin+ly*b.cos])}return c}
function rectsOverlap(a,b,pad){
  const ax=[[a.cos,a.sin],[-a.sin,a.cos]],bx=[[b.cos,b.sin],[-b.sin,b.cos]];
  const ca=corners(a),cb=corners(b);
  for(const ax_ of [...ax,...bx]){
    let amin=1e18,amax=-1e18,bmin=1e18,bmax=-1e18;
    for(const c of ca){const p=c[0]*ax_[0]+c[1]*ax_[1];if(p<amin)amin=p;if(p>amax)amax=p}
    for(const c of cb){const p=c[0]*ax_[0]+c[1]*ax_[1];if(p<bmin)bmin=p;if(p>bmax)bmax=p}
    if(amax+pad<bmin||bmax+pad<amin)return false;
  }
  return true;
}
function buildingsNear(x,y,r){
  const out=[];const seen=new Set();
  for(let cx=Math.floor((x-r)/BC);cx<=Math.floor((x+r)/BC);cx++)for(let cy=Math.floor((y-r)/BC);cy<=Math.floor((y+r)/BC);cy++){const l=bGrid.get(gkey(cx,cy));if(l)for(const id of l){if(!seen.has(id)){seen.add(id);out.push(buildings[id])}}}
  return out;
}
function tryPlace(b){
  for(const r of reserved){if(Math.hypot(b.x-r.x,b.y-r.y)<r.r+Math.hypot(b.hw,b.hh))return false}
  b.cos=Math.cos(b.ang);b.sin=Math.sin(b.ang);
  const pts=[[b.x,b.y],...corners(b)];
  for(const p of pts){if(roadMargin(p[0],p[1])<34)return false}
  // mid-edges too (long walls)
  for(const[sx,sy]of[[0,-1],[1,0],[0,1],[-1,0]]){const lx=sx*b.hw,ly=sy*b.hh;if(roadMargin(b.x+lx*b.cos-ly*b.sin,b.y+lx*b.sin+ly*b.cos)<34)return false}
  for(const o of buildingsNear(b.x,b.y,Math.hypot(b.hw,b.hh)+40)){if(rectsOverlap(b,o,8))return false}
  addBuilding(b);return true;
}
const PAL={
  cbd:['#b9b4aa','#a7a39b','#c9c3b6','#8f9096','#b2a899','#9c9a95'],
  glass:['#6f9fb8','#5f8da8','#7aa9bd','#4f7d99','#8bb3c4'],
  flats:['#d2b9a5','#c9a893','#bfae9f','#d6c5ae','#b59c8c'],
  campus:['#b86f58','#a9674f','#c28a6e','#b5b0a6'],
  industrial:['#9aa0a3','#8a9093','#a8a49a','#7f868a'],
  brick:['#b4694a','#a35b3f','#c17a56','#9b5a46'],
  mall:['#d6d3cb','#cbc8bf','#bfd0c2','#d9d1c2'],
  low:['#c7684f','#4f8f8c','#d9a441','#7a6fa5','#b9856a'],
  suburb:['#b7634f','#8c8f98','#a7745a','#9b5f4a'],
  township:['#4f86b8','#c8553d','#d6a23a','#4e9a6b','#8a8f96','#b5655a'],
  park:['#cfd3d6','#b9c1c9','#aeb6bd','#c6cbd0']
};
function genBuildings(){
  const rows=(d)=>({cbd:3,flats:3,glass:2,mall:2,brick:2,industrial:2,campus:2,low:2,suburb:2,township:3,park:2}[d.style]||2);
  for(const e of edges){
    const A=nodes[e.a],B=nodes[e.b];
    const r=rngFrom(e.id*977+13);
    const mid=districtAt(A.x+e.dx*e.len/2,A.y+e.dy*e.len/2);
    const D=mid.d;
    const farMid=mid.dist>4400;
    if(e.type==='hwy'&&farMid)continue;
    const sides=[1,-1];
    for(const side of sides){
      const nx=-e.dy*side,ny=e.dx*side;
      const nrow=e.type==='hwy'?1:rows(D);
      let offBase=e.w/2+34;
      for(let row=0;row<nrow;row++){
        let s=nodes[e.a].clear+18+r()*30;const end=e.len-nodes[e.b].clear-18;
        let rowDepth=0;
        while(s<end){
          const st=D.style;let kind,w,dpt,col;
          const R=r();
          if(st==='township'){kind=R<0.07?'shop':'house';w=kind==='shop'?46:34+r()*10;dpt=kind==='shop'?30:30+r()*8;col=PAL.township[(r()*6)|0];}
          else if(st==='low'||st==='suburb'){kind=R<0.18&&st==='suburb'?'block':'house';w=kind==='house'?(st==='low'?48+r()*22:56+r()*26):80+r()*40;dpt=kind==='house'?44+r()*18:60+r()*30;col=PAL[st][(r()*PAL[st].length)|0];}
          else if(st==='mall'||st==='park'){kind=R<0.3?'mall':'block';w=kind==='mall'?200+r()*140:90+r()*70;dpt=kind==='mall'?150+r()*60:80+r()*50;col=PAL[st][(r()*PAL[st].length)|0];}
          else if(st==='industrial'){kind=R<0.6?'warehouse':'block';w=100+r()*100;dpt=90+r()*60;col=PAL[st][(r()*PAL[st].length)|0];}
          else if(st==='glass'){kind=R<0.18?'mall':'tower';w=kind==='mall'?180+r()*80:90+r()*60;dpt=kind==='mall'?140+r()*40:90+r()*50;col=PAL.glass[(r()*PAL.glass.length)|0];}
          else {kind=(st==='cbd'||st==='flats')&&R<0.55?'tower':'block';w=78+r()*70;dpt=84+r()*66;col=PAL[st][(r()*PAL[st].length)|0];}
          if(e.type==='hwy'){w*=0.9}
          const gap=kind==='house'?6+r()*8:10+r()*14;
          const c=s+w/2;
          const cx=A.x+e.dx*c+nx*(offBase+dpt/2),cy=A.y+e.dy*c+ny*(offBase+dpt/2);
          const ht=kind==='tower'?(st==='cbd'?1.4:1.1)+r()*0.8:kind==='house'||kind==='shop'?0.25:kind==='mall'?0.3:0.5+r()*0.5;
          const placed=tryPlace({x:cx,y:cy,hw:w/2,hh:dpt/2,ang:e.ang+(side<0?Math.PI:0)*0,kind,col,ht,seed:(r()*1e9)|0,st,face:side});
          s+=w+gap;rowDepth=Math.max(rowDepth,dpt);
        }
        offBase+=rowDepth+16;
      }
    }
  }
}
/* Service points: fuel stations and panel beaters */
const services=[];
function edgeBy(p,q){const a=nodeKey.get(p[0]+','+p[1]),b=nodeKey.get(q[0]+','+q[1]);for(const e of edges){if((e.a===a&&e.b===b)||(e.a===b&&e.b===a))return{e,fwd:e.a===a}}return null}
function addService(type,p,q,t,name){
  const f=edgeBy(p,q);if(!f)return;const e=f.e;
  const dx=f.fwd?e.dx:-e.dx,dy=f.fwd?e.dy:-e.dy;
  const A=f.fwd?nodes[e.a]:nodes[e.b];
  const bx=A.x+dx*e.len*t,by=A.y+dy*e.len*t;
  const nx=dy,ny=-dx; // left of travel direction (left-hand traffic)
  const dep=e.w/2;
  const s={type,name,x:bx+nx*(dep+62),y:by+ny*(dep+62),nx,ny,tx:dx,ty:dy,ang:Math.atan2(dy,dx),road:e.id,w:e.w,bx,by};
  s.cx=bx+nx*(dep+110);s.cy=by+ny*(dep+110);
  services.push(s);reserved.push({x:s.cx,y:s.cy,r:230});
  const d=districtAt(bx,by).d;s.district=d;
  // back building
  addBuilding({x:bx+nx*(dep+205),y:by+ny*(dep+205),hw:type==='fuel'?95:85,hh:34,ang:Math.atan2(dy,dx),kind:type==='fuel'?'shopfront':'garage',col:type==='fuel'?'#e9e7e0':'#cfd2cf',ht:0.35,seed:services.length*31,st:'svc',face:1});
}
addService('fuel',[1500,4600],[1850,4600],0.5,'Rosettenville Fuel');
addService('fuel',[3400,3600],[4100,3600],0.45,'Oxford Road Fuel');
addService('fuel',[3900,700],[4400,700],0.5,'Midrand Fuel');
addService('fuel',[4200,5300],[4600,5300],0.5,'Eastgate Fuel');
addService('fuel',[500,7200],[900,7200],0.5,'Orlando Fuel');
addService('fuel',[1800,2500],[1800,3100],0.5,'Republic Fuel');
addService('fuel',[2600,5300],[3000,5300],0.5,'Market Street Fuel');
addService('repair',[3100,2000],[3500,2000],0.5,'Sandton Panel Beaters');
addService('repair',[2200,5300],[2600,5300],0.5,'Newtown Panel Beaters');
addService('repair',[900,6900],[900,7200],0.5,'Soweto Panel Beaters');
addService('repair',[4400,700],[4400,1000],0.5,'Midrand Panel Beaters');
genBuildings();

/* World extents */
let minX=1e18,minY=1e18,maxX=-1e18,maxY=-1e18;
for(const n of nodes){minX=Math.min(minX,n.x);minY=Math.min(minY,n.y);maxX=Math.max(maxX,n.x);maxY=Math.max(maxY,n.y)}
const WB={x0:minX-1500,y0:minY-1500,x1:maxX+1500,y1:maxY+1500};
/* ===== Vehicle sprites (drawn once, cached) ===== */
if(!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){const rs=Array.isArray(r)?r:[r,r,r,r];const[a,b,c,d]=rs.length===4?rs:[rs[0],rs[0],rs[0],rs[0]];this.moveTo(x+a,y);this.lineTo(x+w-b,y);this.quadraticCurveTo(x+w,y,x+w,y+b);this.lineTo(x+w,y+h-c);this.quadraticCurveTo(x+w,y+h,x+w-c,y+h);this.lineTo(x+d,y+h);this.quadraticCurveTo(x,y+h,x,y+h-d);this.lineTo(x,y+d);this.quadraticCurveTo(x,y,x+a,y)}}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=(n>>16)+amt,g=((n>>8)&255)+amt,b=(n&255)+amt;r=clamp(r,0,255);g=clamp(g,0,255);b=clamp(b,0,255);return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1)}
const SPR=2;
const VT={
  hatch:{L:46,W:24,acc:170,sm:1.0},sedan:{L:54,W:25,acc:160,sm:1.0},suv:{L:56,W:27,acc:150,sm:0.97},
  bakkie:{L:62,W:27,acc:140,sm:0.95},van:{L:62,W:28,acc:120,sm:0.9},taxi:{L:66,W:28,acc:190,sm:1.12,taxi:true},
  bus:{L:118,W:32,acc:80,sm:0.82},truck:{L:124,W:31,acc:70,sm:0.8}
};
const PAINT=['#e9e9e6','#e9e9e6','#e9e9e6','#b8bcc2','#b8bcc2','#4b5058','#25272b','#a8333a','#2d4f86','#c8b89a','#3f6b52','#6b2a33'];
const STRIPE=['#2a6fd0','#2a9d5f','#e08a1e','#7a45b8'];
function wheelsAt(g,W,xs){g.fillStyle='#14161a';for(const x of xs)for(const s of[-1,1]){g.beginPath();g.roundRect(x-4.4,s*(W/2-0.4)-1.6,8.8,3.2,1.2);g.fill()}}
function bodyPath(g,L,W,c,rRear,rFront){
  const gr=g.createLinearGradient(0,-W/2,0,W/2);gr.addColorStop(0,shade(c,16));gr.addColorStop(.5,c);gr.addColorStop(1,shade(c,-22));
  g.fillStyle=gr;g.beginPath();g.roundRect(-L/2,-W/2,L,W,[rRear,rFront,rFront,rRear]);g.fill();
  g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=.6;g.stroke();
}
function glassQuad(g,xa,xb,wa,wb,col){ // from xa (width wa) to xb (width wb)
  g.fillStyle=col||'#202a33';g.beginPath();g.moveTo(xa,-wa/2);g.lineTo(xb,-wb/2);g.lineTo(xb,wb/2);g.lineTo(xa,wa/2);g.closePath();g.fill();
  const gl=g.createLinearGradient(xa,-wa/2,xb,wb/2);gl.addColorStop(0,'rgba(255,255,255,.26)');gl.addColorStop(.45,'rgba(255,255,255,0)');
  g.fillStyle=gl;g.fill();
}
function roofRect(g,x0,x1,w,c,r){const gr=g.createLinearGradient(0,-w/2,0,w/2);gr.addColorStop(0,shade(c,26));gr.addColorStop(1,shade(c,-6));g.fillStyle=gr;g.beginPath();g.roundRect(x0,-w/2,x1-x0,w,r);g.fill();g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=.5;g.stroke()}
function lights(g,L,W,inset){
  g.fillStyle='#fff6cf';for(const s of[-1,1]){g.beginPath();g.roundRect(L/2-2.6,s*(W/2-inset)-1.6,2.6,3.2,.8);g.fill()}
  g.fillStyle='#b3242b';for(const s of[-1,1]){g.beginPath();g.roundRect(-L/2,s*(W/2-inset)-1.5,2,3,.6);g.fill()}
}
function mirrors(g,x,W,c){g.fillStyle=shade(c,-30);for(const s of[-1,1]){g.beginPath();g.roundRect(x-1.6,s*(W/2+.9)-1.1,3.2,2.2,.8);g.fill()}}
function buildSprite(kind,c1,c2){
  const sp=VT[kind],L=sp.L,W=sp.W,pad=8,cw=L+pad*2,ch=W+pad*2;
  const cv=document.createElement('canvas');cv.width=Math.ceil(cw*SPR);cv.height=Math.ceil(ch*SPR);
  const g=cv.getContext('2d');g.scale(SPR,SPR);g.translate(cw/2,ch/2);
  const car=(o)=>{
    wheelsAt(g,W,o.wh);bodyPath(g,L,W,c1,W*.26,W*.4);
    // hood sheen
    g.fillStyle='rgba(255,255,255,.07)';g.beginPath();g.roundRect(o.hood0,-W/2+2,L/2-o.hood0-1.5,W-4,W*.3);g.fill();
    glassQuad(g,o.ws0,o.ws1,W*.72,W*.84);                       // windscreen
    glassQuad(g,o.rg1,o.rg0,W*.68,W*.58);                       // rear glass
    roofRect(g,o.rg1,o.ws0,W*.74,c1,W*.2);
    // side glass hints
    g.fillStyle='rgba(20,28,36,.55)';for(const s of[-1,1]){g.fillRect(o.rg1+1,s*(W*.37)-(s>0?0:1.1),o.ws0-o.rg1-2,1.1)}
    mirrors(g,o.ws1,W,c1);lights(g,L,W,3.6);
    // panel seams
    g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=.45;g.beginPath();g.moveTo(o.hood0,-W/2+1.5);g.lineTo(o.hood0,W/2-1.5);g.stroke();
  };
  if(kind==='hatch')car({wh:[-L*.3,L*.3],hood0:12,ws0:5,ws1:12,rg0:-17,rg1:-11});
  else if(kind==='sedan')car({wh:[-L*.3,L*.3],hood0:16,ws0:8,ws1:15,rg0:-14,rg1:-7});
  else if(kind==='suv')car({wh:[-L*.3,L*.3],hood0:17,ws0:12,ws1:17,rg0:-22,rg1:-18});
  else if(kind==='bakkie'){
    wheelsAt(g,W,[-L*.3,L*.3]);bodyPath(g,L,W,c1,W*.2,W*.4);
    glassQuad(g,6,13,W*.72,W*.84);glassQuad(g,-7,-5,W*.6,W*.6);roofRect(g,-6,6,W*.72,c1,W*.2);
    // open load bed
    g.fillStyle='#2a2d31';g.beginPath();g.roundRect(-L/2+2,-W/2+2.4,L/2-6-(-6)-10,W-4.8,1.2);g.fill();
    g.strokeStyle='rgba(255,255,255,.1)';g.lineWidth=.5;for(let x=-L/2+6;x<-8;x+=4){g.beginPath();g.moveTo(x,-W/2+3);g.lineTo(x,W/2-3);g.stroke()}
    mirrors(g,13,W,c1);lights(g,L,W,3.6);
  }else if(kind==='van'){
    wheelsAt(g,W,[-L*.3,L*.3]);bodyPath(g,L,W,c1,W*.2,W*.34);
    glassQuad(g,17,23,W*.8,W*.88);roofRect(g,-L/2+1.5,17,W-4,c1,2);
    g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=.6;for(let x=-L/2+6;x<14;x+=6){g.beginPath();g.moveTo(x,-W/2+3);g.lineTo(x,W/2-3);g.stroke()}
    g.fillStyle=c2;g.fillRect(-L/2+1.5,-1.6,L-6,3.2);
    mirrors(g,22,W,c1);lights(g,L,W,3.8);
  }else if(kind==='taxi'){
    wheelsAt(g,W,[-L*.3,L*.3]);bodyPath(g,L,W,c1,W*.22,W*.36);
    g.fillStyle=c2;g.fillRect(-L/2+2,-W/2+1.1,L-4,1.6);g.fillRect(-L/2+2,W/2-2.7,L-4,1.6);
    glassQuad(g,17,25,W*.82,W*.9);roofRect(g,-L/2+2,17,W-6,c1,3);
    g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=.6;for(let x=-24;x<14;x+=8){g.beginPath();g.moveTo(x,-W/2+4);g.lineTo(x,W/2-4);g.stroke()}
    g.fillStyle='rgba(20,28,36,.5)';for(const s of[-1,1])g.fillRect(-26,s*(W/2-3.6)-(s>0?0:.9),40,.9);
    g.fillStyle='#f5d56a';g.beginPath();g.roundRect(5,-3.2,6,6.4,1);g.fill();      // roof sign
    mirrors(g,25,W,c1);lights(g,L,W,3.6);
  }else if(kind==='bus'){
    wheelsAt(g,W,[-L*.32,L*.3]);bodyPath(g,L,W,c1,W*.18,W*.3);
    glassQuad(g,50,57,W*.86,W*.92);roofRect(g,-L/2+2,50,W-5,c1,3);
    g.fillStyle='rgba(255,255,255,.35)';g.fillRect(-L/2+2,-W/2+1,L-4,1.4);g.fillRect(-L/2+2,W/2-2.4,L-4,1.4);
    g.fillStyle=shade(c1,-26);for(const x of[-30,2,-8]){g.beginPath();g.roundRect(x,-5,12,10,1.5);g.fill()}
    g.fillStyle='rgba(20,28,36,.55)';for(const s of[-1,1])for(let x=-52;x<46;x+=10)g.fillRect(x,s*(W/2-4.2)-(s>0?0:1),8,1);
    mirrors(g,56,W,c1);lights(g,L,W,4);
  }else if(kind==='truck'){
    wheelsAt(g,W,[-L*.36,-L*.22,L*.32]);
    g.fillStyle=c2;const gr=g.createLinearGradient(0,-W/2,0,W/2);gr.addColorStop(0,shade(c2,18));gr.addColorStop(1,shade(c2,-18));g.fillStyle=gr;
    g.beginPath();g.roundRect(-L/2,-W/2+1,L-33,W-2,2.5);g.fill();g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=.6;g.stroke();
    g.strokeStyle='rgba(0,0,0,.14)';for(let x=-L/2+6;x<L/2-36;x+=7){g.beginPath();g.moveTo(x,-W/2+3);g.lineTo(x,W/2-3);g.stroke()}
    g.save();g.translate(L/2-30,0);bodyPath(g,30,W-2,c1,3,W*.28);g.restore();
    glassQuad(g,L/2-9,L/2-3,W*.78,W*.86);roofRect(g,L/2-27,L/2-9,W*.76,c1,3);
    mirrors(g,L/2-8,W,c1);lights(g,L,W,4.2);
  }
  return{cv,cw,ch};
}
const spriteCache=new Map();
function getSprite(kind,c1,c2){const k=kind+c1+(c2||'');let s=spriteCache.get(k);if(!s){s=buildSprite(kind,c1,c2||'#fff');spriteCache.set(k,s)}return s}
function drawVehicleSprite(g,kind,c1,c2,x,y,ang,night,brake,hazard,indic,blink){
  const sp=VT[kind],s=getSprite(kind,c1,c2);
  g.save();g.translate(x+4.5,y+3.5);g.rotate(ang);g.fillStyle='rgba(20,22,24,.24)';g.beginPath();g.roundRect(-sp.L/2+1,-sp.W/2+1,sp.L-2,sp.W-2,sp.W*.3);g.fill();g.restore();
  g.save();g.translate(x,y);g.rotate(ang);g.drawImage(s.cv,-s.cw/2,-s.ch/2,s.cw,s.ch);
  if(brake){g.fillStyle='rgba(255,40,40,.95)';for(const sd of[-1,1]){g.fillRect(-sp.L/2-.4,sd*(sp.W/2-3.6)-1.8,2.6,3.6)}}
  if((hazard||indic)&&blink){g.fillStyle='#ffb000';for(const sd of[-1,1]){if(hazard||indic===sd){g.fillRect(sp.L/2-2.4,sd*(sp.W/2-1.6)-1,2.6,2);g.fillRect(-sp.L/2-.2,sd*(sp.W/2-1.6)-1,2.4,2)}}}
  g.restore();
}
function drawHeadlights(g,x,y,ang,L,W,power){
  g.save();g.translate(x,y);g.rotate(ang);
  const gr=g.createLinearGradient(L/2,0,L/2+190*power,0);gr.addColorStop(0,'rgba(255,244,205,.5)');gr.addColorStop(.6,'rgba(255,244,205,.14)');gr.addColorStop(1,'rgba(255,244,205,0)');
  g.fillStyle=gr;g.beginPath();g.moveTo(L/2,-W/2+4);g.lineTo(L/2+190*power,-W*1.7*power);g.lineTo(L/2+190*power,W*1.7*power);g.lineTo(L/2,W/2-4);g.closePath();g.fill();g.restore();
}
/* ===== Shared state ===== */
const G={t:0,hour:6.6,paused:true,rush:false,windows:false,night:0,started:false};
const P={x:0,y:0,ang:0,vx:0,vy:0,w:0,f:0,l:0,speed:0,fuel:20,cond:100,spec:{L:46,W:24},st:null,onRoad:true,hornT:0,revT:0,brakeLamp:false,fuelUsed:0,hit:0,dist:0};
const traffic=[],dynObs=[],peds=[],skids=[],puffs=[];
const keys={};
const vHash=new Map();
const vkey=(cx,cy)=>cx*7919+cy;
function rebuildVHash(){vHash.clear();for(const v of traffic.concat([P])){const k=vkey(Math.floor(v.x/200),Math.floor(v.y/200));let l=vHash.get(k);if(!l){l=[];vHash.set(k,l)}l.push(v)}}
function vehiclesNear(x,y,r){const out=[];for(let cx=Math.floor((x-r)/200);cx<=Math.floor((x+r)/200);cx++)for(let cy=Math.floor((y-r)/200);cy<=Math.floor((y+r)/200);cy++){const l=vHash.get(vkey(cx,cy));if(l)for(const o of l)out.push(o)}return out}
const spec_of=v=>v===P?P.spec:v.sp;

/* ===== Lane geometry ===== */
function laneXY(e,fwd,s,lat){const A=nodes[fwd?e.a:e.b];const dx=fwd?e.dx:-e.dx,dy=fwd?e.dy:-e.dy;const off=e.w/4+lat;return[A.x+dx*s+dy*off,A.y+dy*s-dx*off,Math.atan2(dy,dx)]}
const cross2=(ax,ay,bx,by)=>ax*by-ay*bx;
function planNext(v){
  const e=edges[v.e],end=nodes[v.fwd?e.b:e.a];
  let c=[];for(const id of end.adj){if(id===e.id)continue;const ne=edges[id];c.push({e:ne,fwd:ne.a===end.id})}
  const open=c.filter(k=>k.e.closed<=0);if(open.length)c=open;
  const d1a=Math.atan2(v.fwd?e.dy:-e.dy,v.fwd?e.dx:-e.dx);
  let ch;
  if(!c.length)ch={e,fwd:!v.fwd,u:true,a:Math.PI};
  else{
    let tot=0;for(const k of c){k.a=angDiff(d1a,Math.atan2(k.fwd?k.e.dy:-k.e.dy,k.fwd?k.e.dx:-k.e.dx));k.w=Math.abs(k.a)<.35?3:1;if(k.e.type==='hwy'&&e.type!=='hwy')k.w*=.3;if(v.sp.taxi&&k.e.type==='main')k.w*=1.4;tot+=k.w}
    let r=rnd()*tot;ch=c[c.length-1];for(const k of c){r-=k.w;if(r<=0){ch=k;break}}
  }
  const P0=laneXY(e,v.fwd,e.len-end.clear,0);
  const P2=ch.u?laneXY(e,!v.fwd,end.clear,0):laneXY(ch.e,ch.fwd,end.clear,0);
  const d1=[Math.cos(P0[2]),Math.sin(P0[2])],d2=[Math.cos(P2[2]),Math.sin(P2[2])];
  let P1;const cr=cross2(d1[0],d1[1],d2[0],d2[1]);
  if(ch.u){P1=[(P0[0]+P2[0])/2+d1[0]*70,(P0[1]+P2[1])/2+d1[1]*70]}
  else if(Math.abs(cr)<.05){P1=[(P0[0]+P2[0])/2,(P0[1]+P2[1])/2]}
  else{const a=cross2(P2[0]-P0[0],P2[1]-P0[1],d2[0],d2[1])/cr;P1=(a<0||a>420)?[(P0[0]+P2[0])/2,(P0[1]+P2[1])/2]:[P0[0]+d1[0]*a,P0[1]+d1[1]*a]}
  let len=0,px=P0[0],py=P0[1];for(let i=1;i<=10;i++){const u=i/10,m=1-u;const x=m*m*P0[0]+2*m*u*P1[0]+u*u*P2[0],y=m*m*P0[1]+2*m*u*P1[1]+u*u*P2[1];len+=Math.hypot(x-px,y-py);px=x;py=y}
  v.next={e:ch.e.id,fwd:ch.fwd,u:!!ch.u,p0:P0,p1:P1,p2:P2,len:Math.max(len,10),turn:ch.u?0:Math.abs(ch.a)<.35?0:ch.a>0?1:-1};
}
function bez(n,u){const m=1-u;const x=m*m*n.p0[0]+2*m*u*n.p1[0]+u*u*n.p2[0],y=m*m*n.p0[1]+2*m*u*n.p1[1]+u*u*n.p2[1];const dx=2*m*(n.p1[0]-n.p0[0])+2*u*(n.p2[0]-n.p1[0]),dy=2*m*(n.p1[1]-n.p0[1])+2*u*(n.p2[1]-n.p1[1]);return[x,y,Math.atan2(dy,dx)]}

/* ===== Traffic ===== */
function makeVehicle(kind){
  const sp=VT[kind];let c1,c2;
  if(kind==='taxi'){c1='#ecebe4';c2=pick(STRIPE)}
  else if(kind==='bus'){c1=pick(['#2a6fd0','#c9392b','#2a9d5f','#d9a21e']);c2=null}
  else if(kind==='truck'){c1=pick(['#a8333a','#2d4f86','#3f6b52','#b8bcc2']);c2=pick(['#e9e9e6','#cfd3d6','#2d4f86'])}
  else if(kind==='van'){c1='#eeeeea';c2=pick(['#2a9d5f','#e08a1e','#2a6fd0','#c9392b'])}
  else{c1=pick(PAINT);c2=null}
  return{kind,sp,c1,c2,x:0,y:0,ang:0,speed:0,pers:rr(.86,1.06),lat:0,latT:0,mode:'lane',s:0,u:0,e:0,fwd:true,next:null,blockedT:0,hitT:0,stuckT:0,stopT:0,stopping:false,parked:false,noStop:rr(2,10),cleared:false,honkCool:rr(0,6),indic:0,hazard:false};
}
function pickKind(type){
  const r=rnd();
  if(type==='hwy')return r<.22?'truck':r<.28?'bus':r<.5?'taxi':r<.62?'suv':r<.72?'bakkie':r<.8?'van':r<.9?'sedan':'hatch';
  if(type==='main')return r<.1?'bus':r<.14?'truck':r<.34?'taxi':r<.46?'suv':r<.56?'bakkie':r<.64?'van':r<.82?'sedan':'hatch';
  return r<.02?'bus':r<.05?'truck':r<.22?'taxi':r<.34?'suv':r<.46?'bakkie':r<.52?'van':r<.72?'sedan':'hatch';
}
const edgeLenTotal=edges.reduce((a,e)=>a+e.len,0);
function spawnAI(minR,maxR){
  for(let tries=0;tries<12;tries++){
    let r=rnd()*edgeLenTotal,e=edges[0];for(const k of edges){r-=k.len;if(r<=0){e=k;break}}
    if(e.closed>0)continue;
    const fwd=rnd()<.5;const kind=pickKind(e.type);const v=makeVehicle(kind);
    const sS=nodes[fwd?e.a:e.b].clear+30,sE=e.len-nodes[fwd?e.b:e.a].clear-v.sp.L-30;if(sE<=sS)continue;
    const s=rr(sS,sE);const[x,y,a]=laneXY(e,fwd,s,0);const d=Math.hypot(x-P.x,y-P.y);
    if(d<minR||d>maxR)continue;
    let free=true;for(const o of vehiclesNear(x,y,130)){if(Math.hypot(o.x-x,o.y-y)<110){free=false;break}}
    if(!free)continue;
    v.e=e.id;v.fwd=fwd;v.s=s;v.x=x;v.y=y;v.ang=a;v.speed=ROAD[e.type].v*.6;planNext(v);traffic.push(v);return true;
  }
  return false;
}
function aheadCap(v,fx,fy){
  const sp=v.sp,look=45+v.speed*1.05+sp.L;let cap=1e9,hit=null;
  for(const o of vehiclesNear(v.x+fx*look*.5,v.y+fy*look*.5,look*.6)){
    if(o===v||o.parked)continue;
    const os=spec_of(o);const rx=o.x-v.x,ry=o.y-v.y;const f=rx*fx+ry*fy;if(f<=0||f>look)continue;
    const l=-rx*fy+ry*fx;if(Math.abs(l)>(sp.W+os.W)/2*.95+3)continue;
    const gap=f-(sp.L+os.L)/2;const ospd=Math.max(o===P?P.f:o.speed,0);
    const c=Math.max(0,(gap-(sp.taxi?7:14)))*1.25+ospd*.85;
    if(c<cap){cap=c;hit=o}
  }
  return{cap,hit};
}
function aiStep(v,dt){
  const sp=v.sp;const e=edges[v.e];
  const startN=nodes[v.fwd?e.a:e.b],endN=nodes[v.fwd?e.b:e.a];
  let cap=ROAD[e.type].v*v.pers*sp.sm*(G.rush&&e.type!=='hwy'?.9:1),limitedByCar=false;
  v.honkCool-=dt;v.noStop-=dt;
  let fx,fy;
  if(v.mode==='lane'){
    const dx=v.fwd?e.dx:-e.dx,dy=v.fwd?e.dy:-e.dy;fx=dx;fy=dy;
    const sEnd=e.len-endN.clear;const front=v.s+sp.L/2;
    // traffic light
    if(endN.light&&!v.cleared){
      const axis=Math.abs(dx)>=Math.abs(dy)?0:1;const st=lightState(endN,axis,G.t);const dist=sEnd-4-front;
      if(dist<70&&(st===0||(st===1&&dist<v.speed*.55)))v.cleared=dist<70;
      if(!v.cleared&&(st!==0)&&dist>-3){cap=Math.min(cap,Math.sqrt(2*260*Math.max(0,dist)))}
    }
    // slow for turn
    const dEnd=sEnd-v.s;
    if(dEnd<170&&v.next){cap=Math.min(cap,v.next.u?60:v.next.turn?118:ROAD[e.type].v*.8);v.indic=v.next.turn}
    else v.indic=0;
    // taxi curb stops
    if(sp.taxi&&e.type!=='hwy'){
      if(!v.stopping&&v.noStop<=0&&v.s>e.len*.18&&dEnd>420&&rnd()<dt*.02){v.stopping=true;v.latT=20}
      if(v.stopping){cap=Math.min(cap,v.stopT>0?0:55)}
      if(v.stopping&&v.speed<2&&!v.parked&&v.stopT<=0){v.stopT=rr(3,6.5);v.parked=true;v.hazard=true}
      if(v.parked){v.stopT-=dt;if(v.stopT<=0){v.parked=false;v.stopping=false;v.latT=0;v.noStop=rr(25,60);v.hazard=false;v.stopT=0}}
    }
  }else{
    const t=bez(v.next,clamp(v.u,0,1));fx=Math.cos(t[2]);fy=Math.sin(t[2]);
    cap=Math.min(cap,v.next.u?60:v.next.turn?118:ROAD[e.type].v*.8);
  }
  if(v.hitT>0){v.hitT-=dt;cap=0}
  const a=aheadCap(v,fx,fy);if(a.cap<cap){cap=a.cap;limitedByCar=true}
  // speed update
  if(v.speed>cap)v.speed=Math.max(cap,v.speed-440*dt);else v.speed=Math.min(cap,v.speed+sp.acc*dt);
  if(v.speed<.5)v.speed=0;
  // lateral shift (curb stops)
  v.lat+=(v.latT-v.lat)*Math.min(1,dt*2.4);
  // honking when stuck behind something
  if(limitedByCar&&v.speed<4&&!v.parked)v.blockedT+=dt;else v.blockedT=Math.max(0,v.blockedT-dt*2);
  if(v.blockedT>(sp.taxi?1.1:2.8)&&v.honkCool<=0){v.honkCool=rr(4,9);v.blockedT=0;if(typeof SFX!=='undefined')SFX.horn(v.x,v.y,sp.taxi?'taxi':'car')}
  if(v.speed<3&&!v.parked)v.stuckT+=dt;else v.stuckT=0;
  // advance
  let X,Y,A;
  if(v.mode==='lane'){
    v.s+=v.speed*dt;
    if(v.s>=e.len-endN.clear){v.mode='turn';v.u=0}
    [X,Y,A]=laneXY(e,v.fwd,v.s,v.lat);
  }
  if(v.mode==='turn'){
    v.u+=v.speed*dt/v.next.len;
    if(v.u>=1){const n=v.next;v.e=n.e;v.fwd=n.fwd;v.s=nodes[n.fwd?edges[n.e].a:edges[n.e].b]===endN?endN.clear:endN.clear;v.mode='lane';v.cleared=false;v.lat=0;v.latT=0;planNext(v);[X,Y,A]=laneXY(edges[v.e],v.fwd,v.s,0);v.indic=0}
    else{[X,Y,A]=bez(v.next,v.u)}
  }
  v.x=X;v.y=Y;v.ang+=angDiff(v.ang,A)*Math.min(1,dt*14);
}
function trafficTick(dt){
  rebuildVHash();
  for(let i=traffic.length-1;i>=0;i--){
    const v=traffic[i];aiStep(v,dt);
    const d=Math.hypot(v.x-P.x,v.y-P.y);
    if(d>3500||v.stuckT>45||(d>2200&&v.stuckT>12)||edges[v.e].closed>0&&v.mode==='lane'&&G.justClosed===v.e){traffic.splice(i,1)}
  }
  const target=G.rush?92:72;
  if(traffic.length<target){for(let k=0;k<3;k++)spawnAI(1450,2700)}
}

/* ===== Closures (cones and barriers on one road at a time) ===== */
function updateClosures(dt){
  G.closeT=(G.closeT===undefined?rr(30,60):G.closeT)-dt;
  if(G.closure){G.closure.left-=dt;if(G.closure.left<=0){edges[G.closure.e].closed=0;dynObs.length=0;G.closure=null}}
  if(!G.closure&&G.closeT<=0){
    G.closeT=rr(90,150);
    const c=[];for(const e of edges){if(e.type==='hwy'||e.len<900)continue;const A=nodes[e.a];const mx=A.x+e.dx*e.len/2,my=A.y+e.dy*e.len/2;const d=Math.hypot(mx-P.x,my-P.y);if(d>900&&d<3200)c.push(e)}
    if(c.length){
      const e=pick(c);e.closed=1;G.justClosed=e.id;G.closure={e:e.id,left:rr(80,130)};
      const A=nodes[e.a],mid=e.len/2;const mx=A.x+e.dx*mid,my=A.y+e.dy*mid;
      const nx=-e.dy,ny=e.dx;
      dynObs.push({x:mx,y:my,hw:e.w/2,hh:6,ang:e.ang+Math.PI/2,kind:'barrier',cos:Math.cos(e.ang+Math.PI/2),sin:Math.sin(e.ang+Math.PI/2)});
      for(const side of[-1,1])for(let k=1;k<=4;k++){const sx=mx+e.dx*side*(40+k*38)+nx*(((k%2)?1:-1)*e.w*.2),sy=my+e.dy*side*(40+k*38)+ny*(((k%2)?1:-1)*e.w*.2);dynObs.push({x:sx,y:sy,hw:5,hh:5,ang:0,kind:'cone',cos:1,sin:0})}
      G.closureMsg=true;
    }
  }
}

/* ===== Pedestrians (sidewalk, cosmetic) ===== */
const SHIRTS=['#d46a4e','#4e86d4','#e0b43a','#58a874','#8d63b8','#e8e6e0','#3b3f46','#c85a7a'];
function pedPos(p){const e=edges[p.e],A=nodes[e.a];return[A.x+e.dx*p.s-e.dy*p.side*(e.w/2+15),A.y+e.dy*p.s+e.dx*p.side*(e.w/2+15)]}
function pedsTick(dt){
  for(let i=peds.length-1;i>=0;i--){
    const p=peds[i],e=edges[p.e];p.s+=p.dir*p.v*dt;p.ph+=dt*p.v*.35;
    if(p.s<e.len*.04||p.s>e.len*.96)p.dir*=-1;
    const[x,y]=pedPos(p);p.x=x;p.y=y;
    if(Math.hypot(x-P.x,y-P.y)>1700)peds.splice(i,1);
  }
  let tries=0;
  while(peds.length<34&&tries++<4){
    const e=pick(edges);if(e.type==='hwy')continue;
    const dens=districtAt(nodes[e.a].x,nodes[e.a].y).d;
    const s=rr(e.len*.1,e.len*.9);const p={e:e.id,s,side:rnd()<.5?1:-1,dir:rnd()<.5?1:-1,v:rr(16,30),ph:rnd()*6,col:pick(SHIRTS),x:0,y:0};
    const[x,y]=pedPos(p);const d=Math.hypot(x-P.x,y-P.y);if(d<500||d>1500)continue;p.x=x;p.y=y;peds.push(p);
  }
}

/* ===== Player physics ===== */
function circlesOfPlayer(){
  const sp=P.spec,r=sp.W/2*.95,n=3;const c=Math.cos(P.ang),s=Math.sin(P.ang);const out=[];
  for(let i=0;i<n;i++){const o=lerp(-(sp.L/2-r),sp.L/2-r,i/(n-1));out.push([P.x+c*o,P.y+s*o,r])}
  return out;
}
function circlesOfAI(v){
  const sp=v.sp,r=sp.W/2*.92,n=Math.max(2,Math.round(sp.L/(sp.W*.95)));const c=Math.cos(v.ang),s=Math.sin(v.ang);const out=[];
  for(let i=0;i<n;i++){const o=lerp(-(sp.L/2-r),sp.L/2-r,i/(n-1));out.push([v.x+c*o,v.y+s*o,r])}
  return out;
}
function circleRect(cx,cy,r,b){
  const dx=cx-b.x,dy=cy-b.y;const lx=dx*b.cos+dy*b.sin,ly=-dx*b.sin+dy*b.cos;
  const qx=clamp(lx,-b.hw,b.hw),qy=clamp(ly,-b.hh,b.hh);let ex=lx-qx,ey=ly-qy;let d=Math.hypot(ex,ey);let pen;
  if(d>=r)return null;
  if(d<1e-6){const px=b.hw-Math.abs(lx),py=b.hh-Math.abs(ly);if(px<py){ex=Math.sign(lx)||1;ey=0;pen=px+r}else{ex=0;ey=Math.sign(ly)||1;pen=py+r}}
  else{pen=r-d;ex/=d;ey/=d}
  return{nx:ex*b.cos-ey*b.sin,ny:ex*b.sin+ey*b.cos,pen};
}
function hurt(impact,kind){
  if(impact<22||P.hit>0)return;P.hit=.2;
  const dmg=(impact-22)*.05*P.st.dmgMul;P.cond=Math.max(0,P.cond-dmg);
  if(typeof SFX!=='undefined')SFX.crash(impact,kind);
  if(typeof onPlayerImpact==='function')onPlayerImpact(impact,dmg,kind);
}
function collidePlayer(dt){
  P.hit-=dt;let worst=0,wk='';
  for(let pass=0;pass<2;pass++){
    const cs=circlesOfPlayer();
    const bs=buildingsNear(P.x,P.y,90);for(const o of dynObs)if(Math.hypot(o.x-P.x,o.y-P.y)<160)bs.push(o);
    for(const[cx,cy,r]of cs){
      for(const b of bs){
        const h=circleRect(cx,cy,r,b);if(!h)continue;
        P.x+=h.nx*h.pen;P.y+=h.ny*h.pen;
        const vn=P.vx*h.nx+P.vy*h.ny;
        if(vn<0){const e=b.kind==='cone'?.1:.22;P.vx-=(1+e)*vn*h.nx;P.vy-=(1+e)*vn*h.ny;const cr=(cx-P.x)*h.ny-(cy-P.y)*h.nx;P.w+=cr*vn*.0012;if(-vn>worst){worst=-vn;wk=b.kind==='cone'?'cone':'wall'}}
      }
    }
    for(const o of vehiclesNear(P.x,P.y,140)){
      if(o===P)continue;
      const ac=circlesOfAI(o);const pc=circlesOfPlayer();
      for(const[ax,ay,ar]of ac)for(const[px,py,pr]of pc){
        const dx=px-ax,dy=py-ay,d=Math.hypot(dx,dy),m=ar+pr;if(d>=m||d<1e-6)continue;
        const nx=dx/d,ny=dy/d,pen=m-d;P.x+=nx*pen*.85;P.y+=ny*pen*.85;
        const avx=Math.cos(o.ang)*o.speed,avy=Math.sin(o.ang)*o.speed;
        const vrel=(P.vx-avx)*nx+(P.vy-avy)*ny;
        if(vrel<0){const j=-(1.2)*vrel*.58;P.vx+=j*nx;P.vy+=j*ny;if(-vrel>worst){worst=-vrel;wk='car'}o.hitT=Math.max(o.hitT,1.4);if(o.honkCool<=0){o.honkCool=5;if(typeof SFX!=='undefined')SFX.horn(o.x,o.y,o.sp.taxi?'taxi':'car')}}
      }
    }
  }
  if(worst>0)hurt(worst,wk);
}
function playerStep(dt,inp){
  const st=P.st;let c=Math.cos(P.ang),s=Math.sin(P.ang);
  let f=P.vx*c+P.vy*s,l=-P.vx*s+P.vy*c;
  const road=nearestRoad(P.x,P.y);const onRoad=!!road&&road.margin<30;P.onRoad=onRoad;
  const alive=P.fuel>0&&P.cond>0;const thr=alive?inp.thr:0;
  const pm=.65+.35*Math.min(1,P.cond/50);const vmax=st.vmax*(onRoad?1:.6);
  let a=0;
  if(thr>0&&f>=-3)a+=st.power*pm*thr*Math.max(0,1-Math.pow(Math.max(f,0)/vmax,1.6));
  else if(thr>0)a+=st.brake*.8*thr;
  if(inp.brake>0){
    if(f>6){a-=st.brake*inp.brake;P.revT=0}
    else if(alive){P.revT+=dt;if(P.revT>.18)a-=st.power*.5*inp.brake*Math.max(0,1-Math.pow(Math.max(-f,0)/(vmax*.3),1.4))}
  }else P.revT=0;
  a-=f*.34+f*Math.abs(f)*.00018;if(!onRoad)a-=f*.9;
  const f0=f;f+=a*dt;
  if(inp.hb){const d=320*dt;f=Math.abs(f)<d?0:f-Math.sign(f)*d}
  if(inp.thr<=0&&inp.brake<=0&&Math.abs(f)<5)f*=Math.max(0,1-dt*4);
  if(f0>0&&f<0&&inp.brake<=0&&thr<=0)f=0;
  if(f0<0&&f>0&&thr<=0)f=0;
  P.vx=f*c-l*s;P.vy=f*s+l*c;
  const af=Math.abs(f),sg=f>=0?1:-1;
  let wmax=st.steer*4*(af/(af+70))/(1+Math.pow(af/450,2));
  let wT=inp.steer*wmax*sg;
  if(inp.hb&&af>120)wT*=1.5;
  if(P.cond<35)wT+=(35-P.cond)/35*.1*(af/(af+200));
  P.w+=(wT-P.w)*Math.min(1,dt*(inp.hb?7:11));
  P.ang+=P.w*dt;
  c=Math.cos(P.ang);s=Math.sin(P.ang);
  f=P.vx*c+P.vy*s;l=-P.vx*s+P.vy*c;
  const grip=(inp.hb&&af>40?1.1:st.grip)*(onRoad?1:.72);
  const l0=l;l*=Math.exp(-grip*dt);
  f-=Math.sign(f)*Math.min(Math.abs(f),Math.abs(l0-l)*.2);
  P.vx=f*c-l*s;P.vy=f*s+l*c;
  P.x+=P.vx*dt;P.y+=P.vy*dt;
  P.f=f;P.l=l;P.speed=f;
  const sp=Math.hypot(P.vx,P.vy);P.dist+=sp*dt;
  if(alive){const used=sp*dt/st.kmpl+.0011*dt+(thr>0?.0009*thr*dt:0);P.fuel=Math.max(0,P.fuel-used);P.fuelUsed+=used}
  P.brakeLamp=(inp.brake>0&&f>6)||inp.hb;
  // skids and smoke
  if((Math.abs(l)>60||(inp.hb&&af>140))&&skids.length<500){for(const sd of[-1,1]){skids.push({x:P.x-s*-sd*0+(-Math.sin(P.ang))*sd*P.spec.W*.4-c*P.spec.L*.3,y:P.y+Math.cos(P.ang)*sd*P.spec.W*.4-s*P.spec.L*.3,a:.35,t:0})}}
  if(P.cond<28&&rnd()<dt*14)puffs.push({x:P.x+c*P.spec.L*.4,y:P.y+s*P.spec.L*.4,r:4,a:.5,vx:rr(-12,12),vy:rr(-26,-8)});
  collidePlayer(dt);
  P.speed=P.vx*Math.cos(P.ang)+P.vy*Math.sin(P.ang);P.f=P.speed;
}
function simFxTick(dt){
  for(let i=skids.length-1;i>=0;i--){skids[i].t+=dt;skids[i].a-=dt*.03;if(skids[i].a<=0)skids.splice(i,1)}
  for(let i=puffs.length-1;i>=0;i--){const q=puffs[i];q.x+=q.vx*dt;q.y+=q.vy*dt;q.r+=dt*14;q.a-=dt*.5;if(q.a<=0)puffs.splice(i,1)}
}
/* ===== Rendering ===== */
const cvs=document.getElementById('game'),g=cvs.getContext('2d');
let VW=800,VH=600,DPR=1;
const cam={x:0,y:0,zoom:.85,shake:0};
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);VW=cvs.clientWidth||innerWidth;VH=cvs.clientHeight||innerHeight;cvs.width=Math.round(VW*DPR);cvs.height=Math.round(VH*DPR)}
addEventListener('resize',resize);
for(const e of edges){const A=nodes[e.a],B=nodes[e.b];e.x0=Math.min(A.x,B.x)-e.w;e.x1=Math.max(A.x,B.x)+e.w;e.y0=Math.min(A.y,B.y)-e.w;e.y1=Math.max(A.y,B.y)+e.w}
const sf=(seed,i)=>{const x=Math.sin(seed*12.9898+i*78.233)*43758.5453;return x-Math.floor(x)};
function camUpdate(dt){
  const sp=Math.hypot(P.vx,P.vy);
  const tz=lerp(.95,.66,clamp(sp/620,0,1))*(Math.min(VW,VH)<520?.78:1);
  cam.zoom+=(tz-cam.zoom)*Math.min(1,dt*1.6);
  const tx=P.x+clamp(P.vx*.42,-300,300),ty=P.y+clamp(P.vy*.42,-300,300);
  const k=Math.min(1,dt*3.2);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;
  cam.shake=Math.max(0,cam.shake-dt*30);
}
function worldView(){const hw=VW/(2*cam.zoom),hh=VH/(2*cam.zoom);return{x0:cam.x-hw,x1:cam.x+hw,y0:cam.y-hh,y1:cam.y+hh}}
function edgeVisible(e,v,pad){return e.x1>v.x0-pad&&e.x0<v.x1+pad&&e.y1>v.y0-pad&&e.y0<v.y1+pad}
const ROAD_COL={hwy:'#40444b',main:'#474b52',local:'#4d5158'};

function drawGround(v){
  g.fillStyle='#c5ccb8';g.fillRect(v.x0,v.y0,v.x1-v.x0,v.y1-v.y0);
  for(const d of DIST){
    if(d.px+2300<v.x0||d.px-2300>v.x1||d.py+2300<v.y0||d.py-2300>v.y1)continue;
    const gr=g.createRadialGradient(d.px,d.py,200,d.px,d.py,2300);gr.addColorStop(0,d.ground);gr.addColorStop(1,d.ground+'00');
    g.fillStyle=gr;g.beginPath();g.arc(d.px,d.py,2300,0,TAU);g.fill();
  }
  g.save();g.font='700 190px "Barlow Condensed","Arial Narrow",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='rgba(70,82,72,.13)';
  for(const d of DIST){if(d.px<v.x0-900||d.px>v.x1+900||d.py<v.y0-300||d.py>v.y1+300)continue;
    g.save();g.translate(d.px,d.py);if(g.letterSpacing!==undefined)g.letterSpacing='28px';g.fillText(d.name.toUpperCase(),0,0);g.restore()}
  g.restore();
}
function drawRoads(v){
  const vis=edges.filter(e=>edgeVisible(e,v,200));
  g.lineCap='round';g.lineJoin='round';
  const stroke=(e,w,col)=>{const A=nodes[e.a],B=nodes[e.b];g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(A.x,A.y);g.lineTo(B.x,B.y);g.stroke()};
  for(const e of vis)stroke(e,e.type==='hwy'?e.w+60:e.w+60,e.type==='hwy'?'#aab59a':'#d9d6cc');
  for(const e of vis)stroke(e,e.w+(e.type==='hwy'?16:8),e.type==='hwy'?'#c4c4be':'#aeaca4');
  for(const e of vis)stroke(e,e.w,ROAD_COL[e.type]);
  // markings
  g.lineCap='butt';
  for(const e of vis){
    const A=nodes[e.a],B=nodes[e.b];const s0=A.clear+4,s1=e.len-B.clear-4;if(s1<=s0)continue;
    const line=(off,w,col,dash)=>{const nx=-e.dy*off,ny=e.dx*off;g.strokeStyle=col;g.lineWidth=w;g.setLineDash(dash||[]);g.beginPath();g.moveTo(A.x+e.dx*s0+nx,A.y+e.dy*s0+ny);g.lineTo(A.x+e.dx*s1+nx,A.y+e.dy*s1+ny);g.stroke()};
    if(e.type==='hwy'){line(0,7,'#b9b9b4');line(e.w/4,2,'rgba(255,255,255,.7)',[26,24]);line(-e.w/4,2,'rgba(255,255,255,.7)',[26,24]);line(e.w/2-5,2.4,'#e7c64a');line(-e.w/2+5,2.4,'#e7c64a')}
    else if(e.type==='main'){line(0,2.4,'rgba(255,255,255,.8)',[28,22]);line(e.w/2-4,2,'rgba(231,198,74,.75)');line(-e.w/2+4,2,'rgba(231,198,74,.75)')}
    else line(0,2,'rgba(255,255,255,.7)',[20,20]);
    g.setLineDash([]);
  }
  // stop lines, crossings, signal heads
  for(const n of nodes){
    if(!n.light||n.x<v.x0-200||n.x>v.x1+200||n.y<v.y0-200||n.y>v.y1+200)continue;
    g.fillStyle='#4d5158';g.beginPath();g.arc(n.x,n.y,n.clear-2,0,TAU);g.fill();
    for(const id of n.adj){
      const e=edges[id];const out=e.a===n.id;const dx=out?e.dx:-e.dx,dy=out?e.dy:-e.dy;// direction away from node
      const lx=-dy,ly=dx; // left of arriving travel
      const sx=n.x+dx*(n.clear-2),sy=n.y+dy*(n.clear-2);
      if(e.type!=='hwy'){
        g.fillStyle='rgba(255,255,255,.85)';
        g.save();g.translate(n.x+dx*(n.clear+8),n.y+dy*(n.clear+8));g.rotate(Math.atan2(dy,dx));
        for(let t=-e.w/2+8;t<=e.w/2-6;t+=11)g.fillRect(-9,t-2.5,18,5);g.restore();
      }
      g.save();g.translate(sx+dx*10+lx*e.w/4,sy+dy*10+ly*e.w/4);g.rotate(Math.atan2(dy,dx)+Math.PI/2);g.fillStyle='rgba(255,255,255,.9)';g.fillRect(-e.w/4+2,-1.8,e.w/2-4,3.6);g.restore();
      const axis=Math.abs(dx)>=Math.abs(dy)?0:1;const st=lightState(n,axis,G.t);
      const hx=sx+dx*4+lx*(e.w/2+10),hy=sy+dy*4+ly*(e.w/2+10);
      g.fillStyle='#1b1f24';g.beginPath();g.roundRect(hx-6,hy-6,12,12,3);g.fill();
      const col=st===0?'#35e08a':st===1?'#ffb62e':'#ff4b4b';g.fillStyle=col;g.beginPath();g.arc(hx,hy,3.6,0,TAU);g.fill();
      if(G.night>.2){g.fillStyle=col+'55';g.beginPath();g.arc(hx,hy,15,0,TAU);g.fill()}
    }
  }
  // freeway signs
  g.font='700 12px "Barlow Condensed",sans-serif';g.textAlign='center';g.textBaseline='middle';
  for(const e of vis){
    if(e.type!=='hwy'||!e.tag)continue;const A=nodes[e.a];
    for(let s=e.len*.3;s<e.len;s+=2600){
      const x=A.x+e.dx*s-e.dy*(e.w/2+34),y=A.y+e.dy*s+e.dx*(e.w/2+34);
      g.fillStyle='rgba(20,24,24,.25)';g.fillRect(x-17,y-8,40,20);
      g.fillStyle='#1d7a4a';g.fillRect(x-20,y-11,40,22);g.strokeStyle='#fff';g.lineWidth=1.4;g.strokeRect(x-18.5,y-9.5,37,19);g.fillStyle='#fff';g.fillText(e.tag,x,y+.5);
    }
  }
}
function drawRoute(){
  if(!G.route||G.route.length<2)return;
  g.save();g.lineCap='round';g.lineJoin='round';
  g.strokeStyle='rgba(60,155,255,.28)';g.lineWidth=22;g.beginPath();G.route.forEach((id,i)=>{const n=nodes[id];i?g.lineTo(n.x,n.y):g.moveTo(n.x,n.y)});g.stroke();
  g.strokeStyle='rgba(95,180,255,.85)';g.lineWidth=5;g.setLineDash([2,16]);g.stroke();g.restore();
}
function drawSkids(){g.fillStyle='#16181b';for(const s of skids){g.globalAlpha=Math.max(0,s.a);g.fillRect(s.x-1.4,s.y-1.4,2.8,2.8)}g.globalAlpha=1}

/* service forecourts */
function svcBasis(s,dep){return[s.tx,s.ty,s.nx,s.ny,s.bx+s.nx*dep,s.by+s.ny*dep]}
function drawServiceGround(v){
  for(const s of services){
    if(Math.hypot(s.cx-cam.x,s.cy-cam.y)>1500)continue;
    g.save();g.transform(...svcBasis(s,s.w/2+2));
    g.fillStyle='#bdbbb3';g.fillRect(-150,0,300,150);g.strokeStyle='#e5c34a';g.lineWidth=2;g.strokeRect(-150,0,300,150);
    if(s.type==='fuel'){g.fillStyle='#55585e';for(const y of[48,92]){g.beginPath();g.roundRect(-34,y-5,68,10,3);g.fill()}
      g.fillStyle='#d8d6cf';for(const x of[-18,18])for(const y of[48,92]){g.fillRect(x-3,y-2.5,6,5)}}
    else{g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;for(const x of[-90,0,90]){g.strokeRect(x-36,30,72,96)}}
    g.restore();
  }
}
function drawServiceTop(){
  for(const s of services){
    if(Math.hypot(s.cx-cam.x,s.cy-cam.y)>1500)continue;
    g.save();g.transform(...svcBasis(s,s.w/2+2));
    if(s.type==='fuel'){
      g.fillStyle='rgba(20,22,24,.18)';g.fillRect(-64,38,136,66);
      g.fillStyle='#eeede8';g.fillRect(-70,32,140,66);g.fillStyle='#1f8c7a';g.fillRect(-70,32,140,5);g.fillRect(-70,93,140,5);
      g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;g.strokeRect(-70,32,140,66);
    }
    g.restore();
  }
}

/* buildings */
function drawBuildingShadow(b){
  const sx=b.ht*16+3,sy=b.ht*12+2;const c=b.c||(b.c=corners(b));
  g.fillStyle='rgba(28,32,30,.17)';g.beginPath();
  g.moveTo(c[0][0],c[0][1]);for(let i=1;i<4;i++)g.lineTo(c[i][0],c[i][1]);g.lineTo(c[2][0]+sx,c[2][1]+sy);g.lineTo(c[3][0]+sx,c[3][1]+sy);g.lineTo(c[0][0]+sx,c[0][1]+sy);g.lineTo(c[1][0]+sx,c[1][1]+sy);g.closePath();g.fill();
}
function drawBuilding(b){
  const k=.03*b.ht,ox=(b.x-cam.x)*k,oy=(b.y-cam.y)*k;const c=b.c||(b.c=corners(b));
  const big=Math.hypot(ox,oy)>1.2;
  if(big){
    for(let i=0;i<4;i++){
      const p=c[i],q=c[(i+1)&3];const ex=q[0]-p[0],ey=q[1]-p[1];const l=Math.hypot(ex,ey);const nx=ey/l,ny=-ex/l;
      if(nx*ox+ny*oy>=0)continue;
      g.fillStyle=shade(b.col,nx<0?-26:-46);g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(q[0],q[1]);g.lineTo(q[0]+ox,q[1]+oy);g.lineTo(p[0]+ox,p[1]+oy);g.closePath();g.fill();
      if(b.ht>.9){g.strokeStyle='rgba(255,255,255,.1)';g.lineWidth=.8;for(let f=1;f<4;f++){const t=f/4;g.beginPath();g.moveTo(p[0]+ox*t,p[1]+oy*t);g.lineTo(q[0]+ox*t,q[1]+oy*t);g.stroke()}}
    }
  }
  g.save();g.translate(b.x+ox,b.y+oy);g.rotate(b.ang);
  const hw=b.hw,hh=b.hh,col=b.col,sd=b.seed;
  const border=()=>{g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=1.2;g.strokeRect(-hw,-hh,hw*2,hh*2)};
  switch(b.kind){
    case'house':{
      g.fillStyle=shade(col,10);g.fillRect(-hw,-hh,hw*2,hh);g.fillStyle=shade(col,-14);g.fillRect(-hw,0,hw*2,hh);
      g.strokeStyle='rgba(0,0,0,.16)';g.lineWidth=.8;g.beginPath();g.moveTo(-hw,0);g.lineTo(hw,0);g.stroke();
      if(b.st==='township'){g.strokeStyle='rgba(255,255,255,.14)';for(let x=-hw+3;x<hw;x+=3.2){g.beginPath();g.moveTo(x,-hh);g.lineTo(x,hh);g.stroke()}}
      border();break}
    case'shop':{g.fillStyle=col;g.fillRect(-hw,-hh,hw*2,hh*2);g.fillStyle='rgba(255,255,255,.75)';g.fillRect(-hw,-2,hw*2,4);border();break}
    case'warehouse':{
      g.fillStyle=col;g.fillRect(-hw,-hh,hw*2,hh*2);g.strokeStyle='rgba(0,0,0,.13)';g.lineWidth=1;for(let x=-hw+8;x<hw;x+=9){g.beginPath();g.moveTo(x,-hh);g.lineTo(x,hh);g.stroke()}
      g.fillStyle='rgba(190,215,225,.8)';g.fillRect(-hw*.6,-hh*.5,hw*1.2,5);g.fillRect(-hw*.6,hh*.35,hw*1.2,5);border();break}
    case'mall':{
      g.fillStyle='#dad8d1';g.fillRect(-hw,-hh,hw*2,hh*2);g.fillStyle='rgba(185,212,224,.9)';
      const nx=Math.max(2,Math.floor(hw/30));for(let i=0;i<nx;i++){const x=-hw+hw*2*(i+.5)/nx;g.fillRect(x-9,-hh*.55,18,hh*.35);g.fillRect(x-9,hh*.2,18,hh*.35)}
      g.fillStyle='rgba(0,0,0,.10)';for(let i=0;i<3;i++)g.fillRect(-hw+10+sf(sd,i)*(hw*1.6),-4,16,10);border();break}
    case'shopfront':{g.fillStyle='#ecebe5';g.fillRect(-hw,-hh,hw*2,hh*2);g.fillStyle='#1f8c7a';g.fillRect(-hw,-hh,hw*2,5);g.fillStyle='rgba(0,0,0,.1)';g.fillRect(-hw*.5,-4,hw,8);border();break}
    case'garage':{g.fillStyle='#ccd0ce';g.fillRect(-hw,-hh,hw*2,hh*2);g.strokeStyle='rgba(0,0,0,.15)';for(let x=-hw+10;x<hw;x+=10){g.beginPath();g.moveTo(x,-hh);g.lineTo(x,hh);g.stroke()}g.fillStyle='#d9a323';g.fillRect(-hw,hh-5,hw*2,5);border();break}
    case'tower':{
      g.fillStyle=shade(col,14);g.fillRect(-hw,-hh,hw*2,hh*2);g.fillStyle=col;g.fillRect(-hw+7,-hh+7,hw*2-14,hh*2-14);
      if(b.st==='glass'){g.strokeStyle='rgba(255,255,255,.2)';g.lineWidth=.8;for(let x=-hw+7;x<hw-7;x+=10){g.beginPath();g.moveTo(x,-hh+7);g.lineTo(x,hh-7);g.stroke()}for(let y=-hh+7;y<hh-7;y+=10){g.beginPath();g.moveTo(-hw+7,y);g.lineTo(hw-7,y);g.stroke()}}
      else{g.fillStyle=shade(col,-18);g.fillRect(-hw*.4,-hh*.3,hw*.5,hh*.35);g.fillRect(hw*.1,hh*.15,hw*.4,hh*.3)}
      if(b.st==='cbd'&&sf(sd,3)>.9){g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=2;g.beginPath();g.arc(0,0,Math.min(hw,hh)*.45,0,TAU);g.stroke()}
      border();break}
    default:{
      g.fillStyle=col;g.fillRect(-hw,-hh,hw*2,hh*2);
      g.strokeStyle=shade(col,-24);g.lineWidth=2.2;g.strokeRect(-hw+1.5,-hh+1.5,hw*2-3,hh*2-3);
      g.fillStyle=shade(col,-16);const n=2+Math.floor(sf(sd,1)*3);
      for(let i=0;i<n;i++){const w=10+sf(sd,i+4)*12,h=8+sf(sd,i+9)*8;g.fillRect(-hw+8+sf(sd,i+13)*(hw*2-w-16),-hh+8+sf(sd,i+17)*(hh*2-h-16),w,h)}
      if(b.st==='brick'&&sf(sd,5)>.5){g.fillStyle='rgba(90,140,80,.7)';g.fillRect(hw*.2,-hh*.6,hw*.55,hh*.5)}
      border();
    }
  }
  g.restore();
}
function drawBuildingsAll(v,roofsPass){
  const r=Math.max(VW,VH)/(2*cam.zoom)+260;
  const list=buildingsNear(cam.x,cam.y,r);
  if(!roofsPass){for(const b of list)drawBuildingShadow(b)}
  else{
    const vis=list.slice().sort((a,b)=>a.ht-b.ht);
    for(const b of vis)drawBuilding(b);
  }
  if(roofsPass)for(const o of dynObs){
    if(o.kind==='barrier'){g.save();g.translate(o.x,o.y);g.rotate(o.ang);g.fillStyle='#f5f3ee';g.fillRect(-o.hw,-o.hh,o.hw*2,o.hh*2);g.fillStyle='#e0462f';for(let x=-o.hw;x<o.hw;x+=24)g.fillRect(x,-o.hh,12,o.hh*2);g.restore()}
    else{g.fillStyle='#ee6a2c';g.beginPath();g.arc(o.x,o.y,5.5,0,TAU);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(o.x,o.y,2.6,0,TAU);g.fill()}
  }
}

/* people, vehicles */
function drawPeds(v){
  for(const p of peds){
    if(p.x<v.x0||p.x>v.x1||p.y<v.y0||p.y>v.y1)continue;
    g.fillStyle='rgba(20,22,24,.2)';g.beginPath();g.ellipse(p.x+2,p.y+2,5,3.5,0,0,TAU);g.fill();
    const e=edges[p.e];const a=Math.atan2(e.dy*p.dir,e.dx*p.dir);
    g.save();g.translate(p.x,p.y);g.rotate(a);g.fillStyle=p.col;g.beginPath();g.ellipse(Math.sin(p.ph)*1.2,0,3,5.2,0,0,TAU);g.fill();g.fillStyle='#5a4636';g.beginPath();g.arc(1,0,2.9,0,TAU);g.fill();g.restore();
  }
}
function drawVehicles(v){
  const blink=Math.floor(G.t*2.4)%2===0;
  for(const o of traffic){
    if(o.x<v.x0-120||o.x>v.x1+120||o.y<v.y0-120||o.y>v.y1+120)continue;
    drawVehicleSprite(g,o.kind,o.c1,o.c2,o.x,o.y,o.ang,G.night,o.speed<2&&!o.parked&&o.mode==='lane'||false,o.hazard,o.indic,blink);
  }
  const car=CARS[save.car];
  drawVehicleSprite(g,car.kind,car.color,null,P.x,P.y,P.ang,G.night,P.brakeLamp,false,0,blink);
  // roof placard
  g.save();g.translate(P.x,P.y);g.rotate(P.ang);g.fillStyle='#f4f2ec';g.beginPath();g.roundRect(-3,-3.2,7,6.4,1.4);g.fill();g.fillStyle='#f0b429';g.fillRect(-1.6,-1.6,4.2,3.2);g.restore();
}
function drawLightsFx(v){
  if(G.night<.15)return;
  g.save();g.globalCompositeOperation='lighter';g.globalAlpha=Math.min(1,G.night*1.1);
  for(const o of traffic){if(o.x<v.x0-200||o.x>v.x1+200||o.y<v.y0-200||o.y>v.y1+200)continue;drawHeadlights(g,o.x,o.y,o.ang,o.sp.L,o.sp.W,.7)}
  drawHeadlights(g,P.x,P.y,P.ang,P.spec.L,P.spec.W,1);
  g.restore();
}
function drawSmoke(){for(const q of puffs){g.fillStyle=`rgba(60,60,64,${Math.max(0,q.a)})`;g.beginPath();g.arc(q.x,q.y,q.r,0,TAU);g.fill()}}

/* markers */
function ring(x,y,r,col,t){g.save();g.strokeStyle=col;g.lineWidth=3;g.globalAlpha=.9;g.setLineDash([14,10]);g.lineDashOffset=-t*20;g.beginPath();g.arc(x,y,r,0,TAU);g.stroke();g.setLineDash([]);g.globalAlpha=.16;g.fillStyle=col;g.fill();g.restore()}
function worldPin(x,y,r,col,txt,t,label,full){
  if(full){
    g.save();const gl=g.createRadialGradient(x,y,10,x,y,160);gl.addColorStop(0,col+'77');gl.addColorStop(1,col+'00');g.fillStyle=gl;g.beginPath();g.arc(x,y,160,0,TAU);g.fill();g.restore();
    ring(x,y,95,col,t);
  }
  const pulse=1+Math.sin(t*4)*.08;
  g.save();g.translate(x,y);
  g.strokeStyle='#0e1714';g.lineWidth=6;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(0,-34);g.stroke();
  g.fillStyle=col;g.beginPath();g.arc(0,0,6,0,TAU);g.fill();
  g.translate(0,-34-r*.4);
  g.fillStyle='#0e1714';g.beginPath();g.arc(0,0,r*pulse+5,0,TAU);g.fill();
  g.fillStyle=col;g.beginPath();g.arc(0,0,r*pulse,0,TAU);g.fill();
  g.fillStyle='#0e1714';g.font='700 '+Math.round(r*1.25)+'px "Barlow Condensed",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,0,2);
  if(label){g.font='700 24px "Barlow",sans-serif';const w=g.measureText(label).width+26;g.fillStyle='rgba(14,23,20,.92)';g.beginPath();g.roundRect(-w/2,-r-52,w,34,10);g.fill();g.fillStyle='#fff';g.fillText(label,0,-r-34)}
  g.restore();
}
function drawMarkers(){
  const t=G.t,T=G.trip;
  for(const s of services){
    if(Math.hypot(s.x-cam.x,s.y-cam.y)>1600)continue;
    const near=Math.hypot(P.x-s.x,P.y-s.y)<95;
    ring(s.x,s.y,85,s.type==='fuel'?'#f0b429':'#52a8ff',near?t*1.5:0);
    g.save();g.fillStyle=s.type==='fuel'?'#f0b429':'#52a8ff';g.font='700 26px "Barlow Condensed",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(s.type==='fuel'?'FUEL':'REPAIR',s.x,s.y);g.restore();
  }
  if(T){
    const sp=T.stage==='pickup'?T.pickup:T.drop,col=T.stage==='pickup'?'#35c47c':'#ff8f3f';
    worldPin(sp.x,sp.y,18,col,T.stage==='pickup'?'P':'D',t,T.stage==='pickup'?'Pick up '+T.name:'Drop off · '+sp.district.name,true);
    if(T.stage==='pickup'){
      const cx=sp.px,cy=sp.py,w=Math.sin(t*7);
      g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.arc(cx,cy,21+Math.sin(t*3)*2,0,TAU);g.fill();
      g.fillStyle='rgba(20,22,24,.28)';g.beginPath();g.ellipse(cx+3,cy+3,8,11,0,0,TAU);g.fill();
      g.strokeStyle='#e8d34a';g.lineWidth=3.6;g.lineCap='round';g.beginPath();g.moveTo(cx+1,cy+5);g.lineTo(cx+11,cy+13+w*4);g.moveTo(cx+1,cy-5);g.lineTo(cx+11,cy-13-w*4);g.stroke();
      g.fillStyle='#e8d34a';g.beginPath();g.ellipse(cx,cy,6.5,10.5,0,0,TAU);g.fill();g.fillStyle='#5a4636';g.beginPath();g.arc(cx+1,cy,5,0,TAU);g.fill();
    }
  }else if(G.offers){
    G.offers.forEach((o,i)=>{if(Math.hypot(o.pickup.x-cam.x,o.pickup.y-cam.y)<2800){const hv=G.offerHover===o;worldPin(o.pickup.x,o.pickup.y,hv?18:14,'#35c47c',String(i+1),t,hv?o.name+' · '+fmtR(o.fare):null,hv)}});
  }
}
function drawEdgePointer(){
  const T=G.trip;if(!T)return;const sp=T.stage==='pickup'?T.pickup:T.drop;
  const cl=document.documentElement.classList,nar=cl.contains('narrow'),sh=cl.contains('short');
  const L=56,Rr=VW-56,Tp=sh?62:nar?180:110,Bt=sh?VH-84:nar?VH-250:VH-170;
  const dx=sp.x-cam.x,dy=sp.y-cam.y,sx=VW/2+dx*cam.zoom,sy=VH/2+dy*cam.zoom;
  if(sx>L&&sx<Rr&&sy>Tp&&sy<Bt)return;
  const ox=VW/2,oy=(Tp+Bt)/2>0?VH/2:VH/2,vx=sx-ox,vy=sy-oy;
  let k=1e9;if(vx>0)k=Math.min(k,(Rr-ox)/vx);else if(vx<0)k=Math.min(k,(L-ox)/vx);
  if(vy>0)k=Math.min(k,(Bt-oy)/vy);else if(vy<0)k=Math.min(k,(Tp-oy)/vy);
  const px=ox+vx*k,py=oy+vy*k,a=Math.atan2(vy,vx),col=T.stage==='pickup'?'#35c47c':'#ff8f3f';
  g.save();g.setTransform(DPR,0,0,DPR,0,0);
  g.translate(px,py);g.rotate(a);g.fillStyle=col;g.strokeStyle='#0e1714';g.lineWidth=3.5;g.beginPath();g.moveTo(22,0);g.lineTo(-12,-15);g.lineTo(-5,0);g.lineTo(-12,15);g.closePath();g.stroke();g.fill();g.rotate(-a);
  const km=((G.routeLen||Math.hypot(dx,dy))/KM).toFixed(1)+' km',txt=(T.stage==='pickup'?T.name:'Drop-off')+' · '+km;
  g.font='700 13px "Barlow",sans-serif';const w=g.measureText(txt).width+16,ly=py<VH/2?30:-30;
  let lx=-w/2;const ax=px+lx;if(ax<6)lx+=6-ax;if(ax+w>VW-6)lx-=ax+w-(VW-6);
  g.fillStyle='rgba(14,23,20,.9)';g.beginPath();g.roundRect(lx,ly-11,w,22,6);g.fill();g.fillStyle='#fff';g.textAlign='left';g.textBaseline='middle';g.fillText(txt,lx+8,ly+.5);
  g.restore();
}

function render(){
  const sh=cam.shake;const jx=sh?rr(-sh,sh):0,jy=sh?rr(-sh,sh):0;
  g.setTransform(DPR*cam.zoom,0,0,DPR*cam.zoom,DPR*(VW/2-(cam.x+jx/cam.zoom)*cam.zoom),DPR*(VH/2-(cam.y+jy/cam.zoom)*cam.zoom));
  const v=worldView();
  drawGround(v);drawRoads(v);drawRoute();drawSkids();drawServiceGround(v);
  drawBuildingsAll(v,false);
  drawPeds(v);drawVehicles(v);drawSmoke();
  drawBuildingsAll(v,true);drawServiceTop();
  // time-of-day tint
  g.setTransform(DPR,0,0,DPR,0,0);
  if(G.night>0){g.fillStyle=`rgba(8,16,38,${G.night*.5})`;g.fillRect(0,0,VW,VH)}
  const warm=G.warm||0;if(warm>0){g.fillStyle=`rgba(255,140,60,${warm*.12})`;g.fillRect(0,0,VW,VH)}
  g.setTransform(DPR*cam.zoom,0,0,DPR*cam.zoom,DPR*(VW/2-cam.x*cam.zoom),DPR*(VH/2-cam.y*cam.zoom));
  drawLightsFx(v);drawMarkers();
  drawEdgePointer();
}

/* ===== Maps (minimap + full city map) ===== */
const mini=document.getElementById('mini'),mg=mini.getContext('2d');
const big=document.getElementById('bigmap'),bg=big.getContext('2d');
const MAP_FONT='"Barlow Condensed","Arial Narrow",sans-serif',MAP_BODY='"Barlow",system-ui,sans-serif';
const nowS=()=>performance.now()/1000;
const HWY_TAGS=(()=>{const best={};for(const e of edges){if(e.type==='hwy'&&e.tag&&(!best[e.tag]||e.len>best[e.tag].len))best[e.tag]=e}return Object.values(best).map(e=>{const A=nodes[e.a];return{tag:e.tag,x:A.x+e.dx*e.len/2,y:A.y+e.dy*e.len/2}})})();
function mapTargets(){
  const out=[],T=G.trip;
  if(T){const sp=T.stage==='pickup'?T.pickup:T.drop;out.push({x:sp.x,y:sp.y,col:T.stage==='pickup'?'#35c47c':'#ff8f3f',txt:T.stage==='pickup'?'P':'D',label:(T.stage==='pickup'?'Pick up ':'Drop off ')+T.name,main:true})}
  else if(G.offers)G.offers.forEach((o,i)=>out.push({x:o.pickup.x,y:o.pickup.y,col:'#35c47c',txt:String(i+1),label:o.name+' · '+fmtR(o.fare),offer:i}));
  return out;
}
function drawPin(c,x,y,r,col,txt,pulse){
  c.save();c.translate(x,y);
  if(pulse){const k=(nowS()%1.4)/1.4;c.strokeStyle=col;c.globalAlpha=1-k;c.lineWidth=Math.max(2,r*.25);c.beginPath();c.arc(0,0,r*(1.1+k*1.7),0,TAU);c.stroke();c.globalAlpha=1}
  c.fillStyle='#0e1714';c.beginPath();c.arc(0,0,r+r*.22,0,TAU);c.fill();
  c.fillStyle=col;c.beginPath();c.arc(0,0,r,0,TAU);c.fill();
  c.fillStyle='#0e1714';c.font='700 '+Math.round(r*1.25)+'px '+MAP_FONT;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,0,r*.06);
  c.restore();
}
function pill(c,text,x,y,u,align){
  c.font='600 '+(12*u)+'px '+MAP_BODY;const w=c.measureText(text).width+14*u,h=22*u;
  let x0=align==='left'?x-w:x;if(x0<4*u)x0=4*u;if(x0+w>c.canvas.width-4*u)x0=c.canvas.width-4*u-w;
  c.fillStyle='rgba(14,23,20,.9)';c.beginPath();c.roundRect(x0,y-h/2,w,h,6*u);c.fill();
  c.fillStyle='#fff';c.textAlign='left';c.textBaseline='middle';c.fillText(text,x0+7*u,y+.5*u);
}
function drawMapView(c,W,H,cx,cy,sc,o){
  const u=o.u,px=u/sc;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#16221e';c.fillRect(0,0,W,H);
  c.save();c.beginPath();c.rect(0,0,W,H);c.clip();
  c.translate(W/2,H/2);c.scale(sc,sc);c.translate(-cx,-cy);
  c.lineCap='round';c.lineJoin='round';
  const R=Math.hypot(W,H)/2/sc+300;
    const vis=edges.filter(e=>e.x1>cx-R&&e.x0<cx+R&&e.y1>cy-R&&e.y0<cy+R);
  const lw=o.big?{local:1.8,main:2.8,hwy:3.8}:{local:1.7,main:2.6,hwy:3.4};
  for(const t of['local','main','hwy'])for(const e of vis){
    if(e.type!==t)continue;const A=nodes[e.a],B=nodes[e.b];
    c.strokeStyle=e.closed>0?'#e5484d':t==='hwy'?'#d9b44a':t==='main'?'#9bb0a8':'#566860';
    c.lineWidth=lw[t]*px;c.beginPath();c.moveTo(A.x,A.y);c.lineTo(B.x,B.y);c.stroke();
  }
  const T=G.trip;
  if(T&&G.route&&G.route.length>1){
    const sp=T.stage==='pickup'?T.pickup:T.drop;
    c.beginPath();c.moveTo(P.x,P.y);for(const id of G.route)c.lineTo(nodes[id].x,nodes[id].y);c.lineTo(sp.x,sp.y);
    c.strokeStyle='#0b1411';c.lineWidth=9*px;c.stroke();c.strokeStyle='#52a8ff';c.lineWidth=5*px;c.stroke();
  }
  c.textAlign='center';c.textBaseline='middle';
  for(const s of services){
    if(Math.abs(s.x-cx)>R||Math.abs(s.y-cy)>R)continue;
    c.fillStyle=s.type==='fuel'?'#f0b429':'#52a8ff';c.beginPath();c.arc(s.x,s.y,8*px,0,TAU);c.fill();
    c.fillStyle='#10201a';c.font='700 '+(11*px)+'px '+MAP_FONT;c.fillText(s.type==='fuel'?'F':'R',s.x,s.y+.5*px);
  }
  const fs=(o.big?15:10.5)*px;c.font='700 '+fs+'px '+MAP_FONT;c.lineWidth=3.2*px;
  const placed=[];
  for(const d of DIST){
    if(Math.abs(d.px-cx)>R||Math.abs(d.py-cy)>R)continue;
    const nm=d.name.replace('Johannesburg ','').toUpperCase(),w=c.measureText(nm).width,h=fs*1.1;
    if(placed.some(r=>Math.abs(r.x-d.px)<(r.w+w)/2+4*px&&Math.abs(r.y-d.py)<(r.h+h)/2))continue;
    placed.push({x:d.px,y:d.py,w,h});
    c.strokeStyle='#16221e';c.strokeText(nm,d.px,d.py);c.fillStyle='rgba(232,240,234,.82)';c.fillText(nm,d.px,d.py);
  }
  if(o.big){
    c.font='700 '+(10*px)+'px '+MAP_FONT;
    for(const h of HWY_TAGS){const w=c.measureText(h.tag).width+10*px;c.fillStyle='#1d7a4a';c.beginPath();c.roundRect(h.x-w/2,h.y-8*px,w,16*px,3*px);c.fill();c.fillStyle='#fff';c.fillText(h.tag,h.x,h.y+.5*px)}
  }
  if(G.closure){const e=edges[G.closure.e],A=nodes[e.a],mx=A.x+e.dx*e.len/2,my=A.y+e.dy*e.len/2;c.fillStyle='#e5484d';c.beginPath();c.arc(mx,my,9*px,0,TAU);c.fill();c.strokeStyle='#fff';c.lineWidth=2*px;c.beginPath();c.moveTo(mx-4*px,my-4*px);c.lineTo(mx+4*px,my+4*px);c.moveTo(mx+4*px,my-4*px);c.lineTo(mx-4*px,my+4*px);c.stroke()}
  c.restore();
  // screen-space overlays
  const toS=(x,y)=>[W/2+(x-cx)*sc,H/2+(y-cy)*sc];
  if(o.pins)o.pins.length=0;
  for(const t of mapTargets()){
    const[sx,sy]=toS(t.x,t.y),m=18*u;
    if(sx>m&&sx<W-m&&sy>m&&sy<H-m){
      const r=(t.main?13:11)*u;drawPin(c,sx,sy,r,t.col,t.txt,true);
      if(o.big||t.main)pill(c,t.label,sx<W/2?sx+r+8*u:sx-r-8*u,sy,u,sx<W/2?'right':'left');
      if(o.pins)o.pins.push({x:sx,y:sy,r:18*u,offer:t.offer});
    }else{
      const dx=sx-W/2,dy=sy-H/2,k=Math.min((W/2-m)/Math.abs(dx||1e-6),(H/2-m)/Math.abs(dy||1e-6));
      const ex=W/2+dx*k,ey=H/2+dy*k,a=Math.atan2(dy,dx);
      c.save();c.translate(ex,ey);c.rotate(a);c.fillStyle=t.col;c.strokeStyle='#0e1714';c.lineWidth=2*u;c.beginPath();c.moveTo(13*u,0);c.lineTo(-4*u,-9*u);c.lineTo(-4*u,9*u);c.closePath();c.stroke();c.fill();c.restore();
      const ix=ex-Math.cos(a)*17*u,iy=ey-Math.sin(a)*17*u;drawPin(c,ix,iy,9*u,t.col,t.txt,false);
      c.font='700 '+(10*u)+'px '+MAP_BODY;c.textAlign='center';c.textBaseline='middle';c.lineWidth=3*u;c.strokeStyle='#0e1714';
      const km=(Math.hypot(t.x-P.x,t.y-P.y)/KM).toFixed(1)+' km',ty=iy+(iy<H/2?20*u:-20*u);c.strokeText(km,ix,ty);c.fillStyle='#fff';c.fillText(km,ix,ty);
      if(o.pins)o.pins.push({x:ix,y:iy,r:16*u,offer:t.offer});
    }
  }
  const[ux,uy]=toS(P.x,P.y);
  c.save();c.translate(ux,uy);
  const k2=(nowS()%1.6)/1.6;c.strokeStyle='rgba(255,255,255,'+(.55*(1-k2))+')';c.lineWidth=2*u;c.beginPath();c.arc(0,0,(9+k2*17)*u,0,TAU);c.stroke();
  c.rotate(P.ang);c.fillStyle='#fff';c.strokeStyle='#0e1714';c.lineWidth=2.5*u;c.beginPath();c.moveTo(12*u,0);c.lineTo(-9*u,-8*u);c.lineTo(-4*u,0);c.lineTo(-9*u,8*u);c.closePath();c.stroke();c.fill();c.restore();
  if(o.big)pill(c,'You',ux+16*u,uy-16*u,u,'right');
}
function drawMini(){drawMapView(mg,mini.width,mini.height,P.x,P.y,mini.width/2/4300,{u:mini.width/(mini.clientWidth||220),big:false})}
/* full city map */
const bm={cx:0,cy:0,sc:.03,u:1,pins:[],drag:null};
function sizeBig(){const r=big.getBoundingClientRect();bm.u=Math.min(window.devicePixelRatio||1,2);big.width=Math.max(20,Math.round(r.width*bm.u));big.height=Math.max(20,Math.round(r.height*bm.u))}
function mapFit(mode){
  const W=big.width,H=big.height,m=56*bm.u;let x0,x1,y0,y1;
  if(mode==='city'){x0=minX;x1=maxX;y0=minY;y1=maxY}
  else{const pts=[[P.x,P.y],...mapTargets().map(t=>[t.x,t.y])];x0=Math.min(...pts.map(p=>p[0]))-1200;x1=Math.max(...pts.map(p=>p[0]))+1200;y0=Math.min(...pts.map(p=>p[1]))-1200;y1=Math.max(...pts.map(p=>p[1]))+1200;
    if(x1-x0<7000){const c=(x0+x1)/2;x0=c-3500;x1=c+3500}if(y1-y0<7000){const c=(y0+y1)/2;y0=c-3500;y1=c+3500}}
  bm.sc=Math.min((W-2*m)/(x1-x0),(H-2*m)/(y1-y0));bm.cx=(x0+x1)/2;bm.cy=(y0+y1)/2;
}
function zoomMap(f,sx,sy){const W=big.width,H=big.height;const ns=clamp(bm.sc*f,.012,.3);if(sx===undefined){sx=W/2;sy=H/2}const wx=bm.cx+(sx-W/2)/bm.sc,wy=bm.cy+(sy-H/2)/bm.sc;bm.sc=ns;bm.cx=wx-(sx-W/2)/ns;bm.cy=wy-(sy-H/2)/ns}
function drawBigMap(){drawMapView(bg,big.width,big.height,bm.cx,bm.cy,bm.sc,{u:bm.u,big:true,pins:bm.pins})}
function renderMapSide(){
  const T=G.trip;let h='';
  if(T){
    const sp=T.stage==='pickup'?T.pickup:T.drop,c=T.stage==='pickup'?'#35c47c':'#ff8f3f';
    h+='<h4>Current trip</h4><div class="mrow main"><span class="mb" style="background:'+c+'">'+(T.stage==='pickup'?'P':'D')+'</span><div><div class="mt">'+(T.stage==='pickup'?'Pick up ':'Drop off ')+T.name+'</div><div class="md">'+sp.district.name+' · '+((G.routeLen||Math.hypot(sp.x-P.x,sp.y-P.y))/KM).toFixed(1)+' km away · '+fmtR(T.fare)+'</div></div></div>';
    if(T.stage==='pickup')h+='<div class="mrow"><span class="mb" style="background:#ff8f3f">D</span><div><div class="mt">Then drop off in '+T.drop.district.name+'</div><div class="md">'+(T.tripDist/KM).toFixed(1)+' km trip</div></div></div>';
  }else if(G.offers.length){
    h+='<h4>Requests nearby</h4>';
    G.offers.forEach((o,i)=>{h+='<button class="mrow" data-i="'+i+'"><span class="mb" style="background:#35c47c">'+(i+1)+'</span><div><div class="mt">'+o.name+' · '+o.pickup.district.name+'</div><div class="md">to '+o.drop.district.name+' · pickup '+(o.pdist/KM).toFixed(1)+' km · '+fmtR(o.fare)+'</div></div></button>'});
    h+='<div class="md">Tap a request or its pin to accept.</div>';
  }else h+='<h4>Requests nearby</h4><div class="md">No requests right now. New ones appear every few seconds.</div>';
  h+='<h4>Legend</h4><div class="legend"><span><i style="background:#fff"></i>You</span><span><i style="background:#35c47c"></i>Client pickup</span><span><i style="background:#ff8f3f"></i>Drop-off</span><span><i style="background:#f0b429"></i>Fuel</span><span><i style="background:#52a8ff"></i>Repair</span><span><i style="background:#d9b44a"></i>Freeway</span><span><i style="background:#e5484d"></i>Closed road</span></div>';
  $('mapside').innerHTML=h;
}
function openMap(){
  if(!G.started||G.modal||G.paused)return;
  G.modal='map';SFX.playerHorn(false);$('mapview').classList.remove('hidden');sizeBig();mapFit('focus');renderMapSide();setTimeout(()=>$('mClose').focus(),30);
}
function closeMap(){$('mapview').classList.add('hidden');if(G.modal==='map')G.modal=null}
function bindMap(){
  $('mClose').onclick=closeMap;$('mFit').onclick=()=>mapFit('city');$('mFocus').onclick=()=>mapFit('focus');
  $('mIn').onclick=()=>zoomMap(1.4);$('mOut').onclick=()=>zoomMap(1/1.4);
  $('mMe').onclick=()=>{bm.cx=P.x;bm.cy=P.y;bm.sc=Math.max(bm.sc,.05)};
  $('mapview').addEventListener('click',e=>{if(e.target.id==='mapview')closeMap()});
  $('mapside').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b){const i=+b.dataset.i;closeMap();acceptOffer(i)}});
  big.addEventListener('wheel',e=>{e.preventDefault();const r=big.getBoundingClientRect();zoomMap(e.deltaY<0?1.2:1/1.2,(e.clientX-r.left)*big.width/r.width,(e.clientY-r.top)*big.height/r.height)},{passive:false});
  const pts=new Map();let pinch=0;
  big.addEventListener('pointerdown',e=>{big.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});bm.drag={x:e.clientX,y:e.clientY,cx:bm.cx,cy:bm.cy,moved:0};if(pts.size===2){const a=[...pts.values()];pinch=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
  big.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2){const a=[...pts.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinch>0)zoomMap(d/pinch);pinch=d;if(bm.drag)bm.drag.moved=99;return}
    if(!bm.drag)return;const dx=e.clientX-bm.drag.x,dy=e.clientY-bm.drag.y;bm.drag.moved=Math.max(bm.drag.moved,Math.hypot(dx,dy));
    if(bm.drag.moved>6){const r=big.getBoundingClientRect(),k=big.width/r.width;bm.cx=bm.drag.cx-dx*k/bm.sc;bm.cy=bm.drag.cy-dy*k/bm.sc}
  });
  const up=e=>{
    pts.delete(e.pointerId);if(pts.size<2)pinch=0;
    if(bm.drag&&bm.drag.moved<=6&&e.type==='pointerup'){const r=big.getBoundingClientRect(),sx=(e.clientX-r.left)*big.width/r.width,sy=(e.clientY-r.top)*big.height/r.height;
      for(const p of bm.pins){if(p.offer!==undefined&&Math.hypot(p.x-sx,p.y-sy)<p.r){const i=p.offer;closeMap();acceptOffer(i);break}}}
    if(!pts.size)bm.drag=null;
  };
  big.addEventListener('pointerup',up);big.addEventListener('pointercancel',up);
  $('miniwrap').addEventListener('click',()=>{if(G.started)openMap()});
}
addEventListener('resize',()=>{if(G.modal==='map'){const sc=bm.sc,cx=bm.cx,cy=bm.cy,ou=big.width;sizeBig();bm.sc=sc*big.width/ou}});

/* ===== Speedometer ===== */
const spd=document.getElementById('speedo'),sg=spd.getContext('2d');
function drawSpeedo(){
  const W=spd.width,H=spd.height,cx=W/2,cy=H*.62,R=H*.5;const kmh=Math.abs(P.speed)*.2;const MAX=180;
  sg.clearRect(0,0,W,H);
  const a0=Math.PI*.8,a1=Math.PI*2.2;
  sg.lineCap='round';sg.lineWidth=11;sg.strokeStyle='rgba(255,255,255,.13)';sg.beginPath();sg.arc(cx,cy,R,a0,a1);sg.stroke();
  const fr=clamp(kmh/MAX,0,1);sg.strokeStyle=kmh>140?'#e5484d':'#f0b429';sg.beginPath();sg.arc(cx,cy,R,a0,a0+(a1-a0)*fr);sg.stroke();
  sg.lineWidth=2;sg.strokeStyle='rgba(255,255,255,.35)';
  for(let k=0;k<=MAX;k+=20){const a=a0+(a1-a0)*k/MAX;sg.beginPath();sg.moveTo(cx+Math.cos(a)*(R-14),cy+Math.sin(a)*(R-14));sg.lineTo(cx+Math.cos(a)*(R-22),cy+Math.sin(a)*(R-22));sg.stroke()}
  sg.fillStyle='#eef3ee';sg.textAlign='center';sg.textBaseline='middle';sg.font='700 64px "Barlow Condensed",sans-serif';sg.fillText(Math.round(kmh),cx,cy-4);
  sg.fillStyle='#9fb1a7';sg.font='600 20px "Barlow",sans-serif';sg.fillText('km/h',cx,cy+34);
  const gear=P.speed<-3?'R':Math.abs(P.speed)<3?'N':'D';sg.fillStyle='#f0b429';sg.font='700 26px "Barlow Condensed",sans-serif';sg.fillText(gear,cx+R*.78,cy+R*.62);
}
/* ===== Audio: clean synthesis only (engine, tyres, horns, impacts, soft alerts). No voices, crowds or music. ===== */
const SFX=(function(){
  let ac=null,master,comp,world,cabin,busEngine,busTraffic,busUI,eng={},tyre={},wind={},bed={},voices=[];
  const vol={master:.8,engine:.7,traffic:.6,ui:.6};
  let lastLight=-1,hornOsc=null;
  function noiseBuf(kind){
    const len=ac.sampleRate*3,b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);
    let b0=0,b1=0,b2=0,last=0;
    for(let i=0;i<len;i++){
      const w=Math.random()*2-1;
      if(kind==='white')d[i]=w*.5;
      else if(kind==='pink'){b0=.99765*b0+w*.099;b1=.963*b1+w*.2965;b2=.57*b2+w*1.05;d[i]=(b0+b1+b2+w*.18)*.16}
      else{last=(last+.02*w)/1.02;d[i]=last*3.2}
    }
    return b;
  }
  function loopNoise(kind){const s=ac.createBufferSource();s.buffer=noiseBuf(kind);s.loop=true;s.start();return s}
  function init(){
    if(ac)return;
    try{ac=new(window.AudioContext||window.webkitAudioContext)()}catch(e){ac=null;return}
    master=ac.createGain();comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3.5;comp.attack.value=.01;comp.release.value=.25;
    master.connect(comp);comp.connect(ac.destination);
    cabin=ac.createBiquadFilter();cabin.type='lowpass';cabin.frequency.value=1500;cabin.Q.value=.5;cabin.connect(master);
    world=ac.createGain();world.connect(cabin);
    busEngine=ac.createGain();busTraffic=ac.createGain();busUI=ac.createGain();
    busEngine.connect(world);busTraffic.connect(world);busUI.connect(master);
    // engine: sawtooth + triangle sub through a low-pass
    eng.f=ac.createBiquadFilter();eng.f.type='lowpass';eng.f.Q.value=.8;eng.g=ac.createGain();eng.g.gain.value=0;
    eng.o1=ac.createOscillator();eng.o1.type='sawtooth';eng.o2=ac.createOscillator();eng.o2.type='triangle';
    eng.m1=ac.createGain();eng.m2=ac.createGain();eng.m1.gain.value=.5;eng.m2.gain.value=.7;
    eng.o1.connect(eng.m1);eng.o2.connect(eng.m2);eng.m1.connect(eng.f);eng.m2.connect(eng.f);eng.f.connect(eng.g);eng.g.connect(busEngine);
    eng.o1.start();eng.o2.start();
    // tyre / road
    const wn=loopNoise('white'),pn=loopNoise('pink'),bn=loopNoise('brown');
    tyre.road=ac.createBiquadFilter();tyre.road.type='bandpass';tyre.road.frequency.value=420;tyre.road.Q.value=.7;tyre.rg=ac.createGain();tyre.rg.gain.value=0;
    pn.connect(tyre.road);tyre.road.connect(tyre.rg);tyre.rg.connect(busTraffic);
    tyre.sq=ac.createBiquadFilter();tyre.sq.type='bandpass';tyre.sq.frequency.value=1900;tyre.sq.Q.value=9;tyre.sg=ac.createGain();tyre.sg.gain.value=0;
    wn.connect(tyre.sq);tyre.sq.connect(tyre.sg);tyre.sg.connect(busTraffic);
    // wind
    wind.f=ac.createBiquadFilter();wind.f.type='highpass';wind.f.frequency.value=500;wind.g=ac.createGain();wind.g.gain.value=0;
    wn.connect(wind.f);wind.f.connect(wind.g);wind.g.connect(busTraffic);
    // distant traffic bed
    bed.f=ac.createBiquadFilter();bed.f.type='lowpass';bed.f.frequency.value=220;bed.g=ac.createGain();bed.g.gain.value=.05;
    bn.connect(bed.f);bed.f.connect(bed.g);bed.g.connect(busTraffic);
    // nearby vehicle voices (engine hum of the closest traffic)
    for(let i=0;i<4;i++){
      const v={o:ac.createOscillator(),o2:ac.createOscillator(),f:ac.createBiquadFilter(),g:ac.createGain(),p:ac.createStereoPanner(),ref:null};
      v.o.type='sawtooth';v.o2.type='triangle';v.f.type='lowpass';v.f.frequency.value=420;v.g.gain.value=0;
      v.o.connect(v.f);v.o2.connect(v.f);v.f.connect(v.g);v.g.connect(v.p);v.p.connect(busTraffic);v.o.start();v.o2.start();voices.push(v);
    }
    applyVol();
  }
  function applyVol(){
    if(!ac)return;const t=ac.currentTime;
    master.gain.setTargetAtTime(vol.master,t,.05);busEngine.gain.setTargetAtTime(vol.engine,t,.05);busTraffic.gain.setTargetAtTime(vol.traffic,t,.05);busUI.gain.setTargetAtTime(vol.ui,t,.05);
  }
  function setVol(k,v){vol[k]=v;applyVol()}
  function resume(){if(ac&&ac.state==='suspended')ac.resume()}
  function suspend(){if(ac&&ac.state==='running')ac.suspend()}
  function T(){return ac.currentTime}
  function tone(f,t0,dur,type,gain,dest,f2){
    const o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);
    g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gain,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    o.connect(g);g.connect(dest||busUI);o.start(t0);o.stop(t0+dur+.05);
  }
  function burst(t0,dur,freq,gain,dest,type){
    const s=ac.createBufferSource();s.buffer=noiseBuf('white');const f=ac.createBiquadFilter();f.type=type||'lowpass';f.frequency.value=freq;const g=ac.createGain();
    g.gain.setValueAtTime(gain,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f);f.connect(g);g.connect(dest||busTraffic);s.start(t0,Math.random()*2);s.stop(t0+dur+.05);
  }
  function horn(x,y,kind){
    if(!ac||!G.started)return;const dx=x-P.x,dy=y-P.y,d=Math.hypot(dx,dy);if(d>1900)return;
    const t0=T()+.01;const pan=ac.createStereoPanner();pan.pan.value=clamp(dx/900,-1,1);const gn=ac.createGain();gn.gain.value=.34/(1+d/320);
    const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;pan.connect(gn);gn.connect(busTraffic);
    const notes=kind==='taxi'?[[0,.16],[.24,.16]]:[[0,.34]];const fa=kind==='taxi'?[470,590]:[405,505];
    for(const[o,d2]of notes){for(const f of fa){const os=ac.createOscillator(),g=ac.createGain();os.type='square';os.frequency.value=f*(1+(Math.random()-.5)*.01);g.gain.setValueAtTime(0,t0+o);g.gain.linearRampToValueAtTime(.16,t0+o+.015);g.gain.setValueAtTime(.16,t0+o+d2-.02);g.gain.linearRampToValueAtTime(0,t0+o+d2);os.connect(g);g.connect(lp);lp.connect(pan);os.start(t0+o);os.stop(t0+o+d2+.05)}}
  }
  function playerHorn(on){
    if(!ac)return;
    if(on&&!hornOsc){const g=ac.createGain();g.gain.value=0;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;lp.connect(g);g.connect(busTraffic);
      const os=[405,505].map(f=>{const o=ac.createOscillator();o.type='square';o.frequency.value=f;const m=ac.createGain();m.gain.value=.5;o.connect(m);m.connect(lp);o.start();return o});
      g.gain.setTargetAtTime(.2,T(),.01);hornOsc={g,os}}
    else if(!on&&hornOsc){const h=hornOsc;hornOsc=null;h.g.gain.setTargetAtTime(0,T(),.02);setTimeout(()=>h.os.forEach(o=>{try{o.stop()}catch(e){}}),150)}
  }
  function crash(impact,kind){
    if(!ac)return;const t0=T();const k=clamp((impact-20)/260,.12,1);
    burst(t0,.22+.25*k,kind==='cone'?1800:900,.5*k,busTraffic);
    tone(78,t0,.28,'sine',.7*k,busTraffic,40);
    if(kind==='car'||kind==='wall'){burst(t0+.02,.1,3800,.12*k,busTraffic,'highpass')}
  }
  function chime(kind){
    if(!ac)return;const t0=T()+.01;
    if(kind==='request'){tone(880,t0,.28,'sine',.16);tone(1175,t0+.11,.34,'sine',.14)}
    else if(kind==='accept'){tone(660,t0,.14,'sine',.16);tone(880,t0+.09,.2,'sine',.15)}
    else if(kind==='pickup'){tone(784,t0,.3,'sine',.17);tone(988,t0+.12,.34,'sine',.12)}
    else if(kind==='done'){[523,659,784,1047].forEach((f,i)=>tone(f,t0+i*.085,.4,'sine',.14))}
    else if(kind==='warn'){tone(466,t0,.16,'triangle',.18);tone(466,t0+.22,.16,'triangle',.18)}
    else if(kind==='fail'){tone(330,t0,.3,'triangle',.16,null,220)}
    else if(kind==='buy'){tone(740,t0,.12,'sine',.14);tone(988,t0+.08,.22,'sine',.12)}
    else if(kind==='pump'){for(let i=0;i<3;i++)burst(t0+i*.06,.05,700,.18,busUI)}
    else if(kind==='tool'){for(let i=0;i<4;i++)burst(t0+i*.07,.03,2500,.14,busUI,'highpass')}
  }
  function tick(){if(!ac)return;const t0=T();burst(t0,.018,3200,.05,busTraffic,'highpass')}
  function bindVoices(){
    const used=new Set(voices.map(v=>v.ref).filter(Boolean));
    for(const v of voices){
      if(v.ref&&(!traffic.includes(v.ref)||Math.hypot(v.ref.x-P.x,v.ref.y-P.y)>650))v.ref=null;
    }
    for(const v of voices){
      if(v.ref)continue;let best=null,bd=520;
      for(const o of traffic){if(used.has(o))continue;const d=Math.hypot(o.x-P.x,o.y-P.y);if(d<bd){bd=d;best=o}}
      if(best){v.ref=best;used.add(best)}
    }
  }
  let bindT=0;
  function update(dt){
    if(!ac||ac.state!=='running')return;
    const t=T();const sp=Math.abs(P.speed),tsp=Math.hypot(P.vx,P.vy);const k=P.st?P.st.vmax/600:1;
    const thr=P.thrIn||0;const alive=P.fuel>0&&P.cond>0;
    // cabin filter: windows up = muffled
    cabin.frequency.setTargetAtTime(G.windows?12000:1700,t,.15);
    // engine
    const gears=[120,220,330,440,600].map(x=>x*k);let gi=0;while(gi<4&&sp>gears[gi])gi++;
    const lo=gi?gears[gi-1]:0,fr=clamp((sp-lo)/(gears[gi]-lo),0,1);
    let rpm=gi===0?.14+.62*fr:.3+.55*fr;if(P.speed<-3)rpm=.18+Math.min(.3,sp/300);rpm=clamp(rpm+thr*.06,.12,1);
    const f0=50+rpm*150;eng.o1.frequency.setTargetAtTime(f0,t,.03);eng.o2.frequency.setTargetAtTime(f0*.5,t,.03);
    eng.f.frequency.setTargetAtTime(320+rpm*850+thr*620,t,.05);
    eng.g.gain.setTargetAtTime(alive?.075+rpm*.05+thr*.07:0,t,.06);
    // tyre + road
    const surf=P.onRoad?1:1.9;
    tyre.road.frequency.setTargetAtTime((P.onRoad?380:900)+tsp*.9,t,.1);
    tyre.rg.gain.setTargetAtTime(clamp(tsp/700,0,1)*(P.onRoad?.14:.3)*surf,t,.1);
    const slip=Math.max(0,Math.abs(P.l)-48)/160;const hardBrake=(P.brakeLamp&&sp>240)?.35:0;
    tyre.sg.gain.setTargetAtTime(clamp(slip+hardBrake*.5,0,1)*.12*(tsp>60?1:0),t,.05);
    tyre.sq.frequency.setTargetAtTime(1700+tsp*.8,t,.1);
    wind.g.gain.setTargetAtTime(Math.pow(clamp(tsp/700,0,1),2)*(G.windows?.1:.05),t,.2);
    wind.f.frequency.setTargetAtTime(380+tsp*.8,t,.2);
    // bed: busier in dense districts, quieter in the north
    const dd=districtAt(P.x,P.y).d;const dens={cbd:1.5,hillbrow:1.4,newtown:1.1,maboneng:1.1,braam:1.1,rosebank:1,melville:.8,randburg:.8,sandton:.9,midrand:.7,soweto:.8}[dd.id]||1;
    let near=0;for(const o of traffic)if(Math.abs(o.x-P.x)<600&&Math.abs(o.y-P.y)<600)near++;
    bed.g.gain.setTargetAtTime((.035+near*.004)*dens,t,.5);bed.f.frequency.setTargetAtTime(200+dens*60,t,.5);
    // nearby vehicles
    bindT-=dt;if(bindT<=0){bindT=.5;bindVoices()}
    for(const v of voices){
      if(!v.ref){v.g.gain.setTargetAtTime(0,t,.1);continue}
      const o=v.ref,dx=o.x-P.x,dy=o.y-P.y,d=Math.hypot(dx,dy);
      const heavy=o.kind==='bus'||o.kind==='truck';const base=heavy?36:o.kind==='taxi'?46:56;
      const rv=((o.speed*Math.cos(o.ang)-P.vx)*dx+(o.speed*Math.sin(o.ang)-P.vy)*dy)/(d||1); // closing speed
      const dop=1-clamp(rv/900,-.2,.2)*.35;
      const f=(base+o.speed*(heavy?.09:.2))*dop;v.o.frequency.setTargetAtTime(f,t,.08);v.o2.frequency.setTargetAtTime(f*.5,t,.08);
      v.f.frequency.setTargetAtTime(heavy?260:o.kind==='taxi'?460:520,t,.1);
      v.p.pan.setTargetAtTime(clamp(dx/500,-1,1),t,.08);
      v.g.gain.setTargetAtTime((heavy?.1:.06)/(1+d/130)*(d>520?0:1),t,.1);
    }
    // robot change ticks near player
    let ns=-1,nd=1e9;for(const n of nodes){if(!n.light)continue;const d=Math.hypot(n.x-P.x,n.y-P.y);if(d<nd){nd=d;ns=n.id}}
    if(ns>=0&&nd<520){const st0=lightState(nodes[ns],0,G.t);if(lastLight!==ns+':'+st0){if(lastLight!==-1)tick();lastLight=ns+':'+st0}}
  }
  return{init,update,horn,playerHorn,crash,chime,tick,setVol,resume,suspend,get ready(){return!!ac}};
})();
/* ===== Game data, save, business logic ===== */
const $=id=>document.getElementById(id);
const FUEL_PRICE=22,REPAIR_PER_PCT=9,COMMISSION=.2,KM=1800;
const CARS={
  sprint:{name:'Sprint 1.2',kind:'hatch',power:520,vmax:560,grip:7.5,brake:900,steer:.62,tank:28,kmpl:11000,dmg:1.15,comfort:0,price:0,lvl:0,color:'#2a9d6f',blurb:'Light and nimble. Cheap to run.'},
  ridge:{name:'Ridge 1.6',kind:'sedan',power:610,vmax:620,grip:7.0,brake:950,steer:.56,tank:38,kmpl:10000,dmg:1,comfort:.3,price:6500,lvl:2,color:'#2f5fb8',blurb:'Quicker and more comfortable. Passengers rate it higher.'},
  kopje:{name:'Kopje 2.0',kind:'suv',power:700,vmax:660,grip:6.4,brake:900,steer:.5,tank:55,kmpl:8000,dmg:.7,comfort:.5,price:14000,lvl:3,color:'#3a3f46',blurb:'Heavy and sturdy with a big tank. Takes knocks well.'}
};
const UPS=[
  {k:'engine',name:'Engine tune',desc:'More power and a higher top speed.',max:3,price:[900,1500,2400]},
  {k:'tyres',name:'Performance tyres',desc:'More grip and shorter stopping distance.',max:3,price:[600,1000,1600]},
  {k:'tank',name:'Larger fuel tank',desc:'Adds 6 litres per level.',max:2,price:[500,900]},
  {k:'susp',name:'Reinforced chassis',desc:'Takes less damage in collisions.',max:3,price:[700,1100,1700]},
  {k:'comfort',name:'Comfort pack',desc:'Seat covers, a charger and water. Better ratings and tips.',max:3,price:[400,800,1200]}
];
const LEVELS=[[0,'Rookie'],[5,'Local'],[15,'City driver'],[30,'Gold driver'],[60,'Platinum']];
const NAMES=['Thandi','Sipho','Aisha','Pieter','Naledi','Johan','Lerato','Kabelo','Zanele','Imran','Megan','Tumelo','Nomsa','Riaan','Fatima','Bongani'];
const SAVE_KEY='hamba_rides_v1';
let save;
function freshSave(){return{money:600,car:'sprint',owned:['sprint'],ups:{sprint:{engine:0,tyres:0,tank:0,susp:0,comfort:0}},trips:0,earned:0,ratings:[],km:0,hour:6.5,fuel:14,cond:100}}
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(s&&s.car&&CARS[s.car]&&s.ups)return s}catch(e){}return null}
function persist(){try{save.fuel=P.fuel;save.cond=P.cond;save.hour=G.hour;localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}}
const fmtR=v=>(v<0?'-R':'R')+Math.abs(Math.round(v)).toLocaleString('en-ZA').replace(/ /g,' ');
const levelIdx=()=>{let l=0;for(let i=0;i<LEVELS.length;i++)if(save.trips>=LEVELS[i][0])l=i;return l};
const avgRating=()=>save.ratings.length?save.ratings.reduce((a,b)=>a+b,0)/save.ratings.length:5;
function carStats(){
  const c=CARS[save.car],u=save.ups[save.car];
  return{power:c.power*(1+.08*u.engine),vmax:c.vmax*(1+.05*u.engine),grip:c.grip+.7*u.tyres,brake:c.brake*(1+.06*u.tyres),tank:c.tank+6*u.tank,dmgMul:c.dmg*(1-.08*u.susp),steer:c.steer,kmpl:c.kmpl,comfort:c.comfort+.15*u.comfort};
}
function applyCar(){P.st=carStats();P.spec={L:VT[CARS[save.car].kind].L,W:VT[CARS[save.car].kind].W};P.fuel=Math.min(P.fuel,P.st.tank)}
function placePlayerAt(x,y,ang){P.x=x;P.y=y;P.ang=ang;P.vx=P.vy=P.w=P.f=P.l=P.speed=0;cam.x=x;cam.y=y}
function startPosition(){
  const f=edgeBy([3000,3600],[3400,3600]);const e=f.e;const[x,y,a]=laneXY(e,f.fwd,520,0);placePlayerAt(x,y,a);
}
function setClockEffects(){
  const h=G.hour%24;
  G.night=h>=19.5||h<5?1:h>=18?(h-18)/1.5:h<6.5&&h>=5?(6.5-h)/1.5:0;
  G.warm=clamp(1-Math.abs(h-18)/1.6,0,1);
  const was=G.rush;G.rush=(h>=6.5&&h<9)||(h>=16&&h<18.5);
  if(G.rush!==was&&G.started)toast(G.rush?'Rush hour: more requests and surge fares':'Rush hour is over');
}
const fmtClock=h=>{const hh=Math.floor(h%24),mm=Math.floor((h%1)*60);return String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')};

/* ===== Toast and prompt ===== */
let toastT=0;
function toast(msg,ms){const t=$('toast');t.textContent=msg;t.classList.add('on');toastT=(ms||2600)/1000}
function setPrompt(html){const p=$('prompt');if(html){if(p.dataset.h!==html){p.innerHTML=html;p.dataset.h=html}p.classList.remove('hidden')}else{p.classList.add('hidden');p.dataset.h=''}}

/* ===== Spots and offers ===== */
function makeSpot(nodeId){
  const n=nodes[nodeId];const ids=n.adj.filter(i=>edges[i].type!=='hwy');const e=edges[pick(ids.length?ids:n.adj)];
  const out=e.a===nodeId;const dx=out?e.dx:-e.dx,dy=out?e.dy:-e.dy;const s=Math.min(n.clear+170,e.len*.45);
  const x=n.x+dx*s,y=n.y+dy*s;const side=rnd()<.5?1:-1;const nx=-dy*side,ny=dx*side;
  return{node:nodeId,x,y,px:x+nx*(e.w/2+12),py:y+ny*(e.w/2+12),district:districtAt(x,y).d,edge:e.id};
}
let offerId=1,nextOfferT=1.5,routeT=0,lastNode=0;
function spawnOffer(){
  const pn=nearestNode(P.x,P.y);const cands=[];
  for(const d of DIST)for(const id of d.nodes){const n=nodes[id];const dd=Math.hypot(n.x-P.x,n.y-P.y);if(dd>600&&dd<7500)cands.push(id)}
  if(!cands.length)return;
  const pickup=makeSpot(pick(cands));
  const dm=dijkstra(pickup.node);
  const far=[];for(const d of DIST){if(d===pickup.district)continue;for(const id of d.nodes){if(dm.dist[id]>3000&&dm.dist[id]<19000)far.push(id)}}
  if(!far.length)return;
  const drop=makeSpot(pick(far));const tripDist=dm.dist[drop.node];
  const pdm=dijkstra(pn);const pdist=pdm.dist[pickup.node]+Math.hypot(P.x-nodes[pn].x,P.y-nodes[pn].y)*.5;
  const km=tripDist/KM;const night=G.night>.6;
  const surge=G.rush?+(1.2+rnd()*.35).toFixed(1):night?1.1:1;
  const fare=Math.round((25+km*14)*surge/5)*5;
  const est=tripDist/330;
  G.offers.push({id:offerId++,pickup,drop,tripDist,pdist,fare,surge,est,deadline:est*1.6+24,life:28,max:28,name:pick(NAMES)});
}
function tickOffers(dt){
  if(G.trip){return}
  for(let i=G.offers.length-1;i>=0;i--){G.offers[i].life-=dt;if(G.offers[i].life<=0){G.offers.splice(i,1);G.offersDirty=true}}
  nextOfferT-=dt;
  if(nextOfferT<=0&&G.offers.length<4){spawnOffer();G.offersDirty=true;nextOfferT=G.rush?rr(3.5,6):rr(6,10.5);SFX.chime('request')}
}
function renderBoard(force){
  const b=$('board');
  if(G.trip){b.innerHTML='';b.dataset.sig='';return}
  const sig=G.offers.map(o=>o.id).join(',');
  if(force||b.dataset.sig!==sig||G.offersDirty){
    G.offersDirty=false;b.dataset.sig=sig;
    let h='<h4>Requests nearby</h4>';
    if(!G.offers.length)h+='<div class="panel" style="padding:10px;color:var(--muted);font-size:12px">Waiting for requests. Position near a busy district.</div>';
    G.offers.forEach((o,i)=>{
      h+=`<div class="offer panel" data-i="${i}" tabindex="0" role="button" aria-label="Accept request ${i+1}">
        <span class="key">${i+1}</span><span class="route">${o.pickup.district.name} to ${o.drop.district.name}</span>
        <span class="fare num">${fmtR(o.fare)}</span>
        <span class="meta num">Pickup ${(o.pdist/KM).toFixed(1)} km · Trip ${(o.tripDist/KM).toFixed(1)} km</span>
        <span class="surge">${o.surge>1?o.surge.toFixed(1)+'x demand':''}</span><i class="life" data-life="${o.id}"></i></div>`;
    });
    b.innerHTML=h;
  }
  for(const o of G.offers){const el=b.querySelector(`[data-life="${o.id}"]`);if(el)el.style.width=(o.life/o.max*100)+'%'}
}
function acceptOffer(i){
  if(G.trip||G.modal)return;const o=G.offers[i];if(!o)return;
  const pn=nearestNode(P.x,P.y);const pdm=dijkstra(pn);
  G.trip={stage:'pickup',pickup:o.pickup,drop:o.drop,fare:o.fare,surge:o.surge,est:o.est,deadline:o.deadline,tripDist:o.tripDist,name:o.name,patience:Math.max(40,pdm.dist[o.pickup.node]/280+30),patienceMax:0,clock:0,collisions:0,hard:0,fuel0:P.fuelUsed,hardCool:0,prevSp:0};
  G.trip.patienceMax=G.trip.patience;G.offers=[];G.offerHover=null;routeT=0;
  SFX.chime('accept');toast(`Request accepted. Pick up ${o.name} in ${o.pickup.district.name}`);renderBoard(true);
}
function cancelTrip(reason){
  const T=G.trip;if(!T)return;G.trip=null;G.route=null;nextOfferT=2;
  if(reason){save.ratings.push(Math.max(1,T.stage==='drop'?2:4));if(save.ratings.length>20)save.ratings.shift()}
  toast(reason||'Trip cancelled');SFX.chime('fail');persist();$('trip').classList.add('hidden');
}
function updateRoute(dt){
  const T=G.trip;if(!T){G.route=null;return}
  routeT-=dt;if(routeT>0)return;routeT=1;
  const sp=T.stage==='pickup'?T.pickup:T.drop;const pn=nearestNode(P.x,P.y);const dm=dijkstra(pn);let path=pathTo(dm,sp.node);
  if(path.length>1){const a=nodes[path[0]],b=nodes[path[1]];if((b.x-a.x)*(P.x-a.x)+(b.y-a.y)*(P.y-a.y)>0)path.shift()}
  G.route=path;G.routeLen=(dm.dist[sp.node]||0)+Math.hypot(sp.x-nodes[sp.node].x,sp.y-nodes[sp.node].y);
}
const nearSpot=sp=>Math.hypot(P.x-sp.x,P.y-sp.y)<95&&Math.abs(P.speed)<45;

/* ===== Trip completion ===== */
const FEEDBACK={5:['Smooth and quick. Thank you!','Lekker ride, thanks.','Perfect trip. Siyabonga.','Sharp, thanks for the lift.'],4:['Good trip, thanks.','Nice driving. Dankie.','All good, thank you.'],3:['Okay trip, a bit rough in places.','Fine, but it felt rushed.'],2:['A few too many bumps along the way.','Late and a rough ride.'],1:['That was stressful. Not great.','Too many bumps and very late.']};
function completeTrip(){
  const T=G.trip;if(!T)return;
  const late=T.clock>T.deadline,lateBy=Math.max(0,T.clock-T.deadline);
  let r=5-(late?1+Math.min(1.5,lateBy/60):0)-Math.min(2,T.collisions*.6)-Math.min(.8,T.hard*.2)+Math.min(0,P.st.comfort-.0)+0;
  r=clamp(r+(late||T.collisions?0:P.st.comfort*.3),1,5);r=Math.round(r*10)/10;
  const fee=T.fare*COMMISSION;const express=T.clock<T.deadline*.55?Math.round(10+T.fare*.1):0;
  const smooth=(T.collisions===0&&T.hard<=1)?10:0;
  const tip=(r>=4.5&&rnd()<.3+P.st.comfort*.2)?Math.round(rr(5,20)):0;
  const wear=Math.round(3+T.tripDist/KM*.9);
  const net=T.fare-fee+express+smooth+tip-wear;
  const fuelUsed=P.fuelUsed-T.fuel0;
  save.money+=net;save.earned+=Math.max(0,net);save.trips++;save.km+=T.tripDist/KM;save.ratings.push(r);if(save.ratings.length>20)save.ratings.shift();
  const stars=Math.max(1,Math.round(r));const fb=pick(FEEDBACK[stars]);
  const lvl=levelIdx();
  G.trip=null;G.route=null;G.offers=[];nextOfferT=2.5;G.modal='summary';
  const row=(a,b,c)=>`<span class="${c||''}">${a}</span><span class="num ${c||''}">${b}</span>`;
  $('summaryCard').innerHTML=`<h2>Trip complete</h2><p>${T.name} · ${T.pickup.district.name} to ${T.drop.district.name}</p>
    <div class="stars-big" aria-label="${stars} stars">${'★'.repeat(stars)}${'<span style="opacity:.25">★</span>'.repeat(5-stars)}</div>
    <div class="quote">"${fb}"</div>
    <h3>Earnings</h3><div class="sum">
      ${row('Fare'+(T.surge>1?' ('+T.surge.toFixed(1)+'x demand)':''),fmtR(T.fare))}
      ${row('Platform fee (20%)','-'+fmtR(fee).replace('-',''),'neg')}
      ${express?row('Express bonus','+'+fmtR(express)):''}${smooth?row('Smooth ride bonus','+'+fmtR(smooth)):''}${tip?row('Tip','+'+fmtR(tip)):''}
      ${row('Wear and running costs','-'+fmtR(wear).replace('-',''),'neg')}
      <span class="tot">Net</span><span class="num tot">${fmtR(net)}</span>
    </div>
    <p style="margin-top:10px;font-size:12px">Trip time ${Math.round(T.clock)} s of ${Math.round(T.deadline)} s${late?' (late)':''} · Fuel burned ${fuelUsed.toFixed(1)} L (paid at the pump)</p>
    <p style="font-size:12px">Balance ${fmtR(save.money)} · Rating ${avgRating().toFixed(2)} · ${save.trips} trips · ${LEVELS[lvl][1]}</p>
    <div class="btns"><button class="btn primary" id="bNext">Next request</button><button class="btn" id="bGar">Garage</button></div>`;
  $('summary').classList.remove('hidden');SFX.chime('done');persist();$('trip').classList.add('hidden');
  $('bNext').onclick=closeSummary;$('bGar').onclick=()=>{closeSummary();openGarage()};setTimeout(()=>$('bNext').focus(),30);
}
function closeSummary(){$('summary').classList.add('hidden');if(G.modal==='summary')G.modal=null;renderBoard(true)}
function onPlayerImpact(impact,dmg,kind){
  cam.shake=Math.min(12,impact/22);
  if(G.trip&&G.trip.stage==='drop'&&impact>35)G.trip.collisions++;
  if(P.cond<25&&!G.warnedDmg){G.warnedDmg=true;toast('Car is badly damaged. Visit a panel beater (R on the map)',3400);SFX.chime('warn')}
}

/* ===== Services: refuel, repair, assistance ===== */
function nearService(){for(const s of services){if(Math.hypot(P.x-s.x,P.y-s.y)<95)return s}return null}
function serviceTick(dt){
  const S=G.service;if(!S)return;
  const s=nearService();
  if(!s||s.type!==S.type||Math.abs(P.speed)>60){endService(true);return}
  if(S.type==='fuel'){
    const need=P.st.tank-P.fuel,aff=save.money/FUEL_PRICE;const d=Math.min(need,aff,7*dt);
    P.fuel+=d;save.money-=d*FUEL_PRICE;S.amt+=d;S.cost+=d*FUEL_PRICE;S.tk=(S.tk||0)-dt;if(S.tk<=0){S.tk=.22;SFX.chime('pump')}
    if(P.fuel>=P.st.tank-.01||save.money<=.5){endService()}
  }else{
    const need=100-P.cond,aff=save.money/REPAIR_PER_PCT;const d=Math.min(need,aff,16*dt);
    P.cond+=d;save.money-=d*REPAIR_PER_PCT;S.amt+=d;S.cost+=d*REPAIR_PER_PCT;S.tk=(S.tk||0)-dt;if(S.tk<=0){S.tk=.16;SFX.chime('tool')}
    if(P.cond>=99.99||save.money<=.5){P.cond=Math.min(100,P.cond);G.warnedDmg=false;endService()}
  }
}
function endService(interrupted){
  const S=G.service;if(!S)return;G.service=null;
  if(S.amt>.05)toast((S.type==='fuel'?`Refuelled ${S.amt.toFixed(1)} L`:`Repaired ${Math.round(S.amt)}%`)+` for ${fmtR(S.cost)}`);
  else if(save.money<=.5)toast('Not enough money');
  persist();
}
function startService(s){
  if(G.service)return;
  if(s.type==='fuel'&&P.fuel>=P.st.tank-.2){toast('Tank is full');return}
  if(s.type==='repair'&&P.cond>=99.5){toast('Nothing to repair');return}
  if(save.money<1){toast('Not enough money');return}
  G.service={type:s.type,amt:0,cost:0};
}
function assist(){
  if(G.fade)return;
  if(P.cond<=0){
    G.fade=true;$('fadeTxt').textContent='Towing to the nearest panel beater';$('fade').classList.add('on');
    setTimeout(()=>{let best=null,bd=1e18;for(const s of services){if(s.type!=='repair')continue;const d=Math.hypot(s.x-P.x,s.y-P.y);if(d<bd){bd=d;best=s}}
      if(best){placePlayerAt(best.bx+best.nx*(best.w/2+60),best.by+best.ny*(best.w/2+60),best.ang);}
      save.money=Math.max(0,save.money-350);P.cond=40;G.warnedDmg=false;toast('Towed for R350. Repair the car here.',3200);persist()},700);
    setTimeout(()=>{$('fade').classList.remove('on');G.fade=false},1900);
  }else if(P.fuel<=.05){
    save.money=Math.max(0,save.money-150);P.fuel=6;toast('Roadside fuel delivery: 6 L for R150',3000);SFX.chime('pump');persist();
  }
}

/* ===== Garage ===== */
function openGarage(){
  if(G.modal)return;if(Math.abs(P.speed)>70){toast('Stop the car to open the garage');return}
  G.modal='garage';renderGarage();$('garage').classList.remove('hidden');
}
function closeGarage(){$('garage').classList.add('hidden');if(G.modal==='garage')G.modal=null;persist()}
function pips(n,max){let h='<span class="pips">';for(let i=0;i<max;i++)h+=`<i class="${i<n?'on':''}"></i>`;return h+'</span>'}
function renderGarage(){
  const lvl=levelIdx(),u=save.ups[save.car];const c=CARS[save.car];
  let h=`<h2>Garage</h2><p>Balance <b class="num" style="color:var(--fg)">${fmtR(save.money)}</b> · ${LEVELS[lvl][1]} · ${save.trips} trips</p><h3>Upgrades for ${c.name}</h3>`;
  for(const up of UPS){
    const l=u[up.k];const maxed=l>=up.max;const price=up.price[l];
    h+=`<div class="shoprow"><div><span class="t">${up.name}</span>${pips(l,up.max)}<div class="d">${up.desc}</div></div>
      <button class="btn" data-up="${up.k}" ${maxed||save.money<price?'disabled':''}>${maxed?'Maxed':fmtR(price)}</button></div>`;
  }
  h+='<h3>Vehicles</h3>';
  for(const k of Object.keys(CARS)){
    const cc=CARS[k];const owned=save.owned.includes(k);const active=save.car===k;const locked=lvl<cc.lvl;
    let btn;
    if(active)btn='<button class="btn" disabled>In use</button>';
    else if(owned)btn=`<button class="btn" data-use="${k}">Drive</button>`;
    else if(locked)btn=`<button class="btn" disabled>Level ${LEVELS[cc.lvl][1]}</button>`;
    else btn=`<button class="btn" data-buy="${k}" ${save.money<cc.price?'disabled':''}>${fmtR(cc.price)}</button>`;
    h+=`<div class="shoprow"><div><span class="t">${cc.name}</span><div class="d">${cc.blurb} ${cc.tank+6*(save.ups[k]?save.ups[k].tank:0)} L tank.</div></div>${btn}</div>`;
  }
  h+='<div class="btns"><button class="btn primary" id="bGClose">Back to driving</button></div>';
  $('garageCard').innerHTML=h;$('bGClose').onclick=closeGarage;
}
$('garageCard').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.up){const up=UPS.find(x=>x.k===b.dataset.up),u=save.ups[save.car],price=up.price[u[up.k]];if(save.money>=price&&u[up.k]<up.max){save.money-=price;u[up.k]++;applyCar();SFX.chime('buy');if(up.k==='tank'){}}}
  else if(b.dataset.buy){const cc=CARS[b.dataset.buy];if(save.money>=cc.price){save.money-=cc.price;save.owned.push(b.dataset.buy);save.ups[b.dataset.buy]={engine:0,tyres:0,tank:0,susp:0,comfort:0};save.car=b.dataset.buy;P.cond=100;applyCar();SFX.chime('buy');toast(cc.name+' is yours')}}
  else if(b.dataset.use){save.car=b.dataset.use;applyCar();SFX.chime('accept')}
  renderGarage();persist();
});
/* ===== Input, HUD, main loop ===== */
const touchKeys={};
const GAME_KEYS=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD','KeyE','KeyG','KeyH','KeyV','KeyT','KeyM','Digit1','Digit2','Digit3','Digit4','Escape']);
function inputNow(){
  const k=c=>keys[c]||touchKeys[c];
  return{thr:(k('KeyW')||k('ArrowUp'))?1:0,brake:(k('KeyS')||k('ArrowDown'))?1:0,steer:((k('KeyD')||k('ArrowRight'))?1:0)-((k('KeyA')||k('ArrowLeft'))?1:0),hb:!!k('Space')};
}
function interact(){
  if(G.modal||!G.started||G.paused)return;
  const T=G.trip;
  if(T){
    const sp=T.stage==='pickup'?T.pickup:T.drop;
    if(Math.hypot(P.x-sp.x,P.y-sp.y)<95){
      if(Math.abs(P.speed)>=45){toast('Slow down to stop here');return}
      if(T.stage==='pickup'){T.stage='drop';T.clock=0;routeT=0;G.route=null;SFX.chime('pickup');toast(`${T.name} is on board. Take them to ${T.drop.district.name}`)}
      else completeTrip();
      return;
    }
  }
  const s=nearService();
  if(s){if(G.service)endService();else if(Math.abs(P.speed)>=45)toast('Slow down to stop here');else startService(s)}
}
function togglePause(){
  if(!G.started)return;
  if(G.modal==='garage'){closeGarage();return}
  if(G.modal==='map'){closeMap();return}
  if(G.modal==='summary')return;
  G.paused=!G.paused;$('pause').classList.toggle('hidden',!G.paused);
  if(G.paused){SFX.suspend();SFX.playerHorn(false)}else SFX.resume();
}
addEventListener('keydown',e=>{
  if(GAME_KEYS.has(e.code)&&!(e.target&&e.target.tagName==='INPUT'))e.preventDefault();
  if(e.repeat){keys[e.code]=true;return}
  keys[e.code]=true;
  if(e.code==='Escape'&&!$('about').classList.contains('hidden')){closeAbout();return}
  if(!G.started)return;
  if(e.code==='Escape')togglePause();
  else if(e.code==='Enter'&&G.modal==='summary')closeSummary();
  else if(G.paused)return;
  else if(e.code==='KeyM'){if(G.modal==='map')closeMap();else if(!G.modal)openMap()}
  else if(e.code==='KeyE')interact();
  else if(e.code.startsWith('Digit')&&!G.modal){const i=+e.code.slice(5)-1;if(i>=0&&i<4)acceptOffer(i)}
  else if(e.code==='KeyG'){if(G.modal==='garage')closeGarage();else openGarage()}
  else if(e.code==='KeyV'&&!G.modal){G.windows=!G.windows;toast(G.windows?'Windows down':'Windows up',1400)}
  else if(e.code==='KeyT'&&!G.modal)assist();
  else if(e.code==='KeyH'&&!G.modal)SFX.playerHorn(true);
});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyH')SFX.playerHorn(false)});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;SFX.playerHorn(false)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.started&&!G.paused&&!G.modal)togglePause()});
$('board').addEventListener('click',e=>{const o=e.target.closest('.offer');if(o)acceptOffer(+o.dataset.i)});
$('board').addEventListener('keydown',e=>{if(e.code==='Enter'){const o=e.target.closest('.offer');if(o)acceptOffer(+o.dataset.i)}});
$('board').addEventListener('mouseover',e=>{const o=e.target.closest('.offer');G.offerHover=o?G.offers[+o.dataset.i]||null:null});
$('board').addEventListener('mouseleave',()=>{G.offerHover=null});
function bindTouch(id,code){const b=$(id);const on=e=>{e.preventDefault();touchKeys[code]=true};const off=e=>{e.preventDefault();touchKeys[code]=false};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off)}
bindTouch('tL','ArrowLeft');bindTouch('tR','ArrowRight');bindTouch('tG','ArrowUp');bindTouch('tB','ArrowDown');
$('tE').addEventListener('pointerdown',e=>{e.preventDefault();if(G.modal==='summary')closeSummary();else interact()});
for(const[id,k]of[['vMaster','master'],['vEngine','engine'],['vTraffic','traffic'],['vUI','ui']]){$(id).addEventListener('input',e=>SFX.setVol(k,+e.target.value/100))}
$('bResume').onclick=togglePause;
$('bGarage2').onclick=()=>{G.paused=false;$('pause').classList.add('hidden');SFX.resume();openGarage()};
let newArm=false;
$('bNew').onclick=()=>{
  if(!newArm){newArm=true;$('bNew').textContent='Click again to confirm';setTimeout(()=>{newArm=false;$('bNew').textContent='New game'},3000);return}
  newArm=false;$('bNew').textContent='New game';try{localStorage.removeItem(SAVE_KEY)}catch(e){}
  G.paused=false;$('pause').classList.add('hidden');boot(freshSave());
};

/* ===== Boot ===== */
function seedTraffic(){traffic.length=0;for(let i=0;i<80;i++)spawnAI(250,2700)}
function boot(s){
  save=s;SFX.init();SFX.resume();
  P.fuel=save.fuel;P.cond=save.cond;P.hit=0;P.fuelUsed=0;applyCar();startPosition();
  G.hour=save.hour;G.offers=[];G.trip=null;G.route=null;G.modal=null;G.service=null;G.started=true;G.paused=false;G.warnedDmg=false;G.warnedFuel=false;G.closure=null;
  for(const e of edges)e.closed=0;dynObs.length=0;
  rebuildVHash();seedTraffic();peds.length=0;setClockEffects();nextOfferT=1.2;renderBoard(true);
  $('title').classList.add('hidden');$('hud').classList.remove('hidden');
  if('ontouchstart' in window||navigator.maxTouchPoints>0){$('touch').style.display='flex';$('hint').classList.add('hidden')}
  toast('Welcome. Pick a request on the right to start earning',3600);
}
$('bStart').onclick=()=>boot(freshSave());
const stored=loadSave();if(stored){$('bContinue').disabled=false;$('bContinue').onclick=()=>boot(stored)}

/* ===== Per-frame step ===== */
let autosaveT=20,hudT=0,warnFuel=false,lateWarned=false;
function step(dt){
  G.t+=dt;G.hour+=dt/75;
  if(Math.floor(G.t)!==Math.floor(G.t-dt))setClockEffects();
  const inp=inputNow();P.thrIn=inp.thr;
  const n=Math.min(6,Math.ceil(dt/.012));for(let i=0;i<n;i++)playerStep(dt/n,inp);
  trafficTick(dt);pedsTick(dt);simFxTick(dt);updateClosures(dt);tickOffers(dt);serviceTick(dt);updateRoute(dt);
  if(G.closureMsg){G.closureMsg=false;const e=edges[G.closure.e];toast(`Road closed: ${districtAt(nodes[e.a].x,nodes[e.a].y).d.name} ${ROAD[e.type].name}`,3200)}
  const T=G.trip;
  if(T){
    if(T.stage==='pickup'){T.patience-=dt;if(T.patience<=0)cancelTrip('Passenger cancelled while waiting')}
    else{
      T.clock+=dt;
      if(T.clock>T.deadline&&!T.late){T.late=true;toast('Running late. Rating will drop',2600);SFX.chime('warn')}
      T.hardCool-=dt;const a=(T.prevSp-Math.abs(P.speed))/dt;
      if(T.hardCool<=0&&((T.prevSp>150&&a>720)||(inp.hb&&Math.abs(P.speed)>190))){T.hard++;T.hardCool=1.4}
      T.prevSp=Math.abs(P.speed);
    }
  }
  // warnings
  const low=P.fuel<P.st.tank*.15;
  if(low&&!warnFuel){warnFuel=true;toast('Low fuel. Find a fuel station (F on the map)',3200);SFX.chime('warn')}
  if(P.fuel>P.st.tank*.25)warnFuel=false;
  autosaveT-=dt;if(autosaveT<=0){autosaveT=20;persist()}
  SFX.update(dt);camUpdate(dt);
}
/* ===== HUD ===== */
let lastSig='';
function updateHud(){
  $('sMoney').textContent=fmtR(save.money);
  const avg=avgRating(),st=Math.round(avg);$('sStars').textContent='★'.repeat(st)+'☆'.repeat(5-st);$('sRate').textContent=avg.toFixed(2);
  const l=levelIdx();$('sLevelName').textContent=LEVELS[l][1];$('sTrips').textContent=save.trips+(save.trips===1?' trip':' trips');
  $('sClock').textContent=fmtClock(G.hour);
  const ft=P.fuel/P.st.tank;$('fuelBar').style.width=(ft*100)+'%';$('fuelBar').style.background=ft<.15?'var(--bad)':ft<.3?'var(--warn)':'var(--go)';$('fuelTxt').textContent=P.fuel.toFixed(1)+' L';
  $('condBar').style.width=P.cond+'%';$('condBar').style.background=P.cond<25?'var(--bad)':P.cond<55?'var(--warn)':'var(--go)';$('condTxt').textContent=Math.round(P.cond)+'%';
  $('carName').textContent=CARS[save.car].name;$('winTxt').textContent=G.windows?'Windows down':'Windows up';
  const T=G.trip,tp=$('trip');
  if(T){
    tp.classList.remove('hidden');const sp=T.stage==='pickup'?T.pickup:T.drop;
    $('tLbl').textContent=T.stage==='pickup'?`Pick up ${T.name}`:`Drop off ${T.name}`;
    $('tDest').textContent=sp.district.name;
    $('tDist').textContent=((G.routeLen||0)/KM).toFixed(1)+' km';
    let frac,txt;
    if(T.stage==='pickup'){frac=T.patience/T.patienceMax;txt='Waits '+Math.max(0,Math.ceil(T.patience))+' s'}
    else{const left=T.deadline-T.clock;frac=left/T.deadline;txt=left>=0?Math.ceil(left)+' s left':'Late '+Math.ceil(-left)+' s'}
    $('tTime').textContent=txt;$('tFare').textContent=fmtR(T.fare);
    const bar=$('tBar');bar.style.width=clamp(frac,0,1)*100+'%';bar.style.background=frac<.25?'var(--bad)':frac<.5?'var(--warn)':'var(--go)';
  }else tp.classList.add('hidden');
  // prompt
  let pr='';
  if(!G.modal&&!G.paused){
    const s=nearService();
    if(P.cond<=0)pr='Car will not start. Press <kbd>T</kbd> for a tow (R350)';
    else if(P.fuel<=.05&&Math.abs(P.speed)<12)pr='Out of fuel. Press <kbd>T</kbd> for roadside delivery (R150)';
    else if(T&&Math.hypot(P.x-(T.stage==='pickup'?T.pickup:T.drop).x,P.y-(T.stage==='pickup'?T.pickup:T.drop).y)<95)pr=Math.abs(P.speed)<45?`Press <kbd>E</kbd> to ${T.stage==='pickup'?'pick up '+T.name:'drop off '+T.name}`:'Slow down to stop here';
    else if(s&&G.service)pr=(s.type==='fuel'?'Refuelling':'Repairing')+'… press <kbd>E</kbd> to stop';
    else if(s)pr=Math.abs(P.speed)<45?(s.type==='fuel'?`Press <kbd>E</kbd> to refuel · ${s.name} · ${fmtR(FUEL_PRICE)}/L`:`Press <kbd>E</kbd> to repair · ${s.name} · ${fmtR(REPAIR_PER_PCT)} per %`):'Slow down to stop here';
  }
  setPrompt(pr);
}
/* ===== Main loop ===== */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,Math.max(.001,(now-last)/1000));last=now;
  if(G.started){
    if(!G.paused&&!G.modal)step(dt);
    if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
    hudT-=dt;if(hudT<=0){hudT=.1;updateHud();renderBoard(false)}
    drawSpeedo();drawMini();if(G.modal==='map')drawBigMap();
  }else{G.t+=dt;trafficTick(dt);pedsTick(dt);cam.x=P.x;cam.y=P.y;cam.zoom=.8}
  render();
}

/* ===== About / credits ===== */
bindMap();
function openAbout(){$('about').classList.remove('hidden');setTimeout(()=>$('bAboutClose').focus(),30)}
function closeAbout(){$('about').classList.add('hidden')}
$('bAbout').onclick=openAbout;$('bAbout2').onclick=openAbout;$('bAboutClose').onclick=closeAbout;
$('about').addEventListener('click',e=>{if(e.target.id==='about')closeAbout()});

/* ===== Screen fit: canvas always matches the visible viewport ===== */
function fitScreen(){
  const vv=window.visualViewport,w=Math.round(vv?vv.width:innerWidth),h=Math.round(vv?vv.height:innerHeight);
  document.documentElement.style.setProperty('--vh',h+'px');document.documentElement.style.setProperty('--vw',w+'px');
  document.documentElement.classList.toggle('short',h<=520);document.documentElement.classList.toggle('narrow',w<=760);
  resize();
}
addEventListener('resize',fitScreen);addEventListener('orientationchange',()=>setTimeout(fitScreen,200));
if(window.visualViewport)window.visualViewport.addEventListener('resize',fitScreen);
document.addEventListener('fullscreenchange',()=>setTimeout(fitScreen,100));
fitScreen();
/* initial state behind the title screen */
resize();
save=freshSave();applyCar();startPosition();rebuildVHash();seedTraffic();
G.offers=[];G.hour=save.hour;setClockEffects();
requestAnimationFrame(frame);
