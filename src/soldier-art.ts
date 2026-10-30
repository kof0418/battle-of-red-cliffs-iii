import {infantryPose,enemyBowDraw} from './infantry-motion.ts';
import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Original sword infantry: articulated guard, readable wind-up and committed cut. */
export const soldierPose=infantryPose;
export function drawSwordSoldier(g:Phaser.GameObjects.Graphics,f:Fighter,frame:number){
 const p=soldierPose(f),archer=f.kind==='archer',spear=f.kind==='spearman',hammer=f.kind==='hammer',pot=f.kind==='thrower',shield=f.kind==='heavy',raider=f.kind==='raider';
 const cloth=archer?0x4e6844:spear?0x4b6a85:hammer?0x84553d:pot?0x716044:shield?0x4d636b:raider?0xa38647:0x713e35;
 const metal=shield?0x8a9b9b:archer||pot?0x826b48:0x4d625d;
 const walk=f.moving&&!f.attack&&!f.stun?[-4,0,4,0][frame%4]:0;
 const poly=(c:number,a:number[])=>{g.fillStyle(c).beginPath().moveTo(a[0],a[1]);for(let i=2;i<a.length;i+=2)g.lineTo(a[i],a[i+1]);g.closePath().fillPath();};
 for(const [hip,foot] of [[-7,-12-walk],[8,13+walk]]){
  g.lineStyle(11,0x222c2e).lineBetween(hip,-28,foot-3,-15).lineBetween(foot-3,-15,foot,-3);
  g.lineStyle(6,0x63716b).lineBetween(foot-3,-16,foot,-7);
  poly(0x162325,[foot-6,-7,foot+4,-7,foot+11,-1,foot+10,3,foot-6,3]);
  g.fillStyle(0x9b8052).fillRect(foot-5,-7,9,2);
 }
 poly(cloth,[-14,-39,13,-39,19,-17,5,-13,-2,-21,-12,-15,-19,-19]);
 if(archer){
  poly(0x493622,[-26,-63,-16,-58,-22,-26,-32,-30]);
  for(let i=0;i<3;i++){g.lineStyle(1,0xc1aa78).lineBetween(-25+i*4,-40,-21+i*4,-83);g.fillStyle(0xe6dbc0).fillTriangle(-21+i*4,-84,-26+i*4,-77,-19+i*4,-76);}
 }
 if(pot){g.fillStyle(0x44362b).fillEllipse(-22,-44,23,30);g.lineStyle(2,0xb59b6a).lineBetween(-29,-55,-15,-51);}
 g.save();g.translateCanvas(0,-30);g.rotateCanvas(p.lean*Math.PI/180);g.translateCanvas(0,30);
 poly(0x242d2d,[-15,-58,-7,-63,9,-62,17,-54,12,-32,-13,-32]);
 poly(cloth,[-13,-56,-8,-60,9,-59,14,-51,10,-34,-11,-34]);
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  const x=-11+col*5+(row%2),y=-55+row*5;
  g.fillStyle(col<2?0x7d8880:metal).fillRect(x,y,4,4);
  g.fillStyle(0xb2b49a).fillRect(x,y,3,1);
 }
 g.fillStyle(0x392c24).fillRect(-13,-35,27,5);g.fillStyle(0xc5a469).fillRect(-1,-36,7,7);
 poly(0x78503b,[-7,-76,7,-77,12,-70,10,-61,3,-57,-6,-62]);
 poly(0xc18e63,[-5,-74,6,-75,8,-69,12,-67,7,-65,5,-60,-3,-63]);
 g.fillStyle(0x252b28).fillRect(2,-70,6,2).fillRect(6,-63,4,2);
 poly(0x263b40,[-11,-72,-11,-81,-4,-88,5,-88,13,-79,13,-72]);
 poly(0x748783,[-8,-78,-3,-85,4,-85,10,-78,10,-75,-8,-75]);
 g.lineStyle(2,0xc3b888).lineBetween(0,-85,0,-75).lineBetween(-11,-74,13,-74);
 poly(0x495c5a,[-11,-74,-6,-73,-7,-62,-12,-66]);
 poly(0x974d3c,[-1,-88,-7,-96,-15-frame%2*2,-93,-7,-89]);
 if(archer||pot){poly(cloth,[-12,-72,-12,-83,1,-96,14,-80,12,-72,7,-80,-6,-79]);g.lineStyle(2,0xb7a26e).lineBetween(-11,-74,12,-74);}
 if(raider){poly(0x4a3626,[-12,-78,-6,-90,11,-86,15,-77]);g.lineStyle(3,0xc8ae6b).lineBetween(-10,-79,13,-78);}
 if(shield){g.fillStyle(0xaab6aa).fillRect(-14,-73,6,14).fillRect(9,-73,6,14);g.lineStyle(3,0xc7b17b).lineBetween(0,-88,0,-76);}
 const arm=(sx:number,x:number,y:number)=>{g.lineStyle(9,cloth).lineBetween(sx,-53,x-6,y+7).lineBetween(x-6,y+7,x,y);g.lineStyle(5,0x9a6a4c).lineBetween(x-6,y+5,x,y);g.fillStyle(0xd0a27a).fillRect(x-3,y-3,7,6);};
 arm(-12,p.captive?-16:-11,p.captive?-28:-42);arm(12,p.x,p.y);
 if(!p.captive){
  if(archer){
   const bx=p.x+7,draw=enemyBowDraw(f);
   g.lineStyle(4,0xbda06a).beginPath().moveTo(bx-2,p.y-28).lineTo(bx+12,p.y).lineTo(bx-2,p.y+28).strokePath();
   g.lineStyle(1,0xf0e4c7).lineBetween(bx-2,p.y-28,bx-draw,p.y).lineBetween(bx-draw,p.y,bx-2,p.y+28);
   arm(-12,bx-draw,p.y);
   if(!f.attack||f.attack.elapsed<f.attack.impact){g.lineStyle(2,0xcbb88d).lineBetween(bx-draw-5,p.y,bx+33,p.y);g.fillStyle(0xe0e5ce).fillTriangle(bx+40,p.y,bx+31,p.y-3,bx+31,p.y+3);}
  }else if(pot){
   if(!f.attack||f.attack.elapsed<f.attack.impact){g.fillStyle(0x493729).fillEllipse(p.x+3,p.y-7,20,23);g.fillStyle(0xb18a56).fillEllipse(p.x,p.y-9,13,16);g.fillStyle(0x2c3a39).fillRect(p.x-4,p.y-21,13,5);g.lineStyle(2,0xe5b55e).lineBetween(p.x+2,p.y-22,p.x+5,p.y-29);}
  }else{
   g.save();g.translateCanvas(p.x,p.y);g.rotateCanvas(p.angle);
   if(spear){
    g.fillStyle(0x44362b).fillRect(-36,-2,114,5);g.fillStyle(0xb8a16c).fillRect(-36,-2,114,1);
    poly(0x819da1,[76,-5,87,-8,108,0,87,6,76,3]);poly(0xe0e7d2,[78,-3,88,-6,108,0,79,1]);
    g.lineStyle(3,0xa45645).lineBetween(72,3,63,16);
   }else if(hammer){
    g.fillStyle(0x5c4432).fillRect(-12,-3,66,6);g.fillStyle(0xb09a69).fillRect(-12,-3,66,2);
    g.fillStyle(0x25383e).fillRect(43,-18,24,36);g.fillStyle(0x889999).fillRect(44,-17,21,7);g.lineStyle(2,0xc5b788).strokeRect(43,-18,24,36);
   }else{
    g.fillStyle(0x54382a).fillRect(-7,-2,14,5);g.fillStyle(0xc3a56c).fillRect(6,-7,4,14);
    const tip=raider?39:53;poly(0x718e8c,[10,-3,tip-15,-5,tip,-11,tip-4,1,tip-16,5,10,4]);poly(0xdce4cf,[11,-2,tip-15,-4,tip-1,-10,tip-8,0,tip-19,2,11,3]);
   }
   g.restore();
   if(spear)arm(-12,p.x-24*Math.cos(p.angle),p.y-24*Math.sin(p.angle));
  }
  if(shield){
   const guarding=(f.guard??0)>0,x=guarding?9:-25,y=guarding?-59:-48;
   poly(0x253e46,[x-10,y,x+12,y-3,x+17,y+31,x+2,y+43,x-12,y+30]);
   poly(0x607b80,[x-7,y+3,x+9,y,x+13,y+29,x+2,y+38,x-8,y+27]);
   g.lineStyle(2,guarding?0xffdb8d:0xc5b17c).lineBetween(x+1,y+1,x+2,y+36).lineBetween(x-8,y+15,x+12,y+15);g.fillStyle(0xc6ad74).fillCircle(x+2,y+17,5);
  }
 }

 g.restore();
 g.fillStyle(0x17251f).fillRect(-20,-103,40,4);g.fillStyle(0xd5ab70).fillRect(-20,-103,40*Math.max(0,f.hp/f.max),4);
 if(f.attack&&!f.attack.hit){g.fillStyle(0xffc163).fillTriangle(-4,-96,4,-96,0,-88);g.fillStyle(0x25352d).fillRect(-20,-110,40,3);g.fillStyle(0xffd98b).fillRect(-20,-110,40*Math.min(1,f.attack.elapsed/f.attack.impact),3);}
}
