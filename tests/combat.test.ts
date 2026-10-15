import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inRange,comboStep,stats} from '../src/combat.ts';
test('attacks respect facing, lane depth and reach',()=>{assert.ok(inRange(0,400,60,410,1,99));assert.ok(!inRange(0,400,-60,410,1,99));assert.ok(!inRange(0,400,60,440,1,99));assert.ok(!inRange(0,400,100,400,1,99));assert.ok(inRange(0,400,-60,410,-1,99));});
test('three-hit combo resets after window and cycles',()=>{assert.equal(comboStep(1,0,300),2);assert.equal(comboStep(2,300,600),3);assert.equal(comboStep(3,600,900),1);assert.equal(comboStep(2,0,700),1);});
test('archetypes have distinct speed, health and damage',()=>{assert.ok(stats.raider.speed>stats.soldier.speed);assert.ok(stats.heavy.hp>stats.soldier.hp);assert.ok(stats.boss.hp>stats.heavy.hp);});
