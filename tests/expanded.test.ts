import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign,isBoss,attackHits,type Attack} from '../src/combat.ts';import {LEVELS,WORLD_WIDTH,ARENA_ENDS,arenaStart} from '../src/levels.ts';import {fieldEvent} from '../src/battlefield.ts';
test('two extended stages contain distinct rosters, six traversable arenas and final bosses',()=>{
 assert.equal(WORLD_WIDTH,5600);assert.equal(LEVELS.slice(0,2).flatMap(l=>l.waves.flat()).length,74);
 for(const [stage,l] of LEVELS.entries()){assert.equal(l.sections.length,6);for(let wave=1;wave<=6;wave++){const m=new Campaign();m.stage=stage;m.wave=wave-1;m.status='playing';m.spawn();assert(m.enemies.length>=5);assert(m.enemies.every(e=>e.x>m.cameraLeft&&e.x<m.cameraLeft+960));assert.equal(m.enemies.some(e=>isBoss(e.kind)),wave===6);m.hero.hp=0;m.tick(1/60,{x:0,y:0});assert(m.continueRun());assert(Number.isFinite(m.hero.x));assert(m.hero.x>arenaStart(wave));}for(const k of ['archer','spearman','hammer'])assert(l.waves.flat().includes(k as any));}
});
test('archer retreats at close range, telegraphs ranged shots, and misses a changed lane',()=>{
 const m=new Campaign();m.start();m.hero.x=400;const e=m.fighter('archer',600,412);m.enemies=[e];e.cooldown=0;m.tick(1/60,{x:0,y:0});assert.equal(e.attack?.move,'shot');assert(e.attack!.impact>=.9);m.hero.y=470;const hp=m.hero.hp;m.resolve(e,e.attack!);assert.equal(m.hero.hp,hp);assert(m.events.some(e=>e.type==='arrow'));e.attack=null;e.cooldown=2;e.x=470;e.y=470;m.ai(e,0,1/60);assert(e.x>470);
});
test('spears reach beyond swords; hammer impacts have slow telegraphs and can be jumped',()=>{
 const m=new Campaign();m.start();m.hero.x=400;for(const kind of ['spearman','hammer'] as const){m.hero.x=400;const e=m.fighter(kind,kind==='spearman'?520:480,412);e.cooldown=0;m.enemies=[e];m.ai(e,0,1/60);assert(e.attack);if(kind==='hammer'){assert.equal(e.attack.move,'slam');assert(e.attack.impact>=1);m.hero.z=60;assert(!attackHits(e.attack,m.hero,88));m.hero.z=0;}else{const hp=m.hero.hp;m.resolve(e,e.attack);assert(m.hero.hp<hp);}}
});
test('later arena hazards follow world coordinates and final arena has no field hazard',()=>{
 for(let stage=0;stage<2;stage++)for(let wave=4;wave<=6;wave++){const f=fieldEvent(stage,wave,5,0);if(wave===6)assert.equal(f,null);else {assert(f);assert(f.x>=arenaStart(wave));assert(f.x<WORLD_WIDTH);}}
});
