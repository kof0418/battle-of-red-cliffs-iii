import {type HeroId} from './heroes.ts';
export const TECHNIQUES:Record<HeroId,string>={
 guanyu:'橫江掃接挑月斬、斷岳劈；橫掃較寬，背摔控場。',
 zhangfei:'猛虎直刺接回身撞軍、震地砸；抓打舉人接旋轉重摔。',
 zhaoyun:'疾刺、挑槍、迴龍掃；跳攻命中可再按攻擊俯衝補擊。',
 huangzhong:'定弦、低姿追矢、滿弓貫穿；近身三段弓擊，跳攻短刃。',
 weiyan:'赤刃斜切接突膝、旋踵腳刀；翻身腳刀必殺，低身快速旋摔。',
 lubu:'橫戟、長刺、重砸；第二段刃尖破盾加成，必殺回斬接震地。',
};
export function bladeTip(id:HeroId,move:string,step:number,weapon:unknown,mounted:boolean|undefined,dx:number){
 return id==='lubu'&&!weapon&&!mounted&&move==='slash'&&step>=2&&dx>=110;
}
