import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePreferences,readPreferences,DEFAULT_PREFERENCES} from '../src/preferences.ts';
import {parseRecords,recordVictory} from '../src/records.ts';
test('settings clamp volumes and survive corrupt or unavailable storage',()=>{
 assert.deepEqual(readPreferences({getItem:()=>{throw Error('blocked');}}),DEFAULT_PREFERENCES);
 assert.deepEqual(readPreferences({getItem:()=>'{invalid'}),DEFAULT_PREFERENCES);
 const p=parsePreferences({music:9,effects:-4,muted:'yes',autoAttack:false,reducedMotion:true});
 assert.deepEqual(p,{continueLimit:10,largeTouch:false,pad:{attack:0,jump:1,dodge:2},difficulty:'normal',music:1,effects:0,muted:false,autoAttack:false,reducedMotion:true});
 assert.equal(parsePreferences({music:NaN}).music,.35);
});
test('victory records preserve best score and best rank independently without duplicate counters',()=>{
 const a=recordVictory({},'guanyu',18000,'S');const b=recordVictory(a,'guanyu',19000,'B');
 assert.deepEqual(b.guanyu,{score:19000,rank:'S'});assert.deepEqual(a.guanyu,{score:18000,rank:'S'});
 assert.deepEqual(recordVictory(b,'guanyu',19000,'B'),b);
 const c=recordVictory(b,'huangzhong',17000,'A');assert.equal(c.huangzhong?.rank,'A');assert.equal(c.guanyu?.score,19000);
});
test('corrupt victory records cannot introduce invalid scores or arbitrary keys',()=>{
 const r=parseRecords({guanyu:{score:-1,rank:'S'},weiyan:{score:12000,rank:'A'},zhaoyun:{score:3,rank:'X'},polluted:{score:10,rank:'S'}});
 assert.deepEqual(r,{weiyan:{score:12000,rank:'A'}});
});
