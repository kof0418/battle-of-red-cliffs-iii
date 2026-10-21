import test from 'node:test';import assert from 'node:assert/strict';import {Campaign,attackHits,type Attack,type Kind} from '../src/combat.ts';import {LEVELS} from '../src/levels.ts';
const idle={x:0,y:0};
test('five unique stage themes and bosses, six waves each, final clear only at stage five',()=>{
 assert.equal(LEVELS.length,5);assert.equal(new Set(LEVELS.map(l=>l.theme)).size,5);const m=new Campaign();m.start();
 for(let i=0;i<5;i++){assert.equal(m.stage,i);assert.equal(m.level.waves.length,6);m.wave=6;m.enemies=[];m.tick(1/60,idle);assert.equal(m.status,i===4?'won':'stage-clear');assert.equal(m.nextStage(),i<4);}
});
test('new bosses have distinct move cycles and their own telegraphs',()=>{
 for(const [kind,moves] of [['hunter',['fan','charge','fan']],['frostlord',['ring','slam','ring']],['regent',['cross','sweep','charge']]] as const){const m=new Campaign();m.start();m.hero.x=400;const e=m.fighter(kind,480,412);m.enemies=[e];for(const move of moves){e.attack=null;e.cooldown=0;m.ai(e,0,1/60);assert.equal(e.attack?.move,move);assert(e.attack!.impact>=.64);if(move==='cross'){assert.equal(e.attack!.x,400);m.hero.x=410;assert.equal(e.attack!.x,400);}}}
});
test('fan gaps, ring inner safety and cross corners offer real escape spaces',()=>{
 const m=new Campaign(),h=m.hero;h.x=100;h.y=412;const a:Attack={move:'fan',x:0,y:412,elapsed:0,impact:1,duration:2,face:1,hit:false};assert(attackHits(a,h,330));h.x=200;h.y=442;assert(!attackHits(a,h,330));h.x=200;h.y=442;assert(!attackHits(a,h,330));
 a.move='ring';h.x=20;h.y=412;assert(!attackHits(a,h,0));h.x=100;assert(attackHits(a,h,0));h.x=170;assert(!attackHits(a,h,0));
 a.move='cross';h.x=100;h.y=412;assert(attackHits(a,h,0));h.y=460;assert(!attackHits(a,h,0));h.z=60;h.x=0;assert(!attackHits(a,h,0));
});
test('later-stage continue restores current boss and full health without returning to stage one',()=>{
 for(let stage=2;stage<5;stage++){const m=new Campaign();m.stage=stage;m.wave=5;m.status='playing';m.spawn();const boss=m.enemies[0].kind;m.hero.hp=0;m.tick(1/60,idle);assert(m.continueRun());assert.equal(m.stage,stage);assert.equal(m.wave,6);assert.equal(m.enemies[0].kind,boss);assert.equal(m.hero.hp,m.hero.max);}
});
