import { ARENA, clamp } from './rules.js';
// Objects occupy one cell. Query bounds include the largest candidate radius.
export class SpatialBins {
  constructor(size=6) {
    this.size=size;this.cols=Math.ceil(ARENA.halfWidth*2/size)+1;this.rows=Math.ceil(ARENA.halfHeight*2/size)+1;
    this.cells=Array.from({length:this.cols*this.rows},()=>[]);
  }
  ix(x){return clamp(Math.floor((x+ARENA.halfWidth)/this.size),0,this.cols-1);}
  iy(y){return clamp(Math.floor((y+ARENA.halfHeight)/this.size),0,this.rows-1);}
  build(items){
    for(const cell of this.cells) cell.length=0;
    for(const e of items) if(!e.dead && e.warn<=0) this.cells[this.iy(e.y)*this.cols+this.ix(e.x)].push(e);
  }
  query(x0,y0,x1,y1,visit) {
    const r=this.ix(x1),t=this.iy(y1);
    for(let j=this.iy(y0);j<=t;j++) for(let i=this.ix(x0);i<=r;i++)
      for(const e of this.cells[j*this.cols+i]) if(!e.dead) visit(e);
  }
}
export function segmentCircle(x,y,dx,dy,cx,cy,r) {
  const ox=x-cx,oy=y-cy,a=dx*dx+dy*dy,b=ox*dx+oy*dy,c=ox*ox+oy*oy-r*r;
  if(c<=0)return 0;
  const d=b*b-a*c;
  if(d<0 || a<1e-10)return Infinity;
  const t=(-b-Math.sqrt(d))/a;
  return t>=0&&t<=1?t:Infinity;
}
