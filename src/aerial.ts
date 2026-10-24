import type {HeroId} from './heroes.ts';
/** A dedicated descending attack: one contact per jump, no ground-combo progression. */
export const AERIALS:Record<HeroId,{name:string;damage:number;reach:number;push:number}>={
 guanyu:{name:'青龍落斬',damage:26,reach:112,push:38},
 zhangfei:{name:'猛虎墜擊',damage:31,reach:88,push:48},
 zhaoyun:{name:'銀龍俯刺',damage:23,reach:126,push:28},
 huangzhong:{name:'落雁弓擊',damage:21,reach:85,push:32},
 weiyan:{name:'赤刃飛斬',damage:24,reach:92,push:25},
 lubu:{name:'畫戟落劈',damage:30,reach:132,push:42},
};
export function descendingContact(z:number,vz:number){return z<=54&&vz<0;}
