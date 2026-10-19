import * as THREE from './assets/three.module.js';
import {C,rng,mat,fabric,ceramic,wicker,mesh,box,cylinder,beam,group,lines,pathLine,canvasTexture} from './ink.js?v=20261019r6';
import {hempRope} from './boat-craft.js?v=20261019r6';
import {openSteamer,sesameCake} from './snack-craft.js?v=20261019r6';
import {paperLantern} from './lantern-craft.js?v=20261019r6';
const r=rng(76203),pick=a=>a[Math.floor(r()*a.length)];
const ivory='#e4d9b5',celadon='#95b7a2',ochre='#b78355',iron='#765a41';
const glazes=new Map();
function glaze(kind=0){
  if(glazes.has(kind))return glazes.get(kind);
  const tx=canvasTexture(256,256,(ctx,W,H)=>{
    ctx.fillStyle=[ivory,celadon,'#8ba8a2'][kind%3];ctx.fillRect(0,0,W,H);
    for(let i=0;i<1200;i++){ctx.fillStyle=`rgba(53,76,57,${r()*.06})`;ctx.fillRect(r()*W,r()*H,1+r()*2,.7+r()*2);}
    for(const yy of [22,28,224,230]){ctx.strokeStyle=kind===0?'#776b4e80':'#e2e9c57a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(W,yy);ctx.stroke();}
    for(let x=-40;x<W+40;x+=64){
      ctx.strokeStyle=kind===0?'#69583e9c':'#476e5977';ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(x,184);ctx.bezierCurveTo(x+33,134,x-8,96,x+23,59);ctx.stroke();
      for(let j=0;j<6;j++){const yy=80+j*15,xx=x+14+Math.sin(j)*5;ctx.beginPath();ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+(j%2?22:-20),yy-18,xx+(j%2?27:-26),yy-5);ctx.quadraticCurveTo(xx+(j%2?14:-15),yy+4,xx,yy);ctx.stroke();}
    }
  });
  const m=mat('#ffffff',{map:tx});glazes.set(kind,m);return m;
}
function vessel(g,x,y,z,rad=.18,h=.36,kind=0){
  const pts=[[0,0],[rad*.60,0],[rad*.85,h*.06],[rad,h*.38],[rad*.90,h*.62],[rad*.47,h*.77],[rad*.43,h*.94],[rad*.54,h],[rad*.47,h+.006],[rad*.37,h*.94]];
  mesh(g,new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),20),glaze(kind),[x,y,z],[0,0,0],false);
  mesh(g,new THREE.TorusGeometry(rad*.51,.009,5,24),ceramic(kind===0?iron:celadon),[x,y+h,z],[Math.PI/2,0,0],false);
  cylinder(g,rad*.36,rad*.36,.005,iron,x,y+h*.90,z,20,false);
}
function dish(g,x,y,z,rad=.18,kind=0){
  const pts=[[0,0],[rad*.5,0],[rad*.58,.02],[rad,.10],[rad*.98,.12],[rad*.51,.035],[0,.03]];
  mesh(g,new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),24),glaze(kind),[x,y,z],[0,0,0],false);
}
function coin(g,x,y,z,size=.021){
  const shape=new THREE.Shape();shape.absarc(0,0,size,0,Math.PI*2,false);
  const hole=new THREE.Path();hole.moveTo(-size*.27,-size*.27);hole.lineTo(-size*.27,size*.27);hole.lineTo(size*.27,size*.27);hole.lineTo(size*.27,-size*.27);hole.closePath();shape.holes.push(hole);
  mesh(g,new THREE.ShapeGeometry(shape,10),mat('#a9924d'),[x,y,z],[-Math.PI/2,0,r()*6],false);
}
function brushLeaf(g,x,y,z,len,angle,color){
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.quadraticCurveTo(len*.24,len*.37,0,len);shape.quadraticCurveTo(-len*.22,len*.46,0,0);
  const m=mesh(g,new THREE.ShapeGeometry(shape,4),color,[x,y,z],[-.5+r()*.5,angle,angle*.3],false);return m;
}
function herbPot(g,x,y,z,s=.6){
  vessel(g,x,y,z,.14*s,.27*s,1);
  for(let j=0;j<9;j++){
    const a=j*2.399,hh=(.21+r()*.26)*s,xx=Math.sin(a)*.13*s,zz=Math.cos(a)*.13*s;
    beam(g,[x,y+.24*s,z],[x+xx,y+.25*s+hh,z+zz],.007,.007,'#7b8751',false);
    for(let k=0;k<3;k++)brushLeaf(g,x+xx*k/3,y+.25*s+hh*k/3,z+zz*k/3,.14*s,a+k,'#829a61');
  }
}
function lantern(g,x,y,z){
  const colors=['#d9b279','#e8d7a5'];
  const geo=new THREE.SphereGeometry(.17,18,12);const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){let yy=p.getY(i);p.setY(i,yy*1.4);p.setX(i,p.getX(i)*(1+Math.cos(yy*25)*.035));p.setZ(i,p.getZ(i)*(1+Math.cos(yy*25)*.035));}geo.computeVertexNormals();
  mesh(g,geo,fabric(colors[0]),[x,y,z],[0,0,0],false);
  for(let j=0;j<12;j++){const a=j*Math.PI/6,pts=[];for(let k=1;k<16;k++){let v=-Math.PI/2+k/16*Math.PI,rad=Math.cos(v)*.174;pts.push([x+Math.cos(a)*rad,y+Math.sin(v)*.24,z+Math.sin(a)*rad]);}pathLine(g,pts,true);}
  for(const dy of [-.21,.21])cylinder(g,.07,.07,.04,C.red,x,y+dy,z,12,false);
  beam(g,[x,y+.24,z],[x,y+.58,z],.009,.009,C.woodDark,false);
  for(let k=0;k<4;k++)beam(g,[x+(k-1.5)*.01,y-.23,z],[x+(k-1.5)*.015,y-.34,z],.008,.008,C.red,false);
}
function hangingGarlic(g,x,y,z){
  beam(g,[x,y+.13,z],[x,y-.52,z+.02],.012,.012,C.basket,false);
  for(let j=0;j<8;j++){const a=j*2.399,xx=x+Math.cos(a)*.046,zz=z+Math.sin(a)*.045,yy=y-j*.06;
    const bulb=mesh(g,new THREE.SphereGeometry(.048,10,6),ivory,[xx,yy,zz],[0,0,0],false);bulb.scale.set(1,.8,1);
    for(let k=0;k<3;k++)pathLine(g,[[xx+(k-1)*.022,yy-.025,zz+.034],[xx+(k-1)*.014,yy+.03,zz+.04]],true);
  }
}
function valance(g,w,y,z,type){
  const color=type==='cloth'?C.blueDark:type==='tea'?'#94a694':'#c5b580';
  const n=Math.ceil(w/.65),pane=w/n;
  for(let i=0;i<n;i++){
    const x=-w/2+i*pane,geo=new THREE.PlaneGeometry(pane-.035,.38,4,5),p=geo.attributes.position;
    // Leave the cloth merchant's central plaque readable between the curtains.
    if(type==='cloth'&&Math.abs(x+pane/2)<.78){geo.dispose();continue;}
    for(let k=0;k<p.count;k++){const yy=p.getY(k),xx=p.getX(k);p.setZ(k,Math.sin(xx/pane*6+i)*.018+( .19-yy)*.07);if(yy<-.17)p.setY(k,yy+.045*Math.cos(xx/pane*4));}geo.computeVertexNormals();
    mesh(g,geo,fabric(color),[x+pane/2,y,z],[0,0,0],false);
    pathLine(g,[[x+.07,y-.12,z+.031],[x+pane-.07,y-.12,z+.031]],true);
  }
}
export function dressShop(g,w,d,h,type){
  if(g.userData.far)return;
  const f=d/2;
  // Lower panels, worn sill, iron hinge straps and small timber pegs.
  for(const side of [-1,1]){
    for(let k=0;k<4;k++)box(g,.02,.12,d-.14,C.wood,side*(w/2+.076),.38+k*.15,0,false);
    for(const zz of [-f+.10,f-.10])for(const yy of [.8,1.6,2.25])cylinder(g,.02,.02,.028,iron,side*(w/2+.095),yy,zz,8,false).rotation.z=Math.PI/2;
  }
  for(const xx of [w*.27,w*.46]){
    for(const yy of [.57,1.55]){box(g,.065,.14,.023,iron,xx,yy,f+.045,false);for(const dy of [-.048,.048])mesh(g,new THREE.SphereGeometry(.012,6,4),'#bba477',[xx,yy+dy,f+.06],[0,0,0],false);}
  }
  // Open timber windows have a sill, recessed rebate and fitted thin lattice.
  // The corresponding wall opening is constructed by shop().
  for(const side of [-1,1]){
    const x=side*(w/2+.018),bw=d*.4;
    softWindowFrame(g,x,1.74,-.1,bw);
    for(let k=1;k<8;k++)beam(g,[x,1.38,-bw/2+k*bw/8-.1],[x,2.10,-bw/2+k*bw/8-.1],.021,.022,C.woodLight,false);
    for(let k=1;k<5;k++)box(g,.027,.019,bw-.05,C.woodLight,x+side*.006,1.38+k*.144,-.1,false);
    box(g,.24,.065,bw+.18,C.wood,side*(w/2+.035),1.315,-.1,false);
    for(const zz of [-bw*.36-.1,bw*.36-.1])beam(g,[side*(w/2+.02),1.19,zz],[side*(w/2+.135),1.285,zz],.028,.035,C.woodDark,false);
  }
  if(type==='tea'||type==='inn'){
    const nearPaper=type==='tea'||(Math.abs(g.position.x)<21&&Math.abs(g.position.z)<29);
    for(const xx of [-w*.24,w*.25]){
      if(nearPaper)paperLantern(g,xx,h-.74,f+.15,1,Math.round((g.position.x+100)*31+xx*37));
      else lantern(g,xx,h-.74,f+.15);
    }
    herbPot(g,w*.42,.30,f-.40,.83);
    if(type==='tea'){
      valance(g,w*.88,h-.83,f+2.41,type);
      for(const x of [-1.2,1.2]){
        // Table ceramics and whisk are placed together by dressTeaTable, so
        // independent decoration cannot intersect a newly refined tea set.
        for(let k=0;k<3;k++)coin(g,x+.53+k*.016,.814+k*.002,f+.76);
      }
    }
  }else if(type==='goods'){
    hangingGarlic(g,-w*.36,h-.46,f+.14);hangingGarlic(g,-w*.31,h-.5,f+.14);
    for(let k=0;k<3;k++)vessel(g,-.9+k*.38,1.105,f+.21,.12,.28,k%3);
    herbPot(g,w*.42,.29,f+.1,.85);
  }else if(type==='cloth'){
    valance(g,w*.61,h-.50,f+.15,type);
    // Ink floral end papers and a wooden measuring rule on the counter.
    box(g,1.00,.012,.041,C.basket,-.28,1.059,f+.565,false);
    const ticks=[];for(let k=0;k<25;k++)ticks.push([-.76+k*.04,1.066,f+.548],[-.76+k*.04,1.066,f+(k%5===0?.579:.564)]);lines(g,ticks,true);
  }
}
function softWindowFrame(g,x,y,z,w){
  for(const zz of [z-w/2,z+w/2]){
    box(g,.093,.83,.063,C.wood,x,y,zz,false);
    box(g,.048,.76,.017,C.woodDark,x,y,zz-Math.sign(zz-z)*.04,false);
  }
  for(const yy of [y-.4,y+.4])box(g,.093,.062,w+.07,C.wood,x,yy,z,false);
}
function vegetable(g,x,y,z,kind){
  if(kind===0){
    mesh(g,new THREE.SphereGeometry(.10,10,8),'#e5d8b3',[x,y+.08,z],[0,0,.3],false).scale.set(.65,1.45,.65);
    for(let k=0;k<4;k++)brushLeaf(g,x,y+.17,z,.16+k*.02,k*1.8,'#7b9653');
  }else if(kind===1){
    const ball=mesh(g,new THREE.SphereGeometry(.12,10,8),'#91a76e',[x,y+.10,z],[0,0,0],false);ball.scale.y=.85;
    for(let k=0;k<6;k++){const a=k*Math.PI/3,pts=[];for(let j=0;j<8;j++){const t=j/7*Math.PI;pts.push([x+Math.sin(t)*Math.cos(a)*.118,y+.10-Math.cos(t)*.09,z+Math.sin(t)*Math.sin(a)*.118]);}pathLine(g,pts,true);}
  }else{
    cylinder(g,.018,.025,.10,ivory,x,y+.05,z,7,false);
    mesh(g,new THREE.SphereGeometry(.065,12,8,0,Math.PI*2,0,Math.PI/2),ochre,[x,y+.1,z],[0,0,0],false);
  }
}
function balance(g,x,y,z){
  cylinder(g,.09,.12,.04,iron,x,y+.02,z,12,false);beam(g,[x,y,z],[x,y+.46,z],.02,.02,C.woodDark,false);
  beam(g,[x-.28,y+.43,z],[x+.28,y+.45,z],.018,.018,C.basket,false);
  for(const side of [-1,1]){
    dish(g,x+side*.24,y+.12,z,.10,0);
    for(const dz of [-.07,.07])beam(g,[x+side*.24,y+.43,z],[x+side*.24,y+.21,z+dz],.004,.004,iron,false);
  }
}
export function dressMarket(stat){
  // The existing seven parasol stalls get distinct, close-readable trades.
  const stalls=[[-6.8,17.6,0],[5.8,17,1],[-5.3,-16.4,2],[5.4,-17,3],[.8,28.5,0],[-4.8,26.8,1],[3.8,-23.2,2]];
  for(const [x,z,kind] of stalls){
    const g=group(stat,x,.22,z);
    if(kind===0){
      box(g,.65,.032,.32,C.woodLight,-.3,.81,-.28,false);
      for(let k=0;k<8;k++)vegetable(g,-.63+(k%4)*.16,.825,-.31+Math.floor(k/4)*.15,k%3);
      balance(g,.60,.81,-.20);
    }else if(kind===1){
      for(let k=0;k<3;k++)vessel(g,-.4+k*.37,.82,-.28,.10,.27,k%3);
      dish(g,.50,.82,.24,.18,1);
      for(let k=0;k<5;k++)coin(g,-.69+k*.029,.823+(k%2)*.001,.3);
    }else if(kind===2){
      for(let k=0;k<4;k++)coin(g,.65,.835+k*.004,.27);
      box(g,.3,.025,.18,ivory,.56,.823,-.24,false);
      pathLine(g,[[.4,.84,-.3],[.56,.84,-.32],[.69,.84,-.23]],true);
    }else{
      openSteamer(g,.43,.800,-.06,.24);
      box(g,.48,.028,.29,C.woodLight,-.40,.814,.29,false);
      for(let k=0;k<4;k++)sesameCake(g,-.52+(k%2)*.23,.828,.223+Math.floor(k/2)*.133,.053,1627+k*431);
    }
    // Small linen tuck at each table corner; loose fold and dark hem.
    const q=new THREE.PlaneGeometry(.25,.34,4,5),a=q.attributes.position;
    for(let k=0;k<a.count;k++)a.setZ(k,Math.sin(a.getX(k)*32)*.014);q.computeVertexNormals();
    mesh(g,q,fabric(kind%2?C.cloth:C.blue),[-.73,.68,.462],[0,0,.02],false);
  }
  // Street wear, local thresholds and shore transitions live in earth.js.

}

const parasols=[];
export function parasolMaterial(index=0){
  const style=index%4;if(parasols[style])return parasols[style];
  const base=['#dec99b','#9daa87','#b49376','#e2d7b5'][style],accent=['#997351','#657f76','#755d51','#b4875f'][style];
  const tx=canvasTexture(768,768,(ctx,W,H)=>{
    ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
    const light=ctx.createRadialGradient(W*.36,H*.32,10,W*.5,H*.5,W*.6);light.addColorStop(0,'rgba(255,244,204,.25)');light.addColorStop(.55,'rgba(255,244,204,.035)');light.addColorStop(1,'rgba(53,60,36,.09)');ctx.fillStyle=light;ctx.fillRect(0,0,W,H);
    for(let i=0;i<32000;i++){ctx.fillStyle=r()>.5?'rgba(255,246,205,.075)':'rgba(72,66,41,.035)';ctx.fillRect(r()*W,r()*H,.5+r()*2,1+r()*3);}
    for(let k=0;k<28;k++){
      const a=k/28*Math.PI*2;ctx.strokeStyle='rgba(65,67,46,.12)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(W*.5,H*.5);ctx.lineTo(W*.5+Math.cos(a)*W*.5,H*.5+Math.sin(a)*H*.5);ctx.stroke();
      if(style===3)continue;
      ctx.save();ctx.translate(W*.5+Math.cos(a)*W*.445,H*.5+Math.sin(a)*H*.445);ctx.rotate(a+Math.PI/2);ctx.strokeStyle=accent;ctx.globalAlpha=.37;ctx.lineWidth=1.25;
      ctx.beginPath();ctx.moveTo(-11,0);ctx.quadraticCurveTo(0,-14,11,0);ctx.quadraticCurveTo(0,8,-11,0);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,-6);ctx.stroke();ctx.restore();
    }
    for(const radius of [.405,.416,.478,.485]){ctx.strokeStyle=accent;ctx.globalAlpha=.40;ctx.lineWidth=radius>.46?2:1;ctx.beginPath();ctx.arc(W/2,H/2,W*radius,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
    // A few nearly invisible hand-stitched repairs keep the cloth imperfect.
    ctx.strokeStyle='rgba(74,68,43,.24)';ctx.lineWidth=.8;
    for(let k=0;k<10;k++){ctx.beginPath();ctx.moveTo(W*.69+k*4,H*.28);ctx.lineTo(W*.69+k*4+2,H*.28+5);ctx.stroke();}
  });
  parasols[style]=mat('#ffffff',{map:tx});return parasols[style];
}

function rope(g,points,radius=.012,color='#a88f60'){
  if(color==='#a88f60')return hempRope(g,points,radius);
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  mesh(g,new THREE.TubeGeometry(curve,Math.max(16,points.length*5),radius,5,false),color,[0,0,0],[0,0,0],false);
}
export function dressBoat(g,length,width,canopy,detailed=false){
  const side=width*.34;
  // Hemp coils sit in an irregular spiral, with a loose working end.
  const coils=width>3.5?[[-length*.42,0,.85],[length*.43,-side*.24,.7]]:[[length*.29,-side*.60,1],[-length*.30,side*.64,.7]];
  for(const [cx,cz,scale] of coils){
    const pts=[];for(let j=0;j<100;j++){const a=j/99*Math.PI*7,rr=(.10+j/99*.19)*scale;pts.push([cx+Math.cos(a)*rr,.784+Math.sin(a*.7)*.005,cz+Math.sin(a)*rr]);}rope(g,pts,.011);
    rope(g,[[cx+.2,.787,cz],[cx+.49,.78,cz+.17],[cx+.6,.785,cz+.37],[cx+.50,.786,cz+.55]],.010);
  }
  if(!detailed)for(const [x,z] of [[length*.38,side],[-length*.39,-side]]){
    cylinder(g,.062,.075,.20,C.woodDark,x,.85,z,10,false);
    beam(g,[x-.12,.92,z],[x+.12,.92,z],.048,.048,C.woodLight,false);
    for(let k=0;k<3;k++)mesh(g,new THREE.TorusGeometry(.08,.011,5,18),'#ad9568',[x,.84+k*.025,z],[Math.PI/2,0,0],false);
  }
  // A banded water bucket with its dark interior and bent split-bamboo handle.
  const bx=width>3.5?length*.415:-length*.36,bz=side*.50,br=.18;
  mesh(g,new THREE.CylinderGeometry(br,br*.78,.32,18,1,true),C.woodLight,[bx,.95,bz],[0,0,0],false);
  cylinder(g,br*.85,br*.85,.016,'#485a50',bx,.82,bz,18,false);
  for(const yy of [.83,1.075])mesh(g,new THREE.TorusGeometry(yy>.9?br:br*.80,.01,5,20),iron,[bx,yy,bz],[Math.PI/2,0,0],false);
  const handle=[];for(let j=0;j<=16;j++){const a=j/16*Math.PI;handle.push([bx+Math.cos(a)*br,1.07+Math.sin(a)*.20,bz]);}rope(g,handle,.009,C.basket);
  for(let j=0;j<14;j++){const a=j/14*Math.PI*2;pathLine(g,[[bx+Math.sin(a)*br*.80,.795,bz+Math.cos(a)*br*.80],[bx+Math.sin(a)*br,1.11,bz+Math.cos(a)*br]],true);}
  // Open wicker hamper and folded fishing net at the bow.
  const net=[];
  for(let i=0;i<16;i++)for(let j=0;j<7;j++){
    const xx=length*(width>3.5?-.25:.25)+i*.055,zz=(width>3.5?.7:-side*.8)+j*.09,yy=.795+Math.sin(i*.22)*Math.sin(j*.44)*.04;
    net.push([xx,yy,zz],[xx+.055,yy+.004,zz+.09]);net.push([xx+.055,yy,zz],[xx,yy+.004,zz+.09]);
  }lines(g,net,true);
  if(canopy){
    // A pair of soft repair patches, their bound corners sewn by hand.
    const rad=width*.49,base=.84,half=length*.235;
    for(const [xx,a] of [[-half*.42,.76],[half*.49,2.04]]){
      const w=.38,h=.30,geo=new THREE.PlaneGeometry(w,h,4,4),p=geo.attributes.position;
      for(let i=0;i<p.count;i++){const xx0=p.getX(i),aa=a+p.getY(i)/rad;p.setXYZ(i,xx+xx0,base+Math.sin(aa)*(rad+.014),Math.cos(aa)*(rad+.014));}geo.computeVertexNormals();mesh(g,geo,fabric('#d9c797'),[0,0,0],[0,0,0],false);
      for(let k=0;k<8;k++){const px=xx-w/2+.03+k*.044;for(const side of [-1,1]){const aa=a+side*h/(2*rad);pathLine(g,[[px,base+Math.sin(aa)*(rad+.019),Math.cos(aa)*(rad+.019)],[px+.018,base+Math.sin(aa+.016)*(rad+.019),Math.cos(aa+.016)*(rad+.019)]],true);}}
    }
  }
}
export function dressBridge(g,bridgeHeight){
  // Pegs and end grain joinery are legible from a first-person stop at the rail.
  for(const x of [-3.1,3.1])for(let z=-13.3;z<=13.3;z+=1.25){
    const y=bridgeHeight(z),inside=x-Math.sign(x)*.08;
    for(const yy of [.3,.64,.9]){
      cylinder(g,.013,.013,.010,C.woodLight,inside-Math.sign(x)*.004,y+yy,z,12,false).rotation.z=Math.PI/2;
      pathLine(g,[[inside-Math.sign(x)*.010,y+yy-.006,z-.003],[inside-Math.sign(x)*.010,y+yy+.007,z+.004]],true);
    }
    for(let k=0;k<3;k++){let rr=.032+k*.015;const pts=[];for(let i=0;i<=16;i++){let a=i/16*Math.PI*2;pts.push([x+Math.cos(a)*rr,y+1.071,z+Math.sin(a)*rr]);}pathLine(g,pts,true);}
  }
  // A worn center and fine irregular plank joins, not pristine repeated stripes.
  const marks=[];
  for(let z=-13.6;z<13.6;z+=.31){
    const yy=bridgeHeight(z+.13)+.096;
    for(let k=0;k<4;k++){const x=-2.8+k*1.5;for(const dx of [-.07,.07])marks.push([x+dx,yy,z+.08],[x+dx+.02,yy+.002,z+.095]);}
    if(r()<.5){const x=-2.4+r()*4.8;marks.push([x,yy,z+.10],[x+.18+r()*.4,yy,z+.11]);}
  }lines(g,marks,true);
}
