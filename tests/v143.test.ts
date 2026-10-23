import test from 'node:test';import assert from 'node:assert/strict';import {Campaign} from '../src/combat.ts';import {LEVELS} from '../src/levels.ts';
const idle={x:0,y:0};const ticks=(m:Campaign,n:number,input=idle)=>{for(let i=0;i<n;i++)m.tick(1/60,input);};
function setup(){const m=new Campaign();m.start();m.hero.x=450;m.enemies=[m.fighter('heavy',490,412)];m.enemies[0].cooldown=99;return m;}
test('dash collision damages once per target, pushes, adds HIT and respects cooldown',()=>{
 const m=setup(),e=m.enemies[0];m.tick(1/60,{x:1,y:0,dodge:true});assert.equal(e.hp,76);assert(e.x>490);assert.equal(m.hits,1);ticks(m,20,{x:1,y:0,dodge:true});assert.equal(e.hp,76);assert(m.hero.dodgeCooldown>0);
});
test('dash ignores high and off-lane targets, pauses cleanly',()=>{
 const m=setup(),e=m.enemies[0];e.z=70;const off=m.fighter('heavy',490,480);off.cooldown=99;m.enemies.push(off);m.tick(1/60,{x:1,y:0,dodge:true});assert.equal(e.hp,90);assert.equal(off.hp,90);m.paused=true;m.events=[];const before=JSON.stringify(m);ticks(m,30,{x:1,y:0,dodge:true});assert.equal(JSON.stringify(m),before);
});
test('combat locks player to screen while enemies can be knocked beyond both sides and return',()=>{
 for(const face of [-1,1]){const m=setup();m.hero.x=face<0?25:935;m.hero.face=face;const e=m.enemies[0];e.x=face<0?2:958;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);assert(face<0?e.x<0:e.x>960);m.hero.attack=null;ticks(m,10,{x:face,y:0});assert(m.hero.x>=25&&m.hero.x<=935);assert.equal(m.cameraLeft,0);e.stun=0;e.attack=null;const before=e.x;m.ai(e,0,.1);assert(face<0?e.x>before:e.x<before);}
});
test('cleared screens scroll only forward; next arena locks and player cannot return',()=>{
 const m=setup();m.enemies=[];m.hero.x=700;m.tick(1/60,idle);const camera=m.cameraLeft;assert(camera>0);ticks(m,40,{x:-1,y:0});assert.equal(m.cameraLeft,camera);assert(m.hero.x>=camera+25);
 m.hero.x=920;ticks(m,60,{x:1,y:0});assert.equal(m.wave,2);const locked=m.cameraLeft;ticks(m,60,{x:-1,y:0});assert.equal(m.cameraLeft,locked);assert(m.hero.x>=locked+25);m.status='stage-clear';m.nextStage();assert.equal(m.cameraLeft,0);
});
test('new infantry appear in campaigns and use distinct punch / round hammer attacks',()=>{
 const kinds=LEVELS.flatMap(l=>l.waves.flat());assert(kinds.includes('brute'));assert(kinds.includes('mauler'));
 for(const [kind,move] of [['brute','slash'],['mauler','slam']] as const){const m=setup(),e=m.fighter(kind,500,412);m.enemies=[e];e.cooldown=0;m.ai(e,0,1/60);assert.equal(e.attack?.move,move);assert(e.attack!.impact>=.5);const hp=m.hero.hp;m.resolve(e,e.attack!);assert(m.hero.hp<hp);}
});
