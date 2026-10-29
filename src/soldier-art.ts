import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Original sword infantry: articulated guard, readable wind-up and committed cut. */
export function soldierPose(f:Fighter){
 const a=f.attack;
 if(f.grapplePose)return {x:15,y:-29,angle:1.8,lean:0,captive:true};
 if(f.stun>0)return {x:5,y:-30,angle:1.4,lean:-10*Math.min(1,f.stun/.12),captive:false};
 if(!a)return {x:19,y:-43,angle:-.8,lean:0,captive:false};
 const t=a.elapsed,i=a.impact,d=a.duration;
 const wind=Math.min(1,t/i),release=Math.max(0,Math.min(1,(t-i)/(d-i)));
 // Blade reaches its forward contact pose exactly when combat resolves the strike.
 const snap=Math.max(0,(wind-.7)/.3),recover=Math.max(0,(release-.3)/.7);
 return {x:t<i?5+25*snap:30-11*recover,y:t<i?-66+23*snap:-43,
  angle:t<i?-2.2+2.2*snap:-.8*recover,lean:t<i?-8+17*snap:9*(1-recover),captive:false};
}
export function drawSwordSoldier(g:Phaser.GameObjects.Graphics,f:Fighter,frame:number){
 const p=soldierPose(f),walk=f.moving&&!f.attack&&!f.stun?[-4,0,4,0][frame%4]:0;
 const poly=(c:number,a:number[])=>{g.fillStyle(c).beginPath().moveTo(a[0],a[1]);for(let i=2;i<a.length;i+=2)g.lineTo(a[i],a[i+1]);g.closePath().fillPath();};
 for(const [hip,foot] of [[-7,-12-walk],[8,13+walk]]){
  g.lineStyle(11,0x222c2e).lineBetween(hip,-28,foot-3,-15).lineBetween(foot-3,-15,foot,-3);
  g.lineStyle(6,0x63716b).lineBetween(foot-3,-16,foot,-7);
  poly(0x162325,[foot-6,-7,foot+4,-7,foot+11,-1,foot+10,3,foot-6,3]);
  g.fillStyle(0x9b8052).fillRect(foot-5,-7,9,2);
 }
 poly(0x713e35,[-14,-39,13,-39,19,-17,5,-13,-2,-21,-12,-15,-19,-19]);
 g.save();g.translateCanvas(0,-30);g.rotateCanvas(p.lean*Math.PI/180);g.translateCanvas(0,30);
 poly(0x242d2d,[-15,-58,-7,-63,9,-62,17,-54,12,-32,-13,-32]);
 poly(0x925b48,[-13,-56,-8,-60,9,-59,14,-51,10,-34,-11,-34]);
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  const x=-11+col*5+(row%2),y=-55+row*5;
  g.fillStyle(col<2?0x7d8880:0x4d625d).fillRect(x,y,4,4);
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
 const arm=(sx:number,x:number,y:number)=>{g.lineStyle(9,0x713e35).lineBetween(sx,-53,x-6,y+7).lineBetween(x-6,y+7,x,y);g.lineStyle(5,0x9a6a4c).lineBetween(x-6,y+5,x,y);g.fillStyle(0xd0a27a).fillRect(x-3,y-3,7,6);};
 arm(-12,p.captive?-16:-11,p.captive?-28:-42);arm(12,p.x,p.y);
 if(!p.captive){
  g.save();g.translateCanvas(p.x,p.y);g.rotateCanvas(p.angle);
  g.fillStyle(0x54382a).fillRect(-7,-2,14,5);g.fillStyle(0xc3a56c).fillRect(6,-7,4,14);
  poly(0x718e8c,[10,-3,38,-5,53,-11,49,1,37,5,10,4]);
  poly(0xdce4cf,[11,-2,38,-4,52,-10,45,0,34,2,11,3]);g.restore();
 }
 g.restore();
 g.fillStyle(0x17251f).fillRect(-20,-103,40,4);g.fillStyle(0xd5ab70).fillRect(-20,-103,40*Math.max(0,f.hp/f.max),4);
 if(f.attack&&!f.attack.hit){g.fillStyle(0xffc163).fillTriangle(-4,-96,4,-96,0,-88);g.fillStyle(0x25352d).fillRect(-20,-110,40,3);g.fillStyle(0xffd98b).fillRect(-20,-110,40*Math.min(1,f.attack.elapsed/f.attack.impact),3);}
}
