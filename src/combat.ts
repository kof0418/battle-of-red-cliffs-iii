import {mountedArrowVisual} from './motion.ts';
import {HERO_STYLES,BOW_STRIKE} from './hero-styles.ts';
import {encounterPlan,PROPS,RHYTHMS,type Reinforcement,type StageProp} from './encounters.ts';
import {gradeStage,type StageResult} from './stage-grade.ts';
import {BOSS_STYLE,enemyTempo,DIFFICULTIES,bossPlan,bossPhase,frontalGuard,type Difficulty} from './tactics.ts';
import {AERIALS,descendingContact} from './aerial.ts';
import {MOUNT_SLASH,MOUNT_WAVE,mountedStrike,type Horse} from './horse.ts';
import {WEAPON_ROLES,enemyWeapon,weaponPickupReady,WEAPONS,crateLoot,barrelLoot,isWeapon,type WeaponId,type LootId} from './loot.ts';
import {THROWS,throwWeight,bossGrabWindow,sweptThrowContact,type Grapple} from './throws.ts';
import {SPECIALS,SPECIAL_COST,SPECIAL_COOLDOWN,specialHits} from './specials.ts';
import { HEROES, type HeroId } from './heroes.ts';
import { LEVELS, WORLD_WIDTH, ARENA_ENDS, arenaStart } from './levels.ts';
import { fieldEvent, fieldHits } from './battlefield.ts';
/** Pure combat rules, in seconds and world pixels. */
export type Kind = 'brute' | 'mauler' | 'hero' | 'soldier' | 'raider' | 'heavy' | 'archer' | 'spearman' | 'hammer' | 'boss' | 'marshal' | 'hunter' | 'frostlord' | 'regent';
export const stats = {
  brute:{hp:160,speed:67,damage:14},
  mauler:{hp:240,speed:32,damage:19},
  hero: { hp: 160, speed: 180, damage: 17 },
  soldier: { hp: 96, speed: 62, damage: 8 },
  raider: { hp: 76, speed: 104, damage: 6 },
  heavy: { hp: 180, speed: 42, damage: 13 },
  archer:{hp:72,speed:60,damage:9},
  spearman:{hp:116,speed:58,damage:10},
  hammer:{hp:200,speed:35,damage:16},
  boss: { hp: 840, speed: 65, damage: 18 },
  hunter:{hp:1040,speed:88,damage:16},
  frostlord:{hp:1240,speed:40,damage:22},
  regent:{hp:1360,speed:90,damage:20},
  marshal: { hp: 1020, speed: 78, damage: 20 },
};
export const SLASHES = [
  { duration: .28, impact: .10, damage: 17, reach: 96, push: 15 },
  { duration: .32, impact: .12, damage: 21, reach: 106, push: 20 },
  { duration: .44, impact: .18, damage: 34, reach: 122, push: 65 },
];
export function inRange(ax: number, ay: number, bx: number, by: number, facing: number, reach: number) {
  return Math.abs(by - ay) <= 30 && (bx - ax) * facing >= -12 && (bx - ax) * facing <= reach;
}
export function comboStep(previous: number, last: number, now: number) {
  return now - last < 650 ? previous % 3 + 1 : 1;
}
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const isBoss = (kind: Kind) => kind === 'boss' || kind === 'marshal' || kind==='hunter'||kind==='frostlord'||kind==='regent';
export type Move = 'ride-charge'|'cavalry'|'kick'|'bow-strike'|'rescue'|'aerial'|'mounted'|'wave'|'fan'|'ring'|'cross'|'shot' | 'special' | 'slash' | 'slam' | 'charge' | 'sweep';
export interface Supply { id: number; x: number; y: number; hp: number; loot?:LootId; availableAt?:number; weaponHits?:number; }
export function nearPickup(hero: {x: number; y: number; z: number}, item: {x: number; y: number}) {
  return hero.z <= 8 && Math.abs(item.x - hero.x) <= 32 && Math.abs(item.y - hero.y) <= 32;
}
export interface Pickup { id: number; x: number; y: number; amount: number; loot?:LootId; availableAt?:number; weaponHits?:number; }
export interface Attack {
  hitTargets?:number[]; connected?:boolean; weapon?:WeaponId; pulses?: number; move: Move; elapsed: number; duration: number; impact: number; hit: boolean;
  face: number; x: number; y: number;
}
export interface Fighter {
  rideSpeed?:number;rideTurn?:number;rideFacing?:number;rideDash?:number;rideDashCooldown?:number;guard?:number;guardCooldown?:number;airAttackUsed?:boolean; grappleProgress?:number; throwRecovery?:number; mounted?:boolean; steed?:Horse; mountCooldown?:number; equipped?:{id:WeaponId;uses:number;hits?:number}; id: number; kind: Kind; heroId?: HeroId; x: number; y: number; hp: number; max: number; face: number;
  z: number; vz: number; inv: number; stun: number; cooldown: number;
  step: number; last: number; attack: Attack | null; moving: boolean;
  grappleBack?:boolean;grapplePose?:'hold'|'held'|'air'|'air-held'|'thrown'|'throw'; throwSpin?:number; knockdown?:number; grappleCooldown?:number; rescueCooldown?: number; specialCooldown?: number; dodge: number; dodgeCooldown: number; dashX: number; dashY: number; attacks: number;
}
export interface Input { x: number; y: number; dropWeapon?:boolean; horseSpecial?:boolean; throwX?:number; grappleAttack?: boolean; special?: boolean; attack?: boolean; jump?: boolean; dodge?: boolean; }
export type Effect = { type: 'enemy-dismount'|'rescue'|'bonus'|'scene-action'|'reinforcement'|'block'|'guard-break'|'weapon-drop'|'gong'|'mount'|'blade-wave'|'book'|'equip' | 'grapple-hit' | 'grab-air' | 'grab' | 'throw' | 'escape' | 'special-start' | 'special' | 'hit' | 'swing' | 'jump' | 'dodge' | 'death' | 'wave' | 'end' | 'heal' | 'crate' | 'arrow' | 'volley' | 'fire'; x: number; y: number; value?: number; heavy?: boolean; heroId?: HeroId;dy?:number;weapon?:WeaponId };
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
  projectiles:{id:number;x:number;y:number;face:number;remaining:number;damage:number;wave?:boolean;arrow?:boolean;drawOffsetX?:number;drawHeight?:number;piercing?:boolean;push?:number;hits?:number[]}[]=[];
  pending:Reinforcement[]=[];props:StageProp[]=[];fieldSuppressed=false;
  stageStarted=0;stageDamage=0;stageRetries=0;stageBestHit=0;stageInteractions=new Set<number>();stageResults:StageResult[]=[];rallyUntil=0;
  encounterSeed:number;
  get remainingEnemies(){return this.enemies.length+this.pending.reduce((n,g)=>n+g.kinds.length,0);}
  get encounterActive(){return this.remainingEnemies>0;}
  get reinforcementHint(){const group=this.pending[0];return group&&group.due-(this.time-this.waveStarted)<=1?group.side==='pincer'?'援軍接近 · 注意左右兩側':group.side==='ambush'?'竹影有動靜 · 伏兵接近':'前方援軍接近':'';}
  private propShots:Campaign['projectiles']=[];
  cameraLeft=0;
  private dashHits=new Set<number>();
  get enemyLeft(){return this.cameraLeft-90;}
  get enemyRight(){return this.cameraLeft+1050;}
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
  get field() { const f=this.status==='playing'&&this.encounterActive&&!this.fieldSuppressed?fieldEvent(this.stage,this.wave,this.time,this.waveStarted):null;if(f)f.x+=this.cameraLeft-arenaStart(this.wave);return f; }
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
  difficulty:Difficulty;
  constructor(heroId: HeroId = 'guanyu',difficulty:Difficulty='normal',encounterSeed=0) { this.encounterSeed=encounterSeed;this.difficulty=difficulty;this.hero = this.fighter('hero', 180, 412); this.hero.heroId = heroId; }
  get attackLimit(){return DIFFICULTIES[this.difficulty].attackers;}
  get style(){return HERO_STYLES[this.hero.heroId??'guanyu'];}
  get champion() { return HEROES[this.hero.heroId ?? 'guanyu']; }
  selectHero(id: HeroId) { if (this.status !== 'ready') return false; this.hero.heroId = id; return true; }
  slash(step: number) {
    const s = SLASHES[Math.max(0, step - 1)], c = this.champion;
    const result={ duration: s.duration * c.tempo, impact: s.impact * c.tempo, damage: Math.round(s.damage * c.damage), reach: s.reach * c.reach, push: s.push * c.push };
    if(this.hero.heroId==='guanyu'&&step<3)result.push=step===1?10:12;
    if(this.hero.heroId==='weiyan'&&step===3){result.duration=.38;result.impact=.14;result.reach=92;result.push=48;}
    if(this.hero.heroId==='lubu'&&step===3){result.duration=.60;result.impact=.23;}
    return result;
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
    this.stage++; this.wave = 0;this.stageStarted=this.time;this.stageDamage=0;this.stageRetries=0;this.stageBestHit=0;this.stageInteractions.clear(); this.hero = this.fighter('hero', 180, 412);
    this.hero.hp=hp;this.hero.equipped=equipped;
    this.resetTransient(); this.status = 'playing'; this.spawn(); return true;
  }
  /** Replay the current wave, rolling back its score and kills to prevent farming. */
  continueRun() {
    if (this.status !== 'lost' || this.continues <= 0) return false;
    this.continues--; this.continuesUsed++;this.stageRetries++;
    this.score = this.checkpointScore; this.kills = this.checkpointKills;
    const x = arenaStart(this.wave)+180;
    this.hero = this.fighter('hero', x, 412); this.hero.inv = 1.5;
    this.cameraLeft=clamp(x-340,0,WORLD_WIDTH-960);
    this.wave--; this.resetTransient(); this.status = 'playing'; this.spawn(); return true;
  }
  private rideAttackFace?:number;
  private weaponDropUsed=false;
  private foodDropUsed=false;
  private resetTransient() {
    this.rideAttackFace=undefined;this.releaseGrapple(false);this.projectiles=[];this.horses=[];this.pending=[];this.props=[];this.propShots=[];this.fieldSuppressed=false;this.rallyUntil=0;
    this.paused = false; this.freeze = 0; this.queuedUntil = 0; this.hits = 0;
    this.specialQueued = false;this.horseQueued=false;this.dropQueued=false; this.hitDeadline = 0; this.events = []; this.clearedAt = -1;
  }
  spawn() {
    this.wave++; this.clearedAt = -1;this.weaponDropUsed=false;this.foodDropUsed=false;
    if(this.wave===1)this.cameraLeft=0;
    this.waveStarted = this.time; this.waveDamage = 0; this.waveReward = -1;
    this.checkpointScore = this.score; this.checkpointKills = this.kills;
    const base = this.cameraLeft+500;
    const plan=encounterPlan(this.stage,this.wave,this.encounterSeed),kinds=plan.initial;this.pending=plan.groups;this.propShots=[];this.fieldSuppressed=false;this.rallyUntil=0;
    this.props=(this.wave===2||this.wave===4)?[{id:++this.serial,x:this.cameraLeft+630,y:this.wave===2?354:499,hp:32,stageKind:PROPS[this.stage].stageKind}]:[];
    this.enemies = kinds.map((k, i) => this.fighter(k, base + i * 58, 370 + i % 3 * 49));
    if(this.stage===1&&this.wave===6){const rider=this.enemies.find(e=>e.kind==='marshal');if(rider)rider.mounted=true;}
    this.supplies = [{ id: ++this.serial, x: this.cameraLeft+570, y: (this.wave+this.stage)%2?499:354, hp: 24 }];
    this.barrels=[{id:++this.serial,x:this.cameraLeft+750,y:(this.wave+this.stage)%2?354:499,hp:24,loot:barrelLoot(this.stage,this.wave)}];
    if(this.wave===3)this.barrels.push({id:++this.serial,x:this.cameraLeft+860,y:(this.stage%2)?499:354,hp:24,loot:this.stage%2?'knife':'book'});
    this.pickups = [];this.projectiles=[];this.horses=this.horses.filter(h=>h.waiting);
    this.message = this.wave === this.level.waves.length ? `${this.level.boss}　　留意地面蓄力範圍` : `${this.level.title} · ${RHYTHMS[this.stage]} · ${this.level.sections[this.wave-1]}`;
    this.messageUntil = this.time + 3;
    this.events.push({ type: 'wave', x: base, y: 400 });
  }
  tick(rawDt: number, input: Input) {
    this.events = [];
    if (this.status !== 'playing' || this.paused) return;
    const dt = clamp(rawDt, 0, .033);
    // Preserve presses during hit-stop; don't let a frozen frame eat a combo input.
    if((input.dropWeapon||(input.attack&&input.jump))&&this.hero.z===0&&this.hero.vz===0)this.dropQueued=true;
    if(input.horseSpecial&&this.hero.mounted)this.horseQueued=true;
    if (input.special && !this.grapple) this.specialQueued = true;
    if(input.attack&&this.hero.mounted)this.rideAttackFace=input.x?Math.sign(input.x):this.hero.face;
    if (input.attack && !this.grapple) this.queuedUntil = this.time + .38;
    if (this.freeze > 0) { this.freeze -= dt; return; }
    this.time += dt;
    if (this.time > this.hitDeadline) this.hits = 0;
    const h = this.hero;
    for (const f of [h, ...this.enemies]) {
      if(f.throwRecovery!==undefined){f.throwRecovery=Math.max(0,f.throwRecovery-dt);if(!f.throwRecovery)delete f.throwRecovery;}
      if(f.guard!==undefined)f.guard=Math.max(0,f.guard-dt);
      if(f.guardCooldown!==undefined)f.guardCooldown=Math.max(0,f.guardCooldown-dt);
      f.inv = Math.max(0, f.inv - dt); f.stun = Math.max(0, f.stun - dt);
      if((f.knockdown??0)>0){
        if(f!==h&&f.mounted)this.unseatEnemy(f);
        f.knockdown=Math.max(0,f.knockdown!-dt);
        f.attack=null;
        if(f.knockdown===0)f.inv=Math.max(f.inv,f===h?.35:.18);
        else f.stun=Math.max(f.stun,f.knockdown);
      }
      if(f.rescueCooldown!==undefined)f.rescueCooldown=Math.max(0,f.rescueCooldown-dt);
      f.grappleCooldown=Math.max(0,(f.grappleCooldown??0)-dt);
      f.specialCooldown = Math.max(0,(f.specialCooldown ?? 0)-dt);
      f.cooldown -= dt; f.dodgeCooldown = Math.max(0, f.dodgeCooldown - dt); f.moving = false;
      if ((!this.grapple || (f!==h && f.id!==this.grapple.target)) && (f.z > 0 || f.vz > 0)) { f.z += f.vz * dt; f.vz -= 900 * dt; if (f.z <= 0) { f.z = 0; f.vz = 0; if (f === h) { if(f.attack?.move==='aerial'&&!f.attack.hit){this.resolve(f,f.attack);f.attack.hit=true;} const aerialLink=f.heroId==='zhaoyun'&&f.attack?.move==='aerial'&&f.attack.connected;
        delete f.airAttackUsed;f.stun = Math.max(f.stun, this.style.landing); f.attack = null;
        if(aerialLink){f.step=1;f.last=this.time;this.message='銀龍接勢 · 可接第二段';this.messageUntil=this.time+.7;}else this.queuedUntil=0; } } }
    }
    if(this.grapple && (h.hp<=0||h.stun>0||!this.enemies.some(e=>e.id===this.grapple!.target&&e.hp>0)))this.releaseGrapple(false);
    if(h.rideDashCooldown!==undefined)h.rideDashCooldown=Math.max(0,h.rideDashCooldown-dt);
    if(h.mountCooldown!==undefined)h.mountCooldown=Math.max(0,h.mountCooldown-dt);
    this.updateHorses(dt);
    if(this.horseQueued&&h.mounted&&(h.specialCooldown??0)<=0&&h.stun<=0&&!h.attack){
      h.specialCooldown=1.3;h.attack={move:'wave',elapsed:0,duration:.8,impact:.32,hit:false,face:h.face,x:h.x,y:h.y};this.queuedUntil=0;
      this.message=h.heroId==='huangzhong'?'騎乘必殺 · 貫陣火矢！':'騎乘必殺 · 斬風刀波！';this.messageUntil=this.time+1.2;
    }
    this.horseQueued=false;
    if(this.dropQueued&&h.equipped&&!h.mounted&&!this.grapple&&h.stun<=0&&h.z===0){
      const weapon=h.equipped;this.pickups.push({id:++this.serial,x:clamp(h.x+h.face*65,this.cameraLeft+28,this.cameraLeft+930),y:h.y,amount:0,loot:weapon.id,weaponHits:weapon.hits??0,availableAt:this.time+.7});
      h.equipped=undefined;this.dropQueued=false;h.attack=null;this.queuedUntil=0;this.specialQueued=false;input={...input,attack:false,jump:false,special:false};this.message='放下武器，可再次拾取';this.messageUntil=this.time+1.5;
    }
    if(this.dropQueued&&!h.equipped&&!h.mounted&&!this.grapple){
      this.rescue();this.queuedUntil=0;this.specialQueued=false;input={...input,attack:false,jump:false,special:false,dodge:false};
    }
    this.dropQueued=false;
    if(input.jump&&h.mounted)this.dismount(false);
    const occupied=!!this.grapple;
    if(this.grapple)this.updateGrapple(dt,input);
    if(this.specialQueued){this.specialQueued=false;this.special();}
    const casting=occupied||h.attack?.move==='special'||h.attack?.move==='rescue';
    if(h.attack?.move==='special'&&h.heroId==='zhaoyun'&&h.attack.elapsed>.12&&h.attack!.elapsed<.58){h.x+=h.face*170*dt;h.attack!.x=h.x;}
    if(input.dodge&&h.mounted&&h.stun<=0&&!h.attack&&(h.rideDashCooldown??0)<=0){
      h.rideDash=.32;h.rideDashCooldown=1.15;this.dashHits.clear();h.rideTurn=0;h.rideFacing=undefined;
      h.attack={move:'ride-charge',elapsed:0,duration:.42,impact:.04,hit:true,face:h.face,x:h.x,y:h.y};this.queuedUntil=0;
      this.message='馬匹突擊！';this.messageUntil=this.time+.8;this.events.push({type:'dodge',x:h.x,y:h.y});
    }
    if (input.dodge && !h.mounted && !casting && h.dodgeCooldown <= 0 && h.stun <= 0 && h.z === 0) {
      const length = Math.hypot(input.x, input.y);
      h.dashX = length ? input.x / length : h.face; h.dashY = length ? input.y / length : 0;
      this.dashHits.clear();if(h.dashX)h.face=Math.sign(h.dashX);
      h.dodge = .22; h.dodgeCooldown = .95; h.inv = .28; h.attack = null; this.queuedUntil = 0;
      this.events.push({ type: 'dodge', x: h.x, y: h.y });
    }
    if(h.mounted&&(h.rideDash??0)>0&&h.stun<=0){
      const from=h.x;h.rideDash=Math.max(0,h.rideDash!-dt);h.x=clamp(h.x+h.face*480*dt,this.cameraLeft+25,this.cameraLeft+935);h.y=clamp(h.y+input.y*60*dt,350,503);h.moving=true;h.rideSpeed=290;
      for(const e of this.enemies){
        if(e.hp<=0||e.inv>0||e.z>38||this.dashHits.has(e.id)||Math.abs(e.y-h.y)>30||e.x<Math.min(from,h.x)-38||e.x>Math.max(from,h.x)+38)continue;
        this.dashHits.add(e.id);this.breakGuard(e);this.unseatEnemy(e);e.attack=null;e.stun=Math.max(e.stun,.55);e.inv=.22;e.x=clamp(e.x+h.face*70,this.enemyLeft,this.enemyRight);this.grappleDamage(e,38);this.freeze=.025;
      }
    }
    else if (h.dodge > 0) {
      const fromX=h.x,fromY=h.y;h.dodge -= dt;h.x+=h.dashX*410*dt;h.y+=h.dashY*245*dt;
      h.x=clamp(h.x,this.cameraLeft+25,this.cameraLeft+935);h.y=clamp(h.y,350,503);
      for(const e of this.enemies){
        if(e.hp<=0||e.z>38||e.inv>0||this.dashHits.has(e.id)||Math.abs(e.y-(fromY+h.y)/2)>30||e.x<Math.min(fromX,h.x)-48||e.x>Math.max(fromX,h.x)+48)continue;
        this.dashHits.add(e.id);this.breakGuard(e);this.unseatEnemy(e);e.attack=null;e.stun=Math.max(e.stun,.4);e.inv=.22;e.x=clamp(e.x+h.face*(isBoss(e.kind)?30:65),this.enemyLeft,this.enemyRight);this.grappleDamage(e,Math.round(14*this.champion.damage));this.freeze=.025;
      }
    }
    else if (h.stun <= 0 && !casting) {
      if (input.jump && !h.mounted && h.z === 0) { h.vz = 360; this.events.push({ type: 'jump', x: h.x, y: h.y }); }
      if (this.queuedUntil > this.time && !h.attack && (!(h.z>0||h.vz>0)||!h.airAttackUsed)) { this.swing(this.rideAttackFace);this.rideAttackFace=undefined; this.queuedUntil = 0; }
      const grabLink=this.canLinkGrab()&&!input.attack&&!input.jump&&!input.special&&!!(input.x||input.y);
      const retreat=h.attack?.move==='kick'&&h.attack.connected&&h.attack.elapsed>=h.attack.impact+.10&&input.x*h.attack.face<0;
      if (!h.attack || h.attack.move==='aerial'||retreat||grabLink) {
        const len = Math.hypot(input.x, input.y) || 1;
        const mobility=grabLink?.85:retreat?.6:h.attack?.move==='aerial'?this.style.airSteer:1;
        const ride=h.mounted?this.rideMotion(dt,input):null;
        h.x += (ride?.x??input.x) / len * (h.mounted?(h.rideSpeed??0):this.champion.speed) * mobility * dt; h.y += (ride?.y??input.y) / len * (h.mounted?(h.rideSpeed??0):this.champion.speed) * mobility * (125 / 180) * dt;
        h.moving = !!(input.x || input.y); if (input.x && !h.mounted&&h.attack?.move!=='aerial'&&!retreat) h.face = Math.sign(input.x);
      }
    }
    if(!occupied && (!h.attack||this.canLinkGrab()) && h.stun<=0 && h.z===0 && h.dodge<=0 && !input.attack && !input.special && (input.x||input.y))this.tryGrab(input);
    // Each arena opens only after its defenders fall.
    if(!this.encounterActive)this.cameraLeft=Math.max(this.cameraLeft,Math.min(this.cameraLeft+600*dt,clamp(h.x-340,0,WORLD_WIDTH-960)));
    h.x=clamp(h.x,this.cameraLeft+25,this.cameraLeft+935);h.y=clamp(h.y,350,503);
    for (const f of [h, ...this.enemies]) {
      if (f.hp <= 0 || !f.attack) continue;
      const a = f.attack; a.elapsed += dt;
      if(a.move==='cavalry'){
        if(a.elapsed>=a.impact&&a.elapsed<a.impact+.42){a.x=f.x;a.y=f.y;f.x=clamp(f.x+a.face*380*dt,this.enemyLeft,this.enemyRight);f.moving=true;
          if(!a.hit&&attackHits(a,h,70)){a.hit=true;this.resolve(f,a);}}
        if(a.elapsed>=a.impact+.42)a.hit=true;
      }else if(a.move==='special'){
        const times=[.18,.38,.58];let pulse=a.pulses??0;
        while(pulse<times.length&&a.elapsed>=times[pulse]){this.resolve(f,a);pulse++;}a.pulses=pulse;a.hit=pulse>=3;
      }else if(a.move==='aerial'){
        a.x=f.x;a.y=f.y;
        if(a.elapsed>=a.impact&&!a.hit&&descendingContact(f.z,f.vz)){a.hit=true;this.resolve(f,a);a.duration=a.elapsed+.18;}
      }else if (a.elapsed >= a.impact && !a.hit) { a.hit = true; this.resolve(f, a); }
      if (a.elapsed >= a.duration && (a.move!=='aerial'||a.hit)&&!(f.heroId==='zhaoyun'&&a.move==='aerial'&&a.connected&&(f.z>0||f.vz>0))) f.attack = null;
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
    this.updateReinforcements();
    const field = this.field;
    if(field && this.time-dt < field.impactAt && this.time >= field.impactAt) {
      this.events.push({type:field.kind,x:field.x,y:field.y,value:field.width});
      if(fieldHits(field,h)) {
        const damage=Math.min(h.hp,12);h.hp-=damage;this.waveDamage+=damage;this.stageDamage+=damage;if(h.mounted)this.dismount(true);else this.damageEquipment();
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
      if(p.loot==='gong'){if(!this.summonHorses()){this.score+=1000;this.message='已有馬匹 · 銅鑼 +1000 分';this.messageUntil=this.time+2;this.events.push({type:'bonus',x:p.x,y:p.y,value:1000});}return false;}
      if(p.loot&&isWeapon(p.loot)){
        if(h.equipped||h.mounted||!weaponPickupReady(h,p))return true;
        h.equipped={id:p.loot,uses:WEAPONS[p.loot].uses,hits:p.weaponHits??0};
        this.message=`拾取${WEAPONS[p.loot].name} · ${WEAPON_ROLES[p.loot]}`;this.messageUntil=this.time+2;
        this.events.push({type:'equip',x:p.x,y:p.y});return false;
      }
      if(h.hp>=h.max)return true;
      const amount = Math.min(p.amount, h.max - h.hp); h.hp += amount;
      this.events.push({ type: 'heal', x: p.x, y: p.y - 45, value: amount }); return false;
    });
    if (!this.encounterActive) {
      if (this.waveReward < 0) {
        const speed = Math.max(0, 1200 - Math.floor(this.time - this.waveStarted) * 10);
        this.waveReward = speed + (this.waveDamage === 0 ? 800 : 0);
        this.score += this.waveReward;
      }
      if (this.wave === this.level.waves.length) { this.finishStage();this.status = this.stage === LEVELS.length - 1 ? 'won' : 'stage-clear'; this.events.push({ type: 'end', x: h.x, y: h.y }); }
      else if (this.clearedAt < 0) {
        this.clearedAt = this.time;
        this.message = `破陣！獎勵 +${this.waveReward}　向右前進 →`; this.messageUntil = Infinity;
      } else if (this.time - this.clearedAt > .8 && h.x > (this.arenaEnd-70) && this.cameraLeft>=clamp(h.x-340,0,WORLD_WIDTH-960)-1) this.spawn();
    }
  }
  updateReinforcements(){
    const group=this.pending[0];if(!group)return;
    const elapsed=this.time-this.waveStarted;
    if(!this.enemies.length)group.due=Math.min(group.due,elapsed+.9);
    if(elapsed<group.due)return;this.pending.shift();
    group.kinds.forEach((kind,i)=>{
      const left=group.side==='pincer'&&i%2===0,x=this.cameraLeft+(left?65+i*20:800+i*35),y=group.side==='ambush'?(i%2?490:360):370+i%3*49;
      const e=this.fighter(kind,x,y);e.inv=.55;e.cooldown=.9;if(this.time<this.rallyUntil){e.guardCooldown=3;e.stun=1.25;}this.enemies.push(e);
    });
    this.events.push({type:'reinforcement',x:this.cameraLeft+480,y:360});this.message=group.side==='pincer'?'兩側援軍抵達！':group.side==='ambush'?'竹林伏兵現身！':'下一隊守軍抵達！';this.messageUntil=this.time+1.8;
  }
  activateProp(p:StageProp){
    if(p.activated)return;p.activated=true;p.hp=0;
    this.stageInteractions.add(this.wave);this.score+=100;this.message=PROPS[this.stage].hint.replace('擊破','已啟動').replace('擊斷','已斬斷').replace('擊碎','已擊碎').replace('擊倒','已擊倒');this.messageUntil=this.time+2.8;
    this.events.push({type:'scene-action',x:p.x,y:p.y,value:this.stage});
    if(p.stageKind==='sluice'){this.fieldSuppressed=true;return;}
    if(p.stageKind==='ballista'){this.propShots.push({id:++this.serial,x:p.x,y:this.hero.y,face:this.hero.face,remaining:900,damage:40,arrow:true,piercing:true,push:22,hits:[]});return;}
    if(p.stageKind==='banner')this.rallyUntil=this.time+5;
    for(const e of this.enemies){
      if(e.hp<=0||e.inv>0)continue;
      if(p.stageKind==='bamboo'&&Math.abs(e.x-p.x)>80)continue;
      if(p.stageKind==='ice'&&Math.hypot((e.x-p.x)/1.3,e.y-p.y)>150)continue;
      this.breakGuard(e);e.attack=null;e.stun=Math.max(e.stun,p.stageKind==='banner'?1.25:.9);e.guardCooldown=3;
      if(p.stageKind==='banner')continue;
      e.knockdown=.8;e.inv=.35;this.grappleDamage(e,p.stageKind==='bamboo'?42:35);
    }
  }
  finishStage(){
    if(this.stageResults.some(r=>r.stage===this.stage))return;
    const result=gradeStage({stage:this.stage,seconds:Math.max(0,this.time-this.stageStarted),damage:this.stageDamage,retries:this.stageRetries,bestHit:this.stageBestHit,interactions:this.stageInteractions.size});
    this.stageResults.push(result);this.score+=result.bonus;
  }
  unseatEnemy(e:Fighter){
    if(e===this.hero||!e.mounted)return false;e.mounted=false;e.attack=null;e.stun=Math.max(e.stun,.75);e.knockdown=.65;e.grappleCooldown=1.2;
    this.events.push({type:'enemy-dismount',x:e.x,y:e.y,value:e.face});return true;
  }
  rideMotion(dt:number,input:Input){
    const h=this.hero,wanted=input.x?Math.sign(input.x):h.face;
    if(wanted!==h.face){if(h.rideFacing!==wanted){h.rideFacing=wanted;h.rideTurn=.14;}h.rideTurn=Math.max(0,(h.rideTurn??0)-dt);
      if(h.rideTurn===0){h.face=wanted;h.rideFacing=undefined;}else{h.rideSpeed=Math.max(0,(h.rideSpeed??0)-900*dt);return {x:0,y:0};}}
    else {h.rideFacing=undefined;h.rideTurn=0;}
    const target=input.x||input.y?290:0,speed=h.rideSpeed??0;h.rideSpeed=speed+Math.sign(target-speed)*Math.min(Math.abs(target-speed),700*dt);
    return {x:input.x,y:input.y};
  }
  dismount(hit:boolean){
    const h=this.hero;if(!h.mounted)return;
    const horse=h.steed??{id:++this.serial,x:h.x,y:h.y,target:h.x,life:20,moving:false,falls:0};
    horse.x=h.x;horse.y=h.y;horse.target=h.x;
    if(hit)horse.falls=(horse.falls??0)+1;
    horse.fleeing=(horse.falls??0)>=2;horse.waiting=!horse.fleeing;horse.awaitSeparation=true;horse.moving=!!horse.fleeing;horse.life=20;
    h.rideDash=0;h.rideSpeed=0;h.rideTurn=0;h.rideFacing=undefined;this.rideAttackFace=undefined;this.horses.push(horse);h.steed=undefined;h.mounted=false;h.mountCooldown=hit?1.8:1.2;h.attack=null;this.queuedUntil=0;this.horseQueued=false;
    if(hit){h.z=28;h.vz=150;h.stun=.8;h.knockdown=.8;}
    this.message=horse.fleeing?'第二次落馬！馬匹受驚跑走':hit?'落馬！馬匹留在原地，可再次上馬':'下馬，馬匹留在原地等待';this.messageUntil=this.time+3;
  }
  damageEquipment(){
    const h=this.hero;if(!h.equipped||h.mounted)return;
    h.equipped.hits=(h.equipped.hits??0)+1;
    if(h.equipped.hits>=2){this.events.push({type:'weapon-drop',x:h.x,y:h.y,weapon:h.equipped.id});h.equipped=undefined;this.message='武器脫手損壞！';this.messageUntil=this.time+1.4;}
  }
  summonHorses(){
    if(this.hero.mounted||this.horses.some(h=>h.life>0&&h.x>-100))return false;
    const start=this.cameraLeft+1020;
    this.horses=[{id:++this.serial,x:start,y:this.hero.y,target:clamp(this.hero.x+100,60,this.arenaEnd-50),life:20,moving:true,falls:0}];
    this.events.push({type:'gong',x:this.hero.x,y:this.hero.y});this.message='銅鑼響！馬匹自右方奔來，靠近即可上馬';this.messageUntil=this.time+4;return true;
  }
  updateHorses(dt:number){
    const h=this.hero;
    this.horses=this.horses.filter(horse=>{
      if(!horse.waiting)horse.life-=dt;horse.moving=!!horse.fleeing||(!horse.waiting&&(h.mounted===true||horse.x>horse.target));
      if(horse.moving)horse.x=Math.max(h.mounted||horse.fleeing?-200:horse.target,horse.x-260*dt);
      if(horse.awaitSeparation&&(Math.abs(horse.x-h.x)>60||Math.abs(horse.y-h.y)>36))horse.awaitSeparation=false;
      if(!horse.awaitSeparation&&!horse.fleeing&&!h.mounted&&(h.mountCooldown??0)<=0&&h.z<=8&&h.stun<=0&&!h.attack&&!this.grapple&&Math.abs(horse.x-h.x)<48&&Math.abs(horse.y-h.y)<28){
        h.mounted=true;h.rideSpeed=0;h.rideDash=0;h.rideTurn=0;h.rideFacing=undefined;h.step=0;h.last=-10;h.steed=horse;h.attack=null;this.queuedUntil=0;this.events.push({type:'mount',x:h.x,y:h.y});this.message='上馬！連攻三段 · 反向攻擊回身 · 衝撞突擊 · 跳躍下馬';this.messageUntil=this.time+4;return false;
      }
      return horse.life>0&&horse.x>-100;
    });
  }
  updateProjectiles(dt:number){
    this.projectiles=this.projectiles.filter(p=>{
      const distance=Math.min(p.remaining,(p.arrow?850:p.wave?560:640)*dt),next=p.x+p.face*distance;
      const targets:(Fighter|Supply|StageProp)[]=[...this.enemies,...this.props,...(p.arrow?[...this.supplies,...this.barrels]:[])];
      const contacts=targets.filter(e=>e.hp>0&&(!('z' in e)||e.z<=38)&&Math.abs(e.y-p.y)<(p.wave?38:22)&&!p.hits?.includes(e.id)&&(e.x-p.x)*p.face>=-12&&(e.x-next)*p.face<=12).sort((a,b)=>(a.x-b.x)*p.face);
      for(const target of contacts){
        (p.hits??=[]).push(target.id);
        if(!('kind' in target)){
          target.hp=Math.max(0,target.hp-p.damage);this.events.push({type:'crate',x:target.x,y:target.y-12});
          if(!target.hp&&'stageKind' in target){this.activateProp(target);}else if(!target.hp){const loot=target.loot??crateLoot(this.stage,this.wave);this.pickups.push({id:++this.serial,x:target.x,y:target.y,loot,amount:loot==='bun'?25:loot==='meat'?40:0});}
        }else if(target.inv<=0){
          if(this.blocked(target,p.x,p.y,!!p.piercing||!!p.wave)){if(!p.wave&&!p.piercing)return false;continue;}
          target.inv=.2;
          if(!p.arrow||!isBoss(target.kind)||target.attack?.hit){target.stun=Math.max(target.stun,p.wave?.55:.32);target.attack=null;}
          target.x=clamp(target.x+p.face*(p.push??(p.wave?40:24)),this.enemyLeft,this.enemyRight);
          if(p.wave||p.piercing)this.unseatEnemy(target);
          if(p.arrow)this.score+=Math.floor(Math.min(target.hp,p.damage)*Math.min(this.hits,20)*.5);
          this.grappleDamage(target,p.damage);this.freeze=p.piercing?.065:.035;
        }
        if(!p.wave&&!p.piercing)return false;
      }
      p.x=next;p.remaining-=distance;return p.remaining>0&&p.x>=this.enemyLeft&&p.x<=this.enemyRight;
    });
    this.projectiles.push(...this.propShots);this.propShots=[];
    this.supplies=this.supplies.filter(b=>b.hp>0);this.barrels=this.barrels.filter(b=>b.hp>0);
  }
  canLinkGrab(){
    const h=this.hero,a=h.attack;
    return !!(a&&(a.move==='slash'||a.move==='bow-strike')&&!a.weapon&&!h.equipped&&!h.mounted&&h.step<3&&a.connected&&a.elapsed>=a.impact+.08&&a.hitTargets?.length);
  }
  tryGrab(input:Input){
    const h=this.hero;if(h.mounted||this.grapple||this.status!=='playing'||this.paused||h.hp<=0||h.stun>0||(h.attack&&!this.canLinkGrab())||h.z>0||h.vz>0||h.dodge>0||(h.grappleCooldown??0)>0)return false;
    // Boss grabs are safe during early windup and settled recovery, never on the impact frame.
    // Filter approach direction before selecting: a closer enemy behind must not block a valid grab.
    const target=this.enemies.filter(e=>e.hp>0&&!e.mounted&&(isBoss(e.kind)?bossGrabWindow(e.attack)!=='unsafe':!e.attack||(!e.attack.hit&&e.attack.elapsed<e.attack.impact))&&(!h.attack||h.attack.hitTargets?.includes(e.id))&&e.z===0&&(e.knockdown??0)<=0&&(e.grappleCooldown??0)<=0&&!(e.inv>0&&e.stun<=0)&&Math.abs(e.x-h.x)<=this.style.grabReach&&Math.abs(e.y-h.y)<=26&&((e.x-h.x)*input.x+(e.y-h.y)*input.y>0))
     .sort((a,b)=>Math.hypot(a.x-h.x,a.y-h.y)-Math.hypot(b.x-h.x,b.y-h.y))[0];
    if(!target)return false;
    h.face=target.x>=h.x?1:-1;h.attack=null;h.inv=Math.max(h.inv,.12);h.grapplePose='hold';h.moving=false;target.attack=null;if(target.guard!==undefined)target.guard=0;target.grapplePose='held';target.face=-h.face;
    this.grapple={target:target.id,hits:0,deadline:this.time+2.8,started:this.time,phase:'hold',elapsed:0,direction:h.face,air:false,startX:h.x,startZ:0};
    this.queuedUntil=0;this.specialQueued=false;this.message='抓住！跳＋攻擊空中摔，或左右＋攻擊';this.messageUntil=this.time+1.5;
    this.events.push({type:'grab',x:h.x,y:h.y,heroId:h.heroId});return true;
  }
  releaseGrapple(escape:boolean){
    const state=this.grapple;if(!state)return;const e=this.enemies.find(e=>e.id===state.target),h=this.hero;
    h.grapplePose=undefined;delete h.grappleBack;h.grappleProgress=undefined;h.throwSpin=undefined;h.grappleCooldown=.65;h.attack=null;this.queuedUntil=0;this.specialQueued=false;
    if(e){e.grapplePose=undefined;e.throwSpin=undefined;e.vz=0;e.grappleCooldown=isBoss(e.kind)?1.8:1.2;
      if(escape){e.inv=.4;e.cooldown=.55;e.x=clamp(e.x+h.face*38,this.enemyLeft,this.enemyRight);}}
    this.grapple=null;
    if(escape){h.stun=Math.max(h.stun,.2);this.message=e&&isBoss(e.kind)?'頭目掙脫！拉開距離，等待下次抓取空檔':'接招太慢，敵人掙脫！';this.messageUntil=this.time+1.3;this.events.push({type:'escape',x:h.x,y:h.y});}
  }
  grappleDamage(e:Fighter,amount:number){
    const actual=Math.min(e.hp,amount);e.hp-=actual;this.score+=actual*10;this.hits++;this.bestCombo=Math.max(this.bestCombo,this.hits);this.stageBestHit=Math.max(this.stageBestHit,this.hits);this.hitDeadline=this.time+1.7;
    this.events.push({type:'hit',x:e.x,y:e.y-e.z-38,value:actual,heroId:this.hero.heroId,heavy:amount>20});
    if(e.hp<=0){this.unseatEnemy(e);this.kills++;this.score+=100;this.enemyDrop(e);this.events.push({type:'death',x:e.x,y:e.y});if(this.grapple?.target===e.id)this.releaseGrapple(false);}
  }
  enemyDrop(e:Fighter){
    const weapon=enemyWeapon(e.kind);
    let loot:LootId|undefined;
    if(weapon&&!this.weaponDropUsed){this.weaponDropUsed=true;loot=weapon;}
    else if(e.kind==='heavy'&&!this.foodDropUsed){this.foodDropUsed=true;loot='bun';}
    if(!loot)return;
    this.pickups.push({id:++this.serial,x:clamp(e.x,this.cameraLeft+30,this.cameraLeft+930),y:clamp(e.y,354,499),loot,amount:loot==='bun'?25:0,availableAt:this.time+.45});
  }
  updateGrapple(dt:number,input:Input){
    const state=this.grapple!,h=this.hero,e=this.enemies.find(e=>e.id===state.target);if(!e){this.releaseGrapple(false);return;}
    e.attack=null;e.moving=false;h.moving=false;h.grappleProgress=state.phase==='throw'?Math.min(1,state.elapsed/(state.air?throwWeight(e.kind).fall:throwWeight(e.kind).lift+throwWeight(e.kind).flight)):0;this.queuedUntil=0;this.specialQueued=false;
    const fresh=input.grappleAttack??input.attack;
    if(state.phase==='hold'){
      if(this.time>state.deadline||this.time-state.started>8){this.releaseGrapple(true);return;}
      e.x=clamp(h.x+h.face*27,this.enemyLeft,this.enemyRight);e.y=h.y;e.z=0;
      if(fresh){
        if(input.throwX??input.x){this.beginThrow(Math.sign(input.throwX??input.x),false);}
        else if(state.hits<2){state.hits++;state.deadline=this.time+2.8;this.grappleDamage(e,this.style.grabDamage);if(!this.grapple)return;this.events.push({type:'grapple-hit',x:h.x,y:h.y,value:state.hits});this.message=`抓住打擊 ${state.hits}/2`;this.messageUntil=this.time+1;}
        else{this.releaseGrapple(false);this.message='連打三下，鬆開抓取';this.messageUntil=this.time+1;return;}
      }
      if(input.jump&&state.phase==='hold'){state.phase='jump';state.elapsed=0;state.jumpDirection=Math.sign(input.x);h.grapplePose='air';e.grapplePose='air-held';this.events.push({type:'grab-air',x:h.x,y:h.y});this.events.push({type:'jump',x:h.x,y:h.y});}
    }else if(state.phase==='jump'){
      state.elapsed+=dt;h.x=clamp(h.x+(state.jumpDirection??0)*155*dt,this.cameraLeft+25,this.cameraLeft+935);h.z=Math.sin(Math.min(1,state.elapsed/1.05)*Math.PI)*throwWeight(e.kind).jump;e.z=h.z+24;e.x=clamp(h.x+h.face*24,this.enemyLeft,this.enemyRight);e.y=h.y;
      if(fresh){this.beginThrow(h.face,true);}else if(state.elapsed>=1.05){h.z=0;this.releaseGrapple(true);}
    }else{
      state.elapsed+=dt;const spec=THROWS[h.heroId!],limit=this.enemyRight;
      if(state.air){
        const progress=Math.min(1,state.elapsed/throwWeight(e.kind).fall),fall=1-progress*progress;
        h.z=Math.max(0,state.startZ-24)*fall;e.z=state.startZ*fall;
        e.x=clamp(h.x+state.direction*16,this.enemyLeft,this.enemyRight);e.y=h.y;
        h.throwSpin=-state.direction*18;e.throwSpin=state.direction*90;
        if(progress>=1){
          h.z=0;e.z=0;e.inv=.35;e.stun=.9;e.knockdown=.8;e.grappleCooldown=1.2;
          for(const other of this.enemies){
            if(other.id===e.id||other.hp<=0||other.inv>0||other.z>38||Math.abs(other.x-h.x)>110||Math.abs(other.y-h.y)>52)continue;
            this.unseatEnemy(other);other.attack=null;other.stun=1;other.knockdown=.8;other.inv=.35;this.grappleDamage(other,30);
          }
          this.events.push({type:'throw',x:h.x,y:h.y,value:state.direction,heroId:h.heroId});
          this.grappleDamage(e,spec.damage+14);this.releaseGrapple(false);h.stun=Math.max(h.stun,.24);h.throwRecovery=.24;this.freeze=.09;
        }
        return;
      }
      // First pull the enemy to the shoulder, then release into an accelerating fall.
      const weight=throwWeight(e.kind),lift=Math.min(1,state.elapsed/weight.lift),flight=Math.max(0,Math.min(1,(state.elapsed-weight.lift)/weight.flight));
      const shoulder=h.x+state.direction*12,previous={x:e.x,y:e.y,z:e.z},easedLift=lift*lift*(3-2*lift),travel=flight*flight*(3-2*flight);
      e.y=h.y;h.throwSpin=state.direction*(flight>0?24*(1-flight):-12*lift);
      if(state.elapsed<weight.lift){
        e.x=state.startX+(shoulder-state.startX)*easedLift;
        e.z=state.startZ+(weight.height-state.startZ)*easedLift;e.throwSpin=(state.back?1:-1)*state.direction*65*lift;
      }else{
        e.x=clamp(shoulder+state.direction*spec.distance*travel,this.enemyLeft,limit);
        e.z=weight.height*(1-flight)+Math.sin(flight*Math.PI)*(state.back?42:24);
        e.throwSpin=state.direction*(state.back?65-245*flight:-65+155*flight);
      }
      h.z=state.air?Math.max(0,state.startZ-24)*(1-flight):0;
      if(state.elapsed>=weight.lift){
        for(const other of this.enemies){
          if(other.id===e.id||other.hp<=0||other.inv>0||state.collisions?.includes(other.id)||!sweptThrowContact(previous,e,other))continue;
          (state.collisions??=[]).push(other.id);
          this.unseatEnemy(other);other.attack=null;other.stun=Math.max(other.stun,1);other.knockdown=.8;other.inv=.35;
          other.x=clamp(other.x+state.direction*18,this.enemyLeft,limit);
          this.grappleDamage(other,24);
        }
      }
      if(flight>=1){e.z=0;h.z=0;e.inv=.35;e.stun=.9;e.knockdown=.65;e.grappleCooldown=1.2;this.events.push({type:'throw',x:e.x,y:e.y,value:state.direction,heroId:h.heroId});
        this.grappleDamage(e,spec.damage+(state.air?14:0));this.releaseGrapple(false);h.stun=Math.max(h.stun,.24);h.throwRecovery=.24;}

    }
  }
  beginThrow(direction:number,air:boolean){
    if(!this.grapple)return;const state=this.grapple,e=this.enemies.find(e=>e.id===state.target);if(!e)return;
    state.phase='throw';state.direction=direction;state.air=air;state.elapsed=0;state.startX=e.x;state.startZ=e.z;state.facing=this.hero.face;state.back=!air&&direction!==this.hero.face;this.hero.grappleBack=state.back;this.hero.grapplePose='throw';e.grapplePose='thrown';
    if(air)this.hero.inv=Math.max(this.hero.inv,.38);
    this.message=THROWS[this.hero.heroId!].name+(air?' · 落地重摔':state.back?' · 過肩背摔':' · 向前拋摔');this.messageUntil=this.time+1.1;
  }
  /** Attack+jump while using the hero's own weapon: costly, short emergency escape. */
  rescue(){
    const h=this.hero;
    if(this.status!=='playing'||this.paused||h.equipped||h.mounted||this.grapple||h.z>0||h.vz>0||h.dodge>0||(h.knockdown??0)>0||(h.rescueCooldown??0)>0)return false;
    if(h.hp<=8){this.message='氣血不足，解困技需要保留至少 1 點血';this.messageUntil=this.time+1.4;return false;}
    h.hp-=8;this.waveDamage+=8;this.stageDamage+=8;h.stun=0;h.inv=Math.max(h.inv,.6);h.rescueCooldown=1.2;h.specialCooldown=Math.max(h.specialCooldown??0,.85);h.step=3;h.moving=false;
    h.attack={move:'rescue',elapsed:0,duration:.45,impact:.05,hit:true,face:h.face,x:h.x,y:h.y};
    this.message='解困震退！氣血 -8';this.messageUntil=this.time+1.2;
    this.events.push({type:'rescue',x:h.x,y:h.y,heroId:h.heroId,value:8});
    for(const e of this.enemies){
      if(e.hp<=0||e.inv>0||e.z>38||Math.hypot((e.x-h.x)/1.4,e.y-h.y)>95)continue;
      this.breakGuard(e);this.unseatEnemy(e);e.attack=null;e.stun=Math.max(e.stun,.9);e.knockdown=.8;e.inv=.3;
      const side=Math.sign(e.x-h.x)||h.face;e.x=clamp(e.x+side*(isBoss(e.kind)?65:110),this.enemyLeft,this.enemyRight);e.y=clamp(e.y+Math.sign(e.y-h.y)*15,350,503);
      this.grappleDamage(e,20);
    }
    return true;
  }
  special() {
    const h=this.hero;
    if(this.status!=='playing'||this.paused||h.hp<=0||this.grapple||h.mounted)return false;
    let reason='';
    if((h.knockdown??0)>0||h.attack?.move==='rescue'||(h.specialCooldown??0)>0||h.attack?.move==='special')reason='招式尚未收完';
    else if(h.z>0||h.vz>0||h.dodge>0)reason='請落地站穩後施放';
    if(reason){this.message=reason;this.messageUntil=this.time+1.2;return false;}
    h.hp-=SPECIAL_COST;this.waveDamage+=SPECIAL_COST;h.specialCooldown=SPECIAL_COOLDOWN;
    h.stun=0;h.inv=Math.max(h.inv,.45);h.step=3;h.last=this.time;h.moving=false;this.queuedUntil=0;
    h.attack={move:'special',elapsed:0,duration:.85,impact:.18,hit:false,pulses:0,face:h.face,x:h.x,y:h.y};
    this.message=SPECIALS[h.heroId!].name+'！';this.messageUntil=this.time+1.2;
    this.events.push({type:'special-start',x:h.x,y:h.y,value:3,heroId:h.heroId});return true;
  }
  swing(rideFace?:number) {
    const h = this.hero;if(h.mounted)h.rideSpeed=Math.min(h.rideSpeed??0,140);
    if(!h.mounted&&!h.equipped&&(h.z>0||h.vz>0)){
      if(h.airAttackUsed)return;h.airAttackUsed=true;h.step=1;h.last=-10;
      h.attack={move:'aerial',elapsed:0,duration:1,impact:.08,hit:false,face:h.face,x:h.x,y:h.y};
      this.events.push({type:'swing',x:h.x,y:h.y,heroId:h.heroId});return;
    }
    h.step = (this.time-h.last)*1000<(h.equipped||h.mounted?650:this.style.comboWindow)?h.step%3+1:1; h.last = this.time;
    const weapon=h.mounted?undefined:h.equipped?.id;
    const bowStrike=!h.mounted&&!weapon&&h.heroId==='huangzhong'&&this.enemies.some(e=>e.hp>0&&e.z<=38&&(e.knockdown??0)<=0&&inRange(h.x,h.y,e.x,e.y,h.face,64));
    const kick=!h.mounted&&!weapon&&h.heroId==='weiyan'&&h.step===3;
    if(bowStrike){h.step=1;h.last=-10;}
    const s=h.mounted?mountedStrike(h.step,h.heroId==='huangzhong'):weapon?WEAPONS[weapon]:bowStrike?BOW_STRIKE:this.slash(h.step);
    h.attack = { ...(weapon?{weapon}:{}), move: h.mounted?'mounted':bowStrike?'bow-strike':kick?'kick':'slash', elapsed: 0, duration: s.duration, impact: s.impact, hit: false, face: h.mounted?(rideFace??h.face):h.face, x: h.x, y: h.y };
    this.events.push({ type: 'swing', x: h.x, y: h.y, value: h.step, heroId: h.heroId });
  }
  ai(e: Fighter, index: number, dt: number) {
    if (this.grapple?.target===e.id || (e.knockdown??0)>0 || e.hp <= 0 || e.stun > 0 || e.attack || this.hero.hp <= 0) return;
    const h = this.hero, dx = h.x - e.x, dy = h.y - e.y;
    if(e.x<this.cameraLeft+15||e.x>this.cameraLeft+945){e.face=e.x<this.cameraLeft?1:-1;e.x+=e.face*stats[e.kind].speed*dt;e.y+=Math.sign(dy)*Math.min(Math.abs(dy),stats[e.kind].speed*.5*dt);e.moving=true;return;}
    if(e.mounted){
      const occupied=this.enemies.filter(f=>f.hp>0&&f.attack).length;
      if(e.cooldown<=0&&occupied<this.attackLimit&&Math.abs(dx)<260&&Math.abs(dy)<28){e.attack={move:'cavalry',elapsed:0,duration:1.62,impact:.85,hit:false,face:e.face,x:e.x,y:e.y};e.cooldown=2.5;e.attacks++;this.message='騎將突擊 · 換線避開，重擊可打落馬';this.messageUntil=this.time+.85;return;}
      const vx=Math.abs(dx)>190?Math.sign(dx):0,vy=Math.abs(dy)>4?Math.sign(dy):0;e.x=clamp(e.x+vx*115*dt,this.cameraLeft+15,this.cameraLeft+945);e.y=clamp(e.y+vy*65*dt,350,503);e.moving=!!(vx||vy);return;
    }
    if((e.guard??0)>0)return;
    e.face = dx >= 0 ? 1 : -1;
    const boss=isBoss(e.kind),phase=boss?bossPhase(e.hp,e.max):0;
    const ranged=e.kind==='archer',spear=e.kind==='spearman';
    const reach=ranged?340:spear?130:(e.kind==='hammer'||e.kind==='mauler')?96:e.kind==='brute'?82:boss?BOSS_STYLE[e.kind].reach:e.kind==='heavy'?74:60;
    // Shields commit to a short stance; they cannot turn or attack while guarding.
    if(e.kind==='heavy'&&(e.guardCooldown??0)<=0&&e.cooldown>.3&&Math.abs(dx)<150&&Math.abs(dy)<40&&frontalGuard(e.face,e.x,e.y,h.x,h.y)){
      e.guard=.65;e.guardCooldown=2.8;return;
    }
    // Bowmen and spearmen step back instead of firing or stabbing at point blank range.
    const retreat=(e.kind==='hunter'&&e.cooldown>0&&Math.abs(dx)<190)||(e.kind==='raider'&&e.attacks>0&&e.cooldown>.8&&Math.abs(dx)<100)||(ranged&&Math.abs(dx)<145)||(spear&&e.cooldown>0&&Math.abs(dx)<82);
    const preferred=e.id%2?1:-1,side=h.x+preferred*110<this.cameraLeft+15||h.x+preferred*110>this.cameraLeft+945?-preferred:preferred,signed=(e.x-h.x)*side;
    const flanking=e.kind==='raider'&&signed<80&&(signed < -25||Math.abs(dy)>35);
    const activeAttackers=this.enemies.filter(f=>f.hp>0&&f.attack).length;
    const bossReady=!boss&&this.enemies.some(f=>isBoss(f.kind)&&f.hp>0&&f.stun<=0&&!f.attack&&f.cooldown<=0&&Math.abs(f.x-h.x)<250);
    const slots=this.attackLimit-(bossReady?1:0);
    if(!retreat&&!flanking&&e.cooldown<=0&&activeAttackers<slots&&Math.abs(dy)<(boss?BOSS_STYLE[e.kind].lane:27)&&Math.abs(dx)<reach){
      let move:Move=ranged?'shot':(e.kind==='hammer'||e.kind==='mauler')?'slam':'slash';
      const plan=boss?bossPlan(e.kind,e.hp,e.max,e.attacks,{dx,dy}):null;
      if(plan)move=plan.move;
      // Far-away slams become a separately telegraphed charge, never an invisible extended hit.
      if((move==='slam'&&Math.abs(dx)>125)||(move==='sweep'&&Math.abs(dx)>160))move='charge';
      const tempo=enemyTempo(e.kind,e.attacks);
      const windup=plan?.windup??tempo.windup;
      const recovery=plan?.recovery??tempo.recovery;
      e.attack={move,elapsed:0,duration:windup+recovery,impact:windup,hit:false,face:e.face,x:e.x,y:e.y};
      if(move==='cross'){e.attack.x=h.x;e.attack.y=h.y;}
      if(boss){this.message=move==='fan'?'三路箭陣 · 換線或跳躍':move==='ring'?'震地環 · 內圈安全或跳躍':move==='cross'?'十字斬 · 離開交叉線':move==='charge'?'突進 · 移出前方警戒線':move==='sweep'?'橫掃 · 拉開距離或跳躍':'重砸 · 離開地面警戒圈';this.messageUntil=this.time+windup;}
      e.cooldown=windup+recovery+(plan?.gap??tempo.gap)+(!boss?index%3*.05:0);e.attacks++;return;
    }
    const speed=stats[e.kind].speed*(1+phase*.1);
    let targetY=h.y,moveX=0;
    if(flanking){
      targetY=clamp(h.y+(h.y<390?55:h.y>465?-55:side*55),352,500);
      if(Math.abs(targetY-e.y)<22)moveX=Math.sign(h.x+side*100-e.x);
    }else if(retreat){moveX=-Math.sign(dx||e.face);}
    else{
      const waiting=activeAttackers>=slots&&e.cooldown>.2;
      const stop=boss?BOSS_STYLE[e.kind].stop:ranged?210:spear?112:waiting?105:reach-8;
      moveX=Math.abs(dx)>stop?Math.sign(dx):0;
      // Finish the flank by joining the player's lane before closing for a hit.
      if(e.kind==='raider'&&signed>=60&&Math.abs(dy)>27)moveX=0;
      if(waiting)targetY=clamp(h.y+(index%2?36:-36),352,500);
    }
    if((ranged||e.kind==='hunter')&&e.attacks>0&&e.cooldown>.55&&!retreat)targetY=clamp(h.y+(e.attacks%2?42:-42),352,500);
    const moveY=Math.abs(targetY-e.y)>3?Math.sign(targetY-e.y):0;
    e.x=clamp(e.x+moveX*speed*dt,this.cameraLeft+15,this.cameraLeft+945);e.y=clamp(e.y+moveY*speed*.65*dt,350,503);e.moving=!!(moveX||moveY);
  }
  breakGuard(e:Fighter){
    if((e.guard??0)<=0)return;e.guard=0;e.guardCooldown=2.8;e.stun=Math.max(e.stun,.65);e.attack=null;
    this.events.push({type:'guard-break',x:e.x,y:e.y-40});
  }
  blocked(e:Fighter,x:number,y:number,breaking=false){
    if((e.guard??0)<=0)return false;
    if(e.stun>0||!frontalGuard(e.face,e.x,e.y,x,y)){this.breakGuard(e);return false;}
    if(breaking){this.breakGuard(e);return false;}
    this.events.push({type:'block',x:e.x,y:e.y-40});this.freeze=.025;return true;
  }

  resolve(f: Fighter, a: Attack) {
    // Ground targets can only be struck within the same low-height band.
    if (f.z > (a.move==='aerial'?54:38) && a.move!=='special') return;
    const heroAttack = f === this.hero, special=heroAttack&&a.move==='special', s = a.move==='bow-strike'?BOW_STRIKE:a.move==='aerial'?{...AERIALS[f.heroId!],duration:1,impact:.08}:a.move==='mounted'?mountedStrike(f.step,f.heroId==='huangzhong'):a.move==='wave'?MOUNT_WAVE:special?SPECIALS[f.heroId!]:a.weapon?WEAPONS[a.weapon]:this.slash(f.step);
    if(heroAttack&&a.weapon==='knife'&&!special){f.equipped=undefined;this.projectiles.push({id:++this.serial,x:a.x+a.face*20,y:a.y,face:a.face,remaining:620,damage:WEAPONS.knife.damage});return;}
    if(heroAttack&&a.move==='wave'){this.projectiles.push({id:++this.serial,x:a.x+a.face*24,y:a.y,face:a.face,remaining:720,damage:48,wave:true,...(f.heroId==='huangzhong'?{arrow:true,...mountedArrowVisual(f.face,a.face,24)}:{}),hits:[]});this.events.push({type:'blade-wave',x:a.x,y:a.y,heroId:f.heroId});return;}
    if(special)this.events.push({type:'special',x:a.x,y:a.y,value:a.face,heroId:f.heroId,heavy:(a.pulses??0)>=2});
    const reach = heroAttack ? s.reach : a.move==='cavalry'?70: f.kind==='archer'?340:f.kind==='spearman'?145:f.kind==='brute'?85: f.kind === 'heavy' ? 88 : 73;
    if(!heroAttack&&a.move==='shot')this.events.push({type:'arrow',x:a.x,y:a.y-40,value:a.face*340});
    if(!heroAttack&&a.move==='fan')for(const slope of [-.3,0,.3])this.events.push({type:'arrow',x:a.x,y:a.y-40,value:a.face*330,heavy:false,dy:slope*330});
    const bow = !f.mounted && !a.weapon && !special && heroAttack && a.move==='slash' && f.heroId === 'huangzhong';
    if(heroAttack&&a.move==='mounted'&&f.heroId==='huangzhong'){this.projectiles.push({id:++this.serial,x:a.x+a.face*20,y:a.y,face:a.face,remaining:s.reach,damage:s.damage,arrow:true,...mountedArrowVisual(f.face,a.face),piercing:f.step===3,push:s.push,hits:[]});return;}
    if(bow){this.projectiles.push({id:++this.serial,x:a.x+a.face*20,y:a.y,face:a.face,remaining:reach,damage:s.damage,arrow:true,piercing:f.step===3,push:s.push,hits:[]});return;}
    for (const t of heroAttack ? this.enemies : [this.hero]) {
      if (t.hp <= 0 || t.inv > 0 || !(special?specialHits(f.heroId!,a.x,a.y,a.face,t.x,t.y,t.z):heroAttack&&f.heroId==='lubu'&&a.move==='slash'&&!a.weapon&&f.step===3?(t.z<=38&&Math.abs(t.y-a.y)<=42&&(t.x-a.x)*a.face>=-12&&(t.x-a.x)*a.face<=reach):attackHits(a, t, reach))) continue;
      if(heroAttack&&this.blocked(t,f.x,f.y,special||a.move==='aerial'||(!a.weapon&&f.step===3)||a.weapon==='hammer'||a.weapon==='axe'||a.move==='mounted'))continue;
      const damage = heroAttack ? s.damage : stats[f.kind].damage + (a.move === 'slam' ? 7 : 0);
      if(heroAttack&&(special||a.move==='aerial'||a.move==='mounted'&&f.step===3||!a.weapon&&(a.move==='slash'||a.move==='kick')&&f.step===3||a.weapon==='hammer'||a.weapon==='axe'))this.unseatEnemy(t);
      if(heroAttack){a.connected=true;(a.hitTargets??=[]).push(t.id);}
      const actual = Math.min(t.hp, damage); t.hp = Math.max(0, t.hp - damage);
      t.inv = heroAttack ? (special?.12:.16) : .75;
      // Boss keeps its telegraphed move; ordinary enemies are interrupted.
      if (!isBoss(t.kind) || special || t.attack?.hit) { t.stun = Math.max(t.stun,heroAttack ? (f.heroId==='guanyu'&&a.move==='slash'&&!a.weapon&&f.step<3?.36:.30) : .22); t.attack = null; }
      if(heroAttack&&a.weapon==='hammer'&&(!isBoss(t.kind)||!t.attack)){t.stun=Math.max(t.stun,.8);if(!isBoss(t.kind))t.knockdown=.6;}
      if(heroAttack&&!special&&!a.weapon&&(a.move==='slash'||a.move==='kick')&&f.step===3&&!isBoss(t.kind)){t.knockdown=.45;t.stun=Math.max(t.stun,.45);t.attack=null;}
      t.x = clamp(t.x + a.face * (heroAttack ? (special && (a.pulses??0)>=2?s.push*3:s.push) : 23), heroAttack?this.enemyLeft:this.cameraLeft+25, heroAttack?this.enemyRight:this.cameraLeft+935);
      if (heroAttack) {
        this.score += actual * 10 + Math.floor(actual * Math.min(this.hits, 20) * .5); this.hits++; this.bestCombo = Math.max(this.bestCombo, this.hits);this.stageBestHit=Math.max(this.stageBestHit,this.hits);
        this.hitDeadline = this.time + 1.7; this.freeze = a.move==='aerial'?.06:f.step === 3 ? .065 : .035;
      } else { if(this.hero.mounted)this.dismount(true);else this.damageEquipment();this.waveDamage += actual;this.stageDamage+=actual; this.hits = 0; this.queuedUntil = 0; }
      this.events.push({ type: 'hit', x: t.x, y: t.y - t.z - 38, value: damage, heavy: a.move==='aerial' || f.step === 3 || isBoss(f.kind), ...(heroAttack ? {heroId:f.heroId} : {}) });
      if (!t.hp) {
        this.unseatEnemy(t);
        this.score += heroAttack ? 100 : 0;
        if (heroAttack) {
          this.kills++;
          this.enemyDrop(t);
        }
        this.events.push({ type: 'death', x: t.x, y: t.y });
      }
    }
    if (heroAttack) {
      for (const box of [...this.supplies,...this.barrels,...this.props]) {
        if (box.hp <= 0 || !(special?specialHits(f.heroId!,a.x,a.y,a.face,box.x,box.y):inRange(a.x,a.y,box.x,box.y,a.face,s.reach))) continue;
        box.hp = Math.max(0, box.hp - s.damage);
        this.events.push({ type: 'crate', x: box.x, y: box.y - 12 });
        if(!box.hp&&'stageKind' in box){this.activateProp(box);}else if (!box.hp) {const loot=box.loot??crateLoot(this.stage,this.wave);this.pickups.push({ id: ++this.serial, x: box.x, y: box.y, amount:loot==='bun'?25:loot==='meat'?40:0,loot });}
      }
      this.supplies = this.supplies.filter(box => box.hp > 0);this.barrels=this.barrels.filter(box=>box.hp>0);
    }
    if (a.move === 'charge') f.x = clamp(a.x + a.face * 190, this.enemyLeft, this.enemyRight);
  }
}
