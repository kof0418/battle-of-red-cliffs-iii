import {LEVELS} from '../src/levels.ts';
import { HERO_IDS } from '../src/heroes.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign, attackHits, type Input, type Attack} from '../src/combat.ts';
const idle: Input = {x:0,y:0};
function advance(m: Campaign, seconds: number, input = idle) {for(let i=0;i<Math.ceil(seconds*60);i++)m.tick(1/60,input);}
function isolated() { const m=new Campaign();m.start();m.enemies=[m.fighter('heavy',245,412)];m.enemies[0].cooldown=99;m.enemies[0].guardCooldown=99;return m; }

test('pause freezes movement, attacks, cooldowns and input buffer',()=>{
 const m=isolated(); m.events=[];m.togglePause();const before=JSON.stringify(m);advance(m,2,{x:1,y:1,attack:true,jump:true,dodge:true});assert.equal(JSON.stringify(m),before);
});
test('three buffered attacks apply distinct damage and finisher knockback',()=>{
 const m=isolated(),e=m.enemies[0];m.tick(1/60,{...idle,attack:true});advance(m,.13);
 assert.equal(e.hp,163);m.tick(1/60,{...idle,attack:true});advance(m,.3);assert.equal(m.hero.step,2);
 m.tick(1/60,{...idle,attack:true});let beforeImpact=e.x;for(let i=0;i<60&&e.hp>108;i++){beforeImpact=e.x;m.tick(1/60,idle);}assert.equal(m.hero.step,3);assert.equal(e.hp,108);assert.ok(e.x-beforeImpact>=64);assert.equal(m.hits,3);
});
test('jump and dodge avoid ground attacks; dodge cooldown prevents spamming',()=>{
 const m=isolated();m.tick(1/60,{...idle,jump:true});advance(m,.2);assert.ok(m.hero.z>38);
 const a:Attack={move:'slam',elapsed:0,duration:1,impact:.8,hit:false,face:1,x:180,y:412};assert.equal(attackHits(a,m.hero,120),false);
 const n=isolated();n.tick(1/60,{...idle,dodge:true});assert.ok(n.hero.inv>0);const x=n.hero.x;advance(n,.3,{...idle,dodge:true});assert.ok(n.hero.x>x);assert.ok(n.hero.dodge<=0);assert.ok(n.hero.dodgeCooldown>0);
});
test('damage interrupts ordinary enemies and hero invulnerability prevents pile-on',()=>{
 const m=isolated(),e=m.enemies[0];const a:Attack={move:'slash',elapsed:0,duration:.6,impact:.4,hit:false,face:-1,x:225,y:412};e.attack=a;m.resolve(e,a);const hp=m.hero.hp;m.resolve(e,a);assert.equal(m.hero.hp,hp);assert.ok(hp<160);
});
test('boss alternates readable slam / charge and speeds up at half health',()=>{
 const m=isolated(),e=m.fighter('boss',270,412);m.enemies=[e];e.cooldown=0;m.tick(1/60,idle);assert.equal(e.attack?.move,'slam');const normal=e.attack!.impact;
 e.attack=null;e.cooldown=0;e.hp=e.max/2;m.tick(1/60,idle);assert.equal(e.attack?.move,'charge');assert.ok(e.attack!.impact<normal);
});
test('clear reward happens once, arena gates hold, and next waves unlock in order',()=>{
 const m=isolated();m.hero.x=960;advance(m,1,{x:1,y:0});assert.equal(m.hero.x,935);
 m.hero.hp=80;m.enemies=[];m.tick(1/60,idle);assert.equal(m.hero.hp,80);advance(m,.3);assert.equal(m.hero.hp,80);
 advance(m,1);assert.equal(m.wave,2);m.enemies=[];m.hero.x=1800;advance(m,3,{x:1,y:0});assert.equal(m.wave,3);m.wave=m.level.waves.length;m.enemies=[];m.tick(1/60,idle);assert.equal(m.status,'stage-clear');
});
test('zero health loses even if last enemy dies on the same frame',()=>{
 const m=isolated();m.wave=3;m.enemies=[];m.hero.hp=0;m.tick(1/60,idle);assert.equal(m.status,'lost');advance(m,1);assert.equal(m.status,'lost');
});
test('new campaign resets all combat state',()=>{
 const m=isolated();m.score=900;m.paused=true;m.hero.hp=1;const n=new Campaign();assert.equal(n.status,'ready');assert.equal(n.score,0);assert.equal(n.hero.hp,160);assert.equal(n.paused,false);
});
for (const id of HERO_IDS) test(`${id}: all 30 waves remain completable on standard with the production two-continue budget`,()=>{
 const m=new Campaign(id);m.start();
 assert.equal(m.continues,2);
 for(let frame=0;frame<60*1200&&(m.status==='playing'||m.status==='stage-clear'||m.status==='lost');frame++){
  if(m.status==='lost'){if(!m.continueRun())break;continue;}
  if(m.status==='stage-clear'){assert.ok(m.nextStage());continue;}
  const h=m.hero,e=[...m.enemies].sort((a,b)=>Math.abs(a.x-h.x)+Math.abs(a.y-h.y)*3-Math.abs(b.x-h.x)-Math.abs(b.y-h.y)*3)[0];
  let input:Input={x:1,y:0};
  if(e){const dx=e.x-h.x,dy=e.y-h.y;const near=Math.abs(dx)<94&&Math.abs(dy)<25;
   input={x:Math.abs(dx)>70?Math.sign(dx):h.face!==Math.sign(dx)?Math.sign(dx):0,y:Math.abs(dy)>8?Math.sign(dy):0,attack:near&&frame%12===0,jump:false};
   if(e.attack&&!e.attack.hit&&e.attack.elapsed>e.attack.impact-.22)input.dodge=true;
  }
  if(e&&Math.abs(e.x-h.x)<100&&Math.abs(e.y-h.y)<45&&(h.specialCooldown??0)<=0&&!h.attack)input.special=true;
  if(m.grapple)input={x:h.face,y:0,grappleAttack:true};
  m.tick(1/60,input);
 }
 assert.equal(m.status,'won',`status=${m.status}, wave=${m.wave}, hp=${m.hero.hp}, enemies=${m.enemies.length}`);
 assert.equal(m.stage,LEVELS.length-1);assert.equal(m.wave,m.level.waves.length);assert.ok(m.score>18000);assert.equal(m.kills,LEVELS.flatMap(l=>l.waves.flat()).length);
});
test('hit streak starts at one, refreshes on enemy contact, expires and pauses with combat',()=>{
 const m=isolated();const e=m.enemies[0];m.grappleDamage(e,1);assert.equal(m.hits,1);
 advance(m,1);m.grappleDamage(e,1);assert.equal(m.hits,2);m.paused=true;advance(m,3);assert.equal(m.hits,2);m.paused=false;
 advance(m,1.8);assert.equal(m.hits,0);m.grappleDamage(e,1);assert.equal(m.hits,1);assert.equal(m.bestCombo,2);
});
