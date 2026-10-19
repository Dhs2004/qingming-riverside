import * as THREE from './assets/three.module.js';
import {C,ceramic,mesh,softBox,cylinder,beam,group,pathLine} from './ink.js?v=20261019r6';
import {tiedBale} from './cloth-craft.js?v=20261019r6';
import {hempRope} from './boat-craft.js?v=20261019r6';

function wheel(g,x){
  const cy=.590,cz=.05,side=Math.sign(x),R=.582,inner=.513,half=.039;
  // Six wooden felloes form the wheel, with visible butt joints. The outer
  // iron tyre is a thin flat band, not a rubber-like round torus.
  for(let part=0;part<6;part++){
    const vertices=[],uv=[],idx=[],steps=10,a0=part*Math.PI/3+.003,a1=(part+1)*Math.PI/3-.003;
    for(let j=0;j<=steps;j++){
      const a=a0+(a1-a0)*j/steps;
      for(const [xx,rr] of [[-half,inner],[-half,R],[half,R],[half,inner]]){vertices.push(x+xx,cy+Math.sin(a)*rr,cz+Math.cos(a)*rr);uv.push((rr-inner)/.42,(a*R)/2.8);}
      if(j<steps)for(let k=0;k<4;k++){const n=j*4+k,b=j*4+(k+1)%4;idx.push(n,n+4,b,b,n+4,b+4);}
    }
    idx.push(0,1,2,0,2,3,steps*4,steps*4+2,steps*4+1,steps*4,steps*4+3,steps*4+2);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,C.wood,[0,0,0],[0,0,0],false);
  }
  const tyre=mesh(g,new THREE.CylinderGeometry(.588,.588,.086,64,1,true),ceramic('#766d59'),[x,cy,cz],[0,0,Math.PI/2],false);
  for(let j=0;j<12;j++){
    const a=j*Math.PI/6+.08,A=[x+side*.027,cy+Math.sin(a)*.078,cz+Math.cos(a)*.078],B=[x,cy+Math.sin(a)*.53,cz+Math.cos(a)*.53];
    beam(g,A,B,.034,.037,C.woodDark,false);
    const end=[x+side*.040,cy+Math.sin(a)*.528,cz+Math.cos(a)*.528];
    cylinder(g,.008,.008,.008,C.woodLight,...end,8,false).rotation.z=Math.PI/2;
  }
  cylinder(g,.089,.089,.242,C.woodDark,x,cy,cz,18,false).rotation.z=Math.PI/2;
  for(const dx of [-.087,.087])mesh(g,new THREE.TorusGeometry(.09,.006,5,24),ceramic('#71634d'),[x+dx,cy,cz],[0,Math.PI/2,0],false);
  // A linchpin crosses the projecting axle end outside the hub.
  cylinder(g,.034,.040,.04,C.woodLight,x+side*.145,cy,cz,12,false).rotation.z=Math.PI/2;
  beam(g,[x+side*.153,cy-.074,cz-.009],[x+side*.153,cy+.074,cz+.009],.012,.018,C.woodDark,false);
  pathLine(g,[[x+side*.166,cy-.012,cz-.015],[x+side*.166,cy+.013,cz+.016]],true);
}

export function detailedCart(parent,x,y,z,angle=0){
  const g=group(parent,x,y,z,angle);
  for(const xx of [-.48,.48])softBox(g,.09,.10,1.87,C.woodDark,xx,.664,0,.008);
  for(const zz of [-.74,.66])beam(g,[-.60,.661,zz],[.60,.661,zz],.095,.095,C.woodDark,false);
  for(let j=0;j<7;j++)softBox(g,.158,.045,1.84,C.woodLight,(j-3)*.163,.751,0,.005);
  for(const side of [-1,1]){
    for(let row=0;row<3;row++)softBox(g,.049,.177,1.72,C.wood,side*.565,.848+row*.19,0,.005);
    for(const zz of [-.71,.71]){
      softBox(g,.070,.65,.064,C.woodDark,side*.603,1.009,zz,.006);
      for(const yy of [.841,1.032,1.22])cylinder(g,.009,.009,.012,C.woodLight,side*.644,yy,zz,9,false).rotation.z=Math.PI/2;
    }
    beam(g,[side*.45,.642,-.83],[side*.50,.90,-2.90],.071,.082,C.woodDark,false);
    const tie=[];for(let j=0;j<=42;j++){const a=j/42*Math.PI*5;tie.push([side*.454+Math.cos(a)*.047,.672+Math.sin(a)*.043,-.92+j/42*.095]);}hempRope(g,tie,.004,50);
    // The loose harness is hung back over the shaft: both ends are tied,
    // instead of a cut rope standing upright without an attachment.
    hempRope(g,[[side*.50,.90,-2.9],[side*.56,.83,-2.73],[side*.62,.64,-2.49],[side*.56,.70,-2.25],[side*.485,.85,-2.40]],.007,36);
    for(const zz of [-2.88,-2.40]){
      const yy=.642+(-zz-.83)/2.07*.258,loop=[];
      for(let j=0;j<=20;j++){const a=j/20*Math.PI*4;loop.push([side*(.45+(-zz-.83)/2.07*.05)+Math.cos(a)*.044,yy+Math.sin(a)*.047,zz+j/20*.025]);}
      hempRope(g,loop,.0045,24);
    }
  }
  cylinder(g,.060,.063,1.75,C.woodDark,0,.590,.05,14,false).rotation.z=Math.PI/2;
  for(const xx of [-.72,.72])wheel(g,xx);
  for(let i=0;i<3;i++)tiedBale(g,(i%2-.5)*.50,.777+Math.floor(i/2)*.410,i%2*.6-.3,.58,.40,.60);
  g.userData.cartCraft={wheelRadius:.588,axleHeight:.590,woodenRimSegments:6,spokes:12,bedTop:.7735};return g;
}
