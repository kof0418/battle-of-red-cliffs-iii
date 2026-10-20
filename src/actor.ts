import {specialMotion} from './special-motion';
import {drawWarrior} from './warriors';
import {drawGuanyu} from './guanyu';
import { HEROES } from './heroes';
import Phaser from 'phaser';
import {attackPhase,heroMotion} from './motion';
import { isBoss, type Fighter } from './combat';
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
    const champion = f.kind === 'hero' ? HEROES[f.heroId ?? 'guanyu'] : undefined;
    const frame = Math.floor(time * 12), boss = isBoss(f.kind), s = boss ? 1.5 : f.heroId === 'zhangfei' ? 1.24 : 1.12;
    const step = f.attack ? Math.min(3, Math.floor(f.attack.elapsed / f.attack.duration * 4)) : 0;
    const phase=f.attack?attackPhase(f.attack.elapsed,f.attack.impact,f.attack.duration):4;
    const motion=champion&&f.attack?heroMotion(f.heroId!,f.step,phase):null;
    const special=f.attack?.move==='special'?specialMotion(f.heroId!,f.attack.elapsed/f.attack.duration):null;
    const bob = f.moving && !f.attack && f.z === 0 ? frame % 2 * 2 : 0;
    this.body.setPosition(Math.round(f.x), Math.round(f.y - f.z - bob - (special?.lift??0))).setDepth(f.y).setScale(s * f.face, s);
    this.body.setAngle(special ? special.angle*f.face : f.dodge > 0 ? f.face * 30 : f.hp<=0 ? -f.face*78 : f.stun > 0 ? -f.face * 13 : (motion?.lean ?? 0)*f.face);
    this.body.setAlpha(f.inv > 0 && frame % 2 === 0 ? .6 : 1);
    this.shadow.setPosition(f.x, f.y + 3).setDepth(f.y - 1).setScale(s * (1 - f.z / 250));
    const key = `${phase}/${f.heroId}/${frame % 4}/${f.moving}/${step}/${f.step}/${f.stun > 0}/${f.z > 0}/${Math.ceil(f.hp)}/${f.attack?.move}/${f.dodge > 0}`;
    if (key === this.pose) return; this.pose = key;
    const g = this.ink; g.clear();
    if (f.kind === 'hero' && f.heroId === 'guanyu') { drawGuanyu(g,f,frame,phase); return; }
    if (champion) { drawWarrior(g,f,frame,phase);
      if(special&&f.heroId==='weiyan'){
        const extension=Math.sin(Math.min(1,f.attack!.elapsed/.58)*Math.PI)*28;
        g.lineStyle(9,0x504b48).lineBetween(-6,-26,12+extension,-48);g.lineStyle(7,0x151f23).lineBetween(12+extension,-48,24+extension,-54);
        g.lineStyle(2,0xe7c188).lineBetween(13+extension,-51,24+extension,-57);
      }return; }
    const color = f.kind === 'hero' ? champion!.color : f.kind === 'soldier' ? 0xa45f4c : f.kind === 'raider' ? 0xc4a15e : f.kind === 'heavy' ? 0x8499a1 : f.kind === 'marshal' ? 0x618eaa : 0xad4e43;
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
    if (f.kind === 'marshal') { g.fillStyle(0xb7d3cc).fillTriangle(-9, -69, -18, -91, 0, -71).fillTriangle(7, -69, 15, -91, 0, -71); }
    if (f.kind === 'boss') { g.fillStyle(0xe0bd74).fillTriangle(-12, -65, -22, -79, -7, -68).fillTriangle(11, -65, 19, -81, 5, -68); }
    // Each slash has a distinct silhouette: forward cut, rising cut, sweeping finisher.
    const attacking = !!f.attack;
    const y = motion ? motion.y : attacking ? (f.step === 2 ? [-26, -31, -59, -48][step] : [-53, -38, -28, -42][step]) : -40;
    const handX = motion ? motion.x : attacking ? [8, 23, 34, 17][step] : 17;
    g.fillStyle(color).fillRect(9, -44, handX - 1, 10);
    g.fillStyle(0xe2b588).fillRect(handX, y, 8, 8);
    if (f.heroId === 'huangzhong') {
      const bowX = handX + 10;
      g.lineStyle(4, 0xc4a66b).beginPath().arc(bowX - 8, y, 27, -1.2, 1.2).strokePath();
      g.lineStyle(1, 0xf3e3be).lineBetween(bowX + 2, y - 25, bowX - (attacking ? [8,19,0,2,0][phase] : 0), y).lineBetween(bowX - (attacking ? [8,19,0,2,0][phase] : 0), y, bowX + 2, y + 25);
      g.lineStyle(2, 0xf0d8a0).lineBetween(bowX - 20, y, bowX + 26, y);
    } else if (f.heroId === 'zhaoyun' || f.heroId === 'zhangfei') {
      const tip = handX + (attacking ? 63 : 38), sy = y + 3;
      g.lineStyle(4, 0x8c7352).lineBetween(handX - 35, sy + (attacking ? 0 : 34), tip, sy - (attacking ? 0 : 30));
      g.fillStyle(0xdbe4dc).fillTriangle(tip, sy - (attacking ? 5 : 35), tip + 22, sy - (attacking ? 0 : 38), tip, sy - (attacking ? -5 : 25));
      if (f.heroId === 'zhangfei') g.lineStyle(3, 0xc7d4c8).lineBetween(tip, sy-5, tip+7, sy-10).lineBetween(tip+7, sy-10, tip+13, sy-5);
    } else if (f.heroId === 'weiyan') {
      g.fillStyle(0xcbd9d5).fillTriangle(handX + 3, y, handX + 40, y - 23, handX + 16, y + 4);
      g.lineStyle(4, 0xc4a46a).lineBetween(handX - 2, y - 5, handX + 13, y + 9);
    } else {
      g.lineStyle(4, 0x765b3f).lineBetween(handX + 4, y - 20, handX + 4, y + 35);
      g.fillStyle(0xd0ddd1).fillTriangle(handX + 6, y - 20, handX + 27, y - 35, handX + 7, y - 1);
    }
    if (f.kind === 'heavy') { g.fillStyle(0x344e55).fillRect(-25, -43, 16, 31); g.lineStyle(2, 0xc8b680).strokeRect(-25, -43, 16, 31); }
    if (attacking && f.kind === 'hero' && f.heroId !== 'huangzhong' && phase >= 2 && phase <= 3) {
      if(f.heroId==='zhaoyun') {
        g.lineStyle(3,0xc7f0f1,.8).lineBetween(22,-39,94,-39);
        if(f.step===3)for(const dy of [-9,9])g.lineStyle(2,0x96d4df,.6).lineBetween(28,-39+dy,88,-39+dy);
      } else {
      const radius = (f.step === 3 ? 66 : 49)*(f.heroId==='weiyan'?.72:1), start = f.heroId==='zhangfei'?-2.1:f.step === 2 ? -.2 : -1.4;
      g.lineStyle(f.step === 3 ? 8 : 4, 0xffdfa0, .9).beginPath().arc(18, -32, radius, start, start + 2).strokePath();
      g.lineStyle(2, 0xffffdd, .9).beginPath().arc(18, -32, radius + 7, start + .2, start + 1.8).strokePath();
    }
    }
    if (f.attack && !f.attack.hit && f.kind !== 'hero') g.fillStyle(0xffc163).fillTriangle(-4, -89, 4, -89, 0, -79);
    if (f.kind !== 'hero') { g.fillStyle(0x17251f).fillRect(-20, -96, 40, 4); g.fillStyle(boss ? 0xd97856 : 0xd5ab70).fillRect(-20, -96, 40 * f.hp / f.max, 4); }
  }
  fall(scene:Phaser.Scene) {
    this.shadow.destroy();
    scene.tweens.add({targets:this.body,angle:this.body.scaleX<0?85:-85,y:this.body.y+14,alpha:0,duration:320,onComplete:()=>this.body.destroy(true)});
  }
  destroy() { this.body.destroy(true); this.shadow.destroy(); }
}
