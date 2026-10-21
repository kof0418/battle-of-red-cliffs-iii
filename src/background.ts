import {drawNewBackground} from './new-backgrounds';
import Phaser from 'phaser';
import {WORLD_WIDTH,arenaStart,type Level} from './levels';
/** Original, deterministic pixel scenery. Own every object so stage swaps cleanly. */
export function drawBackground(scene: Phaser.Scene, level: Level) {
  if(!['sunset','river'].includes(level.theme))return drawNewBackground(scene,level);
  const layer = scene.add.container(0, 0).setDepth(-100);
  const g = scene.add.graphics(); layer.add(g);
  const river = level.theme === 'river';
  const text = (x: number, y: number, value: string, size: number, color: string) => {
    layer.add(scene.add.text(x, y, value, { fontFamily: 'serif', fontSize: `${size}px`, color }));
  };
  g.fillStyle(river ? 0x142337 : 0x273d42).fillRect(0, 0, WORLD_WIDTH, 540);
  if (river) {
    for (let i = 0; i < 130; i++) g.fillStyle(i % 3 ? 0x9cbaa9 : 0xf1dfad, .65).fillRect((i * 139) % WORLD_WIDTH, 90 + i * 23 % 108, 2, 2);
  }
  g.fillStyle(river ? 0xc6d9c9 : 0xc5a674).fillCircle(700, 118, river ? 32 : 45);
  if (river) g.fillStyle(0xabc7be, .06).fillCircle(700, 118, 56);
  else g.fillStyle(0x977b59).fillRect(0, 168, WORLD_WIDTH, 88);
  for (let i = 0; i < 42; i++) {
    const x = i * 145;
    g.fillStyle(river ? (i % 2 ? 0x263b4c : 0x1c3044) : (i % 2 ? 0x40585a : 0x354c51));
    g.fillTriangle(x - 90, 250, x + 85, 90 + (i % 4) * 26, x + 240, 250);
  }
  if (river) {
    g.fillStyle(0x2c4e59).fillRect(0, 230, WORLD_WIDTH, 310);
    for (let i = 0; i < 500; i++) g.fillStyle(i % 4 ? 0x456974 : 0x78918b, .7).fillRect((i * 163) % WORLD_WIDTH, 243 + i * 17 % 83, 17 + i % 39, 2);
    // Small boats and reed banks behind the playable wooden causeway.
    for (let x = 170; x < WORLD_WIDTH; x += 520) {
      g.fillStyle(0x172d36).fillTriangle(x, 285, x + 90, 285, x + 70, 301);
      g.fillRect(x + 45, 224, 3, 64); g.fillStyle(0x72837a).fillTriangle(x + 48, 228, x + 48, 278, x + 82, 278);
      for (let j = 0; j < 10; j++) { g.lineStyle(2, 0x526853).lineBetween(x + j * 9, 327, x + j * 9 - 8, 299 - j % 4 * 9); }
    }
    g.fillStyle(0x474b42).fillRect(0, 333, WORLD_WIDTH, 190);
    for (let x = 0; x < WORLD_WIDTH; x += 40) {
      g.fillStyle(x % 80 ? 0x5b5b48 : 0x626451).fillRect(x, 338, 38, 176);
      g.fillStyle(0x3c493f).fillRect(x + 9, 352, 2, 144).fillRect(x + 26, 367, 2, 132);
      g.fillStyle(0xa0a17a).fillRect(x + 4, 343, 3, 3).fillRect(x + 30, 504, 3, 3);
    }
    g.fillStyle(0x263a38).fillRect(0, 518, WORLD_WIDTH, 22);
    g.fillStyle(0x8a8b65).fillRect(0, 331, WORLD_WIDTH, 5).fillRect(0, 514, WORLD_WIDTH, 4);
    for (let x = 70; x < WORLD_WIDTH; x += 310) {
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
    g.fillStyle(0x263b3b).fillRect(0, 219, WORLD_WIDTH, 100);
    for (let x = 0; x < WORLD_WIDTH; x += 74) {
      g.fillStyle(0x304748).fillRect(x, 205, 48, 30); g.fillStyle(0x53605a).fillRect(x, 244, 69, 3);
      g.fillStyle(0x182c30).fillRect(x + 17, 264, 22, 44);
    }
    g.fillStyle(0x645b45).fillRect(0, 320, WORLD_WIDTH, 220); g.fillStyle(0x9b8860).fillRect(0, 326, WORLD_WIDTH, 6);
    for (let i = 0; i < 850; i++) g.fillStyle(i % 3 ? 0x71654b : 0x4a4b3e).fillRect((i * 173) % WORLD_WIDTH, 342 + (i * 37) % 195, 12 + i % 23, 2);
    for (let x = 90; x < WORLD_WIDTH; x += 390) {
      g.fillStyle(0x202f2d).fillRect(x, 151, 9, 182); g.fillStyle(0x813c31).fillRect(x + 9, 158, 62, 88);
      g.fillStyle(0xb5864b).fillRect(x + 12, 160, 4, 83); text(x + 28, 176, '旌', 29, '#d5ac64');
    }
    for (const x of [930, 1850, 2630]) {
      g.fillStyle(0x263330).fillRect(x, 159, 100, 170); g.fillStyle(0x475348).fillRect(x - 12, 157, 124, 16);
      g.fillStyle(0x263330).fillTriangle(x - 29, 156, x + 50, 117, x + 128, 156).fillRect(x + 30, 261, 40, 67);
    }
  }

  // Small stone joints, worn dock planks and shoreline details stay out of the combat lane.
  for(let x=0;x<WORLD_WIDTH;x+=36){
    if(!river){for(let row=0;row<4;row++){g.lineStyle(1,0x6e7970,.35).strokeRect(x+(row%2)*18,224+row*23,35,22);}}
    else{g.lineStyle(1,0x273c3e,.65).lineBetween(x,345,x+26,352).lineBetween(x+7,484,x+29,488);}
  }
  for(let section=0;section<6;section++){
    const x=arenaStart(section+1)+110;
    text(x,301,`${section+1} · ${level.sections[section]}`,16,river?'#bed8c8':'#e3c591');
    if(river){
      // Moored cargo ships grow into the command flagship at the final arena.
      const ship=x+310,large=section===5,w=large?320:170;
      g.fillStyle(0x152c35).fillTriangle(ship,291,ship+w,291,ship+w-35,328);
      g.fillStyle(0x6a5744).fillRect(ship+18,279,w-40,14);
      g.lineStyle(2,0x9b8760).lineBetween(ship+18,280,ship+w-22,280);
      for(let n=0;n<2;n++){const mast=ship+45+n*(w-85);g.fillStyle(0x856c4a).fillRect(mast,171,4,112);g.fillStyle(large?0x955b46:0x7d8b7c).fillTriangle(mast+5,178,mast+5,264,mast+58,258);for(let y=190;y<260;y+=16)g.lineStyle(1,0xc4bc91,.5).lineBetween(mast+6,y,mast+40,y+6);}
      for(let n=0;n<14;n++)g.fillStyle(0x85acac,.22).fillRect(ship+n*15,330+n%3*3,11,1);
      for(let n=0;n<8;n++){const rx=x+n*13;g.lineStyle(2,0x6a8060).lineBetween(rx,331,rx-8,295-n%3*8);g.fillStyle(0xb8b18a).fillRect(rx-10,291-n%3*8,4,10);}
      g.lineStyle(2,0xb1a078).lineBetween(x+60,276,x+190,304);g.fillStyle(0x3c4d47).fillRect(x+60,270,7,62).fillRect(x+190,295,7,37);
      for(let n=0;n<4;n++)g.lineStyle(1,0x7a9385).strokeRect(x+220+n*7,297+n*4,52,22);
    }else{
      // Camp tents, supply carts and distinct fortified gate structures.
      if(section===1||section===4){
        g.fillStyle(0x443d30).fillTriangle(x+180,312,x+290,222,x+400,312);
        g.fillStyle(section===1?0x867852:0x7b4e3b).fillTriangle(x+190,307,x+290,229,x+390,307);
        g.fillStyle(0x242d29).fillTriangle(x+265,308,x+290,258,x+315,308);
        g.lineStyle(2,0xc4a877).lineBetween(x+290,229,x+165,323).lineBetween(x+290,229,x+415,323);
      }else{
        const tower=x+300;g.fillStyle(0x424b43).fillRect(tower,184,112,146);
        g.fillStyle(0x202e2b).fillTriangle(tower-22,188,tower+56,143,tower+135,188);
        for(let row=0;row<4;row++)for(let col=0;col<4;col++)g.lineStyle(1,0x8b8a6d,.45).strokeRect(tower+col*28,row*26+204,27,25);
        g.fillStyle(0x142725).fillRect(tower+36,259,41,71);
        g.lineStyle(2,0xb3a077).lineBetween(tower-15,190,tower+130,190);
      }
      const cart=x+550;g.fillStyle(0x3c3026).fillCircle(cart+12,318,13).fillCircle(cart+76,318,13);g.lineStyle(2,0xb3945e).strokeCircle(cart+12,318,11).strokeCircle(cart+76,318,11);
      g.fillStyle(0x82613d).fillRect(cart,286,90,28);for(let i=0;i<5;i++)g.lineStyle(1,0xbf995f).lineBetween(cart+i*18,286,cart+i*18,312);
      for(let i=0;i<3;i++){g.fillStyle(0x9d8a5e).fillEllipse(cart+17+i*25,280,29,23);g.lineStyle(2,0x5a5138).lineBetween(cart+15+i*25,271,cart+20+i*25,290);}
    }
    // Braziers, stacked barrels, rope coils and stones distinguish each stretch.
    const prop=x+95;g.fillStyle(0x65503b).fillRect(prop,300,24,30);g.lineStyle(3,0xb09265).lineBetween(prop,306,prop+24,306).lineBetween(prop,323,prop+24,323);
    g.fillStyle(0x342f28).fillRect(x+470,308,22,6).fillRect(x+476,314,5,18);g.fillStyle(0xe0a051).fillTriangle(x+470,308,x+479,280,x+490,308);g.fillStyle(0xffdc88).fillTriangle(x+476,306,x+482,293,x+486,306);
    g.fillStyle(0xffb866,.06).fillCircle(x+480,301,30);
    for(let i=0;i<20;i++){const px=x+i*35;g.fillStyle(river?0x899681:0x968168,.3).fillRect(px,527+i%3*3,8+i%5,2);}
  }
  text(44, 294, level.title, 18, river ? '#b1c9b5' : '#c8b98c');
  text(44, 317, river ? '火船警戒：避開火線，或跳躍／閃身' : '城樓箭雨：留意框線，移出警戒區', 12, '#e4d7ac');
  return layer;
}
