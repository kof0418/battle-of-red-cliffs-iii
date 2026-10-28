import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,attackHits,isBoss,type Input,type Kind} from '../src/combat.ts';import {EXTENDED_LEVELS,LEVELS,arenaStart} from '../src/levels.ts';import {encounterPlan,encounterRoster,PROPS} from '../src/encounters.ts';import {fieldEvent,fieldHits} from '../src/battlefield.ts';import {bossPlan} from '../src/tactics.ts';import {gradeStage} from '../src/stage-grade.ts';import {musicStep} from '../src/music-score.ts';import {recordsKey,bestKey} from '../src/records.ts';
const idle={x:0,y:0};
function ticks(m:Campaign,n:number,input:Input=idle){for(let k=0;k<n;k++){m.freeze=0;m.tick(1/60,input);}}
function scene(stage:number,wave=1){const m=new Campaign('guanyu','normal',0,'full');m.stage=stage;m.wave=wave-1;m.status='playing';m.spawn();m.hero.inv=99;return m;}
test('both campaign lengths are complete; extended stages have distinct four/five-act structures and finite geometry',()=>{
 assert.equal(LEVELS.length,5);assert.equal(EXTENDED_LEVELS.length,9);assert.equal(EXTENDED_LEVELS.reduce((n,l)=>n+l.waves.length,0),48);assert.deepEqual(EXTENDED_LEVELS.slice(5).map(l=>l.waves.length),[4,5,4,5]);assert.equal(new Set(EXTENDED_LEVELS.map(l=>l.theme)).size,9);
 for(let s=5;s<9;s++){const l=EXTENDED_LEVELS[s];assert.equal(l.ends!.length,l.waves.length);assert.equal(l.sections.length,l.waves.length);for(let w=1;w<=l.waves.length;w++){assert(l.ends![w-1]>arenaStart(w,l));const m=scene(s,w);assert.equal(m.arenaEnd,l.ends![w-1]);assert(Number.isFinite(m.field?.x??0));assert.equal(m.remainingEnemies,l.waves[w-1].length);assert(Number.isFinite(gradeStage({stage:s,seconds:150,damage:50,retries:0,bestHit:10,interactions:1}).points));}}
});
test('five-stage ending remains terminal while a full campaign continues to the bridge with health and stowed weapons intact',()=>{
 for(const length of ['short','full'] as const){const m=new Campaign('zhaoyun','normal',0,length);m.stage=4;m.wave=6;m.status='playing';m.hero.hp=70;m.hero.equipped={id:'chain',uses:12};m.enemies=[];ticks(m,1);assert.equal(m.status,length==='short'?'won':'stage-clear');if(length==='full'){assert(m.nextStage());assert.equal(m.stage,5);assert.equal(m.hero.hp,70);assert.equal(m.hero.equipped?.id,'chain');assert(!m.hero.mounted);}}
});
test('bridge twins and the flagship rival arrive only after the vanguard clears, with a warning gap',()=>{
 for(const [s,w] of [[5,4],[6,3]]){const m=scene(s,w);assert(!m.enemies.some(e=>isBoss(e.kind)));ticks(m,300);assert(!m.enemies.some(e=>isBoss(e.kind)));m.enemies=[];ticks(m,30);assert(m.pending.length);assert(!m.enemies.length);ticks(m,35);assert(m.enemies.some(e=>isBoss(e.kind)));assert.equal(m.pending.length,0);}
});
test('bridge twins alternate windups rather than starting an unavoidable simultaneous pair',()=>{
 const m=scene(5,4);m.pending=[];m.hero.x=400;m.hero.y=412;m.enemies=['bridgeguard','bridgearcher'].map(k=>m.fighter(k as Kind,480,412));m.enemies.forEach(e=>e.cooldown=0);m.enemies.forEach((e,i)=>m.ai(e,i,.016));assert.equal(m.enemies.filter(e=>e.attack&&!e.attack.hit).length,1);assert(m.enemies.every(e=>e.max<=420));
});
for(const kind of ['bridgeguard','bridgearcher','admiral','firelord','pursuer','warlord'] as const)test(`${kind}: original boss patterns warn and recover in every HP phase; grabbing still respects impact`,()=>{
 const sequences=[];for(const ratio of [1,.5,.2]){const moves=[];for(let n=0;n<8;n++){const p=bossPlan(kind,ratio*1000,1000,n);assert(p.windup>=.65);assert(p.recovery>=.6);moves.push(p.move);}sequences.push(moves.join(','));}assert.equal(new Set(sequences).size,3);const m=scene(8),e=m.fighter(kind,428,412);m.hero.x=400;m.hero.y=412;m.enemies=[e];m.pending=[];e.attack={move:'lanes',elapsed:1.1,impact:1.1,duration:2,hit:false,face:-1,x:428,y:412};assert(!m.tryGrab({x:1,y:0}));e.attack.elapsed=1.4;e.attack.hit=true;assert(m.tryGrab({x:1,y:0}));
});
test('new telegraphs have real safe gaps and reject jumping targets',()=>{
 const m=scene(8);m.hero.x=520;m.hero.y=440;for(const move of ['lanes','fork','surge'] as const){const a={move,elapsed:1,impact:1,duration:2,hit:false,face:1,x:400,y:412};if(move==='lanes'){assert(!attackHits(a,m.hero,300));m.hero.y=412;assert(attackHits(a,m.hero,300));}m.hero.z=70;assert(!attackHits(a,m.hero,300));m.hero.z=0;}
});
test('each new stage has a warned hazard and functional local suppression, with focused Boss arenas',()=>{
 for(let s=5;s<9;s++){const f=fieldEvent(s,1,5,0)!;assert(f&&!f.active);assert(f.progress<1);assert.equal(fieldEvent(s,EXTENDED_LEVELS[s].waves.length,5,0),null);const h={x:f.x+20,y:f.y+20,z:80,inv:0,hp:160};assert.equal(fieldHits(f,h),s===5||s===8);const m=scene(s,2);const p=m.props[0];assert.equal(p.stageKind,PROPS[s].stageKind);m.activateProp(p);if(s===5||s===7){m.time=5;assert.equal(m.field,null);}else assert(m.enemies.every(e=>e.stun>=.9));}
});
test('salvage targets move, freeze on pause, pay score only and can be skipped by advancing',()=>{
 const m=scene(5,2);m.enemies=[];m.pending=[];m.hero.hp=75;ticks(m,1);assert.equal(m.bonusRound?.kind,'salvage');const b=m.barrels.find(b=>b.bonusTarget)!;const x=b.x;ticks(m,20);assert.notEqual(b.x,x);m.paused=true;const frozen=b.x;ticks(m,60);assert.equal(b.x,frozen);m.paused=false;m.time+=3;m.cameraLeft=2300;m.hero.x=m.arenaEnd-20;m.clearedAt=m.time-2;ticks(m,1);assert.equal(m.wave,3);assert(!m.bonusRound);assert.equal(m.hero.hp,75);
});
test('ending choice changes final-stage enemies and actual ending while retaining independent co-op heroes',()=>{
 for(const route of ['pursuit','rescue'] as const){const m=new Campaign('guanyu','normal',0,'full');m.enableCoop('weiyan');m.stage=7;m.wave=3;m.status='playing';m.spawn();m.enemies=[];m.pending=[];ticks(m,1);assert.equal(m.status,'stage-clear');assert(m.chooseEnding(route));assert(m.nextStage());assert.equal(m.stage,8);assert.equal(m.endingRoute,route);assert.equal(m.enemies.some(e=>e.kind==='thrower'),route==='pursuit');assert(m.ending.title.includes(route==='rescue'?'萬家':'破曉'));const before=m.ending.text;m.stageInteractions.add(2);assert.notEqual(m.ending.text,before);m.wave=m.level.waves.length;m.pending=[];m.enemies=[];ticks(m,1);assert.equal(m.status,'won');assert(!m.nextStage());}
});
test('continue restores the same new-stage layout and ending route without carrying a horse',()=>{
 const m=scene(8,3);m.endingRoute='rescue';const roster=encounterRoster(8,3);m.hero.hp=0;m.status='lost';assert(m.continueRun());assert.equal(m.endingRoute,'rescue');assert.equal(m.remainingEnemies,roster.length);assert.equal(m.wave,3);assert.equal(m.hero.x,arenaStart(3,m.level)+180);assert(!m.hero.mounted);assert.equal(m.horses.length,0);
});
test('nine-stage scores stay separate and all four new music scores are finite and distinct',()=>{
 assert.notEqual(recordsKey('normal','full'),recordsKey('normal','short'));assert.notEqual(bestKey('hard','full'),bestKey('hard','short'));const phrases=[];for(let s=5;s<9;s++){const notes=Array.from({length:32},(_,i)=>musicStep(s,true,i));assert(notes.every(n=>n.interval>0&&n.notes.every(t=>Number.isFinite(t.midi))));phrases.push(JSON.stringify(notes));}assert.equal(new Set(phrases).size,4);
});
