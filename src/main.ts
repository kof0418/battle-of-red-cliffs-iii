/// <reference types="vite/client" />
import {SPECIALS} from './specials';
import Phaser from 'phaser';
import {ProfileStorage,exportProfile,parseBackup,MAX_BACKUP_BYTES,type Entries} from './profile';
import {ResumeCountdown,LESSONS} from './experience';
const profileStorage = new ProfileStorage(localStorage);
import { FixedStep } from './fixed-step';
import { ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, CONTROL_KEY, VALID_KEYS, parseBindings, remap, keyAction, PadInput, type Bindings, type Action } from './controls';
import { readSlot, writeSlot, SLOT_COUNT } from './slots';
let bindings: Bindings = {...DEFAULT_BINDINGS};
try { bindings = parseBindings(JSON.parse(profileStorage.getItem(CONTROL_KEY) ?? 'null')); } catch {}
const keyboardHeld = new Set<string>();
import { Soundtrack } from './audio';
import { readPreferences, PREFERENCES_KEY } from './preferences';
import { parseRecords, recordVictory, RECORDS_KEY, type Records } from './records';
let preferences = readPreferences({ getItem: key => profileStorage.getItem(key) });
const soundtrack = new Soundtrack(); soundtrack.configure(preferences);
let settingsOpen = false;
let titleScreen = true;
let newRunApproved = false;
let settingsReturnFocus: HTMLElement | null = null;
let records: Records = {};
try { records = parseRecords(JSON.parse(profileStorage.getItem(RECORDS_KEY) ?? '{}')); } catch { /* optional storage */ }
window.addEventListener('pointerdown', () => soundtrack.unlock(), { capture: true });
window.addEventListener('keydown', () => soundtrack.unlock(), { capture: true });
import { HEROES, HERO_IDS, type HeroId } from './heroes';
import { selectionMarkup } from './selection';
let selectedHero: HeroId = 'guanyu';
document.querySelector('#hero-select')!.innerHTML = selectionMarkup();
for(const selector of ['#manual-slots','#slot-status','#backup-export','#history']){const el=document.querySelector(selector)!;document.querySelector('#save-details')!.append(selector==='#backup-export'?el.parentElement!:el);}
function setText(selector: string, value: string) { const el = document.querySelector(selector)!; if (el.textContent !== value) el.textContent = value; }
import './style.css';
import { desktop } from './desktop';
if (desktop) {
 document.documentElement.classList.add('desktop');
 document.querySelector('.tag')!.textContent = 'MAC EDITION / v1.3';
 document.querySelector('.save-note')!.textContent = '紀錄保存在此 Mac App。網頁版存檔可透過匯出、匯入接續遊玩。';
}
import { Campaign, isBoss, nearPickup, type Input, type Effect } from './combat';
import { Actor } from './actor';
import { drawBackground } from './background';
import { captureSave, restoreSave, readSave, writeSave, parseSave, MAX_SAVE_BYTES, type SaveData } from './save';

const held = new Set<string>(), pressed = new Set<string>();
let muted = preferences.muted;
function tone(frequency = 130, duration = .07) { soundtrack.effect(frequency, duration); }
function readBest() { try { const n = Number(profileStorage.getItem('red-banner-best-v13special')); return Number.isFinite(n) && n >= 0 && n <= 1e8 ? n : 0; } catch { return 0; } }
let savedRecord: SaveData | null = null;
let saveMessage = '尚無紀錄；戰鬥中每 5 秒自動保存。';
try { savedRecord = readSave(profileStorage); if (savedRecord) saveMessage = '找到行軍紀錄，可按「載入紀錄」接續。'; }
catch { saveMessage = '無法讀取本機紀錄；仍可遊玩或匯入有效存檔。'; }
function saveSummary() {
  if (!savedRecord) return '未保存';
  const r = savedRecord.run;
  return `${HEROES[r.hero.heroId ?? 'guanyu'].name} · 第 ${r.stage + 1} 關 · 第 ${r.wave} 陣 · 氣血 ${Math.ceil(r.hero.hp)} · ${r.score} 分`;
}
function persist(save: SaveData) {
  savedRecord = save;
  try { writeSave(profileStorage, save); saveMessage = `已保存 ${new Date(save.savedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`; }
  catch { saveMessage = '瀏覽器無法寫入；紀錄暫存於本頁，請匯出備份。'; }
}

class Battle extends Phaser.Scene {
  model = new Campaign(selectedHero); actors = new Map<number, Actor>();
  hud!: Phaser.GameObjects.Graphics; danger!: Phaser.GameObjects.Graphics;
  supplies!: Phaser.GameObjects.Graphics; backdrop?: Phaser.GameObjects.Container; drawnStage = -1;
  label!: Phaser.GameObjects.Text; healthLabel!: Phaser.GameObjects.Text; stageLabel!: Phaser.GameObjects.Text; scoreLabel!: Phaser.GameObjects.Text; notice!: Phaser.GameObjects.Text; combo!: Phaser.GameObjects.Text; bossLabel!: Phaser.GameObjects.Text;
  overlay?: Phaser.GameObjects.Container; overlayState = ''; best = readBest(); recorded = false;
  countdown = new ResumeCountdown();
  needsCountdown = false;
  clock = new FixedStep();
  pad = new PadInput();
  autoAttackAt = 0;
  autosaveAt = 0; saveSignature = '';
  constructor() { super('Battle'); }
  create(data?: { save?: SaveData }) {
    newRunApproved=false;this.countdown.cancel(); this.needsCountdown=!!data?.save;
    this.model = new Campaign(selectedHero); this.actors.clear(); this.overlayState = ''; this.overlay = undefined; this.recorded = false; this.drawnStage = -1; this.backdrop = undefined;
    if (data?.save) { this.model = restoreSave(data.save); if (this.model.ranked) this.best = Math.max(this.best, data.save.best); /* Audio preferences remain local to this device. */ }
    selectedHero = this.model.hero.heroId ?? 'guanyu';
    this.clock.reset(); this.pad.reset(); keyboardHeld.clear();
    this.autoAttackAt = 0;
    this.autosaveAt = this.model.time; this.saveSignature = this.signature();
    document.querySelector('#sound')!.textContent = `聲音：${muted ? '關' : '開'}`;
    held.clear(); pressed.clear();
    this.cameras.main.setBounds(0, 0, 2800, 540);
    this.supplies = this.add.graphics().setDepth(349.5);
    this.danger = this.add.graphics().setDepth(349);
    // Keyboard actions use physical codes and the saved binding map.
    // Event buffering avoids missing a short tap between rendered frames.
    const onKey = (event: KeyboardEvent) => {
      if(titleScreen && !settingsOpen){if(event.code==='Enter'){event.preventDefault();document.querySelector<HTMLButtonElement>('#title-start')!.click();}return;}
      if (settingsOpen || event.ctrlKey || event.metaKey || event.altKey) return;
      const mapped = keyAction(event.code, bindings);
      if (mapped) { event.preventDefault(); keyboardHeld.add(event.code); }
      if (event.repeat) return;
      if (this.model.status === 'ready') {
        let index = HERO_IDS.indexOf(selectedHero);
        if (event.code === 'ArrowRight') index = (index + 1) % HERO_IDS.length;
        else if (event.code === 'ArrowLeft') index = (index + HERO_IDS.length - 1) % HERO_IDS.length;
        else if (/^Digit[1-5]$/.test(event.code)) index = Number(event.code.slice(-1)) - 1;
        else index = -1;
        if (index >= 0) { event.preventDefault(); selectedHero = HERO_IDS[index]; this.model.selectHero(selectedHero); return; }
      }
      if (mapped) pressed.add(mapped);
    };
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onKey));
    const onPointer = () => this.activate();
    this.input.on('pointerdown', onPointer);
    this.events.once('shutdown', () => this.input.off('pointerdown', onPointer));
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(9000);
    this.label = this.add.text(26, 20, '', { fontFamily: 'monospace', fontSize: '15px', color: '#f0dfae' }).setScrollFactor(0).setDepth(9001);
    this.healthLabel = this.add.text(26, 36, '', { fontFamily:'sans-serif', fontSize:'11px',color:'#d8c99f' }).setScrollFactor(0).setDepth(9001);
    this.stageLabel = this.add.text(480, 18, '', {fontFamily:'monospace',fontSize:'14px',color:'#f0dfae',align:'center',lineSpacing:5}).setOrigin(.5,0).setScrollFactor(0).setDepth(9001);
    this.scoreLabel = this.add.text(930, 18, '', {fontFamily:'monospace',fontSize:'14px',color:'#f0dfae',align:'right',lineSpacing:5}).setOrigin(1,0).setScrollFactor(0).setDepth(9001);
    this.notice = this.add.text(480, 111, '', { fontFamily: 'sans-serif', fontSize: '17px', color: '#f4d28d', stroke: '#1d2d28', strokeThickness: 4 }).setOrigin(.5).setScrollFactor(0).setDepth(9001);
    this.combo = this.add.text(920, 125, '', { fontFamily: 'monospace', fontSize: '29px', color: '#f9d38a', align: 'right', stroke: '#25312b', strokeThickness: 4 }).setOrigin(1, 0).setScrollFactor(0).setDepth(9001);
    this.bossLabel = this.add.text(480, 483, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#f9d38a' }).setOrigin(.5).setScrollFactor(0).setDepth(9001);
    // Local visual QA fixture. Vite removes this branch from production builds.
    if (import.meta.env.DEV) {
      const preview = new URLSearchParams(location.search).get('preview');
      if(preview)titleScreen=false;
      if (preview === 'river') { this.model.stage = 1; this.model.start(); }
      if (preview === 'continue') { this.model.start(); this.model.hero.hp = 0; this.model.status = 'lost'; }
      if (preview === 'intermission') { this.model.start(); this.model.wave = 3; this.model.enemies = []; this.model.status = 'stage-clear'; }
    }
    this.draw();
    if (settingsOpen) { this.input.keyboard!.enabled = false; renderSlots(); }
  }
  signature() { const m = this.model; return `${m.stage}:${m.wave}:${m.status}:${m.continues}`; }
  saveCurrent() {
    if (this.model.status === 'ready') { saveMessage = '請先出陣，或載入已有紀錄。'; return; }
    try { persist(captureSave(this.model, this.best, muted)); this.autosaveAt = this.model.time; this.saveSignature = this.signature(); }
    catch (error) { saveMessage = error instanceof Error ? error.message : '保存失敗，請稍後再試。'; }
  }
  activate() {
    const m = this.model;
    if (settingsOpen || titleScreen) return;
    if (m.status === 'ready') {
      if(savedRecord&&!newRunApproved){document.querySelector<HTMLElement>('#new-run-confirm')!.hidden=false;document.querySelector<HTMLButtonElement>('#new-run-no')!.focus();return;}
      let seen=false;try{seen=profileStorage.getItem('red-banner-tutorial-v1')==='true';}catch{}
      if(!seen){openSettings();openTutorial();return;}m.start();newRunApproved=false;document.querySelector<HTMLElement>('#new-run-confirm')!.hidden=true;
    }
    else if (m.paused) this.resume();
    else if (m.status === 'stage-clear') { m.nextStage(); this.recorded = false; }
    else if (m.status === 'lost' && m.continues > 0) { m.continueRun(); this.recorded = false; }
    else if (m.status === 'lost' || m.status === 'won') this.scene.restart({});
  }
  resume() {
    if(this.countdown.remaining>0)return;
    if(this.needsCountdown){this.countdown.start();pressed.clear();held.clear();keyboardHeld.clear();this.pad.reset();}
    else this.model.togglePause();
  }
  actionDown(action: string) { return [...keyboardHeld].some(code => keyAction(code, bindings) === action); }
  update(_time: number, delta: number) {
    const m = this.model;
    let pads: (Gamepad | null)[] = [];
    try { pads = Array.from(navigator.getGamepads?.() ?? []); } catch { /* unavailable */ }
    const pad = this.pad.read(pads);
    if (!document.hasFocus()) { this.pad.reset(); pad.held.clear(); pad.pressed.clear(); }
    if (pad.disconnected) suspend();
    setText('#pad-status', pad.connected ? '手把已連接 · 左搖桿／方向鍵移動 · A／× 攻擊 · B／○ 跳躍 · X／□ 閃身 · Y／△ 必殺 · Start 暫停 · Back 設定' : '支援標準映射手把；連接後按任意鍵並放開。');
    if (pad.pressed.has('settings')) { if(settingsOpen)closeSettings();else openSettings(); }
    else if(settingsOpen) { handleMenuPad(pad.pressed); }
    else if(m.status === 'ready') {
      if(pad.pressed.has('left') || pad.pressed.has('right')) {
        selectedHero = HERO_IDS[(HERO_IDS.indexOf(selectedHero) + (pad.pressed.has('right') ? 1 : HERO_IDS.length-1)) % HERO_IDS.length];
        m.selectHero(selectedHero);
      }
      if(pad.pressed.has('attack') || pad.pressed.has('pause')){if(titleScreen)document.querySelector<HTMLButtonElement>('#title-start')!.click();else this.activate();}
    } else if(m.status !== 'playing') {
      if(pad.pressed.has('attack') || pad.pressed.has('pause')){if(titleScreen)document.querySelector<HTMLButtonElement>('#title-start')!.click();else this.activate();}
    } else { for(const action of pad.pressed)pressed.add(action); }
    if (pressed.delete('restart')) { requestRestart(); return; }
    if (pressed.delete('start')) this.activate();
    if (pressed.delete('pause')) { if(m.paused)this.resume();else {m.togglePause();this.saveCurrent();} }
    const autoAttack = preferences.autoAttack && !settingsOpen && (this.actionDown('attack') || held.has('attack') || pad.held.has('attack')) && m.time >= this.autoAttackAt;
    if(autoAttack) this.autoAttackAt = m.time + .20;
    const input: Input = {
      x: Number(this.actionDown('right') || pad.held.has('right') || held.has('right')) - Number(this.actionDown('left') || pad.held.has('left') || held.has('left')),
      y: Number(this.actionDown('down') || pad.held.has('down') || held.has('down')) - Number(this.actionDown('up') || pad.held.has('up') || held.has('up')),
      attack: pressed.delete('attack') || autoAttack, jump: pressed.delete('jump'), dodge: pressed.delete('dodge'), special: pressed.delete('special'),
    };
    if(this.countdown.remaining>0 && !settingsOpen) {
      if(this.countdown.tick(delta/1000)){this.needsCountdown=false;m.paused=false;keyboardHeld.clear();held.clear();pressed.clear();this.pad.reset();input.x=0;input.y=0;input.attack=false;input.jump=false;input.dodge=false;input.special=false;}
    }
    this.clock.advance(delta / 1000, input, m.status === 'playing' && !m.paused, (dt, stepInput) => {
      m.tick(dt, stepInput);
      for (const event of m.events) this.effect(event);
    });
    soundtrack.update(m.stage, m.enemies.some(e => isBoss(e.kind)), m.status === 'playing' && !m.paused && !settingsOpen && !document.hidden);
    if ((m.status === 'won' || m.status === 'lost') && !this.recorded) {
      if(m.status === 'won' && m.ranked) {
        records = recordVictory(records, m.hero.heroId ?? 'guanyu', m.score, m.rank);
        try { profileStorage.setItem(RECORDS_KEY, JSON.stringify(records)); } catch { /* session record still available */ }
        tone(740, .35);
      }
      this.recorded = true; if(m.ranked) this.best = Math.max(this.best, m.score);
      try { profileStorage.setItem('red-banner-best-v13special', String(this.best)); } catch { /* Storage is optional. */ }
    }
    if (m.status !== 'ready' && (this.signature() !== this.saveSignature || (!m.paused && m.time - this.autosaveAt >= 5))) this.saveCurrent();
    this.tweens.timeScale = m.paused ? 0 : 1;
    this.cameras.main.scrollX = Phaser.Math.Clamp(m.hero.x - 340, 0, 1840);
    this.draw();
  }
  effect(e: Effect) {
    if(e.type==='special') {
      const id=e.heroId!,spec=SPECIALS[id],face=e.value??1;
      soundtrack.weapon(id,true,true);
      const fx=this.add.graphics().setPosition(e.x,e.y-30).setScale(face,1).setDepth(8000);
      fx.lineStyle(4,spec.color,.9);
      if(id==='guanyu'||id==='zhangfei'){
        fx.strokeEllipse(0,25,spec.reach*2,spec.depth*2);
        if(id==='guanyu')fx.lineStyle(7,spec.color,.6).beginPath().arc(0,0,100,-2.5,1.5).strokePath();
        else for(let i=0;i<8;i++){const a=i*Math.PI/4;fx.lineBetween(Math.cos(a)*30,25+Math.sin(a)*20,Math.cos(a)*110,25+Math.sin(a)*70);}
      }else if(id==='huangzhong'){
        for(const dy of [-100,-50,0,50,100]){fx.lineStyle(2,spec.color,.85).lineBetween(15,0,440,dy);fx.fillStyle(0xffefd0).fillTriangle(440,dy,427,dy-4,427,dy+4);}
      }else if(id==='zhaoyun'){
        for(const dy of [-18,0,18])fx.lineStyle(dy===0?6:2,spec.color,.9).lineBetween(10,dy,320,dy);
        fx.fillStyle(0xffffff).fillTriangle(325,0,303,-9,303,9);
      }else for(let i=0;i<3;i++)fx.lineStyle(5-i,spec.color,.9).beginPath().arc(15,-i*8,85+i*12,-1.4,.9).strokePath();
      this.tweens.add({targets:fx,alpha:0,duration:500,onComplete:()=>fx.destroy()});
    } else if (e.type === 'arrow') {
      const reach = e.value ?? 300, end = e.x + reach;
      const arrow = this.add.graphics().setDepth(e.y + 41);
      arrow.lineStyle(e.heavy ? 4 : 2, 0xf8d690).lineBetween(e.x, e.y, end, e.y);
      arrow.fillStyle(0xffefd0).fillTriangle(end, e.y, end - Math.sign(reach) * 12, e.y - 4, end - Math.sign(reach) * 12, e.y + 4);
      this.tweens.add({ targets: arrow, alpha: 0, duration: 150, onComplete: () => arrow.destroy() });
    } else if (e.type === 'hit') {
      if(e.heroId)soundtrack.weapon(e.heroId,true,!!e.heavy);else tone(e.heavy ? 85 : 180, e.heavy ? .14 : .07);
      if (!preferences.reducedMotion) this.cameras.main.shake(e.heavy ? 100 : 45, e.heavy ? .004 : .0015);
      const damage = this.add.text(e.x, e.y - 20, String(e.value), { fontFamily: 'monospace', fontSize: e.heavy ? '24px' : '18px', color: '#ffe2a1', stroke: '#493e2c', strokeThickness: 3 }).setOrigin(.5).setDepth(8000);
      this.tweens.add({ targets: damage, y: damage.y - 28, alpha: 0, duration: 470, onComplete: () => damage.destroy() });
      for (let i = 0; i < 7; i++) {
        const spark = this.add.rectangle(e.x, e.y, i % 2 ? 3 : 6, 3, i % 2 ? 0xeaa351 : 0xfff1b5).setDepth(8000);
        this.tweens.add({ targets: spark, x: spark.x + Math.cos(i * 1.1) * 35, y: spark.y + Math.sin(i * 1.1) * 26, alpha: 0, duration: 220, onComplete: () => spark.destroy() });
      }
    } else if (e.type === 'heal') {
      tone(580, .16);
      const heal = this.add.text(e.x, e.y, `+${e.value}`, { fontFamily: 'monospace', fontSize: '23px', color: '#c9f2b7', stroke: '#24392b', strokeThickness: 3 }).setOrigin(.5).setDepth(8000);
      this.tweens.add({ targets: heal, y: heal.y - 30, alpha: 0, duration: 700, onComplete: () => heal.destroy() });
    } else if (e.type === 'death' || e.type === 'dodge' || e.type === 'crate') {
      const dust = this.add.ellipse(e.x, e.y, 40, 10, 0xd5b97c, .6).setDepth(e.y);
      this.tweens.add({ targets: dust, scaleX: 2, scaleY: 2, alpha: 0, duration: 300, onComplete: () => dust.destroy() });
    } else if (e.type === 'swing') soundtrack.weapon(e.heroId ?? 'guanyu',false,e.value===3);
    else if(e.type==='volley'||e.type==='fire')tone(e.type==='fire'?65:480,.16);
    else if (e.type === 'jump') tone(300, .07);
    else if (e.type === 'wave') tone(410, .18);
  }
  draw() {
    const m = this.model, live = new Set<number>();
    if (this.drawnStage !== m.stage) {
      this.backdrop?.destroy(true); this.backdrop = drawBackground(this, m.level); this.drawnStage = m.stage;
    }
    const supply = this.supplies; supply.clear();
    for (const box of m.supplies) {
      supply.fillStyle(0x24362e, .5).fillEllipse(box.x, box.y + 3, 42, 12);
      supply.fillStyle(0x765a38).fillRect(box.x - 17, box.y - 28, 34, 28);
      supply.lineStyle(3, 0xb79559).strokeRect(box.x - 17, box.y - 28, 34, 28);
      supply.lineBetween(box.x - 15, box.y - 26, box.x + 15, box.y - 2).lineBetween(box.x + 15, box.y - 26, box.x - 15, box.y - 2);
      if (box.hp < 24) supply.lineStyle(2, 0x2c3324).lineBetween(box.x - 3, box.y - 28, box.x + 4, box.y - 10);
    }
    for (const item of m.pickups) {
      const y = item.y - 11 + Math.sin(m.time * 5) * 3;
      supply.fillStyle(0xc8dc91, .18).fillEllipse(item.x, item.y + 1, 36, 12);
      supply.fillStyle(0x375f4b).fillRect(item.x - 9, y - 9, 18, 20);
      supply.lineStyle(2, 0xc5db9d).strokeRect(item.x - 9, y - 9, 18, 20);
      supply.fillStyle(0xd7e5a9).fillRect(item.x - 2, y - 5, 4, 12).fillRect(item.x - 6, y - 1, 12, 4);
    }
    for (const f of [m.hero, ...m.enemies]) {
      live.add(f.id);
      let actor = this.actors.get(f.id); if (!actor) { actor = new Actor(this, f.id); this.actors.set(f.id, actor); }
      actor.draw(f, m.time);
    }
    for (const [id, actor] of this.actors) if (!live.has(id)) { actor.fall(this); this.actors.delete(id); }
    const d = this.danger; d.clear();
    const field=m.field;
    if(field) {
      const color=field.kind==='fire'?0xff9a52:0x91d5dc;
      d.fillStyle(color,field.active?.08:.10+field.progress*.15).fillRect(field.x,field.y,field.width,field.height);
      d.lineStyle(field.active?4:2,color,.95).strokeRect(field.x,field.y,field.width,field.height);
      // A growing bar communicates timing without relying on flashing or colour alone.
      d.fillStyle(0xf7e9b3,.9).fillRect(field.x,field.y-6,field.width*field.progress,3);
      if(field.active)for(let x=field.x+12;x<field.x+field.width;x+=24) {
        if(field.kind==='volley') {d.lineStyle(2,0xe3e7cc).lineBetween(x-13,field.y-23,x,field.y+25);d.fillStyle(0xe3e7cc).fillTriangle(x,field.y+27,x-6,field.y+17,x+2,field.y+16);}
        else if(m.time-field.impactAt<.08){d.fillStyle(0xe9b25d).fillTriangle(x-9,field.y+30,x+2,field.y-14,x+10,field.y+30);}else{d.fillStyle(0x9b7454,.45).fillRect(x,field.y+25,9,3);}
      }
    }
    for (const e of m.enemies) {
      const a = e.attack; if (!a || a.hit) continue;
      const pulse = Math.floor(m.time * 10) % 2 ? .34 : .20;
      d.fillStyle(0xe77948, pulse); d.lineStyle(2, 0xffb568, .85);
      if (a.move === 'sweep') { d.fillRect(a.x - 170, a.y - 49, 340, 98); d.strokeRect(a.x - 170, a.y - 49, 340, 98); }
      else if (a.move === 'slam') { d.fillEllipse(a.x, a.y, 246, 176); d.strokeEllipse(a.x, a.y, 246, 176); }
      else { const w = a.move === 'charge' ? 250 : e.kind === 'heavy' ? 88 : 73; const x = a.face > 0 ? a.x : a.x - w; d.fillRect(x, a.y - 29, w, 58); d.strokeRect(x, a.y - 29, w, 58); }
    }
    const g = this.hud; g.clear(); g.fillStyle(0x0b191b, .95).fillRect(0, 0, 960, 87);
    g.fillStyle(0xa88a50).fillRect(0, 86, 960, 1); g.fillStyle(0x293a35).fillRect(26, 49, 240, 12);
    g.fillStyle(0xb7c58b).fillRect(28, 51, 236 * m.hero.hp / m.hero.max, 8);
    g.fillStyle(0x263e3b).fillRect(26, 69, 80, 4); g.fillStyle(0x67b9a7).fillRect(26, 69, 80 * (1 - m.hero.dodgeCooldown / .95), 4);
    g.fillStyle(0x806940).fillRect(350, 62, 250, 3); g.fillStyle(0xe5c681).fillRect(350, 62, 250 * m.hero.x / 2800, 3);
    this.label.setText(`${m.champion.name} / ${m.champion.title}`);
    this.healthLabel.setText(`氣血 ${Math.ceil(m.hero.hp)} / ${m.hero.max}     閃身 ${bindings.dodge.slice(3)}   必殺 ${bindings.special.slice(3)} ${(m.hero.specialCooldown??0)>0?Math.ceil(m.hero.specialCooldown!)+'s':m.hero.hp<=12?'氣血不足':'就緒'}`);
    this.stageLabel.setText(`赤旌 · v1.3\n關 ${m.stage + 1}/2 · 陣 ${m.wave || 1}/3`);
    this.scoreLabel.setText(`SCORE ${String(m.score).padStart(6,'0')}\nBEST ${this.best}`);
    const fullNearSupply = m.hero.hp >= m.hero.max && m.pickups.some(item => nearPickup(m.hero, item));
    this.notice.setText(field ? (field.active?'爆發已結束 · 餘燼不再造成傷害':field.kind==='volley'?'箭雨警戒 · 移出框線，跳躍無法躲避':'火船來襲 · 離開火線或跳躍／閃身') : fullNearSupply ? '氣血已滿 · 補給保留，受傷後再取' : m.time < m.messageUntil ? m.message : '');
    this.combo.setText(m.hits > 1 ? `${m.hits} HITS\n${m.champion.moves[Math.max(0, m.hero.step - 1)]}` : '');
    const boss = m.enemies.find(e => isBoss(e.kind));
    this.bossLabel.setText(boss ? `${m.level.boss}${boss.hp <= boss.max / 2 ? ' · 怒勢' : ''}　${Math.ceil(boss.hp)} / ${boss.max}` : '');
    if (boss) { g.fillStyle(0x142322, .95).fillRect(280, 498, 400, 25); g.fillStyle(0xb65440).fillRect(288, 505, 384 * boss.hp / boss.max, 10); }
    const state = m.paused ? 'paused' : m.status;
    const overlayKey=state+(this.countdown.remaining>0?`:${Math.ceil(this.countdown.remaining)}`:'');
    document.querySelector<HTMLElement>('#hero-select')!.hidden = state !== 'ready' || titleScreen;
    document.querySelector<HTMLElement>('#title-screen')!.hidden = !titleScreen;
    document.querySelector<HTMLElement>('#title-screen')!.inert = settingsOpen;
    document.querySelector<HTMLButtonElement>('#title-continue')!.disabled = !savedRecord;
    document.body.dataset.screen = titleScreen?'title':state;
    document.querySelector<HTMLElement>('#advance')!.classList.toggle('terminal-action', ['lost','won','stage-clear'].includes(state));
    if(!document.documentElement.hasAttribute('data-ready')){document.documentElement.setAttribute('data-ready','');requestAnimationFrame(()=>this.scale.refresh());}
    document.querySelector<HTMLElement>('#app')!.inert = state === 'ready' || settingsOpen;
    document.querySelector<HTMLElement>('#hero-select')!.inert = settingsOpen;
    for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-hero]'))) card.setAttribute('aria-pressed', String(card.dataset.hero === m.hero.heroId));
    document.querySelector('#hero-detail')!.textContent = `${m.champion.name} · ${m.champion.description} 必殺：${SPECIALS[m.hero.heroId!].name} — ${SPECIALS[m.hero.heroId!].description}。`;
    document.querySelector<HTMLButtonElement>('#resume-from-select')!.disabled = !savedRecord;
    const personal = records[m.hero.heroId ?? 'guanyu'];
    setText('#hero-record', personal ? `此武將已通關 · v1.3 最高 ${personal.score} 分 · 最佳評級 ${personal.rank}` : '此武將尚未通關 · 完成雙關留下戰績');
    setText('#deploy-hero', `以${m.champion.name}出陣 ▶`);
    if (overlayKey !== this.overlayState) {
      this.overlayState = overlayKey; this.overlay?.destroy(true); this.overlay = undefined;
      if (state !== 'playing') this.showOverlay(state);
    }
    const pause = document.querySelector<HTMLButtonElement>('#pause');
    if (pause) { setText('#pause', 'Ⅱ Esc'); pause.disabled = m.status === 'ready'; }
    const status = document.querySelector('#game-status');
    if (status) status.textContent = state === 'ready' ? '等待出陣' : state === 'paused' ? '已暫停' : state === 'won' ? `兩關完成 · ${m.score} 分` : state === 'lost' ? `敗陣 · 續關剩 ${m.continues} 次` : state === 'stage-clear' ? '第一關完成' : `第 ${m.stage + 1} 關 · ${m.enemies.length} 名敵人`;
    const action = document.querySelector<HTMLButtonElement>('#advance');
    if (action) {
      action.hidden = state === 'playing' || state === 'paused';
      setText('#advance', state === 'ready' ? '出陣 ▶' : state === 'stage-clear' ? '前往第二關 ▶' : state === 'lost' && m.continues > 0 ? `續關 (${m.continues}) ▶` : '重新出征 ↻');
    }
    document.querySelector('#save-summary')!.textContent = saveSummary();
    document.querySelector('#save-status')!.textContent = saveMessage;
    document.querySelector<HTMLButtonElement>('#load-save')!.disabled = !savedRecord;
    document.querySelector<HTMLButtonElement>('#export-save')!.disabled = !savedRecord && m.status === 'ready';
    document.querySelector<HTMLButtonElement>('#save-now')!.disabled = m.status === 'ready';
    document.querySelector('#credits')!.textContent = `續關 ${m.continues} / 2`;
    for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'))) {
      const index = Number(card.dataset.stage); card.dataset.state = index < m.stage || state === 'won' || (state === 'stage-clear' && index === m.stage) ? 'cleared' : index === m.stage ? 'current' : 'locked';
      card.querySelector('small')!.textContent = card.dataset.state === 'cleared' ? '已突破' : card.dataset.state === 'current' ? '目前關卡' : '突破前關後開放';
    }
  }
  showOverlay(state: string) {
    const m = this.model;
    const title = this.countdown.remaining>0 ? `${Math.ceil(this.countdown.remaining)}` : state === 'ready' ? '赤 旌' : state === 'paused' ? '暫 停' : state === 'stage-clear' ? '關 隘 已 破' : state === 'won' ? '赤 旌 凱 旋' : '勝 敗 乃 常';
    const sub = this.countdown.remaining>0 ? '準備返回戰場 · 遊戲時間暫停' : state === 'ready' ? '雙關戰役 · 赤旌凱旋 v1.3' : state === 'paused' ? `${m.level.title}　／　戰場等你歸來` : state === 'stage-clear' ? m.level.story : state === 'won' ? `評級 ${m.rank}　得分 ${m.score}　最高連擊 ${m.bestCombo}　末陣獎勵 +${Math.max(0,m.waveReward)}` : `當前：${m.level.title} 第 ${m.wave} 陣　／　續關剩 ${m.continues} 次`;
    const action = state === 'ready' ? '按 ENTER 或點擊出陣' : state === 'paused' ? `按 ${bindings.pause.slice(3)}／手把 Start 或「繼續」` : state === 'stage-clear' ? '按 ENTER 或點擊前往第二關 · 氣血全回復' : state === 'lost' && m.continues > 0 ? '按 ENTER 或點擊續關 · 重打當前一陣' : '按 ENTER、R 或點擊重新出征';
    const hint = state === 'won' ? m.level.story + (m.ranked ? '' : '（舊檔戰役不列入 v1.3 戰績）') : state === 'lost' ? '續關退回本陣起始分數；R 重開全程。' : `${bindings.attack.slice(3)} 連斬　${bindings.jump.slice(3)} 跳躍　${bindings.dodge.slice(3)} 閃身　／　打破木箱、走近藥包補血`;
    const bg = this.add.rectangle(480, 282, 960, 410, 0x0b1416, .84);
    const text = (y: number, value: string, size: number, color: string) => this.add.text(480, y, value, { fontFamily: 'serif', fontSize: `${size}px`, color, wordWrap: { width: 830 }, align: 'center' }).setOrigin(.5);
    this.overlay = this.add.container(0, 0, [bg, text(207, title, 62, '#e8c27e'), text(286, sub, 18, '#ddd2b6'), text(350, action, 18, '#e9bd64'), text(399, hint, 14, '#9eaf9b')]).setScrollFactor(0).setDepth(10000);
  }
}
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, pixelArt: true, roundPixels: true,
  backgroundColor: '#24393d', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: document.documentElement }, scene: Battle, banner: false });
document.querySelector('#sound')!.addEventListener('click', () => { preferences.muted = !preferences.muted; savePreferences(); });
document.querySelector('#fullscreen')!.addEventListener('click', async () => { if (desktop) { try { await desktop.invoke('toggle_fullscreen'); } catch { saveMessage = '無法切換全螢幕。'; } return; } if (game.scale.isFullscreen) game.scale.stopFullscreen(); else game.scale.startFullscreen(); });
document.querySelector('#advance')!.addEventListener('click', () => { current().activate(); current().draw(); });
document.querySelector('#pause')!.addEventListener('click',openSettings);
document.querySelector('#restart')!.addEventListener('click', requestRestart);
document.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); held.add(el.dataset.key!); pressed.add(el.dataset.key!); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(event, () => held.delete(el.dataset.key!));
});
function suspend() {
  soundtrack.pause();
  current()?.countdown.cancel();
  current()?.clock.reset(); current()?.pad.reset(); keyboardHeld.clear();
  held.clear(); pressed.clear();
  const scene = game.scene.getScene('Battle') as Battle;
  if (scene?.model.status === 'playing') { scene.model.paused = true; scene.input.keyboard?.resetKeys(); scene.saveCurrent(); }
}
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });

const current = () => game.scene.getScene('Battle') as Battle;
document.querySelector('#save-now')!.addEventListener('click', () => { suspend(); current().saveCurrent(); });
document.querySelector('#load-save')!.addEventListener('click', () => {
  if (savedRecord) { titleScreen=false;const requested = savedRecord; suspend(); persist(requested); saveMessage = '紀錄已載入；按繼續返回戰場。'; current().scene.restart({ save: requested }); }
});
document.querySelector('#export-save')!.addEventListener('click', async () => {
  suspend();
  if (current().model.status !== 'ready') current().saveCurrent();
  if (!savedRecord) return;
  if (desktop) {
    try { saveMessage = await desktop.invoke<boolean>('export_save', { contents: JSON.stringify(savedRecord, null, 2) }) ? '存檔已匯出。' : '已取消匯出。'; }
    catch (error) { saveMessage = String(error); }
    return;
  }
  const blob = new Blob([JSON.stringify(savedRecord, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `red-banner-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
});
const picker = document.querySelector<HTMLInputElement>('#save-file')!;
document.querySelector('#import-save')!.addEventListener('click', async () => {
  suspend();
  if (!desktop) { picker.click(); return; }
  try {
    const contents = await desktop.invoke<string | null>('import_save');
    if (contents === null) { saveMessage = '已取消匯入。'; return; }
    const save = parseSave(contents); persist(save); current().scene.restart({ save });
  } catch (error) { saveMessage = String(error); }
});
picker.addEventListener('change', async () => {
  const file = picker.files?.[0]; if (!file) return;
  try {
    if (file.size > MAX_SAVE_BYTES) throw new Error('存檔太大，請選擇 128 KB 以下的遊戲存檔。');
    const save = parseSave(await file.text()); titleScreen=false;persist(save); current().scene.restart({ save });
  } catch (error) { saveMessage = error instanceof Error ? error.message : '匯入失敗，原有紀錄未變更。'; }
  finally { picker.value = ''; }
});
window.addEventListener('pagehide', () => { if (current()?.model) current().saveCurrent(); });

document.querySelectorAll<HTMLElement>('[data-hero]').forEach(card => card.addEventListener('click', () => {
  const id = card.dataset.hero as HeroId;
  if (current().model.selectHero(id)) selectedHero = id;
}));
document.querySelector('#deploy-hero')!.addEventListener('click', () => { current().activate(); current().draw(); });
document.querySelector('#reselect')!.addEventListener('click', requestRestart);

document.querySelector('#resume-from-select')!.addEventListener('click', () => document.querySelector<HTMLButtonElement>('#load-save')!.click());

function savePreferences() {
  muted = preferences.muted; soundtrack.configure(preferences);
  setText('#sound', `聲音：${muted ? '關' : '開'}`);
  try { profileStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); setText('#settings-status','設定已保存於此裝置。'); }
  catch { setText('#settings-status','設定僅本次有效；此裝置不允許儲存。'); }
}
function openSettings() {
  if(settingsOpen) return;
  overwriteSlot = -1;
  setText('#menu-resume',current().model.status==='playing'?'繼續遊戲 · Esc':'返回 · Esc');
  document.querySelector<HTMLDetailsElement>('#options-details')!.open=false;
  document.querySelector<HTMLDetailsElement>('#save-details')!.open=false;
  settingsReturnFocus = document.activeElement as HTMLElement;
  suspend(); settingsOpen = true;
  current().input.keyboard!.enabled = false;
  document.querySelector<HTMLElement>('#settings-panel')!.setAttribute('data-open','');
  document.querySelector<HTMLElement>('#settings-panel')!.hidden = false;
  document.querySelector<HTMLInputElement>('#music-volume')!.value = String(preferences.music * 100);
  document.querySelector<HTMLInputElement>('#effects-volume')!.value = String(preferences.effects * 100);
  document.querySelector<HTMLInputElement>('#mute-all')!.checked = preferences.muted;
  document.querySelector<HTMLInputElement>('#reduce-motion')!.checked = preferences.reducedMotion;
  document.querySelector<HTMLInputElement>('#auto-attack')!.checked = preferences.autoAttack;
  renderControls(); renderSlots(); renderHistory();
  refreshVolumeLabels(); current().draw();
  document.querySelector<HTMLButtonElement>('#menu-resume')!.focus();
}
function closeSettings(resume=true) {
  settingsOpen = false; document.querySelector<HTMLElement>('#settings-panel')!.removeAttribute('data-open'); document.querySelector<HTMLElement>('#settings-panel')!.hidden = true;
  current().input.keyboard!.enabled = true; current().input.keyboard!.resetKeys();
  pressed.clear(); held.clear(); keyboardHeld.clear(); current().pad.reset(); current().draw();
  document.querySelector<HTMLElement>('#restart-confirm')!.hidden=true;
  document.querySelector<HTMLElement>('#tutorial-panel')!.hidden=true;tutorialStep=-1;
  if(resume && current().model.status==='playing' && current().model.paused)current().resume();
  current().draw();settingsReturnFocus?.focus();
}
function refreshVolumeLabels() {
  setText('#music-value', `${Math.round(preferences.music*100)}%`);
  setText('#effects-value', `${Math.round(preferences.effects*100)}%`);
}
for(const id of ['settings-open','select-settings']) document.getElementById(id)!.addEventListener('click',openSettings);
document.getElementById('settings-close')!.addEventListener('click',()=>closeSettings());
for(const [id,key] of [['music-volume','music'],['effects-volume','effects']] as const) {
 document.getElementById(id)!.addEventListener('input',e=>{
  preferences[key] = Number((e.target as HTMLInputElement).value)/100;savePreferences();refreshVolumeLabels();
  if(key==='effects')tone(440,.10);
 });
}
for(const [id,key] of [['mute-all','muted'],['reduce-motion','reducedMotion'],['auto-attack','autoAttack']] as const) {
 document.getElementById(id)!.addEventListener('change',e=>{preferences[key]=(e.target as HTMLInputElement).checked;savePreferences();});
}
window.addEventListener('keydown', e => {
 if(e.code==='Escape') {e.preventDefault();e.stopImmediatePropagation();if(settingsOpen)closeSettings();else openSettings();}
 if(settingsOpen && e.code==='Tab') {
  const controls=menuControls();
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
 }
},true);

window.addEventListener('keyup', e => keyboardHeld.delete(e.code));
function renderControls() {
 const area=document.querySelector('#custom-controls')!;
 area.innerHTML='<h3>自訂按鍵</h3><div class="binding-grid">'+ACTIONS.map(a=>`<label>${ACTION_LABELS[a]}<select data-binding="${a}" aria-label="${ACTION_LABELS[a]}按鍵">${VALID_KEYS.map(k=>`<option value="${k}" ${bindings[a]===k?'selected':''}>${k.slice(3)}</option>`).join('')}</select></label>`).join('')+'</div><button id="reset-bindings">恢復預設按鍵</button>';
 area.querySelectorAll<HTMLSelectElement>('[data-binding]').forEach(el=>el.addEventListener('change',()=>{
  try {bindings=remap(bindings,el.dataset.binding as Action,el.value);persistBindings();}
  catch(e){setText('#binding-status',String(e));el.value=bindings[el.dataset.binding as Action];}
 }));
 document.querySelector('#reset-bindings')!.addEventListener('click',()=>{bindings={...DEFAULT_BINDINGS};persistBindings();renderControls();});
 updateKeyGuide();
}
function updateKeyGuide(){
 const label=(a:Action)=>bindings[a].slice(3);
 setText('#special-key',label('special'));
 setText('#key-guide',`${label('up')}${label('left')}${label('down')}${label('right')}／方向鍵移動 · ${label('attack')} 攻擊 · ${label('jump')}／空白鍵跳躍 · ${label('dodge')} 閃身 · ${label('special')} 必殺（12 氣血／8 秒冷卻） · ${label('pause')} 暫停`);
 const keys=document.querySelectorAll('.controls kbd');
 if(keys.length>=8){keys[0].textContent=`${label('up')} ${label('left')} ${label('down')} ${label('right')}`;keys[2].textContent=label('attack');keys[3].textContent=label('jump');keys[5].textContent=label('dodge');keys[6].textContent=label('pause');}
}
function persistBindings(){
 keyboardHeld.clear();pressed.clear();
 try{profileStorage.setItem(CONTROL_KEY,JSON.stringify(bindings));setText('#binding-status','按鍵已保存。');}
 catch{setText('#binding-status','本機無法保存，按鍵設定僅本次有效。');}
 updateKeyGuide();
}
let overwriteSlot=-1;
function renderSlots(){
 const area=document.querySelector('#manual-slots')!;area.innerHTML='<h3>三個手動存檔槽</h3>';
 for(let i=0;i<SLOT_COUNT;i++){
  let save:SaveData|null=null,summary='空白';
  try{save=readSlot(profileStorage,i);if(save)summary=`${HEROES[save.run.hero.heroId??'guanyu'].name} · 關 ${save.run.stage+1} 陣 ${save.run.wave} · ${save.run.score} 分 · ${new Date(save.savedAt).toLocaleString()}`;}
  catch{summary='無法讀取此槽；可用目前進度覆寫。';}
  const row=document.createElement('div');row.className='slot-row';
  const text=document.createElement('span');text.textContent=`${i+1}　${summary}`;row.append(text);
  const store=document.createElement('button');store.textContent=overwriteSlot===i?'確認覆寫':`存入槽 ${i+1}`;store.disabled=current().model.status==='ready';
  store.addEventListener('click',()=>{
   if(summary!=='空白'&&overwriteSlot!==i){overwriteSlot=i;renderSlots();setText('#slot-status','再次點擊確認覆寫此槽；其他存檔不受影響。');return;}
   try{writeSlot(profileStorage,i,captureSave(current().model,current().best,muted));overwriteSlot=-1;renderSlots();setText('#slot-status',`已存入槽 ${i+1}。`);}
   catch(e){setText('#slot-status',`保存失敗：${String(e)}`);}
  });
  const load=document.createElement('button');load.textContent=`載入槽 ${i+1}`;load.disabled=!save;
  load.addEventListener('click',()=>{if(!save)return;titleScreen=false;closeSettings(false);suspend();persist(save);current().scene.restart({save});overwriteSlot=-1;saveMessage=`已載入手動槽 ${i+1}，按繼續返回戰場。`;});
  row.append(store,load);area.append(row);
 }
}
renderControls();

function requestRestart(){
 document.querySelector<HTMLDetailsElement>('#options-details')!.open=true;
 if(current().model.status==='ready')return;
 openSettings();document.querySelector<HTMLDetailsElement>('#options-details')!.open=true;document.querySelector<HTMLElement>('#restart-confirm')!.hidden=false;
 document.querySelector<HTMLButtonElement>('#restart-no')!.focus();
}
document.querySelector('#restart-yes')!.addEventListener('click',()=>{closeSettings(false);suspend();current().scene.restart({});});
document.querySelector('#restart-no')!.addEventListener('click',()=>closeSettings());
function menuControls(){return Array.from(document.querySelectorAll<HTMLElement>('#settings-panel input, #settings-panel select, #settings-panel button, #settings-panel summary')).filter(el=>!el.hasAttribute('disabled')&&el.getClientRects().length>0);}
function handleMenuPad(actions:Set<string>){
 if(actions.has('jump')){closeSettings();return;}
 if(tutorialStep>=0)for(const action of actions)practice(action);
 const controls=menuControls();if(!controls.length)return;
 let index=controls.indexOf(document.activeElement as HTMLElement);
 if(actions.has('up')||actions.has('down')){index=(Math.max(0,index)+(actions.has('down')?1:controls.length-1))%controls.length;controls[index].focus();controls[index].scrollIntoView({block:'nearest'});}
 const el=document.activeElement;
 const direction=actions.has('right')?1:actions.has('left')?-1:0;
 if(direction&&el instanceof HTMLSelectElement){el.selectedIndex=(el.selectedIndex+direction+el.options.length)%el.options.length;el.dispatchEvent(new Event('change',{bubbles:true}));}
 else if(direction&&el instanceof HTMLInputElement&&el.type==='range'){el.value=String(Math.max(Number(el.min),Math.min(Number(el.max),Number(el.value)+direction*Number(el.step||1))));el.dispatchEvent(new Event('input',{bubbles:true}));}
 if(actions.has('attack')&&el instanceof HTMLElement)el.click();
}
function renderHistory(){
 const area=document.querySelector('#history')!;area.innerHTML='<h3>歷史戰績</h3>';
 for(const [version,key] of [['1.0','v1'],['1.1','v11'],['1.2','v12'],['1.3','v13'],['1.3 必殺技','v13special']]){
  const title=document.createElement('p');title.textContent=`v${version}`;area.append(title);
  let rows:Records={};try{rows=parseRecords(JSON.parse(profileStorage.getItem(`red-banner-records-${key}`)??'{}'));}catch{}
  const list=document.createElement('p');list.className='history-row';list.textContent=HERO_IDS.map(id=>`${HEROES[id].name}：${rows[id]?`${rows[id]!.score} 分／${rows[id]!.rank}`:'尚無紀錄'}`).join('　');area.append(list);
 }
}
let pendingBackup:Entries|null=null;
async function exportBackup(){
 try{
  const contents=exportProfile(profileStorage);
  if(desktop){const saved=await desktop.invoke<boolean>('export_backup',{contents});setText('#backup-status',saved?'完整備份已匯出。':'已取消匯出。');}
  else{const url=URL.createObjectURL(new Blob([contents],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='red-banner-full-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);setText('#backup-status','已產生完整備份下載。');}
 }catch(e){setText('#backup-status',`匯出失敗：${String(e)}`);}
}
function stageBackup(text:string){
 pendingBackup=null;document.querySelector<HTMLElement>('#backup-confirm')!.hidden=true;
 try{pendingBackup=parseBackup(text);setText('#backup-status',`備份已驗證：${Object.keys(pendingBackup).length} 項資料，尚未修改本機。`);document.querySelector<HTMLElement>('#backup-confirm')!.hidden=false;}
 catch(e){setText('#backup-status',`無法還原：${String(e)}`);}
}
document.querySelector('#backup-export')!.addEventListener('click',exportBackup);
document.querySelector('#backup-import')!.addEventListener('click',async()=>{
 try{if(desktop){const text=await desktop.invoke<string|null>('import_backup');if(text!==null)stageBackup(text);}else document.querySelector<HTMLInputElement>('#backup-file')!.click();}
 catch(e){setText('#backup-status',String(e));}
});
document.querySelector('#backup-file')!.addEventListener('change',async e=>{
 const el=e.target as HTMLInputElement,file=el.files?.[0];if(!file)return;
 try{if(file.size>MAX_BACKUP_BYTES)throw new Error('完整備份超過 1 MB。');stageBackup(await file.text());}catch(error){setText('#backup-status',String(error));}finally{el.value='';}
});
document.querySelector('#backup-cancel')!.addEventListener('click',()=>{pendingBackup=null;document.querySelector<HTMLElement>('#backup-confirm')!.hidden=true;});
document.querySelector('#backup-apply')!.addEventListener('click',()=>{
 if(!pendingBackup)return;
 try{
  profileStorage.replace(pendingBackup);pendingBackup=null;
  preferences=readPreferences(profileStorage);bindings=parseBindings(JSON.parse(profileStorage.getItem(CONTROL_KEY)??'null'));
  records=parseRecords(JSON.parse(profileStorage.getItem(RECORDS_KEY)??'{}'));savedRecord=readSave(profileStorage);
  muted=preferences.muted;soundtrack.configure(preferences);closeSettings(false);current().scene.restart({});current().best=readBest();
  saveMessage='完整備份已還原；請選擇接續存檔或手動槽。';document.querySelector<HTMLElement>('#backup-confirm')!.hidden=true;updateKeyGuide();
 }catch(e){setText('#backup-status',`還原失敗，請保留備份：${String(e)}`);}
});
let tutorialStep=-1,practiceCount=0;
function openTutorial(){document.querySelector<HTMLDetailsElement>('#options-details')!.open=true;tutorialStep=0;renderLesson();}
function renderLesson(){
 const area=document.querySelector<HTMLElement>('#tutorial-panel')!;area.hidden=false;practiceCount=0;
 const lesson=LESSONS[tutorialStep];area.innerHTML=`<h3>${lesson.title}</h3><p>${lesson.text}</p><div class="practice-stage"><span class="practice-hero">將</span><span class="practice-target">敵</span></div><p id="practice-status">這是安全練習，不會改變戰役。可試按移動、攻擊、跳躍與閃身鍵。</p><button id="lesson-next">${tutorialStep===LESSONS.length-1?'完成教學':'下一步'}</button><button id="lesson-skip">略過教學</button>`;
 document.querySelector('#lesson-next')!.addEventListener('click',()=>{if(tutorialStep===LESSONS.length-1)finishTutorial();else{tutorialStep++;renderLesson();}});
 document.querySelector('#lesson-skip')!.addEventListener('click',finishTutorial);
 document.querySelector<HTMLButtonElement>('#lesson-next')!.focus();area.scrollIntoView({block:'start'});
}
function finishTutorial(){try{profileStorage.setItem('red-banner-tutorial-v1','true');}catch{}closeSettings();}
function practice(action:string){
 if(tutorialStep<0||!['up','down','left','right','attack','jump','dodge','special'].includes(action))return;
 const hero=document.querySelector<HTMLElement>('.practice-hero');if(!hero)return;
 practiceCount++;hero.className=`practice-hero demo-${action}`;
 setText('#practice-status',`${ACTION_LABELS[action as Action]} ✓　已練習 ${practiceCount} 次；完成後可按下一步。`);
}
window.addEventListener('keydown',e=>{if(settingsOpen&&tutorialStep>=0&&!e.repeat){const a=keyAction(e.code,bindings);if(a){e.preventDefault();practice(a);}}});
document.querySelector('#tutorial-open')!.addEventListener('click',openTutorial);

document.querySelector('#title-start')!.addEventListener('click',()=>{titleScreen=false;current().draw();document.querySelector<HTMLButtonElement>('#deploy-hero')!.focus();});
document.querySelector('#title-continue')!.addEventListener('click',()=>{document.querySelector<HTMLButtonElement>('#load-save')!.click();});
document.querySelector('#title-settings')!.addEventListener('click',openSettings);
document.querySelector('#menu-resume')!.addEventListener('click',()=>closeSettings());
document.querySelector('#menu-reselect')!.addEventListener('click',()=>{suspend();closeSettings(false);titleScreen=false;current().scene.restart({});});
document.querySelector('#menu-home')!.addEventListener('click',()=>{suspend();closeSettings(false);titleScreen=true;current().scene.restart({});});

document.querySelector('#new-run-yes')!.addEventListener('click',()=>{newRunApproved=true;document.querySelector<HTMLElement>('#new-run-confirm')!.hidden=true;current().activate();current().draw();});
document.querySelector('#new-run-no')!.addEventListener('click',()=>{document.querySelector<HTMLElement>('#new-run-confirm')!.hidden=true;document.querySelector<HTMLButtonElement>('#deploy-hero')!.focus();});
