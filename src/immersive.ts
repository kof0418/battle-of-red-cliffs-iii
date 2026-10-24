/** Browser fullscreen is best effort; the viewport layout also works when the API is unavailable. */
export async function enterFullscreen(doc:Document):Promise<boolean>{
 if(isFullscreen(doc))return true;
 const root=doc.documentElement as HTMLElement&{webkitRequestFullscreen?:()=>Promise<void>|void};
 try{
  if(root.requestFullscreen)await root.requestFullscreen({navigationUI:'hide'});
  else if(root.webkitRequestFullscreen)await root.webkitRequestFullscreen();
  else return false;
  return true;
 }catch{return false;}
}

export function isFullscreen(doc:Document){return !!(doc.fullscreenElement||(doc as Document&{webkitFullscreenElement?:Element}).webkitFullscreenElement);}
export async function toggleFullscreen(doc:Document){
 if(!isFullscreen(doc))return enterFullscreen(doc);
 try{if(doc.exitFullscreen)await doc.exitFullscreen();else await (doc as Document&{webkitExitFullscreen?:()=>Promise<void>|void}).webkitExitFullscreen?.();return true;}catch{return false;}
}
