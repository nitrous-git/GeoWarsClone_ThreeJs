// A slow or unreachable CDN must not hold the flight deck hostage.
const cdn = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';
const local = new URL('../../assets/vendor/three-0.169.0.module.min.js', import.meta.url).href;
let timeout;
const deadline = new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('CDN timeout')),2200);});
const three = await Promise.race([import(cdn), deadline]).catch(()=>import(local)).finally(()=>clearTimeout(timeout));
export const {AdditiveBlending,NormalBlending,BufferAttribute,BufferGeometry,Camera,DataTexture,DoubleSide,
  DynamicDrawUsage,LinearFilter,LineSegments,Mesh,OrthographicCamera,PlaneGeometry,RedFormat,RepeatWrapping,
  Scene,ShaderMaterial,Vector2,Vector4,WebGLRenderer,WebGLRenderTarget}=three;
