import type {Fighter,Kind} from './combat.ts';
export const INFANTRY=['soldier','raider','heavy','archer','spearman','hammer','thrower','brute','mauler'] as const;
export const isInfantry=(kind:Kind)=>INFANTRY.some(k=>k===kind);
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
/** Each weapon has a distinct anticipation/contact/recovery, tied to its actual attack. */
export function infantryPose(f:Fighter){
 const a=f.attack,captive=!!f.grapplePose;
 const rest={x:19,y:-43,angle:-.8,lean:0,captive};
 if(captive)return {...rest,x:15,y:-29,angle:1.8};
 if(f.stun>0)return {...rest,x:5,y:-30,angle:1.4,lean:-10*Math.min(1,f.stun/.12)};
 if(!a)return rest;
 const heavy=f.kind==='hammer'||f.kind==='mauler',bow=f.kind==='archer',spear=f.kind==='spearman',pot=f.kind==='thrower',fist=f.kind==='brute';
 const wind=heavy?{x:2,y:-83,angle:-1.7,lean:-9}:spear?{x:-6,y:-46,angle:0,lean:-12}:bow?{x:22,y:-43,angle:0,lean:-5}:pot?{x:-3,y:-85,angle:-1.5,lean:-10}:fist?{x:10,y:-65,angle:0,lean:-7}:{x:5,y:-66,angle:-2.2,lean:-8};
 const hit=heavy?{x:29,y:-58,angle:.55,lean:12}:spear?{x:42,y:-43,angle:0,lean:12}:bow?{x:25,y:-43,angle:0,lean:0}:pot?{x:35,y:-64,angle:.2,lean:11}:fist?{x:46,y:-52,angle:0,lean:10}:{x:30,y:-43,angle:0,lean:9};
 let from:{x:number;y:number;angle:number;lean:number}=rest,to=wind,u=0;
 if(a.elapsed<a.impact*.65)u=smooth(a.elapsed/(a.impact*.65));
 else if(a.elapsed<a.impact){from=wind;to=hit;u=smooth((a.elapsed-a.impact*.65)/(a.impact*.35));}
 else{from=hit;to=rest;u=smooth(((a.elapsed-a.impact)/(a.duration-a.impact)-.2)/.8);}
 return {x:from.x+(to.x-from.x)*u,y:from.y+(to.y-from.y)*u,angle:from.angle+(to.angle-from.angle)*u,lean:from.lean+(to.lean-from.lean)*u,captive:false};
}
export function enemyBowDraw(f:Fighter){const a=f.attack;return !a?5:a.elapsed<a.impact?8+18*smooth(a.elapsed/a.impact):5*smooth((a.elapsed-a.impact)/(a.duration-a.impact));}
/** Drawn arrow tip at release, including torso pivot and actor scale; lane collision is unchanged. */
export function infantryArrowVisual(f:Fighter){
 const p=infantryPose({...f,attack:f.attack?{...f.attack,elapsed:f.attack.impact}:null}),a=p.lean*Math.PI/180;
 const x=p.x+47,y=p.y+30;
 return {x:f.x+(x*Math.cos(a)-y*Math.sin(a))*1.12*f.face,y:f.y-f.z+(-30+x*Math.sin(a)+y*Math.cos(a))*1.12};
}
