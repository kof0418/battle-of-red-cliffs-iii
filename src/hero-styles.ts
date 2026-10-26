import type {HeroId} from './heroes.ts';
/** Step timing and situational mechanics, independent of pickup weapons and mounts. */
export const HERO_STYLES:Record<HeroId,{comboWindow:number;grabReach:number;grabDamage:number;airSteer:number;landing:number}>={
 guanyu:{comboWindow:850,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
 zhangfei:{comboWindow:650,grabReach:54,grabDamage:11,airSteer:.65,landing:.12},
 zhaoyun:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.9,landing:.05},
 huangzhong:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
 weiyan:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
 lubu:{comboWindow:650,grabReach:44,grabDamage:7,airSteer:.65,landing:.12},
};
export const BOW_STRIKE={duration:.30,impact:.10,damage:14,reach:72,push:38};
