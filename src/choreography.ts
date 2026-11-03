import type {Fighter} from './combat.ts';
import {heroMotion,closeMotion} from './motion.ts';
import {DUEL_SPECIAL_TIMES} from './duel-forms.ts';
export const articulatedHero=(f:Fighter)=>f.kind==='hero'&&!!f.heroId;
const ease=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
/** Contact is an explicit keyframe at the combat impact, independent of render FPS. */
export function contactMotion(f:Fighter,phase:number){
 const a=f.attack!;
 const pose=(n:number)=>a.move==='kick'||a.move==='bow-strike'?closeMotion(a.move,n,f.step):heroMotion(f.heroId!,f.step,n);
 if(!articulatedHero(f)||f.mounted||f.equipped||!['slash','kick','bow-strike'].includes(a.move))return pose(phase);
 const t=a.elapsed,i=a.impact,d=a.duration,follow=i+(d-i)*.25,recover=i+(d-i)*.65;
 const marks=[0,i*.5,i,follow,recover,d];
 const poses=[pose(0),pose(1),pose(2),pose(3),pose(4),pose(4)];
 let k=0;while(k<4&&t>marks[k+1])k++;
 const u=ease((t-marks[k])/(marks[k+1]-marks[k])),from=poses[k],to=poses[k+1];
 return {x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u,angle:from.angle+(to.angle-from.angle)*u,lean:from.lean+(to.lean-from.lean)*u,stride:from.stride+(to.stride-from.stride)*u,crouch:from.crouch+(to.crouch-from.crouch)*u,phase};
}
/** Keep the support foot on the lane; only the body above the belt rotates. */
export function planted(f:Fighter){return articulatedHero(f)&&!f.mounted&&f.z===0&&!f.dodge&&(!f.grapplePose||['hold','lift','throw'].includes(f.grapplePose)&&!f.grappleSpin)&&!(f.knockdown??0)&&f.hp>0&&f.attack?.move!=='special';}
export function waistLean(f:Fighter,lean:number){return (f.throwRecovery??0)>0?0:f.stun>0?-12*Math.min(1,f.stun/.12):lean;}
export function poleRearHand(x:number,y:number,angle:number){return {x:x-22*Math.sin(angle),y:y+22*Math.cos(angle)};}
export function specialBeat(f:Fighter){
 const times=DUEL_SPECIAL_TIMES[f.heroId!],t=f.attack!.elapsed;
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

/** Limb extension reaches one at contact, then folds back during recovery. */
export function attackExtension(f:Fighter){
 const a=f.attack;if(!a)return 0;
 if(a.elapsed<a.impact)return ease(a.elapsed/a.impact);
 return 1-ease((a.elapsed-a.impact)/(a.duration-a.impact));
}
export function bowDraw(f:Fighter){
 const a=f.attack,pull=f.step===3?36:f.step===2?15:20;
 if(!a)return 6;
 if(a.elapsed<a.impact)return pull*(.4+.6*ease(a.elapsed/a.impact));
 return 6*ease((a.elapsed-a.impact)/(a.duration-a.impact));
}
export type ActionPose=ReturnType<typeof heroMotion>;
/** Named action keys keep successive special contacts continuous instead of resetting each pulse. */
export function keyedPose(t:number,keys:readonly {at:number;pose:ActionPose}[]):ActionPose{
 let k=0;while(k<keys.length-2&&t>keys[k+1].at)k++;
 const a=keys[k],b=keys[k+1],u=ease((t-a.at)/(b.at-a.at));
 return {x:a.pose.x+(b.pose.x-a.pose.x)*u,y:a.pose.y+(b.pose.y-a.pose.y)*u,lean:a.pose.lean+(b.pose.lean-a.pose.lean)*u,angle:a.pose.angle+(b.pose.angle-a.pose.angle)*u,stride:a.pose.stride+(b.pose.stride-a.pose.stride)*u,crouch:a.pose.crouch+(b.pose.crouch-a.pose.crouch)*u,phase:t<b.at?a.pose.phase:b.pose.phase};
}

/** Two fixed-length arm segments, with a bent elbow and a bounded hand target. */
export function gripArm(sx:number,sy:number,tx:number,ty:number,bend=1){
 const dx=tx-sx,dy=ty-sy,d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,43),ux=dx/d,uy=dy/d;
 const x=sx+ux*reach,y=sy+uy*reach,offset=Math.sqrt(22*22-reach*reach/4);
 return {x,y,elbowX:sx+ux*reach/2-uy*offset*bend,elbowY:sy+uy*reach/2+ux*offset*bend};
}

/** Inverse of waistPoint: grip contacts use the same hip pivot as the drawn torso. */
export function unwaistPoint(x:number,y:number,lean:number,crouch:number){
 const a=lean*Math.PI/180,dy=y+32;
 return {x:x*Math.cos(a)+dy*Math.sin(a),y:-x*Math.sin(a)+dy*Math.cos(a)-32-crouch};
}
/** Follow the release direction briefly, then fold both arms back to guard. */
export function releaseHand(point:{x:number;y:number},flight:number,back=false){
 const p=Math.max(0,Math.min(1,flight)),ease=(n:number)=>n*n*(3-2*n),u=ease(Math.min(1,p/.22)),v=ease(Math.max(0,(p-.22)/.78));
 return {x:(point.x+(back?-9:9)*u)*(1-v)+20*v,y:(point.y+10*u)*(1-v)-48*v};
}
