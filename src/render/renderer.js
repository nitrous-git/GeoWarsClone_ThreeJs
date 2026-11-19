import * as T from 'three';
import { ARENA, TAU, rng } from '../game/rules.js';
import { border } from './border.js';
import { SpriteBatch } from './sprite-batch.js';
import { Ink } from './ink.js';
import { craft, fluxGlyph, glyph, fieldLights, orbitTrails } from './glyphs.js';
import { Effects } from './effects.js';
import { quadVertex,screenVertex,backdropFragment,wellFragment,blurFragment,finalFragment } from './shaders.js';
const uni=value=>({value});
const additive=T.AdditiveBlending;
function material(vertexShader,fragmentShader,uniforms,extra={}) {
  return new T.ShaderMaterial({vertexShader,fragmentShader,uniforms,depthTest:false,depthWrite:false,...extra});
}
function makeNoise(){
  const rand=rng(4178),bytes=new Uint8Array(256*256);
  for(let i=0;i<bytes.length;i++)bytes[i]=rand()*255;
  const tex=new T.DataTexture(bytes,256,256,T.RedFormat);
  tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=tex.minFilter=T.LinearFilter;tex.needsUpdate=true;return tex;
}
class GridView {
  constructor(scene,grid){
    const {cols,rows,sx,sy}=grid,n=rows*cols;
    this.base=new Float32Array(n*3);this.coords=new Float32Array(n*3);const index=[];
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const k=j*cols+i;this.base[k*3]=i*sx-ARENA.halfWidth;this.base[k*3+1]=j*sy-ARENA.halfHeight;
      if(i+1<cols)index.push(k,k+1);if(j+1<rows)index.push(k,k+cols);
    }
    this.geo=new T.BufferGeometry();this.geo.setIndex(index);
    this.geo.setAttribute('position',new T.BufferAttribute(this.coords,3).setUsage(T.DynamicDrawUsage));
    this.geo.setAttribute('rest',new T.BufferAttribute(this.base,3));
    this.mat=material(`attribute vec3 rest;varying float strain;varying vec2 location;
      void main(){strain=length(position.xy-rest.xy);location=rest.xy;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      `varying float strain;varying vec2 location;void main(){
      float belt=.5+.5*sin(location.x*.055+location.y*.124);
      vec3 base=mix(vec3(.034,.054,.19),vec3(.051,.10,.31),belt);
      gl_FragColor=vec4(base+vec3(.13,.20,.64)*min(1.65,strain),.84);}`,{},
      {transparent:true,blending:additive});
    const m=new T.LineSegments(this.geo,this.mat);m.frustumCulled=false;m.renderOrder=1;scene.add(m);
  }
  sync(g){
    for(let i=0;i<g.x.length;i++){const k=i*3;this.coords[k]=this.base[k]+g.x[i];this.coords[k+1]=this.base[k+1]+g.y[i];}
    this.geo.attributes.position.needsUpdate=true;
  }
  dispose(){this.geo.dispose();this.mat.dispose();}
}
export class Display {
  constructor(canvas,world,settings,context){
    this.canvas=canvas;this.settings=settings;
    this.gl=new T.WebGLRenderer({canvas,context,antialias:false,alpha:false,powerPreference:'high-performance'});
    this.gl.autoClear=false;this.noise=makeNoise();this.plane=new T.PlaneGeometry(2,2);
    this.screenCam=new T.Camera();this.camera=new T.OrthographicCamera(-56,56,35,-35,.01,100);
    this.camera.position.z=10;this.screenScene=new T.Scene();this.scene=new T.Scene();this.effects=new Effects(settings);
    this.back=material(screenVertex,backdropFragment,{time:uni(0),grain:uni(this.noise),aspect:uni(1),menu:uni(1),
      radius:uni(.16),center:uni(new T.Vector2(.70,.52)),reduced:uni(0)});
    this.blur=material(screenVertex,blurFragment,{source:uni(null),stride:uni(new T.Vector2()),extract:uni(0)});
    this.lenses=[new T.Vector4(),new T.Vector4()];
    this.final=material(screenVertex,finalFragment,{sceneTex:uni(null),bloomTex:uni(null),wideTex:uni(null),
      bloom:uni(.6),aspect:uni(1),lenses:uni(this.lenses)});
    this.quad=new T.Mesh(this.plane,this.back);this.quad.frustumCulled=false;this.screenScene.add(this.quad);
    this.sprites=new SpriteBatch(this.scene);this.grid=new GridView(this.scene,world.grid);
    this.rim=new Ink(this.scene,1.1,false,5500);this.rim.begin();border(this.rim);this.rim.end();
    this.light=new Ink(this.scene,1.4,true,14000);this.ink=new Ink(this.scene,3,false,90000);this.fx=new Ink(this.scene,4,true,95000);
    this.holes=Array.from({length:2},()=>{
      const mat=material(quadVertex,wellFragment,{grain:uni(this.noise),time:uni(0),hot:uni(0)},{transparent:true});
      const m=new T.Mesh(this.plane,mat);m.renderOrder=2;m.scale.setScalar(7.1);this.scene.add(m);return m;
    });
    const options={type:this.gl.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:false,stencilBuffer:false};
    this.target=new T.WebGLRenderTarget(1,1,options);
    this.wide=new T.WebGLRenderTarget(1,1,options);this.haze=new T.WebGLRenderTarget(1,1,options);
    this.bright=new T.WebGLRenderTarget(1,1,options);this.soft=new T.WebGLRenderTarget(1,1,options);
    this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
  }
  resize(){
    const rect=this.canvas.getBoundingClientRect();
    this.width=Math.max(1,rect.width);this.height=Math.max(1,rect.height);this.aspect=this.width/this.height;
    const ratio=Math.min(devicePixelRatio||1,this.settings.quality==='high'?1.65:1);
    const w=Math.max(2,Math.round(this.width*ratio)),h=Math.max(2,Math.round(this.height*ratio));
    this.gl.setSize(w,h,false);this.target.setSize(w,h);
    this.bright.setSize(Math.max(1,w>>2),Math.max(1,h>>2));this.soft.setSize(this.bright.width,this.bright.height);
    this.wide.setSize(Math.max(1,w>>4),Math.max(1,h>>4));this.haze.setSize(this.wide.width,this.wide.height);
    const hh=Math.max(34.5,54.5/this.aspect);this.hh=hh;this.hw=hh*this.aspect;
    Object.assign(this.camera,{left:-this.hw,right:this.hw,top:hh,bottom:-hh});this.camera.updateProjectionMatrix();
    this.back.uniforms.aspect.value=this.final.uniforms.aspect.value=this.aspect;
  }
  aim(clientX,clientY,p){
    const r=this.canvas.getBoundingClientRect();
    const x=((clientX-r.left)/r.width*2-1)*this.hw+this.camera.position.x;
    const y=(1-(clientY-r.top)/r.height*2)*this.hh+this.camera.position.y;
    return Math.atan2(y-p.y,x-p.x);
  }
  pass(mat,target){
    this.quad.material=mat;this.gl.setRenderTarget(target);this.gl.render(this.screenScene,this.screenCam);
  }
  paintWorld(w,t){
    this.grid.sync(w.grid);this.light.begin();fieldLights(this.light,w,t,this.settings);this.light.end();this.ink.begin();this.fx.begin();
    const j=this.settings.shake&&!this.settings.reduced?this.effects.shake*.45:0;
    this.camera.position.x=j*Math.sin(t*78);this.camera.position.y=j*Math.cos(t*94);
    let holes=0;
    for(const e of w.enemies){
      glyph(this.ink,e,t);
      if(e.type!=='well' || e.warn>0 || holes>=2) continue;
      const m=this.holes[holes];m.visible=true;m.position.set(e.x,e.y,0);
      m.material.uniforms.time.value=t+e.phase;
      m.material.uniforms.hot.value=e.hit*8+(1-e.hp/10)*.24;
      this.lenses[holes].set(.5+(e.x-this.camera.position.x)/(2*this.hw),.5+(e.y-this.camera.position.y)/(2*this.hh),5/this.hh,1);
      orbitTrails(this.fx,e,this.settings.quality==='standard');
      holes++;
    }
    for(let i=holes;i<2;i++){this.holes[i].visible=false;this.lenses[i].w=0;}
    for(const s of w.shards)fluxGlyph(this.ink,s,t);
    this.sprites.sync(w);
    if(!w.over)craft(this.ink,w.player,t);
    this.effects.draw(this.fx,this.settings.reduced);this.ink.end();this.fx.end();
    this.gl.render(this.scene,this.camera);
  }
  render(world,isMenu,time) {
    const bg=this.back.uniforms;bg.menu.value=isMenu?1:0;bg.time.value=time;bg.reduced.value=+this.settings.reduced;
    const compact=innerWidth<=680;
    bg.center.value.set(compact?.69:.727,compact?.692:.526);
    bg.radius.value=compact?Math.min(.115,this.aspect*.19):Math.min(.163,this.aspect*.125);
    this.pass(this.back,this.target);
    if(!isMenu)this.paintWorld(world,time);
    else for(const v of this.lenses)v.w=0;
    const b=this.blur.uniforms;
    if(this.settings.bloom){
      b.source.value=this.target.texture;b.extract.value=1;b.stride.value.set(2.4/this.target.width,0);this.pass(this.blur,this.bright);
      b.source.value=this.bright.texture;b.extract.value=0;b.stride.value.set(0,1.65/this.bright.height);this.pass(this.blur,this.soft);
      b.source.value=this.soft.texture;b.stride.value.set(3/this.soft.width,0);this.pass(this.blur,this.wide);
      b.source.value=this.wide.texture;b.stride.value.set(0,1.5/this.wide.height);this.pass(this.blur,this.haze);
    }
    this.final.uniforms.wideTex.value=this.haze.texture;this.final.uniforms.sceneTex.value=this.target.texture;this.final.uniforms.bloomTex.value=this.soft.texture;
    this.final.uniforms.bloom.value=this.settings.bloom?(this.settings.reduced?.35:1.10):0;this.pass(this.final,null);
  }
  dispose(){
    this.observer.disconnect();this.grid.dispose();this.sprites.dispose();this.light.dispose();this.ink.dispose();this.fx.dispose();this.rim.dispose();
    for(const m of this.holes)m.material.dispose();
    for(const r of [this.plane,this.noise,this.back,this.blur,this.final,this.target,this.bright,this.soft,this.wide,this.haze,this.gl])r.dispose();
  }
}
