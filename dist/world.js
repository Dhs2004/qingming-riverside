import * as THREE from './assets/three.module.js';
import {C,random,between,mat,ceramic,wicker,fabric,reedMat,endWood,mesh,box,softBox,cylinder,beam,group,lines,pathLine,roof,sign,canvasTexture,batchStatic} from './ink.js?v=20261019r6';
import {People} from './people.js?v=20261019r14';
import {assignCrowdPaths} from './crowd-paths.js?v=20261019r10';
import {populateStreetLife} from './crowd-life.js?v=20261019r7';
import {crowdShadows} from './crowd-shadows.js?v=20261019r6';
import {Animals} from './animals.js?v=20261019r6';
import {Tableaux} from './tableaux.js?v=20261019r6';
import {createGarden} from './garden.js?v=20261019r6';
import {dressShop,dressMarket,parasolMaterial,dressBoat,dressBridge} from './artisan.js?v=20261019r6';
import {dressTeaTable,dressTeaShelf,furnishTea} from './tea-craft.js?v=20261019r6';
import {packedEarthTexture,dressEarth} from './earth.js?v=20261019r6';
import {hempRope,reedBox,tieToPeg,dressBoatInterior,dressLanding} from './boat-craft.js?v=20261019r6';
import {tiedBale,foldedCloth,fabricRoll,drapedCloth} from './cloth-craft.js?v=20261019r6';
import {closeBasket} from './market-goods.js?v=20261019r6';
import {createDistantWash} from './distant-wash.js?v=20261019r6';
import {detailedCart} from './wagon-craft.js?v=20261019r6';
import {steamedBun} from './snack-craft.js?v=20261019r6';
import {dressBridgeCraft} from './bridge-craft.js?v=20261019r6';

export const bridgeHeight=z=>.28+3.55*Math.max(0,1-(z/13.8)**2);
const bridgeDeckCount=90,bridgeDeckPitch=27.6/bridgeDeckCount;
// bridgeHeight is the structural centre datum. Feet stand on the upper face
// of the sloping 15 cm planks, including their perpendicular thickness.
export const bridgeDeckHeight=z=>{
  const index=THREE.MathUtils.clamp(Math.floor((z+13.8)/bridgeDeckPitch),0,bridgeDeckCount-1),a=-13.8+index*bridgeDeckPitch,b=a+bridgeDeckPitch,slope=(bridgeHeight(b)-bridgeHeight(a))/bridgeDeckPitch;
  return bridgeHeight(a)+(z-a)*slope+.075*Math.sqrt(1+slope*slope);
};
export const groundHeight=(x,z)=>{
  if(Math.abs(x)<3.45&&Math.abs(z)<13.8)return bridgeDeckHeight(z);
  if(x>9.85&&x<17.15&&z>25.1&&z<30.9)return .22+.32*Math.min(1,(z-25.1)/.55);
  if(x>14.45&&x<20.75&&z>-26.6&&z<-21.4)return .22+.32*Math.min(1,(-21.4-z)/.55);
  return .22;
};
export const PLACES={
  south:{x:-5.5,z:23,yaw:-.32,label:'南岸街市'},
  bridge:{x:1.85,z:-1.42,yaw:-1.46,pitch:-.39,label:'虹桥'},
  tea:{x:17,z:20.8,yaw:2.38,label:'桥头茶肆'},
  quay:{x:-19.0,z:14.0,yaw:-.89,pitch:.025,label:'汴河船埠'}
};
export const DETAILS=[
  {id:'bridge',x:1,z:6,r:7,title:'木作成虹',number:'壹',text:'虹桥用木材相互支承，桥下没有落在河心的桥墩。舟楫从桥洞穿行，桥面则是来往的人与临时摊贩。抬眼看桥侧，交叠的梁木撑起了这条弧线。',note:'木拱轮廓、梁木交叠与桥市取意于张择端本；构件尺寸与内部接合为三维重构。'},
  {id:'boat',x:-15,z:11.2,r:6,title:'一舟过汴河',number:'贰',text:'篷顶由一道道弯曲的支架托起，绳缆、舷板与长篙各有位置。原画里的河流繁忙，船既运货，也把沿河的生活连在一起。这里留出一处船埠，可以走近看船上的细物。',note:'舟船的低舷、篷顶与索具参照原画；停泊位置为游览路线作了调整。'},
  {id:'tea',x:16,z:22,r:5,title:'桥头一盏茶',number:'叁',text:'低檐下摆着桌案和长凳。碗盏、壶、竹筐挤在有限的地方，人便在这方寸间坐下、交谈、歇脚。细线勾勒物件，浅淡的颜色给每一件东西留出呼吸。',note:'店肆、桌凳与器具按画中市井形制组合；“茶”字店招与这一处具体陈设是创作补足。'},
  {id:'stall',x:-7,z:18,r:4.5,title:'伞下的小买卖',number:'肆',text:'伞骨从中心向外舒展，竹筐编成斜纹，案上有碗、有果子，也有叠起来的包裹。走近以后，那些在长卷里只占一小点的东西，才显出各自的分量。',note:'伞摊与货担参照原画的物件种类，摊位的精确商品与摆放含重构。'},
  {id:'north',x:-5,z:-18,r:6,title:'街随桥转',number:'伍',text:'过桥以后，街道向屋檐间伸去。铺面有敞开的，也有以木板围起的。屋顶多用灰瓦，廊檐、栏杆和招牌的线条，构成画中一层接一层的街景。',note:'空间将原画中的散点透视转为可步行的连续地面，背面建筑与街道尺度为推定。'}
];

export function createWorld(scene,{batchCell=28,multiDraw=false}={}){
  const stat=new THREE.Group();scene.add(stat);const dynamic=new THREE.Group();scene.add(dynamic);const colliders=[];const looseObstacles=[];const walkSegments=[];const boats=[];const boatPassengers=[];const banners=[];const shopkeepers=[];const shopSites=[];
  function collider(x,z,w,d){colliders.push({x,z,w,d});}
  function looseCollider(x,z,w,d){const item={x,z,w,d};colliders.push(item);looseObstacles.push(item);}
  // Keep the placement random stream independent of the richer painted ground.
  for(let i=0;i<31000;i++)for(let j=0;j<6;j++)random();
  for(let i=0;i<1250;i++)for(let j=0;j<4;j++)random();
  const groundTex=packedEarthTexture();
  for(const side of [-1,1]){
    box(stat,400,.8,140,C.soil,0,-.2,side*80,false);
    mesh(stat,new THREE.PlaneGeometry(400,140),mat('#ffffff',{map:groundTex}),[0,.22,side*80],[-Math.PI/2,0,0],false);
    // A low broken earth bank, sloping to water; timber piles only at landings.
    const bankVertices=[],bankIndices=[];
    for(let i=0;i<=720;i++){
      const x=-180+i*.5,edge=9.05+Math.sin(x*.39)*.28+Math.sin(x*1.7)*.13;
      bankVertices.push(x,.224,side*10.35,x,-.53,side*edge);
      if(i<720){const n=i*2;bankIndices.push(n,n+1,n+2,n+1,n+3,n+2);}
    }
    const bankGeo=new THREE.BufferGeometry();bankGeo.setAttribute('position',new THREE.Float32BufferAttribute(bankVertices,3));bankGeo.setIndex(bankIndices);bankGeo.computeVertexNormals();mesh(stat,bankGeo,C.soil,[0,0,0],[0,0,0],false);
    const shore=[];
    for(let x=-175;x<175;x+=.37){let edge=9.05+Math.sin(x*.39)*.28+Math.sin(x*1.7)*.13;shore.push([x,.20,side*10.31],[x+.29,.21,side*(10.33+Math.sin(x)*.05)]);if(random()>.45)shore.push([x,.19,side*10.30],[x+.17,-.24,side*(edge+.34)]);}
    lines(stat,shore,true);
    for(const x of [-36,-24,-18,-14,19,30,43]){
      cylinder(stat,.05,.10,1.17,C.woodDark,x,.0,side*9.95,7);cylinder(stat,.046,.09,.92,C.wood,x+.62,-.12,side*9.81,7);
      for(let k=0;k<3;k++)pathLine(stat,[[x-.06,.36-k*.06,side*9.88],[x+.08,.36-k*.06,side*10.02]],true);
    }
    const ink=[];for(let i=0;i<1700;i++){const x=between(-65,65),z=side*between(10.6,48);if(Math.abs(x)<4&&Math.abs(z)<16)continue;const len=between(.06,.32);ink.push([x,.234,z],[x+len,.233,z+between(-.07,.07)]);}lines(stat,ink,true);
  }
  // Calm painted water. Wave marks travel only a little, preserving a scroll's stillness.
  const waterTex=new THREE.TextureLoader().load('./assets/water-ink.png');waterTex.colorSpace=THREE.SRGBColorSpace;waterTex.wrapS=waterTex.wrapT=THREE.RepeatWrapping;waterTex.repeat.set(42,2.15);waterTex.anisotropy=8;
  const water=mesh(dynamic,new THREE.PlaneGeometry(400,20.5),mat(C.water,{map:waterTex}),[0,-.52,0],[-Math.PI/2,0,0],false);
  const waterMarks=group(dynamic);const wm=[];
  for(let i=0;i<1400;i++){const x=between(-85,85),z=between(-9.6,9.6),len=between(.2,1.6);const p=[];for(let j=0;j<=8;j++)p.push([x+len*j/8,-.506,z+Math.sin(j/8*Math.PI)*between(.045,.085)]);for(let j=1;j<p.length;j++)wm.push(p[j-1],p[j]);}
  lines(waterMarks,wm,true);

  // Rainbow bridge: an uninterrupted timber arch and repeated interlocking inclined members.
  const bridge=group(stat),bridgeCrossMembers=[];
  for(let i=0;i<bridgeDeckCount;i++){
    const z=-13.8+i*bridgeDeckPitch,y=bridgeHeight(z),next=bridgeHeight(z+bridgeDeckPitch),angle=Math.atan2(next-y,bridgeDeckPitch),mid=z+bridgeDeckPitch/2;
    const plank=box(bridge,6.6,.15,(bridgeDeckPitch-.010)/Math.cos(angle),z%1>.5?C.woodLight:C.wood,0,(y+next)/2,mid);plank.rotation.x=-angle;plank.userData.bridgePlank={z:mid};
    for(let j=0;j<3;j++)pathLine(bridge,[[-2.9+j*1.8,bridgeDeckHeight(z+.07)+.001,z+.07],[-1.55+j*1.8,bridgeDeckHeight(z+.09)+.001,z+.09]],true);
  }
  for(const x of [-3.1,3.1]){
    const arch=new THREE.Shape();
    for(let i=0;i<=80;i++){const z=-13.8+i/80*27.6,y=bridgeHeight(z)-.16;i?arch.lineTo(z,y):arch.moveTo(z,y);}
    for(let i=80;i>=0;i--){const z=-13.8+i/80*27.6;arch.lineTo(z,bridgeHeight(z)-.52);}arch.closePath();
    mesh(bridge,new THREE.ExtrudeGeometry(arch,{depth:.24,bevelEnabled:false}),C.woodLight,[x-.12,0,0],[0,Math.PI/2,0]);
    for(let z=-13.3;z<=13.3;z+=1.25){const y=bridgeHeight(z);cylinder(bridge,.075,.095,1.02,C.woodDark,x,y+.5,z,8);box(bridge,.21,.095,.21,C.wood,x,y+1.02,z);}
    for(let z=-13.3;z<13.3;z+=.55){const zz=Math.min(z+.55,13.3);for(const h of [.29,.46,.63,.89])beam(bridge,[x,bridgeHeight(z)+h,z],[x,bridgeHeight(zz)+h,zz],h===.89?.075:.033,h===.89?.075:.038,C.woodDark,h===.89);}
    // Slender diagonal braces and the stacked rails are legible in the original bridge detail.
    for(let z=-13.3;z<12.8;z+=1.25){
      const zz=Math.min(z+.40,13.3),inner=x-Math.sign(x)*.07;
      beam(bridge,[inner,bridgeHeight(z)+.88,z],[inner,bridgeHeight(zz)+.08,zz],.044,.051,C.wood,false);
      for(const h of [.29,.63,.89])pathLine(bridge,[[x-Math.sign(x)*.092,bridgeHeight(z)+h-.025,z-.015],[x-Math.sign(x)*.092,bridgeHeight(z)+h+.02,z+.013]],true);
    }
    for(let z=-13.7;z<13.6;z+=.55){const zz=z+.55;beam(bridge,[x,bridgeHeight(z)-.32,z],[x,bridgeHeight(zz)-.32,zz],.28,.26,C.woodDark);}
    // Layers of crossing chord segments; visible on both sides of the arch.
    for(let z=-12.5;z<11.5;z+=2.1){const zz=Math.min(z+4.2,13.3);beam(bridge,[x,bridgeHeight(z)-.42,z],[x,bridgeHeight(zz)-.42,zz],.27,.31,C.wood);
      const mid=(z+zz)/2;beam(bridge,[x-.13,bridgeHeight(mid)-.82,mid],[x+.13,bridgeHeight(mid)+.02,mid],.23,.25,C.woodDark);}
  }
  for(let z=-12;z<=12;z+=1.85){const y=bridgeHeight(z);bridgeCrossMembers.push(beam(bridge,[-3.55,y-.29,z],[3.55,y-.29,z],.2,.26,C.woodDark));}
  for(const x of [-2,0,2])for(let z=-13;z<13;z+=.75)beam(bridge,[x,bridgeHeight(z)-.20,z],[x,bridgeHeight(z+.75)-.20,z+.75],.14,.2,C.woodDark,false);

  dressBridge(bridge,bridgeHeight);
  const bridgeCraft=dressBridgeCraft(bridge,bridgeHeight,{crossMembers:bridgeCrossMembers});

  // The very slender tall posts and hanging strips are visible punctuation in the original bridge market.
  for(const [x,z] of [[-4.2,13.9],[4.4,14.8],[-4.3,-14.5],[4.0,-14.3]]){
    cylinder(stat,.036,.075,6.7,C.woodDark,x,3.56,z,8);
    beam(stat,[x-.55,6.28,z],[x+.55,6.28,z],.055,.045,C.woodDark);
    beam(stat,[x-.30,6.6,z-.26],[x+.30,6.6,z+.26],.04,.04,C.woodDark);
    for(const dx of [-.35,.35]){
      const geo=new THREE.PlaneGeometry(.22,1.6,3,14);const p=geo.attributes.position;
      for(let i=0;i<p.count;i++){let yy=p.getY(i);p.setZ(i,Math.sin(yy*3+dx)*.035);p.setX(i,p.getX(i)+Math.sin(yy*2+dx)*.025);}geo.computeVertexNormals();
      const strip=mesh(dynamic,geo,fabric(dx<0?C.cloth:C.blueDark),[x+dx,5.45,z],[0,0,0],false);
      banners.push({strip,base:new Float32Array(p.array),phase:x*.4+z*.1+dx});
    }
  }

  let basketIndex=0;
  function basket(parent,x,y,z,r=.32,h=.4,filled=false){
    // Retain the old scene's random stream; craft uses its own stable seed.
    if(filled)for(let i=0;i<39;i++)random();
    parent.updateWorldMatrix(true,false);const place=parent.localToWorld(new THREE.Vector3(x,y,z)),index=basketIndex++;
    return closeBasket(parent,{x,y,z,r,h,filled,seed:4109+index*139,
      far:!!parent.userData.far||Math.abs(place.x)>34||Math.abs(place.z)>34,
      handle:h>.30&&index%3===0?'ears':false});
  }
  function jar(parent,x,y,z,r=.25,h=.6,color=C.woodDark){
    const pts=[[0,0],[r*.62,0],[r*.93,h*.13],[r,h*.45],[r*.9,h*.70],[r*.47,h*.84],[r*.44,h],[r*.56,h]];
    mesh(parent,new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),32),ceramic(color),[x,y,z],[0,0,0],false);
    cylinder(parent,r*.54,r*.54,.035,C.woodLight,x,y+h+.02,z,12);
    mesh(parent,new THREE.TorusGeometry(r*.50,.010,5,32),ceramic(color),[x,y+h-.005,z],[Math.PI/2,0,0],false);
  }
  function bowl(parent,x,y,z,r=.12,filled=false){
    const pts=[[0,0],[r*.43,0],[r*.47,r*.09],[r*.65,r*.15],[r*.94,r*.50],[r,r*.64],[r*.93,r*.64],[r*.87,r*.49],[r*.58,r*.19],[0,r*.14]];
    mesh(parent,new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(...p)),28),ceramic(C.cloth),[x,y,z],[0,0,0],false);
    mesh(parent,new THREE.TorusGeometry(r*.966,.004,4,28),ceramic(C.woodDark),[x,y+r*.638,z],[Math.PI/2,0,0],false);
    if(filled)cylinder(parent,r*.77,r*.77,.003,ceramic('#9b906b'),x,y+r*.42,z,28,false);
  }
  function ewer(parent,x,y,z,r=.105,h=.26,rotation=.3){
    const g=group(parent,x,y,z,rotation),clay=ceramic(C.roofDark);
    const profile=[[0,0],[r*.59,0],[r*.83,h*.09],[r,h*.36],[r*.97,h*.53],[r*.82,h*.65],[r*.47,h*.76],[r*.42,h*.91],[r*.52,h*.93]];
    mesh(g,new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),32),clay,[0,0,0],[0,0,0],false);
    mesh(g,new THREE.LatheGeometry([[0,h*1.02],[r*.19,h*1.02],[r*.39,h*.97],[r*.53,h*.95],[r*.53,h*.93],[0,h*.93]].map(p=>new THREE.Vector2(...p)),28),clay,[0,0,0],[0,0,0],false);
    mesh(g,new THREE.SphereGeometry(r*.13,12,8),clay,[0,h*1.047,0],[0,0,0],false);
    const handle=new THREE.CatmullRomCurve3([new THREE.Vector3(-r*.75,h*.66,0),new THREE.Vector3(-r*1.63,h*.83,0),new THREE.Vector3(-r*1.80,h*.42,0),new THREE.Vector3(-r*.91,h*.25,0)]);
    mesh(g,new THREE.TubeGeometry(handle,20,r*.085,7,false),clay,[0,0,0],[0,0,0],false);
    const spout=new THREE.CatmullRomCurve3([new THREE.Vector3(r*.81,h*.51,0),new THREE.Vector3(r*1.18,h*.59,0),new THREE.Vector3(r*1.44,h*.87,0),new THREE.Vector3(r*1.69,h*.96,0)]);
    const geo=new THREE.TubeGeometry(spout,18,r*.14,10,false),pos=geo.attributes.position;
    for(let i=0;i<=18;i++){const center=spout.getPointAt(i/18),taper=1-i/18*.55;for(let j=0;j<=10;j++){const k=i*11+j;pos.setXYZ(k,center.x+(pos.getX(k)-center.x)*taper,center.y+(pos.getY(k)-center.y)*taper,center.z+(pos.getZ(k)-center.z)*taper);}}
    geo.computeVertexNormals();mesh(g,geo,clay,[0,0,0],[0,0,0],false);
  }
  function bundle(parent,x,y,z,w,h,d){return tiedBale(parent,x,y,z,w,h,d);}
  function table(parent,x,y,z,w=1.4,d=.75){
    softBox(parent,w,.075,d,C.woodLight,x,y+.76,z);
    const grain=[];
    for(let k=1;k<4;k++){let zz=z-d/2+d*k/4;grain.push([x-w/2+.02,y+.801,zz],[x+w/2-.02,y+.801,zz]);}
    for(let k=0;k<12;k++){let zz=z-d*.43+random()*d*.86,xx=x-w*.44+random()*w*.50;grain.push([xx,y+.801,zz],[xx+w*(.10+random()*.2),y+.801,zz+random()*.003]);}
    lines(parent,grain,true);
    for(const xx of [-1,1])for(const zz of [-1,1]){
      const px=x+xx*(w/2-.13),pz=z+zz*(d/2-.11);
      cylinder(parent,.039,.030,.72,C.woodDark,px,y+.37,pz,8);
      box(parent,.084,.08,.09,C.wood,px,y+.68,pz,false);
      beam(parent,[px,y+.60,pz],[px-xx*.18,y+.72,pz],.035,.028,C.wood,false);
    }
    for(const zz of [-1,1]){
      box(parent,w-.22,.11,.04,C.wood,x,y+.64,z+zz*(d/2-.095),false);
      pathLine(parent,[[x-w/2+.15,y+.695,z+zz*(d/2-.069)],[x+w/2-.15,y+.695,z+zz*(d/2-.069)]],true);
    }
    beam(parent,[x-w/2+.1,y+.25,z],[x+w/2-.1,y+.25,z],.055,.055,C.woodDark);
    parent.updateWorldMatrix(true,false);const p=parent.localToWorld(new THREE.Vector3(x,0,z));collider(p.x,p.z,w,d);
  }
  function bench(parent,x,y,z,w=1.2){
    softBox(parent,w,.06,.25,C.woodLight,x,y+.41,z);
    for(const xx of [-1,1]){beam(parent,[x+xx*(w/2-.11),y+.025,z],[x+xx*(w/2-.18),y+.40,z],.075,.16,C.woodDark);}
    beam(parent,[x-w/2+.15,y+.20,z],[x+w/2-.15,y+.20,z],.055,.045,C.wood,false);
    pathLine(parent,[[x-w/2+.02,y+.443,z-.03],[x+w/2-.02,y+.443,z-.035]],true);
  }
  let parasolIndex=0;
  function umbrella(parent,x,y,z,r=1.45){
    cylinder(parent,.027,.036,2.65,C.woodDark,x,y+1.325,z,12,false);
    const vertices=[],uv=[],indices=[],segments=56,rings=10;
    const profile=t=>2.65-.49*t-.08*t*t;
    for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
      const t=j/rings,a=i/segments*Math.PI*2,rr=r*t*(1-.018*Math.sin(a*7)**2*t*t);
      vertices.push(x+rr*Math.cos(a),y+profile(t)+Math.sin(a*14)*.006*t,z+rr*Math.sin(a));uv.push(.5+.5*t*Math.cos(a),.5+.5*t*Math.sin(a));
    }
    for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){let n=j*(segments+1)+i;indices.push(n,n+segments+1,n+1,n+1,n+segments+1,n+segments+2);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(parent,geo,parasolMaterial(parasolIndex++),[0,0,0],[0,0,0],false);
    const ribs=[];
    for(let i=0;i<28;i++){
      const a=i/28*Math.PI*2,pts=[];for(let j=0;j<=12;j++){const t=j/12,rr=r*t*(1-.018*Math.sin(a*7)**2*t*t);pts.push([x+rr*Math.cos(a),y+profile(t)+.009,z+rr*Math.sin(a)]);}for(let j=1;j<pts.length;j++)ribs.push(pts[j-1],pts[j]);
      const ribCurve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1]-.029,p[2])));
      mesh(parent,new THREE.TubeGeometry(ribCurve,16,.007,5,false),C.woodLight,[0,0,0],[0,0,0],false);
      if(i%2===0){
        const rr=r*.62,px=x+rr*Math.cos(a),pz=z+rr*Math.sin(a),yy=y+profile(.62)-.02;
        beam(parent,[x+Math.cos(a)*.05,y+1.915,z+Math.sin(a)*.05],[px,yy,pz],.010,.014,C.woodLight,false);
        // A short silk tie binds the folding strut to its main rib.
        const ties=[];for(let k=0;k<=22;k++){const theta=k/22*Math.PI*4,along=(k/22-.5)*.019,cross=Math.cos(theta)*.012;ties.push([px+Math.cos(a)*along-Math.sin(a)*cross,yy+Math.sin(theta)*.012,pz+Math.sin(a)*along+Math.cos(a)*cross]);}hempRope(parent,ties,.0018,25);
      }
    }
    const rim=[];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,rr=r*(1-.018*Math.sin(a*7)**2);rim.push([x+rr*Math.cos(a),y+profile(1),z+rr*Math.sin(a)]);}pathLine(parent,rim,true);lines(parent,ribs,true);
    cylinder(parent,.031,.052,.15,C.woodDark,x,y+2.72,z,12,false);
    cylinder(parent,.063,.067,.072,C.woodLight,x,y+2.602,z,20,false);
    cylinder(parent,.055,.061,.11,C.woodLight,x,y+1.915,z,16,false);
    cylinder(parent,.039,.041,.026,C.woodDark,x,y+1.83,z,12,false);
    for(const hh of [1.868,1.958,2.58])mesh(parent,new THREE.TorusGeometry(hh>2.5?.064:.058,.0027,4,24),C.woodDark,[x,y+hh,z],[Math.PI/2,0,0],false);
    // Socket ring where the pole passes through the market table.
    mesh(parent,new THREE.TorusGeometry(.041,.0045,5,24),C.woodDark,[x,y+.802,z],[Math.PI/2,0,0],false);
    beam(parent,[x-.03,y+1.812,z],[x+.063,y+1.812,z],.008,.01,C.woodLight,false);
  }
  function awning(parent,w,d,y){
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,y,.1,w/2,y,.1,-w/2,y-.5,d,w/2,y-.5,d],3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();mesh(parent,geo,C.clothDark,[0,0,0],[0,0,0],false);
    const ink=[];for(let x=-w/2;x<=w/2;x+=.30)ink.push([x,y+.01,.1],[x,y-.49,d]);lines(parent,ink,true);
    for(const x of [-w/2,w/2])beam(parent,[x,.25,d],[x,y-.4,d],.07,.07,C.woodDark);beam(parent,[-w/2,y-.5,d],[w/2,y-.5,d],.08,.08,C.woodDark);
  }
  function bridgeShade(x,z){
    const yy=bridgeDeckHeight(z),g=group(stat,x,yy,z),w=1.62,d=1.50;
    const top=zz=>2.05+zz*.12;
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,top(-d/2),-d/2,w/2,top(-d/2),-d/2,-w/2,top(d/2),d/2,w/2,top(d/2),d/2],3));geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,1,1,1],2));geo.setIndex([0,2,1,1,2,3]);geo.computeVertexNormals();mesh(g,geo,wicker(),[0,0,0],[0,0,0],false);
    for(const xx of [-w/2+.08,w/2-.08])for(const zz of [-d/2+.08,d/2-.08]){
      beam(g,[xx,bridgeDeckHeight(z+zz)-yy,zz],[xx,top(zz)+.04,zz],.038,.043,C.woodDark);
      beam(g,[xx,top(zz)-.40,zz],[xx-Math.sign(xx)*.26,top(zz),zz],.027,.026,C.woodDark,false);
    }
    for(const zz of [-d/2,d/2])beam(g,[-w/2-.06,top(zz)+.015,zz],[w/2+.06,top(zz)+.015,zz],.04,.045,C.woodDark);
    for(const xx of [-w/2,w/2])beam(g,[xx,top(-d/2)+.015,-d/2-.06],[xx,top(d/2)+.015,d/2+.06],.039,.04,C.woodDark);
    // Crossed reeds and an uneven woven surface echo the rectangular bridge stalls.
    for(let xx=-w/2+.12;xx<w/2;xx+=.16)pathLine(g,[[xx,top(-d/2)+.018,-d/2],[xx+.015,top(d/2)+.018,d/2]],true);
    for(let zz=-d/2+.12;zz<d/2;zz+=.14)pathLine(g,[[-w/2,top(zz)+.02,zz],[w/2,top(zz)+.02,zz+.009]],true);
    beam(g,[-w/2,top(-d/2)+.029,-d/2],[w/2,top(d/2)+.029,d/2],.021,.027,C.woodDark,false);
    beam(g,[-w/2,top(d/2)+.032,d/2],[w/2,top(-d/2)+.032,-d/2],.021,.027,C.woodDark,false);
  }

  function shop(x,z,w,d,rotation=0,type='goods',height=3.0,hip=false){
    const g=group(stat,x,.22,z,rotation);const front=d/2;let teaFurniture=[];
    shopSites.push({x,z,w,d,rotation,type});
    g.userData.far=Math.abs(x)>43||Math.abs(z)>37;
    g.userData.roofDetail=Math.abs(x)<29&&Math.abs(z)<32;
    box(g,w,.22,d,C.stone,0,.10,0);box(g,w,.14,d,C.woodDark,0,.25,0);
    box(g,w-.15,height-.35,.14,C.wall,0,height*.5,-front+.07);
    for(const side of [-1,1]){
      if(g.userData.far)box(g,.13,height-.3,d,C.plaster,side*w/2,height*.5,0);
      else{
        // Four wall panels surround an actual open window. The old dark
        // rectangle on a continuous wall could never reveal the interior.
        const low=-d*.20-.1,high=d*.20-.1,lower=.15,top=height-.15;
        box(g,.13,1.19,d,C.plaster,side*w/2,(lower+1.34)/2,0,false);
        box(g,.13,top-2.14,d,C.plaster,side*w/2,(top+2.14)/2,0,false);
        box(g,.13,.80,low+front,C.plaster,side*w/2,1.74,(-front+low)/2,false);
        box(g,.13,.80,front-high,C.plaster,side*w/2,1.74,(front+high)/2,false);
      }
    }
    for(let xx=-w/2;xx<=w/2+.01;xx+=w/4){cylinder(g,.073,.087,height,C.woodDark,xx,height/2,front,8);beam(g,[xx,height-.35,front],[xx+(xx>0?-.36:.36),height-.07,front],.067,.067,C.wood);}
    for(const zz of [-front,front])beam(g,[-w/2,height-.06,zz],[w/2,height-.06,zz],.17,.14,C.woodDark);
    // Rafters and their purlins are generated together by roof(); the shop
    // columns carry modest bracket blocks rather than a second rafter grid.
    for(let xx=-w/2;xx<=w/2+.01;xx+=w/4){box(g,.30,.10,.26,C.wood,xx,height-.20,front);box(g,.15,.14,.38,C.woodDark,xx,height-.10,front+.015);}
    // Open storefronts, fitted shutters to one side, and fine lattice in the other bay.
    const shutterCount=Math.ceil(w*.25/.17),shutterWidth=w*.25/shutterCount;
    for(let j=0;j<shutterCount;j++){
      const xx=w*.24+(j+.5)*shutterWidth;
      softBox(g,shutterWidth-.009,1.43+(j%3)*.007,.052,j%3?C.wood:C.woodLight,xx,1.04,front-.025,.004);
    }
    for(const yy of [.52,1.49])box(g,w*.25,.065,.045,C.woodDark,w*.365,yy,front-.064,false);
    if(type!=='tea'){
      const center=-w*.36,bw=w*.23,frontZ=front-.036;
      box(g,bw,.065,.09,C.woodLight,center,.855,frontZ,false);box(g,bw,.065,.07,C.wood,center,1.985,frontZ,false);
      for(const xx of [center-bw/2,center+bw/2])box(g,.044,1.16,.075,C.wood,xx,1.42,frontZ,false);
      box(g,bw,.45,.055,C.wood,center,.59,frontZ-.016,false);
      for(let yy=1.02;yy<1.97;yy+=.18)box(g,bw,.018,.024,C.woodLight,center,yy,frontZ+.011,false);
      for(let xx=center-bw/2+.12;xx<center+bw/2;xx+=.14)box(g,.016,1.08,.022,C.woodLight,xx,1.42,frontZ+.016,false);
    }
    roof(g,w,d,height,1.25+random()*.35,hip);
    if(type==='tea'){
      sign(g,'茶',.51,1.25,-w*.4,2.18,front+.17,true,true);
      beam(g,[-w*.4,height-.15,front],[-w*.4,height-.15,front+.8],.075,.075,C.woodDark);
      awning(group(g,0,0,front),w*.88,2.4,height-.25);
      for(const tx of [-1.2,1.2]){table(g,tx,0,front+1.05,1.5,.8);bench(g,tx,0,front+1.8);bench(g,tx,0,front+.3);dressTeaTable(g,tx,.807,front+1.05,tx<0?0:1);}
      jar(g,w*.38,0,front+.75,.34,.8);basket(g,-w*.48,0,front+.6,.4,.55);
      for(const tx of [-w*.26,w*.26]){
        table(g,tx,.26,-.1,1.42,.78);bench(g,tx,.26,.65);bench(g,tx,.26,-.82);
        dressTeaTable(g,tx,1.068,-.1,tx<0?2:3);
      }
      teaFurniture=furnishTea(g,w,d);
    }else if(type==='goods'){
      table(g,-.35,.25,front+.27,w*.55,.82);for(let i=0;i<6;i++)basket(g,-w*.23+i*.45,1.1,front+.35,.18,.19,i%2===0);for(let i=0;i<3;i++)jar(g,-w*.32+i*.52,.26,front+1,.20,.52,i%2?C.roof:C.woodDark);
      sign(g,'雜貨',1.18,.4,0,height-.45,front+.14,false);
    }else if(type==='inn'){
      sign(g,'腳店',.61,1.4,-w*.40,height-1.05,front+.17,true,true);
      beam(g,[-w*.40,height-.20,front],[-w*.40,height-.20,front+.36],.045,.052,C.woodDark,false);
      beam(g,[-w*.40-.25,height-.20,front+.17],[-w*.40+.25,height-.20,front+.17],.025,.025,C.woodDark,false);
      for(const dx of [-.19,.19])hempRope(g,[[-w*.40+dx,height-.20,front+.17],[-w*.40+dx,height-.35,front+.17]],.004,4);
      bench(g,0,.26,front+.55,w*.72);basket(g,w*.42,.26,front+.7,.35,.5);
    }else if(type==='cloth'){
      table(g,.1,.25,front+.12,w*.58,1.0);
      sign(g,'布帛',1.1,.4,0,height-.45,front+.14);
      for(let i=0;i<4;i++)foldedCloth(g,-1.0+i*.66,1.052,front+.08,.54,.72,[0,1,4,3][i],.06);
      for(let i=0;i<4;i++)foldedCloth(g,.98+.014*Math.sin(i),1.118+i*.066,front+.12,.56,.51,i%2?0:1,.06);
    }
    if(Math.abs(x)<39&&Math.abs(z)<33){
      // Two shallow shelves make the dim shop interior worth looking into.
      const sx=-w*.17,sz=-front+.42;
      for(const sy of [.9,1.65]){
        box(g,w*.60,.055,.51,C.woodLight,sx,sy,sz);
        for(const xx of [sx-w*.27,sx+w*.27])beam(g,[xx,.35,sz],[xx,2.17,sz],.065,.075,C.woodDark,false);
        if(type==='tea')dressTeaShelf(g,sx,sy,sz,w*.60,sy>1?1:0);
        else for(let j=0;j<5;j++){
          const xx=sx-w*.24+j*w*.115;
          if(type==='cloth')for(let k=0;k<3;k++)foldedCloth(g,xx,sy+.029+k*.049,sz,.46,.34,(j+k)%3,.043);
          else jar(g,xx,sy+.04,sz,.10+(j%2)*.045,.22+(j%3)*.055,j%2?C.roofDark:C.clothDark);
        }
      }
      // A hanging bamboo blind covers one bay with thin reeds and tie cords.
      const bx=w*.34,bz=front+.10,bw=w*.23,bh=.72;
      for(let i=0;i<17;i++)beam(g,[bx-bw/2,height-.48-i*bh/17,bz],[bx+bw/2,height-.48-i*bh/17,bz],.018,.021,C.basket,false);
      for(const dx of [-bw*.28,bw*.28])pathLine(g,[[bx+dx,height-.35,bz+.015],[bx+dx,height-1.23,bz+.015]],true);
      g.updateWorldMatrix(true,false);const pos=g.localToWorld(new THREE.Vector3(-w*.04,.29,front-.48));shopkeepers.push({x:pos.x,z:pos.z,y:pos.y,heading:rotation});
    }
    dressShop(g,w,d,height,type);
    // Patchy plaster brush marks and exposed lower boards.
    const marks=[];for(let i=0;i<45;i++){let xx=between(-w/2,w/2),yy=between(.4,height-.3);marks.push([xx,yy,-front-.004],[xx+between(.03,.18),yy+between(-.04,.04),-front-.004]);}lines(g,marks,true);
    if(type==='tea'){
      // Keep the central doorway and interior walkable; walls and furniture retain collision.
      const c=Math.cos(rotation),ss=Math.sin(rotation);
      const localCollider=(xx,zz,ww,dd)=>collider(x+xx*c+zz*ss,z-xx*ss+zz*c,Math.abs(c)*ww+Math.abs(ss)*dd,Math.abs(ss)*ww+Math.abs(c)*dd);
      localCollider(0,-front,w,.18);localCollider(-w/2,0,.16,d);localCollider(w/2,0,.16,d);
      localCollider(w*.365,front,w*.25,.14);
      for(let xx=-w/2;xx<=w/2+.01;xx+=w/4)localCollider(xx,front,.14,.14);
      for(const c of teaFurniture)localCollider(c.x,c.z,c.w,c.d);
    }else collider(x,z,Math.abs(Math.cos(rotation))*w+Math.abs(Math.sin(rotation))*d,Math.abs(Math.sin(rotation))*w+Math.abs(Math.cos(rotation))*d);
    return g;
  }

  // Buildings gather along a gently bent market street, keeping the bridge's approach open.
  shop(-10,27,6.7,5.2,Math.PI,'goods',3.0);
  shop(-17.2,27.8,6.5,5.4,Math.PI,'cloth',3.05);
  shop(-24,29,6.1,5,Math.PI,'inn',2.8);
  shop(-31.1,30,7.2,5.8,Math.PI,'goods',3.3,true);
  shop(13.5,28,7.3,5.8,Math.PI,'tea',3.05);
  shop(21.5,28.2,7.1,5.5,Math.PI,'goods',3.0);
  shop(29,29.7,6.1,6,Math.PI,'cloth',3.1);
  shop(37,30.5,8,6.4,Math.PI,'inn',3.6,true);
  shop(-13.8,16.9,6,4.3,0,'goods',2.65);
  shop(11.5,15.6,5.7,3.6,0,'inn',2.65);
  shop(27,16.6,6.2,4.0,0,'goods',2.5);
  shop(.3,33.6,8.2,5.6,Math.PI,'goods',3.35,true);
  shop(6.9,35.2,4.6,4.8,Math.PI,'cloth',2.75);
  // Opposite bank's rhythm of low eaves and a modest two-level inn.
  shop(-10.7,-23,6.7,5.1,0,'inn',3.2,true);
  shop(-18,-24,6.4,5.8,0,'goods',2.95);
  shop(-25.2,-24.7,7,5.2,0,'cloth',3.0);
  shop(10.2,-22.8,6.6,5.4,0,'goods',3.2);
  shop(17.6,-24,6.3,5.2,0,'tea',2.8);
  shop(26,-26,8.1,6.1,0,'inn',4.2,true);
  shop(.5,-29.7,7.5,5.2,0,'cloth',3.05,true);
  for(let i=0;i<9;i++)shop(-44+i*11,45+Math.sin(i)*3,8.3,7.1,Math.PI,'inn',2.8+random(),i%3===0);
  for(let i=0;i<9;i++)shop(-46+i*11,-41-Math.cos(i)*3,7.9,6.6,0,'goods',2.9+random(),i%4===0);

  // Riverfront roofs continue into the pale distance; the playable scene stays compact.
  for(const side of [-1,1])for(const dir of [-1,1])for(let i=0;i<7;i++){
    const x=dir*(48+i*10.1),z=side*(16.7+(i%3)*2.3);
    shop(x,z,7.0+random()*1.5,4.2+random(),side>0?0:Math.PI,i%3===0?'cloth':'goods',2.5+random()*.5,i%4===0);
  }

  // Foreground market: baskets, shaded tables, handcarts, poles, fabric and pottery.
  const stallPositions=[[-6.8,17.6,1.3],[5.8,17,1.2],[-5.3,-16.4,1.3],[5.4,-17,1.4],[.8,28.5,1.4],[-4.8,26.8,1.10],[3.8,-23.2,1.12]];
  for(const [index,v] of stallPositions.entries()){
    const g=group(stat,v[0],.22,v[1]);umbrella(g,0,0,0,v[2]);table(g,0,0,0,1.7,.9);
    const trade=index%4;
    if(trade===0){
      for(let i=0;i<4;i++)basket(g,-.58+i*.38,.82,.1,.17,.16,['pear','apple','plum','turnip'][i]);
    }else if(trade===1){
      // Nested bowls and small glazed jars: the quiet pale and dark ceramic washes.
      for(let i=0;i<4;i++){const x=-.58+i*.38;for(let k=0;k<3+(i%2);k++)bowl(g,x,.81+k*.045,.08,.12+(i%2)*.015);}
      jar(g,-.56,.81,-.23,.10,.27,C.roofDark);jar(g,.22,.81,-.21,.105,.28,C.cloth);jar(g,.59,.81,-.22,.08,.22,C.clothDark);
      for(let i=0;i<3;i++)jar(g,-.56+i*.52,0,.63,.18,.45,i%2?C.roofDark:C.clothDark);
    }else if(trade===2){
      // Cloth wound around narrow cores, folded pieces and a soft hanging length.
      for(let i=0;i<5;i++){
        const x=-.56+(i%3)*.53,z=-.21+Math.floor(i/3)*.28;
        fabricRoll(g,x,.800,z,.43,.093,i,(i%2-.5)*.035);
      }
      for(let i=0;i<4;i++)foldedCloth(g,.54,.807+i*.039,.28,.46,.30,i%2?0:1,.033);
      drapedCloth(g,.37,.801,.18,.54,.27,.45,0);
    }else{
      // One low serving basket; the right side remains clear for the steamer.
      basket(g,-.39,.800,-.10,.27,.082);
      for(let i=0;i<7;i++){
        const a=i?i*Math.PI/3+.11:0,rr=i?.142:0;
        steamedBun(g,-.39+Math.cos(a)*rr,.814,-.10+Math.sin(a)*rr,.057,530+i*217);
      }
      basket(g,.76,0,.62,.25,.50);mesh(g,new THREE.TorusGeometry(.25,.016,5,24),C.woodDark,[.76,.51,.62],[Math.PI/2,0,0],false);
    }
    basket(g,.8,0,.4,.35,.4);collider(v[0],v[1],1.6,.85);
  }
  for(const v of [[-2.3,7.5],[2.3,-6.6],[-2.25,-.5]]){const yy=bridgeDeckHeight(v[1]);table(stat,v[0],yy,v[1],1.10,.56);for(let i=0;i<3;i++)bowl(stat,v[0]-.3+i*.3,yy+.82,v[1],.10);basket(stat,v[0]+.38,yy,v[1]+.3,.24,.28);collider(v[0],v[1],1.1,.6);}

  // The bridge itself is a street: low stalls hug the rails, leaving the middle open.
  for(const [x,z,r] of [[2.25,8.6,.90],[-2.25,2.6,.87],[2.28,-3.2,.84],[-2.25,-9.5,.9]]){
    const yy=bridgeDeckHeight(z);if(z===2.6||z===-3.2)bridgeShade(x,z);else umbrella(stat,x,yy,z,r);table(stat,x,yy,z,.91,.66);
    for(let i=0;i<3;i++){bowl(stat,x-.28+i*.26,yy+.85,z,.10);jar(stat,x-.23+i*.24,yy+.83,z+.15,.074,.16,i%2?C.cloth:C.roofDark);}
  }
  for(const [x,z] of [[-2.25,5.1],[2.2,1.5],[-2.25,-5.5]]){
    const yy=bridgeDeckHeight(z);const mat=box(stat,.95,.025,.7,C.clothDark,x,yy+.013,z,false);mat.rotation.x=-Math.atan2(bridgeDeckHeight(z+.35)-bridgeDeckHeight(z-.35),.7);
    basket(stat,x,yy+.028,z,.22,.19,true);basket(stat,x-.3,bridgeDeckHeight(z+.3)+.028,z+.3,.18,.18);looseCollider(x,z,.95,.7);
  }

  // Small trades at the bridge foot: cloth laid on earth, crockery and bundles.
  for(const [x,z,angle] of [[-4.4,15.2,.22],[4.8,20.1,-.2],[-7.2,24,.1],[3.6,-14.8,-.12]]){
    const g=group(stat,x,.24,z,angle);box(g,1.7,.014,1.12,C.clothDark,0,.013,0,false);
    for(let i=0;i<6;i++){const xx=(i%3-.9)*.43,zz=Math.floor(i/3)*.45-.23;jar(g,xx,.035,zz,.12+(i%2)*.02,.22+(i%3)*.06,i%2?C.roofDark:C.cloth);}
    basket(g,-1.0,.0,.45,.3,.35);bench(g,0,.0,-.82,1.1);
    const c=Math.abs(Math.cos(angle)),sn=Math.abs(Math.sin(angle));looseCollider(x,z,1.7*c+1.12*sn,1.7*sn+1.12*c);
  }
  for(const [x,z] of [[-3.5,19.1],[3.9,14.6],[8,20.3],[-9,12.1],[-20,12.4]]){
    basket(stat,x,.23,z,.34,.40,true);basket(stat,x+.55,.23,z+.27,.27,.33);
    looseCollider(x,z,.60,.60);looseCollider(x+.55,z+.27,.50,.50);
    beam(stat,[x-.2,.65,z-.15],[x+.85,.58,z+.12],.033,.045,C.woodDark);
    for(const xx of [x,x+.55])for(const dz of [-.12,.12])pathLine(stat,[[xx,.64-(xx-x)*.07,z+(xx-x)*.49-.14],[xx+.035,.51,z+(xx-x)*.49+dz]],true);
  }
  // Folded reed matting and closely tied bales beside the landing.
  for(let i=0;i<7;i++){const n=i===6?0:i,x=-22+(n%3)*.72,z=11.4+Math.floor(n/3)*.7,y=.25+(i===6?.43:0);bundle(stat,x,y,z,.64,.42,.6);}

  looseCollider(-21.28,11.75,2.08,1.30);

  function cart(x,z,angle=0){
    detailedCart(stat,x,.22,z,angle);
    const ca=Math.cos(angle),sa=Math.sin(angle);
    for(const side of [-1,1]){
      const ax=side*.45,az=-.83,bx=side*.50,bz=-2.90;
      walkSegments.push({a:[x+ax*ca+az*sa,z-ax*sa+az*ca],b:[x+bx*ca+bz*sa,z-bx*sa+bz*ca],r:.046});
    }
    const c=Math.abs(Math.cos(angle)),sn=Math.abs(Math.sin(angle));collider(x,z,1.72*c+1.85*sn,1.72*sn+1.85*c);
  }
  cart(-22,19,.5);cart(24,22,-.3);cart(8,-16,.8);

  function boat(x,z,length=12,width=3,angle=0,canopy=true){
    const g=group(dynamic,x,-.42,z,angle);
    const detailed=Math.abs(x)<25,hatch=detailed?{x:width>3.5?-3.72:length*.32,z:.18,w:.80,d:.69}:null;
    g.userData.hatch=hatch;g.userData.cargo=width>3.5;
    const ribs=32,profiles=[[-1,0],[-.955,.30],[-.78,.72],[-.60,1],[.60,1],[.78,.72],[.955,.30],[1,0]];
    const half=t=>width*.5*((width>3.5?.5:.14)+(width>3.5?.5:.86)*Math.pow(Math.max(0,Math.sin(Math.PI*t)),width>3.5?.40:.42));
    const sheer=t=>.84+.27*Math.pow(Math.abs(t*2-1),3);
    const bottom=t=>-.38+.43*Math.pow(Math.abs(t*2-1),4);
    const vertices=[],uvs=[],indices=[];
    for(let j=0;j<=ribs;j++){
      const t=j/ribs,xx=(t-.5)*length;
      for(const [zz,f] of profiles){vertices.push(xx,THREE.MathUtils.lerp(sheer(t),bottom(t),f),half(t)*zz);uvs.push(f*(sheer(t)-bottom(t))/.42,xx/2.8);}
    }
    for(let j=0;j<ribs;j++)for(let k=0;k<profiles.length-1;k++){const n=j*profiles.length+k;indices.push(n,n+profiles.length,n+1,n+1,n+profiles.length,n+profiles.length+1);}
    const hullGeo=new THREE.BufferGeometry();hullGeo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));hullGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));hullGeo.setIndex(indices);hullGeo.computeVertexNormals();mesh(g,hullGeo,C.wood,[0,0,0],[0,0,0],false);
    // Narrow end boards, swept gunwales and seams follow the hull rather than a rectangular box.
    for(const t of [0,1]){
      const xx=(t-.5)*length,cap=[],idx=[];
      for(const [zz,f] of profiles)cap.push(xx,THREE.MathUtils.lerp(sheer(t),bottom(t),f),half(t)*zz);
      cap.push(xx,(sheer(t)+bottom(t))*.5,0);
      for(let j=0;j<profiles.length;j++)idx.push(profiles.length,j,(j+1)%profiles.length);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(cap,3));const uv=[];for(let j=0;j<cap.length;j+=3)uv.push(cap[j+2]/(half(t)*2)+.5,(cap[j+1]-bottom(t))/(sheer(t)-bottom(t)));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(g,geo,endWood(C.wood),[0,0,0],[0,0,0],false);
      beam(g,[xx,sheer(t),-half(t)],[xx,sheer(t),half(t)],.065,.08,C.woodDark,false);
    }
    for(const side of [-1,1]){
      const gunwale=[];
      for(let j=0;j<=ribs;j++){const t=j/ribs;gunwale.push([(t-.5)*length,sheer(t)+.016,side*(half(t)+.012)]);}
      for(let j=1;j<gunwale.length;j++)beam(g,gunwale[j-1],gunwale[j],.056,.063,C.woodDark,false);
      for(let seam=1;seam<=6;seam++){
        const f=seam*.105,pts=[];
        // Match the piecewise cross-section to keep ink outside the wooden surface.
        let taper=f<.3?1-.045*f/.3:f<.72?.955-.175*(f-.3)/.42:.78-.18*(f-.72)/.28;
        for(let j=0;j<=ribs;j++){let t=j/ribs;pts.push([(t-.5)*length,THREE.MathUtils.lerp(sheer(t),bottom(t),f),side*(half(t)*taper+.012)]);}
        pathLine(g,pts,true);
      }
      for(let j=3;j<ribs-3;j+=3){let t=j/ribs,xx=(t-.5)*length;for(const f of [.15,.40,.61]){const zz=half(t)*(1-f*.24);pathLine(g,[[xx-.024,sheer(t)-(sheer(t)-bottom(t))*f,side*(zz+.025)],[xx+.024,sheer(t)-(sheer(t)-bottom(t))*f,side*(zz+.025)]],true);}}
    }
    const deckVerts=[],deckUV=[],deckIdx=[],deckX=Array.from({length:ribs+1},(_,j)=>(j/ribs-.5)*length);
    if(hatch)deckX.push(hatch.x-hatch.w/2,hatch.x+hatch.w/2);deckX.sort((a,b)=>a-b);
    function deckQuad(x0,x1,z00,z01,z10,z11){const n=deckVerts.length/3;for(const [xx,zz] of [[x0,z00],[x0,z01],[x1,z10],[x1,z11]]){deckVerts.push(xx,.75,zz);deckUV.push(xx/.42,zz/2.8);}deckIdx.push(n,n+2,n+1,n+1,n+2,n+3);}
    for(let j=1;j<deckX.length;j++){
      const a=deckX[j-1],b=deckX[j],ra=half(a/length+.5)*.91,rb=half(b/length+.5)*.91;
      if(hatch&&a>=hatch.x-hatch.w/2-.0001&&b<=hatch.x+hatch.w/2+.0001){deckQuad(a,b,-ra,hatch.z-hatch.d/2,-rb,hatch.z-hatch.d/2);deckQuad(a,b,hatch.z+hatch.d/2,ra,hatch.z+hatch.d/2,rb);}
      else deckQuad(a,b,-ra,ra,-rb,rb);
    }
    const deckGeo=new THREE.BufferGeometry();deckGeo.setAttribute('position',new THREE.Float32BufferAttribute(deckVerts,3));deckGeo.setAttribute('uv',new THREE.Float32BufferAttribute(deckUV,2));deckGeo.setIndex(deckIdx);deckGeo.computeVertexNormals();mesh(g,deckGeo,C.woodLight,[0,0,0],[0,0,0],false);
    for(let xx=-length*.45;xx<=length*.45;xx+=.25){const r=half(xx/length+.5)*.90;
      if(hatch&&Math.abs(xx-hatch.x)<hatch.w/2){pathLine(g,[[xx,.762,-r],[xx+.004,.762,hatch.z-hatch.d/2]],true);pathLine(g,[[xx,.762,hatch.z+hatch.d/2],[xx+.004,.762,r]],true);}
      else pathLine(g,[[xx,.762,-r],[xx+.004,.762,r]],true);
    }
    dressBoatInterior(g,{length,width,half,sheer,hatch,detailed,canopy});
    if(canopy){
      const L=length*.47,R=width*.49,base=.84;
      const vertices=[],uvs=[],indices=[];for(let j=0;j<=24;j++){const a=j/24*Math.PI;for(const [k,xx] of [-L/2,L/2].entries()){vertices.push(xx,base+Math.sin(a)*R,Math.cos(a)*R);uvs.push(k*L/1.2,j/24*Math.PI*R/.64);}}for(let j=0;j<24;j++){let i=j*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(g,geo,reedMat(),[0,0,0],[0,0,0],false);
      for(let xx=-L/2;xx<=L/2;xx+=.39){const pts=[];for(let j=0;j<=20;j++){const a=j/20*Math.PI;pts.push([xx,base+Math.sin(a)*(R+.013),Math.cos(a)*(R+.013)]);}pathLine(g,pts);}
      for(let j=1;j<8;j++){const a=j/8*Math.PI;beam(g,[-L/2,base+Math.sin(a)*R,Math.cos(a)*R],[L/2,base+Math.sin(a)*R,Math.cos(a)*R],.010,.009,C.basket,false);}
      for(const xx of [-L/2,L/2])beam(g,[xx,base,-R],[xx,base,R],.04,.04,C.woodDark);
    }
    if(width<3.5){
      const sparBase=canopy?.84+width*.49+.13:.92,sparTop=canopy?sparBase+.40:2.1;
      beam(g,[-length*.29,sparBase,0],[length*.37,sparTop,0],.085,.105,C.woodDark);
      for(const side of [-1,1])beam(g,[-length*.20,.80,side*width*.29],[-length*.20,sparBase+.055,0],.07,.07,C.wood);
      if(!detailed)for(const side of [-1,1])pathLine(g,[[length*.37,sparTop,0],[length*.14,1.3,side*width*.56],[-length*.4,.88,side*width*.42]],true);
      basket(g,-length*.32,.79,-.6,.32,.43);jar(g,-length*.33,.78,.4,.26,.56);bundle(g,-length*.25,.79,0,1.0,.40,.8);
    }
    beam(g,[length*.32,1.2,-width*.32],[length*.48,-.6,-width*.75],.065,.055,C.woodDark);
    dressBoat(g,length,width,canopy,detailed);
    boats.push({g,x,z,phase:random()*6});return g;
  }
  const mainBoat=boat(-14,5.9,12,2.9,.12,true);const cargoBoat=boat(11,-2.4,17,4.1,-.12,false);boat(-31,-4.2,10,2.6,.03,true);boat(35,5.5,9,2.4,-.2,false);boat(53,-3,12,2.8,.03,true);
  tieToPeg(mainBoat,-1.5,.79,1.36,.2,.06);
  // Broad cargo vessel, with segmented mat-covered shelter and a lowered mast.
  // The bow is toward the bridge. Ropes, braces, bales and crew make this a working boat.
  const cargo=cargoBoat;
  for(const xx of [1.0,3.4,5.7]){
    for(const side of [-1,1])reedBox(cargo,2.10,1.20,.029,xx,1.44,side*1.65);
    reedBox(cargo,.028,1.20,3.32,xx+1.05,1.44,0);
    if(xx===1){for(const side of [-1,1])reedBox(cargo,.028,1.20,1.08,xx-1.05,1.44,side*1.12);reedBox(cargo,.028,.13,1.16,xx-1.05,1.975,0);}
    else reedBox(cargo,.028,1.20,3.32,xx-1.05,1.44,0);
    for(const side of [-1,1]){
      const hatch=group(cargo,xx,0,side*1.69);
      for(let j=0;j<7;j++)beam(hatch,[-1+j*.33,.90,0],[-1+j*.33,2.06,0],.04,.043,C.woodDark,false);
      beam(hatch,[-1.08,1.08,0],[1.08,1.08,0],.04,.04,C.wood);beam(hatch,[-1.08,1.77,0],[1.08,1.77,0],.045,.045,C.woodDark);
      for(let j=0;j<9;j++)pathLine(hatch,[[-1.05,1.16+j*.065,.013],[1.05,1.16+j*.065,.013]],true);
    }
    const verts=[],uvs=[],idx=[];for(let i=0;i<=18;i++){const a=i/18*Math.PI;verts.push(xx-1.14,1.93+Math.sin(a)*.63,Math.cos(a)*1.77,xx+1.14,1.93+Math.sin(a)*.63,Math.cos(a)*1.77);uvs.push(0,i/18*4.15/.64,2.28/1.2,i/18*4.15/.64);if(i<18){let n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(cargo,geo,reedMat(),[0,0,0],[0,0,0],false);
    for(let px=xx-1.1;px<xx+1.2;px+=.24){const points=[];for(let i=0;i<=14;i++){let a=i/14*Math.PI;points.push([px,1.94+Math.sin(a)*.635,Math.cos(a)*1.78]);}pathLine(cargo,points,true);}
  }
  // The end of the first shelter faces the bridge: a dark low entrance,
  // tied bamboo jambs, mat panels and a rolled blind, rather than a blank box.
  box(cargo,.012,1.04,1.12,mat(C.woodDark,{map:null}),1.85,1.34,0,false);
  for(const zz of [-.60,.60])beam(cargo,[-.077,.84,zz],[-.077,1.98,zz],.045,.052,C.woodDark);
  beam(cargo,[-.080,1.94,-1.66],[-.080,1.94,1.66],.05,.05,C.woodDark);
  for(const side of [-1,1]){
    for(let j=0;j<14;j++)pathLine(cargo,[[-.081,.95+j*.068,side*.66],[-.081,.95+j*.068,side*1.59]],true);
    beam(cargo,[-.081,.89,side*1.50],[-.081,1.96,side*1.50],.04,.04,C.basket,false);
    for(const yy of [1.12,1.77])pathLine(cargo,[[-.105,yy-.025,side*.61],[-.105,yy+.025,side*.63],[-.105,yy+.035,side*.58]],true);
  }
  const rolled=mesh(cargo,new THREE.CylinderGeometry(.09,.09,1.22,14),wicker(),[-.13,1.99,0],[Math.PI/2,0,0],false);
  for(const zz of [-.38,.38])pathLine(cargo,[[-.17,2.06,zz],[-.21,1.99,zz],[-.17,1.90,zz]],true);
  for(const zz of [-1.9,1.9]){
    for(let x=-6.7;x<=7.4;x+=.6){beam(cargo,[x,.83,zz],[x,1.26,zz],.04,.04,C.woodDark,false);}
    pathLine(cargo,[[-7.3,1.42,zz],[-5.7,1.23,zz],[5.4,1.25,zz],[7.4,1.48,zz]]);
    beam(cargo,[-6.7,.93,zz],[6.9,.93,zz],.08,.09,C.woodDark);
  }
  for(let i=0;i<6;i++){const x=-2.0+(i%2)*.67,z=-.5+Math.floor(i/2)*.63;bundle(cargo,x,.785,z,.61,.47,.55);}
  beam(cargo,[-5.0,.84,-.8],[-5.0,1.68,.0],.08,.08,C.woodDark);beam(cargo,[-5.0,.84,.8],[-5.0,1.68,0],.08,.08,C.woodDark);
  beam(cargo,[-5.8,1.43,0],[4.7,2.91,-.2],.105,.12,C.woodDark);
  for(const z of [-1.6,1.6])hempRope(cargo,[[-6.2,1.04,z],[-4.8,1.89,z*.2],[4.7,2.91,-.2],[6.4,1.04,-z]],.014,100);
  for(let i=0;i<3;i++)beam(cargo,[-6.5+i*.72,1.70,1.1],[-9.4+i*.68,-.38,3.2],.05,.057,C.woodDark,false);
  // Two long steering sweeps and fine rings of wake, drawn without shiny water.
  beam(cargo,[7.2,1.30,-1.2],[10.1,-.5,-3.0],.07,.09,C.woodDark);box(cargo,.24,.07,1.5,C.wood,9.8,-.31,-2.8,false);
  for(let j=0;j<6;j++){const pts=[];for(let i=0;i<=60;i++){const a=i/60*Math.PI*2;pts.push([11+Math.cos(a)*(9.0+j*.21),-.498,-2.4+Math.sin(a)*(2.55+j*.22)]);}pathLine(stat,pts,true);}

  for(let i=0;i<5;i++){box(stat,.65,.32,3.6,C.wood,-17+i*.7,-.08,10.9);for(const z of [9.5,12.3])cylinder(stat,.07,.10,1.5,C.woodDark,-17+i*.7,-.3,z,8);}
  dressLanding(stat);

  const barkTex=canvasTexture(512,256,(ctx,W,H)=>{
    ctx.fillStyle='#e3dcc5';ctx.fillRect(0,0,W,H);
    for(let k=0;k<82;k++){
      let y=random()*H;ctx.strokeStyle=`rgba(63,51,30,${.07+random()*.21})`;ctx.lineWidth=.4+random()*.8;ctx.beginPath();
      for(let i=0;i<=36;i++){const x=i/36*W,yy=y+Math.sin(i*.29+k)*3+Math.sin(i*.62+k*2.1)*.8;i?ctx.lineTo(x,yy):ctx.moveTo(x,yy);}ctx.stroke();
    }
    for(let i=0;i<95;i++){const x=random()*W,y=random()*H;ctx.strokeStyle='#51442b35';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+4,y-2,x+9,y-1,x+14,y+1);ctx.stroke();}
    for(let i=0;i<14;i++){const x=random()*W,y=random()*H;ctx.strokeStyle='#5d4c3048';ctx.lineWidth=.8;for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(x,y,7+k*3,2.1+k*1.3,.08,0,Math.PI*2);ctx.stroke();}}
  });barkTex.wrapS=barkTex.wrapT=THREE.RepeatWrapping;barkTex.repeat.set(2,1);
  const barkMaterial=mat(C.wood,{map:barkTex});
  function tree(x,z,h=7,willow=false){
    const g=group(stat,x,.22,z);const fine=[];
    function limb(points,r0,r1){
      const pts=points.map(p=>new THREE.Vector3(...p));const curve=new THREE.CatmullRomCurve3(pts);const geo=new THREE.TubeGeometry(curve,points.length*3,1,6,false);const pos=geo.attributes.position;
      // TubeGeometry radial units taper along its centerline.
      for(let j=0;j<=points.length*3;j++){const t=j/(points.length*3),c=curve.getPointAt(t),r=(r0+(r1-r0)*t)*(1+Math.sin(t*21.7)*.075+Math.sin(t*43.3)*.035);for(let k=0;k<=6;k++){const i=j*7+k;pos.setXYZ(i,c.x+(pos.getX(i)-c.x)*r,c.y+(pos.getY(i)-c.y)*r,c.z+(pos.getZ(i)-c.z)*r);}}
      geo.computeVertexNormals();mesh(g,geo,barkMaterial,[0,0,0],[0,0,0],false);
      for(let side=0;side<7;side++){const a=side*.897;const bark=curve.getPoints(points.length*4).map((p,i,arr)=>{let r=(r0+(r1-r0)*i/(arr.length-1))*1.01;return [p.x+Math.cos(a)*r,p.y,p.z+Math.sin(a)*r];});for(let j=1;j<bark.length;j++)fine.push(bark[j-1],bark[j]);}
    }
    const lean=between(-.5,.5),gnarl=willow?1.6:1;
    limb([[0,0,0],[-.23*gnarl,h*.16,.13],[lean+.19*gnarl,h*.32,-.15],[lean-.30*gnarl,h*.51,.17],[lean+.20,h*.73,-.12],[lean-.25,h,.15]],willow?.39:.29,.018);
    if(willow){
      for(let k=0;k<4;k++){
        const yy=h*(.16+k*.10),xx=Math.sin(k*2.2)*.22;
        const knot=mesh(g,new THREE.SphereGeometry(.22-k*.016,12,8),barkMaterial,[xx,yy,.10],[.2*k,.7*k,0],false);knot.scale.set(1,.78,1.08);
        const scars=[];for(let q=0;q<3;q++){const pts=[];for(let i=0;i<=18;i++){let a=i/18*Math.PI*2;pts.push([xx+Math.cos(a)*(.13+q*.024),yy+Math.sin(a)*(.16+q*.02),.30+q*.002]);}for(let i=1;i<pts.length;i++)scars.push(pts[i-1],pts[i]);}lines(g,scars,true);
      }
      for(const dir of [-1,1])limb([[lean*.4,h*.29,0],[dir*.39,h*.45,.2],[dir*.60,h*.65,-.12],[dir*.98,h*.89,.05]],.15,.014);
    }
    for(let j=0;j<12;j++){
      const angle=j*1.91+Math.sin(j*2.3)*.62+random()*.5,base=h*between(.35,.78),len=h*between(.20,.46),root=[lean*.6,base,0],mid=[Math.cos(angle)*len*.48,base+len*.18,Math.sin(angle)*len*.48],tip=[Math.cos(angle)*len,base+len*.65,Math.sin(angle)*len];
      limb([root,mid,[mid[0]*1.45,base+len*.43,mid[2]*1.5],tip],.075,.009);
      for(let q=0;q<8;q++){
        let t=.3+q*.087,xx=mid[0]+(tip[0]-mid[0])*t,yy=mid[1]+(tip[1]-mid[1])*t,zz=mid[2]+(tip[2]-mid[2])*t,a=angle+(q%2?-.9:.9),l=between(.35,.85);
        const end=[xx+Math.cos(a)*l,yy+l*.65,zz+Math.sin(a)*l];
        const twig=[[xx,yy,zz],[xx+Math.cos(a)*l*.45,yy+l*.19,zz+Math.sin(a)*l*.4],end];for(let k=1;k<3;k++)fine.push(twig[k-1],twig[k]);
        if(willow){for(let v=0;v<2;v++){const hanging=[];for(let k=0;k<=12;k++){hanging.push([end[0]+Math.sin(k*.22+j)*.10+v*.07,end[1]-k*.13,end[2]+Math.sin(k*.19+q)*.10]);}for(let k=1;k<hanging.length;k++)fine.push(hanging[k-1],hanging[k]);for(let k=2;k<11;k+=2){const p=hanging[k];fine.push(p,[p[0]+.055,p[1]+.065,p[2]+.026]);}}}
        else {for(let v=0;v<3;v++){const t=.53+v*.19;fine.push([xx+(end[0]-xx)*t,yy+(end[1]-yy)*t,zz+(end[2]-zz)*t],[xx+(end[0]-xx)*t+.10*Math.sin(q),yy+(end[1]-yy)*t+.20,zz+(end[2]-zz)*t+.1*Math.cos(q)]);}}
      }
    }
    lines(g,fine,true);
    // Exposed root flares and short grass marks ground the trunk in the bank.
    for(let i=0;i<5;i++){let a=i*1.26;limb([[0,.38,0],[Math.cos(a)*.26,.08,Math.sin(a)*.26],[Math.cos(a)*.55,.012,Math.sin(a)*.55]],.075,.01);}
    collider(x,z,.55,.55);
  }
  tree(-12,11.3,6.5,true);tree(10.3,10.8,7,true);
  tree(-29,11.3,8,true);tree(34,11.4,7.8,true);tree(-30,-13,7.7);tree(38,-14,8.6);tree(-42,21,9,true);tree(46,24,8);tree(-5,38,7);tree(7,40,8);
  for(let i=0;i<14;i++)tree(-65+i*10,(i%2?1:-1)*between(42,58),between(7,10),i%4===0);

  const people=new People(scene);
  for(const k of shopkeepers)people.add(k.x,k.z,{kind:1,y:k.y,heading:k.heading,scale:.96});
  people.add(-4.8,20.5,{kind:0,heading:2.8,walk:.10,route:[[-5.4,18.5],[-6.7,23]]});
  people.add(-7.2,16.7,{kind:6,heading:2.8});people.add(5.7,16.1,{kind:1,heading:Math.PI});
  people.add(-.9,8.4,{kind:5,y:bridgeDeckHeight(8.4),walk:.06,route:[[-.9,-10],[-.9,11]]});
  people.add(1.1,2,{kind:2,y:bridgeDeckHeight(2),heading:Math.PI,walk:.04,route:[[1.1,11],[1.1,-10]]});
  people.add(-1.8,-2.2,{kind:6,y:bridgeDeckHeight(-2.2),heading:Math.PI/2});
  people.add(2.0,6.6,{kind:1,y:bridgeDeckHeight(6.6),heading:-Math.PI/2});
  people.add(.8,-8,{kind:4,y:bridgeDeckHeight(-8),heading:.25});people.add(1.7,-8.3,{kind:7,y:bridgeDeckHeight(-8.3),heading:.1});
  people.add(13,23,{kind:0,heading:1.3});people.add(14.8,22.8,{kind:2,heading:-1.3});people.add(17,23.2,{kind:6,heading:Math.PI});
  people.add(21,21.3,{kind:5,walk:.07,route:[[20,20.45],[22.4,20.45]]});people.add(28,22,{kind:1,heading:-.8});
  people.add(-18,20,{kind:4,heading:.5});people.add(-19,20.7,{kind:7,heading:.1});people.add(-23.6,17.9,{kind:3,heading:1.4});
  people.add(-16,11.7,{kind:3,heading:Math.PI});people.add(-20,11.6,{kind:5,heading:2});
  people.add(-5,-17,{kind:6,heading:1.2});people.add(4,-18.7,{kind:0,heading:2.4});
  people.add(-13,-18.5,{kind:2,walk:.06,route:[[-10,-18],[-23,-19]]});people.add(13,-17.8,{kind:1,heading:2.2});
  people.add(18,-19,{kind:4,heading:-1});people.add(-31,23,{kind:5,heading:0});
  // A dense bridge market, with a clear central lane and small conversational groups.
  for(const p of [
    [-2.3,10.1,6,1.5],[2.15,9.7,0,-1.4],[-1.85,7.3,1,1.2],
    [2.15,4.9,2,-1.7],[-2.05,4.0,4,1.9],[-1.45,3.6,7,1.7],
    [2.23,1.0,1,-1.4],[-2.12,-3.8,0,1.5],[2.07,-4.9,6,-1.4],
    [-2.2,-7.1,2,.8],[2.1,-10.1,1,-1.3]
  ])people.add(p[0],p[1],{kind:p[2],heading:p[3],y:bridgeDeckHeight(p[1])});
  people.add(.3,8,{kind:3,walk:.038,route:[[.3,12],[.3,-11]]});
  people.add(-.25,-6,{kind:2,walk:.033,route:[[-.25,-12],[-.25,12]]});
  // Buyers at counters, children beside adults, workers between the cart and landing.
  for(const p of [
    [-8.9,22.2,1,Math.PI],[-10.3,22.1,2,Math.PI],[-11.8,22.2,4,2.9],[-11.2,21.7,7,3.0],
    [-16.5,22.3,0,Math.PI],[-18.3,22.1,1,Math.PI],[-14.8,20.2,6,.3],
    [19.8,23.7,1,Math.PI],[22.2,23.8,4,Math.PI],[23.2,23.2,7,2.8],[26,22.1,2,.8],
    [6.7,18,0,-1.4],[7.5,18.5,7,-1.6],[-8.1,18.9,2,1.1],
    [-18.5,11.6,3,2.5],[-14.7,11.7,1,-2.6],[-21,13.3,2,1.3],
    [-6.2,-16.0,1,1.3],[-7,-15.9,7,1.7],[5.9,-16.4,4,-1.5],
    [-12,-18.5,0,3],[11,-18.6,2,3]
  ])people.add(p[0],p[1],{kind:p[2],heading:p[3]});
  people.add(-12,20.7,{kind:5,walk:.034,route:[[-9,20.8],[-21,20.8]]});
  people.add(7,21.5,{kind:2,walk:.047,route:[[6,21.8],[18,21.8]]});
  function boatPerson(boat,x,z,options){
    const p=people.add(x,z,options);boat.updateWorldMatrix(true,false);
    boatPassengers.push({boat,person:p,local:boat.worldToLocal(p.g.position.clone())});return p;
  }
  boatPerson(mainBoat,-9,5.3,{kind:3,heading:-1.1,y:.345,working:true});
  boatPerson(cargoBoat,16,-1.9,{kind:3,heading:1.6,y:.345,working:true});
  for(let i=0;i<12;i++)people.add(between(-40,40),i%2?between(31,37):between(-36,-29),{kind:i%8,heading:random()*Math.PI*2});

  // Workers distributed on the broad foredeck and narrow side walkways.
  for(const [xx,zz,kind,heading] of [[-6.4,.9,3,-2.3],[-5.5,-.7,3,-2.1],[-4.8,1.15,5,-1.9],[-4.0,-1.3,3,2.0],[-3.2,.55,1,-1.5],[6.4,1.4,3,1.5],[5.1,-1.72,2,Math.PI],[.6,1.76,3,-1.5]]){
    const ca=Math.cos(-.12),sa=Math.sin(-.12),x=11+xx*ca+zz*sa,z=-2.4-xx*sa+zz*ca;boatPerson(cargoBoat,x,z,{kind,heading,y:.345,scale:.96,working:kind===3});
  }
  // Interlocking groups bring life into the first few steps from the entrance.
  for(const p of [
    [-4.1,17.0,1,-1.4],[-5.1,16.5,4,1.5],[-4.7,16.3,7,1.5],[-7.5,23.0,1,0],[-6.8,22.1,2,2.9],
    [3.9,19.0,1,.5],[5.6,19.8,4,-1.5],[5.3,19.2,7,-1.1],[3.8,14.3,5,-1.5],[4.7,13.4,3,1.9],
    [-2.2,14.8,0,1.1],[2.1,13.5,2,-1.7],[-2.2,12.1,4,1.1],[-1.7,11.8,7,1.4],
    [-24,12,3,1.7],[-23.1,12.7,5,3.1],[-19.4,13,1,-1.6],[-24,17.4,2,2.4],
    [9.1,21,6,-1.1],[10.2,20.2,0,2.5],[-4.1,-15.2,1,-1.1],[-3.4,-15.7,4,1.2]
  ])people.add(p[0],p[1],{kind:p[2],heading:p[3],y:groundHeight(p[0],p[1])});
  for(const [x,z,kind,heading] of [
    [-1.9,9.4,2,1.2],[1.8,8.8,1,-1.5],[1.55,8.2,7,-1.7],[-1.4,6.8,0,2.7],
    [1.7,6.2,4,1.9],[-1.9,5.4,3,-1.1],[-1.6,2.5,1,1.5],[-1.4,1.9,7,1.8],
    [1.9,.1,2,-1.2],[-1.6,-.9,4,2.1],[1.7,-2.8,6,-1.5],[1.9,-3.6,0,1.7],
    [-1.6,-4.8,2,1.3],[-1.6,-5.5,1,1.5],[1.6,-6.3,3,-1.1],[-1.8,-9.2,6,1.5],
    [1.7,-11.2,4,-1.5],[1.4,-11.8,7,-1.2],[-1.6,-11.5,0,1.4],[-.5,4.7,5,Math.PI]
  ])people.add(x,z,{kind,heading,y:bridgeDeckHeight(z),scale:.94+random()*.11});
  people.add(-23.9,15.6,{kind:3,heading:.5});people.add(24.9,18.4,{kind:2,heading:-.3});
  people.add(-3.4,21,{kind:5,walk:.043,route:[[-3.1,21.4],[3.2,21.4]]});
  people.add(2.4,17.6,{kind:2,walk:.043,route:[[2.4,16],[2.4,23]]});
  for(const [x,z,kind,heading] of [
    [-1.0,27.8,2,1.3],[.9,27.4,1,Math.PI],[1.8,27.2,4,-1.4],[2.2,27.0,7,-1.4],
    [-4.0,25.9,6,1.4],[-5.8,26.0,0,-1.3],[-1.8,30.7,1,Math.PI],[2.5,30.7,2,Math.PI],
    [3.2,-22.3,1,.1],[4.7,-22.8,4,-1.4],[4.2,-22.2,7,-1.3],[-1.3,-25.5,2,.0],
    [.8,-25.3,1,.0],[-4.5,-24,3,1.1]
  ])people.add(x,z,{kind,heading});
  people.add(-2.7,25.5,{kind:2,walk:.058,route:[[-2.7,24.5],[-2.7,29.5]]});
  for(const r of [
    {a:[-28,21.1],b:[-9,21.1],kind:2,speed:.057},
    {a:[-26,22.0],b:[-13,22.0],kind:5,speed:.054},
    {a:[7,21.4],b:[20,21.4],kind:4,speed:.063},
    {a:[27,23],b:[34,23],kind:2,speed:.092},
    {a:[-24,-18.6],b:[-9,-18.6],kind:5,speed:.064},
    {a:[11,-18.4],b:[24,-18.4],kind:0,speed:.059}
  ])people.add(r.a[0],r.a[1],{kind:r.kind,walk:r.speed,route:[r.a,r.b],scale:.93+random()*.12});
  const tableaux=new Tableaux(scene);
  tableaux.add(12.3,23.3,{heading:0});tableaux.add(14.7,23.3,{heading:0,variant:1});
  tableaux.add(12.3,24.8,{heading:Math.PI,variant:1});
  tableaux.add(16.4,-19.3,{heading:Math.PI});
  tableaux.add(11.6,27.35,{heading:0,y:.532,scale:.926,variant:1});tableaux.add(15.4,28.82,{heading:Math.PI,y:.532,scale:.926});
  const animals=new Animals(scene);
  animals.add(-23.20,16.81,{kind:'donkey',heading:Math.PI+.5,scale:1.0});
  animals.add(6.21,-17.74,{kind:'donkey',heading:Math.PI+.8,scale:.95});
  animals.add(24.74,19.61,{kind:'donkey',heading:Math.PI-.3,scale:1.02});
  animals.add(-3,23.8,{kind:'dog',route:[[-4,23.8],[2,24.1]],speed:.4,variant:1});
  animals.add(16,21.4,{kind:'dog',heading:-.9,scale:.86});
  for(let i=0;i<6;i++)animals.add(-9.8+(i%3)*.55,22.9+Math.floor(i/3)*.48,{kind:'chicken',heading:i*1.5,scale:.8+random()*.3,variant:i===0?'rooster':undefined});
  animals.add(19.3,-18.5,{kind:'chicken',heading:.7});

  dressMarket(stat);
  const earth=dressEarth(stat,shopSites,stallPositions);
  const garden=createGarden({THREE,scene,stat,dynamic,groundHeight});
  const distantWash=createDistantWash({THREE,scene,groundHeight});
  const steamSources=[];stat.updateWorldMatrix(true,true);
  stat.traverse(o=>{for(const source of o.userData.steamSources||[])steamSources.push({kind:source.kind,position:o.localToWorld(new THREE.Vector3(...source.position)).toArray()});});
  batchStatic(stat,{cellSize:batchCell,multiDraw});
  for(const b of boats)batchStatic(b.g);
  const bounds={minX:-39,maxX:42,minZ:-33,maxZ:37};
  function canWalk(x,z,r=.25){
    if(x<bounds.minX||x>bounds.maxX||z<bounds.minZ||z>bounds.maxZ)return false;
    if(Math.abs(z)<10.15&&Math.abs(x)>2.75)return false;
    if(Math.abs(z)<13.6&&Math.abs(x)>2.75&&Math.abs(x)<3.65)return false;
    for(const s of walkSegments){
      const vx=s.b[0]-s.a[0],vz=s.b[1]-s.a[1],t=Math.max(0,Math.min(1,((x-s.a[0])*vx+(z-s.a[1])*vz)/(vx*vx+vz*vz)));
      if(Math.hypot(x-s.a[0]-t*vx,z-s.a[1]-t*vz)<s.r+r)return false;
    }
    for(const c of colliders)if(Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r)return false;
    return true;
  }
  const crowdLife=populateStreetLife(people,{canWalk,groundHeight,places:PLACES,animals,looseObstacles});
  assignCrowdPaths(people);
  const footShadows=crowdShadows(people);
  const shadeZones=shopSites.filter(s=>Math.abs(s.x)<44&&Math.abs(s.z)<39).map(s=>({...s,c:Math.cos(s.rotation),sn:Math.sin(s.rotation)}));
  function figureShade(x,z){
    let shade=0;
    for(const s of shadeZones){
      const dx=x-s.x,dz=z-s.z,lx=dx*s.c-dz*s.sn,lz=dx*s.sn+dz*s.c,half=s.d/2;
      if(Math.abs(lx)>s.w/2+.2||lz< -half-.2)continue;
      const width=1-THREE.MathUtils.smoothstep(Math.abs(lx),s.w/2-.24,s.w/2+.18);
      if(lz<half+.35)shade=Math.max(shade,width*(.52+.48*(1-THREE.MathUtils.smoothstep(lz,half-1.25,half+.35))));
      if(s.type==='tea'&&lz>=half&&lz<half+2.5&&Math.abs(lx)<s.w*.46)shade=Math.max(shade,.53*(1-THREE.MathUtils.smoothstep(lz,half+1.8,half+2.5)));
    }
    for(const [sx,sz,r] of stallPositions){const d=Math.hypot((x-sx-.78)/r,(z-sz+.58)/r);shade=Math.max(shade,.34*(1-THREE.MathUtils.smoothstep(d,.75,1.06)));}
    return shade;
  }
  const paintedFigures=[...people.people.map(p=>({object:p.g,material:p.material,moving:!!p.walk})),...tableaux.items.map(p=>({object:p.m,material:p.m.material,moving:false}))];
  for(const p of paintedFigures){p.base=p.material.color.clone();p.shade=figureShade(p.object.position.x,p.object.position.z);}
  function shadeFigures(){
    for(const p of paintedFigures){
      if(p.moving)p.shade+=(figureShade(p.object.position.x,p.object.position.z)-p.shade)*.055;
      const amount=1-p.shade*.33;p.material.color.setRGB(p.base.r*amount*(1-.015*p.shade),p.base.g*amount,p.base.b*amount*(1+.05*p.shade));
    }
  }
  return {people,animals,tableaux,garden,earth,distantWash,steamSources,bridgeCraft,crowdLife,stat,dynamic,water,colliders,looseObstacles,walkSegments,bounds,canWalk,groundHeight,update(t,camera){
    stat.updateStaticView?.(camera);
    garden.update(t,camera);waterMarks.position.x=Math.sin(t*.14)*.12;
    for(const {strip,base,phase} of banners){
      const p=strip.geometry.attributes.position;
      for(let i=0;i<p.count;i++){const free=(.8-base[i*3+1])/1.6;p.setZ(i,base[i*3+2]+Math.sin(t*.7+free*3.4+phase)*.055*free);p.setX(i,base[i*3]+Math.sin(t*.51+phase)*.018*free);}
      p.needsUpdate=true;
    }
    for(const b of boats){b.g.position.y=-.42+Math.sin(t*.6+b.phase)*.018;b.g.rotation.z=Math.sin(t*.5+b.phase)*.002;}
    for(const {boat,person,local} of boatPassengers){boat.updateWorldMatrix(true,false);person.g.position.copy(local);boat.localToWorld(person.g.position);}
    crowdLife.update(t);people.update(t,camera,groundHeight);footShadows.update();animals.update(t,camera,groundHeight);tableaux.update(t,camera);shadeFigures();
  }};
}
