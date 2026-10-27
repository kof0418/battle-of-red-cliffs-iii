import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input,type Attack} from '../src/combat.ts';
import {HERO_IDS,type HeroId} from '../src/heroes.ts';
import {mountedPosePhase,cavalryRecovery} from '../src/horse.ts';
import {mountedMotion} from '../src/motion.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu'){const m=new Campaign(id);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.hero.mounted=true;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.enemies=[];return m;}
function foe(m:Campaign,x=470,y=412){const e=m.fighter('soldier',x,y);e.hp=e.max=1000;e.cooldown=e.stun=999;m.enemies.push(e);return e;}
function prime(m:Campaign,step:number){m.hero.step=step-1;m.hero.last=m.time;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
for(const id of HERO_IDS.filter(id=>id!=='huangzhong'))for(const direction of [-1,1])test(`${id}: mounted third ${direction} hooks, lifts and throws without dismounting`,()=>{
 const m=setup(id),e=foe(m,475);prime(m,3);m.swing(undefined,direction);m.resolve(m.hero,m.hero.attack!);assert(m.grapple?.mounted);assert(m.hero.mounted);ticks(m,12,{...idle,dodge:true});assert(e.z>70);assert(m.grapple);assert.equal(m.hero.rideDash,0);ticks(m,40);assert(!m.grapple);assert(m.hero.mounted);assert.equal(m.hero.z,0);assert.equal(e.z,0);assert.equal(e.hp,952);assert(e.knockdown);assert.equal(Math.sign(e.x-400),direction);
});
test('mounted throw waves the body through other foes once',()=>{
 const m=setup(),e=foe(m,475),other=foe(m,570);prime(m,3);m.swing(undefined,1);m.resolve(m.hero,m.hero.attack!);ticks(m,50);assert.equal(e.hp,952);assert.equal(other.hp,976);assert(other.knockdown);
});
test('mounted throw respects Boss impact, enemy mounts, altitude and close-range restrictions',()=>{
 for(const kind of ['unsafe','mounted','high','far'] as const){const m=setup(),e=foe(m,kind==='far'?600:475);if(kind==='unsafe'){e.kind='boss';e.attack={move:'slam',elapsed:.5,impact:.5,duration:1,hit:false,x:e.x,y:e.y,face:-1};}if(kind==='mounted')e.mounted=true;if(kind==='high')e.z=90;prime(m,3);m.swing(undefined,1);m.resolve(m.hero,m.hero.attack!);assert(!m.grapple);assert(m.hero.mounted);}
});
test('being hit during a mounted throw drops the captive safely and does not leave a stuck enemy',()=>{
 const m=setup(),e=foe(m,475);prime(m,3);m.swing(undefined,1);m.resolve(m.hero,m.hero.attack!);const attacker=foe(m,420);ticks(m,10);assert(e.z>0);m.hero.inv=0;m.resolve(attacker,{move:'slash',x:420,y:412,face:-1,elapsed:.1,duration:.5,impact:.1,hit:true});assert(!m.hero.mounted);assert(!m.grapple);assert.equal(e.z,0);assert(!e.grapplePose);assert.equal(m.horses[0].falls,1);assert(m.hero.inv>=1.1);
});
test('melee mounted second attack makes two contacts with a separate windup between them',()=>{
 const m=setup(),e=foe(m);prime(m,2);m.swing();ticks(m,10);assert.equal(e.hp,985);ticks(m,9);assert.equal(e.hp,970);assert.equal(m.hits,2);ticks(m,10);assert.equal(e.hp,970);
 assert.equal(mountedPosePhase(2,false,.21,2),1);assert.equal(mountedPosePhase(2,false,.27,2),2);assert.notDeepEqual(mountedMotion(2,false,false,2),mountedMotion(2,false,false,3));
});
for(const face of [-1,1])test(`Huang Zhong ${face}: mounted second shoots three travelling arrows from the raised bow`,()=>{
 const m=setup('huangzhong');m.hero.face=face;const e=foe(m,400+face*220);prime(m,2);m.swing(face);const shots:{height:number;lane:number;face:number}[]=[];
 for(let k=0;k<47;k++){ticks(m,1);for(const p of m.projectiles)if(!shots.some(x=>(x as any).id===p.id))shots.push(Object.assign({height:p.drawHeight!,lane:p.y,face:p.face},{id:p.id}));}
 assert.equal(shots.length,3);assert(shots.every(s=>s.height>90&&s.height<105&&s.lane===412&&s.face===face));assert.equal(e.hp,958);assert.equal(m.hits,3);assert(!m.grapple);
});
test('Huang Zhong keeps a piercing third shot instead of using mounted throws',()=>{
 const m=setup('huangzhong');foe(m);prime(m,3);m.swing(undefined,-1);m.resolve(m.hero,m.hero.attack!);assert(!m.grapple);assert(m.projectiles[0].piercing);assert(m.projectiles[0].arrow);
});
test('confirmed horse charge can link attack or wave, whiff cannot cancel its recovery',()=>{
 for(const special of [false,true]){const m=setup();foe(m,450);ticks(m,1,{...idle,dodge:true});ticks(m,10);ticks(m,1,special?{...idle,horseSpecial:true}:{...idle,attack:true});assert.equal(m.hero.attack?.move,special?'wave':'mounted');assert.equal(m.hero.rideDash,0);assert(m.hero.rideDashCooldown!>0);}
 const m=setup();foe(m,800);ticks(m,1,{...idle,dodge:true});ticks(m,10);ticks(m,1,{...idle,horseSpecial:true});assert.equal(m.hero.attack?.move,'ride-charge');assert((m.hero.rideDash??0)>0);
});
test('mounted early hits link the wave only after confirmation and the cooldown prevents repeat casts',()=>{
 const m=setup();foe(m);m.swing();ticks(m,16);ticks(m,1,{...idle,horseSpecial:true});assert.equal(m.hero.attack?.move,'wave');const a=m.hero.attack;ticks(m,1,{...idle,horseSpecial:true});assert.equal(m.hero.attack,a);assert(m.hero.specialCooldown!>0);
});
test('first fall lets the recovered player approach the waiting horse without walking away first; second fall sends it away',()=>{
 const m=setup();foe(m,800);m.dismount(true);const horse=m.horses[0];assert(horse.waiting);ticks(m,80);assert(!m.hero.mounted);assert.equal(horse.falls,1);ticks(m,1,{x:1,y:0});assert(m.hero.mounted);assert.equal(m.horses.length,0);m.dismount(true);assert(horse.fleeing);assert.equal(horse.falls,2);ticks(m,90,{x:1,y:0});assert(!m.hero.mounted);
});
test('second mounted strike unseats cavalry during its visible recovery, not during its windup',()=>{
 for(const recover of [false,true]){const m=setup(),e=foe(m);e.kind='marshal';e.mounted=true;e.attack={move:'cavalry',x:e.x,y:e.y,face:-1,elapsed:recover?1.3:.3,impact:.85,duration:1.62,hit:recover};prime(m,2);m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.mounted,!recover);assert.equal(cavalryRecovery({move:'cavalry',elapsed:recover?1.3:.3,impact:.85}),recover);}
});
test('co-op keeps the rider throw separate from the partner foot attack and pause freezes the lift',()=>{
 const m=new Campaign('guanyu');m.enableCoop('weiyan');m.start();m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.hero.x=400;m.hero.y=380;m.hero.mounted=true;m.partner!.x=400;m.partner!.y=470;const a=foe(m,475,380),b=foe(m,450,470);prime(m,3);m.swing(undefined,-1);m.resolve(m.hero,m.hero.attack!);ticks(m,1,{...idle,partner:{...idle,attack:true}});ticks(m,12);assert(a.z>0);assert(b.hp<1000);const height=a.z;m.togglePause();ticks(m,30);assert.equal(a.z,height);m.togglePause();ticks(m,40);assert(!m.grapple);assert(m.hero.mounted);assert.equal(m.partner!.heroId,'weiyan');
});
test('a complete mounted first-second-third chain can still hook the displaced foe',()=>{
 const m=setup(),e=foe(m,475);for(let n=0;n<2;n++){m.swing();while(m.hero.attack)ticks(m,1);}m.swing(undefined,1);while(m.hero.attack)ticks(m,1);assert(m.grapple?.mounted);ticks(m,50);assert(e.hp<900);assert(m.hero.mounted);
});
test('mounted Huang may link the wave after a travelling arrow actually hits, not merely at release',()=>{
 const m=setup('huangzhong');foe(m,555);prime(m,2);m.swing();ticks(m,8);ticks(m,1,{...idle,horseSpecial:true});assert.equal(m.hero.attack?.move,'mounted');ticks(m,12);assert(m.hero.attack?.connected);ticks(m,1,{...idle,horseSpecial:true});assert.equal(m.hero.attack?.move,'wave');
});
