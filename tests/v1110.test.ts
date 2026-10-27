import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Kind,type Input} from '../src/combat.ts';import {HERO_IDS,type HeroId} from '../src/heroes.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu'){const m=new Campaign(id);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.hero.mounted=true;m.supplies=[];m.barrels=[];m.pending=[];m.enemies=[m.fighter('soldier',800,480)];m.enemies[0].cooldown=99;return m;}
function ticks(m:Campaign,n:number,input:Input=idle){for(let i=0;i<n;i++){m.freeze=0;m.tick(1/60,input);}}
for(const id of HERO_IDS)test(`${id}: rear mounted attack damages behind while rider and horse retain facing`,()=>{
 for(const face of [-1,1]){const m=setup(id);m.hero.face=face;const back=m.fighter('soldier',400-face*80,412),front=m.fighter('soldier',400+face*80,412);back.cooldown=front.cooldown=99;m.enemies=[back,front];ticks(m,1,{x:-face,y:0,attack:true});assert.equal(m.hero.attack?.face,-face);ticks(m,13);assert.equal(m.hero.face,face);assert(back.hp<back.max);assert.equal(front.hp,front.max);}
});
test('mounted strikes have three distinct timings, reset after a pause and do not use stowed weapons',()=>{
 const m=setup();m.hero.equipped={id:'axe',uses:14,hits:1};const timings=[];for(let i=0;i<3;i++){m.swing();timings.push(m.hero.attack!.duration);m.time+=.5;}assert.equal(new Set(timings).size,3);assert.equal(m.hero.step,3);assert(!m.hero.attack?.weapon);m.time+=.8;m.swing();assert.equal(m.hero.step,1);assert.equal(m.hero.equipped.hits,1);
});
test('horse accelerates, pauses without drifting, then turns before travelling backwards',()=>{
 const m=setup();ticks(m,1,{x:1,y:0});const early=m.hero.rideSpeed!;ticks(m,25,{x:1,y:0});assert(m.hero.rideSpeed!>early&&m.hero.rideSpeed!<=290);const x=m.hero.x;m.paused=true;ticks(m,40,{x:1,y:0});assert.equal(m.hero.x,x);m.paused=false;ticks(m,1,{x:-1,y:0});assert.equal(m.hero.face,1);assert.equal(m.hero.x,x);ticks(m,9,{x:-1,y:0});assert.equal(m.hero.face,-1);assert(m.hero.x<x);
});
test('horse charge hits each crossed foe once, has no invulnerability and is blocked by cooldown',()=>{
 const m=setup();const targets=[450,510].map(x=>{const f=m.fighter('heavy',x,412);f.cooldown=99;return f;});const high=m.fighter('soldier',450,412);high.z=160;high.vz=100;high.cooldown=99;const off=m.fighter('soldier',450,470);off.cooldown=99;m.enemies=[...targets,high,off];ticks(m,1,{...idle,dodge:true});assert.equal(m.hero.attack?.move,'ride-charge');assert.equal(m.hero.inv,0);ticks(m,23,{...idle,dodge:true});assert(targets.every(e=>e.hp===e.max-38));assert.equal(high.hp,high.max);assert.equal(off.hp,off.max);assert(m.hero.x>500);assert((m.hero.rideDashCooldown??0)>0);const x=m.hero.x;ticks(m,3,{...idle,dodge:true});assert.equal(m.hero.x,x);
});
test('charge cannot start during windup; damage knocks rider down and cancels charge',()=>{
 const m=setup();m.swing();ticks(m,1,{...idle,dodge:true});assert.equal(m.hero.attack?.move,'mounted');m.hero.attack=null;m.hero.rideDashCooldown=0;ticks(m,1,{...idle,dodge:true});const e=m.enemies[0];e.x=m.hero.x+20;e.y=412;m.resolve(e,{move:'slash',x:e.x,y:412,face:-1,elapsed:0,duration:1,impact:0,hit:false});assert(!m.hero.mounted);assert.equal(m.hero.rideDash,0);assert.equal(m.horses.length,1);assert.equal(m.horses[0].falls,1);
});
test('mounted Huang arrows travel and third shot pierces; special remains a penetrating arrow',()=>{
 const m=setup('huangzhong');const a=m.fighter('soldier',520,412),b=m.fighter('soldier',580,412);m.enemies=[a,b];m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(a.hp,a.max);assert(m.projectiles[0].arrow&&m.projectiles[0].piercing);m.updateProjectiles(.3);assert(a.hp<a.max&&b.hp<b.max);
 m.hero.attack=null;ticks(m,1,{...idle,horseSpecial:true});m.resolve(m.hero,m.hero.attack!);assert(m.projectiles.some(p=>p.arrow&&p.wave));
});
test('second-stage Boss rides only once per encounter and cannot be grabbed before being unseated',()=>{
 const m=new Campaign();m.stage=1;m.wave=5;m.status='playing';m.spawn();const boss=m.enemies.find(e=>e.kind==='marshal')!;assert(boss.mounted);m.enemies=[boss];m.hero.x=boss.x-25;m.hero.y=boss.y;assert(!m.tryGrab({x:1,y:0}));m.hero.step=3;const a={move:'slash' as const,x:m.hero.x,y:m.hero.y,face:1,elapsed:.3,duration:.5,impact:.2,hit:false};m.resolve(m.hero,a);assert(!boss.mounted);assert((boss.knockdown??0)>0);assert.equal(m.events.filter(e=>e.type==='enemy-dismount').length,1);assert.equal(m.horses.length,0);m.resolve(m.hero,a);assert.equal(m.events.filter(e=>e.type==='enemy-dismount').length,1);
});
test('mounted Boss telegraphs a moving lane attack, damages once, and can be avoided by changing lanes',()=>{
 for(const avoid of [false,true]){const m=setup();m.hero.mounted=false;m.hero.x=400;const boss=m.fighter('marshal',600,412);boss.mounted=true;boss.cooldown=0;m.enemies=[boss];m.ai(boss,0,1/60);assert.equal(boss.attack?.move,'cavalry');const x=boss.x;ticks(m,40);assert.equal(boss.x,x);assert.equal(m.hero.hp,160);if(avoid)m.hero.y=480;ticks(m,55);assert(boss.x<x);assert.equal(m.hero.hp,avoid?160:140);}
});
test('throwing a soldier into mounted Boss unseats it without creating another rideable horse',()=>{
 const m=setup();m.hero.mounted=false;const captive=m.fighter('soldier',425,412),boss=m.fighter('marshal',490,412);boss.mounted=true;boss.cooldown=99;m.enemies=[captive,boss];assert(m.tryGrab({x:1,y:0}));m.beginThrow(1,false);ticks(m,45);assert(!boss.mounted);assert(boss.hp<boss.max);assert.equal(m.horses.length,0);
});
test('light attacks keep mounted Boss mounted; repeated gongs and stage transitions keep player horse rules',()=>{
 const m=setup();const boss=m.fighter('marshal',460,412);boss.mounted=true;boss.cooldown=99;m.enemies=[boss];m.swing();m.resolve(m.hero,m.hero.attack!);assert(boss.mounted);m.hero.attack=null;m.pickups=[{id:999,x:400,y:412,loot:'gong',amount:0}];ticks(m,1);assert.equal(m.horses.length,0);assert.equal(m.score,1340); // 34 damage score plus duplicate gong
 m.status='stage-clear';m.nextStage();assert(!m.hero.mounted);assert.equal(m.hero.rideDash,undefined);assert.equal(m.horses.length,0);
});

test('lethal light strikes and environmental knockdowns do not leave a mounted corpse or lying horse',()=>{
 const m=setup();const boss=m.fighter('marshal',460,412);boss.mounted=true;boss.hp=1;m.enemies=[boss];m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(boss.hp,0);assert(!boss.mounted);assert.equal(m.events.filter(e=>e.type==='enemy-dismount').length,1);
 const n=setup(),e=n.enemies[0];e.mounted=true;e.knockdown=.8;ticks(n,1);assert(!e.mounted);assert.equal(n.horses.length,0);
});

test('mounted Huang arrows leave the raised bow in either facing, including rear shots and special',()=>{
 for(const face of [-1,1])for(const shotFace of [-1,1]){
  const m=setup('huangzhong');m.hero.face=face;m.swing(shotFace);m.resolve(m.hero,m.hero.attack!);
  const p=m.projectiles[0];assert.equal(p.y,m.hero.y);assert(p.drawHeight!>90&&p.drawHeight!<105);
  assert((p.x+p.drawOffsetX!-m.hero.x)*shotFace>60);
  m.projectiles=[];m.resolve(m.hero,{...m.hero.attack!,move:'wave',face});
  assert(m.projectiles[0].drawHeight!>90);assert.equal(m.projectiles[0].y,m.hero.y);
 }
 const foot=setup('huangzhong');foot.hero.mounted=false;foot.swing();foot.resolve(foot.hero,foot.hero.attack!);
 assert.equal(foot.projectiles[0].drawHeight,undefined);
});
