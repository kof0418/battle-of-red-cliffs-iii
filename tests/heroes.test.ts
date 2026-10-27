import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Campaign } from '../src/combat.ts';
import { HERO_IDS } from '../src/heroes.ts';
import { captureSave, restoreSave, parseSave } from '../legacy/save.ts';
for (const id of HERO_IDS) test(`${id}: selection, save, continue and next-stage retain hero`, () => {
 const m = new Campaign(); assert.ok(m.selectHero(id)); m.start(); assert.equal(m.selectHero('guanyu'),false);
 m.tick(1/60,{x:0,y:0,attack:true}); const n=restoreSave(captureSave(m));
 assert.equal(n.hero.heroId,id);const {comboHit,comboAttack,...legacyHero}=m.hero;assert.deepEqual(n.hero,legacyHero); // Legacy v1.3 archives exclude transient v2.1 combo state.

 n.hero.hp=0;n.status='lost';assert.ok(n.continueRun());assert.equal(n.hero.heroId,id);
 n.status='stage-clear';assert.ok(n.nextStage());assert.equal(n.hero.heroId,id);
});
test('legacy saves migrate to Guan Yu; unknown and missing new-version heroes are rejected',()=>{
 const m=new Campaign();m.start();const s:any=captureSave(m);s.gameVersion='0.4.0';delete s.run.hero.heroId;
 assert.equal(parseSave(JSON.stringify(s)).run.hero.heroId,'guanyu');
 s.gameVersion='0.5.1';assert.throws(()=>parseSave(JSON.stringify(s)));
 s.run.hero.heroId='__proto__';assert.throws(()=>parseSave(JSON.stringify(s)));
});
test('heroes have different actual movement, hit damage and timing',()=>{
 const a=new Campaign('zhangfei'),b=new Campaign('zhaoyun');a.start();b.start();
 a.tick(.03,{x:1,y:0});b.tick(.03,{x:1,y:0});assert.ok(b.hero.x>a.hero.x);
 assert.ok(a.slash(3).damage>b.slash(3).damage);assert.ok(a.slash(1).duration>b.slash(1).duration);
 const hits=HERO_IDS.map(id=>{const m=new Campaign(id);m.start();m.enemies=[m.fighter('heavy',230,412)];m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.2);return 180-m.enemies[0].hp;});
 assert.deepEqual(hits,[17,22,14,14,18,23]);
});
test('Huang Zhong arrows hit the nearest target, respect lanes, and third shot pierces',()=>{
 const m=new Campaign('huangzhong');m.start();m.supplies=[];
 const front=m.fighter('heavy',350,412),back=m.fighter('heavy',420,412),off=m.fighter('heavy',300,465);
 m.enemies=[back,off,front];m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(front.hp,180);m.updateProjectiles(.3);
 assert.ok(front.hp<180);assert.equal(back.hp,180);assert.equal(off.hp,180);assert.equal(m.projectiles.length,0);
 front.inv=0;m.hero.comboHit=true;m.hero.step=2;m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.4);
 assert.ok(back.hp<180);assert.equal(off.hp,180);
});
test('a crate blocks ordinary arrows and can be destroyed from range',()=>{
 const m=new Campaign('huangzhong');m.start();const box=m.supplies[0];box.x=300;box.y=412;
 const e=m.fighter('heavy',400,412);m.enemies=[e];m.swing();m.resolve(m.hero,m.hero.attack!);assert.equal(box.hp,24);m.updateProjectiles(.2);
 assert.ok(box.hp<24);assert.equal(e.hp,180);
 m.hero.last=m.time;m.swing();m.resolve(m.hero,m.hero.attack!);m.updateProjectiles(.2);assert.equal(m.supplies.length,0);assert.equal(m.pickups.length,1);
});
