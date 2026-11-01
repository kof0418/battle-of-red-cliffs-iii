export const STAGE_RECOVERY=12;
export const CHAPTERS=[
 {act:'荊襄前線',place:'山口糧道',goal:'奪回關門，打通軍糧運送線',tip:'先處理弓兵；破箱補給可留到受傷後再取。'},
 {act:'荊襄前線',place:'蘆江渡口',goal:'擊破水寨，護送江岸百姓渡河',tip:'留意騎將突進；上下換線後再進攻。'},
 {act:'荊襄前線',place:'伏林山道',goal:'穿過伏兵線，尋找通往古堡的山路',tip:'別沿同一條線追弓兵，側向接近可減少箭陣壓力。'},
 {act:'江岸合流',place:'霜嶺據點',goal:'突破古堡，清除撤離路上的重裝守軍',tip:'重兵收招慢；誘出重擊後再抓摔。'},
 {act:'江岸合流',place:'宮城軍營',goal:'攻破禁軍，奪回江岸前哨',tip:'五關模式在此結束；九關模式接續長橋與江上戰線。'},
 {act:'江岸合流',place:'長橋封鎖線',goal:'擊退戍橋雙將，重開聯軍通路',tip:'雙將各有血條；不要同時站在重戟與箭線交會處。'},
 {act:'赤壁突圍',place:'鐵索旗艦',goal:'登上旗艦，解除鐵索對航路的封鎖',tip:'途中有支線物資；可收集，也可直接向右推進。'},
 {act:'赤壁突圍',place:'火船撤離線',goal:'突破火陣，決定追擊敵帥或護送百姓',tip:'完成本關後選擇終章路線，兩條路線有不同任務與結局。'},
 {act:'赤壁突圍',place:'曉峽終章',goal:'追擊敵帥奪旗，或守住難民撤離棧道',tip:'路線選擇會改變守軍與互動目標；先完成目標再挑戰主帥。'},
] as const;
export function chapterAt(stage:number){return CHAPTERS[Math.max(0,Math.min(CHAPTERS.length-1,stage))];}
export function resupplyHp(hp:number,max:number){return hp<=0?0:Math.min(max,hp+STAGE_RECOVERY);}
