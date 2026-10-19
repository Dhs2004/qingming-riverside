// Four additional painted townspeople. Native 384 × 768 coordinates; callers
// own the canvas and any high-resolution transform. No texture allocation.
const INK='#595348',HAIR='#484a43',SKIN='#d5b596',PALE='#e6d9bd';
const palettes={8:['#929889','#697466','#cec5aa'],9:['#a8a38c','#787d6b','#b8a381'],10:['#89a09a','#617c78','#c7b496'],11:['#91a3a8','#687e87','#ded3b7']};
function random(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

export function paintTownsfolk(ctx,kind,direction,phase=0,rasterScale=1){
  if(kind===12)return paintCrouchedWorker(ctx,direction,phase,rasterScale);
  if(!palettes[kind])return;
  direction=((direction%4)+4)%4;const side=direction===1||direction===3,back=direction===2,far=direction===3;
  const [cloth,shade,lining]=palettes[kind],fabric=new Set([cloth,shade,lining,PALE]);
  const gait=phase&&[8,10,11].includes(kind)?1:0;let garmentGait=true;
  // A second planted step belongs only to the walking townsfolk. Change the
  // lower robe and shoes, leaving faces, grips, baskets and scrolls untouched.
  function gaitPath(d){
    if(!gait||!garmentGait)return d;
    const tokens=d.match(/[MLQZ]|-?(?:\d*\.)?\d+/g);let result='';
    for(let i=0;i<tokens.length;){
      if(/^[MLQZ]$/.test(tokens[i])){result+=tokens[i++];continue;}
      const x=Number(tokens[i++]),y=Number(tokens[i++]),weight=Math.max(0,Math.min(1,(y-590)/150));
      const shift=14*Math.max(-1,Math.min(1,(x-190)/35))*weight*weight;
      result+=(x+shift)+' '+y+' ';
    }
    return result;
  }
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  if(far||(kind===8&&back)){ctx.translate(384,0);ctx.scale(-1,1);}
  const glow=ctx.createLinearGradient(93,170,270,735);glow.addColorStop(0,'#fff3d637');glow.addColorStop(.42,'#ead8ba08');glow.addColorStop(1,'#45616b25');
  const bloom=ctx.createRadialGradient(142,265,8,176,323,236);bloom.addColorStop(0,'#fff0d424');bloom.addColorStop(1,'#f0d8b200');
  const draw=(d,fill=null,w=1.18,alpha=.78)=>{
    const p=new Path2D(gaitPath(d));ctx.save();
    if(fill){ctx.fillStyle=fill;ctx.fill(p);if(fabric.has(fill)){ctx.save();ctx.clip(p);ctx.fillStyle=glow;ctx.fillRect(0,0,384,768);ctx.fillStyle=bloom;ctx.fillRect(0,0,384,768);ctx.restore();}}
    if(w){ctx.strokeStyle=INK;ctx.lineWidth=w;ctx.globalAlpha*=alpha;ctx.stroke(p);}ctx.restore();return p;
  };
  const line=(d,w=.8,a=.65)=>draw(d,null,w,a);
  const wash=(d,c=shade,a=.17)=>{ctx.save();ctx.globalAlpha=a;ctx.filter=`blur(${.7*rasterScale}px)`;draw(d,c,0);ctx.restore();};
  const folds=(paths,w=.82)=>{for(let i=0;i<paths.length;i++){line(paths[i],w*3,.07);line(paths[i],w*[1,.65,.85,.58][i%4],.65);}};
  const hand=(d,marks='')=>{const p=draw(d,SKIN,.94,.81);ctx.save();ctx.clip(p);const g=ctx.createLinearGradient(120,275,285,440);g.addColorStop(0,'#ffe7c930');g.addColorStop(1,'#986e5229');ctx.fillStyle=g;ctx.fillRect(0,0,384,768);if(marks)line(marks,.54,.72);ctx.restore();};
  const shoe=(x,y,w=56,reverse=false)=>{ctx.save();ctx.translate(x+gait*(reverse?-14:14),y-(reverse?gait*3:0));if(reverse)ctx.scale(-1,1);draw('M0 0 Q12 3 24 0 L29 10 Q42 15 51 12 Q60 16 54 23 Q29 28 3 22 L-4 16Z',HAIR,1.13);line('M1 21 Q26 26 53 20',.7,.69);line('M8 6 Q21 10 28 16 M28 14 Q42 19 52 16',.65,.44);ctx.restore();};
  function head(cx,top,style){
    ctx.save();ctx.translate(cx,top);
    // Each face has its own shape, age, hairline and four-view information.
    if(back){
      hand('M-17 83 L-16 118 Q0 128 18 116 L17 81Z');
      if(style==='monk'){
        draw('M-35 29 Q-31 1 0 0 Q31 0 34 29 L29 73 Q20 94 0 98 Q-23 91-31 71Z',SKIN,1.13);
        wash('M-29 31 Q-18 11-4 9 L-8 77 Q-18 84-24 73Z','#f0ddbf',.20);line('M-25 70 Q0 86 25 71 M-31 48 Q-38 49-33 65 M31 48 Q38 49 32 64',.68,.62);
      }else{
        draw('M-33 30 Q-31 3-4 0 Q24-3 33 25 L29 77 Q16 99-3 99 Q-25 94-32 69Z',style==='elder'?'#92978b':HAIR,1.16);
        if(style==='woman'){draw('M-22 9 Q-39-3-26-18 Q-9-32 10-19 Q26-7 17 8Z',HAIR,1.05);line('M-27-9 Q-12-22 8-11 M-25 14 Q-7 27 24 14 M-24 38 Q0 60 25 35 M-16 76 Q0 87 17 73',.63,.65);draw('M-32-9 L26-15 L27-12 L-32-6Z','#a98e69',.57);}
        else if(style==='scholar'){draw('M-30 11 L-25-23 Q-4-32 23-23 L29 10 L24 48 Q0 53-27 45Z',HAIR,1.12);line('M-19-21 L-20 9 M17-22 L21 7 M-25 13 Q0 19 26 12',.68,.54);draw('M-17 39 L-11 83 L-17 112 L-24 112 L-18 78 L-25 40Z',HAIR,.87);}
        else{line('M-22 14 Q-4 6 19 17 M-29 38 Q-17 47-9 50 M29 34 L18 49 M-28 61 Q-21 78-10 82 M21 61 Q16 79 8 84',.64,.64);for(let i=0;i<8;i++)line(`M${-27+i*3} ${25+i%3*4} Q${-21+i*3} 29 ${-17+i*3} 38`,.52,.43);}
      }
    }else if(side){
      hand('M-19 82 L-20 115 Q-5 125 10 113 L11 80Z');
      draw(style==='elder'?'M-29 32 Q-24 9 0 9 Q20 13 26 35 L29 52 L41 64 L30 69 L31 79 L24 94 Q7 107-10 94 L-25 75Z':'M-28 29 Q-21 4 1 5 Q22 8 27 32 L29 49 L40 60 L31 65 L31 76 Q26 95 9 99 Q-9 95-21 82 L-28 58Z',SKIN,1.16);
      wash('M-22 28 Q-10 9 0 16 L-5 51 L-21 61Z','#f2debb',.20);wash('M15 70 Q24 60 31 70 L28 80 L19 84Z','#b88970',.16);
      line('M17 42 Q24 40 29 46 M21 48 L27 49 M28 76 L34 76 M-20 56 Q-29 50-26 65 L-19 73 M-21 58 L-22 65',.67,.84);
      if(style==='elder'){
        draw('M-29 47 Q-37 26-22 9 Q-4-7 15 10 L21 23 Q-1 14-14 32 L-16 66 L-24 75Z','#949a8e',.99);
        draw('M-17 78 Q-6 94 11 89 L31 83 Q27 112 7 137 L-2 128 L-10 108 L-20 97Z','#b2b4a2',.90);folds(['M-12 92 Q-1 109 6 125','M-3 92 L11 117','M18 96 L12 124','M-22 26 L-18 46','M-10 15 L-15 33'],.60);line('M15 55 L25 59 M14 58 L23 62 M-4 40 Q6 36 13 41',.52,.65);
      }else if(style==='monk'){
        line('M-21 17 Q-2 2 15 16 M-27 32 Q-22 17-15 14',.58,.25);line('M5 92 Q16 97 25 88',.55,.46);
      }else if(style==='woman'){
        draw('M-31 53 Q-38 22-22 4 Q-5-10 16 5 L27 31 Q10 15-8 26 L-16 47 L-19 78 L-29 67Z',HAIR,1.07);
        draw('M-21 9 Q-39 7-42-8 Q-45-26-23-24 Q-7-26-2-12 L-6 4Z',HAIR,1.05);draw('M-47-10 L-3-15 L-2-12 L-46-7Z','#a68f6d',.54);line('M-33-11 Q-21-19-12-8 M-25 24 Q-14 13 4 19 M20 45 L28 46',.60,.64);line('M26 81 L31 80',.55,.65);
      }else{
        draw('M-31 44 L-30 8 L-27-23 Q-10-32 13-23 L23 16 L20 37 Q-2 22-19 41 L-20 70Z',HAIR,1.13);line('M-20-22 L-20 6 M10-23 L16 10 M-27 12 Q-4 17 18 12',.65,.57);draw('M-28 39 L-33 90 L-23 96 L-19 55Z',HAIR,.85);line('M25 80 L30 83 M20 86 Q23 93 15 100',.74,.60);
      }
    }else{
      hand('M-18 84 L-19 119 Q0 132 20 117 L18 81Z');
      draw(style==='elder'?'M-33 31 Q-29 6 0 5 Q30 8 32 36 L27 78 Q18 102 0 105 Q-22 99-30 76Z':'M-32 27 Q-27 2 0 0 Q27 3 32 27 L29 70 Q19 97 0 100 Q-20 94-29 71Z',SKIN,1.17);
      hand('M-31 46 Q-41 43-38 60 L-30 68Z M31 46 Q41 43 37 62 L30 67Z');
      wash('M-26 24 Q-17 8-6 10 L-10 66 L-25 69Z','#f2dfbe',.19);wash('M-27 68 Q-15 58-9 70 L-12 79 L-23 80Z M12 70 Q21 61 29 69 L25 79 L15 81Z','#bc856d',.13);
      line('M-24 44 Q-15 40-8 44 M10 43 Q19 40 26 45 M-21 50 L-13 50 M14 50 L22 51 M1 47 L-3 66 L3 69 M-8 83 Q1 86 10 82',.73,.81);
      if(style==='elder'){
        draw('M-33 55 Q-43 30-28 11 Q-13-3 0 4 L-5 18 Q-22 22-23 50 L-25 79 L-33 74Z M3 5 Q28-1 36 24 L33 69 L25 80 L24 48 Q25 27 9 20Z','#949a8e',1.0);
        draw('M-25 78 Q-10 91 0 84 Q12 91 25 77 L22 106 Q13 130 0 140 Q-17 128-22 107Z','#b7b8a5',.88);
        folds(['M-17 96 Q-11 113-4 126','M-7 96 L-2 132','M5 96 L2 132','M16 94 Q11 114 5 126','M-30 29 L-28 49','M29 25 L28 49'],.57);line('M-23 55 L-12 58 M14 56 L23 59 M-22 60 L-14 64 M15 62 L23 66 M-12 29 Q0 25 14 31',.58,.67);
      }else if(style==='monk'){
        line('M-21 15 Q-3 5 17 13',.52,.25);line('M-9 87 Q1 90 11 85',.55,.48);
      }else if(style==='woman'){
        draw('M-32 50 Q-43 23-27 5 Q-14-9 1-4 Q23-8 34 15 L33 46 L24 49 Q19 17 0 20 Q-17 17-23 48Z',HAIR,1.11);
        draw('M-17 1 Q-32-12-18-26 Q-3-39 13-28 Q29-15 16 0Z',HAIR,1.08);draw('M-32-18 L31-23 L32-20 L-31-15Z','#a28a62',.56);line('M-19-16 Q-6-31 11-18 M-20 15 Q-5 8 9 14 M-22 45 L-12 44 M13 44 L24 46',.64,.61);
      }else{
        draw('M-32 35 L-29 5 L-25-25 Q-2-35 25-24 L29 8 L31 36 Q3 27-24 39Z',HAIR,1.14);line('M-18-24 L-20 7 M17-24 L21 7 M-27 10 Q1 17 26 9',.66,.58);draw('M-32 34 L-35 83 L-29 92 L-23 46Z M27 35 L31 73 L25 85 L22 45Z',HAIR,.80);line('M-8 83 L-2 85 M3 85 L10 83 M-4 95 Q1 101 5 94',.74,.66);
      }
    }
    ctx.restore();
  }

  function basket(cx,cy,narrow=false){
    ctx.save();ctx.translate(cx,cy);if(narrow)ctx.scale(.68,1);
    // Handle and vegetables behind the rim; the painted grip is added last.
    draw('M-36 18 Q-39-34 0-35 Q37-31 37 20',null,3.3,.73);line('M-33 16 Q-34-29 0-31 Q33-29 34 18',.72,.68);
    for(const [x,tilt] of [[-23,-16],[-8,8],[10,-9],[23,12]]){
      draw(`M${x} 20 Q${x+tilt-15}-13 ${x+tilt} -25 Q${x+tilt+14}-13 ${x} 20Z`,'#8b9f7a',.79);line(`M${x} 18 L${x+tilt} -20`,.59,.52);
    }
    draw('M-46 14 Q0 1 46 14 L37 75 Q0 92-36 74Z','#b79c6c',1.16);draw('M-46 12 Q-1 0 47 12 L46 22 Q0 11-45 23Z','#c6ae7d',.96);
    for(let j=0;j<7;j++){const yy=28+j*7;line(`M${-42+j*.9} ${yy} Q0 ${yy-6} ${42-j*.9} ${yy}`, .65,.52);}
    for(let j=0;j<11;j++){const xx=-34+j*6.8;line(`M${xx} 24 Q${xx*.94+3} 50 ${xx*.82} 78`,.65,.57);line(`M${xx+2} 25 Q${xx*.94+5} 48 ${xx*.82+1.5} 77`,.36,.25);}
    line('M-35 70 Q0 82 36 70 M-43 18 Q0 8 45 18',.82,.67);ctx.restore();
  }
  function staff(){
    garmentGait=false;
    draw('M302 321 Q310 305 319 317 Q326 325 316 335 L313 345 L308 539 L303 764 L298 764 L303 537 L308 341 Q312 330 313 325 Q309 322 307 330Z','#9b8661',.97);
    line('M308 361 L305 501 M303 552 L300 747 M304 427 L311 429 M302 615 L307 617 M305 345 L311 347',.61,.66);
    garmentGait=true;
  }
  function scroll(cx,cy,profile=false){
    ctx.save();ctx.translate(cx,cy);if(profile)ctx.scale(.70,1);
    draw('M-53-16 L51-10 Q61 1 49 15 L-53 8Z','#dccdaa',1.02);draw('M-57-16 Q-47-21-42-11 L-42 9 Q-53 18-59 6Z','#bda77a',.95);draw('M48-10 Q59-15 62-5 L60 13 Q50 20 45 11Z','#c6b58c',.88);line('M-48-13 L-47 7 M-39-9 L43-4 M-38 1 L41 7 M53-6 Q58 0 53 11',.61,.60);draw('M-5-14 L2-14 L0 11 L-7 11Z','#a29574',.60);line('M-2 9 L-8 35 L-5 41 M0 10 L8 28 L6 36',.90,.67);ctx.restore();
  }

  if(kind===8){
    shoe(side?148:130,739,56,true);shoe(side?193:214,738);
    if(far)staff();
    draw(side?'M168 186 Q197 178 222 193 Q239 213 241 251 L230 397 Q229 523 249 732 Q199 751 130 738 L136 625 Q150 492 143 411 L131 330 Q105 291 123 240 Q137 201 168 186Z':'M164 185 Q190 168 216 185 Q242 195 250 228 L263 349 L244 426 Q242 546 266 733 Q202 753 117 739 L126 602 Q137 490 133 413 L113 327 Q94 282 121 229 Q137 197 164 185Z',cloth,1.42);
    wash(side?'M148 228 Q168 239 166 354 L176 429 Q163 552 155 739 L131 735 Q151 552 143 413 L130 328Z':'M143 229 Q158 309 151 409 L167 478 L148 741 L120 736 Q141 547 135 415 L119 330Z');
    if(back){draw('M173 185 Q197 201 221 184 L228 208 Q198 220 162 203Z',lining,.93);folds(['M157 222 Q183 235 223 211','M176 236 Q181 312 173 345','M210 241 L218 318','M137 367 Q160 389 184 379','M149 408 Q169 455 159 505','M197 403 Q213 477 202 519','M143 528 L133 718','M170 533 L166 738','M215 542 L239 727']);}
    else{draw(side?'M201 177 L226 185 L209 228 L184 273 L171 256 L191 220Z':'M171 184 L191 204 L208 226 L188 257 L169 218 L153 201Z',lining,.97);draw(side?'M194 222 L203 228 L171 375 L155 391 L169 329Z':'M178 219 L190 243 L163 365 L151 382 L160 313Z',shade,.84);folds(side?['M151 222 Q136 258 141 289','M154 283 Q157 330 169 351','M187 288 L173 362','M219 310 Q203 371 209 420','M164 421 Q157 489 161 527','M190 469 Q178 585 182 655','M146 562 L140 722','M214 493 L233 731']:['M130 237 Q116 282 133 312','M155 247 L142 329','M166 276 L152 357','M223 236 Q237 277 236 302','M148 416 Q161 461 155 497','M180 421 Q195 486 178 535','M211 438 L220 529','M146 544 L136 729','M172 543 L164 743','M216 566 L246 729']);}
    if(!far)staff();
    // The raised sleeve and wrapped fingers end on the wooden crook.
    draw(side?'M216 204 Q237 216 242 258 L259 309 L301 327 L298 354 Q264 355 244 343 Q217 331 210 301 L197 248Z':'M232 208 Q252 232 255 270 L269 309 L303 328 L299 355 Q270 359 247 341 Q227 324 220 290 L214 249Z',cloth,1.22);
    draw('M295 325 L304 327 L305 351 L296 356Z',lining,.79);hand('M302 327 Q311 321 319 324 L324 331 L320 343 L312 348 L303 349 L302 342 L315 337 L314 332 L303 335Z','M315 330 L320 331 M315 335 L322 336 M311 341 L319 341');
    folds(['M235 245 Q240 281 247 307','M244 319 Q266 343 293 343','M249 328 Q269 352 289 349'],.77);
    if(!back){draw(side?'M139 258 Q124 279 126 322 Q136 350 170 363 L191 350 L185 329 L154 316 L161 278Z':'M126 245 Q107 275 110 316 Q120 348 159 360 L181 345 L175 324 L142 313 L148 273Z',cloth,1.12);hand(side?'M183 330 L199 333 L208 345 L202 355 L184 352Z':'M171 325 L188 330 L198 342 L191 353 L175 348Z',side?'M196 338 L203 347 M191 342 L198 351':'M185 336 L192 344 M181 341 L188 348');}
    head(side?216:199,back?74:side?77:66,'elder');
  }else if(kind===9){
    shoe(side?151:127,739,56,true);shoe(side?204:213,739);
    // A traveller's bundle bulges beyond one shoulder; opposite profile places
    // it behind the body instead of repainting the same arm arrangement.
    if(back||side){draw(side?'M117 209 Q80 220 84 267 L98 319 Q128 338 156 309 L165 245 L146 214Z':'M212 224 Q251 214 278 244 L285 319 Q274 350 242 342 L209 299Z',lining,1.31);wash(side?'M101 240 Q86 287 121 315 L100 314 L87 269Z':'M259 238 Q282 272 275 321 L255 336 L268 283Z');folds(side?['M103 231 Q131 240 147 229','M93 265 Q119 258 148 275','M119 277 L126 315']:['M227 239 Q250 250 270 244','M234 262 L259 283','M243 312 L274 322']);}
    draw(side?'M163 176 Q195 165 219 187 L239 240 L242 364 Q223 442 252 735 Q203 753 128 739 Q144 582 127 425 L111 352 Q91 313 110 267 L137 200Z':'M155 174 Q184 166 215 173 Q249 184 270 224 L291 320 Q284 356 257 368 L249 423 Q256 591 271 738 Q192 753 111 739 Q122 590 115 450 L109 365 Q82 364 76 333 L95 235 Q114 190 155 174Z',cloth,1.36);
    wash(side?'M145 226 Q126 300 149 378 L164 454 L154 741 L131 738 Q143 566 130 434 L112 355Z':'M126 208 Q113 298 134 357 L151 432 L136 743 L111 738 Q127 579 115 444 L106 358Z');
    if(back){
      // The bundle sits on the visible back, so it must cover the rear robe.
      draw('M211 221 Q246 202 273 229 Q290 261 282 307 L270 343 Q239 352 217 327 L207 268Z',lining,1.20);
      wash('M264 228 Q287 270 273 323 L257 339 L267 293Z',shade,.17);
      folds(['M220 231 Q244 242 267 231','M215 256 Q241 249 280 273','M227 273 Q244 290 272 290','M233 306 L247 340','M269 302 L264 330'],.79);
      draw('M231 230 L236 218 L245 219 L249 233 L242 238Z',lining,.76);line('M235 224 L244 230 M241 219 L238 234',.61,.68);
    }
    if(back){draw('M132 185 L148 179 L252 343 L237 354Z',lining,.95);draw('M118 332 Q184 354 257 331 L257 349 Q185 368 115 348Z',shade,.88);folds(['M150 200 Q190 215 225 198','M151 221 Q145 276 156 310','M219 224 Q231 278 220 313','M129 370 L137 427','M193 373 Q180 437 195 493','M224 411 L235 526','M150 479 L135 729','M179 500 L170 744','M214 551 L242 735']);}
    else{
      draw(side?'M182 171 L207 181 L179 223 L151 276 L134 257 L166 210Z':'M156 173 L184 204 L221 175 L237 195 L187 245 L137 195Z',lining,1.01);
      draw(side?'M219 202 L232 214 L165 377 L144 367Z':'M237 186 L253 197 L137 392 L118 379Z',lining,.95);
      // Broad diagonal patched shoulder mantle, loosely settled over plain robe.
      draw(side?'M184 227 L222 198 Q244 247 238 322 L210 386 L150 361Z':'M222 205 L259 226 L276 315 L246 376 L182 344 L166 307Z',lining,1.15);
      folds(side?['M207 238 L191 280','M226 264 L208 312','M194 309 L172 350','M218 324 L201 372']:['M219 231 L198 289','M250 247 L229 308','M196 312 L247 341','M228 321 L214 356'],.73);
      draw(side?'M145 229 Q126 260 130 298 L172 328 L205 317 L212 337 Q184 363 156 350 L120 327 Q103 309 109 281 L120 251Z':'M107 229 Q85 275 91 319 Q107 348 149 354 L190 332 L183 309 L147 326 L129 298 L137 255Z',cloth,1.17);
      hand(side?'M201 315 L214 308 L225 313 L223 327 L208 337 L202 334Z':'M183 308 L199 302 L211 307 L213 319 L197 334 L188 333Z',side?'M212 316 L221 318 M209 322 L218 325':'M199 309 L207 311 M195 315 L208 316 M194 322 L202 325');
      folds(side?['M131 256 L122 294','M135 318 L161 338','M166 387 Q174 450 164 500','M187 418 L197 517','M145 524 L139 732','M177 560 L175 743','M216 499 L237 731']:['M110 260 L104 310','M114 329 L146 343','M130 391 Q149 433 137 480','M174 383 Q170 461 180 514','M219 398 L221 486','M146 514 L130 730','M175 531 L169 745','M219 532 L250 733']);
    }
    head(side?195:189,54,'monk');
  }else if(kind===10){
    shoe(side?154:139,740,56,true);shoe(side?201:207,739);
    const basketX=side?(far?127:264):back?91:291,basketY=side?449:458;
    if(back||far)basket(basketX,basketY,side);
    // Separate narrow pleated skirt and open, straight-collared beizi.
    draw(side?'M152 337 L209 336 Q216 493 238 738 Q193 752 130 740 L139 503Z':'M138 331 L220 332 Q237 504 260 740 Q188 752 116 740 L128 521Z',lining,1.30);
    folds(side?['M163 384 Q155 552 143 735','M180 408 L173 746','M198 405 Q197 564 214 740','M205 526 L229 735']:['M147 385 Q139 555 128 735','M165 397 L158 746','M187 405 L186 749','M207 391 L222 744','M222 465 L248 734'],.86);
    // The open beizi reveals an actual under-jacket, not the transparent canvas.
    // This is behind both lapels and closes the torso down to the skirt waist.
    if(!back){
      draw(side?'M169 177 L194 178 L205 238 L204 343 L150 342 L159 248Z':'M157 178 Q187 192 224 178 L239 244 L229 343 L134 342 L144 242Z',PALE,.86);
      folds(side?['M178 228 L181 303','M174 313 L190 330']:['M177 225 Q181 265 174 299','M195 243 L199 313','M165 325 L207 329'],.60);
    }
    draw(side?'M155 170 Q179 162 202 177 Q224 194 225 236 L214 339 L226 565 L228 682 L205 695 L189 512 L185 288 L166 205 L162 345 L150 525 L133 691 L113 686 Q133 516 131 368 L117 295 Q96 287 108 249 L129 191Z':'M154 168 L180 182 L168 231 L162 409 L140 691 L110 684 Q129 507 126 365 L125 262 Q112 311 90 307 Q69 300 77 272 L103 210 Q120 179 154 168 M203 182 L225 171 Q252 183 269 212 L294 303 Q282 328 259 317 L243 276 L246 395 L267 686 L237 696 L216 486 L207 271Z',cloth,1.32);
    wash(side?'M139 215 Q134 287 143 343 L135 527 L118 680 L131 482 L132 355 L118 291Z':'M135 199 Q140 281 144 343 L129 522 L117 680 L126 477 L126 356 L110 294Z');
    if(back){
      // A beizi has a continuous back panel: the front openings and pale
      // under-jacket do not reappear when viewed from behind.
      draw('M151 184 Q188 201 225 183 L242 272 L237 391 Q246 544 264 685 Q191 708 112 683 L132 491 L138 302Z',cloth,1.22);
      wash('M157 208 Q174 295 163 391 L149 682 L122 684 Q145 527 143 361Z',shade,.12);
    }
    if(back){draw('M156 170 Q188 187 222 170 L229 186 Q188 203 151 185Z',PALE,.87);folds(['M150 205 Q184 219 222 200','M159 223 L165 306','M219 222 L212 305','M172 328 Q185 422 174 480','M218 371 L232 544','M147 391 L126 660','M191 489 L196 672']);draw('M105 279 Q95 330 89 383 L85 421 L102 429 L120 370 L132 300Z',cloth,1.13);hand('M86 418 L84 431 L90 440 L99 439 L104 427 L99 419Z','M89 428 L98 431 M92 435 L98 435');}
    else{
      draw(side?'M159 171 L176 191 L174 412 L165 428 L165 215 L149 190Z':'M154 169 L179 190 L168 422 L154 453 L158 261 L168 196Z',PALE,.92);
      draw(side?'M195 175 L203 190 L204 428 L194 415 L193 214 L181 192Z':'M223 172 L203 193 L217 425 L233 454 L223 261 L216 198Z',PALE,.92);
      if(!far)basket(basketX,basketY,side);
      if(side&&far){draw('M146 225 Q125 276 129 331 L137 372 L135 416 L118 419 L111 369 L109 310 L120 259Z',cloth,1.18);hand('M119 416 L135 415 L138 427 L132 435 L122 433 L117 425Z','M122 423 L135 424 M124 429 L132 430');}
      else{draw(side?'M203 210 Q222 249 227 295 L230 359 L256 401 L249 422 L231 418 Q207 387 204 363 L194 296 L190 252Z':'M248 206 Q266 239 270 288 L266 350 L286 411 L268 430 L251 415 L242 365 L241 306 L233 254Z',cloth,1.20);hand(side?'M250 408 L260 410 L269 416 L270 427 L263 434 L255 430 L258 421 L250 420Z':'M273 415 L284 418 L296 424 L298 435 L289 442 L280 438 L284 429 L274 428Z',side?'M261 417 L268 420 M260 425 L268 426':'M287 426 L295 429 M286 434 L295 435');}
      if(!side){draw('M112 220 Q91 256 90 294 L112 321 L145 321 L152 340 L139 351 L108 344 L80 319 Q68 298 78 271Z',cloth,1.06);hand('M143 319 L155 321 L164 332 L159 345 L147 345 L149 335 L141 329Z','M155 329 L161 333 M151 337 L158 339');}
      folds(side?['M142 205 Q126 237 124 268','M216 254 L215 292','M211 320 L221 368','M153 396 L143 507','M204 460 L217 670']:['M114 218 Q96 258 96 281','M85 307 Q113 330 135 329','M251 245 L258 292','M250 346 L262 403','M146 373 L135 491','M226 423 L245 675']);
    }
    head(side?185:188,61,'woman');
  }else{
    shoe(side?151:139,739,56,true);shoe(side?210:213,739);
    if(back)scroll(270,347,true);
    draw(side?'M153 171 Q181 160 209 177 Q233 195 243 241 L249 335 L227 414 Q230 549 253 738 Q194 753 125 739 Q145 570 132 415 L115 353 Q90 320 109 272 L129 202Z':'M156 169 Q185 157 216 169 Q250 180 272 221 L290 324 Q276 361 252 367 L246 413 Q253 572 273 738 Q195 753 111 739 Q132 568 118 423 L108 355 Q81 357 77 328 L98 240 Q115 193 156 169Z',cloth,1.36);
    wash(side?'M143 220 Q130 285 152 355 L163 424 L150 742 L129 737 Q143 563 135 417 L115 352Z':'M132 211 Q122 286 143 353 L156 423 L136 743 L115 737 Q131 578 120 425 L109 356Z');
    if(back){draw('M149 169 Q187 196 224 169 L244 198 Q215 227 186 226 Q155 221 130 198Z',PALE,1.12);line('M140 193 Q182 223 234 190',.72,.61);draw('M155 203 L162 218 L143 324 L133 333 L139 274Z',PALE,.85);draw('M218 205 L209 224 L225 307 L235 319 L232 274Z',PALE,.87);folds(['M137 242 Q156 274 161 318','M229 242 L226 311','M146 384 Q161 449 149 507','M191 378 Q183 456 191 510','M226 395 L231 521','M145 543 L130 730','M181 553 L176 745','M226 561 L253 734']);}
    else{
      draw(side?'M165 169 L190 190 L211 175 L227 196 L190 240 L146 204Z':'M155 168 L188 197 L219 169 L241 193 L189 239 L134 194Z',PALE,1.08);draw(side?'M179 216 L192 235 L169 402 L154 423 L164 324Z':'M176 216 L191 237 L159 405 L143 425 L157 318Z',PALE,.94);
      draw(side?'M208 210 Q235 237 235 278 L227 321 L254 326 L254 355 L220 356 Q199 342 203 311 L199 261Z':'M248 203 Q271 243 271 286 L248 327 L223 321 L226 299 L234 271 L226 241Z',cloth,1.19);
      scroll(side?248:196,side?331:336,side);
      hand(side?'M233 315 L245 315 L254 324 L250 337 L242 341 L235 334 L241 328 L232 325Z':'M231 319 L245 325 L250 336 L244 346 L233 343 L238 334 L227 329Z',side?'M243 323 L251 326 M241 331 L248 333':'M239 327 L247 332 M238 337 L246 339');
      draw(side?'M137 220 Q116 251 120 290 Q134 325 194 350 L224 349 L227 326 L198 326 L155 286 L160 249Z':'M114 211 Q88 246 89 291 Q103 325 147 350 L169 344 L174 321 L149 314 L132 283 L141 241Z',cloth,1.22);
      hand(side?'M221 325 L234 324 L239 331 L236 343 L226 349 L222 341 L228 336 L220 334Z':'M160 320 L172 317 L182 323 L183 337 L175 345 L166 342 L170 332 L160 331Z',side?'M229 330 L236 332 M227 338 L235 340':'M174 324 L181 328 M172 333 L181 336');
      folds(side?['M137 247 L132 284','M139 306 Q171 337 199 341','M219 246 L222 282','M166 402 Q168 462 158 515','M204 400 L208 513','M151 559 L139 731','M182 551 L181 744','M220 549 L239 733']:['M112 239 Q101 269 104 289','M106 308 Q130 334 153 337','M250 242 L257 283','M242 303 L231 319','M142 387 Q157 451 147 499','M186 389 Q178 463 188 517','M221 406 L226 516','M145 547 L128 731','M180 555 L174 745','M225 544 L251 733']);
    }
    head(side?193:191,62,'scholar');
  }
  // Broken pale fibres and minute pigment variation belong to the existing
  // brush-drawn crowd; clipping keeps them inside the authored silhouettes.
  ctx.save();ctx.globalCompositeOperation='source-atop';const grain=random(kind*917+direction*73);
  for(let i=0;i<420;i++){const x=62+grain()*277,y=34+grain()*729;ctx.strokeStyle=i%3?'#4f49300b':'#fff2d01c';ctx.lineWidth=.43;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.4+grain()*.9,y+1+grain()*3);ctx.stroke();}ctx.restore();
  ctx.restore();
}

// A separate compressed pose for a ~1.05 m high, .86 m wide sprite. The large
// head and genuinely doubled-back knees are authored here, not obtained by
// squashing one of the standing figures. Both hands work one tied parcel.
function paintCrouchedWorker(ctx,direction,phase=0,rasterScale=1){
  direction=((direction%4)+4)%4;const side=direction===1||direction===3,back=direction===2,far=direction===3;
  const jacket='#b9aa86',shadow='#857f66',trousers='#9aa393',lining='#ddd0ac',skin='#c9a78a';
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';if(far){ctx.translate(384,0);ctx.scale(-1,1);}
  const light=ctx.createLinearGradient(80,198,305,731);light.addColorStop(0,'#fff1d338');light.addColorStop(.45,'#edddbd05');light.addColorStop(1,'#46606928');
  const paint=(d,fill=null,w=1.30,a=.78)=>{const p=new Path2D(d);ctx.save();if(fill){ctx.fillStyle=fill;ctx.fill(p);if([jacket,trousers,lining].includes(fill)){ctx.save();ctx.clip(p);ctx.fillStyle=light;ctx.fillRect(0,0,384,768);ctx.restore();}}if(w){ctx.strokeStyle=INK;ctx.lineWidth=w;ctx.globalAlpha*=a;ctx.stroke(p);}ctx.restore();return p;};
  const line=(d,w=.83,a=.64)=>paint(d,null,w,a);
  const wash=(d,c=shadow,a=.16)=>{ctx.save();ctx.globalAlpha=a;ctx.filter=`blur(${.7*rasterScale}px)`;paint(d,c,0);ctx.restore();};
  const fold=(list)=>list.forEach((d,i)=>{line(d,2.6,.075);line(d,[.87,.65,.77,.55][i%4],.64);});
  const hand=(d,marks)=>{paint(d,skin,1.0,.85);if(marks)line(marks,.65,.78);};
  function shoe(x,y,flip=false){ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);paint('M0 0 L30-3 L42 8 Q59 20 72 17 Q84 22 76 30 Q45 37 2 30 L-5 21Z',HAIR,1.28);line('M0 28 Q37 35 75 27 M8 8 Q28 13 35 24 M40 18 Q57 27 72 23',.80,.64);ctx.restore();}
  // Far foot, folded thigh and shin. Shoes share the ground at about y=764.
  if(side){
    shoe(154,730,true);shoe(236,729);
    paint('M181 383 Q232 388 278 431 Q299 457 287 489 L252 531 L230 624 L241 727 Q218 742 194 729 L179 629 Q179 572 208 501 L157 457Z',trousers,1.42);
    wash('M223 440 Q271 434 272 468 L230 522 Q207 580 210 621 L225 728 L201 730 L187 629 Q187 564 214 502Z',shadow,.18);
    fold(['M214 415 Q257 427 276 455','M278 463 Q264 487 238 500','M233 516 L213 580','M202 642 L218 708','M191 624 L207 618']);
    paint('M142 385 Q121 402 98 450 Q75 497 94 526 L125 547 Q152 564 190 573 L157 649 L141 728 L113 733 Q112 680 123 625 L137 598 Q95 595 69 567 Q41 532 54 491 Q79 417 108 394Z',trousers,1.47);
    wash('M79 487 Q60 536 94 558 L155 586 L132 626 L118 728 L130 731 L152 640 L181 578 Q128 557 105 537Z',shadow,.19);
    fold(['M93 450 Q74 493 86 516','M92 529 Q121 550 155 554','M155 569 L174 577','M151 603 Q139 645 137 679','M116 649 L128 644','M116 710 L139 713']);
  }else{
    shoe(118,730,true);shoe(248,729);
    paint('M205 372 Q259 381 303 437 Q329 470 312 512 L292 588 L278 726 Q253 739 231 725 L241 601 L254 521 Q218 502 187 460Z',trousers,1.42);
    paint('M168 374 Q117 378 80 428 Q46 474 69 518 L88 590 L100 727 Q123 739 146 725 L137 599 L126 526 Q164 514 193 464Z',trousers,1.42);
    wash('M92 442 Q61 483 88 515 L105 584 L115 727 L101 726 L89 593 L73 520 Q49 482 73 448Z',shadow,.17);
    wash('M287 442 Q316 477 294 509 L270 584 L258 729 L277 726 L292 592 L310 516 Q332 477 305 446Z',shadow,.17);
    fold(['M98 434 Q80 464 84 487','M76 503 Q97 516 122 513','M100 550 L115 586','M102 617 L121 612','M110 662 L129 658','M109 711 L141 712','M279 431 Q303 466 299 486','M259 508 Q283 518 307 501','M280 555 L264 587','M254 612 L281 620','M249 668 L274 672','M237 715 L270 718']);
  }
  // Broad rounded back, short jacket, and a waist which ends above the knees.
  paint(side?'M149 209 Q179 199 218 223 Q240 244 249 289 L255 354 L229 429 Q204 459 130 462 L96 427 Q75 401 91 364 L101 293 Q103 247 125 226Z':'M146 215 Q183 195 220 215 Q258 230 282 283 L283 358 L257 418 Q224 457 185 460 Q139 456 104 422 L80 363 Q77 326 99 281 Q113 236 146 215Z',jacket,1.50);
  wash(side?'M123 239 Q105 291 123 354 L132 405 L167 453 L127 455 L101 429 Q87 407 98 367 L105 293Z':'M123 243 Q110 305 125 358 L145 412 L170 452 L135 438 L107 417 L86 362 Q81 330 102 284Z',shadow,.18);
  if(back){
    paint('M149 213 Q184 237 220 213 L232 235 Q187 260 137 237Z',lining,1.06);
    fold(['M125 260 Q177 283 236 252','M147 286 Q162 326 153 359','M213 281 Q222 326 213 355','M121 384 Q160 400 185 393','M199 394 Q225 396 252 382']);
  }else{
    paint(side?'M174 210 L205 227 L223 221 L233 242 L195 281 L155 240Z':'M147 214 L185 245 L220 216 L239 242 L189 291 L127 239Z',lining,1.10);
    paint(side?'M185 254 L197 273 L165 392 L141 430 L133 416 L159 368Z':'M179 262 L191 283 L145 405 L125 421 L128 402 L162 311Z',jacket,1.01);
    fold(side?['M136 257 Q118 295 124 319','M153 284 L138 339','M226 276 L228 313','M178 307 L163 362','M189 361 L180 411']:['M117 279 L106 322','M143 274 L129 325','M211 281 L224 325','M252 281 L264 328','M158 348 L141 391','M199 338 L187 393','M224 356 L234 393']);
  }
  paint(side?'M127 412 Q179 435 229 410 L224 427 Q179 450 126 430Z':'M110 408 Q184 438 256 408 L254 426 Q186 454 108 426Z',shadow,1.0);
  if(!back)paint(side?'M161 432 L174 435 L164 478 L154 485 L154 476 L162 445Z':'M183 437 L196 436 L202 475 L193 488 L190 451 L180 445Z',shadow,.93);
  // Ground-supported small cloth parcel and a laid coil of spare hemp. All
  // tying strands belong to the same object which the two hands meet below.
  const px=side?267:191,py=705;
  ctx.save();ctx.translate(px,py);if(side)ctx.scale(.82,1);
  paint('M-64-25 Q-58-43-36-41 L40-38 Q63-35 65-12 L57 48 Q4 67-52 49 Q-67 20-64-25Z',lining,1.25);
  wash('M-63-19 Q-50 9-50 41 L-25 52 L-51 47 Q-66 16-63-19Z',shadow,.17);
  paint('M-60-26 L-17-6 L2-26 L40-35 L27 2 L-10 15 L-56-2Z',lining,1.03);
  fold(['M-51 10 L-31 19','M-44 35 L-22 46','M33 18 L47 5','M-8 18 L-1 45','M30 34 L20 49']);
  line('M-18-36 Q-15 0-8 55',3.2,.78);line('M16-35 Q10-1 13 54',3.1,.76);line('M-60-3 Q0 15 61-1',3.2,.76);
  line('M-17-35 Q-14 1-7 53 M17-35 Q11 0 14 52 M-58-4 Q0 13 60-2',.72,.63);
  if(!back){line('M-14-21 Q-3-39 8-26 Q18-15 4-10 Q-11-4-14-21 M-8-23 L11-13 M-4-27 L-5-11',2.45,.78);}
  else line('M-18-29 Q1-16 20-27 M-15-21 L15-16',2.45,.77);
  ctx.restore();
  // Far arm drops toward the package; its forearm is behind the nearer hand.
  paint(side?'M218 252 Q245 269 251 313 L264 429 L275 552 L289 642 L274 663 L254 651 L246 559 L228 453 L203 333Z':'M249 259 Q273 281 278 332 L277 431 L259 536 L232 637 L213 653 L196 640 L220 529 L235 423 L225 316Z',jacket,1.25);
  paint(side?'M272 634 L289 640 L294 660 L274 673 L262 662Z':'M216 632 L234 637 L232 659 L210 666 L199 651Z',lining,1.00);
  hand(side?'M275 659 Q285 653 295 663 L306 680 L301 690 L291 688 L285 676 L277 685 L267 681 L268 672Z':'M211 654 Q221 650 231 658 L245 675 L243 686 L234 687 L227 676 L217 680 L206 674Z',side?'M287 666 L300 680 M283 671 L296 683 M273 675 L279 679':'M223 659 L239 678 M219 667 L234 683 M211 669 L217 674');
  // Near elbow sits forward of the bent knee, then reaches down. The sleeves
  // are rolled rather than wide dangling robes, revealing working forearms.
  paint(side?'M130 246 Q104 274 103 322 L116 429 Q135 474 182 513 L218 586 L238 603 L251 584 L235 535 L196 476 L158 416 L159 338 L158 278Z':'M113 259 Q87 287 86 333 L99 430 Q122 486 155 521 L169 587 L190 603 L208 584 L199 532 L169 469 L143 414 L144 338 L144 286Z',jacket,1.30);
  paint(side?'M213 573 L234 557 L253 581 L241 608 L225 607Z':'M163 575 L188 561 L209 583 L194 609 L177 604Z',lining,1.00);
  hand(side?'M238 599 L248 591 L260 619 L276 642 L277 657 L289 663 L291 674 L280 680 L268 671 L256 659 L247 637Z':'M184 598 L194 589 L203 617 L204 641 L198 657 L211 664 L213 675 L203 681 L191 674 L183 660 L186 636Z',side?'M263 638 L269 655 M272 662 L283 669 M268 667 L277 674':'M194 621 L196 640 M195 660 L205 669 M193 667 L201 675');
  fold(side?['M129 275 Q115 310 119 331','M122 365 L137 418','M134 444 Q159 479 184 491','M192 514 L222 568','M240 338 L248 431','M253 471 L267 563']:['M111 286 Q97 319 101 340','M103 373 L118 427','M126 460 L157 505','M171 533 L183 575','M260 310 L264 365','M251 453 L231 537']);
  // Short loose hemp ends pass under the fingers and into the same parcel knot.
  line(side?'M286 679 Q278 686 268 680 L257 674 M277 663 Q268 670 265 678':'M205 677 Q196 687 187 680 L181 675 M234 683 Q212 690 197 680',2.3,.79);
  // A bowed, large head with tied hair and a plain cloth brow-band.
  const hx=side?218:191,hy=82;ctx.save();ctx.translate(hx,hy+120);ctx.rotate(side?.09:back?0:.035);ctx.translate(0,-120);
  hand(side?'M-31 113 L-35 166 Q-7 181 17 165 L21 118Z':'M-29 118 L-29 167 Q0 185 31 167 L29 116Z');
  if(back){
    paint('M-49 44 Q-52 7-21-6 Q13-23 44 3 Q58 19 49 63 L39 112 Q18 140-9 136 Q-34 129-47 102Z',HAIR,1.30);
    paint('M-18-4 Q-31-21-16-31 Q3-42 18-29 Q31-15 15-3Z',HAIR,1.08);
    paint('M-48 43 Q0 28 49 42 L48 56 Q0 44-47 59Z',trousers,1.00);
    paint('M-39 55 L-54 111 L-47 158 L-38 163 L-41 116 L-28 62Z',trousers,.92);
    fold(['M-36 71 Q-11 97 26 77','M-28 101 Q0 118 26 99','M-15 3 Q1 11 19 2','M-20 13 L-24 32']);
  }else if(side){
    paint('M-42 42 Q-36 5-5 4 Q27 3 41 30 L43 55 L61 78 L47 85 L45 102 Q35 127 10 139 Q-17 133-33 107 L-44 78Z',skin,1.27);
    wash('M-34 34 Q-20 11-5 15 L-13 61 L-32 80Z','#efdbb7',.20);wash('M24 85 Q41 78 46 91 L36 106 L23 101Z','#a9765e',.12);
    paint('M-43 63 Q-59 35-39 7 Q-20-18 12-5 Q36 2 42 27 L33 40 Q15 22-11 34 L-29 66 L-29 91 L-41 87Z',HAIR,1.21);
    paint('M-35 9 Q-53-1-41-21 Q-27-37-11-24 Q1-10-11 7Z',HAIR,1.07);
    paint('M-46 43 Q-15 16 35 38 L42 50 Q3 31-39 59Z',trousers,1.0);
    paint('M-43 49 L-61 93 L-58 143 L-49 151 L-49 99 L-33 60Z',trousers,.9);
    line('M28 65 Q37 63 44 70 M30 73 L40 76 M42 99 L48 98 M-29 72 Q-42 63-39 82 L-27 94 M-31 74 L-33 83 M19 119 Q28 124 37 113',.77,.81);
  }else{
    paint('M-48 42 Q-44 7-13-1 Q22-7 44 24 Q55 46 46 90 Q35 126 5 140 Q-25 133-41 106 L-48 70Z',skin,1.30);
    hand('M-47 59 Q-60 56-57 79 L-45 91Z M47 60 Q61 57 55 82 L45 93Z');
    wash('M-37 36 Q-25 12-9 14 L-17 80 L-34 88Z','#efdcba',.17);wash('M-35 94 Q-15 83-8 97 L-17 108 L-31 107Z M17 98 Q31 89 42 98 L35 109 L21 111Z','#b38065',.12);
    paint('M-49 59 Q-66 24-40 2 Q-21-17 7-10 Q36-10 49 21 L48 56 L35 59 Q25 21-2 31 Q-24 29-35 62Z',HAIR,1.26);
    paint('M-22-6 Q-34-23-17-32 Q6-43 24-27 Q35-14 17-3Z',HAIR,1.06);
    paint('M-48 48 Q0 26 48 49 L47 64 Q1 43-47 64Z',trousers,1.03);
    paint('M-47 54 L-64 98 L-61 141 L-52 151 L-53 104 L-34 64Z',trousers,.93);
    line('M-33 75 Q-21 71-10 77 M13 78 Q27 73 38 79 M-29 85 L-16 88 M17 87 L30 88 M0 83 L-6 106 L3 110 M-11 120 Q3 126 17 120 M-49 70 L-49 82 M50 71 L49 83',.83,.82);
  }
  ctx.restore();
  // Sparse marks retain the same restrained painted surface as townsfolk8–11.
  ctx.save();ctx.globalCompositeOperation='source-atop';const grain=random(12831+direction*91);
  for(let i=0;i<430;i++){const x=42+grain()*290,y=37+grain()*725;ctx.strokeStyle=i%3?'#5049330c':'#fff2cd19';ctx.lineWidth=.48;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+grain(),y+1+grain()*3);ctx.stroke();}ctx.restore();ctx.restore();
}
