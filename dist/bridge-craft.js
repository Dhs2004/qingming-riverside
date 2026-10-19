import * as THREE from './assets/three.module.js';
import {C,mat} from './ink.js?v=20261019r6';

/* Close bridge connections, inferred to make the existing timber contacts legible.
 * The painting supports crossing members and projecting ends, not a unique joint
 * design. Run dressBridgeCraft(bridge,bridgeHeight) after dressBridge and BEFORE
 * batchStatic. Four crown nodes receive seats; all 13 original projecting cross
 * ends receive slight bevels. Arch bands, rails, floor, positions and span remain.
 */
export function dressBridgeCraft(bridge,bridgeHeight,options={}){
  if(bridge.userData.bridgeCraftStats)return {root:bridge.getObjectByName('bridge-close-connections'),stats:bridge.userData.bridgeCraftStats};
  const root=new THREE.Group();root.name='bridge-close-connections';
  const near=(a,b)=>Math.abs(a-b)<.002,boxes=bridge.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry');
  const crosses=options.crossMembers??boxes.filter(o=>near(o.geometry.parameters.width,.20)&&near(o.geometry.parameters.depth,.26)&&near(o.geometry.parameters.height,7.1));
  const stringers=options.stringers??boxes.filter(o=>near(o.geometry.parameters.width,.14)&&near(o.geometry.parameters.depth,.20)&&[-2,0,2].some(x=>near(o.position.x,x)));
  const chords=options.chords??boxes.filter(o=>near(o.geometry.parameters.width,.27)&&near(o.geometry.parameters.depth,.31)&&near(Math.abs(o.position.x),3.1));
  const rails=options.handRails??boxes.filter(o=>near(o.geometry.parameters.width,.075)&&near(o.geometry.parameters.depth,.075)&&near(Math.abs(o.position.x),3.1));
  const stats={crossMembers:0,topSeats:0,bearingPads:0,smallKeys:0,endFaces:0,handWear:0,addedVertices:0,replacedVertexDelta:0,outlineVertexDelta:0,newTextures:0,newMaterials:1,nodes:[],minVerticalClearance:Infinity,maxVerticalClearance:-Infinity,maxPadGap:0,minCrossThickness:Infinity};
  if(!crosses.length||!stringers.length||!chords.length)return {root:null,stats,error:'Bridge source members were not found; call before static batching.'};
  const bounds=[];for(const o of [...stringers,...chords]){o.updateMatrix();const p=o.geometry.parameters;bounds.push({o,inverse:o.matrix.clone().invert(),matrix:o.matrix.clone(),box:new THREE.Box3(new THREE.Vector3(-p.width/2,-p.height/2,-p.depth/2),new THREE.Vector3(p.width/2,p.height/2,p.depth/2))});}
  const point=new THREE.Vector3(),ray=new THREE.Ray(),localHit=new THREE.Vector3();
  function surface(objects,x,z,top=false){
    let result=top?-Infinity:Infinity;
    for(const item of bounds){if(!objects.includes(item.o))continue;ray.origin.set(x,top?30:-20,z);ray.direction.set(0,top?-1:1,0);ray.applyMatrix4(item.inverse);if(!ray.intersectBox(item.box,localHit))continue;point.copy(localHit).applyMatrix4(item.matrix);result=top?Math.max(result,point.y):Math.min(result,point.y);}
    return result;
  }
  const bodyOf=o=>Array.isArray(o.material)?o.material[0]:o.material,endOf=o=>Array.isArray(o.material)?o.material[2]:o.material;
  const wearMaterial=mat(C.woodDark,{map:bodyOf(rails[0]??crosses[0]).map,vertexColors:true}),padBody=bodyOf(chords[0]),padEnd=endOf(chords[0]);
  const inkMaterial=crosses.flatMap(o=>o.children).find(o=>o.isLineSegments)?.material;
  const cracks=[];
  function addGeometry(g,materials,name){const mesh=new THREE.Mesh(g,materials);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);stats.addedVertices+=g.attributes.position.count;return mesh;}
  // A closed solid with sloping top/bottom profiles and explicit vertical steps.
  // End rings are inset 8 mm on full-size beams, so their original extents stay
  // fixed while worn edges catch light and expose a distinct end-grain face.
  function profileTimber(xs,zs,top,bottom,capDepth=.015,inset=.008,offset=0,varyX=false){
    const p=[],uv=[],index=[],groups=[],ends=[];let minThickness=Infinity;
    const normal=new THREE.Vector3(),edge=new THREE.Vector3();
    function quad(a,b,c,d,material=0,expect=null){
      normal.fromArray(b).sub(new THREE.Vector3(...a));edge.fromArray(c).sub(new THREE.Vector3(...a));normal.cross(edge);
      if(normal.lengthSq()<1e-16)return;
      const triangle=c.every((v,i)=>v===d[i]);
      if(expect&&normal.dot(new THREE.Vector3(...expect))<0){if(triangle)[b,c]=[c,b];else [b,d]=[d,b];}
      normal.fromArray(b).sub(new THREE.Vector3(...a));edge.fromArray(c).sub(new THREE.Vector3(...a));normal.cross(edge).normalize();
      const start=p.length/3,first=index.length;
      for(const v of (triangle?[a,b,c]:[a,b,c,d])){p.push(...v);if(material===1){const sideSample=v[0]<(xs[0]+xs.at(-1))/2?(varyX?xs[0]:(xs[0]+xs[1])/2):(varyX?xs.at(-1):(xs.at(-1)+xs.at(-2))/2),lo=bottom(sideSample,v[2]),hi=top(sideSample,v[2]);uv.push((v[2]-zs[0])/(zs.at(-1)-zs[0]),(v[1]-lo)/Math.max(.001,hi-lo));}else uv.push((Math.abs(normal.y)>.55?v[2]:v[1])/.42+offset,v[0]/2.8+offset*.43);}
      index.push(start,start+1,start+2);if(!triangle)index.push(start,start+2,start+3);groups.push({start:first,count:index.length-first,materialIndex:material});
    }
    for(let i=0;i<xs.length-1;i++){
      const xa=xs[i],xb=xs[i+1],mid=(xa+xb)/2,left=varyX?xa:mid,right=varyX?xb:mid;
      for(let k=0;k<zs.length-1;k++){
        const za=zs[k],zb=zs[k+1],ta=top(left,za),tb=top(left,zb),ba=bottom(left,za),bb=bottom(left,zb),trA=top(right,za),trB=top(right,zb),brA=bottom(right,za),brB=bottom(right,zb);
        minThickness=Math.min(minThickness,ta-ba,tb-bb,trA-brA,trB-brB);
        if(!(Math.min(ta-ba,tb-bb,trA-brA,trB-brB)>.004))throw new Error('Bridge seat removes the full cross member thickness');
        quad([xa,ta,za],[xa,tb,zb],[xb,trB,zb],[xb,trA,za]);quad([xa,ba,za],[xb,brA,za],[xb,brB,zb],[xa,bb,zb]);
      }
      let z=zs[0];quad([xa,bottom(left,z),z],[xa,top(left,z),z],[xb,top(right,z),z],[xb,bottom(right,z),z]);z=zs.at(-1);quad([xa,bottom(left,z),z],[xb,bottom(right,z),z],[xb,top(right,z),z],[xa,top(left,z),z]);
      if(i<xs.length-2){const next=(xs[i+1]+xs[i+2])/2,x=xb;for(let k=0;k<zs.length-1;k++){
        const za=zs[k],zb=zs[k+1];quad([x,top(next,za),za],[x,top(mid,za),za],[x,top(mid,zb),zb],[x,top(next,zb),zb]);quad([x,bottom(mid,za),za],[x,bottom(next,za),za],[x,bottom(next,zb),zb],[x,bottom(mid,zb),zb]);
      }}
    }
    for(const side of [-1,1]){
      const x=side<0?xs[0]:xs.at(-1),sample=varyX?x:side<0?(xs[0]+xs[1])/2:(xs.at(-1)+xs.at(-2))/2,zc=(zs[0]+zs.at(-1))/2,ring=[];
      for(const z of zs)ring.push([x,top(sample,z),z]);for(const z of [...zs].reverse())ring.push([x,bottom(sample,z),z]);
      const end=ring.map(v=>{const lo=bottom(sample,v[2]),hi=top(sample,v[2]),dy=Math.min(inset,(hi-lo)*.18);return [x+side*capDepth,v[1]+(v[1]>(lo+hi)/2?-dy:dy),zc+(v[2]-zc)*(1-inset/Math.max(.02,(zs.at(-1)-zs[0])/2))];});
      for(let k=0;k<ring.length;k++){const j=(k+1)%ring.length,a=ring[k],b=ring[j],cy=(a[1]+b[1])/2-(top(sample,zc)+bottom(sample,zc))/2,cz=(a[2]+b[2])/2-zc;quad(a,b,end[j],end[k],0,[side*.25,cy,cz]);}
      const midY=(top(sample,zc)+bottom(sample,zc))/2,centre=[x+side*capDepth,midY,zc];
      for(let k=0;k<end.length;k++){const j=(k+1)%end.length;quad(centre,end[k],end[j],end[j],1,[side,0,0]);}
      ends.push({x:x+side*capDepth,y:midY,z:zc,side});
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const ordered=[];for(const material of [0,1]){const start=ordered.length;for(const group of groups)if(group.materialIndex===material)ordered.push(...index.slice(group.start,group.start+group.count));if(ordered.length>start)g.addGroup(start,ordered.length-start,material);}g.setIndex(ordered);g.computeVertexNormals();g.computeBoundingSphere();return {geometry:g,ends,minThickness};
  }
  function interpolate(zs,values,z){for(let k=0;k<zs.length-1;k++)if(z<=zs[k+1]+1e-10){const t=(z-zs[k])/(zs[k+1]-zs[k]);return values[k]*(1-t)+values[k+1]*t;}return values.at(-1);}
  const prepared=[];
  for(let n=0;n<crosses.length;n++){
    const original=crosses[n],z=original.position.z,seated=Math.abs(z)<=3.25,cy=original.position.y,topY=cy+.10,bottomY=cy-.10,zs=Array.from({length:9},(_,i)=>z-.13+i*.26/8),long=[],sideSupports=[];
    for(const x of [-2,0,2]){
      const sources=stringers.filter(o=>near(o.position.x,x)),ys=zs.map(zz=>surface(sources,x,zz));if(!ys.every(Number.isFinite))throw new Error('No longitudinal underside at cross member');long.push({x,ys,sources});
    }
    for(const side of [-1,1]){
      const x=side*3.1,sources=chords.filter(o=>near(o.position.x,x)),ys=zs.map(zz=>surface(sources,x,zz,true));if(!ys.every(Number.isFinite))throw new Error('No inclined bearing surface at cross member');sideSupports.push({x,ys,sources,side});
    }
    const xs=[-3.535,3.535];if(seated){for(const a of long)xs.push(a.x-.073,a.x+.073);for(const a of sideSupports)xs.push(a.x-.146,a.x+.146);}xs.sort((a,b)=>a-b);
    const top=(x,zz)=>{const seat=seated?long.find(a=>Math.abs(a.x-x)<.0731):null;return seat?interpolate(zs,seat.ys,zz)-.0015:topY;};
    const bottom=(x,zz)=>{const seat=seated?sideSupports.find(a=>Math.abs(a.x-x)<.1461):null;return seat?Math.max(bottomY,interpolate(zs,seat.ys,zz)+.018):bottomY;};
    const timber=profileTimber(xs,zs,top,bottom,.015,.008,n*.173);original.updateMatrix();const inverse=original.matrix.clone().invert();timber.geometry.applyMatrix4(inverse);
    prepared.push({original,geometry:timber.geometry});stats.minCrossThickness=Math.min(stats.minCrossThickness,timber.minThickness);stats.crossMembers++;stats.topSeats+=seated?3:0;stats.endFaces+=2;stats.replacedVertexDelta+=timber.geometry.attributes.position.count-original.geometry.attributes.position.count;
    for(const seat of sideSupports){
      if(seated){const padTop=(_,zz)=>Math.max(bottomY,interpolate(zs,seat.ys,zz)+.018),padBottom=(_,zz)=>interpolate(zs,seat.ys,zz)+.0002;
      const pad=profileTimber([seat.x-.132,seat.x+.132],zs,padTop,padBottom,.003,.0017,n*.113);addGeometry(pad.geometry,[padBody,padEnd],'fitted-thin-bearing-pad');stats.bearingPads++;}
      // Low exterior key against the arch cheek, borne on the existing projecting
      // cross timber. Its highest point stays below the original deck underside.
      const side=seat.side,xa=side*3.223,xb=side*3.405,keyXs=[Math.min(xa,xb)+.003,Math.max(xa,xb)-.003],keyZs=[z-.070,z+.070];
      const keyTop=(xx)=>topY+.008+.023*(1-Math.abs(xx)/3.405)/(1-3.223/3.405),keyBottom=()=>topY+.0004;
      const key=profileTimber(keyXs,keyZs,keyTop,keyBottom,.003,.0015,n*.261,true);addGeometry(key.geometry,[padBody,padEnd],'small-exterior-timber-key');stats.smallKeys++;
    }
    for(const end of timber.ends){const xx=end.x+end.side*.0006;cracks.push(xx,end.y-.033,end.z-.006,xx,end.y+.029,end.z+.007,xx,end.y+.008,end.z+.002,xx,end.y+.025,end.z+.033);}
    // Dense checks against original solid faces, not an ideal parabola.
    const node={z,housed:seated,minCrossThickness:timber.minThickness,topSeats:[],bearingPads:[]};
    for(const seat of (seated?long:[])){let min=Infinity,max=-Infinity;for(let k=0;k<=80;k++){const zz=zs[0]+k/80*.26,clearance=surface(seat.sources,seat.x,zz)-top(seat.x,zz);min=Math.min(min,clearance);max=Math.max(max,clearance);}stats.minVerticalClearance=Math.min(stats.minVerticalClearance,min);stats.maxVerticalClearance=Math.max(stats.maxVerticalClearance,max);node.topSeats.push({x:seat.x,minClearance:min,maxClearance:max});}
    for(const seat of (seated?sideSupports:[])){let gap=0;for(let k=0;k<=80;k++){const zz=zs[0]+k/80*.26;gap=Math.max(gap,Math.abs(interpolate(zs,seat.ys,zz)+.0002-surface(seat.sources,seat.x,zz,true)));}stats.maxPadGap=Math.max(stats.maxPadGap,gap);node.bearingPads.push({x:seat.x,maxGap:gap});}
    stats.nodes.push(node);
  }
  // Pale irregular hand contact marks are real tiny surfaces on selected top
  // rail faces. Rail profiles and their already short wooden pegs are retained.
  let wearIndex=0;
  for(const rail of rails){
    if(Math.abs(rail.position.z)>8.8||wearIndex++%4!==0)continue;
    const p=rail.geometry.parameters,length=Math.min(.27,p.height*.62),half=length/2,w=.012+(wearIndex%3)*.003,zz=-p.depth/2-.00065,verts=[-.65*w,-half,zz,w*.40,-half*.82,zz,w,half*.19,zz,w*.42,half,zz,-w*.61,half*.79,zz,-w,0,zz,0,0,zz],ix=[],uv=[],colors=[];
    // Match the actual rail's affine grain UVs exactly; edge colors are the
    // original wood, while only the centre lifts slightly under a hand.
    const rp=rail.geometry.attributes.position,ru=rail.geometry.attributes.uv,offsetU=ru.getX(20)-rp.getX(20)/.42,offsetV=ru.getY(20)-rp.getY(20)/2.8;
    for(let i=0;i<verts.length;i+=3){uv.push(verts[i]/.42+offsetU,verts[i+1]/2.8+offsetV);colors.push(...(i===18?[1.30,1.22,1.12]:[1,1,1]));}
    for(let i=0;i<6;i++)ix.push(6,(i+1)%6,i);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(ix);g.computeVertexNormals();rail.updateMatrix();g.applyMatrix4(rail.matrix);addGeometry(g,wearMaterial,'subtle-hand-polish');stats.handWear++;
  }
  if(cracks.length&&inkMaterial){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(cracks,3));const lines=new THREE.LineSegments(g,inkMaterial);lines.name='small-exposed-end-splits';root.add(lines);stats.addedVertices+=cracks.length/3;}
  // All generation/checks finish before any source member is changed.
  for(const item of prepared){const {original,geometry}=item;for(const child of original.children)if(child.isLineSegments){const refinedEdges=new THREE.EdgesGeometry(geometry,28);stats.outlineVertexDelta+=refinedEdges.attributes.position.count-child.geometry.attributes.position.count;child.geometry=refinedEdges;}original.geometry=geometry;original.material=[bodyOf(original),endOf(original)];original.name='housed-original-cross-member';}
  stats.totalVertexIncrease=stats.addedVertices+stats.replacedVertexDelta+stats.outlineVertexDelta;bridge.add(root);bridge.userData.bridgeCraftStats=stats;return {root,stats};
}
