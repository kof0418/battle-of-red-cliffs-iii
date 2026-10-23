import {MOUNT_SLASH,MOUNT_WAVE,type Horse} from './horse.ts';
import {WEAPONS,crateLoot,barrelLoot,isWeapon,type WeaponId,type LootId} from './loot.ts';
import {THROWS,type Grapple} from './throws.ts';
import {SPECIALS,SPECIAL_COST,SPECIAL_COOLDOWN,specialHits} from './specials.ts';
import { HEROES, type HeroId } from './heroes.ts';
import { LEVELS, WORLD_WIDTH, ARENA_ENDS, arenaStart } from './levels.ts';
import { fieldEvent, fieldHits } from './battlefield.ts';
/** Pure combat rules, in seconds and world pixels. */
export type Kind = 'hero' | 'soldier' | 'raider' | 'heavy' | 'archer' | 'spearman' | 'hammer' | 'boss' | 'marshal' | 'hunter' | 'frostlord' | 'regent';
export const stats = {
  hero: { hp: 160, speed: 180, damage: 17 },
  soldier: { hp: 48, speed: 62, damage: 8 },
  raider: { hp: 38, speed: 104, damage: 6 },
  heavy: { hp: 90, speed: 42, damage: 13 },
  archer:{hp:36,speed:60,damage:9},
  spearman:{hp:58,speed:58,damage:10},
  hammer:{hp:100,speed:35,damage:16},
  boss: { hp: 420, speed: 65, damage: 18 },
  hunter:{hp:520,speed:88,damage:16},
  frostlord:{hp:620,speed:40,damage:22},
  regent:{hp:680,speed:90,damage:20},
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
export const isBoss = (kind: Kind) => kind === 'boss' || kind === 'marshal' || kind==='hunter'||kind==='frostlord'||kind==='regent';
export type Move = 'mounted'|'wave'|'fan'|'ring'|'cross'|'shot' | 'special' | 'slash' | 'slam' | 'charge' | 'sweep';
export interface Supply { id: number; x: number; y: number; hp: number; loot?:LootId; availableAt?:number; weaponHits?:number; }
export function nearPickup(hero: {x: number; y: number; z: number}, item: {x: number; y: number}) {
  return hero.z <= 8 && Math.abs(item.x - hero.x) <= 32 && Math.abs(item.y - hero.y) <= 32;
}
export interface Pickup { id: number; x: number; y: number; amount: number; loot?:LootId; availableAt?:number; weaponHits?:number; }
export interface Attack {
  weapon?:WeaponId; pulses?: number; move: Move; elapsed: number; duration: number; impact: number; hit: boolean;
  face: number; x: number; y: number;
}
export interface Fighter {
  mounted?:boolean; steed?:Horse; mountCooldown?:number; equipped?:{id:WeaponId;uses:number;hits?:number}; id: number; kind: Kind; heroId?: HeroId; x: number; y: number; hp: number; max: number; face: number;
  z: number; vz: number; inv: number; stun: number; cooldown: number;
  step: number; last: number; attack: Attack | null; moving: boolean;
  grapplePose?:'hold'|'held'|'air'|'air-held'|'thrown'|'throw'; throwSpin?:number; knockdown?:number; grappleCooldown?:number; specialCooldown?: number; dodge: number; dodgeCooldown: number; dashX: number; dashY: number; attacks: number;
}
export interface Input { x: number; y: number; dropWeapon?:boolean; horseSpecial?:boolean; throwX?:number; grappleAttack?: boolean; special?: boolean; attack?: boolean; jump?: boolean; dodge?: boolean; }
export type Effect = { type: 'weapon-drop'|'gong'|'mount'|'blade-wave'|'book'|'equip' | 'grapple-hit' | 'grab-air' | 'grab' | 'throw' | 'escape' | 'special-start' | 'special' | 'hit' | 'swing' | 'jump' | 'dodge' | 'death' | 'wave' | 'end' | 'heal' | 'crate' | 'arrow' | 'volley' | 'fire'; x: number; y: number; value?: number; heavy?: boolean; heroId?: HeroId;dy?:number;weapon?:WeaponId };
export function attackHits(a: Attack, target: Fighter, reach: number) {
  if (target.z > 38) return false;
  if(a.move==='fan'){const dx=(target.x-a.x)*a.face;return dx>0&&dx<330&&[-.3,0,.3].some(slope=>Math.abs(target.y-a.y-dx*slope)<16);}
  if(a.move==='ring'){const r=Math.hypot(target.x-a.x,target.y-a.y);return r>48&&r<155;}
  if(a.move==='cross')return (Math.abs(target.x-a.x)<28&&Math.abs(target.y-a.y)<155)||(Math.abs(target.x-a.x)<180&&Math.abs(target.y-a.y)<24);
  if (a.move === 'shot') return Math.abs(target.y-a.y)<18&&inRange(a.x,a.y,target.x,target.y,a.face,340);
  if (a.move === 'sweep') return Math.abs(target.x - a.x) < 170 && Math.abs(target.y - a.y) < 49;
  if (a.move === 'slam') return Math.hypot((target.x - a.x) / 1.4, target.y - a.y) < 88;
  if (a.move === 'charge') return inRange(a.x, a.y, target.x, target.y, a.face, 250);
  return inRange(a.x, a.y, target.x, target.y, a.face, reach);
}
/** Deterministic, renderer-independent game simulation. */
export class Campaign {
  hero: Fighter;
  grapple:Grapple|null=null;
  enemies: Fighter[] = [];
  supplies: Supply[] = [];
  barrels:Supply[]=[];
  horses:Horse[]=[];
  pickups: Pickup[] = [];
  projectiles:{id:number;x:number;y:number;face:number;remaining:number;damage:number;wave?:boolean;arrow?:boolean;piercing?:boolean;push?:number;hits?:number[]}[]=[];
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
  get arenaEnd(){return ARENA_ENDS[this.wave-1]??ARENA_ENDS[0];}
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
  private horseQueued=false;
  private dropQueued=false;
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
    const hp=this.hero.hp,equipped=this.hero.equipped;
    this.stage++; this.wave = 0; this.hero = this.fighter('hero', 180, 412);
    this.hero.hp=hp;this.hero.equipped=equipped;
    this.resetTransient(); this.status = 'playing'; this.spawn(); return true;
  }
  /** Replay the current wave, rolling back its score and kills to prevent farming. */
  continueRun() {
    if (this.status !== 'lost' || this.continues <= 0) return false;
    this.continues--; this.continuesUsed++;
    this.score = this.checkpointScore; this.kills = this.checkpointKills;
    const x = arenaStart(this.wave)+180;
    this.hero = this.fighter('hero', x, 412); this.hero.inv = 1.5;
    this.wave--; this.resetTransient(); this.status = 'playing'; this.spawn(); return true;
  }
  private resetTransient() {
    this.releaseGrapple(false);this.projectiles=[];this.horses=[];
    this.paused = false; this.freeze = 0; this.queuedUntil = 0; this.hits = 0;
    this.specialQueued = false;this.horseQueued=false;this.dropQueued=false; this.hitDeadline = 0; this.events = []; this.clearedAt = -1;
  }
  spawn() {
    this.wave++; this.clearedAt = -1;
    this.waveStarted = this.time; this.waveDamage = 0; this.waveReward = -1;
    this.checkpointScore = this.score; this.checkpointKills = this.kills;
    const base = arenaStart(this.wave)+330;
    const kinds = this.level.waves[this.wave - 1];
    this.enemies = kinds.map((k, i) => this.fighter(k, base + i * 82, 370 + i % 3 * 49));
    this.supplies = [{ id: ++this.serial, x: base + 240, y: (this.wave+this.stage)%2?499:354, hp: 24 }];
    this.barrels=[{id:++this.serial,x:base+420,y:(this.wave+this.stage)%2?354:499,hp:24,loot:barrelLoot(this.stage,this.wave)}];
    this.pickups = [];this.projectiles=[];this.horses=this.horses.filter(h=>h.waiting);
    this.message = this.wave === this.level.waves.length ? `${this.level.boss}　　留意地面蓄力範圍` : `${this.level.title}　${this.level.sections[this.wave-1]} · ${this.stage === 0 ? '留意箭雨，移出框線' : this.stage===1?'火船來襲，跳躍避火':'留意伏兵與蓄力攻擊'}`;
    this.messageUntil = this.time + 3;
    this.events.push({ type: 'wave', x: base, y: 400 });
  }
  tick(rawDt: number, input: Input) {
    this.events = [];
    if (this.status !== 'playing' || this.paused) return;
    const dt = clamp(rawDt, 0, .033);
    // Preserve presses during hit-stop; don't let a frozen frame eat a combo input.
    if(input.dropWeapon||(input.attack&&input.jump))this.dropQueued=true;
    if(input.horseSpecial&&this.hero.mounted)this.horseQueued=true;
    if (input.special && !this.grapple) this.specialQueued = true;
    if (input.attack && !this.grapple) this.queuedUntil = this.time + .38;
    if (this.freeze > 0) { this.freeze -= dt; return; }
    this.time += dt;
    if (this.time > this.hitDeadline) this.hits = 0;
    const h = this.hero;
    for (const f of [h, ...this.enemies]) {
      f.inv = Math.max(0, f.inv - dt); f.stun = Math.max(0, f.stun - dt);
      if(f.knockdown!==undefined)f.knockdown=Math.max(0,f.knockdown-dt);
      f.grappleCooldown=Math.max(0,(f.grappleCooldown??0)-dt);
      f.specialCooldown = Math.max(0,(f.specialCooldown ?? 0)-dt);
      f.cooldown -= dt; f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt); f.moving = false;
      if ((!this.grapple || (f!==h && f.id!==this.grapple.target)) && (f.z > 0 || f.vz > 0)) { f.z += f.vz * dt; f.vz -= 900 * dt; if (f.z <= 0) { f.z = 0; f.vz = 0; if (f === h) { f.stun = Math.max(f.stun, .12); f.attack = null; } } }
    }
    if(this.grapple && (h.hp<=0||h.stun>0||!this.enemies.some(e=>e.id===this.grapple!.target&&e.hp>0)))this.releaseGrapple(false);
    if(h.mountCooldown!==undefined)h.mountCooldown=Math.max(0,h.mountCooldown-dt);
    this.updateHorses(dt);
    if(this.horseQueued&&h.mounted&&(h.specialCooldown??0)<=0&&h.stun<=0&&!h.attack){
      h.specialCooldown=1.3;h.attack={move:'wave',elapsed:0,duration:.8,impact:.32,hit:false,face:h.face,x:h.x,y:h.y};this.queuedUntil=0;
      this.message='騎乘必殺 · 斬風刀波！';this.messageUntil=this.time+1.2;
    }
    this.horseQueued=false;
    if(this.dropQueued&&h.equipped&&!h.mounted&&!this.grapple&&h.stun<=0&&h.z===0){
      const weapon=h.equipped;this.pickups.push({id:++this.serial,x:clamp(h.x+h.face*65,25,this.arenaEnd-30),y:h.y,amount:0,loot:weapon.id,weaponHits:weapon.hits??0,availableAt:this.time+.7});
      h.equipped=undefined;h.attack=null;this.queuedUntil=0;this.specialQueued=false;input={...input,attack:false,jump:false,special:false};this.message='放下武器，可再次拾取';this.messageUntil=this.time+1.5;
    }
    this.dropQueued=false;
    if(input.jump&&h.mounted)this.dismount(false);
    const occupied=!!this.grapple;
    if(this.grapple)this.updateGrapple(dt,input);
    if(this.specialQueued){this.specialQueued=false;this.special();}
    const casting=occupied||h.attack?.move==='special';
    if(h.attack?.move==='special'&&h.heroId==='zhaoyun'&&h.attack.elapsed>.12&&h.attack!.elapsed<.58){h.x+=h.face*170*dt;h.attack!.x=h.x;}
    if (input.dodge && !h.mounted && !casting && h.dodgeCooldown <= 0 && h.stun <= 0 && h.z === 0) {
      const length = Math.hypot(input.x, input.y);
      h.dashX = length ? input.x / length : h.face; h.dashY = length ? input.y / length : 0;
      h.dodge = .22; h.dodgeCooldown = .95; h.inv = .28; h.attack = null; this.queuedUntil = 0;
      this.events.push({ type: 'dodge', x: h.x, y: h.y });
    }
    if (h.dodge > 0) { h.dodge -= dt; h.x += h.dashX * 410 * dt; h.y += h.dashY * 245 * dt; }
    else if (h.stun <= 0 && !casting) {
      if (input.jump && !h.mounted && h.z === 0) { h.vz = 360; this.events.push({ type: 'jump', x: h.x, y: h.y }); }
      if (this.queuedUntil > this.time && !h.attack) { this.swing(); this.queuedUntil = 0; }
      if (!h.attack) {
        const len = Math.hypot(input.x, input.y) || 1;
        h.x += input.x / len * (h.mounted?290:this.champion.speed) * dt; h.y += input.y / len * (h.mounted?290:this.champion.speed) * (125 / 180) * dt;
        h.moving = !!(input.x || input.y); if (input.x) h.face = Math.sign(input.x);
      }
    }
    if(!occupied && !h.attack && h.stun<=0 && h.z===0 && h.dodge<=0 && !input.attack && !input.special && (input.x||input.y))this.tryGrab(input);
    // Each arena opens only after its defenders fall.
    const right = this.arenaEnd;
    h.x = clamp(h.x, 25, this.enemies.length ? right : WORLD_WIDTH-30); h.y = clamp(h.y, 350, 503);
    for (const f of [h, ...this.enemies]) {
      if (f.hp <= 0 || !f.attack) continue;
      const a = f.attack; a.elapsed += dt;
      if(a.move==='special'){
        const times=[.18,.38,.58];let pulse=a.pulses??0;
        while(pulse<times.length&&a.elapsed>=times[pulse]){this.resolve(f,a);pulse++;}a.pulses=pulse;a.hit=pulse>=3;
      }else if (a.elapsed >= a.impact && !a.hit) { a.hit = true; this.resolve(f, a); }
      if (a.elapsed >= a.duration) f.attack = null;
    }
    this.updateProjectiles(dt);
    this.enemies.forEach((e, i) => this.ai(e, i, dt));
    // Gentle separation prevents enemies occupying exactly the same lane and pixel.
    for (let i = 0; i < this.enemies.length; i++) for (let j = i + 1; j < this.enemies.length; j++) {
      const a = this.enemies[i], b = this.enemies[j];
      if(this.grapple && (a.id===this.grapple.target||b.id===this.grapple.target))continue;
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
        const damage=Math.min(h.hp,12);h.hp-=damage;this.waveDamage+=damage;if(h.mounted)this.dismount(true);else this.damageEquipment();
        h.inv=.75;h.stun=.22;h.attack=null;this.hits=0;this.queuedUntil=0;
        this.events.push({type:'hit',x:h.x,y:h.y-h.z-38,value:damage});
      }
    }
    if(this.grapple&&(h.hp<=0||h.stun>0))this.releaseGrapple(false);
    // Death takes precedence over simultaneous final clearance.
    if (h.hp <= 0) { this.status = 'lost'; this.events.push({ type: 'end', x: h.x, y: h.y }); return; }
    this.pickups = this.pickups.filter(p => {
      if ((p.availableAt??0)>this.time||!nearPickup(h,p)||h.attack||this.grapple||h.stun>0) return true;
      if(p.loot==='book'){this.score+=1500;this.message='兵書 +1500 分';this.messageUntil=this.time+2;this.events.push({type:'book',x:p.x,y:p.y,value:1500});return false;}
      if(p.loot==='gong'){if(h.mounted)return true;this.summonHorses();return false;}
      if(p.loot&&isWeapon(p.loot)){
        if(h.equipped||h.mounted)return true;
        h.equipped={id:p.loot,uses:WEAPONS[p.loot].uses,hits:p.weaponHits??0};
        this.message=`拾取${WEAPONS[p.loot].name} · 攻擊使用`;this.messageUntil=this.time+2;
        this.events.push({type:'equip',x:p.x,y:p.y});return false;
      }
      if(h.hp>=h.max)return true;
      const amount = Math.min(p.amount, h.max - h.hp); h.hp += amount;
      this.events.push({ type: 'heal', x: p.x, y: p.y - 45, value: amount }); return false;
    });
    if (!this.enemies.length) {
      if (this.waveReward < 0) {
        const speed = Math.max(0, 1200 - Math.floor(this.time - this.waveStarted) * 10);
        this.waveReward = speed + (this.waveDamage === 0 ? 800 : 0);
        this.score += this.waveReward;
      }
      if (this.wave === this.level.waves.length) { this.status = this.stage === LEVELS.length - 1 ? 'won' : 'stage-clear'; this.events.push({ type: 'end', x: h.x, y: h.y }); }
      else if (this.clearedAt < 0) {
        this.clearedAt = this.time;
        this.message = `破陣！獎勵 +${this.waveReward}　向右前進 →`; this.messageUntil = Infinity;
      } else if (this.time - this.clearedAt > .8 && h.x > (this.arenaEnd-70)) this.spawn();
    }
  }
  dismount(hit:boolean){
    const h=this.hero;if(!h.mounted)return;
    const horse=h.steed??{id:++this.serial,x:h.x,y:h.y,target:h.x,life:20,moving:false,falls:0};
    horse.x=h.x;horse.y=h.y;horse.target=h.x;
    if(hit)horse.falls=(horse.falls??0)+1;
    horse.fleeing=(horse.falls??0)>=2;horse.waiting=!horse.fleeing;horse.awaitSeparation=true;horse.moving=!!horse.fleeing;horse.life=20;
    this.horses.push(horse);h.steed=undefined;h.mounted=false;h.mountCooldown=hit?1.8:1.2;h.attack=null;this.queuedUntil=0;this.horseQueued=false;
    if(hit){h.z=28;h.vz=150;h.stun=.8;h.knockdown=.8;}
    this.message=horse.fleeing?'第二次落馬！馬匹受驚跑走':hit?'落馬！馬匹留在原地，可再次上馬':'下馬，馬匹留在原地等待';this.messageUntil=this.time+3;
  }
  damageEquipment(){
    const h=this.hero;if(!h.equipped||h.mounted)return;
    h.equipped.hits=(h.equipped.hits??0)+1;
    if(h.equipped.hits>=2){this.events.push({type:'weapon-drop',x:h.x,y:h.y,weapon:h.equipped.id});h.equipped=undefined;this.message='武器脫手損壞！';this.messageUntil=this.time+1.4;}
  }
  summonHorses(){
    const start=clamp(this.hero.x-340,0,WORLD_WIDTH-960)+1020;
    this.horses=[...this.horses.filter(h=>h.waiting),{id:++this.serial,x:start,y:this.hero.y,target:clamp(this.hero.x+100,60,this.arenaEnd-50),life:20,moving:true,falls:0}];
    this.events.push({type:'gong',x:this.hero.x,y:this.hero.y});this.message='銅鑼響！馬匹自右方奔來，靠近即可上馬';this.messageUntil=this.time+4;
  }
  updateHorses(dt:number){
    const h=this.hero;
    this.horses=this.horses.filter(horse=>{
      if(!horse.waiting)horse.life-=dt;horse.moving=!!horse.fleeing||(!horse.waiting&&(h.mounted===true||horse.x>horse.target));
      if(horse.moving)horse.x=Math.max(h.mounted||horse.fleeing?-200:horse.target,horse.x-260*dt);
      if(horse.awaitSeparation&&(Math.abs(horse.x-h.x)>60||Math.abs(horse.y-h.y)>36))horse.awaitSeparation=false;
      if(!horse.awaitSeparation&&!horse.fleeing&&!h.mounted&&(h.mountCooldown??0)<=0&&h.z<=8&&h.stun<=0&&!h.attack&&!this.grapple&&Math.abs(horse.x-h.x)<48&&Math.abs(horse.y-h.y)<28){
        h.mounted=true;h.steed=horse;h.attack=null;this.queuedUntil=0;this.events.push({type:'mount',x:h.x,y:h.y});this.message='上馬！攻擊揮刀 · 左右＋攻擊刀波 · 跳躍下馬';this.messageUntil=this.time+4;return false;
      }
      return horse.life>0&&horse.x>-100;
    });
  }
  updateProjectiles(dt:number){
    this.projectiles=this.projectiles.filter(p=>{
      const distance=Math.min(p.remaining,(p.arrow?850:p.wave?560:640)*dt),next=p.x+p.face*distance;
      const targets:(Fighter|Supply)[]=[...this.enemies,...(p.arrow?[...this.supplies,...this.barrels]:[])];
      const contacts=targets.filter(e=>e.hp>0&&(!('z' in e)||e.z<=38)&&Math.abs(e.y-p.y)<(p.wave?38:22)&&!p.hits?.includes(e.id)&&(e.x-p.x)*p.face>=-12&&(e.x-next)*p.face<=12).sort((a,b)=>(a.x-b.x)*p.face);
      for(const target of contacts){
        (p.hits??=[]).push(target.id);
        if(!('kind' in target)){
          target.hp=Math.max(0,target.hp-p.damage);this.events.push({type:'crate',x:target.x,y:target.y-12});
          if(!target.hp){const loot=target.loot??crateLoot(this.stage,this.wave);this.pickups.push({id:++this.serial,x:target.x,y:target.y,loot,amount:loot==='bun'?25:loot==='meat'?40:0});}
        }else if(target.inv<=0){
          target.inv=.2;
          if(!p.arrow||!isBoss(target.kind)){target.stun=p.wave?.55:.32;target.attack=null;}
          target.x=clamp(target.x+p.face*(p.push??(p.wave?40:24)),25,WORLD_WIDTH-30);
          if(p.arrow)this.score+=Math.floor(Math.min(target.hp,p.damage)*Math.min(this.hits,20)*.5);
          this.grappleDamage(target,p.damage);this.freeze=p.piercing?.065:.035;
        }
        if(!p.wave&&!p.piercing)return false;
      }
      p.x=next;p.remaining-=distance;return p.remaining>0&&p.x>=0&&p.x<=WORLD_WIDTH;
    });
    this.supplies=this.supplies.filter(b=>b.hp>0);this.barrels=this.barrels.filter(b=>b.hp>0);
  }
  tryGrab(input:Input){
    const h=this.hero;if(h.mounted||this.grapple||this.status!=='playing'||this.paused||h.hp<=0||h.stun>0||h.attack||h.z>0||h.dodge>0||(h.grappleCooldown??0)>0)return false;
    // Soldiers and bosses can be grabbed during windup, but not on impact or recovery.
    // Filter approach direction before selecting: a closer enemy behind must not block a valid grab.
    const target=this.enemies.filter(e=>e.hp>0&&(!e.attack||(!e.attack.hit&&e.attack.elapsed<e.attack.impact))&&e.z===0&&(e.knockdown??0)<=0&&(e.grappleCooldown??0)<=0&&Math.abs(e.x-h.x)<=44&&Math.abs(e.y-h.y)<=26&&((e.x-h.x)*input.x+(e.y-h.y)*input.y>0))
     .sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    if(!target)return false;
    h.face=target.x>=h.x?1:-1;h.attack=null;h.inv=Math.max(h.inv,.12);h.grapplePose='hold';h.moving=false;target.attack=null;target.grapplePose='held';target.face=-h.face;
    this.grapple={target:target.id,hits:0,deadline:this.time+2.8,started:this.time,phase:'hold',elapsed:0,direction:h.face,air:false,startX:h.x,startZ:0};
    this.queuedUntil=0;this.specialQueued=false;this.message='抓住！跳＋攻擊空中摔，或左右＋攻擊';this.messageUntil=this.time+1.5;
    this.events.push({type:'grab',x:h.x,y:h.y,heroId:h.heroId});return true;
  }
  releaseGrapple(escape:boolean){
    const state=this.grapple;if(!state)return;const e=this.enemies.find(e=>e.id===state.target),h=this.hero;
    h.grapplePose=undefined;h.throwSpin=undefined;h.grappleCooldown=.65;h.attack=null;this.queuedUntil=0;this.specialQueued=false;
    if(e){e.grapplePose=undefined;e.throwSpin=undefined;e.vz=0;e.grappleCooldown=1.2;
      if(escape){e.inv=.4;e.cooldown=.55;e.x=clamp(e.x+h.face*38,25,WORLD_WIDTH-30);}}
    this.grapple=null;
    if(escape){h.stun=Math.max(h.stun,.2);this.message='接招太慢，敵人掙脫！';this.messageUntil=this.time+1.3;this.events.push({type:'escape',x:h.x,y:h.y});}
  }
  grappleDamage(e:Fighter,amount:number){
    const actual=Math.min(e.hp,amount);e.hp-=actual;this.score+=actual*10;this.hits++;this.bestCombo=Math.max(this.bestCombo,this.hits);this.hitDeadline=this.time+1.7;
    this.events.push({type:'hit',x:e.x,y:e.y-e.z-38,value:actual,heroId:this.hero.heroId,heavy:amount>20});
    if(e.hp<=0){this.kills++;this.score+=100;if(e.kind==='heavy')this.pickups.push({id:++this.serial,x:e.x,y:e.y,amount:25});this.events.push({type:'death',x:e.x,y:e.y});if(this.grapple?.target===e.id)this.releaseGrapple(false);}
  }
  updateGrapple(dt:number,input:Input){
    const state=this.grapple!,h=this.hero,e=this.enemies.find(e=>e.id===state.target);if(!e){this.releaseGrapple(false);return;}
    e.attack=null;e.moving=false;h.moving=false;this.queuedUntil=0;this.specialQueued=false;
    const fresh=input.grappleAttack??input.attack;
    if(state.phase==='hold'){
      if(this.time>state.deadline||this.time-state.started>8){this.releaseGrapple(true);return;}
      e.x=clamp(h.x+h.face*27,25,WORLD_WIDTH-30);e.y=h.y;e.z=0;
      if(fresh){
        if(input.throwX??input.x){this.beginThrow(Math.sign(input.throwX??input.x),false);}
        else if(state.hits<2){state.hits++;state.deadline=this.time+2.8;this.grappleDamage(e,7);if(!this.grapple)return;this.events.push({type:'grapple-hit',x:h.x,y:h.y,value:state.hits});this.message=`抓住打擊 ${state.hits}/2`;this.messageUntil=this.time+1;}
        else{this.releaseGrapple(false);this.message='連打三下，鬆開抓取';this.messageUntil=this.time+1;return;}
      }
      if(input.jump&&state.phase==='hold'){state.phase='jump';state.elapsed=0;h.grapplePose='air';e.grapplePose='air-held';this.events.push({type:'grab-air',x:h.x,y:h.y});this.events.push({type:'jump',x:h.x,y:h.y});}
    }else if(state.phase==='jump'){
      state.elapsed+=dt;h.z=Math.sin(Math.min(1,state.elapsed/1.05)*Math.PI)*78;e.z=h.z+24;e.x=clamp(h.x+h.face*24,25,WORLD_WIDTH-30);e.y=h.y;
      if(fresh){this.beginThrow(h.face,true);}else if(state.elapsed>=1.05){h.z=0;this.releaseGrapple(true);}
    }else{
      state.elapsed+=dt;const spec=THROWS[h.heroId!],limit=this.arenaEnd;
      // First pull the enemy to the shoulder, then release into an accelerating fall.
      const lift=Math.min(1,state.elapsed/.18),flight=Math.max(0,Math.min(1,(state.elapsed-.18)/.42));
      const shoulder=h.x+state.direction*12,previousX=e.x;
      e.y=h.y;h.throwSpin=state.direction*(flight>0?24*(1-flight):-12*lift);
      if(state.elapsed<.18){
        e.x=state.startX+(shoulder-state.startX)*lift;
        e.z=state.startZ+(72-state.startZ)*lift;e.throwSpin=-state.direction*65*lift;
      }else{
        e.x=clamp(shoulder+state.direction*spec.distance*flight,25,limit);
        e.z=72*(1-flight)+Math.sin(flight*Math.PI)*30;
        e.throwSpin=state.direction*(-65+155*flight);
      }
      h.z=state.air?Math.max(0,state.startZ-24)*(1-flight):0;
      if(state.elapsed>=.18){
        for(const other of this.enemies){
          if(other.id===e.id||other.hp<=0||other.inv>0||state.collisions?.includes(other.id)||Math.abs(other.y-e.y)>26||Math.abs(other.z-e.z)>90||other.x<Math.min(previousX,e.x)-24||other.x>Math.max(previousX,e.x)+24)continue;
          (state.collisions??=[]).push(other.id);
          other.attack=null;other.stun=Math.max(other.stun,1);other.knockdown=.8;other.inv=.35;
          other.x=clamp(other.x+state.direction*18,25,limit);
          this.grappleDamage(other,24);
        }
      }
      if(flight>=1){e.z=0;h.z=0;e.inv=.35;e.stun=.9;e.knockdown=.65;e.grappleCooldown=1.2;this.events.push({type:'throw',x:e.x,y:e.y,value:state.direction,heroId:h.heroId});
        this.grappleDamage(e,spec.damage+(state.air?14:0));this.releaseGrapple(false);h.stun=Math.max(h.stun,.24);}

    }
  }
  beginThrow(direction:number,air:boolean){
    if(!this.grapple)return;const state=this.grapple,e=this.enemies.find(e=>e.id===state.target);if(!e)return;
    state.phase='throw';state.direction=direction;state.air=air;state.elapsed=0;state.startX=e.x;state.startZ=e.z;this.hero.face=direction;this.hero.grapplePose='throw';e.grapplePose='thrown';
    this.message=THROWS[this.hero.heroId!].name+(air?' · 空中摔':' · '+(direction<0?'左摔':'右摔'));this.messageUntil=this.time+1.1;
  }
  special() {
    const h=this.hero;
    if(this.status!=='playing'||this.paused||h.hp<=0||this.grapple||h.mounted)return false;
    let reason='';
    if((h.specialCooldown??0)>0||h.attack?.move==='special')reason='招式尚未收完';
    else if(h.z>0||h.vz>0||h.dodge>0)reason='請落地站穩後施放';
    if(reason){this.message=reason;this.messageUntil=this.time+1.2;return false;}
    h.hp-=SPECIAL_COST;this.waveDamage+=SPECIAL_COST;h.specialCooldown=SPECIAL_COOLDOWN;
    h.stun=0;h.inv=Math.max(h.inv,.45);h.step=3;h.last=this.time;h.moving=false;this.queuedUntil=0;
    h.attack={move:'special',elapsed:0,duration:.85,impact:.18,hit:false,pulses:0,face:h.face,x:h.x,y:h.y};
    this.message=SPECIALS[h.heroId!].name+'！';this.messageUntil=this.time+1.2;
    this.events.push({type:'special-start',x:h.x,y:h.y,value:3,heroId:h.heroId});return true;
  }
  swing() {
    const h = this.hero;
    h.step = comboStep(h.step, h.last * 1000, this.time * 1000); h.last = this.time;
    const weapon=h.mounted?undefined:h.equipped?.id,s=h.mounted?MOUNT_SLASH:weapon?WEAPONS[weapon]:this.slash(h.step);
    h.attack = { ...(weapon?{weapon}:{}), move: h.mounted?'mounted':'slash', elapsed: 0, duration: s.duration, impact: s.impact, hit: false, face: h.face, x: h.x, y: h.y };
    this.events.push({ type: 'swing', x: h.x, y: h.y, value: h.step, heroId: h.heroId });
  }
  ai(e: Fighter, index: number, dt: number) {
    if (this.grapple?.target===e.id || e.hp <= 0 || e.stun > 0 || e.attack || this.hero.hp <= 0) return;
    const h = this.hero, dx = h.x - e.x, dy = h.y - e.y;
    e.face = dx >= 0 ? 1 : -1;
    const boss = isBoss(e.kind), enraged = boss && e.hp <= e.max / 2;
    const reach = e.kind==='archer'?340:e.kind==='spearman'?130:e.kind==='hammer'?96:boss ? 115 : e.kind === 'heavy' ? 74 : 60;
    const activeAttackers = this.enemies.filter(f => f.attack).length;
    if (e.cooldown <= 0 && activeAttackers < 2 && Math.abs(dy) < 27 && Math.abs(dx) < (boss ? 250 : reach)) {
      let move: Move = e.kind==='archer'?'shot':e.kind==='hammer'?'slam':'slash';
      if (boss) move = e.kind==='hunter'?(['fan','charge','fan'] as Move[])[e.attacks%3]:e.kind==='frostlord'?(['ring','slam','ring'] as Move[])[e.attacks%3]:e.kind==='regent'?(['cross','sweep','charge'] as Move[])[e.attacks%3]:e.kind === 'marshal' ? (['sweep', 'charge', 'slam'] as Move[])[e.attacks % 3] : e.attacks % 2 === 0 ? 'slam' : 'charge';
      if ((move === 'slam' && Math.abs(dx) > 125) || (move === 'sweep' && Math.abs(dx) > 160)) move = 'charge';
      const windup = move==='ring'?1.15:move==='cross'?1.05:move==='fan'?.9:e.kind==='archer'?.95:e.kind==='hammer'?1.05:e.kind==='spearman'?.65:boss ? (enraged ? .64 : .85) : e.kind === 'heavy' ? .7 : .48;
      e.attack = { move, elapsed: 0, duration: windup + (boss ? .55 : .32), impact: windup, hit: false, face: e.face, x: e.x, y: e.y };
      if(move==='cross'){e.attack.x=h.x;e.attack.y=h.y;}
      if(move==='fan'||move==='ring'||move==='cross'){this.message=move==='fan'?'玄弦・三路箭陣：換線或跳躍閃避':move==='ring'?'霜岳・震地環：貼近內圈或跳躍':'炎驍・十字斬：離開交叉警戒線';this.messageUntil=this.time+windup;}
      e.cooldown = boss ? (enraged ? 1.65 : 2.2) : 1.6 + index % 3 * .15; e.attacks++;
      return;
    }
    const laneOffset = e.cooldown > .25 ? (index % 3 - 1) * 28 : 0;
    const targetY = clamp(h.y + laneOffset, 352, 500), speed = stats[e.kind].speed * (enraged ? 1.25 : 1);
    const moveX = e.kind==='archer'&&Math.abs(dx)<160?-Math.sign(dx):Math.abs(dx)>reach-8?Math.sign(dx):0;
    const moveY = Math.abs(targetY - e.y) > 3 ? Math.sign(targetY - e.y) : 0;
    e.x = clamp(e.x + moveX * speed * dt, 25, WORLD_WIDTH-30); e.y = clamp(e.y + moveY * speed * .65 * dt, 350, 503);
    e.moving = !!(moveX || moveY);
  }
  resolve(f: Fighter, a: Attack) {
    // Ground targets can only be struck within the same low-height band.
    if (f.z > 38 && a.move!=='special') return;
    const heroAttack = f === this.hero, special=heroAttack&&a.move==='special', s = a.move==='mounted'?MOUNT_SLASH:a.move==='wave'?MOUNT_WAVE:special?SPECIALS[f.heroId!]:a.weapon?WEAPONS[a.weapon]:this.slash(f.step);
    if(heroAttack&&a.weapon==='knife'&&!special){f.equipped=undefined;this.projectiles.push({id:++this.serial,x:a.x+a.face*20,y:a.y,face:a.face,remaining:620,damage:WEAPONS.knife.damage});return;}
    if(heroAttack&&a.move==='wave'){this.projectiles.push({id:++this.serial,x:a.x+a.face*24,y:a.y,face:a.face,remaining:720,damage:48,wave:true,hits:[]});this.events.push({type:'blade-wave',x:a.x,y:a.y,heroId:f.heroId});return;}
    if(special)this.events.push({type:'special',x:a.x,y:a.y,value:a.face,heroId:f.heroId,heavy:(a.pulses??0)>=2});
    const reach = heroAttack ? s.reach : f.kind==='archer'?340:f.kind==='spearman'?145: f.kind === 'heavy' ? 88 : 73;
    if(!heroAttack&&a.move==='shot')this.events.push({type:'arrow',x:a.x,y:a.y-40,value:a.face*340});
    if(!heroAttack&&a.move==='fan')for(const slope of [-.3,0,.3])this.events.push({type:'arrow',x:a.x,y:a.y-40,value:a.face*330,heavy:false,dy:slope*330});
    const bow = !f.mounted && !a.weapon && !special && heroAttack && f.heroId === 'huangzhong';
    if(bow){this.projectiles.push({id:++this.serial,x:a.x+a.face*20,y:a.y,face:a.face,remaining:reach,damage:s.damage,arrow:true,piercing:f.step===3,push:s.push,hits:[]});return;}
    for (const t of heroAttack ? this.enemies : [this.hero]) {
      if (t.hp <= 0 || t.inv > 0 || !(special?specialHits(f.heroId!,a.x,a.y,a.face,t.x,t.y,t.z):attackHits(a, t, reach))) continue;
      const damage = heroAttack ? s.damage : stats[f.kind].damage + (a.move === 'slam' ? 7 : 0);
      const actual = Math.min(t.hp, damage); t.hp = Math.max(0, t.hp - damage);
      t.inv = heroAttack ? (special?.12:.16) : .75;
      // Boss keeps its telegraphed move; ordinary enemies are interrupted.
      if (!isBoss(t.kind) || special) { t.stun = heroAttack ? .30 : .22; t.attack = null; }
      t.x = clamp(t.x + a.face * (heroAttack ? (special && (a.pulses??0)>=2?s.push*3:s.push) : 23), 25, WORLD_WIDTH-30);
      if (heroAttack) {
        this.score += actual * 10 + Math.floor(actual * Math.min(this.hits, 20) * .5); this.hits++; this.bestCombo = Math.max(this.bestCombo, this.hits);
        this.hitDeadline = this.time + 1.7; this.freeze = f.step === 3 ? .065 : .035;
      } else { if(this.hero.mounted)this.dismount(true);else this.damageEquipment();this.waveDamage += actual; this.hits = 0; this.queuedUntil = 0; }
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
      for (const box of [...this.supplies,...this.barrels]) {
        if (box.hp <= 0 || !(special?specialHits(f.heroId!,a.x,a.y,a.face,box.x,box.y):inRange(a.x,a.y,box.x,box.y,a.face,s.reach))) continue;
        box.hp = Math.max(0, box.hp - s.damage);
        this.events.push({ type: 'crate', x: box.x, y: box.y - 12 });
        if (!box.hp) {const loot=box.loot??crateLoot(this.stage,this.wave);this.pickups.push({ id: ++this.serial, x: box.x, y: box.y, amount:loot==='bun'?25:loot==='meat'?40:0,loot });}
      }
      this.supplies = this.supplies.filter(box => box.hp > 0);this.barrels=this.barrels.filter(box=>box.hp>0);
    }
    if (a.move === 'charge') f.x = clamp(a.x + a.face * 190, 25, WORLD_WIDTH-30);
  }
}
