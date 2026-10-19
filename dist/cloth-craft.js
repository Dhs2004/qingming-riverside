import * as THREE from './assets/three.module.js';
import {C,rng,mat,mesh,group,cylinder,pathLine,canvasTexture} from './ink.js?v=20261019r6';
import {hempRope} from './boat-craft.js?v=20261019r6';

const linenMaterials=[];
function linen(style){
  if(!linenMaterials.length){
    const r=rng(23184),map=canvasTexture(512,512,(ctx,W,H)=>{
      ctx.fillStyle='#eee5cc';ctx.fillRect(0,0,W,H);
      for(let j=0;j<18;j++){
        const x=r()*W,y=r()*H,rad=25+r()*85,g=ctx.createRadialGradient(x,y,0,x,y,rad);
        g.addColorStop(0,`rgba(113,93,54,${.035+r()*.065})`);g.addColorStop(1,'rgba(113,93,54,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
      }
      for(let j=0;j<W;j+=3){
        ctx.strokeStyle=`rgba(99,80,44,${.055+r()*.055})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(j,0);ctx.bezierCurveTo(j+.8,H*.3,j-.8,H*.7,j,H);ctx.stroke();
        ctx.strokeStyle='rgba(255,251,231,.16)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(j+1,0);ctx.lineTo(j+1,H);ctx.stroke();
      }
      for(let j=0;j<H;j+=3){ctx.strokeStyle=`rgba(105,88,52,${.028+r()*.045})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j+.6);ctx.stroke();}
      for(let j=0;j<2400;j++){ctx.fillStyle=j%3?'rgba(91,79,51,.075)':'rgba(255,247,217,.20)';ctx.fillRect(r()*W,r()*H,.7+r(),.3+r()*.7);}
    });map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
    for(const color of ['#d3c294','#c6b285','#d8c89e','#cbb888'])linenMaterials.push(mat(color,{map,vertexColors:true}));
  }
  return linenMaterials[style%linenMaterials.length];
}

function softenNormals(geo){
  geo.computeVertexNormals();const p=geo.attributes.position,n=geo.attributes.normal,groups=new Map();
  for(let j=0;j<p.count;j++){
    const key=`${p.getX(j).toFixed(5)},${p.getY(j).toFixed(5)},${p.getZ(j).toFixed(5)}`;
    let row=groups.get(key);if(!row){row={sum:new THREE.Vector3(),indices:[]};groups.set(key,row);}row.sum.add(new THREE.Vector3().fromBufferAttribute(n,j));row.indices.push(j);
  }
  for(const {sum,indices} of groups.values()){sum.normalize();for(const j of indices)n.setXYZ(j,sum.x,sum.y,sum.z);}
}

// A cloth-wrapped bale has a soft, loaded belly, a flattened resting face and
// two compressed bands. The very same surface function carries its cords.
export function tiedBale(parent,x,y,z,w,h,d,seed=0){
  const r=rng(seed||Math.abs(Math.round(x*317+y*197+z*113))+2103),phase=r()*6.28,style=Math.floor(r()*4),g=group(parent,x,y+h/2,z,(r()-.5)*.035),rad=Math.min(w,h,d)*.135;
  const p=new THREE.Vector3(),core=new THREE.Vector3();
  function surface(x0,y0,z0,extra=0){
    p.set(x0,y0,z0);core.set(THREE.MathUtils.clamp(p.x,-w/2+rad,w/2-rad),THREE.MathUtils.clamp(p.y,-h/2+rad,h/2-rad),THREE.MathUtils.clamp(p.z,-d/2+rad,d/2-rad));
    p.sub(core).normalize().multiplyScalar(rad).add(core);
    const nx=p.x/(w/2),ny=p.y/(h/2),nz=p.z/(d/2),band=Math.exp(-(((p.x-w*.24)/(w*.049))**2))+Math.exp(-(((p.x+w*.24)/(w*.049))**2)),soft=(1-nx*nx)*(.009+.004*Math.sin(phase+nz*3));
    const lift=Math.max(0,ny)*(.007+soft-band*.020)+Math.sin(nx*9+phase)*Math.sin(nz*7)*.004*Math.max(0,ny);
    p.y+=lift; p.z+=nz*(soft-band*.010)*(1-Math.max(0,-ny)*.72);
    // Narrow tension folds fan from the bound ends into the fabric belly.
    const fold=Math.sin(ny*12+Math.abs(nx)*5+phase)*.0055*Math.abs(nz)**6;
    p.z+=Math.sign(nz)*fold;p.x+=Math.sin(nz*4+phase)*.006*Math.abs(nx)**4;
    if(extra){const outward=p.clone().sub(core).normalize();p.addScaledVector(outward,extra);}
    return p.clone();
  }
  const geo=new THREE.BoxGeometry(w,h,d,20,10,16),pos=geo.attributes.position,norm=geo.attributes.normal,uv=geo.attributes.uv,colors=[];
  for(let j=0;j<pos.count;j++){
    const q=surface(pos.getX(j),pos.getY(j),pos.getZ(j));pos.setXYZ(j,q.x,q.y,q.z);
    const nx=Math.abs(norm.getX(j)),ny=Math.abs(norm.getY(j));uv.setXY(j,(nx>.8?q.z:q.x)/.65,(ny>.8?q.z:q.y)/.65);
    const band=Math.exp(-(((q.x-w*.24)/(w*.044))**2))+Math.exp(-(((q.x+w*.24)/(w*.044))**2)),shade=1-band*.05-(Math.max(0,-q.y/h)*.065);colors.push(shade,shade,shade);
  }
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));softenNormals(geo);mesh(g,geo,linen(style),[0,0,0],[0,0,0],false);
  // Rounded rectangular bindings stay in their dents, including the underside.
  for(const xx of [-w*.24,w*.24]){
    const points=[];for(let j=0;j<=100;j++){
      const a=j/100*Math.PI*2,cy=Math.cos(a),sz=Math.sin(a),scale=1/Math.max(Math.abs(cy),Math.abs(sz));
      points.push(surface(xx,cy*scale*h*.5,sz*scale*d*.5,.011).toArray());
    }hempRope(g,points,.0055,100);
    const top=surface(xx,h/2,0,.011),cx=top.x,cy=top.y,cz=top.z;
    hempRope(g,[[cx,cy,cz-.018],[cx+.025,cy+.014,cz],[cx+.008,cy+.023,cz+.031],[cx-.020,cy+.008,cz+.010],[cx+.006,cy+.009,cz-.010],[cx+.034,cy+.014,cz-.041],[cx+.065,cy+.006,cz-.035]],.0048,32);
  }
  // Folded end flaps are thin cloth layers, with sparse individual stitches.
  for(const side of [-1,1]){
    const flapGeo=new THREE.BufferGeometry(),v=[],t=[],col=[],ids=[],rows=8,cols=12;
    for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
      const yy=h*(.43-j/rows*.53),span=w*(.44-j/rows*.27),xx=(k/cols*2-1)*span,q=surface(xx,yy,side*d/2,.0025+Math.sin(k/cols*Math.PI)*.002);
      v.push(q.x,q.y,q.z);t.push((xx+w/2)/.65,yy/.65);col.push(.98,.98,.98);
      if(j<rows&&k<cols){const a=j*(cols+1)+k;ids.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
    }
    flapGeo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));flapGeo.setAttribute('uv',new THREE.Float32BufferAttribute(t,2));flapGeo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));flapGeo.setIndex(ids);flapGeo.computeVertexNormals();mesh(g,flapGeo,linen(style),[0,0,0],[0,0,0],false);
    const edge=[];for(let j=0;j<=20;j++){const t0=j/20,xx=(t0*2-1)*w*.17,yy=-h*.10+Math.sin(t0*Math.PI)*.002;edge.push(surface(xx,yy,side*d/2,.005).toArray());}hempRope(g,edge,.002,26);
    for(let j=0;j<9;j++){const xx=(j/8-.5)*w*.30,a=surface(xx,-h*.075,side*d/2,.006),b=surface(xx+.009,-h*.10,side*d/2,.006);hempRope(g,[a.toArray(),b.toArray()],.0015,2);}
  }
  g.userData.clothBale={w,h,d};return g;
}

const textileMaterials=[];
// Classify once at construction. localToWorld updates the complete ancestor
// chain, including rotated/scaled shop groups whose matrices are still stale.
// Keep the entire playable square at the original close-view resolution.
function distantTextile(parent,x,y,z){
  const world=parent.localToWorld(new THREE.Vector3(x,y,z));
  return Math.abs(world.x)>36.000001||Math.abs(world.z)>36.000001;
}
function textile(style=0){
  const index=((style%5)+5)%5;
  if(textileMaterials[index])return textileMaterials[index];
  const r=rng(14041+index*57),base=['#e5d8b5','#698b92','#c2b080','#879e80','#b68975'][index];
  const map=canvasTexture(512,512,(ctx,W,H)=>{
    ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
    for(let j=0;j<W;j+=2){ctx.strokeStyle=j%6?'rgba(255,249,223,.055)':'rgba(47,61,52,.065)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(j,0);ctx.lineTo(j+.4,H);ctx.stroke();}
    for(let j=0;j<H;j+=3){ctx.strokeStyle='rgba(49,62,52,.055)';ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(0,j);ctx.lineTo(W,j+.4);ctx.stroke();}
    for(let j=0;j<7000;j++){ctx.fillStyle=j%3?'rgba(255,251,224,.037)':'rgba(60,55,41,.025)';ctx.fillRect(r()*W,r()*H,.6+r(),.4+r());}
    // Restrained woven repeats. These tiny motifs are original decorative
    // reconstruction, kept below the importance of the garment silhouettes.
    if(index===1||index===4){
      for(let row=-1;row<5;row++)for(let col=-1;col<5;col++){
        const x=col*128+(row%2?64:0),y=row*128;ctx.strokeStyle='rgba(238,230,198,.19)';ctx.lineWidth=1.5;
        for(let k=0;k<4;k++){const a=k*Math.PI/2;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-8,-6,-8,-18,0,-21);ctx.bezierCurveTo(8,-18,8,-6,0,0);ctx.stroke();ctx.restore();}
        ctx.strokeStyle='rgba(52,65,56,.075)';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.stroke();
      }
    }else if(index===2){
      for(let x=0;x<W;x+=128){ctx.fillStyle='rgba(255,243,207,.15)';ctx.fillRect(x,0,3,H);ctx.fillStyle='rgba(89,82,56,.10)';ctx.fillRect(x+7,0,1.5,H);}
    }
  });map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=8;
  return textileMaterials[index]=mat('#ffffff',{map,vertexColors:true});
}

// One continuous ribbon, turned back at alternate ends. Even when viewed
// edge-on a folded bolt has gaps and rounded folds rather than solid box sides.
export function foldedCloth(parent,x,y,z,w=.55,d=.65,style=0,height=.06){
  const far=distantTextile(parent,x,y,z),straight=far?5:16,turn=far?4:10;
  const g=group(parent,x,y,z),path=[],layers=4,R=height/(2*(layers-1)),base=.0015;
  let total=0;
  const add=(zz,yy)=>{if(path.length)total+=Math.hypot(zz-path.at(-1)[0],yy-path.at(-1)[1]);path.push([zz,yy,total]);};
  for(let layer=0;layer<layers;layer++){
    const side=layer%2?-1:1,level=base+layer*R*2;
    for(let j=layer?1:0;j<=straight;j++)add(side*(-d/2+d*j/straight),level);
    if(layer<layers-1)for(let j=1;j<=turn;j++){
      const a=-Math.PI/2+j/turn*Math.PI;add(side*(d/2+Math.cos(a)*R),level+R+Math.sin(a)*R);
    }
  }
  const vertices=[],uv=[],color=[],ids=[],across=far?4:16;
  for(let j=0;j<path.length;j++)for(let k=0;k<=across;k++){
    const [zz,yy,length]=path[j],xx=(k/across-.5)*w,warp=Math.sin(k/across*Math.PI)*Math.sin(zz*9+style)*.0025*(yy/height);
    vertices.push(xx,yy+warp,zz);uv.push(xx/.54+style*.071,length/.54);
    const hem=k===0||k===across?.87:k===1||k===across-1?1.03:.975+Math.sin(k*.35+j*.3)*.016;color.push(hem,hem,hem);
    if(j<path.length-1&&k<across){const a=j*(across+1)+k;ids.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(color,3));geo.setIndex(ids);geo.computeVertexNormals();mesh(g,geo,textile(style),[0,0,0],[0,0,0],false);
  // Two tiny hem threads on the uppermost selvage.
  for(const side of [-1,1]){
    const pts=[],samples=far?6:20;for(let j=0;j<=samples;j++){const zz=-d/2+d*j/samples;pts.push([side*(w/2-.008),height+.003+Math.sin(zz*9+style)*.0004,zz]);}pathLine(g,pts,true);
  }
  g.userData.foldedCloth={w,d,height,continuousLayers:layers};return g;
}

export function fabricRoll(parent,x,y,z,length=.45,radius=.095,style=1,rotation=0){
  const far=distantTextile(parent,x,y,z),radial=far?12:36,spiralSamples=far?48:160,tailSamples=far?4:12;
  const g=group(parent,x,y,z,rotation),m=textile(style),geo=new THREE.CylinderGeometry(radius,radius,length,radial,1,true),p=geo.attributes.position,uv=geo.attributes.uv,colors=[];
  for(let j=0;j<p.count;j++){uv.setXY(j,uv.getX(j)*Math.PI*2*radius/.54,uv.getY(j)*length/.54);colors.push(1,1,1);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  mesh(g,geo,m,[0,radius,0],[0,0,Math.PI/2],false);
  cylinder(g,.014,.014,length+.042,C.woodLight,0,radius,0,far?8:12,false).rotation.z=Math.PI/2;
  for(const side of [-1,1]){
    const end=new THREE.RingGeometry(.015,radius,radial,far?1:4);const pp=end.attributes.position,cc=[];
    for(let j=0;j<pp.count;j++)cc.push(.93,.93,.93);end.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));
    mesh(g,end,m,[side*length/2,radius,0],[0,side*Math.PI/2,0],false);
    const spiral=[];for(let j=0;j<=spiralSamples;j++){const t=j/spiralSamples,a=t*Math.PI*(far?8:20),rr=.016+t*(radius-.017);spiral.push([side*(length/2+.001),radius+Math.cos(a)*rr,Math.sin(a)*rr]);}pathLine(g,spiral,true);
  }
  // The loose outer end settles on the table rather than ending in a cap.
  const vv=[],tt=[],cc=[],ix=[];
  for(let j=0;j<=tailSamples;j++)for(let k=0;k<=tailSamples;k++){
    const t=j/tailSamples,xx=(k/tailSamples-.5)*length,zz=radius*.48+t*radius*1.08,yy=.001+(1-t)**3*radius*(1-Math.sqrt(1-.48*.48))+Math.sin(k*.7)*.0005*t;
    vv.push(xx,yy,zz);tt.push(xx/.54,t*radius/.54);cc.push(.98,.98,.98);if(j<tailSamples&&k<tailSamples){const a=j*(tailSamples+1)+k;ix.push(a,a+tailSamples+1,a+1,a+1,a+tailSamples+1,a+tailSamples+2);}
  }
  const tail=new THREE.BufferGeometry();tail.setAttribute('position',new THREE.Float32BufferAttribute(vv,3));tail.setAttribute('uv',new THREE.Float32BufferAttribute(tt,2));tail.setAttribute('color',new THREE.Float32BufferAttribute(cc,3));tail.setIndex(ix);tail.computeVertexNormals();mesh(g,tail,m,[0,0,0],[0,0,0],false);
  return g;
}

export function drapedCloth(parent,x,y,z,w=.54,depth=.27,drop=.45,style=0){
  const far=distantTextile(parent,x,y,z),vertices=[],uv=[],colors=[],ids=[],across=far?6:20,along=far?12:36;
  for(let j=0;j<=along;j++)for(let k=0;k<=across;k++){
    const t=j/along,xx=(k/across-.5)*w,hang=THREE.MathUtils.smoothstep(t,.34,.49),distance=t*(depth+drop);
    let zz,yy;
    if(distance<depth-.012){zz=distance;yy=.0015*Math.sin(k*.75)*Math.sin(distance*9);}
    else if(distance<depth+.012){const a=(distance-depth+.012)/.024*Math.PI/2;zz=depth-.012+Math.sin(a)*.016;yy=-.016*(1-Math.cos(a));}
    else{zz=depth+.004;yy=-(distance-depth)+.008;}
    const ripple=(Math.sin(k/across*Math.PI*5+.3)*.012+Math.sin(k/across*Math.PI*9)*.004)*hang;
    vertices.push(x+xx,y+yy+hang*.003*Math.sin(k*.55),z+zz+ripple);uv.push(xx/.54,distance/.54);
    const hem=k===0||k===across||j>=along-1?.86:k===1||k===across-1||j===along-2?1.04:1;colors.push(hem,hem,hem);
    if(j<along&&k<across){const a=j*(across+1)+k;ids.push(a,a+across+1,a+1,a+1,a+across+1,a+across+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(ids);geo.computeVertexNormals();return mesh(parent,geo,textile(style),[0,0,0],[0,0,0],false);
}
