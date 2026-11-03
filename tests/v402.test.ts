import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Campaign,type Kind} from '../src/combat.ts';
import {HERO_IDS} from '../src/heroes.ts';
import {groundThrowWeight,THROWS} from '../src/throws.ts';
import {grappleMotion,waistPoint} from '../src/motion.ts';
import {releaseHand,unwaistPoint,planted} from '../src/choreography.ts';
for(const id of HERO_IDS)for(const face of [-1,1])for(const back of [false,true])for(const kind of ['soldier','heavy','boss'] as Kind[]){
 test(`${id} face ${face} ${back?'back':'front'} ${kind}: grounded carry, continuous release, single impact`,()=>{
  const m=new Campaign(id);m.start();m.hero.x=440;m.hero.y=420;m.hero.face=face;
  const e=m.fighter(kind,440+face*25,420);e.hp=e.max=2000;m.enemies=[e];
  assert.ok(m.tryGrab({x:face,y:0}));m.beginThrow(face*(back?-1:1),false);assert.equal(m.grapple?.phase,'throw');
  const w=groundThrowWeight(id,kind);let prev={x:e.x,z:e.z},frames=0;
  while(m.grapple&&frames++<150){
   m.updateGrapple(1/120,{x:0,y:0});
   assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.z));assert.ok(Math.abs(e.x-prev.x)<10);assert.ok(Math.abs(e.z-prev.z)<10);
   if(m.grapple){
    assert.ok(planted(m.hero));assert.ok(Math.abs(m.hero.grappleProgress!-m.grapple.elapsed/(w.lift+w.flight))<1e-6);
    if(m.grapple.elapsed<w.lift){const scale=id==='zhangfei'?1.24:1.12,enemyScale=kind==='boss'?1.5:1.12;assert.ok(e.z+35*enemyScale<=79*scale+.01);}
   }
   prev={x:e.x,z:e.z};
  }
  assert.equal(m.grapple,null);assert.equal(e.z,0);assert.equal(2000-e.hp,THROWS[id].damage);assert.equal(m.hero.grappleRelease,undefined);
 });
}
test('hand contact shares the hip rotation and returns exactly to guard',()=>{
 for(const lean of [-19,0,19])for(const crouch of [0,3,8]){const p=waistPoint(23,-71,lean,crouch),q=unwaistPoint(p.x,p.y,lean,crouch);assert.ok(Math.abs(q.x-23)<1e-8);assert.ok(Math.abs(q.y+71)<1e-8);}
 for(const back of [false,true]){const p={x:13,y:-78};assert.deepEqual(releaseHand(p,0,back),p);assert.deepEqual(releaseHand(p,1,back),{x:20,y:-48});}
});
test('torso lift and release keyframes are continuous for all six heroes and both directions',()=>{
 for(const id of HERO_IDS)for(const back of [false,true]){const r=.31,a=grappleMotion(id,'throw',r-1e-6,back,false,r),b=grappleMotion(id,'throw',r+1e-6,back,false,r);for(const k of ['x','y','lean','stride','crouch'] as const)assert.ok(Math.abs(a[k]-b[k])<.001);}
});
