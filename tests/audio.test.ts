import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Soundtrack} from '../src/audio.ts';
import {DEFAULT_PREFERENCES} from '../src/preferences.ts';
test('music starts only after unlock, pauses scheduled voices, resumes and applies volumes',()=>{
 const nodes:any[]=[],buses:any[]=[];
 const param=()=>({value:0,setValueAtTime(v:number){this.value=v;},setTargetAtTime(v:number){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Context {
  currentTime=0;state='running';destination={};resume(){return Promise.resolve();}
  createGain(){const b={gain:param(),connect(){},disconnect(){}};buses.push(b);return b;}
  createOscillator(){const n={frequency:param(),start(){},stop(){this.stopped=true;},connect(){},disconnect(){},stopped:false};nodes.push(n);return n;}
 }
 const original=globalThis.AudioContext;
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true,writable:true});
 try{
  const a=new Soundtrack();a.update(0,false,true);assert.equal(nodes.length,0);
  a.unlock();a.configure({...DEFAULT_PREFERENCES,music:.2,effects:.4});assert.equal(buses[0].gain.value,.2);assert.equal(buses[1].gain.value,.4);
  a.update(0,false,true);assert.ok(nodes.length>=2);a.update(0,false,false);assert.ok(nodes.every(n=>n.stopped));
  const count=nodes.length;a.update(1,true,true);assert.ok(nodes.length>count);a.pause();assert.ok(nodes.every(n=>n.stopped));
  const weaponCount=nodes.length;a.weapon('huangzhong');a.weapon('zhangfei',true,true);assert.equal(nodes.length,weaponCount+3);
  a.configure({...DEFAULT_PREFERENCES,muted:true});assert.equal(buses[0].gain.value,0);assert.equal(buses[1].gain.value,0);
  const mutedCount=nodes.length;a.weapon('guanyu',true);assert.equal(nodes.length,mutedCount);
 }finally{Object.defineProperty(globalThis,'AudioContext',{value:original,configurable:true,writable:true});}
});
