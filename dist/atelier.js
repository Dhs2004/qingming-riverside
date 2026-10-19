// Visible review fixture: localhost ?atelier=1 only. No remote telemetry.
export function mountAtelier(api){
  const presets={
    '檐瓦与木作':{eye:[18.6,2.8,22.2],look:[15.8,3.9,25.25],fov:45},
    '茶案与器物':{eye:[15.8,1.65,22.25],look:[14.5,1.14,23.9],fov:47},
    '茶肆内景':{eye:[13.5,1.96,26],look:[15.1,1.6,29.6],fov:60},
    '窗下日光':{eye:[11.8,1.9,26.3],look:[10.6,.55,27.6],fov:55},
    '布店门脸':{eye:[-16,1.86,21.9],look:[-17.4,1.7,25.8],fov:56},
    '伞骨与编筐':{eye:[-5,1.83,19.2],look:[-6.65,1.22,17.6],fov:48},
    '桥栏与榫木':{eye:[2,5.27,.7],look:[3.17,4.52,-.75],fov:48},
    '桥冠承木':{eye:[4.35,3.65,2.30],look:[2.9,3.31,.95],fov:42},
    '桥面与鞋履':{eye:[.1,3.30,8.4],look:[1.8,2.54,8.8],fov:52},
    '纸灯与檐下':{eye:[15.8,2.15,24.0],look:[15.25,2.58,24.95],fov:43},
    '埠头与舟楫':{eye:[-19,1.86,12.1],look:[-15,.9,6.6],fov:53},
    '舱口与船沿':{eye:[-9.3,1.86,10.6],look:[-10.1,.53,5.8],fov:43},
    '漕船近景':{eye:[2.4,5.2,-3],look:[7.1,1.05,-1.8],fov:46},
    '埠头布包':{eye:[-20.15,1.22,13.1],look:[-21.6,.51,11.9],fov:42},
    '街路与柳根':{eye:[-9.8,1.86,12.9],look:[-12,.55,11.3],fov:58},
    '近看驮驴':{eye:[-24.6,1.3,14.5],look:[-23.2,1,16.8],fov:45},
    '车轮与车厢':{eye:[-19.6,1.36,19.7],look:[-21.5,.94,19.1],fov:48},
    '蒸笼与点心':{eye:[5.0,1.9,-15.8],look:[5.45,1.17,-17],fov:48},
    '人物近看':{eye:[-7.35,1.78,23.82],look:[-7.5,1.71,23],fov:43},
    '船埠扎货':{eye:[-22.1,1.4,14.15],look:[-21.9,.75,13.05],fov:50},
    '桥头人潮':{eye:[-3.5,1.85,23.8],look:[-.1,1.9,12.6],fov:61},
    '街市人情':{eye:[-13.4,1.85,21.0],look:[-17.2,1.5,23.9],fov:64},
    '桥上人群':{eye:[-.1,4.92,3.9],look:[0,3.4,-9],fov:62},
    '全景构图':{eye:[-10.5,6.6,23],look:[1.2,2.05,.7],fov:58}
  };
  const panel=document.createElement('aside');panel.setAttribute('aria-label','本地画境审阅');
  panel.style.cssText='position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:80;display:flex;gap:6px;align-items:center;padding:8px;background:#eee4cde8;border:1px solid #796a4b;font:12px serif;color:#4c4839;max-width:90vw;flex-wrap:wrap';
  const select=document.createElement('select');select.setAttribute('aria-label','近景审阅视角');
  const placeholder=new Option('选择近景审阅','');select.add(placeholder);
  for(const key of Object.keys(presets))select.add(new Option(key,key));
  select.addEventListener('change',()=>{if(presets[select.value])api.view(presets[select.value]);});
  const freeze=document.createElement('button');freeze.textContent='定格';freeze.setAttribute('aria-pressed','false');freeze.onclick=()=>{const value=freeze.getAttribute('aria-pressed')!=='true';freeze.setAttribute('aria-pressed',String(value));api.freeze(value);};
  const palette=document.createElement('select');palette.setAttribute('aria-label','光色审阅');for(const key of ['原始光色','清润日光','暖晴日光'])palette.add(new Option(key,key,key==='清润日光',key==='清润日光'));palette.onchange=()=>api.palette(palette.value);
  const reset=document.createElement('button');reset.textContent='恢复行走';reset.onclick=()=>{select.value='';freeze.setAttribute('aria-pressed','false');figures.setAttribute('aria-pressed','true');api.reset();};
  const figures=document.createElement('button');figures.textContent='人物显隐';figures.setAttribute('aria-pressed','true');figures.onclick=()=>{const value=figures.getAttribute('aria-pressed')!=='true';figures.setAttribute('aria-pressed',String(value));api.figures(value);};
  panel.append(select,palette,freeze,figures,reset);document.body.append(panel);
}
