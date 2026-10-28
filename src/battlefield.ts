import {arenaStart,LEVELS,levelAt} from './levels.ts';
/** Deterministic stage events; the saved campaign clock is the source of truth. */
export interface FieldEvent { kind:'volley'|'fire'|'surge'|'stones'; x:number;y:number;width:number;height:number; impactAt:number; active:boolean; progress:number; }
export function fieldEvent(stage:number,wave:number,time:number,started:number):FieldEvent|null {
 if(stage>=5){
  if(wave>=levelAt(stage).waves.length)return null;const elapsed=Math.max(0,time-started),cycle=Math.floor(elapsed/9),phase=elapsed%9;if(phase<4||phase>6)return null;
  const column=stage===5||stage===8;return {kind:stage===5?'volley':stage===6?'surge':stage===7?'fire':'stones',x:arenaStart(wave,levelAt(stage))+(column?[150,390,650][cycle%3]:25),y:column?350:[350,410,450][cycle%3],width:column?160:920,height:column?153:48,impactAt:started+cycle*9+5.6,active:phase>=5.6,progress:Math.min(1,(phase-4)/1.6)};
 }
 if(stage>=2)return null;
 if(wave<1||wave>=LEVELS[stage].waves.length)return null; // Boss arenas remain focused on their own telegraphs.
 const elapsed=Math.max(0,time-started),cycle=Math.floor(elapsed/7),phase=elapsed-cycle*7;
 if(phase<4||phase>5.85)return null;
 const fire=stage===1;
 return {kind:fire?'fire':'volley',x:fire?arenaStart(wave)+25:arenaStart(wave)+[215,25,405,595,785][Math.floor(cycle/3)%5],
 y:[350,400,450][cycle%3],width:fire?945:190,height:54,
 impactAt:started+cycle*7+5.4,active:phase>=5.4,progress:Math.min(1,(phase-4)/1.4)};
}
export function fieldHits(event:FieldEvent,hero:{x:number;y:number;z:number;inv:number;hp:number}) {
 return hero.hp>0&&hero.inv<=0&&(event.kind==='volley'||event.kind==='stones'||hero.z<=38)&&hero.x>=event.x&&hero.x<=event.x+event.width&&hero.y>=event.y&&hero.y<=event.y+event.height;
}
