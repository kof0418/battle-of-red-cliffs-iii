import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';import {TrainingSession,LESSONS} from '../src/training.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.enableCoop('zhangfei');m.start();m.pending=[];m.enemies=[];m.supplies=[];m.barrels=[];m.pickups=[];m.horses=[];return m;}
test('a co-op gong provides two horses, cannot duplicate waiting horses, and fills only a missing mount',()=>{
 const m=setup();assert.ok(m.summonHorses());assert.equal(m.horses.length,2);assert.equal(m.summonHorses(),false);
 const horse=m.horses[0];horse.x=m.hero.x;horse.y=m.hero.y;horse.moving=false;horse.waiting=true;m.updateHorses(0);assert.ok(m.hero.mounted);assert.equal(m.horses.length,1);assert.equal(m.summonHorses(),false);
 m.horses=[];assert.ok(m.summonHorses());assert.equal(m.horses.length,1);
});
test('a mounted teammate does not drag the second horse beyond its waiting target',()=>{
 const m=setup();m.hero.mounted=true;const p=m.partner!;m.horses=[{id:999,x:p.x+10,y:p.y,target:p.x+10,life:20,moving:false}];const x=m.horses[0].x;m.updateHorses(.1);assert.equal(m.horses[0].x,x);m.withPlayer(p,()=>m.updateHorses(0));assert.ok(p.mounted);assert.equal(m.horses.length,0);
});
test('overlapping food goes to the more injured eligible player exactly once',()=>{
 for(const firstLow of [true,false]){const m=setup(),p=m.partner!;p.x=m.hero.x;p.y=m.hero.y;m.hero.hp=firstLow?30:100;p.hp=firstLow?100:30;m.pickups=[{id:800,x:p.x,y:p.y,amount:40,loot:'meat'}];m.tick(1/60,{...idle,partner:idle});assert.equal(m.hero.hp,firstLow?70:100);assert.equal(p.hp,firstLow?100:70);assert.equal(m.pickups.length,0);}
 const m=setup(),p=m.partner!;p.x=m.hero.x;p.y=m.hero.y;p.hp=20;p.stun=1;m.hero.hp=100;m.pickups=[{id:800,x:p.x,y:p.y,amount:40}];m.tick(1/60,{...idle,partner:idle});assert.equal(m.hero.hp,140);assert.equal(p.hp,20);
});
test('horse practice supports real mounting, dismounting and reset without ranked records',()=>{
 const t=new TrainingSession('guanyu');t.select(LESSONS.length);t.enableHorse();assert.equal(t.model.ranked,false);assert.equal(t.model.horses.length,1);
 for(let i=0;i<40&&!t.model.hero.mounted;i++){t.beforeStep();t.model.tick(1/60,{x:1,y:0});t.observe(t.model.events);}assert.ok(t.model.hero.mounted);
 t.model.tick(1/60,{...idle,jump:true});assert.equal(t.model.hero.mounted,false);assert.equal(t.model.horses.length,1);t.reset();assert.equal(t.model.hero.mounted,undefined);assert.equal(t.model.horses.length,1);assert.equal(t.mountedPractice,true);
});
