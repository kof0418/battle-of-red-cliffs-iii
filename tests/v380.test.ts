import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';import {CHAPTERS,STAGE_RECOVERY} from '../src/campaign-story.ts';
test('all nine missions are distinct and opening waves show their actual chapter objective',()=>{
 assert.equal(CHAPTERS.length,9);assert.equal(new Set(CHAPTERS.map(c=>c.goal)).size,9);
 for(let stage=0;stage<9;stage++){const m=new Campaign('guanyu','normal',0,'full');m.start(stage);assert.match(m.message,new RegExp(CHAPTERS[stage].act));assert.ok(m.message.includes(CHAPTERS[stage].goal));}
});
test('stage supplies are bounded, apply once, preserve equipment and do not revive teammates',()=>{
 const m=new Campaign();m.enableCoop('zhangfei');m.start();m.hero.hp=80;m.partner!.hp=0;m.hero.equipped={id:'sword',uses:5};m.status='stage-clear';const credits=m.continues;
 assert.ok(m.nextStage());assert.equal(m.hero.hp,80+STAGE_RECOVERY);assert.equal(m.partner!.hp,0);assert.equal(m.hero.equipped?.uses,5);assert.equal(m.continues,credits);assert.equal(m.nextStage(),false);assert.equal(m.hero.hp,92);
 const s=new Campaign();s.start();s.hero.hp=155;s.status='stage-clear';s.nextStage();assert.equal(s.hero.hp,160);
});
test('short route ends at five stages and full route continues through the branch',()=>{
 for(const [length,count] of [['short',5],['full',9]] as const){const m=new Campaign('guanyu','normal',0,length);m.start(count-1);m.status='stage-clear';assert.equal(m.nextStage(),false);}
});
