import * as THREE from './assets/three.module.js';
import {canvasTexture,rng} from './ink.js?v=20261019r6';

// An original panoramic watercolor sky: pigment pools, broad cloud washes,
// and long dry-brush edges. No photographic or stock sky is used.
export function paintedSky(){
  const r=rng(10616);
  const texture=canvasTexture(2048,1024,(ctx,W,H)=>{
    const wash=ctx.createLinearGradient(0,0,0,H);
    wash.addColorStop(0,'#82afb9');wash.addColorStop(.34,'#b6d0d2');wash.addColorStop(.48,'#e1e6cf');wash.addColorStop(.54,'#ece6cc');wash.addColorStop(1,'#b4c6b0');
    ctx.fillStyle=wash;ctx.fillRect(0,0,W,H);
    for(let i=0;i<220;i++){
      const x=r()*W,y=r()*H*.55,rx=40+r()*180,ry=10+r()*35;
      ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
      const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(255,248,222,${.015+r()*.045})`);g.addColorStop(1,'rgba(255,248,222,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
    // Each mass is painted in translucent scalloped strokes, then softened
    // by a blue-grey underside and narrow cream highlights.
    for(let n=0;n<16;n++){
      const x=n/16*W+r()*70,y=330+r()*155,s=.45+r()*.9;
      for(let layer=0;layer<3;layer++)for(let k=0;k<18;k++){
        const xx=x+(k-8.5)*12*s,yy=y-Math.sin(k/17*Math.PI)*28*s+Math.sin(k*1.7+n)*6;
        ctx.fillStyle=layer===0?'rgba(125,164,164,.07)':layer===1?'rgba(248,242,216,.19)':'rgba(255,249,226,.18)';
        for(const wrap of [-W,0,W]){ctx.beginPath();ctx.ellipse(xx+wrap,yy-layer*5*s,16*s+r()*9,7*s+r()*5,0,0,Math.PI*2);ctx.fill();}
      }
      ctx.strokeStyle='rgba(255,249,224,.17)';ctx.lineWidth=.8;
      for(let k=0;k<12;k++){let yy=y+10+k*1.7*s;ctx.beginPath();ctx.moveTo(x-80*s,yy);ctx.bezierCurveTo(x-30*s,yy-3,x+40*s,yy+2,x+(80-k*3)*s,yy-2);ctx.stroke();}
    }
    for(let i=0;i<55000;i++){
      ctx.fillStyle=r()>.5?'rgba(255,255,236,.024)':'rgba(63,95,91,.017)';ctx.fillRect(r()*W,r()*H,1+r()*3,.6+r());
    }
  });texture.mapping=THREE.EquirectangularReflectionMapping;return texture;
}

export function createPaintedWater(mesh,{mobile=false}={}){
  const original=mesh.material.map;
  const reflectionTarget=new THREE.WebGLRenderTarget(mobile?576:896,mobile?384:576,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true});
  reflectionTarget.texture.name='汴河淡彩倒影';
  const textureMatrix=new THREE.Matrix4();
  const material=new THREE.ShaderMaterial({
    uniforms:{uMist:{value:new THREE.Color('#dce4d3')},ink:{value:original},reflection:{value:reflectionTarget.texture},reflectionMatrix:{value:textureMatrix},time:{value:0}},
    vertexShader:`uniform mat4 reflectionMatrix; varying vec4 mirrorCoord; varying vec3 world; void main(){vec4 p=modelMatrix*vec4(position,1.);world=p.xyz;mirrorCoord=reflectionMatrix*p;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`
      uniform sampler2D ink,reflection;uniform vec3 uMist;uniform float time;varying vec4 mirrorCoord;varying vec3 world;
      float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 uv=world.xz;float waves=sin(uv.x*2.7+uv.y*3.4+time*.45)*sin(uv.x*.42-uv.y*1.8-time*.31);
        vec2 q=mirrorCoord.xy/mirrorCoord.w;
        q+=vec2(sin(uv.y*3.1+time*.55),sin(uv.x*2.4-time*.27))*.0016;
        vec3 reflected=texture2D(reflection,clamp(q,.001,.999)).rgb;
        vec3 pigment=vec3(.28,.47,.42);
        vec3 grain=texture2D(ink,uv*vec2(.23,.25)+vec2(time*.0012,0.)).rgb;
        float depthWash=.035*sin(uv.y*.67)+.015*sin(uv.x*.17+uv.y*.1);
        float grazing=1.-clamp(normalize(cameraPosition-world).y,0.,1.);
        float reflectedWash=mix(.27,.44,pow(grazing,1.3));
        vec3 col=mix(pigment,reflected,reflectedWash)+depthWash;
        col*=.93+.15*grain.r;
        float glint=smoothstep(.88,.99,waves)*.018;
        col+=vec3(.85,.79,.56)*glint;
        float strand=pow(max(0.,sin(uv.y*42.+sin(uv.x*1.8+time*.2)*1.6)),32.)*smoothstep(.22,.95,sin(uv.x*3.1));
        col+=strand*.009;
        col=mix(col,uMist,smoothstep(48.,150.,length(cameraPosition-world)));
        gl_FragColor=vec4(col,1.);
      }`,side:THREE.DoubleSide,fog:false});
  mesh.material=material;mesh.receiveShadow=false;mesh.castShadow=false;
  const mirrorCamera=new THREE.PerspectiveCamera();mirrorCamera.rotation.order='YXZ';
  const forward=new THREE.Vector3(),at=new THREE.Vector3(),up=new THREE.Vector3(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),.49);
  let frames=0,lastX=Infinity,lastY=Infinity,lastZ=Infinity,lastYaw=Infinity,lastPitch=Infinity,lastFov=Infinity;
  return {material,reflectionTarget,update(t){material.uniforms.time.value=t;},renderReflection(renderer,scene,camera,force=false){
    // Refresh only when the view changes or every fourth frame. Geometry and
    // light stay static; people and breeze remain alive in the reflected view.
    frames++;const changed=Math.abs(camera.position.x-lastX)+Math.abs(camera.position.z-lastZ)+Math.abs(camera.rotation.y-lastYaw)*8+Math.abs(camera.rotation.x-lastPitch)*8+Math.abs(camera.position.y-lastY)+Math.abs(camera.fov-lastFov)>.012;
    if(!force&&!changed&&frames%12!==0)return;
    if(!force&&frames%3!==0)return;
    lastX=camera.position.x;lastY=camera.position.y;lastZ=camera.position.z;lastYaw=camera.rotation.y;lastPitch=camera.rotation.x;lastFov=camera.fov;
    mirrorCamera.copy(camera);mirrorCamera.position.y=-1.04-camera.position.y;
    camera.getWorldDirection(forward);forward.y=-forward.y;at.copy(mirrorCamera.position).add(forward);up.set(0,-1,0);mirrorCamera.up.copy(up);mirrorCamera.lookAt(at);mirrorCamera.updateMatrixWorld();
    textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(mirrorCamera.projectionMatrix).multiply(mirrorCamera.matrixWorldInverse);
    const oldTarget=renderer.getRenderTarget(),oldClips=renderer.clippingPlanes,oldAuto=renderer.shadowMap.autoUpdate;
    mesh.visible=false;renderer.clippingPlanes=[plane];renderer.shadowMap.autoUpdate=false;
    renderer.setRenderTarget(reflectionTarget);renderer.render(scene,mirrorCamera);
    renderer.setRenderTarget(oldTarget);renderer.clippingPlanes=oldClips;renderer.shadowMap.autoUpdate=oldAuto;mesh.visible=true;
  }};
}

// Delicate kettle steam is animated with shared, hand-painted transparent
// sheets. It is local to the tea and food counters, never a full-screen fog.
export function createSteam(scene,sources=[]){
  const map=canvasTexture(128,256,(ctx,W,H)=>{
    for(let j=4;j>=0;j--){
      ctx.strokeStyle=`rgba(249,249,233,${.08-j*.009})`;ctx.lineWidth=7+j*4;ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(W*.49,H);ctx.bezierCurveTo(W*.75,H*.65,W*.25,H*.38,W*.56,0);ctx.stroke();
    }
    ctx.globalCompositeOperation='destination-in';
    const fade=ctx.createLinearGradient(0,0,0,H);fade.addColorStop(0,'#ffffff00');fade.addColorStop(.24,'#ffffffa0');fade.addColorStop(.72,'#ffffffff');fade.addColorStop(1,'#ffffff90');ctx.fillStyle=fade;ctx.fillRect(0,0,W,H);
  });
  // All wisps share one draw and one texture. Their roots use the actual
  // liquid/spout/bamboo coordinates recorded while those objects are built.
  const vertices=[],uv=[],shape=[],ids=[];
  sources.forEach((source,index)=>{
    const size=source.kind==='steamer'?[.28,.65,.42]:source.kind==='kettle'?[.15,.52,.35]:[.17,.44,.31];
    for(let plume=0;plume<2;plume++){
      const base=vertices.length/3;
      for(const [u,v] of [[0,0],[1,0],[0,1],[1,1]]){vertices.push(...source.position);uv.push(u,v);shape.push(size[0],size[1]*(plume?1.12:1),index*1.71+plume*2.83,size[2]*(plume?.70:1));}
      ids.push(base,base+1,base+2,base+2,base+1,base+3);
    }
  });
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('steamShape',new THREE.Float32BufferAttribute(shape,4));geo.setIndex(ids);
  const material=new THREE.ShaderMaterial({uniforms:{map:{value:map},time:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`attribute vec4 steamShape; uniform float time; varying vec2 vUv; varying float vStrength;
      void main(){vUv=uv;vStrength=steamShape.w*(.84+.16*sin(time*.51+steamShape.z));
        vec3 toward=cameraPosition-position; vec3 right=normalize(vec3(toward.z,0.,-toward.x)+vec3(.0001,0.,0.));
        float drift=(sin(time*.62+uv.y*3.8+steamShape.z)-sin(time*.62+steamShape.z))*.034*uv.y;
        float spread=steamShape.x*(.63+.37*uv.y);
        vec3 point=position+right*((uv.x-.5)*spread+drift)+vec3(0.,uv.y*steamShape.y,0.);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(point,1.);
      }`,
    fragmentShader:`uniform sampler2D map; varying vec2 vUv; varying float vStrength;
      void main(){vec4 wash=texture2D(map,vUv);gl_FragColor=vec4(wash.rgb,wash.a*vStrength);}
    `});
  const mesh=new THREE.Mesh(geo,material);mesh.name='vessel-anchored steam';mesh.frustumCulled=false;scene.add(mesh);
  return {mesh,sources,update(t){material.uniforms.time.value=t;}};
}
