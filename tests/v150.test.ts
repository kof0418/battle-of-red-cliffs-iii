import test from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Kind,type Attack} from '../src/combat.ts';
import {HERO_IDS} from '../src/heroes.ts';
import {DIFFICULTIES,bossPlan,bossPhase,type Difficulty} from '../src/tactics.ts';
import {parsePreferences} from '../src/preferences.ts';import {recordsKey,bestKey} from '../src/records.ts';
const idle={x:0,y:0};
function setup(kind:Kind='heavy'){
 const m=new Campaign();m.start();m.hero.x=450;m.hero.inv=99;m.supplies=[];m.barrels=[];const e=m.fighter(kind,500,412);e.cooldown=99;m.enemies=[e];return {m,e};
}
function ticks(m:Campaign,n:number){for(let i=0;i<n;i++)m.tick(1/60,idle);}
for(const difficulty of Object.keys(DIFFICULTIES) as Difficulty[])test(`${difficulty}: actual attack concurrency respects slots throughout combat`,()=>{
 const m=new Campaign('guanyu',difficulty);m.start();m.hero.x=450;m.hero.inv=99;m.enemies=Array.from({length:6},(_,i)=>m.fighter('soldier',480+i*2,412));m.enemies.forEach(e=>e.cooldown=0);
 for(const [i,e] of m.enemies.entries())m.ai(e,i,1/60);assert.equal(m.enemies.filter(e=>e.attack).length,DIFFICULTIES[difficulty].attackers);
 for(let frame=0;frame<150;frame++){m.tick(1/60,idle);assert(m.enemies.filter(e=>e.attack).length<=m.attackLimit);}
});
test('a ready boss receives a reserved slot even when minions appear first',()=>{
 const {m}=setup('soldier'),boss=m.fighter('boss',550,412);m.enemies.push(m.fighter('soldier',490,412),boss);m.enemies.forEach(e=>e.cooldown=0);
 for(const [i,e] of m.enemies.entries())m.ai(e,i,1/60);assert(boss.attack);assert.equal(m.enemies.filter(e=>e.attack).length,2);
});
test('raider routes away from the lane and reaches the opposite side instead of stacking in front',()=>{
 const {m}=setup('raider'),e=m.fighter('raider',650,412);m.enemies=[e];e.cooldown=99;let crossed=false,wide=false;
 for(let i=0;i<360;i++){m.tick(1/60,idle);if(Math.abs(e.y-m.hero.y)>32)wide=true;if(e.x<m.hero.x-50)crossed=true;}
 assert(wide);assert(crossed);assert(Math.abs(e.y-m.hero.y)<28);
});
test('raider routes remain reachable when player hugs either screen edge',()=>{
 for(const x of [25,935]){const {m,e}=setup('raider');m.hero.x=x;e.x=x===25?200:750;e.cooldown=0;let attacked=false;
  for(let i=0;i<600&&!attacked;i++){m.tick(1/60,idle);attacked=!!e.attack;assert(e.x>=15&&e.x<=945);}assert(attacked,`edge ${x}`);
 }
});
test('archers and spearmen create distance without walking offscreen',()=>{
 for(const kind of ['archer','spearman'] as const){const {m,e}=setup(kind);e.x=480;const x=e.x;m.ai(e,0,.1);assert(e.x>x);assert.equal(e.attack,null);m.hero.x=925;e.x=940;m.ai(e,0,.1);assert(e.x<=945);}
});
test('shield guard is finite, commits its facing, blocks frontal light hits and accepts rear hits',()=>{
 const {m,e}=setup();e.cooldown=1;m.ai(e,0,1/60);assert((e.guard??0)>0);const face=e.face;
 m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,e.max);assert(m.events.some(e=>e.type==='block'));assert.equal(m.hits,0);
 m.hero.x=540;m.hero.face=-1;m.ai(e,0,.1);assert.equal(e.face,face);m.hero.attack=null;m.swing();m.resolve(m.hero,m.hero.attack!);assert(e.hp<e.max);
 e.stun=0;ticks(m,55);assert.equal(e.guard,0);assert((e.guardCooldown??0)>0);
});
for(const id of HERO_IDS)test(`${id}: finisher or piercing third arrow breaks a frontal shield with a real opening`,()=>{
 const {m,e}=setup();m.hero.heroId=id;e.guard=1;e.face=-1;if(id==='huangzhong')e.x=m.hero.x+150;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.2);
 assert.equal(e.guard,0);assert(e.hp<e.max);assert(e.stun>=.6);assert(m.events.some(e=>e.type==='guard-break'));
});
test('aerial, special, heavy pickup weapons and grab all bypass shield defense',()=>{
 for(const method of ['aerial','special','hammer','axe','grab'] as const){const {m,e}=setup();e.guard=1;e.face=-1;
  if(method==='grab'){e.x=478;assert(m.tryGrab({x:1,y:0}));assert.equal(e.guard,0);continue;}
  if(method==='aerial'){m.hero.z=40;m.hero.vz=-100;m.swing();}
  else if(method==='special')m.special();else {m.hero.equipped={id:method,uses:14};m.swing();}
  m.resolve(m.hero,m.hero.attack!);assert.equal(e.guard,0);assert(e.hp<e.max);
 }
});
test('shield absorbs one-use knife and ordinary arrows without duplicate damage or HIT',()=>{
 for(const id of ['guanyu','huangzhong'] as const){const {m,e}=setup();m.hero.heroId=id;e.guard=1;e.face=-1;if(id==='guanyu')m.hero.equipped={id:'knife',uses:1};m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.2);assert.equal(e.hp,e.max);assert.equal(m.hits,0);assert.equal(m.projectiles.length,0);if(id==='guanyu')assert.equal(m.hero.equipped,undefined);}
});
for(const kind of ['boss','marshal','hunter','frostlord','regent'] as const)test(`${kind}: three HP phases change patterns while keeping warning and recovery windows`,()=>{
 const {m,e}=setup(kind);const patterns=[];
 for(const fraction of [1,.5,.2]){e.hp=e.max*fraction;patterns.push(Array.from({length:8},(_,i)=>bossPlan(kind,e.hp,e.max,i).move).join(','));
  for(let i=0;i<8;i++){const plan=bossPlan(kind,e.hp,e.max,i);assert(plan.windup>=.65);assert(plan.recovery>=.6);}
  e.attacks=0;e.cooldown=0;e.attack=null;m.ai(e,0,1/60);assert(e.attack);assert(e.attack.impact>=.65);assert(e.attack.duration-e.attack.impact>=.6-1e-9);
 }
 assert.equal(new Set(patterns).size,3);assert.equal(bossPhase(e.max*.65,e.max),1);assert.equal(bossPhase(e.max*.3,e.max),2);
});
test('boss aim locks at windup and normal hits punish recovery without erasing telegraphs',()=>{
 const {m,e}=setup('regent');e.cooldown=0;m.ai(e,0,1/60);const a=e.attack!;assert.equal(a.move,'cross');const aim=a.x;m.hero.x=470;assert.equal(a.x,aim);
 e.x=520;m.hero.face=1;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.attack,a,'windup retains its telegraph');e.inv=0;a.hit=true;m.resolve(m.hero,m.hero.attack!);assert.equal(e.attack,null);assert(e.stun>0);
});
test('pause freezes shields, boss timing, difficulty and quotas',()=>{
 const {m,e}=setup();e.guard=.6;e.guardCooldown=2;m.paused=true;m.events=[];const before=JSON.stringify(m);ticks(m,60);assert.equal(JSON.stringify(m),before);
});
test('difficulty preferences validate and each mode isolates scores without losing standard history',()=>{
 assert.equal(parsePreferences({difficulty:'hard'}).difficulty,'hard');assert.equal(parsePreferences({difficulty:'bad'}).difficulty,'normal');
 assert.equal(new Set(['easy','normal','hard'].map(d=>recordsKey(d as Difficulty))).size,3);assert.equal(new Set(['easy','normal','hard'].map(d=>bestKey(d as Difficulty))).size,3);
 assert.equal(recordsKey('normal'),'red-banner-records-v14loot');assert.equal(bestKey('normal'),'red-banner-best-v14loot');
 const {m}=setup();m.difficulty='hard';m.hero.hp=0;m.status='lost';m.continueRun();assert.equal(m.difficulty,'hard');m.status='stage-clear';m.nextStage();assert.equal(m.difficulty,'hard');
});

test('Huang Zhong arrows also punish boss recovery while respecting windup commitment',()=>{
 const {m,e}=setup('boss');m.hero.heroId='huangzhong';
 const a:Attack={move:'slam',elapsed:.4,duration:1.6,impact:.85,hit:false,face:-1,x:e.x,y:e.y};e.attack=a;
 m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.2);assert.equal(e.attack,a);
 e.inv=0;a.hit=true;m.hero.attack=null;m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.2);assert.equal(e.attack,null);assert(e.stun>0);
});
