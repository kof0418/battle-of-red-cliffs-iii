import {test} from 'node:test';import assert from 'node:assert/strict';
import {settleRun,recordsKey,bestKey} from '../src/records.ts';
import {inView,sceneryTiles} from '../src/scenery-plan.ts';
import {gradeStage} from '../src/stage-grade.ts';
import {Campaign} from '../src/combat.ts';import {FixedStep} from '../src/fixed-step.ts';
for(const difficulty of ['easy','normal','hard'] as const)for(const length of ['short','full'] as const){
 test(`${difficulty}/${length}: actual settlement writes only its profile, co-op writes nothing`,()=>{
  const store=new Map<string,string>(),storage={setItem:(k:string,v:string)=>store.set(k,v)};
  const run={difficulty,length,ranked:true,won:true,hero:'guanyu' as const,score:12345,rank:'A' as const};
  const result=settleRun(storage,run,{},80);assert.equal(result.best,12345);assert.equal(result.records.guanyu?.score,12345);
  assert.deepEqual([...store.keys()],[recordsKey(difficulty,length),bestKey(difficulty,length)]);
  store.clear();assert.deepEqual(settleRun(storage,{...run,ranked:false},result.records,90),{records:result.records,best:90});assert.equal(store.size,0);
  settleRun(storage,{...run,won:false},result.records,90);assert.deepEqual([...store.keys()],[bestKey(difficulty,length)]);
 });
 for(const coop of [false,true])test(`${difficulty}/${length}/${coop?'2P':'1P'}: all arenas preserve attack budgets and finite grade`,()=>{
  const m=new Campaign('guanyu',difficulty,1,length);if(coop)m.enableCoop('lubu');m.start();
  for(let stage=0;stage<m.levels.length;stage++)for(let wave=1;wave<=m.levels[stage].waves.length;wave++){
   m.stage=stage;m.wave=wave-1;m.spawn();m.hero.x=m.cameraLeft+400;m.hero.y=412;
   m.enemies.forEach((e,i)=>{e.x=m.hero.x+65+i;e.y=412;e.cooldown=0;e.guardCooldown=10;});
   m.enemies.forEach((e,i)=>m.ai(e,i,1/60));assert(m.enemies.filter(e=>e.attack).length<=m.attackLimit,`${stage}/${wave}`);
   const g=gradeStage({stage,seconds:130,damage:60*(coop?2:1),retries:0,bestHit:15,interactions:1},coop?2:1);assert(Number.isFinite(g.points));
  }
 });
}
test('co-op grade compares average damage per player; single-player grade stays unchanged',()=>{
 const p={stage:8,seconds:150,damage:60,retries:0,bestHit:16,interactions:2};assert.deepEqual(gradeStage(p),gradeStage(p,1));assert.equal(gradeStage({...p,damage:120},2).points,gradeStage(p).points);assert(gradeStage({...p,damage:240},2).points<gradeStage({...p,damage:120},2).points);
});
test('profile failure retains session results without restoring campaign progress',()=>{
 const result=settleRun({setItem(){throw Error('unavailable');}},{difficulty:'normal',length:'full',ranked:true,won:true,hero:'lubu',score:900,rank:'S'}, {},100);assert.equal(result.best,900);assert.equal(result.records.lubu?.rank,'S');
});
test('scenery culling covers every pixel at tile seams and level ends, shows at most two tiles',()=>{
 const tiles=sceneryTiles(5600);for(let left=0;left<=4640;left+=8){const visible=tiles.filter(t=>inView(t.x,t.width,left));assert(visible.length<=2);assert(visible[0].x<=left);assert(visible.at(-1)!.x+visible.at(-1)!.width>=left+960);}
 assert(inView(-100,0,0,960,320));assert(!inView(-321,0,0,960,320));assert(inView(1280,0,0,960,320));assert(!inView(1281,0,0,960,320));
});
for(const hz of [30,60,90,120,144])test(`${hz}Hz: both players receive the same combat time and one-shot buttons`,()=>{
 const clock=new FixedStep();let ticks=0,a=0,b=0;for(let i=0;i<hz;i++)clock.advance(1/hz,{x:1,y:0,attack:i===0,partner:{x:-1,y:0,jump:i===0}},true,(_,input)=>{ticks++;a+=Number(!!input.attack);b+=Number(!!input.partner?.jump);});assert.equal(ticks,60);assert.equal(a,1);assert.equal(b,1);
});
test('campaign settlement applies the co-op grade once while retaining team damage',()=>{
 const single=new Campaign(),team=new Campaign();team.enableCoop('lubu');for(const m of [single,team]){m.time=120;m.stageDamage=m.partner?120:60;m.stageBestHit=16;m.finishStage();const score=m.score;m.finishStage();assert.equal(m.stageResults.length,1);assert.equal(m.score,score);assert.equal(m.stageResults[0].damage,m.partner?120:60);}assert.equal(single.stageResults[0].points,team.stageResults[0].points);
});
