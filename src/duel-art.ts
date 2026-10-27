import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Zhang Fei's command special uses his fists even with his default spear. */
export function drawDuelBare(g:Phaser.GameObjects.Graphics,f:Fighter,hx:number,hy:number,phase:number){
 if(f.heroId!=='zhangfei'||f.attack?.move!=='special'||f.equipped||f.mounted)return false;
 const active=phase===2||phase===3;
 const arm=(x:number,y:number,rear=false)=>{const shoulder=rear?-12:12,elbow=x-12;
  g.lineStyle(11,0x263b32).lineBetween(shoulder,-54,elbow,y+9).lineBetween(elbow,y+9,x,y);
  g.lineStyle(7,0xbb7b4b).lineBetween(shoulder,-54,elbow,y+9).lineBetween(elbow,y+9,x,y);
  g.fillStyle(0x67432e).fillRect(x-2,y-5,15,12);g.fillStyle(0xb67a50).fillRect(x,y-4,12,9);g.fillStyle(0xe5bd8b).fillRect(x,y-4,10,2);
 };
 if(active&&f.attack.elapsed>=.5){arm(hx-12,hy-2,true);arm(hx+8,hy);}
 else{arm(6,-46,true);arm(active?hx:21,active?hy:-48);}
 if(active)g.lineStyle(3,0xffc789,.7).lineBetween(hx+15,hy-4,hx+34,hy-4).lineBetween(hx+15,hy+5,hx+29,hy+9);
 return true;
}
export function duelSpecialPose(f:Fighter){
 const t=f.attack!.elapsed;
 if(f.heroId==='guanyu')return {x:t<.3?20:32,y:t<.3?-70:t<.55?-83:-37,lean:4,angle:t<.3?-.3:t<.55?1.6:3.1,stride:12,crouch:0,phase:2};
 return {x:t<.5?45:19,y:t<.5?-44:-12,lean:t<.5?18:24,angle:0,stride:18,crouch:t<.5?2:13,phase:2};
}
export function drawDuelTrail(g:Phaser.GameObjects.Graphics,f:Fighter,phase:number){
 if(!f.attack||f.mounted||f.equipped||phase<2||phase>3)return;
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
