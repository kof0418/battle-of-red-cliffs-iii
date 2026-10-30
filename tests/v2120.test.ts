import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';
import {HitStopInput,approachingGrab} from '../src/hit-stop-input.ts';
import {CommandBank} from '../src/command-input.ts';import {HERO_IDS,type HeroId} from '../src/heroes.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu',coop=false){const m=new Campaign(id);if(coop)m.enableCoop('zhangfei');m.start();m.hero.x=400;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.enemies=[m.fighter('heavy',428,412)];m.enemies[0].cooldown=99;return m;}
function tick(m:Campaign,n:number,input:Input=idle){for(let i=0;i<n;i++)m.tick(1/60,input);}
test('hit-stop retains ordered jump and attack with their original directions, never replays held movement',()=>{
 const b=new HitStopInput();b.read({x:-1,y:0,jump:true},true);b.read({x:1,y:0,attack:true,grappleAttack:true},true);
 assert.deepEqual(b.read(idle,false),{x:-1,y:0,jump:true,comboY:0,throwX:-1});assert.equal(b.read(idle,false).throwX,1);assert.deepEqual(b.read(idle,false),idle);
 for(let i=0;i<10;i++)b.read({x:1,y:0},true);assert.deepEqual(b.read(idle,false),idle);
});
test('hit-stop queue is bounded and clear cancels every stored command',()=>{const b=new HitStopInput();for(let i=0;i<20;i++)b.read({...idle,jump:true},true);let n=0;while(b.read(idle,false).jump)n++;assert.equal(n,4);b.read({...idle,dodge:true},true);b.clear();assert.deepEqual(b.read(idle,false),idle);});
for(const id of HERO_IDS)test(`${id}: ordered jump then attack survives hit-stop and completes one aerial slam`,()=>{
 const m=setup(id);assert(m.tryGrab({x:1,y:0}));const e=m.enemies[0],hp=e.hp;m.freeze=.06;
 m.tick(1/60,{x:-1,y:0,jump:true});m.tick(1/60,{...idle,attack:true,grappleAttack:true});tick(m,7);
 assert.equal(m.grapple?.phase,'jump');assert.equal(m.grapple?.hits,0);assert(m.hero.x<400);assert(m.hero.z>0);assert.equal(e.hp,hp);
 tick(m,40);assert.equal(m.grapple,null);assert(e.hp<hp);assert.equal(m.hero.z,0);const after=e.hp;tick(m,10);assert.equal(e.hp,after);
});
for(const hits of [0,1,2])for(const direction of [-1,1])test(`frozen directional throw after ${hits} punches retains ${direction} on release`,()=>{
 const m=setup();assert(m.tryGrab({x:1,y:0}));for(let i=0;i<hits;i++)m.tick(1/60,{...idle,grappleAttack:true});m.freeze=.04;
 m.tick(1/60,{x:direction,y:0,grappleAttack:true});tick(m,5);assert.equal(m.grapple?.phase,'throw');assert.equal(m.grapple?.direction,direction);assert.equal(m.grapple?.hits,hits);
});
test('overlap grab accepts deliberate approach without turning a left-facing hero to the right',()=>{
 const m=setup();m.hero.face=-1;m.enemies[0].x=m.hero.x;assert(m.tryGrab({x:0,y:1}));assert.equal(m.hero.face,-1);
 assert(!approachingGrab(0,0,0,0));assert(!approachingGrab(-20,0,1,0));assert(!approachingGrab(0,-20,0,1));assert(approachingGrab(5,5,1,0));
});
test('fresh jump+attack while holding starts aerial slam rather than a ground throw or rescue',()=>{
 const m=setup();m.tryGrab({x:1,y:0});const hp=m.hero.hp;m.tick(1/60,{x:1,y:0,jump:true,attack:true,grappleAttack:true,dropWeapon:true});assert.equal(m.grapple?.phase,'jump');assert.equal(m.grapple?.hits,0);tick(m,9);assert.equal(m.grapple?.phase,'throw');assert.equal(m.grapple?.air,true);assert.equal(m.hero.hp,hp);
});
test('autoattack does not become a fresh grapple punch during hit-stop',()=>{const m=setup();m.tryGrab({x:1,y:0});m.freeze=.04;m.tick(1/60,{...idle,attack:true,grappleAttack:false});tick(m,6);assert.equal(m.grapple?.hits,0);});
test('pause cancels stored grapple jump and throw for both players',()=>{
 const m=setup('guanyu',true);m.tryGrab({x:1,y:0});m.freeze=.04;m.tick(1/60,{...idle,jump:true,partner:{...idle,dodge:true}});m.togglePause();m.togglePause();tick(m,8);assert.equal(m.grapple?.phase,'hold');assert.equal(m.partner!.dodgeCooldown,0);
});
test('two players independently consume frozen throws and jump directions',()=>{
 const m=setup('guanyu',true),p=m.partner!;p.x=620;p.y=460;const other=m.fighter('heavy',648,460);other.cooldown=99;m.enemies.push(other);assert(m.tryGrab({x:1,y:0}));assert(m.withPlayer(p,()=>m.tryGrab({x:1,y:0})));
 m.freeze=.04;m.tick(1/60,{x:-1,y:0,grappleAttack:true,partner:{x:1,y:0,jump:true}});tick(m,5);assert.equal(m.grapple?.direction,-1);assert.equal(m.grapple?.phase,'throw');assert.equal(m.grappleOf(p)?.phase,'jump');assert(p.x>620);
});
test('pad diagonal directions retain down-up command but expiry and device boundaries still apply',()=>{
 const c=new CommandBank();c.press('pad','down',0);c.press('pad','left',30);c.press('pad','up',150);c.press('pad','right',160);assert(c.press('pad','attack',180));assert(!c.press('pad','attack',190));
 c.press('pad','down',500);c.press('pad','up',600);assert(!c.press('pad','attack',901));c.press('pad','down',1000);c.press('touch','up',1100);assert(!c.press('touch','attack',1200));
 c.press('pad','left',1400,true);c.press('pad','down',1450,true);c.press('pad','right',1500,true);assert(c.press('pad','attack',1600,true));
});
