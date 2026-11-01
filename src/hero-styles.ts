import type {HeroId} from './heroes.ts';
/** Step timing and situational mechanics, independent of pickup weapons and mounts. */
export const HERO_STYLES:Record<HeroId,{comboWindow:number;grabReach:number;grabDamage:number;airSteer:number;landing:number}>={
 guanyu:{comboWindow:850,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
 zhangfei:{comboWindow:650,grabReach:54,grabDamage:11,airSteer:.65,landing:.12},
 zhaoyun:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.9,landing:.05},
 huangzhong:{comboWindow:650,grabReach:36,grabDamage:7,airSteer:.65,landing:.12},
 weiyan:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
 lubu:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
};
const BOW_STRIKES=[
 {name:'弓梢點擊',duration:.30,impact:.10,damage:14,reach:72,push:24,depth:30},
 {name:'橫弓攔截',duration:.34,impact:.14,damage:17,reach:78,push:32,depth:38},
 {name:'落弓震退',duration:.46,impact:.20,damage:24,reach:90,push:50,depth:42},
];
export const BOW_STRIKE=BOW_STRIKES[0];
export function bowStrike(step:number){return BOW_STRIKES[Math.max(0,Math.min(2,step-1))];}
