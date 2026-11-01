import type {Attack,Kind} from './combat.ts';
export const BOSS_GUIDES:Partial<Record<Kind,{name:string;style:string;counter:string;opening:number}>>={
 boss:{name:'鐵獄',style:'近身重砸／直線突進',counter:'換線躲過重砸，連招最後一擊後近身反擊。',opening:1.2},
 marshal:{name:'蒼鷲',style:'橫掃／騎將突進',counter:'橫掃時拉開距離，突進時換線；重擊可打落馬。',opening:1.15},
 hunter:{name:'玄弦',style:'三路箭陣／近身橫掃',counter:'遠處留意箭線，貼近後先誘出橫掃再進攻。',opening:1.3},
 frostlord:{name:'霜岳',style:'內外震地／重砸',counter:'環形震地內圈安全；貼身重砸則要離開警戒圈。',opening:1.4},
 regent:{name:'炎驍',style:'十字封路／雙刃橫掃',counter:'斜向移出十字，等雙刃收回再抓取。',opening:1.2},
 bridgeguard:{name:'裂石',style:'近身重戟／突進',counter:'先換線引開重戟，留意另一名頭目的箭線。',opening:1.3},
 bridgearcher:{name:'逐浪',style:'箭扇／直線潮衝',counter:'與裂石拉開，優先找沒有箭線的一側。',opening:1.25},
 admiral:{name:'滄瀾',style:'鐵錨潮衝／震地環',counter:'潮衝時上下換線，震地環可進內圈或跳躍。',opening:1.35},
 firelord:{name:'燼舟',style:'三線火陣／近身重砸',counter:'站進火線間隙；近身時別貪招，先躲重砸。',opening:1.4},
 pursuer:{name:'夜隼',style:'雙叉追斬／衝鋒',counter:'雙叉中線留有空隙，衝鋒改用上下換線。',opening:1.2},
 warlord:{name:'玄戎',style:'雙叉／十字／三線組合',counter:'按地面圖形換位；每組末招後有較長反擊空檔。',opening:1.45},
};
export const MOVE_GUIDES:Record<string,{name:string;avoid:string}>={
 slam:{name:'重砸',avoid:'離開地面圈'},charge:{name:'突進',avoid:'上下換線'},sweep:{name:'橫掃',avoid:'拉遠或跳躍'},fan:{name:'三路箭',avoid:'離開箭線'},ring:{name:'震地環',avoid:'進內圈或跳躍'},cross:{name:'十字斬',avoid:'斜向離開交叉線'},lanes:{name:'三線火陣',avoid:'走進線間空隙'},fork:{name:'雙叉斬',avoid:'中線或跳躍'},surge:{name:'潮衝',avoid:'換線或跳躍'},cavalry:{name:'騎將衝刺',avoid:'換線，重擊可落馬'},
};
export function bossActionHint(a:Attack|null){
 if(!a)return '觀察距離 · 誘出招式';
 const info=MOVE_GUIDES[a.move]??{name:'攻擊',avoid:'移出警戒範圍'};
 if(!a.hit)return `${info.name} ${Math.max(0,a.impact-a.elapsed).toFixed(1)}秒 · ${info.avoid}`;
 if(a.elapsed<a.impact+.18)return `${info.name}餘勢 · 暫勿靠近`;
 return `反擊空檔 ${Math.max(0,a.duration-a.elapsed).toFixed(1)}秒 · 可近身反擊`;
}
