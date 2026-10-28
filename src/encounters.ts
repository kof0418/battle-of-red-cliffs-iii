import type {Kind} from './combat.ts';
import {LEVELS,levelAt} from './levels.ts';
export const RHYTHMS=['分隊推進','兩側夾擊','竹林伏兵','重裝壓陣','宮城接力','長橋交替封路','登船分段突圍','火線轉場','峽道追擊'] as const;
export interface Reinforcement {clearFirst?:boolean;kinds:Kind[];due:number;side:'front'|'pincer'|'ambush';held?:boolean;readyAt?:number;}
export function encounterRoster(stage:number,wave:number,seed=0):Kind[]{
 const roster=[...levelAt(stage).waves[wave-1]];
 if(!seed||wave===levelAt(stage).waves.length)return roster;
 const variant=(seed+stage*7+wave*3)%3;
 if(variant===0)return roster;
 const pairs:Kind[][]=[['soldier','raider'],['spearman','raider'],['soldier','archer'],['heavy','mauler'],['soldier','brute'],['archer','thrower'],['raider','soldier'],['archer','thrower'],['soldier','raider']];
 const pair=pairs[stage],index=roster.findIndex(k=>pair.includes(k));
 if(index>=0)roster[index]=pair.find(k=>k!==roster[index])!;
 if(variant===2)roster.reverse();return roster;
}
export function encounterPlan(stage:number,wave:number,seed=0){
 const roster=encounterRoster(stage,wave,seed);
 if(stage>=5){
  const final=wave===levelAt(stage).waves.length;
  if(stage===5&&final||stage===6&&wave===3)return {initial:roster.slice(0,2),groups:[{kinds:roster.slice(2),due:0,side:'front' as const,clearFirst:true}]};
  if(final||wave===1)return {initial:roster,groups:[] as Reinforcement[]};
  const n=stage===8?2:3;return {initial:roster.slice(0,n),groups:[{kinds:roster.slice(n),due:stage===7?7:5,side:stage===6?'pincer' as const:stage===8?'ambush' as const:'front' as const}]};
 }
 if(wave===1||wave===6)return {initial:roster,groups:[] as Reinforcement[]};
 const initialCount=stage===0?4:stage===2||stage===4?2:3;
 const rest=roster.slice(initialCount),groups:Reinforcement[]=[];
 if(stage===2||stage===4){groups.push({kinds:rest.slice(0,2),due:stage===2?5:4.5,side:stage===2?'ambush':'pincer'});if(rest.length>2)groups.push({kinds:rest.slice(2),due:stage===2?10:9,side:'front'});}
 else groups.push({kinds:rest,due:[6,5.5,5,7][stage],side:stage===1?'pincer':'front'});
 return {initial:roster.slice(0,initialCount),groups};
}
export type StagePropKind='ballista'|'sluice'|'bamboo'|'ice'|'banner'|'winch'|'capstan'|'pump'|'beacon';
export interface StageProp {id:number;x:number;y:number;hp:number;stageKind:StagePropKind;activated?:boolean;loot?:never;}
export const PROPS=[
 {stageKind:'ballista',name:'弩機',hint:'擊破弩機 · 朝面向射出貫穿箭'},
 {stageKind:'sluice',name:'水閘',hint:'擊破水閘 · 熄滅本陣火線'},
 {stageKind:'bamboo',name:'竹索',hint:'擊斷竹索 · 落竹擊倒同一直列敵人'},
 {stageKind:'ice',name:'冰柱',hint:'擊碎冰柱 · 震退附近敵人'},
 {stageKind:'banner',name:'軍旗',hint:'擊倒軍旗 · 敵軍短暫失去防守'},
 {stageKind:'winch',name:'橋索絞盤',hint:'擊破絞盤 · 停止橋上落箭'},
 {stageKind:'capstan',name:'纜繩轉輪',hint:'擊破轉輪 · 壓制本陣敵軍'},
 {stageKind:'pump',name:'船艙水泵',hint:'擊破水泵 · 熄滅本陣火線'},
 {stageKind:'beacon',name:'峽口烽火',hint:'擊倒烽火 · 截斷追兵並開通撤離路線'},
] as const;

// Heavy formations get breathing room; pincer and ambush stages retain pressure.
export const REINFORCEMENT_CAP=[3,4,4,2,4,3,3,3,3] as const;
export const BONUS_NAMES=['軍糧整備','渡口破桶','竹寮搜集','礦場清障','宮庫破陣','橋索物資','船舷救援','火舟搶運','峽谷補給'] as const;
