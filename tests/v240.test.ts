import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,attackHits,type Input,type Kind} from '../src/combat.ts';
import {LEVELS} from '../src/levels.ts';import {LOB} from '../src/counterplay.ts';
const idle={x:0,y:0};
function setup(kind:Kind='soldier'){const m=new Campaign();m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.fieldSuppressed=true;m.enemies=[m.fighter(kind,650,412)];m.enemies[0].cooldown=0;return m;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
for(const face of [-1,1])test(`spearman ${face}: commits a narrow long thrust, allowing lane changes and jumps`,()=>{
 const m=setup('spearman'),e=m.enemies[0];e.x=400+face*150;m.ai(e,0,1/60);assert.equal(e.attack?.move,'thrust');const a=e.attack!;assert(a.impact>=.65);assert(attackHits(a,m.hero,170));m.hero.y+=20;assert(!attackHits(a,m.hero,170));m.hero.y=412;m.hero.z=60;assert(!attackHits(a,m.hero,170));m.hero.x=420;m.ai(e,0,.03);assert.equal(e.attack,a);assert.equal(a.face,-face);
});
for(const evade of [false,true])test(`thrower: locked landing circle ${evade?'is avoidable':'damages once after windup and visible flight'}`,()=>{
 const m=setup('thrower'),e=m.enemies[0];m.ai(e,0,1/60);assert.equal(e.attack?.move,'lob');assert.equal(e.attack!.x,400);ticks(m,50);assert.equal(m.hero.hp,160);if(evade)m.hero.y=490;ticks(m,43);assert.equal(m.hero.hp,evade?160:148);assert.equal(m.bombs.length,0);assert(e.cooldown>0);assert.equal(e.max,72);
});
test('airborne player avoids the pot blast; pause freezes flight and a released pot survives its thrower',()=>{
 const m=setup('thrower');m.enemies[0].cooldown=99;m.bombs=[{id:900,owner:m.enemies[0].id,x:400,y:412,fromX:650,fromY:412,elapsed:0}];m.paused=true;ticks(m,50);assert.equal(m.bombs[0].elapsed,0);m.paused=false;m.enemies=[];m.hero.z=90;m.hero.vz=330;ticks(m,34);assert.equal(m.hero.hp,160);assert.equal(m.bombs.length,0);assert.equal(LOB.damage,12);
});
test('bruiser third pressure move warns before a short shoulder advance and has punishable recovery',()=>{
 const m=setup('brute'),e=m.enemies[0];e.x=480;e.attacks=2;m.ai(e,0,1/60);assert.equal(e.attack?.move,'press');assert(e.attack!.impact>=.7);const x=e.x;ticks(m,30);assert.equal(e.x,x);ticks(m,17);assert(e.x<x);assert(e.attack!.duration-e.attack!.impact>=.85);
});
for(const kind of ['boss','marshal','hunter','frostlord','regent'] as const)test(`${kind}: repeated same strike triggers a telegraphed response with no health or invulnerability increase`,()=>{
 const m=setup(kind),e=m.enemies[0],hp=e.max;e.x=450;e.cooldown=99;
 for(let n=0;n<3;n++){m.hero.attack=null;m.hero.comboHit=false;m.hero.last=-10;e.inv=0;e.x=450;m.swing();m.resolve(m.hero,m.hero.attack!);m.time+=.2;}
 e.inv=0;e.stun=0;e.cooldown=0;e.attack=null;m.ai(e,0,1/60);assert(e.attack?.adaptive);assert(e.attack!.impact>=1);assert(e.attack!.duration-e.attack!.impact>=1);assert.equal(e.max,hp);assert.equal(e.inv,0);assert(m.message.includes('識破'));const locked={x:e.attack!.x,y:e.attack!.y};m.hero.x=800;m.ai(e,0,.03);assert.deepEqual({x:e.attack!.x,y:e.attack!.y},locked);
});
test('ordinary varied combo and three pulses of one special do not count as three repeated moves',()=>{
 for(const special of [false,true]){const m=setup('boss'),e=m.enemies[0];e.x=450;e.cooldown=99;
  if(special){m.special();const a=m.hero.attack!;for(let n=0;n<3;n++){e.inv=0;e.x=450;a.pulses=n;m.resolve(m.hero,a);}}
  else for(let n=1;n<=3;n++){m.hero.attack=null;m.hero.comboHit=true;m.hero.step=n-1;m.hero.last=m.time;e.inv=0;e.x=450;m.swing();m.resolve(m.hero,m.hero.attack!);}
  e.inv=0;e.stun=0;e.cooldown=0;e.attack=null;m.ai(e,0,.016);assert(!e.attack?.adaptive);
 }
});
test('co-op attackers distribute targets, retain a short commitment and retarget a fallen player',()=>{
 const m=setup();m.enableCoop('zhangfei'); // create co-op before start in a fresh model below
 const q=new Campaign();q.enableCoop('zhangfei');q.start();q.pending=[];q.hero.x=q.partner!.x=400;q.hero.y=q.partner!.y=412;q.enemies=Array.from({length:4},()=>q.fighter('soldier',500,412));q.enemies.forEach(e=>e.cooldown=99);
 q.enemies.forEach((e,i)=>q.ai(e,i,.016));assert.equal(new Set(q.enemies.map(e=>e.targetId)).size,2);const ids=q.enemies.map(e=>e.targetId);q.enemies.forEach((e,i)=>q.ai(e,i,.016));assert.deepEqual(q.enemies.map(e=>e.targetId),ids);q.partner!.hp=0;q.enemies.forEach((e,i)=>q.ai(e,i,.016));assert(q.enemies.every(e=>e.targetId===q.hero.id));
});
test('thrower integration changes ten light soldiers without increasing total bodies or Boss health',()=>{
 assert.equal(LEVELS.flatMap(l=>l.waves.flat()).length,185);assert.equal(LEVELS.flatMap(l=>l.waves.flat()).filter(k=>k==='thrower').length,10);
 const m=setup('thrower');m.enemies=Array.from({length:5},(_,i)=>m.fighter('thrower',600+i*5,412));m.enemies.forEach(e=>e.cooldown=0);m.enemies.forEach((e,i)=>m.ai(e,i,.016));assert(m.enemies.filter(e=>e.attack).length<=m.attackLimit);
});
test('a Boss does not apply one player repeated-move read to the other player',()=>{
 const m=new Campaign();m.enableCoop('zhangfei');m.start();m.pending=[];m.hero.x=400;m.hero.y=370;m.partner!.x=400;m.partner!.y=470;const e=m.fighter('boss',450,370);e.hp=10000;e.cooldown=99;m.enemies=[e];
 for(let n=0;n<3;n++){m.hero.attack=null;m.hero.comboHit=false;m.hero.last=-10;e.inv=0;e.x=450;m.swing();m.resolve(m.hero,m.hero.attack!);m.time+=.2;}
 e.x=450;e.y=470;e.stun=0;e.inv=0;e.cooldown=0;e.targetId=m.partner!.id;e.targetUntil=m.time+1;m.ai(e,0,.016);assert(!e.attack?.adaptive);assert.equal(e.targetId,m.partner!.id);
});
