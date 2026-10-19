import * as THREE from './assets/three.module.js';
import {mat,canvasTexture,rng,mesh} from './ink.js?v=20261019r6';
import {hempRope} from './boat-craft.js?v=20261019r6';

// A modest, unlit reconstruction of a bamboo-and-paper hanging lantern.
// This is a close-view craft interpretation, not an identified painted object.
const TAU=Math.PI*2,PAPER_THICKNESS=.00065,cache={};

function materials(){
  if(cache.paper)return cache;
  cache.map=canvasTexture(256,512,(ctx,W,H)=>{
    const random=rng(89132);ctx.fillStyle='#fffdf4';ctx.fillRect(0,0,W,H);
    // Paper pulp: irregular translucent patches and sparse short fibres.
    // No orthogonal weave, repeated textile motifs, or emissive treatment.
    for(let j=0;j<80;j++){
      const x=random()*W,y=random()*H,rad=6+random()*34,g=ctx.createRadialGradient(x,y,0,x,y,rad);
      g.addColorStop(0,`rgba(135,113,68,${.009+random()*.038})`);g.addColorStop(1,'rgba(135,113,68,0)');ctx.fillStyle=g;ctx.fillRect(x-rad,y-rad,rad*2,rad*2);
    }
    for(let j=0;j<1500;j++){
      const x=random()*W,y=random()*H,a=random()*TAU,len=.9+random()*5.5;
      ctx.strokeStyle=j%4?`rgba(139,118,80,${.025+random()*.075})`:`rgba(255,255,250,${.14+random()*.20})`;ctx.lineWidth=.24+random()*.45;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(a+.15)*len*.5,y+Math.sin(a+.15)*len*.5,x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.stroke();
    }
    for(let j=0;j<800;j++){ctx.fillStyle=j%2?'rgba(104,91,60,.018)':'rgba(255,255,248,.17)';ctx.fillRect(random()*W,random()*H,.3+random(),.3+random());}
  });cache.map.wrapS=cache.map.wrapT=THREE.RepeatWrapping;cache.map.anisotropy=4;
  cache.paper=mat('#ffffff',{map:cache.map,vertexColors:true});
  cache.bamboo=mat('#ffffff',{vertexColors:true});return cache;
}

function colored(geo,tone){
  const c=new THREE.Color(tone),a=new Float32Array(geo.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;
}
function add(parent,geo,material,name){const m=mesh(parent,geo,material,[0,0,0],[0,0,0],false);m.name=name;return m;}

function paperRadius(a,y,phase){
  const t=y/.23,envelope=Math.max(0,1-t*t),rad=.17*Math.sqrt(1-(y/.247)**2);
  // Three millimetres of soft panel belly survives the eave's diffuse light;
  // the radius on each bamboo axis stays unchanged, preserving its contact.
  return rad+envelope*((1-Math.cos(a*12))*.0015+Math.sin(a*12)*(1-Math.cos(a*12))*.00022+Math.sin(a*3+phase)*.0005+Math.sin(a*5-y*21+phase)*.00019);
}

function paperShell(parent,phase){
  const around=48,along=16,row=around+1,skin=(along+1)*row,p=[],uv=[],col=[],idx=[],outer=new THREE.Color('#e6d8b3'),inner=new THREE.Color('#d8cba7');
  for(let side=0;side<2;side++)for(let j=0;j<=along;j++)for(let k=0;k<=around;k++){
    const a=k/around*TAU,y=-.23+j/along*.46,rad=paperRadius(a,y,phase)-side*PAPER_THICKNESS,t=y/.23;
    p.push(Math.sin(a)*rad,y,Math.cos(a)*rad);uv.push(k/around,j/along);
    const rib=Math.pow(Math.max(0,Math.cos(a*12)),12),shade=(side?.985:1)-rib*.140*(.65+.35*(1-t*t))-.013*Math.abs(t)+Math.sin(a*2+phase+y*4)*.009,c=side?inner:outer;
    col.push(c.r*shade,c.g*shade,c.b*shade);
    if(j<along&&k<around){const q=side*skin+j*row+k;if(!side)idx.push(q,q+row,q+1,q+1,q+row,q+row+1);else idx.push(q,q+1,q+row,q+1,q+row+1,q+row);}
  }
  for(let k=0;k<around;k++){
    // Thin annular cut edges join the inner and outer sheets at both openings.
    idx.push(k,k+1,skin+k,k+1,skin+k+1,skin+k);
    const q=along*row+k;idx.push(q,skin+q,q+1,q+1,skin+q,skin+q+1);
  }
  for(let i=0;i<idx.length;i+=3){const b=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=b;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));geo.setIndex(idx);geo.computeVertexNormals();
  // Average only the duplicated angular seam on each skin. Keep cut edges thin.
  const normal=geo.attributes.normal;
  for(let side=0;side<2;side++)for(let j=0;j<=along;j++){
    const first=side*skin+j*row,last=first+around,v=new THREE.Vector3().fromBufferAttribute(normal,first).add(new THREE.Vector3().fromBufferAttribute(normal,last)).normalize();normal.setXYZ(first,v.x,v.y,v.z);normal.setXYZ(last,v.x,v.y,v.z);
  }
  const shell=add(parent,geo,materials().paper,'thin paper shell');shell.userData={paperThickness:PAPER_THICKNESS,bambooAxes:12};return shell;
}

function paperLaps(parent,shell){
  // Three narrow pasted sheet edges, rather than twelve drawn contour lines.
  // Interpolating the real shell vertices seats the laps on its triangles.
  const source=shell.geometry,p=source.attributes.position,c=source.attributes.color,uv=source.attributes.uv;
  for(const axis of [0,16,32]){
    const positions=[],tex=[],colors=[],ids=[];
    for(let row=0;row<=16;row++){
      const i=row*49+axis,a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),span=a.distanceTo(b),width=Math.min(.0018,span*.15),envelope=1-(a.y/.23)**2;
      for(let edge=0;edge<2;edge++){
        const t=edge*width/span,q=a.clone().lerp(b,t),normal=new THREE.Vector3(q.x,0,q.z).normalize();q.addScaledVector(normal,.000025+edge*.00028*envelope);
        positions.push(q.x,q.y,q.z);tex.push(uv.getX(i)+(uv.getX(i+1)-uv.getX(i))*t,uv.getY(i));
        for(let channel=0;channel<3;channel++){const v=c.array[i*3+channel]*(1-t)+c.array[(i+1)*3+channel]*t;colors.push(v*(edge?.955:1));}
      }
      if(row<16){const k=row*2;ids.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(tex,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(ids);geo.computeVertexNormals();add(parent,geo,materials().paper,'pasted paper edge');
  }
}

function bambooRib(parent,angle,phase){
  const segments=16,verts=[],uv=[],idx=[];
  for(let j=0;j<=segments;j++){
    const y=-.23+j/segments*.46,outer=paperRadius(angle,y,phase)-PAPER_THICKNESS;
    for(const [dr,across] of [[-.0015,-.0016],[0,-.0016],[0,.0016],[-.0015,.0016]]){
      const rad=outer+dr;verts.push(Math.sin(angle)*rad+Math.cos(angle)*across,y,Math.cos(angle)*rad-Math.sin(angle)*across);uv.push(across/.1,y/.5);
    }
  }
  for(let j=0;j<segments;j++)for(let k=0;k<4;k++){const a=j*4+k,b=j*4+(k+1)%4;idx.push(a,b,a+4,b,b+4,a+4);}
  idx.push(0,3,1,1,3,2);const q=segments*4;idx.push(q,q+1,q+3,q+1,q+2,q+3);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();colored(geo,'#b1a078');
  const rib=add(parent,geo,materials().bamboo,'inner bamboo rib');rib.userData={angle,width:.0032,thickness:.0015};return rib;
}

function collar(parent,y){
  const inner=.0600,outer=.0654,h=.006,profile=[[inner,y-h],[outer,y-h],[outer,y+h],[inner,y+h],[inner,y-h]],geo=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),48);
  colored(geo,'#b9a276');return add(parent,geo,materials().bamboo,'thin bamboo hoop');
}

function batten(parent,w,h,d,x,y,z){const geo=colored(new THREE.BoxGeometry(w,h,d),'#ac9569');geo.translate(x,y,z);return add(parent,geo,materials().bamboo,'bamboo suspension brace');}

/** Unlit paper lantern. y is the paper body's centre; full-size dimensions
 * are body radius ~.17, body height .476, top tie +.58, short tassel -.34.
 * scale and seeded paper irregularity are optional and do not change the API
 * used by the existing positional lantern helper. */
export function paperLantern(parent,x,y,z,scale=1,seed=716){
  const g=new THREE.Group();g.name='unlit paper lantern';g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);
  const phase=rng(seed)()*TAU,shell=paperShell(g,phase);paperLaps(g,shell);
  for(let j=0;j<12;j++)bambooRib(g,j*TAU/12,phase);
  collar(g,.232);collar(g,-.232);
  batten(g,.122,.0025,.004,0,.234,0);batten(g,.004,.0025,.122,0,.2365,0);
  batten(g,.122,.0025,.004,0,-.2335,0);batten(g,.004,.0025,.122,0,-.236,0);
  // Two turns around the crossing braces form the actual suspension knot.
  hempRope(g,[[0,.239,-.005],[-.006,.239,0],[0,.232,.004],[.006,.240,0],[-.004,.245,-.003],[-.003,.237,.005],[.004,.239,.005],[.004,.247,0],[0,.248,0]],.0018,18).name='upper suspension knot';
  hempRope(g,[[0,.248,0],[.001,.35,0],[.002,.46,.001],[.001,.558,0]],.0021,10).name='hanging cord';
  hempRope(g,[[.001,.558,0],[.008,.562,0],[.008,.573,0],[0,.5778,0],[-.007,.573,0],[-.007,.563,0],[.001,.558,0]],.0019,16).name='upper hanging eye';
  // A tied flax end at the lower cross-piece supports seven uneven short tails.
  hempRope(g,[[0,-.234,-.005],[.005,-.240,0],[0,-.237,.005],[-.004,-.242,0],[0,-.248,0],[.004,-.255,0],[0,-.264,.002],[-.004,-.258,0],[0,-.252,-.001]],.0018,16).name='lower tassel knot';
  const random=rng(seed+328);
  for(let j=0;j<7;j++){
    const a=j*TAU/7,xx=Math.sin(a)*.003,zz=Math.cos(a)*.003,end=-.339+random()*.004;
    hempRope(g,[[0,-.2635,.0018],[xx*.7,-.282,zz*.8],[xx*1.3+.001*Math.sin(a),-.307,zz*1.3],[xx*1.7,end,zz*1.8]],.00085,6).name='short flax tassel';
  }
  g.userData.paperLantern={unlit:true,centreY:y,scale,seed,bodyRadius:.174,bodyHeight:.476,bambooRibs:12,paperThickness:PAPER_THICKNESS,attachmentTop:.58,tasselBottom:-.34};return g;
}

export function lanternCraftResources(){materials();return {newTextures:[{width:256,height:512,bytesRGBA:524288}],newBytesRGBA:524288,newMaterials:2,sharedExisting:'boat-craft cached hemp texture and material',emissive:false};}
