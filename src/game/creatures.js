// Each visible link sits a fixed distance back along the path traced by the head.
const spacing = .82;
export function createSpine(x, y) {
  return { anchors: [{x,y}], links: [], remainder: 0 };
}
export function advanceSpine(spine, fromX, fromY, x, y) {
  const dx=x-fromX, dy=y-fromY, distance=Math.hypot(dx,dy);
  if (!distance) return;
  let travelled=spacing-spine.remainder;
  while (travelled <= distance) {
    spine.anchors.unshift({x:fromX+dx*travelled/distance,y:fromY+dy*travelled/distance});
    travelled+=spacing;
  }
  spine.remainder=(spine.remainder+distance)%spacing;
  spine.anchors.length=Math.min(26,spine.anchors.length);
  const f=spine.remainder/spacing;
  spine.links.length=0;
  for(let i=1;i<spine.anchors.length;i++){
    const a=spine.anchors[i], b=spine.anchors[i-1];
    spine.links.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,a:Math.atan2(b.y-a.y,b.x-a.x)});
  }
}

// Test particles orbit in the softened potential of their own core.
// Coordinates are local so the same history can be drawn in either renderer.
const mu=225, softening=.85;
export function createOrbits(seed,count=156){
  const particles=[];
  for(let i=0;i<count;i++){
    const a=i*2.399963+seed, r=2.15+6.5*((i*73%157)/157)**1.6;
    const speed=Math.sqrt(mu*r*r/(r*r+softening)**1.5)*(.79+.22*((i*43)%79)/79);
    const x=r*Math.cos(a),y=r*Math.sin(a);
    particles.push({x,y,vx:-Math.sin(a)*speed,vy:Math.cos(a)*speed,
      history:new Float32Array([x,y,x,y,x,y,x,y]),color:[0x9e78ff,0xffa947,0x4fefff,0xff7386][i%4]});
  }
  return particles;
}
export function advanceOrbits(e,dt){
  e.orbitTick=(e.orbitTick||0)+1;
  for(const p of e.orbits){
    if(e.orbitTick%3===0){p.history.copyWithin(2,0,6);p.history[0]=p.x;p.history[1]=p.y;}
    const gravity=mu/(p.x*p.x+p.y*p.y+softening)**1.5;
    p.vx-=gravity*p.x*dt;p.vy-=gravity*p.y*dt;
    p.x+=p.vx*dt;p.y+=p.vy*dt;
  }
}
