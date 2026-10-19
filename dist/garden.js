/* Spring foliage for the riverside: leaf shapes grow from existing drawn twigs.
 * Call createGarden before batchStatic(stat). Everything lives in its own group,
 * so batching cannot discard instanceColor or geometry vertex colors.
 * Original painted foliage atlas; no extra locations, collision or UI changes.
 */
export function createGarden({THREE,scene,stat,dynamic,groundHeight=()=>.22}) {
  const root=new THREE.Group();root.name='spring-garden';scene.add(root);
  let seed=140726;
  const rand=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return ((n^n>>>14)>>>0)/4294967296;};
  const range=(a,b)=>a+(b-a)*rand(), TAU=Math.PI*2;
  const matrix=new THREE.Matrix4(),position=new THREE.Vector3(),scale=new THREE.Vector3(),direction=new THREE.Vector3(),up=new THREE.Vector3(0,1,0),quaternion=new THREE.Quaternion(),twist=new THREE.Quaternion();
  const clock={value:0},meshes=[],materials=[],geometryList=[],textures=[];
  const palette=['#718554','#88985d','#a0ad70','#b9be7d','#687a50','#94a463'].map(c=>new THREE.Color(c));
  const groundPalette=['#65774e','#7f9056','#9ba76a','#acaf75','#6e7954'].map(c=>new THREE.Color(c));
  const palePalette=['#e8d7a9','#dcc494','#f0dfbb','#d3be91'].map(c=>new THREE.Color(c));
  const leafItems=[],grassItems=[],rootTuftItems=[],reedItems=[],plumeItems=[],flowerItems=[],stemLines=[];
  const allTreeSpecs=[];
  const treeSpecs=[[-12,11.3,6.5,true,500,1.3],[10.3,10.8,7,true,500,1.3],[-29,11.3,8,true],[34,11.4,7.8,true],[-30,-13,7.7,false],[38,-14,8.6,false],[-42,21,9,true],[46,24,8,false],[-5,38,7,false],[7,40,8,false]];
  const stats={trees:0,distantTrees:0,twigAnchors:0,leaves:0,grassBlades:0,reeds:0,flowers:0,birds:5,driftingLeaves:10,drawCalls:0,expandedVertices:0,textureBytes:0};

  function geometry(vertices,indices,colors){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();geometryList.push(g);return g;
  }
  // Two unequal facets and an inset midrib make each tiny shape read as a
  // painted leaf even when its silhouette fills only a few pixels.
  function leafGeometry(narrow=false){
    const w=narrow?.095:.31;
    const p=[0,0,0,-w,.30,.002,-w*.63,.70,.014,0,1,.027,w*.53,.73,-.004,w*.88,.28,0,0,.47,.045,
      -.008,.04,.011,.008,.04,.011,-.005,.87,.043,.005,.87,.043];
    const ix=[0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6,7,8,9,8,10,9];
    const shades=[.61,.87,1,.99,.77,.64,.92,.49,.49,.64,.64],cs=[];
    for(const a of shades)cs.push(a,a,a);return geometry(p,ix,cs);
  }
  const broadLeaf=leafGeometry(false),willowLeaf=leafGeometry(true);
  const bladeGeometry=geometry([0,0,0,-.052,.28,.018,-.043,.63,.071,-.005,1,.16,.023,.62,.052,.038,.27,.004,0,.46,.059],
    [0,1,6,1,2,6,2,3,6,3,4,6,4,5,6,5,0,6],[.60,.60,.60,.76,.76,.76,.98,.98,.98,1,1,1,.77,.77,.77,.63,.63,.63,.94,.94,.94]);
  // Four narrow bowed blades share an irregular crown, with one old dry blade.
  // Small paired stations make ribbons rather than broad, freestanding triangles.
  function rootTuftGeometry(){
    const verts=[],idx=[],colors=[];
    for(let blade=0;blade<5;blade++){
      const dry=blade===4,a=blade*2.399+.13,hh=dry?.47:.71+(blade%3)*.14,bend=dry?.63:.28+blade*.055,base=verts.length/3;
      for(let row=0;row<=4;row++){
        const t=row/4,r=.022+Math.pow(t,1.65)*bend,width=(dry?.007:.014)*Math.pow(1-t,.65)*(row===0?.44:1),y=hh*(t-.15*t*t*t);
        for(const side of [-1,1]){
          verts.push(Math.cos(a)*r-Math.sin(a)*width*side,y,Math.sin(a)*r+Math.cos(a)*width*side);
          const shade=.66+Math.sin(t*Math.PI)*.22+(side===1?.10:0);
          colors.push(shade*(dry?1.60:1),shade*(dry?1.27:1),shade*(dry?.66:1));
        }
        if(row<4){const k=base+row*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
      }
    }
    return geometry(verts,idx,colors);
  }
  const rootGrassGeometry=rootTuftGeometry();
  const reedGeometry=geometry([-.011,0,0,.011,0,0,-.007,.53,.037,.007,.53,.037,-.004,1,.078,.004,1,.078],
    [0,1,2,1,3,2,2,3,4,3,5,4],[.55,.55,.55,.77,.77,.77,.69,.69,.69,.93,.93,.93,.77,.77,.77,1,1,1]);
  const plumeGeometry=geometry([0,0,0,-.055,.15,0,-.065,.31,.018,-.048,.57,.012,-.03,.77,.015,0,1,.018,.031,.71,.022,.049,.52,.011,.046,.23,.014,0,.43,.033],
    [0,1,9,1,2,9,2,3,9,3,4,9,4,5,9,5,6,9,6,7,9,7,8,9,8,0,9],
    [.60,.60,.60,.76,.76,.76,.87,.87,.87,.77,.77,.77,.98,.98,.98,1,1,1,.83,.83,.83,.72,.72,.72,.64,.64,.64,.92,.92,.92]);
  const fp=[0,0,.009],fc=[.75,.66,.37],fi=[];
  for(let i=0;i<10;i++){const a=i/10*TAU,r=i%2?.24:.48;fp.push(Math.cos(a)*r,.015*Math.sin(a*2),Math.sin(a)*r);fc.push(1,.98,.92);if(i>0)fi.push(0,i,i+1);}fi.push(0,10,1);
  const flowerGeometry=geometry(fp,fi,fc);

  function paintedMaterial(wind=.0,basic=false){
    const m=basic?new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}):new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,emissive:'#48562e',emissiveIntensity:.08});
    if(wind){m.onBeforeCompile=shader=>{shader.uniforms.uGardenTime=clock;shader.vertexShader='uniform float uGardenTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nfloat phase=instanceMatrix[3].x*.61+instanceMatrix[3].z*.39;\ntransformed.x += sin(uGardenTime*.76+phase+position.y*1.9)*position.y*${wind.toFixed(3)};\ntransformed.z += sin(uGardenTime*.47+phase*1.4)*position.y*${(wind*.36).toFixed(3)};`);};m.customProgramCacheKey=()=>`garden-wind-${wind}`;}
    materials.push(m);return m;
  }
  const leafMaterial=paintedMaterial(.075),grassMaterial=paintedMaterial(.085),reedMaterial=paintedMaterial(.028),flowerMaterial=paintedMaterial(.025);
  function addItem(list,x,y,z,dx,dy,dz,length,width,color,spin=0){
    list.push({x,y,z,dx,dy,dz,length,width,color,spin});
  }
  function paintInstance(target,index,o){
    direction.set(o.dx,o.dy,o.dz).normalize();quaternion.setFromUnitVectors(up,direction);twist.setFromAxisAngle(up,o.spin);quaternion.multiply(twist);
    position.set(o.x,o.y,o.z);scale.set(o.width,o.length,o.width);matrix.compose(position,quaternion,scale);target.setMatrixAt(index,matrix);target.setColorAt(index,o.color);
  }
  function instances(name,g,m,list){
    if(!list.length)return null;
    const obj=new THREE.InstancedMesh(g,m,list.length);obj.name=name;
    for(let i=0;i<list.length;i++)paintInstance(obj,i,list[i]);
    obj.instanceMatrix.needsUpdate=true;if(obj.instanceColor)obj.instanceColor.needsUpdate=true;obj.computeBoundingSphere();root.add(obj);meshes.push(obj);
    stats.expandedVertices+=g.attributes.position.count*list.length;stats.drawCalls++;return obj;
  }
  // Refine the already-planted willow meshes in place, before world batching.
  // TubeGeometry's U is along the branch, so bark must follow U, with meters
  // (not one stretched repeat per branch) determining the texture density.
  const crownAnchors=new Map(),contactPatches=[];
  function bankHeight(x,z){
    const az=Math.abs(z),edge=9.05+Math.sin(x*.39)*.28+Math.sin(x*1.7)*.13;
    if(az<10.35&&az>edge)return -.53+(az-edge)/(10.35-edge)*.754;
    return groundHeight(x,z);
  }
  function barkTexture(){
    const c=document.createElement('canvas');c.width=c.height=512;c.__gardenAsset='bark';const ctx=c.getContext('2d');
    ctx.fillStyle='#dbd5bc';ctx.fillRect(0,0,512,512);
    // Unequal fissures, split side-ridges and gently meandering longitudinal grain.
    for(let j=0;j<76;j++){
      const yy=j/76*512,phase=j*2.173,width=.4+((j*7)%9)*.21,start=j%4===0?-5:(j*41.37)%350,span=j%4===0?522:88+(j*19)%173;
      ctx.strokeStyle=`rgba(49,49,30,${.15+(j%7)*.025})`;ctx.lineWidth=width;ctx.beginPath();
      for(let k=0;k<=40;k++){const xx=start+k/40*span,y=yy+Math.sin(k*.18+phase)*(2+j%4)+Math.sin(k*.43+phase)*.65;k?ctx.lineTo(xx,y):ctx.moveTo(xx,y);}ctx.stroke();
      if(j%3===0){ctx.strokeStyle='#ffffdc50';ctx.lineWidth=.7;ctx.beginPath();for(let k=0;k<=28;k++){const xx=start+k/28*span,y=yy+2.2+Math.sin(k*.257+phase)*(2+j%4);k?ctx.lineTo(xx,y):ctx.moveTo(xx,y);}ctx.stroke();}
    }
    for(let j=0;j<21;j++){
      const x=(j*87.7)%410,y=(j*53.9)%512,len=38+(j*19)%105,w=1.5+(j%4)*.75;
      ctx.fillStyle='#55574131';ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+len*.26,y-w,x+len*.60,y-w*.65,x+len,y+.2);ctx.bezierCurveTo(x+len*.69,y+w*.5,x+len*.35,y+w,x,y);ctx.fill();
      if(j%2===0){ctx.strokeStyle='#77775b48';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x+len*.44,y);ctx.quadraticCurveTo(x+len*.61,y+4,x+len*.82,y+6);ctx.stroke();}
    }
    for(let j=0;j<135;j++){
      const xx=(j*67.27)%512,yy=(j*41.91)%512,len=8+(j*13)%35;
      ctx.strokeStyle=j%3?'#5f5c4137':'#eeeed654';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(xx,yy);ctx.bezierCurveTo(xx+len*.33,yy-1.4,xx+len*.61,yy+2.1,xx+len,yy+.6);ctx.stroke();
    }
    for(let j=0;j<11000;j++){const xx=(j*83.127)%512,yy=(j*47.373)%512;ctx.fillStyle=j%3?'#ffffe115':'#3e43301b';ctx.fillRect(xx,yy,.6+(j%4)*.31,.65+(j%3)*.2);}
    const tx=new THREE.CanvasTexture(c);tx.name='willow-longitudinal-bark';tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=4;textures.push(tx);stats.textureBytes+=Math.ceil(512*512*4*4/3);return tx;
  }
  function refineWillows(){
    const planted=[];
    for(const spec of treeSpecs){if(!spec[3])continue;const tree=stat.children.find(g=>g.isGroup&&Math.abs(g.position.x-spec[0])<.02&&Math.abs(g.position.z-spec[1])<.02);if(tree&&!tree.userData.gardenBarkRefined)planted.push([tree,spec]);}
    if(!planted.length)return;
    const tx=barkTexture(),bark=new THREE.MeshLambertMaterial({color:'#8d805f',map:tx,side:THREE.DoubleSide}),damp=new THREE.MeshLambertMaterial({color:'#747253',map:tx,side:THREE.DoubleSide});materials.push(bark,damp);
    stats.refinedWillows=planted.length;stats.barkReplacedVertices=0;
    for(const [tree,spec] of planted){
      tree.userData.gardenBarkRefined=true;
      const h=spec[2],tubes=tree.children.filter(o=>o.isMesh&&o.geometry.type==='TubeGeometry'),main=tubes.find(o=>o.geometry.parameters.path.points?.length===6);if(!main)continue;
      const trunk=main.geometry.parameters.path;
      const centerAt=y=>{let lo=0,hi=1;for(let j=0;j<18;j++){const mid=(lo+hi)/2;if(trunk.getPoint(mid).y<y)lo=mid;else hi=mid;}return trunk.getPoint((lo+hi)/2);};
      const rootAngles=tubes.filter(o=>o.geometry.parameters.path.points.at(-1).y<.18).map((o,n)=>{const p=o.geometry.parameters.path.points.at(-1);return Math.atan2(p.z,p.x)+Math.sin(n*2.17)*.21;});
      let rootNumber=0;
      for(const o of tubes){
        const old=o.geometry,p=old.parameters,points=p.path.points.map(v=>v.clone()),isMain=o===main,isRoot=points[points.length-1].y<.18;
        const rows=p.tubularSegments,radials=p.radialSegments,op=old.attributes.position,startCenter=p.path.getPointAt(0),endCenter=p.path.getPointAt(1);
        let startR=0,endR=0;for(let j=0;j<radials;j++){position.fromBufferAttribute(op,j);startR+=position.distanceTo(startCenter);position.fromBufferAttribute(op,rows*(radials+1)+j);endR+=position.distanceTo(endCenter);}startR/=radials;endR/=radials;
        if(isRoot){
          const n=rootNumber++,a=rootAngles[n],len=.75+(n%3)*.14,base=centerAt(.14);
          points.splice(0,points.length,base,new THREE.Vector3(Math.cos(a)*.36,.064,Math.sin(a)*.36),new THREE.Vector3(Math.cos(a+.09)*len*.73,.007,Math.sin(a+.09)*len*.73),new THREE.Vector3(Math.cos(a+.16)*len,-.066,Math.sin(a+.16)*len));
          for(let k=1;k<points.length;k++)points[k].y+=bankHeight(spec[0]+points[k].x,spec[1]+points[k].z)-tree.position.y;
          startR=.140+(n%2)*.019;endR=.015;
        }else if(!isMain&&points[0].y>h*.21){
          const oldStart=points[0].clone(),joined=centerAt(points[0].y),delta=joined.clone().sub(oldStart);
          points[0].copy(joined);points[1].addScaledVector(delta,.18);
        }
        const curve=new THREE.CatmullRomCurve3(points),segments=isMain?72:isRoot?24:Math.max(24,rows*2),sides=isMain?16:isRoot?10:8;
        const geo=new THREE.TubeGeometry(curve,segments,1,sides,false),gp=geo.attributes.position,uv=geo.attributes.uv,length=curve.getLength();
        for(let row=0;row<=segments;row++){
          const t=row/segments,center=curve.getPointAt(t),basic=startR+(endR-startR)*Math.pow(t,isMain?.88:isRoot?.82:.94),flare=isMain?1+.13*Math.pow(1-t,13):isRoot?1+.08*Math.sin(t*Math.PI):1;
          for(let k=0;k<=sides;k++){
            const index=row*(sides+1)+k,a=k/sides*TAU;
            let dx=gp.getX(index)-center.x,dy=gp.getY(index)-center.y,dz=gp.getZ(index)-center.z;
            let buttress=0;
            if(isMain){const angle=Math.atan2(dz,dx);for(const rootAngle of rootAngles)buttress+=Math.pow(Math.max(0,Math.cos(angle-rootAngle)),16)*.24*Math.exp(-t*34);}
            const r=basic*(flare+buttress)*(1+Math.sin(a*3+t*2.2)*.028+Math.sin(t*19.2+a)*.018);
            if(isRoot)dy*=.78;
            const buried=isMain?(.23+.025*Math.sin(a*3+.6))*Math.exp(-t*40):0;
            gp.setXYZ(index,center.x+dx*r,center.y+dy*r-buried,center.z+dz*r);
            uv.setXY(index,t*length/1.65,k/sides*(TAU*startR/.76));
          }
        }
        geo.computeVertexNormals();geo.computeBoundingSphere();o.geometry=geo;o.material=isRoot?damp:bark;geometryList.push(geo);stats.barkReplacedVertices+=gp.count-op.count;
        if(isRoot){
          // One short, half-buried side fork breaks the evenly spaced star shape.
          const n=rootNumber-1,a=rootAngles[n]+(n%2?-.65:.70),start=curve.getPointAt(.58),len=.23+(n%3)*.035;
          const mid=start.clone().add(new THREE.Vector3(Math.cos(a)*len*.57,-.022,Math.sin(a)*len*.57)),end=start.clone().add(new THREE.Vector3(Math.cos(a+.12)*len,-.091,Math.sin(a+.12)*len));
          mid.y=bankHeight(spec[0]+mid.x,spec[1]+mid.z)-tree.position.y-.022;end.y=bankHeight(spec[0]+end.x,spec[1]+end.z)-tree.position.y-.066;
          const fork=new THREE.CatmullRomCurve3([start,mid,end]),fg=new THREE.TubeGeometry(fork,8,1,6,false),fp=fg.attributes.position,fu=fg.attributes.uv,fl=fork.getLength();
          for(let row=0;row<=8;row++){const t=row/8,c=fork.getPointAt(t),r=.044*(1-t)+.007*t;for(let k=0;k<=6;k++){const index=row*7+k,dx=fp.getX(index)-c.x,dy=fp.getY(index)-c.y,dz=fp.getZ(index)-c.z;fp.setXYZ(index,c.x+dx*r,c.y+dy*r*.79,c.z+dz*r);fu.setXY(index,t*fl/1.65,k/6*.36);}}
          fg.computeVertexNormals();fg.computeBoundingSphere();const branch=new THREE.Mesh(fg,damp);branch.name='short-buried-root-fork';tree.add(branch);geometryList.push(fg);stats.barkReplacedVertices+=fp.count;stats.rootForks=(stats.rootForks||0)+1;
        }
        // Old geometries are detached; retained source curves continue to locate twigs.
      }
      // Existing round knot bulbs become low asymmetric swellings on the trunk.
      for(const o of [...tree.children]){
        if(o.isMesh&&o.geometry.type==='SphereGeometry'){
          const center=centerAt(o.position.y),out=new THREE.Vector3(o.position.x-center.x,0,o.position.z-center.z);if(out.lengthSq()<.001)out.set(0,0,1);out.normalize();
          o.position.set(center.x+out.x*.22,o.position.y,center.z+out.z*.22);o.scale.multiply(new THREE.Vector3(.85,.73,.71));o.material=bark;
        }else if(o.isLineSegments&&o.geometry.attributes.position.count<220){tree.remove(o);}
      }
      // Remove old central ruler-lines now replaced with proper longitudinal bark.
      let fine=null;for(const o of tree.children)if(o.isLineSegments&&(!fine||o.geometry.attributes.position.count>fine.geometry.attributes.position.count))fine=o;
      if(fine){const p=fine.geometry.attributes.position,out=[];for(let i=0;i<p.count-1;i+=2){const rr=Math.max(Math.hypot(p.getX(i),p.getZ(i)),Math.hypot(p.getX(i+1),p.getZ(i+1)));if(rr<.64&&Math.min(p.getY(i),p.getY(i+1))<h*.86)continue;for(let j=0;j<2;j++)out.push(p.getX(i+j),p.getY(i+j),p.getZ(i+j));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(out,3));fine.geometry=g;geometryList.push(g);}
      contactPatches.push({x:spec[0],z:spec[1],rx:1.02,rz:.86,shade:'#5c6546'});
    }
  }
  refineWillows();

  const willowItems=[];
  function treeLeaves(spec){
    const [tx,tz,h,willow]=spec;
    const tree=stat.children.find(g=>g.isGroup&&Math.abs(g.position.x-tx)<.02&&Math.abs(g.position.z-tz)<.02);
    if(!tree)return;
    let fine=null;for(const child of tree.children){if(child.isLineSegments&&(!fine||child.geometry.attributes.position.count>fine.geometry.attributes.position.count))fine=child;}
    if(!fine)return;stats.trees++;allTreeSpecs.push(spec);
    const anchors=[];for(const o of tree.children){const pts=o.geometry?.parameters?.path?.points;if(pts?.length===4&&pts[0].y>h*.22){const tip=pts[3],mid=pts[2];anchors.push({x:tip.x*.85+mid.x*.15,y:tip.y*.88+mid.y*.12,z:tip.z*.85+mid.z*.15});}}
    if(anchors.length)crownAnchors.set(tx+':'+tz,anchors);
    const p=fine.geometry.attributes.position,limit=spec[4]??(willow?1300:1050),leafScale=spec[5]??1;let made=0;
    for(let i=0;i<p.count-1&&made<limit;i+=2){
      const ax=p.getX(i),ay=p.getY(i),az=p.getZ(i),bx=p.getX(i+1),by=p.getY(i+1),bz=p.getZ(i+1);
      const dx=bx-ax,dy=by-ay,dz=bz-az,len=Math.hypot(dx,dy,dz),r=Math.hypot(bx,bz);
      if(by<h*.37||r<.80||r>h*.6)continue;
      if(willow){
        if(dy>-.08||dy<-.20||len>.22||rand()>.63)continue;
        stats.twigAnchors++;
        const leafCount=rand()<.24?2:1;
        for(let k=0;k<leafCount;k++){
          const side=(Math.floor(i/2)+k)%2?1:-1,a=range(-.35,.35)+Math.atan2(bz,bx),ll=range(.13,.26)*leafScale;
          addItem(willowItems,tx+bx,.22+by+k*.027,tz+bz,Math.cos(a)*side*.55,-1,Math.sin(a)*side*.55,ll,ll*.85,palette[Math.floor(range(0,6))],range(-.8,.8));made++;
        }
      }else{
        if(dy<.07||len<.15||len>.34||rand()>.69)continue;
        stats.twigAnchors++;
        // A loose sprig follows the actual terminal twig; its center stays airy.
        const a=Math.atan2(dz,dx),count=4+Math.floor(rand()*3);
        for(let k=0;k<count&&made<limit;k++){
          const t=(k+.3)/count,side=k%2?-1:1,ll=range(.13,.29)*leafScale,spread=a+side*range(.40,.94);
          addItem(leafItems,tx+ax+dx*t,.22+ay+dy*t,tz+az+dz*t,Math.cos(spread),range(.35,.86),Math.sin(spread),ll,ll,palette[Math.floor(range(0,6))],range(-1,1));made++;
        }
      }
    }
  }
  for(const spec of treeSpecs)treeLeaves(spec);
  // Read the already-planted distant trees too; their airy sprays share the
  // same branch network, with broader but fewer shapes for the horizon.
  for(const g of stat.children){
    if(!g.isGroup||Math.abs(g.position.z)<41||Math.abs(g.position.z)>60||Math.abs(g.position.x)>66||Math.abs((g.position.x+65)/10-Math.round((g.position.x+65)/10))>.002)continue;
    let p=null;for(const child of g.children)if(child.isLineSegments&&(!p||child.geometry.attributes.position.count>p.count))p=child.geometry.attributes.position;
    if(!p||p.count<3500)continue;
    let top=0,down=0;for(let i=0;i<p.count-1;i+=2){top=Math.max(top,p.getY(i),p.getY(i+1));if(p.getY(i+1)-p.getY(i)<-.08&&p.getY(i+1)-p.getY(i)>-.20)down++;}
    treeLeaves([g.position.x,g.position.z,top*.81,down>180,420,1.48]);stats.distantTrees++;
  }

  // Low, open sprays live against the bank or tree roots, away from shop doors.
  const shrubs=[[-32,11.2,.9],[-26,11.05,.6],[31,11.2,.74],[37,11.35,.6],[-33,-11.15,.83],[41,-11.28,.70],[-40,22,.9],[46,25,.7],[-7.6,38,.74],[9,40,.7],[-48,-13,.72],[52,12,.66]];
  for(const [x,z,h] of shrubs){
    const y=groundHeight(x,z);
    for(let j=0;j<11;j++){
      const a=j*2.399+rand()*.4,rr=range(.18,.7),ex=x+Math.cos(a)*rr,ez=z+Math.sin(a)*rr,ey=y+h*range(.52,1.18);
      stemLines.push(x,y+.04,z,ex,ey,ez);
      for(let k=0;k<8;k++){
        const t=range(.28,1),ll=range(.13,.27),side=k%2?-1:1,aa=a+side*.85;
        addItem(leafItems,x+(ex-x)*t,y+(ey-y)*t,z+(ez-z)*t,Math.cos(aa),.6,Math.sin(aa),ll,ll,groundPalette[Math.floor(rand()*groundPalette.length)],range(-1.4,1.4));
      }
    }
  }
  function shoreClear(x,side){return Math.abs(x)>7.5&&!(side>0&&x>-21.5&&x<-12.0);}
  // Small, separated tussocks leave long runs of bare painted riverbank.
  for(const side of [-1,1])for(let j=0;j<52;j++){
    const x=-62+j*2.4+range(-.7,.7);if(!shoreClear(x,side)||rand()>.80)continue;
    const z=side*range(10.38,10.88),y=bankHeight(x,z),spread=range(.20,.58),size=range(.25,.56);
    contactPatches.push({x,z,rx:spread*1.28,rz:spread*.91,shade:j%3?'#697348':'#777248'});
    for(let b=0;b<16;b++){
      const a=rand()*TAU,r=Math.sqrt(rand())*spread,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
      addItem(grassItems,px,bankHeight(px,pz)+.008,pz,Math.cos(a)*.15,1,Math.sin(a)*.15,size*range(.52,1.32),range(.36,.9),groundPalette[Math.floor(rand()*groundPalette.length)],a);
    }
    if(j%3===0){
      for(let k=0;k<3;k++){
        const px=x+range(-spread,spread),pz=z+range(-.16,.16),height=range(.65,1.06),bend=range(-.20,.20),a=rand()*TAU;
        const rooted=bankHeight(px,pz);
        addItem(reedItems,px,rooted,pz,Math.cos(a)*.1,1,Math.sin(a)*.1,height,1,groundPalette[k%groundPalette.length],a);
        if(k===0)addItem(plumeItems,px+Math.cos(a)*.04,rooted+height*.90,pz+Math.sin(a)*.04,.14,1,.04,range(.18,.29),range(.62,.86),palePalette[Math.floor(rand()*palePalette.length)],a);
        for(let q=0;q<3;q++){const aa=a+q*2.2;addItem(willowItems,px,rooted+height*(.27+q*.19),pz,Math.cos(aa),.30,Math.sin(aa),range(.22,.40),range(.35,.58),groundPalette[(q+k)%groundPalette.length],aa);}
      }
    }
    if(j%4===1&&Math.abs(x)<44){
      for(let f=0;f<5;f++){
        const px=x+range(-spread,spread),pz=z+range(-.26,.26),hh=range(.14,.26);
        const rooted=bankHeight(px,pz);stemLines.push(px,rooted,pz,px+.025,rooted+hh,pz);
        addItem(flowerItems,px+.025,rooted+hh,pz,range(-.15,.15),1,range(-.15,.15),range(.044,.070),range(.054,.083),palePalette[f%palePalette.length],rand()*TAU);
      }
    }
  }
  // Keep the old random stream intact so all canopy cards remain unchanged.
  // Every other former blade becomes a small tuft; the gaps leave roots legible.
  for(const [x,z,h] of treeSpecs)for(let b=0;b<24;b++){
    const a=rand()*TAU,r=range(.40,1.04),length=range(.18,.45),width=range(.40,.88),color=groundPalette[Math.floor(rand()*5)];
    if(b%2)continue;
    const px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r,py=bankHeight(px,pz)+.004;
    addItem(rootTuftItems,px,py,pz,Math.cos(a)*.09,1,Math.sin(a)*.09,length*.69,width*.76,color,a);
    if(b===4){const hh=length*.92;addItem(reedItems,px,py,pz,Math.cos(a)*.05,1,Math.sin(a)*.05,hh,.14,palePalette[1],a);addItem(plumeItems,px+Math.cos(a)*hh*.05,py+hh*.97,pz+Math.sin(a)*hh*.05,.04,1,.02,.048,.13,palePalette[3],a);}
  }
  instances('young-leaf-sprays',broadLeaf,leafMaterial,leafItems);
  instances('willow-and-reed-leaves',willowLeaf,leafMaterial,willowItems);
  instances('riverbank-grass',bladeGeometry,grassMaterial,grassItems);
  instances('bowed-grass-at-tree-roots',rootGrassGeometry,grassMaterial,rootTuftItems);
  instances('reed-stalks',reedGeometry,reedMaterial,reedItems);
  instances('quiet-reed-seedheads',plumeGeometry,flowerMaterial,plumeItems);
  instances('tiny-bank-blossoms',flowerGeometry,flowerMaterial,flowerItems);
  if(stemLines.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(stemLines,3));geometryList.push(g);const m=new THREE.LineBasicMaterial({color:'#67734c',transparent:true,opacity:.74});materials.push(m);const line=new THREE.LineSegments(g,m);root.add(line);stats.expandedVertices+=stemLines.length/3;stats.drawCalls++;}
  stats.leaves=leafItems.length+willowItems.length;stats.grassBlades=grassItems.length+rootTuftItems.length*5;stats.rootTufts=rootTuftItems.length;stats.reeds=reedItems.length;stats.flowers=flowerItems.length;

  function paintGroundContacts(){
    const c=document.createElement('canvas');c.width=c.height=256;c.__gardenAsset='contact';const ctx=c.getContext('2d');
    // The alpha mask is a broken stain around plant bases, not a circular decal.
    for(let j=0;j<29;j++){
      const a=j*2.399,rr=18+(j*17)%66,x=128+Math.cos(a)*rr,y=128+Math.sin(a)*rr*.72,radius=24+(j*11)%40;
      const fade=ctx.createRadialGradient(x,y,1,x,y,radius);fade.addColorStop(0,'rgba(255,255,255,.26)');fade.addColorStop(.45,'rgba(255,255,255,.13)');fade.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=fade;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
    }
    ctx.strokeStyle='#ffffff30';ctx.lineWidth=.55;
    for(let j=0;j<140;j++){const a=j*2.17,r=9+(j*13)%92,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r*.76;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3+(j%5),y+(j%3-1)*2);ctx.stroke();}
    const tx=new THREE.CanvasTexture(c);tx.name='plant-root-contact-wash';tx.colorSpace=THREE.SRGBColorSpace;textures.push(tx);stats.textureBytes+=Math.ceil(256*256*4*4/3);
    const verts=[],uv=[],colors=[],idx=[],col=new THREE.Color(),n=4;
    for(const patch of contactPatches){
      const base=verts.length/3;col.set(patch.shade);
      for(let row=0;row<=n;row++)for(let k=0;k<=n;k++){
        const u=k/n,v=row/n,x=patch.x+(u-.5)*patch.rx*2,z=patch.z+(v-.5)*patch.rz*2;
        verts.push(x,bankHeight(x,z)+.004,z);uv.push(u,1-v);colors.push(col.r,col.g,col.b);
      }
      for(let row=0;row<n;row++)for(let k=0;k<n;k++){const a=base+row*(n+1)+k;idx.push(a,a+n+1,a+1,a+1,a+n+1,a+n+2);}
    }
    const g=geometry(verts,idx,colors);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const m=new THREE.MeshBasicMaterial({map:tx,vertexColors:true,transparent:true,opacity:.32,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});materials.push(m);
    const o=new THREE.Mesh(g,m);o.name='subtle-root-and-bank-contact';o.renderOrder=1;root.add(o);stats.drawCalls++;stats.expandedVertices+=verts.length/3;stats.groundContactPatches=contactPatches.length;
  }
  paintGroundContacts();

  // One original painted atlas supplies four genuinely leafy, broken silhouettes.
  // The large value masses carry through at viewing distance; the tiny geometry
  // leaves above remain the close-up drawing and keep the branches articulated.
  function canopyAtlas(){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;canvas.__gardenAsset='canopy';
    const c=canvas.getContext('2d');
    const shadow=['#31594c','#3b6652','#446f51','#537b50'];
    const middle=['#648d50','#729850','#7c9f53','#88aa59','#92ae61'];
    const sun=['#b0c571','#becd7d','#cad58c','#a8c06b'];
    function brushLeaf(x,y,length,width,angle,color,alpha=1,vein=false){
      c.save();c.translate(x,y);c.rotate(angle);c.globalAlpha=alpha;c.fillStyle=color;
      const tipBend=Math.sin(x*.047+y*.036)*width*.23;
      c.beginPath();c.moveTo(0,0);c.bezierCurveTo(length*.22,-width*.54,length*.61,-width*.69,length,tipBend);c.bezierCurveTo(length*.76,width*.32+tipBend*.5,length*.28,width*.57,0,0);c.fill();
      if(vein){c.strokeStyle='#e0dfa252';c.lineWidth=.6;c.beginPath();c.moveTo(length*.09,0);c.quadraticCurveTo(length*.51,-width*.035,length*.91,tipBend*.83);c.stroke();}
      c.restore();
    }
    for(let tile=0;tile<4;tile++){
      c.save();c.translate((tile%2)*512+20,Math.floor(tile/2)*512+20);c.scale(.92,.92);
      const droop=tile>1;
      const lobes=tile===0?[[115,287,78,56],[178,219,79,63],[262,273,99,68],[340,212,88,60],[377,301,62,51]]:
        tile===1?[[119,263,75,56],[185,310,82,56],[232,210,93,62],[307,234,79,64],[373,279,67,50]]:
        [[101,124,59,40],[173,106,79,45],[255,128,91,50],[331,113,73,43],[390,157,49,39]];
      // Underpainting is broken into interlocking pointed strokes, not a disc.
      for(let layer=0;layer<3;layer++)for(const [cx,cy,rx,ry] of lobes){
        const count=layer===0?57:layer===1?82:42;
        for(let j=0;j<count;j++){
          const a=rand()*TAU,r=Math.sqrt(rand()),xx=cx+Math.cos(a)*rx*r,yy=cy+Math.sin(a)*ry*r-layer*8;
          const col=layer===0?shadow[Math.floor(rand()*4)]:layer===1?middle[Math.floor(rand()*5)]:sun[Math.floor(rand()*4)];
          if(layer===2&&(yy>cy+ry*.07||rand()>.78))continue;
          const len=range(layer===0?31:18,layer===0?63:43),wid=len*range(.23,.44),ang=range(-3.2,-.25)+Math.sin(xx*.014)*.5;
          brushLeaf(xx,yy,len,wid,ang,col,layer===0?.92:range(.82,1),layer===2&&rand()>.48);
        }
      }
      if(droop){
        // Alternate leaves with real gaps, unequal internodes and broken spray
        // lengths: a willow twig is not nineteen mirrored pairs on a feather.
        const strands=tile===2?15:11;
        for(let j=0;j<strands;j++){
          const x=range(47,447),start=range(123,192),end=tile===2?range(269,465):range(321,477),bend=range(-45,43),phase=rand()*TAU;
          c.strokeStyle='#667a4c80';c.lineWidth=.72+rand()*.45;c.beginPath();c.moveTo(x,start-31);c.bezierCurveTo(x+bend*.55,start+61,x+bend,end-68,x+bend*.84,end);c.stroke();
          let k=0;
          for(let t=range(.01,.06);t<.985;t+=range(.035,.067)){
            const y=start+(end-start)*t,xx=x+Math.sin(t*2.5)*bend,side=k++%2?-1:1;
            if(rand()<.115&&t>.2)continue;
            const len=range(19,37)*(1-t*.31),angle=Math.PI*.5+side*range(.32,.96)+Math.sin(t*4+phase)*.15;
            const cols=j%4===0?shadow:j%3===0?sun:middle,col=cols[Math.floor(rand()*cols.length)];
            brushLeaf(xx,y,len,range(3.0,6.1)*(1-t*.21),angle,col,range(.81,.99),rand()>.84);
            if(t<.50&&rand()<.18)brushLeaf(xx+.8,y+range(4,8),len*.78,3.8,Math.PI*.5-side*.58,middle[(j+k)%5],.88);
            if(j%3!==0&&k%5===2)brushLeaf(xx-1.5,y-1,len*.72,2.4,angle,sun[(j+k)%4],.68);
          }
          // Occasional fine daughter-twigs break the repeated vertical rhythm.
          if(j%3===1){const yy=start+(end-start)*.43,xx=x+Math.sin(1.075)*bend;for(let k=0;k<7;k++){const t=k/7;brushLeaf(xx+(j%2?1:-1)*t*29,yy+t*72,range(13,24),3.1,1.25+(k%2)*.62,middle[(j+k)%5],.91);}}
        }
      }
      // A few dry, small marks articulate lit tips without peppering all the shade.
      for(let j=0;j<100;j++){
        const l=lobes[j%lobes.length],x=l[0]+range(-l[2]*.75,l[2]*.8),y=l[1]-l[3]*range(.20,.86);
        brushLeaf(x,y,range(5,15),range(2,4),range(-2.6,-.3),sun[j%4],.62);
      }
      // Pigment density varies across the strokes; the light paper breaks
      // through in small flecks instead of a perfectly flat vector fill.
      c.globalCompositeOperation='source-atop';
      const wash=c.createLinearGradient(0,35,70,485);wash.addColorStop(0,'#e1dfa512');wash.addColorStop(.5,'#a6bd6900');wash.addColorStop(1,'#264c4b25');
      c.fillStyle=wash;c.fillRect(-12,-12,535,535);
      for(let j=0;j<4200;j++){c.globalAlpha=range(.035,.13);c.fillStyle=j%3?'#e5e1b3':'#365b4c';c.fillRect(rand()*510,rand()*505,range(.65,1.7),range(.6,2.6));}
      c.globalAlpha=1;c.globalCompositeOperation='source-over';c.restore();
    }
    const tx=new THREE.CanvasTexture(canvas);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=4;tx.name='painted-spring-leaf-clusters';textures.push(tx);
    stats.textureBytes+=Math.ceil(1024*1024*4*4/3);return tx;
  }
  function layeredCanopies(){
    const atlas=canopyAtlas();
    const m=new THREE.MeshBasicMaterial({map:atlas,color:'#ffffff',side:THREE.DoubleSide,alphaTest:.32,depthWrite:true,transparent:false,alphaToCoverage:true});
    m.onBeforeCompile=shader=>{shader.uniforms.uGardenTime=clock;shader.vertexShader='uniform float uGardenTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat breeze=sin(uGardenTime*.43+instanceMatrix[3].x*.42+instanceMatrix[3].z*.33);\ntransformed.x+=breeze*(.5-position.y)*.026;\ntransformed.z+=sin(uGardenTime*.32+instanceMatrix[3].x*.24)*(.5-position.y)*.012;');};m.customProgramCacheKey=()=> 'painted-canopy-2026';materials.push(m);
    const cards=[[],[],[],[]],white=new THREE.Color('#ffffff'),shaded=new THREE.Color('#c0d0bb'),soft=new THREE.Color('#e4ead4');
    const euler=new THREE.Euler();
    function card(tile,x,y,z,w,h,yaw,pitch,roll,shade){cards[tile].push({x,y,z,w,h,yaw,pitch,roll,shade});}
    for(const spec of allTreeSpecs){
      const [x,z,h,willow]=spec,far=Math.abs(z)>41,near=x===-12||x===10.3,count=far?10:near?27:20;
      const spread=h*(willow?.31:.30),anchors=crownAnchors.get(x+':'+z)||[];
      for(let j=0;j<count;j++){
        const anchor=anchors.length?anchors[(j*7)%anchors.length]:null,a=anchor?Math.atan2(anchor.z,anchor.x):j*2.399+range(-.25,.25),r=range(.31,1)*spread;
        const yy=anchor ? .22+anchor.y+range(-.48,.25):.22+h*(.62+.25*(1-r/spread))+range(-.32,.36);
        const px=x+(anchor?anchor.x+range(-.38,.38):Math.cos(a)*r),pz=z+(anchor?anchor.z+range(-.32,.32):Math.sin(a)*r);
        const w=far?range(2.5,3.8):range(2.3,3.3)*(near?1.04:1),hh=far?range(1.9,2.6):range(1.65,2.35);
        card(j%2,px,yy,pz,w*1.08,hh*1.35,Math.PI*.5-a+range(-.3,.3),range(-.26,.32),range(-.2,.2),j%5===0?shaded:j%3===0?soft:white);
        if(!far&&j%3===0)card((j+1)%2,px+.2,yy+.21,pz-.13,w*.93,hh*1.18,Math.PI*.5-a+1.12,range(-.28,.26),range(-.14,.14),white);
      }
      // Soft overlapping interior brush masses sit below the lit tips.
      if(!far)for(let j=0;j<5;j++){const a=j*1.256+.3;card(j%2,x+Math.cos(a)*spread*.47,.22+h*.57,z+Math.sin(a)*spread*.47,2.7,1.8,a,range(-.18,.16),range(-.08,.08),shaded);}
      if(willow){
        const n=far?5:near?25:18;
        for(let j=0;j<n;j++){
          const anchor=anchors.length?anchors[(j*5+2)%anchors.length]:null,a=anchor?Math.atan2(anchor.z,anchor.x):j*2.399+range(-.14,.14),rr=spread*range(.58,1.05),length=h*range(near?.32:.28,near?.55:.46);
          const yy=anchor ? .22+anchor.y-length*.39+range(-.18,.20):.22+h*range(.58,.70)-length*.18;
          card(2+j%2,x+(anchor?anchor.x+range(-.29,.29):Math.cos(a)*rr),yy,z+(anchor?anchor.z+range(-.24,.24):Math.sin(a)*rr),range(1.17,2.14),length,Math.PI*.5-a+range(-.43,.43),range(-.18,.21),range(-.23,.23),j%4===0?soft:white);
        }
      }
    }
    stats.canopyCards=0;
    for(let tile=0;tile<4;tile++){
      const list=cards[tile];if(!list.length)continue;
      const g=new THREE.PlaneGeometry(1,1,3,3),uv=g.attributes.uv,p=g.attributes.position;
      for(let i=0;i<p.count;i++){p.setZ(i,Math.sin(p.getX(i)*3.0+tile*.6)*.060+Math.sin(p.getY(i)*3.4+tile*.83)*(.5-p.getY(i))*.068);uv.setXY(i,tile%2*.5+.008+uv.getX(i)*.484,(1-Math.floor(tile/2))*.5+.008+uv.getY(i)*.484);}g.computeVertexNormals();geometryList.push(g);
      const obj=new THREE.InstancedMesh(g,m,list.length);obj.name='painted-canopy-layer-'+tile;
      for(let i=0;i<list.length;i++){const q=list[i];position.set(q.x,q.y,q.z);euler.set(q.pitch,q.yaw,q.roll,'YXZ');quaternion.setFromEuler(euler);scale.set(q.w,q.h,1);matrix.compose(position,quaternion,scale);obj.setMatrixAt(i,matrix);obj.setColorAt(i,q.shade);}
      obj.instanceMatrix.needsUpdate=true;obj.instanceColor.needsUpdate=true;obj.computeBoundingSphere();root.add(obj);meshes.push(obj);stats.drawCalls++;stats.expandedVertices+=list.length*g.attributes.position.count;stats.canopyCards+=list.length;
    }
  }
  layeredCanopies();

  // Five small swallows cross high above the river, in a loose, slow formation.
  const bp=[0,0,-.18,-.042,0,.07,0,.02,.16,.042,0,.07,-.14,.025,.01,-.43,.08,-.05,-.27,.018,-.17,.14,.025,.01,.43,.08,-.05,.27,.018,-.17,-.035,0,-.28,0,0,-.20,.035,0,-.28];
  const bc=[];for(let i=0;i<bp.length/3;i++){const v=i===5||i===8?.64:.90;bc.push(v,v,v);}
  const birdGeometry=geometry(bp,[0,1,2,0,2,3,1,4,5,1,5,6,3,8,7,3,9,8,0,10,11,0,11,12],bc);
  const birdMaterial=paintedMaterial(0,true);birdMaterial.color.set('#6a7560');
  birdMaterial.onBeforeCompile=shader=>{shader.uniforms.uGardenTime=clock;shader.vertexShader='uniform float uGardenTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y += sin(uGardenTime*5.1+instanceMatrix[3].x*.21)*abs(position.x)*.67;');};birdMaterial.customProgramCacheKey=()=> 'garden-swallow';
  const birds=new THREE.InstancedMesh(birdGeometry,birdMaterial,stats.birds);birds.name='distant-swallows';birds.instanceMatrix.setUsage(THREE.DynamicDrawUsage);birds.frustumCulled=false;root.add(birds);meshes.push(birds);stats.drawCalls++;stats.expandedVertices+=stats.birds*birdGeometry.attributes.position.count;
  const drift=new THREE.InstancedMesh(willowLeaf,leafMaterial,stats.driftingLeaves);drift.name='occasional-drifting-leaves';drift.instanceMatrix.setUsage(THREE.DynamicDrawUsage);drift.frustumCulled=false;root.add(drift);meshes.push(drift);stats.drawCalls++;stats.expandedVertices+=stats.driftingLeaves*willowLeaf.attributes.position.count;
  const falling=[];for(let i=0;i<stats.driftingLeaves;i++){const s=treeSpecs[i%3===2?4:i%2];falling.push({x:s[0]+range(-2,2),z:s[1]+range(-1,1),height:range(3.7,6.9),phase:rand()*TAU,period:range(28,49),size:range(.11,.18)});drift.setColorAt(i,palette[i%palette.length]);}drift.instanceColor.needsUpdate=true;
  function update(t,camera){
    clock.value=t;
    for(let i=0;i<stats.birds;i++){
      const a=t*.025+i*.22,px=Math.cos(a)*30-2+i*.6,pz=Math.sin(a)*8+i*.85-1,py=13.2+i*.21+Math.sin(t*.27+i)*.22;
      position.set(px,py,pz);quaternion.setFromAxisAngle(up,-a-Math.PI/2);scale.setScalar(.57+i*.04);matrix.compose(position,quaternion,scale);birds.setMatrixAt(i,matrix);
    }
    birds.instanceMatrix.needsUpdate=true;
    for(let i=0;i<falling.length;i++){
      const f=falling[i],phase=(t/f.period+f.phase/TAU)%1;
      position.set(f.x+Math.sin(phase*TAU+f.phase)*.72+phase*.8,.30+(1-phase)*f.height,f.z+Math.cos(phase*TAU+f.phase)*.54);
      quaternion.setFromAxisAngle(up,t*.47+f.phase);twist.setFromAxisAngle(direction.set(1,0,0),Math.sin(t*.9+f.phase)*.7+1.4);quaternion.multiply(twist);scale.set(f.size,f.size,f.size);matrix.compose(position,quaternion,scale);drift.setMatrixAt(i,matrix);
    }
    drift.instanceMatrix.needsUpdate=true;
  }
  update(0,null);
  function dispose(){scene.remove(root);for(const g of geometryList)g.dispose();for(const m of materials)m.dispose();for(const tx of textures)tx.dispose();for(const m of meshes){m.instanceMatrix?.dispose?.();m.instanceColor?.dispose?.();}}
  return {root,update,stats,dispose};
}
