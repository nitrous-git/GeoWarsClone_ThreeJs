import { ARENA, clamp } from './rules.js';

export const SECTORS = ['First contact','Cross current','Fault line','Event horizon','Redshift','Critical mass'];
// Each score is a phrase of formations with a short window to gather flux.
const SCORES = [
  [[.3,'wing'],[4.4,'mirror'],[9,'bank'],[14,'wing'],[17,'rift']],
  [[.4,'cross'],[4,'file'],[8,'bank'],[12,'mirror'],[16,'pinch']],
  [[.4,'rift'],[3,'bank'],[7,'file'],[10,'wing'],[14,'cross'],[17,'file']],
  [[.3,'mirror'],[3,'rift'],[6,'pinch'],[9,'file'],[13,'bank'],[16,'cross']],
  [[.3,'pinch'],[3,'file'],[6,'cross'],[10,'rift'],[13,'bank'],[17,'mirror']],
  [[.3,'rift'],[2.8,'cross'],[6,'file'],[9,'pinch'],[12,'bank'],[15,'mirror'],[18,'file']]
];
export class Director {
  constructor() { this.reset(); }
  reset() {this.sector=0;this.beat=0;}
  step(world) {
    const sector=1+Math.floor(world.time/22);
    if(sector!==this.sector) {
      this.sector=sector;this.beat=0;
      world.events.push({type:'sector',sector,name:SECTORS[(sector-1)%SECTORS.length]});
    }
    const score=SCORES[(sector-1)%SCORES.length], phase=world.time-(sector-1)*22;
    while(this.beat<score.length && phase>=score[this.beat][0]) this.formation(world,score[this.beat++][1]);
  }
  formation(w,kind) {
    const {halfWidth:W,halfHeight:H}=ARENA;
    const side=Math.floor(w.random()*4), center=(w.random()-.5)*.65;
    const count=Math.min(7,3+Math.floor(this.sector/3));
    const edge=(s,t,inset=2)=>{
      t=clamp(t,-.9,.9);
      return [[-W+inset,t*H],[W-inset,t*H],[t*W,-H+inset],[t*W,H-inset]][s];
    };
    const line=(s,n,type,spacing,stagger=0)=>{
      for(let i=0;i<n;i++) w.spawn(type,...edge(s,center+(i-(n-1)/2)*spacing),i*stagger);
    };
    if(kind==='rift'){
      if(w.enemies.filter(e=>e.type==='well').length>=2) return;
      w.spawn('well',(w.random()-.5)*W*1.35,(w.random()-.5)*H*1.25,.25);
    } else if(kind==='wing'){
      for(let i=0;i<count+1;i++) w.spawn('hunter',...edge(side,center+(i-count/2)*.18,2+Math.abs(i-count/2)*1.5),i*.075);
    } else if(kind==='mirror'||kind==='pinch'){
      line(side,count,kind==='pinch'?'stalker':'hunter',.21,.075);
      line(side^1,count,'hunter',.21,.075);
    } else if(kind==='bank') line(side,count+1,'spinner',.31,.12);
    else if(kind==='file') line(side,count+1,'stalker',.07,.24);
    else {line(side,count,'spinner',.3,.08);line((side+2)%4,count,'hunter',.25,.09);}
  }
}
