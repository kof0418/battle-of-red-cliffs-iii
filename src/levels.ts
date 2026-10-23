import type { Kind } from './combat.ts';
export const WORLD_WIDTH=5600;
export const ARENA_ENDS=[970,1840,2770,3700,4630,5570];
export const arenaStart=(wave:number)=>wave<=1?0:ARENA_ENDS[wave-2];
export interface Level {title:string;subtitle:string;boss:string;story:string;theme:'sunset'|'river'|'bamboo'|'snow'|'palace';sections:string[];waves:Kind[][];}
export const LEVELS:readonly Level[]=[
 {title:'暮色關隘',subtitle:'DUSK AT THE PASS',boss:'鐵獄・守關將軍',theme:'sunset',story:'暮色將盡，關門已開。眾將循著江岸烽火，追向最後的水寨。',sections:['關外古道','軍糧營地','箭樓防線','攻城工事','內城兵營','鐵獄關門'],waves:[
 ['soldier','soldier','raider','soldier','spearman'],
 ['brute','raider','archer','soldier','raider','spearman'],
 ['spearman','archer','soldier','archer','heavy','raider'],
 ['mauler','soldier','spearman','raider','hammer','archer'],
 ['heavy','archer','spearman','hammer','raider','soldier','archer'],
 ['boss','heavy','spearman','archer','raider','hammer']]},
 {title:'夜渡蘆江',subtitle:'THE RIVER UNDER MOONLIGHT',boss:'蒼鷲・水寨統領',theme:'river',story:'水寨旌旗倒下，江岸百姓得以渡河。眾將沿山路追擊，竹林深處傳來弓弦聲。',sections:['蘆葦淺灘','漁舟渡口','糧船棧橋','火船水道','水寨前哨','蒼鷲旗艦'],waves:[
 ['raider','soldier','archer','spearman','raider','heavy'],
 ['spearman','archer','brute','raider','mauler','soldier'],
 ['hammer','raider','archer','spearman','heavy','archer'],
 ['raider','hammer','spearman','archer','raider','heavy','soldier'],
 ['heavy','archer','hammer','spearman','raider','archer','soldier'],
 ['marshal','hammer','archer','spearman','heavy','raider']]},
 {title:'翠竹迷徑',subtitle:'WHISPERS IN THE BAMBOO',boss:'玄弦・伏林弓將',theme:'bamboo',story:'眾將擊退竹影間的伏兵。通往霜嶺的山路顯現，遠處古堡仍有守軍。',sections:['翠竹入口','溪谷石橋','廢棄茶寮','幽林伏道','山寺前庭','玄弦箭臺'],waves:[
 ['raider','archer','soldier','spearman','archer','raider'],['spearman','raider','archer','heavy','archer','soldier'],['mauler','archer','brute','spearman','heavy','archer'],['archer','spearman','raider','archer','hammer','soldier'],['heavy','archer','spearman','raider','hammer','archer','raider'],['hunter','archer','spearman','raider','heavy','archer']]},
 {title:'霜嶺古堡',subtitle:'FORTRESS OF FROST',boss:'霜岳・破冰重將',theme:'snow',story:'冰封堡門轟然倒下。眾將越過霜嶺，宮城的赤色火光映亮天際。',sections:['風雪山道','冰湖棧橋','棄置礦場','霜石外堡','封雪兵營','霜岳冰殿'],waves:[
 ['heavy','soldier','hammer','spearman','archer','raider'],['mauler','brute','spearman','archer','soldier','raider'],['spearman','hammer','archer','heavy','raider','hammer'],['heavy','archer','hammer','spearman','soldier','raider'],['hammer','heavy','archer','spearman','hammer','raider','soldier'],['frostlord','hammer','heavy','archer','spearman','raider']]},
 {title:'赤焰宮城',subtitle:'THE BURNING PALACE',boss:'炎驍・雙刃禁軍督',theme:'palace',story:'眾將擊敗炎驍，宮門開啟。五路守軍盡破，百姓重返家園，赤旌迎著晨光而立。',sections:['朱雀宮門','御道長廊','燃燒庭院','金甲校場','禁軍內苑','赤焰王殿'],waves:[
 ['spearman','archer','brute','raider','mauler','soldier'],['raider','spearman','archer','hammer','heavy','archer'],['mauler','brute','raider','spearman','archer','soldier'],['archer','spearman','heavy','hammer','raider','spearman'],['heavy','hammer','archer','spearman','raider','archer','hammer'],['regent','heavy','hammer','archer','spearman','raider']]}];
