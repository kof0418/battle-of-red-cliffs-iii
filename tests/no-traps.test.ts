import test from 'node:test';import assert from 'node:assert/strict';import {Campaign} from '../src/combat.ts';import {EXTENDED_LEVELS} from '../src/levels.ts';import {gradeStage} from '../src/stage-grade.ts';
test('all nine stages and all arenas spawn supplies but no mechanisms or timed environmental hazards',()=>{
 for(let stage=0;stage<9;stage++)for(let wave=1;wave<=EXTENDED_LEVELS[stage].waves.length;wave++){
  const m=new Campaign('guanyu','normal',0,'full');m.stage=stage;m.wave=wave-1;m.status='playing';m.spawn();assert.deepEqual(m.props,[]);assert(m.supplies.length);assert(m.barrels.length);
  m.enemies.forEach(e=>e.cooldown=999);m.hero.inv=0;for(const t of [4,5.4,5.6,11,14.6,23.6,60]){m.time=m.waveStarted+t;assert.equal(m.field,null);m.tick(1/60,{x:0,y:0});assert.equal(m.hero.hp,160);assert(!m.events.some(e=>['volley','fire','surge','stones','scene-action'].includes(e.type)));}
 }
});
test('maximum stage grade no longer requires scenery interaction points',()=>{const p={stage:0,seconds:100,damage:0,retries:0,bestHit:20,interactions:0};assert.equal(gradeStage(p).points,100);assert.equal(gradeStage(p).grade,'S');assert.equal(gradeStage({...p,interactions:2}).points,100);});
