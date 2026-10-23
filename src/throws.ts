import type {HeroId} from './heroes.ts';
export const THROWS:Record<HeroId,{name:string;damage:number;distance:number}>={
 lubu:{name:'飛將摔軍',damage:62,distance:207},
 guanyu:{name:'偃月背摔',damage:55,distance:180},zhangfei:{name:'霸王抱摔',damage:66,distance:198},
 zhaoyun:{name:'飛燕迴摔',damage:52,distance:216},huangzhong:{name:'翻弓過肩摔',damage:50,distance:162},weiyan:{name:'旋身倒摔',damage:58,distance:189},
};
export interface Grapple {target:number;hits:number;deadline:number;started:number;phase:'hold'|'jump'|'throw';elapsed:number;direction:number;air:boolean;startX:number;startZ:number;jumpDirection?:number;collisions?:number[];}
