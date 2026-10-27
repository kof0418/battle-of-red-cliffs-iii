import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';
import {duelForm} from '../src/duel-forms.ts';
import {heroMotion,closeMotion,aerialMotion,grappleMotion} from '../src/motion.ts';
import {groundThrowWeight} from '../src/throws.ts';
import {specialMotion} from '../src/special-motion.ts';
import {vanguardSpecialPose,drawVanguardLegs} from '../src/vanguard-art.ts';
const idle={x:0,y:0};
function setup(id:'weiyan'|'lubu'){const m=new Campaign(id);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.enemies=[];return m;}
function foe(m:Campaign,x=450,y=412){const e=m.fighter('soldier',x,y);e.hp=e.max=1000;e.cooldown=e.stun=999;m.enemies.push(e);return e;}
function prime(m:Campaign,n:number){m.hero.step=n-1;m.hero.comboHit=n>1;m.hero.last=m.time;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
for(const face of [-1,1])test(`facing ${face}: short knife misses far targets while the halberd sweep reaches the adjacent lane`,()=>{
 for(const id of ['weiyan','lubu'] as const){const m=setup(id);m.hero.face=face;const e=foe(m,400+face*120,442);m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp<1000,id==='lubu');}
});
for(const step of [1,2,3])test(`Wei Yan move ${step} retains blade-knee-heel progression and independent contact geometry`,()=>{
 const m=setup('weiyan'),e=foe(m);prime(m,step);m.swing();assert.equal(m.hero.attack!.move,step===1?'slash':'kick');assert.equal(m.hero.attack!.impact,duelForm('weiyan',step)!.impact);m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,1000-duelForm('weiyan',step)!.damage);assert.equal(m.hero.comboHit,true);if(step===3)assert(e.knockdown);
 const off=foe(m,450,451);m.resolve(m.hero,m.hero.attack!);assert.equal(off.hp,1000);
});
for(const face of [-1,1])test(`Lu Bu ${face}: narrow thrust preserves tip shield break and distance bonus`,()=>{
 const m=setup('lubu');m.hero.face=face;const near=foe(m,400+face*60),tip=foe(m,400+face*125),side=foe(m,400+face*125,438);for(const e of [near,tip]){e.kind='heavy';e.guard=1;e.face=-face;e.stun=0;}
 prime(m,2);m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(near.hp,1000);assert(tip.hp<1000);assert.equal(tip.guard,0);assert.equal(side.hp,1000);assert.equal(tip.hp,1000-Math.round(duelForm('lubu',2)!.damage*1.25));
});
test('the two heroes have visibly different three-step silhouettes, aerial poses and throws',()=>{
 const wei=[heroMotion('weiyan',1,2),closeMotion('kick',2,2),closeMotion('kick',2,3)];const lu=[1,2,3].map(n=>heroMotion('lubu',n,2));
 assert.equal(new Set(wei.map(x=>JSON.stringify(x))).size,3);assert.equal(new Set(lu.map(x=>JSON.stringify(x))).size,3);assert(Math.abs(lu[1].angle)<.1);assert(lu[2].angle>1);assert.notDeepEqual(aerialMotion('weiyan',true),aerialMotion('lubu',true));assert.notDeepEqual(grappleMotion('weiyan','throw',.5),grappleMotion('lubu','throw',.5));
});
test('specials have three timed contacts: Wei Yan kicks ahead, Lu Bu controls both sides',()=>{
 for(const id of ['weiyan','lubu'] as const){const m=setup(id),a=foe(m),b=foe(m,350);assert(m.special());let contacts=0;for(let k=0;k<49;k++){ticks(m,1);contacts+=m.events.filter(e=>e.type==='special').length;}assert.equal(contacts,3);assert(a.hp<1000);assert.equal(b.hp<1000,id==='lubu');assert.equal(m.hero.hp,160);assert(m.hero.specialCooldown!>0);assert.equal(m.special(),false);}
 assert.equal(specialMotion('lubu',.5).lift,0);assert.equal(specialMotion('weiyan',.5).angle,-180);
 const m=setup('lubu');m.special();const poses=[.2,.43,.62,.72].map(t=>{m.hero.attack!.elapsed=t;return vanguardSpecialPose(m.hero);});assert.equal(new Set(poses.map(p=>p.angle)).size,4);
});
test('Wei Yan has tucked/extended special legs, excluding mounted and pickup weapon art',()=>{
 const m=setup('weiyan'),g:any={lineStyle(){return this;},lineBetween(){return this;}};assert(!drawVanguardLegs(g,m.hero));m.special();assert(drawVanguardLegs(g,m.hero));m.hero.mounted=true;assert(!drawVanguardLegs(g,m.hero));m.hero.mounted=false;m.hero.equipped={id:'sword',uses:18};assert(!drawVanguardLegs(g,m.hero));
});
test('low fast rotating throw and high power throw both land and damage their captive',()=>{
 const heights:number[]=[];for(const id of ['weiyan','lubu'] as const){const m=setup(id),e=foe(m,428);m.tryGrab({x:1,y:0});m.tick(1/60,{x:1,y:0,grappleAttack:true});ticks(m,12);heights.push(e.z);ticks(m,45);assert(!m.grapple);assert.equal(e.z,0);assert(e.hp<1000);}assert(heights[1]>heights[0]+35);assert(groundThrowWeight('weiyan','boss').height<groundThrowWeight('lubu','boss').height);
});
test('local co-op applies separate knife/halberd reach and pickup weapons still bypass hero forms',()=>{
 const m=new Campaign('weiyan');m.enableCoop('lubu');m.start();m.pending=[];m.supplies=[];m.barrels=[];m.hero.x=m.partner!.x=400;m.hero.y=365;m.partner!.y=470;const a=foe(m,520,365),b=foe(m,520,470);m.tick(1/60,{...idle,attack:true,partner:{...idle,attack:true}});ticks(m,12);assert.equal(a.hp,1000);assert(b.hp<1000);
 for(const f of m.players)m.withPlayer(f,()=>{f.attack=null;f.equipped={id:'sword',uses:18};m.swing();assert.equal(f.attack!.duration,.26);assert.equal(f.attack!.weapon,'sword');});
});
