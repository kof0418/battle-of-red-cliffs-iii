export const ACTIONS = ['up','down','left','right','attack','jump','dodge','pause'] as const;
export type Action = typeof ACTIONS[number];
export type Bindings = Record<Action,string>;
export const CONTROL_KEY = 'red-banner-controls-v1';
export const DEFAULT_BINDINGS: Bindings = {up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',attack:'KeyJ',jump:'KeyK',dodge:'KeyL',pause:'KeyP'};
export const ACTION_LABELS: Record<Action,string> = {up:'向上',down:'向下',left:'向左',right:'向右',attack:'攻擊',jump:'跳躍',dodge:'衝撞',pause:'暫停'};
export const VALID_KEYS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').filter(k=>k!=='R').map(k=>'Key'+k);
export function parseBindings(raw: unknown): Bindings {
 if(!raw || typeof raw!=='object')return {...DEFAULT_BINDINGS};
 const b={...raw} as Bindings;
 if(ACTIONS.some(a=>!VALID_KEYS.includes(b[a])) || new Set(ACTIONS.map(a=>b[a])).size!==ACTIONS.length)return {...DEFAULT_BINDINGS};
 return Object.fromEntries(ACTIONS.map(a=>[a,b[a]])) as Bindings;
}
export function remap(bindings: Bindings, action: Action, code: string): Bindings {
 if(!VALID_KEYS.includes(code))throw new Error('請選擇 A–Z（R 保留為重開）。');
 if(ACTIONS.some(a=>a!==action&&bindings[a]===code))throw new Error('此按鍵已使用，請先更換另一個動作。');
 return {...bindings,[action]:code};
}
export function keyAction(code: string, bindings: Bindings): string | undefined {
 const fixed:Record<string,string>={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Space:'jump',Enter:'start',KeyR:'restart'};
 return fixed[code] ?? ACTIONS.find(a=>bindings[a]===code);
}
export const PAD_ACTIONS=['attack','jump','dodge'] as const;
export type PadBindings=Record<typeof PAD_ACTIONS[number],number>;
export const DEFAULT_PAD_BINDINGS:PadBindings={attack:0,jump:1,dodge:2};
export const PAD_LABELS=['A／×','B／○','X／□','Y／△','LB／L1','RB／R1','LT／L2','RT／R2'];
export function parsePadBindings(raw:unknown):PadBindings{
 if(!raw||typeof raw!=='object')return {...DEFAULT_PAD_BINDINGS};const b=raw as PadBindings;
 if(PAD_ACTIONS.some(a=>!Number.isInteger(b[a])||b[a]<0||b[a]>7)||new Set(PAD_ACTIONS.map(a=>b[a])).size!==3)return {...DEFAULT_PAD_BINDINGS};
 return {attack:b.attack,jump:b.jump,dodge:b.dodge};
}
export function remapPad(bindings:PadBindings,action:typeof PAD_ACTIONS[number],button:number){
 if(!Number.isInteger(button)||button<0||button>7)throw new Error('Start、Back 與方向鍵保留。');
 if(PAD_ACTIONS.some(a=>a!==action&&bindings[a]===button))throw new Error('此按鈕已使用，請先更換另一個動作。');
 return {...bindings,[action]:button};
}
export interface Pad { id?:string; index:number; mapping:string; axes:readonly number[]; buttons:readonly {pressed:boolean}[]; }
export class PadInput {
 private previous=new Set<string>(); private index=-1; private identity=''; private armed=false;
 reset(){this.previous.clear();this.armed=false;}
 read(pads:readonly (Pad|null)[],bindings:PadBindings=DEFAULT_PAD_BINDINGS) {
  const pad=pads.find(p=>p?.mapping==='standard');const held=new Set<string>(),pressed=new Set<string>();
  const identity=pad?`${pad.index}/${pad.id??''}`:'';
  const disconnected=this.index!==-1&&(!pad||this.identity!==identity);
  const family=pad&&/xbox|xinput|045e|microsoft/i.test(pad.id??'')?'Xbox':'標準';
  if(!pad){this.index=-1;this.identity='';this.reset();return {held,pressed,connected:false,disconnected,family};}
  if(this.identity!==identity){this.reset();this.index=pad.index;this.identity=identity;}
  const axis=(i:number)=>Number.isFinite(pad.axes[i])?pad.axes[i]:0;
  const button=(i:number)=>pad.buttons[i]?.pressed===true;
  const direction=(negative:string,positive:string,value:number,minus:boolean,plus:boolean)=>{
   if(minus||plus){if(minus&&!plus)held.add(negative);if(plus&&!minus)held.add(positive);return;}
   if(value<-(this.previous.has(negative)?.20:.35))held.add(negative);
   if(value>(this.previous.has(positive)?.20:.35))held.add(positive);
  };
  direction('left','right',axis(0),button(14),button(15));direction('up','down',axis(1),button(12),button(13));
  for(const action of PAD_ACTIONS)if(button(bindings[action]))held.add(action);
  if(button(9))held.add('pause');if(button(8))held.add('settings');
  if(!this.armed){if(!held.size)this.armed=true;return {held:new Set<string>(),pressed,connected:true,disconnected,family};}
  for(const a of held)if(!this.previous.has(a))pressed.add(a);
  this.previous=held;return {held,pressed,connected:true,disconnected,family};
 }
}
