import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';
import {HERO_IDS,type HeroId} from '../src/heroes.ts';
import {FixedStep} from '../src/fixed-step.ts';
import {CommandBank} from '../src/command-input.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu',coop=false){const m=new Campaign(id);if(coop)m.enableCoop('zhangfei');m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.props=[];m.supplies=[];m.barrels=[];m.pickups=[];const e=m.fighter('soldier',430,412);e.hp=e.max=1000;e.cooldown=999;m.enemies=[e];return m;}
function ticks(m:Campaign,n:number,input:Input=idle){for(let i=0;i<n;i++){m.freeze=0;m.tick(1/60,input);}}
function strike(m:Campaign,y=0){m.tick(1/60,{x:0,y:0,comboY:y,attack:true});while(m.hero.attack){ticks(m,1);} }
for(const id of HERO_IDS)for(const face of [-1,1])for(const y of [-1,1])test(`${id} facing ${face}: two real hits then ${y<0?'back':'forward'} throw, once`,()=>{
 const m=setup(id),e=m.enemies[0];m.hero.face=face;e.x=400+face*25;
 strike(m);assert(m.hero.comboHit);strike(m);assert.equal(m.hero.step,2);assert(m.hero.comboHit);
 // Stay within a close grab finish rather than allowing a ranged vacuum throw.
 m.hero.x=e.x-face*30;
 m.tick(1/60,{x:0,y:0,comboY:y,attack:true});ticks(m,Math.ceil((m.hero.attack!.impact+.04)*60));
 assert.equal(m.grapple?.target,e.id);assert.equal(m.grapple?.phase,'throw');assert.equal(m.grapple?.direction,face*(y<0?-1:1));
 const hp=e.hp;ticks(m,60);assert(e.hp<hp);assert.equal(m.grapple,null);assert.equal(m.hero.comboHit,false);
});
test('whiff, shield block and objects cannot advance a ground combo',()=>{
 for(const mode of ['whiff','block','crate']){const m=setup(),e=m.enemies[0];if(mode==='block'){e.kind='heavy';e.guard=10;e.guardCooldown=99;e.face=-1;}else e.x=800;if(mode==='crate')m.supplies=[{id:999,x:440,y:412,hp:100}];
 strike(m);assert(!m.hero.comboHit);strike(m);assert.equal(m.hero.step,1);strike(m,1);assert.equal(m.hero.step,1);assert(!m.grapple);}
});
test('neutral third strike stays a normal finisher and a missed second restarts at one',()=>{
 const m=setup();strike(m);strike(m);m.tick(1/60,{...idle,attack:true});assert.equal(m.hero.step,3);assert(!m.hero.attack?.comboThrow);ticks(m,20);assert(!m.grapple);
 const n=setup();strike(n);n.enemies[0].x=800;strike(n);assert.equal(n.hero.step,2);strike(n);assert.equal(n.hero.step,1);
});
for(const id of HERO_IDS)test(`${id}: hit-confirmed first and second attacks cancel into a special`,()=>{
 for(const step of [1,2]){const m=setup(id);if(step===2)strike(m);m.tick(1/60,{...idle,attack:true});while(!m.hero.attack?.connected&&m.hero.attack)ticks(m,1);assert(m.hero.attack?.connected);const hp=m.enemies[0].hp;
 m.tick(1/60,{...idle,special:true});m.freeze=0;m.tick(1/60,idle);assert.equal(m.hero.attack?.move,'special');ticks(m,45);assert(m.enemies[0].hp<hp);assert.equal(m.hero.hp,160);}
});
test('early command buffers through hit-stop but a miss or third hit cannot be cancelled',()=>{
 const m=setup();m.tick(1/60,{...idle,attack:true});m.freeze=.06;m.tick(1/60,{...idle,special:true});for(let i=0;i<20;i++)m.tick(1/60,idle);assert.equal(m.hero.attack?.move,'special');
 const n=setup();n.enemies[0].x=800;n.tick(1/60,{...idle,attack:true});n.tick(1/60,{...idle,special:true});ticks(n,40);assert(!n.events.some(e=>e.type==='special-start'));assert.equal(n.hero.specialCooldown,0);assert.equal(n.hero.attack,null);
 const f=setup();strike(f);strike(f);f.tick(1/60,{...idle,attack:true});ticks(f,14);assert.equal(f.hero.step,3);assert(!f.special());assert.equal(f.hero.attack?.move,'slash');
});
test('finisher never grabs a distant, downed, mounted, wrong-lane or teammate-held target',()=>{
 for(const mode of ['far','down','horse','lane','ally']){const m=setup('guanyu',true),e=m.enemies[0];strike(m);strike(m);m.hero.x=e.x-30;
 if(mode==='far')e.x=800;if(mode==='down')e.knockdown=2;if(mode==='horse')e.mounted=true;if(mode==='lane')e.y=480;
 if(mode==='ally'){m.partner!.x=e.x-25;m.partner!.y=e.y;assert(m.withPlayer(m.partner!,()=>m.tryGrab({x:1,y:0})));}
 m.tick(1/60,{...idle,comboY:1,attack:true});ticks(m,15);assert.equal(m.grapple,null);if(mode==='ally')assert.equal(m.grappleOf(m.partner!)?.target,e.id);
 }
});
test('rescue empty/invulnerable/out-of-lane costs nothing; a crowd costs eight only once',()=>{
 for(const mode of ['empty','inv','height','crowd']){const m=setup();if(mode==='empty')m.enemies=[];if(mode==='inv')m.enemies[0].inv=2;if(mode==='height')m.enemies[0].z=80;if(mode==='crowd')m.enemies.push(m.fighter('soldier',370,412));
 assert(m.rescue());const cost=mode==='crowd'?8:0;assert.equal(m.hero.hp,160-cost);assert.equal(m.stageDamage,cost);assert.equal(m.waveDamage,cost);assert.equal(m.events.find(e=>e.type==='rescue')?.value,cost);assert(!m.rescue());}
});
test('two players keep confirmation, buffered throw direction and rescue cost separate',()=>{
 const m=setup('guanyu',true),p=m.partner!;p.x=400;p.y=480;const b=m.fighter('soldier',425,480);b.hp=b.max=1000;b.cooldown=999;m.enemies.push(b);
 for(let step=0;step<2;step++){m.tick(1/60,{...idle,attack:true,partner:{...idle,attack:true}});ticks(m,25);}
 assert(m.hero.comboHit&&p.comboHit);m.hero.x=m.enemies[0].x-30;p.x=b.x-30;
 m.freeze=.05;m.tick(1/60,{...idle,comboY:-1,attack:true,partner:{...idle,comboY:1,attack:true}});for(let i=0;i<25;i++)m.tick(1/60,idle);
 assert.equal(m.grapple?.direction,-1);assert.equal(m.grappleOf(p)?.direction,1);ticks(m,65);
 m.enemies=[];m.withPlayer(p,()=>m.rescue());assert.equal(p.hp,160);assert.equal(m.hero.hp,160);
});
test('144Hz direction taps survive release before simulation, once per player',()=>{
 const f=new FixedStep(),seen:Input[]=[];f.advance(1/144,{x:0,y:-1,attack:true,partner:{x:0,y:1,attack:true}},true,(_,i)=>seen.push(i));f.advance(1/144,{...idle,partner:idle},true,(_,i)=>seen.push(i));f.advance(.06,{...idle,partner:idle},true,(_,i)=>seen.push(i));assert.equal(seen[0].comboY,-1);assert.equal(seen[0].partner?.comboY,1);assert.equal(seen.filter(i=>i.attack).length,1);assert.equal(seen.filter(i=>i.partner?.attack).length,1);
});
for(const source of ['keyboard','pad','touch'] as const)test(`${source}: command special wins over an upward finisher`,()=>{
 const bank=new CommandBank();bank.press(source,'down',0);bank.press(source,'up',100);assert(bank.press(source,'attack',150));const m=setup();strike(m);m.tick(1/60,{...idle,attack:true});ticks(m,10);m.freeze=0;m.tick(1/60,{x:0,y:-1,attack:true,special:true});assert.equal(m.hero.attack?.move,'special');assert(!m.grapple);
});
test('late arrow from an older shot cannot confirm the next missed shot',()=>{
 const m=setup('huangzhong');m.enemies[0].x=700;m.swing();m.resolve(m.hero,m.hero.attack!);m.hero.attack=null;m.swing();m.hero.attack=null;m.updateProjectiles(.4);assert(!m.hero.comboHit);
});
test('pause drops queued attack/command edges for both players without replay on resume',()=>{
 const m=setup('guanyu',true);m.freeze=.05;m.tick(1/60,{...idle,attack:true,partner:{...idle,special:true}});m.togglePause();m.togglePause();ticks(m,10);assert.equal(m.hero.attack,null);assert.equal(m.partner!.attack,null);
});
test('a hit on the hero clears confirmation and the next ground strike restarts',()=>{
 const m=setup();strike(m);const e=m.enemies[0];m.resolve(e,{move:'slash',x:430,y:412,face:-1,elapsed:.2,impact:.1,duration:.5,hit:true});assert(!m.hero.comboHit);ticks(m,20);m.tick(1/60,{...idle,attack:true});assert.equal(m.hero.step,1);
});
test('Boss impact is not a grab window for the new finisher',()=>{
 const m=setup();strike(m);strike(m);const e=m.enemies[0];m.hero.x=e.x-30;e.kind='boss';e.attack={move:'slam',x:e.x,y:e.y,face:-1,elapsed:.5,impact:.5,duration:1.2,hit:false};m.swing(undefined,1);m.resolve(m.hero,m.hero.attack!);assert(!m.grapple);
});
