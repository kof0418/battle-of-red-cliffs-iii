import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';import {WEAPONS} from '../src/loot.ts';import {CACHE_LOOT} from '../src/secrets.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.enemies=[];m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.fieldSuppressed=true;return m;}
function foe(m:Campaign,x=470,y=412){const e=m.fighter('soldier',x,y);e.hp=e.max=1000;e.stun=e.cooldown=999;m.enemies.push(e);return e;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
for(const face of [-1,1])test(`chain ${face}: outbound pulls, return sweep hits near/rear foes and creates two actual contacts`,()=>{
 const m=setup();m.hero.face=face;m.hero.equipped={id:'chain',uses:12};const front=foe(m,400+face*100),rear=foe(m,400-face*40);m.swing();ticks(m,16);assert.equal(front.hp,976);assert.equal(rear.hp,1000);assert(Math.abs(front.x-400)<100);ticks(m,16);assert.equal(front.hp,952);assert.equal(rear.hp,976);ticks(m,20);assert.equal(front.hp,952);
});
for(const face of [-1,1])test(`crescent ${face}: travels out and back once per target, no duplicate blade, no automatic re-equip`,()=>{
 const m=setup();m.hero.face=face;m.hero.equipped={id:'crescent',uses:12};const e=foe(m,400+face*160);m.swing();ticks(m,12);assert.equal(m.projectiles.filter(p=>p.returning).length,1);assert(m.hero.bladeAway);m.hero.attack=null;m.swing();assert.equal(m.hero.attack,null);ticks(m,65);assert.equal(e.hp,956);assert.equal(m.projectiles.length,0);assert(!m.hero.bladeAway);assert.equal(m.hero.equipped!.id,'crescent');
});
test('crescent returns to a moving partner owner, safely clears at screen edge and never invents equipment',()=>{
 const m=setup();m.hero.equipped={id:'crescent',uses:12};m.hero.x=900;foe(m,800);m.swing();ticks(m,12);m.hero.equipped=undefined;ticks(m,110,{x:-1,y:0});assert.equal(m.projectiles.length,0);assert(!m.hero.bladeAway);assert.equal(m.hero.equipped,undefined);
});
for(const id of ['chain','crescent'] as const)test(`${id}: dropping retains weapon damage count, two damaging hits still destroy it`,()=>{
 const m=setup(),e=foe(m,420);m.hero.equipped={id,uses:WEAPONS[id].uses,hits:1};ticks(m,1,{...idle,dropWeapon:true});assert.equal(m.pickups[0].loot,id);assert.equal(m.pickups[0].weaponHits,1);assert(!m.hero.equipped);m.time+=1;m.hero.x=m.pickups[0].x;m.hero.y=m.pickups[0].y;ticks(m,1);assert.equal(m.hero.equipped?.id,id);m.hero.inv=0;e.x=m.hero.x+20;m.resolve(e,{move:'slash',elapsed:1,impact:.1,duration:2,hit:true,face:-1,x:e.x,y:e.y});assert(!m.hero.equipped);
});
for(let stage=0;stage<5;stage++)test(`stage ${stage+1}: fixed wall cache is discoverable by attack and drops once without auto-healing`,()=>{
 const m=new Campaign();m.stage=stage;m.wave=3;m.status='playing';m.spawn();m.enemies=[];m.pending=[];m.supplies=[];m.barrels=[];m.props=[];const c=m.secrets[0];assert([354,499].includes(c.y));assert.equal(c.loot,CACHE_LOOT[stage]);m.hero.x=c.x-30;m.hero.y=c.y;m.hero.hp=80;m.swing();m.resolve(m.hero,m.hero.attack!);m.hero.attack=null;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(m.pickups.filter(p=>p.loot===CACHE_LOOT[stage]).length,1);assert.equal(m.hero.hp,80);const score=m.score;m.breakSupply(c);assert.equal(m.score,score);
});
test('courier escape is distinct from a kill; interception drops exactly one rare weapon within its deadline',()=>{
 for(const intercept of [false,true]){const m=new Campaign();m.wave=2;m.status='playing';m.spawn();const e=m.enemies.find(e=>e.courier)!;assert(e);m.enemies=[e];m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.fieldSuppressed=true;
 if(intercept){m.grappleDamage(e,e.hp);assert.equal(m.pickups.length,1);assert(['chain','crescent'].includes(m.pickups[0].loot!));assert.equal(m.kills,1);assert.equal(m.escapes,0);}
 else{ticks(m,700);assert.equal(m.escapes,1);assert.equal(m.kills,0);assert.equal(m.enemies.length,0);assert.equal(m.pickups.length,0);}
 }
});

test('co-op weapon owner and secret pickup remain independent with no duplicated reward',()=>{
 const m=new Campaign();m.enableCoop('huangzhong');m.start();m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.enemies=[];m.fieldSuppressed=true;m.hero.x=400;m.hero.y=370;m.partner!.x=400;m.partner!.y=470;m.partner!.equipped={id:'crescent',uses:12};const e=foe(m,550,470);ticks(m,1,{...idle,partner:{...idle,attack:true}});ticks(m,70);assert.equal(e.hp,956);assert(!m.hero.bladeAway);assert(!m.partner!.bladeAway);assert(!m.hero.equipped);
});
test('a flying rare blade never blocks the owner mounted attacks or creates a second horse',()=>{
 const m=setup();foe(m,600);m.hero.equipped={id:'crescent',uses:12};m.swing();ticks(m,12);assert(m.projectiles.length);m.hero.mounted=true;m.hero.attack=null;m.swing();assert.equal(m.hero.attack?.move,'mounted');assert.equal(m.horses.length,0);
});
test('cache food remains on the floor at full health until actually collected after damage',()=>{
 const m=setup();foe(m,800);m.secrets=[{id:999,x:400,y:412,hp:0,loot:'meat',secret:true}];m.breakSupply(m.secrets[0]);ticks(m,1);assert.equal(m.pickups.length,1);assert.equal(m.hero.hp,160);m.hero.hp=100;ticks(m,1);assert.equal(m.hero.hp,140);assert.equal(m.pickups.length,0);
});
test('all five third arenas offer one courier, including one arriving with palace reinforcements',()=>{
 for(let stage=0;stage<5;stage++){const m=new Campaign();m.stage=stage;m.wave=2;m.status='playing';m.spawn();m.hero.inv=99;m.fieldSuppressed=true;let count=m.enemies.filter(e=>e.courier).length;assert(count<=1);if(!count){ticks(m,380);count=m.enemies.filter(e=>e.courier).length;}assert.equal(count,1);}
});
test('changing arenas clears the visual flight flag when the old projectile is discarded',()=>{
 const m=setup();m.hero.equipped={id:'crescent',uses:12};foe(m,800);m.swing();ticks(m,12);assert(m.hero.bladeAway);m.spawn();assert(!m.hero.bladeAway);assert.equal(m.projectiles.length,0);assert.equal(m.hero.equipped?.id,'crescent');
});
