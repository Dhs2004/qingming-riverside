import * as THREE from './assets/three.module.js';
import {C} from './ink.js?v=20261019r6';
import {paintedSky,createPaintedWater,createSteam} from './atmosphere.js?v=20261019r6';
import {createWorld,PLACES,DETAILS,groundHeight} from './world.js?v=20261019r14';

const $=id=>document.getElementById(id);
const keys=new Set();const touch={x:0,y:0};
let renderer,scene,camera,world,target,post,postCamera,postScene,paintedWater,steam,lighting;
let state='welcome',yaw=-.32,pitch=-.01,nearest=null,tour=false,tourIndex=0,tourProgress=0,simTime=0;
let last=performance.now(),uiClock=0,drag=null,joystickId=null,travel=0,sound=null,soundEnabled=false;
let measuredFPS=60,drawCalls=0,renderTriangles=0,lastFootstep=0,seated=false,seatBlend=0,renderFrameCost=0;
let studyEye=null,studyFov=null,studyFrozen=false;
const renderSamples=new Float32Array(180);let renderSampleCursor=0,renderSampleCount=0;
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let touchDevice=matchMedia('(pointer: coarse)').matches||innerWidth<700;
const player={x:PLACES.south.x,z:PLACES.south.z};
const tourPath=[[-5.5,23],[-1.4,20.8],[-1,18.4],[-0.6,17.8],[-0.6,15],[-0.6,10.6],[-0.8,9.6],[-0.6,7.3],[-0.2,7],[-0.4,6.4],[-0.2,5.8],[0,4.4],[-0.4,4],[-0.6,0],[-0.6,-8],[-0.8,-8.6],[-0.8,-9],[-0.6,-9.4],[-0.6,-11],[-1,-11.4],[-0.6,-16],[-6.2,-18.4],[-7.2,-18],[-7.15,-18],[-6.8,-18.2],[-2.6,-17.4],[-0.6,-16],[0,-10.2],[-0.2,-10],[0.4,-8],[0.6,-6.6],[0,-6],[0.4,1],[0.55,1],[0.6,5.4],[1,5.8],[0.8,9.6],[0.7,10],[0.7,17],[1.8,18.2],[1.6,18.6],[2.8,21.4],[5,21.4],[17,22],[9,22],[-5,22],[-10,21],[-17,21],[-19,14],[-17.3,13.3],[-19,14],[-18.4,20.6],[-18,21],[-8.8,21.4],[-6.6,22.6],[-5.5,23]];
function progress(value,text){$('loading-bar').style.width=value+'%';$('loading-status').textContent=text;}
function announce(text){$('announcer').textContent=text;}
function fail(error){console.error(error);$('loading').hidden=true;$('error').hidden=false;$('error-message').textContent='画境初始化未完成：'+(error?.message||String(error));}
const lightPalettes={
  '原始光色':{sun:'#fff1c9',sunPower:2.28,sky:'#e1f0ec',earth:'#9c8d6b',hemiPower:1.12,ambient:'#fff0d3',ambientPower:.22},
  '清润日光':{sun:'#fff6e1',sunPower:2.40,sky:'#d6e8ed',earth:'#ad9879',hemiPower:1.00,ambient:'#e7ecdc',ambientPower:.19},
  '暖晴日光':{sun:'#ffefd0',sunPower:2.50,sky:'#c3dce8',earth:'#b9a281',hemiPower:.90,ambient:'#e8dfc6',ambientPower:.20}
};
function setLightPalette(name){
  const p=lightPalettes[name];if(!p||!lighting)return;
  lighting.sun.color.set(p.sun);lighting.sun.intensity=p.sunPower;
  lighting.hemi.color.set(p.sky);lighting.hemi.groundColor.set(p.earth);lighting.hemi.intensity=p.hemiPower;
  lighting.ambient.color.set(p.ambient);lighting.ambient.intensity=p.ambientPower;
  if(post)post.uniforms.paintColor.value=name==='原始光色'?0:name==='清润日光'?1:.65;
}

try{
  progress(12,'起地 · 架桥');
  const textureReady=new Promise((resolve,reject)=>{
    THREE.DefaultLoadingManager.onLoad=resolve;
    THREE.DefaultLoadingManager.onError=()=>reject(new Error('画面纹理未能载入，请刷新重试。'));
    THREE.DefaultLoadingManager.onProgress=(url,loaded,total)=>progress(78+17*loaded/Math.max(1,total),'铺绢 · 落墨');
  });
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
  renderer.setPixelRatio(Math.min(devicePixelRatio,touchDevice?1.5:1.75));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','画境：WASD 行走，拖动环顾，E 端详，Escape 暂停');
  $('scene').appendChild(renderer.domElement);
  scene=new THREE.Scene();scene.background=paintedSky();scene.fog=new THREE.Fog('#dce4d3',48,150);
  camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.08,160);camera.rotation.order='YXZ';
  const hemi=new THREE.HemisphereLight('#e1f0ec','#9c8d6b',1.12);scene.add(hemi);
  const ambient=new THREE.AmbientLight('#fff0d3',.22);scene.add(ambient);
  const light=new THREE.DirectionalLight('#fff1c9',2.28);light.position.set(-32,55,25);light.castShadow=true;light.shadow.mapSize.set(touchDevice?1536:3072,touchDevice?1536:3072);Object.assign(light.shadow.camera,{left:-49,right:49,top:43,bottom:-43,near:1,far:140});light.shadow.bias=-.00012;light.shadow.normalBias=.045;light.shadow.radius=3;scene.add(light);
  lighting={sun:light,hemi,ambient};setLightPalette('清润日光');
  progress(25,'瓦、梁、舟楫');
  await new Promise(requestAnimationFrame);
  const nativeMultiDraw=renderer.extensions.has('WEBGL_multi_draw'),reviewBatch=['127.0.0.1','localhost'].includes(location.hostname)?new URLSearchParams(location.search).get('batch'):null;
  world=createWorld(scene,{batchCell:reviewBatch==='global'?0:(nativeMultiDraw||reviewBatch==='cells'?28:0),multiDraw:nativeMultiDraw&&reviewBatch!=='global'&&reviewBatch!=='cells'});
  renderer.domElement.dataset.nativeMultiDraw=String(nativeMultiDraw);
  renderer.domElement.dataset.edition='2026-10-19-crowd';
  renderer.domElement.dataset.roles=JSON.stringify(world.people.people.reduce((counts,p)=>(counts[p.kind]=(counts[p.kind]||0)+1,counts),{}));
  renderer.domElement.dataset.crowdGroups=world.crowdLife.ensembles.length;
  renderer.domElement.dataset.crowdAdded=world.crowdLife.added;
  world.garden.root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  paintedWater=createPaintedWater(world.water,{mobile:touchDevice});steam=createSteam(scene,world.steamSources);
  progress(74,'落墨 · 添人');
  const size=renderer.getDrawingBufferSize(new THREE.Vector2());
  target=new THREE.WebGLRenderTarget(size.x,size.y,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true});
  target.samples=Math.min(renderer.capabilities.maxSamples,touchDevice?2:4);
  target.depthTexture=new THREE.DepthTexture(size.x,size.y,THREE.UnsignedIntType);
  const silk=new THREE.TextureLoader().load('./assets/silk-grain.png');silk.wrapS=silk.wrapT=THREE.RepeatWrapping;
  post=new THREE.ShaderMaterial({uniforms:{tSilk:{value:silk},tColor:{value:target.texture},tDepth:{value:target.depthTexture},resolution:{value:size},near:{value:.08},far:{value:160},time:{value:0},paintColor:{value:1}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`
      uniform sampler2D tColor,tDepth,tSilk; uniform vec2 resolution; uniform float near,far,time,paintColor; varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
      float depth(vec2 uv){float d=texture2D(tDepth,uv).x;return near*far/(far-(far-near)*d);}
      void main(){
        vec2 px=1./resolution;vec3 col=texture2D(tColor,vUv).rgb;
        float d=depth(vUv);float dx=abs(depth(vUv+vec2(px.x,0.))-depth(vUv-vec2(px.x,0.)));
        float dy=abs(depth(vUv+vec2(0.,px.y))-depth(vUv-vec2(0.,px.y)));
        float edge=clamp((dx+dy)/max(d,.2)-.022,0.,.8);
        col*=1.-edge*.20;
        // Soft contact wash at joints, under vessels and around footsteps.
        // Depth-aware attenuation stays local instead of making distant ink black.
        float occ=0.;
        for(int k=0;k<8;k++){
          float angle=float(k)*.785398;vec2 offset=vec2(cos(angle),sin(angle))*px*min(15.,80./max(d,1.));
          float sampleDepth=depth(vUv+offset);float delta=d-sampleDepth;
          occ+=smoothstep(.02,.20,delta)*(1.-smoothstep(.35,1.4,delta));
        }
        col*=1.-occ*.014;
        // A restrained cool pigment in shaded washes separates them from
        // sunlit ochre. Preserve luminance so paper and skin stay delicate.
        float luminance=dot(col,vec3(.2126,.7152,.0722));
        float shade=(1.-smoothstep(.11,.48,luminance))*paintColor;
        col*=mix(vec3(1.),vec3(.962,.997,1.075),shade);
        col=mix(vec3(dot(col,vec3(.2126,.7152,.0722))),col,1.+.065*paintColor);
        col=mix(col,pow(max(col,vec3(0.)),vec3(1.035))*1.018,paintColor);
        vec2 paper=vUv*resolution;
        float grain=(hash(floor(paper))-.5)*.012;
        float fiber=sin(paper.x*2.19+sin(paper.y*.023))*sin(paper.y*2.52)*.0025;
        float silk=texture2D(tSilk,paper/512.).r;
        col*=mix(1.,silk,.10);
        col+=grain+fiber;
        col=mix(col,vec3(.78,.76,.62),.012);
        col=pow(max(col,vec3(0.)),vec3(.985));
        gl_FragColor=vec4(col,1.);
        #include <colorspace_fragment>
      }`,depthTest:false,depthWrite:false});
  postScene=new THREE.Scene();postCamera=new THREE.Camera();postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),post));
  await textureReady;
  setCamera(true);world.update(0,camera);paintedWater.renderReflection(renderer,scene,camera,true);render();
  progress(100,'画卷已展');
  setTimeout(()=>{$('loading').style.opacity=0;setTimeout(()=>$('loading').hidden=true,650);},240);
  requestAnimationFrame(frame);
}catch(error){fail(error);}

function render(){const started=performance.now();paintedWater?.renderReflection(renderer,scene,camera);renderer.setRenderTarget(target);renderer.render(scene,camera);drawCalls=renderer.info.render.calls;renderTriangles=renderer.info.render.triangles;renderer.setRenderTarget(null);renderer.render(postScene,postCamera);renderFrameCost=performance.now()-started;renderSamples[renderSampleCursor++%renderSamples.length]=renderFrameCost;renderSampleCount=Math.min(renderSamples.length,renderSampleCount+1);}
function setCamera(initial=false){
  const desiredFov=studyFov??(touchDevice?(state==='welcome'?69:63):58);if(camera.fov!==desiredFov){camera.fov=desiredFov;camera.updateProjectionMatrix();}
  if(state==='welcome'){
    const drift=reduceMotion?0:Math.sin(simTime*.055)*.28;
    camera.position.set(-10.5+drift,6.6,23);camera.lookAt(1.2,touchDevice?.25:2.05,.7);return;
  }
  const eye=studyEye??(groundHeight(player.x,player.z)+1.64-seatBlend*.66);
  const bob=(!reduceMotion&&state==='walking'&&!tour)?Math.sin(travel*8)*.015:0;
  camera.position.set(player.x,eye+bob,player.z);camera.rotation.set(pitch,yaw,0,'YXZ');
}
function startWalk(place=null){
  document.body.dataset.mode='walking';
  seated=false;seatBlend=0;$('seat-stand').hidden=true;
  if(place){player.x=place.x;player.z=place.z;yaw=place.yaw;pitch=place.pitch??-.075;}
  keys.clear();drag=null;touch.x=touch.y=0;$('stick').style.transform='';
  state='walking';$('welcome').hidden=true;$('walk-hud').hidden=false;$('crosshair').hidden=false;$('touch-controls').hidden=!touchDevice;
  if(touchDevice)$('touch-controls').style.display='flex';
  $('map-panel').hidden=true;$('map-toggle').setAttribute('aria-expanded','false');
  renderer.domElement.focus({preventScroll:true});setCamera();updateUI();announce(touchDevice?'已进入画中。左下方向盘行走，右侧拖动环顾。':'已进入画中。WASD 行走，拖动环顾。');
}
function welcome(){document.body.dataset.mode='welcome';seated=false;seatBlend=0;$('seat-stand').hidden=true;state='welcome';tour=false;keys.clear();touch.x=touch.y=0;$('welcome').hidden=false;$('walk-hud').hidden=true;$('crosshair').hidden=true;$('interaction').hidden=true;$('touch-controls').hidden=true;$('tour-stop').hidden=true;$('capture').hidden=false;setCamera();}
function stopTour(completed=false){tour=false;$('tour-stop').hidden=true;$('capture').hidden=false;announce(completed===true?'一卷游毕。已回到南岸街市，可继续自由行走。':'已停止循卷游览，可以自由行走。');}
function beginTour(){startWalk(PLACES.south);tour=true;tourIndex=0;tourProgress=0;$('tour-stop').hidden=false;$('capture').hidden=true;announce(touchDevice?'循卷游览开始。拖动方向盘或画面可自行接管。':'循卷游览开始。按任意行走键可自行接管。');}
function updateTour(dt){
  let distance=dt*1.13;
  while(tourIndex<tourPath.length-1){
    const a=tourPath[tourIndex],b=tourPath[tourIndex+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]),remaining=length*(1-tourProgress);
    if(length>1e-7&&distance<remaining){tourProgress+=distance/length;break;}
    distance-=remaining;tourProgress=0;tourIndex++;
  }
  if(tourIndex>=tourPath.length-1){
    const end=tourPath[tourPath.length-1];player.x=end[0];player.z=end[1];stopTour(true);return;
  }
  const aa=tourPath[tourIndex],bb=tourPath[tourIndex+1];player.x=THREE.MathUtils.lerp(aa[0],bb[0],tourProgress);player.z=THREE.MathUtils.lerp(aa[1],bb[1],tourProgress);
  const desired=Math.atan2(-(bb[0]-aa[0]),-(bb[1]-aa[1]));yaw+=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw))*Math.min(1,dt*1.5);pitch=THREE.MathUtils.lerp(pitch,-.018,dt*2);
}
function move(dt){
  if(tour){updateTour(dt);return;}
  const turn=(keys.has('ArrowLeft')?1:0)-(keys.has('ArrowRight')?1:0);yaw+=turn*dt*1.25;
  let forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-touch.y;
  let strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0)+touch.x;
  const length=Math.hypot(forward,strafe);if(length<.01)return;if(length>1){forward/=length;strafe/=length;}
  const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?3.1:1.9)*dt;
  const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)*speed;
  // Resolve each axis separately to slide along a wall instead of snagging on corners.
  const beforeX=player.x,beforeZ=player.z;
  if(world.canWalk(player.x+dx,player.z))player.x+=dx;
  if(world.canWalk(player.x,player.z+dz))player.z+=dz;
  travel+=Math.hypot(player.x-beforeX,player.z-beforeZ);
  if(soundEnabled&&sound&&travel-lastFootstep>.68){sound.step(Math.abs(player.x)<3.5&&Math.abs(player.z)<13.8);lastFootstep=travel;}
}
function updateUI(){
  renderer.domElement.dataset.position=`${player.x.toFixed(2)},${camera.position.y.toFixed(2)},${player.z.toFixed(2)}`;
  renderer.domElement.dataset.heading=`${yaw.toFixed(3)},${pitch.toFixed(3)}`;
  renderer.domElement.dataset.tourStep=tour?String(tourIndex):'stopped';
  renderer.domElement.dataset.fps=measuredFPS.toFixed(1);renderer.domElement.dataset.drawCalls=drawCalls;
  renderer.domElement.dataset.triangles=renderTriangles;renderer.domElement.dataset.batchCell=world.stat.userData.staticBatch.cellSize;
  renderer.domElement.dataset.multiDrawGroups=world.stat.userData.staticBatch.multiDrawGroups;
  renderer.domElement.dataset.activeMultiDrawGroups=world.stat.userData.staticBatch.activeMultiDrawGroups;
  const timings=Array.from(renderSamples.subarray(0,renderSampleCount)).sort((a,b)=>a-b);renderer.domElement.dataset.renderMedianMs=(timings[Math.floor(timings.length*.5)]??0).toFixed(2);renderer.domElement.dataset.renderP95Ms=(timings[Math.floor(timings.length*.95)]??0).toFixed(2);
  renderer.domElement.dataset.renderMs=renderFrameCost.toFixed(2);renderer.domElement.dataset.textures=renderer.info.memory.textures;renderer.domElement.dataset.geometries=renderer.info.memory.geometries;
  renderer.domElement.dataset.people=world.people.count+world.tableaux.count;renderer.domElement.dataset.animals=world.animals.count;
  const x=player.x,z=player.z;let name='南岸街市',detail='汴河在前，虹桥在望';
  if(Math.abs(x)<3.5&&Math.abs(z)<13.8){name='虹桥';detail='木拱横河，舟行桥下';}
  else if(z<-10){name='北岸街巷';detail='过桥以后，街随屋转';}
  else if(x>9&&z>19){name='桥头茶肆';detail='低檐之下，有一席清闲';}
  else if(x<-10&&z<15){name='汴河船埠';detail='篙、缆、篷、舟';}
  const b=world.bounds;if(Math.min(x-b.minX,b.maxX-x,z-b.minZ,b.maxZ-z)<1.5)detail='画幅至此，可沿街折返';
  if(seated)detail='檐下看人来人往 · 行走即可起身';
  $('location-name').textContent=name;$('location-detail').textContent=detail;
  const mx=135+x*2.4,mz=118+z*2.1+x*.26;$('map-you').setAttribute('transform',`translate(${mx},${mz}) rotate(${-yaw*180/Math.PI})`);
  nearest=null;let best=Infinity;
  for(const p of DETAILS){const d=Math.hypot(p.x-x,p.z-z);if(d<p.r&&d<best){best=d;nearest=p;}}
  $('interaction').hidden=state!=='walking'||!nearest||tour;
  if(nearest)$('interaction-label').textContent=nearest.title;
}
function showDetail(){if(!nearest||state!=='walking')return;keys.clear();$('detail-title').textContent=nearest.title;$('detail-number').textContent='画中细处 · '+nearest.number;$('detail-text').textContent=nearest.text;$('detail-note').textContent=nearest.note;$('detail-seat').hidden=nearest.id!=='tea'||seated;$('detail-seat-break').hidden=nearest.id!=='tea'||seated;$('detail-dialog').showModal();}

function frame(now){
  const rawDt=(now-last)/1000,dt=Math.min(.04,rawDt);last=now;
  if(!document.hidden&&rawDt>0)measuredFPS=measuredFPS*.94+(1/rawDt)*.06;
  const modal=!!document.querySelector('dialog[open]');
  if(!document.hidden){if(!studyFrozen)simTime+=dt;seatBlend=reduceMotion?Number(seated):THREE.MathUtils.lerp(seatBlend,Number(seated),Math.min(1,dt*7));if(state==='walking'&&!modal)move(dt);setCamera();world.update(reduceMotion?0:simTime,camera);paintedWater.update(reduceMotion?0:simTime);steam.update(reduceMotion?0:simTime,camera);post.uniforms.time.value=simTime;render();uiClock+=dt;if(uiClock>.18){updateUI();uiClock=0;}}
  requestAnimationFrame(frame);
}

$('enter').addEventListener('click',()=>startWalk(PLACES.south));$('tour').addEventListener('click',beginTour);$('tour-stop').addEventListener('click',stopTour);
$('capture').addEventListener('click',async()=>{
  $('capture').disabled=true;
  try{
    render();
    const c=document.createElement('canvas'),source=renderer.domElement;
    const width=Math.min(1920,source.width),height=Math.round(width/source.width*source.height),border=Math.round(width*.032);
    c.width=width+border*2;c.height=height+border*2+Math.round(width*.065);
    const ctx=c.getContext('2d');ctx.fillStyle='#dfcba1';ctx.fillRect(0,0,c.width,c.height);
    ctx.drawImage(source,border,border,width,height);
    const font=Math.round(width*.018);ctx.fillStyle='#594a33';ctx.font=`${font}px "Songti SC", SimSun, serif`;
    ctx.fillText('清明上河图 · '+$('location-name').textContent,border,height+border+font*1.9);
    ctx.textAlign='right';ctx.font=`${Math.round(font*.65)}px "Songti SC", SimSun, serif`;ctx.fillText('入画 · 虹桥街市',c.width-border,height+border+font*1.9);
    const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.94));if(!blob)throw new Error('未能生成图片');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='入画-虹桥-'+new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')+'.jpg';a.click();setTimeout(()=>URL.revokeObjectURL(url),15000);announce('此刻已留成一幅画，可在浏览器下载中查看。');
  }catch(error){console.error(error);announce('留影暂未完成，请稍后再试。');}
  finally{$('capture').disabled=false;}
});
function leaveSeat(){if(!seated)return;seated=false;$('seat-stand').hidden=true;announce('已起身，可以继续沿街行走。');}
$('detail-seat').addEventListener('click',()=>{$('detail-dialog').close();stopTour();startWalk({x:14.7,z:24.8,yaw:.45});seated=true;$('seat-stand').hidden=false;pitch=-.08;announce('在茶肆檐下坐下了。拖动环顾，行走键或起身按钮可站起。');});
$('seat-stand').addEventListener('click',leaveSeat);
$('home').addEventListener('click',e=>{e.preventDefault();welcome();});$('pause').addEventListener('click',welcome);
$('map-toggle').addEventListener('click',()=>{const open=$('map-panel').hidden;$('map-panel').hidden=!open;$('map-toggle').setAttribute('aria-expanded',String(open));});
$('map-close').addEventListener('click',()=>{$('map-panel').hidden=true;$('map-toggle').setAttribute('aria-expanded','false');});
for(const p of document.querySelectorAll('[data-place]')){const go=()=>{stopTour();startWalk(PLACES[p.dataset.place]);};p.addEventListener('click',go);p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});}
const references={
  overview:{src:'assets/reference.jpg',alt:'清明上河图虹桥一段：木桥、人群、街市与汴河行舟',caption:'原画采用散点透视；画境保留虹桥、舟船和桥市的关系，将这一段重构为连续的步行空间。'},
  bridge:{src:'assets/reference-bridge.jpg',alt:'原画虹桥木构细部，交叠的长木梁跨过河道',caption:'没有河心桥墩的木拱、层层交叠的梁木和临水的桥栏，是虹桥最鲜明的形制。三维构件的尺寸及接合方式含推定。'},
  boat:{src:'assets/reference-boat.jpg',alt:'原画虹桥旁正在过桥的大船及忙碌的船工',caption:'大船、低下的桅杆、交叉的绳索与协力的船工。画境把这组关系留在桥旁，让人可以停下来观看。'},
  street:{src:'assets/reference-street.jpg',alt:'原画的低檐铺面、摊贩、担筐与行人',caption:'热闹藏在买卖、负重、交谈和歇脚这些小事里。画境中的衣装与器具取意于这些细部，具体人物为重新绘制。'}
};
$('reference-image').addEventListener('load',e=>{const img=e.target;img.parentElement.style.aspectRatio=img.naturalWidth+'/'+img.naturalHeight;});
function setReference(key){const r=references[key]||references.overview;const img=$('reference-image');img.src=r.src;img.alt=r.alt;img.style.width='100%';$('reference-zoom').value='1';$('reference-zoom-value').value='1×';$('reference-caption').textContent=r.caption;for(const b of document.querySelectorAll('[data-reference]'))b.setAttribute('aria-pressed',String(b.dataset.reference===key));}
function openReference(key='overview'){keys.clear();touch.x=touch.y=0;setReference(key);$('reference-dialog').showModal();}
$('reference-toggle').addEventListener('click',()=>openReference());
$('reference-close').addEventListener('click',()=>$('reference-dialog').close());
$('detail-reference').addEventListener('click',()=>{const key=nearest?.id==='bridge'?'bridge':nearest?.id==='boat'?'boat':'street';$('detail-dialog').close();openReference(key);});
for(const b of document.querySelectorAll('[data-reference]'))b.addEventListener('click',()=>setReference(b.dataset.reference));
$('reference-zoom').addEventListener('input',e=>{const zoom=Number(e.target.value);$('reference-image').style.width=zoom*100+'%';$('reference-zoom-value').value=zoom+'×';});
$('help-toggle').addEventListener('click',()=>{keys.clear();$('help-dialog').showModal();});$('help-close').addEventListener('click',()=>$('help-dialog').close());
$('inspect').addEventListener('click',showDetail);$('detail-close').addEventListener('click',()=>$('detail-dialog').close());$('detail-return').addEventListener('click',()=>$('detail-dialog').close());
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{keys.clear();if(state==='walking')renderer.domElement.focus({preventScroll:true});});
document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]'))return;
  if(e.code==='Escape'){if(!$('map-panel').hidden){$('map-panel').hidden=true;$('map-toggle').setAttribute('aria-expanded','false');}else if(state==='walking')welcome();return;}
  if(state!=='walking')return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();if(tour)stopTour();if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown'].includes(e.code))leaveSeat();keys.add(e.code);}
  if(e.code==='KeyE')showDetail();
});document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();touch.x=touch.y=0;});
$('scene').addEventListener('pointerdown',e=>{if(state!=='walking'||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};$('scene').setPointerCapture(e.pointerId);if(tour)stopTour();});
$('scene').addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;yaw-=(e.clientX-drag.x)*.004;pitch-= (e.clientY-drag.y)*.0033;pitch=THREE.MathUtils.clamp(pitch,-1.2,1.1);drag.x=e.clientX;drag.y=e.clientY;});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('scene').addEventListener(ev,()=>drag=null);
$('joystick').addEventListener('pointerdown',e=>{leaveSeat();joystickId=e.pointerId;$('joystick').setPointerCapture(e.pointerId);if(tour)stopTour();joystick(e);});
$('joystick').addEventListener('pointermove',e=>{if(e.pointerId===joystickId)joystick(e);});
function joystick(e){const r=$('joystick').getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,lim=r.width*.32,len=Math.hypot(dx,dy),factor=len>lim?lim/len:1;touch.x=dx*factor/lim;touch.y=dy*factor/lim;$('stick').style.transform=`translate(${dx*factor}px,${dy*factor}px)`;}
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(ev,()=>{joystickId=null;touch.x=touch.y=0;$('stick').style.transform='';});

function createSound(){
  const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return null;
  const ctx=new AudioContext(),master=ctx.createGain();master.gain.value=.0;master.connect(ctx.destination);
  const buffer=ctx.createBuffer(1,ctx.sampleRate*5,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
  for(let i=0;i<data.length;i++){brown=(brown+(Math.random()*2-1)*.025)/1.025;data[i]=brown*2;}
  const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=650;const waterGain=ctx.createGain();waterGain.gain.value=.17;noise.connect(low).connect(waterGain).connect(master);noise.start();
  // A very low, nonverbal market bed: filtered noise with unequal speech-like envelopes.
  // This is synthesized ambience, not an archival or location recording.
  for(let i=0;i<3;i++){
    const voice=ctx.createBiquadFilter();voice.type='bandpass';voice.frequency.value=[260,590,980][i];voice.Q.value=2.7;
    const gain=ctx.createGain();gain.gain.value=.012;
    noise.connect(voice).connect(gain).connect(master);
    const mod=ctx.createOscillator(),depth=ctx.createGain();mod.frequency.value=.61+i*.23;depth.gain.value=.008;mod.connect(depth).connect(gain.gain);mod.start();
  }
  function step(onWood){
    const t=ctx.currentTime,gain=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=onWood?520:340;
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(onWood?.024:.013,t+.007);gain.gain.exponentialRampToValueAtTime(.0001,t+.13);
    const source=ctx.createBufferSource();source.buffer=buffer;source.connect(filter).connect(gain).connect(master);source.start(t,Math.random()*4);source.stop(t+.16);
  }
  // Light bird phrases, synthesized for this scene; no borrowed field recording.
  const timer=setInterval(()=>{if(!soundEnabled||document.hidden)return;const start=ctx.currentTime;for(let j=0;j<2;j++){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(1500+Math.random()*650,start+j*.14);osc.frequency.exponentialRampToValueAtTime(2400+Math.random()*500,start+j*.14+.08);gain.gain.setValueAtTime(0,start+j*.14);gain.gain.linearRampToValueAtTime(.018,start+j*.14+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+j*.14+.12);osc.connect(gain).connect(master);osc.start(start+j*.14);osc.stop(start+j*.14+.15);}},7100);
  return {ctx,master,timer,step};
}
$('sound-toggle').addEventListener('click',async()=>{try{if(!sound)sound=createSound();if(!sound){announce('浏览器暂不支持环境音。');return;}await sound.ctx.resume();soundEnabled=!soundEnabled;$('sound-toggle').dataset.audioState=sound.ctx.state;lastFootstep=travel;sound.master.gain.setTargetAtTime(soundEnabled?.7:0,sound.ctx.currentTime,.2);$('sound-toggle').setAttribute('aria-pressed',String(soundEnabled));$('sound-toggle').title=soundEnabled?'关闭环境音':'开启环境音';$('sound-icon').textContent=soundEnabled?'◉':'○';announce(soundEnabled?'环境音已开启。':'环境音已关闭。');}catch{announce('环境音未能开启。');}});
document.addEventListener('visibilitychange',()=>{keys.clear();if(sound){if(document.hidden)sound.ctx.suspend();else if(soundEnabled)sound.ctx.resume();}});
window.addEventListener('resize',()=>{if(!renderer)return;touchDevice=matchMedia('(pointer: coarse)').matches||innerWidth<700;$('touch-controls').hidden=state!=='walking'||!touchDevice;$('touch-controls').style.display=touchDevice&&state==='walking'?'flex':'';renderer.setPixelRatio(Math.min(devicePixelRatio,touchDevice?1.5:1.75));camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);const s=renderer.getDrawingBufferSize(new THREE.Vector2());target.setSize(s.x,s.y);post.uniforms.resolution.value.copy(s);});
window.addEventListener('error',e=>{if(!world)fail(e.error||e.message);});
window.addEventListener('pagehide',event=>{
  if(event.persisted)return;
  if(sound){clearInterval(sound.timer);sound.ctx.close();}
  target?.dispose();paintedWater?.reflectionTarget.dispose();
  renderer?.dispose();renderer?.forceContextLoss();
});

// Local-only, visible review controls give repeatable construction close-ups.
// They are never mounted on the hosted experience.
if(['127.0.0.1','localhost'].includes(location.hostname)&&new URLSearchParams(location.search).has('atelier')){
  const {mountAtelier}=await import('./atelier.js?v=20261019r8');
  mountAtelier({
    view(p){startWalk({x:p.eye[0],z:p.eye[2],yaw:0});studyEye=p.eye[1];studyFov=p.fov??48;const target=new THREE.Vector3(...p.look),eye=new THREE.Vector3(...p.eye),delta=target.sub(eye);yaw=Math.atan2(-delta.x,-delta.z);pitch=Math.atan2(delta.y,Math.hypot(delta.x,delta.z));setCamera();},
    freeze(value){studyFrozen=value;if(value)simTime=24;},
    palette(name){setLightPalette(name);},
    figures(value){world.people.group.visible=value;world.tableaux.group.visible=value;renderer.shadowMap.needsUpdate=true;},
    reset(){studyEye=null;studyFov=null;studyFrozen=false;world.people.group.visible=true;world.tableaux.group.visible=true;startWalk(PLACES.south);}
  });
}
