import type {Fighter} from './combat.ts';
import {heroMotion} from './motion.ts';
import {DUEL_SPECIAL_TIMES} from './duel-forms.ts';
export const sampleHero=(f:Fighter)=>f.kind==='hero'&&(f.heroId==='guanyu'||f.heroId==='zhangfei');
const ease=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
/** Contact is an explicit keyframe at the combat impact, independent of render FPS. */
export function contactMotion(f:Fighter,phase:number){
 const a=f.attack!;
 if(!sampleHero(f)||f.mounted||f.equipped||a.move!=='slash')return heroMotion(f.heroId!,f.step,phase);
 const t=a.elapsed,i=a.impact,d=a.duration,follow=i+(d-i)*.25,recover=i+(d-i)*.65;
 const marks=[0,i*.5,i,follow,recover,d];
 const poses=[heroMotion(f.heroId!,f.step,0),heroMotion(f.heroId!,f.step,1),heroMotion(f.heroId!,f.step,2),heroMotion(f.heroId!,f.step,3),heroMotion(f.heroId!,f.step,4),heroMotion(f.heroId!,f.step,4)];
 let k=0;while(k<4&&t>marks[k+1])k++;
 const u=ease((t-marks[k])/(marks[k+1]-marks[k])),from=poses[k],to=poses[k+1];
 return {x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u,angle:from.angle+(to.angle-from.angle)*u,lean:from.lean+(to.lean-from.lean)*u,stride:from.stride+(to.stride-from.stride)*u,crouch:from.crouch+(to.crouch-from.crouch)*u,phase};
}
/** Keep the support foot on the lane; only the body above the belt rotates. */
export function planted(f:Fighter){return sampleHero(f)&&!f.mounted&&f.z===0&&!f.dodge&&!f.grapplePose&&!(f.knockdown??0)&&f.hp>0&&f.attack?.move!=='special';}
export function waistLean(f:Fighter,lean:number){return f.stun>0?-12*Math.min(1,f.stun/.12):(f.throwRecovery??0)>0?8:lean;}
export function poleRearHand(x:number,y:number,angle:number){return {x:x-22*Math.sin(angle),y:y+22*Math.cos(angle)};}
export function specialBeat(f:Fighter){
 const times=DUEL_SPECIAL_TIMES[f.heroId as 'guanyu'|'zhangfei'],t=f.attack!.elapsed;
 let beat=times.findIndex(n=>t<n+.12);if(beat<0)beat=2;
 const impact=times[beat],start=beat?times[beat-1]+.055:0;
 const active=t>=impact;
 return {beat,amount:active?1-Math.min(1,(t-impact)/.16):ease((t-start)/(impact-start)),active:active&&t<impact+.12};
}
/** Convert a world-space contact point into a mirrored/rotated actor's local canvas. */
export function localContact(x:number,y:number,originX:number,originY:number,angle:number,scaleX:number,scaleY:number){
 const dx=x-originX,dy=y-originY,c=Math.cos(angle),s=Math.sin(angle);
 return {x:(dx*c+dy*s)/scaleX,y:(-dx*s+dy*c)/scaleY};
}
