import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Dedicated weapon/hand poses; shared by the actor transform and detailed warrior art. */
export function vanguardSpecialPose(f:Fighter){
 const t=f.attack!.elapsed;
 if(f.heroId==='weiyan')return {x:-12,y:-44,lean:-12,angle:-2.1,stride:0,crouch:0,phase:2};
 if(t<.30)return {x:34,y:-43,lean:10,angle:.4,stride:16,crouch:0,phase:2};
 if(t<.57)return {x:-4,y:-55,lean:-14,angle:2.8,stride:18,crouch:2,phase:2};
 if(t<.70)return {x:0,y:-101,lean:-12,angle:-1.65,stride:18,crouch:0,phase:1};
 return {x:29,y:-9,lean:24,angle:1.4,stride:20,crouch:12,phase:2};
}
/** Wei Yan tucks one leg and extends the other through his somersault, never a sword slash. */
export function drawVanguardLegs(g:Phaser.GameObjects.Graphics,f:Fighter){
 if(f.heroId!=='weiyan'||f.attack?.move!=='special'||f.mounted||f.equipped)return false;
 const t=f.attack.elapsed,p=Math.min(1,t/.70),extension=22+18*Math.sin(p*Math.PI);
 g.lineStyle(12,0x222d2b).lineBetween(-8,-28,-20,-40).lineBetween(-20,-40,-5,-52);
 g.lineStyle(8,0x666d69).lineBetween(-18,-41,-5,-52);
 g.lineStyle(12,0x222d2b).lineBetween(6,-29,22,-45).lineBetween(22,-45,extension,-75);
 g.lineStyle(8,0x666d69).lineBetween(24,-47,extension,-73);
 g.lineStyle(7,0x142020).lineBetween(extension-5,-78,extension+12,-84);
 g.lineStyle(2,0xe7c188).lineBetween(extension-3,-82,extension+11,-87);
 return true;
}
export function drawVanguardTrail(g:Phaser.GameObjects.Graphics,f:Fighter,phase:number){
 if(!f.attack||f.mounted||f.equipped||f.attack.move==='special'||f.attack.move==='aerial'||phase<2||phase>3)return;
 if(f.heroId==='weiyan'){
  g.lineStyle(3,0xffbdc4,.85);
  if(f.step===1)g.lineBetween(28,-34,68,-67).lineBetween(30,-28,73,-61);
  else if(f.step===2)g.beginPath().arc(4,-28,42,-1.5,-.45).strokePath();
  else g.beginPath().arc(5,-30,61,-1.2,.35).strokePath();
 }else if(f.heroId==='lubu'){
  g.lineStyle(f.step===3?7:4,0xffd18b,.8);
  if(f.step===1)g.beginPath().arc(10,-40,117,-.75,.85).strokePath();
  else if(f.step===2)g.lineBetween(56,-47,153,-47).lineBetween(71,-54,142,-54);
  else{g.lineBetween(30,-113,55,1).lineBetween(41,-110,64,-3);g.lineStyle(3,0xffedae,.65).strokeEllipse(43,0,106,22);}
 }
}
