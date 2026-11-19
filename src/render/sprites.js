// Original Java glyphs share an atlas and one draw call in WebGL.
const names=['playerDOWN_64x64','EnemyA','EnemyB_a','EnemyB_b','EnemyD','DoubleBullet_Alpha','EnemyC'];
export function atlas(){
  const image=new Image();
  image.src=new URL('../../assets/field/glyphs.png',import.meta.url).href;
  return image;
}
export function sprites(world,visit){
  for(const e of world.enemies){
    if(e.warn>0||e.spine)continue;
    if(e.type==='well'){visit(6,e.x,e.y,0,4.25,4.25,1.15);continue;}
    const tile=e.type==='hunter'?1:e.type==='stalker'?4:e.redline?3:2;
    const angle=e.type==='spinner'?e.a:e.type==='stalker'?Math.sin(e.age*2)*.14:0;
    visit(tile,e.x,e.y,angle,e.r*3.4,e.r*3.4,e.hit>0?2.5:1.65);
  }
  for(const b of world.shots){
    const scale=1+.065*(b.tier||0);
    visit(5,b.x,b.y,Math.atan2(b.vy,b.vx),2.7*scale,1.25*scale,2);
  }
  const p=world.player;
  if(!world.over)visit(0,p.x,p.y,p.a-Math.PI/2,3.65,3.65,1.75);
}
