import { TAU,N,clamp,PULSE_RADIUS,PULSE_DURATION } from '../game/rules.js';
export const PARTICLE_CAPACITY=11000;
const spectrum=[0x54dfff,0xa481ff,0xfe69ca,0xffb43f,0x92ffb4,0xffe8be];
export class Effects {
  constructor(settings={}) {
    this.settings=settings;
    this.pool=Array.from({length:PARTICLE_CAPACITY},()=>({life:0}));this.reset();
  }
  reset(){
    this.head=0;this.tick=0;this.flares=[];this.rings=[];this.delayed=[];this.shake=0;
    for(const p of this.pool)p.life=0;
  }
  spark(x,y,a,v,c,life,width,length,drag=3,spin=0){
    const p=this.pool[this.head];this.head=(this.head+1)%PARTICLE_CAPACITY;
    Object.assign(p,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c,life,max:life,width,length,drag,spin});
  }
  burst(x,y,n,c,speed,kind=''){
    n=Math.max(1,Math.round(n*(this.settings.quality==='standard'?.48:1)*(this.settings.reduced?.42:1)));
    const rotation=Math.random()*TAU;
    for(let i=0;i<n;i++){
      let a=rotation+Math.random()*TAU;
      if(kind==='spinner')a=rotation+(i%4)*TAU/4+(Math.random()-.5)*.43;
      if(kind==='hunter'&&i%3===0)a=rotation+(i%6)*TAU/6;
      const v=(.12+Math.random()*.88)*speed;
      const tint=i%7===0?0xfffbf1:i%3===0||kind==='nova'?spectrum[i%spectrum.length]:c;
      this.spark(x,y,a,v,tint,.25+Math.random()*(kind==='nova'?1.1:.79),.055+Math.random()*.13,.31+v*.036,
        (kind==='nova'?.72:1.45)+Math.random()*1.6,kind==='spinner'?2.7:kind==='well'?(Math.random()-.5)*3:0);
    }
  }
  flare(x,y,c,size,life){
    if(this.flares.length<96)this.flares.push({x,y,c,size,life,max:life});
  }
  ring(x,y,end,c,duration=.5) {
    if(this.rings.length<100)this.rings.push({x,y,end,c,duration,age:0});
  }
  event(e){
    const {type,x,y,kind}=e,c=N[kind]?.color||0x7aeaff;
    if(type==='shot'){
      this.flare(x,y,0xffc16b,1.25,.085);
      for(let i=0;i<6;i++)this.spark(x,y,e.a+(Math.random()-.5)*1.7,4+Math.random()*13,
        i%2?0xffefaa:0xff9b32,.06+Math.random()*.11,.09,.42);
    }else if(type==='burst'){
      const well=kind==='well';
      this.flare(x,y,c,well?12:4.1,well?.58:.34);
      this.burst(x,y,well?680:kind==='spinner'?185:140,c,well?79:46,kind);
      if(!well){
        const phase=Math.random()*TAU;
        for(let i=0;i<9;i++)this.spark(x,y,phase+i*TAU/9,19+Math.random()*17,0xffebc0,.23+Math.random()*.22,.13,2.3,2.7);
      }
      if(kind==='snake'&&e.links){
        for(let i=0;i<e.links.length;i+=2){
          const link=e.links[i];this.burst(link.x,link.y,28,0xffac3d,32,'snake');
          this.flare(link.x,link.y,0xffa83a,1.5,.24);
        }
      }
      if(kind==='stalker'){
        for(let i=0;i<22;i++)this.spark(x,y,e.a+Math.PI+(i%2?.39:-.39)+(Math.random()-.5)*.18,
          12+Math.random()*21,0xd7ff84,.38+Math.random()*.25,.11,1.2,3);
      }
      this.ring(x,y,well?14:3.4,c,well?.83:.36);
      if(well){this.ring(x,y,8,0xffe5ba,.4);this.delayed.push({x,y,wait:.13,c});}
      this.shake=Math.max(this.shake,well?.72:.12);
    }else if(type==='pulse'||type==='death'||type==='damage'){
      const death=type==='death',pulse=type==='pulse',color=pulse?0xadcdff:death?0xffb377:0xff8466;
      this.flare(x,y,color,pulse?20:death?14:5,pulse?.42:.55);
      this.ring(x,y,pulse?PULSE_RADIUS:death?18:6,color,pulse?PULSE_DURATION:.58);
      this.ring(x,y,pulse?PULSE_RADIUS*.96:4,0x6bdfff,pulse?PULSE_DURATION*1.06:.32);
      if(pulse)this.ring(x,y,PULSE_RADIUS*.86,0xbe8cff,1.23);
      this.burst(x,y,pulse?4800:death?640:85,color,pulse?128:death?62:32,pulse?'nova':'');
      this.shake=death?.95:.6;
    }else if(type==='arrive'||type==='impact'||type==='wall'){
      this.burst(x,y,type==='arrive'?9:5,c,type==='arrive'?5:9);
    }else if(type==='upgrade'){this.ring(x,y,6,0xd8ff74,.65);this.burst(x,y,28,0xe1ff8c,13);}
  }
  advance(dt){
    this.shake*=Math.exp(-8*dt);
    for(const p of this.pool){
      if(p.life<=0)continue;p.life-=dt;
      const k=Math.exp(-p.drag*dt), vx=p.vx,spin=p.spin*dt;
      p.vx=(vx-p.vy*spin)*k;p.vy=(p.vy+vx*spin)*k;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
    }
    for(const f of this.flares)f.life-=dt;
    this.flares=this.flares.filter(f=>f.life>0);
    for(const r of this.rings)r.age+=dt;
    this.rings=this.rings.filter(r=>r.age<r.duration);
    for(const d of this.delayed){d.wait-=dt;if(d.wait<=0){this.burst(d.x,d.y,105,d.c,28,'well');this.ring(d.x,d.y,18,d.c,.74);}}
    this.delayed=this.delayed.filter(d=>d.wait>0);
  }
  wakes(world){
    this.exhaust(world.player);this.tick++;
    if(this.tick%2!==0)return;
    for(const b of world.shots){
      const a=Math.atan2(b.vy,b.vx);
      this.spark(b.x,b.y,a,2.6,0xff942e,.16,.12,1.15,.5);
    }
    if(this.tick%4!==0)return;
    for(const e of world.enemies){
      if(e.type==='well'||e.warn>0)continue;
      const a=Math.atan2(e.vy,e.vx)+Math.PI;
      this.spark(e.x+Math.cos(a)*.75,e.y+Math.sin(a)*.75,a,2.2,N[e.type].color,.26,.10,.52,2);
    }
  }
  exhaust(p){
    const thrust=p.throttle||0;
    if(thrust<.025)return;
    const a=p.a+Math.PI,c=Math.cos(a),s=Math.sin(a);
    for(const side of [-1,1]){
      const x=p.x+c*.87-s*side*.63,y=p.y+s*.87+c*side*.63;
      const oscillation=side*Math.sin(this.tick*.38)*.27;
      this.spark(x,y,a+oscillation+(Math.random()-.5)*.16,9+thrust*22,0x4299ff,
        .13+thrust*.29,.15,.94,2,side*Math.sin(this.tick*.2)*2);
      this.spark(x,y,a,5+thrust*18,0xd4fdff,.11+thrust*.12,.16,.65,2);
    }
  }
  draw(ink,reduce){
    for(const f of this.flares){
      const k=f.life/f.max,bright=reduce?.32:1;
      ink.halo(f.x,f.y,f.size*(1.4-.55*k),f.c,k*k*.78*bright);
      ink.halo(f.x,f.y,f.size*.31*k+.08,0xfff2c9,k*.95*bright);
      if(f.size>2)ink.stroke(f.x-f.size*.7*k,f.y,f.x+f.size*.7*k,f.y,.05+.08*k,f.c,k*bright);
    }
    for(const p of this.pool){
      if(p.life<=0)continue;
      const speed=Math.max(.01,Math.hypot(p.vx,p.vy)),k=p.length*(.25+.75*p.life/p.max)/speed;
      ink.stroke(p.x,p.y,p.x-p.vx*k,p.y-p.vy*k,p.width,p.c,(reduce?.6:1)*clamp(p.life/p.max*2,0,1),.025);
    }
    for(const r of this.rings){
      const t=r.age/r.duration,rad=.18+r.end*(1-(1-t)**2);
      ink.ring(r.x,r.y,rad,.055+.18*(1-t),r.c,(1-t)*(reduce?.48:.9),72);
    }
  }
}
