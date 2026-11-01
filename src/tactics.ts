import {BOSS_GUIDES} from './boss-guide.ts';
/** Encounter rules are deterministic and independent of rendering. */
export type Difficulty='easy'|'normal'|'hard';
export const DIFFICULTIES={easy:{name:'休閒',attackers:1,ranged:1,windup:1.2,damage:.85,hurtGrace:.9,wakeGrace:.6},normal:{name:'標準',attackers:2,ranged:1,windup:1,damage:1,hurtGrace:.75,wakeGrace:.45},hard:{name:'挑戰',attackers:3,ranged:2,windup:.9,damage:1.1,hurtGrace:.75,wakeGrace:.35}} as const;
export function isDifficulty(v:unknown):v is Difficulty{return v==='easy'||v==='normal'||v==='hard';}
export function bossPhase(hp:number,max:number){return hp>max*.65?0:hp>max*.3?1:2;}
export type BossMove='slam'|'charge'|'sweep'|'fan'|'ring'|'cross'|'lanes'|'fork'|'surge';
const PLANS:Record<string,readonly (readonly BossMove[])[]>={
 bridgeguard:[['sweep','slam'],['slam','charge','sweep'],['charge','sweep','slam']],
 bridgearcher:[['fan','surge'],['surge','fan','charge'],['fan','charge','surge']],
 admiral:[['surge','sweep'],['ring','surge','charge'],['surge','ring','sweep']],
 firelord:[['lanes','slam'],['lanes','charge','slam'],['charge','lanes','sweep']],
 pursuer:[['fork','charge'],['charge','fork','sweep'],['fork','sweep','charge']],
 warlord:[['fork','cross','surge'],['cross','lanes','fork'],['lanes','fork','charge','cross']],
 boss:[['slam','charge'],['slam','charge','sweep'],['charge','sweep','slam']],
 marshal:[['sweep','charge','slam'],['charge','sweep','charge','slam'],['sweep','charge','sweep','slam']],
 hunter:[['fan','charge','fan'],['fan','charge','sweep'],['fan','charge','fan','sweep']],
 frostlord:[['ring','slam','ring'],['ring','charge','slam'],['slam','ring','charge','slam']],
 regent:[['cross','sweep','charge'],['cross','charge','sweep','cross'],['charge','cross','sweep','slam']],
};
export function bossPlan(kind:string,hp:number,max:number,attacks:number,spacing?:{dx:number;dy:number}){
 const phase=bossPhase(hp,max),moves=PLANS[kind][phase];
 let move=moves[attacks%moves.length];
 if(spacing){
  const x=Math.abs(spacing.dx),y=Math.abs(spacing.dy);
  if(kind==='bridgeguard')move=x>170?'charge':x<85&&y<35?'slam':'sweep';
  else if(kind==='bridgearcher')move=x<100?'surge':'fan';
  else if(kind==='admiral')move=x<90?'sweep':y>40?'ring':'surge';
  else if(kind==='firelord')move=x<90&&y<35?'slam':'lanes';
  else if(kind==='pursuer')move=x>220?'charge':y>35?'fork':'sweep';
  else if(kind==='warlord')move=x<90&&y<30?'sweep':y>45?'cross':move;
  else if(kind==='hunter')move=x<110?'sweep':move==='charge'&&x<250?'charge':'fan';
  else if(kind==='frostlord')move=x<70&&y<45?'slam':x<155?(phase>0&&attacks%3===2&&x<125?'slam':'ring'):'charge';
  else if(kind==='marshal')move=x>160?'charge':attacks%2?'slam':'sweep';
  else if(kind==='boss')move=x>125?'charge':phase>0&&attacks%2?'sweep':'slam';
  else if(kind==='regent')move=phase===2&&attacks%3===2&&x<100&&y<27?'slam':y>28||attacks%2===0?'cross':x<155?'sweep':'charge';
 }
 const base=['lanes','fork','surge'].includes(move)?1.10:move==='ring'?1.15:move==='cross'?1.05:move==='fan'?.9:.85;
 // Even the final phase keeps at least 650 ms of warning. Every sequence ends in a large opening.
 const windup=Math.max(.72,base-phase*.07),finisher=attacks%moves.length===moves.length-1;
 return {move,windup,recovery:finisher?(BOSS_GUIDES[kind as keyof typeof BOSS_GUIDES]?.opening??1.15):phase===2?.8:.9,gap:finisher?.45:.18,phase};
}
export function frontalGuard(face:number,x:number,y:number,sourceX:number,sourceY:number){return (sourceX-x)*face>=-6&&Math.abs(sourceY-y)<40;}

export const BOSS_STYLE:Record<string,{name:string;reach:number;lane:number;stop:number}>={
 bridgeguard:{name:'裂石重戟',reach:240,lane:35,stop:110},bridgearcher:{name:'逐浪箭扇',reach:310,lane:75,stop:210},admiral:{name:'鐵錨潮衝',reach:280,lane:70,stop:140},firelord:{name:'焰舵三線',reach:300,lane:90,stop:160},pursuer:{name:'夜隼雙叉',reach:290,lane:80,stop:160},warlord:{name:'玄甲追斬',reach:310,lane:95,stop:170},
 boss:{name:'近身重砸',reach:250,lane:27,stop:110},
 marshal:{name:'突進橫掃',reach:250,lane:27,stop:140},
 hunter:{name:'游擊箭陣',reach:320,lane:80,stop:225},
 frostlord:{name:'內外震地',reach:250,lane:90,stop:115},
 regent:{name:'交叉封路',reach:300,lane:120,stop:180},
};
export function enemyTempo(kind:string,attacks:number){
 if(kind==='thrower')return {windup:.95,recovery:.7,gap:1.1};
 if(kind==='brute')return {windup:attacks%2?.52:.65,recovery:attacks%2?.85:.26,gap:attacks%2?.7:.12};
 if(kind==='mauler')return {windup:1.15,recovery:1.05,gap:.45};
 if(kind==='hammer')return {windup:1.05,recovery:.85,gap:.4};
 if(kind==='spearman')return {windup:.65,recovery:.42,gap:.6};
 if(kind==='archer')return {windup:.95,recovery:.35,gap:1.05};
 return {windup:kind==='heavy'?.7:.48,recovery:.32,gap:.8};
}

export function incomingDamage(difficulty:Difficulty,base:number){return Math.max(1,Math.round(base*DIFFICULTIES[difficulty].damage));}
