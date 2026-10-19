import * as THREE from './assets/three.module.js';
import {canvasTexture, rng} from './ink.js?v=20261019r6';

// Living details for the bridge market. The brush drawings are reconstructions
// informed by the Beijing handscroll, not extracted or traced animal portraits.
// Four drawn directions, two poses, one small palette; no runtime asset requests.
const TAU=Math.PI*2;
const INK='#514b3d';
const textureCache=new Map();
const planeGeometry=new THREE.PlaneGeometry(1,1);
const shadowGeometry=new THREE.PlaneGeometry(2,2);
let shadowMaterial;
function softShadow(){
  if(shadowMaterial)return shadowMaterial;
  const map=canvasTexture(128,128,(ctx,W,H)=>{
    const glow=ctx.createRadialGradient(W*.48,H*.48,1,W*.5,H*.5,W*.49);
    glow.addColorStop(0,'rgba(72,66,48,.34)');glow.addColorStop(.28,'rgba(78,72,52,.24)');
    glow.addColorStop(.65,'rgba(78,72,52,.095)');glow.addColorStop(1,'rgba(78,72,52,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    const r=rng(60412);ctx.globalCompositeOperation='source-atop';
    for(let i=0;i<80;i++){
      ctx.fillStyle=`rgba(120,104,74,${.08+r()*.08})`;
      ctx.fillRect(r()*W,r()*H,.6+r()*1.5,.4+r());
    }
  });
  shadowMaterial=new THREE.MeshBasicMaterial({map,transparent:true,opacity:.62,depthWrite:false});
  return shadowMaterial;
}
const SPEC={
  donkey:{width:2.48,height:1.86,baseline:590/600,shadow:[.67,.22],speed:.25},
  dog:{width:1.19,height:.8925,baseline:590/600,shadow:[.31,.10],speed:.32},
  chicken:{width:.50,height:.50,baseline:490/512,shadow:[.105,.057],speed:.12}
};

function painter(ctx){
  ctx.lineCap='round';ctx.lineJoin='round';
  const draw=(d,fill=null,width=1.25,stroke=INK,opacity=.92)=>{
    const p=new Path2D(d);ctx.save();
    if(fill){ctx.fillStyle=fill;ctx.fill(p);}
    if(width){ctx.globalAlpha=opacity;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}
    ctx.restore();return p;
  };
  const line=(d,width=.83,opacity=.75)=>draw(d,null,width,INK,opacity);
  const wash=(d,color='#827760',opacity=.16)=>{ctx.save();ctx.globalAlpha=opacity;draw(d,color,0);ctx.restore();};
  const ellipse=(x,y,rx,ry,fill,width=1,rotation=0)=>{
    ctx.save();ctx.beginPath();ctx.ellipse(x,y,rx,ry,rotation,0,TAU);
    if(fill){ctx.fillStyle=fill;ctx.fill();}if(width){ctx.strokeStyle=INK;ctx.lineWidth=width;ctx.globalAlpha=.87;ctx.stroke();}ctx.restore();
  };
  return {draw,line,wash,ellipse};
}

// A restrained amber iris, small reflected sky, and an uneven upper eyelid.
// These are tiny brush marks at normal distance, never oversized cartoon eyes.
function eye(p,x,y,rx=2.8,ry=2.7){
  p.ellipse(x,y,rx+.7,ry+.45,'#b9ab8e',.55,-.06);
  p.ellipse(x+.12,y+.16,rx*.88,ry*.91,'#625842',.36);
  p.ellipse(x+.35,y+.22,rx*.48,ry*.77,'#413f34',0);
  p.ellipse(x-rx*.30,y-ry*.38,.72,.66,'#e3d8b9',0);
  p.line(`M${x-rx-1.4} ${y-.2} Q${x-.5} ${y-ry-1.65} ${x+rx+1} ${y-.7}`,.73,.77);
}

function hoof(p,x,y,w=28,h=15){
  const l=x-w*.5,r=x+w*.5;
  p.draw(`M${x-w*.31} ${y-h} Q${x} ${y-h-2} ${x+w*.28} ${y-h+1} L${r} ${y-3} Q${x+w*.29} ${y+1} ${l} ${y-1} L${l+1} ${y-5}Z`,'#6c6555',.91);
  p.wash(`M${x-w*.29} ${y-h+1} Q${x} ${y-h-1} ${x+w*.27} ${y-h+2} L${x+w*.34} ${y-7} Q${x} ${y-10} ${x-w*.35} ${y-6}Z`,'#c5b899',.17);
  p.draw(`M${x-w*.30} ${y-h+4} Q${x} ${y-h+2} ${x+w*.32} ${y-h+5}`,null,.63,'#b7aa8e',.63);
  p.line(`M${l+1} ${y-3} Q${x-2} ${y} ${r-1} ${y-4}`,.79,.84);
  for(let i=0;i<5;i++){
    const xx=l+5+i*(w-10)/4;
    p.line(`M${xx} ${y-h+6+(i%2)} l${.3+(i%2)*.4} ${3+(i%3)}`,.38,.35);
  }
}

function stitches(p,a,b,gap=5.4,opacity=.50){
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  for(let d=2;d<len-1;d+=gap){
    const t=d/len,x=a[0]+dx*t,y=a[1]+dy*t;
    p.draw(`M${x-nx*.7} ${y-ny*.7} l${nx*1.4+dx/len} ${ny*1.4+dy/len}`,null,.46,'#ded0ae',opacity);
  }
}

function rope(p,a,c,b,width=1.5){
  p.draw(`M${a[0]} ${a[1]} Q${c[0]} ${c[1]} ${b[0]} ${b[1]}`,null,width,'#75694f',.89);
  const steps=Math.ceil((Math.hypot(c[0]-a[0],c[1]-a[1])+Math.hypot(b[0]-c[0],b[1]-c[1]))/5);
  for(let i=1;i<steps;i++){
    const t=i/steps,u=1-t,x=u*u*a[0]+2*u*t*c[0]+t*t*b[0],y=u*u*a[1]+2*u*t*c[1]+t*t*b[1];
    const dx=2*u*(c[0]-a[0])+2*t*(b[0]-c[0]),dy=2*u*(c[1]-a[1])+2*t*(b[1]-c[1]),len=Math.hypot(dx,dy)||1;
    p.draw(`M${x+dy/len*width*.43} ${y-dx/len*width*.43} l${(-dy+dx*.8)/len*width*.86} ${(dx+dy*.8)/len*width*.86}`,null,.39,'#d2c09b',.71);
  }
}

function knot(p,x,y,scale=1){
  const S=n=>n*scale;
  p.draw(`M${x} ${y} q${S(-9)} ${S(-9)} ${S(-11)} ${S(-3)} q${S(-1)} ${S(7)} ${S(10)} ${S(5)} q${S(10)} ${S(-10)} ${S(12)} ${S(-4)} q${S(1)} ${S(6)} ${S(-10)} ${S(5)}`,null,1.5*scale,'#766b51',.86);
  p.line(`M${x-S(1)} ${y-S(2)} l${S(3)} ${S(6)} M${x} ${y+S(3)} q${S(-2)} ${S(8)} ${S(-6)} ${S(11)} M${x+S(2)} ${y+S(2)} l${S(5)} ${S(8)}`,.65*scale,.82);
  p.draw(`M${x-S(6)} ${y-S(3)} l${S(4)} ${S(2)} M${x+S(4)} ${y-S(2)} l${S(3)} ${S(-1)}`,null,.5*scale,'#d2c09b',.7);
}

function birdLeg(p,hip,knee,ankle,toes){
  const leg=`M${hip[0]} ${hip[1]} Q${knee[0]} ${knee[1]-6} ${knee[0]} ${knee[1]} L${ankle[0]} ${ankle[1]}`;
  p.draw(leg,null,2.8,'#645a42',.70);p.draw(leg,null,1.56,'#bba274',.90);
  const dx=ankle[0]-knee[0],dy=ankle[1]-knee[1],len=Math.hypot(dx,dy)||1;
  for(let i=2;i<8;i++){
    const t=i/8,x=knee[0]+dx*t,y=knee[1]+dy*t;
    p.line(`M${x-dy/len*1.1} ${y+dx/len*1.1} l${dy/len*2.2} ${-dx/len*2.2}`,.43,.48);
  }
  for(const toe of toes){
    const cx=(ankle[0]+toe[0])*.5,cy=(ankle[1]+toe[1])*.5-1.5;
    const d=`M${ankle[0]} ${ankle[1]} Q${cx} ${cy} ${toe[0]} ${toe[1]}`;
    p.draw(d,null,1.86,'#645a42',.79);p.draw(d,null,.84,'#c7ab7b',.86);
    const sign=Math.sign(toe[0]-ankle[0])||1;
    p.line(`M${toe[0]-sign*3.0} ${toe[1]-1.4} Q${toe[0]-sign*.8} ${toe[1]-.9} ${toe[0]+sign*.45} ${toe[1]+.1}`,.82,.78);
  }
  p.line(`M${ankle[0]} ${ankle[1]} q-3 -4 -7 -3`,1.10,.67);
}

function paw(p,x,y,w,h,coat,front=false){
  const l=x-w*.5,r=x+w*.5;
  const d=front?
    `M${x-w*.27} ${y-h} Q${x} ${y-h-4} ${x+w*.25} ${y-h} Q${r-1} ${y-10} ${r} ${y-4} Q${r-2} ${y+1} ${x+w*.23} ${y-1} Q${x} ${y+2} ${x-w*.22} ${y-1} Q${l-1} ${y+1} ${l} ${y-5}Z`:
    `M${x-w*.29} ${y-h} Q${x-2} ${y-h-4} ${x+w*.11} ${y-h+1} Q${x+w*.27} ${y-9} ${r-2} ${y-7} Q${r+2} ${y-4} ${r-3} ${y-1} Q${x+w*.22} ${y+1} ${x+w*.09} ${y-1} Q${x-w*.15} ${y+1} ${l} ${y-1} L${l-1} ${y-5}Z`;
  p.draw(d,coat,.89);
  p.wash(`M${l+2} ${y-6} Q${x} ${y-3} ${r-1} ${y-5} L${r-4} ${y-1} Q${x} ${y+1} ${l+2} ${y-1}Z`,'#8c7c60',.16);
  for(let i=0;i<3;i++){
    const xx=x-w*.27+i*w*.22;
    p.line(`M${xx} ${y-h*.47} q${i-1} ${h*.17} ${i-1} ${h*.35}`,.53,.58);
    p.draw(`M${xx+i-1} ${y-2.4} l${i===2?1.5:-.9} 1.4`,null,.56,'#88765b',.70);
  }
  p.draw(`M${x-w*.21} ${y-h+3} q4 -2 7 0`,null,.46,'#e3d1ac',.70);
}

function coatFinish(ctx,kind,view,phase,variant){
  const side=view%2,back=view===2,rand=rng(8761+(kind==='dog'?103:kind==='chicken'?211:0)+variant*33);
  ctx.save();ctx.globalCompositeOperation='source-atop';
  const glaze=(x,y,rx,ry,color,alpha)=>{
    ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
    const g=ctx.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.54,`rgba(${color},${alpha*.5})`);g.addColorStop(1,`rgba(${color},0)`);
    ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
  };
  const hairs=(x,y,rx,ry,n,angle,light=false)=>{
    for(let i=0;i<n;i++){
      const xx=x+(rand()-.5)*rx*2,yy=y+(rand()-.5)*ry*2;
      const theta=angle+(rand()-.5)*.85,len=2+rand()*5.5;
      ctx.strokeStyle=light?`rgba(226,211,173,${.18+rand()*.13})`:`rgba(88,77,57,${.11+rand()*.12})`;
      ctx.lineWidth=.35+rand()*.34;ctx.beginPath();ctx.moveTo(xx,yy);
      ctx.quadraticCurveTo(xx+Math.cos(theta+.16)*len*.6,yy+Math.sin(theta+.16)*len*.6,xx+Math.cos(theta)*len,yy+Math.sin(theta)*len);ctx.stroke();
    }
  };
  if(kind==='donkey'){
    if(side){
      glaze(237,265,90,77,'226,205,164',.23);glaze(251,361,91,40,'94,111,97',.11);
      glaze(514,258,62,78,'210,187,148',.18);glaze(604,254,48,39,'236,218,177',.21);
      glaze(573,193,28,27,'212,190,161',.16);glaze(362,321,89,68,'202,166,111',.10);
      hairs(219,300,36,43,65,1.02);hairs(506,277,30,66,56,1.97,true);
      hairs(550,124,9,30,16,1.05,true);hairs(584,116,8,32,19,1.93,true);
      hairs(611,280,19,12,18,.17,true);
    }else{
      glaze(393,291,78,75,'226,205,164',.18);glaze(398,391,52,34,'94,111,97',.12);
      glaze(398,268,34,30,'236,218,177',back?.04:.23);
      hairs(348,312,18,44,38,1.20);hairs(432,315,16,45,37,1.97,true);
      if(!back){hairs(365,134,9,26,19,1.13,true);hairs(428,132,9,26,19,1.98,true);}
    }
  }else if(kind==='dog'){
    if(side){
      glaze(335,288,168,64,'227,201,148',variant?.23:.17);
      glaze(332,370,155,32,'120,123,96',.13);glaze(489,330,36,62,'245,226,187',.22);
      glaze(522,239,44,35,'217,168,112',.11);glaze(602,294,32,19,'238,222,183',.22);
      hairs(243,315,54,31,46,.26,true);hairs(407,310,53,32,45,-.13,true);
      hairs(493,325,19,38,58,1.13,true);hairs(546,198,9,15,16,1.13,true);
      hairs(521,197,7,18,12,1.05,true);hairs(550,295,26,18,28,.92);
    }else{
      glaze(400,325,65,93,'227,201,148',.18);glaze(397,393,49,39,'107,119,97',.10);
      glaze(400,371,30,58,'245,227,192',back?.05:.27);
      glaze(398,239,48,27,'216,170,119',back?.07:.16);
      hairs(351,332,14,42,32,1.25);hairs(445,329,14,42,34,1.92,true);
      if(!back){hairs(389,369,18,30,50,1.63,true);hairs(361,202,7,17,16,1.18,true);hairs(443,202,7,17,16,1.98,true);}
    }
  }else{
    const rooster=variant===2,lower=phase?52:0;
    glaze(side?250:256,295+lower,side?78:55,70,'239,219,175',.20);
    glaze(side?251:257,378+lower,side?70:43,31,'126,112,78',.10);
    if(rooster){
      glaze(side?111:254,(side?262:208)+lower,side?67:49,67,'77,119,107',.24);
      glaze(side?326:258,phase?(side?320:260):230,25,57,'221,170,104',.20);
    }
    hairs(side?230:255,320+lower,side?52:45,39,62,.41,true);
    if(!back)hairs(side?(phase?339:327):252,phase?(side?373:375):(rooster?260:277),12,24,25,1.24,true);
  }
  ctx.restore();
}

// A soft basket outline, separate upper rim, and interlaced reeds. The spacing
// varies slightly so the wicker reads as hand work rather than a printed grid.
function pannier(p,x,y,w,h,slant=0){
  const {draw,line,wash}=p;
  draw(`M${x} ${y} Q${x+w*.47} ${y-13} ${x+w} ${y+slant} L${x+w-10} ${y+h} Q${x+w*.51} ${y+h+13} ${x+14} ${y+h-1}Z`,'#bda87e',1.38);
  draw(`M${x} ${y} Q${x+w*.5} ${y-12} ${x+w} ${y+slant} Q${x+w*.52} ${y+18} ${x} ${y}Z`,'#a89571',.98);
  line(`M${x+1} ${y+5} Q${x+w*.45} ${y+21} ${x+w-1} ${y+slant+5}`,1.48,.87);
  for(let j=1;j<=11;j++){
    const t=j/12,yy=y+12+t*(h-15),l=x+t*12,r=x+w-t*10;
    line(`M${l} ${yy} Q${x+w*.46} ${yy+11} ${r} ${yy+slant*(1-t)}`,.69,.66);
    if(j%3===1)line(`M${l+1} ${yy+2} Q${x+w*.48} ${yy+13} ${r-1} ${yy+2+slant*(1-t)}`,.44,.48);
  }
  for(let j=0;j<14;j++){
    const t=(j+.5)/14,xx=x+t*w;
    line(`M${xx} ${y+8+Math.sin(t*Math.PI)*7} Q${xx+(t-.5)*-5} ${y+h*.57} ${x+14+t*(w-24)} ${y+h+Math.sin(t*Math.PI)*10}`,.67,.66);
  }
  // Alternating short reeds pass over the uprights. Pale segments and small
  // dark ties keep the basket from reading as a perfectly regular wire grid.
  for(let row=1;row<10;row++)for(let col=0;col<12;col++){
    if((row+col)%2)continue;
    const t=row/11,u=(col+.5)/12,xx=x+12*t+u*(w-22*t),yy=y+13+t*(h-17)+Math.sin(u*Math.PI)*9;
    draw(`M${xx-2.3} ${yy-1} q2.4 1.4 4.5 .1`,null,.95,'#dcc79e',.50);
    line(`M${xx+2.8} ${yy-.6} l.8 1.9`,.42,.43);
  }
  for(let i=0;i<18;i++){
    const u=(i+.5)/18,xx=x+u*w,yy=y+Math.sin(u*Math.PI)*9+slant*u;
    line(`M${xx-1.3} ${yy-1} l2.1 5`,.63,.61);
  }
  wash(`M${x+3} ${y+9} L${x+w*.17} ${y+13} L${x+w*.22} ${y+h+5} L${x+14} ${y+h-1}Z`,'#887955',.16);
  line(`M${x+10} ${y-2} Q${x+w*.48} ${y-28} ${x+w-8} ${y+slant-1}`,.78,.64);
  for(const xx of [x+w*.21,x+w*.76]){
    draw(`M${xx} ${y+5} L${xx+4} ${y+6} L${xx+6} ${y+h+5} L${xx+2} ${y+h+4}Z`,'#a79670',.74);
    line(`M${xx+1} ${y+25} L${xx+5} ${y+30} M${xx+2} ${y+h-22} L${xx+6} ${y+h-16}`,.64);
  }
  line(`M${x+w-12} ${y-1} l3 -5 M${x+w-9} ${y+2} l5 -3 M${x+12} ${y+1} l-2 -5`,.46,.60);
}

function donkeySide(ctx,phase){
  const p=painter(ctx),{draw,line,wash,ellipse}=p;
  const coat='#afa28a',light='#d5c7a9',dark='#898474',mane='#625d50';
  const stride=phase?19:0;
  // Far legs emerge from the hock and elbow; only the hooves carry dark fill.
  draw(`M245 337 Q246 391 ${259+stride} 432 L${239+stride} 499 L${236+stride} 575 L${249+stride} 579 L${257+stride} 503 Q${287+stride} 462 ${281+stride} 433 L281 356Z`,dark,1.12);
  hoof(p,243+stride,587,24,13);
  const farToe=phase?452:473;
  draw(`M467 321 Q490 352 493 388 Q493 412 481 443 Q${farToe+2} 487 ${farToe+4} 526 L${farToe+7} 575 L${farToe-9} 576 L${farToe-13} 526 Q${farToe-17} 483 462 438 Q455 403 453 373Z`,dark,1.09);
  hoof(p,farToe,587,25,13);
  line(`M258 387 L${270+stride} 437 L${248+stride} 500 M479 398 Q484 418 472 442 Q${farToe-2} 482 ${farToe-2} 523`,.71,.58);

  // The tail has a fine cord-like shaft and a modest, loose black brush.
  draw(`M183 263 Q143 267 144 318 Q140 380 ${120+phase*5} 426`,null,4.7,'#8e8870',.91);
  line(`M181 262 Q139 267 142 315 Q137 378 ${119+phase*5} 425`,1.19,.84);
  draw(`M${117+phase*5} 413 Q${104+phase*5} 426 ${105+phase*5} 446 L${98+phase*5} 458 Q${116+phase*5} 453 ${124+phase*5} 434 L${124+phase*5} 419Z`,mane,.89);
  line(`M${116+phase*5} 422 Q${113+phase*5} 441 ${104+phase*5} 451 M${121+phase*5} 424 L${115+phase*5} 444`,.51,.43);

  // Long barrel, lean haunch and a sloping shoulder. The breast is narrow.
  draw('M180 267 Q207 238 253 243 Q300 248 339 246 Q397 240 449 249 Q481 233 516 240 L537 291 Q532 345 506 370 Q477 389 435 391 Q355 410 291 390 Q258 380 236 366 Q210 363 191 342 Q173 307 180 267Z',coat,1.52);
  wash('M186 285 Q198 322 227 345 Q275 377 326 380 Q415 399 493 365 L505 371 Q456 399 417 402 Q290 417 235 367 Q198 363 186 336Z','#827f68',.20);
  wash('M272 269 Q348 258 422 267 Q415 287 377 293 L286 293Z',light,.23);
  line('M190 279 Q214 258 239 264 M195 315 Q204 331 217 337 M254 359 Q280 380 313 381 M422 382 Q460 378 478 366',.89,.56);

  // Near hind leg with a clear reverse hock; a slender foreleg below the chest.
  draw(`M204 319 Q230 329 239 367 Q244 393 232 418 L${207-stride} 469 L${219-stride} 512 L${209-stride} 577 L${191-stride} 578 L${198-stride} 514 L${183-stride} 465 Q196 416 194 381 L187 341Z`,coat,0);
  line(`M211 326 Q232 338 239 367 Q244 393 232 418 L${207-stride} 469 L${219-stride} 512 L${209-stride} 577 M${191-stride} 577 L${198-stride} 514 L${183-stride} 465 Q196 416 194 381`,1.34,.86);
  hoof(p,199-stride,590,30,16);
  line(`M211 345 Q223 382 217 408 L${193-stride} 466 L${207-stride} 512 M${198-stride} 536 L${196-stride} 569`,.92,.67);
  wash(`M194 371 Q206 414 ${191-stride} 467 L${203-stride} 513 L${195-stride} 575 L${190-stride} 576 L${197-stride} 514 L${184-stride} 466Z`,dark,.18);
  const foreToe=phase?525:497,foreKnee=phase?500:486,lift=phase?9:0;
  draw(`M476 340 Q497 347 501 374 Q504 412 ${foreKnee} 447 Q${foreToe-8} 493 ${foreToe+1} ${552-lift} L${foreToe+10} ${577-lift} L${foreToe-10} ${578-lift} L${foreToe-19} ${553-lift} Q${foreToe-25} 498 ${foreKnee-16} 451 Q462 420 462 391 L461 359Z`,coat,0);
  line(`M490 351 Q501 363 501 384 Q503 415 ${foreKnee} 447 Q${foreToe-8} 493 ${foreToe+1} ${552-lift} L${foreToe+10} ${577-lift} M${foreToe-10} ${578-lift} L${foreToe-19} ${553-lift} Q${foreToe-25} 498 ${foreKnee-16} 451 Q462 420 462 391`,1.24,.84);
  draw(`M${foreToe-19} ${550-lift} Q${foreToe-9} ${546-lift} ${foreToe+1} ${551-lift} L${foreToe+10} ${577-lift} L${foreToe-10} ${578-lift}Z`,light,0);
  line(`M479 382 Q488 418 ${foreKnee-7} 448 Q${foreToe-17} 493 ${foreToe-9} ${550-lift} M${foreKnee-14} 448 Q${foreKnee-7} 445 ${foreKnee} 448`,.79,.56);
  hoof(p,foreToe,590-lift,31,16);
  line(`M${foreToe-11} ${557-lift} l2 7 M${foreToe-6} ${560-lift} l1 9`,.49,.41);

  // Upright ears and the long, unromantic muzzle of a working donkey.
  draw('M477 267 Q505 242 517 204 L544 170 Q558 164 574 177 L586 221 Q563 257 553 293 L531 326 Q520 361 493 373 L477 344 Q499 307 477 267Z',coat,0);
  line('M486 254 Q507 236 517 204 L544 170 Q558 164 574 177 L586 221 Q563 257 553 293 L531 326 Q520 354 501 367',1.42,.90);
  draw('M516 212 Q521 178 536 159 L544 160 L539 176 L534 175 L534 184 L529 183 L529 194 L524 193 L525 208Z',mane,1.03);
  line('M519 199 L531 169 M519 207 L527 182 M514 220 L521 207',.65,.81);
  wash('M537 213 Q543 239 529 275 L510 317 L491 350 L488 337 Q517 281 523 238Z',dark,.15);
  line('M532 235 Q526 272 512 294 M514 324 L505 345 M545 266 Q544 291 533 308',.92,.65);
  draw('M553 175 Q536 151 536 123 L538 82 Q549 86 554 111 Q564 141 566 169Z',coat,1.35);
  draw('M575 173 Q567 139 577 110 L592 67 Q600 68 597 90 Q595 132 586 161Z',coat,1.4);
  draw('M552 156 Q542 124 542 98 Q552 116 556 141Z','#8e8872',.65);
  draw('M579 154 Q579 126 590 90 Q590 119 585 140Z','#8e8872',.65);
  line('M540 84 L543 101 M593 70 L591 85',.7,.81);
  draw('M548 168 Q565 158 582 171 Q600 185 605 210 L628 241 Q653 255 660 274 Q660 287 648 296 Q633 303 617 293 L595 272 Q575 266 565 253 L548 224 Q538 203 541 185Z',coat,1.48);
  draw('M624 247 Q646 253 658 271 Q663 286 650 295 Q635 301 620 291 L607 278Z',light,1.02);
  wash('M550 197 Q552 226 572 246 L604 268 L618 286 Q642 299 654 287 L649 296 Q631 303 617 292 L595 273 Q568 266 556 243Z',dark,.17);
  line('M551 186 Q565 177 577 186 M573 202 Q581 196 588 202 M577 210 Q583 213 588 208 M588 224 L601 246 M623 286 Q636 291 648 286',.9,.85);
  eye(p,582,202,2.6,2.0);
  draw('M641 264 Q649 263 650 269 Q648 274 643 272Z',mane,.65);
  draw('M642 264 Q645 262 648 266',null,.61,'#cec0a0',.72);
  line('M612 285 l3 -1 M618 289 l2 -2 M624 291 l2 -1 M635 295 l2 -2',.48,.53);
  line('M650 278 L656 280 M617 284 L624 287',.66,.72);

  // Woven pad, two tied cloth bundles, and the nearer load basket.
  draw('M269 241 Q345 229 441 240 L453 332 Q377 347 267 332 L258 257Z','#879b8c',1.13);
  line('M270 247 Q351 238 435 246 L446 326 Q359 338 274 328 M285 248 L285 329',.78,.8);
  for(let i=0;i<13;i++)line(`M${287+i*11} 327 L${289+i*11} ${338+(i%3)}`, .66,.69);
  draw('M278 236 Q267 209 283 194 Q307 183 336 195 L361 208 Q368 223 356 241Z','#c9b897',1.16);
  draw('M355 238 Q345 216 357 193 Q369 176 392 178 L444 191 Q459 200 453 222 L442 240Z','#a9af95',1.16);
  line('M286 199 Q298 218 331 221 M276 218 Q311 231 353 229 M288 235 L292 224 M342 208 L343 231 M365 191 Q389 207 445 210 M352 219 Q399 231 454 216 M377 188 L379 233 M431 194 L426 233',.83,.71);
  stitches(p,[283,222],[314,230],4.2,.58);stitches(p,[327,230],[353,233],4.4,.53);
  stitches(p,[358,218],[390,226],4.4,.57);stitches(p,[408,225],[449,218],4.5,.54);
  wash('M279 215 Q295 224 316 226 L317 230 Q291 229 278 220Z','#837a60',.11);
  wash('M362 203 Q385 212 403 211 L416 219 Q388 219 364 211Z','#758773',.12);
  draw('M314 195 L322 194 L329 241 L320 241Z','#93896b',.8);
  draw('M394 181 L401 182 L407 239 L398 240Z','#8f886d',.8);
  line('M319 202 L325 225 M398 190 L403 225',.55,.69);
  stitches(p,[319,202],[325,234],5.0,.61);stitches(p,[399,189],[405,232],5.3,.60);
  knot(p,321,200,.62);knot(p,400,188,.63);
  draw('M359 237 L365 235 L378 366 L371 368Z','#80765b',.9);
  // Narrow woven borders on the blue-green saddle cloth, left visible at ends.
  for(let i=0;i<5;i++){
    const y=256+i*13;
    draw(`M271 ${y} l3 -4 l3 4 l-3 4Z`,'#c3bd94',.43,INK,.5);
    draw(`M442 ${y} l3 -4 l3 4 l-3 4Z`,'#c3bd94',.43,INK,.5);
  }
  pannier(p,289,284,153,122,3);
  rope(p,[304,284],[307,259],[329,240],1.70);rope(p,[426,286],[425,260],[405,240],1.70);
  knot(p,304,285,.57);knot(p,426,287,.57);
  stitches(p,[273,251],[280,281],4.9,.55);stitches(p,[445,271],[450,314],5.1,.53);

  // A thin bridle, simple rope reins and a chest strap; no modern hardware.
  draw('M561 173 L565 171 L597 249 L593 252Z','#918065',.62);
  draw('M610 251 L614 247 L636 280 L632 283Z','#918065',.65);
  line('M593 250 Q610 259 628 273 M596 253 Q591 279 565 291 Q539 309 529 291',1.26,.92);
  ellipse(633,282,3.1,3.5,null,.83);
  rope(p,[632,285],[640,333],[599,352],1.24);
  rope(p,[599,352],[565,364],[531,340],1.24);
  rope(p,[531,340],[501,329],[462,309],1.24);
  line('M501 296 Q496 324 463 337',2.3,.75);
  stitches(p,[497,309],[476,330],5.0,.46);
  line('M627 281 q-3 4 1 7 M630 282 q-3 4 1 7 M630 288 l-3 6',.56,.66);
  stitches(p,[564,179],[592,242],5.1,.57);stitches(p,[613,253],[631,280],5.0,.52);
  for(let i=0;i<26;i++){
    const r=rng(i*37+501),x=186+r()*72,y=273+r()*70;
    line(`M${x} ${y} l${1+r()*3} ${2+r()*5}`,.40,.20);
  }
}

function donkeyEnd(ctx,back,phase){
  const p=painter(ctx),{draw,line,wash,ellipse}=p;
  const coat='#afa28a',light='#d5c7a9',dark='#898474',mane='#625d50';
  const step=phase?13:0;
  // Hindquarters remain visible beside the head in the front drawing.
  draw('M318 249 Q339 228 396 232 Q456 229 480 258 Q495 312 472 370 Q440 403 391 395 Q332 393 310 350Z',coat,1.37);
  for(const [x,sgn] of [[347,-1],[443,1]]){
    draw(`M${x-14} 355 L${x+11} 359 Q${x+14} 409 ${x+sgn*5} 451 L${x+sgn*step} 568 L${x-13+sgn*step} 570 L${x-15} 451Z`,dark,1.12);
    draw(`M${x-14+sgn*step} 566 L${x+2+sgn*step} 566 L${x+8+sgn*step} 579 L${x-17+sgn*step} 580Z`,mane,.93);
  }
  draw('M313 241 Q399 219 484 244 L489 315 Q398 333 307 312Z','#879b8c',1.08);
  draw('M317 242 Q294 217 319 194 Q346 184 383 207 L387 240Z','#c9b897',1.10);
  draw('M392 236 Q393 197 418 185 Q445 179 470 201 L475 244Z','#a9af95',1.1);
  line('M318 211 Q345 229 378 224 M336 195 L350 241 M419 187 L426 240 M404 211 Q435 228 471 217',.81,.74);
  stitches(p,[316,215],[345,226],4.3,.5);stitches(p,[347,227],[378,229],4.2,.53);
  stitches(p,[405,215],[441,224],4.5,.52);stitches(p,[445,223],[470,220],4.1,.53);
  knot(p,340,203,.64);knot(p,421,200,.63);
  pannier(p,264,281,91,130,-1);
  pannier(p,445,281,91,130,0);
  rope(p,[280,280],[289,258],[323,244],1.6);rope(p,[519,280],[505,251],[475,242],1.6);
  knot(p,280,282,.54);knot(p,519,282,.54);
  if(back){
    // A rear view has small ears above the load, a rounded croup and a falling tail.
    draw('M375 205 Q368 156 361 121 Q360 112 366 116 L386 153 L389 200Z',coat,1.2);
    draw('M407 204 Q410 157 426 119 Q433 111 434 122 Q431 158 421 203Z',coat,1.2);
    draw('M372 201 Q397 180 422 203 L430 251 L371 254Z',dark,1.10);
    line('M388 201 Q397 192 410 201 M375 138 L383 160 M423 143 L417 163',.78,.7);
    draw('M333 258 Q353 234 392 239 Q433 232 462 261 Q481 305 459 368 Q445 395 443 437 L450 575 L430 579 L418 456 Q417 426 409 404 L391 402 Q380 437 378 464 L367 578 L347 578 L352 463 Q354 421 342 389 Q319 349 324 308Z',coat,1.43);
    wash('M334 310 Q336 366 355 385 L361 437 L357 577 L349 578 L351 462 Q355 422 342 389 Q326 357 329 318Z',dark,.15);
    line('M348 275 Q365 261 390 265 M414 264 Q440 259 454 278 M350 348 Q361 379 361 413 M442 350 Q431 389 435 420 M365 455 L358 568 M427 457 L440 569',.85,.66);
    hoof(p,356,590,31,16);hoof(p,441,590,30,16);
    draw(`M395 270 Q403 319 400 367 Q395 419 ${408+step} 466`,null,5.2,'#8e8870',.96);
    line(`M395 269 Q401 322 398 367 Q393 418 ${405+step} 466`,1.02,.87);
    draw(`M${404+step} 450 Q${415+step} 465 ${413+step} 486 L${409+step} 497 Q${400+step} 485 ${399+step} 470Z`,mane,1.03);
    line(`M${405+step} 459 L${408+step} 485 M${409+step} 466 L${410+step} 490`,.52,.39);
  }else{
    draw(`M353 341 Q359 416 350 461 L${346-step} 577 L${366-step} 578 L376 466 L379 366Z`,coat,1.31);
    draw(`M425 352 L429 455 L${439+step} 579 L${459+step} 578 L451 448 L451 344Z`,coat,1.31);
    line(`M365 421 L361 466 L${356-step} 571 M440 420 L440 456 L${449+step} 571`,.90,.65);
    hoof(p,356-step,590,33,16);hoof(p,450+step,590,32,16);
    draw('M350 237 Q355 203 372 175 L421 175 Q443 205 448 246 L445 320 Q432 362 404 382 Q378 366 357 337 Q342 294 350 237Z',coat,1.43);
    wash('M355 254 Q359 312 395 350 L407 376 Q378 366 357 336 Q349 309 348 281Z',dark,.15);
    line('M361 278 Q365 318 379 338 M438 276 Q438 309 423 334',.86,.63);
    draw('M368 174 Q346 145 341 101 L342 75 Q350 74 359 96 Q380 137 383 169Z',coat,1.29);
    draw('M409 167 Q410 128 430 88 Q441 65 446 76 Q444 132 426 176Z',coat,1.29);
    draw('M369 151 Q352 120 348 95 Q363 118 374 153Z','#8c8670',.65);
    draw('M419 153 Q423 124 438 91 Q436 123 426 154Z','#8c8670',.65);
    draw('M366 168 Q393 151 421 170 Q437 193 431 225 L417 263 Q416 281 397 288 Q379 286 373 270 L361 230 Q352 195 366 168Z',coat,1.47);
    draw('M374 249 Q395 240 417 251 L420 271 Q415 289 397 292 Q379 289 373 275Z',light,1.08);
    line('M367 200 Q374 196 381 202 M411 202 Q418 197 426 200 M390 188 Q387 216 391 238 M382 281 Q397 286 412 279',.88,.82);
    eye(p,375,202,2.05,2.6);eye(p,418,202,2.05,2.6);
    draw('M378 263 Q384 258 387 264 L385 269Z',mane,.55);
    draw('M407 263 Q413 258 415 266 L409 269Z',mane,.55);
    line('M369 171 L375 217 L378 250 M421 171 L416 215 L413 250',2.16,.72);
    draw('M373 251 Q395 245 418 251 L418 257 Q395 252 374 258Z','#95846a',.72);
    line('M415 261 Q452 291 450 332 Q441 356 416 361 M376 260 Q366 306 384 324 Q415 345 447 314',1.06,.84);
  }
}

function dogSide(ctx,phase,variant){
  const p=painter(ctx),{draw,line,wash,ellipse}=p;
  const coat=variant?'#b8a17d':'#cfbf9d',dark=variant?'#99856a':'#ad9d80',light='#e0d1af',inkcoat='#837157';
  const step=phase?29:0;
  // A village dog: light frame, deep chest, tucked belly and a modest curled tail.
  draw(`M205 345 Q222 380 214 435 L${185+step} 492 L${186+step} 575 L${208+step} 578 L${218+step} 503 L244 451 L248 363Z`,dark,1.28);
  draw(`M452 330 Q460 407 ${472-step} 453 L${492-step} 572 L${516-step} 578 L${502-step} 456 L497 328Z`,dark,1.22);
  paw(p,201+step,588,41,17,dark);
  paw(p,507-step,588,32,16,dark);
  // Tail contour carries little fur ticks rather than a repeated hair texture.
  draw(phase?'M199 289 Q156 285 141 248 Q118 211 91 227 Q79 239 85 257 Q90 269 105 267 Q90 284 76 271 Q57 250 73 226 Q98 199 132 218 Q153 229 163 252 Q179 273 207 269Z':
    'M197 289 Q161 285 143 257 Q127 230 100 242 Q90 247 91 260 Q89 281 109 283 Q88 296 74 278 Q61 259 79 238 Q100 218 128 227 Q151 236 163 253 Q177 270 205 269Z',coat,1.51);
  line(phase?'M177 276 Q149 250 145 239 M110 217 L117 221 M81 248 L85 258':
    'M177 276 Q152 260 145 247 M100 234 L107 235 M79 253 L77 263',.87,.64);
  draw('M192 280 Q217 263 252 271 Q334 287 395 275 Q442 246 480 263 Q508 287 515 333 Q496 378 452 396 Q403 388 365 374 Q319 366 284 375 Q234 398 203 366 Q183 333 192 280Z',coat,1.5);
  wash('M214 337 Q244 370 281 361 Q318 349 360 362 L401 377 Q428 387 458 385 L451 396 Q409 389 365 375 Q319 367 284 376 Q239 399 210 370Z',dark,.17);
  draw('M206 316 Q237 333 245 366 Q243 395 226 421 L197 457 L202 509 L184 574 L162 576 L175 510 L164 454 Q179 418 179 375 L184 341Z',coat,0);
  line('M213 326 Q237 344 245 366 Q243 395 226 421 L197 457 L202 509 L184 574 M162 576 L175 510 L164 454 Q179 418 179 378',1.3,.82);
  paw(p,178,590,47,19,coat);
  line('M213 341 Q228 372 213 402 L178 454 L189 510 L177 569 M166 579 L161 586 M175 579 L174 587 M184 580 L184 587',.90,.70);
  draw(`M451 339 Q469 349 477 375 L481 439 L${462+step} 501 L${465+step} 575 L${443+step} 577 L${442+step} 504 L452 441 Q431 400 428 378 L431 350Z`,coat,0);
  line(`M457 348 Q470 356 477 375 L481 439 L${462+step} 501 L${465+step} 575 M${443+step} 577 L${442+step} 504 L452 441 Q437 411 431 390`,1.3,.81);
  paw(p,461+step,590,46,19,coat);
  line(`M453 384 Q461 419 463 443 L${452+step} 502 L${454+step} 569 M${448+step} 581 L${446+step} 588 M${458+step} 581 L${458+step} 588 M${469+step} 582 L${471+step} 589`,.89,.68);
  // A lighter chest is kept a simple wash, with short irregular fur ends.
  draw('M471 269 Q489 251 505 265 L520 307 L510 351 L486 382 L476 370 L479 359 L470 357 L475 344 L466 341 L472 329 L463 327Z',light,1.03);
  draw('M469 297 Q474 265 492 244 L510 210 Q529 198 550 211 L566 242 Q579 263 599 271 L632 285 Q646 291 644 302 Q640 312 620 314 L594 309 Q573 330 547 323 L513 314 L495 339Z',coat,1.41);
  // Pointed ears with a slight asymmetry avoid a modern breed portrait.
  draw('M512 223 L505 195 L508 166 Q523 171 535 206Z',dark,1.19);
  draw('M535 225 Q535 201 549 176 L558 166 Q567 191 557 223Z',coat,1.20);
  draw('M542 215 L553 184 L553 211Z',inkcoat,.74);
  draw('M613 282 Q633 283 644 292 L641 303 Q626 310 613 304 L602 297Z',light,.95);
  draw('M633 286 Q645 287 646 294 L640 300 L631 297Z',INK,.72);
  draw('M635 288 Q640 286 643 291',null,.9,'#b6b096',.75);
  wash('M509 246 Q525 264 552 269 L568 284 L555 296 Q531 278 511 278Z',dark,.18);
  line('M544 252 Q551 247 559 252 M547 258 Q553 261 559 257 M566 272 Q576 276 582 283 M600 305 Q620 312 637 304 M531 301 Q539 308 548 308',.89,.82);
  eye(p,553,253,2.5,2.5);
  line('M617 302 L625 301 M615 297 L610 294 M482 282 L484 295 M497 296 L501 289 M505 308 L511 304',.68,.64);
  // A few broken whisker marks are enough at the scale of a handscroll figure.
  line('M611 301 l-11 -1 M609 305 l-9 2 M620 306 l-8 4',.40,.42);
  draw('M162 582 l-4 3 M174 583 l-2 3 M186 584 l1 3',null,.58,'#8a775c',.72);
  draw(`M${446+step} 584 l-3 3 M${457+step} 584 l0 3 M${469+step} 585 l2 2`,null,.58,'#8a775c',.72);
  if(variant){
    draw('M514 238 Q519 222 535 225 L542 249 Q541 267 524 269Z',inkcoat,0);
    line('M516 234 Q525 231 534 235',.63,.46);
  }
  line('M238 284 Q264 291 279 290 M330 292 L351 291 M393 290 Q413 278 431 280 M394 363 Q422 370 438 366 M192 352 L197 363',.75,.42);
  for(let i=0;i<20;i++){
    const x=488+(i%5)*4,y=307+Math.floor(i/5)*10;
    line(`M${x} ${y} l-2 5`,.46,.26);
  }
}

function dogEnd(ctx,back,phase,variant){
  const p=painter(ctx),{draw,line,wash,ellipse}=p;
  const coat=variant?'#b8a17d':'#cfbf9d',dark=variant?'#99856a':'#ad9d80',light='#e0d1af',inkcoat='#837157';
  const step=phase?15:0;
  draw('M328 298 Q338 277 395 278 Q454 278 466 310 L457 398 Q444 426 401 428 Q358 427 338 402Z',coat,1.34);
  for(const [x,d] of [[354,-1],[438,1]]){
    draw(`M${x-12} 380 L${x+10} 380 L${x+d*8} 476 L${x+d*step} 574 L${x-17+d*step} 575 L${x-13} 471Z`,dark,1.12);
    draw(`M${x-17+d*step} 571 L${x+d*step} 570 L${x+11+d*step} 581 L${x+11+d*step} 589 L${x-22+d*step} 589Z`,dark,1.03);
  }
  if(back){
    draw('M361 289 L354 253 L358 215 Q370 215 380 248 L413 249 Q426 216 437 215 L436 255 L428 290Z',dark,1.15);
    draw('M337 308 Q358 286 395 293 Q439 285 460 316 L452 401 Q443 437 438 485 L447 574 L426 578 L414 494 L407 438 L389 438 L380 497 L367 576 L347 576 L356 483 L345 415 Q329 368 337 308Z',coat,1.44);
    wash('M339 338 Q344 396 361 425 L364 477 L352 572 L348 576 L355 481 L346 417 Q335 391 334 357Z',dark,.18);
    line('M350 345 Q355 326 376 321 M419 319 Q440 329 445 348 M355 399 L363 429 M437 397 L431 433 M369 488 L358 569 M425 490 L437 570',.81,.60);
    paw(p,355,590,38,18,coat,true);paw(p,438,590,36,18,coat,true);
    draw(phase?'M398 339 Q405 310 430 301 Q469 291 480 324 Q486 347 469 356 Q453 362 446 349 Q467 352 468 335 Q466 314 446 315 Q420 315 412 348Z':
      'M399 340 Q394 310 416 291 Q444 270 465 288 Q488 311 473 331 Q462 345 448 334 Q470 332 464 311 Q459 294 441 297 Q417 302 414 347Z',coat,1.43);
    line(phase?'M410 335 Q429 308 452 309':'M409 334 Q406 306 431 292',.77,.66);
  }else{
    draw(`M344 366 Q341 415 349 470 L${345-step} 574 L${367-step} 578 L378 470 L379 389Z`,coat,1.32);
    draw(`M422 386 L422 467 L${432+step} 578 L${456+step} 577 L450 466 L449 367Z`,coat,1.32);
    draw('M337 315 Q349 286 367 275 L423 275 Q451 294 461 328 L453 380 Q436 414 400 435 Q365 417 346 384Z',coat,1.38);
    draw('M367 312 Q396 297 426 315 L438 359 L425 387 L431 390 L410 412 L413 420 L399 429 L387 419 L383 419 L370 398 L373 392 L357 371Z',light,1.03);
    line('M376 347 L383 371 M403 362 L403 386 M422 346 L416 371',.65,.45);
    paw(p,354-step,590,41,18,coat,true);paw(p,446+step,590,39,18,coat,true);
    line(`M${344-step} 580 L${341-step} 588 M${355-step} 580 L${355-step} 589 M${441+step} 580 L${441+step} 589 M${454+step} 580 L${455+step} 589`,.82,.69);
    draw('M353 248 Q342 220 345 184 L350 165 Q376 182 382 217 L418 217 Q429 179 449 166 Q459 184 454 219 L443 252Z',coat,1.28);
    draw('M355 224 Q349 200 352 184 Q369 202 372 221Z',inkcoat,.75);
    draw('M431 220 Q437 195 448 181 Q451 202 443 224Z',inkcoat,.75);
    draw('M366 216 Q396 204 425 217 Q446 231 448 256 L436 290 L417 309 Q399 320 380 309 L359 293 L349 261 Q350 237 366 216Z',coat,1.40);
    if(variant)draw('M356 236 Q368 221 383 224 L387 262 Q381 281 362 276Z',inkcoat,0);
    draw('M387 270 Q398 265 410 270 L426 291 Q414 312 399 315 Q382 309 373 293Z',light,.96);
    line('M360 254 Q369 247 379 253 M418 252 Q430 247 438 254 M372 277 L380 280 M419 280 L429 276',.93,.81);
    eye(p,371,255,2.6,2.7);eye(p,427,255,2.6,2.7);
    draw('M389 283 Q399 277 410 283 L407 291 L399 295 L391 291Z',INK,.75);
    draw('M393 283 Q399 280 404 283',null,.86,'#b4af93',.76);
    line('M399 295 L399 302 Q390 307 382 299 M399 302 Q410 307 417 297 M378 293 L386 293 M414 293 L422 292',.86,.78);
    line('M382 295 l-13 -2 M381 299 l-12 2 M417 295 l12 -2 M418 300 l11 2',.38,.43);
  }
}

function chickenSide(ctx,phase,rooster){
  const p=painter(ctx),{draw,line,wash,ellipse}=p;
  const coat=rooster?'#b8a680':'#d5c5a2',wing=rooster?'#a18e6d':'#bfac87',dark='#667265',ochre='#bea071',comb='#b47b61';
  // Fine toes and little horny scales; the rear toe lies behind the tarsus.
  if(phase){
    birdLeg(p,[248,374],[239,426],[250,474],[[273,485],[239,487],[262,487]]);
    birdLeg(p,[294,374],[285,433],[269,477],[[248,486],[273,488],[292,484]]);
  }else{
    birdLeg(p,[248,374],[249,430],[237,476],[[219,487],[242,489],[257,483]]);
    birdLeg(p,[294,373],[289,429],[306,476],[[288,487],[312,489],[330,483]]);
  }
  // A feeding bird bends its legs and lowers the barrel before extending its
  // neck. Keeping the body upright would require an implausibly long throat.
  ctx.save();ctx.translate(0,phase?52:0);
  // Long tail coverts are individually outlined, without ornamental saturation.
  if(rooster){
    draw('M190 295 Q151 244 141 196 Q111 171 78 189 Q100 179 115 192 Q137 220 151 265 Q99 217 53 251 Q89 234 115 268 Q71 255 46 285 Q79 272 105 292 Q80 294 58 315 Q103 299 132 325 L187 328Z',dark,1.16);
    line('M188 306 Q145 278 120 226 Q101 190 85 188 M177 313 Q132 279 109 264 Q86 247 66 250 M164 319 Q128 289 98 281 M157 323 Q122 304 92 310',.73,.63);
    draw('M183 303 Q174 252 150 229 Q168 246 194 283Z','#8b8c70',1.02);
  }else{
    draw('M173 287 L144 259 L93 249 Q113 270 126 284 L106 277 Q120 298 143 310 L130 309 Q138 322 167 329Z',wing,1.12);
    line('M104 254 L163 301 M123 280 L164 309 M142 309 L165 316',.74,.69);
  }
  draw('M163 280 Q206 248 259 261 Q306 255 330 282 Q344 321 321 360 Q303 388 274 398 Q227 401 192 377 Q162 351 151 316Z',coat,1.35);
  wash('M165 325 Q180 367 225 381 Q272 396 313 365 L298 387 Q255 413 214 390 Q181 379 163 349Z','#8f856b',.18);
  draw('M187 300 Q226 271 273 285 Q295 300 290 321 Q285 343 259 359 Q220 370 188 340 L172 319Z',wing,1.07);
  // Small overlapping coverts soften the broad wing wash; larger flight
  // feathers below them remain readable as separate flowing ink contours.
  ctx.save();ctx.clip(new Path2D('M187 300 Q226 271 273 285 Q295 300 290 321 Q285 343 259 359 Q220 370 188 340 L172 319Z'));
  for(let row=0;row<4;row++)for(let col=0;col<7;col++){
    const x=191+col*13+row*5,y=290+row*13+Math.sin(col*.62)*4;
    draw(`M${x} ${y} q4 8 9 7 q4 -1 5 -6`,(row+col)%3===0?'#c5b18b':null,.48,'#85755a',.38);
    draw(`M${x+2} ${y+1} q4 5 8 4`,null,.42,'#ded0ab',.52);
  }
  ctx.restore();
  // Imbricated flight feathers and three short rows of coverts.
  line('M180 316 Q209 316 233 339 Q257 345 280 324 M181 322 Q207 325 229 347 Q251 354 269 342 M187 333 Q208 334 224 353 M213 292 Q231 302 239 318 Q261 324 281 307 M193 304 Q219 302 232 326',.75,.71);
  for(let i=0;i<8;i++){
    const x=204+(i%4)*15,y=304+Math.floor(i/4)*14;
    line(`M${x} ${y} q6 7 12 2`,.66,.64);
  }
  ctx.restore();
  if(phase){
    // The nape bends down and forward; the beak, not the throat, reaches the
    // ground. Its tip is ten working pixels above the planted toe baseline.
    draw('M291 327 Q326 320 344 341 Q357 363 353 385 Q350 407 369 420 L389 425 Q407 431 411 446 Q414 462 402 471 Q386 480 373 468 Q361 454 354 438 L334 420 Q319 402 312 381 Q300 355 285 350 L276 336Z',coat,1.09);
    wash('M306 350 Q322 369 324 391 Q331 412 350 422 L370 444 Q373 460 384 468 L379 472 Q363 458 355 439 L334 422 Q319 405 312 383 Q302 363 295 357Z','#938265',.11);
    draw('M406 452 L421 480 L410 465 L400 460Z',ochre,.80);
    line('M406 457 L419 477 M409 453 l2 2',.53,.68);
    draw('M374 430 Q369 421 375 416 L381 420 Q383 411 389 417 L393 423 Q402 421 405 430 L397 438Z',comb,.75);
    ellipse(395,447,2.6,2.5,INK,.28);ellipse(394.4,446.3,.6,.55,'#e3d5b3',0);
    line('M388 442 Q394 438 400 443 M365 448 Q374 461 387 465 M312 355 Q328 370 326 389 M335 398 L347 411 M349 413 L358 420 M381 471 Q390 475 399 470',.68,.63);
    if(rooster)draw('M398 466 Q410 473 403 481 Q395 482 392 473Z',comb,.66);
  }else{
    const neck=rooster?18:38;
    draw(`M278 290 Q291 270 303 ${238+neck*.4} Q312 ${213+neck} 308 ${188+neck} Q306 ${165+neck} 320 ${149+neck} Q335 ${138+neck} 351 ${149+neck} Q368 ${158+neck} 366 ${174+neck} Q362 ${189+neck} 348 ${200+neck} Q350 ${224+neck*.60} 350 ${248+neck*.25} Q350 284 330 312 L310 324 Q286 317 278 290Z`,coat,1.11);
    ctx.save();ctx.translate(0,neck);
    if(rooster){
      draw('M310 166 Q301 159 307 149 L309 138 L316 143 Q317 127 325 128 L331 140 Q336 123 343 133 L347 144 Q357 135 362 144 L361 155Z',comb,.87);
      draw('M350 181 Q369 190 360 208 Q354 217 347 209 Q342 200 343 189Z',comb,.74);
      draw('M309 192 Q331 207 346 195 L349 249 L329 282 L312 279 L290 300 Q294 273 304 247Z','#b3a382',.85);
      for(let i=0;i<7;i++){
        const x=307+i*5;
        line(`M${x} ${211+(i%2)*7} Q${x+5} 240 ${x-4} ${269+(i%3)*7}`,.66,.68);
      }
    }else{
      draw('M315 153 Q307 147 312 139 L318 143 Q324 132 330 140 L333 143 Q341 136 346 145 L350 151Z',comb,.73);
      draw('M348 188 Q355 194 352 201 Q346 204 343 195Z',comb,.60);
    }
    draw('M361 168 L381 177 L362 181Z',ochre,.76);
    line('M363 175 L379 177 M363 171 l3 1 M319 183 Q329 194 340 192 M310 224 L316 240 M319 244 L315 260 M326 232 L327 248 M337 217 L336 232',.65,.63);
    ellipse(346,164,2.65,2.65,INK,.32);
    ellipse(345.3,163.3,.65,.6,'#ded3b4',0);
    line('M341 157 Q347 154 351 158',.64,.66);
    ctx.restore();
  }
  for(let i=0;i<13;i++){
    const x=200+(i%5)*17,y=370+Math.floor(i/5)*8+(phase?52:0);
    line(`M${x} ${y} q4 6 8 1`,.55,.43);
  }
}

function chickenEnd(ctx,back,phase,rooster){
  const p=painter(ctx),{draw,line,wash,ellipse}=p;
  const coat=rooster?'#b8a680':'#d5c5a2',wing=rooster?'#a18e6d':'#bfac87',dark='#667265',comb='#b47b61';
  const step=phase?12:0;
  birdLeg(p,[235,370],[233,437],[220-step,477],[[202-step,488],[222-step,489],[241-step,486]]);
  birdLeg(p,[278,370],[281,436],[292+step,477],[[272+step,487],[296+step,489],[314+step,486]]);
  ctx.save();ctx.translate(0,phase?52:0);
  if(back&&rooster){
    draw('M218 310 Q197 252 204 202 Q211 167 229 139 Q211 157 209 192 Q220 168 235 151 Q244 124 258 118 Q244 147 246 176 Q265 154 278 148 Q292 128 301 135 Q290 145 286 164 Q302 164 314 179 Q294 170 279 193 Q311 198 320 227 Q293 204 276 228 L289 311Z',dark,1.1);
    line('M221 302 Q216 235 225 197 L246 160 M240 292 Q240 217 258 179 M264 292 Q265 231 285 208 M282 292 Q291 248 310 226',.77,.66);
  }
  draw('M206 275 Q228 251 257 256 Q292 254 310 281 Q330 328 306 370 Q291 397 257 405 Q222 398 203 371 Q182 329 206 275Z',coat,1.3);
  draw('M201 295 Q218 286 229 305 L224 352 L209 371 Q193 355 194 331Z',wing,.95);
  draw('M288 303 Q300 286 313 297 Q328 336 307 371 L291 350Z',wing,.95);
  line('M200 314 Q211 327 213 346 M199 327 L208 352 M308 314 Q299 329 300 348 M313 325 L306 353',.69,.66);
  wash('M213 365 Q254 401 301 365 L292 388 Q255 419 222 391Z','#8f856b',.15);
  ctx.restore();
  if(back){
    ctx.save();ctx.translate(0,phase?52:0);
    if(!rooster){
      draw('M222 303 L217 252 L226 210 L241 226 L251 204 L260 225 L278 208 L287 250 L282 305Z',wing,1.05);
      line('M225 226 L237 285 M253 219 L253 290 M278 224 L269 286',.74,.72);
    }
    for(let i=0;i<12;i++){
      const x=222+(i%4)*18,y=325+Math.floor(i/4)*17;
      line(`M${x} ${y} q7 9 14 1`,.68,.64);
    }
    ctx.restore();
  }else if(phase){
    draw('M228 338 Q242 327 259 333 Q279 338 287 361 Q282 377 281 395 L284 409 Q289 428 280 447 Q273 461 258 465 Q240 464 230 447 Q220 425 226 408 L230 396 Q219 375 218 355Z',coat,1.09);
    wash('M224 357 Q224 378 239 396 L237 410 Q231 427 240 447 L247 459 Q232 454 228 441 Q221 426 226 409 L230 397 Q224 381 221 370Z','#958363',.12);
    draw('M247 454 L265 455 L257 480Z','#bea071',.76);
    line('M250 459 L262 460 M254 457 L257 473',.49,.64);
    draw('M247 409 Q239 404 243 396 L249 400 Q254 391 260 398 L263 403 Q270 397 273 406 L267 416Z',comb,.75);
    ellipse(234,435,2.0,2.3,INK,.30);ellipse(279,435,2.0,2.3,INK,.30);
    line('M231 431 Q234 427 238 431 M275 431 Q279 427 282 431 M238 442 Q242 450 247 451 M267 451 Q274 448 277 442 M242 362 L245 378 M263 364 L261 381 M246 390 L246 401 M259 390 L260 400',.62,.61);
    if(rooster)draw('M250 466 Q247 476 253 480 Q259 481 259 472 Q266 481 269 473 L265 466Z',comb,.58);
  }else{
    const dy=rooster?18:38;
    draw(`M227 290 Q232 ${250+dy*.35} 233 ${210+dy} Q218 ${181+dy} 230 ${158+dy} Q246 ${143+dy} 264 ${149+dy} Q284 ${155+dy} 281 ${178+dy} Q280 ${199+dy} 269 ${210+dy} L288 291 Q279 320 257 329 Q231 316 227 290Z`,coat,1.23);
    if(rooster){
      draw(`M236 ${154+dy} L233 ${139+dy} Q237 ${126+dy} 243 ${136+dy} L247 ${129+dy} Q253 ${120+dy} 260 ${133+dy} L265 ${130+dy} Q275 ${135+dy} 273 ${153+dy}Z`,comb,.96);
      draw(`M244 ${208+dy} Q238 ${231+dy} 248 ${238+dy} Q257 ${240+dy} 260 ${230+dy} Q268 ${242+dy} 274 ${230+dy} L268 ${206+dy}Z`,comb,.8);
      line(`M234 257 L240 284 M246 261 L248 301 M268 258 L265 300 M278 265 L272 287`,.76,.69);
    }else draw(`M238 ${155+dy} L237 ${145+dy} L243 ${142+dy} L250 ${148+dy} Q257 ${134+dy} 264 ${148+dy} L269 ${155+dy}Z`,comb,.82);
    ellipse(236,180+dy,2.2,2.5,INK,.4);ellipse(273,180+dy,2.2,2.5,INK,.4);
    draw(`M248 ${190+dy} L261 ${189+dy} L255 ${206+dy}Z`,'#b2996f',.86);
    line(`M250 ${195+dy} L258 ${195+dy} M242 ${217+dy} L247 ${224+dy} M266 ${218+dy} L263 ${226+dy}`, .7,.65);
    for(let i=0;i<8;i++){
      const x=232+(i%3)*17,y=337+Math.floor(i/3)*16;
      line(`M${x} ${y} q6 8 12 1`,.64,.54);
    }
  }
}

function animalTexture(kind,view,phase,variant){
  const key=`${kind}:${view}:${phase}:${variant}`;
  if(textureCache.has(key))return textureCache.get(key);
  const isBird=kind==='chicken',W=isBird?512:800,H=isBird?512:600;
  const tex=canvasTexture(isBird?512:kind==='dog'?768:1024,isBird?512:kind==='dog'?576:768,(ctx,w,h)=>{
    ctx.scale(w/W,h/H);
    // A viewer to the animal's right sees its nose on the left of the drawing.
    if(view===1){ctx.translate(W,0);ctx.scale(-1,1);}
    if(kind==='dog'){
      // A village dog's lower limbs are shorter than the earlier long-legged
      // study. Two directly drawn vector regions keep every curve crisp and
      // preserve exactly the same ground baseline without a temporary bitmap.
      for(let region=0;region<2;region++){
        ctx.save();ctx.beginPath();ctx.rect(0,region?421.8:0,W,region?H-421.8:422.2);ctx.clip();
        if(region){ctx.translate(0,118);ctx.scale(1,.80);}else ctx.translate(0,42);
        view%2?dogSide(ctx,phase,variant):dogEnd(ctx,view===2,phase,variant);
        coatFinish(ctx,kind,view,phase,variant);ctx.restore();
      }
    }else{
      if(kind==='donkey')view%2?donkeySide(ctx,phase):donkeyEnd(ctx,view===2,phase);
      else view%2?chickenSide(ctx,phase,variant===2):chickenEnd(ctx,view===2,phase,variant===2);
      coatFinish(ctx,kind,view,phase,variant);
    }
    // Tiny, quiet wash breaks are clipped into the animal's existing alpha.
    // There is no rectangular paper fill around a cutout.
    ctx.save();ctx.globalCompositeOperation='source-atop';
    const rand=rng(6047+view*17+variant*491+(isBird?193:0));
    for(let i=0;i<(isBird?155:340);i++){
      const x=rand()*W,y=rand()*H;
      ctx.strokeStyle=i%4?'rgba(64,54,33,.050)':'rgba(227,215,179,.105)';
      ctx.lineWidth=.35+rand()*.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.5+rand()*1.7,y+1+rand()*4.5);ctx.stroke();
    }
    ctx.restore();
  });
  tex.anisotropy=4;
  textureCache.set(key,tex);return tex;
}

function prepare(kind,variant){
  const frames=[];
  for(let view=0;view<4;view++){
    frames[view]=[];
    for(let phase=0;phase<2;phase++)frames[view][phase]=animalTexture(kind,view,phase,variant);
  }
  return frames;
}

function routeData(route){
  if(!Array.isArray(route)||route.length<2)return null;
  const points=route.filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(p=>[p[0],p[1]]);
  if(points.length<2)return null;
  const lengths=[];let total=0;
  for(let i=1;i<points.length;i++){const length=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);lengths.push(length);total+=length;}
  return total>.001?{points,lengths,total}:null;
}

export class Animals {
  constructor(scene){
    this.group=new THREE.Group();this.group.name='河市禽畜';scene.add(this.group);this.animals=[];
  }

  // heading: radians, with zero toward +Z. y is an offset ABOVE groundHeight.
  // route: two or more [x,z] points, walked back and forth at speed world units/s.
  // variant: dog 0/1; chicken 'rooster' (or 2) / 'hen' (or 0).
  add(x,z,options={}){
    const kind=SPEC[options.kind]?options.kind:'donkey';
    const spec=SPEC[kind],scale=options.scale??1;
    let variant=options.variant==='rooster'?2:options.variant==='hen'?0:Number(options.variant??0);
    variant=kind==='chicken'?(variant===2?2:0):kind==='dog'?(variant?1:0):0;
    const frames=prepare(kind,variant);
    const material=new THREE.MeshBasicMaterial({map:frames[0][0],transparent:true,alphaTest:.17,depthWrite:true,side:THREE.DoubleSide,color:'#faf3e4'});
    const g=new THREE.Group();g.position.set(x,options.y??0,z);this.group.add(g);
    const sprite=new THREE.Mesh(planeGeometry,material);
    sprite.scale.set(spec.width*scale,spec.height*scale,1);
    sprite.position.y=spec.height*scale*(spec.baseline-.5);g.add(sprite);
    const foot=new THREE.Mesh(shadowGeometry,softShadow());foot.rotation.x=-Math.PI/2;foot.position.y=.014;
    foot.scale.set(spec.shadow[0]*scale,spec.shadow[1]*scale,1);g.add(foot);
    const path=routeData(options.route);
    const animal={g,sprite,material,foot,kind,variant,frames,heading:options.heading??0,
      width:spec.width*scale,height:spec.height*scale,baseline:spec.baseline,offsetY:options.y??0,route:path,
      speed:Math.max(0,options.speed??spec.speed),phase:this.animals.length*1.731,
      start:options.start??0,view:-1,pose:-1};
    g.userData.animal=kind;this.animals.push(animal);return animal;
  }

  update(time,camera,groundHeight){
    for(const a of this.animals){
      const walking=!!a.route&&a.speed>0;
      if(walking){
        const r=a.route,period=r.total*2,travel=((time*a.speed+a.start)%period+period)%period;
        const forward=travel<r.total;let distance=forward?travel:period-travel,index=0;
        while(index<r.lengths.length-1&&distance>r.lengths[index]){distance-=r.lengths[index];index++;}
        const p=r.points[index],q=r.points[index+1],length=r.lengths[index];
        const t=length>0?distance/length:0;
        a.g.position.x=p[0]+(q[0]-p[0])*t;a.g.position.z=p[1]+(q[1]-p[1])*t;
        const sign=forward?1:-1;a.heading=Math.atan2((q[0]-p[0])*sign,(q[1]-p[1])*sign);
      }
      if(typeof groundHeight==='function')a.g.position.y=groundHeight(a.g.position.x,a.g.position.z)+a.offsetY;
      const angle=Math.atan2(camera.position.x-a.g.position.x,camera.position.z-a.g.position.z);
      a.sprite.rotation.y=angle;
      const relative=((angle-a.heading)%TAU+TAU)%TAU;
      // A small hysteresis avoids flicker when a viewer hovers at a diagonal.
      const ideal=Math.round(relative/(Math.PI*.5))%4;
      const oldCenter=a.view*Math.PI*.5;
      const oldDistance=Math.abs(Math.atan2(Math.sin(relative-oldCenter),Math.cos(relative-oldCenter)));
      const view=a.view<0||oldDistance>Math.PI*.25+.09?ideal:a.view;
      // A bird picks twice, looks up, then rests. Different phase offsets keep
      // a little flock from moving in unison; no new drawings are allocated.
      const peckClock=((time+a.phase*2.3)%8.8+8.8)%8.8;
      const peck=peckClock<.30||(peckClock>.61&&peckClock<.92)||(peckClock>2.05&&peckClock<2.43);
      const pose=a.kind==='chicken'?(peck?1:0):walking?Math.floor(time*2.1+a.phase)%2:0;
      if(view!==a.view||pose!==a.pose){a.material.map=a.frames[view][pose];a.view=view;a.pose=pose;}
      // The soles stay fixed. Liveliness comes from posture, deliberate routes,
      // pecking chickens and changing views, not a floating whole-body bounce.
      a.sprite.position.y=a.height*(a.baseline-.5);
      a.sprite.scale.x=a.width*(1+(a.kind==='dog'?.0028:a.kind==='donkey'?.0015:0)*Math.sin(time*1.5+a.phase));
      a.foot.rotation.z=a.heading-Math.PI*.5;
    }
  }

  get count(){return this.animals.length;}

  dispose(){
    for(const a of this.animals)a.material.dispose();
    this.group.removeFromParent();this.group.clear();this.animals.length=0;
  }
}
