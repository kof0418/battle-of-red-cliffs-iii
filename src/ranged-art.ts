import type Phaser from 'phaser';
import type {Fighter} from './combat';
export function rangedSpecialPose(f:Fighter){
 const t=f.attack!.elapsed;
 if(f.heroId==='zhaoyun')return {x:t<.25?9:43,y:t<.25?-65:-27,lean:t<.25?-12:18,angle:t<.25?-1.2:.4,stride:14,crouch:0,phase:2};
 const a=t*Math.PI*5;return {x:Math.cos(a)*24,y:-46+Math.sin(a)*18,lean:0,angle:a,stride:12,crouch:6,phase:2};
}
/** Spear thrust/rise/sweep and an articulated bow replace the shared weapon poses. */
export function drawRangedWeapon(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,phase:number,angle:number){
 if(f.mounted||f.equipped||!['zhaoyun','huangzhong'].includes(f.heroId!))return false;
 const zhao=f.heroId==='zhaoyun',special=f.attack?.move==='special',close=f.attack?.move==='bow-strike';
 const cloth=zhao?0xa4c2ce:0xc1a365,skin=zhao?0xd2a47c:0xbd956b;
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
 const bx=7,pull=f.step===3?36:f.step===2?15:20,draw=!f.attack?6:close||special?0:phase===0?pull*.4:phase===1?pull:phase===2?0:phase===3?3:6;
 g.lineStyle(5,0x493323).beginPath().moveTo(bx-2,-33).lineTo(bx+10,-22).lineTo(bx+15,0).lineTo(bx+10,22).lineTo(bx-2,33).strokePath();
 g.lineStyle(2,0xd1b071).beginPath().moveTo(bx-2,-33).lineTo(bx+8,-21).lineTo(bx+12,0).lineTo(bx+8,21).lineTo(bx-2,33).strokePath();
 line(0xeee4c7,1,bx-2,-33,bx-draw,0);line(0xeee4c7,1,bx-draw,0,bx-2,33);
 if(!close&&!special&&(!f.attack||phase<2)){line(0xcbb98c,2,bx-draw-8,0,40,0);g.fillStyle(0xf0efdb).fillTriangle(47,0,38,-4,38,4);}
 g.fillStyle(skin).fillRect(bx-3,-3,7,6);g.restore();
 if(!close&&!special){line(0x493323,9,-12,-54,hx+bx-draw,hy);line(cloth,6,-12,-54,hx+bx-draw,hy);g.fillStyle(skin).fillRect(hx+bx-draw-3,hy-3,7,6);}
 if(close&&(phase===2||phase===3)){g.lineStyle(f.step===3?5:3,0xffdf96,.75);g.beginPath().arc(hx,hy,f.step===3?53:38,f.step===2?-2.8:-1.7,f.step===2?.4:1).strokePath();}
 return true;
}
