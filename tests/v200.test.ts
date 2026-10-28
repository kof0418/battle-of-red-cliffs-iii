import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input,type Attack} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';
import {FixedStep} from '../src/fixed-step.ts';import {coopKey,CoopPads} from '../src/coop-controls.ts';import {PadInput,type Pad} from '../src/controls.ts';import {CommandBank} from '../src/command-input.ts';
const idle={x:0,y:0};
function setup(a='guanyu' as typeof HERO_IDS[number],b='zhangfei' as typeof HERO_IDS[number]){const m=new Campaign(a);assert(m.enableCoop(b));m.start();m.hero.x=250;m.hero.y=380;m.partner!.x=550;m.partner!.y=465;m.supplies=[];m.barrels=[];m.props=[];m.pending=[];m.enemies=[m.fighter('soldier',800,412)];m.enemies[0].cooldown=99;return m;}
function ticks(m:Campaign,n:number,input:Input=idle){for(let i=0;i<n;i++){m.freeze=0;m.tick(1/60,input);}}
test('two warriors have independent positions, facing, health and weapon state; world ticks once',()=>{
 const m=setup(),p=m.partner!,e=m.enemies[0];const cd=e.cooldown;ticks(m,30,{x:1,y:0,partner:{x:-1,y:0}});assert(m.hero.x>250);assert(p.x<550);assert.equal(p.face,-1);assert.equal(m.hero.face,1);assert(Math.abs(m.time-.5)<1e-8);assert(Math.abs(e.cooldown-(cd-.5))<1e-8);assert.equal(m.hero.hp,160);assert.equal(p.hp,160);assert.equal(e.max,144);assert.equal(m.ranked,false);
});
for(const id of HERO_IDS)test(`${id}: player two can attack, jump and use a special without changing player one`,()=>{
 const m=setup('guanyu',id),p=m.partner!,e=m.enemies[0];e.x=p.x+65;e.y=p.y;e.cooldown=99;m.hero.inv=99;ticks(m,1,{...idle,partner:{...idle,attack:true}});assert(p.attack);assert.equal(m.hero.attack,null);ticks(m,18);assert(e.hp<e.max);assert.equal(m.hero.step,0);
 p.attack=null;p.stun=0;ticks(m,1,{...idle,partner:{...idle,jump:true}});assert(p.vz>0);assert.equal(m.hero.z,0);p.z=0;p.vz=0;p.stun=0;p.attack=null;p.specialCooldown=0;ticks(m,1,{...idle,partner:{...idle,special:true}});assert.equal(p.attack?.move,'special');assert.equal(m.hero.attack,null);
});
test('enemy targets nearest living player and a sweep can hurt both without friendly fire',()=>{
 const m=setup(),p=m.partner!,e=m.enemies[0];e.x=p.x+40;e.y=p.y;e.cooldown=0;m.ai(e,0,.01);assert.equal(e.attack?.face,-1);assert.equal(e.attack?.y,p.y);p.inv=0;m.hero.x=p.x-40;m.hero.y=p.y;m.hero.inv=0;
 const a:Attack={move:'sweep',x:p.x,y:p.y,face:1,elapsed:1,impact:.8,duration:1.4,hit:false};m.resolve(e,a);assert(m.hero.hp<160&&p.hp<160);
 const hp=p.hp;m.hero.inv=0;m.hero.face=1;m.hero.attack=null;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(p.hp,hp);
});
test('both players can hold separate enemies, never the same enemy; aerial throw remains independent',()=>{
 const m=setup(),p=m.partner!;const a=m.fighter('soldier',m.hero.x+25,m.hero.y),b=m.fighter('heavy',p.x+25,p.y);m.enemies=[a,b];assert(m.tryGrab({x:1,y:0}));assert(m.withPlayer(p,()=>m.tryGrab({x:1,y:0})));assert.equal(m.grapple?.target,a.id);assert.equal(m.grappleOf(p)?.target,b.id);
 ticks(m,1,{...idle,partner:{...idle,jump:true}});ticks(m,6);assert(p.z>0&&b.z>0);assert.equal(m.hero.z,0);assert.equal(a.z,0);ticks(m,1,{...idle,partner:{...idle,grappleAttack:true}});ticks(m,45);assert.equal(m.grappleOf(p),null);assert(b.hp<b.max);assert.equal(m.grapple?.target,a.id);
});
test('simultaneous grab contention gives one owner and never duplicates a captive',()=>{
 const m=setup(),p=m.partner!;p.x=m.hero.x;p.y=m.hero.y;const e=m.fighter('soldier',p.x+25,p.y);m.enemies=[e];assert(m.tryGrab({x:1,y:0}));assert(!m.withPlayer(p,()=>m.tryGrab({x:1,y:0})));assert.equal(m.grappleOf(p),null);
});
test('partner food/equipment affects only its collector and shared pickups are consumed once',()=>{
 const m=setup(),p=m.partner!;p.hp=60;m.hero.hp=90;m.pickups=[{id:800,x:p.x,y:p.y,loot:'meat',amount:40},{id:801,x:p.x,y:p.y,loot:'axe',amount:0}];ticks(m,1);assert.equal(p.hp,100);assert.equal(m.hero.hp,90);assert.equal(p.equipped?.id,'axe');assert(!m.hero.equipped);assert.equal(m.pickups.length,0);
});
test('single horse can be mounted by P2 and duplicate gong remains points for the team',()=>{
 const m=setup(),p=m.partner!;m.horses=[{id:900,x:p.x,y:p.y,target:p.x,life:20,moving:false,waiting:true}];ticks(m,1);assert(p.mounted);assert(!m.hero.mounted);assert.equal(m.horses.length,0);m.pickups=[{id:901,x:m.hero.x,y:m.hero.y,loot:'gong',amount:0}];const score=m.score;ticks(m,1);assert.equal(m.score,score+1000);assert.equal(m.horses.length,0);
});
test('camera follows the trailing living player and requires both to approach the next arena',()=>{
 const m=setup();m.enemies=[];m.hero.x=900;m.partner!.x=250;ticks(m,70);assert.equal(m.wave,1);assert.equal(m.cameraLeft,0);m.hero.x=910;m.partner!.x=910;ticks(m,80);assert.equal(m.wave,2);
});
test('one player down does not lose; fresh attack spends one shared continue and restores only that player',()=>{
 const m=setup(),p=m.partner!;p.hp=0;m.hero.hp=71;ticks(m,1);assert.equal(m.status,'playing');ticks(m,1,{...idle,partner:{...idle,grappleAttack:true}});assert.equal(m.continues,1);assert.equal(m.hero.hp,71);assert.equal(p.hp,160);assert(p.inv>0);ticks(m,5,{...idle,partner:{...idle,attack:true}});assert.equal(m.continues,1);
 p.hp=0;m.continues=0;ticks(m,1,{...idle,partner:{...idle,grappleAttack:true}});assert.equal(p.hp,0);assert.equal(m.status,'playing');m.hero.hp=0;ticks(m,1);assert.equal(m.status,'lost');
});
test('team wipe replays current arena with both heroes and one shared credit',()=>{
 const m=setup('huangzhong','lubu');m.hero.hp=0;m.partner!.hp=0;ticks(m,1);assert(m.continueRun());assert.equal(m.hero.heroId,'huangzhong');assert.equal(m.partner!.heroId,'lubu');assert.equal(m.hero.hp,160);assert.equal(m.partner!.hp,160);assert.equal(m.continues,1);
});
test('next stage keeps each HP and weapon but clears mounts and independent grapples',()=>{
 const m=setup('zhaoyun','weiyan');m.hero.hp=50;m.partner!.hp=60;m.partner!.equipped={id:'hammer',uses:12,hits:1};m.partner!.mounted=true;m.status='stage-clear';assert(m.nextStage());assert.equal(m.hero.hp,50);assert.equal(m.partner!.hp,60);assert.equal(m.partner!.heroId,'weiyan');assert.equal(m.partner!.equipped?.id,'hammer');assert(!m.partner!.mounted);assert.equal(m.grappleOf(m.partner!),null);
});
test('player two arrow damage retains its owner, and paused or frozen commands remain isolated',()=>{
 const m=setup('zhangfei','huangzhong'),p=m.partner!;m.freeze=.05;m.tick(1/60,{...idle,partner:{...idle,attack:true}});assert(!p.attack);m.tick(.033,idle);m.tick(.033,idle);ticks(m,12);assert(m.projectiles.some(a=>a.owner===p.id));assert.equal(m.hero.attack,null);const before=JSON.stringify(m);m.paused=true;const frozen=JSON.stringify(m);m.tick(.03,{x:1,y:1,partner:{x:1,y:1,attack:true}});assert.equal(JSON.stringify(m),frozen);assert(before);
});
test('fixed-step buffers short P2 presses at 144Hz without replaying actions during catchup',()=>{
 const clock=new FixedStep(),seen:Input[]=[];clock.advance(1/144,{...idle,partner:{x:1,y:0,attack:true,special:true}},true,(_,i)=>seen.push(i));clock.advance(1/144,{...idle,partner:{x:1,y:0}},true,(_,i)=>seen.push(i));clock.advance(.1,{...idle,partner:{x:1,y:0}},true,(_,i)=>seen.push(i));assert.equal(seen.filter(i=>i.partner?.attack).length,1);assert.equal(seen.filter(i=>i.partner?.special).length,1);assert(seen.every(i=>i.partner?.x===1));
});
test('keyboard routes and command banks do not mix players',()=>{
 assert.equal(coopKey('ArrowLeft',1),undefined);assert.equal(coopKey('ArrowLeft',2),'left');assert.equal(coopKey('KeyJ',1),'attack');assert.equal(coopKey('KeyU',2),'attack');assert.equal(coopKey('Numpad1',2),'attack');
 const a=new CommandBank(),b=new CommandBank();a.press('keyboard','down',0);b.press('keyboard','up',50);assert(!b.press('keyboard','attack',100));a.press('keyboard','up',100);assert(a.press('keyboard','attack',150));
});
test('one controller maps to P2, second to P1, and disconnect never transfers control',()=>{
 const router=new CoopPads();const pad=(index:number):Pad=>({index,id:`Xbox ${index}`,mapping:'standard',axes:[0,0],buttons:Array.from({length:16},()=>({pressed:false}))});const a=pad(0),b=pad(1);assert.deepEqual(router.route([a]),[null,a]);assert.deepEqual(router.route([a,b]),[b,a]);assert.deepEqual(router.route([null,b]),[b,null]);assert.deepEqual(router.route([a,b]),[b,a]);
 const input=new PadInput();input.read([a]);assert(input.read([]).disconnected);
});

for(const [one,two] of [['guanyu','zhangfei'],['zhaoyun','huangzhong'],['weiyan','lubu']] as const)test(`${one}+${two}: all thirty arenas finish with the two-credit team budget`,()=>{
 const m=new Campaign(one,'normal',1);m.enableCoop(two);m.start();
 for(let frame=0;frame<60*1400&&(m.status==='playing'||m.status==='stage-clear'||m.status==='lost');frame++){
  if(m.status==='lost'){if(!m.continueRun())break;continue;}
  if(m.status==='stage-clear'){m.nextStage();continue;}
  const inputs=m.players.map(h=>{
   if(h.hp<=0)return {...idle,grappleAttack:frame%60===0};
   const e=[...m.enemies].sort((a,b)=>Math.abs(a.x-h.x)+Math.abs(a.y-h.y)*3-Math.abs(b.x-h.x)-Math.abs(b.y-h.y)*3)[0];let i:Input={x:1,y:0};
   if(e){const dx=e.x-h.x,dy=e.y-h.y;i={x:Math.abs(dx)>70?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:Math.abs(dx)<94&&Math.abs(dy)<25&&frame%12===0};if(e.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)i.dodge=true;}
   if(e&&Math.abs(e.x-h.x)<100&&Math.abs(e.y-h.y)<45&&(h.specialCooldown??0)<=0&&!h.attack)i.special=true;
   if(m.grappleOf(h))i={x:h.face,y:0,grappleAttack:true};return i;
  });m.tick(1/60,{...inputs[0],partner:inputs[1]});
 }
 assert.equal(m.status,'won',`stage ${m.stage} wave ${m.wave}, HP ${m.players.map(p=>p.hp)}, credits ${m.continues}`);assert.equal(m.kills+m.escapes,185);
});

test('controller replacement takes the vacant player slot, retaining the other controller',()=>{
 const r=new CoopPads();const pad=(index:number)=>({index,mapping:'standard',axes:[],buttons:[]});const a=pad(0),b=pad(1),c=pad(2);r.route([a,b]);assert.deepEqual(r.route([null,b,c]),[b,c]);
});
test('allied melee and arrows cannot displace another player’s captive',()=>{
 const m=setup(),p=m.partner!;p.x=400;p.y=412;m.hero.x=430;m.hero.y=412;m.hero.face=-1;
 const e=m.fighter('soldier',425,412);m.enemies=[e];assert(m.withPlayer(p,()=>m.tryGrab({x:1,y:0})));const hp=e.hp;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,hp);
 m.projectiles=[{id:900,owner:m.hero.id,x:450,y:412,face:-1,remaining:100,damage:38,arrow:true}];m.updateProjectiles(.1);assert.equal(e.hp,hp);assert.equal(m.grappleOf(p)?.target,e.id);
});

test('P2 equipment takes its own hits; rejoining clears aerial state and restores jump attacks',()=>{
 const m=setup(),p=m.partner!,e=m.enemies[0];m.hero.equipped={id:'axe',uses:14,hits:0};p.equipped={id:'hammer',uses:12,hits:0};p.inv=0;
 const a:Attack={move:'slash',x:p.x+20,y:p.y,face:-1,elapsed:1,impact:.2,duration:1.2,hit:false};m.resolve(e,a);p.inv=0;a.x=p.x+20;m.resolve(e,a);assert(!p.equipped);assert.equal(m.hero.equipped?.hits,0);
 p.hp=0;p.airAttackUsed=true;assert(m.rejoin(p));assert(!p.airAttackUsed);ticks(m,1,{...idle,partner:{...idle,jump:true}});ticks(m,1,{...idle,partner:{...idle,attack:true}});assert.equal(p.attack?.move,'aerial');
});
