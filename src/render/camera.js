import { ARENA, clamp } from '../game/rules.js';

// Shared CSS-pixel world projection for WebGL, Canvas 2D and pointer aiming.
export const FOLLOW_ZOOM = 1.65;
const FRAME_X = ARENA.halfWidth + 2.5;
const FRAME_Y = ARENA.halfHeight + 3.5;
const TRACK_RATE = 14;

export class ArenaCamera {
  constructor(settings) {
    this.settings=settings;this.aspect=1;this.mode='static';this.x=0;this.y=0;
    this.sx=0;this.sy=0;this.initialized=false;this.resize(1);
  }
  resize(aspect) {
    this.aspect=Number.isFinite(aspect)&&aspect>0?aspect:1;
    this.size();
  }
  size(){
    const zoom=this.mode==='follow'?FOLLOW_ZOOM:1;
    this.hh=Math.max(FRAME_Y,FRAME_X/this.aspect)/zoom;
    this.hw=this.hh*this.aspect;
    this.maxX=Math.max(0,FRAME_X-this.hw);
    this.maxY=Math.max(0,FRAME_Y-this.hh);
    this.x=clamp(this.x,-this.maxX,this.maxX);
    this.y=clamp(this.y,-this.maxY,this.maxY);
    this.sx=this.x;this.sy=this.y;
  }
  reset(player){
    this.initialized=false;this.x=this.y=this.sx=this.sy=0;
    this.mode=this.settings.camera==='follow'?'follow':'static';this.size();
    if(player)this.update(player,0,0,0);
  }
  update(player,dt,shake,time){
    const mode=this.settings.camera==='follow'?'follow':'static';
    const changed=mode!==this.mode||!this.initialized;
    if(changed){this.mode=mode;this.size();}
    const tx=mode==='follow'?clamp(player.x,-this.maxX,this.maxX):0;
    const ty=mode==='follow'?clamp(player.y,-this.maxY,this.maxY):0;
    const alpha=changed||this.settings.reduced?1:1-Math.exp(-TRACK_RATE*Math.max(0,Math.min(.1,dt)));
    this.x+=(tx-this.x)*alpha;this.y+=(ty-this.y)*alpha;
    this.initialized=true;
    const j=this.settings.shake&&!this.settings.reduced?shake*.45:0;
    this.sx=this.x+j*Math.sin(time*78);this.sy=this.y+j*Math.cos(time*94);
  }
  aim(clientX,clientY,rect,player){
    const x=((clientX-rect.left)/Math.max(1,rect.width)*2-1)*this.hw+this.sx;
    const y=(1-(clientY-rect.top)/Math.max(1,rect.height)*2)*this.hh+this.sy;
    return Math.atan2(y-player.y,x-player.x);
  }
}
