import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FixedStep } from '../src/fixed-step.ts';
import { Campaign, attackHits } from '../src/combat.ts';
import { HERO_IDS } from '../src/heroes.ts';
import { captureSave, restoreSave } from '../legacy/save.ts';
import { LEVELS } from '../src/levels.ts';
const idle = {x:0,y:0};
test('10, 20, 30, 60 and 144 FPS produce identical movement and enemy combat', () => {
 const runs = [10,20,30,60,144].map(fps => {
  const m = new Campaign(); m.start(); const clock = new FixedStep();
  for(let i=0;i<fps*4;i++)clock.advance(1/fps,{x:0,y:1},true,(dt,input)=>m.tick(dt,input));
  return captureSave(m).run;
 });
 for(const run of runs.slice(1))assert.deepEqual(run,runs[0]);
});
test('single presses survive substep frames but are not repeated during catch-up', () => {
 const c = new FixedStep(); const received:any[]=[];
 const tick=(dt:number,input:any)=>received.push({...input});
 c.advance(1/144,{...idle,attack:true,jump:true,dodge:true},true,tick);
 assert.equal(received.length,0); c.advance(.1,idle,true,tick);
 assert.equal(received.filter(i=>i.attack).length,1);
 assert.equal(received.filter(i=>i.jump).length,1);
 assert.equal(received.filter(i=>i.dodge).length,1);
});
test('pause drops queued input and long stalls have bounded catch-up', () => {
 const c=new FixedStep();let steps=0;let attacks=0;
 const tick=(dt:number,i:any)=>{steps++;if(i.attack)attacks++;};
 c.advance(.001,{...idle,attack:true},true,tick);c.advance(5,idle,false,tick);
 c.advance(10,idle,true,tick);assert.equal(steps,15);assert.equal(attacks,0);
});
for(const id of HERO_IDS)test(`${id}: high jumps cannot hit ground foes or crates; low attacks still work`,()=>{
 const m=new Campaign(id);m.start();m.hero.z=65;
 m.enemies=[m.fighter('heavy',230,412)];m.supplies=[{id:999,x:240,y:412,hp:24}];
 m.swing();m.resolve(m.hero,m.hero.attack!);
 assert.equal(m.enemies[0].hp,90);assert.equal(m.supplies[0].hp,24);
 assert.equal(attackHits({...m.hero.attack!,face:-1,x:230},m.hero,90),false);
 m.hero.z=0;m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.1);assert.ok(m.enemies[0].hp<90);
});
test('landing interrupts attacks and prevents immediate repeated jumps; recovery survives saves',()=>{
 const m=new Campaign();m.start();m.hero.z=1;m.hero.vz=-100;m.swing();
 m.tick(1/60,{...idle,jump:true,attack:true});
 assert.equal(m.hero.z,0);assert.equal(m.hero.vz,0);assert.equal(m.hero.attack,null);assert.ok(m.hero.stun>0);
 const restored=restoreSave(captureSave(m));assert.equal(restored.hero.stun,m.hero.stun);
 for(let i=0;i<8;i++)m.tick(1/60,idle);
 m.tick(1/60,{...idle,jump:true});assert.ok(m.hero.vz>0);
});
test('intermission stories use the whole party rather than the retired protagonist',()=>{
 for(const level of LEVELS){assert.ok(!level.story.includes('沈烈'));assert.ok(level.story.includes('眾將'));}
});
