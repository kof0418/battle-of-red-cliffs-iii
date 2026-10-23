import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Attack} from '../src/combat.ts';import {CommandInput} from '../src/command-input.ts';import {HERO_IDS} from '../src/heroes.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.start();m.hero.x=400;m.hero.y=412;m.supplies=[];m.barrels=[];m.enemies=[m.fighter('heavy',800,480)];m.enemies[0].cooldown=100;return m;}
test('two damaging hits drop equipment; invulnerability does not count',()=>{
 const m=setup(),e=m.fighter('heavy',420,412);m.hero.equipped={id:'sword',uses:18};
 const a:Attack={move:'slash',elapsed:0,duration:1,impact:0,hit:false,face:-1,x:420,y:412};
 m.resolve(e,a);assert.equal(m.hero.equipped?.hits,1);m.resolve(e,a);assert.equal(m.hero.equipped?.hits,1);
 m.hero.inv=0;m.hero.x=400;m.resolve(e,a);assert.equal(m.hero.equipped,undefined);assert(m.events.some(e=>e.type==='weapon-drop'));assert.equal(m.pickups.length,0);
});
test('knife is consumed at release, not during windup',()=>{const m=setup();m.hero.equipped={id:'knife',uses:1};m.swing();assert(m.hero.equipped);m.resolve(m.hero,m.hero.attack!);assert.equal(m.hero.equipped,undefined);assert.equal(m.projectiles.length,1);});
test('book scores once at full health; gong summons one horse from the right',()=>{
 const m=setup();m.pickups=[{id:900,x:400,y:412,loot:'book',amount:0}];m.tick(1/60,idle);assert.equal(m.score,1500);m.tick(1/60,idle);assert.equal(m.score,1500);
 m.pickups=[{id:901,x:400,y:412,loot:'gong',amount:0}];m.tick(1/60,idle);assert.equal(m.horses.length,1);assert(m.horses.every(h=>h.x>1000));
 const x=m.horses[0].x;m.paused=true;m.tick(1,idle);assert.equal(m.horses[0].x,x);m.paused=false;
 m.hero.x=m.horses[0].target;m.hero.y=m.horses[0].y;for(let i=0;i<240;i++)m.updateHorses(1/60);assert.equal(m.hero.mounted,true);
 m.tick(1/60,{...idle,jump:true});assert.equal(m.hero.mounted,false);assert((m.hero.mountCooldown??0)>0);
});
test('mounted input requires ordered left right and fresh attack within timing window',()=>{const c=new CommandInput('left','right');assert(!c.press('attack',0));c.press('left',100);c.press('right',200);assert(c.press('attack',300));assert(!c.press('attack',301));c.press('left',500);c.press('right',1000);assert(!c.press('attack',1100));});
for(const id of HERO_IDS)test(`${id}: mounted glaive and piercing wave damage enemies`,()=>{
 const m=setup();m.hero.heroId=id;m.hero.mounted=true;const e=m.fighter('heavy',480,412);m.enemies=[e];m.swing();assert.equal(m.hero.attack?.move,'mounted');m.resolve(m.hero,m.hero.attack!);assert(e.hp<90);assert(!m.events.some(e=>e.type==='arrow'));
 m.hero.attack=null;m.freeze=0;m.enemies=[m.fighter('heavy',550,412),m.fighter('heavy',680,412),m.fighter('heavy',550,480)];m.tick(1/60,{...idle,horseSpecial:true});assert.equal(m.hero.attack?.move,'wave');m.resolve(m.hero,m.hero.attack!);for(let i=0;i<90;i++)m.updateProjectiles(1/60);assert.deepEqual(m.enemies.map(e=>e.hp),[42,42,90]);assert.equal(m.projectiles.length,0);
 m.status='stage-clear';m.nextStage();assert(m.hero.mounted);m.status='lost';m.continueRun();assert(!m.hero.mounted);assert.equal(m.horses.length,0);
});
test('barrels sit at walls and supply both books and gongs',()=>{const seen=new Set();const m=new Campaign();m.start();for(let i=0;i<6;i++){const b=m.barrels[0];assert([354,499].includes(b.y));seen.add(b.loot);if(i<5)m.spawn();}assert.deepEqual([...seen].sort(),['book','gong']);});
test('voluntary dismount waits indefinitely and preserves fall count across remounts',()=>{
 const m=setup();m.hero.mounted=true;m.dismount(false);const horse=m.horses[0];assert(horse.waiting);assert.equal(horse.falls,0);const x=horse.x;m.updateHorses(40);assert.equal(m.horses[0].x,x);
 m.hero.mountCooldown=0;m.updateHorses(0);assert(m.hero.mounted);assert.equal(m.hero.steed,horse);m.dismount(true);assert.equal(horse.falls,1);assert(horse.waiting);
 m.hero.mountCooldown=0;m.hero.z=0;m.hero.stun=0;m.updateHorses(0);assert(m.hero.mounted);m.dismount(false);assert.equal(horse.falls,1);
 m.hero.mountCooldown=0;m.updateHorses(0);m.dismount(true);assert.equal(horse.falls,2);assert(horse.fleeing);m.hero.mountCooldown=0;m.hero.z=0;m.hero.stun=0;m.updateHorses(0);assert(!m.hero.mounted);m.updateHorses(3);assert(!m.horses.includes(horse));
});
test('enemy damaging hit throws rider; invulnerability prevents false falls',()=>{
 const m=setup();m.hero.mounted=true;const e=m.fighter('heavy',420,412);const a:Attack={move:'slash',elapsed:0,duration:1,impact:0,hit:false,face:-1,x:420,y:412};
 m.hero.inv=1;m.resolve(e,a);assert(m.hero.mounted);m.hero.inv=0;m.resolve(e,a);assert(!m.hero.mounted);assert.equal(m.horses[0].falls,1);assert((m.hero.knockdown??0)>0);
 m.resolve(e,a);assert.equal(m.horses[0].falls,1);
});
