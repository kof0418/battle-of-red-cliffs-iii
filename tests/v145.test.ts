import test from 'node:test';
import assert from 'node:assert/strict';
import {Campaign,stats} from '../src/combat.ts';
import {HERO_IDS,type HeroId} from '../src/heroes.ts';
import {AERIALS} from '../src/aerial.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu'){
 const m=new Campaign(id);m.start();m.hero.x=400;m.supplies=[];m.barrels=[];
 const e=m.fighter('heavy',460,412);e.stun=10;m.enemies=[e];return {m,e};
}
function ticks(m:Campaign,n:number,input=idle){for(let i=0;i<n;i++)m.tick(1/60,input);}
for(const id of HERO_IDS)test(`${id}: early jump attack waits for descent and hits once in its visible lane`,()=>{
 const {m,e}=setup(id),behind=m.fighter('heavy',320,412),off=m.fighter('heavy',460,480);behind.stun=10;off.stun=10;m.enemies.push(behind,off);
 m.tick(1/60,{...idle,jump:true,attack:true});assert.equal(m.hero.attack?.move,'aerial');
 ticks(m,22);assert(m.hero.z>54);assert.equal(e.hp,e.max,'no remote hit during ascent');
 ticks(m,24);assert.equal(e.hp,e.max-AERIALS[id].damage);assert.equal(behind.hp,behind.max);assert.equal(off.hp,off.max);
 assert.equal(m.projectiles.length,0,'Huang uses the bow body rather than a ground arrow');
 const hp=e.hp;ticks(m,18);assert.equal(e.hp,hp,'no repeated damage on landing');assert.equal(m.hero.z,0);assert.equal(m.hero.airAttackUsed,undefined);
});
for(const id of HERO_IDS)test(`${id}: late descending attack lands before the next physics frame clears it`,()=>{
 const {m,e}=setup(id);m.hero.z=1;m.hero.vz=-200;m.swing();assert.equal(m.hero.attack?.move,'aerial');
 m.tick(1/60,idle);assert.equal(e.hp,e.max-AERIALS[id].damage);assert.equal(m.hero.attack,null);assert.equal(m.hero.z,0);
});
test('air attack steers with the hero, keeps its original facing, and cannot be repeated in one jump',()=>{
 const {m,e}=setup();e.x=520;m.tick(1/60,{...idle,jump:true,attack:true});ticks(m,20,{x:1,y:0});assert(m.hero.x>430);assert.equal(e.hp,e.max);
 const x=m.hero.x;m.tick(1/60,{x:-1,y:0,attack:true});assert(m.hero.x<x);assert.equal(m.hero.face,1);
 ticks(m,20,{x:1,y:0});assert.equal(e.hp,e.max-AERIALS.guanyu.damage);
 m.hero.attack=null;m.swing();assert.equal(m.hero.attack,null,'one aerial attack per jump');
});
test('aerials respect enemy altitude, range and pause; a later jump can attack again',()=>{
 const {m,e}=setup();e.z=90;e.vz=0;m.hero.z=40;m.hero.vz=-60;m.swing();const before=m.hero.z;m.paused=true;ticks(m,12);assert.equal(m.hero.z,before);assert.equal(e.hp,e.max);m.paused=false;
 // Resolve uses the same target-height ceiling as ground strikes.
 m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,e.max);e.z=0;e.x=700;m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,e.max);
 ticks(m,40);e.x=m.hero.x+60;e.stun=10;m.tick(1/60,{...idle,jump:true,attack:true});ticks(m,50);assert.equal(e.hp,e.max-AERIALS.guanyu.damage);
});
test('normal ground damage, enemy HP, picked-up weapon drop and mounted jump remain unchanged',()=>{
 const {m,e}=setup();m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,e.max-m.slash(1).damage);assert.equal(stats.regent.hp,1360);
 const a=setup().m;a.hero.equipped={id:'sword',uses:14};a.tick(1/60,{...idle,jump:true,attack:true});assert.equal(a.hero.equipped,undefined);assert.equal(a.hero.attack,null);assert.equal(a.hero.z,0);assert(a.pickups.some(p=>p.loot==='sword'));
 const b=setup().m;b.hero.mounted=true;b.tick(1/60,{...idle,jump:true});assert.equal(b.hero.mounted,false);assert.notEqual(b.hero.attack?.move,'aerial');
});
