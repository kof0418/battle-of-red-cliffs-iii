import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';
import {captureSave,restoreSave,parseSave,SAVE_KEY,writeSave} from '../src/save.ts';
import {readSlot,writeSlot} from '../src/slots.ts';
import {PadInput,DEFAULT_BINDINGS,parseBindings,remap,keyAction} from '../src/controls.ts';
const idle={x:0,y:0};
const make=()=>{const m=new Campaign();m.start();return m;};
test('speed and no-damage awards vary by performance and cannot repeat after load',()=>{
 const fast=make(),slow=make(),hurt=make();slow.time=60;hurt.waveDamage=8;
 for(const m of [fast,slow,hurt]){m.enemies=[];m.tick(1/60,idle);}
 assert.equal(fast.waveReward,2000);assert.equal(slow.waveReward,1400);assert.equal(hurt.waveReward,1200);
 const n=restoreSave(captureSave(fast));n.paused=false;const score=n.score;
 for(let i=0;i<60;i++)n.tick(1/60,idle);assert.equal(n.score,score);
});
test('combo rewards increase for consecutive hits and stop after taking damage',()=>{
 const a=make(),b=make();for(const m of [a,b]){m.enemies=[m.fighter('heavy',230,412)];m.supplies=[];m.swing();}
 b.hits=10;a.resolve(a.hero,a.hero.attack!);b.resolve(b.hero,b.hero.attack!);assert.ok(b.score>a.score);
 const e=b.enemies[0];e.face=-1;b.hero.inv=0;
 b.resolve(e,{move:'slash',elapsed:1,duration:1,impact:.5,hit:false,face:-1,x:230,y:412});
 assert.equal(b.hits,0);assert.equal(b.waveDamage,13);
});
test('continue rolls back combo scores and resets only the current wave awards',()=>{
 const m=make();m.score=999;m.waveDamage=30;m.time=45;m.hero.hp=0;m.tick(1/60,idle);assert.ok(m.continueRun());
 assert.equal(m.score,0);assert.equal(m.waveDamage,0);assert.equal(m.waveReward,-1);assert.equal(m.waveStarted,m.time);
});
test('v1.0-era saves migrate without retroactive no-damage or cleared-wave bonuses',()=>{
 const m=make();m.enemies=[];m.tick(1/60,idle);const old:any=captureSave(m);old.gameVersion='0.5.1';
 delete old.run.waveStarted;delete old.run.waveDamage;delete old.run.waveReward;
 const n=restoreSave(parseSave(JSON.stringify(old)));n.paused=false;const score=n.score;n.tick(1/60,idle);
 assert.equal(n.score,score);assert.equal(n.ranked,false);assert.equal(n.waveDamage,1);assert.equal(n.waveReward,0);
 const modern:any=captureSave(make());delete modern.run.waveDamage;assert.throws(()=>parseSave(JSON.stringify(modern)));
});
test('three manual slots remain independent from autosaves and snapshots',()=>{
 const memory=new Map<string,string>();const storage={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);}};
 const m=make();for(let i=0;i<3;i++){m.score=i*100;writeSlot(storage,i,captureSave(m));}
 m.score=999;writeSave(storage,captureSave(m));assert.ok(memory.has(SAVE_KEY));
 for(let i=0;i<3;i++)assert.equal(readSlot(storage,i)?.run.score,i*100);
 assert.throws(()=>readSlot(storage,3));assert.throws(()=>writeSlot({setItem:()=>{throw new Error('quota');}},0,captureSave(m)));
 memory.set('red-banner-manual-2','bad');assert.throws(()=>readSlot(storage,1));assert.equal(readSlot(storage,0)?.run.score,0);
});
test('custom bindings validate conflicts and keep navigation / escape keys reserved',()=>{
 const b=remap(DEFAULT_BINDINGS,'attack','KeyF');assert.equal(keyAction('KeyF',b),'attack');assert.equal(keyAction('KeyJ',b),undefined);
 assert.equal(keyAction('ArrowLeft',b),'left');assert.equal(keyAction('KeyR',b),'restart');assert.equal(keyAction('Space',b),'jump');
 assert.throws(()=>remap(b,'jump','KeyF'));assert.throws(()=>remap(b,'attack','KeyR'));
 assert.deepEqual(parseBindings({...b,jump:'KeyF'}),DEFAULT_BINDINGS);assert.deepEqual(parseBindings(b),b);
});
function controller(){return {index:0,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};}
test('gamepad dead zone, edge detection, direction and actions',()=>{
 const p=controller(),reader=new PadInput();reader.read([p]);p.axes[0]=.2;assert.equal(reader.read([p]).held.size,0);
 p.axes[0]=.7;p.buttons[0].pressed=true;p.buttons[9].pressed=true;
 let state=reader.read([p]);assert.ok(state.held.has('right'));assert.ok(state.pressed.has('attack'));assert.ok(state.pressed.has('pause'));
 assert.equal(reader.read([p]).pressed.size,0);p.buttons[0].pressed=false;reader.read([p]);p.buttons[0].pressed=true;assert.ok(reader.read([p]).pressed.has('attack'));
});
test('gamepad disconnect and resume require neutral input before acting',()=>{
 const p=controller(),r=new PadInput();r.read([p]);p.buttons[0].pressed=true;assert.ok(r.read([p]).pressed.has('attack'));
 assert.equal(r.read([]).disconnected,true);assert.equal(r.read([p]).held.size,0);
 p.buttons[0].pressed=false;r.read([p]);p.buttons[0].pressed=true;assert.ok(r.read([p]).pressed.has('attack'));
 r.reset();assert.equal(r.read([p]).held.size,0);assert.equal(r.read([{...p,mapping:''}]).connected,false);
});
