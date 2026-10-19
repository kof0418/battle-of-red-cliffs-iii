import {SPECIALS,SPECIAL_COST,SPECIAL_COOLDOWN,specialHits} from './specials.ts';
import { HEROES, type HeroId } from './heroes.ts';
import { LEVELS } from './levels.ts';
import { fieldEvent, fieldHits } from './battlefield.ts';
/** Pure combat rules, in seconds and world pixels. */
export type Kind = 'hero' | 'soldier' | 'raider' | 'heavy' | 'boss' | 'marshal';
export const stats = {
  hero: { hp: 160, speed: 180, damage: 17 },
  soldier: { hp: 48, speed: 62, damage: 8 },
  raider: { hp: 38, speed: 104, damage: 6 },
  heavy: { hp: 90, speed: 42, damage: 13 },
  boss: { hp: 420, speed: 65, damage: 18 },
  marshal: { hp: 510, speed: 78, damage: 20 },
};
export const SLASHES = [
  { duration: .28, impact: .10, damage: 17, reach: 96, push: 15 },
  { duration: .32, impact: .12, damage: 21, reach: 106, push: 20 },
  { duration: .44, impact: .18, damage: 34, reach: 122, push: 65 },
];
export function inRange(ax: number, ay: number, bx: number, by: number, facing: number, reach: number) {
  return Math.abs(by - ay) < 30 && (bx - ax) * facing > -12 && (bx - ax) * facing < reach;
}
export function comboStep(previous: number, last: number, now: number) {
  return now - last < 650 ? previous % 3 + 1 : 1;
}
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const isBoss = (kind: Kind) => kind === 'boss' || kind === 'marshal';
export type Move = 'special' | 'slash' | 'slam' | 'charge' | 'sweep';
export interface Supply { id: number; x: number; y: number; hp: number; }
export function nearPickup(hero: {x: number; y: number; z: number}, item: {x: number; y: number}) {
  return hero.z <= 8 && Math.abs(item.x - hero.x) <= 32 && Math.abs(item.y - hero.y) <= 32;
}
export interface Pickup { id: number; x: number; y: number; amount: number; }
export interface Attack {
  move: Move; elapsed: number; duration: number; impact: number; hit: boolean;
  face: number; x: number; y: number;
}
export interface Fighter {
  id: number; kind: Kind; heroId?: HeroId; x: number; y: number; hp: number; max: number; face: number;
  z: number; vz: number; inv: number; stun: number; cooldown: number;
  step: number; last: number; attack: Attack | null; moving: boolean;
  specialCooldown?: number; dodge: number; dodgeCooldown: number; dashX: number; dashY: number; attacks: number;
}
export interface Input { x: number; y: number; special?: boolean; attack?: boolean; jump?: boolean; dodge?: boolean; }
export type Effect = { type: 'special' | 'hit' | 'swing' | 'jump' | 'dodge' | 'death' | 'wave' | 'end' | 'heal' | 'crate' | 'arrow' | 'volley' | 'fire'; x: number; y: number; value?: number; heavy?: boolean; heroId?: HeroId };
export function attackHits(a: Attack, target: Fighter, reach: number) {
  if (target.z > 38) return false;
  if (a.move === 'sweep') return Math.abs(target.x - a.x) < 170 && Math.abs(target.y - a.y) < 49;
  if (a.move === 'slam') return Math.hypot((target.x - a.x) / 1.4, target.y - a.y) < 88;
  if (a.move === 'charge') return inRange(a.x, a.y, target.x, target.y, a.face, 250);
  return inRange(a.x, a.y, target.x, target.y, a.face, reach);
}
/** Deterministic, renderer-independent game simulation. */
export class Campaign {
  hero: Fighter;
  enemies: Fighter[] = [];
  supplies: Supply[] = [];
  pickups: Pickup[] = [];
  stage = 0;
  continues = 2;
  continuesUsed = 0;
  kills = 0;
  checkpointScore = 0;
  checkpointKills = 0;
  ranked = true;
  waveStarted = 0;
  waveDamage = 0;
  waveReward = -1;
  get level() { return LEVELS[this.stage]; }
  get field() { return this.status === 'playing' && this.enemies.length ? fieldEvent(this.stage,this.wave,this.time,this.waveStarted) : null; }
  get rank() { return this.continuesUsed === 0 && this.hero.hp >= 80 ? 'S' : this.continuesUsed <= 1 ? 'A' : 'B'; }
  time = 0;
  wave = 0;
  score = 0;
  hits = 0;
  bestCombo = 0;
  hitDeadline = 0;
  paused = false;
  status: 'ready' | 'playing' | 'stage-clear' | 'won' | 'lost' = 'ready';
  events: Effect[] = [];
  message = '暮色關隘';
  messageUntil = 0;
  queuedUntil = 0;
  private specialQueued = false;
  freeze = 0;
  clearedAt = -1;
  private serial = 0;
  constructor(heroId: HeroId = 'guanyu') { this.hero = this.fighter('hero', 180, 412); this.hero.heroId = heroId; }
  get champion() { return HEROES[this.hero.heroId ?? 'guanyu']; }
  selectHero(id: HeroId) { if (this.status !== 'ready') return false; this.hero.heroId = id; return true; }
  slash(step: number) {
    const s = SLASHES[Math.max(0, step - 1)], c = this.champion;
    return { duration: s.duration * c.tempo, impact: s.impact * c.tempo, damage: Math.round(s.damage * c.damage), reach: s.reach * c.reach, push: s.push * c.push };
  }
  fighter(kind: Kind, x: number, y: number): Fighter {
    return { ...(kind === 'hero' ? { heroId: this.hero?.heroId ?? 'guanyu' } : {}), id: ++this.serial, kind, x, y, hp: stats[kind].hp, max: stats[kind].hp,
      face: kind === 'hero' ? 1 : -1, z: 0, vz: 0, inv: 0, stun: 0, cooldown: .9,
      step: 0, last: -10, attack: null, moving: false, specialCooldown: 0, dodge: 0, dodgeCooldown: 0,
      dashX: 0, dashY: 0, attacks: 0 };
  }
  reseedIds() {
    this.serial = Math.max(...[this.hero, ...this.enemies, ...this.supplies, ...this.pickups].map(entity => entity.id));
  }
  start() { if (this.status !== 'ready') return; this.status = 'playing'; this.spawn(); }
  togglePause() { if (this.status === 'playing') this.paused = !this.paused; }
  /** Called only from the clear screen; the campaign score and credits survive. */
  nextStage() {
    if (this.status !== 'stage-clear' || this.stage >= LEVELS.length - 1) return false;
    this.stage++; this.wave = 0; this.hero = this.fighter('hero', 180, 412);
    this.resetTransient(); this.status = 'playing'; this.spawn(); return true;
  }
  /** Replay the current wave, rolling back its score and kills to prevent farming. */
  continueRun() {
    if (this.status !== 'lost' || this.continues <= 0) return false;
    this.continues--; this.continuesUsed++;
    this.score = this.checkpointScore; this.kills = this.checkpointKills;
    const x = [180, 180, 1010, 1880][this.wave];
    this.hero = this.fighter('hero', x, 412); this.hero.inv = 1.5;
    this.wave--; this.resetTransient(); this.status = 'playing'; this.spawn(); return true;
  }
  private resetTransient() {
    this.paused = false; this.freeze = 0; this.queuedUntil = 0; this.hits = 0;
    this.specialQueued = false; this.hitDeadline = 0; this.events = []; this.clearedAt = -1;
  }
  spawn() {
    this.wave++; this.clearedAt = -1;
    this.waveStarted = this.time; this.waveDamage = 0; this.waveReward = -1;
    this.checkpointScore = this.score; this.checkpointKills = this.kills;
    const base = [0, 430, 1230, 2110][this.wave];
    const kinds = this.level.waves[this.wave - 1];
    this.enemies = kinds.map((k, i) => this.fighter(k, base + i * 82, 370 + i % 3 * 49));
    this.supplies = [{ id: ++this.serial, x: base + 240, y: 479, hp: 24 }];
    this.pickups = [];
    this.message = this.wave === 3 ? `${this.level.boss}　　留意地面蓄力範圍` : `${this.level.title}　第 ${this.wave} 陣 · ${this.stage === 0 ? '留意箭雨，移出框線' : '火船來襲，跳躍避火'}`;
    this.messageUntil = this.time + 3;
    this.events.push({ type: 'wave', x: base, y: 400 });
  }
  tick(rawDt: number, input: Input) {
    this.events = [];
    if (this.status !== 'playing' || this.paused) return;
    const dt = clamp(rawDt, 0, .033);
    // Preserve presses during hit-stop; don't let a frozen frame eat a combo input.
    if (input.special) this.specialQueued = true;
    if (input.attack) this.queuedUntil = this.time + .38;
    if (this.freeze > 0) { this.freeze -= dt; return; }
    this.time += dt;
    if (this.time > this.hitDeadline) this.hits = 0;
    const h = this.hero;
    for (const f of [h, ...this.enemies]) {
      f.inv = Math.max(0, f.inv - dt); f.stun = Math.max(0, f.stun - dt);
      f.specialCooldown = Math.max(0,(f.specialCooldown ?? 0)-dt);
      f.cooldown -= dt; f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt); f.moving = false;
      if (f.z > 0 || f.vz > 0) { f.z += f.vz * dt; f.vz -= 900 * dt; if (f.z <= 0) { f.z = 0; f.vz = 0; if (f === h) { f.stun = Math.max(f.stun, .12); f.attack = null; } } }
    }
    if(this.specialQueued){this.specialQueued=false;this.special();}
    const casting=h.attack?.move==='special';
    if (input.dodge && !casting && h.dodgeCooldown <= 0 && h.stun <= 0 && h.z === 0) {
      const length = Math.hypot(input.x, input.y);
      h.dashX = length ? input.x / length : h.face; h.dashY = length ? input.y / length : 0;
      h.dodge = .22; h.dodgeCooldown = .95; h.inv = .28; h.attack = null; this.queuedUntil = 0;
      this.events.push({ type: 'dodge', x: h.x, y: h.y });
    }
    if (h.dodge > 0) { h.dodge -= dt; h.x += h.dashX * 410 * dt; h.y += h.dashY * 245 * dt; }
    else if (h.stun <= 0 && !casting) {
      if (input.jump && h.z === 0) { h.vz = 360; this.events.push({ type: 'jump', x: h.x, y: h.y }); }
      if (this.queuedUntil > this.time && !h.attack) { this.swing(); this.queuedUntil = 0; }
      if (!h.attack) {
        const len = Math.hypot(input.x, input.y) || 1;
        h.x += input.x / len * this.champion.speed * dt; h.y += input.y / len * this.champion.speed * (125 / 180) * dt;
        h.moving = !!(input.x || input.y); if (input.x) h.face = Math.sign(input.x);
      }
    }
    // Each arena opens only after its defenders fall.
    const right = [0, 970, 1840, 2770][this.wave];
    h.x = clamp(h.x, 25, this.enemies.length ? right : 2770); h.y = clamp(h.y, 350, 503);
    for (const f of [h, ...this.enemies]) {
      if (f.hp <= 0 || !f.attack) continue;
      const a = f.attack; a.elapsed += dt;
      if (a.elapsed >= a.impact && !a.hit) { a.hit = true; this.resolve(f, a); }
      if (a.elapsed >= a.duration) f.attack = null;
    }
    this.enemies.forEach((e, i) => this.ai(e, i, dt));
    // Gentle separation prevents enemies occupying exactly the same lane and pixel.
    for (let i = 0; i < this.enemies.length; i++) for (let j = i + 1; j < this.enemies.length; j++) {
      const a = this.enemies[i], b = this.enemies[j];
      if (Math.abs(a.x - b.x) < 30 && Math.abs(a.y - b.y) < 21) {
        if (!a.attack) a.y = clamp(a.y - 20 * dt, 350, 503);
        if (!b.attack) b.y = clamp(b.y + 20 * dt, 350, 503);
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);
    const field = this.field;
    if(field && this.time-dt < field.impactAt && this.time >= field.impactAt) {
      this.events.push({type:field.kind,x:field.x,y:field.y,value:field.width});
      if(fieldHits(field,h)) {
        const damage=Math.min(h.hp,12);h.hp-=damage;this.waveDamage+=damage;
        h.inv=.75;h.stun=.22;h.attack=null;this.hits=0;this.queuedUntil=0;
        this.events.push({type:'hit',x:h.x,y:h.y-h.z-38,value:damage});
      }
    }
    // Death takes precedence over simultaneous final clearance.
    if (h.hp <= 0) { this.status = 'lost'; this.events.push({ type: 'end', x: h.x, y: h.y }); return; }
    this.pickups = this.pickups.filter(p => {
      if (h.hp >= h.max || !nearPickup(h, p)) return true;
      const amount = Math.min(p.amount, h.max - h.hp); h.hp += amount;
      this.events.push({ type: 'heal', x: p.x, y: p.y - 45, value: amount }); return false;
    });
    if (!this.enemies.length) {
      if (this.waveReward < 0) {
        const speed = Math.max(0, 1200 - Math.floor(this.time - this.waveStarted) * 10);
        this.waveReward = speed + (this.waveDamage === 0 ? 800 : 0);
        this.score += this.waveReward;
      }
      if (this.wave === 3) { this.status = this.stage === LEVELS.length - 1 ? 'won' : 'stage-clear'; this.events.push({ type: 'end', x: h.x, y: h.y }); }
      else if (this.clearedAt < 0) {
        this.clearedAt = this.time; h.hp = Math.min(h.max, h.hp + 35);
        this.message = `破陣！獎勵 +${this.waveReward} · 氣血 +35　向右前進 →`; this.messageUntil = Infinity;
      } else if (this.time - this.clearedAt > .8 && h.x > (this.wave === 1 ? 900 : 1770)) this.spawn();
    }
  }
  special() {
    const h=this.hero;
    if(this.status!=='playing'||this.paused||h.hp<=0)return false;
    let reason='';
    if((h.specialCooldown??0)>0)reason='必殺技冷卻中';
    else if(h.hp<=SPECIAL_COST)reason='氣血不足，必須高於 12';
    else if(h.z>0||h.vz>0||h.dodge>0)reason='請落地站穩後施放';
    if(reason){this.message=reason;this.messageUntil=this.time+1.2;return false;}
    h.hp-=SPECIAL_COST;this.waveDamage+=SPECIAL_COST;h.specialCooldown=SPECIAL_COOLDOWN;
    h.stun=0;h.inv=Math.max(h.inv,.85);h.step=3;h.last=this.time;h.moving=false;this.queuedUntil=0;
    h.attack={move:'special',elapsed:0,duration:.8,impact:.24,hit:false,face:h.face,x:h.x,y:h.y};
    this.message=SPECIALS[h.heroId!].name+'！';this.messageUntil=this.time+1.2;
    this.events.push({type:'swing',x:h.x,y:h.y,value:3,heroId:h.heroId});return true;
  }
  swing() {
    const h = this.hero;
    h.step = comboStep(h.step, h.last * 1000, this.time * 1000); h.last = this.time;
    const s = this.slash(h.step);
    h.attack = { move: 'slash', elapsed: 0, duration: s.duration, impact: s.impact, hit: false, face: h.face, x: h.x, y: h.y };
    this.events.push({ type: 'swing', x: h.x, y: h.y, value: h.step, heroId: h.heroId });
  }
  ai(e: Fighter, index: number, dt: number) {
    if (e.hp <= 0 || e.stun > 0 || e.attack || this.hero.hp <= 0) return;
    const h = this.hero, dx = h.x - e.x, dy = h.y - e.y;
    e.face = dx >= 0 ? 1 : -1;
    const boss = isBoss(e.kind), enraged = boss && e.hp <= e.max / 2;
    const reach = boss ? 115 : e.kind === 'heavy' ? 74 : 60;
    const activeAttackers = this.enemies.filter(f => f.attack).length;
    if (e.cooldown <= 0 && activeAttackers < 2 && Math.abs(dy) < 27 && Math.abs(dx) < (boss ? 250 : reach)) {
      let move: Move = 'slash';
      if (boss) move = e.kind === 'marshal' ? (['sweep', 'charge', 'slam'] as Move[])[e.attacks % 3] : e.attacks % 2 === 0 ? 'slam' : 'charge';
      if ((move === 'slam' && Math.abs(dx) > 125) || (move === 'sweep' && Math.abs(dx) > 160)) move = 'charge';
      const windup = boss ? (enraged ? .64 : .85) : e.kind === 'heavy' ? .7 : .48;
      e.attack = { move, elapsed: 0, duration: windup + (boss ? .55 : .32), impact: windup, hit: false, face: e.face, x: e.x, y: e.y };
      e.cooldown = boss ? (enraged ? 1.65 : 2.2) : 1.6 + index % 3 * .15; e.attacks++;
      return;
    }
    const laneOffset = e.cooldown > .25 ? (index % 3 - 1) * 28 : 0;
    const targetY = clamp(h.y + laneOffset, 352, 500), speed = stats[e.kind].speed * (enraged ? 1.25 : 1);
    const moveX = Math.abs(dx) > reach - 8 ? Math.sign(dx) : 0;
    const moveY = Math.abs(targetY - e.y) > 3 ? Math.sign(targetY - e.y) : 0;
    e.x = clamp(e.x + moveX * speed * dt, 25, 2770); e.y = clamp(e.y + moveY * speed * .65 * dt, 350, 503);
    e.moving = !!(moveX || moveY);
  }
  resolve(f: Fighter, a: Attack) {
    // Ground targets can only be struck within the same low-height band.
    if (f.z > 38) return;
    const heroAttack = f === this.hero, special=heroAttack&&a.move==='special', s = special?SPECIALS[f.heroId!]:this.slash(f.step);
    if(special)this.events.push({type:'special',x:a.x,y:a.y,value:a.face,heroId:f.heroId});
    const reach = heroAttack ? s.reach : f.kind === 'heavy' ? 88 : 73;
    const bow = !special && heroAttack && f.heroId === 'huangzhong';
    const first = bow && f.step !== 3 ? [...this.enemies, ...this.supplies]
      .filter(t => t.hp > 0 && inRange(a.x, a.y, t.x, t.y, a.face, reach))
      .sort((x, y) => (x.x - y.x) * a.face)[0] : undefined;
    if (bow) this.events.push({ type: 'arrow', x: a.x, y: a.y - 40, value: a.face * (first ? Math.abs(first.x - a.x) : reach), heavy: f.step === 3 });
    for (const t of heroAttack ? this.enemies : [this.hero]) {
      if (bow && first && t.id !== first.id) continue;
      if (t.hp <= 0 || t.inv > 0 || !(special?specialHits(f.heroId!,a.x,a.y,a.face,t.x,t.y,t.z):attackHits(a, t, reach))) continue;
      const damage = heroAttack ? s.damage : stats[f.kind].damage + (a.move === 'slam' ? 7 : 0);
      const actual = Math.min(t.hp, damage); t.hp = Math.max(0, t.hp - damage);
      t.inv = heroAttack ? .16 : .75;
      // Boss keeps its telegraphed move; ordinary enemies are interrupted.
      if (!isBoss(t.kind) || special) { t.stun = heroAttack ? .30 : .22; t.attack = null; }
      t.x = clamp(t.x + a.face * (heroAttack ? s.push : 23), 25, 2770);
      if (heroAttack) {
        this.score += actual * 10 + Math.floor(actual * Math.min(this.hits, 20) * .5); this.hits++; this.bestCombo = Math.max(this.bestCombo, this.hits);
        this.hitDeadline = this.time + 1.7; this.freeze = f.step === 3 ? .065 : .035;
      } else { this.waveDamage += actual; this.hits = 0; this.queuedUntil = 0; }
      this.events.push({ type: 'hit', x: t.x, y: t.y - t.z - 38, value: damage, heavy: f.step === 3 || isBoss(f.kind), ...(heroAttack ? {heroId:f.heroId} : {}) });
      if (!t.hp) {
        this.score += heroAttack ? 100 : 0;
        if (heroAttack) {
          this.kills++;
          if (t.kind === 'heavy') this.pickups.push({ id: ++this.serial, x: t.x, y: t.y, amount: 25 });
        }
        this.events.push({ type: 'death', x: t.x, y: t.y });
      }
    }
    if (heroAttack) {
      for (const box of this.supplies) {
        if (bow && first && box.id !== first.id) continue;
        if (box.hp <= 0 || !(special?specialHits(f.heroId!,a.x,a.y,a.face,box.x,box.y):inRange(a.x,a.y,box.x,box.y,a.face,s.reach))) continue;
        box.hp = Math.max(0, box.hp - s.damage);
        this.events.push({ type: 'crate', x: box.x, y: box.y - 12 });
        if (!box.hp) this.pickups.push({ id: ++this.serial, x: box.x, y: box.y, amount: 40 });
      }
      this.supplies = this.supplies.filter(box => box.hp > 0);
    }
    if (a.move === 'charge') f.x = clamp(a.x + a.face * 190, 25, 2770);
  }
}
