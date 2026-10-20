import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ProfileStorage,PROFILE_KEY,exportProfile,parseBackup,MAX_BACKUP_BYTES} from '../legacy/profile.ts';
import {ResumeCountdown} from '../legacy/countdown.ts';
import {LESSONS} from '../src/experience.ts';
import {Campaign} from '../src/combat.ts';
import {captureSave,restoreSave} from '../legacy/save.ts';
import {fieldEvent,fieldHits} from '../src/battlefield.ts';
import {DEFAULT_BINDINGS} from '../src/controls.ts';
function memory(){const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};}
test('legacy profile migrates all keys on one write and preserves old storage',()=>{
 const s=memory();s.data.set('red-banner-best-v12','123');s.data.set('red-banner-tutorial-v1','false');const p=new ProfileStorage(s);p.setItem('red-banner-best-v13','456');
 assert.equal(p.getItem('red-banner-best-v12'),'123');assert.equal(s.data.get('red-banner-best-v12'),'123');assert.ok(s.data.has(PROFILE_KEY));
});
test('full backup round trip includes all three slots, controls, preferences and history',()=>{
 const s=memory(),p=new ProfileStorage(s),m=new Campaign();m.start();
 for(const k of ['red-banner-save-v1','red-banner-manual-1','red-banner-manual-2','red-banner-manual-3'])p.setItem(k,JSON.stringify(captureSave(m)));
 p.setItem('red-banner-controls-v1',JSON.stringify(DEFAULT_BINDINGS));p.setItem('red-banner-preferences-v1',JSON.stringify({music:.2}));
 p.setItem('red-banner-records-v12',JSON.stringify({guanyu:{score:123,rank:'S'}}));
 const restored=new ProfileStorage(memory());restored.replace(parseBackup(exportProfile(p)));
 assert.equal(restored.getItem('red-banner-manual-3'),p.getItem('red-banner-manual-3'));assert.equal(restored.getItem('red-banner-controls-v1'),p.getItem('red-banner-controls-v1'));assert.equal(restored.getItem('red-banner-records-v12'),p.getItem('red-banner-records-v12'));
});
test('restore quota failure leaves all existing progress intact',()=>{
 const s=memory();const p=new ProfileStorage(s);p.setItem('red-banner-best-v13','123');const before=s.getItem(PROFILE_KEY);
 const denied=new ProfileStorage({getItem:s.getItem,setItem:()=>{throw new Error('quota');}});
 assert.throws(()=>denied.replace({'red-banner-best-v13':'999'}));assert.equal(s.getItem(PROFILE_KEY),before);
});
test('backup validation rejects corrupt, oversized, foreign, unsafe and duplicate bindings',()=>{
 const wrap=(entries:unknown)=>JSON.stringify({format:'red-banner-backup',schema:1,entries});
 for(const text of ['bad',' '.repeat(MAX_BACKUP_BYTES+1),wrap({unknown:'1'}),wrap({'red-banner-manual-1':'{}'}),wrap({'red-banner-controls-v1':JSON.stringify({...DEFAULT_BINDINGS,attack:'KeyW'})}),wrap({'red-banner-records-v13':'{"guanyu":{"score":-1,"rank":"S"}}'})])assert.throws(()=>parseBackup(text));
});
test('all vertical lanes including bottom edge are threatened across an event cycle',()=>{
 for(const stage of [0,1])for(let y=350;y<=503;y++)assert.ok([0,1,2].some(c=>fieldHits(fieldEvent(stage,1,5.41+7*c,0)!,{x:400,y,z:0,inv:0,hp:160})),`stage ${stage}, lane ${y}`);
});
test('resume countdown takes three seconds without advancing the loaded battle',()=>{
 const m=new Campaign();m.start();m.time=5.39;const loaded=restoreSave(captureSave(m)),clock=new ResumeCountdown();clock.start();
 for(let i=0;i<179;i++){assert.equal(clock.tick(1/60),false);assert.equal(loaded.time,5.39);assert.equal(loaded.paused,true);}
 clock.tick(1/60);clock.tick(1/60);assert.equal(clock.remaining,0);clock.start();clock.cancel();assert.equal(clock.remaining,0);
 assert.equal(LESSONS.length,6);
});
