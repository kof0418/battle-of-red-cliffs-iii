import { HERO_IDS, isHeroId, type HeroId } from './heroes.ts';
export type Rank = 'S' | 'A' | 'B';
export type Records = Partial<Record<HeroId,{score:number;rank:Rank}>>;
export const RECORDS_KEY = 'red-banner-records-v14loot';
export function parseRecords(raw: unknown): Records {
 const result: Records = {};
 if (!raw || typeof raw !== 'object') return result;
 for (const id of HERO_IDS) {
  const r = (raw as Record<string, unknown>)[id] as {score?: unknown; rank?: unknown} | undefined;
  if (r && typeof r.score === 'number' && Number.isInteger(r.score) && r.score >= 0 && r.score <= 1e8 && (r.rank === 'S' || r.rank === 'A' || r.rank === 'B')) result[id] = {score:r.score,rank:r.rank};
 }
 return result;
}
export function recordVictory(records: Records, id: HeroId, score: number, rank: Rank): Records {
 if (!isHeroId(id) || !Number.isInteger(score) || score < 0 || score > 1e8 || !['S','A','B'].includes(rank)) return records;
 const old = records[id], ranks = {S:3,A:2,B:1};
 return {...records, [id]: {score:Math.max(score,old?.score ?? 0), rank:old && ranks[old.rank] > ranks[rank] ? old.rank : rank}};
}
