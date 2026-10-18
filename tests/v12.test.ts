import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fieldEvent,fieldHits} from '../src/battlefield.ts';
import {Campaign} from '../src/combat.ts';
import {captureSave,restoreSave,parseSave} from '../src/save.ts';
import {HERO_IDS} from '../src/heroes.ts';
import {attackPhase,heroMotion} from '../src/motion.ts';
import {weaponVoice} from '../src/audio.ts';
const idle={x:0,y:0};
function hazard(stage=0){const m=new Campaign();m.stage=stage;m.start();m.enemies=[m.fighter('heavy',900,490)];m.enemies[0].cooldown=99;m.time=5.39;m.hero.x=300;m.hero.y=370;return m;}
test('both stage events warn before impact, rotate lanes and stop in boss arenas',()=>{
 assert.equal(fieldEvent(0,1,3.9,0),null);
 const warning=fieldEvent(0,1,4,0)!;assert.equal(warning.active,false);assert.equal(warning.impactAt,5.4);
 assert.equal(fieldEvent(0,1,5.5,0)?.active,true);assert.equal(fieldEvent(0,1,6,0),null);
 assert.notEqual(fieldEvent(0,1,11,0)?.y,warning.y);
 assert.equal(fieldEvent(1,2,4,0)?.kind,'fire');assert.equal(fieldEvent(1,3,5.4,0),null);
});
test('arrows threaten airborne heroes; fire can be jumped; dodge and lane escape work',()=>{
 const hero={x:300,y:370,z:60,inv:0,hp:160};
 assert.equal(fieldHits(fieldEvent(0,1,5.4,0)!,hero),true);
 assert.equal(fieldHits(fieldEvent(1,1,5.4,0)!,hero),false);
 assert.equal(fieldHits(fieldEvent(0,1,5.4,0)!,{...hero,inv:.2}),false);
 assert.equal(fieldHits(fieldEvent(0,1,5.4,0)!,{...hero,y:440}),false);
});
test('event damage applies once, counts against no-damage bonus and pauses with battle',()=>{
 const m=hazard();m.paused=true;m.tick(1/60,idle);assert.equal(m.hero.hp,160);assert.equal(m.time,5.39);
 m.paused=false;m.tick(1/60,idle);assert.equal(m.hero.hp,148);assert.equal(m.waveDamage,12);assert.ok(m.events.some(e=>e.type==='volley'));
 for(let i=0;i<20;i++)m.tick(1/60,idle);assert.equal(m.hero.hp,148);
});
test('saving before or after impact preserves timing without duplicate damage',()=>{
 const m=hazard(),n=restoreSave(captureSave(m));n.paused=false;m.tick(1/60,idle);n.tick(1/60,idle);assert.equal(n.hero.hp,m.hero.hp);
 const after=restoreSave(captureSave(m));after.paused=false;after.hero.inv=0;after.tick(1/60,idle);assert.equal(after.hero.hp,148);
});
test('event can defeat hero, does not damage cleared arenas and continue resets warning',()=>{
 const m=hazard();m.hero.hp=5;m.tick(1/60,idle);assert.equal(m.status,'lost');assert.ok(m.continueRun());assert.equal(m.field,null);
 const safe=hazard();safe.enemies=[];safe.tick(1/60,idle);assert.equal(safe.hero.hp,160);
 const fire=hazard(1);fire.hero.z=60;fire.tick(1/60,idle);assert.equal(fire.hero.hp,160);
});
test('five motion profiles and weapon envelopes differ with contact aligned to impact',()=>{
 assert.equal(attackPhase(.09,.10,.3),1);assert.equal(attackPhase(.10,.10,.3),2);assert.equal(attackPhase(.29,.10,.3),4);
 const poses=HERO_IDS.map(id=>JSON.stringify(heroMotion(id,1,2)));assert.equal(new Set(poses).size,5);
 const sounds=HERO_IDS.map(id=>JSON.stringify(weaponVoice(id,false,false)));assert.equal(new Set(sounds).size,5);
 for(const id of HERO_IDS){assert.ok(weaponVoice(id,true,true).duration>weaponVoice(id,false,false).duration);assert.ok(Number.isFinite(heroMotion(id,3,4).lean));}
});
test('v1.1 saves retain score and wave statistics but do not mix with v1.2 records',()=>{
 const m=hazard();m.score=1234;m.waveDamage=8;const old:any=captureSave(m);old.gameVersion='1.1.0';
 const n=restoreSave(parseSave(JSON.stringify(old)));assert.equal(n.score,1234);assert.equal(n.waveDamage,8);assert.equal(n.waveStarted,m.waveStarted);assert.equal(n.ranked,false);
 assert.equal(captureSave(m).gameVersion,'1.3.0');assert.equal(restoreSave(captureSave(m)).ranked,true);
});
