/** Original interpretations of historical figures; no arcade assets or animation data. */
export const HEROES = {
  guanyu: { name: '關羽', title: '鐵拳鎮陣', weapon: '徒手／馬上偃月刀', style: '長刀', color: 0x599d72, hair: 0x202c29, speed: 180, damage: 1, reach: 1, tempo: 1, push: 1, description: '前兩擊留住敵人，重擊壓制；背摔落地震退近旁敵軍。', moves: ['橫江拳', '挑月肘', '斷岳重拳'] },
  zhangfei: { name: '張飛', title: '猛將破軍', weapon: '徒手／馬上蛇矛', style: '蛇矛', color: 0xb56a49, hair: 0x252b29, speed: 164, damage: 1.3, reach: .92, tempo: 1.10, push: 1.4, description: '抓打後舉起敵人，跳躍接旋轉重摔。', moves: ['猛虎直拳', '回身撞軍', '震地砸'] },
  zhaoyun: { name: '趙雲', title: '銀劍疾影', weapon: '步戰劍／馬上長槍', style: '長槍', color: 0x9cbcc5, hair: 0x283236, speed: 210, damage: .85, reach: 1.2, tempo: .95, push: .85, description: '跳攻命中可再按攻擊接俯衝補擊，每跳最多兩擊。', moves: ['白龍疾劍', '挑雲劍', '迴龍斬'] },
  huangzhong: { name: '黃忠', title: '百步穿楊', weapon: '長弓', style: '弓箭', color: 0xc2a35e, hair: 0xd8d5bd, speed: 172, damage: .8, reach: 3.2, tempo: 1.1, push: .65, description: '遠處射箭、近身弓擊可後撤，跳攻使用短刃。', moves: ['定弦矢', '低姿追矢', '滿弓貫日'] },
  weiyan: { name: '魏延', title: '赤刃突襲', weapon: '環首戰刀', style: '戰刀', color: 0xa96579, hair: 0x292b35, speed: 195, damage: 1.05, reach: .82, tempo: .9, push: .65, description: '斜切接突膝、旋踵腳刀，快速近身連擊與低身旋摔。', moves: ['赤刃斜切', '突膝破軍', '旋踵腳刀'] },
  lubu: {name:'呂布',title:'飛將無雙',weapon:'方天畫戟',style:'畫戟',color:0xb84e43,hair:0x24212a,speed:175,damage:1.18,reach:1.35,tempo:1.12,push:1.2,description:'橫戟接長刺、舉戟重砸，刃尖破盾與高舉重摔。',moves:['裂陣橫戟','轅門穿鋒','崩岳重戟']},
} as const;
export type HeroId = keyof typeof HEROES;
export const HERO_IDS = Object.keys(HEROES) as HeroId[];
export function isHeroId(id: unknown): id is HeroId { return typeof id === 'string' && Object.hasOwn(HEROES, id); }
