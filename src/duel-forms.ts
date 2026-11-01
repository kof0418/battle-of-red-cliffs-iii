import type {HeroId} from './heroes.ts';
export function isDuelHero(id:HeroId|undefined){return id==='guanyu'||id==='zhangfei'||id==='zhaoyun'||id==='huangzhong'||id==='weiyan'||id==='lubu';}
const FORMS={
 weiyan:[
  {name:'赤刃斜切',duration:.25,impact:.08,damage:18,reach:78,push:7,depth:24},
  {name:'突膝破軍',duration:.27,impact:.095,damage:23,reach:80,push:8,depth:22},
  {name:'旋踵腳刀',duration:.38,impact:.14,damage:32,reach:92,push:48,depth:32},
 ],
 lubu:[
  {name:'裂陣橫戟',duration:.36,impact:.13,damage:23,reach:142,push:9,depth:36},
  {name:'轅門穿鋒',duration:.42,impact:.17,damage:29,reach:164,push:13,depth:20},
  {name:'崩岳重戟',duration:.60,impact:.23,damage:42,reach:160,push:82,depth:42},
 ],
 guanyu:[
  {name:'橫江拳',duration:.30,impact:.10,damage:17,reach:100,push:10,depth:34},
  {name:'挑月肘',duration:.36,impact:.13,damage:21,reach:110,push:12,depth:24},
  {name:'斷岳重拳',duration:.56,impact:.25,damage:34,reach:136,push:75,depth:38},
 ],
 zhangfei:[
  {name:'猛虎直拳',duration:.28,impact:.075,damage:22,reach:100,push:6,depth:24},
  {name:'回身撞軍',duration:.34,impact:.12,damage:27,reach:100,push:12,depth:34},
  {name:'震地砸',duration:.60,impact:.23,damage:44,reach:116,push:85,depth:52},
 ],
 zhaoyun:[
  {name:'白龍疾劍',duration:.25,impact:.08,damage:14,reach:120,push:10,depth:18},
  {name:'挑雲劍',duration:.32,impact:.12,damage:18,reach:128,push:15,depth:26},
  {name:'迴龍斬',duration:.48,impact:.18,damage:29,reach:148,push:60,depth:38},
 ],
 huangzhong:[
  {name:'定弦矢',duration:.30,impact:.14,damage:14,reach:320,push:10,depth:22},
  {name:'低姿追矢',duration:.34,impact:.12,damage:17,reach:360,push:15,depth:22},
  {name:'滿弓貫日',duration:.52,impact:.22,damage:27,reach:420,push:35,depth:22},
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
export const DUEL_SPECIAL_TIMES={guanyu:[.16,.36,.57],zhangfei:[.10,.29,.61],zhaoyun:[.14,.32,.54],huangzhong:[.12,.35,.60],weiyan:[.12,.34,.60],lubu:[.20,.43,.70]};
