import type {HeroId} from './heroes.ts';
// No resource meter: duration plus a short recovery prevents invulnerability loops.
export const SPECIAL_COST=0,SPECIAL_COOLDOWN=1.05;
export const SPECIALS={
 lubu:{name:'無雙裂陣',description:'畫戟三段橫掃，震退周圍敵軍',damage:27,reach:155,depth:62,push:13,color:0xf4b777},
 guanyu:{name:'昇龍迴旋斬',description:'旋身挑刀上斬，三段刀光掃開周圍',damage:24,reach:135,depth:58,push:12,color:0x98e0ab},
 zhangfei:{name:'直拳體爆',description:'兩次向前重拳，最後踏地爆發震退周圍',damage:28,reach:105,depth:74,push:9,color:0xf0bd74},
 zhaoyun:{name:'飛撲劍斬',description:'躍身向前飛撲，三段斬擊貫穿同路線',damage:23,reach:180,depth:32,push:12,color:0xb7e9ff},
 huangzhong:{name:'回轉弓',description:'以弓身旋轉，三段近身掃擊前後敵人',damage:20,reach:125,depth:60,push:8,color:0xffdf91},
 weiyan:{name:'翻身腳刀',description:'翻身踢出腳刀，三段近身上挑',damage:26,reach:120,depth:40,push:10,color:0xff9b9b},
} as const;
export function specialHits(id:HeroId,x:number,y:number,face:number,tx:number,ty:number,z=0,pulse=2){
 const s=SPECIALS[id];if(z>60)return false;
 if(id==='zhangfei'&&pulse<2)return (tx-x)*face>=-8&&(tx-x)*face<=s.reach&&Math.abs(ty-y)<=30;
 if(id==='lubu'||id==='guanyu'||id==='zhangfei'||id==='huangzhong')return Math.hypot((tx-x)/s.reach,(ty-y)/s.depth)<=1;
 return (tx-x)*face>=-10&&(tx-x)*face<=s.reach&&Math.abs(ty-y)<=s.depth;
}
