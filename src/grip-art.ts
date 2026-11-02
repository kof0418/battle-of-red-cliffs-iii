import {gripArm} from './choreography';
import {HAND_PALETTES} from './hand-palette';
import {drawMountedWeapon} from './horse-art';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
import {HEROES} from './heroes';
import {grappleMotion} from './motion';
/** Both arms stay at the held torso; weapons are stowed while grappling. */
export function drawGrip(g:Phaser.GameObjects.Graphics,f:Fighter,contact?:{x:number;y:number}){
 if(!['hold','lift','air','throw'].includes(f.grapplePose??''))return false;
 const id=f.heroId!,pose=grappleMotion(id,f.grapplePose!,f.grappleProgress,f.grappleBack,f.mounted),palette=HAND_PALETTES[id],color=palette.sleeve;
 if(f.mounted){drawMountedWeapon(g,f,pose.x,pose.y,2);return true;}
 const recovery=f.grapplePose==='throw'&&!contact?Math.min(1,(f.grappleProgress??0)*1.5):0;
 const hx=contact?.x??pose.x*(1-recovery)+18*recovery,hy=contact?.y??pose.y*(1-recovery)-48*recovery;
 // Captive stays in the hands; pulse accents make the held special readable.
 if(f.attack?.move==='special'){
  const pulse=Math.sin(Math.min(1,f.attack.elapsed/f.attack.duration)*Math.PI*3);
  g.lineStyle(3,0xffd576,.65).strokeCircle(hx,hy,13+Math.abs(pulse)*12);
 }
 for(const [sx,sy,tx,ty,bend] of [[-10,-54,hx-6,hy+8,1],[12,-56,hx+2,hy,-1]]){
  const arm=gripArm(sx,sy,tx,ty,bend);
  g.lineStyle(10,0x1d302d).lineBetween(sx,sy,arm.elbowX,arm.elbowY).lineBetween(arm.elbowX,arm.elbowY,arm.x,arm.y);
  g.lineStyle(7,color).lineBetween(sx,sy,arm.elbowX,arm.elbowY).lineBetween(arm.elbowX,arm.elbowY,arm.x,arm.y);
  g.fillStyle(palette.shadow).fillRect(arm.x-4,arm.y-3,9,7);g.fillStyle(palette.skin).fillRect(arm.x-3,arm.y-2,7,5);g.fillStyle(palette.light).fillRect(arm.x-3,arm.y-2,6,1);
 }
 return true;
}
