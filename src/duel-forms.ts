import type {HeroId} from './heroes.ts';
export function isDuelHero(id:HeroId|undefined){return id==='guanyu'||id==='zhangfei';}
const FORMS={
 guanyu:[
  {name:'橫江掃',duration:.30,impact:.10,damage:17,reach:100,push:10,depth:34},
  {name:'挑月斬',duration:.36,impact:.13,damage:21,reach:110,push:12,depth:24},
  {name:'斷岳劈',duration:.56,impact:.25,damage:34,reach:136,push:75,depth:38},
 ],
 zhangfei:[
  {name:'猛虎直刺',duration:.28,impact:.075,damage:22,reach:100,push:6,depth:24},
  {name:'回身撞軍',duration:.34,impact:.12,damage:27,reach:100,push:12,depth:34},
  {name:'震地砸',duration:.60,impact:.23,damage:44,reach:116,push:85,depth:52},
 ],
} as const;
export function duelForm(id:HeroId,step:number){
 if(!isDuelHero(id))return undefined;
 const f=FORMS[id as keyof typeof FORMS][Math.max(0,Math.min(2,step-1))];
 return f;
}
/** Guan Yu cuts across lanes; Zhang Fei opens with a narrow thrust, then a close ground burst. */
export function duelHits(id:HeroId,step:number,x:number,y:number,face:number,tx:number,ty:number,reach:number){
 const f=duelForm(id,step)!;const dx=(tx-x)*face,dy=Math.abs(ty-y);
 if(id==='zhangfei'&&step===3)return dx>=-16&&Math.hypot(Math.max(0,dx)/reach,dy/f.depth)<=1;
 return dx>=-12&&dx<=reach&&dy<=f.depth;
}
export const DUEL_SPECIAL_TIMES={guanyu:[.16,.36,.57],zhangfei:[.10,.29,.61]};
