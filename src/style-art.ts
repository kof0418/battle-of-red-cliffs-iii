import {drawDuelBare} from './duel-art';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Original fists, sword and short blade drawn in the existing pixel palette. */
export function drawStyleWeapon(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,phase:number){
 if(f.mounted||f.equipped)return false;
 if(f.heroId==='guanyu'||f.heroId==='zhangfei'){
  const active=!!f.attack,heavy=f.step===3;
  const x=active?Math.min(45,hx):18,y=active?hy:-48;
  g.lineStyle(9,f.heroId==='guanyu'?0x427a51:0xbb7b4b).lineBetween(12,-55,x-8,y+8).lineBetween(x-8,y+8,x,y);
  g.lineStyle(8,0x344b3d).lineBetween(-14,-53,-6,-43).lineBetween(-6,-43,5,-50);
  g.fillStyle(0xd5a070).fillRect(x-2,y-5,heavy?15:11,10).fillRect(2,-54,10,9);
  g.fillStyle(0xf0c998).fillRect(x,y-4,8,2);
  if(active&&phase>=2&&phase<=3)g.lineStyle(heavy?4:2,0xffd393,.8).lineBetween(x+12,y-3,x+(heavy?37:26),y-3);
  return true;
 }
 if(f.heroId==='zhaoyun'){
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(f.attack?-.5+(phase-2)*.45:-1.1);
  g.fillStyle(0x55432b).fillRect(-10,-3,16,6);g.fillStyle(0xc5a35e).fillRect(4,-9,4,18);
  g.fillStyle(0xa5c5c9).fillTriangle(8,-5,8,5,54,0);g.lineStyle(2,0xf2f4df).lineBetween(9,-4,54,0);
  g.fillStyle(0xd5ad88).fillRect(-8,-4,10,8);g.restore();return true;
 }
 if(drawDuelBare(g,f,hx,hy,phase))return true;
 if(f.heroId==='huangzhong'&&f.attack?.move==='aerial'){
  const length=31;
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(f.vz<0?.4:-1.05);
  g.fillStyle(0x55402c).fillRect(-9,-3,15,6);g.fillStyle(0xd4b970).fillRect(5,-8,4,16);
  g.fillStyle(0x8faeaf).fillTriangle(9,-4,9,4,length,0);g.lineStyle(2,0xf4edd6).lineBetween(10,-3,length,0);
  g.fillStyle(0xd2a47c).fillRect(-5,-4,9,7);g.restore();return true;
 }
 return false;
}
