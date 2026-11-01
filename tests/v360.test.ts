import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,stats,type Attack} from '../src/combat.ts';
import {DIFFICULTIES,type Difficulty} from '../src/tactics.ts';
const idle={x:0,y:0};
function setup(d:Difficulty){const m=new Campaign('guanyu',d);m.start();m.hero.x=400;m.hero.y=412;m.hero.inv=0;m.pending=[];m.enemies=[];m.supplies=[];m.barrels=[];m.props=[];return m;}
test('difficulty changes real incoming damage and grace while preserving normal damage',()=>{
 const lost:number[]=[];for(const d of ['easy','normal','hard'] as const){const m=setup(d),e=m.fighter('soldier',430,412);e.face=-1;m.enemies=[e];const a:Attack={move:'slash',elapsed:.5,duration:1,impact:.4,hit:true,face:-1,x:430,y:412};const hp=m.hero.hp;m.resolve(e,a);lost.push(hp-m.hero.hp);assert.equal(m.hero.inv,DIFFICULTIES[d].hurtGrace);assert.ok((m.hero.hurtUntil??0)>m.time);}
 assert.ok(lost[0]<lost[1]);assert.equal(lost[1],stats.soldier.damage);assert.ok(lost[2]>lost[1]);
});
test('outstanding bombs occupy the easy attack budget even after the thrower recovers',()=>{
 const m=setup('easy'),a=m.fighter('thrower',650,412),b=m.fighter('soldier',450,412);a.cooldown=10;b.cooldown=0;m.enemies=[a,b];m.bombs=[{id:99,owner:a.id,x:400,y:412,fromX:650,fromY:412,elapsed:0}];assert.equal(m.committedAttackers,1);m.tick(1/60,idle);assert.equal(b.attack,null);
});
test('standard difficulty allows only one simultaneous ranged commitment',()=>{
 const m=setup('normal');m.enemies=[m.fighter('archer',620,412),m.fighter('thrower',650,412)];for(const e of m.enemies)e.cooldown=0;m.tick(1/60,idle);assert.equal(m.rangedAttackers,1);
});
test('enemies wait through the player hurt stun and all modes preserve reaction time',()=>{
 for(const d of ['easy','normal','hard'] as const){const m=setup(d),e=m.fighter('soldier',450,412);e.cooldown=0;m.enemies=[e];m.hero.stun=.2;m.hero.inv=.5;m.tick(1/60,idle);assert.equal(e.attack,null);m.hero.stun=0;m.tick(1/60,idle);assert.ok(e.attack);assert.ok(e.attack.impact>=.42);}
});
test('wake-up protection varies by difficulty and exceeds the remaining knockdown',()=>{
 for(const d of ['easy','normal','hard'] as const){const m=setup(d);m.hero.knockdown=.005;m.tick(1/60,idle);assert.ok(m.hero.inv>=DIFFICULTIES[d].wakeGrace);}
});
