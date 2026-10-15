import Phaser from 'phaser';
import type { Fighter } from './combat';
/** Reused graphics object with quantized 12 fps poses; no per-frame object allocation. */
export class Actor {
  body: Phaser.GameObjects.Container;
  ink: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Ellipse;
  private pose = '';
  constructor(scene: Phaser.Scene, readonly id: number) {
    this.ink = scene.add.graphics(); this.body = scene.add.container(0, 0, [this.ink]);
    this.shadow = scene.add.ellipse(0, 0, 43, 12, 0x101c1a, .4);
  }
  draw(f: Fighter, time: number) {
    const frame = Math.floor(time * 12), boss = f.kind === 'boss', s = boss ? 1.5 : 1.12;
    const step = f.attack ? Math.min(3, Math.floor(f.attack.elapsed / f.attack.duration * 4)) : 0;
    const bob = f.moving && !f.attack && f.z === 0 ? frame % 2 * 2 : 0;
    this.body.setPosition(Math.round(f.x), Math.round(f.y - f.z - bob)).setDepth(f.y).setScale(s * f.face, s);
    this.body.setAngle(f.dodge > 0 ? f.face * 30 : f.stun > 0 ? -f.face * 13 : 0);
    this.body.setAlpha(f.inv > 0 && frame % 2 === 0 ? .6 : 1);
    this.shadow.setPosition(f.x, f.y + 3).setDepth(f.y - 1).setScale(s * (1 - f.z / 250));
    const key = `${frame % 4}/${f.moving}/${step}/${f.step}/${f.stun > 0}/${f.z > 0}/${Math.ceil(f.hp)}/${f.attack?.move}/${f.dodge > 0}`;
    if (key === this.pose) return; this.pose = key;
    const g = this.ink; g.clear();
    const color = f.kind === 'hero' ? 0x60b6a5 : f.kind === 'soldier' ? 0xa45f4c : f.kind === 'raider' ? 0xc4a15e : f.kind === 'heavy' ? 0x8499a1 : 0xad4e43;
    const walk = f.moving && !f.attack ? [-5, 0, 5, 0][frame % 4] : 0;
    const stride = f.z > 0 ? 6 : walk;
    // Cape, boots, segmented armour, face and original helmet silhouette.
    g.fillStyle(0x432e2c).fillTriangle(-9, -48, -31 - frame % 3 * 2, -16, 0, -19);
    g.fillStyle(0x233431).fillRect(-12 - stride / 2, -20, 11, 17 + stride).fillRect(3 + stride / 2, -20, 10, 17 - stride);
    g.fillStyle(0x182524).fillRect(-15 - stride / 2, -5 + stride, 14, 6).fillRect(3 + stride / 2, -5 - stride, 15, 6);
    g.fillStyle(color).fillRect(-15, -47, 30, 29).fillTriangle(-14, -29, -20, -13, 19, -13);
    g.fillStyle(0xd2b97f).fillRect(-17, -48, 35, 6).fillRect(-14, -25, 30, 5);
    g.fillStyle(0x264445).fillRect(-8, -40, 4, 12).fillRect(2, -40, 4, 12);
    for (let row = 0; row < 3; row++) g.fillStyle(0xe0cb95, .35).fillRect(-11, -39 + row * 5, 23, 1);
    g.fillStyle(0xe2b588).fillRect(-7, -64, 18, 16);
    g.fillStyle(0x242e2c).fillRect(-10, -69, 23, 9).fillRect(-9, -59, 5, 15).fillRect(5, -56, 3, 3);
    g.fillStyle(color).fillRect(-12, -65, 27, 5);
    g.fillStyle(0xe0bc70).fillRect(-2, -74, 6, 12);
    g.fillStyle(0x9e493d).fillTriangle(1, -75, -14 - frame % 3, -87, -6, -74);
    if (boss) { g.fillStyle(0xe0bd74).fillTriangle(-12, -65, -22, -79, -7, -68).fillTriangle(11, -65, 19, -81, 5, -68); }
    // Each slash has a distinct silhouette: forward cut, rising cut, sweeping finisher.
    const attacking = !!f.attack;
    const y = attacking ? (f.step === 2 ? [-26, -31, -59, -48][step] : [-53, -38, -28, -42][step]) : -40;
    const handX = attacking ? [8, 23, 34, 17][step] : 17;
    g.fillStyle(color).fillRect(9, -44, handX - 1, 10);
    g.fillStyle(0xe2b588).fillRect(handX, y, 8, 8);
    g.lineStyle(4, 0x765b3f).lineBetween(handX + 4, y - 20, handX + 4, y + 35);
    g.fillStyle(0xd0ddd1).fillTriangle(handX + 6, y - 20, handX + 27, y - 35, handX + 7, y - 1);
    if (f.kind === 'heavy') { g.fillStyle(0x344e55).fillRect(-25, -43, 16, 31); g.lineStyle(2, 0xc8b680).strokeRect(-25, -43, 16, 31); }
    if (attacking && f.kind === 'hero' && step > 0 && step < 3) {
      const radius = f.step === 3 ? 66 : 49, start = f.step === 2 ? -.2 : -1.4;
      g.lineStyle(f.step === 3 ? 8 : 4, 0xffdfa0, .9).beginPath().arc(18, -32, radius, start, start + 2).strokePath();
      g.lineStyle(2, 0xffffdd, .9).beginPath().arc(18, -32, radius + 7, start + .2, start + 1.8).strokePath();
    }
    if (f.attack && !f.attack.hit && f.kind !== 'hero') g.fillStyle(0xffc163).fillTriangle(-4, -89, 4, -89, 0, -79);
    if (f.kind !== 'hero') { g.fillStyle(0x17251f).fillRect(-20, -96, 40, 4); g.fillStyle(boss ? 0xd97856 : 0xd5ab70).fillRect(-20, -96, 40 * f.hp / f.max, 4); }
  }
  destroy() { this.body.destroy(true); this.shadow.destroy(); }
}
