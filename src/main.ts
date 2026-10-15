import Phaser from 'phaser';
import './style.css';
import { Campaign, type Input, type Effect } from './combat';
import { Actor } from './actor';
import { drawBackground } from './background';

const held = new Set<string>(), pressed = new Set<string>();
let muted = false, audio: AudioContext | undefined;
function tone(frequency = 130, duration = .07) {
  if (muted) return;
  try {
    audio ??= new AudioContext(); void audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(45, audio.currentTime + duration);
    gain.gain.setValueAtTime(.07, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + duration);
  } catch { /* Audio is optional, including when browser permission is denied. */ }
}
function readBest() { try { return Number(localStorage.getItem('red-banner-best')) || 0; } catch { return 0; } }
class Battle extends Phaser.Scene {
  model = new Campaign(); actors = new Map<number, Actor>();
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  hud!: Phaser.GameObjects.Graphics; danger!: Phaser.GameObjects.Graphics;
  label!: Phaser.GameObjects.Text; notice!: Phaser.GameObjects.Text; combo!: Phaser.GameObjects.Text; bossLabel!: Phaser.GameObjects.Text;
  overlay?: Phaser.GameObjects.Container; overlayState = ''; best = readBest(); recorded = false;
  constructor() { super('Battle'); }
  create() {
    this.model = new Campaign(); this.actors.clear(); this.overlayState = ''; this.overlay = undefined; this.recorded = false;
    held.clear(); pressed.clear();
    this.cameras.main.setBounds(0, 0, 2800, 540); drawBackground(this);
    this.danger = this.add.graphics().setDepth(349);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,J,K,L,SPACE,P,R,ENTER,UP,DOWN,LEFT,RIGHT') as typeof this.keys;
    // Event buffering avoids missing a short tap between rendered frames.
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const action: Record<string, string> = { KeyJ: 'attack', KeyK: 'jump', Space: 'jump', KeyL: 'dodge', KeyP: 'pause', KeyR: 'restart', Enter: 'start' };
      if (action[event.code]) pressed.add(action[event.code]);
    };
    this.input.keyboard!.on('keydown', onKey);
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown', onKey));
    this.input.on('pointerdown', () => {
      if (this.model.status === 'ready') this.model.start();
      else if (this.model.paused) this.model.togglePause();
      else if (this.model.status === 'won' || this.model.status === 'lost') this.scene.restart();
    });
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(9000);
    this.label = this.add.text(26, 20, '', { fontFamily: 'monospace', fontSize: '15px', color: '#f0dfae' }).setScrollFactor(0).setDepth(9001);
    this.notice = this.add.text(480, 111, '', { fontFamily: 'sans-serif', fontSize: '17px', color: '#f4d28d', stroke: '#1d2d28', strokeThickness: 4 }).setOrigin(.5).setScrollFactor(0).setDepth(9001);
    this.combo = this.add.text(920, 125, '', { fontFamily: 'monospace', fontSize: '29px', color: '#f9d38a', align: 'right', stroke: '#25312b', strokeThickness: 4 }).setOrigin(1, 0).setScrollFactor(0).setDepth(9001);
    this.bossLabel = this.add.text(480, 483, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#f9d38a' }).setOrigin(.5).setScrollFactor(0).setDepth(9001);
    this.draw();
  }
  down(...keys: string[]) { return keys.some(k => this.keys[k]?.isDown); }
  update(_time: number, delta: number) {
    const m = this.model;
    if (pressed.delete('restart')) { this.scene.restart(); return; }
    if (pressed.delete('start') && m.status === 'ready') m.start();
    if (pressed.delete('pause')) m.togglePause();
    const input: Input = {
      x: Number(this.down('D', 'RIGHT') || held.has('right')) - Number(this.down('A', 'LEFT') || held.has('left')),
      y: Number(this.down('S', 'DOWN') || held.has('down')) - Number(this.down('W', 'UP') || held.has('up')),
      attack: pressed.delete('attack'), jump: pressed.delete('jump'), dodge: pressed.delete('dodge'),
    };
    m.tick(delta / 1000, input);
    for (const event of m.events) this.effect(event);
    if ((m.status === 'won' || m.status === 'lost') && !this.recorded) {
      this.recorded = true; this.best = Math.max(this.best, m.score);
      try { localStorage.setItem('red-banner-best', String(this.best)); } catch { /* Storage is optional. */ }
    }
    this.tweens.timeScale = m.paused ? 0 : 1;
    this.cameras.main.scrollX = Phaser.Math.Clamp(m.hero.x - 340, 0, 1840);
    this.draw();
  }
  effect(e: Effect) {
    if (e.type === 'hit') {
      tone(e.heavy ? 85 : 180, e.heavy ? .14 : .07);
      this.cameras.main.shake(e.heavy ? 100 : 45, e.heavy ? .004 : .0015);
      const damage = this.add.text(e.x, e.y - 20, String(e.value), { fontFamily: 'monospace', fontSize: e.heavy ? '24px' : '18px', color: '#ffe2a1', stroke: '#493e2c', strokeThickness: 3 }).setOrigin(.5).setDepth(8000);
      this.tweens.add({ targets: damage, y: damage.y - 28, alpha: 0, duration: 470, onComplete: () => damage.destroy() });
      for (let i = 0; i < 7; i++) {
        const spark = this.add.rectangle(e.x, e.y, i % 2 ? 3 : 6, 3, i % 2 ? 0xeaa351 : 0xfff1b5).setDepth(8000);
        this.tweens.add({ targets: spark, x: spark.x + Math.cos(i * 1.1) * 35, y: spark.y + Math.sin(i * 1.1) * 26, alpha: 0, duration: 220, onComplete: () => spark.destroy() });
      }
    } else if (e.type === 'death' || e.type === 'dodge') {
      const dust = this.add.ellipse(e.x, e.y, 40, 10, 0xd5b97c, .6).setDepth(e.y);
      this.tweens.add({ targets: dust, scaleX: 2, scaleY: 2, alpha: 0, duration: 300, onComplete: () => dust.destroy() });
    } else if (e.type === 'swing') tone(160 + (e.value ?? 1) * 60, .07);
    else if (e.type === 'jump') tone(300, .07);
    else if (e.type === 'wave') tone(410, .18);
  }
  draw() {
    const m = this.model, live = new Set<number>();
    for (const f of [m.hero, ...m.enemies]) {
      live.add(f.id);
      let actor = this.actors.get(f.id); if (!actor) { actor = new Actor(this, f.id); this.actors.set(f.id, actor); }
      actor.draw(f, m.time);
    }
    for (const [id, actor] of this.actors) if (!live.has(id)) { actor.destroy(); this.actors.delete(id); }
    const d = this.danger; d.clear();
    for (const e of m.enemies) {
      const a = e.attack; if (!a || a.hit) continue;
      const pulse = Math.floor(m.time * 10) % 2 ? .34 : .20;
      d.fillStyle(0xe77948, pulse); d.lineStyle(2, 0xffb568, .85);
      if (a.move === 'slam') { d.fillEllipse(a.x, a.y, 246, 176); d.strokeEllipse(a.x, a.y, 246, 176); }
      else { const w = a.move === 'charge' ? 250 : e.kind === 'heavy' ? 88 : 73; const x = a.face > 0 ? a.x : a.x - w; d.fillRect(x, a.y - 29, w, 58); d.strokeRect(x, a.y - 29, w, 58); }
    }
    const g = this.hud; g.clear(); g.fillStyle(0x0b191b, .95).fillRect(0, 0, 960, 87);
    g.fillStyle(0xa88a50).fillRect(0, 86, 960, 1); g.fillStyle(0x293a35).fillRect(26, 49, 240, 12);
    g.fillStyle(0xb7c58b).fillRect(28, 51, 236 * m.hero.hp / m.hero.max, 8);
    g.fillStyle(0x263e3b).fillRect(26, 69, 80, 4); g.fillStyle(0x67b9a7).fillRect(26, 69, 80 * (1 - m.hero.dodgeCooldown / .95), 4);
    g.fillStyle(0x806940).fillRect(350, 62, 250, 3); g.fillStyle(0xe5c681).fillRect(350, 62, 250 * m.hero.x / 2800, 3);
    this.label.setText(`沈烈  /  雲川刀客                 赤 旌 · v0.2                SCORE ${String(m.score).padStart(6, '0')}\n\n${Math.ceil(m.hero.hp)} / ${m.hero.max}     閃身 L               第 ${m.wave || 1} 陣 / 3                    BEST ${this.best}`);
    this.notice.setText(m.time < m.messageUntil ? m.message : '');
    this.combo.setText(m.hits > 1 ? `${m.hits} HITS\n${['', '壹 · 斷流', '貳 · 挑月', '叁 · 破陣'][m.hero.step]}` : '');
    const boss = m.enemies.find(e => e.kind === 'boss');
    this.bossLabel.setText(boss ? `鐵獄 · ${boss.hp <= boss.max / 2 ? '怒勢' : '守關將軍'}　${Math.ceil(boss.hp)} / ${boss.max}` : '');
    if (boss) { g.fillStyle(0x142322, .95).fillRect(280, 498, 400, 25); g.fillStyle(0xb65440).fillRect(288, 505, 384 * boss.hp / boss.max, 10); }
    const state = m.paused ? 'paused' : m.status;
    if (state !== this.overlayState) {
      this.overlayState = state; this.overlay?.destroy(true); this.overlay = undefined;
      if (state !== 'playing') this.showOverlay(state);
    }
    const pause = document.querySelector<HTMLButtonElement>('#pause');
    if (pause) { pause.textContent = m.paused ? '繼續 ▶' : '暫停 Ⅱ'; pause.disabled = m.status !== 'playing'; }
    const status = document.querySelector('#game-status');
    if (status) status.textContent = state === 'ready' ? '等待出陣' : state === 'paused' ? '已暫停' : state === 'won' ? `關隘已破 · ${m.score} 分` : state === 'lost' ? '挑戰結束' : `第 ${m.wave} 陣 · ${m.enemies.length} 名敵人`;
  }
  showOverlay(state: string) {
    const m = this.model;
    const title = state === 'ready' ? '赤 旌' : state === 'paused' ? '暫 停' : state === 'won' ? '關 隘 已 破' : '勝 敗 乃 常';
    const sub = state === 'ready' ? '暮色關隘 · 刀光再起 v0.2' : state === 'paused' ? '戰場等你歸來' : `得分 ${m.score}　／　最高連擊 ${m.bestCombo} HITS`;
    const action = state === 'ready' ? '按 ENTER 或點擊出陣' : state === 'paused' ? '按 P、點擊畫面或「繼續」' : '按 R、點擊畫面或「重試」';
    const bg = this.add.rectangle(480, 282, 960, 410, 0x0b1416, .79);
    const text = (y: number, value: string, size: number, color: string) => this.add.text(480, y, value, { fontFamily: 'serif', fontSize: `${size}px`, color }).setOrigin(.5);
    this.overlay = this.add.container(0, 0, [bg, text(207, title, 64, '#e8c27e'), text(286, sub, 18, '#ddd2b6'), text(350, action, 18, '#e9bd64'), text(394, 'J 連斬　K 跳躍　L 閃身　／　離開橙色範圍躲避敵招', 14, '#9eaf9b')]).setScrollFactor(0).setDepth(10000);
  }
}
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, pixelArt: true, roundPixels: true,
  backgroundColor: '#24393d', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: Battle, banner: false });
document.querySelector('#sound')!.addEventListener('click', e => { muted = !muted; (e.target as HTMLElement).textContent = `音效：${muted ? '關' : '開'}`; });
document.querySelector('#fullscreen')!.addEventListener('click', () => { if (game.scale.isFullscreen) game.scale.stopFullscreen(); else game.scale.startFullscreen(); });
document.querySelector('#pause')!.addEventListener('click', () => pressed.add('pause'));
document.querySelector('#restart')!.addEventListener('click', () => pressed.add('restart'));
document.querySelectorAll<HTMLElement>('[data-key]').forEach(el => {
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); held.add(el.dataset.key!); pressed.add(el.dataset.key!); });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(event, () => held.delete(el.dataset.key!));
});
function suspend() {
  held.clear(); pressed.clear();
  const scene = game.scene.getScene('Battle') as Battle;
  if (scene?.model.status === 'playing') { scene.model.paused = true; scene.input.keyboard?.resetKeys(); }
}
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
