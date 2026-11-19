const dead=v=>Math.abs(v)<.16?0:v;
export class Controls {
  constructor(canvas,actions,settings){
    this.settings=settings;this.actions=actions;this.keys=new Set();this.pointer=null;this.fire=false;this.pulse=false;
    this.device='Keyboard + mouse';this.sticks=new Map();this.padButtons=[];this.abort=new AbortController();
    const bind=(el,name,fn)=>el.addEventListener(name,fn,{signal:this.abort.signal});
    bind(window,'keydown',e=>{
      const {code}=e;
      if(code==='Escape'){e.preventDefault();if(!e.repeat)actions.back();return;}
      if(e.target.matches('input, select, textarea'))return;
      if(actions.playing()&&['ArrowUp','ArrowRight','ArrowDown','ArrowLeft','Space'].includes(code))e.preventDefault();
      this.keys.add(code);if(['KeyW','KeyA','KeyD','KeyS'].includes(code))this.device='Keyboard + mouse';
      if(e.repeat)return;
      if(code==='KeyP'&&actions.canTogglePause())actions.back();
      if(code==='Space'&&actions.playing()){this.pulse=true;this.device='Keyboard + mouse';}
      if(code==='Enter'&&!e.target.closest('button'))actions.confirm();
    });
    bind(window,'keyup',e=>this.keys.delete(e.code));
    bind(canvas,'pointermove',e=>{
      if(e.pointerType==='touch'){this.moveStick(e);return;}
      this.pointer=[e.clientX,e.clientY];if(actions.playing())this.device='Keyboard + mouse';
    });
    bind(canvas,'pointerdown',e=>{
      if(!actions.playing())return;
      canvas.setPointerCapture(e.pointerId);
      if(e.pointerType==='touch'){
        const r=canvas.getBoundingClientRect(),side=e.clientX-r.left<r.width*.5?'move':'aim';
        if([...this.sticks.values()].some(s=>s.side===side))return;
        this.sticks.set(e.pointerId,{side,x:e.clientX,y:e.clientY,dx:0,dy:0});this.device='Touch sticks';this.moveStick(e);return;
      }
      this.pointer=[e.clientX,e.clientY];if(e.button===0)this.fire=true;
      if(e.button===2)this.pulse=true;this.device='Keyboard + mouse';
    });
    const release=e=>{
      if(this.sticks.has(e.pointerId)){
        const s=this.sticks.get(e.pointerId);actions.stick(s.side,null);this.sticks.delete(e.pointerId);
      }
      if(e.button===0 || e.type==='pointercancel')this.fire=false;
    };
    bind(canvas,'pointerup',release);bind(canvas,'pointercancel',release);bind(canvas,'lostpointercapture',release);
    bind(canvas,'contextmenu',e=>e.preventDefault());
    bind(window,'blur',()=>{this.clear();if(actions.playing())actions.pause();});
    bind(document,'visibilitychange',()=>{if(document.hidden){this.clear();if(actions.playing())actions.pause();}});
  }
  moveStick(e){
    const s=this.sticks.get(e.pointerId);if(!s)return;
    const dx=e.clientX-s.x,dy=e.clientY-s.y,range=43,scale=Math.max(1,Math.hypot(dx,dy)/range);
    s.dx=dx/scale/range;s.dy=-dy/scale/range;this.actions.stick(s.side,s);
  }
  clear(){
    this.keys.clear();this.fire=false;this.pulse=false;this.sticks.clear();
    this.actions.stick('move',null);this.actions.stick('aim',null);
  }
  pollPad(){
    let pads;try{pads=navigator.getGamepads?.();}catch{}
    const pad=pads&&Array.from(pads).find(p=>p?.connected&&p.mapping==='standard');
    if(!pad){this.pad=null;this.padButtons=[];return;}
    const down=pad.buttons.map(b=>b.pressed),pressed=i=>down[i]&&!this.padButtons[i];
    this.padButtons=down;this.pad=pad;
    if(pressed(9)){this.device='Gamepad';this.actions.backOrStart();}
    else if(pressed(0)&&!this.actions.playing()){this.device='Gamepad';this.actions.confirm();}
    else if(pressed(4)||pressed(5))this.pulse=true;
  }
  sample(player,display){
    const k=this.keys;let mx=+k.has('KeyD')-+k.has('KeyA'),my=+k.has('KeyW')-+k.has('KeyS');
    let a=this.pointer&&this.device==='Keyboard + mouse'?display.aim(...this.pointer,player):player.aim,fire=this.fire;
    const ax=+k.has('ArrowRight')-+k.has('ArrowLeft'),ay=+k.has('ArrowUp')-+k.has('ArrowDown');
    if(ax||ay){a=Math.atan2(ay,ax);fire=true;}
    if(this.pad){
      const p=this.pad,px=dead(p.axes[0]||0),py=dead(p.axes[1]||0),rx=dead(p.axes[2]||0),ry=dead(p.axes[3]||0);
      if(px||py||rx||ry||p.buttons[7]?.pressed){this.device='Gamepad';mx+=px;my-=py;
        if(Math.hypot(rx,ry)>.22){a=Math.atan2(-ry,rx);fire=true;}else {a=player.aim;fire ||= !!p.buttons[7]?.pressed;}}
    }
    for(const s of this.sticks.values()){
      if(s.side==='move'){mx+=s.dx;my+=s.dy;}
      else if(Math.hypot(s.dx,s.dy)>.12){a=Math.atan2(s.dy,s.dx);fire=true;}
    }
    const pulse=this.pulse;this.pulse=false;const input={mx,my,a,fire,pulse};
    if(this.device==='Keyboard + mouse' && this.settings.steering!=='directional'){
      input.turn=+k.has('KeyA')-+k.has('KeyD');input.thrust=k.has('KeyW');
    }
    return input;
  }
  dispose(){this.abort.abort();this.clear();}
}
