import {DEFAULT_BINDINGS,keyAction,type Pad} from './controls.ts';
export function coopKey(code:string,player:1|2){
 if(player===1)return code.startsWith('Arrow')?undefined:keyAction(code,DEFAULT_BINDINGS);
 return ({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',KeyU:'attack',KeyI:'jump',KeyO:'dodge',Numpad1:'attack',Numpad2:'jump',Numpad3:'dodge'} as Record<string,string>)[code];
}
/** First controller belongs to P2, second to P1; unplugging never moves the remaining controller. */
export class CoopPads {
 private slots:(number|undefined)[]=[undefined,undefined];
 reset(){this.slots=[undefined,undefined];}
 route(pads:readonly (Pad|null)[]){
  for(const pad of pads)if(pad?.mapping==='standard'&&!this.slots.includes(pad.index)){
   const vacant=(slot:number)=>this.slots[slot]===undefined||!pads.some(p=>p?.index===this.slots[slot]&&p?.mapping==='standard');
   const slot=vacant(1)?1:vacant(0)?0:-1;if(slot>=0)this.slots[slot]=pad.index;
  }
  return this.slots.map(index=>pads.find(p=>p?.index===index)??null);
 }
}
