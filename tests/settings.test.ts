import test from 'node:test';import assert from 'node:assert/strict';
import {UserSettings} from '../src/user-settings.ts';
const memory=()=>{const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};};
test('settings migration retains preferences and records but never copies campaign data',()=>{
 const m=memory();m.setItem('red-banner-profile-v1',JSON.stringify({'red-banner-save-v1':'old campaign','red-banner-manual-1':'old slot','red-banner-controls-v1':'keys','red-banner-records-v13':'records'}));
 const p=new UserSettings(()=>m);assert.equal(p.getItem('red-banner-controls-v1'),'keys');p.setItem('red-banner-tutorial-v1','true');
 const migrated=JSON.parse(m.getItem('red-cliffs-settings-v1')!);assert.equal(migrated['red-banner-controls-v1'],'keys');assert.equal(migrated['red-banner-records-v13'],'records');assert(!('red-banner-save-v1' in migrated));assert(!('red-banner-manual-1' in migrated));
 assert.throws(()=>p.setItem('red-banner-save-v1','snapshot'));assert(m.getItem('red-banner-profile-v1')!.includes('old campaign'));
});
test('blocked browser storage does not prevent play and session preferences remain available',()=>{
 const p=new UserSettings(()=>{throw new Error('storage blocked');});assert.equal(p.getItem('red-banner-controls-v1'),null);assert.throws(()=>p.setItem('red-banner-controls-v1','new keys'));assert.equal(p.getItem('red-banner-controls-v1'),'new keys');
});
test('corrupt settings recover on next valid preference write',()=>{
 const m=memory();m.setItem('red-cliffs-settings-v1','broken');const p=new UserSettings(()=>m);assert.equal(p.getItem('red-banner-controls-v1'),null);p.setItem('red-banner-controls-v1','keys');assert.equal(new UserSettings(()=>m).getItem('red-banner-controls-v1'),'keys');
});
