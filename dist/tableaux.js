import * as THREE from './assets/three.module.js';
import {canvasTexture} from './ink.js?v=20261019r6';

// Seated tea guests and low-stall sellers have a separate, folded silhouette.
// Four views share the handscroll palette; these are newly drawn reconstructions.
const cache=new Map();
const VIEW_STEP=Math.PI*.5,VIEW_MARGIN=7*Math.PI/180;
const wrapAngle=angle=>((angle+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
function stablePaintedView(relative,previous=-1){
  const nearest=((Math.round(relative/VIEW_STEP)%4)+4)%4;
  if(previous<0)return nearest;
  return Math.abs(wrapAngle(relative-previous*VIEW_STEP))>VIEW_STEP*.5+VIEW_MARGIN+1e-9?nearest:previous;
}
function seatedTexture(view,variant){
  const key=view+'-'+variant;if(cache.has(key))return cache.get(key);
  const tx=canvasTexture(384,576,ctx=>paintSeated(ctx,view,variant));
  tx.generateMipmaps=false;tx.minFilter=THREE.LinearFilter;cache.set(key,tx);return tx;
}
// The base and near textures execute the same paths, including their existing
// seated silhouette and foot anchors; no enlarged low-resolution bitmap is used.
function paintSeated(ctx,view,variant,rasterScale=1){
    ctx.scale(1.2,1.2);ctx.lineCap='round';ctx.lineJoin='round';
    const side=view===1||view===3,back=view===2;
    if(view===3){ctx.translate(320,0);ctx.scale(-1,1);}
    const ink='#575145',cloth=variant?'#b58a6d':'#819ba0',shade=variant?'#886a57':'#577780',pale='#e0d4b6',skin='#d7b799',hair='#44483e';
    const glow=ctx.createLinearGradient(75,125,233,430);glow.addColorStop(0,'#fff2d643');glow.addColorStop(.45,'#eee2bf0a');glow.addColorStop(1,'#405e6b2c');
    const bloom=ctx.createRadialGradient(134,200,8,149,242,145);bloom.addColorStop(0,'#fae8c82b');bloom.addColorStop(1,'#e6debf00');
    const path=d=>new Path2D(d.replace(/(-?\d*\.?\d+)(\s+)(-?\d*\.?\d+)/g,(_,xs,gap,ys)=>{
      let x=+xs,y=+ys;const fullness=Math.sin(Math.max(0,Math.min(1,(y-220)/105))*Math.PI);
      x+=Math.sign(x-153)*5.5*fullness;return x+gap+y;
    }));
    const draw=(d,fill=null,width=1.15,alpha=.9)=>{const p=path(d);ctx.save();if(fill){ctx.fillStyle=fill;ctx.fill(p);if(width&&(fill===cloth||fill===pale)){ctx.save();ctx.clip(p);ctx.fillStyle=glow;ctx.fillRect(0,0,320,480);ctx.fillStyle=bloom;ctx.fillRect(0,0,320,480);ctx.restore();}}if(width){ctx.strokeStyle=ink;ctx.lineWidth=width*(fill?.92:1);ctx.globalAlpha=alpha*(fill?.77:1);ctx.stroke(p);}ctx.restore();return p;};
    const line=(d,w=.82,a=.74)=>{
      if(w<.75){draw(d,null,w*3,a*.08);draw(d,null,w,a);return;}
      (d.match(/M[^M]+/g)||[d]).forEach((p,i)=>{const weight=[.94,.65,.82,.56][i%4];draw(p,null,w*3,a*.08);draw(p,null,w*(.7+weight*.3),a*weight);});
    };
    const wash=(d,a=.2)=>{ctx.save();ctx.globalAlpha=a;ctx.filter=`blur(${.9*rasterScale}px)`;draw(d,shade,0);ctx.restore();};
    // Soft shoes below bent knees, with separate soles.
    draw(side?'M201 427 Q196 442 211 451 L254 455 Q264 452 253 445 L227 437 L226 421Z':'M91 426 Q83 440 62 447 Q55 455 69 458 L111 451 L119 433Z',hair);
    draw(side?'M140 414 Q131 438 142 442 L179 439 Q187 435 176 431 L163 424 L167 411Z':'M204 426 L205 446 Q225 457 250 454 Q257 449 244 444 L227 432Z',hair);
    line(side?'M211 450 L256 452 M143 439 L178 436':'M64 453 L107 447 M209 446 Q229 452 247 451',.7,.5);
    if(side){
      draw('M134 249 Q168 253 181 289 Q211 287 247 308 Q263 324 251 347 L235 430 Q216 444 193 432 L196 358 L156 341 Q138 343 126 322 L122 282Z',cloth);
      draw('M135 274 Q168 282 182 315 L170 422 Q151 432 131 419 L139 333 L118 314Z',pale);
      wash('M153 296 Q175 314 171 340 L159 422 L143 419 L148 330Z');
      line('M181 307 Q218 300 244 324 M188 321 Q220 315 244 333 M209 346 Q207 384 208 422 M224 350 L219 432 M135 318 Q154 330 168 326 M143 346 L140 405');
    }else{
      draw(back?'M121 257 Q95 277 71 309 Q64 326 84 347 L95 433 Q119 444 139 428 L137 348 L166 344 L180 432 Q205 444 229 433 L235 348 Q259 322 240 304 L182 262Z':
        'M121 257 Q95 277 71 309 Q64 326 84 347 L95 433 Q119 444 139 428 Q153 435 166 431 L180 432 Q205 444 229 433 L235 348 Q259 322 240 304 L182 262Z',cloth);
      if(!back){wash('M148 346 Q146 383 157 429 L142 427 L135 358Z',.11);line('M150 348 Q146 377 151 403 M166 364 Q160 398 168 428',.56,.43);}
      wash('M111 294 Q105 323 114 351 L124 432 L100 430 L91 345 Q83 327 99 307Z');
      wash('M208 297 Q222 316 216 343 L211 433 L225 430 L232 339Z',.15);
      line('M120 281 Q102 292 84 317 M137 297 Q112 301 95 328 M177 291 Q209 291 236 319 M168 305 Q206 307 226 331 M99 346 L108 423 M124 351 L126 420 M185 347 Q200 377 195 425 M215 350 L218 418 M133 335 Q154 344 177 335');
    }
    // A long robe gathered at the waist and over the knees, wide closed sleeves.
    draw(side?'M132 110 Q153 104 172 116 Q194 153 190 197 L187 269 Q203 284 223 301 Q207 323 173 317 L126 298 Q113 266 119 233 L105 196 Q100 158 117 128Z':'M128 108 Q148 99 174 110 Q198 122 209 159 L222 221 Q211 247 188 243 L190 274 Q214 292 216 310 Q156 332 94 309 L115 273 L111 225 Q88 236 75 219 Q74 190 96 140Z',cloth);
    wash(side?'M134 131 Q144 177 138 231 L145 280 L169 309 L131 295 L121 266 L125 187Z':'M127 129 Q124 194 135 241 L125 280 L112 310 L97 307 L117 273 L114 221Z',.16);
    if(!back){
      draw(side?'M127 130 Q110 157 113 195 L149 223 L177 229 L183 249 Q160 261 141 249 L105 224 Q90 209 95 182 L112 141Z':'M109 132 Q91 158 78 196 Q81 218 107 232 L147 239 L157 220 L118 204 L128 164Z',cloth);
      draw(side?'M175 131 Q194 156 197 188 L218 219 L213 240 L187 243 L169 218 L159 164Z':'M184 132 Q203 155 217 196 L219 221 Q202 240 177 237 L146 235 L146 215 L184 213 L170 162Z',cloth);
      const hand=draw(side?'M164 226 Q169 221 175 222 L188 226 Q192 228 188 232 L182 232 L178 240 Q173 245 167 240Z':
        'M144 224 Q149 218 156 221 L169 224 Q175 227 171 231 L165 231 L162 236 Q156 241 149 235Z',skin,.78);
      ctx.save();ctx.clip(hand);line(side?'M171 230 L184 231 M170 234 L181 235 M173 238 L179 238':
        'M151 228 L167 230 M151 232 L163 234 M155 236 L160 237',.43,.57);ctx.restore();
      if(variant===0){
        const x=side?184:165;
        // Song tea was whisked in open bowls. A flared Jian-style tea bowl has
        // a small foot, iron-brown glaze and a pale tea surface, with no handle.
        draw(`M${x-13} 210 Q${x} 205 ${x+13} 211 L${x+9} 224 Q${x} 231 ${x-8} 224Z`,'#75624e',.8);
        draw(`M${x-5} 226 L${x+6} 226 L${x+7} 230 Q${x} 233 ${x-6} 230Z`,'#8d755a',.54);
        draw(`M${x-13} 210 Q${x} 204 ${x+13} 211 Q${x+1} 217 ${x-13} 210Z`,'#c8b895',.58);
        draw(`M${x-10} 210 Q${x} 207 ${x+10} 211 Q${x} 214 ${x-10} 210Z`,'#d9caab',0);
        line(`M${x-9} 214 Q${x-5} 222 ${x-3} 224 M${x+8} 214 L${x+5} 223`,.43,.35);
        ctx.save();ctx.strokeStyle='#cbb38c';ctx.lineWidth=.55;ctx.globalAlpha=.54;ctx.stroke(path(`M${x-11} 210 Q${x} 205 ${x+12} 211`));ctx.restore();
      }
      draw(side?'M136 108 L156 130 L173 111 L165 99 L145 99Z':'M131 108 L149 133 L178 111 L165 99 L143 99Z',pale,.9);
      line(side?'M133 115 Q145 139 168 137 L181 169':'M129 115 Q144 141 169 138 L182 176',1.1);line('M170 134 Q151 160 141 184',.95);
    }else{line('M131 113 Q151 131 176 111 M151 130 L149 190 M126 175 Q129 224 137 245');}
    line(side?'M121 155 Q111 180 121 197 M114 216 Q135 234 157 236 M179 164 L188 188 M133 253 Q137 278 164 298 M160 261 L184 294':'M107 155 Q96 173 94 190 M91 207 Q108 222 135 227 M186 162 Q198 185 199 206 M132 253 Q127 279 114 296 M151 253 L151 305 M173 251 Q182 282 197 301',.92);
    ctx.save();ctx.globalCompositeOperation='source-atop';
    line(side?'M128 295 Q174 318 217 302 M134 414 Q151 426 168 417 M197 429 Q216 439 234 427':
      'M99 305 Q156 328 211 306 M98 429 Q117 439 136 425 M183 430 Q204 439 226 429',.65,.55);
    if(!back)draw(side?'M159 225 L165 226 L170 240 L163 246Z':'M138 220 L145 221 L150 237 L142 241Z',pale,.54);
    ctx.strokeStyle='#a49e86';ctx.lineWidth=.85;ctx.globalAlpha=.49;
    ctx.stroke(path(side?'M211 449 Q230 453 252 450 M144 437 L176 434':'M66 452 Q84 454 105 444 M212 446 Q229 451 247 450'));
    ctx.restore();
    // A gently enlarged skull joins relaxed shoulders; the cup guest and stall
    // seller have quiet, different expressions under close-fitting Song headcloth.
    draw(side?'M146 91 L142 109 Q152 118 163 110 L167 103 L162 87Z':'M145 91 L141 108 Q153 118 166 109 L163 88Z',skin,.86);
    ctx.save();ctx.translate(153,113);ctx.scale(1.10,1.10);ctx.translate(-153,-109);
    draw(side?'M140 43 Q156 34 169 45 Q177 52 173 65 Q175 70 179 74 Q180 78 175 79 Q177 87 169 93 Q161 99 151 90 L141 79 Q134 74 134 61Z':'M136 43 Q152 34 169 46 L173 66 Q173 83 162 94 Q152 99 142 90 Q131 77 132 61Z',skin,.92);
    if(!back){
      ctx.save();ctx.globalAlpha=.13;ctx.filter=`blur(${.7*rasterScale}px)`;draw(side?'M145 72 Q153 65 164 73 Q168 79 161 83 L149 80Z':'M135 72 Q141 67 146 73 L144 80 L138 80Z M159 73 Q164 68 168 74 L166 81 L160 79Z','#c38370',0);ctx.restore();
      ctx.save();ctx.globalAlpha=.18;ctx.filter=`blur(${.7*rasterScale}px)`;draw(side?'M142 46 Q151 39 158 45 L151 62 L142 67Z':'M139 46 Q147 40 153 45 L149 64 L139 67Z','#fff1d4',0);ctx.restore();
      line(side?'M164 60 Q168 57 172 61':'M137 59 Q142 57 146 59 M156 59 Q161 57 165 61',.53,.64);
      line(side?'M165 65 Q169 63 172 66':variant?'M137 64 Q142 62 146 65 M156 65 Q161 62 165 66':'M138 65 Q142 68 146 65 M157 66 Q161 68 165 66',.67,.84);
      if(variant)line(side?'M169 65 L171 66':'M142 64 L143 66 M160 65 L161 67',.63,.86);
      line(side?'M175 80 L171 81 M169 86 Q173 89 177 85':'M151 66 Q151 72 149 76 L152 78 M147 87 Q153 90 160 85',.5,.67);
      line(side?'M140 68 Q135 64 138 75 L141 78':'M135 69 Q130 66 132 73 L137 78 M149 92 L156 92',.46,.47);
    }
    draw(side?'M133 64 Q129 46 137 33 Q149 25 165 36 Q174 44 174 58 L162 51 L147 54Z':'M130 65 L130 45 Q135 31 150 30 L167 36 Q174 47 175 63 L155 56Z',hair,.93);
    draw(side?'M136 35 L125 33 Q118 35 121 45 L125 59 L135 59Z':'M133 37 L125 34 Q118 36 121 47 L127 59 L134 57Z',hair,.84);
    ctx.save();ctx.strokeStyle='#929582';ctx.globalAlpha=.38;ctx.lineWidth=.66;ctx.stroke(new Path2D(side?'M135 44 Q151 36 167 47 M124 37 L130 50':'M136 44 Q149 39 167 48 M122 38 L129 50'));ctx.restore();
    if(back)draw('M132 60 Q134 79 143 86 L163 86 Q172 75 172 61 L155 57Z',hair,.88);
    else if(variant)line(side?'M164 91 Q170 108 165 116 M169 91 Q175 103 171 112':'M145 93 Q146 110 156 115 M162 92 Q165 107 156 115',.66,.68);
    ctx.restore();
    ctx.save();ctx.globalCompositeOperation='source-atop';
    for(let i=0;i<260;i++){const x=70+(Math.sin(i*12.9)*.5+.5)*180,y=50+(Math.sin(i*6.7)*.5+.5)*390;ctx.fillStyle=i%3?'#5363590d':'#fff0cb26';ctx.fillRect(x,y,.65,2.6);}
    ctx.restore();
}

// Exactly two reusable near-view canvases. Each 704×1056 texture is redrawn from
// vectors at 11/6 scale; together their complete mip chains occupy < 7.563 MiB.
// The original eight 384×576 textures remain untouched and are never disposed.
const SEATED_DETAIL_SCALE=11/6,SEATED_DETAIL_ENTER=1.35,SEATED_DETAIL_EXIT=1.6;
const seatedDetailSlots=[];
let seatedDetailClock=0;
function paintSeatedDetail(ctx,view,variant){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,704,1056);ctx.save();
  ctx.scale(SEATED_DETAIL_SCALE,SEATED_DETAIL_SCALE);
  paintSeated(ctx,view,variant,SEATED_DETAIL_SCALE);ctx.restore();
}
function getSeatedDetail(view,variant){
  const key=view+'-'+variant;
  let slot=seatedDetailSlots.find(s=>s.key===key);
  if(slot){slot.used=++seatedDetailClock;return slot;}
  if(seatedDetailSlots.length<2){
    slot={key,map:canvasTexture(704,1056,ctx=>paintSeatedDetail(ctx,view,variant)),users:new Set(),used:++seatedDetailClock};
    seatedDetailSlots.push(slot);return slot;
  }
  slot=seatedDetailSlots.filter(s=>s.users.size===0).sort((a,b)=>a.used-b.used)[0];
  if(!slot)return null;
  paintSeatedDetail(slot.map.image.getContext('2d'),view,variant);slot.map.needsUpdate=true;
  slot.key=key;slot.used=++seatedDetailClock;return slot;
}
export class Tableaux{
  constructor(scene){this.group=new THREE.Group();scene.add(this.group);this.items=[];this.temp=new THREE.Vector3();}
  add(x,z,{y=.22,heading=0,variant=0,scale=1}={}){
    const h=1.38*scale,material=new THREE.MeshBasicMaterial({map:seatedTexture(0,variant),transparent:true,alphaTest:.17,side:THREE.DoubleSide,color:'#fff7e9'});
    const breath={value:0};
    material.onBeforeCompile=shader=>{
      shader.uniforms.uInkBreath=breath;shader.vertexShader='uniform float uInkBreath;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat chest = smoothstep(0.39, 0.55, uv.y) * (1.0 - smoothstep(0.68, 0.78, uv.y));\ntransformed.x *= 1.0 + uInkBreath * 0.0032 * chest;\ntransformed.y += uInkBreath * 0.0011 * chest;');
    };
    material.customProgramCacheKey=()=> 'qingming-seated-breath-1';
    const m=new THREE.Mesh(new THREE.PlaneGeometry(h*2/3,h,4,12),material);m.position.set(x,y+h*(.958-.5),z);this.group.add(m);this.items.push({m,heading,variant,breath,phase:x*.73+z*.31,view:-1,baseMap:material.map,detail:null,detailNear:false});
  }
  update(time,camera){
    for(const p of this.items){
      const a=Math.atan2(camera.position.x-p.m.position.x,camera.position.z-p.m.position.z);p.m.rotation.y=a;
      const view=stablePaintedView(a-p.heading,p.view);if(view!==p.view){p.baseMap=seatedTexture(view,p.variant);p.view=view;}
      p.breath.value=Math.sin(time*.87+p.phase);
    }
    // Only release this controller's own materials. A slot used by any other
    // controller remains pinned; overflow leaves a valid original texture.
    const candidates=[];camera.getWorldDirection(this.temp);
    const forwardLength=Math.hypot(this.temp.x,this.temp.z);
    for(const p of this.items){
      const retained=!!p.detail;p.m.material.map=p.baseMap;
      if(p.detail){p.detail.users.delete(p.m.material);p.detail=null;}
      const dx=p.m.position.x-camera.position.x,dz=p.m.position.z-camera.position.z,distance=Math.hypot(dx,dz);
      p.detailNear=distance<(p.detailNear?SEATED_DETAIL_EXIT:SEATED_DETAIL_ENTER);
      const facing=distance<.05||forwardLength<.05?1:(dx*this.temp.x+dz*this.temp.z)/(distance*forwardLength);
      if(p.detailNear&&facing>(retained?-.15:.1))candidates.push({p,priority:distance-(retained?.1:0)});
    }
    candidates.sort((a,b)=>a.priority-b.priority);const chosen=new Map();
    for(const {p} of candidates){
      const key=p.view+'-'+p.variant;let slot=chosen.get(key);
      if(!slot&&chosen.size<2){slot=getSeatedDetail(p.view,p.variant);if(slot)chosen.set(key,slot);}
      if(!slot)continue;
      slot.users.add(p.m.material);p.detail=slot;p.m.material.map=slot.map;
    }
  }
  get count(){return this.items.length;}
}
