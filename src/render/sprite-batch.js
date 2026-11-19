import * as T from 'three';
import { atlas, sprites } from './sprites.js';
const corners=[[-.5,-.5],[.5,-.5],[-.5,.5],[-.5,.5],[.5,-.5],[.5,.5]];
export class SpriteBatch {
  constructor(scene){
    this.image=atlas();this.texture=new T.Texture(this.image);
    this.texture.minFilter=this.texture.magFilter=T.LinearFilter;
    this.image.onload=()=>{this.texture.needsUpdate=true;};
    if(this.image.complete&&this.image.naturalWidth)this.texture.needsUpdate=true;
    this.geometry=new T.BufferGeometry();
    for(const [name,size] of [['position',3],['uv',2],['energy',1]]){
      this.geometry.setAttribute(name,new T.BufferAttribute(new Float32Array(1024*6*size),size).setUsage(T.DynamicDrawUsage));
    }
    this.material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,blending:T.AdditiveBlending,
      uniforms:{sheet:{value:this.texture}},
      vertexShader:'attribute float energy;varying float gain;varying vec2 coord;void main(){gain=energy;coord=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'uniform sampler2D sheet;varying vec2 coord;varying float gain;void main(){vec4 s=texture2D(sheet,coord);gl_FragColor=vec4(s.rgb*gain,s.a);}'});
    const mesh=new T.Mesh(this.geometry,this.material);mesh.frustumCulled=false;mesh.renderOrder=4.5;scene.add(mesh);
  }
  sync(world){
    const {position,uv,energy}=this.geometry.attributes;
    let k=0;
    sprites(world,(tile,x,y,a,w,h,gain)=>{
      if(k+6>position.count)return;
      const c=Math.cos(a),s=Math.sin(a);
      for(const [u,v] of corners){
        position.setXYZ(k,x+c*u*w-s*v*h,y+s*u*w+c*v*h,0);
        uv.setXY(k,(tile+.5+u*.98)/8,.5+v*.98);energy.setX(k,gain);k++;
      }
    });
    this.geometry.setDrawRange(0,k);
    for(const attr of [position,uv,energy]){
      attr.clearUpdateRanges();if(k)attr.addUpdateRange(0,k*attr.itemSize);attr.needsUpdate=true;
    }
  }
  dispose(){this.image.onload=null;this.geometry.dispose();this.material.dispose();this.texture.dispose();}
}
