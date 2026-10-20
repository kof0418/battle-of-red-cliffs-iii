import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';
import {CommandInput} from '../src/command-input.ts';import {DEFAULT_BINDINGS,keyAction,PadInput} from '../src/controls.ts';
import {specialMotion} from '../src/special-motion.ts';import {specialHits} from '../src/specials.ts';
import {FixedStep} from '../src/fixed-step.ts';
const empty={x:0,y:0};
test('down then up plus attack triggers once; empty and reverse sequences do not',()=>{
 const c=new CommandInput();assert(!c.press('attack',0));c.press('down',10);c.press('up',150);assert(c.press('attack',160));assert(!c.press('attack',170));c.press('up',200);c.press('down',220);assert(!c.press('attack',230));
});
test('direction and attack windows expire and lateral actions cancel the command',()=>{
 const c=new CommandInput();c.press('down',0);c.press('up',401);assert(!c.press('attack',450));c.press('down',500);c.press('up',600);assert(!c.press('attack',881));c.press('down',900);c.press('up',950);c.press('left',960);assert(!c.press('attack',970));
});
test('pause/reset clears a partial command',()=>{const c=new CommandInput();c.press('down',0);c.press('up',100);c.reset();assert(!c.press('attack',120));});
test('old I and fourth gamepad face button no longer issue special',()=>{
 assert.equal(keyAction('KeyI',DEFAULT_BINDINGS),undefined);
 const p=new PadInput(),pad={index:0,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};p.read([pad]);pad.buttons[3].pressed=true;assert(!p.read([pad]).held.has('special'));
});
test('gamepad down up attack edges recognize the same command',()=>{
 const p=new PadInput(),c=new CommandInput(),pad={index:0,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))};p.read([pad]);let activated=false;
 for(const [time,index] of [[0,13],[100,12],[180,0]]){pad.buttons.forEach(b=>b.pressed=false);pad.buttons[index].pressed=true;for(const a of p.read([pad]).pressed)activated=c.press(a,time)||activated;}assert(activated);
});
test('all five specials produce exactly three contacts without spending health',()=>{
 for(const id of HERO_IDS){const m=new Campaign(id);m.start();m.wave=3;m.hero.x=500;m.hero.y=412;
 const e=m.fighter('boss',540,412);e.stun=3;m.enemies=[e];m.supplies=[];const hp=e.hp;assert(m.special());let contacts=0;
 for(let i=0;i<90;i++){m.tick(1/60,empty);contacts+=m.events.filter(e=>e.type==='special').length;}
 assert.equal(contacts,3,id);assert(e.hp<hp,id);assert.equal(m.hero.hp,160,id);assert.equal(m.waveDamage,0,id);
 }
});
test('low-health heroes can use command specials; air, pause, dodge and recovery reject',()=>{
 const m=new Campaign();assert(!m.special());m.start();m.hero.hp=1;m.hero.z=10;assert(!m.special());m.hero.z=0;m.hero.dodge=.2;assert(!m.special());m.hero.dodge=0;m.paused=true;assert(!m.special());m.paused=false;assert(m.special());assert(!m.special());assert.equal(m.hero.hp,1);
});
test('special grants brief invulnerability, with a vulnerable recovery interval',()=>{
 const m=new Campaign();m.start();m.enemies.forEach(e=>e.stun=3);m.hero.stun=.3;m.tick(1/60,{...empty,special:true,jump:true,dodge:true});assert.equal(m.hero.stun,0);assert.equal(m.hero.vz,0);assert.equal(m.hero.dodge,0);assert(m.hero.inv>0&&m.hero.inv<.6);
 for(let i=0;i<45;i++)m.tick(1/60,empty);assert.equal(m.hero.inv,0);assert(!m.special());
});
test('new visuals and geometry distinguish bow spin, diving slash and kick',()=>{
 assert(specialHits('huangzhong',500,412,1,410,412));assert(!specialHits('huangzhong',500,412,1,900,412));assert(!specialHits('weiyan',500,412,1,410,412));assert(specialMotion('zhaoyun',.5).lift>30);assert.equal(specialMotion('weiyan',.5).angle,-180);
});
test('queued special survives high refresh and hit-stop',()=>{
 const c=new FixedStep();let n=0;c.advance(1/144,{...empty,special:true},true,()=>{});c.advance(1/60,empty,true,(_,i)=>{if(i.special)n++;});assert.equal(n,1);
 const m=new Campaign();m.start();m.freeze=.04;m.tick(.02,{...empty,special:true});m.tick(.02,empty);m.tick(.02,empty);assert.equal(m.hero.attack?.move,'special');
});
