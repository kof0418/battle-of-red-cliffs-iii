import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';
import {SPECIALS,specialHits} from '../src/specials.ts';
import {HERO_IDS} from '../src/heroes.ts';
import {captureSave,restoreSave,parseSave} from '../src/save.ts';
import {DEFAULT_BINDINGS,parseBindings,PadInput} from '../src/controls.ts';
import {FixedStep} from '../src/fixed-step.ts';
const empty={x:0,y:0};
test('five specials charge once, apply once and preserve kills / drops / score',()=>{
 for(const id of HERO_IDS){const m=new Campaign(id);m.start();m.hero.x=500;m.hero.y=412;
 m.enemies=m.enemies.slice(0,1);const e=m.enemies[0];e.x=540;e.y=412;e.stun=2;e.hp=30;
 m.tick(1/60,{...empty,special:true});assert.equal(m.hero.hp,148);assert.equal(m.waveDamage,12);assert.equal(m.hero.attack?.move,'special');
 for(let i=0;i<20;i++)m.tick(1/60,empty);
 assert.equal(m.kills,1);assert.equal(m.enemies.length,0);const score=m.score;
 for(let i=0;i<30;i++)m.tick(1/60,{...empty,special:true});assert.equal(m.score,score);assert.equal(m.kills,1);
 }
});
test('unique geometry, facing, depth and airborne rejection',()=>{
 assert(specialHits('guanyu',500,412,1,400,412));assert(specialHits('zhangfei',500,412,1,500,490));
 assert(!specialHits('guanyu',500,412,1,500,490));assert(specialHits('zhaoyun',500,412,1,800,412));
 assert(!specialHits('zhaoyun',500,412,1,800,470));assert(specialHits('huangzhong',500,412,1,900,490));
 assert(!specialHits('huangzhong',500,412,1,530,490));assert(specialHits('weiyan',500,412,-1,400,412));
 assert(!specialHits('weiyan',500,412,1,400,412));for(const id of HERO_IDS)assert(!specialHits(id,500,412,1,520,412,50));
 assert.equal(new Set(HERO_IDS.map(id=>SPECIALS[id].damage)).size,5);
});
test('low health, air, dodge, pause and ready reject without charging',()=>{
 const m=new Campaign();assert(!m.special());m.start();
 m.hero.hp=12;assert(!m.special());assert.equal(m.hero.hp,12);m.hero.hp=160;
 m.hero.z=10;assert(!m.special());m.hero.z=0;m.hero.dodge=.2;assert(!m.special());m.hero.dodge=0;
 m.paused=true;assert(!m.special());m.paused=false;assert(m.special());assert(!m.special());assert.equal(m.hero.hp,148);
});
test('special overrides stun and blocks simultaneous jump/dodge; pause freezes cooldown',()=>{
 const m=new Campaign();m.start();m.hero.stun=.3;m.tick(1/60,{...empty,special:true,jump:true,dodge:true});
 assert.equal(m.hero.stun,0);assert.equal(m.hero.vz,0);assert.equal(m.hero.dodge,0);assert(m.hero.inv>.7);
 m.paused=true;const c=m.hero.specialCooldown;m.tick(.03,empty);assert.equal(m.hero.specialCooldown,c);
});
test('save before impact preserves attack and cooldown; after impact cannot repeat',()=>{
 const m=new Campaign('zhaoyun');m.start();m.special();const saved=captureSave(m);const restored=restoreSave(saved);
 assert.equal(restored.hero.specialCooldown,8);assert.equal(restored.hero.attack?.move,'special');
 restored.paused=false;for(let i=0;i<20;i++)restored.tick(1/60,empty);
 assert(restored.hero.attack?.hit);const after=restoreSave(captureSave(restored));assert(after.hero.attack?.hit);
 const old=JSON.parse(JSON.stringify(saved));delete old.run.hero.specialCooldown;assert.equal(parseSave(JSON.stringify(old)).run.hero.specialCooldown,0);
 old.run.hero.specialCooldown=99;assert.throws(()=>parseSave(JSON.stringify(old)));
});
test('legacy remaps keep their keys and choose an unused special key',()=>{
 const {special,...legacy}=DEFAULT_BINDINGS;assert.equal(parseBindings(legacy).special,'KeyI');
 legacy.attack='KeyI';const next=parseBindings(legacy);assert.equal(next.attack,'KeyI');assert.notEqual(next.special,'KeyI');
});
test('special press survives high-refresh frame and hit stop',()=>{
 const clock=new FixedStep();let count=0;clock.advance(1/144,{...empty,special:true},true,()=>{});
 clock.advance(1/60,empty,true,(_,i)=>{if(i.special)count++;});assert.equal(count,1);
 const m=new Campaign();m.start();m.freeze=.04;m.tick(.02,{...empty,special:true});m.tick(.02,empty);m.tick(.02,empty);assert.equal(m.hero.attack?.move,'special');
});
test('standard gamepad fourth face button triggers once',()=>{
 const p=new PadInput(),pad={index:0,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};
 p.read([pad]);pad.buttons[3].pressed=true;assert(p.read([pad]).pressed.has('special'));assert(!p.read([pad]).pressed.has('special'));
});
