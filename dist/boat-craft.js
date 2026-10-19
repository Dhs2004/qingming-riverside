import * as THREE from './assets/three.module.js';
import {C,rng,mat,ceramic,reedMat,mesh,box,softBox,cylinder,beam,group,pathLine,canvasTexture} from './ink.js?v=20261019r6';

let hempMaterial;
function hemp(){
  if(hempMaterial)return hempMaterial;
  const r=rng(79810),map=canvasTexture(512,128,(ctx,W,H)=>{
    ctx.fillStyle='#b9a474';ctx.fillRect(0,0,W,H);
    for(let j=-8;j<22;j++){
      const x=j*32;ctx.strokeStyle='rgba(78,62,36,.24)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(x,-8);ctx.lineTo(x+82,H+8);ctx.stroke();
      ctx.strokeStyle='rgba(239,224,177,.37)';ctx.lineWidth=3.5;ctx.beginPath();ctx.moveTo(x+6,-8);ctx.lineTo(x+88,H+8);ctx.stroke();
      for(let k=0;k<3;k++){ctx.strokeStyle='rgba(73,58,34,.12)';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x+11+k*5,-8);ctx.lineTo(x+93+k*5,H+8);ctx.stroke();}
    }
    for(let j=0;j<1200;j++){ctx.fillStyle=j%2?'rgba(248,234,190,.16)':'rgba(67,55,31,.08)';ctx.fillRect(r()*W,r()*H,1+r()*4,.35);}
  });map.wrapS=map.wrapT=THREE.RepeatWrapping;
  hempMaterial=mat('#ffffff',{map});return hempMaterial;
}
export function hempRope(g,points,radius=.011,segments){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),length=curve.getLength(),count=segments??Math.min(180,Math.max(14,Math.ceil(length/.07))),geo=new THREE.TubeGeometry(curve,count,radius,6,false),uv=geo.attributes.uv;
  for(let j=0;j<uv.count;j++)uv.setX(j,uv.getX(j)*length/.17);
  return mesh(g,geo,hemp(),[0,0,0],[0,0,0],false);
}
export function reedBox(g,w,h,d,x,y,z){
  const q=box(g,w,h,d,reedMat(),x,y,z,false),p=q.geometry.attributes.position,n=q.geometry.attributes.normal,uv=q.geometry.attributes.uv;
  for(let j=0;j<p.count;j++)uv.setXY(j,(Math.abs(n.getX(j))>.8?p.getZ(j):p.getX(j))/1.2,p.getY(j)/.64);
  return q;
}
export function tieToPeg(g,x,y,z,heading=0,radius=.055){
  const q=group(g,x,y,z,heading);
  cylinder(q,radius*.73,radius,.24,C.woodDark,0,.08,0,12,false);
  softBox(q,.21,.043,.048,C.wood,0,.18,0,.008);
  const wrap=[];for(let j=0;j<=64;j++){const a=j/64*Math.PI*5;wrap.push([Math.cos(a)*(radius+.009),.044+j/64*.077,Math.sin(a)*(radius+.009)]);}hempRope(q,wrap,.009,88);
  hempRope(q,[[radius,.11,0],[radius+.035,.086,.062],[radius+.06,.042,.071],[radius+.047,.029,.032],[radius+.009,.085,.01],[radius+.028,.145,-.006],[radius+.11,.031,-.065]],.008,32);
}

export function dressBoatInterior(g,{length,width,half,sheer,hatch,detailed,canopy}){
  const vertices=[],uv=[],idx=[];
  for(const side of [-1,1])for(let j=0;j<32;j++){
    const t0=j/32,t1=(j+1)/32,base=vertices.length/3;
    for(const t of [t0,t1])for(const top of [true,false]){
      const x=(t-.5)*length,z=side*(half(t)-.052),y=top?sheer(t)-.013:.747;
      vertices.push(x,y,z);uv.push((y-.75)/.42,x/2.8);
    }idx.push(base,base+1,base+2,base+2,base+1,base+3);
    if(detailed&&j%4===1){const t=(t0+t1)/2,x=(t-.5)*length;
      beam(g,[x,.75,side*(half(t)-.075)],[x,sheer(t)-.03,side*(half(t)-.07)],.041,.038,C.woodDark,false);
    }
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,C.woodLight,[0,0,0],[0,0,0],false);
  if(hatch){
    const {x,z,w,d}=hatch,y=.754;
    box(g,w,.019,d,ceramic('#393e32'),x,.44,z,false);
    for(const side of [-1,1]){
      softBox(g,w+.10,.083,.055,C.wood,x,y+.021,z+side*(d/2+.015),.008);
      softBox(g,.055,.083,d,C.wood,x+side*(w/2+.015),y+.021,z,.007);
      box(g,w,.27,.028,C.woodDark,x,.596,z+side*d/2,false);box(g,.026,.27,d,C.woodDark,x+side*w/2,.596,z,false);
    }
    beam(g,[x-w*.47,.48,z],[x+w*.47,.48,z],.035,.058,C.woodLight,false);
    // The removable lid rests against its coaming, with its back edge
    // physically touching the deck and two short cross-battens underneath.
    const lid=group(g,x,y+.043,z-d/2-.03);lid.rotation.x=.34;
    for(let j=0;j<4;j++)softBox(lid,w/4-.007,.022,d*.76,C.woodLight,-w/2+(j+.5)*w/4,0,-d*.38,.004);
    for(const xx of [-w*.3,w*.3])box(lid,.04,.028,d*.71,C.wood,xx,-.022,-d*.38,false);
    hempRope(lid,[[-.07,.012,-d*.29],[-.045,.055,-d*.26],[.045,.055,-d*.26],[.07,.012,-d*.29]],.006,18);
    for(const xx of [-w*.42,w*.42])for(const zz of [-d*.26,-d*.56])mesh(lid,new THREE.SphereGeometry(.008,6,4),ceramic('#796141'),[xx,.014,zz],[0,0,0],false).scale.y=.42;
  }
  if(!detailed)return;
  // Lines bear on short cleats instead of ending in the middle of a board.
  for(const x of [length*.38,-length*.39])for(const side of [-1,1])tieToPeg(g,x,.79,side*width*.34,.08);
  if(width>3.5)return;
  const sparBase=canopy?.84+width*.49+.13:.92,sparTop=canopy?sparBase+.40:2.10;
  for(const side of [-1,1]){
    hempRope(g,[[length*.37,sparTop,0],[length*.15,1.35,side*width*.56],[-length*.05,1.06,side*width*.56],[-length*.28,.97,side*width*.47],[-length*.39,.875,side*width*.34]],.011,70);
  }
  // Bound collar where the lowered spar bears on the forked timber support.
  const collar=[];for(let j=0;j<=60;j++){const a=j/60*Math.PI*7;collar.push([-length*.20+(j/60-.5)*.13,sparBase+.055+Math.cos(a)*.070,Math.sin(a)*.075]);}hempRope(g,collar,.006,86);
}

export function dressLanding(g){
  // The existing low landing keeps its footprint. Pile heads, transverse
  // bindings and a real mooring line reward the view down from the bank.
  for(let j=0;j<5;j++)for(const z of [9.5,12.3]){
    const x=-17+j*.7;
    const wrap=[];for(let k=0;k<=42;k++){const a=k/42*Math.PI*4;wrap.push([x+Math.cos(a)*.087,.10+k/42*.067,z+Math.sin(a)*.087]);}hempRope(g,wrap,.008,50);
  }
  tieToPeg(g,-16.6,.17,10.38,.2,.06);
  hempRope(g,[[-16.6,.29,10.38],[-16.3,.22,9.64],[-15.82,.27,8.40],[-15.327,.455,7.43]],.016,58);
}
