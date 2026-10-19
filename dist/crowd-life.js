// Small, overlapping social groups, authored around the existing neighbourhood.
// These arrangements are reconstruction, not claims about individual people in the scroll.
export function populateStreetLife(people,{canWalk,groundHeight,places,animals,looseObstacles=[]}){
  const ensembles=[],added=[];let seed=18427;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const protectedPlaces=Object.values(places);
  const groundGoods=[[-2.25,5.1,.52],[2.2,1.5,.52],[-2.25,-5.5,.52]];
  const restingAnimals=(animals?.animals||[]).filter(a=>!a.route).map(a=>({x:a.g.position.x,z:a.g.position.z,r:a.kind==='donkey'?.8:a.kind==='dog'?.42:.30}));
  const fits=(x,z,min=.43,r=.17)=>canWalk(x,z,r)&&!groundGoods.some(p=>Math.hypot(x-p[0],z-p[1])<p[2])&&!restingAnimals.some(p=>Math.hypot(x-p.x,z-p.z)<p.r)&&!protectedPlaces.some(p=>Math.hypot(x-p.x,z-p.z)<.62)&&!people.people.some(p=>Math.hypot(x-p.g.position.x,z-p.g.position.z)<min);
  // Earlier figures predate the close ground props. Move only those whose
  // soles now occupy one of those physical footprints, before placing buyers.
  const relocated=[];
  for(const p of people.people){
    if(p.walk||p.working||Math.abs(p.g.position.y-groundHeight(p.g.position.x,p.g.position.z))>.06)continue;
    const obstacle=looseObstacles.find(c=>Math.abs(p.g.position.x-c.x)<c.w/2+.17&&Math.abs(p.g.position.z-c.z)<c.d/2+.17);
    if(!obstacle)continue;
    const ox=p.g.position.x,oz=p.g.position.z,a=Math.atan2(oz-obstacle.z,ox-obstacle.x);let moved=false;
    for(const r of [.4,.65,.9,1.2,1.55]){
      for(const da of [0,.55,-.55,1.1,-1.1,1.65,-1.65,Math.PI]){
        const x=ox+Math.cos(a+da)*r,z=oz+Math.sin(a+da)*r;
        if(!canWalk(x,z,.18)||people.people.some(q=>q!==p&&Math.hypot(x-q.g.position.x,z-q.g.position.z)<.43))continue;
        p.g.position.set(x,groundHeight(x,z),z);p.x=x;p.z=z;relocated.push({kind:p.kind,from:[ox,oz],to:[x,z]});moved=true;break;
      }
      if(moved)break;
    }
  }
  function person(x,z,kind,heading,activity,options={}){
    // Adjust a blocked position locally, never scatter it to another street.
    let point=null;
    for(const [dx,dz] of [[0,0],[.24,0],[-.24,0],[0,.24],[0,-.24],[.28,.28],[-.28,.28],[.28,-.28],[-.28,-.28],[.46,0],[-.46,0],[0,.46],[0,-.46]]){
      if(fits(x+dx,z+dz,kind===12?.62:.43,kind===12?.30:.17)){point=[x+dx,z+dz];break;}
    }
    if(!point)return null;
    const p=people.add(point[0],point[1],{kind,heading,y:groundHeight(...point),scale:kind===8?.94+random()*.05:.93+random()*.13,...options});
    p.activity=activity;added.push(p);return p;
  }
  function cluster(name,focus,members){
    const group=[];
    for(const [x,z,kind,turn=0] of members){const heading=Math.atan2(focus[0]-x,focus[1]-z)+turn,p=person(x,z,kind,heading,name);if(p){p.heading=Math.atan2(focus[0]-p.g.position.x,focus[1]-p.g.position.z)+turn;group.push(p);}}
    ensembles.push({name,count:group.length,focus});return group;
  }
  // Repair customers who were looking away from their counter.
  for(const p of people.people){
    if(p.walk||p.working)continue;
    const x=p.g.position.x,z=p.g.position.z;
    if(z>21.65&&z<23.9&&((x< -8.3&&x> -19.5)||(x>19&&x<24)))p.heading=0;
    if(z> -19.5&&z< -17.8&&Math.abs(x)>9&&Math.abs(x)<24)p.heading=Math.PI;
  }
  cluster('伞下买果',[-6.8,17.6],[[-7.75,18.45,10],[-7.1,18.7,1],[-6.4,18.7,4],[-5.85,18.95,7],[-7.45,19.25,2],[-6.6,19.55,8],[-5.65,18.3,6],[-8.2,18.1,0]]);
  cluster('桥头问价',[5.8,17],[[4.7,17.6,10],[5.4,18.05,1],[6.1,18.05,0],[6.85,17.65,4],[7.1,17.15,7],[4.4,18.2,8],[6.65,18.7,2],[5.8,18.95,9]]);
  cluster('南岸杂货柜',[-10,24.15],[[-8.4,23.25,4],[-9.2,23.5,1],[-10.1,23.35,10],[-10.8,23.75,6],[-11.4,23.1,8],[-12,22.7,7],[-9.4,22.65,2],[-10.7,22.85,0]]);
  cluster('布匹议价',[-17.2,24.6],[[-15.7,23.85,10],[-16.4,23.55,1],[-17.2,23.9,4],[-17.9,23.45,0],[-18.6,23.65,8],[-16.9,22.8,11],[-15.35,22.7,7],[-18.9,22.75,2]]);
  cluster('檐下相逢',[-22.8,25.1],[[-21.9,24.45,9],[-22.75,24.4,8],[-23.4,24.1,2],[-23.9,24.7,1],[-22.35,23.6,3]]);
  cluster('挑担歇脚',[-26.1,23.9],[[-25.4,23.5,5],[-26.1,23.1,3],[-26.8,23.55,3],[-25.85,24.7,1],[-27.4,23.1,2]]);
  cluster('茶案旁交谈',[14.65,23.9],[[15.8,24.05,11],[15.9,23.3,6],[16.55,23.65,0],[16.7,24.4,6],[17.4,23.8,2]]);
  cluster('茶肆候友',[13,25.4],[[10.55,24.7,0],[11.1,25.2,9],[11.65,25.1,11],[16.2,25.0,4],[16.65,25.2,7]]);
  cluster('东街买卖',[21.5,24.6],[[20.4,24.15,10],[21.25,24.15,1],[22.4,24.6,4],[23.2,24.5,8],[21.6,23.25,0],[20.5,23.0,7],[23.5,23.65,2],[19.1,23.5,11]]);
  cluster('东街布店',[28.8,26.3],[[27.6,25.2,4],[28.4,25.4,10],[29.1,25.1,1],[29.85,25.35,0],[28.75,24.5,7],[30.5,24.9,2]]);
  cluster('街口行旅',[1.0,29.5],[[-.6,28.7,9],[-1.15,28.25,8],[2.1,28.55,10],[2.65,28.8,2],[1.8,29.5,1],[-.8,29.7,5]]);
  cluster('桥前同行',[-.2,17.7],[[-1.8,17.5,11],[-1.1,17.85,0],[.9,18.5,4],[1.35,18.25,7],[2.0,18.6,10],[-.8,19.5,3],[.25,19.8,8],[-1.8,19.9,2]]);
  cluster('桥边看船',[-9,6.1],[[-2.6,11.1,8],[-2.45,10.55,2],[-2.1,10.65,7],[-1.05,10.9,0],[-.3,10.35,1],[-2.6,8.8,11]]);
  cluster('桥市茶碗',[-2.3,7.5],[[-1.05,7.45,1],[-.25,7.8,4],[-.7,6.95,10],[-1.1,8.15,8],[.05,6.65,7],[.55,7.4,0]]);
  cluster('桥上相让',[.35,4.65],[[.5,5.8,9],[.95,4.9,2],[.1,4.0,11],[-.8,3.3,10],[-.55,5.7,4],[1.0,3.4,7]]);
  cluster('桥心围望',[8.1,-2.4],[[2.45,2.0,0],[2.4,1.95,3],[1.5,1.1,11],[.75,.7,4],[2.45,-.6,2],[1.35,-.7,7],[.1,1.85,5]]);
  cluster('桥北看货',[2.3,-6.6],[[1.0,-5.5,10],[.5,-6.0,1],[.95,-7.3,0],[1.9,-7.65,4],[2.5,-7.8,7],[.1,-7.15,8]]);
  cluster('桥北同行',[-.6,-10.5],[[-.45,-8.65,3],[-.95,-9.5,1],[.2,-9.9,10],[.55,-10.55,1],[-.5,-11.4,8],[.7,-12.3,2]]);
  cluster('北岸点心',[5.4,-17],[[4.4,-16.3,10],[5.15,-15.95,4],[5.8,-16.0,7],[6.3,-16.3,8],[6.6,-17.1,1],[4.25,-17.5,3],[5.4,-18.1,0],[6.05,-18.25,2]]);
  cluster('北桥头买卖',[-5.3,-16.4],[[-4.4,-17.1,1],[-5.1,-17.5,10],[-5.9,-17.5,4],[-6.4,-17.2,7],[-4.8,-18.2,6],[-6.9,-17.75,5],[-4,-18.15,8]]);
  cluster('北街货柜',[-18,-20.7],[[-16.6,-19.75,3],[-17.4,-19.65,5],[-18.3,-19.8,1],[-19,-19.45,3],[-17.9,-18.95,10],[-19.8,-19.7,2]]);
  cluster('北街喝茶',[17.8,-20.2],[[16.8,-20.45,11],[18.25,-20.65,0],[19.0,-20.55,6],[19.5,-20.0,8],[17.75,-19.3,2]]);
  cluster('北街行旅',[2,-22],[[1.0,-20.9,10],[1.6,-21.5,4],[2.0,-21.1,7],[-.1,-22,5],[.65,-22.8,2],[-.8,-22.6,2]]);
  cluster('船埠点货',[-19.5,11.7],[[-20.1,12.25,3],[-20.8,12.5,1],[-21.4,12.05,5],[-19.2,12.0,3],[-18.5,12.55,2],[-21.9,13.05,12]]);
  cluster('埠头候船',[-16,11],[[-15.4,12.65,10],[-16.1,12.7,4],[-16.6,12.35,7],[-17.25,12.9,9],[-15.65,13.45,3],[-14.65,12.45,8]]);
  // Folded knees and hands at the goods break the skyline of standing robes.
  cluster('船埠扎货',[-21.9,13.05],[[-22.8,11.6,3]]);
  cluster('车旁理绳',[-21.8,18.6],[[-20.25,18.25,12]]);
  cluster('伞边整筐',[-6.8,17.6],[[-7.95,16.5,12]]);
  cluster('北街理货',[-18,-20.6],[[-20.3,-20.0,12]]);
  cluster('桥前整包',[3.8,14.3],[[5.45,14.4,12]]);
  // Quietly crossing the larger groups prevents every person reading as a queue.
  const routes=[
    [[-.05,13.9],[-.05,-12.5],2,.030],[[.85,-12],[.85,12.3],0,.025],
    [[-27,20.15],[-7,20.15],3,.035],[[7.4,22.15],[19.2,22.15],10,.036],
    [[-28,-18.15],[-8,-18.15],2,.031],[[8.5,-18.0],[23.7,-18.0],5,.030],
    [[-.6,25.5],[-.6,29.4],8,.042],[[3.3,19.7],[3.3,24.1],11,.041]
  ];
  for(const [a,b,kind,speed] of routes){
    let clear=true;for(let i=0;i<=50;i++){const t=i/50;if(!canWalk(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,.18)){clear=false;break;}}
    if(clear)person(a[0],a[1],kind,Math.atan2(b[0]-a[0],b[1]-a[1]),'穿行',{walk:speed,route:[a,b]});
  }
  const glances=added.filter((p,i)=>!p.walk&&i%4===0).map((p,i)=>({p,heading:p.heading,phase:i*2.399,rate:.17+(i%5)*.018}));
  return {ensembles,relocated,added:added.length,update(t){for(const g of glances)g.p.heading=g.heading+Math.sin(t*g.rate+g.phase)*.14;}};
}
