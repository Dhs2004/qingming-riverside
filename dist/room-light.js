import * as THREE from './assets/three.module.js';
import {canvasTexture,mesh} from './ink.js?v=20261019r6';

let windowMaterial;
function latticeLight(){
  if(windowMaterial)return windowMaterial;
  const map=canvasTexture(512,256,(ctx,W,H)=>{
    const cols=8,rows=5;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const x=col/cols*W+4,y=row/rows*H+3,w=W/cols-8,h=H/rows-6;
      ctx.save();ctx.filter='blur(1.7px)';const wash=ctx.createLinearGradient(x,y,x+w,y+h);
      wash.addColorStop(0,'rgba(255,241,196,.66)');wash.addColorStop(.5,'rgba(255,243,205,.86)');wash.addColorStop(1,'rgba(251,229,175,.62)');ctx.fillStyle=wash;ctx.fillRect(x,y,w,h);ctx.restore();
    }
    // The edge breathes into the timber floor like a light watercolour wash.
    ctx.globalCompositeOperation='destination-in';
    const edge=ctx.createLinearGradient(0,0,0,H);edge.addColorStop(0,'#ffffff00');edge.addColorStop(.045,'#ffffffff');edge.addColorStop(.94,'#ffffffff');edge.addColorStop(1,'#ffffff00');ctx.fillStyle=edge;ctx.fillRect(0,0,W,H);
  });
  return windowMaterial=new THREE.MeshBasicMaterial({map,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
}

// Project the real side-window opening along the scene's sunlight direction.
// Its narrow lattice pattern is below the resolution of the district shadow
// map, so this local painted wash restores that detail without another light.
export function paintWindowLight(g,w,d){
  const c=Math.cos(g.rotation.y),s=Math.sin(g.rotation.y),dx=32*c+25*s,dz=32*s-25*c,dy=-55;
  const side=-Math.sign(dx),x=side*(w/2-.055),floor=.324,bw=d*.40;
  const vertices=[],uv=[];
  for(const [z,y,u,v] of [[-bw/2-.055,1.385,0,0],[bw/2-.145,1.385,1,0],[-bw/2-.055,2.095,0,1],[bw/2-.145,2.095,1,1]]){
    const t=(floor-y)/dy;vertices.push(x+dx*t,floor,z+dz*t);uv.push(u,v);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();
  const patch=mesh(g,geo,latticeLight(),[0,0,0],[0,0,0],false);patch.castShadow=false;patch.receiveShadow=false;return patch;
}
