import { isHeroId } from '../src/heroes.ts';
import { Campaign, stats, type Fighter, type Attack, type Kind, type Pickup, type Supply } from '../src/combat.ts';
export const SAVE_KEY = 'red-banner-save-v1';
export const MAX_SAVE_BYTES = 128 * 1024;
const RUN_KEYS = ['stage', 'wave', 'continues', 'continuesUsed', 'kills', 'checkpointScore', 'checkpointKills', 'ranked', 'waveStarted', 'waveDamage', 'waveReward', 'time', 'score', 'hits', 'bestCombo', 'hitDeadline', 'freeze', 'clearedAt', 'status'] as const;
type Run = Pick<Campaign, typeof RUN_KEYS[number]> & { hero: Fighter; enemies: Fighter[]; supplies: Supply[]; pickups: Pickup[] };
export interface SaveData { format: 'red-banner'; schema: 1; gameVersion: '1.3.0'; savedAt: string; best: number; muted: boolean; run: Run; }
const fail = (): never => { throw new Error('存檔內容不完整或不相容，原有紀錄未變更。'); };
const obj = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : fail();
function number(v: unknown, min: number, max: number, integer = false) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) return fail();
  return v;
}
function bool(v: unknown) { return typeof v === 'boolean' ? v : fail(); }
function list<T>(v: unknown, max: number, parse: (v: unknown) => T): T[] {
  if (!Array.isArray(v) || v.length > max) return fail();
  return v.map(parse);
}
function attack(v: unknown): Attack | null {
  if (v === null) return null;
  const a = obj(v), move = a.move;
  if (move !== 'special' && move !== 'slash' && move !== 'slam' && move !== 'charge' && move !== 'sweep') return fail();
  const duration = number(a.duration, .1, 3), elapsed = number(a.elapsed, 0, duration), impact = number(a.impact, 0, duration);
  const face = number(a.face, -1, 1, true); if (!face) return fail();
  return { move, elapsed, duration, impact, hit: bool(a.hit), face, x: number(a.x, 0, 2800), y: number(a.y, 340, 510) };
}
function fighter(v: unknown): Fighter {
  const f = obj(v);
  if (typeof f.kind !== 'string' || !Object.hasOwn(stats, f.kind)) return fail();
  const kind = f.kind as Kind, max = stats[kind].hp;
  if (f.max !== max) return fail();
  const heroId = f.heroId === undefined ? 'guanyu' : f.heroId;
  if (kind === 'hero' && !isHeroId(heroId)) return fail();
  const face = number(f.face, -1, 1, true); if (!face) return fail();
  return { ...(f.grappleCooldown!==undefined?{grappleCooldown:number(f.grappleCooldown,0,2)}:{}), ...(kind === 'hero' && isHeroId(heroId) ? { heroId } : {}), id: number(f.id, 1, 100000, true), kind, max, hp: number(f.hp, 0, max), x: number(f.x, 0, 2800), y: number(f.y, 340, 510), face,
    z: number(f.z, 0, 1000), vz: number(f.vz, -2000, 2000), inv: number(f.inv, 0, 5), stun: number(f.stun, 0, 5), cooldown: number(f.cooldown, -1e8, 100),
    step: number(f.step, 0, 3, true), last: number(f.last, -10, 1e8), attack: attack(f.attack), moving: bool(f.moving),
    specialCooldown: f.specialCooldown===undefined?0:number(f.specialCooldown,0,8), dodge: number(f.dodge, -.1, 1), dodgeCooldown: number(f.dodgeCooldown, 0, 2), dashX: number(f.dashX, -1, 1), dashY: number(f.dashY, -1, 1), attacks: number(f.attacks, 0, 1e7, true) };
}
/** Build a whitelist rather than copying arbitrary imported properties into the model. */
export function parseSave(text: string): SaveData {
  if (new TextEncoder().encode(text).length > MAX_SAVE_BYTES) throw new Error('存檔太大，請選擇 128 KB 以下的遊戲存檔。');
  let raw: unknown; try { raw = JSON.parse(text); } catch { throw new Error('這不是有效的 JSON 存檔。'); }
  const s = obj(raw);
  if (s.format !== 'red-banner' || s.schema !== 1 || (s.gameVersion !== '0.4.0' && s.gameVersion !== '0.5.1' && s.gameVersion !== '1.1.0' && s.gameVersion !== '1.2.0' && s.gameVersion !== '1.2.1' && s.gameVersion !== '1.3.0')) throw new Error('存檔版本不相容；請使用 v0.4～v1.3 匯出的存檔。');
  if (typeof s.savedAt !== 'string' || s.savedAt.length > 40 || !Number.isFinite(Date.parse(s.savedAt))) return fail();
  const r = obj(s.run), status = r.status;
  if (s.gameVersion !== '0.4.0' && !isHeroId(obj(r.hero).heroId)) return fail();
  if (status !== 'playing' && status !== 'stage-clear' && status !== 'won' && status !== 'lost') return fail();
  const stage = number(r.stage, 0, 1, true), wave = number(r.wave, 1, 3, true);
  const continues = number(r.continues, 0, 2, true), continuesUsed = number(r.continuesUsed, 0, 2, true);
  if (continues + continuesUsed !== 2) return fail();
  const time = number(r.time, 0, 1e8), hero = fighter(r.hero), enemies = list(r.enemies, 8, fighter);
  if (hero.kind !== 'hero' || enemies.some(e => e.kind === 'hero' || e.hp <= 0)) return fail();
  if ((status === 'lost') !== (hero.hp === 0)) return fail();
  if ((status === 'won' || status === 'stage-clear') && (wave !== 3 || enemies.length > 0)) return fail();
  if ((status === 'won' && stage !== 1) || (status === 'stage-clear' && stage !== 0)) return fail();
  if (hero.attack && (!['slash','special'].includes(hero.attack.move) || hero.step === 0)) return fail();
  const supplies = list<Supply>(r.supplies, 4, v => { const a = obj(v); return { id: number(a.id, 1, 100000, true), x: number(a.x, 0, 2800), y: number(a.y, 340, 510), hp: number(a.hp, 1, 24) }; });
  const pickups = list<Pickup>(r.pickups, 16, v => { const a = obj(v); if (a.amount !== 25 && a.amount !== 40) return fail(); return { id: number(a.id, 1, 100000, true), x: number(a.x, 0, 2800), y: number(a.y, 340, 510), amount: a.amount }; });
  const ids = [hero, ...enemies, ...supplies, ...pickups].map(a => a.id);
  if (new Set(ids).size !== ids.length) return fail();
  const score = number(r.score, 0, 1e8, true), kills = number(r.kills, 0, 21, true);
  const run: Run = { stage, wave, continues, continuesUsed, time, hero, enemies, supplies, pickups, status, score, kills,
    ranked: obj(r.hero).specialCooldown !== undefined && s.gameVersion === '1.3.0' && r.ranked !== undefined ? bool(r.ranked) : false,
    waveStarted: (['1.1.0','1.2.0','1.2.1','1.3.0'].includes(String(s.gameVersion))) ? number(r.waveStarted, 0, time) : time,
    waveDamage: (['1.1.0','1.2.0','1.2.1','1.3.0'].includes(String(s.gameVersion))) ? number(r.waveDamage, 0, 1e8, true) : 1,
    waveReward: (['1.1.0','1.2.0','1.2.1','1.3.0'].includes(String(s.gameVersion))) ? number(r.waveReward, -1, 2000, true) : (status === 'won' || status === 'stage-clear' || (typeof r.clearedAt === 'number' && r.clearedAt >= 0) ? 0 : -1),
    checkpointScore: number(r.checkpointScore, 0, score, true), checkpointKills: number(r.checkpointKills, 0, kills, true),
    hits: number(r.hits, 0, 100000, true), bestCombo: number(r.bestCombo, 0, 100000, true), hitDeadline: number(r.hitDeadline, 0, time + 3),
    freeze: number(r.freeze, -.1, .1), clearedAt: number(r.clearedAt, -1, time) };
  return { format: 'red-banner', schema: 1, gameVersion: '1.3.0', savedAt: s.savedAt, best: number(s.best, 0, 1e8, true), muted: bool(s.muted), run };
}
export function captureSave(model: Campaign, best = 0, muted = false): SaveData {
  if (model.status === 'ready') throw new Error('請先出陣，或載入已有紀錄。');
  const run = Object.fromEntries(RUN_KEYS.map(k => [k, model[k]]));
  return parseSave(JSON.stringify({ format: 'red-banner', schema: 1, gameVersion: '1.3.0', savedAt: new Date().toISOString(), best, muted,
    run: { ...run, hero: model.hero, enemies: model.enemies, supplies: model.supplies, pickups: model.pickups } }));
}
export function restoreSave(save: SaveData): Campaign {
  const valid = parseSave(JSON.stringify(save));
  const m = new Campaign(); Object.assign(m, valid.run); m.reseedIds();
  m.paused = m.status === 'playing'; m.events = []; m.queuedUntil = 0;
  m.message = `${m.level.title}　／　紀錄已載入`; m.messageUntil = m.time + 3;
  return m;
}
/** Storage can be disabled or full; never make the game depend on it. */
export function readSave(storage: Pick<Storage, 'getItem'>): SaveData | null {
  const text = storage.getItem(SAVE_KEY); return text ? parseSave(text) : null;
}
export function writeSave(storage: Pick<Storage, 'setItem'>, save: SaveData) {
  storage.setItem(SAVE_KEY, JSON.stringify(save));
}
