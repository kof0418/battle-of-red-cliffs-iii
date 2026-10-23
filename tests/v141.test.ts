import test from 'node:test';import assert from 'node:assert/strict';import {Campaign} from '../src/combat.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.start();m.hero.x=400;m.hero.y=412;m.enemies=[m.fighter('heavy',850,490)];m.enemies[0].cooldown=99;return m;}
test('attack plus jump drops held weapon, cancels attack and retains durability on repick',()=>{
 const m=setup();m.hero.equipped={id:'axe',uses:14,hits:1};m.tick(1/60,{...idle,attack:true,jump:true});assert.equal(m.hero.equipped,undefined);assert.equal(m.hero.attack,null);assert.equal(m.hero.z,0);const p=m.pickups[0];assert.equal(p.loot,'axe');assert.equal(p.weaponHits,1);
 m.hero.x=p.x;m.tick(1/60,idle);assert(!m.hero.equipped);for(let i=0;i<50;i++)m.tick(1/60,idle);assert.equal(m.hero.equipped?.id,'axe');assert.equal(m.hero.equipped?.hits,1);assert.equal(m.pickups.length,0);
});
test('mounted gong is left on ground and works after dismount',()=>{
 const m=setup();m.hero.mounted=true;m.pickups=[{id:900,x:400,y:412,loot:'gong',amount:0}];m.tick(1/60,idle);assert.equal(m.pickups.length,1);assert.equal(m.horses.length,0);m.dismount(false);m.tick(1/60,idle);assert.equal(m.pickups.length,0);assert.equal(m.horses.filter(h=>!h.waiting).length,1);
});
test('next stage removes mounted horse and waiting horses but keeps weapon',()=>{
 const m=setup();m.hero.mounted=true;m.hero.equipped={id:'sword',uses:18,hits:1};m.status='stage-clear';m.nextStage();assert(!m.hero.mounted);assert(!m.hero.steed);assert.equal(m.horses.length,0);assert.equal(m.hero.equipped?.id,'sword');
});
test('drop chord survives hit-stop and cannot create duplicate pickups',()=>{
 const m=setup();m.hero.equipped={id:'knife',uses:1};m.freeze=.05;m.tick(1/60,{...idle,dropWeapon:true});assert(m.hero.equipped);for(let i=0;i<8;i++)m.tick(1/60,idle);assert(!m.hero.equipped);assert.equal(m.pickups.length,1);m.tick(1/60,{...idle,dropWeapon:true});assert.equal(m.pickups.length,1);
});
