/* Original faint ink background for the existing Bian River street district.
 * Optional integration: createDistantWash({THREE,scene,groundHeight}).
 * Static, outside the walk boundary, no collision or new destination.
 */
export function createDistantWash({THREE,scene,groundHeight=()=>.22}) {
  const root=new THREE.Group();root.name='distant-plain-wash';scene.add(root);
  const geometries=[],materials=[],W=1024,H=256,TW=256,TH=128,TAU=Math.PI*2;
  let seed=161027;const rand=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;},between=(a,b)=>a+(b-a)*rand();
  const stats={drawCalls:0,vertices:0,triangles:0,textureCount:1,textureWidth:W,textureHeight:H,textureBytes:0,layers:[],transparent:true,depthWrite:false};
  // Eight original strips: slender crooked trunks, open branching and scattered
  // early leaves. Trees remain separate; there is no mountain-shaped green mass.
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.__distantWashAsset='atlas';
  const c=canvas.getContext('2d');
  function stroke(points,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let j=0;j<points.length;j++){const p=points[j];j?c.lineTo(...p):c.moveTo(...p);}c.stroke();}
  function house(x,y,w,h,variant){
    const roofY=y-h*.65;
    c.fillStyle='#b3b69b9e';c.beginPath();c.moveTo(x-w*.43,roofY);c.lineTo(x+w*.40,roofY);c.lineTo(x+w*.39,y);c.lineTo(x-w*.41,y+.7);c.closePath();c.fill();
    c.fillStyle='#7e8a7cb3';c.beginPath();c.moveTo(x-w*.56,roofY+1);c.quadraticCurveTo(x-w*.39,roofY-1,x-w*.18,y-h);c.lineTo(x+w*.22,y-h+.7);c.quadraticCurveTo(x+w*.43,roofY-1,x+w*.57,roofY+1.4);c.lineTo(x+w*.46,roofY+2.4);c.lineTo(x-w*.54,roofY+2);c.closePath();c.fill();
    stroke([[x-w*.49,roofY+2],[x+w*.50,roofY+2.4]],'#71807397',.60);
    for(let k=0;k<4;k++)stroke([[x-w*.31+k*w*.20,roofY+2.5],[x-w*.32+k*w*.20,y-.4]],'#7a86758e',.50);
    c.fillStyle='#78827368';c.fillRect(x+(variant?-.18:.05)*w,roofY+4,w*.12,h*.31);
    for(let k=0;k<4;k++)stroke([[x-w*.27+k*w*.17,y-h+2],[x-w*.43+k*w*.24,roofY+.4]],'#abb5a160',.45);
  }
  function tree(x,base,h,variant){
    const lean=between(-8,8),width=between(1.1,1.9),bend=between(-5,5),crown=base-h;
    const trunk=[[x,base],[x+lean*.19,base-h*.25],[x+lean*.44+bend,base-h*.52],[x+lean*.73,base-h*.78],[x+lean,crown]];
    stroke(trunk,'#798472a8',width);stroke(trunk.map(p=>[p[0]-.55,p[1]]),'#bac2a366',.40);
    for(let branch=0;branch<8;branch++){
      const t=.34+branch*.077,startY=base-h*t,startX=x+lean*t+bend*Math.sin(t*Math.PI),side=branch%2?-1:1,reach=between(8,21)*(1-t*.34),rise=between(11,25),endX=startX+side*reach,endY=startY-rise;
      stroke([[startX,startY],[startX+side*reach*.44,startY-rise*.29],[endX,endY]],'#7b877288',.48+(1-t)*.56);
      for(let twig=0;twig<3;twig++){
        const f=.48+twig*.23,xx=startX+(endX-startX)*f,yy=startY+(endY-startY)*f,tipX=xx+side*between(2.5,7.5),tipY=yy-between(6,13);
        stroke([[xx,yy],[tipX,tipY]],'#7b88766f',.43);
        // Uneven dry brush dots stay off the lower trunk and leave light gaps.
        for(let leaf=0;leaf<5;leaf++){
          const lx=tipX+between(-5,5),ly=tipY+between(-3,5),ll=between(1.2,3.1);
          c.fillStyle=leaf%3?'#8d9a7b8b':'#afb59380';c.beginPath();c.ellipse(lx,ly,ll,between(.5,1.0),between(-1.2,1.2),0,TAU);c.fill();
        }
      }
      if(variant%3===1&&branch%2===0){for(let k=0;k<2;k++){const sx=endX+k*2,sy=endY+2;stroke([[sx,sy],[sx+2,sy+9],[sx+1,sy+18]],'#919d7b76',.48);}}
    }
    // Translucent, broken pigment sits behind a few of the fine branch tips.
    for(let k=0;k<15;k++){
      const y=base-h*between(.57,.98),xx=x+lean*.7+between(-15,15),rx=between(2.5,6),ry=between(1.7,3.5);
      c.fillStyle=k%3?'#8c9b7622':'#abb68b27';c.beginPath();c.ellipse(xx,y,rx,ry,between(-.6,.6),0,TAU);c.fill();
    }
  }
  for(let tile=0;tile<8;tile++){
    const ox=tile%4*TW,oy=Math.floor(tile/4)*TH;c.save();c.translate(ox,oy);c.beginPath();c.rect(1,1,TW-2,TH-2);c.clip();c.lineCap='round';c.lineJoin='round';
    // A few disconnected scrub stains end softly above the buried card edge.
    for(let k=0;k<12;k++){
      const x=between(18,238),y=between(119,129),rx=between(10,23),ry=between(3,7),g=c.createRadialGradient(x,y,0,x,y,rx);
      g.addColorStop(0,'#9ca58435');g.addColorStop(1,'#9ca58400');c.save();c.translate(x,y);c.scale(1,ry/rx);c.translate(-x,-y);c.fillStyle=g;c.fillRect(x-rx,y-rx,rx*2,rx*2);c.restore();
    }
    if(tile===2||tile===6)house(tile===2?166:85,126,between(36,45),between(24,29),tile===6);
    const count=tile===3?2:tile%3===0?4:3;
    for(let k=0;k<count;k++){
      const x=25+(k+.45)/(count+.2)*199+between(-8,8),base=between(124,129),h=between(48,93)*(tile===3?.83:1);
      tree(x,base,h,k+tile);
    }
    // Texture edges and tree feet dissolve; no rectangle or ground seam survives.
    c.globalCompositeOperation='destination-in';const feet=c.createLinearGradient(0,0,0,TH);feet.addColorStop(0,'#ffffff00');feet.addColorStop(.07,'#ffffffff');feet.addColorStop(.86,'#ffffffff');feet.addColorStop(.995,'#ffffff00');feet.addColorStop(1,'#ffffff00');c.fillStyle=feet;c.fillRect(0,0,TW,TH);
    const edges=c.createLinearGradient(0,0,TW,0);edges.addColorStop(0,'#ffffff00');edges.addColorStop(.055,'#ffffffff');edges.addColorStop(.945,'#ffffffff');edges.addColorStop(1,'#ffffff00');c.fillStyle=edges;c.fillRect(0,0,TW,TH);c.restore();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.name='original-distant-plain-ink';texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;
  for(let w=W,h=H;;w=Math.max(1,w>>1),h=Math.max(1,h>>1)){stats.textureBytes+=w*h*4;if(w===1&&h===1)break;}
  // Nested, nonintersecting ellipses wrap beyond the existing rear roofs and
  // continuing riverside shops. Gaps at |z|<13 keep the river open in both ends.
  // All valid player positions remain inside both layers, so outer -> inner is
  // a stable transparent order. Both render before other transparent figures.
  const layerSpecs=[{name:'outer',rx:145,rz:78,height:6.9,opacity:.36,order:-62,phase:3},{name:'inner',rx:127,rz:60,height:7.8,opacity:.60,order:-61,phase:0}];
  for(const layer of layerSpecs){
    const vertices=[],uv=[],indices=[],sectors=36,steps=3;let strips=0,minZ=Infinity,maxZ=-Infinity,minX=Infinity,maxX=-Infinity;
    for(let i=0;i<sectors;i++){
      const aa=i/sectors*TAU,bb=(i+1)/sectors*TAU,za=2+Math.sin(aa)*layer.rz,zb=2+Math.sin(bb)*layer.rz;
      if(Math.min(za,zb)<13&&Math.max(za,zb)>-13)continue;
      const tile=(i*5+Math.floor(i/7)+layer.phase)%8,base=vertices.length/3;
      for(let k=0;k<=steps;k++){
        const t=k/steps,a=aa+(bb-aa)*t,x=1.5+Math.cos(a)*layer.rx,z=2+Math.sin(a)*layer.rz,y=groundHeight(x,z)-.19;
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
        const u=(tile%4*TW+2+t*(TW-4))/W,v0=1-(Math.floor(tile/4)*TH+TH-2)/H,v1=1-(Math.floor(tile/4)*TH+2)/H;
        vertices.push(x,y,z,x,y+layer.height,z);uv.push(u,v0,u,v1);
        if(k<steps){const n=base+k*2;indices.push(n,n+2,n+1,n+2,n+3,n+1);}
      }
      strips++;
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();geometries.push(geometry);
    const material=new THREE.MeshBasicMaterial({map:texture,color:'#ffffff',transparent:true,opacity:layer.opacity,depthTest:true,depthWrite:false,side:THREE.FrontSide,fog:true,alphaTest:1/255});materials.push(material);
    const mesh=new THREE.Mesh(geometry,material);mesh.name='distant-wash-'+layer.name;mesh.renderOrder=layer.order;mesh.castShadow=false;mesh.receiveShadow=false;root.add(mesh);
    stats.drawCalls++;stats.vertices+=vertices.length/3;stats.triangles+=indices.length/3;stats.layers.push({...layer,strips,minX,maxX,minZ,maxZ});
  }
  root.userData.distantWashStats=stats;
  return {root,stats,dispose(){scene.remove(root);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();texture.dispose();}};
}
