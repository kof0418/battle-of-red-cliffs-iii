import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Kind} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';import {WEAPONS,crateLoot,type WeaponId} from '../src/loot.ts';
const idle={x:0,y:0};const tick=(m:Campaign,n=1)=>{for(let i=0;i<n;i++)m.tick(1/60,idle);};
function setup(){const m=new Campaign();m.start();m.supplies=[];m.hero.x=400;m.hero.y=412;m.hero.inv=100;for(const e of m.enemies)e.cooldown=100;return m;}
test('clearing every arena and advancing every stage never heals',()=>{
 const m=setup();m.hero.hp=61;
 for(let stage=0;stage<5;stage++){
  for(let wave=1;wave<=6;wave++){m.wave=wave;m.waveReward=-1;m.clearedAt=-1;m.enemies=[];m.pickups=[];tick(m);assert.equal(m.hero.hp,61);assert(!m.events.some(e=>e.type==='heal'));}
  if(stage<4){assert(m.nextStage());assert.equal(m.hero.hp,61);}
 }
 assert.equal(m.status,'won');
});
test('all thirty crates are accessible at a wall; each stage offers food and all four weapons',()=>{
 for(let stage=0;stage<5;stage++){const seen=new Set();const m=new Campaign();m.stage=stage;m.status='playing';
 for(let wave=1;wave<=6;wave++){m.spawn();const b=m.supplies[0];assert(b.y===354||b.y===499);assert(b.x<m.arenaEnd);m.hero.x=b.x-50;m.hero.y=b.y;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(m.pickups.length,1);seen.add(m.pickups[0].loot);assert.equal(m.pickups[0].loot,crateLoot(stage,wave));}
 assert.equal(seen.size,6);}
});
test('food stays at full health; weapons pick up at full health and do not heal or replace held weapons',()=>{
 const m=setup();m.pickups=[{id:800,x:400,y:412,amount:40,loot:'meat'},{id:801,x:400,y:412,amount:0,loot:'sword'}];tick(m);assert.equal(m.hero.equipped?.id,'sword');assert.equal(m.hero.hp,160);assert.equal(m.pickups.length,1);
 m.pickups.push({id:802,x:400,y:412,amount:0,loot:'axe'});tick(m);assert.equal(m.hero.equipped?.id,'sword');assert.equal(m.pickups.length,2);
 m.hero.hp=100;tick(m);assert.equal(m.hero.hp,140);assert.equal(m.pickups.length,1);
});
test('all five heroes use picked melee weapons, including Huang Zhong; swings do not consume durability',()=>{
 for(const id of HERO_IDS)for(const weapon of ['hammer','sword','axe'] as WeaponId[]){const m=setup();m.hero.heroId=id;m.hero.equipped={id:weapon,uses:1};const e=m.fighter('heavy',470,412);m.enemies=[e];m.swing();assert.equal(m.hero.equipped?.id,weapon);m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,180-WEAPONS[weapon].damage);assert(!m.events.some(e=>e.type==='arrow'));assert.equal(m.hero.attack?.weapon,weapon);}
});
test('knife travels before hitting, strikes nearest target once, respects lanes and pause',()=>{
 for(const face of [-1,1]){const m=setup();m.hero.face=face;m.hero.equipped={id:'knife',uses:1};const front=m.fighter('heavy',400+face*150,412),back=m.fighter('heavy',400+face*230,412),off=m.fighter('heavy',400+face*80,460);m.enemies=[back,off,front];m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(front.hp,180);assert.equal(m.projectiles.length,1);m.hero.attack=null;
 const x=m.projectiles[0].x;m.paused=true;tick(m,20);assert.equal(m.projectiles[0].x,x);m.paused=false;tick(m,20);assert.equal(front.hp,142);assert.equal(back.hp,180);assert.equal(off.hp,180);assert.equal(m.projectiles.length,0);}
});
test('all heroes can grab and throw all five full-health bosses, with post-throw cooldown',()=>{
 for(const id of HERO_IDS)for(const kind of ['boss','marshal','hunter','frostlord','regent'] as Kind[]){const m=setup();m.hero.heroId=id;const e=m.fighter(kind,428,412);e.cooldown=100;m.enemies=[e];assert(m.tryGrab({x:1,y:0}));m.tick(1/60,{x:1,y:0,grappleAttack:true});tick(m,42);assert.equal(m.grapple,null);assert(e.hp<e.max);assert((e.grappleCooldown??0)>0);}
});
test('equipment carries into next stage, while continuing resets equipment and projectiles',()=>{
 const m=setup();m.hero.equipped={id:'hammer',uses:5};m.hero.hp=81;m.status='stage-clear';m.nextStage();assert.equal(m.hero.hp,81);assert.equal(m.hero.equipped?.uses,5);m.status='lost';m.hero.hp=0;m.projectiles=[{id:999,x:400,y:412,face:1,remaining:300,damage:38}];m.continueRun();assert.equal(m.hero.hp,160);assert.equal(m.hero.equipped,undefined);assert.equal(m.projectiles.length,0);
});
test('all bosses support immediate aerial throws; active attacks still cannot be grabbed',()=>{
 for(const id of HERO_IDS)for(const kind of ['boss','marshal','hunter','frostlord','regent'] as Kind[]){const m=setup();m.hero.heroId=id;const e=m.fighter(kind,428,412);e.cooldown=100;m.enemies=[e];e.attack={move:'slam',x:428,y:412,face:-1,elapsed:.7,impact:.7,duration:1.2,hit:false};assert(!m.tryGrab({x:1,y:0}));e.attack.elapsed=.1;assert(m.tryGrab({x:1,y:0}));m.tick(1/60,{...idle,jump:true});tick(m,8);assert(e.z>m.hero.z&&m.hero.z>0);m.tick(1/60,{...idle,grappleAttack:true});tick(m,42);assert.equal(m.grapple,null);assert.equal(e.z,0);assert(e.hp<e.max);}
});
test('knives expire at maximum range, cannot hit high targets and cannot damage twice',()=>{
 const m=setup();m.enemies=[];const e=m.fighter('heavy',480,412);e.z=70;m.enemies=[e];m.projectiles=[{id:900,x:420,y:412,face:1,remaining:620,damage:38}];m.updateProjectiles(.1);assert.equal(e.hp,180);for(let i=0;i<10;i++)m.updateProjectiles(.1);assert.equal(m.projectiles.length,0);
});
