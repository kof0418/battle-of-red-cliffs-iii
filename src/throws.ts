import type {HeroId} from './heroes.ts';
export const THROWS:Record<HeroId,{name:string;damage:number;distance:number;spin:number}>={
 guanyu:{name:'偃月背摔',damage:55,distance:150,spin:240},zhangfei:{name:'霸王抱摔',damage:66,distance:165,spin:180},
 zhaoyun:{name:'飛燕迴摔',damage:52,distance:175,spin:360},huangzhong:{name:'翻弓過肩摔',damage:50,distance:140,spin:220},weiyan:{name:'旋身倒摔',damage:58,distance:160,spin:320},
};
export interface Grapple {target:number;hits:number;deadline:number;started:number;phase:'hold'|'jump'|'throw';elapsed:number;direction:number;air:boolean;startX:number;startZ:number;}
