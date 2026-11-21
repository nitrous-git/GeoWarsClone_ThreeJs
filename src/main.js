import { World } from './game/world.js';
import { STEP, WEAPONS } from './game/rules.js';
import { Synth } from './platform/audio.js';
import { Controls } from './platform/input.js';
import { readProfile,saveProfile } from './platform/storage.js';
import { Interface,$ } from './platform/ui.js';
import { createDisplay } from './render/display.js';

export async function start(){
  const profile=readProfile(),settings=profile.settings,world=new World();
  const display=await createDisplay($('screen'),world,settings),audio=new Synth(settings);
  let state='menu',last=performance.now(),accumulator=0,sceneTime=0,dying=0,prior=profile.best;
  let frameId,stopped=false,contextLost=false,lastPaint=-Infinity;
  let ui,input,lab;
  function enter(next){
    state=next;accumulator=0;lastPaint=-Infinity;last=performance.now();input.clear();ui.setScene(next);
    audio.ambience(next==='play',false);
  }
  function newRun(){
    if(contextLost)return;
    audio.unlock();audio.chirp();world.reset();display.effects.reset();display.resetCamera(world.player);prior=profile.best;sceneTime=0;
    enter('play');ui.tick(world,0,true);
  }
  function pause(){if(state==='play'){enter('pause');ui.open('pause');}}
  function resume(){if(state==='pause'&&!contextLost){audio.unlock();enter('play');ui.tick(world,0,true);}}
  function results(){
    if(lab){menu();return;}
    if(world.score>0){profile.scores.push(world.score);profile.scores.sort((a,b)=>b-a);profile.scores.length=Math.min(10,profile.scores.length);}
    profile.best=Math.max(profile.best,world.score);saveProfile(profile);ui.refreshProfile();
    enter('results');ui.tick(world,0,true);ui.results(world,prior);
  }
  function menu(){
    lab?.dispose();lab=null;display.effects.reset();enter('menu');$('launch').focus({preventScroll:true});
  }
  function back(){
    if(ui.panel==='settings'||ui.panel==='manual'||ui.panel==='scores'){
      if(state==='pause')ui.open('pause');else ui.close();return;
    }
    if(state==='play')pause();else if(state==='pause')resume();else if(state==='results')menu();
  }
  function confirm(){
    if(ui.panel==='settings'||ui.panel==='manual'||ui.panel==='scores'){back();return;}
    if(state==='menu'||state==='results')newRun();else if(state==='pause')resume();
  }
  const actions={
    start:newRun,menu,pause,resume,end:results,back,confirm,playing:()=>state==='play',canTogglePause:()=>state==='play'||ui.panel==='pause',
    backOrStart:()=>state==='menu'&&!ui.panel?newRun():back(),
    stick:(side,s)=>ui.stick(side,s),
    pulse:()=>{if(state==='play')input.pulse=true;},
    mute:()=>{settings.muted=!settings.muted;audio.unlock();audio.volume();ui.refreshProfile();saveProfile(profile);},
    toggleCamera:()=>{settings.camera=settings.camera==='follow'?'static':'follow';display.resetCamera(world.player);saveProfile(profile);ui.message('Camera',settings.camera==='follow'?'Follow player':'Full arena',1.2);},
    settings:key=>{if(key==='camera')display.resetCamera(world.player);if(key==='steering')ui.refreshProfile();if(key==='volume'){audio.unlock();audio.volume();}if(key==='quality')display.resize();saveProfile(profile);}
  };
  ui=new Interface(profile,actions);input=new Controls($('screen'),actions,settings);
  document.addEventListener('click',e=>{
    if(e.target.closest('button') && state!=='play' && e.target.closest('#graphic-error')===null){audio.unlock();audio.chirp();}
  });
  function applyEvents(){
    for(const event of world.events){
      display.effects.event(event);audio.event(event);
      if(event.type==='sector')ui.message('Sector '+String(event.sector).padStart(2,'0'),event.name,1.7);
      if(event.type==='upgrade')ui.message('Weapon evolved',WEAPONS[event.tier].name,1.65);
      if(event.type==='damage')ui.message('Hull breach',world.player.hull+' remaining',1.05);
    }
    world.events.length=0;
  }
  function frame(now){
    if(stopped)return;
    frameId=requestAnimationFrame(frame);
    const dt=Math.max(0,Math.min(.10,(now-last)/1000));last=now;
    if(contextLost||document.hidden)return;
    input.pollPad();
    if(state==='play'){
      accumulator+=dt;
      while(accumulator+1e-9>=STEP && state==='play'){
        accumulator-=STEP;
        if(lab){
          if(!lab.frozen)lab.step(STEP,input.sample(world.player,display));
          sceneTime=lab.time;continue;
        }
        world.step(STEP,input.sample(world.player,display));applyEvents();
        if(!world.over)display.effects.wakes(world);
        display.effects.advance(STEP);sceneTime+=STEP;
        if(world.over){dying=.82;enter('dying');ui.tick(world,0,true);}
      }
      if(state==='play'){ui.tick(world,dt);audio.ambience(true,world.enemies.some(e=>e.type==='well'&&e.warn<=0));}
    }else if(state==='dying'){
      sceneTime+=dt;display.effects.advance(dt);world.grid.step(Math.min(dt,STEP));dying-=dt;
      if(dying<=0)results();
    }else if(state==='menu')sceneTime+=dt;
    const animated=state==='play'||state==='dying';
    const minFrame=state==='menu'&&!settings.reduced?1000/30:1000/15;
    if(animated||now-lastPaint>=minFrame){
      display.render(world,state==='menu',sceneTime,state==='pause'||state==='results'?0:(Number.isFinite(lastPaint)?Math.min(.1,(now-lastPaint)/1000):dt));lastPaint=now;
    }
  }
  const canvas=$('screen');
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();contextLost=true;pause();$('graphic-error').hidden=false;
    $('error-copy').textContent='The graphics context was interrupted. Your run is paused while the browser restores it.';
  });
  canvas.addEventListener('webglcontextrestored',()=>{
    contextLost=false;$('graphic-error').hidden=true;display.resize();last=performance.now();
  });
  window.addEventListener('pagehide',e=>{
    if(e.persisted){pause();return;}
    stopped=true;cancelAnimationFrame(frameId);input.dispose();display.dispose();audio.dispose();
  });
  ui.setScene('menu');$('launch').disabled=false;$('launch-label').textContent='Start game';
  const params=new URLSearchParams(location.search);
  if(params.has('lab')){
    const {installLab}=await import('./platform/lab.js');
    enter('play');lab=installLab(world,display,applyEvents,ui,params.get('lab'));
    if(params.has('frame')){
      const frame=Number(params.get('frame'));
      if(Number.isSafeInteger(frame)&&frame>=0){lab.capture(frame);sceneTime=lab.time;}
    }
  }
  frameId=requestAnimationFrame(frame);
}
