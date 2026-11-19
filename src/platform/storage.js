const KEY='vector-nova.genesis.v1';
const defaults={volume:70,muted:false,bloom:true,shake:true,quality:'high',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
export function readProfile(){
  let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
  const settings={...defaults},source=data.settings||{};
  for(const k of ['muted','bloom','shake','reduced'])if(typeof source[k]==='boolean')settings[k]=source[k];
  if(['high','standard'].includes(source.quality))settings.quality=source.quality;
  if(Number.isFinite(source.volume))settings.volume=Math.max(0,Math.min(100,source.volume));
  return {settings,best:Number.isSafeInteger(data.best)&&data.best>0?data.best:0};
}
export function saveProfile(profile){try{localStorage.setItem(KEY,JSON.stringify(profile));}catch{}}
