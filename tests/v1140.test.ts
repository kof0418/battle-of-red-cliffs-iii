import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';import {encounterPlan} from '../src/encounters.ts';import {LEVELS} from '../src/levels.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.start();m.wave=3;m.hero.x=250;m.hero.y=354;m.hero.hp=80;m.supplies=[];m.barrels=[];m.enemies=[];m.pending=[];return m;}
function tick(m:Campaign,n=1){for(let i=0;i<n;i++){m.freeze=0;m.tick(1/60,idle);}}
test('third arena clear starts one optional bonus, no enemies, healing or repeated spawning',()=>{
 const m=setup();tick(m);assert.equal(m.barrels.length,3);assert.equal(m.bonusRound?.broken,0);assert.equal(m.hero.hp,80);assert(!m.encounterActive);tick(m,20);assert.equal(m.barrels.length,3);assert(m.barrels.every(b=>b.bonus&&b.y===354&&b.x>=m.cameraLeft));
});
test('three broken barrels award exactly 1900, no loot, and cannot be scored twice',()=>{
 const m=setup();tick(m);const score=m.score;
 for(const box of [...m.barrels]){m.hero.x=box.x-40;m.hero.y=box.y;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);m.breakSupply(box);}
 assert.equal(m.score-score,1900);assert(m.bonusRound?.finished);assert.equal(m.pickups.length,0);assert.equal(m.hero.hp,80);m.startBonusRound();assert.equal(m.barrels.length,0);
});
test('paused and hit-stop frames preserve timer; expiration removes only bonus barrels',()=>{
 const m=setup();tick(m);m.barrels.push({id:999,x:900,y:499,hp:24,loot:'book'});const until=m.bonusRound!.until,t=m.time;
 m.paused=true;tick(m,800);assert.equal(m.time,t);assert.equal(m.bonusRound!.until,until);m.paused=false;m.freeze=1;m.tick(.03,idle);assert.equal(m.time,t);
 tick(m,730);assert(!m.bonusRound);assert.equal(m.barrels.length,1);assert.equal(m.barrels[0].id,999);assert.equal(m.hero.hp,80);
});
test('walking onward skips bonus without blocking or carrying it into another arena',()=>{
 const m=setup();tick(m);const score=m.score;m.time+=1;m.hero.x=m.arenaEnd-60;m.cameraLeft=m.hero.x-340;tick(m);assert.equal(m.wave,4);assert(!m.bonusRound);assert(!m.barrels.some(b=>b.bonus));assert.equal(m.score,score);
});
test('ordinary crates still drop exactly once and a thrown knife can break a bonus barrel',()=>{
 const m=setup();tick(m);const box=m.barrels[0];box.hp=1;m.projectiles=[{id:990,x:box.x-50,y:box.y,face:1,damage:38,remaining:300}];m.updateProjectiles(.1);assert.equal(m.bonusRound?.broken,1);assert.equal(m.pickups.length,0);
 const normal={id:991,x:500,y:499,hp:0,loot:'meat' as const};m.breakSupply(normal);m.breakSupply(normal);assert.equal(m.pickups.length,1);assert.equal(m.pickups[0].amount,40);
});
test('busy heavy formations wait for room then give a fresh warning',()=>{
 for(const stage of [0,3]){const m=new Campaign();m.stage=stage;m.wave=1;m.status='playing';m.spawn();const due=m.pending[0].due;m.time=m.waveStarted+due;m.updateReinforcements();assert(m.pending[0].held);assert(!m.pending[0].readyAt);
 m.time=m.waveStarted+due+60;m.updateReinforcements();assert(!m.pending[0].readyAt);m.enemies=[];m.updateReinforcements();assert(m.pending[0].readyAt);const count=m.enemies.length;m.time+=.5;m.updateReinforcements();assert.equal(m.enemies.length,count);m.time+=.41;m.updateReinforcements();assert(m.enemies.length>count);assert.equal(m.pending.length,0);}
});
test('early clearance calls next squad once after warning and still gates rewards',()=>{
 const m=new Campaign();m.wave=1;m.status='playing';m.spawn();m.enemies=[];m.updateReinforcements();assert(m.reinforcementHint);const remaining=m.remainingEnemies;tick(m,60);assert.equal(m.remainingEnemies,remaining);assert(m.enemies.length);assert.equal(m.waveReward,-1);
});
test('all five campaigns preserve original head counts and boss encounters',()=>{
 for(let s=0;s<5;s++)for(let w=1;w<=6;w++){const p=encounterPlan(s,w);assert.equal(p.initial.length+p.groups.flatMap(g=>g.kinds).length,LEVELS[s].waves[w-1].length);if(w===6)assert.equal(p.groups.length,0);}
});
