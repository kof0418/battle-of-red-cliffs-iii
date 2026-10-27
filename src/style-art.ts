import {drawDuelBare} from './duel-art';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Original fists, sword and short blade drawn in the existing pixel palette. */
export function drawStyleWeapon(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,phase:number){
 if(f.mounted||f.equipped)return false;
 if(drawDuelBare(g,f,hx,hy,phase))return true;
 if(f.heroId==='huangzhong'&&f.attack?.move==='aerial'){
  const length=31;
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(f.attack?(phase<2?-1.05:.22):-.75);
  g.fillStyle(0x55402c).fillRect(-9,-3,15,6);g.fillStyle(0xd4b970).fillRect(5,-8,4,16);
  g.fillStyle(0x8faeaf).fillTriangle(9,-4,9,4,length,0);g.lineStyle(2,0xf4edd6).lineBetween(10,-3,length,0);
  g.fillStyle(0xd2a47c).fillRect(-5,-4,9,7);g.restore();return true;
 }
 return false;
}
