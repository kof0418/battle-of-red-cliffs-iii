import {DIFFICULTIES} from '../src/tactics.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,inRange,type Attack} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.start();m.hero.x=400;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.enemies=[m.fighter('soldier',450,412)];m.enemies[0].cooldown=99;return m;}
for(const id of HERO_IDS)test(`${id}: rescue interrupts special but cannot alternate invulnerability indefinitely`,()=>{
 const m=setup();m.hero.heroId=id;assert(m.special());m.tick(1/60,{...idle,attack:true,jump:true,special:true,dodge:true});assert.equal(m.hero.attack?.move,'rescue');assert.equal(m.hero.hp,152);assert(!m.special());assert(!m.rescue());assert.equal(m.hero.hp,152);
 for(let i=0;i<40;i++){m.freeze=0;m.tick(1/60,idle);}assert.equal(m.hero.inv,0);assert(!m.special());assert(!m.rescue());
});
test('downed hero cannot jump, dash, cast, attack or move; recovery grants a bounded grace period',()=>{
 const m=setup();m.hero.knockdown=.1;m.hero.stun=0;
 m.tick(.02,{x:1,y:0,jump:true,dodge:true,special:true,attack:true});assert.equal(m.hero.x,400);assert.equal(m.hero.vz,0);assert.equal(m.hero.attack,null);
 for(let i=0;i<5;i++)m.tick(.02,idle);assert.equal(m.hero.knockdown,0);assert(m.hero.inv>0&&m.hero.inv<=DIFFICULTIES[m.difficulty].wakeGrace);
 m.queuedUntil=0;for(let i=0;i<25;i++)m.tick(.02,idle);assert.equal(m.hero.inv,0);
});
test('downed offscreen enemy neither walks nor attacks; returns diagonally after recovery',()=>{
 const m=setup(),e=m.enemies[0];e.x=-50;e.y=360;e.knockdown=.1;e.stun=0;e.cooldown=0;m.ai(e,0,.02);assert.equal(e.x,-50);assert(!e.attack);
 for(let i=0;i<6;i++)m.tick(.02,idle);assert(e.inv>0);assert(e.x>-50&&e.y>360);
});
test('third close-combat hit knocks soldiers down, light strikes do not',()=>{
 const m=setup(),e=m.enemies[0];const a:Attack={move:'slash',x:400,y:412,face:1,elapsed:0,duration:.4,impact:.1,hit:false};
 m.hero.step=1;m.resolve(m.hero,a);assert(!e.knockdown);e.x=450;e.inv=0;m.hero.step=3;m.resolve(m.hero,a);assert.equal(e.knockdown,.45);assert(e.stun>=.45);
});
test('same-lane exact contact is symmetric and does not hit a neighbouring lane',()=>{
 for(const face of [-1,1]){assert(inRange(400,412,400+face*96,442,face,96));assert(!inRange(400,412,400+face*96.01,442,face,96));assert(!inRange(400,412,400+face*50,442.01,face,96));assert(!inRange(400,412,400-face*13,412,face,96));}
});
test('both screen edges remain hittable without moving the player beyond the arena',()=>{
 for(const face of [-1,1]){const m=setup(),h=m.hero,e=m.enemies[0];h.x=face<0?25:935;h.face=face;e.x=h.x+face*50;h.step=1;m.resolve(h,{move:'slash',x:h.x,y:h.y,face,elapsed:0,duration:.3,impact:.1,hit:false});assert(e.hp<e.max);assert.equal(h.x,face<0?25:935);assert(e.x>=m.enemyLeft&&e.x<=m.enemyRight);}
});
