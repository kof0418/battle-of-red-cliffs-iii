import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';import {THROWS} from '../src/throws.ts';
const idle={x:0,y:0};
function setup(id:typeof HERO_IDS[number]='guanyu',kind:'soldier'|'heavy'|'boss'='heavy'){
 const m=new Campaign(id);m.start();m.hero.x=400;m.hero.y=412;m.supplies=[];const e=m.fighter(kind,428,412);e.cooldown=10;m.enemies=[e];return {m,e};
}
function punch(m:Campaign){m.tick(1/60,{...idle,attack:true,grappleAttack:true});}
function step(m:Campaign,n:number){for(let i=0;i<n;i++)m.tick(1/60,idle);}
test('all five heroes grab, punch exactly twice and throw in either direction',()=>{
 for(const id of HERO_IDS)for(const direction of [-1,1]){const {m,e}=setup(id);assert(m.tryGrab({x:1,y:0}),id);punch(m);punch(m);assert.equal(m.grapple?.hits,2);assert.equal(e.hp,76);punch(m);assert.equal(m.grapple?.hits,2);assert.equal(e.hp,76);
 m.tick(1/60,{x:direction,y:0,attack:true,grappleAttack:true});assert.equal(m.grapple?.phase,'throw');step(m,35);assert.equal(m.grapple,null);assert.equal(e.hp,76-THROWS[id].damage);assert(direction<0?e.x<400:e.x>428);assert.equal(e.z,0);
 }
});
test('all five heroes can lift and perform aerial throws after two punches',()=>{
 for(const id of HERO_IDS){const {m,e}=setup(id);m.tryGrab({x:1,y:0});punch(m);punch(m);m.tick(1/60,{...idle,jump:true});step(m,12);assert(m.hero.z>0);assert(e.z>m.hero.z);punch(m);assert.equal(m.grapple?.phase,'throw');step(m,35);assert.equal(m.grapple,null);assert.equal(m.hero.z,0);assert.equal(e.hp,Math.max(0,76-THROWS[id].damage-14));}
});
test('idle time escapes, and button spam after two punches cannot renew hold',()=>{
 const {m,e}=setup();m.tryGrab({x:1,y:0});step(m,85);assert.equal(m.grapple,null);assert.equal(e.grapplePose,undefined);assert(!m.tryGrab({x:1,y:0}));
 const b=setup();b.m.tryGrab({x:1,y:0});punch(b.m);punch(b.m);for(let i=0;i<95;i++)punch(b.m);assert.equal(b.m.grapple,null);
});
test('aerial escape if attack is not pressed before landing, no invisible held target',()=>{
 const {m,e}=setup();m.tryGrab({x:1,y:0});punch(m);punch(m);m.tick(1/60,{...idle,jump:true});step(m,50);assert.equal(m.grapple,null);assert.equal(m.hero.z,0);step(m,30);assert.equal(e.z,0);assert.equal(e.grapplePose,undefined);
});
test('paused battle freezes the escape deadline; autoattack does not punch',()=>{
 const {m}=setup();m.tryGrab({x:1,y:0});const time=m.time;m.paused=true;step(m,200);assert.equal(m.time,time);assert(m.grapple);m.paused=false;m.tick(1/60,{...idle,attack:true,grappleAttack:false});assert.equal(m.grapple?.hits,0);
});
test('active strikes, range and boss resistance; weakened stunned boss can be grabbed',()=>{
 const {m,e}=setup('guanyu','boss');assert(!m.tryGrab({x:1,y:0}));e.hp=100;e.stun=.2;assert(m.tryGrab({x:1,y:0}));
 const a=setup();a.e.attack={move:'slash',elapsed:.5,duration:1,impact:.5,face:-1,x:428,y:412,hit:false};assert(!a.m.tryGrab({x:1,y:0}));a.e.attack=null;a.e.y=450;assert(!a.m.tryGrab({x:1,y:0}));
});
test('walking into enemy grabs; stun or death releases; lethal slam scores only once',()=>{
 const a=setup();a.m.tick(1/60,{x:1,y:0});assert(a.m.grapple);a.m.hero.stun=.2;a.m.tick(1/60,idle);assert.equal(a.m.grapple,null);assert.equal(a.e.grapplePose,undefined);
 const {m}=setup('zhangfei','soldier');m.tryGrab({x:1,y:0});punch(m);punch(m);m.tick(1/60,{x:1,y:0,attack:true});step(m,35);assert.equal(m.kills,1);const score=m.score;step(m,30);assert.equal(m.score,score);assert.equal(m.kills,1);
});

test('all five heroes can approach live soldiers and heavies from either side without disabling AI',()=>{
 for(const id of HERO_IDS)for(const kind of ['soldier','heavy'] as const)for(const direction of [-1,1]){
  const {m,e}=setup(id,kind);e.x=400+direction*120;e.cooldown=0;
  for(let i=0;i<120&&!m.grapple;i++)m.tick(1/60,{x:direction,y:0});
  assert.equal(m.grapple?.target,e.id,`${id} ${kind} ${direction}`);assert.equal(m.hero.hp,m.hero.max);assert.equal(e.attack,null);
 }
});
test('close approach interrupts windup and accepts modest lane offsets',()=>{
 const {m,e}=setup();e.x=442;e.y=436;e.attack={move:'slash',elapsed:.2,duration:1,impact:.7,face:-1,x:e.x,y:e.y,hit:false};
 assert(m.tryGrab({x:1,y:0}));assert.equal(e.attack,null);
});
test('nearer enemy behind does not mask a grabbable enemy ahead; moving away does not grab',()=>{
 const {m,e}=setup();e.x=440;const behind=m.fighter('soldier',390,412);m.enemies.unshift(behind);
 assert(m.tryGrab({x:1,y:0}));assert.equal(m.grapple?.target,e.id);
 const b=setup();assert(!b.m.tryGrab({x:-1,y:0}));assert(!b.m.tryGrab({x:0,y:0}));
});
