import test from 'node:test';
import assert from 'node:assert/strict';
import { ArenaCamera,FOLLOW_ZOOM } from '../src/render/camera.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const p={x:8,y:-7};
test('static mode preserves original framing at all aspect ratios',()=>{
  const c=new ArenaCamera({camera:'static'});
  for(const aspect of [.5,1,16/9,2.4]){
    c.resize(aspect);c.update(p,1/60,0,0);
    near(c.hh,Math.max(34.5,54.5/aspect));near(c.hw,c.hh*aspect);
    near(c.sx,0);near(c.sy,0);
  }
});
test('follow mode zooms, tracks smoothly and clamps at arena edges',()=>{
  const settings={camera:'follow'},c=new ArenaCamera(settings);c.resize(16/9);
  c.update({x:0,y:0},1/60,0,0);
  near(c.hh,34.5/FOLLOW_ZOOM);
  c.update({x:52,y:31},1/60,0,0);assert.ok(c.x>0&&c.x<c.maxX&&c.y>0&&c.y<c.maxY);
  for(let i=0;i<180;i++)c.update({x:52,y:31},1/60,0,0);
  near(c.x,c.maxX);near(c.y,c.maxY);
  settings.camera='static';c.update(p,1/60,0,0);near(c.x,0);near(c.y,0);near(c.hh,34.5);
  settings.camera='follow';c.reset(p);near(c.x,p.x);near(c.y,p.y);near(c.hh,34.5/FOLLOW_ZOOM);
  c.reset({x:0,y:0});near(c.x,0);near(c.y,0);
});
test('pointer aim inverts the actual camera transform including shake and zoom',()=>{
  const settings={camera:'follow',shake:true},c=new ArenaCamera(settings);c.resize(16/9);c.update(p,1/60,2,.3);
  const rect={left:30,top:45,width:960,height:540};
  for(const a of [0,Math.PI/2,-Math.PI/2,.7,-2.1]){
    const x=p.x+4*Math.cos(a),y=p.y+4*Math.sin(a);
    const sx=rect.left+rect.width*(.5+(x-c.sx)/(2*c.hw)),sy=rect.top+rect.height*(.5-(y-c.sy)/(2*c.hh));
    near(c.aim(sx,sy,rect,p),a);
  }
  settings.reduced=true;c.update({x:0,y:0},1/60,2,.3);near(c.sx,0);near(c.sy,0);
});
test('portrait resize and paused camera remain bounded',()=>{
  const c=new ArenaCamera({camera:'follow'});c.resize(16/9);c.update({x:52,y:31},1/60,0,0);
  c.resize(.5);assert.ok(Math.abs(c.x)<=c.maxX&&Math.abs(c.y)<=c.maxY);
  const x=c.x,y=c.y;c.update({x:-52,y:-31},0,0,0);near(c.x,x);near(c.y,y);
});
