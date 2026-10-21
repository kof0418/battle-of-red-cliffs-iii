import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign, attackHits, type Attack} from '../src/combat.ts';
const idle={x:0,y:0};
const tick=(m:Campaign)=>m.tick(1/60,idle);
function finishStage(m:Campaign){m.wave=m.level.waves.length;m.enemies=[];tick(m);}

test('first boss opens intermission, only final boss wins campaign',()=>{
 const m=new Campaign();m.start();m.score=1234;finishStage(m);assert.equal(m.status,'stage-clear');
 const earned=m.score;assert.equal(earned,3234);const t=m.time;tick(m);assert.equal(m.time,t);assert.equal(m.stage,0);
 assert.ok(m.nextStage());assert.equal(m.stage,1);assert.equal(m.wave,1);assert.equal(m.score,earned);assert.equal(m.hero.hp,160);
 assert.equal(m.nextStage(),false);finishStage(m);assert.equal(m.status,'stage-clear');while(m.nextStage())finishStage(m);assert.equal(m.status,'won');assert.equal(m.nextStage(),false);
});
test('continue restarts current wave with checkpoint score and only two credits',()=>{
 const m=new Campaign();m.start();m.enemies=[];m.hero.x=930;for(let i=0;i<70;i++)tick(m);
 assert.equal(m.wave,2);const checkpoint=m.checkpointScore;
 m.score+=500;m.kills+=2;m.hero.hp=0;tick(m);assert.equal(m.status,'lost');
 assert.ok(m.continueRun());assert.equal(m.wave,2);assert.equal(m.stage,0);assert.equal(m.hero.hp,160);assert.equal(m.score,checkpoint);assert.equal(m.kills,m.checkpointKills);assert.equal(m.continues,1);assert.ok(m.hero.inv>0);assert.equal(m.enemies.length,m.level.waves[1].length);
 assert.equal(m.continueRun(),false);assert.equal(m.continues,1);
 m.hero.hp=0;tick(m);assert.ok(m.continueRun());assert.equal(m.continues,0);
 m.hero.hp=0;tick(m);assert.equal(m.continueRun(),false);assert.equal(m.status,'lost');
});
test('second-stage continue keeps second-stage roster and restores all supplies',()=>{
 const m=new Campaign();m.start();finishStage(m);m.nextStage();
 m.wave=m.level.waves.length-1;m.spawn();assert.ok(m.enemies.some(e=>e.kind==='marshal'));
 m.hero.hp=0;tick(m);m.continueRun();assert.equal(m.stage,1);assert.equal(m.wave,m.level.waves.length);assert.ok(m.enemies.some(e=>e.kind==='marshal'));assert.equal(m.supplies.length,1);assert.equal(m.pickups.length,0);
});
test('supply crate drops one medicine and healing respects depth, height and HP cap',()=>{
 const m=new Campaign();m.start();const b=m.supplies[0];m.hero.x=b.x-55;m.hero.y=b.y;
 const a:Attack={move:'slash',elapsed:0,duration:.3,impact:.1,hit:false,face:1,x:m.hero.x,y:m.hero.y};
 m.hero.step=1;m.resolve(m.hero,a);assert.equal(b.hp,7);m.resolve(m.hero,a);assert.equal(m.supplies.length,0);assert.equal(m.pickups.length,1);
 m.resolve(m.hero,a);assert.equal(m.pickups.length,1);
 m.hero.x=b.x;m.hero.y=b.y;m.hero.hp=160;tick(m);assert.equal(m.pickups.length,1);
 m.hero.hp=150;m.hero.y=b.y-40;tick(m);assert.equal(m.hero.hp,150);
 m.hero.y=b.y;m.hero.z=50;tick(m);assert.equal(m.hero.hp,150);
 m.hero.z=0;m.hero.vz=0;tick(m);assert.equal(m.hero.hp,160);assert.equal(m.pickups.length,0);assert.ok(m.events.some(e=>e.type==='heal'&&e.value===10));
});
test('dead player cannot collect a medicine to bypass continue screen',()=>{
 const m=new Campaign();m.start();m.hero.hp=0;m.pickups=[{id:999,x:m.hero.x,y:m.hero.y,amount:40}];tick(m);assert.equal(m.status,'lost');assert.equal(m.hero.hp,0);
});
test('marshal sweep threatens both sides and can be jumped',()=>{
 const m=new Campaign(),f=m.fighter('marshal',300,420);m.start();m.enemies=[f];m.hero.x=240;m.hero.y=420;f.cooldown=0;tick(m);assert.equal(f.attack?.move,'sweep');
 const a=f.attack!;assert.ok(attackHits(a,m.hero,1));m.hero.x=390;assert.ok(attackHits(a,m.hero,1));m.hero.y=480;assert.ok(!attackHits(a,m.hero,1));m.hero.y=420;m.hero.z=50;assert.ok(!attackHits(a,m.hero,1));
});
test('rank reflects continue usage and remaining health',()=>{
 const m=new Campaign();assert.equal(m.rank,'S');m.hero.hp=20;assert.equal(m.rank,'A');m.continuesUsed=2;assert.equal(m.rank,'B');
});

test('walking along bottom edge collects medicine from a crate broken in that lane',()=>{
 const m=new Campaign();m.start();const box=m.supplies[0];
 m.hero.x=box.x-55;m.hero.y=503;m.hero.hp=80;
 const a:Attack={move:'slash',elapsed:0,duration:.3,impact:.1,hit:false,face:1,x:m.hero.x,y:m.hero.y};
 m.hero.step=3;m.resolve(m.hero,a);assert.equal(m.pickups.length,1);
 for(let i=0;i<30;i++)m.tick(1/60,{x:1,y:0});
 assert.equal(m.hero.hp,120);assert.equal(m.pickups.length,0);
});
