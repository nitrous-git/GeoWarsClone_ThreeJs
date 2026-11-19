import { ARENA, N, TAU, WEAPONS, PULSE_TIME, clamp, rng } from './rules.js';
import { createSpine, advanceSpine, createOrbits, advanceOrbits } from './creatures.js';
import { PULSE_RADIUS, PULSE_DURATION } from './rules.js';
import { Director } from './director.js';
import { Lattice } from './lattice.js';
import { SpatialBins, segmentCircle } from './spatial.js';

const {halfWidth:W,halfHeight:H}=ARENA;
const compact=items=>{let n=0;for(const item of items) if(!item.dead)items[n++]=item;items.length=n;};
function steer(e, a, speed, gain) {
  e.vx+=(Math.cos(a)*speed-e.vx)*gain;
  e.vy+=(Math.sin(a)*speed-e.vy)*gain;
}
export class World {
  constructor(seed=Date.now()) {
    this.grid=new Lattice();this.director=new Director();this.bins=new SpatialBins();this.reset(seed);
  }
  reset(seed=Date.now()) {
    this.random=rng(seed);this.time=0;this.score=0;this.kills=0;this.flux=0;this.chain=0;
    this.mult=1;this.maxMult=1;this.tier=0;this.over=false;this.sequence=0;
    this.player={x:0,y:0,vx:0,vy:0,a:Math.PI/2,aim:Math.PI/2,throttle:0,hull:3,grace:1.5,fire:0,pulse:0};
    this.wave=null;this.enemies=[];this.shots=[];this.shards=[];this.events=[];
    this.director.reset();this.grid.reset();this.bins.build([]);
  }
  spawn(type,x,y,delay=0) {
    if(this.enemies.length>=84) return;
    const p=this.player;
    // Mirror a close arrival through the arena center, including interior wells.
    if(Math.hypot(x-p.x,y-p.y)<15) {
      if(Math.hypot(-x-p.x,-y-p.y)>=15){x=-x;y=-y;}
      else x=p.x>0?-W*.62:W*.62;
    }
    const a=Math.atan2(-y,-x)+(this.random()-.5)*1.4;
    const warn=(type==='well'?1.6:.95)+delay;
    const e={id:++this.sequence,type,x,y,a,vx:Math.cos(a)*8,vy:Math.sin(a)*8,
      r:N[type].radius,hp:N[type].hp,warn,warnTotal:warn,hit:0,dodge:0,dodgeDir:1,
      dodgeTime:0,age:0,phase:this.random()*TAU,dead:false};
    if(type==='spinner' && this.director.sector>=3 && e.id%3===0){
      e.redline=true;e.charge=0;e.dash=0;e.nextDash=1.1+this.random()*1.4;
    }
    if(type==='snake')e.spine=createSpine(x,y);
    if(type==='well')e.orbits=createOrbits(e.phase);
    this.enemies.push(e);return e;
  }
  volley() {
    const p=this.player,weapon=WEAPONS[this.tier],x=p.x+1.25*Math.cos(p.aim),y=p.y+1.25*Math.sin(p.aim);
    for(const offset of weapon.angles) {
      const a=p.aim+offset, dx=Math.cos(a),dy=Math.sin(a);
      const split=this.tier===1?Math.sign(offset)*.19:0;
      this.shots.push({x:x-split*dy,y:y+split*dx,vx:dx*65,vy:dy*65,life:1.8,dead:false,tier:this.tier});
    }
    this.events.push({type:'shot',x,y,a:p.aim,tier:this.tier});p.fire=weapon.interval;
  }
  destroy(e,credit=true) {
    if(e.dead)return;
    e.dead=true;
    if(credit){this.kills++;this.score+=N[e.type].value*this.mult;}
    this.events.push({type:'burst',kind:e.type,x:e.x,y:e.y,a:e.a,links:e.spine?.links});
    const well=e.type==='well';
    this.grid.impulse(e.x,e.y,well?24:7,well?150:38,well?14:0);
    if(credit && this.shards.length<190){
      const count=well?6:e.type==='stalker'?2:1;
      for(let i=0;i<count;i++){
        const a=this.random()*TAU,speed=2+this.random()*5;
        this.shards.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,age:0,dead:false});
      }
    }
    if(well)for(const other of this.enemies){
      if(!other.dead && other.warn<=0 && Math.hypot(other.x-e.x,other.y-e.y)<14) this.destroy(other,credit);
    }
  }
  pulse() {
    const p=this.player;
    if(p.pulse>0 || this.over)return;
    p.pulse=PULSE_TIME;p.grace=Math.max(p.grace,.6);
    this.events.push({type:'pulse',x:p.x,y:p.y});
    this.wave={x:p.x,y:p.y,age:0,r:0};
    this.grid.impulse(p.x,p.y,9,95);
  }
  advanceWave(dt){
    const w=this.wave;
    if(!w)return;
    const previous=w.r;
    w.age=Math.min(PULSE_DURATION,w.age+dt);
    w.r=PULSE_RADIUS*(1-(1-w.age/PULSE_DURATION)**2);
    this.grid.front(w.x,w.y,previous,w.r);
    for(const e of this.enemies){
      if(!e.dead && e.warn<=0 && Math.hypot(e.x-w.x,e.y-w.y)<=w.r+e.r)this.destroy(e);
    }
    if(w.age>=PULSE_DURATION)this.wave=null;
  }
  hurt() {
    const p=this.player;if(p.grace>0 || this.over)return;
    p.hull--;p.grace=2.2;this.chain=0;this.mult=1;
    this.events.push({type:p.hull?'damage':'death',x:p.x,y:p.y});
    this.grid.impulse(p.x,p.y,14,65);
    if(p.hull===0){this.over=true;return;}
    // A recovery pocket lets the player escape even when several bodies overlap.
    for(const e of this.enemies) if(!e.dead&&e.warn<=0&&Math.hypot(e.x-p.x,e.y-p.y)<6) this.destroy(e,false);
  }
  updateEnemy(e,dt,wells) {
    const p=this.player;
    e.hit=Math.max(0,e.hit-dt);e.age+=dt;
    if(e.warn>0){
      e.warn-=dt;
      if(e.warn<=0) {this.events.push({type:'arrive',kind:e.type,x:e.x,y:e.y});this.grid.impulse(e.x,e.y,4,9);}
      return;
    }
    if(e.type==='well'){
      advanceOrbits(e,dt);
      this.grid.impulse(e.x,e.y,19,-145*dt,26*dt);
      const dx=e.x-p.x,dy=e.y-p.y,d=Math.hypot(dx,dy);
      if(d>1 && d<15){const pull=12*(1-d/15)**2*dt/d;p.x+=dx*pull;p.y+=dy*pull;}
      return;
    }
    const target=Math.atan2(p.y-e.y,p.x-e.x), level=Math.min(5,this.director.sector*.18);
    const oldX=e.x,oldY=e.y;
    if(e.type==='snake'){
      const targetAngle=target+.96*Math.sin(e.age*1.9+e.phase);
      const angleError=Math.atan2(Math.sin(targetAngle-e.a),Math.cos(targetAngle-e.a));
      e.a+=clamp(angleError,-2.45*dt,2.45*dt);
      e.vx=12*Math.cos(e.a);e.vy=12*Math.sin(e.a);
    } else if(e.type==='hunter'){
      const lead=.16,angle=Math.atan2(p.y+p.vy*lead-e.y,p.x+p.vx*lead-e.x);
      steer(e,angle+Math.sin(e.age*2.1+e.phase)*.14,5.7+level,dt*3.4);e.a=target;
    } else if(e.type==='stalker'){
      e.dodge-=dt;e.dodgeTime-=dt;
      if(e.dodge<=0){
        for(const b of this.shots) {
          const dx=e.x-b.x,dy=e.y-b.y;
          if(Math.abs(dx)>8 || Math.abs(dy)>8)continue;
          const speed=Math.hypot(b.vx,b.vy),along=(dx*b.vx+dy*b.vy)/speed,side=(dy*b.vx-dx*b.vy)/speed;
          if(along>0 && along<8 && Math.abs(side)<1.65){
            e.dodgeDir=Math.atan2(b.vy,b.vx)+(side>=0?1:-1)*Math.PI/2;
            e.dodgeTime=.22;e.dodge=1.65;break;
          }
        }
      }
      const dodging=e.dodgeTime>0;
      steer(e,dodging?e.dodgeDir:target+Math.sin(e.age*3+e.phase)*.28,dodging?16:8.0+level,dt*(dodging?15:4.2));
      e.a=Math.atan2(e.vy,e.vx);
    } else {
      e.a+=dt*(e.dash>0?8.5:2.7);
      if(e.redline)this.redline(e,dt);
    }
    e.x+=e.vx*dt;e.y+=e.vy*dt;
    for(const well of wells) {
      if(well.dead)continue;
      const dx=well.x-e.x,dy=well.y-e.y,d=Math.hypot(dx,dy);
      if(d>1e-4 && d<12) {const f=6*(1-d/12)*dt/d;e.x+=dx*f;e.y+=dy*f;}
    }
    if(Math.abs(e.x)>W-e.r) {e.vx=-Math.sign(e.x)*Math.abs(e.vx);e.x=clamp(e.x,-W+e.r,W-e.r);}
    if(Math.abs(e.y)>H-e.r) {e.vy=-Math.sign(e.y)*Math.abs(e.vy);e.y=clamp(e.y,-H+e.r,H-e.r);}
    if(e.spine)advanceSpine(e.spine,oldX,oldY,e.x,e.y);
  }
  redline(e,dt){
    if(e.charge>0){
      e.charge-=dt;
      if(e.charge<=0){
        e.vx=Math.cos(e.lock)*25;e.vy=Math.sin(e.lock)*25;e.dash=.9;
        this.grid.impulse(e.x,e.y,4,12);
      }
    }else if(e.dash>0){
      e.dash-=dt;
      if(e.dash<=0){e.vx*=.32;e.vy*=.32;e.nextDash=3.3;}
    }else{
      e.nextDash-=dt;
      if(e.nextDash<=0){
        const p=this.player;
        e.lock=Math.atan2(p.y+p.vy*.78-e.y,p.x+p.vx*.78-e.x);
        e.vx=0;e.vy=0;e.charge=.88;
        this.events.push({type:'lock',x:e.x,y:e.y});
      }
    }
  }
  advanceShot(b,dt,wells) {
    for(const w of wells) {
      if(w.dead)continue;
      const dx=w.x-b.x,dy=w.y-b.y,r2=dx*dx+dy*dy;
      if(r2<225&&r2>.01){const f=dt*900/(r2+8)/Math.sqrt(r2);b.vx+=dx*f;b.vy+=dy*f;}
    }
    const dx=b.vx*dt,dy=b.vy*dt,x=b.x+dx,y=b.y+dy;
    let target=null,first=Infinity;
    this.bins.query(Math.min(x,b.x)-2,Math.min(y,b.y)-2,Math.max(x,b.x)+2,Math.max(y,b.y)+2,e=>{
      const hit=segmentCircle(b.x,b.y,dx,dy,e.x,e.y,e.r+.19);
      if(hit<first){first=hit;target=e;}
    });
    b.life-=dt;
    if(target){
      b.dead=true;target.hit=.11;target.hp--;
      if(target.hp<=0)this.destroy(target);
      else this.events.push({type:'impact',x:b.x+dx*first,y:b.y+dy*first,kind:target.type});
    } else if(b.life<=0 || Math.abs(x)>W || Math.abs(y)>H){
      b.dead=true;this.grid.impulse(b.x,b.y,3,6);
      if(b.life>0)this.events.push({type:'wall',x:clamp(x,-W,W),y:clamp(y,-H,H)});
    } else { b.x=x;b.y=y;this.grid.wake(x,y,b.vx,b.vy,dt); }
  }
  step(dt,input) {
    if(this.over)return;
    this.time+=dt;this.director.step(this);
    const p=this.player;
    p.grace=Math.max(0,p.grace-dt);p.pulse=Math.max(0,p.pulse-dt);p.fire-=dt;
    if(input.turn!==undefined){
      p.a+=input.turn*5.24*dt;
      const speed=Math.hypot(p.vx,p.vy);
      const next=input.thrust?Math.min(18,speed+36*dt):Math.max(0,speed-36*dt);
      const heading=input.thrust?p.a:Math.atan2(p.vy,p.vx);
      p.vx=Math.cos(heading)*next;p.vy=Math.sin(heading)*next;
      p.throttle=next/18;
    }else{
      const length=Math.max(1,Math.hypot(input.mx,input.my));
      p.vx+=(input.mx/length*18-p.vx)*(1-Math.exp(-20*dt));
      p.vy+=(input.my/length*18-p.vy)*(1-Math.exp(-20*dt));
      p.throttle=Math.min(1,Math.hypot(p.vx,p.vy)/18);
      if(p.throttle>.05)p.a=Math.atan2(p.vy,p.vx);
    }
    p.x=clamp(p.x+p.vx*dt,-W+.9,W-.9);p.y=clamp(p.y+p.vy*dt,-H+.9,H-.9);
    if(Number.isFinite(input.a))p.aim=input.a;
    if(input.pulse)this.pulse();
    this.advanceWave(dt);
    if(input.fire && p.fire<=0)this.volley();
    this.grid.impulse(p.x,p.y,3.4,dt*(10+Math.hypot(p.vx,p.vy)*2));
    const wells=this.enemies.filter(e=>e.type==='well' && !e.dead && e.warn<=0);
    for(const e of this.enemies) if(!e.dead)this.updateEnemy(e,dt,wells);
    this.bins.build(this.enemies);
    for(const b of this.shots)this.advanceShot(b,dt,wells);
    for(const s of this.shards) {
      s.age+=dt;const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy);
      if(d<1.35){
        s.dead=true;this.flux++;this.chain++;this.mult=Math.min(9,1+Math.floor(this.chain/4));
        this.maxMult=Math.max(this.maxMult,this.mult);
        this.events.push({type:'flux',x:s.x,y:s.y,mult:this.mult});continue;
      }
      if(d<7){const f=dt*110*(1-d/8)/d;s.vx+=dx*f;s.vy+=dy*f;}
      const drag=Math.exp(-1.9*dt);s.vx*=drag;s.vy*=drag;
      s.x=clamp(s.x+s.vx*dt,-W+1,W-1);s.y=clamp(s.y+s.vy*dt,-H+1,H-1);
      if(s.age>11)s.dead=true;
    }
    for(const e of this.enemies) if(!e.dead && e.warn<=0&&(Math.hypot(e.x-p.x,e.y-p.y)<e.r+.55 || e.spine?.links.some(link=>Math.hypot(link.x-p.x,link.y-p.y)<.91)))this.hurt();
    while(this.tier<WEAPONS.length-1 && this.score>=WEAPONS[this.tier+1].score) {
      this.tier++;this.events.push({type:'upgrade',tier:this.tier,x:p.x,y:p.y});
    }
    compact(this.shots);compact(this.shards);compact(this.enemies);this.grid.step(dt);
  }
}
