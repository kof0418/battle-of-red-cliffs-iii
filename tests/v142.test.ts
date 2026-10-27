import test from 'node:test';import assert from 'node:assert/strict';import {Campaign} from '../src/combat.ts';
const idle={x:0,y:0};
function setup(face=1){const m=new Campaign('huangzhong');m.start();m.hero.x=500;m.hero.face=face;m.supplies=[];m.barrels=[];m.enemies=[m.fighter('heavy',500+face*200,412)];m.enemies[0].cooldown=100;return m;}
for(const face of [-1,1])test(`arrows travel before impact, miss moved targets, and expire (${face})`,()=>{
 const m=setup(face),e=m.enemies[0];m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,180);assert.equal(m.hits,0);m.updateProjectiles(.1);assert.equal(e.hp,180);e.y=480;m.updateProjectiles(1);assert.equal(e.hp,180);assert.equal(m.projectiles.length,0);
 e.y=412;m.hero.attack=null;m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.3);assert(e.hp<180);assert.equal(m.hits,1);assert.equal(m.projectiles.length,0);
});
test('third arrow pierces enemies and containers once; pause freezes flight',()=>{
 const m=setup(),a=m.enemies[0],b=m.fighter('heavy',800,412);m.enemies.push(b);m.barrels=[{id:900,x:620,y:412,hp:24,loot:'book'}];m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);assert(m.projectiles[0].piercing);
 const x=m.projectiles[0].x;m.paused=true;m.tick(.03,idle);assert.equal(m.projectiles[0].x,x);m.paused=false;m.updateProjectiles(.5);assert(a.hp<180&&b.hp<180);assert.equal(m.barrels.length,0);assert.equal(m.pickups.length,1);const hp=a.hp;m.updateProjectiles(.5);assert.equal(a.hp,hp);assert.equal(m.pickups.length,1);
});
test('voluntary dismount never remounts stationary player; walking away and returning mounts',()=>{
 const m=setup();m.hero.mounted=true;m.dismount(false);for(let i=0;i<180;i++)m.tick(1/60,idle);assert(!m.hero.mounted);assert.equal(m.horses.length,1);const horse=m.horses[0];m.hero.x=horse.x+80;m.updateHorses(0);m.hero.x=horse.x;m.updateHorses(0);assert(m.hero.mounted);
});
test('changing stage clears arrows and does not apply delayed damage',()=>{const m=setup();m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(m.projectiles.length,1);m.status='stage-clear';m.nextStage();assert.equal(m.projectiles.length,0);});
