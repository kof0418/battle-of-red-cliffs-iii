import type { Kind } from './combat.ts';
export interface Level {
  title: string; subtitle: string; boss: string; story: string; theme: 'sunset' | 'river';
  waves: Kind[][];
}
export const LEVELS: readonly Level[] = [
  {
    title: '暮色關隘', subtitle: 'DUSK AT THE PASS', boss: '鐵獄・守關將軍', theme: 'sunset',
    story: '暮色將盡，關門已開。眾將循著江岸烽火，追向最後的水寨。',
    waves: [['soldier', 'soldier', 'raider'], ['heavy', 'raider', 'soldier', 'raider'], ['boss', 'soldier', 'heavy']],
  },
  {
    title: '夜渡蘆江', subtitle: 'THE RIVER UNDER MOONLIGHT', boss: '蒼鷲・水寨統領', theme: 'river',
    story: '水寨旌旗倒下，江岸百姓得以渡河。眾將收兵，赤旌仍在夜風中飄揚。',
    waves: [['raider', 'soldier', 'heavy', 'raider'], ['heavy', 'raider', 'heavy', 'soldier'], ['marshal', 'raider', 'heavy']],
  },
];
