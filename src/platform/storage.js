// Preserve the original storage key so existing scores and preferences survive the rename.
const KEY='vector-nova.genesis.v1';
const defaults={volume:70,muted:false,bloom:true,shake:true,quality:'high',camera:'static',steering:'thrust',reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
export function readProfile(){
  let data={};try{data=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{}
  const settings={...defaults},source=data.settings||{};
  for(const k of ['muted','bloom','shake','reduced'])if(typeof source[k]==='boolean')settings[k]=source[k];
  if(['high','standard'].includes(source.quality))settings.quality=source.quality;
  if(Number.isFinite(source.volume))settings.volume=Math.max(0,Math.min(100,source.volume));
  if(source.camera==='follow')settings.camera='follow';
  if(source.steering==='directional')settings.steering='directional';
  const best=Number.isSafeInteger(data.best)&&data.best>0?data.best:0;
  const scores=(Array.isArray(data.scores)?data.scores:[]).filter(n=>Number.isSafeInteger(n)&&n>0);
  if(best&&!scores.includes(best))scores.push(best);
  scores.sort((a,b)=>b-a);
  return {settings,best:Math.max(best,scores[0]||0),scores:scores.slice(0,10)};
}
export function saveProfile(profile){try{localStorage.setItem(KEY,JSON.stringify(profile));}catch{}}
