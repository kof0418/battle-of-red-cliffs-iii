import {HEROES,type HeroId} from './heroes.ts';
export type Stance='original'|'classic';
export const STANCE_NAMES={original:'原創兵器',classic:'經典步戰'};
export const TECHNIQUES:Record<HeroId,string>={
 guanyu:'橫江掃接挑月斬、斷岳劈；橫掃較寬，背摔控場。',
 zhangfei:'猛虎直刺接回身撞軍、震地砸；抓打舉人接旋轉重摔。',
 zhaoyun:'跳攻命中後，再按一次攻擊可接俯衝補擊，每跳最多兩擊。',
 huangzhong:'近身弓擊命中可後撤；跳攻短刃，遠處箭矢依命中累進。',
 weiyan:'第二段膝踢可接第三段腳刀，命中後可接必殺或抓取。',
 lubu:'保持距離以畫戟刃尖命中，第二段刃尖可破盾。',
};
const CLASSIC={
 guanyu:{weapon:'徒手拳掌',style:'拳掌',title:'赤膽重拳',reach:.85,tempo:.97,moves:['推山掌','挑心肘','斷鎧落掌']},
 zhangfei:{weapon:'徒手擒拿',style:'擒拿',title:'虎掌擒軍',reach:.78,tempo:1.02,moves:['猛虎直拳','回身勾拳','雙拳撼地']},
 zhaoyun:{weapon:'隨身長劍',style:'長劍',title:'白龍劍影',reach:1,tempo:.90,moves:['疾劍','挑鋒','白龍斬']},
} as const;
/** Mounted and pickup weapons use their own combat data and drawing. */
export function heroLoadout(id:HeroId,stance:Stance='original'){
 const classic=stance==='classic'&&id in CLASSIC?CLASSIC[id as keyof typeof CLASSIC]:{};
 return {...HEROES[id],...classic};
}
export function classicUnarmed(f:{heroId?:HeroId;stance?:Stance;mounted?:boolean;equipped?:unknown}){return f.stance==='classic'&&!f.mounted&&!f.equipped&&(f.heroId==='guanyu'||f.heroId==='zhangfei');}
export function bladeTip(id:HeroId,move:string,step:number,weapon:unknown,mounted:boolean|undefined,dx:number){
 return id==='lubu'&&!weapon&&!mounted&&move==='slash'&&step>=2&&dx>=110;
}
