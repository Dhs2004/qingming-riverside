import * as THREE from './assets/three.module.js';
import {canvasTexture,between,group} from './ink.js?v=20261019r6';
import {paintTownsfolk} from './townsfolk.js?v=20261019r14';

// Song clothing, painted in restrained indigo, sage, madder earth and ivory.
// Roles are visual reconstructions, with warmer watercolour light than the aged silk.
const PALETTES=[
  ['#7d999b','#536f79','#dfd3b9'], // indigo long-robed reader
  ['#b7896d','#855e51','#e0cfad'], // ochre shopkeeper
  ['#889c87','#596f69','#c9bd9a'], // sage traveller
  ['#ded1b2','#ab997e','#a4b0a2'], // undyed labourer's jacket
  ['#8fa58b','#697e73','#e1c9ad'], // pale green beizi, warm silk skirt
  ['#a3af95','#6c846f','#dfcfad'], // green carrying-pole porter
  ['#ddd4bb','#9da995','#c29a77'], // ivory tea seller, clay-coloured binding
  ['#b77d66','#855d52','#c8c2a1']  // child's russet jacket
];
const textureCache=new Map();
const VIEW_STEP=Math.PI*.5,VIEW_MARGIN=7*Math.PI/180,TURN_SECONDS=.6;
const wrapAngle=angle=>((angle+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
function stablePaintedView(relative,previous=-1){
  const nearest=((Math.round(relative/VIEW_STEP)%4)+4)%4;
  if(previous<0)return nearest;
  // Leave the current 90-degree sector only after crossing its 7-degree margin.
  // The opposite threshold is therefore 38 degrees when returning from a side.
  return Math.abs(wrapAngle(relative-previous*VIEW_STEP))>VIEW_STEP*.5+VIEW_MARGIN+1e-9?nearest:previous;
}

// Boatmen have a separate bent, braced pose. A standing merchant silhouette
// cannot express the collaborative work around the low mast in the handscroll.
function boatmanTexture(direction){
  const key='boatman-'+direction;if(textureCache.has(key))return textureCache.get(key);
  const tex=canvasTexture(512,640,ctx=>{
    ctx.scale(1.6,4/3);ctx.lineCap='round';ctx.lineJoin='round';
    const side=direction===1||direction===3,back=direction===2;
    if(direction===3){ctx.translate(320,0);ctx.scale(-1,1);}
    const ink='#5b5144',skin='#cfab8c',robe='#899c94',shade='#596f68',lining='#d3c8aa',hair='#474841';
    const glow=ctx.createLinearGradient(88,90,245,382);glow.addColorStop(0,'#fff4d633');glow.addColorStop(.52,'#edd7b000');glow.addColorStop(1,'#425d6428');
    const draw=(d,fill=null,w=1.1,alpha=.9)=>{const p=new Path2D(d);ctx.save();if(fill){ctx.fillStyle=fill;if(fill===shade&&!w){ctx.globalAlpha*=.2;ctx.filter='blur(0.7px)';}ctx.fill(p);if(w&&fill!==hair){ctx.save();ctx.clip(p);ctx.fillStyle=glow;ctx.fillRect(0,0,320,480);ctx.restore();}}if(w){ctx.strokeStyle=ink;ctx.lineWidth=w*(fill?.93:1);ctx.globalAlpha=alpha*(fill?.79:1);ctx.stroke(p);}ctx.restore();};
    const line=(d,w=.65,a=.68)=>draw(d,null,w,a);
    // Far leg steps back, near knee folds forward; both cloth shoes meet the deck.
    draw(side?'M122 270 Q101 305 89 350 L56 439 L75 451 Q107 396 124 374 L159 318Z':'M112 273 Q95 314 96 365 L69 438 L89 449 Q118 408 122 375 L149 322Z',lining);
    draw(side?'M55 437 Q45 453 31 466 Q26 473 34 476 Q57 478 78 459 L77 446Z':'M70 435 L56 459 Q50 468 57 472 L84 468 L94 448Z',hair,.95);
    draw(side?'M150 285 Q178 289 206 312 L218 338 Q196 357 173 374 L164 442 L186 455 Q195 415 203 393 L239 358 Q254 338 237 316 L185 268Z':'M148 286 Q181 286 209 312 Q223 331 211 351 L177 386 L181 449 L205 454 L220 383 L245 350 Q254 330 235 308 L183 270Z',lining);
    draw(side?'M165 438 L186 444 L188 454 Q211 465 222 465 Q229 470 223 476 L180 477 L160 464Z':'M180 443 L206 446 L207 458 Q229 465 239 465 Q247 470 239 476 L198 477 L178 466Z',hair,.95);
    line(side?'M89 351 Q105 351 114 362 M119 313 L104 345 M178 303 Q201 316 219 333 M172 372 L189 382 M172 407 L184 416 M163 460 L185 471':'M102 323 L112 353 M100 366 L115 372 M179 304 Q208 316 213 332 M180 380 L198 387 M184 417 L206 421 M181 460 L198 470');
    // Short wrapped jacket bends from the waist toward the working hands.
    draw(side?'M121 143 Q143 110 185 94 L209 121 L195 175 Q171 196 165 229 L184 279 Q167 305 124 311 L96 292 Q109 257 105 224 L98 195Z':'M115 136 Q142 112 169 119 Q195 128 209 157 L206 205 Q178 222 173 242 L188 281 Q155 312 105 295 L113 250 L98 209 Q89 176 115 136Z',robe,1.2);
    draw(side?'M119 177 Q135 158 154 148 L160 166 Q143 208 137 239 L130 296 L108 292 Q118 252 112 220Z':'M117 151 Q129 165 132 196 L133 263 L123 294 L108 291 Q118 243 105 209Z',shade,0);
    if(!back)draw(side?'M176 107 L191 113 L168 154 L143 190 L140 174 L163 138Z':'M132 129 L148 141 L160 160 L153 190 L138 169 L119 143Z',lining,.75);
    else line('M118 143 Q146 150 178 137 M140 151 Q151 176 148 217 M160 163 Q171 182 170 198',.72,.70);
    draw(side?'M112 262 Q145 273 174 259 L179 269 Q148 288 108 274Z':'M112 261 Q151 280 180 265 L185 276 Q149 296 108 273Z',shade,.9);
    draw(side?'M153 273 L161 282 L152 323 L143 330 L148 292 L145 282Z':'M148 278 L160 284 L166 315 L159 324 L151 294 L145 289Z',shade,.7);
    line(side?'M119 157 L109 192 M143 194 Q131 213 133 242 M157 193 L150 224 M118 230 L122 258 M173 282 L143 299':'M111 161 Q103 184 112 205 M123 210 L126 245 M179 171 Q170 208 159 230 M142 214 L139 252 M111 284 L134 296');
    // The long slender pole continues through both grips, tying the pose together.
    draw(side?'M150 476 L291 90':'M52 476 L307 139',null,3.1);
    line(side?'M152 476 L293 90':'M54 476 L309 139',.52,.64);
    // Rear sleeve and hand first, then the near forearm across it.
    draw(side?'M183 124 Q206 138 210 170 L236 199 L224 221 Q198 203 185 185 L165 159Z':'M187 143 Q209 164 211 193 L237 220 L224 239 Q193 214 184 188 L169 166Z',robe);
    draw(side?'M229 198 L242 198 L252 184 L259 182 L260 188 L251 201 L251 213 L241 221 L226 220Z':'M229 217 L241 213 L253 196 L259 195 L260 200 L251 216 L251 226 L239 239 L226 237Z',skin,.85);
    draw(side?'M127 148 Q150 153 167 180 L186 220 L225 234 L219 256 L170 242 Q153 214 139 199 L112 182Z':'M114 152 Q135 153 147 180 L157 226 L210 242 L207 267 L143 252 Q126 226 122 206 L101 183Z',robe);
    draw(side?'M217 234 L230 227 L238 213 L246 207 Q253 209 249 216 L243 225 L241 238 L228 255 L218 254Z':'M207 242 L225 232 L235 218 L241 216 Q248 220 241 227 L235 239 L232 250 L217 264 L207 266Z',skin,.87);
    line(side?'M236 222 L244 224 M232 228 L240 232 M226 238 L235 242 M244 199 L250 204 M137 168 Q156 187 163 215 M157 223 L173 233 M184 237 L213 248':'M233 228 L240 231 M225 238 L233 242 M220 247 L229 251 M242 215 L249 220 M122 170 Q134 193 137 217 M139 230 L154 240 M164 245 L201 261',.62,.79);
    // Neck and a head bent toward the pole; profile and back are genuinely separate.
    draw(side?'M178 102 L188 81 L209 91 L207 120 Q191 125 178 113Z':'M139 125 L139 102 L162 98 L177 123 L164 139Z',skin,.85);
    if(side){
      draw('M177 62 Q184 41 207 45 Q225 48 229 67 L235 78 L246 86 L238 90 L239 98 L232 111 Q217 120 202 111 L185 96Z',skin,1.0);
      ctx.save();ctx.globalAlpha=.15;draw('M187 56 Q198 47 208 51 L204 73 L190 83Z','#fff0d0',0);draw('M205 86 Q217 80 230 89 Q235 97 225 102 L211 97Z','#c88c74',0);ctx.restore();
      line('M222 75 L230 78 M225 80 L229 81 M235 94 L230 95 M228 104 L235 104 M186 79 Q180 75 184 88 L190 93',.64,.84);
      draw('M176 75 Q164 55 181 38 Q199 27 218 40 L229 65 Q208 56 191 63 L184 80Z',hair);
      draw('M179 47 Q172 39 177 33 Q187 29 193 36 L196 45Z',hair,.9);
      draw('M174 68 Q197 48 225 62 L230 73 Q206 59 178 79Z',lining,.83);
      draw('M176 73 L164 83 L151 109 L144 111 L146 103 L159 75 L171 66Z',lining,.72);
    }else{
      draw('M130 58 Q146 42 166 51 Q180 60 179 83 L174 109 Q162 125 145 116 Q133 107 129 87Z',skin);
      if(!back){ctx.save();ctx.globalAlpha=.14;draw('M135 65 Q142 56 153 57 L151 83 L137 90Z','#fff0d0',0);draw('M133 91 Q142 86 146 94 L143 101 L136 99Z M163 93 Q171 88 175 96 L171 103 L165 101Z','#c88c74',0);ctx.restore();}
      draw('M128 81 Q119 61 133 44 Q151 31 169 45 Q182 58 181 80 Q163 67 145 75 L134 85Z',hair);
      draw('M143 47 Q138 39 144 33 Q151 28 158 36 L160 47Z',hair,.88);
      draw('M127 72 Q151 57 179 73 L180 84 Q151 68 128 84Z',lining,.85);
      draw('M128 75 L117 85 L112 108 L105 117 L102 112 L108 83 L122 70Z',lining,.72);
      if(back){draw('M128 83 Q135 106 147 112 L167 108 Q179 94 180 82 Q149 70 128 83Z',hair,.83);line('M139 103 L167 102',.6,.36);}
      else line('M136 86 L143 85 M160 85 L168 88 M139 88 L143 89 M162 89 L166 89 M151 88 L148 100 L153 102 M148 110 L158 111',.66,.8);
    }
    // Worn cloth shoe uppers and rolled hems are lighter than their ink soles.
    ctx.save();ctx.globalCompositeOperation='source-atop';ctx.strokeStyle='#aaa58b';ctx.globalAlpha=.47;ctx.lineWidth=.82;
    ctx.stroke(new Path2D(side?'M36 468 Q50 470 71 454 M174 463 Q198 473 220 472 M130 292 Q150 300 173 282':
      'M61 464 L84 455 M190 464 Q213 472 238 472 M111 288 Q149 304 181 281'));
    ctx.restore();
    // Sparse dry-brush fibres keep this drawing in the same family as the crowd.
    ctx.save();ctx.globalCompositeOperation='source-atop';
    for(let i=0;i<190;i++){let x=28+(Math.sin(i*17.3)*.5+.5)*260,y=32+(Math.cos(i*12.7)*.5+.5)*435;ctx.strokeStyle=i%3?'#51452b0b':'#fff2c514';ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1,y+3);ctx.stroke();}
    ctx.restore();
  });textureCache.set(key,tex);return tex;
}

// Deliberately slender contours, uneven fold lengths, closed sleeves, and very
// small facial marks: these figures should read like brush drawings at a distance.
function figureTexture(kind,direction,phase=0,working=false){
  if(working&&kind===3)return boatmanTexture(direction);
  // Monks and folded workers keep one stance. Three travelling roles also
  // have a second lower-body step; their head and held objects stay anchored.
  if(kind>=8){if(kind===9||kind===12)phase=0;working=false;}
  const key=`${kind}-${direction}-${phase}-${working}`;
  if(textureCache.has(key))return textureCache.get(key);
  const tex=canvasTexture(384,768,ctx=>paintFigure(ctx,kind,direction,phase,working));
  textureCache.set(key,tex);return tex;
}

// Both body and close-up samples execute these authored vector paths. The head
// cache never resizes the 384×768 raster, and phases share the same head drawing.
function paintFigure(ctx,kind,direction,phase=0,working=false,rasterScale=1){
    if(kind>=8){paintTownsfolk(ctx,kind,direction,phase,rasterScale);return;}
    ctx.scale(1.2,1.2);
    // Compress the overly long lower robe/legs without widening the silhouette.
    // The larger skull and fuller upper body yield roughly 8 adult head lengths.
    // Crop again to the crown and sole so sprite y=0 continues to be the ground.
    ctx.translate(0,-34);ctx.scale(1,1.21);
    ctx.lineCap='round';ctx.lineJoin='round';
    const side=direction===1||direction===3,back=direction===2;
    if(direction===3){ctx.translate(320,0);ctx.scale(-1,1);}
    const [cloth,shade,lining]=PALETTES[kind%8];
    const ink='#575044',hair='#45483f',skin='#d6b595',pale='#eadcc0';
    const glow=ctx.createLinearGradient(74,130,227,555);
    glow.addColorStop(0,'#fff4d83d');glow.addColorStop(.44,'#f4e0bd0a');glow.addColorStop(1,'#425f7026');
    const bloom=ctx.createRadialGradient(120,222,12,148,275,186);
    bloom.addColorStop(0,'#ffecd52a');bloom.addColorStop(.62,'#ffe9cc08');bloom.addColorStop(1,'#b4c3b200');
    const fabricColors=new Set([cloth,shade,lining,pale]);
    const mapY=(y)=>y<=310?y:310+(y-310)*.79;
    const lean=(side?[1.2,3.1,4.2,2.0,1.1,5.8,2.4,3.0]:[0,-2.1,1.0,-1.2,2.0,2.4,-1.2,3.4])[kind%8];
    let heldProp=false;
    // All authored paths use absolute M/L/Q commands with x/y coordinate pairs.
    // Map their controls together, retaining the irregular hand-drawn contours.
    const path=(d)=>new Path2D(d.replace(/(-?\d*\.?\d+)(\s+)(-?\d*\.?\d+)/g,(_,xs,gap,ys)=>{
      let x=+xs,y=+ys;
      // A slight forward neck/shoulder set belongs to the person's silhouette;
      // the planted lower legs do not move or acquire a global paper-like tilt.
      x+=lean*Math.max(0,Math.min(1,(335-y)/205));
      if(working&&kind===3){
        if(y>162&&y<305&&(x<121||x>190))y=162+(y-162)*.48;
        if(y<310){x+=(310-y)*.045;y+=(310-y)*.032;}
      }
      if(phase&&kind===1&&x>175&&y>150&&y<285){
        const weight=Math.min(1,(x-175)/18),angle=-.15*weight,dx=x-180,dy=y-165;
        x=180+dx*Math.cos(angle)-dy*Math.sin(angle);y=165+dx*Math.sin(angle)+dy*Math.cos(angle);
      }
      if(phase&&kind===6){
        // Fingers, tray, ewer and bowl move as one rigid group. The forearm
        // eases into that same grip; porcelain never stretches during a gesture.
        const lift=heldProp?1:y>180&&y<290?Math.min(1,(y-180)/55):0;
        x+=3*lift;y-=2*lift;
      }
      return x+gap+mapY(y);
    }));
    let strokeScale=1.13;
    const draw=(d,fill=null,width=1.12,stroke=ink,opacity=.9)=>{
      const q=path(d);ctx.save();
      if(fill){ctx.fillStyle=fill;ctx.fill(q);if(width&&fabricColors.has(fill)){ctx.save();ctx.clip(q);ctx.fillStyle=glow;ctx.fillRect(0,0,320,640);ctx.fillStyle=bloom;ctx.fillRect(0,0,320,640);ctx.restore();}}
      if(width){ctx.globalAlpha=opacity*(fill?(fill===hair?.82:.76):1);ctx.strokeStyle=stroke;ctx.lineWidth=width*strokeScale*(fill?.91:1);ctx.stroke(q);}
      ctx.restore();return q;
    };
    const line=(d,w=.72,a=.68)=>draw(d,null,w,ink,a);
    const wash=(d,color=shade,a=.18)=>{ctx.save();ctx.globalAlpha=a;ctx.filter=`blur(${.85*rasterScale}px)`;draw(d,color,0);ctx.restore();};
    const garment=(d,color=cloth,w=1.16)=>draw(d,color,w);
    const folds=(arr,w=.72,a=.66)=>arr.forEach((d,i)=>{
      const weight=[1,.66,.86,.56][i%4];
      line(d,w*3.4,a*.1);line(d,w*weight,a*(.72+weight*.22));
    });
    const hand=(d,marks='')=>{const q=draw(d,skin,.78);ctx.save();ctx.clip(q);const tint=ctx.createLinearGradient(93,233,201,284);tint.addColorStop(0,'#ffe8c827');tint.addColorStop(1,'#a76f5724');ctx.fillStyle=tint;ctx.fillRect(0,0,320,320);if(marks)line(marks,.43,.66);ctx.restore();};
    const short=kind===3||kind===5||kind===7;
    const str=phase?13:0;

    // Legs appear below short work tunics. Cloth leggings have ties; footwear
    // has a soft, upward-curved toe rather than a modern boot silhouette.
    if(short){
      garment(side?
        `M136 388 Q128 465 ${120-str} 550 L${115-str} 598 Q${127-str} 605 ${141-str} 599 L153 530 L163 400Z`:
        `M119 387 Q114 455 ${104-str} 551 L${106-str} 598 Q${120-str} 604 ${136-str} 599 Q146 529 155 406Z`,kind===3?skin:lining,1.05);
      garment(side?
        `M158 387 Q177 462 ${177+str} 529 L${194+str} 590 L${218+str} 589 Q203 510 201 483 L185 383Z`:
        `M153 401 Q156 462 ${172+str} 544 L${182+str} 593 L${208+str} 589 Q192 517 193 488 L184 385Z`,kind===3?skin:lining,1.05);
      if(kind===3){
        garment(side?`M133 391 L166 398 Q156 453 ${150-str} 523 Q${135-str} 535 ${112-str} 524 L123 461Z`:
          `M120 390 L158 402 Q151 460 ${147-str} 522 Q${126-str} 535 ${102-str} 522 L112 451Z`,lining,1.02);
        garment(side?`M157 390 L185 384 Q203 440 ${206+str} 513 Q${194+str} 525 ${173+str} 521 L161 464Z`:
          `M154 398 L184 389 Q196 449 ${205+str} 514 Q${190+str} 526 ${168+str} 522 L155 468Z`,lining,1.02);
        folds([`M${105-str} 519 Q${124-str} 531 ${146-str} 520`,
          `M${170+str} 518 Q${192+str} 526 ${205+str} 512`,
          `M${118-str} 546 Q${113-str} 569 ${117-str} 582 M${190+str} 541 L${197+str} 573`],.59,.49);
      }else folds([`M${112-str} 551 L${133-str} 558 M${108-str} 560 L${131-str} 566 M${108-str} 578 L${128-str} 582`,
        `M${177+str} 547 L${201+str} 543 M${179+str} 558 L${204+str} 553 M${184+str} 577 L${209+str} 572`,
        'M133 418 Q131 451 123 473 M169 418 Q181 462 178 479 M139 486 L136 521'],.72,.67);
      draw(`M${106-str} 592 Q${100-str} 602 ${89-str} 607 Q${78-str} 610 ${81-str} 616 Q${103-str} 624 ${139-str} 613 L${137-str} 598Z`,hair,.92);
      draw(`M${186+str} 586 L${184+str} 606 Q${204+str} 616 ${231+str} 608 Q${236+str} 602 ${226+str} 600 L${208+str} 588Z`,hair,.95);
      line(`M${84-str} 615 Q${111-str} 618 ${139-str} 610 M${187+str} 605 Q${209+str} 612 ${231+str} 605`,.52,.43);
    }else{
      draw(`M119 562 L${114-str} 597 Q${107-str} 604 ${96-str} 609 Q${87-str} 615 ${96-str} 619 Q${115-str} 624 ${143-str} 614 L148 565Z`,hair,.95);
      draw(`M164 561 L${175+str} 599 Q${196+str} 600 ${208+str} 609 Q${213+str} 615 ${204+str} 616 L${170+str} 613 L152 569Z`,hair,.95);
      line(`M${96-str} 617 Q${120-str} 621 ${142-str} 611 M${173+str} 609 L${208+str} 613`,.52,.42);
    }

    // Draw the far sleeve first. Each occupation has its own stance; profile
    // views have their own narrow shoulder and overlapping sleeves.
    if(kind===0){
      garment(side?'M151 139 Q169 144 180 164 L197 244 Q194 269 175 288 L148 260 L154 184Z':
        'M175 139 Q197 145 207 171 L233 258 Q229 285 198 295 L172 266 L184 219Z');
      garment(side?'M137 132 Q157 130 173 148 Q187 182 181 242 L177 329 Q189 428 197 574 Q169 592 111 580 L119 490 Q134 410 129 332 L125 256 Q101 249 98 229 L114 155Z':
        'M130 134 Q113 139 103 159 Q91 187 84 216 L81 270 Q97 290 118 286 L115 346 Q103 442 95 579 Q151 600 205 579 Q189 465 184 359 L185 205 L183 153 L168 135Z');
      wash(side?'M143 153 L152 322 Q146 427 134 577 L112 575 Q135 408 130 315 L127 205Z':
        'M128 153 Q127 217 135 302 Q130 441 115 582 L99 578 Q112 420 116 326 L118 188Z');
      if(!back){
        garment(side?'M120 162 Q106 197 111 235 L152 252 L183 239 L182 269 Q160 282 133 274 L103 262 Q91 244 96 224Z':
          'M109 161 Q92 194 84 245 Q91 267 123 272 L174 256 L170 229 L128 239 Q122 198 129 177Z');
        garment(side?'M172 174 Q188 196 193 235 L173 247 L148 258 L143 278 Q178 285 196 258 L203 239 L184 183Z':
          'M185 164 Q205 197 218 245 L198 271 Q171 276 145 258 L148 238 L183 244 L174 198Z');
        draw(side?'M148 252 L169 246 L173 253 L152 266Z':'M144 242 L163 245 L171 253 L157 258 L144 253Z',lining,.7);
      }
      folds(side?['M124 184 Q115 209 119 227','M110 241 Q124 257 142 257','M172 182 Q183 212 183 227',
        'M140 290 Q145 331 139 364','M159 309 Q154 401 158 434','M133 405 Q123 478 127 548','M177 386 Q176 469 184 564','M146 482 L142 582']:
        ['M112 184 Q102 213 103 233','M94 247 Q109 260 127 258','M186 193 Q197 218 199 238','M191 260 L179 265',
        'M123 289 Q125 330 118 374','M146 291 Q141 351 145 385','M163 298 Q167 374 162 412','M118 402 Q108 477 111 549',
        'M135 428 Q134 498 127 583','M158 452 Q149 529 160 589','M181 403 Q178 470 192 573']);
    }else if(kind===4){
      // A straight-collared, open-front beizi over a narrow pleated skirt.
      garment(side?'M145 251 Q165 237 178 254 L195 578 Q163 594 117 582 L134 355Z':
        'M127 250 L175 246 Q182 377 204 580 Q153 596 102 580 L117 351Z',lining);
      garment(side?'M132 135 Q151 129 169 140 L181 189 L183 276 L169 289 L173 407 L184 535 L161 559 Q144 472 144 378 L146 169 L138 153 L136 270 L122 384 L108 535 L97 529 Q115 416 119 320 L111 239 Q90 249 94 221 L111 151Z':
        'M127 135 L146 143 L137 186 L134 325 Q128 427 118 553 L93 542 Q110 396 109 290 L111 219 Q97 250 80 252 Q65 244 70 230 L97 159 Q109 141 127 135 M158 143 L174 135 Q195 141 205 160 L225 243 Q213 265 187 260 L185 332 L208 543 L183 554 Q167 426 163 317 L157 186Z');
      if(!back){
        draw(side?'M139 140 L153 160 L151 360 L143 373 L145 164 L134 149Z':
          'M129 137 L147 152 L138 337 L128 385 L134 195 L138 158Z',pale,.75);
        draw(side?'M158 140 L164 153 L166 382 L159 371 L159 166 L152 157Z':
          'M170 137 L155 154 L163 337 L174 382 L170 193 L164 159Z',pale,.75);
      }
      hand(side?'M112 248 Q115 265 127 272 L137 270 L136 264 L122 253 L119 245Z':
        'M83 248 Q78 263 83 277 Q86 283 89 277 L97 265 L96 253Z','M84 264 L87 275');
      if(!side)hand('M209 259 Q206 273 199 280 L193 277 L193 268 L200 256Z','M199 271 L196 277');
      folds(side?['M111 168 Q104 206 107 224','M119 288 Q115 337 116 368','M131 381 L115 522','M165 399 L174 526',
        'M147 416 L135 580','M157 437 Q158 517 161 588','M176 479 L184 580']:
        ['M101 168 Q91 208 83 235','M86 244 Q101 239 108 224','M190 170 Q195 207 211 245','M120 298 Q116 361 119 390',
        'M176 292 Q179 352 185 391','M124 416 L111 577','M139 398 L131 590','M151 410 L150 590','M162 423 L172 588','M178 447 L193 580']);
      wash('M130 391 Q136 444 127 581 L113 579Z',shade,.12);
    }else if(short){
      const boy=kind===7,porter=kind===5;
      // Diagonally closing short jackets. The porter bends under his load;
      // the worker has rolled cuffs, and the boy's jacket is comparatively long.
      garment(side?
        `M133 137 Q157 131 181 148 L198 233 L188 307 Q187 358 199 ${boy?462:405} Q164 ${boy?480:422} 115 ${boy?463:408} L126 320 L124 236 L102 242 L95 223 L116 151Z`:
        `M125 138 Q148 127 178 139 Q199 148 210 177 L218 255 L190 267 L186 318 Q187 361 202 ${boy?463:406} Q155 ${boy?484:425} 108 ${boy?467:410} L123 323 L112 252 L87 259 L78 240 L95 172Z`);
      wash(side?'M134 164 Q138 237 143 316 L130 411 L117 406 L128 315 L124 205Z':
        'M125 163 Q125 239 138 320 L123 414 L110 409 L124 317 L115 196Z');
      if(porter){
        garment(side?'M131 151 Q113 156 104 177 L111 229 Q122 240 135 228 L141 194 L133 190 L129 211 L122 181 L145 166Z':
          'M119 150 Q102 150 92 175 L91 218 Q105 241 125 229 L134 195 L120 186 L114 209 L111 179 L138 166Z');
        garment(side?'M176 154 Q191 151 200 173 L211 220 Q199 235 187 226 L180 194 L191 187 L197 204 L193 177 L171 169Z':
          'M180 151 Q201 151 210 174 L218 217 Q204 238 184 227 L177 192 L191 185 L199 204 L195 176 L173 165Z');
        hand('M115 192 L111 180 L113 164 Q117 156 122 160 L123 171 L130 163 L133 165 L130 179 L125 194Z',
          'M115 169 L122 171 M118 161 L119 168 M125 167 L125 176');
        hand('M186 192 L181 180 L183 164 Q186 157 190 160 L194 173 L198 166 Q204 162 202 171 L197 189Z',
          'M186 166 L191 175 M195 175 L195 182');
      }else if(boy){
        garment(side?'M174 156 Q193 180 191 221 L211 235 L221 258 Q215 267 204 261 L172 240 L163 205Z':
          'M178 151 Q197 172 207 211 L227 226 L235 248 Q226 259 215 249 L184 227 L172 199Z');
        hand(side?'M211 250 Q219 249 224 244 Q225 238 229 241 L230 244 L243 228 Q247 225 249 229 Q250 232 246 236 L237 246 L234 255 Q228 264 216 263Z':
          'M225 237 L231 230 Q232 227 235 229 L240 232 L252 212 Q255 209 258 212 Q260 215 256 219 L246 233 L246 241 Q240 250 232 247Z',
          side?'M224 250 Q230 255 235 250 M227 255 L231 257 M227 244 L230 247':
          'M238 237 Q243 239 245 236 M237 241 L242 243 M231 234 Q235 238 239 237');
        hand('M93 251 L91 270 Q95 282 102 276 L109 263 L106 253Z','M96 266 L99 275');
      }else{
        draw(side?'M102 230 L124 228 L126 242 L105 247Z':'M81 240 L112 237 L114 255 L88 261Z',pale,.86);
        hand(side?'M110 244 Q106 264 111 278 L119 285 L124 279 L122 266 L127 241Z':
          'M90 258 Q86 278 92 291 Q98 298 102 288 L108 272 L107 256Z','M94 274 L96 288 M99 272 L101 282');
        draw(side?'M186 231 L205 224 L210 237 L190 247Z':'M193 246 L217 241 L220 255 L199 264Z',pale,.86);
        hand(side?'M195 240 L205 237 Q212 252 213 269 L207 276 L203 272 L202 260Z':
          'M205 260 Q210 276 220 283 L226 278 L224 269 L216 256Z','M215 270 L221 278');
      }
      if(kind!==7){
        draw(side?'M127 299 Q154 306 189 296 L190 306 Q158 319 127 309Z':
          'M121 304 Q154 311 190 300 L190 311 Q157 324 122 315Z',shade,.88);
        draw(side?'M162 310 L170 318 L165 354 L160 351 L162 322 L155 317Z':
          'M164 314 L172 320 L169 360 L163 354 L165 325 L155 319Z',shade,.62);
      }
      folds(side?['M126 168 Q121 192 125 211','M176 183 L183 216','M140 214 Q142 250 151 278','M173 230 Q169 268 174 297',
        'M135 321 Q134 345 126 370','M153 330 L148 385','M177 328 Q174 368 186 400']:
        ['M113 169 L105 199','M97 223 L108 236','M195 187 L201 216','M131 202 Q130 249 143 285','M164 205 Q161 259 172 295',
        'M126 328 Q129 352 117 393','M146 331 Q140 374 144 411','M169 329 L172 379','M185 356 L191 401']);
      if(boy)folds(['M137 381 Q129 420 133 460','M167 380 Q171 426 177 461','M111 454 Q151 470 195 453'],.7,.7);
    }else{
      // Traveller, merchant, and tea seller use distinct sleeves over the same
      // long robe structure, with a wrapped overlap visible below the waist.
      garment(side?'M131 138 Q151 130 172 141 L191 182 L196 271 L177 288 L178 368 Q179 463 199 576 Q169 596 112 581 L117 508 L125 363 L123 264 L101 267 Q91 251 96 225 L111 159Z':
        'M127 140 Q150 131 178 141 Q198 153 205 184 L222 271 Q210 289 188 278 L183 364 Q185 450 206 578 Q155 597 98 581 L104 507 L116 362 L115 256 Q96 274 77 260 L79 230 L99 164Z');
      wash(side?'M138 154 Q137 240 146 337 L132 582 L113 577 L128 345 L125 223Z':
        'M127 158 Q123 231 136 341 L120 586 L101 579 Q113 465 118 350 L114 234Z');
      if(kind===2){
        // Traveller's cloth bundle, strap and walking stick.
        if(!back){
          draw(side?'M134 148 L141 149 L174 311 L169 319Z':'M130 145 L138 144 L181 332 L174 337Z',shade,.65);
          draw(side?'M172 264 Q198 257 206 278 L211 321 Q199 339 177 330 L165 288Z':
            'M175 283 Q198 272 211 292 L214 329 Q203 346 179 338 L168 303Z',lining,1.0);
          folds(side?['M178 279 Q190 294 203 295','M181 296 L181 321','M198 300 L202 323']:
            ['M178 291 Q195 307 208 302','M178 311 L184 332','M198 307 L204 335'],.68,.7);
        }else{
          draw('M128 148 L136 147 L178 304 L171 308Z',shade,.7);
          draw('M150 255 Q177 244 192 262 L199 320 Q175 341 151 320 L143 276Z',lining,1.0);
          folds(['M150 271 Q172 287 190 278','M165 284 L165 319','M185 287 L191 320']);
        }
        garment(side?'M177 161 Q192 187 194 217 L214 229 L220 248 Q205 264 187 251 L167 231 L161 197Z':
          'M183 164 Q199 188 205 218 L223 228 L226 251 Q209 265 193 247 L174 223 L165 191Z');
        draw('M229 224 Q225 384 226 610',null,2.35,'#766144',.95);
        line('M230 263 L228 395 M227 461 L228 555',.56,.7);
        hand('M214 236 L225 229 Q232 225 236 230 L235 238 L228 244 L217 246Z',
          'M226 231 L234 233 M225 235 L234 237 M225 239 L231 241');
        hand('M84 264 Q84 279 91 287 L98 282 L102 267 L97 259Z','M89 271 L92 282');
      }else if(kind===6){
        garment(side?'M117 165 Q105 199 110 244 L153 269 L162 289 L139 298 L102 276 Q88 265 90 242 L101 191Z':
          'M105 166 Q88 195 81 242 Q87 264 114 279 L149 287 L158 269 L121 253 L125 198Z');
        garment(side?'M171 158 Q186 182 191 216 L213 248 L205 270 L186 273 L166 240 L157 199Z':
          'M184 165 Q201 194 210 236 L216 255 Q205 277 182 274 L155 277 L151 258 L183 251 L172 211Z');
        heldProp=true;
        hand(side?'M151 271 Q163 266 177 270 L180 277 L167 285 L158 283Z':
          'M146 268 Q156 260 171 265 L175 274 L164 282 L152 282Z','M158 270 L170 271');
        hand(side?'M199 255 L211 252 L222 264 L222 274 L210 278 L204 268Z':
          'M183 264 L196 260 L204 266 L198 274 L184 276Z','M189 266 L201 268');
        draw(side?'M148 263 Q185 251 229 259 L225 270 Q186 280 149 271Z':
          'M132 260 Q167 249 205 258 L203 270 Q169 279 133 269Z','#a79973',.97);
        line(side?'M152 266 Q188 274 225 263':'M136 264 Q169 273 201 262',.58,.58);
        draw(side?'M153 259 Q187 252 224 258':'M137 258 Q167 252 200 257',null,.87,'#d6c8a2',.55);
        const tx=side?183:165;
        // A small celadon ewer: narrow neck, pear-shaped body, curved spout and
        // loop handle; beside it sits an open, footed bowl, never a modern mug.
        draw(`M${tx+4} 232 Q${tx+21} 229 ${tx+20} 243 Q${tx+20} 252 ${tx+9} 252 L${tx+8} 248 Q${tx+17} 247 ${tx+16} 239 Q${tx+16} 234 ${tx+5} 237Z`,'#bbc6ad',.65);
        draw(`M${tx-10} 247 Q${tx-18} 246 ${tx-23} 233 L${tx-20} 231 Q${tx-14} 240 ${tx-7} 239Z`,'#c3ceb7',.72);
        draw(`M${tx-5} 237 L${tx-5} 227 Q${tx} 224 ${tx+5} 227 L${tx+5} 237 Q${tx+15} 244 ${tx+11} 252 Q${tx+6} 260 ${tx-5} 257 Q${tx-14} 255 ${tx-13} 247 Q${tx-12} 241 ${tx-5} 237Z`,'#cbd2b9',.82);
        wash(`M${tx+2} 236 Q${tx+9} 244 ${tx+8} 253 L${tx+3} 256 L${tx+1} 245Z`,'#6f8e80',.23);
        draw(`M${tx-6} 227 Q${tx} 223 ${tx+6} 227 Q${tx} 230 ${tx-6} 227Z`,lining,.61);
        line(`M${tx-6} 254 Q${tx} 258 ${tx+7} 254`,.43,.48);
        draw(`M${tx+18} 249 Q${tx+25} 246 ${tx+33} 249 L${tx+29} 256 Q${tx+25} 259 ${tx+22} 255Z`,'#796650',.58);
        draw(`M${tx+19} 249 Q${tx+25} 247 ${tx+32} 249 Q${tx+26} 253 ${tx+19} 249Z`,'#c9b994',.44);
        line(`M${tx+23} 257 L${tx+29} 257`,.7,.58);
        heldProp=false;
      }else{
        garment(side?'M169 160 Q185 181 187 216 L209 227 L220 246 Q208 262 190 251 L168 229 L157 193Z':
          'M183 163 Q199 189 203 217 L221 228 L220 251 Q198 261 183 241 L165 211Z');
        hand(side?'M211 231 L220 217 L233 216 Q239 219 233 223 L226 226 L224 237 L217 246Z':
          'M216 232 L218 217 L228 206 Q234 204 233 210 L227 219 L233 216 Q240 215 237 220 L226 234 L224 243Z',
          'M222 222 L228 220 M222 226 L230 223');
        hand(side?'M106 267 Q104 283 111 291 L118 288 L123 273 L119 262Z':
          'M85 261 Q80 278 87 292 L93 294 L99 280 L98 264Z','M87 276 L90 289 M92 274 L94 283');
      }
      folds(side?['M118 177 Q108 206 111 233','M103 253 L116 259','M169 181 Q178 203 179 215',
        'M137 295 Q143 327 138 365','M153 353 Q158 409 153 443','M129 399 Q125 451 124 478',
        'M148 437 Q138 521 141 586','M174 423 Q170 510 186 574','M123 530 L120 577']:
        ['M108 177 Q96 206 92 231','M89 246 Q101 254 110 244','M184 190 L193 219','M127 294 Q124 331 129 361',
        'M150 307 Q146 364 155 395','M174 296 Q164 344 171 386','M126 392 Q116 441 116 474',
        'M142 413 Q135 475 135 515','M162 426 Q160 490 170 546','M122 500 Q114 545 114 583',
        'M143 539 L140 591','M184 479 Q184 528 195 576']);
    }

    // The back of a robe is continuous cloth. Front openings, trays, and hands
    // held against the chest cannot show through it when a walker turns away.
    if(back&&kind===4){
      garment('M127 135 Q149 145 174 135 Q195 141 205 160 L225 243 Q213 265 187 260 L185 332 L208 543 Q150 568 93 542 Q110 396 109 290 L111 219 Q97 250 80 252 Q65 244 70 230 L97 159 Q109 141 127 135Z');
      wash('M126 160 Q132 259 125 380 L111 543 L95 539 Q110 394 111 295 L115 207Z');
      folds(['M101 168 Q91 208 83 235','M190 170 Q195 207 211 245','M149 162 L151 241',
        'M130 219 Q135 279 126 327','M170 219 Q167 282 177 327','M124 359 Q118 432 119 507',
        'M145 371 Q146 457 138 552','M169 378 Q164 470 178 548','M189 414 L196 532']);
    }else if(back&&(kind===1||kind===2||kind===6)){
      garment('M127 140 Q150 131 178 141 Q198 153 205 184 L222 271 Q210 289 188 278 L183 364 Q185 450 206 578 Q155 597 98 581 L104 507 L116 362 L115 256 Q96 274 77 260 L79 230 L99 164Z');
      wash('M127 158 Q123 231 136 341 L120 586 L101 579 Q113 465 118 350 L114 234Z');
      folds(['M108 177 Q96 206 92 231','M89 246 Q101 254 110 244','M184 190 L201 259',
        'M137 205 Q147 258 140 301','M166 214 Q161 258 169 288','M127 294 Q124 331 129 361',
        'M153 303 Q146 364 155 395','M174 296 Q164 344 171 386','M126 392 Q116 441 116 474',
        'M142 413 Q135 475 135 515','M162 426 Q160 490 170 546','M122 500 Q114 545 114 583',
        'M143 539 L140 591','M184 479 Q184 528 195 576']);
      if(kind===2){
        draw('M128 148 L136 147 L178 304 L171 308Z',shade,.7);
        draw('M150 255 Q177 244 192 262 L199 320 Q175 341 151 320 L143 276Z',lining,1.0);
        folds(['M150 271 Q172 287 190 278','M165 284 L165 319','M185 287 L191 320']);
      }
    }

    // Short structural accents: folded hems, a glimpse of lining, and worn soft
    // shoes. These are clipped to the figure instead of becoming floating marks.
    ctx.save();ctx.globalCompositeOperation='source-atop';
    if(short){
      const hem=kind===7?461:405;
      line(side?`M119 ${hem-5} Q157 ${hem+9} 194 ${hem-4}`:`M112 ${hem-4} Q153 ${hem+12} 196 ${hem-5}`,.69,.58);
      draw(side?`M121 ${hem-8} Q158 ${hem+5} 193 ${hem-7}`:`M114 ${hem-7} Q151 ${hem+7} 194 ${hem-8}`,null,.9,lining,.49);
    }else if(kind===4){
      line(side?'M99 526 L108 530 M165 551 L181 537 M122 578 Q156 590 190 576':back?
        'M98 539 Q150 563 203 540 M109 578 Q152 593 196 578':
        'M96 538 L116 549 M185 550 L204 540 M109 578 Q152 593 196 578',.68,.6);
      draw('M116 574 Q153 586 191 574',null,.87,pale,.52);
    }else{
      line(side?'M117 576 Q155 591 193 573':'M101 575 Q151 594 201 574',.69,.55);
      draw(side?'M119 572 Q155 587 191 570':'M103 571 Q151 590 199 571',null,1.0,lining,.42);
    }
    if((kind===1||kind===2)&&!back){
      draw(side?'M101 257 Q112 262 123 260 L121 268 L104 267Z':'M80 251 Q91 259 101 257 L100 265 Q90 266 84 261Z',lining,.58);
      line(side?'M104 263 L119 265':'M85 258 Q91 262 98 261',.47,.48);
    }
    if(kind===2){
      line(back?'M158 266 L175 272 L183 264 M173 272 L169 290 M175 272 L181 282':side?
        'M179 275 L193 281 L199 275 M191 281 L189 295 M193 281 L199 290':
        'M181 291 L195 296 L202 289 M193 296 L190 309 M195 296 L201 304',.63,.63);
    }
    if(short){
      draw(`M${86-str} 613 Q${107-str} 615 ${131-str} 605 M${190+str} 601 Q${211+str} 608 ${229+str} 604`,null,.9,'#a39d83',.48);
      line(`M${106-str} 600 L${112-str} 608 M${197+str} 593 L${201+str} 600`,.52,.5);
    }else{
      draw(`M${96-str} 614 Q${115-str} 614 ${135-str} 607 M${176+str} 604 Q${193+str} 610 ${205+str} 610`,null,.9,'#a39d83',.49);
      line(`M${117-str} 597 L${123-str} 606 M${181+str} 599 L${187+str} 605`,.5,.47);
    }
    ctx.restore();

    // Collars sit above the silhouette, with an asymmetrical right-lapped
    // closure. On a back view only the neck seam and shoulder folds remain.
    if(kind!==4){
      if(!back){
        draw(kind===7?(side?'M137 132 L156 147 L175 137 L165 125 L148 126Z':
          'M132 136 L149 148 L174 136 L165 126 L144 127Z'):side?'M137 132 L156 154 L175 137 L165 125 L148 126Z':
          'M130 137 L149 158 L176 138 L165 125 L143 126Z',lining,.9);
        line(side?'M135 136 Q146 157 166 159 L178 197':'M129 140 Q143 167 169 162 L179 208',1.04,.82);
        line(side?'M169 154 Q147 185 139 217 L141 251':'M169 158 Q144 189 137 215 L138 251',.8,.73);
        line(side?'M172 162 L150 197':'M174 168 L147 204',.44,.49);
      }else{
        draw('M136 137 Q153 148 169 136 L170 146 Q154 156 135 146Z',lining,.82);
        folds(['M154 151 Q150 176 154 194','M123 157 Q135 176 138 193','M181 157 Q172 180 168 195'],.72,.7);
      }
    }

    // Compact heads and quiet faces. Eyes are short brush marks, not outlined
    // circles; the long oval and modest headwrap avoid a modern cartoon cap.
    ctx.save();
    strokeScale=1.2;
    ctx.translate(154,132);ctx.scale(1.14,1.14);ctx.translate(-154,-132);
    if(kind===5)ctx.translate(5,5);
    if(kind===7){ctx.translate(-8,0);ctx.translate(155,107);ctx.scale(1.08,1.08);ctx.translate(-155,-107);}
    draw(kind===7?(side?'M144 113 L143 130 Q153 139 164 131 L170 123 L163 111Z':
      'M142 113 L140 129 Q152 139 166 130 L164 112Z'):side?'M143 116 L142 139 Q151 149 161 145 L171 135 L164 113Z':
      'M141 116 L138 137 Q151 151 166 139 L165 114Z',skin,.82);
    if(side){
      const face=draw(kind===7?'M138 79 Q152 70 166 79 Q176 87 174 98 L178 106 Q179 109 174 111 Q177 119 169 124 Q159 132 148 124 L141 114 Q132 108 133 96Z':
        'M139 79 Q150 71 164 77 Q175 84 174 96 Q174 101 177 104 L181 108 Q181 111 176 112 Q178 118 173 124 L170 131 Q160 135 150 128 L143 116 Q134 110 133 98Z',skin,.88);
      if(!back){
        ctx.save();ctx.clip(face);
        wash('M145 107 Q153 102 164 110 Q169 116 161 120 Q150 120 145 113Z','#c88a78',.13);
        wash('M141 83 Q148 77 157 80 L153 96 Q148 104 141 102Z','#fff0ce',.2);
        line(kind===7?'M163 96 Q169 93 173 96':'M164 96 Q169 94 173 96',.55,.65);
        line('M165 100 Q169 98 173 100',.62,.9);
        line('M169 100 L171 100',.96,.87);
        line('M175 113 L172 114',.43,.62);
        line(kind===7?'M168 118 Q171 121 174 117':kind===4||kind===6?'M170 119 Q174 121 177 118':'M171 120 Q174 121 177 119',.51,.7);
        line('M141 103 Q135 99 137 108 L141 112 M139 104 L140 108',.5,.58);
        wash('M144 113 Q150 121 163 128 L157 131 L148 123Z','#947766',.12);
        ctx.restore();
      }
    }else{
      const face=draw(kind===7?'M134 80 Q151 70 170 82 L174 101 Q176 116 166 125 Q156 132 145 124 Q134 117 132 104 L131 94Z':
        kind===4?'M136 80 Q151 71 169 81 L173 100 Q174 116 164 127 Q156 133 147 128 Q136 120 134 107 L132 93Z':
        kind===1?'M135 80 Q151 71 169 81 L173 100 Q175 117 165 130 Q155 135 144 128 Q134 121 132 107 L132 93Z':
        'M136 80 Q151 71 169 81 L173 100 Q174 117 163 129 Q155 134 147 129 Q136 122 133 108 L132 93Z',skin,.9);
      if(!back){
        ctx.save();ctx.clip(face);
        wash('M137 106 Q143 103 146 110 Q147 116 140 116 L136 111Z','#c68170',.13);
        wash('M158 107 Q166 103 169 110 Q168 117 162 115Z','#c68170',.13);
        wash('M139 85 Q148 79 153 82 L150 102 L143 105 L138 99Z','#fff0d3',.2);
        line(kind===1||kind===7?'M137 96 Q141 93 146 96 M156 95 Q161 93 165 97':'M138 97 Q142 94 146 96 M157 96 Q161 95 165 98',.56,.68);
        line(kind===0?'M138 101 Q142 103 146 101 M157 102 Q161 103 165 101':'M138 101 Q142 98 146 101 M157 101 Q161 99 165 102',.64,.84);
        if(kind!==0)line('M142 100 L143 102 M160 100 L161 102',.72,.87);
        line('M151 102 Q151 108 149 111 L152 113',.43,.58);
        line('M153 114 L156 113',.37,.39);
        line(kind===4||kind===7?'M146 121 Q152 125 158 120':'M147 122 Q152 123 158 121',.51,.64);
        line('M150 126 L155 126',.37,.31);
        line('M135 105 Q129 102 132 111 L137 115 M133 106 L134 111',.48,.54);
        wash('M135 112 Q142 123 155 128 L150 131 L140 123Z','#947766',.12);
        ctx.restore();
      }
    }
    if(kind===4){
      draw(side?'M135 99 Q128 87 134 74 Q141 62 159 66 Q177 69 177 91 L169 86 Q156 76 145 88 L142 101Z':
        'M132 101 Q125 84 135 72 Q145 61 161 66 Q178 73 174 96 L169 99 L167 83 Q150 91 136 84 L137 102Z',hair,.91);
      draw(side?'M139 73 Q133 62 138 53 Q145 46 154 54 L158 68Z':
        'M143 69 Q135 58 143 50 Q151 45 160 53 L162 68Z',hair,.92);
      line(side?'M138 75 Q148 65 169 79 M138 61 Q147 57 154 66':
        'M133 83 Q149 77 169 79 M145 56 Q156 54 158 65',.61,.44);
      draw('M141 61 L165 59',null,.9,'#a18c64',.88);
      if(!back)draw(side?'M141 111 L143 120 L141 122 L139 119Z':'M135 113 L135 121 L138 123 L140 120Z','#aa986f',.48);
    }else if(kind===3||kind===7){
      // Bound hair with a modest topknot and folded headcloth.
      draw(side?'M133 90 Q130 72 141 66 Q157 60 172 72 L176 89 L164 84 L147 81Z':
        'M130 92 Q129 75 139 68 Q156 60 169 74 L174 92 Q150 83 130 92Z',hair,.94);
      draw(kind===7?'M147 72 Q141 64 146 59 Q153 56 158 62 L160 72Z':
        'M144 70 Q140 63 145 57 Q153 52 159 59 L160 71Z',hair,.86);
      if(kind===3){
        draw(side?'M130 87 Q150 77 173 87 L176 96 Q150 87 131 96Z':
          'M130 86 Q152 78 172 88 L172 97 Q151 86 130 97Z',shade,.8);
        draw(side?'M133 89 L126 93 L124 111 L119 119 L116 116 L121 92 L128 85Z':
          'M131 88 L123 98 L121 118 L115 121 L117 99 L128 86Z',shade,.69);
        line('M132 89 Q150 83 169 91',.54,.69);
      }
    }else if(kind===5){
      // A pale cloth wrapped tightly around the head, with an unequal knot.
      draw(side?'M131 90 Q128 73 141 66 Q160 59 173 75 L177 91 Q154 82 131 96Z':
        'M130 92 Q127 74 141 67 Q156 61 169 74 L175 91 Q154 83 130 98Z',lining,.93);
      line(side?'M132 88 Q147 76 171 81 M135 76 Q154 69 169 79':
        'M130 87 Q149 78 171 86 M135 74 Q152 69 166 80',.72,.69);
      draw('M131 88 L122 92 L118 111 L113 118 L110 114 L117 92 L128 85Z',lining,.74);
      draw('M126 91 L130 104 L124 111 L122 99Z',lining,.66);
    }else{
      // Everyday soft futou: close to the skull, folded cloth behind it, short
      // ties. The metre-long rigid wings of court dress would be wrong here.
      draw(side?'M132 94 L131 76 Q138 63 151 65 L166 67 Q172 76 176 92 L162 86 L145 88Z':
        'M130 96 L130 78 Q135 67 148 65 L165 70 Q172 79 174 94 L154 88Z',hair,.95);
      draw(side?'M135 70 Q125 64 119 68 L122 87 L134 91Z':
        'M133 72 L125 65 Q119 65 118 74 L124 92 L132 90Z',hair,.88);
      if(kind===0||kind===2){
        draw(side?'M133 88 L120 96 L113 96 L113 93 L131 84Z':
          'M132 87 L120 93 L112 92 L112 90 L130 83Z',hair,.65);
        if(!side)draw('M170 88 L180 88 L185 91 L182 94 L171 94Z',hair,.68);
      }else{
        draw(side?'M129 87 L123 109 L119 114 L116 111 L123 85Z':
          'M128 89 L121 106 L117 108 L118 98 L123 87Z',hair,.63);
      }
      line(side?'M134 77 Q151 71 167 80':'M134 78 Q149 74 165 82',.53,.29);
    }
    if(back){
      draw('M132 94 Q135 113 143 120 L163 119 Q172 110 173 93 Q154 88 132 94Z',hair,.82);
      line('M139 110 Q153 117 166 109',.48,.33);
      if(kind===4){draw('M144 97 Q139 114 145 127 Q151 136 160 127 L163 105Z',hair,.84);}
    }else if(kind===0||kind===2){
      folds(side?['M164 128 Q169 140 165 151','M169 126 Q177 139 171 148','M160 129 Q162 139 164 143']:
        ['M146 128 Q147 145 156 153','M160 128 Q163 143 156 153','M152 132 L155 148'],.57,.82);
      line(side?'M167 118 L171 120':'M145 118 L150 117 M154 117 L160 118',.67,.76);
    }
    ctx.restore();

    strokeScale=1.13;
    // Bent bamboo shoulder pole and two suspended woven baskets. The baskets
    // remain distinct silhouettes; handles and wicker are individually drawn.
    if(kind===5){
      draw('M24 187 Q145 140 296 176',null,3.25,'#7f6c49',.96);
      line('M25 185 Q147 138 295 174',.58,.94);
      for(const [x,drop] of [[34,0],[275,12]]){
        line(`M${x-7} ${184+drop} Q${x-11} 288 ${x-18} ${390+drop} M${x+4} ${183+drop} Q${x+9} 296 ${x+17} ${389+drop}`,1.02,.81);
        draw(`M${x-26} ${389+drop} Q${x} ${377+drop} ${x+27} ${389+drop} L${x+22} ${443+drop} Q${x+3} ${455+drop} ${x-23} ${443+drop}Z`,'#b5a47c',1.16);
        draw(`M${x-27} ${389+drop} Q${x} ${380+drop} ${x+27} ${389+drop} Q${x+1} ${400+drop} ${x-27} ${389+drop}Z`,'#a69871',.87);
        line(`M${x-26} ${393+drop} Q${x} ${403+drop} ${x+27} ${393+drop}`,1,.82);
        for(let j=0;j<6;j++)line(`M${x-24+j*.4} ${402+j*7+drop} Q${x} ${410+j*7+drop} ${x+25-j*.6} ${402+j*7+drop}`,.63,.68);
        for(let j=0;j<7;j++)line(`M${x-22+j*7} ${397+drop} Q${x-17+j*6} ${421+drop} ${x-19+j*6} ${446+drop}`,.63,.63);
        draw(`M${x-25} ${388+drop} Q${x-1} ${380+drop} ${x+24} ${388+drop}`,null,1.2,'#dcc9a0',.63);
        line(`M${x-24} ${386+drop} L${x-21} ${393+drop} M${x-11} ${383+drop} L${x-8} ${391+drop} M${x+8} ${383+drop} L${x+11} ${391+drop} M${x+22} ${386+drop} L${x+25} ${392+drop}`,.56,.58);
        wash(`M${x-24} ${398+drop} L${x-11} ${403+drop} L${x-10} ${447+drop} L${x-23} ${442+drop}Z`,'#85734f',.19);
      }
    }

    // Paper grain sits above translucent washes, without gloss or hard lighting.
    ctx.save();ctx.globalCompositeOperation='source-atop';
    const r=(n)=>{const v=Math.sin(n*127.1+kind*91.7)*43758.5453;return v-Math.floor(v);};
    for(let i=0;i<260;i++){
      const x=62+r(i)*188,y=mapY(65+r(i+619)*533);
      ctx.strokeStyle=i%4?'rgba(69,74,62,.055)':'rgba(255,242,206,.16)';
      ctx.lineWidth=.35+r(i+97)*.6;ctx.beginPath();ctx.moveTo(x,y);
      ctx.lineTo(x+.3+r(i+302),y+1.2+r(i+37)*5.5);ctx.stroke();
    }
    ctx.restore();
}

// One cropped vector raster per standing role/direction, shared by every person
// and both gait phases: 48 × 320 × 400 × RGBA = 23.4375 MiB (31.25 with mipmaps).
// Independent textures keep neighbouring faces out of the entire mip pyramid.
// Rectangles use original 384×768 canvas coordinates. Merchant/tea-seller crops
// end at y=160, before their animated collar pixels; the 6 px fade covers the jaw.
const HEAD_WIDTH=320,HEAD_HEIGHT=400;
const headCache=new Map();
const HEAD_CROPS=[
  [[118,30,118,166],[121,30,112,164],[118,30,118,152],[152,30,112,164]],
  [[122,30,96,130],[128,30,108,130],[122,30,96,130],[148,30,108,130]],
  [[120,30,118,166],[125,30,112,164],[120,30,118,152],[147,30,112,164]],
  [[121,14,100,168],[127,14,108,170],[121,14,100,168],[149,14,108,170]],
  [[144,3,82,178],[146,5,86,178],[144,3,82,178],[152,5,86,178]],
  [[126,39,108,150],[130,37,116,156],[126,39,108,150],[138,37,116,156]],
  [[124,30,96,130],[127,30,108,130],[124,30,96,130],[149,30,108,130]],
  [[134,13,84,154],[137,13,86,156],[134,13,84,154],[161,13,86,156]]
];
function headDetail(kind,direction){
  const key=`${kind}-${direction}`;
  if(headCache.has(key))return headCache.get(key);
  // New townsfolk use native 384×768 coordinates. This common padded region
  // covers every hairpin, beard and cap while staying above the moving hem.
  const [x,y,w,h]=kind>=8?[116,0,162,256]:HEAD_CROPS[kind][direction];
  const sx=HEAD_WIDTH/w,sy=HEAD_HEIGHT/h;
  const map=canvasTexture(HEAD_WIDTH,HEAD_HEIGHT,ctx=>{
    ctx.scale(sx,sy);ctx.translate(-x,-y);
    paintFigure(ctx,kind,direction,0,false,Math.sqrt(sx*sy));
  });
  // CanvasTexture defaults match the base: unpremultiplied RGBA, sRGB, flipY.
  const detail={map,rect:new THREE.Vector4(x/384,1-(y+h)/768,w/384,h/768)};
  headCache.set(key,detail);return detail;
}
function addHeadSampling(shader,head){
  shader.uniforms.uInkHeadMap=head.map;
  shader.uniforms.uInkHeadRect=head.rect;
  shader.fragmentShader='uniform sampler2D uInkHeadMap;\nuniform vec4 uInkHeadRect;\n'+shader.fragmentShader;
  const sample=`
    // vMapUv is also the body's UV; both uploaded canvases have flipY=true.
    vec2 headUV = (vMapUv - uInkHeadRect.xy) / uInkHeadRect.zw;
    vec2 edge = min(headUV, 1.0 - headUV) * uInkHeadRect.zw * vec2(384.0, 768.0);
    float headWeight = smoothstep(0.0, 6.0, min(edge.x, edge.y));
    // At minification the existing body sample remains authoritative. Detail
    // fades in only when a base texel approaches or exceeds a screen pixel.
    vec2 bodyPixels = vMapUv * vec2(384.0, 768.0);
    float footprint = max(length(dFdx(bodyPixels)), length(dFdy(bodyPixels)));
    headWeight *= 1.0 - smoothstep(0.85, 1.6, footprint);
    vec4 headColor = texture2D(uInkHeadMap, clamp(headUV, vec2(0.0), vec2(1.0)));
    // Blend in linear colour with associated alpha, then return to the regular
    // unpremultiplied map pipeline. The outer edge returns exactly to the body.
    if (headWeight > 0.0) {
      float mixedAlpha = mix(sampledDiffuseColor.a, headColor.a, headWeight);
      vec3 mixedRGB = mix(sampledDiffuseColor.rgb * sampledDiffuseColor.a,
                          headColor.rgb * headColor.a, headWeight);
      sampledDiffuseColor = vec4(mixedRGB / max(mixedAlpha, 0.00001), mixedAlpha);
    }
    diffuseColor *= sampledDiffuseColor;`;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
    THREE.ShaderChunk.map_fragment.replace('diffuseColor *= sampledDiffuseColor;',sample));
}

// One original and five restrained garment dyes. These change uniforms only;
// every wearer keeps the same shared body/head rasters and near-detail pools.
const GARMENT_DYES=[null,['#7f9196','#536c76'],['#9ca58a','#717d66'],['#b59778','#896d57'],['#aa7969','#795b54'],['#c2b795','#92856d']];
function wardrobeFor(kind,seed,choice,working){
  // The tea seller's pale cloth overlaps celadon in RGB; keep that role's
  // original dye rather than risk colouring the tray vessels. New silhouettes
  // retain their separately authored robes, shaved heads, baskets and scrolls.
  if(kind>=8||kind===6||working)return null;
  const palette=Number.isInteger(choice)?THREE.MathUtils.clamp(choice,0,5):Math.floor(seed*6);
  const source=PALETTES[kind],target=GARMENT_DYES[palette]||source;
  return {palette,base:{value:new THREE.Color(source[0])},shade:{value:new THREE.Color(source[1])},target:{value:new THREE.Color(target[0])},targetShade:{value:new THREE.Color(target[1])},strength:{value:palette===0?0:.86}};
}
function addWardrobeSampling(shader,wardrobe){
  shader.uniforms.uInkClothBase=wardrobe.base;shader.uniforms.uInkClothShade=wardrobe.shade;
  shader.uniforms.uInkDyeBase=wardrobe.target;shader.uniforms.uInkDyeShade=wardrobe.targetShade;shader.uniforms.uInkDyeStrength=wardrobe.strength;
  shader.fragmentShader='uniform vec3 uInkClothBase, uInkClothShade, uInkDyeBase, uInkDyeShade;\nuniform float uInkDyeStrength;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment);
  shader.fragmentShader=shader.fragmentShader.replace('diffuseColor *= sampledDiffuseColor;',`
    if (uInkDyeStrength > 0.0 && sampledDiffuseColor.a > 0.15) {
      vec3 clothAxis = uInkClothBase - uInkClothShade;
      float clothTone = clamp(dot(sampledDiffuseColor.rgb - uInkClothShade, clothAxis) / max(dot(clothAxis, clothAxis), 0.0001), 0.0, 2.0);
      vec3 originalCloth = mix(uInkClothShade, uInkClothBase, clothTone);
      float clothMask = 1.0 - smoothstep(0.045, 0.14, length(sampledDiffuseColor.rgb - originalCloth));
      // Exclude the face/neck, dark ink, shoes, and warm skin even where a hand
      // lies over the robe. No alpha or painted contour is changed.
      float garmentRegion = smoothstep(0.008, 0.035, vMapUv.y) * (1.0 - smoothstep(0.80, 0.85, vMapUv.y));
      float headZone = (1.0 - smoothstep(0.125, 0.19, abs(vMapUv.x - 0.475))) * smoothstep(0.775, 0.81, vMapUv.y);
      garmentRegion *= 1.0 - headZone;
      float inkGuard = smoothstep(0.085, 0.155, dot(sampledDiffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722)));
      float skinGuard = smoothstep(0.10, 0.12, length(sampledDiffuseColor.rgb - vec3(0.672443, 0.462077, 0.300544)));
      vec3 dyedCloth = mix(uInkDyeShade, uInkDyeBase, clothTone) + sampledDiffuseColor.rgb - originalCloth;
      sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, max(dyedCloth, vec3(0.0)), uInkDyeStrength * clothMask * garmentRegion * inkGuard * skinGuard);
    }
    diffuseColor *= sampledDiffuseColor;`);
}

// Two global role/direction slots, each with both gait frames. A slot can only
// be repainted after every referencing material has released it. Once these
// four canvases exist, even a new role/view reuses their original storage.
// 4 × 768 × 1536 × RGBA = 18 MiB, and the complete mip chains stay below 24 MiB.
const BODY_DETAIL_ENTER=1.3,BODY_DETAIL_EXIT=1.6,BODY_DETAIL_HOLD=.1;
const bodyDetailSlots=[];
let bodyDetailClock=0;
function paintBodyDetail(ctx,kind,view,phase){
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,768,1536);
  ctx.save();ctx.scale(2,2);paintFigure(ctx,kind,view,phase,false,2);ctx.restore();
}
function getBodyDetail(kind,view){
  const key=`${kind}-${view}`;
  let slot=bodyDetailSlots.find(s=>s.key===key);
  if(slot){slot.used=++bodyDetailClock;return slot;}
  if(bodyDetailSlots.length<2){
    slot={key,maps:[0,1].map(phase=>canvasTexture(768,1536,ctx=>paintBodyDetail(ctx,kind,view,phase))),users:new Set(),used:++bodyDetailClock};
    bodyDetailSlots.push(slot);return slot;
  }
  // Slots used by this update or another People controller remain pinned.
  slot=bodyDetailSlots.filter(s=>s.users.size===0).sort((a,b)=>a.used-b.used)[0];
  if(!slot)return null;
  for(let phase=0;phase<2;phase++){
    paintBodyDetail(slot.maps[phase].image.getContext('2d'),kind,view,phase);
    slot.maps[phase].needsUpdate=true;
  }
  slot.key=key;slot.used=++bodyDetailClock;return slot;
}

const GROUND_PROBE_STEP=.14,GROUND_ANCHOR_TOLERANCE=.055;
function groundGradient(p,groundHeight){
  const probe=p.groundProbe;
  if(p.working||p.kind===12||typeof groundHeight!=='function')return false;
  const {x,y,z}=p.g.position;
  if(probe.x!==x||probe.z!==z||probe.heightFn!==groundHeight){
    probe.x=x;probe.z=z;probe.heightFn=groundHeight;probe.valid=false;
    const e=GROUND_PROBE_STEP,h=groundHeight(x,z),xm=groundHeight(x-e,z),xp=groundHeight(x+e,z),zm=groundHeight(x,z-e),zp=groundHeight(x,z+e);
    probe.height=h;
    if(Number.isFinite(h)&&Number.isFinite(xm)&&Number.isFinite(xp)&&Number.isFinite(zm)&&Number.isFinite(zp)){
      const gx=(xp-xm)/(2*e),gz=(zp-zm)/(2*e);
      // A porch edge or river-bank discontinuity is not a surface to bend to.
      const curvature=Math.max(Math.abs((xm+xp)*.5-h),Math.abs((zm+zp)*.5-h));
      if(Math.hypot(gx,gz)<=.65&&curvature<=.018){probe.gx=gx;probe.gz=gz;probe.valid=true;}
    }
  }
  // Absolute height is only a support test, never a y correction. Working
  // boatmen are excluded above; other deck passengers sit well above shore.
  return probe.valid&&Math.abs(y-probe.height)<=GROUND_ANCHOR_TOLERANCE;
}

export class People {
  constructor(scene){this.group=new THREE.Group();scene.add(this.group);this.people=[];this.temp=new THREE.Vector3();this.groundNormal=new THREE.Vector3();this.groundRotation=new THREE.Quaternion();this.up=new THREE.Vector3(0,1,0);}
  add(x,z,options={}){
    const {kind=0,scale=1,heading=0,y=null,working=false}=options;
    // The folded worker is a planted activity, not a shortened walking figure.
    const walk=kind===12?0:options.walk??0,route=kind===12?null:options.route??null;
    const variation=Math.abs(Math.sin(x*91.17+z*37.21+kind*17.3));
    const stature=scale*(options.scale===undefined?.94+variation*.12:1);
    const appearance=Math.abs(Math.sin(x*43.79+z*67.13+kind*11.91));
    const bodyWidth=working?1:THREE.MathUtils.clamp(options.width??(.94+appearance*.12),.88,1.12);
    const g=group(this.group,x,y??.22,z);const height=(kind===12?1.05:kind===7?1.24:working&&kind===3?1.46:1.78)*stature;
    const tint=['#fff8ec','#f4f5e9','#fff4e5','#f5f8ee','#fff3e6'][Math.min(4,Math.floor(variation*5))];
    // Camera-facing painted planes need only one transparent pass; rendering
    // both sides would draw the same thin silhouette twice.
    const material=new THREE.MeshBasicMaterial({map:figureTexture(kind,0,working?1:0,working),transparent:true,alphaTest:.16,depthWrite:true,side:THREE.DoubleSide,forceSinglePass:true,color:tint});
    // Only the drawn chest expands a few millimetres. Head and feet remain
    // anchored, so an idle person never sways or bobs as a single cardboard cutout.
    const breath={value:0},ground={value:new THREE.Vector2(0,kind===12?0:height*.06)};
    const initialHead=kind===12||working&&kind===3?null:headDetail(kind,0);
    const head=initialHead?{map:{value:initialHead.map},rect:{value:initialHead.rect}}:null;
    const wardrobe=wardrobeFor(kind,appearance,options.palette,working);
    material.onBeforeCompile=shader=>{
      shader.uniforms.uInkBreath=breath;
      shader.uniforms.uInkGround=ground;
      shader.vertexShader='uniform float uInkBreath;\nuniform vec2 uInkGround;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
float chest = smoothstep(0.23, 0.47, uv.y) * (1.0 - smoothstep(0.64, 0.75, uv.y));
transformed.x *= 1.0 + uInkBreath * 0.0036 * chest;
transformed.y += uInkBreath * 0.0013 * chest;
// Fade over the lowest two of the existing twelve mesh rows. Upper cloth,
// head and every UV stay fixed. The cap also prevents folded lower triangles.
float groundedHem = 1.0 - smoothstep(1.0 / 12.0, 1.0 / 6.0, uv.y);
transformed.y += clamp(position.x * uInkGround.x, -uInkGround.y, uInkGround.y) * groundedHem;`);
      if(head)addHeadSampling(shader,head);
      if(wardrobe)addWardrobeSampling(shader,wardrobe);
    };
    material.customProgramCacheKey=()=> 'qingming-people-ground-dye-1-'+(head?'head':'full')+'-'+(wardrobe?'dye':'plain');
    const sprite=new THREE.Mesh(new THREE.PlaneGeometry(height*(kind===12?.82:working&&kind===3?.8:.5)*bodyWidth,height,4,12),material);sprite.position.y=height*.5;g.add(sprite);
    sprite.geometry.computeBoundingSphere();sprite.geometry.boundingSphere.radius+=height*.06;
    const foot=new THREE.Mesh(new THREE.CircleGeometry(.21*scale,16),new THREE.MeshBasicMaterial({color:'#61563d',transparent:true,opacity:.11,depthWrite:false}));foot.rotation.x=-Math.PI/2;foot.position.y=.018;foot.scale.y=.55;g.add(foot);
    const p={g,sprite,material,breath,head,wardrobe,bodyWidth,ground,foot,flatFootRotation:foot.quaternion.clone(),groundProbe:{x:NaN,z:NaN,heightFn:null,height:0,gx:0,gz:0,valid:false},kind,heading,walk,route,working,x,z,baseY:y,phase:between(0,10),lastKey:'',height,walkDistance:0,routeStarted:false,view:-1,drawHeading:heading,turnFrom:heading,turnTo:heading,turnStartTime:0,headingReady:false,baseMap:material.map,bodyPhase:working?1:0,bodyDetail:null,bodyDetailNear:false};this.people.push(p);return p;
  }
  update(time,camera,groundHeight){
    for(const p of this.people){
      if(p.route&&p.walk){
        const t=(Math.sin(time*p.walk+p.phase)+1)*.5,oldX=p.g.position.x,oldZ=p.g.position.z;
        let a=p.route[0],b=p.route[1],progress=t;
        // The same unhurried gait follows measured distance around buyers and
        // goods. Short bends do not restart the walk or snap back to a route end.
        if(p.crowdPath){
          const path=p.crowdPath,distance=t*path.length;
          const segment=path.segments.find(s=>distance<=s.start+s.length)||path.segments[path.segments.length-1];
          a=segment.a;b=segment.b;progress=THREE.MathUtils.clamp((distance-segment.start)/segment.length,0,1);
        }
        p.g.position.x=a[0]+(b[0]-a[0])*progress;p.g.position.z=a[1]+(b[1]-a[1])*progress;
        if(p.routeStarted)p.walkDistance+=Math.hypot(p.g.position.x-oldX,p.g.position.z-oldZ);
        p.routeStarted=true;const dir=Math.cos(time*p.walk+p.phase)>0?1:-1;
        p.heading=Math.atan2((b[0]-a[0])*dir,(b[1]-a[1])*dir);
        p.g.position.y=groundHeight(p.g.position.x,p.g.position.z);
      }
      // Route heading remains exact. Only the painted facing turns at a reversal,
      // independently of route coordinates, speed, gait and the grounded feet.
      if(!p.headingReady){p.drawHeading=p.turnFrom=p.turnTo=p.heading;p.headingReady=true;}
      else{
        if(Math.abs(wrapAngle(p.heading-p.turnTo))>1e-6){p.turnFrom=p.drawHeading;p.turnTo=p.heading;p.turnStartTime=time;}
        const progress=Math.min(1,Math.max(0,(time-p.turnStartTime)/TURN_SECONDS));
        const eased=progress*progress*(3-2*progress);
        p.drawHeading=progress>=1?p.turnTo:p.turnFrom+wrapAngle(p.turnTo-p.turnFrom)*eased;
      }
      const angle=Math.atan2(camera.position.x-p.g.position.x,camera.position.z-p.g.position.z);
      p.sprite.rotation.y=angle;
      if(groundGradient(p,groundHeight)){
        const {gx,gz}=p.groundProbe;
        p.ground.value.x=gx*Math.cos(angle)-gz*Math.sin(angle);
        this.groundNormal.set(-gx,1,-gz).normalize();
        this.groundRotation.setFromUnitVectors(this.up,this.groundNormal);
        p.foot.quaternion.copy(p.flatFootRotation).premultiply(this.groundRotation);
      }else{
        p.ground.value.x=0;p.foot.quaternion.copy(p.flatFootRotation);
      }
      const view=stablePaintedView(angle-p.drawHeading,p.view);p.view=view;
      const phase=(p.kind===9||p.kind===12)?0:p.working?1:p.walk?Math.floor(p.walkDistance/.28)%2:((p.kind===1||p.kind===6)&&Math.sin(time*.66+p.phase)>.55?1:0);
      const key=`${view}-${phase}`;if(p.lastKey!==key){p.baseMap=figureTexture(p.kind,view,phase,p.working);if(p.head){const detail=headDetail(p.kind,view);p.head.map.value=detail.map;p.head.rect.value=detail.rect;}p.lastKey=key;}
      p.bodyPhase=phase;
      p.breath.value=Math.sin(time*.92+p.phase)*(p.working?.65:1);
      p.sprite.position.y=p.height*.5+(p.walk?Math.sin(p.walkDistance*Math.PI/.28)*.008:0);
    }
    // Release this controller's references before any texture is repainted.
    // Other controllers' materials remain registered and cannot be evicted.
    const candidates=[];
    camera.getWorldDirection(this.temp);
    const forwardLength=Math.hypot(this.temp.x,this.temp.z);
    for(const p of this.people){
      const retained=!!p.bodyDetail;
      p.material.map=p.baseMap;
      if(p.bodyDetail){p.bodyDetail.users.delete(p.material);p.bodyDetail=null;}
      const distance=Math.hypot(camera.position.x-p.g.position.x,camera.position.z-p.g.position.z);
      p.bodyDetailNear=!(p.working&&p.kind===3)&&distance<(p.bodyDetailNear?BODY_DETAIL_EXIT:BODY_DETAIL_ENTER);
      const facing=distance<.05||forwardLength<.05?1:
        ((p.g.position.x-camera.position.x)*this.temp.x+(p.g.position.z-camera.position.z)*this.temp.z)/(distance*forwardLength);
      // A generous front cone includes figures at the screen edge. Existing
      // detail gets a wider exit angle, so small camera turns do not churn slots.
      if(p.bodyDetailNear&&facing>(retained?-.15:.1))candidates.push({p,distance,priority:distance-(retained?BODY_DETAIL_HOLD:0)});
    }
    candidates.sort((a,b)=>a.priority-b.priority);
    const chosen=new Map();
    for(const {p} of candidates){
      const key=`${p.kind}-${p.view}`;
      let slot=chosen.get(key);
      if(!slot&&chosen.size<2){slot=getBodyDetail(p.kind,p.view);if(slot)chosen.set(key,slot);}
      if(!slot)continue;
      slot.users.add(p.material);p.bodyDetail=slot;p.material.map=slot.maps[p.bodyPhase];
    }
  }
  get count(){return this.people.length;}
}
