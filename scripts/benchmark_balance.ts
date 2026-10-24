import {Campaign,type Input} from '../src/combat.ts';
import {HERO_IDS} from '../src/heroes.ts';
// Repeatable offensive/defensive regression strategy, not a human difficulty estimate.
const results=[];const seed=Number(process.argv[2]??0);
for(const id of HERO_IDS){
 const m=new Campaign(id,'normal',seed);m.start();m.continues=10;let frames=0;
 for(;frames<60*1200;frames++){
  if(m.status==='lost'){if(!m.continueRun())break;continue;}
  if(m.status==='stage-clear'){m.nextStage();continue;}
  if(m.status!=='playing')break;
  const h=m.hero,e=[...m.enemies].sort((a,b)=>Math.abs(a.x-h.x)+Math.abs(a.y-h.y)*3-Math.abs(b.x-h.x)-Math.abs(b.y-h.y)*3)[0];
  let input:Input={x:1,y:0};
  if(e){const dx=e.x-h.x,dy=e.y-h.y;input={x:Math.abs(dx)>70?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:Math.abs(dx)<94&&Math.abs(dy)<25&&frames%12===0};if(e.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)input.dodge=true;}
  if(e&&Math.abs(e.x-h.x)<100&&Math.abs(e.y-h.y)<45&&(h.specialCooldown??0)<=0&&!h.attack)input.special=true;
  if(m.grapple)input={x:h.face,y:0,grappleAttack:true};m.tick(1/60,input);
 }
 results.push({hero:m.champion.name,result:m.status,seconds:Math.round(frames/60),continuesUsed:m.continuesUsed,kills:m.kills,score:m.score,grades:m.stageResults.map(r=>r.grade)});
}
console.log(JSON.stringify(results,null,2));
