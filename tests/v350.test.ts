import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';
const idle={x:0,y:0};
function setup(){const m=new Campaign();m.start();m.pending=[];m.enemies=[];m.supplies=[];m.barrels=[];return m;}
test('a jump tapped during the final recovery frames fires once after recovery',()=>{
 const m=setup();m.hero.stun=.08;m.tick(1/60,{...idle,jump:true});assert.equal(m.hero.vz,0);
 for(let i=0;i<8;i++)m.tick(1/60,idle);assert.ok(m.hero.z>0);assert.equal(m.hero.jumpBufferedUntil,undefined);
 for(let i=0;i<80;i++)m.tick(1/60,idle);assert.equal(m.hero.z,0);assert.equal(m.hero.vz,0);
});
test('expired inputs and pause cannot replay a jump after a long stun',()=>{
 const m=setup();m.hero.stun=.4;m.tick(1/60,{...idle,jump:true});for(let i=0;i<40;i++)m.tick(1/60,idle);assert.equal(m.hero.z,0);
 m.hero.stun=.08;m.tick(1/60,{...idle,jump:true});m.clearPendingInputs();for(let i=0;i<20;i++)m.tick(1/60,idle);assert.equal(m.hero.z,0);
});
test('dodge tapped just before cooldown finishes is not eaten',()=>{
 const m=setup();m.hero.dodgeCooldown=.08;m.tick(1/60,{x:1,y:0,dodge:true});const x=m.hero.x;for(let i=0;i<9;i++)m.tick(1/60,idle);assert.ok(m.hero.x>x+10);assert.equal(m.hero.dodgeBufferedUntil,undefined);
});
test('two players keep their buffered inputs separate and rescue cannot queue a jump',()=>{
 const m=new Campaign();m.enableCoop('zhangfei');m.start();m.pending=[];m.enemies=[];m.hero.stun=.08;
 m.tick(1/60,{...idle,jump:true,partner:idle});for(let i=0;i<8;i++)m.tick(1/60,{...idle,partner:idle});assert.ok(m.hero.z>0);assert.equal(m.partner!.z,0);
 const s=setup();s.tick(1/60,{...idle,attack:true,jump:true});assert.equal(s.hero.jumpBufferedUntil,undefined);for(let i=0;i<60;i++)s.tick(1/60,idle);assert.equal(s.hero.z,0);
});

import {CommandBank} from '../src/command-input.ts';
test('keyboard special accepts the new window but still rejects an expired attack edge',()=>{
 const c=new CommandBank();c.press('keyboard','down',0);c.press('keyboard','up',440);assert.ok(c.press('keyboard','attack',750));
 c.press('keyboard','down',1000);c.press('keyboard','up',1400);assert.equal(c.press('keyboard','attack',1721),false);
});
