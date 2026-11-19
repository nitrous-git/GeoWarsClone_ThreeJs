// Compatibility path for systems without WebGL 2. The simulation, geometry
// recipes, effects, input, HUD and audio are shared with the Three renderer.
import { ARENA,TAU } from '../game/rules.js';
import { Effects } from './effects.js';
import { glyph,craft,fluxGlyph,fieldLights } from './glyphs.js';
import { border } from './border.js';
const colors=new Map(), lights=new Map();
function color(n){
  if(!colors.has(n))colors.set(n,'#'+n.toString(16).padStart(6,'0'));return colors.get(n);
}
class CanvasInk {
  constructor(c){this.c=c;}
  triangle(x,y,u,v,j,k,col,a=1){
    const c=this.c;c.fillStyle=color(col);c.globalAlpha=a;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.lineTo(j,k);c.fill();
  }
  stroke(x,y,u,v,w,col,a=1,tail=a){
    const c=this.c;c.strokeStyle=color(col);c.globalAlpha=(a*3+tail)*.25;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(u,v);c.stroke();
  }
  halo(x,y,r,col,alpha=.25){
    if(!lights.has(col)){
      const tile=document.createElement('canvas');tile.width=tile.height=64;
      const ctx=tile.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,color(col));g.addColorStop(.4,color(col)+'88');g.addColorStop(1,color(col)+'00');
      ctx.fillStyle=g;ctx.fillRect(0,0,64,64);lights.set(col,tile);
    }
    this.c.globalAlpha=alpha;this.c.drawImage(lights.get(col),x-r,y-r,2*r,2*r);
  }
  arc(x,y,r,start,span,w,col,a=1){
    const c=this.c;c.globalAlpha=a;c.lineWidth=w;c.strokeStyle=color(col);c.beginPath();c.arc(x,y,r,start,start+span);c.stroke();
  }
  ring(x,y,r,w,col,a=1){this.arc(x,y,r,0,TAU,w,col,a);}
}
function plate(name){
  const img=new Image();img.src=new URL('../../assets/field/'+name+'.webp',import.meta.url).href;return img;
}
export class CanvasDisplay {
  constructor(canvas,world,settings){
    this.canvas=canvas;this.settings=settings;this.c=canvas.getContext('2d',{alpha:false});
    if(!this.c)throw new Error('Canvas unavailable');
    this.ink=new CanvasInk(this.c);this.effects=new Effects();this.images={study:plate('study'),sky:plate('sky'),well:plate('well')};
    this.sx=0;this.sy=0;this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
  }
  resize(){
    const r=this.canvas.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);
    this.dpr=Math.min(devicePixelRatio||1,this.settings.quality==='high'?1.5:1);
    this.canvas.width=Math.max(1,Math.round(this.w*this.dpr));this.canvas.height=Math.max(1,Math.round(this.h*this.dpr));
    this.scale=Math.min(this.h/69,this.w/109);
  }
  aim(x,y,p){const r=this.canvas.getBoundingClientRect();
    return Math.atan2((this.h*.5-(y-r.top))/this.scale+this.sy-p.y,((x-r.left)-this.w*.5)/this.scale+this.sx-p.x);}
  grid(g){
    const {cols,rows,sx,sy}=g,{halfWidth:W,halfHeight:H}=ARENA,c=this.c;
    const point=(k,j,i,move)=>{
      const x=i*sx-W+g.x[k],y=j*sy-H+g.y[k];if(move)c.moveTo(x,y);else c.lineTo(x,y);
    };
    c.lineWidth=.072;c.strokeStyle='#244052';c.globalAlpha=.84;c.beginPath();
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)point(j*cols+i,j,i,i===0);
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)point(j*cols+i,j,i,j===0);
    c.stroke();c.strokeStyle='#3988a9';c.beginPath();
    for(let j=1;j<rows-1;j++)for(let i=1;i<cols-1;i++){
      const k=j*cols+i;if(Math.abs(g.x[k])+Math.abs(g.y[k])<.4)continue;
      point(k-1,j,i-1,true);point(k,j,i,false);point(k+cols,j+1,i,false);
    }
    c.stroke();c.globalAlpha=1;
  }
  menu(t){
    const {w,h,c}=this,img=this.images.study,small=innerWidth<=680;
    if(!img.naturalWidth)return;
    const rad=small?Math.min(h*.115,w*.19):Math.min(h*.163,w*.125);
    const iw=1600*rad/(960*.163),ih=960*rad/(960*.163);
    const x=(small?.69:.727)*w,y=(small?.308:.474)*h;
    c.drawImage(img,x-iw*.727,y-ih*.474,iw,ih);
    // Slow orbit tracers keep the pre-rendered plate legible on software GPUs.
    c.save();c.translate(x,y);c.rotate(-.27);
    const seconds=this.settings.reduced?t*.12:t;
    for(let i=0;i<46;i++){
      const a=i*2.39996+seconds*(.038+(i%5)*.004),r=rad*(1.22+(i%13)*.145);
      c.fillStyle=i%3?'#e39357':'#ffce93';c.globalAlpha=.32+(i%5)*.07;
      c.beginPath();c.ellipse(Math.cos(a)*r,Math.sin(a)*r*.238,.7+i%3*.36,.6,0,0,TAU);c.fill();
    }
    c.restore();
  }
  render(w,menu,t){
    const c=this.c,ink=this.ink,glow=this.settings.bloom&&!this.settings.reduced;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.fillStyle='#081015';c.fillRect(0,0,this.w,this.h);
    if(this.images.sky.naturalWidth){
      const img=this.images.sky,k=Math.max(this.w/img.width,this.h/img.height);
      c.drawImage(img,(this.w-img.width*k)*.5,(this.h-img.height*k)*.5,img.width*k,img.height*k);
    }
    if(menu){this.menu(t);return;}
    const j=this.settings.shake&&!this.settings.reduced?this.effects.shake*.45:0;
    this.sx=j*Math.sin(t*78);this.sy=j*Math.cos(t*94);
    c.save();c.translate(this.w/2,this.h/2);c.scale(this.scale,-this.scale);c.translate(-this.sx,-this.sy);
    this.grid(w.grid);border(ink);
    c.globalCompositeOperation='lighter';fieldLights(ink,w,t,this.settings);c.globalCompositeOperation='source-over';
    for(const e of w.enemies){
      if(e.type==='well'&&e.warn<=0&&this.images.well.naturalWidth){
        c.save();c.translate(e.x,e.y);c.scale(1,-1);c.globalAlpha=1;c.drawImage(this.images.well,-7.1,-7.1,14.2,14.2);c.restore();
        for(let i=0;i<20;i++){const a=i*2.39996+t*(i%2?.67:.48),r=2.2+(i%9)*.39;
          const x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r*.62;ink.stroke(x,y,x+Math.sin(a)*.19,y-Math.cos(a)*.14,.077,0xffbc83,.82);}
      }else{c.shadowBlur=glow?4:0;c.shadowColor='#477081';glyph(ink,e,t);}
    }
    c.shadowBlur=0;
    for(const s of w.shards)fluxGlyph(ink,s,t);
    for(const b of w.shots){
      const len=Math.hypot(b.vx,b.vy)||1,dx=b.vx/len,dy=b.vy/len;
      ink.stroke(b.x,b.y,b.x-dx*2.1,b.y-dy*2.1,.36,0x3399da,.65,.1);
      ink.stroke(b.x+dx*.2,b.y+dy*.2,b.x-dx,b.y-dy,.15,0xd8ffff);
    }
    if(!w.over)craft(ink,w.player,t);
    c.globalCompositeOperation='lighter';this.effects.draw(ink,this.settings.reduced);c.restore();
  }
  dispose(){this.observer.disconnect();}
}
