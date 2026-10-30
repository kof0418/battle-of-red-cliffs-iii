import {bowDraw,specialBeat,keyedPose} from './choreography.ts';
import {HAND_PALETTES} from './hand-palette.ts';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
export function rangedSpecialPose(f:Fighter){
 const t=f.attack!.elapsed;
 if(f.heroId==='zhaoyun')return keyedPose(t,[
  {at:0,pose:{x:9,y:-65,lean:-12,angle:-1.2,stride:14,crouch:0,phase:1}},
  {at:.14,pose:{x:43,y:-27,lean:18,angle:.4,stride:14,crouch:0,phase:2}},
  {at:.23,pose:{x:20,y:-44,lean:4,angle:-.5,stride:14,crouch:0,phase:1}},
  {at:.32,pose:{x:49,y:-25,lean:20,angle:.35,stride:14,crouch:0,phase:2}},
  {at:.43,pose:{x:16,y:-57,lean:-7,angle:-.9,stride:14,crouch:0,phase:1}},
  {at:.54,pose:{x:45,y:-32,lean:18,angle:.3,stride:14,crouch:0,phase:2}},
  {at:f.attack!.duration,pose:{x:17,y:-43,lean:0,angle:-.65,stride:0,crouch:0,phase:4}},
 ]);
 const spin=keyedPose(t,[0,.12,.35,.60,f.attack!.duration].map((at,i)=>({at,pose:{x:0,y:0,lean:0,angle:Math.min(i,3)*Math.PI*2/3,stride:12,crouch:6,phase:2}}))).angle;
 return {x:Math.cos(spin)*24,y:-46+Math.sin(spin)*18,lean:0,angle:spin,stride:12,crouch:6,phase:specialBeat(f).active?2:1};
}
/** Spear thrust/rise/sweep and an articulated bow replace the shared weapon poses. */
export function drawRangedWeapon(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,phase:number,angle:number){
 if(f.mounted||f.equipped||!['zhaoyun','huangzhong'].includes(f.heroId!))return false;
 const zhao=f.heroId==='zhaoyun',special=f.attack?.move==='special',close=f.attack?.move==='bow-strike';
 const cloth=zhao?0xa4c2ce:0xc1a365,skin=HAND_PALETTES[f.heroId!].skin;
 const line=(color:number,n:number,x:number,y:number,tx:number,ty:number)=>g.lineStyle(n,color).lineBetween(x,y,tx,ty);
 if(zhao){
  const vx=Math.cos(angle),vy=Math.sin(angle);line(0x273d43,10,-10,-54,hx-24*vx,hy-24*vy);line(cloth,6,-10,-54,hx-24*vx,hy-24*vy);
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(angle);
  g.fillStyle(0x352b24).fillRect(-39,-3,105,6);g.fillStyle(0xc4b17e).fillRect(-39,-3,105,2);
  for(const x of [-34,45,58])g.fillStyle(0xd9d8b4).fillRect(x,-4,4,8);
  g.fillStyle(0x719ca5).fillTriangle(63,-7,63,7,96,0);g.fillStyle(0xedf2df).fillTriangle(65,-5,65,0,96,0);
  line(0x619cae,4,58,3,49,18);line(0xc1dbe0,2,57,4,47,22);g.restore();
  g.fillStyle(skin).fillRect(hx-3,hy-3,7,6).fillRect(hx-24*vx-3,hy-24*vy-3,7,6);
  if(f.attack&&(phase===2||phase===3)){
   g.lineStyle(f.step===3?4:2,0xc9f0ff,.8);
   if(f.step===1&&!special)g.lineBetween(hx+15,hy,hx+111,hy);
   else if(f.step===2&&!special)g.beginPath().arc(18,-41,69,-2.5,-.6).strokePath();
   else g.beginPath().arc(17,-37,83,-1.8,1.2).strokePath();
  }
  return true;
 }
 const rotation=special?angle:close?angle:0;
 g.save();g.translateCanvas(hx,hy);g.rotateCanvas(rotation);
 const bx=7,draw=close||special?0:bowDraw(f);
 g.lineStyle(5,0x493323).beginPath().moveTo(bx-2,-33).lineTo(bx+10,-22).lineTo(bx+15,0).lineTo(bx+10,22).lineTo(bx-2,33).strokePath();
 g.lineStyle(2,0xd1b071).beginPath().moveTo(bx-2,-33).lineTo(bx+8,-21).lineTo(bx+12,0).lineTo(bx+8,21).lineTo(bx-2,33).strokePath();
 line(0xeee4c7,1,bx-2,-33,bx-draw,0);line(0xeee4c7,1,bx-draw,0,bx-2,33);
 if(!close&&!special&&(!f.attack||phase<2)){line(0xcbb98c,2,bx-draw-8,0,40,0);g.fillStyle(0xf0efdb).fillTriangle(47,0,38,-4,38,4);}
 g.fillStyle(skin).fillRect(bx-3,-3,7,6);g.restore();
 if(!close&&!special){line(0x493323,9,-12,-54,hx+bx-draw,hy);line(cloth,6,-12,-54,hx+bx-draw,hy);g.fillStyle(skin).fillRect(hx+bx-draw-3,hy-3,7,6);}
 if(close&&(phase===2||phase===3)){g.lineStyle(f.step===3?5:3,0xffdf96,.75);g.beginPath().arc(hx,hy,f.step===3?53:38,f.step===2?-2.8:-1.7,f.step===2?.4:1).strokePath();}
 return true;
}
