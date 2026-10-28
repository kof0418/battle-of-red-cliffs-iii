import type { Kind } from './combat.ts';
export const WORLD_WIDTH=5600;
export const ARENA_ENDS=[970,1840,2770,3700,4630,5570];
export const arenaStart=(wave:number,level?:Level)=>wave<=1?0:(level?.ends??ARENA_ENDS)[wave-2];
export type CampaignLength='short'|'full';
export interface Level {ends?:number[];bonusWave?:number;bonusKind?:'salvage';title:string;subtitle:string;boss:string;story:string;theme:'sunset'|'river'|'bamboo'|'snow'|'palace'|'bridge'|'fleet'|'inferno'|'gorge';sections:string[];waves:Kind[][];}
export const LEVELS:readonly Level[]=[
 {title:'暮色關隘',subtitle:'DUSK AT THE PASS',boss:'鐵獄・守關將軍',theme:'sunset',story:'暮色將盡，關門已開。眾將循著江岸烽火，追向最後的水寨。',sections:['關外古道','軍糧營地','箭樓防線','攻城工事','內城兵營','鐵獄關門'],waves:[
 ['soldier','soldier','raider','soldier','spearman'],
 ['brute','raider','thrower','soldier','raider','spearman'],
 ['spearman','archer','soldier','archer','heavy','raider'],
 ['mauler','soldier','spearman','raider','hammer','thrower'],
 ['heavy','archer','spearman','hammer','raider','soldier','archer'],
 ['boss','heavy','spearman','archer','raider','hammer']]},
 {title:'夜渡蘆江',subtitle:'THE RIVER UNDER MOONLIGHT',boss:'蒼鷲・水寨統領',theme:'river',story:'水寨旌旗倒下，江岸百姓得以渡河。眾將沿山路追擊，竹林深處傳來弓弦聲。',sections:['蘆葦淺灘','漁舟渡口','糧船棧橋','火船水道','水寨前哨','蒼鷲旗艦'],waves:[
 ['raider','soldier','archer','spearman','raider','heavy'],
 ['spearman','thrower','brute','raider','mauler','soldier'],
 ['hammer','raider','archer','spearman','heavy','archer'],
 ['raider','hammer','spearman','thrower','raider','heavy','soldier'],
 ['heavy','archer','hammer','spearman','raider','archer','soldier'],
 ['marshal','hammer','archer','spearman','heavy','raider']]},
 {title:'翠竹迷徑',subtitle:'WHISPERS IN THE BAMBOO',boss:'玄弦・伏林弓將',theme:'bamboo',story:'眾將擊退竹影間的伏兵。通往霜嶺的山路顯現，遠處古堡仍有守軍。',sections:['翠竹入口','溪谷石橋','廢棄茶寮','幽林伏道','山寺前庭','玄弦箭臺'],waves:[
 ['raider','archer','soldier','spearman','archer','raider'],['spearman','raider','thrower','heavy','archer','soldier'],['mauler','archer','brute','spearman','heavy','archer'],['thrower','spearman','raider','archer','hammer','soldier'],['heavy','archer','spearman','raider','hammer','archer','raider'],['hunter','archer','spearman','raider','heavy','archer']]},
 {title:'霜嶺古堡',subtitle:'FORTRESS OF FROST',boss:'霜岳・破冰重將',theme:'snow',story:'冰封堡門轟然倒下。眾將越過霜嶺，宮城的赤色火光映亮天際。',sections:['風雪山道','冰湖棧橋','棄置礦場','霜石外堡','封雪兵營','霜岳冰殿'],waves:[
 ['heavy','soldier','hammer','spearman','archer','raider'],['mauler','brute','spearman','thrower','soldier','raider'],['spearman','hammer','archer','heavy','raider','hammer'],['heavy','thrower','hammer','spearman','soldier','raider'],['hammer','heavy','archer','spearman','hammer','raider','soldier'],['frostlord','hammer','heavy','archer','spearman','raider']]},
 {title:'赤焰宮城',subtitle:'THE BURNING PALACE',boss:'炎驍・雙刃禁軍督',theme:'palace',story:'眾將擊敗炎驍，宮門開啟。五路守軍盡破，百姓重返家園，赤旌迎著晨光而立。',sections:['朱雀宮門','御道長廊','燃燒庭院','金甲校場','禁軍內苑','赤焰王殿'],waves:[
 ['spearman','archer','brute','raider','mauler','soldier'],['raider','spearman','thrower','hammer','heavy','archer'],['mauler','brute','raider','spearman','archer','soldier'],['thrower','spearman','heavy','hammer','raider','spearman'],['heavy','hammer','archer','spearman','raider','archer','hammer'],['regent','heavy','hammer','archer','spearman','raider']]}];

/** The original five-stage route stays available; extended acts have their own lengths. */
export const EXTENDED_LEVELS:readonly Level[]=[...LEVELS,
 {title:'風雷長橋',subtitle:'BRIDGE OF THUNDER',boss:'裂石／逐浪・戍橋雙將',theme:'bridge',ends:[1150,2520,4010,5570],bonusWave:2,bonusKind:'salvage',story:'長橋雙將敗退，江上旗艦仍以鐵索封鎖航路。眾將沿繩梯登船。',sections:['橋頭拒馬','懸索箭廊','雷鼓中橋','雙將橋門'],waves:[
 ['spearman','heavy','archer','raider','thrower'],['spearman','archer','thrower','raider','heavy','spearman'],['mauler','brute','spearman','thrower','raider'],['heavy','thrower','bridgeguard','bridgearcher']]},
 {title:'蒼潮旗艦',subtitle:'BOARDING THE FLAGSHIP',boss:'滄瀾・鐵錨船督',theme:'fleet',ends:[1060,2140,3280,4420,5570],bonusWave:3,bonusKind:'salvage',story:'鐵錨船督倒下，遠處火船已被點燃。眾將轉向燃燒船陣，為江岸打開撤離航道。',sections:['登船弩臺','貨艙夾擊','桅索上層','舷側浪襲','鐵錨主桅'],waves:[
 ['archer','spearman','raider','thrower'],['heavy','raider','thrower','spearman','archer'],['soldier','spearman','pursuer'],['mauler','archer','thrower','spearman','raider'],['admiral','heavy','spearman','thrower']]},
 {title:'焚江火陣',subtitle:'THE BURNING ARMADA',boss:'燼舟・焰舵督軍',theme:'inferno',ends:[1260,2680,4120,5570],bonusWave:2,bonusKind:'salvage',story:'火陣被破，撤離航道與敵帥逃往的峽道同時開放。眾將必須決定：追擊敵帥，或先護送百姓。',sections:['燃舟索道','水泵營地','爆焰甲板','焰舵船樓'],waves:[
 ['thrower','raider','spearman','archer'],['brute','mauler','thrower','raider','spearman'],['heavy','archer','thrower','spearman','raider'],['firelord','hammer','thrower','raider']]},
 {title:'曉峽決戰',subtitle:'PURSUIT AT DAWN',boss:'玄戎・玄甲主帥',theme:'gorge',ends:[1060,2190,3310,4450,5570],story:'晨光越過峽口，眾將立於江岸。赤壁之戰三・九關戰役完成。',sections:['斷崖追騎','難民棧道','夜隼斷後','玄甲護營','曉峽帥帳'],waves:[
 ['raider','spearman','archer','thrower'],['soldier','brute','spearman','raider'],['pursuer','spearman','archer'],['heavy','mauler','thrower','spearman','raider'],['warlord','heavy','spearman','thrower']]}];
export const campaignLevels=(length:CampaignLength)=>length==='full'?EXTENDED_LEVELS:LEVELS;
export const levelAt=(stage:number)=>EXTENDED_LEVELS[stage];
export function endingStory(route:'pursuit'|'rescue',interactions:number){return route==='rescue'
 ?{title:'萬家歸岸',text:interactions?'烽火熄滅，撤離路線暢通。眾將護送百姓渡過峽口，讓江岸重燃炊煙。':'眾將守住棧道，百姓陸續渡江。仍有難民留待援助，守護之路尚未結束。'}
 :{title:'破曉奪旌',text:interactions?'眾將奪下玄甲軍旗，截斷退路。玄戎敗於曉峽，江岸終於迎來安寧。':'玄戎敗退，敵軍放棄江岸。眾將帶著奪回的旌旗，沿峽道迎向晨光。'};}
