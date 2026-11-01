import {test} from 'node:test';import assert from 'node:assert/strict';
import {BOSS_GUIDES,bossActionHint,MOVE_GUIDES} from '../src/boss-guide.ts';
import {bossPlan} from '../src/tactics.ts';
test('every boss and phase preserves a telegraph and an individually tuned final opening',()=>{
 for(const [kind,guide] of Object.entries(BOSS_GUIDES))for(const hp of [100,50,20]){const plans=Array.from({length:12},(_,n)=>bossPlan(kind,hp,100,n,{dx:150,dy:20}));assert.ok(plans.every(p=>p.windup>=.65&&MOVE_GUIDES[p.move]));assert.ok(plans.some(p=>p.recovery===guide!.opening));assert.ok(guide!.counter.length>10);}
});
test('boss hints distinguish windup, dangerous follow-through and actual recovery',()=>{
 const attack={move:'slam' as const,x:0,y:0,face:1,elapsed:.2,impact:.8,duration:2,hit:false};assert.match(bossActionHint(attack),/重砸.*0.6秒/);assert.match(bossActionHint({...attack,hit:true,elapsed:.85}),/暫勿靠近/);assert.match(bossActionHint({...attack,hit:true,elapsed:1.1}),/反擊空檔 0.9秒/);
});
