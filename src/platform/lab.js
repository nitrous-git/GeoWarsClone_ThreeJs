import { STEP, rng } from '../game/rules.js';

const scenes=['combat','hunter','spinner','redline','stalker','well','snake','wake','burst','mass','nova','overlap','stress'];
// Developer sessions use the production world, renderer, fixed step and event path.
export function installLab(world,display,applyEvents,ui,initial){
  let scene='combat',frozen=false,frame=0;
  const seed=9173;
  const form=document.createElement('aside');
  form.className='lab';form.setAttribute('aria-label','VFX sandbox');
  form.innerHTML='<select aria-label="Test scene">'+scenes.map(s=>'<option>'+s+'</option>').join('')+
    '</select><button data-action="reset">Reset</button><button data-action="freeze">Freeze</button><button data-action="step">Step</button>';
  document.body.append(form);
  const select=form.querySelector('select');
  const originalDirector=world.director.step,originalHurt=world.hurt;
  world.hurt=()=>{};
  const add=(type,x,y)=>{
    const e=world.spawn(type,x,y);
    if(!e)return;
    Object.assign(e,{x,y,warn:0});return e;
  };
  function load(name){
    scene=scenes.includes(name)?name:'combat';select.value=scene;
    world.reset(seed);world.director.sector=3;world.director.step=()=>{};
    world.player.grace=0;world.player.x=-11;world.player.y=-3;world.player.a=.9;
    display.effects.reset();display.resetCamera(world.player);frame=0;
    const random=rng(seed);
    if(['combat','nova','overlap','mass','stress'].includes(scene)){
      const n=scene==='stress'?70:scene==='mass'?37:25;
      for(let i=0;i<n;i++){
        const a=random()*Math.PI*2,r=15+random()*34;
        const e=add(['hunter','spinner','stalker'][i%3],r*Math.cos(a),r*Math.sin(a)*.59);
        if(i%8===1&&e.type==='spinner'){e.redline=true;e.nextDash=2.5;e.charge=e.dash=0;}
      }
      add('well',18,8);
      if(scene!=='mass'){add('snake',-36,14);add('snake',30,-16);}
      if(scene==='overlap'||scene==='stress')add('well',4,3);
    }else if(scene==='redline'){
      const e=add('spinner',18,5);e.redline=true;e.nextDash=.55;e.charge=e.dash=0;
    }else if(['hunter','spinner','stalker','snake','well','burst'].includes(scene)){
      add(scene==='burst'?'hunter':scene,scene==='snake'?32:12,4);
    }
    world.tier=['combat','stress','overlap'].includes(scene)?2:0;
    world.events.length=0;ui.tick(world,0,true);
  }
  function step(dt,input){
    const fancy=['combat','overlap','stress'].includes(scene);
    world.player.grace=0;
    const automatic=fancy||scene==='wake';
    if(automatic&&!input.fire){
      input={...input,fire:true,a:scene==='wake'?.22:Math.sin(frame*.015)*.62+.24};
    }
    if(frame===125 && ['nova','stress','overlap'].includes(scene))input={...input,pulse:true};
    if(frame===45 && scene==='burst')world.destroy(world.enemies[0]);
    if(frame===100 && scene==='mass')for(const e of world.enemies)world.destroy(e);
    world.step(dt,input);applyEvents();display.effects.wakes(world);display.effects.advance(dt);frame++;
  }
  const idle=()=>({mx:0,my:0,turn:0,thrust:false,fire:false,pulse:false,a:world.player.aim});
  const freeze=v=>{frozen=v;form.querySelector('[data-action=freeze]').textContent=v?'Play':'Freeze';};
  const api={load,step,get frozen(){return frozen;},get time(){return frame*STEP;},
    freeze,advance(n=1){for(let i=0;i<Math.min(1800,Math.max(0,n));i++)step(STEP,idle());ui.tick(world,0,true);},
    capture(n){load(scene);freeze(true);this.advance(n);form.hidden=true;},
    stats(){return {frame,score:world.score,enemies:world.enemies.length,shots:world.shots.length,
      particles:display.effects.pool.filter(p=>p.life>0).length,renderer:display.constructor.name};},
    dispose(){world.director.step=originalDirector;world.hurt=originalHurt;form.remove();delete window.novaLab;document.removeEventListener('keydown',keys);}
  };
  function keys(e){
    if(e.code==='KeyH')form.hidden=!form.hidden;
    if(e.code==='KeyR')load(scene);
  }
  form.onclick=e=>{
    const act=e.target.dataset.action;
    if(act==='reset')load(scene);
    if(act==='freeze')freeze(!frozen);
    if(act==='step'){freeze(true);api.advance();}
  };
  select.onchange=()=>load(select.value);
  document.addEventListener('keydown',keys);
  load(initial);window.novaLab=api;return api;
}
