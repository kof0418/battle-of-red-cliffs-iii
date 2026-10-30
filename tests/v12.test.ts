import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fieldEvent,fieldHits} from '../src/battlefield.ts';
import {Campaign} from '../src/combat.ts';
import {captureSave,restoreSave,parseSave} from '../legacy/save.ts';
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
 assert.equal(fieldEvent(1,2,4,0)?.kind,'fire');assert.equal(fieldEvent(1,6,5.4,0),null);
});
test('arrows threaten airborne heroes; fire can be jumped; dodge and lane escape work',()=>{
 const hero={x:300,y:370,z:60,inv:0,hp:160};
 assert.equal(fieldHits(fieldEvent(0,1,5.4,0)!,hero),true);
 assert.equal(fieldHits(fieldEvent(1,1,5.4,0)!,hero),false);
 assert.equal(fieldHits(fieldEvent(0,1,5.4,0)!,{...hero,inv:.2}),false);
 assert.equal(fieldHits(fieldEvent(0,1,5.4,0)!,{...hero,y:440}),false);
});



test('six motion profiles and weapon envelopes differ with contact aligned to impact',()=>{
 assert.equal(attackPhase(.09,.10,.3),1);assert.equal(attackPhase(.10,.10,.3),2);assert.equal(attackPhase(.29,.10,.3),4);
 const poses=HERO_IDS.map(id=>JSON.stringify(heroMotion(id,1,2)));assert.equal(new Set(poses).size,6);
 const sounds=HERO_IDS.map(id=>JSON.stringify(weaponVoice(id,false,false)));assert.equal(new Set(sounds).size,6);
 for(const id of HERO_IDS){assert.ok(weaponVoice(id,true,true).duration>weaponVoice(id,false,false).duration);assert.ok(Number.isFinite(heroMotion(id,3,4).lean));}
});
test('v1.1 saves retain score and wave statistics but do not mix with v1.2 records',()=>{
 const m=hazard();m.score=1234;m.waveDamage=8;const old:any=captureSave(m);old.gameVersion='1.1.0';
 const n=restoreSave(parseSave(JSON.stringify(old)));assert.equal(n.score,1234);assert.equal(n.waveDamage,8);assert.equal(n.waveStarted,m.waveStarted);assert.equal(n.ranked,false);
 assert.equal(captureSave(m).gameVersion,'1.3.0');assert.equal(restoreSave(captureSave(m)).ranked,true);
});
