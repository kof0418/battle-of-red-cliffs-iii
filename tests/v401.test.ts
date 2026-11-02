import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';
import {parsePreferences} from '../src/preferences.ts';
import {gripArm} from '../src/choreography.ts';
test('cornered bosses sidestep toward the available lane then come back inward',()=>{
 for(const x of [25,935])for(const y of [354,495]){
  const m=new Campaign();m.start();m.hero.x=x<480?130:830;m.hero.y=y;
  const e=m.fighter('boss',x,y);m.enemies=[e];e.cooldown=0;
  m.ai(e,0,.1);assert.equal(e.attack,null);assert.ok(y<426?e.y>y:e.y<y);
  for(let n=0;n<9;n++){m.time+=.1;m.ai(e,0,.1);}
  assert.ok(Math.abs(e.y-y)>46);assert.ok(x<480?e.x>x:e.x<x);
 }
});
test('escape does not cancel committed attacks, stun or knockdown',()=>{
 const m=new Campaign();m.start();m.hero.x=120;const e=m.fighter('boss',25,m.hero.y);m.enemies=[e];
 for(const state of [{stun:1},{knockdown:1},{attack:{move:'slam' as const,elapsed:0,duration:1,impact:.5,hit:false,face:1,x:25,y:e.y}}]){
  Object.assign(e,{stun:0,knockdown:0,attack:null},state);const y=e.y;m.ai(e,0,.1);assert.equal(e.y,y);
 }
});
test('incoming horses survive wave replacement and can still mount',()=>{
 const m=new Campaign();m.start();m.summonHorses();const horse=m.horses[0];const id=horse.id;m.hero.x=800;m.cameraLeft=650;m.spawn();
 assert.equal(m.horses[0].id,id);assert.ok(horse.target>=m.cameraLeft+40);
 m.hero.x=horse.target;m.hero.y=horse.y;for(let i=0;i<100&&!m.hero.mounted;i++)m.updateHorses(.05);
 assert.equal(m.hero.mounted,true);assert.equal(m.hero.steed?.id,id);
});
test('ordinary enemies now provide repeatable healing throughout an arena',()=>{
 const m=new Campaign();m.start();m.pickups=[];
 for(let i=1;i<=12;i++){m.kills=i;m.enemyDrop(m.fighter('soldier',400,410));}
 assert.equal(m.pickups.filter(p=>p.loot==='bun').length,4);assert.ok(m.pickups.every(p=>p.amount===25));
});
test('continue total persists, validates and subtracts used credits without refills',()=>{
 assert.equal(parsePreferences({}).continueLimit,10);for(const total of [2,5,10,20,99]){
  assert.equal(parsePreferences({continueLimit:total}).continueLimit,total);
  const m=new Campaign();m.continuesUsed=3;assert.ok(m.setContinueLimit(total));assert.equal(m.continues,Math.max(0,total-3));m.setContinueLimit(total);assert.equal(m.continues,Math.max(0,total-3));
 }
 for(const total of [-1,Infinity,1.5,100,'99'])assert.equal(parsePreferences({continueLimit:total}).continueLimit,10);
});
test('grip arms have fixed segments even with far away thrown-body targets',()=>{
 for(const x of [-300,0,20,300])for(const y of [-200,-50,100])for(const bend of [-1,1]){
  const a=gripArm(12,-56,x,y,bend);assert.ok(Math.hypot(a.x-12,a.y+56)<=43.001);
  assert.ok(Math.abs(Math.hypot(a.elbowX-12,a.elbowY+56)-22)<.001);assert.ok(Math.abs(Math.hypot(a.x-a.elbowX,a.y-a.elbowY)-22)<.001);
 }
});
test('an arriving horse also survives the transition to the next stage',()=>{
 const m=new Campaign();m.start();m.summonHorses();const id=m.horses[0].id;m.status='stage-clear';assert.ok(m.nextStage());assert.equal(m.horses[0].id,id);assert.ok(m.horses[0].target>=m.cameraLeft);assert.ok(m.horses[0].target<m.arenaEnd);
});
