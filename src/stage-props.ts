import type Phaser from 'phaser';
import type {StageProp} from './encounters';
/** Original pixel props; all objects sit on the upper/lower edge of the walking lane. */
export function drawStageProp(g:Phaser.GameObjects.Graphics,p:StageProp){
 const x=p.x,y=p.y;g.fillStyle(0x172724,.5).fillEllipse(x,y+3,66,15);
 g.lineStyle(3,0xbca56d,.95).strokeRect(x-30,y-68,60,70);
 if(p.stageKind==='ballista'){
  g.fillStyle(0x67472f).fillRect(x-23,y-18,46,12).fillRect(x-6,y-48,12,34);g.lineStyle(5,0x9e7e4e).lineBetween(x-29,y-39,x,y-52).lineBetween(x,y-52,x+29,y-39);g.lineStyle(2,0xe6d4a8).lineBetween(x-29,y-39,x+29,y-39);g.lineStyle(4,0xc2c9bd).lineBetween(x-22,y-46,x+22,y-46);g.fillStyle(0x283a36).fillCircle(x-19,y-7,8).fillCircle(x+19,y-7,8);
 }else if(p.stageKind==='sluice'){
  g.fillStyle(0x405b5b).fillRect(x-22,y-59,44,59);g.fillStyle(0x69a7ad).fillRect(x-16,y-45,32,34);g.lineStyle(5,0x99774c).strokeRect(x-24,y-61,48,62);g.lineStyle(3,0xc5ae77).strokeCircle(x,y-45,12).lineBetween(x-12,y-45,x+12,y-45).lineBetween(x,y-57,x,y-33);
 }else if(p.stageKind==='bamboo'){
  for(const dx of [-17,0,17]){g.lineStyle(7,0x6d9154).lineBetween(x+dx,y,x+dx+4,y-62);g.lineStyle(2,0xb7bf78).lineBetween(x+dx-3,y-20,x+dx+5,y-20).lineBetween(x+dx-3,y-43,x+dx+6,y-43);}g.lineStyle(4,0xc6a16c).lineBetween(x-26,y-38,x+27,y-38).lineBetween(x-26,y-31,x+27,y-31);
 }else if(p.stageKind==='ice'){
  g.fillStyle(0x547d90).fillTriangle(x-24,y,x-12,y-56,x+6,y).fillTriangle(x-6,y,x+10,y-68,x+26,y);g.fillStyle(0xc5e3df).fillTriangle(x-12,y-55,x-7,y-5,x-19,y-5).fillTriangle(x+10,y-67,x+15,y-7,x+5,y-7);g.lineStyle(2,0xe6f2e6).lineBetween(x+10,y-64,x+12,y-17);
 }else{
  g.lineStyle(6,0xa78b5c).lineBetween(x,y,x,y-68);g.fillStyle(0xa94937).fillTriangle(x+2,y-65,x+30,y-48,x+2,y-27);g.lineStyle(2,0xf0cd81).lineBetween(x+5,y-57,x+20,y-48).lineBetween(x+5,y-40,x+20,y-48);g.fillStyle(0x6b583b).fillRect(x-15,y-5,30,6);
 }
 g.fillStyle(0x20352c).fillRect(x-24,y+8,48,3);g.fillStyle(0xe1c47b).fillRect(x-24,y+8,48*p.hp/32,3);
}
