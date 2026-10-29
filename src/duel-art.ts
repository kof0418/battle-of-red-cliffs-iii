import {specialBeat} from './choreography.ts';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Zhang Fei's command special uses his fists even with his default spear. */
export function drawDuelBare(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,_phase:number){
 if(f.heroId!=='zhangfei'||f.attack?.move!=='special'||f.equipped||f.mounted)return false;
 const active=specialBeat(f).active;
 const arm=(x:number,y:number,rear=false)=>{const shoulder=rear?-12:12,elbow=x-12;
  g.lineStyle(11,0x263b32).lineBetween(shoulder,-54,elbow,y+9).lineBetween(elbow,y+9,x,y);
  g.lineStyle(7,0xbb7b4b).lineBetween(shoulder,-54,elbow,y+9).lineBetween(elbow,y+9,x,y);
  g.fillStyle(0x67432e).fillRect(x-2,y-5,15,12);g.fillStyle(0xb67a50).fillRect(x,y-4,12,9);g.fillStyle(0xe5bd8b).fillRect(x,y-4,10,2);
 };
 if(active&&f.attack.elapsed>=.5){arm(hx-12,hy-2,true);arm(hx+8,hy);}
 else{arm(6,-46,true);arm(hx,hy);}
 if(active)g.lineStyle(3,0xffc789,.7).lineBetween(hx+15,hy-4,hx+34,hy-4).lineBetween(hx+15,hy+5,hx+29,hy+9);
 return true;
}
export function duelSpecialPose(f:Fighter){
 const {beat,amount:u,active}=specialBeat(f);
 if(f.heroId==='guanyu')return {x:12+20*u,y:beat===0?-32-42*u:beat===1?-74+22*u:-65+35*u,lean:4*u,angle:beat===0?1.1-1.4*u:beat===1?-.3+1.9*u:1.6+1.5*u,stride:12,crouch:0,phase:active?2:1};
 return {x:beat<2?14+31*u:19,y:beat<2?-48+4*u:-66+54*u,lean:beat<2?18*u:24*u,angle:0,stride:18,crouch:beat<2?2:13*u,phase:active?2:1};
}
export function drawDuelTrail(g:Phaser.GameObjects.Graphics,f:Fighter,phase:number){
 if(!f.attack||f.attack.move!=='slash'||f.mounted||f.equipped||phase<2||phase>3)return;
 if(f.heroId==='guanyu'){
  g.lineStyle(f.step===3?6:4,0xc4edb8,.65);
  if(f.step===1)g.beginPath().arc(12,-43,72,-.8,.7).strokePath();
  else if(f.step===2)g.beginPath().arc(17,-38,62,-2.2,-.5).strokePath();
  else g.lineBetween(32,-94,45,-5).lineBetween(38,-91,51,-7);
 }else if(f.heroId==='zhangfei'){
  g.lineStyle(f.step===3?5:3,0xffcd8c,.8);
  if(f.step===1)g.lineBetween(30,-42,118,-42).lineBetween(45,-48,100,-48);
  else if(f.step===2)g.beginPath().arc(7,-42,52,-2.5,.5).strokePath();
  else{g.strokeEllipse(18,-2,135,30);for(const side of [-1,1])g.lineBetween(20,-2,20+side*65,-18);}
 }
}
