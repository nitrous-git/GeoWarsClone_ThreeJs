// Compatibility path for systems without WebGL 2. The simulation, geometry
// recipes, effects, input, HUD and audio are shared with the Three renderer.
import { ARENA,TAU } from '../game/rules.js';
import { atlas,sprites } from './sprites.js';
import { Effects } from './effects.js';
import { glyph,craft,fluxGlyph,fieldLights,orbitTrails } from './glyphs.js';
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
    this.ink=new CanvasInk(this.c);this.effects=new Effects(settings);this.sheet=atlas();this.glowPlate=document.createElement('canvas');this.images={sky:plate('sky'),well:plate('well')};
    this.sx=0;this.sy=0;this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
  }
  resize(){
    const r=this.canvas.getBoundingClientRect();this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);
    this.dpr=Math.min(devicePixelRatio||1,this.settings.quality==='high'?1.5:1);
    this.canvas.width=Math.max(1,Math.round(this.w*this.dpr));this.canvas.height=Math.max(1,Math.round(this.h*this.dpr));
    this.glowPlate.width=Math.max(1,this.canvas.width>>3);this.glowPlate.height=Math.max(1,this.canvas.height>>3);
    this.scale=Math.min(this.h/69,this.w/109);
  }
  aim(x,y,p){const r=this.canvas.getBoundingClientRect();
    return Math.atan2((this.h*.5-(y-r.top))/this.scale+this.sy-p.y,((x-r.left)-this.w*.5)/this.scale+this.sx-p.x);}
  grid(g){
    const {cols,rows,sx,sy}=g,{halfWidth:W,halfHeight:H}=ARENA,c=this.c;
    const point=(k,j,i,move)=>{
      const x=i*sx-W+g.x[k],y=j*sy-H+g.y[k];if(move)c.moveTo(x,y);else c.lineTo(x,y);
    };
    c.lineWidth=.072;c.strokeStyle='#1b3380';c.globalAlpha=.84;c.beginPath();
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)point(j*cols+i,j,i,i===0);
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)point(j*cols+i,j,i,j===0);
    c.stroke();c.strokeStyle='#536ef2';c.beginPath();
    for(let j=1;j<rows-1;j++)for(let i=1;i<cols-1;i++){
      const k=j*cols+i;if(Math.abs(g.x[k])+Math.abs(g.y[k])<.4)continue;
      point(k-1,j,i-1,true);point(k,j,i,false);point(k+cols,j+1,i,false);
    }
    c.stroke();c.globalAlpha=1;
  }
  menu(t){
    const {w,h,c}=this, time=this.settings.reduced?t*.1:t;
    // A blue accretion study floats above a perspective grid. The procedural
    // atmosphere and near stars move independently of the distant plate.
    const x=w*.84,y=h*.18,r=Math.min(w*.18,h*.25);
    c.save();
    const haze=c.createRadialGradient(x,y,r*.36,x,y,r*2.85);
    haze.addColorStop(0,'#586eff66');haze.addColorStop(.41,'#152b9147');haze.addColorStop(1,'#06134000');
    c.fillStyle=haze;c.fillRect(0,0,w,h);
    const planet=c.createRadialGradient(x-r*.66,y+r*.65,r*.05,x,y,r);
    planet.addColorStop(0,'#304573');planet.addColorStop(.62,'#12224a');planet.addColorStop(.96,'#0a122c');planet.addColorStop(1,'#5496ea');
    c.fillStyle=planet;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
    c.save();c.translate(x,y);c.rotate(-.30);
    for(let i=0;i<22;i++){
      const radius=r*(1.15+i*.0205);c.beginPath();
      c.ellipse(0,0,radius,radius*.205,0,-.18,Math.PI+.20);
      c.strokeStyle=i%5===0?'#9edcff':'#737cf7';c.lineWidth=i%5===0?1.8:.65;c.globalAlpha=.28+.3*Math.sin(i*1.9)**2;c.stroke();
    }
    c.restore();
    const horizon=h*.70,vanish=w*.5;
    c.strokeStyle='#465bda';c.lineWidth=1;c.beginPath();
    for(let i=-17;i<=17;i++){c.moveTo(vanish+i*w*.009,horizon+2);c.lineTo(vanish+i*w*.114,h);}
    for(let i=0;i<14;i++){
      const phase=((i+time*.18)%14)/14,yy=horizon+(h-horizon)*phase**2.4;
      c.moveTo(0,yy);c.lineTo(w,yy);
    }
    c.globalAlpha=.37;c.stroke();
    const fog=c.createLinearGradient(0,horizon-15,0,h);
    fog.addColorStop(0,'#080e1e00');fog.addColorStop(.055,'#111a39e0');fog.addColorStop(.23,'#0a123455');fog.addColorStop(1,'#0b154000');
    c.globalAlpha=1;c.fillStyle=fog;c.fillRect(0,horizon-15,w,h-horizon+15);
    for(let i=0;i<90;i++){
      const xx=((i*.618034+time*.0014)%1)*w,yy=((i*.382741+time*.0019)%1)*h;
      c.fillStyle=i%3?'#90bbff':'#e1f6ff';c.globalAlpha=.23+.36*Math.sin(i+time*.4)**2;c.fillRect(xx,yy,i%4?1.1:2,1.2);
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
        orbitTrails(ink,e,this.settings.quality==='standard');
      }else{c.shadowBlur=glow?4:0;c.shadowColor='#477081';glyph(ink,e,t);}
    }
    c.shadowBlur=0;
    for(const s of w.shards)fluxGlyph(ink,s,t);
    if(this.sheet.naturalWidth)sprites(w,(tile,x,y,a,sw,sh)=>{
      c.save();c.globalAlpha=1;c.translate(x,y);c.rotate(a);c.scale(1,-1);
      c.shadowBlur=glow?5:0;c.shadowColor=tile===5?'#ff9225':'#6cafff';
      c.drawImage(this.sheet,tile*64,0,64,64,-sw/2,-sh/2,sw,sh);c.restore();
    });
    if(!w.over)craft(ink,w.player,t);
    c.globalCompositeOperation='lighter';this.effects.draw(ink,this.settings.reduced);c.restore();
    if(glow){
      const glowCtx=this.glowPlate.getContext('2d');
      glowCtx.drawImage(this.canvas,0,0,this.glowPlate.width,this.glowPlate.height);
      c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.66;
      c.filter='blur(3px)';c.drawImage(this.glowPlate,0,0,this.w,this.h);c.restore();
    }
  }
  dispose(){this.observer.disconnect();}
}
