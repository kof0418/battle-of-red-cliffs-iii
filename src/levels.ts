import type { Kind } from './combat.ts';
export const WORLD_WIDTH=5600;
export const ARENA_ENDS=[970,1840,2770,3700,4630,5570];
export const arenaStart=(wave:number)=>wave<=1?0:ARENA_ENDS[wave-2];
export interface Level {title:string;subtitle:string;boss:string;story:string;theme:'sunset'|'river';sections:string[];waves:Kind[][];}
export const LEVELS:readonly Level[]=[
 {title:'暮色關隘',subtitle:'DUSK AT THE PASS',boss:'鐵獄・守關將軍',theme:'sunset',story:'暮色將盡，關門已開。眾將循著江岸烽火，追向最後的水寨。',sections:['關外古道','軍糧營地','箭樓防線','攻城工事','內城兵營','鐵獄關門'],waves:[
 ['soldier','soldier','raider','soldier','spearman'],
 ['heavy','raider','archer','soldier','raider','spearman'],
 ['spearman','archer','soldier','archer','heavy','raider'],
 ['hammer','soldier','spearman','raider','hammer','archer'],
 ['heavy','archer','spearman','hammer','raider','soldier','archer'],
 ['boss','heavy','spearman','archer','raider','hammer']]},
 {title:'夜渡蘆江',subtitle:'THE RIVER UNDER MOONLIGHT',boss:'蒼鷲・水寨統領',theme:'river',story:'水寨旌旗倒下，江岸百姓得以渡河。眾將收兵，赤旌仍在夜風中飄揚。',sections:['蘆葦淺灘','漁舟渡口','糧船棧橋','火船水道','水寨前哨','蒼鷲旗艦'],waves:[
 ['raider','soldier','archer','spearman','raider','heavy'],
 ['spearman','archer','heavy','raider','hammer','soldier'],
 ['hammer','raider','archer','spearman','heavy','archer'],
 ['raider','hammer','spearman','archer','raider','heavy','soldier'],
 ['heavy','archer','hammer','spearman','raider','archer','soldier'],
 ['marshal','hammer','archer','spearman','heavy','raider']]}];
