import {test} from 'node:test';import assert from 'node:assert/strict';import {Campaign,type Fighter,type Input} from '../src/combat.ts';import {crateLoot} from '../src/loot.ts';import {HERO_IDS,type HeroId} from '../src/heroes.ts';import {EXTENDED_LEVELS} from '../src/levels.ts';
function pilot(m:Campaign,h:Fighter,frame:number):Input{
 if(h.hp<=0)return {x:0,y:0,grappleAttack:frame%12===0};
 const e=[...m.enemies].sort((a,b)=>Math.hypot(a.x-h.x,(a.y-h.y)*3)-Math.hypot(b.x-h.x,(b.y-h.y)*3))[0];let input:Input={x:1,y:0};
 const food=m.pickups.find(p=>p.amount>0&&h.hp<125),box=m.supplies.find(b=>['bun','meat'].includes(b.loot??crateLoot(m.stage,m.wave))&&h.hp<115);
 // Approach containers inside the shortest blade reach and arrow lane before committing to attacks.
 const target=food??(!e||Math.abs(e.x-h.x)>150?box:undefined);
 if(target){const dx=target.x-h.x,dy=target.y-h.y;input={x:Math.abs(dx)>(food?6:45)?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>6?Math.sign(dy):0,attack:!food&&Math.abs(dx)<55&&Math.abs(dy)<12&&frame%12===0};}
 else if(e){const dx=e.x-h.x,dy=e.y-h.y;input={x:Math.abs(dx)>70?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:Math.abs(dx)<94&&Math.abs(dy)<25&&frame%12===0};}
 if(e?.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)input.dodge=true;
 if(e&&Math.abs(e.x-h.x)<100&&Math.abs(e.y-h.y)<45&&(h.specialCooldown??0)<=0&&!h.attack)input.special=true;
 if(m.field&&m.field.progress>.72&&!m.field.active)input.dodge=true;
 if(m.grappleOf(h))input={x:h.face,y:0,grappleAttack:true};return input;
}
function complete(id:HeroId,route:'pursuit'|'rescue',partner?:HeroId){
 const m=new Campaign(id,'normal',0,'full');if(partner)m.enableCoop(partner);m.start();
 for(let frame=0;frame<100000;frame++){
  if(m.status==='won')break;if(m.status==='lost'){if(!m.continueRun())break;continue;}if(m.status==='stage-clear'){if(m.stage===7)assert(m.chooseEnding(route));assert(m.nextStage());continue;}
  const input=pilot(m,m.hero,frame);if(m.partner)input.partner=pilot(m,m.partner,frame);m.tick(1/60,input);
 }
 assert.equal(m.status,'won',`${id}/${partner??'solo'}/${route}: stage ${m.stage+1} wave ${m.wave} hp ${m.hero.hp}`);assert.equal(m.stage,8);assert.equal(m.stageResults.length,9);assert(m.stageResults.every(r=>Number.isFinite(r.points)));assert.equal(m.kills+m.escapes,EXTENDED_LEVELS.flatMap(l=>l.waves.flat()).length);assert(m.continuesUsed<=2);assert.equal(m.endingRoute,route);
}
for(const id of HERO_IDS)for(const route of ['pursuit','rescue'] as const)test(`${id}/${route}: complete all 48 arenas using production health, food and two continues`,()=>complete(id,route));
for(const [one,two] of [['guanyu','zhangfei'],['zhaoyun','huangzhong'],['weiyan','lubu']] as const)test(`${one}+${two}: full nine-stage co-op campaign retains the team credit limit`,()=>complete(one,'rescue',two));
