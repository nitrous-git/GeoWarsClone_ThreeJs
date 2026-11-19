import { TAU,N,clamp } from '../game/rules.js';
const MAX=2600;
export class Effects {
  constructor() {
    this.pool=Array.from({length:MAX},()=>({life:0}));this.reset();
  }
  reset(){
    this.head=0;this.tick=0;this.flares=[];this.rings=[];this.delayed=[];this.shake=0;
    for(const p of this.pool)p.life=0;
  }
  spark(x,y,a,v,c,life,width,length,drag=3,spin=0){
    const p=this.pool[this.head];this.head=(this.head+1)%MAX;
    Object.assign(p,{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,c,life,max:life,width,length,drag,spin});
  }
  burst(x,y,n,c,speed,kind=''){
    const rotation=Math.random()*TAU;
    for(let i=0;i<n;i++){
      let a=rotation+Math.random()*TAU;
      if(kind==='spinner')a=rotation+(i%4)*TAU/4+(Math.random()-.5)*.43;
      if(kind==='hunter'&&i%3===0)a=rotation+(i%6)*TAU/6;
      const v=(.2+Math.random()*.8)*speed;
      this.spark(x,y,a,v,i%6===0?0xfff7de:c,.22+Math.random()*.77,.065+Math.random()*.14,.40+v*.057,
        2.3+Math.random()*1.7,kind==='spinner'?2.7:kind==='well'?(Math.random()-.5)*3:0);
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
      this.flare(x,y,0x55dbff,.95,.085);
      for(let i=0;i<6;i++)this.spark(x,y,e.a+(Math.random()-.5)*1.7,4+Math.random()*13,
        i%2?0xbafaff:0x43c9ff,.06+Math.random()*.11,.09,.42);
    }else if(type==='burst'){
      const well=kind==='well';
      this.flare(x,y,c,well?12:4.1,well?.58:.34);
      this.burst(x,y,well?190:kind==='spinner'?72:54,c,well?58:32,kind);
      if(!well){
        const phase=Math.random()*TAU;
        for(let i=0;i<9;i++)this.spark(x,y,phase+i*TAU/9,19+Math.random()*17,0xffebc0,.23+Math.random()*.22,.13,2.3,2.7);
      }
      if(kind==='stalker'){
        for(let i=0;i<22;i++)this.spark(x,y,e.a+Math.PI+(i%2?.39:-.39)+(Math.random()-.5)*.18,
          12+Math.random()*21,0xd7ff84,.38+Math.random()*.25,.11,1.2,3);
      }
      this.ring(x,y,well?14:3.4,c,well?.83:.36);
      if(well){this.ring(x,y,8,0xffe5ba,.4);this.delayed.push({x,y,wait:.13,c});}
      this.shake=Math.max(this.shake,well?.72:.12);
    }else if(type==='pulse'||type==='death'||type==='damage'){
      const death=type==='death',pulse=type==='pulse',color=pulse?0xe5ffa0:death?0xffb377:0xff8466;
      this.flare(x,y,color,pulse?9:death?12:5,pulse?.42:.55);
      this.ring(x,y,pulse?15.5:death?13:6,color,.56);this.ring(x,y,pulse?12:4,0xc6faff,.32);
      this.burst(x,y,pulse?100:death?145:56,color,death?38:28);
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
      this.spark(b.x,b.y,a,2.6,0x369fd9,.075,.095,.85,.5);
    }
    if(this.tick%4!==0)return;
    for(const e of world.enemies){
      if(e.type==='well'||e.warn>0)continue;
      const a=Math.atan2(e.vy,e.vx)+Math.PI;
      this.spark(e.x+Math.cos(a)*.75,e.y+Math.sin(a)*.75,a,2.2,N[e.type].color,.26,.10,.52,2);
    }
  }
  exhaust(p){
    const speed=Math.hypot(p.vx,p.vy),a=p.a+Math.PI,c=Math.cos(a),s=Math.sin(a);
    for(const side of [-1,1]) {
      const x=p.x+c*.94-s*side*.59,y=p.y+s*.94+c*side*.59;
      this.spark(x,y,a+(Math.random()-.5)*.29,7+speed*.76,Math.random()<.35?0xd1fcff:0x38aaff,
        .18+Math.random()*.27,.15+Math.random()*.15,.86,2);
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
