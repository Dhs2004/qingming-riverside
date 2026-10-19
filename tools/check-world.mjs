import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
// Navigation/geometry checks do not need a browser or rasterizer. Real drawing
// and interaction are inspected separately in the browser.
const noop=()=>{};
const context=new Proxy({}, {get:(target,key)=>target[key]??((key==='createRadialGradient'||key==='createLinearGradient')?()=>({addColorStop:noop}):noop),set:(target,key,value)=>(target[key]=value,true)});
globalThis.document={createElement:()=>({width:1,height:1,getContext:()=>context})};
globalThis.Path2D=class{constructor(path){this.path=path;}};
const THREE=await import('../dist/assets/three.module.js');
THREE.TextureLoader.prototype.load=function(){return new THREE.Texture();};
const {createWorld,bridgeHeight,bridgeDeckHeight,groundHeight,PLACES}=await import('../dist/world.js');
const multiDraw=process.argv.includes("--multi-draw");
const scene=new THREE.Scene();const world=createWorld(scene,{batchCell:multiDraw?28:0,multiDraw});
assert(!world.bridgeCraft.error,world.bridgeCraft.error);
assert.equal(world.bridgeCraft.stats.topSeats,12,'four crown nodes have three fitted seats each');
assert(world.bridgeCraft.stats.minCrossThickness>.07,'refined crown timbers retain their conservative thickness');
assert.equal(world.steamSources.length,11,'steam follows eight bowls, two kettles and one steamer');
assert.equal(groundHeight(13.5,28),.54,'tea interior walking height matches the actual floor');
// A framed dark rectangle is not enough: both foreground boats have an actual
// cut in the deck, and the cargo doorway must reveal its recessed interior.
scene.updateMatrixWorld(true);let openBoatHatches=0;
let maxDeckHeightError=0;
for(let i=0;i<90;i+=5){
  const z=-13.8+(i+.5)*27.6/90,ray=new THREE.Raycaster(new THREE.Vector3(0,8,z),new THREE.Vector3(0,-1,0)),hit=ray.intersectObject(world.stat,true).find(h=>h.object.isMesh);
  assert(hit,'bridge plank has a solid top');const error=Math.abs(hit.point.y-bridgeDeckHeight(z));maxDeckHeightError=Math.max(error,maxDeckHeightError);assert(error<.00002,'feet follow the actual sloped plank surface');
}
for(const boat of world.dynamic.children){
  const hatch=boat.userData.hatch;if(!hatch)continue;
  const from=boat.localToWorld(new THREE.Vector3(hatch.x,4,hatch.z)),direction=new THREE.Vector3(0,-1,0).transformDirection(boat.matrixWorld),ray=new THREE.Raycaster(from,direction);
  const hit=ray.intersectObject(boat,true).find(h=>h.object.isMesh);assert(hit,'hatch has an interior floor');
  const local=boat.worldToLocal(hit.point.clone());assert(local.y<.60,`hatch centre must be below deck, without a hidden covering plane (${boat.position.x}, local height ${local.y})`);openBoatHatches++;
  if(boat.userData.cargo){const eye=boat.localToWorld(new THREE.Vector3(-.4,1.34,0)),toward=new THREE.Vector3(1,0,0).transformDirection(boat.matrixWorld);ray.set(eye,toward);const entrance=ray.intersectObject(boat,true).find(h=>h.object.isMesh);assert(entrance&&boat.worldToLocal(entrance.point.clone()).x>1.5,'cargo entrance must be open to its inner back wall');}
}
assert.equal(openBoatHatches,2,'both foreground boats have open hatches');
const main=readFileSync(new URL('../dist/main.js',import.meta.url),'utf8');
const route=JSON.parse(main.match(/const tourPath=(\[.*?\]);/)[1].replace(/(^|[\[,])(-?)\./g,'$1$20.'));
const blocked=[];
for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15);
  for(let j=0;j<=n;j++){const t=j/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if(!world.canWalk(x,z)){blocked.push({segment:i-1,x:+x.toFixed(2),z:+z.toFixed(2),obstacles:world.colliders.filter(c=>Math.abs(x-c.x)<c.w/2+.25&&Math.abs(z-c.z)<c.d/2+.25)});break;}}
}
const blockedPeople=[];
for(const p of world.people.people){
  if(!p.route)continue;const points=p.crowdPath?.points||p.route;
  for(let segment=1;segment<points.length;segment++){
    const a=points[segment-1],b=points[segment],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.10));
    for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;if(!world.canWalk(x,z,.16)){blockedPeople.push({kind:p.kind,x,z});break;}}
  }
}
const step=.35,bounds=world.bounds,width=Math.ceil((bounds.maxX-bounds.minX)/step)+1,height=Math.ceil((bounds.maxZ-bounds.minZ)/step)+1;
const grid=(x,z)=>[Math.round((x-bounds.minX)/step),Math.round((z-bounds.minZ)/step)];
const toWorld=(a,b)=>[bounds.minX+a*step,bounds.minZ+b*step];
const seen=new Set(),queue=[grid(PLACES.south.x,PLACES.south.z)];let cursor=0;
while(cursor<queue.length){const [a,b]=queue[cursor++],key=b*width+a;if(seen.has(key))continue;seen.add(key);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const aa=a+dx,bb=b+dz,kk=bb*width+aa;if(aa<0||bb<0||aa>=width||bb>=height||seen.has(kk))continue;const [x,z]=toWorld(aa,bb);if(world.canWalk(x,z,.2)){queue.push([aa,bb]);}}}
const destinations=[...Object.entries(PLACES),['inside south tea',{x:13.5,z:28}],['inside north tea',{x:17.6,z:-24}]];
const unreachable=destinations.filter(([name,p])=>{const [a,b]=grid(p.x,p.z);return !seen.has(b*width+a);}).map(([name])=>name);
assert.deepEqual(unreachable,[],'all four landmarks and both tea interiors must be reachable from the entrance');
const invalidSpawns=Object.entries(PLACES).filter(([k,p])=>!world.canWalk(p.x,p.z));
let vertices=0,triangles=0,invalidGeometry=[],invalidIndices=[];scene.traverse(o=>{if(!o.geometry||o.userData.alternativeDraw)return;const a=o.geometry.attributes.position;vertices+=a.count;if(o.isMesh)triangles+=(o.geometry.index?o.geometry.index.count:a.count)/3;if(o.geometry.index)for(const i of o.geometry.index.array)if(i<0||i>=a.count){invalidIndices.push(o.uuid);break;}for(const v of a.array)if(!Number.isFinite(v)){invalidGeometry.push(o.uuid);break;}});
assert.equal(groundHeight(0,0),bridgeDeckHeight(0));assert.equal(groundHeight(6,21),.22);
assert(!world.canWalk(9,0),'river must be blocked');assert(!world.canWalk(50,22),'bounds must be blocked');
for(let z=-13;z<=13;z+=.25)assert(world.canWalk(0,z),'central bridge lane must be open');
const crowdPeople=world.people.people.filter(p=>p.activity),crowdKinds={};
for(const p of world.people.people)crowdKinds[p.kind]=(crowdKinds[p.kind]||0)+1;
assert(world.crowdLife.ensembles.length>=25,'retain distinct counter, bridge and landing groups');
assert(crowdKinds[12]>=3,'low working silhouettes remain present');
for(const p of crowdPeople)assert(world.canWalk(p.g.position.x,p.g.position.z,.16),'new crowd feet must clear static obstacles');
const unresolvedGroundContacts=world.people.people.filter(p=>!p.walk&&!p.working&&Math.abs(p.g.position.y-groundHeight(p.g.position.x,p.g.position.z))<.06&&world.looseObstacles.some(c=>Math.abs(p.g.position.x-c.x)<c.w/2+.16&&Math.abs(p.g.position.z-c.z)<c.d/2+.16)).map(p=>({kind:p.kind,x:p.g.position.x,z:p.g.position.z}));
assert.deepEqual(unresolvedGroundContacts,[],'all standing feet clear ground goods');
if(process.argv.includes('--crowd-audit'))writeFileSync('research/crowd-final-layout.json',JSON.stringify({ensembles:world.crowdLife.ensembles,relocated:world.crowdLife.relocated,people:world.people.people.map(p=>({kind:p.kind,activity:p.activity,x:p.g.position.x,z:p.g.position.z,heading:p.heading,walk:p.walk}))},null,2));
const camera=new THREE.PerspectiveCamera();camera.position.set(-5,1.8,23);world.update(200,camera);
assert.equal(invalidGeometry.length,0,'finite geometry');assert.equal(invalidIndices.length,0,'indexed batching must reference valid vertices');
console.log(JSON.stringify({multiDraw,people:world.people.count+world.tableaux.count,crowdKinds,crowdGroups:world.crowdLife.ensembles.length,animals:world.animals.count,vertices,triangles,garden:world.garden.stats,openBoatHatches,maxDeckHeightError,steamSources:world.steamSources.length,bridgeCrownSeats:world.bridgeCraft.stats.topSeats,invalidSpawns,blocked,blockedPeople,reachable:destinations.length},null,2));
if(blocked.length||invalidSpawns.length||blockedPeople.length)process.exitCode=1;
