import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Input} from '../src/combat.ts';
import {heroMotion,aerialMotion} from '../src/motion.ts';
import {duelForm} from '../src/duel-forms.ts';
import {specialMotion} from '../src/special-motion.ts';
import {drawDuelBare} from '../src/duel-art.ts';
const idle={x:0,y:0};
function setup(id:'guanyu'|'zhangfei',stance:'original'|'classic'='original'){
 const m=new Campaign(id);m.selectStance(m.hero,stance);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.supplies=[];m.barrels=[];m.props=[];m.enemies=[];return m;
}
function enemy(m:Campaign,x:number,y:number){const e=m.fighter('soldier',x,y);e.hp=e.max=1000;e.cooldown=999;m.enemies.push(e);return e;}
function ticks(m:Campaign,n:number,i:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,i);}}
for(const face of [-1,1])test(`facing ${face}: Guan Yu's horizontal cut reaches another lane; Zhang Fei's thrust stays narrow`,()=>{
 const a=setup('guanyu'),b=setup('zhangfei');for(const m of [a,b]){m.hero.face=face;enemy(m,400+face*60,444);m.swing();m.resolve(m.hero,m.hero.attack!);}
 assert(a.enemies[0].hp<1000);assert.equal(b.enemies[0].hp,1000);assert(a.hero.comboHit);assert(!b.hero.comboHit);
});
test('Zhang Fei opens earlier; Guan Yu keeps the rising cut longer, with different finishers',()=>{
 const a=setup('guanyu'),b=setup('zhangfei');for(const m of [a,b]){enemy(m,450,412);m.tick(1/60,{...idle,attack:true});ticks(m,4);}
 assert.equal(a.enemies[0].hp,1000);assert(b.enemies[0].hp<1000);assert(a.slash(2).duration>b.slash(2).duration);assert.notEqual(a.slash(3).impact,b.slash(3).impact);
});
for(const stance of ['original','classic'] as const)test(`${stance}: each of the three moves has a different Guan Yu/Zhang Fei silhouette`,()=>{
 for(const step of [1,2,3]){const a=heroMotion('guanyu',step,2,stance),b=heroMotion('zhangfei',step,2,stance);assert.notDeepEqual(a,b);assert.notEqual(a.angle,b.angle);assert.notEqual(duelForm('guanyu',step,stance)!.name,duelForm('zhangfei',step,stance)!.name);}
 assert.notDeepEqual(aerialMotion('guanyu',true),aerialMotion('zhangfei',true));
});
test('classic Guan Yu uses a tall open palm while Zhang Fei uses wide fists',()=>{
 const rectangles:number[][]=[];const g:any={lineStyle(){return this;},lineBetween(){return this;},fillStyle(){return this;},fillRect(...r:number[]){rectangles.push(r);return this;},beginPath(){return this;},arc(){return this;},strokePath(){return this;}};
 const a=setup('guanyu','classic');a.hero.step=1;a.swing();drawDuelBare(g,a.hero,34,-43,2);assert(rectangles.some(r=>r[3]>r[2]));rectangles.length=0;
 const b=setup('zhangfei','classic');b.swing();drawDuelBare(g,b.hero,40,-43,2);assert(rectangles.every(r=>r[2]>r[3]));
});
for(const id of ['guanyu','zhangfei'] as const)test(`${id}: three special contacts have different rear coverage without a health cost`,()=>{
 const m=setup(id),front=enemy(m,440,412),rear=enemy(m,350,412);m.special();const a=m.hero.attack!;for(let pulse=0;pulse<3;pulse++){front.inv=rear.inv=0;front.x=440;rear.x=350;a.pulses=pulse;m.resolve(m.hero,a);if(pulse<2)assert.equal(rear.hp, id==='guanyu'?1000-24*(pulse+1):1000);}
 assert.equal(front.hp,1000-(id==='guanyu'?24:28)*3);assert.equal(rear.hp,1000-(id==='guanyu'?72:28));assert.equal(m.hero.hp,160);
});
test('Guan Yu rises while Zhang Fei stays planted before his ground burst',()=>{
 assert(specialMotion('guanyu',.4).lift>20);assert.equal(specialMotion('zhangfei',.4).lift,0);assert(specialMotion('zhangfei',.4).angle>0);
});
test('Zhang Fei overhead ground throw lifts higher than Guan Yu shoulder throw',()=>{
 const height:number[]=[];for(const id of ['guanyu','zhangfei'] as const){const m=setup(id);const e=enemy(m,428,412);m.tryGrab({x:1,y:0});m.tick(1/60,{x:1,y:0,grappleAttack:true});ticks(m,12);height.push(e.z);}assert(height[1]>height[0]+15);
});
test('Guan Yu air throw arches backward while Zhang Fei rotates through a full turn',()=>{
 const angles:number[]=[];for(const id of ['guanyu','zhangfei'] as const){const m=setup(id);enemy(m,428,412);m.tryGrab({x:1,y:0});m.tick(1/60,{...idle,jump:true});ticks(m,15);m.tick(1/60,{...idle,grappleAttack:true});ticks(m,12);angles.push(m.hero.throwSpin!);assert(m.hero.z>0);ticks(m,30);assert(!m.grapple);assert.equal(m.hero.z,0);}
 assert(angles[0]<0);assert(angles[1]>180);
});
test('different move geometry remains independent in co-op and pickup weapons bypass it',()=>{
 const m=new Campaign('guanyu');m.enableCoop('zhangfei');m.start();m.pending=[];m.supplies=[];m.barrels=[];m.hero.x=400;m.hero.y=380;const p=m.partner!;p.x=400;p.y=465;const a=enemy(m,450,412),b=enemy(m,450,497);
 m.tick(1/60,{...idle,attack:true,partner:{...idle,attack:true}});ticks(m,9);assert(a.hp<1000);assert.equal(b.hp,1000);
 for(const f of m.players){m.withPlayer(f,()=>{f.attack=null;f.equipped={id:'sword',uses:18};m.swing();assert.equal(f.attack?.weapon,'sword');assert.equal(f.attack?.duration,.26);});}
});
