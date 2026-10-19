export const ACTIONS = ['up','down','left','right','attack','jump','dodge','special','pause'] as const;
export type Action = typeof ACTIONS[number];
export type Bindings = Record<Action,string>;
export const CONTROL_KEY = 'red-banner-controls-v1';
export const DEFAULT_BINDINGS: Bindings = {up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',attack:'KeyJ',jump:'KeyK',dodge:'KeyL',special:'KeyI',pause:'KeyP'};
export const ACTION_LABELS: Record<Action,string> = {up:'向上',down:'向下',left:'向左',right:'向右',attack:'攻擊',jump:'跳躍',dodge:'閃身',special:'必殺技',pause:'暫停'};
export const VALID_KEYS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').filter(k=>k!=='R').map(k=>'Key'+k);
export function parseBindings(raw: unknown): Bindings {
 if(!raw || typeof raw!=='object')return {...DEFAULT_BINDINGS};
 const b={...raw} as Bindings;
 if(!('special' in raw)) b.special=VALID_KEYS.find(k=>k==='KeyI'&&!Object.values(b).includes(k))??VALID_KEYS.find(k=>!Object.values(b).includes(k))!;
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
export interface Pad { index:number; mapping:string; axes:readonly number[]; buttons:readonly {pressed:boolean}[]; }
export class PadInput {
 private previous=new Set<string>(); private index=-1; private armed=false;
 reset(){this.previous.clear();this.armed=false;}
 read(pads:readonly (Pad|null)[]) {
  const pad=pads.find(p=>p?.mapping==='standard');const held=new Set<string>(),pressed=new Set<string>();
  const disconnected=this.index!==-1&&!pad;
  if(!pad){this.index=-1;this.reset();return {held,pressed,connected:false,disconnected};}
  if(this.index!==pad.index){this.reset();this.index=pad.index;}
  const axis=(i:number)=>Number.isFinite(pad.axes[i])?pad.axes[i]:0;
  const button=(i:number)=>pad.buttons[i]?.pressed===true;
  if(axis(0)<-.25||button(14))held.add('left');if(axis(0)>.25||button(15))held.add('right');
  if(axis(1)<-.25||button(12))held.add('up');if(axis(1)>.25||button(13))held.add('down');
  for(const [i,a] of [[0,'attack'],[1,'jump'],[2,'dodge'],[3,'special'],[9,'pause'],[8,'settings']] as const)if(button(i))held.add(a);
  if(!this.armed){if(!held.size)this.armed=true;return {held:new Set<string>(),pressed,connected:true,disconnected};}
  for(const a of held)if(!this.previous.has(a))pressed.add(a);
  this.previous=held;return {held,pressed,connected:true,disconnected};
 }
}
