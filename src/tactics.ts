/** Encounter rules are deterministic and independent of rendering. */
export type Difficulty='easy'|'normal'|'hard';
export const DIFFICULTIES={easy:{name:'休閒',attackers:1},normal:{name:'標準',attackers:2},hard:{name:'挑戰',attackers:3}} as const;
export function isDifficulty(v:unknown):v is Difficulty{return v==='easy'||v==='normal'||v==='hard';}
export function bossPhase(hp:number,max:number){return hp>max*.65?0:hp>max*.3?1:2;}
export type BossMove='slam'|'charge'|'sweep'|'fan'|'ring'|'cross';
const PLANS:Record<string,readonly (readonly BossMove[])[]>={
 boss:[['slam','charge'],['slam','charge','sweep'],['charge','sweep','slam']],
 marshal:[['sweep','charge','slam'],['charge','sweep','charge','slam'],['sweep','charge','sweep','slam']],
 hunter:[['fan','charge','fan'],['fan','charge','sweep'],['fan','charge','fan','sweep']],
 frostlord:[['ring','slam','ring'],['ring','charge','slam'],['slam','ring','charge','slam']],
 regent:[['cross','sweep','charge'],['cross','charge','sweep','cross'],['charge','cross','sweep','slam']],
};
export function bossPlan(kind:string,hp:number,max:number,attacks:number){
 const phase=bossPhase(hp,max),moves=PLANS[kind][phase],move=moves[attacks%moves.length];
 const base=move==='ring'?1.15:move==='cross'?1.05:move==='fan'?.9:.85;
 // Even the final phase keeps at least 650 ms of warning. Every sequence ends in a large opening.
 const windup=Math.max(.65,base-phase*.09),finisher=attacks%moves.length===moves.length-1;
 return {move,windup,recovery:finisher?1.05:phase===2?.6:.7,gap:finisher?.45:.18,phase};
}
export function frontalGuard(face:number,x:number,y:number,sourceX:number,sourceY:number){return (sourceX-x)*face>=-6&&Math.abs(sourceY-y)<40;}
