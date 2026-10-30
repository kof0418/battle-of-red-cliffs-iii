import type { Input } from './combat.ts';
/** Preserve ordered button edges during a shared hit-stop, independently per player. */
export class HitStopInput {
 private pending: Input[] = [];
 clear(){this.pending=[];}
 read(input:Input,frozen:boolean):Input {
  const action=!!(input.attack||input.grappleAttack||input.jump||input.dodge||input.special||input.horseSpecial||input.dropWeapon);
  if(!frozen&&!this.pending.length)return input;
  if(action&&this.pending.length<4){
   const {partner,...press}=input;
   this.pending.push({...press,comboY:input.comboY??input.y,throwX:input.throwX??input.x});
  }
  if(frozen)return {x:input.x,y:input.y};
  return this.pending.shift()??input;
 }
}
/** Close overlapping bodies retain their facing instead of requiring a positive dot product. */
export function approachingGrab(dx:number,dy:number,x:number,y:number){
 return !!(x||y)&&((Math.abs(dx)<=8&&Math.abs(dy)<=8)||dx*x+dy*y>0);
}
