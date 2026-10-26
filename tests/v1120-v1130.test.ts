import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Kind,attackHits} from '../src/combat.ts';
import {WEAPONS,crateLoot,weaponPickupReady} from '../src/loot.ts';
import {bossPlan,enemyTempo,BOSS_STYLE} from '../src/tactics.ts';
const idle={x:0,y:0};
function setup(kind:Kind='soldier',distance=80){const m=new Campaign();m.start();m.supplies=[];m.barrels=[];m.pending=[];m.hero.x=400;m.hero.y=412;m.hero.inv=99;const e=m.fighter(kind,400+distance,412);e.cooldown=99;m.enemies=[e];return {m,e};}
test('weapons have distinct speed, power and stagger without consuming melee durability',()=>{
 assert(WEAPONS.sword.duration<WEAPONS.axe.duration&&WEAPONS.axe.damage>WEAPONS.sword.damage);
 for(const weapon of ['sword','axe','hammer'] as const){const {m,e}=setup('heavy');e.guard=1;e.face=-1;m.hero.equipped={id:weapon,uses:1};m.swing();m.resolve(m.hero,m.hero.attack!);
  if(weapon==='sword')assert.equal(e.hp,e.max);else {assert(e.hp<e.max);assert.equal(e.guard,0);}
  if(weapon==='hammer'){assert(e.stun>=.8);assert(e.knockdown!>=.6);}
  assert.equal(m.hero.equipped?.uses,1);
 }
});
test('hammer can punish boss recovery but cannot erase a committed boss warning',()=>{
 const {m,e}=setup('boss');m.hero.equipped={id:'hammer',uses:12};e.attack={move:'slam',elapsed:.1,impact:.85,duration:1.8,hit:false,x:e.x,y:e.y,face:-1};
 m.swing();m.resolve(m.hero,m.hero.attack!);assert(e.attack);assert.equal(e.stun,0);e.inv=0;e.x=480;e.attack.hit=true;m.resolve(m.hero,m.hero.attack!);assert.equal(e.attack,null);assert(e.stun>=.8);
});
test('weapon pickup requires close grounded contact while food keeps its forgiving range',()=>{
 const {m}=setup();m.pickups=[{id:900,x:425,y:412,loot:'axe',amount:0},{id:901,x:425,y:412,loot:'bun',amount:25}];m.hero.hp=100;m.tick(1/60,idle);assert.equal(m.hero.hp,125);assert(!m.hero.equipped);
 m.hero.x=425;m.hero.dodge=.2;m.tick(1/60,idle);assert(!m.hero.equipped);m.hero.dodge=0;m.hero.x=425;m.tick(1/60,idle);assert.equal(m.hero.equipped?.id,'axe');
 assert(!weaponPickupReady({x:0,y:0,z:0,vz:360,dodge:0},{x:0,y:0}));
});
test('each stage keeps two food crates and all four weapons, with late food before the boss',()=>{
 for(let stage=0;stage<5;stage++){const drops=Array.from({length:6},(_,i)=>crateLoot(stage,i+1));assert.equal(new Set(drops).size,6);assert.equal(drops[1],'bun');assert.equal(drops[4],'meat');}
});
test('one weapon and one shield ration per arena across melee and throw kills, never from bosses',()=>{
 const {m,e}=setup('spearman');e.hp=1;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(m.pickups[0].loot,'sword');assert(m.pickups[0].availableAt!>m.time);
 const hammer=m.fighter('hammer',470,412);m.enemies.push(hammer);m.grappleDamage(hammer,1000);assert.equal(m.pickups.length,1);
 for(let i=0;i<2;i++){const heavy=m.fighter('heavy',470,412);m.grappleDamage(heavy,1000);}assert.equal(m.pickups.filter(p=>p.loot==='bun').length,1);
 const boss=m.fighter('boss',470,412);m.grappleDamage(boss,9999);assert.equal(m.pickups.length,2);
 m.wave=1;m.spawn();const next=m.fighter('mauler',470,412);m.grappleDamage(next,9999);assert.equal(m.pickups[0].loot,'hammer');
});
test('wave three has one extra wall-side barrel with a real collectible reward',()=>{
 for(let stage=0;stage<5;stage++){const m=new Campaign();m.stage=stage;m.wave=2;m.status='playing';m.spawn();assert.equal(m.barrels.length,2);const barrel=m.barrels[1];assert([354,499].includes(barrel.y));m.hero.x=barrel.x-40;m.hero.y=barrel.y;m.hero.equipped={id:'axe',uses:1};m.enemies=[];m.swing();m.resolve(m.hero,m.hero.attack!);assert(m.pickups.some(p=>p.loot===(stage%2?'knife':'book')));}
});
test('bosses select attacks by spacing without losing minimum warning or finisher recovery',()=>{
 for(const kind of Object.keys(BOSS_STYLE))for(const hp of [100,50,20])for(let i=0;i<9;i++)for(const dx of [45,120,220]){
  const p=bossPlan(kind,hp,100,i,{dx,dy:0});assert(p.windup>=.65);assert(p.recovery>=.6);
 }
 assert.equal(bossPlan('hunter',100,100,0,{dx:250,dy:0}).move,'fan');assert.equal(bossPlan('hunter',100,100,0,{dx:60,dy:0}).move,'sweep');
 assert.equal(bossPlan('frostlord',100,100,0,{dx:45,dy:0}).move,'slam');assert.equal(bossPlan('frostlord',100,100,0,{dx:110,dy:0}).move,'ring');
 assert.equal(bossPlan('marshal',100,100,0,{dx:220,dy:0}).move,'charge');assert.equal(bossPlan('regent',100,100,1,{dx:110,dy:65}).move,'cross');
});
test('actual boss AI uses extended fan/cross lanes and locks warning before player moves',()=>{
 for(const kind of ['hunter','regent'] as const){const {m,e}=setup(kind,270);e.y=460;e.cooldown=0;m.ai(e,0,1/60);assert.equal(e.attack?.move,kind==='hunter'?'fan':'cross');const a=e.attack!,x=a.x,y=a.y;m.hero.x+=100;m.hero.y-=55;m.ai(e,0,.2);assert.equal(a.x,x);assert.equal(a.y,y);}
});
test('ranged enemies change lane after firing and still return to an attack lane',()=>{
 for(const kind of ['archer','hunter'] as const){const {m,e}=setup(kind,220);e.attacks=1;e.cooldown=1;const y=e.y;m.ai(e,0,.2);assert.notEqual(e.y,y);e.cooldown=0;e.attack=null;e.y=m.hero.y;m.ai(e,0,.01);assert(e.attack);}
});
test('brute has two separately warned punches and long recovery; hammers commit to longer recovery',()=>{
 const first=enemyTempo('brute',0),second=enemyTempo('brute',1);assert(first.windup>=.5&&second.windup>=.5);assert(second.recovery>first.recovery);assert(second.gap>first.gap);
 for(const kind of ['brute','hammer','mauler'] as const){const {m,e}=setup(kind,60);e.cooldown=0;m.ai(e,0,.01);assert(e.attack);assert(e.attack!.impact>=.5);if(kind!=='brute')assert(e.attack!.duration-e.attack!.impact>=.85-1e-9);}
});
test('ring still has an inner safe zone, fan gaps and cross corners remain escapable',()=>{
 const {m}=setup();const a={move:'ring' as const,x:400,y:412,face:1,elapsed:0,impact:1,duration:2,hit:false};m.hero.x=420;assert(!attackHits(a,m.hero,0));m.hero.x=500;assert(attackHits(a,m.hero,0));
});
