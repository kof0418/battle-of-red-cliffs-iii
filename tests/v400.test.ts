import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign} from '../src/combat.ts';import {HERO_IDS} from '../src/heroes.ts';
import {JOURNAL_KEY,makeRunSummary,parseJournal,appendJournal,journalScope} from '../src/finale.ts';
import {UserSettings} from '../src/user-settings.ts';
for(const hero of HERO_IDS)for(const difficulty of ['easy','normal','hard'] as const)for(const coop of [false,true])for(const route of ['short','pursuit','rescue'] as const)test(`${hero}/${difficulty}/${coop?'coop':'solo'}/${route}: final settlement covers each stage exactly once`,()=>{
 const m=new Campaign(hero,difficulty,0,route==='short'?'short':'full');if(coop)m.enableCoop('zhangfei');m.start();
 for(let stage=0;stage<m.levels.length;stage++){
  assert.equal(m.stage,stage);m.wave=m.level.waves.length;m.enemies=[];m.pending=[];m.bombs=[];m.projectiles=[];m.barrels=[];m.pickups=[];m.horses=[];
  m.tick(1/60,{x:0,y:0,partner:{x:0,y:0}});assert.equal(m.stageResults.length,stage+1);const score=m.score;m.finishStage();assert.equal(m.score,score);
  if(stage<m.levels.length-1){assert.equal(m.status,'stage-clear');if(stage===7&&route!=='short')assert.ok(m.chooseEnding(route));assert.ok(m.nextStage());}
 }
 assert.equal(m.status,'won');assert.equal(m.nextStage(),false);const entry=makeRunSummary(m,'matrix',1700000000000);assert.equal(entry.route,route);assert.equal(entry.complete,true);assert.equal(entry.mode,coop?'coop':'solo');assert.equal(entry.stages.length,route==='short'?5:9);assert.equal(parseJournal([entry]).length,1);
});
function entry(id='run-1'){const m=new Campaign();m.start(4);m.wave=m.level.waves.length;m.pending=[];m.enemies=[];m.tick(1/60,{x:0,y:0});return makeRunSummary(m,id,1700000000000);}
test('journal is bounded, deduplicated and explicitly marks selected-stage runs',()=>{
 let entries=[] as ReturnType<typeof parseJournal>;for(let i=0;i<30;i++)entries=appendJournal(entries,entry('run-'+i));assert.equal(entries.length,20);assert.equal(entries[0].id,'run-29');assert.equal(appendJournal(entries,entries[0]).length,20);assert.equal(entries[0].complete,false);assert.match(journalScope(entries[0]),/選關挑戰.*部分關卡/);
});
test('corrupt or injected journals cannot introduce invalid scores, enum text or duplicate stages',()=>{
 const e=entry();for(const bad of [{...e,hero:'<script>'},{...e,score:NaN},{...e,score:-1},{...e,complete:true},{...e,route:'bad'},{...e,mode:'coop'},{...e,stages:[e.stages[0],e.stages[0]]}])assert.deepEqual(parseJournal([bad]),[]);assert.deepEqual(parseJournal({}),[]);
});
test('journal persistence keeps legacy best scores and settings intact without storing a campaign',()=>{
 const data=new Map<string,string>();const store=new UserSettings(()=>({getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);}}));
 store.setItem('red-banner-best-v14loot','12345');store.setItem('red-banner-controls-v1','{}');store.setItem(JOURNAL_KEY,JSON.stringify([entry()]));
 assert.equal(store.getItem('red-banner-best-v14loot'),'12345');assert.equal(store.getItem('red-banner-controls-v1'),'{}');assert.equal(parseJournal(JSON.parse(store.getItem(JOURNAL_KEY)!)).length,1);assert.equal(store.getItem('campaign-save'),null);
});
