import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';
import {HERO_IDS,type HeroId} from '../src/heroes.ts';
import {heroLoadout,classicUnarmed} from '../src/techniques.ts';
import {AERIALS} from '../src/aerial.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu'){const m=new Campaign(id);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];const e=m.fighter('soldier',430,412);e.max=e.hp=1000;e.cooldown=999;m.enemies=[e];return m;}
function ticks(m:Campaign,n:number,input:Input=idle){for(let i=0;i<n;i++){m.freeze=0;m.tick(1/60,input);}}
for(const id of HERO_IDS)test(`${id}: stance choice is ready-only, survives stage/continue, and retains pickup/mount identity`,()=>{
 const m=new Campaign(id);assert(m.selectStance(m.hero,'classic'));assert(!m.ranked);m.start();assert(!m.selectStance(m.hero,'original'));m.hero.hp=61;m.hero.equipped={id:'axe',uses:12};m.status='stage-clear';m.nextStage();assert.equal(m.hero.stance,'classic');assert.equal(m.hero.hp,61);assert.equal(m.hero.equipped?.id,'axe');m.swing();assert.equal(m.hero.attack?.weapon,'axe');
 m.status='lost';m.hero.hp=0;assert(m.continueRun());assert.equal(m.hero.stance,'classic');m.hero.mounted=true;m.swing();assert.equal(m.hero.attack?.move,'mounted');assert(!classicUnarmed(m.hero));
});
test('classic profiles have actual fist/sword reach and tempo, with Lu Bu retaining his halberd',()=>{
 for(const id of ['guanyu','zhangfei','zhaoyun'] as const){const m=new Campaign(id),original=m.slash(1);m.selectStance(m.hero,'classic');assert(m.slash(1).reach<original.reach);assert(m.slash(1).duration<original.duration);assert.equal(classicUnarmed(m.hero),id!=='zhaoyun');}
 assert.equal(heroLoadout('lubu','classic').weapon,'方天畫戟');assert.equal(heroLoadout('huangzhong','classic').weapon,'長弓');
});
test('mixed two-player stances survive independent rejoin and stage transition',()=>{
 const m=new Campaign('guanyu');m.selectStance(m.hero,'classic');m.enableCoop('zhangfei');m.selectStance(m.partner!,'original');m.start();m.partner!.hp=0;assert(m.rejoin(m.partner!));assert.equal(m.hero.stance,'classic');assert.equal(m.partner!.stance,'original');m.status='stage-clear';m.nextStage();assert.equal(m.hero.stance,'classic');assert.equal(m.partner!.stance,'original');
});
test('Zhang Fei raises a punched captive and rotates both bodies in an aerial slam',()=>{
 const m=setup('zhangfei'),e=m.enemies[0];assert(m.tryGrab({x:1,y:0}));m.tick(1/60,{...idle,grappleAttack:true});assert.equal(m.hero.grapplePose,'lift');assert(e.z>=48);m.tick(1/60,{...idle,jump:true});ticks(m,15);const by=m.fighter('soldier',m.hero.x+125,m.hero.y);by.cooldown=999;m.enemies.push(by);m.tick(1/60,{...idle,grappleAttack:true});ticks(m,8);assert(m.hero.grappleSpin);assert(Math.abs(m.hero.throwSpin??0)>90);assert(e.throwSpin);ticks(m,30);assert(by.hp<by.max);assert.equal(m.grapple,null);assert(!m.hero.grappleSpin);assert.equal(m.hero.z,0);
});
test('Guan Yu back throw shocks a nearby enemy only on landing, forward throw does not',()=>{
 for(const direction of [-1,1]){const m=setup(),e=m.enemies[0];m.tryGrab({x:1,y:0});m.tick(1/60,{x:direction,y:0,grappleAttack:true});ticks(m,29);const expectedX=400+direction*192;const other=m.fighter('soldier',expectedX,444);other.cooldown=999;m.enemies.push(other);const hp=other.hp;ticks(m,12);assert.equal(other.hp,hp-(direction<0?18:0));assert(e.hp<1000);}
});
test('Guan Yu third ground hit has a clear longer stagger',()=>{
 const m=setup(),e=m.enemies[0];m.hero.step=2;m.hero.last=m.time;m.hero.comboHit=true;m.swing();m.resolve(m.hero,m.hero.attack!);assert(e.stun>=.65);
});
test('Zhao Yun confirms one aerial then a fresh attack dives for exactly one extra hit',()=>{
 const m=setup('zhaoyun'),e=m.enemies[0];m.hero.z=90;m.hero.vz=-70;m.swing();ticks(m,6);assert(m.hero.attack?.connected);assert.equal(m.hero.airStrikes,1);e.inv=0;const hp=e.hp;
 m.tick(1/60,{...idle,attack:true,grappleAttack:true});assert.equal(m.hero.airStrikes,2);assert(m.hero.vz<-100);ticks(m,4);assert(e.hp<hp);const after=e.hp;
 ticks(m,3,{...idle,attack:true,grappleAttack:true});assert.equal(m.hero.airStrikes,2);assert.equal(e.hp,after);ticks(m,30);assert.equal(m.hero.airStrikes,undefined);
});
test('Zhao Yun miss or held autoattack cannot grant an extra aerial',()=>{
 for(const miss of [true,false]){const m=setup('zhaoyun');m.hero.z=90;m.hero.vz=-70;if(miss)m.enemies[0].x=800;m.swing();ticks(m,6);m.tick(1/60,{...idle,attack:true,grappleAttack:false});assert.equal(m.hero.airStrikes,1);}
});
test('Huang Zhong jumps with a short blade and can step back from a confirmed bow strike without invulnerability',()=>{
 const m=setup('huangzhong'),e=m.enemies[0];m.swing();assert.equal(m.hero.attack?.move,'bow-strike');ticks(m,14);assert(m.hero.attack?.connected);const x=m.hero.x;ticks(m,2,{x:-1,y:0});assert(m.hero.x<x);assert.equal(m.hero.face,1);assert.equal(m.hero.inv,0);
 m.hero.attack=null;m.hero.z=40;m.hero.vz=-80;m.hero.airAttackUsed=false;e.inv=0;e.x=m.hero.x+50;m.swing();ticks(m,8);assert.equal(m.projectiles.length,0);assert.equal(AERIALS.huangzhong.name,'落雁短刃');assert(m.hero.attack?.connected);
});
test('Wei Yan second knee kick confirms into a third kick or command special, but misses do not',()=>{
 for(const special of [false,true]){const m=setup('weiyan');m.swing();m.resolve(m.hero,m.hero.attack!);m.hero.attack=null;m.enemies[0].inv=0;m.swing();assert.equal(m.hero.step,2);assert.equal(m.hero.attack?.move,'kick');m.resolve(m.hero,m.hero.attack!);assert(m.hero.comboHit);if(special){assert(m.special());assert.equal(m.hero.attack?.move,'special');}else{m.hero.attack=null;m.swing();assert.equal(m.hero.step,3);assert.equal(m.hero.attack?.move,'kick');}}
});
test('Lu Bu second strike rewards the blade tip and breaks a shield only at that distance',()=>{
 for(const distance of [60,125]){const m=setup('lubu'),e=m.enemies[0];e.x=400+distance;e.kind='heavy';e.guard=1;e.guardCooldown=99;e.face=-1;m.hero.step=1;m.hero.last=m.time;m.hero.comboHit=true;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp<e.max,distance===125);if(distance===125)assert.equal(e.guard,0);}
 const near=setup('lubu'),far=setup('lubu');for(const [m,dx] of [[near,60],[far,125]] as const){m.enemies[0].x=400+dx;m.hero.step=1;m.hero.comboHit=true;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);}assert(far.enemies[0].hp<near.enemies[0].hp);
});
for(const id of HERO_IDS)test(`${id}: classic solo completes all thirty arenas with two continues`,()=>{
 const m=new Campaign(id,'normal',1);m.selectStance(m.hero,'classic');m.start();
 for(let frame=0;frame<60*1400&&(m.status==='playing'||m.status==='stage-clear'||m.status==='lost');frame++){
  if(m.status==='lost'){if(!m.continueRun())break;continue;}if(m.status==='stage-clear'){m.nextStage();continue;}
  const h=m.hero,e=[...m.enemies].sort((a,b)=>Math.abs(a.x-h.x)+Math.abs(a.y-h.y)*3-Math.abs(b.x-h.x)-Math.abs(b.y-h.y)*3)[0];let i:Input={x:1,y:0};
  if(e){const dx=e.x-h.x,dy=e.y-h.y;i={x:Math.abs(dx)>60?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:Math.abs(dx)<90&&Math.abs(dy)<25&&frame%12===0};if(e.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)i.dodge=true;}
  if(e&&Math.abs(e.x-h.x)<100&&Math.abs(e.y-h.y)<45&&(h.specialCooldown??0)<=0&&!h.attack)i.special=true;if(m.grapple)i={x:h.face,y:0,grappleAttack:true};m.tick(1/60,i);
 }
 assert.equal(m.status,'won',`${id} stage ${m.stage} wave ${m.wave} HP ${m.hero.hp}`);assert.equal(m.kills,185);assert.equal(m.hero.stance,'classic');
});
test('Zhao Yun fresh second-air input survives hit-stop for P2 without triggering P1',()=>{
 const m=new Campaign('guanyu');m.enableCoop('zhaoyun');m.start();m.pending=[];m.props=[];m.supplies=[];m.barrels=[];const p=m.partner!;m.hero.x=100;p.x=400;p.y=412;p.z=90;p.vz=-70;const e=m.fighter('soldier',430,412);e.hp=1000;e.cooldown=999;m.enemies=[e];m.withPlayer(p,()=>m.swing());ticks(m,6);assert(p.attack?.connected);m.freeze=.06;m.tick(1/60,{...idle,partner:{...idle,attack:true,grappleAttack:true}});for(let i=0;i<7;i++)m.tick(1/60,idle);assert.equal(p.airStrikes,2);assert.equal(m.hero.airStrikes,undefined);
});
