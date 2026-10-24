import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Soundtrack,AUDIO_LIMITS} from '../src/audio.ts';
import {DEFAULT_PREFERENCES} from '../src/preferences.ts';
import {sceneryTiles,SCENERY_TILE} from '../src/scenery-plan.ts';
import {WORLD_WIDTH} from '../src/levels.ts';
function audioProbe(run:(a:Soundtrack,ctx:any,nodes:any[])=>void){
 const original=globalThis.AudioContext,nodes:any[]=[];let context:any;
 const param=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class Context {constructor(){context=this;}currentTime=0;state='running';destination={};resume(){return Promise.resolve();}
 createGain(){return {gain:param(),connect(){},disconnected:false,disconnect(){this.disconnected=true;}};}
 createOscillator(){const n={frequency:param(),onended:null as (()=>void)|null,stopped:false,disconnected:false,connect(){},disconnect(){this.disconnected=true;},start(){},stop(){this.stopped=true;}};nodes.push(n);return n;}}
 Object.defineProperty(globalThis,'AudioContext',{value:Context,writable:true,configurable:true});
 try{const a=new Soundtrack();a.unlock();run(a,context,nodes);}finally{Object.defineProperty(globalThis,'AudioContext',{value:original,writable:true,configurable:true});}
}
test('scenery tiles cover all five stage widths without gaps or oversized textures',()=>{
 const tiles=sceneryTiles(WORLD_WIDTH);assert.equal(tiles.length,6);assert.equal(tiles[0].x,0);assert.equal(tiles.at(-1)!.x+tiles.at(-1)!.width,WORLD_WIDTH);
 assert.equal(tiles.reduce((sum,t)=>sum+t.width*540*4,0),12096000);
 tiles.forEach((t,i)=>{assert(t.width>0&&t.width<=SCENERY_TILE);if(i)assert.equal(t.x,tiles[i-1].x+tiles[i-1].width);});
});
test('dense sound bursts cap effects while preserving a separate music budget',()=>audioProbe((a,ctx,nodes)=>{
 for(let i=0;i<250;i++){ctx.currentTime=i*.04;a.update(4,true,true);a.specialImpact('lubu',true);a.specialStrike('lubu',i%3===0);a.weapon('lubu',true,true);a.hitImpact(true);const d=a.diagnostics();assert(d.active<=AUDIO_LIMITS.total);assert(d.music<=AUDIO_LIMITS.music);assert(d.effects<=AUDIO_LIMITS.effects);}
 const d=a.diagnostics();assert(d.rejected>0);assert(d.music>0);assert.equal(d.active,nodes.length);assert(d.peak<=64);
 a.pause();assert.equal(a.diagnostics().active,0);assert(nodes.every(n=>n.stopped&&n.disconnected&&n.onended===null));
}));
test('finished voices disconnect immediately and repeated pause does not retain them',()=>audioProbe((a,ctx,nodes)=>{
 for(let i=0;i<30;i++){ctx.currentTime=i;a.weapon('zhaoyun',true);for(const n of nodes)n.onended?.();assert.equal(a.diagnostics().active,0);a.pause();a.pause();}
 assert(nodes.every(n=>n.disconnected));
}));
test('zero volume schedules no inaudible voices; muting clears pending nodes',()=>audioProbe((a,ctx,nodes)=>{
 a.configure({...DEFAULT_PREFERENCES,music:0,effects:0});a.update(4,true,true);a.weapon('guanyu',true);a.hitImpact();a.specialImpact('guanyu');a.gong();a.effect(80,.3);assert.equal(nodes.length,0);
 a.configure({...DEFAULT_PREFERENCES,muted:false});ctx.currentTime=1;a.update(4,true,true);a.specialImpact('guanyu');assert(a.diagnostics().active>0);
 a.configure({...DEFAULT_PREFERENCES,muted:true});assert.equal(a.diagnostics().active,0);assert(nodes.every(n=>n.disconnected));
}));
test('same-frame weapon contacts coalesce without suppressing subsequent attacks',()=>audioProbe((a,ctx,nodes)=>{
 for(let i=0;i<20;i++)a.weapon('zhangfei',true,true);assert.equal(nodes.length,2);ctx.currentTime=.04;a.weapon('zhangfei',true,true);assert.equal(nodes.length,4);
}));
