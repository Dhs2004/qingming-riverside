import * as THREE from './assets/three.module.js';
import {C,rng,mat,mesh,canvasTexture} from './ink.js?v=20261019r6';

// The street remains mostly quiet packed earth. Broad pigment layers describe
// traffic and dampness; isolated small marks are placed where people work.
export function packedEarthTexture(){
  const r=rng(88314);
  const tx=canvasTexture(2048,2048,(ctx,W,H)=>{
    ctx.fillStyle='#cbbd96';ctx.fillRect(0,0,W,H);
    for(let j=0;j<135;j++){
      const x=r()*W,y=r()*H,rx=35+r()*180,ry=18+r()*85,color=j%3?'126,113,79':'236,221,175',alpha=.012+r()*.045;
      for(const dx of [-W,0,W])for(const dy of [-H,0,H]){
        if(x+dx+rx<0||x+dx-rx>W||y+dy+ry<0||y+dy-ry>H)continue;
        ctx.save();ctx.translate(x+dx,y+dy);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.62,`rgba(${color},${alpha*.43})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
      }
    }
    for(let j=0;j<48000;j++){
      const x=r()*W,y=r()*H,rr=.35+r()*1.1;ctx.fillStyle=j%3?`rgba(88,77,48,${.015+r()*.047})`:`rgba(245,232,191,${.035+r()*.063})`;ctx.fillRect(x,y,rr,.35+r()*.7);
    }
    for(let j=0;j<2900;j++){
      const x=r()*W,y=r()*H,len=1+r()*7;ctx.strokeStyle=`rgba(91,83,57,${.018+r()*.055})`;ctx.lineWidth=.45+r()*.4;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+len*.42,y-.4,x+len,y+r()*1.2);ctx.stroke();
      if(j%9===0){ctx.strokeStyle='rgba(244,231,185,.12)';ctx.beginPath();ctx.moveTo(x,y+1.2);ctx.lineTo(x+len*.7,y+1.0);ctx.stroke();}
    }
  });
  tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(400/12,140/12);tx.anisotropy=8;return tx;
}

function decalMaterial(map,color='#ffffff',opacity=1){return mat(color,{map,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});}
function groundPatch(parent,x,z,w,d,material,angle=0,y=.233){return mesh(parent,new THREE.PlaneGeometry(w,d),material,[x,y,z],[-Math.PI/2,0,angle],false);}
function stainTexture(){
  const r=rng(9307);return canvasTexture(256,256,(ctx,W,H)=>{
    for(let j=0;j<39;j++){
      const a=r()*Math.PI*2,rr=Math.sqrt(r())*70,x=128+Math.cos(a)*rr,y=128+Math.sin(a)*rr*.65,rad=14+r()*47,g=ctx.createRadialGradient(x,y,0,x,y,rad);
      g.addColorStop(0,'rgba(255,255,255,.13)');g.addColorStop(.50,'rgba(255,255,255,.052)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
    }
    ctx.strokeStyle='rgba(255,255,255,.075)';ctx.lineWidth=.8;
    for(let j=0;j<150;j++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*87,x=128+Math.cos(a)*rr,y=128+Math.sin(a)*rr;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3+r()*8,y+r()*2-1);ctx.stroke();}
  });
}
function roadTexture(){
  const r=rng(87216);return canvasTexture(2048,256,(ctx,W,H)=>{
    const wash=ctx.createLinearGradient(0,0,0,H);wash.addColorStop(0,'rgba(215,201,162,0)');wash.addColorStop(.2,'rgba(220,206,167,.11)');wash.addColorStop(.52,'rgba(224,210,171,.18)');wash.addColorStop(.85,'rgba(216,202,163,.075)');wash.addColorStop(1,'rgba(215,201,162,0)');ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
    for(let j=0;j<1800;j++){
      const x=r()*W,y=H*(.25+r()*.5),ww=1+r()*17;ctx.strokeStyle=j%3?'rgba(229,214,172,.09)':'rgba(123,110,72,.035)';ctx.lineWidth=.35+r()*.55;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+ww,y+r()*.9);ctx.stroke();
    }
    for(const base of [H*.35,H*.60])for(let j=0;j<13;j++){
      ctx.strokeStyle=`rgba(121,108,74,${.012+j%3*.006})`;ctx.lineWidth=.7+r()*.6;ctx.beginPath();
      for(let x=0;x<W;x+=3){const y=base+Math.sin(x*.004)*4+(j-6)*.65;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    }
  });
}
function footprintTexture(hoof=false){
  return canvasTexture(96,160,(ctx,W,H)=>{
    ctx.translate(W/2,H/2);ctx.strokeStyle='rgba(255,255,255,.24)';ctx.fillStyle='rgba(255,255,255,.11)';ctx.lineWidth=1.3;
    if(hoof){ctx.beginPath();ctx.ellipse(0,0,23,24,0,.18,Math.PI*1.88);ctx.stroke();ctx.lineWidth=5;ctx.strokeStyle='rgba(255,255,255,.07)';ctx.stroke();}
    else{
      ctx.beginPath();ctx.moveTo(-15,48);ctx.bezierCurveTo(-17,22,-19,-8,-14,-35);ctx.bezierCurveTo(-8,-57,13,-56,17,-32);ctx.bezierCurveTo(23,-6,14,20,15,49);ctx.quadraticCurveTo(1,57,-15,48);ctx.fill();ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.14)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,38);ctx.quadraticCurveTo(0,45,12,37);ctx.stroke();
    }
  });
}
function stone(parent,x,z,w,d,angle,color,r){
  const vertices=[],ids=[],n=5+Math.floor(r()*3),height=.012+r()*.018;
  vertices.push(0,height,0);
  for(let j=0;j<n;j++){const a=j/n*Math.PI*2,rr=.75+r()*.23;vertices.push(Math.cos(a)*w*.5*rr,height*(.35+r()*.30),Math.sin(a)*d*.5*rr);}
  for(let j=0;j<n;j++)ids.push(0,j+1,(j+1)%n+1);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(ids);geo.computeVertexNormals();mesh(parent,geo,color,[x,.226,z],[0,angle,0],false);
}
function bankWash(parent){
  const r=rng(102713),map=canvasTexture(512,256,(ctx,W,H)=>{
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(91,112,81,0)');g.addColorStop(.23,'rgba(99,110,75,.085)');g.addColorStop(.58,'rgba(93,102,67,.26)');g.addColorStop(.87,'rgba(80,89,64,.40)');g.addColorStop(1,'rgba(85,99,71,.32)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    for(let j=0;j<520;j++){const x=r()*W,y=40+r()*216;ctx.strokeStyle=j%3?'rgba(151,153,104,.12)':'rgba(64,78,51,.13)';ctx.lineWidth=.6+r();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2+r()*10,y+.5+r()*2);ctx.stroke();}
  });map.wrapS=THREE.RepeatWrapping;
  const material=decalMaterial(map),vertices=[],uv=[],idx=[];
  for(const side of [-1,1]){
    const base=vertices.length/3;
    for(let j=0;j<=320;j++){
      const x=-80+j*.5,edge=9.05+Math.sin(x*.39)*.28+Math.sin(x*1.7)*.13;
      vertices.push(x,.230,side*10.65,x,.230,side*10.35,x,-.523,side*(edge+.011));uv.push(x/3,1,x/3,.76,x/3,0);
      if(j<320){const k=base+j*3;idx.push(k,k+3,k+1,k+1,k+3,k+4,k+1,k+4,k+2,k+2,k+4,k+5);}
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(parent,geo,material,[0,0,0],[0,0,0],false);
}

export function dressEarth(parent,shops,stalls){
  const r=rng(10584),stain=stainTexture(),worn=decalMaterial(stain,'#ab9b73',.55),damp=decalMaterial(stain,'#847f5e',.55),pale=decalMaterial(stain,'#e1cea1',.39),road=decalMaterial(roadTexture());
  // Broad, slightly bending trade routes, without modern continuous paving.
  for(const z of [21.65,-18.55]){
    const vertices=[],uv=[],idx=[];
    for(let j=0;j<=96;j++){
      const x=-42+j*.91,bend=Math.sin(x*.055)*.24,base=vertices.length/3;
      vertices.push(x,.231,z+bend-2.1,x,.231,z+bend+2.1);uv.push(j/96,0,j/96,1);if(j<96)idx.push(base,base+2,base+1,base+1,base+2,base+3);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(parent,geo,road,[0,0,0],[0,0,0],false);
  }
  const shades=['#c4b996','#b8b091','#d0c6a5','#aca68b'];
  for(const s of shops){
    if(Math.abs(s.x)>38||Math.abs(s.z)>35)continue;
    const c=Math.cos(s.rotation),sn=Math.sin(s.rotation),place=(x,z)=>[s.x+x*c+z*sn,s.z-x*sn+z*c],front=s.d/2;
    let [x,z]=place(0,front+.67);groundPatch(parent,x,z,s.w*.88,1.42,worn,-s.rotation);
    for(let j=0;j<9;j++){
      const xx=(r()-.5)*s.w,zz=front+.17+r()*.55;[x,z]=place(xx,zz);
      if(Math.abs(xx)<.8&&j%3)continue;
      stone(parent,x,z,.13+r()*.26,.10+r()*.12,s.rotation+r()*.5,shades[j%4],r);
    }
    // An irregular three-stone threshold is local to a door, not a stripe
    // of identical pavers running across every market street.
    if(s.type==='tea'||s.type==='inn')for(let j=0;j<3;j++){
      [x,z]=place(-.48+j*.45,front+.22);stone(parent,x,z,.44+r()*.08,.35+r()*.06,s.rotation+(r()-.5)*.10,shades[(j+1)%4],r);
    }
  }
  for(const [x,z] of stalls){
    groundPatch(parent,x,z,2.5,1.9,worn,r()*.4);
    groundPatch(parent,x+.48,z-.48,.65,.42,damp,r());
    for(let j=0;j<13;j++){
      const a=r()*Math.PI*2,rr=.7+r()*.6;stone(parent,x+Math.cos(a)*rr,z+Math.sin(a)*rr,.016+r()*.028,.012+r()*.021,r()*6,shades[j%4],r);
    }
  }
  for(const [x,z,w,d] of [[-22,12.5,5,3],[-19,14.4,3,4],[-12,11.1,2.3,1.2],[10.3,10.9,2.5,1.3],[17,22,2.4,1.2]])groundPatch(parent,x,z,w,d,damp,r()*.7);
  for(const [x,z] of [[-7,21],[4,21.5],[14,-18.7],[-18,-18.6]])groundPatch(parent,x,z,3,1.4,pale,r());
  const steps=decalMaterial(footprintTexture(),'#8d805c',.50),hooves=decalMaterial(footprintTexture(true),'#8d805c',.54);
  for(const [x,z,angle,n] of [[-9,21.7,Math.PI/2,13],[7,21.5,Math.PI/2,11],[-18,-18.4,Math.PI/2,12],[-19.8,14.7,.3,7]])for(let j=0;j<n;j++){
    if(r()<.25)continue;const step=j*.50,side=j%2?.095:-.095;
    groundPatch(parent,x+Math.sin(angle)*step+Math.cos(angle)*side,z+Math.cos(angle)*step-Math.sin(angle)*side,.16,.27,steps,angle+(r()-.5)*.11,.234);
  }
  for(const [x,z,angle] of [[-23.2,16.8,.5],[24.7,19.6,-.3],[6.2,-17.7,.8]])for(let j=0;j<8;j++){
    const step=j*.25,side=j%2?.16:-.16;groundPatch(parent,x+Math.sin(angle)*step+Math.cos(angle)*side,z+Math.cos(angle)*step-Math.sin(angle)*side,.09,.10,hooves,angle,.235);
  }
  bankWash(parent);
  return {doorways:shops.filter(s=>Math.abs(s.x)<=38&&Math.abs(s.z)<=35).length,stalls:stalls.length};
}
