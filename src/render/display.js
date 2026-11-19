export async function createDisplay(canvas,world,settings) {
  const context=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:true,stencil:false,powerPreference:'high-performance'});
  if(context){
    const { Display }=await import('./renderer.js');
    return new Display(canvas,world,settings,context);
  }
  const { CanvasDisplay }=await import('./software.js');
  return new CanvasDisplay(canvas,world,settings);
}
