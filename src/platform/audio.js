// Gesture-unlocked signal path. Short voices disconnect on completion.
export class Synth {
  constructor(settings){this.settings=settings;this.voices=new Set();this.last={};}
  unlock(){
    if(!this.ctx){
      const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
      this.ctx=new C();const c=this.ctx;
      this.master=c.createGain();const limiter=c.createDynamicsCompressor();
      limiter.threshold.value=-14;limiter.ratio.value=7;this.master.connect(limiter);limiter.connect(c.destination);
      this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);
      const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
      this.drone=c.createOscillator();this.drone.type='sine';this.drone.frequency.value=43.65;
      this.air=c.createGain();this.air.gain.value=0;this.drone.connect(this.air);this.air.connect(this.master);this.drone.start();
      this.volume();
    }
    if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
  }
  volume(){
    if(this.ctx)this.master.gain.setTargetAtTime(this.settings.muted?0:.46*this.settings.volume/100,this.ctx.currentTime,.02);
  }
  ambience(active,well){
    if(!this.ctx)return;
    const state=active?(well?'well':'flight'):'idle';
    if(this.ambientState===state)return;
    this.ambientState=state;
    this.air.gain.setTargetAtTime(active?(well?.052:.019):0,this.ctx.currentTime,.32);
    this.drone.frequency.setTargetAtTime(well?38.89:43.65,this.ctx.currentTime,.25);
  }
  tone(from,to,len,amp,wave='sine',delay=0,pan=0){
    const c=this.ctx;if(!c || this.settings.muted || this.voices.size>64)return;
    const t=c.currentTime+delay,g=c.createGain(),p=c.createStereoPanner();p.pan.value=Math.max(-.8,Math.min(.8,pan));
    const hiss=wave==='noise',src=hiss?c.createBufferSource():c.createOscillator();
    let envelope=src,filter;
    if(hiss){src.buffer=this.noise;filter=c.createBiquadFilter();filter.type='lowpass';src.connect(filter);envelope=filter;}
    else src.type=wave;
    const freq=hiss?filter.frequency:src.frequency;
    freq.setValueAtTime(from,t);freq.exponentialRampToValueAtTime(Math.max(15,to),t+len);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(amp,t+.006);
    g.gain.exponentialRampToValueAtTime(.0001,t+len);
    envelope.connect(g);g.connect(p);p.connect(this.master);src.start(t);src.stop(t+len+.012);this.voices.add(src);
    src.onended=()=>{this.voices.delete(src);src.disconnect();filter?.disconnect();g.disconnect();p.disconnect();};
  }
  chirp(){this.tone(550,940,.09,.15,'triangle');}
  event(e){
    if(!this.ctx || this.settings.muted)return;
    const t=this.ctx.currentTime,pan=(e.x||0)/60;
    const key=e.type==='burst'&&e.kind==='well'?'collapse':e.type;
    if(t-(this.last[key]??-1)<({arrive:.13,impact:.045,burst:.045,flux:.065,wall:.2}[key]??0))return;
    this.last[key]=t;
    const tone=(f,to,d,v,w='sine',delay=0)=>this.tone(f,to,d,v,w,delay,pan);
    switch(key){
      case 'shot':tone(650+e.tier*110,125,.095,.15,'triangle');tone(3200,290,.053,.12,'noise');break;
      case 'impact':tone(330,74,.1,.18,'square');break;
      case 'burst':tone(e.kind==='spinner'?240:160,42,.24,.28,'triangle');tone(3300,150,.22,.25,'noise');break;
      case 'pulse':
        tone(85,23,1.12,.80);tone(4400,65,.91,.64,'noise');tone(260,52,.87,.21,'triangle',.06);
        tone(680,190,.61,.13,'sine',.22);break;
      case 'collapse':case 'death':
        tone(118,26,.82,.67);tone(1000,54,.68,.55,'noise');tone(600,65,.6,.19,'sawtooth',.07);break;
      case 'damage':tone(186,51,.29,.41,'sawtooth');tone(1800,140,.22,.31,'noise');break;
      case 'lock':tone(287,360,.17,.14,'triangle');tone(360,510,.14,.12,'triangle',.14);break;
      case 'arrive':tone(e.kind==='well'?150:410,e.kind==='well'?52:260,.19,.085,'sine');break;
      case 'flux':tone(920,1400+e.mult*55,.095,.11,'sine');break;
      case 'upgrade':[523,659,784,1046].forEach((f,i)=>tone(f,f*1.015,.19,.2,'triangle',i*.07));break;
      case 'sector':tone(220,220,.16,.105,'sine');tone(330,330,.23,.09,'sine',.12);break;
    }
  }
  dispose(){this.drone?.stop();this.ctx?.close().catch(()=>{});}
}
