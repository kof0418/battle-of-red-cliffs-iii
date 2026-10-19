import type {HeroId} from './heroes.ts';
export const SPECIAL_COST=12, SPECIAL_COOLDOWN=8;
export const SPECIALS={
 guanyu:{name:'青龍迴天',description:'迴旋長刀，掃開身前身後的敵人',damage:66,reach:150,depth:65,push:85,color:0x98e0ab},
 zhangfei:{name:'雷震長坂',description:'震地怒喝，重創周圍並強力擊退',damage:82,reach:115,depth:90,push:110,color:0xf0bd74},
 zhaoyun:{name:'銀龍穿陣',description:'向前長距離穿刺，貫穿同一路線',damage:74,reach:320,depth:30,push:45,color:0xb7e9ff},
 huangzhong:{name:'百步流星',description:'射出扇形箭陣，遠距離覆蓋多條路線',damage:58,reach:440,depth:105,push:25,color:0xffdf91},
 weiyan:{name:'赤刃斷空',description:'近身向前斬擊，集中高傷害',damage:100,reach:125,depth:43,push:60,color:0xff9b9b},
} as const;
export function specialHits(id:HeroId,x:number,y:number,face:number,tx:number,ty:number,z=0){
 const s=SPECIALS[id],dx=(tx-x)*face,dy=Math.abs(ty-y);
 if(z>38)return false;
 if(id==='guanyu'||id==='zhangfei')return Math.hypot((tx-x)/s.reach,(ty-y)/s.depth)<=1;
 return dx>=-10&&dx<=s.reach&&dy<=(id==='huangzhong'?20+Math.max(0,dx)/s.reach*(s.depth-20):s.depth);
}
