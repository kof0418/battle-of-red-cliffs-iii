import {bowStrike} from '../src/hero-styles.ts';
import {WEAPONS} from '../src/loot.ts';
import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';import {HERO_IDS,type HeroId} from '../src/heroes.ts';
const idle={x:0,y:0};
function setup(id:HeroId='guanyu'){const m=new Campaign(id);m.start();m.hero.x=400;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.enemies=[m.fighter('soldier',450,412)];m.enemies[0].cooldown=99;return m;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
test('Guan Yu keeps a deliberate delayed combo and contains light-hit pushback',()=>{
 for(const id of ['guanyu','lubu'] as const){const m=setup(id);m.hero.comboHit=true;m.hero.step=1;m.hero.last=0;m.time=.75;m.swing();assert.equal(m.hero.step,id==='guanyu'?2:1);}
 const m=setup(),e=m.enemies[0];m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.x,460);assert.equal(e.stun,.36);
 m.hero.equipped={id:'sword',uses:18};m.hero.comboHit=true;m.hero.step=1;m.hero.last=0;m.time=.75;m.swing();assert.equal(m.hero.step,1);
});
test('Zhang Fei catches further ahead and each of exactly two punches deals heavier damage',()=>{
 for(const id of ['zhangfei','guanyu'] as const){const m=setup(id),e=m.enemies[0];e.x=453;assert.equal(m.tryGrab({x:1,y:0}),id==='zhangfei');if(id==='zhangfei'){ticks(m,1,{...idle,attack:true});ticks(m,1,{...idle,attack:true});assert.equal(e.hp,e.max-22);ticks(m,1,{...idle,attack:true});assert(!m.grapple);assert.equal(e.hp,e.max-22);}}
});
test('Zhao Yun has more aerial steering and an actual landing hit links into second ground attack',()=>{
 const a=setup('zhaoyun'),b=setup('guanyu');for(const m of [a,b]){m.hero.z=100;m.hero.vz=0;m.swing();ticks(m,5,{x:1,y:0});}assert(a.hero.x>b.hero.x);
 const m=setup('zhaoyun'),e=m.enemies[0];m.hero.z=1;m.hero.vz=-100;m.swing();ticks(m,1);assert(e.hp<e.max);assert.equal(m.hero.step,1);assert(m.hero.stun<=.05);ticks(m,1,{...idle,attack:true});ticks(m,4);assert.equal(m.hero.attack?.move,'slash');assert.equal(m.hero.step,2);
});
test('Zhao Yun whiff / blocked landing does not grant the ground follow-up',()=>{
 for(const shield of [false,true]){const m=setup('zhaoyun'),e=m.enemies[0];if(shield)e.inv=1;else e.x=800;m.hero.step=3;m.hero.z=1;m.hero.vz=-100;m.swing();ticks(m,1);ticks(m,5,{...idle,attack:true});assert.equal(m.hero.step,1);assert.equal(e.hp,e.max);}
});
test('Huang Zhong pushes a close frontal foe with the bow, without creating an arrow',()=>{
 for(const face of [-1,1]){const m=setup('huangzhong'),e=m.enemies[0];m.hero.face=face;e.x=400+face*50;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();assert.equal(m.hero.attack?.move,'bow-strike');m.resolve(m.hero,m.hero.attack!);assert.equal(m.projectiles.length,0);assert.equal(e.hp,e.max-bowStrike(3).damage);assert.equal(e.x,400+face*(50+bowStrike(3).push));assert.equal(m.hero.step,3);}
});
test('Huang Zhong still fires at distance; rear/off-lane foes do not force bow defence',()=>{
 for(const [x,y] of [[465,412],[350,412],[450,450]]){const m=setup('huangzhong');m.enemies[0].x=x;m.enemies[0].y=y;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();assert.equal(m.hero.attack?.move,'slash');m.resolve(m.hero,m.hero.attack!);assert(m.projectiles[0].piercing);}
});
test('Wei Yan third attack is a kick with a successful-hit backward step and no invulnerability',()=>{
 for(const hit of [true,false]){const m=setup('weiyan'),e=m.enemies[0];if(!hit)e.x=800;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();assert.equal(m.hero.attack?.move,'kick');ticks(m,16);const x=m.hero.x;ticks(m,1,{x:-1,y:0});assert.equal(m.hero.x<x,hit);assert.equal(m.hero.face,1);assert.equal(m.hero.inv,0);}
});
test('Lu Bu finisher covers a wider lane with longer recovery, not a whole-screen hit',()=>{
 for(const id of ['lubu','guanyu'] as const){const m=setup(id),e=m.enemies[0];e.y=452;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(e.hp<e.max,id==='lubu');if(id==='lubu')assert.equal(m.hero.attack!.duration,.60);}
 const m=setup('lubu');m.enemies[0].y=455;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(m.enemies[0].hp,m.enemies[0].max);
});
for(const id of HERO_IDS)test(`${id}: pickup weapon and mount keep their own attack identity`,()=>{
 const m=setup(id);m.hero.equipped={id:'sword',uses:18};m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();assert.equal(m.hero.attack?.move,'slash');assert.equal(m.hero.attack?.weapon,'sword');assert.equal(m.hero.attack?.duration,WEAPONS.sword.duration);
 m.hero.mounted=true;m.swing();assert.equal(m.hero.attack?.move,'mounted');assert(!m.hero.attack?.weapon);
});
