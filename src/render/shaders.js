// All scene shaders emit display-referred linear values into our own post chain.
export const quadVertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
export const screenVertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;

export const noiseFunctions = `
uniform sampler2D grain;
float noise2(vec2 p){return texture2D(grain,p/256.).r;}
float cloud(vec2 p){
  return noise2(p)*.53+noise2(p*2.07+34.)*.27+noise2(p*4.21-24.)*.14+noise2(p*8.31)*.06;
}
float ridge(float x,float width){return exp(-min(70.,abs(x)/max(width,.0001)));}
mat2 turn(float a){float s=sin(a),c=cos(a);return mat2(c,s,-s,c);}
`;

// A tilted, optically thin disk plus two lensed images of its far side.
// The horizon masks background radiance; the foreground band crosses it.
export const accretion = `
vec3 plasma(float energy){
  return vec3(1.,.21,.028)*energy + vec3(1.,.68,.29)*pow(max(energy,0.),1.85)*.72;
}
vec3 horizon(vec2 point,float t,vec3 back){
  vec2 p=turn(-.27)*point;
  float r=length(p),theta=atan(p.y,p.x);
  float core=.86;
  float diskR=length(vec2(p.x,p.y/.238)),diskA=atan(p.y/.238,p.x);
  float flow=cloud(vec2(diskR*33.+4.*sin(diskA*2.+diskR*.7),sin(diskA-t*.035)*4.+cos(diskA-t*.04)*3.));
  float striae=.5+.5*sin(diskR*80.+flow*9.+2.2*sin(diskA*3.+diskR-t*.5));
  float edge=smoothstep(.84,1.05,diskR);
  float disc=edge*exp(-max(diskR-1.04,0.)*1.05)*(1.-smoothstep(2.6,4.15,diskR));
  float beam=.83+.29*cos(diskA-.32);
  float threads=.37+flow*.66+.48*pow(striae,4.);
  float band=disc*beam*threads;
  vec3 base=back+vec3(.27,.054,.013)*ridge(r-1.08,.38);
  float arcR=length(vec2(p.x,p.y/(p.y>0.?1.04:.80)));
  float turb=cloud(vec2(arcR*33.,sin(theta-t*.10)*7.+cos(theta+.9)*4.));
  float line=pow(.5+.5*sin(arcR*140.+turb*6.+sin(theta*4.+t)*1.2),4.);
  float above=.25+.75*smoothstep(-.15,.7,p.y);
  float arc=exp(-max(arcR-.98,0.)*6.)*smoothstep(.87,.985,arcR)*( .38+turb*.75+line*.55)*above;
  float photon=ridge(arcR-.957,.016)*(.53+.30*cos(theta));
  float front=step(p.y,0.);
  base+=plasma(band*(1.-front));
  base=mix(base,vec3(.012,.008,.014)+.017*vec3(1.,.28,.12)*r,(1.-smoothstep(core-.01,core+.075,arcR)));
  base+=plasma(arc+photon);
  base+=plasma(band*front);
  // A slender near-side image and hot inner caustic.
  float caustic=ridge(diskR-1.15,.034)*(.65+.35*flow);
  base+=plasma(caustic)*(.55+.45*front);
  return base;
}
`;

export const backdropFragment = `
varying vec2 vUv;
uniform float time,aspect,menu,reduced;
uniform vec2 center;
uniform float radius;
`+noiseFunctions+accretion+`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float starfield(vec2 p,float density) {
  vec2 cell=floor(p*density), local=fract(p*density)-.5;
  float seed=hash(cell), bright=step(.89,seed)*pow(seed,8.);
  local-=(vec2(hash(cell+17.),hash(cell-41.))-.5)*.67;
  float d=length(local);
  return bright*exp(-d*d*126.)*(.65+.35*hash(cell-.85));
}
float hair(float d,float width){return 1.-smoothstep(width,width+max(.0004,fwidth(d)),abs(d));}
void main(){
  vec2 screen=vec2(vUv.x*aspect,vUv.y);
  vec2 q=(vUv-center)*vec2(aspect,1.)/radius;
  float t=time*(1.-reduced*.85);
  vec2 field=screen;
  float dist=length(q);
  if(menu>.5) field-=(q/(.5+dist*dist))*.041;
  float neb=cloud(field*5.3+vec2(23.8,8.6));
  float dust=cloud(field*36.+vec2(2.,8.));
  float stars=starfield(field+3.,270.)*.48+starfield(field+5.,113.)*.81;
  vec3 col=vec3(.013,.022,.031)+vec3(.037,.082,.121)*pow(neb,1.6)+vec3(.015,.020,.027)*dust;
  float mist=cloud(field*11.+vec2(95.,52.))*.68+cloud(field*26.+19.)*.32;
  float stream=exp(-pow((field.y-.38-.13*sin(field.x*3.+neb*2.))/.26,2.));
  col+=vec3(.028,.078,.125)*pow(mist*1.33,3.)*stream;
  col+=vec3(.61,.78,.85)*stars;
  col+=vec3(.73,.81,.86)*starfield(field*.68+15.,70.)*.82;
  if(menu>.5){
    // The distant blue limb and its inclined rings frame the title.
    vec2 sky=(vUv-vec2(.83,.88))*vec2(aspect,1.);
    float planet=length(sky)-.218;
    float light=.38+.62*clamp(dot(normalize(sky+vec2(.0001)),normalize(vec2(-.85,-.7))),0.,1.);
    col=mix(col,vec3(.008,.014,.061)+vec3(.025,.042,.13)*cloud(sky*25.),1.-smoothstep(-.002,.002,planet));
    col+=light*vec3(.12,.4,1.)*(.41*exp(-abs(planet)*44.)+1.45*exp(-abs(planet)*420.));
    vec2 tilted=turn(.36)*sky;
    float orbit=length(vec2(tilted.x,tilted.y*3.9));
    float visible=planet>0.||tilted.y<0.?1.:0.;
    col+=visible*vec3(.19,.37,.88)*(.45*ridge(orbit-.30,.0019)+.76*ridge(orbit-.35,.0026)+.26*ridge(orbit-.366,.001));
    float band=exp(-pow((vUv.y-.64+vUv.x*.31+.08*sin(8.*vUv.x+neb*2.))/.145,2.));
    float gas=cloud(field*19.+vec2(t*.033,1.));
    col+=band*pow(gas*1.38,3.)*mix(vec3(.035,.12,.36),vec3(.22,.048,.38),neb);
    float floorY=.295+.024*sin(vUv.x*5.);
    if(vUv.y<floorY){
      float depth=floorY-vUv.y;
      vec2 space=vec2((vUv.x-.50)*aspect/(depth+.016)*1.6,1./(depth+.016)*.78+t*.12);
      space.y+=.19*sin(space.x*.65);
      vec2 grid=abs(fract(space-.5)-.5)/max(fwidth(space),vec2(.001));
      float wire=1.-smoothstep(.0,1.1,min(grid.x,grid.y));
      col+=wire*smoothstep(.006,.11,depth)*mix(vec3(.035,.12,.66),vec3(.20,.07,.65),vUv.x)*.76;
    }
    col+=vec3(.045,.11,.38)*exp(-abs(vUv.y-floorY)*26.)*(.3+.7*neb);
    col+=starfield(field+vec2(.0,-t*.0018),67.)*vec3(.58,.76,1.);
  }
  gl_FragColor=vec4(col,1.);
}
`;
// Small wells use exactly the same emissive model. A solid interior occludes
// the lattice, while transparent outskirts preserve the warped grid beneath.
export const wellFragment = `
varying vec2 vUv;uniform float time,hot;
`+noiseFunctions+accretion+`
void main(){vec2 p=(vUv-.5)*7.4;float r=length(p);
  vec3 c=horizon(p,time,vec3(0.));float glow=max(max(c.r,c.g),c.b);
  float a=max((1.-smoothstep(.73,1.,r)),clamp(glow*2.2,0.,1.))*(1.-smoothstep(3.2,3.65,r));
  if(a<.004)discard;
  gl_FragColor=vec4(c/max(.001,a)+vec3(.28,.09,.03)*hot,a);
}
`;
export const blurFragment = `
varying vec2 vUv;uniform sampler2D source;uniform vec2 stride;uniform float extract;
vec3 tap(vec2 uv){vec3 c=texture2D(source,uv).rgb;return extract>.5?max(c-vec3(.24),vec3(0.)):c;}
void main(){vec3 c=tap(vUv)*.227027;
 c+=(tap(vUv+stride*1.384615)+tap(vUv-stride*1.384615))*.316216;
 c+=(tap(vUv+stride*3.230769)+tap(vUv-stride*3.230769))*.070270;
 gl_FragColor=vec4(c,1.);}
`;
export const finalFragment = `
varying vec2 vUv;uniform sampler2D sceneTex,bloomTex,wideTex;uniform float bloom,aspect;
uniform vec4 lenses[2];
void main(){vec2 uv=vUv;
 for(int i=0;i<2;i++){
  vec2 delta=(uv-lenses[i].xy)*vec2(aspect,1.);
  float d=length(delta)/max(.0001,lenses[i].z);
  uv-=vec2(delta.x/aspect,delta.y)*exp(-d*d*1.45)*.21*lenses[i].w;
 }
 vec3 c=texture2D(sceneTex,uv).rgb+(texture2D(bloomTex,uv).rgb+texture2D(wideTex,uv).rgb*.92)*bloom;
 gl_FragColor=vec4(c/(1.+.17*c),1.);}
`;
