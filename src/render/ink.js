import * as T from 'three';
import { TAU } from '../game/rules.js';

const colors=new Map();
function channels(hex) {
  if(!colors.has(hex))colors.set(hex,[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255]);
  return colors.get(hex);
}
// Batches arbitrary oriented strokes and filled facets into one dynamic draw.
export class Ink {
  constructor(scene,order=2,add=false,capacity=100000) {
    this.n=0;this.cap=capacity;this.pos=new Float32Array(capacity*3);this.rgba=new Float32Array(capacity*4);
    this.geo=new T.BufferGeometry();
    this.geo.setAttribute('position',new T.BufferAttribute(this.pos,3).setUsage(T.DynamicDrawUsage));
    this.geo.setAttribute('tint',new T.BufferAttribute(this.rgba,4).setUsage(T.DynamicDrawUsage));
    this.mat=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,side:T.DoubleSide,
      blending:add?T.AdditiveBlending:T.NormalBlending,
      vertexShader:'attribute vec4 tint;varying vec4 c;void main(){c=tint;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec4 c;void main(){gl_FragColor=c;}'});
    this.mat.forceSinglePass=true;
    const mesh=new T.Mesh(this.geo,this.mat);mesh.frustumCulled=false;mesh.renderOrder=order;scene.add(mesh);
  }
  begin(){this.n=0;}
  vert(x,y,rgb,alpha){
    const i=this.n++,j=i*3,k=i*4;this.pos[j]=x;this.pos[j+1]=y;
    this.rgba[k]=rgb[0];this.rgba[k+1]=rgb[1];this.rgba[k+2]=rgb[2];this.rgba[k+3]=alpha;
  }
  triangle(x1,y1,x2,y2,x3,y3,col,alpha=1) {
    if(this.n+3>this.cap)return;
    const c=channels(col);this.vert(x1,y1,c,alpha);this.vert(x2,y2,c,alpha);this.vert(x3,y3,c,alpha);
  }
  stroke(x,y,u,v,width,col,alpha=1,tail=alpha) {
    const dx=u-x,dy=v-y,len=Math.hypot(dx,dy);
    if(len<.001||this.n+6>this.cap)return;
    const k=width*.5/len,px=-dy*k,py=dx*k,c=channels(col);
    this.vert(x+px,y+py,c,alpha);this.vert(x-px,y-py,c,alpha);this.vert(u+px,v+py,c,tail);
    this.vert(u+px,v+py,c,tail);this.vert(x-px,y-py,c,alpha);this.vert(u-px,v-py,c,tail);
  }
  halo(x,y,r,col,alpha=.25) {
    const steps=18,c=channels(col);
    if(this.n+3*steps>this.cap)return;
    for(let i=0;i<steps;i++){
      const a=i*TAU/steps,b=(i+1)*TAU/steps;
      this.vert(x,y,c,alpha);this.vert(x+r*Math.cos(a),y+r*Math.sin(a),c,0);
      this.vert(x+r*Math.cos(b),y+r*Math.sin(b),c,0);
    }
  }
  arc(x,y,r,start,span,width,c,alpha=1,segments=32) {
    let px=x+Math.cos(start)*r,py=y+Math.sin(start)*r;
    for(let i=1;i<=segments;i++){const a=start+span*i/segments,u=x+Math.cos(a)*r,v=y+Math.sin(a)*r;
      this.stroke(px,py,u,v,width,c,alpha);px=u;py=v;}
  }
  ring(x,y,r,w,c,alpha=1,n=32){this.arc(x,y,r,0,TAU,w,c,alpha,n);}
  end(){
    this.geo.setDrawRange(0,this.n);
    for(const [name,size] of [['position',3],['tint',4]]){
      const a=this.geo.attributes[name];a.clearUpdateRanges();if(this.n)a.addUpdateRange(0,this.n*size);a.needsUpdate=true;
    }
  }
  dispose(){this.geo.dispose();this.mat.dispose();}
}
