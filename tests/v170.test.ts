import test from 'node:test';import assert from 'node:assert/strict';
import {TouchInput,directionAt,touchLayout} from '../src/touch-input.ts';
import {CommandBank} from '../src/command-input.ts';
import {PadInput,DEFAULT_PAD_BINDINGS,parsePadBindings,remapPad} from '../src/controls.ts';
import {parsePreferences} from '../src/preferences.ts';
import {enterFullscreen,toggleFullscreen} from '../src/immersive.ts';
import {Campaign} from '../src/combat.ts';
test('direction pad handles all eight directions and neutral without lifting a finger',()=>{
 const t=new TouchInput(),path=[[90,170,['down']],[90,90,[]],[90,10,['up']],[170,10,['right','up']],[170,90,['right']],[170,170,['right','down']],[10,170,['left','down']],[10,90,['left']],[10,10,['left','up']]] as const;
 for(const [x,y,expected] of path){const actions=directionAt(x,y,180,180);assert.deepEqual(actions,[...expected]);t.change(10,actions);assert.deepEqual([...t.held],actions);}
});
test('two fingers on the same action retain ownership until both release, and duplicate moves do not re-press',()=>{
 const t=new TouchInput();assert.deepEqual(t.change(1,['attack']),['attack']);assert.deepEqual(t.change(2,['attack']),[]);t.release(1);assert(t.held.has('attack'));t.change(3,['right','up']);t.release(2);assert(!t.held.has('attack'));assert(t.held.has('right'));assert.deepEqual(t.change(3,['right','up']),[]);t.reset();assert.equal(t.held.size,0);
});
test('direction finger can move while separate attack and jump fingers stay held; cancellation releases only its owner',()=>{
 const t=new TouchInput();t.change(1,['down']);t.change(2,['attack']);t.change(3,['jump']);t.change(1,['up']);assert.deepEqual([...t.held].sort(),['attack','jump','up']);t.release(3);assert(t.held.has('attack'));assert(t.held.has('up'));t.release(1);assert(t.held.has('attack'));t.release(2);assert.equal(t.held.size,0);
});
test('mobile down-up sliding and tapping tolerate diagonals but require a fresh attack and respect expiry',()=>{
 const c=new CommandBank();c.press('touch','down',0);c.press('touch','left',150);c.press('touch','up',550);assert.equal(c.phase('touch',560),2);assert(c.press('touch','attack',850));assert(!c.press('touch','attack',860));
 c.press('touch','down',1000);c.press('touch','up',1651);assert(!c.press('touch','attack',1700));c.press('touch','down',2000);c.press('touch','up',2200);assert(!c.press('touch','attack',2581));
});
test('keyboard timing stays strict and separate devices cannot finish each other’s commands',()=>{
 const c=new CommandBank();c.press('keyboard','down',0);c.press('touch','up',100);assert(!c.press('touch','attack',120));c.press('keyboard','up',401);assert(!c.press('keyboard','attack',410));
 c.press('keyboard','down',500);c.press('keyboard','up',600);c.press('keyboard','left',610);assert(!c.press('keyboard','attack',620));
 c.press('pad','down',700);c.press('pad','up',900);c.reset();assert(!c.press('pad','attack',950));
});
test('mounted mobile left-right attack is independent of the grounded special and resets',()=>{
 const c=new CommandBank();c.press('touch','left',0,true);c.press('touch','up',100,true);c.press('touch','right',500,true);assert(c.press('touch','attack',700,true));assert(!c.press('touch','attack',710,false));c.reset();assert.equal(c.phase('touch',720,true),0);
});
for(const [w,h] of [[844,390],[932,430],[740,360],[568,320],[390,844]])test(`${w}×${h}: larger controls fit the visual viewport in both normal and large sizes`,()=>{
 for(const large of [false,true]){const l=touchLayout(w,h,large);assert(l.cell>=60);assert(l.action>=64);assert(l.pad+2*l.action+40<w);assert(l.pad+24<h);assert(l.landscape===(w>h));}
});
function controller(){return {index:0,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};}
test('gamepad hysteresis prevents axis jitter from repeating direction edges, D-pad takes precedence',()=>{
 const r=new PadInput(),p=controller();r.read([p]);p.axes[0]=.36;assert(r.read([p]).pressed.has('right'));p.axes[0]=.28;assert(r.read([p]).held.has('right'));p.axes[0]=.34;assert.equal(r.read([p]).pressed.size,0);p.axes[0]=.19;assert(!r.read([p]).held.has('right'));p.buttons[14].pressed=true;p.axes[0]=1;const s=r.read([p]);assert(s.held.has('left'));assert(!s.held.has('right'));
});
test('gamepad remapping validates conflicts and preserves Start, Back and directions',()=>{
 const b=remapPad(DEFAULT_PAD_BINDINGS,'attack',3);assert.throws(()=>remapPad(b,'jump',3));assert.throws(()=>remapPad(b,'attack',9));assert.deepEqual(parsePadBindings({attack:9,jump:1,dodge:2}),DEFAULT_PAD_BINDINGS);
 const r=new PadInput(),p=controller();r.read([p],b);p.buttons[3].pressed=true;p.buttons[9].pressed=true;p.buttons[8].pressed=true;const s=r.read([p],b);assert(s.pressed.has('attack'));assert(s.pressed.has('pause'));assert(s.pressed.has('settings'));p.buttons[3].pressed=false;r.read([p],b);p.buttons[0].pressed=true;assert(!r.read([p],b).held.has('attack'));
});
test('touch size and pad preferences migrate safely from older settings',()=>{
 const p=parsePreferences({largeTouch:true,pad:{attack:3,jump:0,dodge:2}});assert(p.largeTouch);assert.equal(p.pad.attack,3);assert.deepEqual(parsePreferences({}).pad,DEFAULT_PAD_BINDINGS);assert.equal(parsePreferences({}).largeTouch,false);
});
test('fullscreen uses navigation hiding, survives denial and supports unavailable and legacy browser APIs',async()=>{
 let requested=0,exited=0;const d={fullscreenElement:null,documentElement:{requestFullscreen:async(options:unknown)=>{requested++;assert.deepEqual(options,{navigationUI:'hide'});}},exitFullscreen:async()=>{exited++;}};
 assert(await enterFullscreen(d as unknown as Document));assert.equal(requested,1);const active={...d,fullscreenElement:{}};assert(await toggleFullscreen(active as unknown as Document));assert.equal(exited,1);
 assert.equal(await enterFullscreen({documentElement:{requestFullscreen:async()=>{throw Error('denied');}}} as unknown as Document),false);assert.equal(await enterFullscreen({documentElement:{}} as Document),false);
 assert(await enterFullscreen({documentElement:{webkitRequestFullscreen:async()=>{requested++;}}} as unknown as Document));assert.equal(requested,2);
});
test('a mobile gesture triggers one real special without spending health',()=>{
 const c=new CommandBank(),m=new Campaign();m.start();m.enemies.forEach(e=>e.stun=5);c.press('touch','down',0);c.press('touch','up',500);const special=c.press('touch','attack',750);m.tick(1/60,{x:0,y:0,special});assert.equal(m.hero.attack?.move,'special');assert.equal(m.hero.hp,160);assert(!c.press('touch','attack',760));
});
