import * as THREE from './assets/three.module.js';

export const C = {
  paper: '#e9dfc3', sky: '#dce4d3', ground: '#c8b990', soil: '#a3936f', ink: '#403f33',
  lightInk: '#776d51', wood: '#9b7550', woodLight: '#bb9666', woodDark: '#65533e',
  wall: '#eadfbc', plaster: '#d9d5ad', roof: '#667f79', roofLight: '#80948a', roofDark: '#465f5b',
  cloth: '#efe3bb', clothDark: '#c8b887', blue: '#819d9d', blueDark: '#4f747e',
  red: '#b77d60', green: '#91a170', water: '#7faba4', stone: '#b8b29a',
  skin: '#dbbb8c', hair: '#444137', basket: '#bb925b'
};
export function rng(seed=231){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const random=rng(7261);
export const between=(a,b)=>a+(b-a)*random();

const materials = new Map();
const washes=new Map();
function washTexture(kind){
  if(washes.has(kind))return washes.get(kind);
  const tx=canvasTexture(kind==='wood'?1024:512,kind==='wood'?1024:512,(ctx,W,H)=>{
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    const r=rng(kind==='wood'?9402:kind==='roof'?4421:kind==='cloth'?8351:2013);
    for(let i=0;i<9000;i++){ctx.fillStyle=`rgba(59,46,24,${r()*.045})`;ctx.fillRect(r()*W,r()*H,r()*2+1,r()*2+1);}
    if(kind==='roof'){
      for(let y=0;y<H;y+=128)for(let x=0;x<W;x+=128){
        ctx.fillStyle=`rgba(42,62,57,${.02+r()*.07})`;ctx.fillRect(x,y,128,128);
        const shade=ctx.createLinearGradient(x,0,x+128,0);shade.addColorStop(0,'rgba(40,57,51,.22)');shade.addColorStop(.13,'rgba(236,244,215,.10)');shade.addColorStop(.30,'rgba(52,70,61,.12)');shade.addColorStop(.63,'rgba(54,69,60,.03)');shade.addColorStop(1,'rgba(39,55,49,.15)');ctx.fillStyle=shade;ctx.fillRect(x,y,128,128);
        ctx.strokeStyle='rgba(41,57,49,.26)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+122);ctx.quadraticCurveTo(x+13,y+116,x+27,y+123);ctx.quadraticCurveTo(x+77,y+134,x+128,y+121);ctx.stroke();
        ctx.strokeStyle='rgba(245,241,208,.14)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x+5,y+3);ctx.lineTo(x+5,y+117);ctx.stroke();
      }
    }else if(kind==='wood'){
      // Longitudinal fibres are mapped in metres by timberBox below. The wash
      // varies slowly; short broken fibres stay subordinate to the timber.
      const knots=[[.18,.29,.015,.056],[.71,.72,.019,.081],[.46,.91,.009,.04]];
      for(let k=0;k<34;k++){
        const x=r()*W,yy=r()*H,ww=10+r()*62;
        const g=ctx.createLinearGradient(x-ww,0,x+ww,0);
        g.addColorStop(0,'rgba(86,58,27,0)');g.addColorStop(.5,`rgba(86,58,27,${.025+r()*.058})`);g.addColorStop(1,'rgba(86,58,27,0)');
        ctx.fillStyle=g;ctx.fillRect(x-ww,yy-H,ww*2,H*2);
      }
      for(let k=0;k<225;k++){
        const start=k/225*W+r()*3,phase=r()*6,alpha=.045+r()*.14;
        ctx.strokeStyle=`rgba(70,45,23,${alpha})`;ctx.lineWidth=.35+r()*.85;ctx.beginPath();
        for(let j=0;j<=90;j++){
          const t=j/90,yy=t*H;let xx=start+Math.sin(t*Math.PI*2+phase)*2.2+Math.sin(t*Math.PI*8+phase)*.45;
          for(const [kx,ky,rx,ry] of knots){const dx=start/W-kx,dy=(t-ky)/ry;xx+=Math.sign(dx)*rx*W*Math.exp(-dy*dy*.65)*Math.exp(-Math.abs(dx)/(.015+rx*3));}
          j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);
        }ctx.stroke();
      }
      for(const [kx,ky,rx,ry] of knots){
        for(let j=1;j<6;j++){ctx.strokeStyle=`rgba(75,48,27,${.19-j*.018})`;ctx.lineWidth=.65;ctx.beginPath();ctx.ellipse(kx*W,ky*H,rx*W*j/5,ry*H*j/5,.025,0,Math.PI*2);ctx.stroke();}
      }
      for(let i=0;i<950;i++){
        const x=r()*W,y=r()*H,len=2+r()*27;
        ctx.strokeStyle=r()<.55?`rgba(255,244,204,${.10+r()*.15})`:`rgba(77,51,27,${.035+r()*.08})`;
        ctx.lineWidth=.4+r()*.7;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+r()*.7,y+len);ctx.stroke();
      }
    }else if(kind==='endgrain'){
      const cx=W*.49,cy=H*.52;
      for(let j=1;j<35;j++){
        const rr=9+j*8.1;ctx.strokeStyle=`rgba(74,50,28,${.06+r()*.095})`;ctx.lineWidth=.7+r()*1.4;ctx.beginPath();
        for(let k=0;k<=100;k++){const a=k/100*Math.PI*2,rad=rr*(1+Math.sin(a*3+j*.09)*.026+Math.sin(a*7)*.009);const x=cx+Math.cos(a)*rad,y=cy+Math.sin(a)*rad*.89;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      }
      for(let j=0;j<4;j++){const a=j*1.77+.21,rr=110+r()*80;ctx.strokeStyle='rgba(59,42,27,.17)';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);ctx.lineTo(cx+Math.cos(a+.013)*300,cy+Math.sin(a+.013)*300);ctx.stroke();}
      for(let j=0;j<100;j++){const y=r()*H;ctx.strokeStyle='rgba(250,237,199,.09)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y-13);ctx.stroke();}
    }else if(kind==='cloth'){
      ctx.strokeStyle='rgba(78,61,37,.035)';ctx.lineWidth=.5;for(let i=0;i<W;i+=3){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+r()*2,H);ctx.stroke();}for(let i=0;i<H;i+=4){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(W,i+r()*2);ctx.stroke();}
      for(let i=0;i<12;i++){ctx.strokeStyle=`rgba(72,55,31,${r()*.10})`;ctx.beginPath();let x=r()*W;ctx.moveTo(x,0);ctx.bezierCurveTo(x+30,H*.3,x-20,H*.7,x+4,H);ctx.stroke();}
    }else if(kind==='wicker'||kind==='reed'){
      const step=kind==='reed'?12.8:16;
      for(let row=-1;row<Math.ceil(H/step);row++)for(let col=-1;col<Math.ceil(W/step);col++){
        const x=col*step,y=row*step,horizontal=kind==='reed'||(row+col)%2===0;
        ctx.fillStyle='rgba(63,45,23,.17)';ctx.fillRect(x,y,step,step);
        ctx.fillStyle=`rgba(254,238,191,${.68+r()*.21})`;
        ctx.fillRect(x+(horizontal?0:1.5),y+(horizontal?1.5:0),step-(horizontal?0:3),step-(horizontal?3:0));
        ctx.strokeStyle='rgba(68,46,25,.12)';ctx.lineWidth=.55;ctx.beginPath();
        if(horizontal){ctx.moveTo(x,y+step*.33);ctx.lineTo(x+step,y+step*.36);ctx.moveTo(x,y+step*.71);ctx.lineTo(x+step,y+step*.68);}
        else{ctx.moveTo(x+step*.33,y);ctx.lineTo(x+step*.36,y+step);ctx.moveTo(x+step*.72,y);ctx.lineTo(x+step*.68,y+step);}ctx.stroke();
      }
      if(kind==='reed')for(let x=32;x<W;x+=64){
        ctx.strokeStyle='rgba(73,54,29,.36)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
        for(let y=0;y<H;y+=step){ctx.strokeStyle='rgba(245,225,177,.42)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-2,y+2);ctx.lineTo(x+2,y+step-2);ctx.stroke();}
      }
    }else if(kind==='plaster'){
      const wall=ctx.createLinearGradient(0,0,0,H);wall.addColorStop(0,'rgba(244,244,220,.08)');wall.addColorStop(.74,'rgba(111,110,78,0)');wall.addColorStop(.91,'rgba(111,110,78,.026)');wall.addColorStop(1,'rgba(111,110,78,.10)');ctx.fillStyle=wall;ctx.fillRect(0,0,W,H);
      for(let j=0;j<70;j++){
        const x=r()*W,y=r()*H,rad=12+r()*70,g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,j%3?`rgba(141,132,91,${.01+r()*.035})`:`rgba(255,250,224,${.05+r()*.09})`);g.addColorStop(1,'rgba(141,132,91,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
      }
      for(let j=0;j<210;j++){const x=r()*W,y=r()*H;ctx.strokeStyle='rgba(105,105,77,.035)';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+8,y+2,x+20+r()*30,y+1);ctx.stroke();}
      for(let j=0;j<5;j++){
        let x=r()*W,y=H*(.22+r()*.73),len=12+r()*27;ctx.strokeStyle='rgba(91,90,67,.12)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+4,y+len*.35);ctx.lineTo(x+1,y+len*.73);ctx.lineTo(x+5,y+len);ctx.stroke();
        if(j%2===0){ctx.beginPath();ctx.moveTo(x+1,y+len*.73);ctx.lineTo(x-7,y+len*.91);ctx.stroke();}
      }
    }else if(kind==='stone'){
      for(let j=0;j<160;j++){
        const x=r()*W,y=r()*H,rad=5+r()*42,g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(70,82,65,${.02+r()*.045})`);g.addColorStop(1,'rgba(70,82,65,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
      }
      for(let j=0;j<2500;j++){ctx.fillStyle=j%2?'rgba(72,82,66,.06)':'rgba(251,243,211,.11)';ctx.fillRect(r()*W,r()*H,.5+r(),.5+r());}
    }else if(kind==='ceramic'){
      for(let i=0;i<90;i++){const x=r()*W,y=r()*H,rad=35+r()*90,g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(77,66,42,${.005+r()*.02})`);g.addColorStop(1,'rgba(77,66,42,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);}
      // A quiet wash and faint wheel marks; ceramics never inherit timber or roof imagery.
      for(let y=8;y<H;y+=19+r()*13){ctx.strokeStyle=`rgba(80,69,46,${.012+r()*.024})`;ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(W*.3,y-1,W*.7,y+1,W,y);ctx.stroke();}
    }else{
      for(let i=0;i<140;i++){const x=r()*W,y=r()*H,rad=r()*42+5,g=ctx.createRadialGradient(x,y,0,x,y,rad);g.addColorStop(0,`rgba(78,62,34,${r()*.025})`);g.addColorStop(1,'rgba(78,62,34,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);}
      for(let i=0;i<180;i++){const x=r()*W,y=r()*H;ctx.strokeStyle=`rgba(70,57,31,${r()*.05})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+r()*10,y+r()*2);ctx.stroke();}
    }
  });tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=8;washes.set(kind,tx);return tx;
}
export function mat(color, options={}) {
  const key=color+Object.entries(options).map(([k,v])=>k+':'+(v?.uuid||v)).join('|');
  if(!materials.has(key)) {
    const kind=[C.wood,C.woodLight,C.woodDark,C.basket].includes(color)?'wood':[C.cloth,C.clothDark].includes(color)?'cloth':[C.wall,C.plaster].includes(color)?'plaster':color===C.stone?'stone':null;
    const m=new THREE.MeshLambertMaterial({color,side:THREE.DoubleSide,...(kind&&!options.map?{map:washTexture(kind)}:{}),...options});
    materials.set(key,m);
  }
  return materials.get(key);
}
export const ceramic=color=>mat(color,{map:washTexture('ceramic')});
export const wicker=()=>mat(C.basket,{map:washTexture('wicker')});
export const fabric=color=>mat(color,{map:washTexture('cloth')});
export const reedMat=(color=C.clothDark)=>mat(color,{map:washTexture('reed')});
export const endWood=(color=C.wood)=>mat(color,{map:washTexture('endgrain')});
const lineMat=new THREE.LineBasicMaterial({color:C.ink,transparent:true,opacity:.49});
const lightLine=new THREE.LineBasicMaterial({color:C.lightInk,transparent:true,opacity:.38});
export function lines(parent,points,light=false) {
  const p=points.flat();
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
  const o=new THREE.LineSegments(geo,light?lightLine:lineMat);parent.add(o);return o;
}
export function pathLine(parent,points,light=false) {
  const pair=[];for(let i=1;i<points.length;i++)pair.push(points[i-1],points[i]);return lines(parent,pair,light);
}
export function mesh(parent,geo,color,position=[0,0,0],rotation=[0,0,0],outline=true) {
  const m=new THREE.Mesh(geo,typeof color==='string'?mat(color):color);
  m.position.set(...position);m.rotation.set(...rotation);parent.add(m);
  if(outline){const l=new THREE.LineSegments(new THREE.EdgesGeometry(geo,28),lineMat);m.add(l);}
  return m;
}
const timberColors=new Set([C.wood,C.woodLight,C.woodDark,C.basket]);
let timberSequence=0;
function timberBox(geo,w,h,d,color){
  if(typeof color!=='string'||!timberColors.has(color))return color;
  const sizes=[w,h,d],axis=sizes.indexOf(Math.max(...sizes)),p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  const across=[0,1,2].filter(k=>k!==axis),offset=(timberSequence++*.61803398875)%1;
  for(let i=0;i<p.count;i++){
    const xyz=[p.getX(i),p.getY(i),p.getZ(i)],normal=[Math.abs(n.getX(i)),Math.abs(n.getY(i)),Math.abs(n.getZ(i))];
    if(normal[axis]>.94){uv.setXY(i,xyz[across[0]]/sizes[across[0]]+.5,xyz[across[1]]/sizes[across[1]]+.5);}
    else{
      const cross=normal[across[0]]>normal[across[1]]?across[1]:across[0];
      uv.setXY(i,xyz[cross]/.42+offset,xyz[axis]/2.8+offset*.43);
    }
  }
  const body=mat(color),end=mat(color,{map:washTexture('endgrain')});
  return [0,0,1,1,2,2].map(k=>k===axis?end:body);
}
function wallUV(geo,color,x,y,z){
  if(![C.wall,C.plaster,C.stone].includes(color))return;
  const p=geo.attributes.position,n=geo.attributes.normal,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){
    const xx=p.getX(i)+x,yy=p.getY(i)+y,zz=p.getZ(i)+z;
    if(Math.abs(n.getY(i))>.9)uv.setXY(i,xx/3.5,zz/3.5);
    else uv.setXY(i,(Math.abs(n.getX(i))>.9?zz:xx)/3.5,yy/3.5);
  }
}
export function box(parent,w,h,d,color,x=0,y=0,z=0,outline=true){const geo=new THREE.BoxGeometry(w,h,d);wallUV(geo,color,x,y,z);return mesh(parent,geo,timberBox(geo,w,h,d,color),[x,y,z],[0,0,0],outline);}

export function softBox(parent,w,h,d,color,x=0,y=0,z=0,radius=.016){
  const geo=new THREE.BoxGeometry(w,h,d,3,3,3),p=geo.attributes.position,r=Math.min(radius,w*.14,h*.22,d*.14),v=new THREE.Vector3(),core=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);core.set(THREE.MathUtils.clamp(v.x,-w/2+r,w/2-r),THREE.MathUtils.clamp(v.y,-h/2+r,h/2-r),THREE.MathUtils.clamp(v.z,-d/2+r,d/2-r));v.sub(core).normalize().multiplyScalar(r).add(core);p.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();
  return mesh(parent,geo,timberBox(geo,w,h,d,color),[x,y,z],[0,0,0],false);
}
export function cylinder(parent,r1,r2,h,color,x=0,y=0,z=0,segments=10,outline=true){return mesh(parent,new THREE.CylinderGeometry(r1,r2,h,segments),color,[x,y,z],[0,0,0],outline);}
export function beam(parent,a,b,width=.1,depth=width,color=C.wood,outline=true) {
  const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);
  const geo=new THREE.BoxGeometry(width,d.length(),depth);
  const m=mesh(parent,geo,timberBox(geo,width,d.length(),depth,color),A.clone().add(B).multiplyScalar(.5).toArray(),[0,0,0],outline);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;
}
export function group(parent,x=0,y=0,z=0,angle=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;parent.add(g);return g;}
export function shape(parent,points,depth,color,x=0,y=0,z=0){const s=new THREE.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();return mesh(parent,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false}),color,[x,y,z]);}

export function canvasTexture(width,height,draw){const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const signCache=new Map();
export function sign(parent,text,w,h,x,y,z,vertical=false,cloth=false) {
  const key=`${text}-${vertical}-${cloth}`;
  let material=signCache.get(key);
  if(!material){
  const tx=canvasTexture(vertical?256:512,vertical?768:192,(ctx,W,H)=>{
    ctx.fillStyle=cloth?'#f0e5c5':'#c9a876';ctx.fillRect(0,0,W,H);
    for(let i=0;i<1600;i++){ctx.fillStyle=`rgba(70,55,31,${random()*.065})`;ctx.fillRect(random()*W,random()*H,random()*3+1,random()*7+1);}
    ctx.strokeStyle='#706144';ctx.lineWidth=2;ctx.strokeRect(9,9,W-18,H-18);
    ctx.fillStyle='#414237';ctx.textAlign='center';ctx.textBaseline='middle';
    const face='"Kaiti SC", STKaiti, KaiTi, "Songti SC", SimSun, serif';
    if(vertical){ctx.font=`${Math.min(170,H/(text.length+1))}px ${face}`;Array.from(text).forEach((ch,i)=>{ctx.save();ctx.translate(W/2+Math.sin(i*2.1)*2,H/(text.length+1)*(i+1));ctx.rotate(Math.sin(i+2)*.012);ctx.fillText(ch,0,0);ctx.restore();});}
    else {const fontSize=Math.min(119,W/(text.length+.8));ctx.font=`${fontSize}px ${face}`;Array.from(text).forEach((ch,i)=>{ctx.save();ctx.translate(W/2+(i-(text.length-1)/2)*fontSize,H*.53+Math.sin(i*2.4)*2);ctx.rotate(Math.sin(i+1)*.012);ctx.fillText(ch,0,0);ctx.restore();});}
  });
  material=new THREE.MeshBasicMaterial({map:tx,side:THREE.DoubleSide});signCache.set(key,material);
  }
  const m=mesh(parent,new THREE.PlaneGeometry(w,h),material,[x,y,z],[0,0,0],false);return m;
}

export function roof(parent,w,d,eaveY,rise=1.4,hip=false) {
  const over=.48,W=w/2+over,D=d/2+over;
  const ridge=hip?Math.max(.3,W-.9):W;
  const profile=(t)=>eaveY+rise*(1-t)-.15*Math.sin(Math.PI*t)+.07*t*t;
  for(const side of [-1,1]) {
    const vertices=[],uvs=[],idx=[];
    const cols=hip?20:2,rows=8;
    for(let j=0;j<=rows;j++){
      const t=j/rows,z=side*D*t,y=profile(t),span=hip?ridge+(W-ridge)*t:W;
      for(let i=0;i<=cols;i++){const x=-span+2*span*i/cols;vertices.push(x,y,z);uvs.push(x/.8,t*Math.hypot(D,rise)/1.2);}
    }
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){let a=j*(cols+1)+i,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(idx);geo.computeVertexNormals();
    // One structural pitch drives both the roof skin and its clay courses.
    // The original scan remains a visual reference, not a second tile grid.
    mesh(parent,geo,mat(C.roof,{map:washTexture('roof')}),[0,0,0],[0,0,0],false);
    const lining=geo.clone(),lp=lining.attributes.position;for(let i=0;i<lp.count;i++)lp.setY(i,lp.getY(i)-.09);lining.computeVertexNormals();mesh(parent,lining,C.woodLight,[0,0,0],[0,0,0],false);
    const rafterPitch=parent.userData.roofDetail?.28:.55;
    for(let x=-w/2+.13;x<w/2;x+=rafterPitch){for(let j=0;j<4;j++){const t=j/4,tt=(j+1)/4;beam(parent,[x,profile(t)-.145,side*D*t],[x,profile(tt)-.145,side*D*tt],.046,.067,C.woodDark,false);}}
    for(const t of [.08,.51,.88]){
      const span=hip?Math.min(w/2,ridge+(W-ridge)*t):w/2;
      beam(parent,[-span,profile(t)-.225,side*D*t],[span,profile(t)-.225,side*D*t],.115,.13,C.wood,false);
    }

    if(parent.userData.roofDetail!==false)roofTiles(parent,{W,D,ridge,profile,side,hip});
    beam(parent,[-W,profile(1),side*D],[W,profile(1),side*D],.12,.1,C.woodDark);
  }
  for(const side of [-1,1]){
    if(hip){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([side*ridge,eaveY+rise,0,side*W,eaveY+.07,-D,side*W,eaveY+.07,D],3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([.5,0,0,1,1,1],2));geo.computeVertexNormals();mesh(parent,geo,mat(C.roofLight,{map:washTexture('roof')}),[0,0,0],[0,0,0],false);for(let j=1;j<10;j++){const t=j/10;pathLine(parent,[[side*(ridge+(W-ridge)*t),profile(t)+.02,-D*t],[side*(ridge+(W-ridge)*t),profile(t)+.02,D*t]],true);}}
    else {shape(parent,[[-D,eaveY],[0,eaveY+rise],[D,eaveY]],.1,C.wall,side*W,0,0).rotation.y=Math.PI/2;}
    for(const front of [-1,1]){
      const points=[];for(let j=0;j<=8;j++){const t=j/8;points.push([side*(ridge+(W-ridge)*t),profile(t)+.035,front*D*t]);}
      clayRidge(parent,points,.075,parent.userData.roofDetail);
    }
  }
  clayRidge(parent,[[-ridge-.12,eaveY+rise+.058,0],[ridge+.12,eaveY+rise+.058,0]],.105,parent.userData.roofDetail);
}

function clayRidge(parent,points,radius,detailed){
  const vertices=[],indices=[],uvs=[],A=new THREE.Vector3(),B=new THREE.Vector3(),up=new THREE.Vector3(),lateral=new THREE.Vector3(),Y=new THREE.Vector3(0,1,0);
  for(let segment=1;segment<points.length;segment++){
    A.fromArray(points[segment-1]);B.fromArray(points[segment]);const direction=B.clone().sub(A),length=direction.length(),count=detailed?Math.ceil(length/.30):1;direction.normalize();lateral.crossVectors(Y,direction).normalize();up.crossVectors(direction,lateral).normalize();
    for(let j=0;j<count;j++){
      const a=A.clone().lerp(B,j/count),b=A.clone().lerp(B,(j+1)/count),base=vertices.length/3,cross=detailed?8:5;
      for(let end=0;end<2;end++)for(let k=0;k<=cross;k++){
        const theta=k/cross*Math.PI,rad=radius+(end&&detailed?.006:0),p=(end?b:a).clone().addScaledVector(lateral,Math.cos(theta)*rad).addScaledVector(up,Math.sin(theta)*rad);
        vertices.push(p.x,p.y,p.z);uvs.push(k/cross,end);
      }
      for(let k=0;k<cross;k++){const n=base+k;indices.push(n,n+cross+1,n+1,n+1,n+cross+1,n+cross+2);}
      if(detailed){
        const inner=vertices.length/3;
        for(let k=0;k<=cross;k++)for(let l=0;l<2;l++){
          const theta=k/cross*Math.PI,rad=radius+.006-l*.011,p=b.clone().addScaledVector(lateral,Math.cos(theta)*rad).addScaledVector(up,Math.sin(theta)*rad);
          vertices.push(p.x,p.y,p.z);uvs.push(k/cross,l*.07);
        }
        for(let k=0;k<cross;k++){const n=inner+k*2;indices.push(n,n+1,n+2,n+2,n+1,n+3);}
      }
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(parent,geo,ceramic(C.roofDark),[0,0,0],[0,0,0],false);
}

function roofTiles(parent,{W,D,ridge,profile,side,hip}){
  const pos=[],uv=[],colors=[],idx=[],edge=[],pitch=.20,rows=Math.ceil(Math.hypot(D,profile(0)-profile(1))/.30),rr=rng(Math.round(W*710+D*901+side*71));
  const slate=new THREE.Color(C.roof),tileCount=Math.floor(2*W/pitch),start=-tileCount*pitch/2;
  const material=mat('#ffffff',{map:washTexture('ceramic'),vertexColors:true});
  function strip(x,t0,t1,width,cover){
    const col=slate.clone().multiplyScalar(.87+rr()*.22),cross=cover?5:2,along=1,base=pos.length/3;
    const wobble=(rr()-.5)*.009,free=(rr()-.5)*.006;
    for(let j=0;j<=along;j++)for(let k=0;k<=cross;k++){
      const v=j/along,t=t0+(t1-t0)*v,a=k/cross*Math.PI;
      const span=hip?ridge+(W-ridge)*t:W;
      const xx=THREE.MathUtils.clamp(x+(k/cross-.5)*width,-span,span);
      const curve=cover?Math.sin(a)*.044:-Math.sin(a)*.012;
      pos.push(xx,profile(t)+.019+curve+v*v*.011+wobble,side*(D*t+free*v));uv.push(k/cross,v);
      const light=.96+.04*Math.sin(a);colors.push(col.r*light,col.g*light,col.b*light);
    }
    for(let j=0;j<along;j++)for(let k=0;k<cross;k++){const n=base+j*(cross+1)+k;idx.push(n,n+cross+1,n+1,n+1,n+cross+1,n+cross+2);}
    // A free clay edge with a dark inner wall gives each overlapping tile
    // actual thickness when looking up from under the eaves.
    if(t1===1||cover){
      const lipBase=pos.length/3;
      for(let k=0;k<=cross;k++)for(let j=0;j<2;j++){
        const a=k/cross*Math.PI,span=hip?ridge+(W-ridge)*t1:W,xx=THREE.MathUtils.clamp(x+(k/cross-.5)*width,-span,span);
        pos.push(xx,profile(t1)+.03+(cover?Math.sin(a)*.044:-Math.sin(a)*.012)+wobble-j*.012,side*(D*t1+free));uv.push(k/cross,j*.08);
        colors.push(col.r*.76,col.g*.79,col.b*.78);
      }
      for(let k=0;k<cross;k++){const n=lipBase+k*2;idx.push(n,n+1,n+2,n+2,n+1,n+3);}
    }
    if(cover&&t1===1){const t=t1,span=hip?ridge+(W-ridge)*t:W;for(let k=0;k<cross;k++){const a=k/cross*Math.PI,b=(k+1)/cross*Math.PI;edge.push([THREE.MathUtils.clamp(x+(k/cross-.5)*width,-span,span),profile(t)+.033+Math.sin(a)*.044+wobble,side*(D*t+free+.001)],[THREE.MathUtils.clamp(x+((k+1)/cross-.5)*width,-span,span),profile(t)+.033+Math.sin(b)*.044+wobble,side*(D*t+free+.001)]);}}
  }
  for(let i=0;i<tileCount;i++)for(let j=0;j<rows;j++){
    const t0=j/rows,t1=(j+1)/rows,x=start+i*pitch+.10,span=hip?ridge+(W-ridge)*t1:W;
    if(Math.abs(x)>span+.10)continue;
    strip(x,t0,t1,.148,false);strip(x-.10,t0,t1,.074,true);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeVertexNormals();
  mesh(parent,geo,material,[0,0,0],[0,0,0],false);if(edge.length)lines(parent,edge,true);
}

// Static batching retains material identity while reducing several thousand drawn details to a few dozen calls.
function geometryPart(geo,start,count){
  // Material groups (notably real timber end-grain) retain only referenced
  // vertices, so splitting six box faces does not duplicate complete boxes.
  const ids=[],remap=new Map(),indices=[];
  for(let j=start;j<start+count;j++){
    const original=geo.index?geo.index.getX(j):j;
    if(!remap.has(original)){remap.set(original,ids.length);ids.push(original);}
    indices.push(remap.get(original));
  }
  const result=new THREE.BufferGeometry();
  for(const [name,attribute] of Object.entries(geo.attributes)){
    const values=new Float32Array(ids.length*attribute.itemSize);
    for(let i=0;i<ids.length;i++)for(let k=0;k<attribute.itemSize;k++)values[i*attribute.itemSize+k]=attribute.array[ids[i]*attribute.itemSize+k];
    result.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize));
  }
  result.setIndex(indices);return result;
}
export function batchStatic(root,{cellSize=0,minCellVertices=24000,multiDraw=false}={}) {
  root.updateMatrixWorld(true);
  const inverseRoot=root.matrixWorld.clone().invert();
  const meshBins=new Map(),lineBins=new Map();const all=[];
  const center=new THREE.Vector3(),extent=new THREE.Vector3();
  function binKey(material,geometry){
    if(!cellSize)return material.uuid;
    geometry.computeBoundingBox();geometry.boundingBox.getCenter(center);geometry.boundingBox.getSize(extent);
    // A district-wide ground sheet or shore line remains a single draw. Small
    // objects keep their complete geometry, grouped by location for culling.
    if(extent.x>cellSize*2||extent.z>cellSize*2)return material.uuid+'|wide';
    return material.uuid+'|'+Math.floor(center.x/cellSize)+','+Math.floor(center.z/cellSize);
  }
  root.traverse(o=>{
    if(o===root||!o.geometry)return;
    if(o.isMesh){
      const parts=Array.isArray(o.material)?o.geometry.groups.map(g=>({material:o.material[g.materialIndex],geometry:geometryPart(o.geometry,g.start,g.count)})):[{material:o.material,geometry:o.geometry.clone()}];
      for(const {material,geometry} of parts){geometry.applyMatrix4(o.matrixWorld).applyMatrix4(inverseRoot);const key=material.uuid;if(!meshBins.has(key))meshBins.set(key,{material,geos:[]});meshBins.get(key).geos.push(geometry);}all.push(o);
    }
    else if(o.isLineSegments){const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inverseRoot),key=o.material.uuid;if(!lineBins.has(key))lineBins.set(key,{material:o.material,geos:[]});lineBins.get(key).geos.push(geometry);all.push(o);}
  });
  // Ink lines have few vertices per material; splitting them adds submissions
  // in the wide bridge view without removing enough work. Cull mesh cells only.
  if(cellSize)for(const bins of [meshBins]){
    const rows=[...bins.values()];bins.clear();
    for(const row of rows){
      // Rare colours and tiny ceramics remain merged. Splitting their few
      // vertices would cost more draw submissions than the culling saves.
      if(row.geos.reduce((sum,g)=>sum+g.attributes.position.count,0)<minCellVertices){bins.set(row.material.uuid,row);continue;}
      for(const geometry of row.geos){const key=binKey(row.material,geometry);if(!bins.has(key))bins.set(key,{material:row.material,geos:[]});bins.get(key).geos.push(geometry);}
    }
  }
  const result=new THREE.Group();
  for(const [bins,isLine] of [[meshBins,false],[lineBins,true]])for(const {material,geos} of bins.values()){
    // Preserve shared vertices in curved pottery, robes, roof tiles and foliage.
    // Flattening every triangle duplicated both CPU arrays and GPU attributes.
    const size=geos.reduce((sum,g)=>sum+g.attributes.position.count,0);
    const indexCount=geos.reduce((sum,g)=>sum+(g.index?g.index.count:g.attributes.position.count),0);
    const pos=new Float32Array(size*3),norm=isLine?null:new Int16Array(size*3),uv=isLine?null:new Float32Array(size*2),color=material.vertexColors?new Float32Array(size*3):null,index=isLine?null:(size<=65535?new Uint16Array(indexCount):new Uint32Array(indexCount));
    let offset=0,indexOffset=0;
    for(const g of geos){
      const n=g.attributes.position.count;pos.set(g.attributes.position.array,offset*3);
      if(norm&&g.attributes.normal){const source=g.attributes.normal;for(let j=0;j<n;j++){norm[(offset+j)*3]=Math.round(THREE.MathUtils.clamp(source.getX(j),-1,1)*32767);norm[(offset+j)*3+1]=Math.round(THREE.MathUtils.clamp(source.getY(j),-1,1)*32767);norm[(offset+j)*3+2]=Math.round(THREE.MathUtils.clamp(source.getZ(j),-1,1)*32767);}}
      if(uv&&g.attributes.uv)uv.set(g.attributes.uv.array,offset*2);
      if(color){if(g.attributes.color)color.set(g.attributes.color.array,offset*3);else color.fill(1,offset*3,(offset+n)*3);}
      if(index){const count=g.index?g.index.count:n;for(let i=0;i<count;i++)index[indexOffset+i]=offset+(g.index?g.index.getX(i):i);indexOffset+=count;}offset+=n;
    }
    const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));if(norm)out.setAttribute('normal',new THREE.BufferAttribute(norm,3,true));if(uv)out.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(color)out.setAttribute('color',new THREE.BufferAttribute(color,3));if(index)out.setIndex(new THREE.BufferAttribute(index,1));
    out.computeBoundingSphere();
    const batched=isLine?new THREE.LineSegments(out,material):new THREE.Mesh(out,material);if(!isLine){batched.castShadow=!material.transparent;batched.receiveShadow=true;}result.add(batched);
    for(const g of geos)g.dispose();
  }
  let multiDrawGroups=0;const drawChoices=[];
  if(multiDraw&&cellSize){
    const groups=new Map();
    for(const object of result.children){if(!object.isMesh||object.material.transparent||object.material.isShaderMaterial)continue;const key=object.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(object);}
    for(const cells of groups.values()){
      if(cells.length<2)continue;
      const vertexCount=cells.reduce((n,m)=>n+m.geometry.attributes.position.count,0),indexCount=cells.reduce((n,m)=>n+m.geometry.index.count,0);
      const batch=new THREE.BatchedMesh(cells.length,vertexCount,indexCount,cells[0].material);batch.name='culled material cells';batch.perObjectFrustumCulled=true;batch.sortObjects=false;batch.castShadow=cells[0].castShadow;batch.receiveShadow=cells[0].receiveShadow;
      const bounds=[];
      for(const cell of cells){const geometryId=batch.addGeometry(cell.geometry);batch.addInstance(geometryId);bounds.push({sphere:cell.geometry.boundingSphere.clone(),count:cell.geometry.index.count});result.remove(cell);cell.geometry.dispose();}
      batch.computeBoundingSphere();batch.geometry.computeBoundingSphere();
      // Both draw paths reference exactly the same vertex/index buffers. A wide
      // view uses the plain draw; native multi-draw is useful only when enough
      // cells are outside the view to pay for its vertex indirection.
      const whole=new THREE.Mesh(batch.geometry,batch.material);whole.name='whole material fallback';whole.castShadow=batch.castShadow;whole.receiveShadow=batch.receiveShadow;whole.userData.alternativeDraw=true;
      batch.visible=false;result.add(whole,batch);drawChoices.push({batch,whole,bounds,indexCount});multiDrawGroups++;
    }
  }
  root.clear();root.add(result);root.userData.staticBatch={cellSize,meshes:meshBins.size,lines:lineBins.size,multiDrawGroups,activeMultiDrawGroups:0};
  if(drawChoices.length){
    const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4(),sphere=new THREE.Sphere();
    root.updateStaticView=camera=>{
      camera.updateMatrixWorld();root.updateWorldMatrix(true,false);frustum.setFromProjectionMatrix(matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));let active=0;
      for(const choice of drawChoices){
        let visibleCount=0;for(const cell of choice.bounds)if(frustum.intersectsSphere(sphere.copy(cell.sphere).applyMatrix4(root.matrixWorld)))visibleCount+=cell.count;
        const useCells=visibleCount/choice.indexCount<(choice.batch.visible?.62:.45);choice.batch.visible=useCells;choice.whole.visible=!useCells;if(useCells)active++;
      }
      root.userData.staticBatch.activeMultiDrawGroups=active;
    };
  }
  return root;
}
