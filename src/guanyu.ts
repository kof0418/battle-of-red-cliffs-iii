import type Phaser from 'phaser';
import type {Fighter} from './combat';
/** Original pixel illustration: layered silk, lamellar armour and a sculpted crescent blade. */
export function drawGuanyu(g:Phaser.GameObjects.Graphics,f:Fighter,frame:number,phase:number) {
 const poly=(c:number,p:number[])=>{g.fillStyle(c);g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();g.fillPath();};
 const line=(c:number,w:number,p:number[])=>{g.lineStyle(w,c);g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.strokePath();};
 const walk=f.moving&&!f.attack?[-5,0,5,0][frame%4]:0, stride=f.z>0?5:walk;
 // Tall, broad-shouldered silhouette; cloth moves independently behind the legs.
 poly(0x142c28,[-11,-64,-22,-58,-29-frame%3,-18,-14,-24,-6,-48]);
 poly(0x295441,[-15,-60,-23,-51,-26-frame%3,-24,-19,-29,-12,-48]);
 for(const [x,d] of [[-11,stride],[7,-stride]]){
  poly(0x182522,[x-5,-29,x+6,-27,x+5,-7+d,x-5,-6+d]);
  g.fillStyle(0x3b4840).fillRect(x-3,-22,4,12);
  poly(0x101c1b,[x-6,-10+d,x+5,-11+d,x+7,-4+d,x+12,-2+d,x+12,2+d,x-7,2+d]);
  g.fillStyle(0x927746).fillRect(x-5,-10+d,10,2);
 }
 poly(0x173e30,[-15,-43,14,-43,21,-17,13,-10,2,-17,-8,-12,-21,-18]);
 poly(0x427a51,[-9,-43,0,-40,-1,-18,-8,-14,-13,-20]);
 poly(0x285b3d,[5,-41,12,-39,17,-18,12,-14,7,-19]);
 line(0xb79a59,2,[-19,-20,-9,-15,1,-19,12,-13,19,-18]);
 // Chest cuirass with individually lit overlapping plates.
 poly(0x172b29,[-17,-62,-9,-67,10,-66,19,-59,15,-36,-13,-36]);
 poly(0x48645a,[-12,-61,10,-62,14,-54,11,-39,-11,-39,-15,-53]);
 for(let r=0;r<4;r++)for(let c=0;c<5;c++){
  const x=-12+c*5+(r%2),y=-58+r*5;
  g.fillStyle(c<2?0x769080:0x3b574d).fillRect(x,y,4,4);
  g.fillStyle(0xa8b49a).fillRect(x,y,3,1);
  g.fillStyle(0x223c34).fillRect(x+3,y+1,1,3);
 }
 line(0xb79a59,2,[-12,-62,0,-57,12,-62]);
 // Pauldrons and embroidered sleeve, shaded into the armour.
 poly(0x192d29,[-17,-63,-25,-57,-23,-47,-13,-46,-9,-58]);
 poly(0x8c7950,[-18,-61,-23,-56,-20,-51,-12,-52,-11,-58]);
 line(0xd1b679,2,[-21,-56,-17,-58,-13,-56]);
 g.fillStyle(0x382c20).fillRect(-15,-38,31,6);
 g.fillStyle(0xb89b59).fillRect(-14,-38,29,2).fillRect(-2,-39,8,8);
 g.fillStyle(0x5c6844).fillRect(0,-37,4,4);
 // Long face: cinnabar complexion, pronounced brow, cheek and nose planes.
 poly(0x4f2420,[-7,-82,7,-84,13,-77,13,-65,7,-58,-3,-60,-9,-70]);
 poly(0xa64e39,[-5,-80,6,-81,10,-76,9,-67,5,-61,-2,-63,-6,-71]);
 poly(0xd27b53,[4,-78,8,-77,9,-72,13,-70,9,-68,5,-69]);
 poly(0xbd6044,[-3,-74,3,-73,4,-67,-1,-66,-5,-70]);
 line(0x201f1b,2,[-5,-76,0,-77,4,-75]);
 line(0x201f1b,2,[7,-76,11,-75]);
 g.fillStyle(0xe0bc87).fillRect(1,-74,2,1).fillRect(9,-73,2,1);
 // Wrapped green headcloth, folds and trailing ties; no borrowed arcade design.
 poly(0x142d25,[-10,-80,-10,-88,-4,-94,7,-94,12,-88,13,-80,4,-82,-3,-80]);
 poly(0x326b45,[-8,-86,-3,-92,6,-92,10,-87,9,-83,-2,-84]);
 line(0x6c9360,2,[-6,-88,1,-89,8,-87]);
 line(0xb49c60,1,[-9,-81,0,-83,11,-81]);
 poly(0x244a32,[-9,-83,-16,-79,-18,-58,-13,-64,-12,-78]);
 // Moustache and tapered, multi-strand long beard, offset with the pose.
 const sway=f.attack?(phase-2)*2:frame%2;
 poly(0x111d1b,[-5,-66,2,-67,6,-64,10,-67,12,-63,10,-50,6+sway,-34,1+sway,-29,-5,-43,-7,-58]);
 line(0x455047,1,[-4,-62,-3,-49,1+sway,-36]);
 line(0x6b6b52,1,[1,-63,3,-50,3+sway,-35]);
 line(0x343f36,2,[8,-61,7,-49,5+sway,-36]);
 // Two-handed grip and rotating polearm: wind-up, contact and follow-through.
 const angles=f.step===2?[1.0,.7,-.7,-1.0,-.25]:f.step===3?[-1.2,-.8,.25,.65,-.25]:[-.9,-.6,.05,.35,-.25];
 const angle=f.attack?angles[phase]:-.25, hx=f.attack?[12,15,25,27,17][phase]:17, hy=f.attack?(f.step===2?-43:-49):-48;
 poly(0x244d35,[10,-60,18,-58,hx+3,hy-2,hx,hy+7,13,-49,8,-53]);
 line(0x779062,2,[14,-57,18,-52,hx,hy+2]);
 g.save();g.translateCanvas(hx,hy);g.rotateCanvas(angle);
 g.fillStyle(0x362b20).fillRect(-2,-36,5,87);
 g.fillStyle(0x8e7650).fillRect(-1,-36,2,87);
 for(const y of [-30,-23,27,43])g.fillStyle(0xc6ae73).fillRect(-3,y,7,3);
 poly(0x1c3d35,[-4,-35,-5,-43,3,-49,8,-42,5,-35]);
 line(0xc2a366,2,[-4,-37,2,-43,5,-40]);
 poly(0x263f42,[1,-43,3,-68,11,-75,22,-77,17,-70,22,-62,20,-55,12,-48,4,-43]);
 poly(0x89aaa6,[4,-44,6,-66,13,-72,20,-75,16,-66,19,-61,16,-54,10,-48]);
 poly(0xdce4ce,[11,-48,18,-55,20,-62,17,-68,21,-76,23,-78,20,-67,24,-61,21,-54,12,-47,4,-43]);
 line(0x4c7775,1,[8,-51,10,-60,8,-65,13,-68]);
 g.restore();
 for(const [x,y] of [[hx,hy],[hx-8,hy+19]]){
  g.fillStyle(0x653b29).fillRect(x-3,y-2,8,7);
  g.fillStyle(0xc28a59).fillRect(x-2,y-2,6,4);
  g.fillStyle(0xe0b47b).fillRect(x-2,y-2,5,1);
 }
 if(f.attack&&phase>=2&&phase<=3){
  const r=f.step===3?67:51;
  g.lineStyle(f.step===3?5:3,0xdbe8bc,.65).beginPath().arc(17,-43,r,f.step===2?-.4:-1.5,f.step===2?1.4:.4).strokePath();
  g.lineStyle(1,0xffffda,.9).beginPath().arc(17,-43,r+3,-1.3,.3).strokePath();
 }
}
