import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';
import {contactMotion,planted,poleRearHand,localContact,specialBeat} from '../src/choreography.ts';
import {heroMotion} from '../src/motion.ts';
import {duelForm,DUEL_SPECIAL_TIMES} from '../src/duel-forms.ts';
import {soldierPose,drawSwordSoldier} from '../src/soldier-art.ts';
for(const id of ['guanyu','zhangfei'] as const)for(const step of [1,2,3])test(`${id} ${step}: contact frame aligns with actual hit; anticipation and recovery are continuous`,()=>{
 const m=new Campaign(id),f=m.hero,s=duelForm(id,step)!;f.step=step;
 f.attack={move:'slash',elapsed:s.impact,duration:s.duration,impact:s.impact,hit:false,face:1,x:f.x,y:f.y};
 const hit=contactMotion(f,2),expected=heroMotion(id,step,2);for(const key of Object.keys(expected) as (keyof typeof expected)[])assert(Math.abs(hit[key]-expected[key])<1e-8);
 f.attack.elapsed=s.impact-1e-6;const before=contactMotion(f,1);assert(Math.abs(before.x-hit.x)<.01);assert(Math.abs(before.angle-hit.angle)<.01);
 f.attack.elapsed=s.duration;assert.deepEqual(contactMotion(f,4),heroMotion(id,step,4));
 f.attack.elapsed=s.impact*.25;const quarter=contactMotion(f,0);assert.notEqual(quarter.x,heroMotion(id,step,0).x);
});
for(const id of ['guanyu','zhangfei'] as const)test(`${id}: each special pulse has its own contact and recovery`,()=>{
 const f=new Campaign(id).hero;f.attack={move:'special',elapsed:0,duration:.9,impact:.1,hit:false,face:1,x:0,y:0};
 assert(!specialBeat(f).active);
 DUEL_SPECIAL_TIMES[id].forEach((t,i)=>{f.attack!.elapsed=t;assert.equal(specialBeat(f).beat,i);assert(specialBeat(f).active);f.attack!.elapsed=t+.13;assert(!specialBeat(f).active);});
});
test('feet stay planted only in supported ground poses',()=>{
 const f=new Campaign('guanyu').hero;assert(planted(f));f.z=30;assert(!planted(f));f.z=0;f.grapplePose='throw';assert(!planted(f));f.grapplePose=undefined;f.mounted=true;assert(!planted(f));
});
test('rear hand stays 22 pixels along the actual shaft at every angle',()=>{
 for(const angle of [-1.8,0,1.5,2.95]){const hand=poleRearHand(32,-42,angle);assert(Math.abs(Math.hypot(hand.x-32,hand.y+42)-22)<1e-9);assert(Math.abs((hand.x-32)*Math.cos(angle)+(hand.y+42)*Math.sin(angle))<1e-9);}
});
test('grab contact round trips mirrored and rotated actor coordinates',()=>{
 for(const face of [-1,1])for(const angle of [-1.5,0,.8]){
  const p=localContact(460,310,400,420,angle,1.24*face,1.24),x=p.x*1.24*face,y=p.y*1.24;
  assert(Math.abs(400+x*Math.cos(angle)-y*Math.sin(angle)-460)<1e-8);assert(Math.abs(420+x*Math.sin(angle)+y*Math.cos(angle)-310)<1e-8);
 }
});
test('sword infantry reaches forward cut at impact and hides blade while captured',()=>{
 const m=new Campaign(),f=m.fighter('soldier',480,412);f.attack={move:'slash',elapsed:.55,duration:1,impact:.55,hit:false,face:1,x:480,y:412};assert(Math.abs(soldierPose(f).angle)<1e-8);
 let saves=0;const g=new Proxy({},{get:(_,key)=> (...args:unknown[])=>{for(const x of args)if(typeof x==='number')assert(Number.isFinite(x));if(key==='save')saves++;if(key==='restore')saves--;return g;}});
 for(const pose of [undefined,'held','air-held','thrown'] as const){f.grapplePose=pose;assert.equal(soldierPose(f).captive,!!pose);drawSwordSoldier(g as never,f,1);assert.equal(saves,0);}
});
test('hit feedback uses contact position before knockback for both facings',()=>{
 for(const face of [-1,1]){const m=new Campaign('guanyu');m.start();m.hero.x=400;m.hero.y=412;m.hero.face=face;m.hero.step=2;m.hero.last=m.time*1000;m.hero.comboHit=true;m.pending=[];m.supplies=[];m.enemies=[];
 const e=m.fighter('soldier',400+face*50,412);m.enemies=[e];m.swing();const x=e.x;m.resolve(m.hero,m.hero.attack!);const hit=m.events.find(e=>e.type==='hit');assert(hit);assert.equal(hit.x,x);assert.notEqual(e.x,x);}
});
