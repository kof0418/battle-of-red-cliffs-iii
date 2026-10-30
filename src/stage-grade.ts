export interface StagePerformance {stage:number;seconds:number;damage:number;retries:number;bestHit:number;interactions:number;}
export interface StageResult extends StagePerformance {grade:'S'|'A'|'B'|'C';points:number;bonus:number;}
export function gradeStage(p:StagePerformance,players:1|2=1):StageResult{
 const target=[140,150,155,170,175,145,155,145,155][p.stage];
 const clamp=(n:number)=>Math.max(0,Math.min(1,n));
 const points=Math.max(0,Math.round(35*clamp(2-p.seconds/target)+35*clamp(1-p.damage/(240*players))+30*clamp(p.bestHit/20)-p.retries*20));
 const grade=points>=85?'S':points>=65?'A':points>=40?'B':'C';
 return {...p,grade,points,bonus:{S:5000,A:3000,B:1500,C:500}[grade]};
}
