import type {Kind} from './combat.ts';
import {LEVELS} from './levels.ts';
export const RHYTHMS=['分隊推進','兩側夾擊','竹林伏兵','重裝壓陣','宮城接力'] as const;
export interface Reinforcement {kinds:Kind[];due:number;side:'front'|'pincer'|'ambush';held?:boolean;readyAt?:number;}
export function encounterRoster(stage:number,wave:number,seed=0):Kind[]{
 const roster=[...LEVELS[stage].waves[wave-1]];
 if(!seed||wave===6)return roster;
 const variant=(seed+stage*7+wave*3)%3;
 if(variant===0)return roster;
 const pairs:Kind[][]=[['soldier','raider'],['spearman','raider'],['soldier','archer'],['heavy','mauler'],['soldier','brute']];
 const pair=pairs[stage],index=roster.findIndex(k=>pair.includes(k));
 if(index>=0)roster[index]=pair.find(k=>k!==roster[index])!;
 if(variant===2)roster.reverse();return roster;
}
export function encounterPlan(stage:number,wave:number,seed=0){
 const roster=encounterRoster(stage,wave,seed);
 if(wave===1||wave===6)return {initial:roster,groups:[] as Reinforcement[]};
 const initialCount=stage===0?4:stage===2||stage===4?2:3;
 const rest=roster.slice(initialCount),groups:Reinforcement[]=[];
 if(stage===2||stage===4){groups.push({kinds:rest.slice(0,2),due:stage===2?5:4.5,side:stage===2?'ambush':'pincer'});if(rest.length>2)groups.push({kinds:rest.slice(2),due:stage===2?10:9,side:'front'});}
 else groups.push({kinds:rest,due:[6,5.5,5,7][stage],side:stage===1?'pincer':'front'});
 return {initial:roster.slice(0,initialCount),groups};
}
export type StagePropKind='ballista'|'sluice'|'bamboo'|'ice'|'banner';
export interface StageProp {id:number;x:number;y:number;hp:number;stageKind:StagePropKind;activated?:boolean;loot?:never;}
export const PROPS=[
 {stageKind:'ballista',name:'弩機',hint:'擊破弩機 · 朝面向射出貫穿箭'},
 {stageKind:'sluice',name:'水閘',hint:'擊破水閘 · 熄滅本陣火線'},
 {stageKind:'bamboo',name:'竹索',hint:'擊斷竹索 · 落竹擊倒同一直列敵人'},
 {stageKind:'ice',name:'冰柱',hint:'擊碎冰柱 · 震退附近敵人'},
 {stageKind:'banner',name:'軍旗',hint:'擊倒軍旗 · 敵軍短暫失去防守'},
] as const;

// Heavy formations get breathing room; pincer and ambush stages retain pressure.
export const REINFORCEMENT_CAP=[3,4,4,2,4] as const;
export const BONUS_NAMES=['軍糧整備','渡口破桶','竹寮搜集','礦場清障','宮庫破陣'] as const;
