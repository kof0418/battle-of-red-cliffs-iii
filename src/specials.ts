import type {HeroId} from './heroes.ts';
// No resource meter: duration plus a short recovery prevents invulnerability loops.
export const SPECIAL_COST=0,SPECIAL_COOLDOWN=1.05;
export const SPECIALS={
 lubu:{name:'無雙裂陣',description:'橫戟掃陣、回身斬，最後舉戟重砸震退周圍',damage:27,reach:155,depth:62,push:13,color:0xf4b777},
 guanyu:{name:'斷鎧擊',description:'旋身上挑重拳，三段勁氣掃開周圍',damage:24,reach:135,depth:58,push:12,color:0x98e0ab},
 zhangfei:{name:'粉碎拳',description:'兩次向前重拳，最後踏地爆發震退周圍',damage:28,reach:105,depth:74,push:9,color:0xf0bd74},
 zhaoyun:{name:'飛翔劍',description:'躍身向前飛撲，三段斬擊貫穿同路線',damage:23,reach:180,depth:24,push:12,color:0xb7e9ff},
 huangzhong:{name:'斬斷弓',description:'以弓身旋轉，三段近身掃擊前後敵人',damage:20,reach:125,depth:60,push:8,color:0xffdf91},
 weiyan:{name:'斬馬蹴',description:'收刀翻身，連續上挑腳刀，前方近身三段命中',damage:26,reach:120,depth:40,push:10,color:0xff9b9b},
} as const;
export function specialHits(id:HeroId,x:number,y:number,face:number,tx:number,ty:number,z=0,pulse=2){
 const s=SPECIALS[id];if(z>60)return false;
 if(id==='zhangfei'&&pulse<2)return (tx-x)*face>=-8&&(tx-x)*face<=s.reach&&Math.abs(ty-y)<=30;
 if(id==='lubu'||id==='guanyu'||id==='zhangfei'||id==='huangzhong')return Math.hypot((tx-x)/s.reach,(ty-y)/s.depth)<=1;
 return (tx-x)*face>=-10&&(tx-x)*face<=s.reach&&Math.abs(ty-y)<=s.depth;
}
