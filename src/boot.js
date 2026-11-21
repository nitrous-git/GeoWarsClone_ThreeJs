const error = document.getElementById('graphic-error'),copy=document.getElementById('error-copy');
import('./main.js').then(m=>m.start()).catch(e=>{
  console.error('GeoWarsClone startup',e);error.hidden=false;
  copy.textContent=location.protocol==='file:'?'Open index.html through WebStorm or a local HTTP server.':'Enable WebGL 2 in your browser and reload the flight deck.';
});
