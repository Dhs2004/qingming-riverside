import * as THREE from './assets/three.module.js';
import {C,mat,wicker,canvasTexture,rng,mesh,lines} from './ink.js?v=20261019r6';

// Small goods, built to survive a close look from above. All geometry is static
// and has ordinary UVs / vertex colors, so ink.js batchStatic can merge it.
const TAU=Math.PI*2;
const materials={};
const textureCache={};
const rgb=color=>new THREE.Color(color);
const clamp=THREE.MathUtils.clamp;

function skinTexture(){
  if(textureCache.skin)return textureCache.skin;
  const t=canvasTexture(512,256,(ctx,W,H)=>{
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);const r=rng(78214);
    for(let j=0;j<54;j++){
      const x=r()*W,y=r()*H,rx=9+r()*25,ry=5+r()*15;
      ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
      const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(92,74,39,${.025+r()*.035})`);g.addColorStop(1,'rgba(92,74,39,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    for(let j=0;j<1800;j++){
      ctx.fillStyle=j%4?`rgba(96,81,43,${.045+r()*.10})`:`rgba(247,234,188,${.20+r()*.19})`;
      ctx.beginPath();ctx.ellipse(r()*W,r()*H,.25+r()*.65,.25+r()*.62,0,0,TAU);ctx.fill();
    }
    for(let j=0;j<45;j++){
      const x=r()*W,y=r()*H;ctx.strokeStyle='rgba(114,83,44,.075)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+1,y+3,x+4+r()*4,y+6+r()*6);ctx.stroke();
    }
  });t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;textureCache.skin=t;return t;
}

function getMaterials(){
  if(materials.wall)return materials;
  // The existing 32 × 32 wicker cells are mapped in metres below. There is no
  // new basket texture or texture copy for each basket, stem, reed or leaf.
  materials.wall=mat('#ffffff',{map:wicker().map,vertexColors:true});
  materials.plain=mat('#ffffff',{vertexColors:true});
  materials.fruit=mat('#ffffff',{map:skinTexture(),vertexColors:true});
  return materials;
}

function colorGeometry(geo,color,variation=.0,seed=1){
  const p=geo.attributes.position,base=rgb(color),out=new Float32Array(p.count*3),r=rng(seed);
  for(let i=0;i<p.count;i++){
    const k=1+(r()-.5)*variation;out[i*3]=base.r*k;out[i*3+1]=base.g*k;out[i*3+2]=base.b*k;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(out,3));return geo;
}

function addMesh(parent,geo,material){return mesh(parent,geo,material,[0,0,0],[0,0,0],false);}

function merge(parts){
  let count=0,indexCount=0;for(const g of parts){count+=g.attributes.position.count;indexCount+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(count*3),normal=new Float32Array(count*3),uv=new Float32Array(count*2),color=new Float32Array(count*3),index=new Uint32Array(indexCount);
  let v=0,k=0;
  for(const g of parts){
    const n=g.attributes.position.count;pos.set(g.attributes.position.array,v*3);
    if(g.attributes.normal)normal.set(g.attributes.normal.array,v*3);
    if(g.attributes.uv)uv.set(g.attributes.uv.array,v*2);
    if(g.attributes.color)color.set(g.attributes.color.array,v*3);else color.fill(1,v*3,(v+n)*3);
    if(g.index)for(let i=0;i<g.index.count;i++)index[k++]=g.index.getX(i)+v;
    else for(let i=0;i<n;i++)index[k++]=v+i;
    v+=n;g.dispose();
  }
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(normal,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));out.setAttribute('color',new THREE.BufferAttribute(color,3));out.setIndex(new THREE.BufferAttribute(index,1));return out;
}

function tube(points,radius,color,segments=24,radial=4,closed=false){
  const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');
  const g=new THREE.TubeGeometry(path,segments,radius,radial,closed);return colorGeometry(g,color);
}

function basketShape(r,h,seed,oval=1){
  const random=rng(seed),phase=random()*TAU,shallow=h/r<.46;
  const rim=Math.min(clamp(r*.035,.0065,.013),h*.105);
  const wall=Math.min(clamp(r*.033,.007,.013),h*.12),bottom=Math.min(wall*.95,h*.12);
  const base=r*(shallow?.88:.765),stretch=clamp(oval,.78,1.22),squash=1/stretch;
  const radius=(a,rad)=>rad*(1+Math.sin(a*3+phase)*.008+Math.sin(a*7-phase*.7)*.004);
  const yRim=a=>Math.sin(a*4+phase)*Math.min(.0015,h*.012)+Math.sin(a*7-phase)*.0005;
  const point=(a,rad,y)=>[Math.cos(a)*radius(a,rad)*stretch,y+yRim(a)*clamp(y/h,0,1)*clamp(rad/r,0,1),Math.sin(a)*radius(a,rad)*squash];
  const profile=[
    [0,0,'bottom'],[base-.006,0,'bottom'],[base,.005,'outer'],
    [base+(r-base)*.20,h*.22,'outer'],[base+(r-base)*.62,h*.66,'outer'],
    [r-rim*.55,h-rim*1.7,'outer'],[r,h-rim,'rim'],
    [r-rim*.30,h-rim*.30,'rim'],[r-rim,h,'rim'],
    [r-rim*1.70,h-rim*.30,'rim'],[r-rim*2,h-rim,'inner'],
    [r-wall-rim*.5,h-rim*1.8,'inner'],
    [base+(r-base)*.62-wall,h*.66,'inner'],[base+(r-base)*.20-wall,Math.max(bottom+.003,h*.22),'inner'],
    [base-wall,bottom+.004,'inner'],[base-wall-.006,bottom,'floor'],[0,bottom,'floor']
  ];
  return {r,h,rim,wall,bottom,base,phase,stretch,squash,point,profile,shallow};
}

function shellGeometry(s,segments){
  const g=new THREE.LatheGeometry(s.profile.map(p=>new THREE.Vector2(p[0],p[1])),segments);
  const p=g.attributes.position,uv=g.attributes.uv,colors=new Float32Array(p.count*3),P=s.profile.length;
  const outer=rgb('#bd9d6a'),inner=rgb('#b29464'),floor=rgb('#ae946c'),edge=rgb('#c6a978');
  for(let i=0;i<=segments;i++){
    const a=i/segments*TAU;
    for(let j=0;j<P;j++){
      const k=i*P+j,[rad,y,zone]=s.profile[j],[x,yy,z]=s.point(a,rad,y);
      p.setXYZ(k,x,yy,z);
      if(zone==='floor'||zone==='bottom')uv.setXY(k,x/.448+.41,z/.448+.21);
      else uv.setXY(k,(i/segments)*TAU*((s.base+s.r)*.5)/.448,y/.384+s.phase*.07);
      const base=zone==='floor'||zone==='bottom'?floor:zone==='inner'?inner:zone==='rim'?edge:outer;
      const wash=1+Math.sin(a*5+s.phase)*.018+Math.sin(a*3+j*.7)*.012;
      colors[k*3]=base.r*wash;colors[k*3+1]=base.g*wash;colors[k*3+2]=base.b*wash;
    }
  }
  // Remove the zero-area half of each central fan before normal calculation.
  const clean=[],A=new THREE.Vector3(),B=new THREE.Vector3(),D=new THREE.Vector3();
  for(let i=0;i<g.index.count;i+=3){
    const a=g.index.getX(i),b=g.index.getX(i+1),c=g.index.getX(i+2);
    A.fromBufferAttribute(p,a);B.fromBufferAttribute(p,b).sub(A);D.fromBufferAttribute(p,c).sub(A);
    if(B.cross(D).lengthSq()>1e-18)clean.push(a,c,b);
  }
  g.setIndex(clean);g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingBox();return g;
}

function rimLashing(s,far=false){
  const turns=clamp(Math.round(TAU*s.r/.015),far?32:44,far?48:100),steps=turns*(far?3:5),points=[];
  const radius=s.rim*1.05,center=s.r-s.rim;
  for(let i=0;i<steps;i++){
    const a=i/steps*TAU,b=a*turns,rad=center+radius*Math.cos(b),y=s.h-s.rim+radius*Math.sin(b);
    points.push(s.point(a,rad,y));
  }
  return {geometry:tube(points,Math.min(.0013,s.rim*.135),'#967747',steps,3,true),turns};
}

function staves(s,far=false){
  const count=far?16:clamp(Math.round(TAU*s.r/.060),20,40),levels=far?5:Math.max(7,Math.round(s.h/.032)),pos=[],uv=[],color=[],indices=[];
  const base=rgb('#c3a674');
  for(let stake=0;stake<count;stake++){
    const a=stake/count*TAU+s.phase*.025,off=pos.length/3,angularWidth=.0026/s.r;
    for(let j=0;j<=levels;j++){
      const t=j/levels,y=s.bottom+t*(s.h-s.rim*2.1-s.bottom),rad=s.base+(s.r-s.base)*Math.pow(t,.80)+.001;
      const crossing=Math.sin(t*s.h/.013*Math.PI+stake*Math.PI)*.0008;
      for(const side of [-1,1]){
        pos.push(...s.point(a+side*angularWidth,rad+crossing,y));uv.push(t*1.4,side<0?0:1);
        const k=.95+.045*Math.sin(stake*1.9+j*.8);color.push(base.r*k,base.g*k,base.b*k);
      }
      if(j<levels){const k=off+j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function handles(s,mode,far){
  const parts=[];
  if(mode===true||mode==='arch'){
    const points=[];for(let i=0;i<=12;i++){
      const a=Math.PI*i/12;points.push([Math.cos(a)*s.r*.90*s.stretch,s.h*.73+Math.sin(a)*s.r*1.30,0]);
    }
    parts.push(tube(points,clamp(s.r*.026,.005,.010),'#ab8b59',far?20:36,far?4:5));
    const wraps=[];
    for(const sign of [-1,1])for(let j=0;j<5;j++){
      const a=sign<0?Math.PI-.027*j:.027*j,x=Math.cos(a)*s.r*.9*s.stretch,y=s.h*.73+Math.sin(a)*s.r*1.3;
      const rad=s.r*.031;for(let k=0;k<9;k++){const t=k/8*TAU;wraps.push([x+Math.cos(t)*rad,y+j*.001,Math.sin(t)*rad]);}
      parts.push(tube(wraps.splice(0),.00125,'#7f6948',9,3));
    }
  }else if(mode==='ears'){
    for(const sign of [-1,1]){
      const points=[];for(let i=0;i<=10;i++){
        const a=i/10*Math.PI;points.push([sign*(s.r*.83+Math.sin(a)*s.r*.24)*s.stretch,s.h*.66+Math.sin(a)*s.r*.15,Math.cos(a)*s.r*.22]);
      }
      parts.push(tube(points,.0048,'#a58a5d',far?12:20,4));
    }
  }
  return parts;
}

function fruitGeometry(kind,r,seed,far){
  const random=rng(seed),phase=random()*TAU,lon=far?10:16,lat=far?7:11,g=new THREE.SphereGeometry(1,lon,lat),p=g.attributes.position,uv=g.attributes.uv,colors=new Float32Array(p.count*3);
  const palettes=kind==='pear'?['#b5bd76','#d2c28b','#9fa764']:kind==='plum'?['#997569','#b08b77','#8c796b']:kind==='turnip'?['#dccfb0','#c5b0a0','#d9d0ae']:['#b7a56c','#bc8061','#c1b578'];
  const base=rgb(palettes[0]),blush=rgb(palettes[1]),shade=rgb(palettes[2]),offset=random(),lean=(random()-.5)*.16;
  let top=-Infinity,bottom=Infinity;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),t=(y+1)*.5;
    let width=1,height=1;
    if(kind==='pear'){width=.83+.19*(1-t)-.30*Math.pow(Math.max(0,y),1.2);height=1.22;}
    else if(kind==='plum'){width=.88;height=1.07;}
    else if(kind==='turnip'){width=1.07;height=.86;}
    else{width=1+.033*Math.cos(a*5+phase)*Math.pow(Math.abs(y),2);height=.91;}
    const asym=1+.023*Math.sin(a*3+phase)+.017*Math.cos(a*5+phase*.6)*(1-y*y),rr=r*width*asym;
    let yy=y*r*height;
    if(kind!=='pear'&&kind!=='plum')yy-=r*.07*Math.exp(-((x*x+z*z)/.06))*(y>0?1:-.50);
    const xx=x*rr+lean*r*t*t,zz=z*rr*(.936+.006*Math.sin(a*3+phase+t*5));
    p.setXYZ(i,xx,yy,zz);top=Math.max(top,yy);bottom=Math.min(bottom,yy);
    const side=Math.max(0,Math.cos(a-phase)*.5+.5),bl=kind==='turnip'?Math.pow(t,4)*.30:Math.pow(side,3)*(.25+.28*t);
    const c=base.clone().lerp(blush,bl).lerp(shade,(1-t)*.16),k=1+.025*Math.sin(a*11+t*17+phase);
    colors[i*3]=c.r*k;colors[i*3+1]=c.g*k;colors[i*3+2]=c.b*k;
    uv.setXY(i,uv.getX(i)+offset,uv.getY(i)*.87+phase*.09);
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingBox();return {geometry:g,top,bottom,lean};
}

function leafGeometry(length,width,seed,color='#7c9164'){
  const random=rng(seed),bend=(random()-.5)*.35,positions=[],uv=[],colors=[],index=[],c=rgb(color);
  const rows=7;
  for(let j=0;j<=rows;j++){
    const t=j/rows,w=width*Math.sin(Math.PI*t)**.8;
    for(let side=-1;side<=1;side++){
      positions.push(side*w*.5+Math.sin(t*Math.PI)*length*bend,length*.12*Math.sin(t*Math.PI)-Math.abs(side)*w*.07,length*t);
      uv.push((side+1)*.5,t);const k=side===0?1.07:side<0?.91:1.02;colors.push(c.r*k,c.g*k,c.b*k);
    }
    if(j<rows){const a=j*3;index.push(a,a+3,a+1,a+1,a+3,a+4,a+1,a+4,a+2,a+2,a+4,a+5);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(index);g.computeVertexNormals();return g;
}

// Add a single irregular fruit. r is its broadest approximate radius; x/y/z
// locate the center, unlike closeBasket's bottom-plane origin.
export function closeFruit(parent,options={}){
  const {x=0,y=0,z=0,r=.055,kind='apple',seed=123,leaf=true,far=!!parent.userData.far}=options;
  const random=rng(seed),g=new THREE.Group();g.position.set(x,y,z);g.rotation.set((random()-.5)*.24,random()*TAU,(random()-.5)*.23);parent.add(g);
  const m=getMaterials(),fruit=fruitGeometry(kind,r,seed,far);addMesh(g,fruit.geometry,m.fruit);
  const parts=[],stemX=fruit.lean*r,stemHeight=r*(kind==='pear'?.42:.29);
  const stemPoints=[[stemX,fruit.top-r*.06,0],[stemX+r*.035,fruit.top+stemHeight*.5,-r*.025],[stemX-r*.045,fruit.top+stemHeight,r*.035]];
  parts.push(tube(stemPoints,Math.max(.0015,r*.040),'#69563b',far?4:7,4));
  const calyx=new THREE.CircleGeometry(r*.10,5);calyx.rotateX(-Math.PI/2);calyx.translate(stemX,fruit.top+.0003,0);parts.push(colorGeometry(calyx,'#8e7c4c'));
  if(leaf&&!far){
    const l=leafGeometry(r*1.18,r*.47,seed+9,kind==='pear'?'#879b67':'#788f5f');l.rotateX(-.10);l.rotateY(random()*TAU);l.rotateZ(-.22);l.translate(stemX,fruit.top+stemHeight*.68,0);parts.push(l);
  }
  addMesh(g,merge(parts),m.plain);g.userData.marketFruit={kind,r,seed,top:fruit.top,bottom:fruit.bottom};return g;
}

export function leafyBunch(parent,options={}){
  const {x=0,y=0,z=0,scale=1,seed=241,far=!!parent.userData.far}=options;
  const random=rng(seed),g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const parts=[];
  for(let i=0;i<(far?4:7);i++){
    const angle=i*2.399+random()*.32,len=(.12+random()*.07)*scale,width=(.045+random()*.022)*scale;
    const leaf=leafGeometry(len,width,seed+i,['#819064','#93a277','#738963'][i%3]);leaf.rotateX(-.63-random()*.40);leaf.rotateY(angle);leaf.translate(Math.cos(angle)*.015*scale,0,Math.sin(angle)*.015*scale);parts.push(leaf);
    parts.push(tube([[0,-.02*scale,0],[Math.cos(angle)*.023*scale,.025*scale,Math.sin(angle)*.023*scale],[Math.cos(angle)*.045*scale,.05*scale,Math.sin(angle)*.045*scale]],.002*scale,'#b4b78a',4,3));
  }
  addMesh(g,merge(parts),getMaterials().plain);return g;
}

function fillBasket(g,s,filled,seed,far){
  const random=rng(seed),kind=typeof filled==='string'?filled:'mixed',fruitR=clamp(s.r*.18,.035,.066),wanted=clamp(Math.round(((s.r-s.wall)/fruitR)**2*.61),9,19),fruits=[];
  // Straw packing supports the visible layer in a tall carrying basket.
  const bedY=Math.max(s.bottom+.003,s.h-fruitR*1.01),bedR=s.r-s.wall-s.rim*.9;
  const bed=new THREE.CircleGeometry(bedR,far?20:36);bed.rotateX(-Math.PI/2);bed.translate(0,bedY,0);colorGeometry(bed,'#ad9a69');addMesh(g,bed,getMaterials().plain);
  const straw=[];for(let i=0;i<(far?14:36);i++){
    const a=random()*TAU,rr=Math.sqrt(random())*bedR*.9,cx=Math.cos(a)*rr,cz=Math.sin(a)*rr,len=(.015+random()*.045);
    straw.push([cx-len*.5,bedY+.001,cz],[cx+len*.5,bedY+.0015,cz+len*.13]);
  }lines(g,straw,true);
  for(let attempt=0;attempt<640&&fruits.length<wanted;attempt++){
    const fr=fruitR*(.87+random()*.25),a=random()*TAU,limit=(s.r-s.wall)*.97-fr,rr=Math.sqrt(random())*Math.max(limit,.01),x=Math.cos(a)*rr*s.stretch,z=Math.sin(a)*rr*s.squash;
    const type=kind==='mixed'?['pear','apple','apple','plum','pear'][fruits.length%5]:kind;
    let yy=bedY+fr*(type==='pear'?1.19:type==='turnip'?.87:type==='plum'?1.06:.91);
    // Pack from the liner upward. Close neighbors support the next fruit at
    // their curved shoulders instead of leaving every piece at one flat level.
    for(const f of fruits){
      const distance=Math.hypot(x-f.x,z-f.z),touch=(f.r+fr)*.93;
      if(distance<touch)yy=Math.max(yy,f.y+Math.sqrt(Math.max(0,touch*touch-distance*distance))*.88);
    }
    if(yy>s.h+fruitR*1.05)continue;
    const f=closeFruit(g,{x,y:yy,z,r:fr,kind:type,seed:seed+fruits.length*67,leaf:fruits.length%3!==1,far});fruits.push({x,y:yy,z,r:fr,object:f});
  }
  if(kind==='turnip'&&!far)leafyBunch(g,{x:0,y:s.h+.026,z:0,scale:s.r*2.0,seed:seed+119});
  return fruits.length;
}

// Compatible replacement for world.js basket(parent,x,y,z,r,h,filled):
// closeBasket(parent,{x,y,z,r,h,filled,seed}). Height includes the bound rim.
export function closeBasket(parent,options={}){
  const {x=0,y=0,z=0,r=.32,h=.4,filled=false,seed=7431,handle=false,rotation=0,far=!!parent.userData.far}=options;
  if(!(r>0&&h>0))throw new RangeError('Basket radius and height must be positive.');
  const random=rng(seed),oval=options.oval??(1+(random()-.5)*.045),s=basketShape(r,h,seed,oval),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotation;g.name='有底柳编筐';parent.add(g);
  const m=getMaterials(),body=addMesh(g,shellGeometry(s,far?24:40),m.wall);
  const lashing=rimLashing(s,far),parts=[lashing.geometry,staves(s,far),...handles(s,handle,far)];
  addMesh(g,merge(parts),m.plain);
  const fruitCount=filled?fillBasket(g,s,filled,seed+143,far):0;
  let vertices=0,triangles=0,lineVertices=0;g.traverse(o=>{if(o.isMesh){vertices+=o.geometry.attributes.position.count;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}else if(o.isLineSegments)lineVertices+=o.geometry.attributes.position.count;});
  g.userData.marketBasket={r,h,seed,wallThickness:s.wall,bottomThickness:s.bottom,rimRadius:s.rim,handle,fruitCount,vertices,triangles,lineVertices,rimTurns:lashing.turns,shallow:s.shallow};
  body.name='闭合筐壁与厚底';return g;
}

export function marketGoodsResources(){
  return {additionalTextures:textureCache.skin?1:0,additionalTexturePixels:textureCache.skin?512*256:0,materials:Object.keys(materials).length,usesExistingWicker:true};
}
