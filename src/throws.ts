import type {HeroId} from './heroes.ts';
export const THROWS:Record<HeroId,{name:string;damage:number;distance:number}>={
 lubu:{name:'飛將摔軍',damage:62,distance:207},
 guanyu:{name:'偃月背摔',damage:55,distance:180},zhangfei:{name:'霸王抱摔',damage:66,distance:198},
 zhaoyun:{name:'飛燕迴摔',damage:52,distance:216},huangzhong:{name:'翻弓過肩摔',damage:50,distance:162},weiyan:{name:'旋身倒摔',damage:58,distance:189},
};
export interface Grapple {mounted?:boolean;target:number;hits:number;deadline:number;started:number;phase:'hold'|'jump'|'throw';elapsed:number;direction:number;air:boolean;startX:number;startZ:number;back?:boolean;facing?:number;jumpDirection?:number;collisions?:number[];}

/** Heavy bodies take longer to lift; distance remains the hero's established throw distance. */
export function throwWeight(kind:string){
 const boss=['boss','marshal','hunter','frostlord','regent','bridgeguard','bridgearcher','admiral','firelord','pursuer','warlord'].includes(kind);
 return boss?{lift:.24,flight:.48,height:56,jump:60,fall:.42}:['heavy','brute','mauler','hammer'].includes(kind)?{lift:.21,flight:.45,height:64,jump:68,fall:.38}:{lift:.18,flight:.42,height:72,jump:78,fall:.34};
}
export function bossGrabWindow(attack:{elapsed:number;impact:number;hit:boolean}|null|undefined){
 return !attack?'idle':attack.hit&&attack.elapsed>=attack.impact+.18?'recovery':!attack.hit&&attack.elapsed<attack.impact-.12?'windup':'unsafe';
}
type BodyPoint={x:number;y:number;z:number};
/** Swept body capsule prevents tunnelling and rejects targets outside the actual flight path. */
export function sweptThrowContact(from:BodyPoint,to:BodyPoint,target:BodyPoint){
 const delta=[(to.x-from.x)/24,(to.y-from.y)/26,(to.z-from.z)/90];
 const offset=[(target.x-from.x)/24,(target.y-from.y)/26,(target.z-from.z)/90];
 const length=delta.reduce((sum,v)=>sum+v*v,0);
 const t=length?Math.max(0,Math.min(1,delta.reduce((sum,v,i)=>sum+v*offset[i],0)/length)):0;
 return offset.reduce((sum,v,i)=>sum+(v-delta[i]*t)**2,0)<=1;
}

/** Agile low release and deliberate shoulder roll use different trajectories. */
export function groundThrowWeight(id:HeroId,kind:string){
 const w=throwWeight(kind);
 if(id==='weiyan')return {...w,lift:.14,flight:.38,height:w.height*.65};
 if(id==='lubu')return {...w,lift:.25,flight:.46,height:w.height+34};
 if(id==='zhaoyun')return {...w,lift:w.lift*.8,flight:.40,height:w.height*.75};
 if(id==='huangzhong')return {...w,lift:.20,flight:.45,height:w.height+12};
 return w;
}
