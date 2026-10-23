import test from 'node:test';import assert from 'node:assert/strict';import {musicStep} from '../src/music-score.ts';import {HERO_IDS} from '../src/heroes.ts';import {SPECIAL_IMPACTS} from '../src/audio.ts';
test('three scores have unique arrangements, sixteen-bar development and faster boss tempos',()=>{
 const signatures=[];for(const stage of [2,3,4]){const steps=Array.from({length:256},(_,i)=>musicStep(stage,false,i));signatures.push(JSON.stringify(steps));assert(musicStep(stage,true,0).interval<steps[0].interval);assert.notDeepEqual(steps[0].notes,steps[64].notes);assert.equal(steps[255].bar,15);assert.deepEqual(musicStep(stage,false,256),steps[0]);for(const step of steps)for(const note of step.notes){assert(Number.isFinite(note.duration)&&note.duration>0);assert(note.gain>0&&note.gain<.3);}}assert.equal(new Set(signatures).size,3);
});
test('six special impacts have distinct short metallic resonance profiles',()=>{
 const profiles=HERO_IDS.map(id=>SPECIAL_IMPACTS[id]);
 assert.equal(new Set(profiles.map(p=>JSON.stringify(p))).size,6);
 for(const p of profiles){assert(p.metal>200&&p.metal*3.71<10000);assert(p.body>36);assert(p.decay>0&&p.decay<.5);}
});
