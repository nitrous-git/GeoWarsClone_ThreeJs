export function pen(ink,x,y,a,scale=1) {
  const c=Math.cos(a)*scale,s=Math.sin(a)*scale;
  const xy=(u,v)=>[x+c*u-s*v,y+s*u+c*v];
  return {
    line(u,v,j,k,w,color,alpha=1){ink.stroke(...xy(u,v),...xy(j,k),w*scale,color,alpha);},
    poly(points,fill,stroke,w=.1){
      const p=points.map(([u,v])=>xy(u,v));
      if(fill!==null)for(let i=1;i<p.length-1;i++)ink.triangle(...p[0],...p[i],...p[i+1],fill);
      if(stroke!==null)for(let i=0;i<p.length;i++)ink.stroke(...p[i],...p[(i+1)%p.length],w*scale,stroke);
    }
  };
}
