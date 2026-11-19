import { clock,digits,PULSE_TIME,WEAPONS } from '../game/rules.js';
export const $=id=>document.getElementById(id);
const icon=id=>'<svg aria-hidden="true"><use href="#'+id+'"/></svg>';
const button=(id,label)=>'<button id="'+id+'">'+label+'</button>';
const titles=['I','II','III','IV'];
export class Interface {
  constructor(profile,actions) {
    this.profile=profile;this.actions=actions;this.panel=null;this.home=true;this.toast=0;this.hudTime=0;
    this.dialog=$('dialog');this.layer=$('dialog-layer');
    $('launch').onclick=actions.start;$('settings-btn').onclick=()=>this.open('settings');
    $('manual-btn').onclick=()=>this.open('manual');$('pause-btn').onclick=actions.pause;
    $('pulse').onclick=actions.pulse;$('sound-btn').onclick=actions.mute;
    $('fullscreen').onclick=async()=>{
      try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
      catch{this.message('Display','Fullscreen unavailable',2);}
    };
    document.addEventListener('fullscreenchange',()=>{
      $('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Exit fullscreen':'Enter fullscreen');
    });
    this.layer.onpointerdown=e=>{if(e.target===this.layer && ['settings','manual'].includes(this.panel))actions.back();};
    this.dialog.onkeydown=e=>{
      if(e.key!=='Tab')return;
      const focusable=[...this.dialog.querySelectorAll('button,input,select')],first=focusable[0],last=focusable.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    };
    this.refreshProfile();
  }
  refreshProfile(){
    const s=this.profile.settings;$('sound-label').textContent=s.muted?'Sound off':'Sound on';
    $('sound-btn').setAttribute('aria-label',s.muted?'Unmute sound':'Mute sound');$('sound-btn').setAttribute('aria-pressed',s.muted);
    $('best').textContent=digits(this.profile.best);
  }
  setScene(state){
    this.home=state==='menu';document.body.dataset.view=this.home?'menu':state;
    $('hud').hidden=this.home;$('game-footer').hidden=this.home;$('menu-footer').hidden=!this.home;
    $('header-mode').textContent=this.home?'Arcade division':'Genesis / Endless survival';
    $('notice').classList.remove('visible');$('notice').replaceChildren();this.toast=0;this.hudTime=0;
    this.close(false);
  }
  close(restore=true){
    this.panel=null;this.layer.hidden=true;this.dialog.innerHTML='';
    for(const el of [document.querySelector('header'),$('footer'),$('home')])el.inert=false;
    if(restore && this.returnFocus?.offsetParent)this.returnFocus.focus();
  }
  shell(name,kicker,title,body,close=true){
    if(this.layer.hidden)this.returnFocus=document.activeElement;
    this.panel=name;this.layer.hidden=false;
    for(const el of [document.querySelector('header'),$('footer'),$('home')])el.inert=true;
    this.dialog.innerHTML=(close?'<button class="dialog-close" id="d-close" aria-label="Back">'+icon('close')+'</button>':'')+
      '<div class="kicker">'+kicker+'</div><h2 id="dialog-title">'+title+'</h2>'+body;
    if(close)$('d-close').onclick=this.actions.back;
    (this.dialog.querySelector('.launch')||this.dialog.querySelector('button'))?.focus({preventScroll:true});
  }
  open(name,tab='controls'){
    const s=this.profile.settings;
    if(name==='manual'){
      const controls='<div class="entry"><b>Move</b><kbd>W A S D</kbd></div><div class="entry"><b>Aim & fire</b><kbd>Mouse + LMB / Arrow keys</kbd></div><div class="entry"><b>Nova pulse</b><kbd>Space / RMB</kbd></div><div class="entry"><b>Pause</b><kbd>Esc / P</kbd></div><p>Gamepad uses left stick to move, right stick to shoot, a bumper to pulse and Start to pause. On touchscreens, drag on each half of the arena and tap Nova pulse. Landscape gives the widest view.</p>';
      const threats=[
        ['◇','#62d8ff','Hunter','Pursues in wings. Cut across its approach.'],
        ['✥','#fc69c0','Spinner','Banks off walls. Red variants mark a lane, then charge.'],
        ['»','#d1fb73','Stalker','Sidesteps fire. Track its lane after the dodge.'],
        ['◎','#ffac76','Singularity','Bends shots and draws ships inward. Break the core to clear a radius.']
      ].map(([shape,c,n,d])=>'<div class="entry"><b><i class="enemy-dot" style="color:'+c+'">'+shape+'</i>'+n+'</b><p>'+d+'</p></div>').join('');
      this.shell(name,'Flight systems / Reference','Field manual','<div class="subnav"><button id="tab-controls" aria-pressed="'+(tab==='controls')+'">Controls</button><button id="tab-threats" aria-pressed="'+(tab==='threats')+'">Field index</button></div>'+
        (tab==='controls'?controls:threats)+'<p>Collect four gold flux shards to raise your multiplier. Hull damage resets it. Score unlocks stronger lances at 1,500, 4,500 and 12,000.</p>');
      for(const v of ['controls','threats'])$('tab-'+v).onclick=()=>{this.open('manual',v);$('tab-'+v).focus();};
    }else if(name==='settings'){
      const check=(key,label)=>'<div class="row"><label for="opt-'+key+'">'+label+'</label><input type="checkbox" id="opt-'+key+'" '+(s[key]?'checked':'')+'></div>';
      this.shell(name,'Flight systems / Configuration','Settings',
        '<div class="row"><label for="opt-volume">Master volume <small id="volume-value">'+s.volume+'%</small></label><input id="opt-volume" type="range" min="0" max="100" value="'+s.volume+'"></div>'+
        '<div class="row"><label for="opt-quality">Render resolution</label><select id="opt-quality"><option value="high">High</option><option value="standard">Standard</option></select></div>'+
        check('bloom','Bloom')+check('shake','Camera shake')+check('reduced','Reduced effects')+'<p>Reduced effects soften bursts, slow the anomaly study and disable camera shake.</p>');
      $('opt-quality').value=s.quality;
      for(const key of ['volume','quality','bloom','shake','reduced']){
        const el=$('opt-'+key);el.oninput=()=>{
          s[key]=el.type==='checkbox'?el.checked:key==='volume'?Number(el.value):el.value;
          $('volume-value').textContent=s.volume+'%';this.actions.settings(key);
        };
      }
    }else if(name==='pause'){
      this.shell(name,'Flight suspended','Paused','<button class="launch" id="resume">'+icon('play')+'Resume run</button><div class="secondary">'+button('p-settings','Settings')+button('p-manual','Field manual')+button('exit','End run')+'</div>',false);
      $('resume').onclick=this.actions.resume;$('p-settings').onclick=()=>this.open('settings');
      $('p-manual').onclick=()=>this.open('manual');$('exit').onclick=this.actions.end;
    }
  }
  results(w,prior){
    const fact=(a,b)=>'<div class="fact"><small>'+a+'</small><b>'+b+'</b></div>';
    this.shell('results',w.score>prior?'New personal best':'Run telemetry','Run complete',
      '<div class="result-score">'+digits(w.score)+'</div><div class="facts">'+fact('Time',clock(w.time))+fact('Sector',String(w.director.sector).padStart(2,'0'))+fact('Kills',w.kills)+fact('Peak','×'+w.maxMult)+'</div>'+
      '<button class="launch" id="retry">'+icon('play')+'Replay run</button><div class="secondary">'+button('to-menu','Flight deck')+'</div>',false);
    $('retry').onclick=this.actions.start;$('to-menu').onclick=this.actions.menu;
  }
  message(label,title,duration=1.5){
    const n=$('notice');n.replaceChildren(document.createTextNode(label));
    const h=document.createElement('strong');h.textContent=title;n.append(h);n.classList.add('visible');this.toast=duration;
  }
  tick(w,dt,force=false){
    if(this.toast>0){this.toast-=dt;if(this.toast<=0){$('notice').classList.remove('visible');$('notice').replaceChildren();}}
    this.hudTime-=dt;if(!force&&this.hudTime>0)return;this.hudTime=.08;
    $('score').textContent=digits(w.score);$('mult').textContent='×'+w.mult;$('time').textContent=clock(w.time);
    $('sector').textContent='Sector '+String(w.director.sector||1).padStart(2,'0');
    $('weapon').textContent=titles[w.tier]+' / '+WEAPONS[w.tier].name;$('flux').textContent=w.mult===9?'MAX':(w.chain%4)+' / 4';
    const h=$('hull');h.setAttribute('aria-label',w.player.hull+' hull '+(w.player.hull===1?'point':'points'));
    [...h.children].forEach((el,i)=>el.classList.toggle('empty',i>=w.player.hull));
    const cd=w.player.pulse;$('pulse-info').textContent=cd>0?cd.toFixed(1)+'s':'Ready · Space';
    $('pulse').setAttribute('aria-disabled',cd>0);$('pulse').querySelector('span').style.transform='scaleX('+(1-cd/PULSE_TIME)+')';
  }
  stick(side,s){
    const el=$('touch-'+side);el.hidden=!s;if(!s)return;
    el.style.left=s.x+'px';el.style.top=s.y+'px';el.firstElementChild.style.transform='translate(calc(-50% + '+(s.dx*35)+'px),calc(-50% - '+(s.dy*35)+'px))';
  }
}
