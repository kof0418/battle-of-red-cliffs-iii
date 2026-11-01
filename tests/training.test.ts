import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TrainingSession,LESSONS} from '../src/training.ts';
import type {Input} from '../src/combat.ts';
const tick=(t:TrainingSession,input:Input={x:0,y:0},frames=1)=>{for(let i=0;i<frames;i++){t.beforeStep();t.model.tick(1/60,input);t.observe(t.model.events);}};
test('training is isolated, unranked and never advances normal waves',()=>{
 const t=new TrainingSession('guanyu');assert.equal(t.model.ranked,false);assert.equal(t.model.partner,undefined);assert.equal(t.model.pending.length,0);
 const hp=t.model.hero.hp;tick(t,{x:0,y:0},1800);assert.equal(t.model.hero.hp,hp);assert.equal(t.model.wave,1);assert.equal(t.model.status,'playing');assert.equal(t.model.enemies.length,1);assert.equal(t.completed.size,0);
});
test('movement and airborne attack require actual combat motion',()=>{
 const t=new TrainingSession('guanyu');tick(t,{x:-1,y:0},40);assert.ok(t.completed.has(0));
 t.select(2);tick(t,{x:0,y:0,attack:true});assert.equal(t.completed.has(2),false);t.reset();tick(t,{x:0,y:0,jump:true});tick(t,undefined,4);tick(t,{x:0,y:0,attack:true},20);assert.ok(t.completed.has(2));
});
test('combo, grab throw, special and rescue are validated by the combat system',()=>{
 const t=new TrainingSession('guanyu');t.select(1);
 for(let i=0;i<240;i++)tick(t,{x:0,y:0,attack:i%12===0});assert.ok(t.completed.has(1));
 t.select(3);for(let i=0;i<100&&!t.model.grapple;i++)tick(t,{x:1,y:0});assert.ok(t.model.grapple);
 tick(t,{x:1,y:0,attack:true,grappleAttack:true});tick(t,undefined,80);assert.ok(t.completed.has(3));
 t.select(4);tick(t,{x:0,y:0,special:true});assert.ok(t.completed.has(4));
 t.select(5);tick(t,{x:0,y:0,dropWeapon:true});assert.ok(t.completed.has(5));
});
test('skipping and free practice do not award completion; resets keep earned progress',()=>{
 const t=new TrainingSession('guanyu');t.select(4);assert.equal(t.completed.size,0);t.select(LESSONS.length);assert.equal(t.free,true);tick(t,{x:1,y:0},60);assert.equal(t.completed.size,0);
 t.select(0);tick(t,{x:-1,y:0},40);const previous=t.model;t.reset();assert.ok(t.completed.has(0));assert.notEqual(t.model,previous);assert.equal(t.model.score,0);assert.equal(t.model.hero.x,250);
});
