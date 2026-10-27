import test from 'node:test';import assert from 'node:assert/strict';import {Campaign,stats} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';import {THROWS} from '../src/throws.ts';
const idle={x:0,y:0};function ticks(m:Campaign,n:number,input=idle){for(let i=0;i<n;i++)m.tick(1/60,input);}
test('all enemies including bosses have twice previous HP, player unchanged',()=>{const old={soldier:48,raider:38,heavy:90,archer:36,spearman:58,hammer:100,brute:80,mauler:120,boss:420,marshal:510,hunter:520,frostlord:620,regent:680};for(const [kind,hp] of Object.entries(old))assert.equal(stats[kind as keyof typeof stats].hp,hp*2);assert.equal(stats.hero.hp,160);});
test('walking into next wave never snaps player or camera; spawns ahead and locks current view',()=>{
 const m=new Campaign();m.start();m.enemies=[];m.hero.x=700;m.cameraLeft=360;let entered=false;
 for(let i=0;i<200&&!entered;i++){const x=m.hero.x,camera=m.cameraLeft,wave=m.wave;m.tick(1/60,{x:1,y:0});assert(m.hero.x-x<=3.01);assert(m.cameraLeft-camera<=10.01);if(m.wave!==wave){entered=true;assert(m.enemies.every(e=>e.x>m.hero.x));const locked=m.cameraLeft;ticks(m,20,{x:-1,y:0});assert.equal(m.cameraLeft,locked);}}
 assert(entered);
});
for(const id of HERO_IDS)for(const direction of [-1,0,1])test(`${id} held enemy jumps ${direction} and slams straight down with landing splash`,()=>{
 const m=new Campaign(id);m.start();m.hero.x=450;const e=m.fighter('heavy',478,412);e.cooldown=99;m.enemies=[e];assert(m.tryGrab({x:1,y:0}));m.tick(1/60,{x:direction,y:0,jump:true});ticks(m,15);const landingX=m.hero.x;assert(direction===0?landingX===450:(landingX-450)*direction>30);assert(m.hero.z>0&&e.z>m.hero.z);
 const nearby=m.fighter('heavy',landingX-65,412),outside=m.fighter('heavy',landingX+220,480);nearby.cooldown=99;outside.cooldown=99;m.enemies.push(nearby,outside);
 m.tick(1/60,{...idle,grappleAttack:true});assert.equal(nearby.hp,nearby.max);ticks(m,8);assert(m.hero.z>0);assert.equal(nearby.hp,nearby.max);ticks(m,18);
 assert.equal(m.grapple,null);assert.equal(m.hero.z,0);assert.equal(e.z,0);assert(Math.abs(e.x-landingX)<35);assert.equal(e.hp,e.max-THROWS[id].damage-(id==='zhangfei'?22:14));assert.equal(nearby.hp,nearby.max-(id==='zhangfei'?38:30));assert.equal(outside.hp,outside.max);const hp=nearby.hp;ticks(m,10);assert.equal(nearby.hp,hp);
});
test('ground throws travel farther in either direction',()=>{for(const direction of [-1,1]){const m=new Campaign();m.start();m.hero.x=450;const e=m.fighter('heavy',478,412);m.enemies=[e];e.cooldown=99;assert(m.tryGrab({x:1,y:0}));m.tick(1/60,{x:direction,y:0,grappleAttack:true});ticks(m,40);assert((e.x-450)*direction>=175);}});
