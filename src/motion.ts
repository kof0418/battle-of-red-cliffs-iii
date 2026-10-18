import type { HeroId } from './heroes.ts';
/** Five impact-aligned poses: preparation, wind-up, contact, follow-through, recovery. */
const MOTION:Record<HeroId,{x:number[];y:number[];lean:number[]}>={
 guanyu:{x:[6,10,32,37,17],y:[-63,-57,-33,-20,-40],lean:[-8,-5,10,13,0]},
 zhangfei:{x:[1,6,29,35,15],y:[-65,-68,-25,-17,-40],lean:[-12,-8,17,12,0]},
 zhaoyun:{x:[4,0,43,33,17],y:[-39,-39,-38,-38,-40],lean:[-7,-10,16,9,0]},
 huangzhong:{x:[15,19,20,18,17],y:[-41,-41,-40,-40,-40],lean:[-2,-7,3,1,0]},
 weiyan:{x:[2,5,34,24,17],y:[-26,-22,-44,-54,-40],lean:[-13,-9,19,8,0]},
};
export function attackPhase(elapsed:number,impact:number,duration:number){
 if(elapsed<impact*.5)return 0;if(elapsed<impact)return 1;
 if(elapsed<impact+(duration-impact)*.25)return 2;
 if(elapsed<impact+(duration-impact)*.65)return 3;return 4;
}
export function heroMotion(id:HeroId,combo:number,phase:number){
 const p=Math.max(0,Math.min(4,phase)),m=MOTION[id];
 const lift=combo===2&&id!=='huangzhong'?(p===2?-14:p===3?-8:0):0;
 return {x:m.x[p],y:m.y[p]+lift,lean:m.lean[p]*(combo===3?1.2:1),phase:p};
}
