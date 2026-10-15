import Phaser from 'phaser';
import type { Level } from './levels';
/** Original, deterministic pixel scenery. Own every object so stage swaps cleanly. */
export function drawBackground(scene: Phaser.Scene, level: Level) {
  const layer = scene.add.container(0, 0).setDepth(-100);
  const g = scene.add.graphics(); layer.add(g);
  const river = level.theme === 'river';
  const text = (x: number, y: number, value: string, size: number, color: string) => {
    layer.add(scene.add.text(x, y, value, { fontFamily: 'serif', fontSize: `${size}px`, color }));
  };
  g.fillStyle(river ? 0x142337 : 0x273d42).fillRect(0, 0, 2800, 540);
  if (river) {
    for (let i = 0; i < 130; i++) g.fillStyle(i % 3 ? 0x9cbaa9 : 0xf1dfad, .65).fillRect((i * 139) % 2800, 90 + i * 23 % 108, 2, 2);
  }
  g.fillStyle(river ? 0xc6d9c9 : 0xc5a674).fillCircle(700, 118, river ? 32 : 45);
  if (river) g.fillStyle(0xabc7be, .06).fillCircle(700, 118, 56);
  else g.fillStyle(0x977b59).fillRect(0, 168, 2800, 88);
  for (let i = 0; i < 22; i++) {
    const x = i * 145;
    g.fillStyle(river ? (i % 2 ? 0x263b4c : 0x1c3044) : (i % 2 ? 0x40585a : 0x354c51));
    g.fillTriangle(x - 90, 250, x + 85, 90 + (i % 4) * 26, x + 240, 250);
  }
  if (river) {
    g.fillStyle(0x2c4e59).fillRect(0, 230, 2800, 310);
    for (let i = 0; i < 250; i++) g.fillStyle(i % 4 ? 0x456974 : 0x78918b, .7).fillRect((i * 163) % 2800, 243 + i * 17 % 83, 17 + i % 39, 2);
    // Small boats and reed banks behind the playable wooden causeway.
    for (let x = 170; x < 2800; x += 520) {
      g.fillStyle(0x172d36).fillTriangle(x, 285, x + 90, 285, x + 70, 301);
      g.fillRect(x + 45, 224, 3, 64); g.fillStyle(0x72837a).fillTriangle(x + 48, 228, x + 48, 278, x + 82, 278);
      for (let j = 0; j < 10; j++) { g.lineStyle(2, 0x526853).lineBetween(x + j * 9, 327, x + j * 9 - 8, 299 - j % 4 * 9); }
    }
    g.fillStyle(0x474b42).fillRect(0, 333, 2800, 190);
    for (let x = 0; x < 2800; x += 40) {
      g.fillStyle(x % 80 ? 0x5b5b48 : 0x626451).fillRect(x, 338, 38, 176);
      g.fillStyle(0x3c493f).fillRect(x + 9, 352, 2, 144).fillRect(x + 26, 367, 2, 132);
      g.fillStyle(0xa0a17a).fillRect(x + 4, 343, 3, 3).fillRect(x + 30, 504, 3, 3);
    }
    g.fillStyle(0x263a38).fillRect(0, 518, 2800, 22);
    g.fillStyle(0x8a8b65).fillRect(0, 331, 2800, 5).fillRect(0, 514, 2800, 4);
    for (let x = 70; x < 2800; x += 310) {
      g.fillStyle(0x283e3e).fillRect(x, 245, 10, 89);
      g.fillStyle(0x9c704a).fillRect(x - 6, 260, 23, 28); g.fillStyle(0xf1c16b).fillRect(x - 3, 264, 17, 20);
      g.fillStyle(0xf7cc79, .06).fillCircle(x + 5, 276, 47);
      g.fillStyle(0x354b58).fillRect(x + 12, 246, 50, 64); text(x + 24, 254, '江', 26, '#bbc3a2');
    }
    for (const x of [980, 1900, 2600]) {
      g.fillStyle(0x1f343d).fillRect(x - 40, 220, 13, 112).fillRect(x + 67, 220, 13, 112).fillRect(x - 55, 210, 150, 17);
      g.fillTriangle(x - 70, 210, x + 20, 169, x + 110, 210); g.fillStyle(0x526d70).fillRect(x - 60, 205, 162, 5);
    }
  } else {
    g.fillStyle(0x263b3b).fillRect(0, 219, 2800, 100);
    for (let x = 0; x < 2800; x += 74) {
      g.fillStyle(0x304748).fillRect(x, 205, 48, 30); g.fillStyle(0x53605a).fillRect(x, 244, 69, 3);
      g.fillStyle(0x182c30).fillRect(x + 17, 264, 22, 44);
    }
    g.fillStyle(0x645b45).fillRect(0, 320, 2800, 220); g.fillStyle(0x9b8860).fillRect(0, 326, 2800, 6);
    for (let i = 0; i < 400; i++) g.fillStyle(i % 3 ? 0x71654b : 0x4a4b3e).fillRect((i * 173) % 2800, 342 + (i * 37) % 195, 12 + i % 23, 2);
    for (let x = 90; x < 2800; x += 390) {
      g.fillStyle(0x202f2d).fillRect(x, 151, 9, 182); g.fillStyle(0x813c31).fillRect(x + 9, 158, 62, 88);
      g.fillStyle(0xb5864b).fillRect(x + 12, 160, 4, 83); text(x + 28, 176, '旌', 29, '#d5ac64');
    }
    for (const x of [930, 1850, 2630]) {
      g.fillStyle(0x263330).fillRect(x, 159, 100, 170); g.fillStyle(0x475348).fillRect(x - 12, 157, 124, 16);
      g.fillStyle(0x263330).fillTriangle(x - 29, 156, x + 50, 117, x + 128, 156).fillRect(x + 30, 261, 40, 67);
    }
  }
  text(44, 294, level.title, 18, river ? '#b1c9b5' : '#c8b98c');
  return layer;
}
