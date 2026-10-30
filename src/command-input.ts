/** Ordered down → up → a fresh attack press; wall-clock milliseconds. */
export class CommandInput {
 private first:string;private second:string;
 private sequenceMs:number;private attackMs:number;private tolerateCrossAxis:boolean;
 constructor(first='down',second='up',sequenceMs=400,attackMs=280,tolerateCrossAxis=false){this.first=first;this.second=second;this.sequenceMs=sequenceMs;this.attackMs=attackMs;this.tolerateCrossAxis=tolerateCrossAxis;}
 private downAt=-Infinity;private upAt=-Infinity;
 reset(){this.downAt=-Infinity;this.upAt=-Infinity;}
 phase(now:number){return now-this.upAt<=this.attackMs?2:now-this.downAt<=this.sequenceMs?1:0;}
 press(action:string,now:number){
  if(action===this.first){this.downAt=now;this.upAt=-Infinity;}
  else if(action===this.second){this.upAt=now-this.downAt<=this.sequenceMs?now:-Infinity;this.downAt=-Infinity;}
  else if(action==='jump'||action==='dodge'||(!this.tolerateCrossAxis&&['up','down','left','right'].includes(action))){this.reset();}
  else if(action==='attack'){const valid=now-this.upAt<=this.attackMs;this.reset();return valid;}
  return false;
 }
}

export type InputSource='keyboard'|'touch'|'pad';
/** Gestures from different devices cannot accidentally form a single command. */
export class CommandBank {
 private normal={keyboard:new CommandInput(),touch:new CommandInput('down','up',650,380,true),pad:new CommandInput('down','up',450,300,true)};
 private mounted={keyboard:new CommandInput('left','right'),touch:new CommandInput('left','right',650,380,true),pad:new CommandInput('left','right',450,300,true)};
 press(source:InputSource,action:string,now:number,mounted=false){return (mounted?this.mounted:this.normal)[source].press(action,now);}
 phase(source:InputSource,now:number,mounted=false){return (mounted?this.mounted:this.normal)[source].phase(now);}
 reset(){for(const group of [this.normal,this.mounted])for(const c of Object.values(group))c.reset();}
}
