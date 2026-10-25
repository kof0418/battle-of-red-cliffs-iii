import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';import {PadInput} from '../src/controls.ts';import {FixedStep} from '../src/fixed-step.ts';
const idle={x:0,y:0},chord={...idle,attack:true,jump:true};
function setup(id=HERO_IDS[0]){const m=new Campaign(id);m.start();m.hero.x=480;m.supplies=[];m.barrels=[];m.pending=[];m.enemies=[m.fighter('soldier',425,412),m.fighter('heavy',540,412),m.fighter('soldier',800,412)];m.enemies.forEach(e=>e.cooldown=99);return m;}
for(const id of HERO_IDS)test(`${id}: attack+jump spends health once and knocks both sides down`,()=>{
 const m=setup(id),hp=m.enemies.map(e=>e.hp);m.hero.stun=.2;m.tick(1/60,chord);assert.equal(m.hero.hp,152);assert.equal(m.hero.stun,0);assert(m.hero.inv>.5);assert.equal(m.hero.attack?.move,'rescue');assert.equal(m.hero.vz,0);
 assert.deepEqual(m.enemies.map(e=>e.hp),[hp[0]-20,hp[1]-20,hp[2]]);assert(m.enemies[0].x<425&&m.enemies[1].x>540);assert(m.enemies.slice(0,2).every(e=>(e.knockdown??0)>0&&!e.attack));assert.equal(m.waveDamage,8);assert.equal(m.stageDamage,8);
 m.freeze=0;m.tick(1/60,chord);assert.equal(m.hero.hp,152);assert.equal(m.enemies[0].hp,hp[0]-20);
});
test('rescue cannot kill its caster, trigger airborne/mounted/paused or replace a grapple',()=>{
 for(const hp of [1,8]){const m=setup();m.hero.hp=hp;m.tick(1/60,chord);assert.equal(m.hero.hp,hp);assert(!m.hero.attack);assert.equal(m.hero.vz,0);}
 const air=setup();air.hero.z=30;assert(!air.rescue());assert.equal(air.hero.hp,160);
 const mounted=setup();mounted.hero.mounted=true;assert(!mounted.rescue());
 const paused=setup();paused.paused=true;paused.tick(1/60,chord);assert.equal(paused.hero.hp,160);
 const grip=setup();grip.hero.x=400;grip.enemies[0].x=428;grip.tryGrab({x:1,y:0});assert(grip.grapple);assert(!grip.rescue());
});
test('rescue breaks shield defence and boss attacks, respects range and invulnerability',()=>{
 const m=setup(),boss=m.fighter('boss',515,412),shield=m.enemies[1];boss.attack={move:'slam',elapsed:.4,duration:1,impact:.6,hit:false,face:-1,x:480,y:412};shield.guard=.6;shield.face=-1;m.enemies.push(boss);m.enemies[0].inv=.8;m.tick(1/60,chord);assert.equal(boss.hp,boss.max-20);assert(!boss.attack);assert.equal(shield.guard,0);assert.equal(m.enemies[0].hp,m.enemies[0].max);
});
test('weapon chord still drops without health cost, while hit-stop preserves rescue request',()=>{
 const w=setup();w.hero.equipped={id:'sword',uses:18,hits:1};w.tick(1/60,chord);assert.equal(w.hero.hp,160);assert.equal(w.pickups[0].loot,'sword');assert.equal(w.hero.attack,null);
 const m=setup();m.freeze=.04;m.tick(1/60,chord);for(let i=0;i<6;i++)m.tick(1/60,idle);assert.equal(m.hero.hp,152);assert.equal(m.events.filter(e=>e.type==='rescue').length,0);
});
test('duplicate gongs score once each and never add a second horse in any horse state',()=>{
 for(const state of ['riding','arriving','waiting','fleeing']){
  const m=setup();if(state==='riding')m.hero.mounted=true;else{m.summonHorses();m.horses[0].waiting=state==='waiting';m.horses[0].fleeing=state==='fleeing';}
  const count=m.horses.length;m.pickups=[{id:900,x:480,y:412,loot:'gong',amount:0},{id:901,x:480,y:412,loot:'gong',amount:0}];m.tick(1/60,idle);assert.equal(m.score,2000,state);assert.equal(m.pickups.length,0);assert.equal(m.horses.length,count);assert(!m.summonHorses());m.tick(1/60,idle);assert.equal(m.score,2000);
 }
 const m=setup();m.pickups=[{id:900,x:480,y:412,loot:'gong',amount:0}];m.tick(1/60,idle);assert.equal(m.horses.length,1);assert.equal(m.score,0);m.horses=[];assert(m.summonHorses());assert.equal(m.horses.length,1);
});
function xbox(id='Xbox Wireless Controller',index=0){return {id,index,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))};}
test('Xbox USB/Bluetooth standard mapping covers movement, A/B/X, Start, View and release edges',()=>{
 for(const id of ['Xbox Wireless Controller','Xbox 360 Controller (XInput STANDARD GAMEPAD)','045e-0b13-Microsoft']){
  const p=xbox(id),r=new PadInput();assert.equal(r.read([p]).family,'Xbox');p.axes=[.7,-.8];for(const i of [0,1,2,8,9])p.buttons[i].pressed=true;const s=r.read([p]);for(const a of ['right','up','attack','jump','dodge','settings','pause'])assert(s.pressed.has(a));assert.equal(r.read([p]).pressed.size,0);
  assert(r.read([]).disconnected);assert.equal(r.read([p]).pressed.size,0);p.axes=[0,0];p.buttons.forEach(b=>b.pressed=false);r.read([p]);p.buttons[0].pressed=true;assert(r.read([p]).pressed.has('attack'));
 }
});
test('Xbox A+B chord reaches combat through a 144 Hz fixed-step buffer',()=>{
 const r=new PadInput(),p=xbox(),m=setup(),clock=new FixedStep();r.read([p]);p.buttons[0].pressed=p.buttons[1].pressed=true;const s=r.read([p]);const input:Input={...idle,attack:s.pressed.has('attack'),jump:s.pressed.has('jump'),dropWeapon:(s.pressed.has('attack')||s.pressed.has('jump'))&&s.held.has('attack')&&s.held.has('jump')};
 clock.advance(1/144,input,true,(dt,i)=>m.tick(dt,i));clock.advance(1/144,idle,true,(dt,i)=>m.tick(dt,i));clock.advance(1/144,idle,true,(dt,i)=>m.tick(dt,i));assert.equal(m.hero.hp,152);assert.equal(m.hero.attack?.move,'rescue');
});
test('controller replacement pauses/clears input even if a new controller occupies the same index',()=>{
 const r=new PadInput(),p=xbox();r.read([p]);p.buttons[0].pressed=true;r.read([p]);const q=xbox('Xbox Elite Wireless Controller');q.buttons[0].pressed=true;const changed=r.read([q]);assert(changed.disconnected);assert.equal(changed.pressed.size,0);q.buttons[0].pressed=false;r.read([q]);q.buttons[0].pressed=true;assert(r.read([q]).pressed.has('attack'));
});
