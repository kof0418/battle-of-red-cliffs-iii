import {infantryPose} from './infantry-motion.ts';
import type Phaser from 'phaser';import type {Fighter} from './combat';
/** Original heavy infantry silhouettes: bare-handed bruiser and round-mace carrier. */
export function drawHeavyInfantry(g:Phaser.GameObjects.Graphics,f:Fighter,frame:number){
 const fat=f.kind==='mauler',skin=fat?0xc79770:0xb27b58,cloth=fat?0x665547:0x4e635a;
 const pose=infantryPose(f),walk=f.moving&&!f.attack&&!f.stun?[-4,0,4,0][frame%4]:0,attack=!!f.attack;
 g.fillStyle(0x1a2728).fillRect(-18,-25,14,24+walk).fillRect(5,-25,14,24-walk);
 g.fillStyle(0x39332b).fillRect(-21,-6+walk,18,8).fillRect(5,-6-walk,20,8);
 g.save();g.translateCanvas(0,-30);g.rotateCanvas(pose.lean*Math.PI/180);g.translateCanvas(0,30);
 if(fat){
  g.fillStyle(0x342f2b).fillEllipse(0,-43,65,64);g.fillStyle(skin).fillEllipse(0,-46,59,60);
  g.fillStyle(0xe0b68c).fillEllipse(-8,-51,27,35);g.lineStyle(2,0x946e50).beginPath().arc(0,-45,23,.3,2.5).strokePath();
  g.fillStyle(0x684534).fillRect(-29,-33,58,10);g.fillStyle(0xc9a46c).fillRect(-6,-34,12,12);
  g.fillStyle(cloth).fillRect(-25,-24,50,10);g.fillStyle(0x825c3b).fillCircle(1,-49,2);
 }else{
  g.fillStyle(0x3d342a).fillRect(-23,-73,46,48);g.fillStyle(skin).fillRect(-21,-72,42,42);
  g.fillStyle(0xcd9b70).fillEllipse(-10,-62,20,18).fillEllipse(10,-62,20,18);
  g.lineStyle(2,0x82553e).lineBetween(0,-65,0,-35).lineBetween(-15,-52,15,-52);
  for(let y=-47;y<-32;y+=7)g.lineStyle(1,0x80583f).lineBetween(-10,y,10,y);
  g.fillStyle(cloth).fillRect(-22,-32,44,20);g.fillStyle(0xd0ac70).fillRect(-23,-33,46,5);
 }
 const headY=fat?-86:-96;
 g.fillStyle(0x3c2c26).fillRect(-11,headY,24,24);g.fillStyle(skin).fillRect(-9,headY+2,21,19);
 g.fillStyle(0x232a27).fillRect(-12,headY-3,25,8);g.fillStyle(fat?0x9d6750:0x9f483d).fillRect(-12,headY+3,26,4);
 g.fillStyle(0x161d1e).fillRect(3,headY+10,4,2);g.lineStyle(2,0x714c38).lineBetween(0,headY+8,8,headY+7).lineBetween(3,headY+17,10,headY+17);g.fillStyle(0xe3bb8f).fillRect(10,headY+12,5,4);
 g.lineStyle(fat?14:12,skin).lineBetween(-22,-65,-29,-43);g.fillStyle(0xe0c7a0).fillRect(-35,-48,15,9);
 const hx=pose.x,hy=pose.y;
 g.lineStyle(fat?15:12,skin).lineBetween(20,-65,hx,hy);
 if(fat&&!pose.captive){
  const mx=hx+48*Math.cos(pose.angle),my=hy+48*Math.sin(pose.angle);
  g.lineStyle(6,0x624633).lineBetween(hx,hy,mx,my);g.lineStyle(2,0xb89462).lineBetween(hx-2,hy,mx-2,my);
  g.fillStyle(0x263539).fillCircle(mx,my,19);g.fillStyle(0x697c7e).fillCircle(mx-2,my-2,16);g.fillStyle(0xb4c3b7).fillEllipse(mx-7,my-7,9,12);
  g.lineStyle(3,0xc3a76c).strokeCircle(mx,my,18);g.lineStyle(2,0x344447).lineBetween(mx-14,my+5,mx+14,my+5);
 }else{
  g.fillStyle(0xdbc5a0).fillRect(hx-5,hy-8,12,15);g.fillStyle(skin).fillRect(hx+4,hy-9,15,16);
  g.lineStyle(1,0x80523d).lineBetween(hx+8,hy-5,hx+17,hy-5).lineBetween(hx+8,hy,hx+17,hy);
 }
 g.restore();
 if(attack&&!f.attack!.hit)g.fillStyle(0xffc163).fillTriangle(-4,headY-13,4,headY-13,0,headY-4);
 g.fillStyle(0x17251f).fillRect(-22,headY-20,44,4);g.fillStyle(0xd5ab70).fillRect(-22,headY-20,44*f.hp/f.max,4);
}
