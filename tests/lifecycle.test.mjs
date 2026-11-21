import test from 'node:test';
import assert from 'node:assert/strict';
import { Effects,PARTICLE_CAPACITY } from '../src/render/effects.js';
import { World } from '../src/game/world.js';
import { STEP } from '../src/game/rules.js';

test('particle reuse and delayed cascades survive repeated restarts',()=>{
  const fx=new Effects(),pool=fx.pool;
  for(let n=0;n<16;n++){
    for(let i=0;i<20;i++)fx.event({type:'burst',kind:'well',x:2,y:2});
    for(let i=0;i<12;i++)fx.advance(STEP);
    fx.reset();
    assert.equal(fx.pool,pool);assert.equal(pool.length,PARTICLE_CAPACITY);
    assert.equal(fx.pool.some(p=>p.life>0),false);
    assert.equal(fx.delayed.length+fx.flares.length+fx.rings.length,0);
  }
});
test('identical inputs and seeds reproduce the same run on a reused world',()=>{
  const w=new World(17);
  function play(){for(let i=0;i<1800&&!w.over;i++){
    w.step(STEP,{mx:Math.sin(i/100),my:Math.cos(i/100),a:i*.047,fire:true,pulse:i%900===0});w.events.length=0;
  }return [w.score,w.kills,w.time,w.player.hull,w.enemies.map(e=>[e.id,e.x,e.y]),w.grid.x[2107]];}
  const first=play();w.reset(17);assert.deepEqual(play(),first);
});
test('settings and records round-trip, recover from malformed saves and tolerate unavailable storage',async()=>{
  globalThis.matchMedia=()=>({matches:false});let saved=null;
  globalThis.localStorage={getItem:()=>saved,setItem:(_,s)=>{saved=s;}};
  const {readProfile,saveProfile}=await import('../src/platform/storage.js');
  const p=readProfile();p.best=12345;p.scores=[12345];p.settings.reduced=true;p.settings.camera='follow';saveProfile(p);assert.deepEqual(readProfile(),p);
  saved='{broken';assert.equal(readProfile().best,0);
  saved=JSON.stringify({settings:{volume:200,shake:'false',camera:'invalid'},best:-1});
  assert.equal(readProfile().settings.volume,100);assert.equal(readProfile().settings.shake,true);assert.equal(readProfile().settings.camera,'static');
  globalThis.localStorage={getItem(){throw Error();},setItem(){throw Error();}};
  assert.equal(readProfile().best,0);assert.doesNotThrow(()=>saveProfile(p));
});
