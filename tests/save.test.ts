import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';
import {captureSave,restoreSave,parseSave,readSave,writeSave,MAX_SAVE_BYTES} from '../src/save.ts';
const make=()=>{const m=new Campaign();m.start();return m;};
const mutate=(f:(s:any)=>void)=>{const s:any=captureSave(make());f(s);return JSON.stringify(s);};
test('battle snapshot round trip preserves health, foes, pickups, attacks and credits',()=>{
 const m=make();m.hero.hp=112;m.tick(1/60,{x:0,y:0,attack:true});const s=captureSave(m,1234,true),n=restoreSave(s);
 assert.deepEqual(n.hero,m.hero);assert.deepEqual(n.enemies,m.enemies);assert.deepEqual(n.supplies,m.supplies);assert.equal(n.paused,true);assert.equal(n.continues,2);assert.equal(s.best,1234);assert.equal(s.muted,true);
});
test('loaded battle advances identically after unpausing',()=>{
 const a=make();for(let i=0;i<100;i++)a.tick(1/60,{x:1,y:0,attack:i%12===0});const b=restoreSave(captureSave(a));b.togglePause();
 for(let i=0;i<90;i++){const input={x:0,y:0,attack:i%13===0,jump:i===10};a.tick(1/60,input);b.tick(1/60,input);}
 assert.deepEqual(b.hero,a.hero);assert.deepEqual(b.enemies,a.enemies);assert.equal(b.score,a.score);
});
test('terminal and intermission states retain continue rules',()=>{
 const m=make();m.hero.hp=0;m.tick(1/60,{x:0,y:0});const n=restoreSave(captureSave(m));assert.equal(n.status,'lost');assert.ok(n.continueRun());assert.equal(n.continues,1);
 const s=make();s.wave=3;s.enemies=[];s.tick(1/60,{x:0,y:0});assert.ok(restoreSave(captureSave(s)).nextStage());
});
test('schema, malformed files and oversized files rejected',()=>{
 assert.throws(()=>parseSave('not json'));assert.throws(()=>parseSave(' '.repeat(MAX_SAVE_BYTES+1)));
 assert.throws(()=>parseSave(mutate(s=>s.schema=2)));assert.throws(()=>parseSave(mutate(s=>s.run.hero.kind='__proto__')));
});
test('reject invalid numbers, duplicate ids, impossible credits and terminal state',()=>{
 for(const change of [(s:any)=>s.run.hero.hp=-1,(s:any)=>s.run.stage=3,(s:any)=>s.run.continues=99,(s:any)=>s.run.time=null,(s:any)=>s.run.enemies[0].id=s.run.hero.id,(s:any)=>s.run.status='won',(s:any)=>s.run.hero.attack={move:'bogus'}])assert.throws(()=>parseSave(mutate(change)));
});
test('unknown imported properties cannot override model methods',()=>{
 const s=parseSave(mutate(s=>{s.run.tick='bad';s.run.__proto__={polluted:true};s.run.hero.extra='ignored';}));const n=restoreSave(s);assert.equal(typeof n.tick,'function');assert.equal((n.hero as any).extra,undefined);assert.equal(({} as any).polluted,undefined);
});
test('snapshot is independent of later game mutations',()=>{
 const m=make(),s=captureSave(m);m.hero.hp=1;m.enemies[0].hp=1;assert.equal(s.run.hero.hp,160);assert.equal(s.run.enemies[0].hp,48);
});
test('restored ids stay unique across new waves',()=>{
 const m=restoreSave(captureSave(make()));m.paused=false;m.spawn();const ids=[m.hero,...m.enemies,...m.supplies].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
});
test('storage round trip and storage-denied errors are explicit',()=>{
 let value:string|null=null;const store={getItem:()=>value,setItem:(_key:string,v:string)=>{value=v;}};assert.equal(readSave(store),null);writeSave(store,captureSave(make()));assert.equal(readSave(store)?.run.wave,1);
 assert.throws(()=>writeSave({setItem:()=>{throw new Error('quota');}},captureSave(make())));
});
