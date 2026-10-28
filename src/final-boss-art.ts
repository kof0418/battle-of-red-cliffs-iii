import type Phaser from 'phaser';import type {Fighter} from './combat';
export const FINAL_BOSS_NAMES:Record<string,string>={bridgeguard:'裂石・重戟守將',bridgearcher:'逐浪・弦甲守將',admiral:'滄瀾・鐵錨船督',firelord:'燼舟・焰舵督軍',pursuer:'夜隼・斷後刺將',warlord:'玄戎・玄甲主帥'};
/** Six original enemy silhouettes: paired wardens, anchor, fireblade, twin blades and imperial spear. */
export function drawFinalBoss(g:Phaser.GameObjects.Graphics,f:Fighter,time:number){
 if(!FINAL_BOSS_NAMES[f.kind])return false;
 const bow=f.kind==='bridgearcher',anchor=f.kind==='admiral',fire=f.kind==='firelord',fast=f.kind==='pursuer',last=f.kind==='warlord';
 const cloth=bow?0x447e8c:anchor?0x345d69:fire?0xb34a32:fast?0x5b466d:last?0x343f51:0x737964,edge=fire?0xffc67b:bow||anchor?0xb1d8d8:0xd7b66f;
 const active=!!f.attack&&f.attack.elapsed>=f.attack.impact,held=!!f.grapplePose,step=f.moving?Math.sin(time*12)*5:0;
 g.fillStyle(0x1d2830).fillTriangle(-12,-68,-35,-14,8,-24);g.fillStyle(cloth).fillTriangle(-10,-63,-28,-18,5,-25);
 for(const [x,k] of [[-12,step],[8,-step]]){g.fillStyle(0x1b2930).fillRect(x-5,-27,12,23+k);g.fillStyle(0x7b806e).fillRect(x-4,-22,8,13);g.fillStyle(0x141f27).fillRect(x-7,-7+k,19,9);g.lineStyle(1,edge).lineBetween(x-4,-6+k,x+7,-6+k);}
 g.fillStyle(0x21333a).fillRect(-22,-65,44,41);g.fillStyle(cloth).fillRect(-19,-62,38,32);
 for(let r=0;r<5;r++)for(let c=0;c<6;c++){g.fillStyle(c<3?0x85908b:0x566978).fillRect(-17+c*6,-59+r*6,5,5);g.fillStyle(edge).fillRect(-17+c*6,-59+r*6,4,1);}
 g.fillStyle(cloth).fillTriangle(-20,-34,-27,-15,0,-23).fillTriangle(20,-34,27,-15,0,-23);g.lineStyle(3,edge).lineBetween(-22,-34,22,-34);
 for(const x of [-23,14]){g.fillStyle(0x263944).fillRect(x,-65,15,16);g.lineStyle(2,edge).strokeRect(x,-65,15,16);}
 g.fillStyle(0x725640).fillRect(-9,-87,22,23);g.fillStyle(0xc59e76).fillRect(-6,-84,16,16);g.fillStyle(0x181f29).fillRect(3,-78,4,2);g.fillStyle(0xf0c79b).fillRect(8,-75,6,4);
 if(fast){g.fillStyle(0x443952).fillTriangle(-14,-76,0,-103,15,-76);g.fillStyle(0x262e37).fillRect(-9,-74,21,10);g.lineStyle(2,0xb59ba7).lineBetween(-10,-90,3,-96);}
 else if(last){g.fillStyle(0x252d3b).fillRect(-15,-94,31,17);for(const x of [-13,-2,10])g.fillStyle(edge).fillTriangle(x,-91,x+3,-107,x+7,-91);g.lineStyle(3,edge).lineBetween(-15,-88,16,-88);g.fillStyle(0x673b37).fillCircle(1,-93,4);}
 else{g.fillStyle(cloth).fillTriangle(-15,-78,-10,-98,11,-98).fillRect(-13,-87,29,9);g.lineStyle(3,edge).lineBetween(-13,-85,15,-85);if(anchor)g.lineStyle(4,0x3a4c52).lineBetween(-8,-69,-4,-55).lineBetween(6,-69,8,-57);if(fire)g.fillStyle(0xd57b43).fillTriangle(-3,-97,4,-113,10,-96);}
 const hx=held?25:active?38:16,hy=held?-42:active?-42:f.attack?-77:-51;
 g.lineStyle(10,cloth).lineBetween(17,-58,hx,hy);g.fillStyle(0xd4ab7e).fillRect(hx-3,hy-4,8,7);
 if(held)return true;
 if(bow){g.lineStyle(4,edge).beginPath().arc(hx+8,hy,28,-1.3,1.3).strokePath();g.lineStyle(1,0xeee0b1).lineBetween(hx+16,hy-27,hx-8,hy).lineBetween(hx-8,hy,hx+16,hy+27);}
 else if(anchor){g.lineStyle(6,0xa3c6c9).lineBetween(hx,hy+20,hx+13,hy-31);g.lineStyle(5,edge).lineBetween(hx-10,hy-25,hx+30,hy-19);g.lineStyle(5,0x9ab3ba).beginPath().arc(hx+10,hy+1,28,0,Math.PI).strokePath();g.fillStyle(0xccddd4).fillTriangle(hx-18,hy+1,hx-30,hy-8,hx-17,hy+12).fillTriangle(hx+38,hy+1,hx+49,hy-8,hx+38,hy+12);}
 else if(fast){g.lineStyle(4,edge).lineBetween(hx-4,hy+4,hx+25,hy-22).lineBetween(-19,-50,-38,-74);g.lineStyle(8,cloth).lineBetween(-18,-58,-20,-48);}
 else{g.lineStyle(5,0x806143).lineBetween(hx-25,hy+28,hx+24,hy-35);g.lineStyle(2,edge).lineBetween(hx-26,hy+25,hx+22,hy-36);g.fillStyle(fire?0xee9a59:0xaac3c5).fillTriangle(hx+20,hy-34,hx+50,hy-55,hx+35,hy-13);g.lineStyle(2,0xf5dfab).lineBetween(hx+50,hy-55,hx+35,hy-13);if(!last&&!fire){g.fillStyle(0x435a5e).fillRect(-35,-58,17,36);g.lineStyle(2,edge).strokeRect(-35,-58,17,36);}}
 if(f.attack&&!f.attack.hit)g.fillStyle(0xffd18c).fillTriangle(-5,-116,5,-116,0,-105);
 g.fillStyle(0x17251f).fillRect(-24,-125,48,4);g.fillStyle(edge).fillRect(-24,-125,48*f.hp/f.max,4);
 return true;
}
