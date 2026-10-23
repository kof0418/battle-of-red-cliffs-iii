/** Original interpretations of historical figures; no arcade assets or animation data. */
export const HEROES = {
  guanyu: { name: '關羽', title: '長刀鎮陣', weapon: '青龍偃月刀', style: '長刀', color: 0x599d72, hair: 0x202c29, speed: 180, damage: 1, reach: 1, tempo: 1, push: 1, description: '均衡長刀，三段橫斬穩定破陣。', moves: ['斬關', '挑月', '青龍破陣'] },
  zhangfei: { name: '張飛', title: '猛將破軍', weapon: '丈八蛇矛', style: '蛇矛', color: 0xb56a49, hair: 0x252b29, speed: 156, damage: 1.3, reach: .92, tempo: 1.18, push: 1.4, description: '步伐沉穩，重擊威力與擊退最強。', moves: ['震矛', '挑軍', '怒嘯破軍'] },
  zhaoyun: { name: '趙雲', title: '銀槍疾影', weapon: '龍膽長槍', style: '長槍', color: 0x9cbcc5, hair: 0x283236, speed: 210, damage: .85, reach: 1.2, tempo: .95, push: .85, description: '移動最快，長槍連刺保持距離。', moves: ['疾刺', '穿雲', '銀龍三疊'] },
  huangzhong: { name: '黃忠', title: '百步穿楊', weapon: '長弓', style: '弓箭', color: 0xc2a35e, hair: 0xd8d5bd, speed: 172, damage: .8, reach: 3.2, tempo: 1.1, push: .65, description: '同一路線遠射，第三箭可貫穿敵陣。', moves: ['鳴弦', '追星', '貫日'] },
  weiyan: { name: '魏延', title: '赤刃突襲', weapon: '環首戰刀', style: '戰刀', color: 0xa96579, hair: 0x292b35, speed: 195, damage: 1.05, reach: .82, tempo: .9, push: .65, description: '短刀快斬，貼近敵人連續進攻。', moves: ['突刃', '返鋒', '赤刃斷流'] },
  lubu: {name:'呂布',title:'飛將無雙',weapon:'方天畫戟',style:'畫戟',color:0xb84e43,hair:0x24212a,speed:175,damage:1.18,reach:1.35,tempo:1.12,push:1.2,description:'方天畫戟大開大闔，長距離橫掃破陣。',moves:['破鋒','挑天','無雙裂陣']},
} as const;
export type HeroId = keyof typeof HEROES;
export const HERO_IDS = Object.keys(HEROES) as HeroId[];
export function isHeroId(id: unknown): id is HeroId { return typeof id === 'string' && Object.hasOwn(HEROES, id); }
