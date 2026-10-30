import {test} from 'node:test';import assert from 'node:assert/strict';
import {Campaign,type Fighter} from '../src/combat.ts';
import {contactMotion,bowDraw,attackExtension,planted,localContact} from '../src/choreography.ts';
import {heroMotion,closeMotion,groundArrowVisual} from '../src/motion.ts';
import {duelForm,DUEL_SPECIAL_TIMES} from '../src/duel-forms.ts';
import {HAND_PALETTES} from '../src/hand-palette.ts';
import {HERO_IDS} from '../src/heroes.ts';
import {infantryPose,INFANTRY,infantryArrowVisual} from '../src/infantry-motion.ts';
import {drawSwordSoldier} from '../src/soldier-art.ts';
import {drawHeavyInfantry} from '../src/heavy-infantry.ts';
import {rangedSpecialPose} from '../src/ranged-art.ts';
import {vanguardSpecialPose} from '../src/vanguard-art.ts';
function attack(f:Fighter,step:number,move:'slash'|'kick'|'bow-strike'|'special'='slash'){
 const spec=duelForm(f.heroId??'guanyu',step)!;f.step=step;f.attack={move,elapsed:0,impact:spec.impact,duration:move==='special'?.95:spec.duration,face:f.face,x:f.x,y:f.y,hit:false};return f.attack;
}
for(const id of ['zhaoyun','huangzhong','weiyan','lubu'] as const)for(const step of [1,2,3])test(`${id} ${step}: contact, recovery and foot support remain aligned`,()=>{
 const f=new Campaign(id).hero,move=id==='weiyan'&&step>1?'kick':'slash',a=attack(f,step,move);a.elapsed=a.impact;
 const p=contactMotion(f,2),expected=move==='kick'?closeMotion('kick',2,step):heroMotion(id,step,2);
 for(const key of Object.keys(expected) as (keyof typeof expected)[])assert(Math.abs(p[key]-expected[key])<1e-8);
 assert(planted(f));a.elapsed=a.duration;assert.equal(contactMotion(f,4).lean,move==='kick'?closeMotion('kick',4,step).lean:heroMotion(id,step,4).lean);
 f.z=30;assert(!planted(f));f.z=0;f.mounted=true;assert(!planted(f));
});
for(const step of [1,2,3])test(`bow ${step}: string releases at impact, arrow tip matches planted torso in both directions`,()=>{
 const f=new Campaign('huangzhong').hero,a=attack(f,step);a.elapsed=a.impact-1e-6;assert(bowDraw(f)>14);a.elapsed=a.impact;assert.equal(bowDraw(f),0);
 const p=contactMotion(f,2),ang=p.lean*Math.PI/180;
 for(const face of [-1,1]){const v=groundArrowVisual(face,step),x=p.x+47,y=p.y-5+32+p.crouch;
 assert(Math.abs(v.drawOffsetX+face*20-(x*Math.cos(ang)-y*Math.sin(ang))*1.12*face)<1e-8);
 assert(Math.abs(v.drawHeight-(-(-32+x*Math.sin(ang)+y*Math.cos(ang))*1.12))<1e-8);}
});
test('Wei Yan knee and heel reach full extension at contact and fold back, without adding a second support leg',()=>{
 const f=new Campaign('weiyan').hero,a=attack(f,2,'kick');assert.equal(attackExtension(f),0);a.elapsed=a.impact;assert.equal(attackExtension(f),1);a.elapsed=a.duration;assert.equal(attackExtension(f),0);
});
for(const id of ['zhaoyun','huangzhong','lubu'] as const)test(`${id}: special poses have no discontinuity around each damage pulse`,()=>{
 const f=new Campaign(id).hero,a=attack(f,1,'special'),pose=id==='lubu'?vanguardSpecialPose:rangedSpecialPose;
 for(const t of DUEL_SPECIAL_TIMES[id]){a.elapsed=t-1e-6;const before=pose(f);a.elapsed=t+1e-6;const after=pose(f);for(const key of ['x','y','angle','lean'] as const)assert(Math.abs(before[key]-after[key])<.02);}
});
test('all heroes have individual normal/grapple palettes and mirrored grasp coordinates',()=>{
 for(const id of HERO_IDS){assert(HAND_PALETTES[id]);const f=new Campaign(id).hero;assert(planted(f));for(const face of [-1,1]){const p=localContact(450,355,400,412,.4,1.12*face,1.12);assert(Number.isFinite(p.x));assert(Number.isFinite(p.y));}}
 assert.equal(HAND_PALETTES.huangzhong.skin,0xbd956b);assert.equal(HAND_PALETTES.guanyu.skin,0xc28a59);assert.equal(HAND_PALETTES.zhangfei.skin,0xb67a50);
});
for(const kind of INFANTRY)test(`${kind}: rendered attack/recoil/captive poses stay finite and restore graphics`,()=>{
 const m=new Campaign(),f=m.fighter(kind,400,412);f.attack={move:kind==='archer'?'shot':kind==='spearman'?'thrust':'slash',elapsed:0,impact:.6,duration:1.1,face:1,x:400,y:412,hit:false};
 let depth=0;const commands:string[]=[];const g=new Proxy({},{get:(_,key)=>(...args:unknown[])=>{commands.push(String(key));if(key==='fillCircle'&&Number(args[2])>10)commands.push('mace');for(const n of args)if(typeof n==='number')assert(Number.isFinite(n));if(key==='save')depth++;if(key==='restore')depth--;assert(depth>=0);return g;}});
 for(const t of [0,.3,.6,1.1]){f.attack.elapsed=t;const p=infantryPose(f);assert(!p.captive);(kind==='brute'||kind==='mauler'?drawHeavyInfantry:drawSwordSoldier)(g as never,f,1);assert.equal(depth,0);}
 f.grapplePose='held';assert(infantryPose(f).captive);commands.length=0;(kind==='brute'||kind==='mauler'?drawHeavyInfantry:drawSwordSoldier)(g as never,f,1);assert.equal(depth,0);
 if(kind==='mauler')assert(!commands.includes('mace'),'captive mace must be stowed');
});
test('archer visual release starts at the rendered bow, including left facing',()=>{
 for(const face of [-1,1]){const m=new Campaign(),f=m.fighter('archer',400,412);f.face=face;f.attack={move:'shot',elapsed:.6,impact:.6,duration:1.1,hit:true,face,x:400,y:412};const v=infantryArrowVisual(f);assert(Math.abs(v.x-400-face*72*1.12)<1e-8);assert(Math.abs(v.y-(412-43*1.12))<1e-8);}
});
