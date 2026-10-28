import {drawMountedWeapon} from './horse-art';
import type Phaser from 'phaser';
import type {WeaponId,LootId} from './loot';
import type {Fighter} from './combat';
/** Original pixel icons, shared between floor loot and the warrior's hand. */
export function drawWeapon(g:Phaser.GameObjects.Graphics,id:WeaponId,x:number,y:number,scale=1,angle=0){
 g.save();g.translateCanvas(x,y);g.rotateCanvas(angle);g.scaleCanvas(scale,scale);
 g.lineStyle(5,0x392b26).lineBetween(-10,0,24,0);g.lineStyle(3,0x977044).lineBetween(-10,0,24,0);
 if(id==='chain'){
  g.lineStyle(3,0xc8c5ac).lineBetween(17,0,43,-10).lineBetween(43,-10,67,-6);for(let k=0;k<5;k++)g.lineStyle(1,0xe5ddba).strokeCircle(23+k*9,-3-k,4);g.fillStyle(0x607879).fillCircle(74,-6,13);g.lineStyle(2,0xf0d18c).strokeCircle(74,-6,13);
 }else if(id==='crescent'){
  g.lineStyle(7,0x94b5b5).beginPath().arc(15,0,24,-2.5,1.2).strokePath();g.lineStyle(2,0xf3e4b2).beginPath().arc(15,0,28,-2.5,1.2).strokePath();g.lineStyle(5,0x886642).lineBetween(8,-12,20,12);
 }else if(id==='knife'||id==='sword'){
  const tip=id==='knife'?31:62;
  g.fillStyle(0x647f85).fillTriangle(10,-5,tip,0,10,5);g.fillStyle(0xe4eee2).fillTriangle(10,-4,tip,0,10,0);
  g.fillStyle(0xd6b46d).fillRect(5,-8,4,16);
 }else if(id==='hammer'){
  g.fillStyle(0x293940).fillRect(17,-17,23,34);g.fillStyle(0x9caca9).fillRect(19,-15,19,7);g.lineStyle(2,0xd2b574).strokeRect(17,-17,23,34);
 }else{
  g.fillStyle(0x6d8c91).fillTriangle(20,-23,43,-17,23,8);g.fillStyle(0xd4e4df).fillTriangle(43,-17,41,14,23,8);g.lineStyle(2,0xf2e7c0).lineBetween(43,-17,41,14);
 }
 g.restore();
}
export function heldWeapon(g:Phaser.GameObjects.Graphics,f:Fighter,x:number,y:number,phase:number){
 if(f.mounted){drawMountedWeapon(g,f,x,y,phase);return true;}
 const id=f.attack?.weapon??f.equipped?.id;if(!id||f.attack?.move==='special')return false;
 if(id==='crescent'&&f.bladeAway){g.fillStyle(0xe2b486).fillRect(x-3,y-3,7,7);return true;}
 if(id==='chain'&&f.attack){const a=f.attack,returning=a.elapsed>=.40,endX=returning?-90:155,endY=returning?-17:-40;g.lineStyle(3,0xbfc9be).lineBetween(x,y,x+endX,endY);g.fillStyle(0x5f7f80).fillCircle(x+endX,endY,14);g.lineStyle(2,0xf0d18c).strokeCircle(x+endX,endY,14);g.fillStyle(0xe2b486).fillRect(x-3,y-3,7,7);return true;}
 const angle=f.attack?[-1.15,-.8,.1,.7,-.3][phase]:-.6;
 drawWeapon(g,id,x,y,1,angle);
 g.fillStyle(0xe2b486).fillRect(x-3,y-3,7,7);
 if(f.attack&&phase===2&&id!=='knife')g.lineStyle(3,0xe9e5bb,.75).beginPath().arc(x,y,id==='sword'?64:43,-1.4,.6).strokePath();
 return true;
}
export function drawLoot(g:Phaser.GameObjects.Graphics,id:LootId,x:number,y:number){
 g.fillStyle(0xf4d181,.16).fillEllipse(x,y+11,42,14);
 if(id==='book'){
  g.fillStyle(0x263e49).fillRect(x-16,y-12,32,24);g.fillStyle(0xe4d3a2).fillRect(x-12,y-9,25,19);g.fillStyle(0x496b79).fillRect(x-15,y-12,5,24);
  g.lineStyle(2,0x9f7950);for(let i=0;i<3;i++)g.lineBetween(x-5,y-5+i*5,x+9,y-5+i*5);
 }else if(id==='gong'){
  g.lineStyle(2,0xc4a15d).strokeEllipse(x,y-9,18,13);g.fillStyle(0x91612a).fillCircle(x,y+2,16);g.fillStyle(0xe3bc64).fillCircle(x,y,14);g.lineStyle(2,0x9a672a).strokeCircle(x,y,10);g.fillStyle(0xf5d583).fillCircle(x,y,5);
 }else if(id==='meat'){
  g.lineStyle(7,0xe7dbc0).lineBetween(x+1,y+2,x+18,y+10);g.fillStyle(0xf4ead4).fillCircle(x+19,y+8,5).fillCircle(x+16,y+13,5);
  g.fillStyle(0x703529).fillEllipse(x-5,y-1,31,24);g.fillStyle(0xb56536).fillEllipse(x-7,y-4,25,18);g.fillStyle(0xe2a35b).fillRect(x-15,y-9,11,4);
  g.lineStyle(2,0x6e3928).lineBetween(x-8,y-10,x-3,y+3).lineBetween(x-1,y-8,x+4,y+3);
 }else if(id==='bun'){
  g.fillStyle(0x947656).fillEllipse(x,y+6,31,14);g.fillStyle(0xf2dfab).fillEllipse(x,y,32,24);g.fillStyle(0xfff0cc).fillEllipse(x-4,y-4,22,14);
  for(const dx of [-8,0,8])g.lineStyle(2,0xb89d6b).lineBetween(x+dx,y-4,x,y-9);
 }else drawWeapon(g,id,x,y,.62,-.25);
}
