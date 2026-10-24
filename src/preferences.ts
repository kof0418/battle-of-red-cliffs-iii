import {parsePadBindings,DEFAULT_PAD_BINDINGS,type PadBindings} from './controls.ts';
import {isDifficulty,type Difficulty} from './tactics.ts';
export interface Preferences { difficulty:Difficulty;largeTouch:boolean;pad:PadBindings; music: number; effects: number; muted: boolean; reducedMotion: boolean; autoAttack: boolean; }
export const DEFAULT_PREFERENCES: Preferences = { largeTouch:false,pad:{...DEFAULT_PAD_BINDINGS},difficulty:'normal', music: .35, effects: .65, muted: false, reducedMotion: false, autoAttack: true };
export const PREFERENCES_KEY = 'red-banner-preferences-v1';
export function parsePreferences(value: unknown): Preferences {
 const p = value && typeof value === 'object' ? value as Partial<Preferences> : {};
 const volume = (v: unknown, fallback: number) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : fallback;
 return { largeTouch:p.largeTouch===true,pad:parsePadBindings(p.pad),difficulty:isDifficulty(p.difficulty)?p.difficulty:'normal', music: volume(p.music,.35), effects: volume(p.effects,.65), muted: typeof p.muted === 'boolean' ? p.muted : false,
 reducedMotion: p.reducedMotion === true, autoAttack: typeof p.autoAttack === 'boolean' ? p.autoAttack : true };
}
export function readPreferences(storage: Pick<Storage,'getItem'>): Preferences {
 try { return parsePreferences(JSON.parse(storage.getItem(PREFERENCES_KEY) ?? 'null')); } catch { return { ...DEFAULT_PREFERENCES }; }
}
