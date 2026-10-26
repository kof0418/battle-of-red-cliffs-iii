import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Attack,type Kind} from '../src/combat.ts';import {HERO_IDS,type HeroId} from '../src/heroes.ts';import {THROWS,throwWeight,bossGrabWindow,sweptThrowContact} from '../src/throws.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu',kind:Kind='soldier'){const m=new Campaign(id);m.start();m.hero.x=400;m.hero.inv=0;m.supplies=[];m.barrels=[];m.pending=[];m.enemies=[m.fighter(kind,420,412)];m.enemies[0].cooldown=99;return m;}
function ticks(m:Campaign,n:number,input=idle){for(let i=0;i<n;i++){m.freeze=0;m.tick(1/60,input);}}
for(const id of HERO_IDS)test(`${id}: confirmed light attack can link to a close grab before recovery ends`,()=>{
 const m=setup(id),e=m.enemies[0];m.swing();const a=m.hero.attack!;ticks(m,Math.ceil((a.impact+.081)*60));assert(a.connected);assert(m.hero.attack);const hp=e.hp;
 for(let i=0;i<6&&!m.grapple;i++)ticks(m,1,{x:1,y:0});assert.equal(m.grapple?.target,e.id);assert(m.time<a.duration);assert.equal(e.hp,hp);assert.equal(m.hero.attack,null);
});
test('miss, finisher, holding attack, weapon and movement away cannot cancel into a recovery grab',()=>{
 for(const mode of ['miss','finisher','held','weapon','away']){const m=setup();if(mode==='miss')m.enemies[0].inv=1;if(mode==='weapon')m.hero.equipped={id:'sword',uses:18};if(mode==='finisher'){m.hero.step=2;m.hero.last=m.time;}
 m.swing();const a=m.hero.attack!;ticks(m,Math.ceil((a.impact+.081)*60));ticks(m,1,{x:mode==='away'?-1:1,y:0,...(mode==='held'?{attack:true}:{})});assert(!m.grapple,mode);assert(m.hero.attack,mode);}
});
test('confirmed attack may only cancel into grabbing its own damaged target',()=>{
 const m=setup(),e=m.enemies[0];m.swing();ticks(m,12);e.x=800;const bystander=m.fighter('soldier',425,412);bystander.cooldown=99;m.enemies.push(bystander);ticks(m,1,{x:1,y:0});assert(!m.grapple);assert(m.hero.attack);
});
test('front and back throws use different rotation, preserve the original facing and established distance',()=>{
 for(const face of [-1,1])for(const back of [false,true]){const m=setup();m.hero.face=face;m.enemies[0].x=400+face*25;assert(m.tryGrab({x:face,y:0}));const e=m.enemies[0],direction=back?-face:face;m.beginThrow(direction,false);assert.equal(m.grapple?.back,back);assert.equal(m.hero.face,face);ticks(m,9);assert((e.throwSpin??0)*(back?direction:-direction)>0);
 ticks(m,39);assert(!m.grapple);assert.equal(e.hp,e.max-THROWS.guanyu.damage);assert.equal(e.z,0);assert.equal(Math.round((e.x-400)*direction),12+THROWS.guanyu.distance);assert.equal(m.hero.grappleBack,undefined);}
});
test('heavy and boss lift lower, take longer, and keep the throw distance',()=>{
 const snapshots=[];for(const kind of ['soldier','mauler','boss'] as const){const m=setup('guanyu',kind);m.tryGrab({x:1,y:0});m.beginThrow(1,false);ticks(m,12);snapshots.push(m.enemies[0].z);assert(m.grapple);ticks(m,36);assert(!m.grapple);assert.equal(Math.round(m.enemies[0].x-400),192);}
 assert(snapshots[0]>snapshots[1]&&snapshots[1]>snapshots[2]);
});
test('swept body collision catches a traversed target, but not a remote lane or height',()=>{
 const a={x:0,y:412,z:50},b={x:200,y:412,z:20};assert(sweptThrowContact(a,b,{x:100,y:412,z:0}));assert(!sweptThrowContact(a,b,{x:100,y:460,z:0}));assert(!sweptThrowContact(a,b,{x:100,y:412,z:180}));assert(!sweptThrowContact(a,b,{x:250,y:412,z:20}));
});
test('throw collision can kill two foes once, keeps original throw alive and skips high targets',()=>{
 for(const direction of [-1,1]){const m=setup(),e=m.enemies[0];m.tryGrab({x:1,y:0});m.beginThrow(direction,false);const others=[70,120].map((x,i)=>{const f=m.fighter('soldier',400+direction*x,412);f.hp=20;f.cooldown=99;f.id=900+i;return f;});const high=m.fighter('soldier',400+direction*90,412);high.z=250;high.vz=300;high.cooldown=99;m.enemies.push(...others,high);ticks(m,48);assert(others.every(f=>f.hp===0));assert.equal(high.hp,high.max);assert.equal(e.hp,e.max-THROWS.guanyu.damage);assert.equal(m.kills,2);const score=m.score;ticks(m,15);assert.equal(m.score,score);}
});
for(const kind of ['boss','marshal','hunter','frostlord','regent'] as const)test(`${kind}: clear windup and recovery grab windows, active strike protected, timeout cannot regrab immediately`,()=>{
 for(const [elapsed,hit,expected] of [[.3,false,true],[.59,false,false],[.65,true,false],[.85,true,true]] as const){const m=setup('guanyu',kind),e=m.enemies[0];e.attack={move:'slam',elapsed,impact:.6,duration:1.4,hit,face:-1,x:420,y:412};assert.equal(m.tryGrab({x:1,y:0}),expected,`${elapsed}`);}
 const m=setup('guanyu',kind);assert(m.tryGrab({x:1,y:0}));ticks(m,170);assert(!m.grapple);assert(m.message.includes('頭目掙脫'));assert((m.enemies[0].grappleCooldown??0)>1.7);assert(!m.tryGrab({x:1,y:0}));
});
test('wake-up protection and pause prevent invisible grabs',()=>{
 const m=setup(),e=m.enemies[0];e.inv=.18;assert(!m.tryGrab({x:1,y:0}));e.inv=0;m.paused=true;assert(!m.tryGrab({x:1,y:0}));
});

test('jump initiation cannot turn into a ground grab in the same frame',()=>{
 const m=setup();m.tick(1/60,{x:1,y:0,jump:true});assert(!m.grapple);assert(m.hero.vz>0);
});
