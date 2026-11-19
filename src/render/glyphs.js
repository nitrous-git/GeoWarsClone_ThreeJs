import { pen } from './pen.js';
import { N, TAU } from '../game/rules.js';

export function craft(ink,p,t){
  const dx=Math.cos(p.aim),dy=Math.sin(p.aim);
  ink.stroke(p.x+dx*1.85,p.y+dy*1.85,p.x+dx*2.25,p.y+dy*2.25,.10,0xa2faff,.8);
  if(p.grace>0){
    for(let n=0;n<3;n++)ink.arc(p.x,p.y,1.78,t*2.5+n*TAU/3,1.52,.09,0xa6edff,Math.min(.8,p.grace*2),12);
  }
}
function serpent(ink,e){
  const body=e.spine.links;
  for(let i=body.length-1;i>=0;i--){
    const link=body[i], size=.44+.54*(1-i/26);
    const g=pen(ink,link.x,link.y,link.a,size);
    g.poly([[.52,0],[-.41,.47],[-.22,0],[-.41,-.47]],0x60200b,0xffa92c,.15);
    g.line(.45,0,-.27,.32,.078,0xffebaa);
  }
  const head=pen(ink,e.x,e.y,e.a);
  head.poly([[1.18,0],[.16,.72],[-.75,.54],[-.34,0],[-.75,-.54],[.16,-.72]],0x30234e,e.hit>0?0xffffff:0xc4adff,.19);
  head.line(.79,0,.06,0,.22,0xeaffff);
}
export function glyph(ink,e,t){
  const {x,y,type}=e,base=e.redline?0xff6f64:N[type].color;
  if(e.warn>0){
    const k=1-e.warn/e.warnTotal,r=e.r+1.7*(1-k);
    for(let n=0;n<4;n++)ink.arc(x,y,r,n*TAU/4+t*1.6,.76,.09,base,.28+k*.62,8);
    ink.stroke(x-.38,y,x+.38,y,.065,base,.7);ink.stroke(x,y-.38,x,y+.38,.065,base,.7);return;
  }
  if(e.spine)serpent(ink,e);
  if(e.redline && e.charge>0){
    const dx=Math.cos(e.lock),dy=Math.sin(e.lock);
    for(let i=1;i<13;i++)ink.stroke(x+dx*i*1.5,y+dy*i*1.5,x+dx*(i*1.5+.75),y+dy*(i*1.5+.75),.085,0xff8265,Math.min(1,1.25-e.charge));
    ink.ring(x,y,1.48+e.charge*.9,.075,0xff8b70,.8,24);
  }
}
export function orbitTrails(ink,e,standard){
  for(let i=0;i<e.orbits.length;i+=standard?2:1){
    const p=e.orbits[i],h=p.history;
    ink.stroke(e.x+p.x,e.y+p.y,e.x+p.x-p.vx*.036,e.y+p.y-p.vy*.036,.14,p.color,1,.85);
    let x=p.x,y=p.y;
    for(let k=0;k<8;k+=2){
      ink.stroke(e.x+x,e.y+y,e.x+h[k],e.y+h[k+1],.072,p.color,1-k*.12,.77-k*.10);
      x=h[k];y=h[k+1];
    }
  }
}
export function fluxGlyph(ink,s,t){
  const a=t*2+s.x,fade=Math.min(1,(11-s.age)*2);
  const g=pen(ink,s.x,s.y,a,.31+.035*Math.sin(a*2));
  if(fade<.65 && Math.sin(t*18)<0)return;
  g.poly([[1,0],[0,.7],[-1,0],[0,-.7]],0xffc66e,0xffdf8a,.17);
}
export function fieldLights(ink,w,t,settings){
  const gain=settings.bloom?(settings.reduced?.53:1):.32;
  if(!w.over)ink.halo(w.player.x,w.player.y,3.25,0x419bff,.28*gain);
  for(const e of w.enemies){
    const r=e.type==='well'?8.5:2.65;
    ink.halo(e.x,e.y,r,N[e.type].color,(e.warn>0?.33:1)*gain*.30);
    if(e.spine)for(let i=0;i<e.spine.links.length;i+=3){
      const link=e.spine.links[i];ink.halo(link.x,link.y,1.45,0xff750f,gain*.25);
    }
  }
  for(const b of w.shots){
    const dx=b.vx/65,dy=b.vy/65;
    ink.stroke(b.x,b.y,b.x-3.8*dx,b.y-3.8*dy,.58,0xff861e,gain*.65,0);
    ink.halo(b.x,b.y,1.55,0xff9a22,.46*gain);
  }
}
