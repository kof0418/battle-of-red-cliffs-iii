/** Ordered down → up → a fresh attack press; wall-clock milliseconds. */
export class CommandInput {
 private downAt=-Infinity;private upAt=-Infinity;
 reset(){this.downAt=-Infinity;this.upAt=-Infinity;}
 press(action:string,now:number){
  if(action==='down'){this.downAt=now;this.upAt=-Infinity;}
  else if(action==='up'){this.upAt=now-this.downAt<=400?now:-Infinity;this.downAt=-Infinity;}
  else if(action==='left'||action==='right'||action==='jump'||action==='dodge'){this.reset();}
  else if(action==='attack'){const valid=now-this.upAt<=280;this.reset();return valid;}
  return false;
 }
}
