import {gripArm} from './choreography';
import {HAND_PALETTES} from './hand-palette';
import {drawMountedWeapon} from './horse-art';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
import {HEROES} from './heroes';
import {grappleMotion} from './motion';
/** Both arms stay at the held torso; weapons are stowed while grappling. */
export function drawGrip(g:Phaser.GameObjects.Graphics,f:Fighter,contact?:{x:number;y:number},layer:'back'|'front'='front'){
 if(!['hold','lift','air','throw'].includes(f.grapplePose??''))return false;
 const id=f.heroId!,pose=grappleMotion(id,f.grapplePose!,f.grappleProgress,f.grappleBack,f.mounted,f.grappleRelease),palette=HAND_PALETTES[id],color=palette.sleeve;
 if(f.mounted){if(layer==='back')return true;drawMountedWeapon(g,f,pose.x,pose.y,2);return true;}
 const recovery=f.grapplePose==='throw'&&!contact?Math.min(1,(f.grappleProgress??0)*1.5):0;
 const hx=contact?.x??pose.x*(1-recovery)+18*recovery,hy=contact?.y??pose.y*(1-recovery)-48*recovery;
 // Captive stays in the hands; pulse accents make the held special readable.
 if(layer==='front'&&f.attack?.move==='special'){
  const pulse=Math.sin(Math.min(1,f.attack.elapsed/f.attack.duration)*Math.PI*3);
  g.lineStyle(3,0xffd576,.65).strokeCircle(hx,hy,13+Math.abs(pulse)*12);
 }
 // Far arm is behind the cuirass; the near forearm stays visible over it.
 const far=layer==='back',sx=far?-14:13,sy=-56,tx=hx+(far?-5:3),ty=hy+(far?-7:6);
 const arm=gripArm(sx,sy,tx,ty,1);
 g.lineStyle(far?9:11,0x1d302d).lineBetween(sx,sy,arm.elbowX,arm.elbowY).lineBetween(arm.elbowX,arm.elbowY,arm.x,arm.y);
 g.lineStyle(far?6:8,color).lineBetween(sx,sy,arm.elbowX,arm.elbowY);
 g.lineStyle(far?5:7,palette.shadow).lineBetween(arm.elbowX,arm.elbowY,arm.x,arm.y);
 g.lineStyle(far?3:4,palette.skin).lineBetween(arm.elbowX,arm.elbowY,arm.x,arm.y);
 g.fillStyle(color).fillCircle(arm.elbowX,arm.elbowY,far?3:4);
 // Rotate the clenched hand with its forearm instead of drawing a floating square.
 g.save();g.translateCanvas(arm.x,arm.y);g.rotateCanvas(Math.atan2(arm.y-arm.elbowY,arm.x-arm.elbowX));
 g.fillStyle(palette.shadow).fillRoundedRect(-3,-4,8,8,2);g.fillStyle(palette.skin).fillRect(-2,-3,6,6);g.fillStyle(palette.light).fillRect(0,-3,3,1);g.restore();
 return true;
}
