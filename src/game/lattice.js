import { ARENA, clamp } from './rules.js';

// Pinned, anchored membrane. Stencil forces are evaluated from a complete
// displacement snapshot, then integrated together with semi-implicit Euler.
export class Lattice {
  constructor(cols = 83, rows = 51) {
    Object.assign(this, { cols, rows, sx: 2*ARENA.halfWidth/(cols-1), sy: 2*ARENA.halfHeight/(rows-1) });
    for (const key of ['x','y','vx','vy']) this[key] = new Float32Array(cols*rows);
  }
  reset() { for (const array of [this.x,this.y,this.vx,this.vy]) array.fill(0); }
  impulse(x,y,radius,strength,swirl=0) {
    const cx = (x+ARENA.halfWidth)/this.sx, cy = (y+ARENA.halfHeight)/this.sy;
    const left = Math.max(1,Math.floor(cx-radius/this.sx)), right = Math.min(this.cols-2,Math.ceil(cx+radius/this.sx));
    const bottom = Math.max(1,Math.floor(cy-radius/this.sy)), top = Math.min(this.rows-2,Math.ceil(cy+radius/this.sy));
    for (let j=bottom;j<=top;j++) for(let i=left;i<=right;i++) {
      const id = j*this.cols+i, dx=(i-cx)*this.sx, dy=(j-cy)*this.sy;
      const d = Math.hypot(dx,dy);
      if (d>=radius || d<.001) continue;
      const force = (1-d/radius)**1.4 / Math.max(d,.55);
      this.vx[id] += force*(dx*strength-dy*swirl);
      this.vy[id] += force*(dy*strength+dx*swirl);
    }
  }
  wake(x,y,vx,vy,dt){
    const speed=Math.hypot(vx,vy)||1;
    const radius=3.9;
    for(let j=Math.max(1,Math.ceil((y-radius+ARENA.halfHeight)/this.sy));j<=Math.min(this.rows-2,(y+radius+ARENA.halfHeight)/this.sy);j++){
      for(let i=Math.max(1,Math.ceil((x-radius+ARENA.halfWidth)/this.sx));i<=Math.min(this.cols-2,(x+radius+ARENA.halfWidth)/this.sx);i++){
        const dx=i*this.sx-ARENA.halfWidth-x,dy=j*this.sy-ARENA.halfHeight-y;
        const f=Math.max(0,1-Math.hypot(dx,dy)/radius)**2*dt*590/speed;
        const k=j*this.cols+i;this.vx[k]+=vx*f;this.vy[k]+=vy*f;
      }
    }
  }
  front(x,y,previous,radius){
    for(let j=1;j<this.rows-1;j++)for(let i=1;i<this.cols-1;i++){
      const dx=i*this.sx-ARENA.halfWidth-x,dy=j*this.sy-ARENA.halfHeight-y;
      const d2=dx*dx+dy*dy;
      if(d2<=previous*previous || d2>radius*radius)continue;
      const k=j*this.cols+i,d=Math.sqrt(d2),f=53/(d*(1+d*.013));
      this.vx[k]+=dx*f;this.vy[k]+=dy*f;
    }
  }
  step(dt) {
    const {cols,rows,x,y,vx,vy}=this, decay=Math.exp(-3.15*dt);
    for(let j=1;j<rows-1;j++) for(let i=1;i<cols-1;i++) {
      const k=j*cols+i;
      vx[k]=clamp((vx[k]+dt*(126*(x[k-1]+x[k+1]+x[k-cols]+x[k+cols]-4*x[k])-13*x[k]))*decay,-34,34);
      vy[k]=clamp((vy[k]+dt*(126*(y[k-1]+y[k+1]+y[k-cols]+y[k+cols]-4*y[k])-13*y[k]))*decay,-34,34);
    }
    for(let k=0;k<x.length;k++) { x[k]=clamp(x[k]+vx[k]*dt,-5,5); y[k]=clamp(y[k]+vy[k]*dt,-5,5); }
  }
}
