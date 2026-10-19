import * as THREE from './assets/three.module.js';
import {C,rng,mat,ceramic,fabric,wicker,mesh,box,softBox,cylinder,beam,group,pathLine,lines,canvasTexture} from './ink.js?v=20261019r6';
import {paintWindowLight} from './room-light.js?v=20261019r6';

// Small, usable objects for the two existing tea rooms. Vessel forms are
// Song-inspired reconstructions; glaze and wear are original painted details.
const glazes=new Map();
function glaze(style='celadon'){
  if(glazes.has(style))return glazes.get(style);
  const r=rng(style==='tenmoku'?91901:style==='ivory'?38104:48277);
  const colors=style==='tenmoku'?['#493e2f','#51452f','#312f27','#9e8051']:style==='ivory'?['#cec5a4','#f0e7cc','#dfd8bb','#aa9473']:['#789e8e','#b2cabc','#7eaaa0','#aebfa2'];
  const tx=canvasTexture(256,512,(ctx,W,H)=>{
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,colors[3]);g.addColorStop(.045,colors[1]);g.addColorStop(.19,colors[0]);g.addColorStop(.58,colors[1]);g.addColorStop(.88,colors[2]);g.addColorStop(.965,colors[0]);g.addColorStop(1,'#ac916c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(let i=0;i<100;i++){
      const x=r()*W,y=r()*H,rx=4+r()*20,ry=12+r()*60;ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const wash=ctx.createRadialGradient(0,0,0,0,0,1);wash.addColorStop(0,`rgba(227,232,194,${r()*.05})`);wash.addColorStop(1,'rgba(227,232,194,0)');ctx.fillStyle=wash;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    for(let i=0;i<(style==='tenmoku'?1100:2600);i++){
      const x=r()*W,y=r()*H;ctx.fillStyle=style==='tenmoku'?`rgba(191,150,84,${.07+r()*.22})`:`rgba(63,96,76,${.025+r()*.07})`;
      ctx.beginPath();ctx.ellipse(x,y,.25+r()*.75,style==='tenmoku'?1+r()*5:.3+r()*.6,0,0,Math.PI*2);ctx.fill();
    }
    for(let j=0;j<18;j++){const y=80+j*20;ctx.strokeStyle='rgba(57,75,57,.025)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(W*.3,y-1,W*.7,y+2,W,y);ctx.stroke();}
  });
  const m=mat('#ffffff',{map:tx});glazes.set(style,m);return m;
}
function thrown(g,profile,material,x=0,y=0,z=0,segments=32){
  const geo=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),segments),p=geo.attributes.position,uv=geo.attributes.uv,h=Math.max(...profile.map(p=>p[1]));
  for(let i=0;i<p.count;i++)uv.setY(i,p.getY(i)/Math.max(h,.01));
  return mesh(g,geo,material,[x,y,z],[0,0,0],false);
}
function circle(g,x,y,z,radius,color,tube=.004){return mesh(g,new THREE.TorusGeometry(radius,tube,6,32),color,[x,y,z],[Math.PI/2,0,0],false);}
function tube(g,points,radius,material,segments=18){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(g,new THREE.TubeGeometry(curve,segments,radius,7,false),material,[0,0,0],[0,0,0],false);
}

export function teaBowl(g,x,y,z,r=.11,filled=true,style='tenmoku'){
  const profile=[[0,0],[r*.43,0],[r*.45,.012],[r*.38,.020],[r*.56,.033],[r*.81,.062],[r*.96,.087],[r,.101],[r*.952,.103],[r*.90,.087],[r*.75,.060],[r*.50,.037],[0,.029]];
  thrown(g,profile,glaze(style),x,y,z);circle(g,x,y+.102,z,r*.972,ceramic(style==='tenmoku'?'#a99360':'#dfd5b0'),.0028);
  if(filled){
    cylinder(g,r*.81,r*.81,.002,ceramic('#d7d2ad'),x,y+.072,z,32,false);
    const marks=[],random=rng(Math.round((x+37)*(z+51)*97));
    for(let j=0;j<26;j++){const a=random()*Math.PI*2,rr=Math.sqrt(random())*r*.75,px=x+Math.cos(a)*rr,pz=z+Math.sin(a)*rr;marks.push([px,y+.073,pz],[px+.002,y+.073,pz+.001]);}lines(g,marks,true);
  }
}
export function teaEwer(g,x,y,z,angle=0){
  const q=group(g,x,y,z,angle),clay=glaze('celadon');
  thrown(q,[[0,0],[.057,0],[.067,.016],[.087,.052],[.10,.103],[.092,.151],[.068,.188],[.032,.22],[.026,.267],[.039,.282],[.03,.287],[.022,.267]],clay);
  thrown(q,[[0,.295],[.013,.295],[.032,.286],[.041,.283],[.039,.277],[0,.277]],clay);
  mesh(q,new THREE.SphereGeometry(.013,12,8),clay,[0,.298,0],[0,0,0],false);
  tube(q,[[-.076,.157,0],[-.143,.220,0],[-.17,.172,0],[-.153,.079,0],[-.078,.068,0]],.009,clay,24);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(.081,.119,0),new THREE.Vector3(.119,.151,0),new THREE.Vector3(.142,.227,0),new THREE.Vector3(.169,.270,0)]),geo=new THREE.TubeGeometry(curve,22,.018,12,false),p=geo.attributes.position;
  for(let j=0;j<=22;j++){const center=curve.getPointAt(j/22),scale=1-j/22*.54;for(let k=0;k<=12;k++){const i=j*13+k;p.setXYZ(i,center.x+(p.getX(i)-center.x)*scale,center.y+(p.getY(i)-center.y)*scale,center.z+(p.getZ(i)-center.z)*scale);}}geo.computeVertexNormals();mesh(q,geo,clay,[0,0,0],[0,0,0],false);
  mesh(q,new THREE.SphereGeometry(.007,10,6),ceramic('#40554b'),[.17,.271,0],[0,0,0],false).scale.y=.42;
}
function teaCanister(g,x,y,z,radius=.11,height=.25,style='ivory'){
  thrown(g,[[0,0],[radius*.71,0],[radius*.82,.013],[radius,.047],[radius,height*.76],[radius*.86,height*.9],[radius*.65,height*.94],[radius*.64,height],[radius*.54,height],[radius*.55,height*.91]],glaze(style),x,y,z);
  cylinder(g,radius*.65,radius*.66,.021,C.woodLight,x,y+height+.006,z,24,false);circle(g,x,y+height+.018,z,radius*.43,ceramic('#b9a275'),.003);
  mesh(g,new THREE.SphereGeometry(radius*.08,10,6),C.woodDark,[x,y+height+.026,z],[0,0,0],false).scale.y=.7;
}
function linen(g,x,y,z,w=.29,d=.23){
  const q=group(g,x,y,z,.07);softBox(q,w,.006,d,fabric('#d9d1b2'),0,.003,0,.006);softBox(q,w*.92,.004,d*.92,fabric('#eee5c7'),-.008,.008,.009,.003);
  const marks=[];for(let j=0;j<12;j++){const xx=-w*.40+j*w*.073;marks.push([xx,.0105,d*.42],[xx+.008,.0105,d*.42]);}lines(q,marks,true);
  pathLine(q,[[-w*.43,.0105,-d*.36],[-w*.42,.0105,d*.35],[w*.37,.0105,d*.36]],true);
}
function whisk(g,x,y,z){
  const q=group(g,x,y,z,-.13),handle=cylinder(q,.008,.009,.1308,C.basket,0,.016,0,10,false);
  handle.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(.13,.014,0).normalize());
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2;tube(q,[[.052,.022,0],[.10,.030+Math.sin(a)*.022,Math.cos(a)*.022],[.15,.032+Math.sin(a)*.029,Math.cos(a)*.029],[.155,.032+Math.sin(a)*.016,Math.cos(a)*.016]],.0015,ceramic('#bbab78'),8);}
  for(let k=0;k<3;k++)circle(q,.057+k*.005,.022,0,.010,C.woodDark,.0012).rotation.set(0,Math.PI/2,0);
}
function tray(g,x,y,z,w=.36,d=.27){
  softBox(g,w,.018,d,C.woodDark,x,y+.009,z,.011);
  for(const side of [-1,1]){softBox(g,w,.028,.017,C.wood,x,y+.025,z+side*(d/2-.01),.004);softBox(g,.018,.028,d-.02,C.wood,x+side*(w/2-.01),y+.025,z,.004);}
}
export function dressTeaTable(g,x,y,z,variant=0){
  teaBowl(g,x-.39,y,z+.03,.108,true,variant%2?'ivory':'tenmoku');teaBowl(g,x+.35,y,z-.07,.103,true,'celadon');
  (g.userData.steamSources??=[]).push({position:[x-.39,y+.073,z+.03],kind:'tea'});
  teaEwer(g,x+.04,y,z-.09,.5+variant*.7);
  linen(g,x+.43,y,z+.20,.20,.16);
  tray(g,x-.37,y,z-.23,.29,.16);
  for(let j=0;j<3;j++){const bun=mesh(g,new THREE.SphereGeometry(.035,14,10),ceramic('#d9bd88'),[x-.45+j*.08,y+.0282,z-.23],[0,0,j*.25],false);bun.scale.set(1,.29,1);circle(g,x-.45+j*.08,y+.0385,z-.23,.023,ceramic('#b99b65'),.0015);}
  if(variant%2===0)whisk(g,x-.10,y,z+.24);
}

export function dressTeaShelf(g,x,y,z,w,level){
  const step=w/7;
  for(let j=0;j<6;j++){
    const xx=x-w*.42+j*step,zz=z+(j%2?.028:-.015);
    if((j+level)%4===0){
      for(let k=0;k<4;k++)teaBowl(g,xx,y+.031+k*.033,zz,.079,false,k%3===0?'ivory':'celadon');
    }else if((j+level)%4===1){
      teaCanister(g,xx,y+.03,zz,.085+(j%2)*.035,.20+(j%3)*.04,level?'ivory':'celadon');
      if(j===1)teaCanister(g,xx+.21,y+.03,zz-.02,.065,.18,'tenmoku');
    }else if((j+level)%4===2){
      teaEwer(g,xx,y+.03,zz,-.4+j*.14);
    }else{
      tray(g,xx,y+.03,zz,.32,.24);linen(g,xx,y+.05,zz,.26,.18);
    }
  }
}

function drawer(g,x,y,z,w,h){
  softBox(g,w,h,.047,C.wood,x,y,z,.006);
  for(const dy of [-h*.35,h*.35])pathLine(g,[[x-w*.44,y+dy,z+.025],[x+w*.44,y+dy,z+.025]],true);
  for(const dx of [-.045,.045])cylinder(g,.008,.008,.018,ceramic('#675941'),x+dx,y,z+.03,8,false).rotation.x=Math.PI/2;
  tube(g,[[x-.045,y,z+.034],[x-.033,y-.028,z+.062],[x+.033,y-.028,z+.062],[x+.045,y,z+.034]],.004,ceramic('#65563f'),12);
  // Small paper labels are deliberately plain, with two brush-like inventory
  // strokes rather than claiming a readable historical inscription.
  box(g,.058,.028,.0015,fabric(C.cloth),x,y+h*.28,z+.027,false);
  pathLine(g,[[x-.015,y+h*.28-.007,z+.029],[x-.013,y+h*.28+.008,z+.029]],true);
  pathLine(g,[[x+.007,y+h*.28-.007,z+.029],[x+.009,y+h*.28+.006,z+.029]],true);
}
function waterJar(g,x,y,z){
  const radius=.29,h=.62;thrown(g,[[0,0],[.19,0],[.24,.05],[radius,.23],[.28,.46],[.24,.58],[.255,h],[.235,h+.003],[.22,.57],[.235,.44],[.20,.18],[0,.10]],glaze('tenmoku'),x,y,z,40);
  cylinder(g,.228,.228,.004,mat('#6f8f7b'),x,y+.51,z,40,false);circle(g,x,y+.621,z,.245,ceramic('#a18a5c'),.006);
  const lid=group(g,x+.05,y+h+.048,z+.045,.1);cylinder(lid,.245,.248,.017,wicker(),0,0,0,36,false);lid.rotation.x=.12;
  tube(lid,[[-.052,.01,0],[-.038,.065,0],[.038,.065,0],[.052,.01,0]],.006,C.basket,16);
  beam(g,[x-.15,y+h+.046,z-.18],[x+.32,y+h+.077,z+.19],.012,.024,C.basket,false);
  thrown(g,[[0,0],[.043,0],[.067,.034],[.071,.061],[.062,.063],[.051,.029],[0,.017]],ceramic('#b79b67'),x-.18,y+h+.015,z-.19,22);
}
function stove(g,x,y,z){
  const q=group(g,x,y,z),stone=ceramic('#8f8e77');
  // The dark fire mouth is recessed between curved clay sides, not painted
  // on a solid cylinder. Fire stays a quiet ember wash in the daylight.
  const shell=new THREE.CylinderGeometry(.205,.245,.36,24,1,true,.32,Math.PI*2-.64);mesh(q,shell,stone,[0,.19,0],[0,0,0],false);
  cylinder(q,.239,.239,.035,stone,0,.018,0,28,false);cylinder(q,.199,.199,.022,ceramic('#494c40'),0,.365,0,28,false);
  box(q,.13,.14,.025,ceramic('#49483b'),0,.12,.16,false);
  for(let k=0;k<4;k++){const log=softBox(q,.10,.018,.025,ceramic(k%2?'#6b5032':'#a46f43'),(k-1.5)*.03,.05,.18,.005);log.rotation.y=k*.45;}
  for(const a of [0,Math.PI*2/3,Math.PI*4/3])box(q,.042,.055,.061,C.woodDark,Math.sin(a)*.17,.40,Math.cos(a)*.17,false);
  const kettle=glaze('tenmoku');thrown(q,[[0,.41],[.10,.41],[.15,.45],[.16,.53],[.13,.61],[.084,.65],[.087,.67],[.076,.671],[.073,.65]],kettle);
  cylinder(q,.083,.091,.019,kettle,0,.67,0,28,false);mesh(q,new THREE.SphereGeometry(.02,12,8),kettle,[0,.69,0],[0,0,0],false);
  tube(q,[[-.13,.58,0],[-.18,.76,0],[0,.85,0],[.18,.76,0],[.13,.58,0]],.012,ceramic('#695d44'),24);
  tube(q,[[.13,.54,0],[.19,.59,0],[.24,.68,0]],.018,kettle,16);
  q.userData.steamSources=[{position:[.24,.68,0],kind:'kettle'}];
}
export function furnishTea(g,w,d){
  paintWindowLight(g,w,d);
  const back=-d/2,center=-w*.17,cw=w*.60,depth=.48;
  box(g,cw-.1,.45,.044,C.woodDark,center,.545,back+.635,false);
  softBox(g,cw,.065,depth,C.woodLight,center,.80,back+.42,.016);
  for(const side of [-1,1])softBox(g,.09,.49,depth-.045,C.woodDark,center+side*(cw/2-.05),.525,back+.42,.008);
  box(g,cw-.1,.05,depth-.03,C.wood,center,.31,back+.42,false);
  for(let row=0;row<2;row++)for(let j=0;j<5;j++)drawer(g,center-cw/2+(j+.5)*cw/5,.415+row*.235,back+.67,cw/5-.025,.206);
  for(const side of [-1,1])box(g,.08,.07,.09,C.woodLight,center+side*(cw/2-.05),.29,back+.55,false);
  // Right-hand preparation bay leaves the central walking aisle clear.
  waterJar(g,w*.35,.28,back+.62);stove(g,w*.30,.28,back+1.30);
  const utensil=group(g,w*.30,.29,back+2.0,.17);
  mesh(utensil,new THREE.CylinderGeometry(.14,.115,.25,24,1,true),wicker(),[0,.125,0],[0,0,0],false);circle(utensil,0,.25,0,.14,C.basket,.009);
  for(let j=0;j<7;j++){const x=(j-3)*.027;beam(utensil,[x,.06,0],[x+.03,.39+(j%3)*.024,.025],.008,.013,C.basket,false);}
  linen(g,w*.36,.805,back+.23,.24,.28);
  // A long, lightly frayed drying cloth hangs from two fitted wooden pegs.
  const hx=-w*.38,hz=back+.165,geo=new THREE.PlaneGeometry(.43,.53,8,10),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const v=.265-p.getY(i);p.setZ(i,Math.sin(p.getX(i)*37)*.013+v*.023);if(v>.48)p.setY(i,p.getY(i)+Math.sin(p.getX(i)*52)*.005);}geo.computeVertexNormals();mesh(g,geo,fabric('#d7d1b6'),[hx,2.19,hz],[0,0,0],false);
  for(const dx of [-.17,.17])beam(g,[hx+dx,2.45,hz-.04],[hx+dx,2.45,hz+.04],.014,.014,C.woodDark,false);
  return [{x:center,z:back+.42,w:cw,d:depth},{x:w*.32,z:back+1.1,w:.69,d:1.52}];
}
