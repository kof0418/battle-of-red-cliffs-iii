import type Phaser from 'phaser';
import type {Fighter} from './combat';
import {planted} from './choreography';
/** Bent knees transfer torso weight without translating the planted soles. */
export function drawSupport(g:Phaser.GameObjects.Graphics,f:Fighter,lean:number,crouch:number,stride:number){
 if(!planted(f)||!f.attack&&!f.stun&&!(f.throwRecovery??0))return false;
 const metal=f.heroId==='zhangfei'?0x675e4b:0x3b4840;
 for(const side of [-1,1]){
  const foot=side*(12+stride*.6),knee=foot+lean*.25,hip=side*8;
  g.lineStyle(12,0x182522).lineBetween(hip,-28+crouch*.3,knee,-16).lineBetween(knee,-16,foot,-4);
  g.lineStyle(7,metal).lineBetween(knee,-16,foot,-7);
  g.lineStyle(2,0xb79a59).lineBetween(knee-3,-17,knee+3,-17);
  g.fillStyle(0x101c1b).fillRect(foot-6,-6,13,8).fillRect(foot+6,-2,6,4);
 }
 return true;
}
