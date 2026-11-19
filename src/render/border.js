import { ARENA } from '../game/rules.js';
export function border(ink) {
  const W=ARENA.halfWidth,H=ARENA.halfHeight, col=0x58c5ff;
  for(const s of [-1,1]){
    ink.stroke(-W,s*H,W,s*H,.115,col,.87);ink.stroke(s*W,-H,s*W,H,.115,col,.87);
    for(let x=-50;x<=50;x+=2)ink.stroke(x,s*(H+.16),x,s*(H+(x%10===0?.61:.32)),.055,col,.65);
    for(let y=-30;y<=30;y+=2)ink.stroke(s*(W+.16),y,s*(W+(y%10===0?.61:.32)),y,.055,col,.65);
    for(const b of [-1,1]){
      ink.stroke(s*(W-2.3),b*H,s*W,b*H,.13,0xcaf8ff);
      ink.stroke(s*W,b*H,s*W,b*(H-2.3),.13,0xcaf8ff);
    }
  }
}
