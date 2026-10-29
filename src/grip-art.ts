import {HAND_PALETTES} from './hand-palette';
import {drawMountedWeapon} from './horse-art';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
import {HEROES} from './heroes';
import {grappleMotion} from './motion';
/** Both arms stay at the held torso; weapons are stowed while grappling. */
export function drawGrip(g:Phaser.GameObjects.Graphics,f:Fighter,contact?:{x:number;y:number}){
 if(!['hold','lift','air','throw'].includes(f.grapplePose??''))return false;
 const id=f.heroId!,pose=grappleMotion(id,f.grapplePose!,f.grappleProgress,f.grappleBack,f.mounted),palette=id==='guanyu'||id==='zhangfei'?HAND_PALETTES[id]:{shadow:0x6a4533,skin:0xd3ad7d,light:0xefcea0,sleeve:HEROES[id].color},color=palette.sleeve;
 if(f.mounted){drawMountedWeapon(g,f,pose.x,pose.y,2);return true;}
 const hx=contact?.x??pose.x,hy=contact?.y??pose.y,elbowX=id==='zhangfei'?12:8;
 g.lineStyle(10,0x1d302d).lineBetween(-10,-54,elbowX,hy+14).lineBetween(elbowX,hy+14,hx-6,hy+8);
 g.lineStyle(7,color).lineBetween(-10,-54,elbowX,hy+14).lineBetween(elbowX,hy+14,hx-6,hy+8);
 g.lineStyle(11,0x1d302d).lineBetween(12,-56,21,hy+5).lineBetween(21,hy+5,hx+2,hy);
 g.lineStyle(8,color).lineBetween(12,-56,21,hy+5).lineBetween(21,hy+5,hx+2,hy);
 for(const [x,y] of [[hx-7,hy+6],[hx,hy-2]]){
  g.fillStyle(palette.shadow).fillRect(x-1,y-1,9,7);g.fillStyle(palette.skin).fillRect(x,y,7,5);g.fillStyle(palette.light).fillRect(x,y,6,1);
 }
 return true;
}
