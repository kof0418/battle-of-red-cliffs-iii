import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';
import {heroMotion,aerialMotion,groundArrowVisual,closeMotion} from '../src/motion.ts';
import {duelForm} from '../src/duel-forms.ts';
import {bowStrike} from '../src/hero-styles.ts';
import {specialMotion} from '../src/special-motion.ts';
import {drawRangedWeapon} from '../src/ranged-art.ts';
const idle={x:0,y:0};
function setup(id:'zhaoyun'|'huangzhong'){
 const m=new Campaign(id);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.enemies=[];return m;
}
function enemy(m:Campaign,x=450,y=412){const e=m.fighter('soldier',x,y);e.hp=e.max=1000;e.cooldown=999;m.enemies.push(e);return e;}
function prime(m:Campaign,step:number){m.hero.step=step-1;m.hero.comboHit=step>1;m.hero.last=m.time;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
for(const face of [-1,1])test(`Zhao Yun ${face}: first thrust is narrow, final sweep reaches the wider lane`,()=>{
 const m=setup('zhaoyun');m.hero.face=face;const e=enemy(m,400+face*90,445);prime(m,1);m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,1000);assert(!m.hero.comboHit);
 m.hero.attack=null;prime(m,3);m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp,1000-duelForm('zhaoyun',3)!.damage);assert(e.knockdown);
});
test('Zhao Yun has a thrust, vertical rising spear and turning sweep rather than three straight pokes',()=>{
 const p=[1,2,3].map(s=>heroMotion('zhaoyun',s,2));assert(Math.abs(p[0].angle)<.1);assert(p[1].angle<-.9);assert(p[2].angle>.5);assert.equal(new Set(p.map(v=>JSON.stringify(v))).size,3);
 assert.notDeepEqual(aerialMotion('zhaoyun',true),aerialMotion('huangzhong',true));
});
for(const step of [1,2,3])test(`Huang Zhong arrow ${step}: waits for release and remains an owned travelling projectile`,()=>{
 const m=setup('huangzhong'),e=enemy(m,600);prime(m,step);m.tick(1/60,{...idle,attack:true});const impact=m.hero.attack!.impact;ticks(m,Math.max(0,Math.floor(impact*60)-2));assert.equal(m.projectiles.length,0);assert.equal(e.hp,1000);ticks(m,3);assert(m.projectiles.some(p=>p.owner===m.hero.id&&p.arrow));assert.equal(e.hp,1000);ticks(m,18);assert(e.hp<1000);assert.equal(m.hero.step,step);
});
for(const face of [-1,1])test(`Huang Zhong ${face}: every ground arrow starts at the transformed bow and low shot is lower`,()=>{
 const heights:number[]=[];
 for(const step of [1,2,3]){const m=setup('huangzhong');m.hero.face=face;enemy(m,400+face*220);prime(m,step);m.swing();m.resolve(m.hero,m.hero.attack!);const p=m.projectiles[0],v=groundArrowVisual(face,step);assert.equal(p.y,412);assert.equal(p.drawHeight,v.drawHeight);assert.equal(p.drawOffsetX,v.drawOffsetX);assert((p.x+p.drawOffsetX!-m.hero.x)*face>65);heights.push(p.drawHeight!);}
 assert(heights[1]<heights[0]-8);assert(heights[1]<heights[2]-8);
});
for(const step of [1,2,3])test(`Huang Zhong close move ${step}: bow contact uses its own damage, reach and pose`,()=>{
 const m=setup('huangzhong'),e=enemy(m);prime(m,step);m.swing();assert.equal(m.hero.attack?.move,'bow-strike');m.resolve(m.hero,m.hero.attack!);assert.equal(m.projectiles.length,0);assert.equal(e.hp,1000-bowStrike(step).damage);assert.equal(e.x,450+bowStrike(step).push);
 assert.equal(m.hero.attack!.impact,bowStrike(step).impact);if(step===3)assert(e.knockdown);assert.equal(new Set([1,2,3].map(s=>JSON.stringify(closeMotion('bow-strike',2,s)))).size,3);
});
test('a close bow sweep covers a neighbouring lane without firing a disguised arrow',()=>{
 const m=setup('huangzhong'),front=enemy(m),side=enemy(m,450,448);prime(m,1);m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(side.hp,1000);front.x=450;front.inv=0;m.hero.attack=null;prime(m,2);m.swing();m.resolve(m.hero,m.hero.attack!);assert(side.hp<1000);assert.equal(m.projectiles.length,0);
});
test('Zhao Yun special advances through a narrow front lane; Huang Zhong spins in place and strikes behind',()=>{
 for(const id of ['zhaoyun','huangzhong'] as const){const m=setup(id),front=enemy(m,450),rear=enemy(m,350),side=enemy(m,450,443);assert(m.special());ticks(m,12);assert.equal(m.hero.x>400,id==='zhaoyun');assert(front.hp<1000);assert.equal(rear.hp<1000,id==='huangzhong');assert.equal(side.hp<1000,id==='huangzhong');assert.equal(m.hero.hp,160);}
 assert(specialMotion('zhaoyun',.5).lift>40);assert.equal(specialMotion('huangzhong',.5).lift,0);
});
test('Zhao Yun throws low and fast; Huang Zhong rolls the captive over the shoulder',()=>{
 const heights:number[]=[];for(const id of ['zhaoyun','huangzhong'] as const){const m=setup(id),e=enemy(m,428);m.tryGrab({x:1,y:0});m.tick(1/60,{x:1,y:0,grappleAttack:true});ticks(m,12);heights.push(e.z);ticks(m,36);assert(!m.grapple);assert.equal(e.z,0);assert(e.hp<1000);}assert(heights[1]>heights[0]+15);
});
test('co-op retains independent spear/bow shapes and shot ownership',()=>{
 const m=new Campaign('zhaoyun');m.enableCoop('huangzhong');m.start();m.pending=[];m.supplies=[];m.barrels=[];m.hero.x=400;m.hero.y=370;m.partner!.x=400;m.partner!.y=470;const a=enemy(m,450,370),b=enemy(m,600,470);m.tick(1/60,{...idle,attack:true,partner:{...idle,attack:true}});ticks(m,12);assert(a.hp<1000);assert.equal(b.hp,1000);assert(m.projectiles.some(p=>p.owner===m.partner!.id));ticks(m,20);assert(b.hp<1000);
});
test('custom spear/bow art never replaces mounted or picked-up weapons',()=>{
 for(const id of ['zhaoyun','huangzhong'] as const){const m=setup(id),g:any={};m.hero.mounted=true;assert(!drawRangedWeapon(g,m.hero,20,-40,2,0));m.hero.mounted=false;m.hero.equipped={id:'axe',uses:12};assert(!drawRangedWeapon(g,m.hero,20,-40,2,0));}
});
