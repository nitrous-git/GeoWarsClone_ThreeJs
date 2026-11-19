import { pen } from './pen.js';
import { N, TAU } from '../game/rules.js';
export function craft(ink,p,t){
  const g=pen(ink,p.x,p.y,p.a,1);
  for(const sign of [-1,1]){
    g.poly([[1.42,.06*sign],[-.59,1.04*sign],[-1.25,.96*sign],[-.94,.49*sign],[.13,.14*sign]],0x142c44,0xc4f9ff,.095);
    g.line(-1.03,.84*sign,-.19,.39*sign,.16,0x42c8ff);
    g.line(-.87,.51*sign,-1.22,.55*sign,.21,0x77edff);
  }
  g.poly([[1.54,0],[-.38,.36],[-.89,0],[-.38,-.36]],0x8bd7ed,0xe8fcff,.09);
  g.poly([[.82,0],[-.30,.155],[-.54,0],[-.3,-.155]],0x162734,null);
  if(p.grace>0){
    const fade=Math.min(1,p.grace*3),a=t*2.5;
    for(let n=0;n<3;n++)ink.arc(p.x,p.y,1.72,a+n*TAU/3,1.52,.078,0xb6f8ff,fade*.75,12);
  }
}
export function glyph(ink,e,t) {
  const {x,y,type}=e,base=e.redline?0xff6f64:N[type].color;
  if(e.warn>0){
    const k=1-e.warn/e.warnTotal, r=e.r+1.7*(1-k);
    for(let n=0;n<4;n++)ink.arc(x,y,r,n*TAU/4+t*1.6,.76,.09,base,.28+k*.62,8);
    ink.stroke(x-.38,y,x+.38,y,.065,base,.7);ink.stroke(x,y-.38,x,y+.38,.065,base,.7);return;
  }
  if(type==='well')return;
  const g=pen(ink,x,y,e.a,e.type==='hunter'?1.05:1),bright=e.hit>0?0xffffff:base;
  if(type==='hunter'){
    g.poly([[1.15,0],[0,.85],[-1.12,0],[0,-.85]],0x0e3756,bright,.13);
    g.poly([[.77,0],[-.09,.47],[-.65,0],[-.09,-.47]],0x195976,0x82ecff,.075);
    g.line(-.65,0,.77,0,.073,bright);
    g.line(-.09,-.47,-.09,.47,.06,bright);
  }else if(type==='spinner'){
    if(e.redline && e.charge>0){
      const dx=Math.cos(e.lock),dy=Math.sin(e.lock);
      for(let i=1;i<13;i++)ink.stroke(x+dx*i*1.5,y+dy*i*1.5,x+dx*(i*1.5+.75),y+dy*(i*1.5+.75),
        .085,0xff8265,Math.min(1,1.25-e.charge));
      ink.ring(x,y,1.48+e.charge*.9,.075,0xff8b70,.8,24);
    }
    for(let n=0;n<4;n++){
      const b=pen(ink,x,y,e.a+n*TAU/4);
      b.poly([[.07,.17],[.54,.89],[1.23,.55],[.45,.25]],0x59203f,bright,.12);
    }
    ink.ring(x,y,.25,.105,0xffb7e0,1,8);
  }else{
    for(const s of [-1,1]){
      g.poly([[1.24,s*.09],[-.15,s*.96],[-1.04,s*.81],[-.34,s*.32]],0x283818,bright,.125);
      g.line(-.7,s*.64,.21,s*.33,.075,0xeffdb9);
    }
    g.poly([[.55,0],[-.33,.18],[-.57,0],[-.33,-.18]],0xf7ffc1,null);
  }
}
export function fluxGlyph(ink,s,t){
  const a=t*2+s.x,fade=Math.min(1,(11-s.age)*2);
  const g=pen(ink,s.x,s.y,a,.31+.035*Math.sin(a*2));
  if(fade<.65 && Math.sin(t*18)<0)return;
  g.poly([[1,0],[0,.7],[-1,0],[0,-.7]],0xffc66e,0xffdf8a,.17);
}

// Soft contact light separates the emissive outlines from the fine lattice.
export function fieldLights(ink,w,t,settings){
  const gain=settings.bloom?(settings.reduced?.53:1):.32;
  if(!w.over)ink.halo(w.player.x,w.player.y,3.25,0x39addc,.28*gain);
  for(const e of w.enemies){
    const readiness=e.warn>0?.33:1;
    const r=e.type==='well'?7.5:2.55;
    ink.halo(e.x,e.y,r,N[e.type].color,readiness*gain*(e.type==='well'?.17:.26));
  }
  for(const b of w.shots)ink.halo(b.x,b.y,.85,0x40bfff,.30*gain);
}
