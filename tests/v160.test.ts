import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Kind} from '../src/combat.ts';
import {LEVELS} from '../src/levels.ts';import {encounterPlan,encounterRoster,PROPS} from '../src/encounters.ts';import {gradeStage} from '../src/stage-grade.ts';
const idle={x:0,y:0};const ticks=(m:Campaign,n:number)=>{for(let i=0;i<n;i++)m.tick(1/60,idle);};
function encounter(stage=0,wave=2,seed=0){const m=new Campaign('guanyu','normal',seed);m.stage=stage;m.wave=wave-1;m.status='playing';m.spawn();m.hero.inv=99;return m;}
test('five distinct rhythms schedule bounded reinforcements while first and boss waves remain focused',()=>{
 const plans=[];for(let stage=0;stage<5;stage++){const p=encounterPlan(stage,2);assert(p.initial.length>=2);assert(p.groups.length>=1);assert.equal(p.initial.length+p.groups.flatMap(g=>g.kinds).length,LEVELS[stage].waves[1].length);plans.push(JSON.stringify(p));assert.equal(encounterPlan(stage,1).groups.length,0);assert.equal(encounterPlan(stage,6).groups.length,0);}
 assert.equal(new Set(plans).size,5);
});
test('roster variants are finite, repeatable, preserve head count and every boss',()=>{
 for(let stage=0;stage<5;stage++)for(let wave=1;wave<=6;wave++){
  const seen=[];for(const seed of [1,2,3]){const list=encounterRoster(stage,wave,seed);assert.deepEqual(list,encounterRoster(stage,wave,seed));assert.equal(list.length,LEVELS[stage].waves[wave-1].length);seen.push(list.join(','));if(wave===6)assert.deepEqual(list,LEVELS[stage].waves[wave-1]);}
  if(wave!==6)assert(new Set(seen).size>=2);
 }
});
test('pending enemies keep camera and reward locked; clearing first squad calls reinforcements after warning',()=>{
 const m=encounter();const original=m.remainingEnemies,camera=m.cameraLeft;m.enemies=[];m.hero.x=900;const pending=m.remainingEnemies;
 ticks(m,20);assert.equal(m.waveReward,-1);assert.equal(m.wave,2);assert.equal(m.cameraLeft,camera);assert(m.pending.length);assert(m.reinforcementHint);
 ticks(m,40);assert(m.enemies.length>0);assert.equal(m.remainingEnemies,pending);assert(m.remainingEnemies<original);assert.equal(m.wave,2);assert.equal(m.waveReward,-1);
});
test('timed pincer arrives on both sides, respects pause and cannot duplicate',()=>{
 const m=encounter(1);m.enemies.forEach(e=>e.stun=99);m.time=m.waveStarted+5;m.events=[];m.paused=true;const frozen=JSON.stringify(m);ticks(m,120);assert.equal(JSON.stringify(m),frozen);m.paused=false;ticks(m,35);assert.equal(m.pending.length,0);assert(m.enemies.some(e=>e.x<150));assert(m.enemies.some(e=>e.x>750));const count=m.enemies.length;ticks(m,60);assert.equal(m.enemies.length,count);
});
test('continue restores the same roster schedule and props and rolls back this-wave score',()=>{
 const m=encounter(2,4,2),roster=encounterRoster(2,4,2);m.hero.hp=0;m.tick(1/60,idle);assert(m.continueRun());assert.equal(m.encounterSeed,2);assert.deepEqual([...m.enemies.map(e=>e.kind),...m.pending.flatMap(g=>g.kinds)],roster);assert.equal(m.props.length,0);assert.equal(m.stageRetries,1);
});




test('grade rewards are monotonic with performance and only score is awarded once',()=>{
 const good={stage:0,seconds:100,damage:0,retries:0,bestHit:25,interactions:2};assert.equal(gradeStage(good).grade,'S');
 const bad=gradeStage({...good,seconds:500,damage:300,retries:2,bestHit:0,interactions:0});assert.equal(bad.grade,'C');assert(bad.bonus<gradeStage(good).bonus);
 const m=encounter(0,6);m.hero.hp=75;m.enemies=[];m.tick(1/60,idle);assert.equal(m.stageResults.length,1);assert.equal(m.hero.hp,75);const score=m.score;m.finishStage();assert.equal(m.score,score);assert.equal(m.stageResults.length,1);assert(m.nextStage());assert.equal(m.stageResults.length,1);assert.equal(m.stageDamage,0);assert.equal(m.stageBestHit,0);assert.equal(m.stageRetries,0);
});
test('stage damage and retries persist across failed attempts, and pause does not inflate time',()=>{
 const m=encounter(),e=m.enemies[0];m.hero.inv=0;const hit={move:'slash' as const,x:m.hero.x+10,y:m.hero.y,face:-1,elapsed:1,duration:2,impact:.5,hit:false};m.resolve(e,hit);assert(m.stageDamage>0);const damage=m.stageDamage;m.hero.hp=0;m.tick(1/60,idle);m.continueRun();assert.equal(m.stageDamage,damage);assert.equal(m.stageRetries,1);m.paused=true;const time=m.time;ticks(m,180);assert.equal(m.time,time);
});
