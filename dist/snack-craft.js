import * as THREE from './assets/three.module.js';
import {mat,canvasTexture,rng,mesh} from './ink.js?v=20261019r6';
import {hempRope} from './boat-craft.js?v=20261019r6';

// Close-view food-stall details. Every public y coordinate is the bottom plane.
// Geometry and materials remain static and can be merged by batchStatic.
const TAU=Math.PI*2,materials={},textures={};
const color=c=>new THREE.Color(c);

function getMaterials(){
  if(materials.bamboo)return materials;
  textures.bamboo=canvasTexture(512,128,(ctx,W,H)=>{
    const r=rng(19725);ctx.fillStyle='#eee4c7';ctx.fillRect(0,0,W,H);
    for(let j=0;j<29;j++){
      const y=r()*H,w=1+r()*10,g=ctx.createLinearGradient(0,y-w,0,y+w);
      g.addColorStop(0,'rgba(114,87,47,0)');g.addColorStop(.5,`rgba(114,87,47,${.015+r()*.055})`);g.addColorStop(1,'rgba(114,87,47,0)');ctx.fillStyle=g;ctx.fillRect(0,y-w,W,w*2);
    }
    for(let j=0;j<185;j++){
      const x=r()*W,y=r()*H;ctx.strokeStyle=j%3?`rgba(91,72,39,${.05+r()*.10})`:`rgba(255,248,216,${.12+r()*.15})`;ctx.lineWidth=.32+r()*.6;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+18,y+.3,x+36,y-.4,x+7+r()*100,y+.5);ctx.stroke();
    }
    for(let j=0;j<170;j++){ctx.fillStyle='rgba(78,67,39,.06)';ctx.fillRect(r()*W,r()*H,.5+r()*2,.5);}
  });
  textures.dough=canvasTexture(256,256,(ctx,W,H)=>{
    const r=rng(65221);ctx.fillStyle='#fffdf3';ctx.fillRect(0,0,W,H);
    for(let j=0;j<65;j++){
      const x=r()*W,y=r()*H,rr=4+r()*21,g=ctx.createRadialGradient(x,y,0,x,y,rr);
      g.addColorStop(0,`rgba(142,109,56,${.012+r()*.035})`);g.addColorStop(1,'rgba(142,109,56,0)');ctx.fillStyle=g;ctx.fillRect(x-rr,y-rr,rr*2,rr*2);
    }
    for(let j=0;j<1250;j++){ctx.fillStyle=j%3?'rgba(121,103,67,.045)':'rgba(255,255,248,.4)';ctx.beginPath();ctx.ellipse(r()*W,r()*H,.25+r()*.45,.2+r()*.5,0,0,TAU);ctx.fill();}
  });
  for(const t of Object.values(textures)){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;}
  materials.bamboo=mat('#ffffff',{map:textures.bamboo,vertexColors:true});
  materials.dough=mat('#ffffff',{map:textures.dough,vertexColors:true});
  return materials;
}

function tint(geo,base,fn){
  const p=geo.attributes.position,c=color(base),a=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const k=fn?fn(p.getX(i),p.getY(i),p.getZ(i),i):1;
    a[i*3]=c.r*k;a[i*3+1]=c.g*k;a[i*3+2]=c.b*k;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;
}

function add(parent,geo,material,name){const m=mesh(parent,geo,material,[0,0,0],[0,0,0],false);m.name=name||'';return m;}

function seamlessNormals(geo){
  geo.computeVertexNormals();const p=geo.attributes.position,n=geo.attributes.normal,shared=new Map(),keys=[];
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e7)).join(',');keys.push(key);
    if(!shared.has(key))shared.set(key,new THREE.Vector3());shared.get(key).add(new THREE.Vector3().fromBufferAttribute(n,i));
  }
  for(const v of shared.values())v.normalize();
  for(let i=0;i<p.count;i++){const v=shared.get(keys[i]);n.setXYZ(i,v.x,v.y,v.z);}return geo;
}

function removeDegenerates(geo){
  const p=geo.attributes.position,idx=geo.index,out=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let k=0;k<idx.count;k+=3){const ia=idx.getX(k),ib=idx.getX(k+1),ic=idx.getX(k+2);a.fromBufferAttribute(p,ia);b.fromBufferAttribute(p,ib).sub(a);c.fromBufferAttribute(p,ic).sub(a);if(b.cross(c).lengthSq()>1e-20)out.push(ia,ib,ic);}
  geo.setIndex(out);return geo;
}

function shell(parent,y,r,seed){
  const profile=[[r,0],[r+.002,.004],[r+.002,.009],[r,.013],[r,.062],[r+.002,.066],[r+.002,.071],[r-.006,.071],[r-.006,.006],[r-.006,0],[r,0]];
  const geo=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),36),p=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){
    const a=uv.getX(i)*TAU,yy=p.getY(i);
    const ripple=1+Math.sin(a*3+seed)*.0016+Math.sin(a*7-seed)*.0006;
    p.setXYZ(i,p.getX(i)*ripple,yy+y,p.getZ(i)*ripple);
    uv.setXY(i,a*r/.54,yy/.09+seed*.123);
  }
  tint(geo,'#b79b69',(x,yy,z)=>{const h=yy-y,a=Math.atan2(x,z);return (h<.012||h>.063?1.025:.965)+Math.sin(a*3+seed)*.025;});seamlessNormals(geo);
  const m=add(parent,geo,getMaterials().bamboo,'thin bamboo tier');m.userData={wallThickness:.006,lower:y,upper:y+.071};
  // A short overlapping end of the bent bamboo hoop, held by two fine ties.
  const start=.44+seed*.27,stop=start+.32,verts=[],uvs=[],indices=[];
  for(let j=0;j<=5;j++)for(const [radius,yy] of [[r+.0008,y+.015],[r+.0025,y+.015],[r+.0025,y+.059],[r+.0008,y+.059]]){
    const a=start+(stop-start)*j/5;verts.push(Math.sin(a)*radius,yy,Math.cos(a)*radius);uvs.push(a*r/.54,(yy-y)/.09+seed*.123);
  }
  for(let j=0;j<5;j++)for(let k=0;k<4;k++){const n=j*4+k,nn=j*4+(k+1)%4;indices.push(n,n+4,nn,nn,n+4,nn+4);}
  indices.push(0,1,3,1,2,3,20,23,21,21,23,22);
  const overlap=new THREE.BufferGeometry();overlap.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));overlap.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));overlap.setIndex(indices);overlap.computeVertexNormals();tint(overlap,'#bea673');add(parent,overlap,getMaterials().bamboo,'hoop overlap');
  for(const a of [start+.055,stop-.055]){
    const wrap=[[r-.008,y+.060],[r+.004,y+.063],[r+.006,y+.056],[r+.006,y+.019],[r+.003,y+.013],[r-.008,y+.016],[r-.009,y+.030],[r-.009,y+.051],[r-.008,y+.060]].map(([rad,yy])=>[Math.sin(a)*rad,yy,Math.cos(a)*rad]);
    const t=hempRope(parent,wrap,.0015,12);t.name='hemp hoop tie';
  }
  // One tiny tucked end beside the binding, without a decorative bow.
  const a=stop-.052;
  hempRope(parent,[[Math.sin(a)*(r+.006),y+.049,Math.cos(a)*(r+.006)],[Math.sin(a+.010)*(r+.009),y+.035,Math.cos(a+.010)*(r+.009)],[Math.sin(a+.018)*(r+.008),y+.022,Math.cos(a+.018)*(r+.008)]],.00115,5).name='tucked hemp end';
  return m;
}

function slat(parent,w,h,d,x,y,z,rotation=0,tone='#c3a879'){
  const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv,p=geo.attributes.position;
  for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/.54+.17,p.getZ(i)/.09+.25);
  tint(geo,tone);geo.rotateY(rotation);geo.translate(x,y+h/2,z);return add(parent,geo,getMaterials().bamboo,'bamboo grate slat');
}

function grate(parent,y,r){
  // Real daylight between 14 mm bamboo strips; no opaque disc below the food.
  for(let i=-8;i<=8;i++){
    const z=i*.025,half=Math.sqrt(Math.max(0,(r-.010)**2-(Math.abs(z)+.007)**2));
    if(half>.018)slat(parent,half*2,.0035,.014,0,y,z,0,i%3?'#c8b184':'#bda171');
  }
  for(const x of [-.125,.125]){const length=Math.sqrt((r-.015)**2-x*x)*2;slat(parent,length,.004,.014,x,y-.004,0,Math.PI/2,'#ae9162');}
}

/** Irregular steamed wheat bun. y is its flat underside; radius is in metres. */
export function steamedBun(parent,x,y,z,r=.057,seed=751){
  const random=rng(seed),phase=random()*TAU,turn=random()*TAU;
  const profile=[[0,0],[.62,0],[.87,.12],[1,.40],[.94,.75],[.76,1.04],[.43,1.25],[.15,1.38],[0,1.32]];
  const geo=removeDegenerates(new THREE.LatheGeometry(profile.map(([rad,h])=>new THREE.Vector2(rad*r,h*r)),40)),p=geo.attributes.position,uv=geo.attributes.uv,colors=new Float32Array(p.count*3),base=color('#eee1b9');
  for(let i=0;i<p.count;i++){
    const a=uv.getX(i)*TAU,yy=p.getY(i)/r,rr=Math.hypot(p.getX(i),p.getZ(i))/r,fold=Math.pow(Math.max(0,Math.cos(a*8+phase)),5),foldWeight=Math.sin(Math.max(0,Math.min(1,(yy-.6)/.8))*Math.PI*.85);
    const shape=1+Math.sin(a*3+phase)*.027+Math.sin(a*5-phase)*.009-fold*.070*foldWeight;
    p.setXYZ(i,p.getX(i)*shape*(1+Math.sin(phase)*.025),p.getY(i)+r*rr*Math.min(1,yy*5)*(Math.sin(a*2+phase)*.017-fold*.025*foldWeight),p.getZ(i)*shape);
    const k=.985+yy*.011-fold*foldWeight*.072;colors[i*3]=base.r*k;colors[i*3+1]=base.g*k;colors[i*3+2]=base.b*k;uv.setXY(i,uv.getX(i)+seed*.071,uv.getY(i));
  }
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));seamlessNormals(geo);geo.rotateY(turn);geo.translate(x,y,z);
  const bun=add(parent,geo,getMaterials().dough,'hand pinched steamed bun');bun.userData={kind:'steamedBun',seed,r,bottom:y};return bun;
}

/** Small hand-formed sesame flatbread, with individually scattered seeds. */
export function sesameCake(parent,x,y,z,r=.058,seed=176){
  const g=new THREE.Group();parent.add(g);g.position.set(x,y,z);g.name='sesame cake';
  const random=rng(seed),phase=random()*TAU,profile=[[0,0],[.74,0],[.93,.065],[1,.18],[.97,.32],[.75,.43],[0,.46]];
  const geo=removeDegenerates(new THREE.LatheGeometry(profile.map(([rr,h])=>new THREE.Vector2(rr*r,h*r)),32)),p=geo.attributes.position,uv=geo.attributes.uv,base=color('#cba16a'),cols=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const a=uv.getX(i)*TAU,rr=Math.hypot(p.getX(i),p.getZ(i)),yy=p.getY(i),q=rr/r,shape=1+Math.sin(a*3+phase)*.020+Math.sin(a*7-phase)*.009;
    p.setXYZ(i,p.getX(i)*shape,yy+q*Math.min(1,yy/r*10)*Math.sin(a*4+phase)*r*.011,p.getZ(i)*shape);
    const k=1+Math.sin(p.getX(i)/r*8+phase)*Math.cos(p.getZ(i)/r*5)*.075-(q>.8?.045:0);cols[i*3]=base.r*k;cols[i*3+1]=base.g*k;cols[i*3+2]=base.b*k;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(cols,3));seamlessNormals(geo);const crust=add(g,geo,getMaterials().dough,'baked cake');
  // Place every sesame grain on the actual irregular crust, including its tilt.
  const probe=new THREE.Raycaster();
  for(let j=0;j<24;j++){
    const a=random()*TAU,rr=Math.sqrt(random())*r*.80,xx=Math.sin(a)*rr,zz=Math.cos(a)*rr;
    probe.set(new THREE.Vector3(xx,r,zz),new THREE.Vector3(0,-1,0));const hit=probe.intersectObject(crust,false)[0],normal=hit.face.normal;
    const seedGeo=new THREE.SphereGeometry(1,5,3);seedGeo.scale(.0008,.00055,.00165);seedGeo.rotateY(random()*TAU);seedGeo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),normal));seedGeo.translate(xx+normal.x*.00034,hit.point.y+normal.y*.00034,zz+normal.z*.00034);tint(seedGeo,j%5?'#e9d7a5':'#b5894f');add(g,seedGeo,getMaterials().dough,'sesame seed');
  }
  g.userData={kind:'sesameCake',seed,r,bottom:y};return g;
}

/** Three open bamboo tiers, full-size r=.24; y is the very lowest bamboo plane. */
export function openSteamer(parent,x,y,z,r=.24){
  const g=new THREE.Group();g.name='open bamboo steamer';g.position.set(x,y,z);g.scale.setScalar(r/.24);parent.add(g);
  for(let j=0;j<3;j++){shell(g,j*.070,.24,3+j);grate(g,j*.070+.053,.24);}
  steamedBun(g,0,.1965,0,.063,735);
  for(let j=0;j<6;j++){
    const a=j*TAU/6+.17,rr=.132+(j%2)*.003;steamedBun(g,Math.sin(a)*rr,.1965,Math.cos(a)*rr,.055+(j%3)*.0016,167+j*317);
  }
  g.userData.snackCraft={type:'openSteamer',bottom:y,radius:r,height:.2836*(r/.24),tiers:3,buns:7,wallThickness:.006*(r/.24),grateSlatWidth:.014*(r/.24),grateGap:.011*(r/.24)};
  g.userData.steamSources=[{position:[0,.213,0],kind:'steamer'}];
  return g;
}

export function snackCraftResources(){
  getMaterials();return {newTextures:Object.values(textures).map(t=>({width:t.image.width,height:t.image.height,bytesRGBA:t.image.width*t.image.height*4})),newBytesRGBA:Object.values(textures).reduce((n,t)=>n+t.image.width*t.image.height*4,0),sharedExisting:'boat-craft hemp 512 × 128, reused',materialCount:2};
}
