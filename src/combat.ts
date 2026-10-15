/** Pure combat rules, in seconds and world pixels. */
export type Kind = 'hero' | 'soldier' | 'raider' | 'heavy' | 'boss';
export const stats = {
  hero: { hp: 160, speed: 180, damage: 17 },
  soldier: { hp: 48, speed: 62, damage: 8 },
  raider: { hp: 38, speed: 104, damage: 6 },
  heavy: { hp: 90, speed: 42, damage: 13 },
  boss: { hp: 420, speed: 65, damage: 18 },
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
export type Move = 'slash' | 'slam' | 'charge';
export interface Attack {
  move: Move; elapsed: number; duration: number; impact: number; hit: boolean;
  face: number; x: number; y: number;
}
export interface Fighter {
  id: number; kind: Kind; x: number; y: number; hp: number; max: number; face: number;
  z: number; vz: number; inv: number; stun: number; cooldown: number;
  step: number; last: number; attack: Attack | null; moving: boolean;
  dodge: number; dodgeCooldown: number; dashX: number; dashY: number; attacks: number;
}
export interface Input { x: number; y: number; attack?: boolean; jump?: boolean; dodge?: boolean; }
export type Effect = { type: 'hit' | 'swing' | 'jump' | 'dodge' | 'death' | 'wave' | 'end'; x: number; y: number; value?: number; heavy?: boolean };
export function attackHits(a: Attack, target: Fighter, reach: number) {
  if (target.z > 38) return false;
  if (a.move === 'slam') return Math.hypot((target.x - a.x) / 1.4, target.y - a.y) < 88;
  if (a.move === 'charge') return inRange(a.x, a.y, target.x, target.y, a.face, 250);
  return inRange(a.x, a.y, target.x, target.y, a.face, reach);
}
/** Deterministic, renderer-independent game simulation. */
export class Campaign {
  hero: Fighter;
  enemies: Fighter[] = [];
  time = 0;
  wave = 0;
  score = 0;
  hits = 0;
  bestCombo = 0;
  hitDeadline = 0;
  paused = false;
  status: 'ready' | 'playing' | 'won' | 'lost' = 'ready';
  events: Effect[] = [];
  message = '暮色關隘';
  messageUntil = 0;
  queuedUntil = 0;
  freeze = 0;
  clearedAt = -1;
  private serial = 0;
  constructor() { this.hero = this.fighter('hero', 180, 412); }
  fighter(kind: Kind, x: number, y: number): Fighter {
    return { id: ++this.serial, kind, x, y, hp: stats[kind].hp, max: stats[kind].hp,
      face: kind === 'hero' ? 1 : -1, z: 0, vz: 0, inv: 0, stun: 0, cooldown: .9,
      step: 0, last: -10, attack: null, moving: false, dodge: 0, dodgeCooldown: 0,
      dashX: 0, dashY: 0, attacks: 0 };
  }
  start() { if (this.status !== 'ready') return; this.status = 'playing'; this.spawn(); }
  togglePause() { if (this.status === 'playing') this.paused = !this.paused; }
  spawn() {
    this.wave++;
    this.clearedAt = -1;
    const base = [0, 430, 1230, 2110][this.wave];
    const kinds: Kind[] = this.wave === 1 ? ['soldier', 'soldier', 'raider'] :
      this.wave === 2 ? ['heavy', 'raider', 'soldier', 'raider'] : ['boss', 'soldier', 'heavy'];
    this.enemies = kinds.map((k, i) => this.fighter(k, base + i * 82, 370 + i % 3 * 49));
    this.message = this.wave === 3 ? '鐵獄・守關將軍　　留意地面蓄力範圍' : `第 ${this.wave} 陣　／　擊退守軍`;
    this.messageUntil = this.time + 3;
    this.events.push({ type: 'wave', x: base, y: 400 });
  }
  tick(rawDt: number, input: Input) {
    this.events = [];
    if (this.status !== 'playing' || this.paused) return;
    const dt = clamp(rawDt, 0, .033);
    // Preserve presses during hit-stop; don't let a frozen frame eat a combo input.
    if (input.attack) this.queuedUntil = this.time + .38;
    if (this.freeze > 0) { this.freeze -= dt; return; }
    this.time += dt;
    if (this.time > this.hitDeadline) this.hits = 0;
    const h = this.hero;
    for (const f of [h, ...this.enemies]) {
      f.inv = Math.max(0, f.inv - dt); f.stun = Math.max(0, f.stun - dt);
      f.cooldown -= dt; f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt); f.moving = false;
      if (f.z > 0 || f.vz > 0) { f.z += f.vz * dt; f.vz -= 900 * dt; if (f.z <= 0) { f.z = 0; f.vz = 0; } }
    }
    if (input.dodge && h.dodgeCooldown <= 0 && h.stun <= 0 && h.z === 0) {
      const length = Math.hypot(input.x, input.y);
      h.dashX = length ? input.x / length : h.face; h.dashY = length ? input.y / length : 0;
      h.dodge = .22; h.dodgeCooldown = .95; h.inv = .28; h.attack = null; this.queuedUntil = 0;
      this.events.push({ type: 'dodge', x: h.x, y: h.y });
    }
    if (h.dodge > 0) { h.dodge -= dt; h.x += h.dashX * 410 * dt; h.y += h.dashY * 245 * dt; }
    else if (h.stun <= 0) {
      if (input.jump && h.z === 0) { h.vz = 360; this.events.push({ type: 'jump', x: h.x, y: h.y }); }
      if (this.queuedUntil > this.time && !h.attack) { this.swing(); this.queuedUntil = 0; }
      if (!h.attack) {
        const len = Math.hypot(input.x, input.y) || 1;
        h.x += input.x / len * stats.hero.speed * dt; h.y += input.y / len * 125 * dt;
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
    // Death takes precedence over simultaneous final clearance.
    if (h.hp <= 0) { this.status = 'lost'; this.events.push({ type: 'end', x: h.x, y: h.y }); return; }
    if (!this.enemies.length) {
      if (this.wave === 3) { this.status = 'won'; this.events.push({ type: 'end', x: h.x, y: h.y }); }
      else if (this.clearedAt < 0) {
        this.clearedAt = this.time; h.hp = Math.min(h.max, h.hp + 35);
        this.message = '破陣！氣血 +35　　向右前進 →'; this.messageUntil = Infinity;
      } else if (this.time - this.clearedAt > .8 && h.x > (this.wave === 1 ? 900 : 1770)) this.spawn();
    }
  }
  swing() {
    const h = this.hero;
    h.step = comboStep(h.step, h.last * 1000, this.time * 1000); h.last = this.time;
    const s = SLASHES[h.step - 1];
    h.attack = { move: 'slash', elapsed: 0, duration: s.duration, impact: s.impact, hit: false, face: h.face, x: h.x, y: h.y };
    this.events.push({ type: 'swing', x: h.x, y: h.y, value: h.step });
  }
  ai(e: Fighter, index: number, dt: number) {
    if (e.hp <= 0 || e.stun > 0 || e.attack || this.hero.hp <= 0) return;
    const h = this.hero, dx = h.x - e.x, dy = h.y - e.y;
    e.face = dx >= 0 ? 1 : -1;
    const boss = e.kind === 'boss', enraged = boss && e.hp <= e.max / 2;
    const reach = boss ? 115 : e.kind === 'heavy' ? 74 : 60;
    const activeAttackers = this.enemies.filter(f => f.attack).length;
    if (e.cooldown <= 0 && activeAttackers < 2 && Math.abs(dy) < 27 && Math.abs(dx) < (boss ? 250 : reach)) {
      let move: Move = 'slash';
      if (boss) move = e.attacks % 2 === 0 ? 'slam' : 'charge';
      if (move === 'slam' && Math.abs(dx) > 125) move = 'charge';
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
    const heroAttack = f === this.hero, s = SLASHES[Math.max(0, f.step - 1)];
    const reach = heroAttack ? s.reach : f.kind === 'heavy' ? 88 : 73;
    for (const t of heroAttack ? this.enemies : [this.hero]) {
      if (t.hp <= 0 || t.inv > 0 || !attackHits(a, t, reach)) continue;
      const damage = heroAttack ? s.damage : stats[f.kind].damage + (a.move === 'slam' ? 7 : 0);
      const actual = Math.min(t.hp, damage); t.hp = Math.max(0, t.hp - damage);
      t.inv = heroAttack ? .16 : .75;
      // Boss keeps its telegraphed move; ordinary enemies are interrupted.
      if (t.kind !== 'boss') { t.stun = heroAttack ? .30 : .22; t.attack = null; }
      t.x = clamp(t.x + a.face * (heroAttack ? s.push : 23), 25, 2770);
      if (heroAttack) {
        this.score += actual * 10; this.hits++; this.bestCombo = Math.max(this.bestCombo, this.hits);
        this.hitDeadline = this.time + 1.7; this.freeze = f.step === 3 ? .065 : .035;
      } else { this.hits = 0; this.queuedUntil = 0; }
      this.events.push({ type: 'hit', x: t.x, y: t.y - t.z - 38, value: damage, heavy: f.step === 3 || f.kind === 'boss' });
      if (!t.hp) { this.score += heroAttack ? 100 : 0; this.events.push({ type: 'death', x: t.x, y: t.y }); }
    }
    if (a.move === 'charge') f.x = clamp(a.x + a.face * 190, 25, 2770);
  }
}
