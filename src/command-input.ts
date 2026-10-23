/** Ordered down → up → a fresh attack press; wall-clock milliseconds. */
export class CommandInput {
 private first:string;private second:string;
 constructor(first='down',second='up'){this.first=first;this.second=second;}
 private downAt=-Infinity;private upAt=-Infinity;
 reset(){this.downAt=-Infinity;this.upAt=-Infinity;}
 press(action:string,now:number){
  if(action===this.first){this.downAt=now;this.upAt=-Infinity;}
  else if(action===this.second){this.upAt=now-this.downAt<=400?now:-Infinity;this.downAt=-Infinity;}
  else if(action==='left'||action==='right'||action==='jump'||action==='dodge'){this.reset();}
  else if(action==='attack'){const valid=now-this.upAt<=280;this.reset();return valid;}
  return false;
 }
}
