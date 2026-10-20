import {Campaign,isBoss,type Input} from '../src/combat.ts';
import {HERO_IDS} from '../src/heroes.ts';
import {SPECIAL_COST,specialHits} from '../src/specials.ts';
const results=[];
for(const mode of ['baseline','tactical-special'])for(const strategy of ['close','weapon-range','field-aware'])for(const id of HERO_IDS){
 const m=new Campaign(id);m.start();let damage=0,frames=0,specials=0,bossFrames=0;
 for(;frames<60*480&&(m.status==='playing'||m.status==='stage-clear');frames++){
  if(m.status==='stage-clear'){m.nextStage();continue;}
  if(m.enemies.some(e=>isBoss(e.kind)))bossFrames++;
  const h=m.hero,e=[...m.enemies].sort((a,b)=>Math.abs(a.x-h.x)+Math.abs(a.y-h.y)*3-Math.abs(b.x-h.x)-Math.abs(b.y-h.y)*3)[0];
  let input:Input={x:1,y:0};
  if(e){const dx=e.x-h.x,dy=e.y-h.y,range=strategy==='close'?70:m.slash(1).reach*.72;
   input={x:Math.abs(dx)>range?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:Math.abs(dx)<m.slash(1).reach-2&&Math.abs(dy)<25&&frames%12===0};
   if(e.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)input.dodge=true;
   const f=m.field;if(strategy==='field-aware'&&f&&!f.active&&f.progress>.4&&h.x>=f.x&&h.x<=f.x+f.width&&h.y>=f.y-8&&h.y<=f.y+f.height+8){input.y=f.y>410?-1:1;input.attack=false;}
   if(mode==='tactical-special'&&h.hp>=48&&(h.specialCooldown??0)===0&&h.z===0&&h.dodge<=0&&m.enemies.some(t=>specialHits(id,h.x,h.y,h.face,t.x,t.y,t.z))){input.special=true;input.dodge=false;input.jump=false;}
  }
  const hp=h.hp,cd=h.specialCooldown??0;m.tick(1/60,input);const cast=(h.specialCooldown??0)>cd;if(cast)specials++;
  damage+=Math.max(0,hp-m.hero.hp-(cast?SPECIAL_COST:0));
 }
 results.push({mode,strategy,hero:id,result:m.status,seconds:Math.round(frames/60),bossSeconds:Math.round(bossFrames/60),enemyDamage:damage,specials,selfCost:specials*SPECIAL_COST,hp:m.hero.hp,score:m.score});
}
console.log(JSON.stringify(results,null,2));
