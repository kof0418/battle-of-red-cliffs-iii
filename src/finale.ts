import type {Campaign} from './combat.ts';
import {isHeroId,type HeroId} from './heroes.ts';
import type {Difficulty} from './tactics.ts';
export const JOURNAL_KEY='red-banner-journal-v4';
export interface JournalEntry{
 id:string;at:number;version:'4.0.0'|'4.0.1';length:'short'|'full';route:'short'|'pursuit'|'rescue';mode:'solo'|'coop'|'practice';hero:HeroId;partner?:HeroId;difficulty:Difficulty;
 score:number;rank:'S'|'A'|'B';seconds:number;bestCombo:number;continues:number;complete:boolean;
 stages:{stage:number;grade:'S'|'A'|'B'|'C';seconds:number;damage:number;bestHit:number}[];
}
export function makeRunSummary(m:Campaign,id:string,at=Date.now()):JournalEntry{
 return {id,at,version:'4.0.1',length:m.campaignLength,route:m.campaignLength==='short'?'short':m.endingRoute??'pursuit',mode:m.partner?'coop':m.ranked?'solo':'practice',hero:m.hero.heroId??'guanyu',partner:m.partner?.heroId,difficulty:m.difficulty,
 score:m.score,rank:m.rank,seconds:Math.round(m.time),bestCombo:m.bestCombo,continues:m.continuesUsed,complete:m.stageResults.length===m.levels.length,
 stages:m.stageResults.map(s=>({stage:s.stage,grade:s.grade,seconds:Math.round(s.seconds),damage:Math.round(s.damage),bestHit:s.bestHit}))};
}
const count=(n:unknown,max=1e8):n is number=>typeof n==='number'&&Number.isFinite(n)&&Number.isInteger(n)&&n>=0&&n<=max;
/** Only validated enum/number data is stored; never campaign state or user-authored HTML. */
export function parseJournal(raw:unknown):JournalEntry[]{
 if(!Array.isArray(raw))return [];
 const result:JournalEntry[]=[];
 for(const value of raw.slice(0,100)){
  if(!value||typeof value!=='object')continue;const r=value as JournalEntry;
  if(typeof r.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(r.id)||!count(r.at,8640000000000000)||!['4.0.0','4.0.1'].includes(r.version)||!['short','full'].includes(r.length)||!['short','pursuit','rescue'].includes(r.route)||!['solo','coop','practice'].includes(r.mode)||!isHeroId(r.hero)||(r.partner!==undefined&&!isHeroId(r.partner))||!['easy','normal','hard'].includes(r.difficulty)||!['S','A','B'].includes(r.rank)||![r.score,r.seconds,r.bestCombo,r.continues].every(n=>count(n))||typeof r.complete!=='boolean'||!Array.isArray(r.stages))continue;
  const limit=r.length==='full'?9:5;
  if((r.length==='short')!==(r.route==='short')||(r.mode==='coop')!==(r.partner!==undefined)||r.stages.length>limit||r.stages.some(s=>!s||!count(s.stage,limit-1)||!['S','A','B','C'].includes(s.grade)||![s.seconds,s.damage,s.bestHit].every(n=>count(n)))||new Set(r.stages.map(s=>s.stage)).size!==r.stages.length||r.complete!==(r.stages.length===limit))continue;
  if(result.some(e=>e.id===r.id))continue;
  result.push({id:r.id,at:r.at,version:r.version,length:r.length,route:r.route,mode:r.mode,hero:r.hero,partner:r.partner,difficulty:r.difficulty,score:r.score,rank:r.rank,seconds:r.seconds,bestCombo:r.bestCombo,continues:r.continues,complete:r.complete,stages:r.stages.map(s=>({stage:s.stage,grade:s.grade,seconds:s.seconds,damage:s.damage,bestHit:s.bestHit}))});
  if(result.length===20)break;
 }
 return result;
}
export function appendJournal(entries:JournalEntry[],entry:JournalEntry){return parseJournal([entry,...entries.filter(e=>e.id!==entry.id)]);}
export function routeTitle(route:JournalEntry['route']){return route==='short'?'五路告捷':route==='rescue'?'萬家歸岸':'破曉奪旌';}
export function journalScope(entry:JournalEntry){return `${entry.mode==='coop'?'雙人合作':entry.mode==='practice'?'選關挑戰':'單人出征'} · ${entry.complete?'完整戰役':'部分關卡'} · ${entry.length==='full'?'九關':'五關'}`;}
export function formatDuration(seconds:number){return `${Math.floor(seconds/60)}分 ${Math.floor(seconds%60)}秒`;}
