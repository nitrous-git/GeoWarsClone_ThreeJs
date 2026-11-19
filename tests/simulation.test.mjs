import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/game/world.js';
import { Lattice } from '../src/game/lattice.js';
import { ARENA, STEP, WEAPONS } from '../src/game/rules.js';
import { segmentCircle } from '../src/game/spatial.js';

const idle={mx:0,my:0,a:0,pulse:false,fire:false};
function fixture(){
  const w=new World(711);w.director.step=()=>{};return w;
}
function enemy(w,type,x,y){
  const e=w.spawn(type,x,y);Object.assign(e,{x,y,warn:0});return e;
}
function tick(w,n,input=idle){for(let i=0;i<n;i++){w.step(STEP,input);w.events.length=0;}}

test('diagonal speed matches axial speed and stays within the rim',()=>{
  const a=fixture(),b=fixture();tick(a,60,{...idle,mx:1});tick(b,60,{...idle,mx:1,my:1});
  assert.ok(Math.abs(Math.hypot(a.player.x,a.player.y)-Math.hypot(b.player.x,b.player.y))<1e-8);
  tick(b,420,{...idle,mx:1,my:1});assert.ok(b.player.x<ARENA.halfWidth&&b.player.y<ARENA.halfHeight);
});
test('swept collision picks the first intersection even for a long segment',()=>{
  const w=fixture(),far=enemy(w,'hunter',9,0),near=enemy(w,'hunter',4,0);
  assert.equal(segmentCircle(0,0,10,0,5,0,1),.4);
  assert.equal(segmentCircle(0,0,10,0,5,2,1),Infinity);w.bins.build(w.enemies);
  w.advanceShot({x:0,y:0,vx:600,vy:0,life:1},STEP,[]);assert.ok(near.dead&&!far.dead);
});
test('warnings are harmless and safe spawn placement respects the player',()=>{
  const w=fixture();w.player.x=30;w.player.y=10;w.player.grace=0;
  const e=w.spawn('stalker',31,10);assert.ok(Math.hypot(e.x-30,e.y-10)>=15);
  e.x=30;e.y=10;w.step(STEP,idle);assert.equal(w.player.hull,3);
  e.warn=0;w.step(STEP,idle);assert.equal(w.player.hull,2);
});
test('Spinner banks inward and Stalker evades only on a threatening trajectory',()=>{
  const w=fixture(),b=enemy(w,'spinner',ARENA.halfWidth-1.03,0);b.vx=8;b.vy=0;
  w.updateEnemy(b,STEP,[]);assert.ok(b.vx<0);
  const s=enemy(w,'stalker',6,0);w.shots.push({x:0,y:.1,vx:60,vy:0});w.updateEnemy(s,STEP,[]);
  assert.ok(s.dodgeTime>0&&s.dodge>1);s.dodge=s.dodgeTime=0;w.shots[0].vx=-60;w.updateEnemy(s,STEP,[]);assert.equal(s.dodgeTime,-STEP);
});
test('well attraction bends a passing shot and a collapsing pair awards each body once',()=>{
  const w=fixture(),a=enemy(w,'well',4,2),b=enemy(w,'well',12,2),h=enemy(w,'hunter',19,2);
  const shot={x:0,y:0,vx:65,vy:0,life:1};w.advanceShot(shot,STEP,[a]);assert.ok(shot.vy>0);
  w.destroy(a);assert.ok(a.dead&&b.dead&&h.dead);assert.equal(w.kills,3);assert.equal(w.score,1280);
  w.destroy(b,false);assert.equal(w.kills,3);
});
test('a pulse has a cooldown, a recovery window and a finite radius',()=>{
  const w=fixture();const close=enemy(w,'hunter',7,0),far=enemy(w,'hunter',20,0);
  w.player.grace=0;w.pulse();assert.ok(close.dead&&!far.dead&&w.player.grace>0);const score=w.score;
  const next=enemy(w,'hunter',8,0);w.pulse();assert.ok(!next.dead);assert.equal(w.score,score);
  tick(w,730);assert.equal(w.player.pulse,0);
});
test('flux raises the multiplier, damage resets the chain, tiers persist until replay',()=>{
  const w=fixture();for(let i=0;i<4;i++)w.shards.push({x:0,y:0,vx:0,vy:0,age:0});
  tick(w,1);assert.equal(w.mult,2);assert.equal(w.maxMult,2);
  w.score=12000;tick(w,1);assert.equal(w.tier,3);w.volley();assert.equal(w.shots.length,WEAPONS[3].angles.length);
  w.player.grace=0;w.hurt();assert.equal(w.mult,1);assert.equal(w.tier,3);
  w.reset(5);assert.equal(w.tier,0);assert.equal(w.score,0);assert.equal(w.shots.length,0);assert.equal(w.grid.x.some(Boolean),false);
});
test('expiry and same-tick removals leave no skipped projectiles',()=>{
  const w=fixture();tick(w,120,{...idle,fire:true});assert.ok(w.shots.length>0);tick(w,180);assert.equal(w.shots.length,0);
});
test('hull damage ends the run and stepping after death cannot award score',()=>{
  const w=fixture();for(let i=0;i<3;i++){w.player.grace=0;w.hurt();}
  assert.ok(w.over);const t=w.time;tick(w,60,{...idle,fire:true});assert.equal(w.time,t);assert.equal(w.player.hull,0);
});
test('dense, opposing well and detonation forces stay finite with all edges pinned',()=>{
  const g=new Lattice();
  for(let i=0;i<3600;i++){g.impulse(-5,0,14,-2.4,1);g.impulse(5,0,14,-2.4,-1);
    if(i%18===0)g.impulse(Math.sin(i)*9,0,19,115);g.step(STEP);}
  assert.ok(g.x.some(v=>Math.abs(v)>.05));
  for(const buf of [g.x,g.y]){assert.ok(buf.every(n=>Number.isFinite(n)&&Math.abs(n)<=5));
    for(let y=0;y<g.rows;y++){assert.equal(buf[y*g.cols],0);assert.equal(buf[y*g.cols+g.cols-1],0);}
    for(let x=0;x<g.cols;x++){assert.equal(buf[x],0);assert.equal(buf[(g.rows-1)*g.cols+x],0);}}
});
test('Redline Spinner commits to its telegraphed lane before accelerating',()=>{
  const w=fixture(),s=enemy(w,'spinner',-20,0);
  Object.assign(s,{redline:true,charge:0,dash:0,nextDash:0});
  w.redline(s,STEP);assert.ok(s.charge>.8);assert.equal(s.vx,0);
  const lock=s.lock;w.player.y=20;
  for(let i=0;i<55;i++)w.redline(s,STEP);
  assert.equal(s.lock,lock);assert.ok(s.dash>0);assert.ok(Math.abs(Math.hypot(s.vx,s.vy)-25)<.001);
});
