import type Phaser from 'phaser';
import type {Fighter} from './combat';
import {classicUnarmed} from './techniques';
/** Original fists, sword and short blade drawn in the existing pixel palette. */
export function drawStyleWeapon(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,phase:number){
 if(f.mounted||f.equipped)return false;
 if(classicUnarmed(f)){
  const active=!!f.attack&&(phase===2||phase===3),skin=f.heroId==='guanyu'?0xc28a59:0xb67a50;
  const x=active?hx:20,y=active?hy:-49;
  g.lineStyle(10,0x263b32).lineBetween(12,-54,x,y);g.lineStyle(7,f.heroId==='guanyu'?0x427a51:0xbb7b4b).lineBetween(12,-54,x,y);
  g.fillStyle(0x67432e).fillRect(x-1,y-5,13,11);g.fillStyle(skin).fillRect(x,y-4,11,8);g.fillStyle(0xe5bd8b).fillRect(x+1,y-4,9,2);
  g.lineStyle(7,0x445645).lineBetween(-12,-53,6,-47);g.fillStyle(skin).fillRect(5,-51,10,8);
  if(active){g.lineStyle(3,0xf6dda0,.6).lineBetween(x+12,y-4,x+22,y-7);g.lineBetween(x+13,y+3,x+24,y+4);}
  return true;
 }
 if(f.stance==='classic'&&f.heroId==='zhaoyun'||f.heroId==='huangzhong'&&f.attack?.move==='aerial'){
  const short=f.heroId==='huangzhong',length=short?31:52;
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(f.attack?(phase<2?-1.05:.22):-.75);
  g.fillStyle(0x55402c).fillRect(-9,-3,15,6);g.fillStyle(0xd4b970).fillRect(5,-8,4,16);
  g.fillStyle(0x8faeaf).fillTriangle(9,-4,9,4,length,0);g.lineStyle(2,0xf4edd6).lineBetween(10,-3,length,0);
  g.fillStyle(0xd2a47c).fillRect(-5,-4,9,7);g.restore();return true;
 }
 return false;
}
