import {writeFileSync} from 'node:fs';
import {Campaign,type Fighter,type Input} from '../src/combat.ts';import {crateLoot} from '../src/loot.ts';
function pilot(m:Campaign,h:Fighter,frame:number):Input{
 if(h.hp<=0)return {x:0,y:0,grappleAttack:frame%12===0};
 const e=[...m.enemies].sort((a,b)=>Math.hypot(a.x-h.x,(a.y-h.y)*3)-Math.hypot(b.x-h.x,(b.y-h.y)*3))[0];let input:Input={x:1,y:0};
 const food=m.pickups.find(p=>p.amount>0&&h.hp<125),box=m.supplies.find(b=>['bun','meat'].includes(b.loot??crateLoot(m.stage,m.wave))&&h.hp<115);
 const target=food??(!e||Math.abs(e.x-h.x)>150?box:undefined);
 if(target){const dx=target.x-h.x,dy=target.y-h.y;input={x:Math.abs(dx)>(food?6:45)?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>6?Math.sign(dy):0,attack:!food&&Math.abs(dx)<95&&Math.abs(dy)<25&&frame%12===0};}
 else if(e){const dx=e.x-h.x,dy=e.y-h.y;input={x:Math.abs(dx)>70?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:Math.abs(dx)<94&&Math.abs(dy)<25&&frame%12===0};}
 if(e?.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)input.dodge=true;
 if(e&&Math.abs(e.x-h.x)<100&&Math.abs(e.y-h.y)<45&&(h.specialCooldown??0)<=0&&!h.attack)input.special=true;
 if(m.field&&m.field.progress>.72&&!m.field.active)input.dodge=true;
 if(m.grappleOf(h))input={x:h.face,y:0,grappleAttack:true};return input;
}

const samples=[];
for(const difficulty of ['easy','normal','hard'] as const)for(const length of ['short','full'] as const)for(const players of [1,2]){
 const m=new Campaign('guanyu',difficulty,1,length);if(players===2)m.enableCoop('lubu');m.start();
 for(let frame=0;frame<100000;frame++){
  if(m.status==='won')break;if(m.status==='lost'){if(!m.continueRun())break;continue;}
  if(m.status==='stage-clear'){if(m.stage===7)m.chooseEnding('rescue');m.nextStage();continue;}
  const input=pilot(m,m.hero,frame);if(m.partner)input.partner=pilot(m,m.partner,frame);m.tick(1/60,input);
 }
 samples.push({difficulty,length,players,status:m.status,stage:m.stage+1,wave:m.wave,seconds:Math.round(m.time),continues:m.continuesUsed,hp:m.players.map(p=>p.hp),kills:m.kills,escapes:m.escapes,grades:m.stageResults.map(r=>r.grade)});
}
const report={note:'Fixed-rule simulation, not human playtime or a guarantee of difficulty. Production HP, pickups and two team continues; no invulnerability.',samples};
writeFileSync(new URL('../docs/performance/v290-balance.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(samples,null,2));
