import type Phaser from 'phaser';
import type {Fighter} from './combat';
import {heroMotion} from './motion';

/** Original layered pixel silhouettes. Gameplay geometry remains in combat.ts. */
export function drawWarrior(g:Phaser.GameObjects.Graphics,f:Fighter,frame:number,phase:number){
 const id=f.heroId!,zhang=id==='zhangfei',zhao=id==='zhaoyun',huang=id==='huangzhong';
 const cloth=zhang?0x854a32:zhao?0x496f81:huang?0x867046:0x713e50;
 const light=zhang?0xbb7b4b:zhao?0xa4c2ce:huang?0xc1a365:0xae7080;
 const metal=zhao?0x8ea7aa:zhang?0x675e4b:huang?0x777359:0x666d69;
 const edge=zhao?0xe0e5d5:0xc8ae75,skin=zhang?0xb67a50:huang?0xbd956b:0xd2a47c;
 const w=zhang?19:zhao?13:15;
 const poly=(c:number,p:number[])=>{g.fillStyle(c);g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();g.fillPath();};
 const line=(c:number,n:number,p:number[])=>{g.lineStyle(n,c);g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.strokePath();};
 const stride=f.z>0?6:f.moving&&!f.attack?[-5,0,5,0][frame%4]:0;
 const tail=frame%3*2;
 poly(0x1c2a2b,[-w,-61,-w-8,-52,-w-13-tail,-15,-w+2,-24,-3,-56]);
 poly(cloth,[-w,-58,-w-5,-50,-w-9-tail,-22,-w,-29,-5,-55]);
 line(light,1,[-w-2,-50,-w-4-tail,-30]);
 // Rear equipment: the archer's quiver and individually feathered arrows.
 if(huang){
  poly(0x493723,[-22,-56,-13,-53,-19,-29,-28,-33]);
  line(0xc1a271,2,[-24,-54,-16,-51]);
  for(let i=0;i<3;i++){const x=-23+i*4;line(0xa88c61,1,[x,-49,x+6,-77-i*2]);poly(0xd9d3b8,[x+5,-71-i*2,x+3,-78-i*2,x+8,-75-i*2,x+6,-69-i*2]);}
 }
 for(const [x,d] of [[-10,stride],[8,-stride]]){
  poly(0x222d2b,[x-6,-29,x+5,-29,x+5,-8+d,x-5,-7+d]);
  g.fillStyle(metal).fillRect(x-4,-21,7,11);g.fillStyle(edge).fillRect(x-4,-21,2,10);
  poly(0x142020,[x-6,-10+d,x+5,-10+d,x+7,-4+d,x+11,-1+d,x+11,2+d,x-7,2+d]);
  line(0x7f7560,1,[x-5,-6+d,x+4,-6+d,x+6,-2+d]);
 }
 poly(cloth,[-w+2,-43,w-2,-43,w+5,-18,10,-12,1,-19,-10,-13,-w-5,-20]);
 for(let i=-w+4;i<w;i+=7){poly(i<0?light:metal,[i,-39,i+4,-39,i+6,-20,i+1,-18]);line(0x283a34,1,[i+4,-37,i+6,-22]);}
 line(edge,1,[-w-3,-20,-10,-15,1,-21,10,-14,w+3,-19]);
 poly(0x1b2d2b,[-w,-61,-w+7,-67,9,-66,w,-59,w-2,-37,-w+2,-37]);
 poly(metal,[-w+3,-59,-8,-63,9,-62,w-3,-56,w-5,-40,-w+4,-40]);
 // Staggered lamellae, with lit top edges and dark seams.
 for(let r=0;r<4;r++)for(let c=0;c<(zhang?6:5);c++){
  const x=-w+4+c*5+(r%2),y=-58+r*5;
  g.fillStyle(c<2?light:metal).fillRect(x,y,4,4);
  g.fillStyle(edge).fillRect(x,y,3,1);g.fillStyle(0x293a35).fillRect(x+3,y+1,1,3);
 }
 if(zhang){line(0x3e3025,5,[-14,-63,11,-39]);line(0xc5a06a,1,[-13,-63,12,-39]);}
 if(huang)line(0x493726,4,[-13,-64,13,-38]);
 // Shoulder guards give each warrior a different outline.
 for(const x of [-w,w-4]){
  poly(0x233330,[x-6,-60,x+3,-65,x+10,-58,x+8,-48,x-3,-48]);
  poly(metal,[x-4,-58,x+3,-62,x+8,-57,x+6,-52,x-2,-51]);
  line(edge,1,[x-3,-57,x+2,-60,x+7,-56]);
  if(zhang)for(let i=0;i<3;i++)poly(0x9c8864,[x-4+i*4,-51,x-1+i*4,-52,x+i*4,-46]);
 }
 g.fillStyle(0x392c23).fillRect(-w+2,-38,w*2-4,6);
 g.fillStyle(edge).fillRect(-w+2,-38,w*2-4,1).fillRect(-2,-40,8,9);
 g.fillStyle(zhang?0x7e4e2f:zhao?0x537c7c:0x725648).fillRect(0,-38,4,5);
 // Sculpted face planes, nose, eye and individual jaw shape.
 poly(0x624533,[-8,-81,6,-84,12,-77,12,-66,zhang?5:3,-59,-5,-62,-10,-71]);
 poly(skin,[-6,-79,5,-81,9,-76,8,-68,3,-62,-3,-65,-7,-72]);
 poly(0xe3b991,[4,-77,8,-76,9,-72,13,-70,9,-68,5,-69]);
 line(0x453c30,zhang?3:2,[-5,-75,0,-77,5,-75]);
 g.fillStyle(0x161f20).fillRect(1,-74,3,2);g.fillStyle(0xf4d8ac).fillRect(1,-74,1,1);
 if(zhang){
  // Wild brows, swept hair and full bristled beard.
  poly(0x172321,[-10,-77,-13,-85,-9,-89,-7,-94,-2,-91,3,-95,8,-91,12,-84,11,-78,3,-82,-5,-81]);
  line(0x645641,1,[-8,-86,-2,-89,5,-87]);
  g.fillStyle(0xad7647).fillRect(-10,-82,23,3);
  poly(0x172321,[-8,-68,-3,-67,2,-69,7,-65,11,-67,12,-58,8,-51,5,-54,1,-49,-3,-54,-7,-52,-11,-60]);
  for(let i=0;i<4;i++)line(0x4c4938,1,[-7+i*4,-64,-5+i*4,-55]);
 }else if(zhao){
  // Silver ridged helmet and a long pale-blue horsehair plume.
  poly(0x233b43,[-11,-77,-12,-86,-6,-95,3,-99,12,-89,14,-78,7,-81,-2,-80]);
  poly(0x9fb6b9,[-9,-84,-5,-92,2,-96,9,-88,10,-82,1,-84]);
  line(0xe4e9d8,2,[1,-96,1,-84,11,-81]);
  poly(0x6e939d,[-11,-81,-6,-79,-6,-66,-11,-70]);
  line(0xd7dfce,1,[-10,-79,-8,-69]);
  poly(0x47788d,[1,-98,-7,-104,-18-tail,-104,-32-tail,-94,-19,-97,-7,-95]);
  line(0xb9d7db,2,[0,-99,-12,-101,-25-tail,-96]);
  line(0x82664b,1,[-1,-65,5,-65]);
 }else if(huang){
  // Weathered veteran, white brows, temples and layered beard.
  poly(0x4b4a39,[-11,-81,-10,-89,-3,-94,7,-92,12,-83]);
  poly(0xa58e55,[-8,-86,-2,-91,6,-89,9,-84,0,-84]);
  line(0xe0c589,2,[-10,-81,1,-83,12,-81]);
  g.fillStyle(0xd3d5bd).fillRect(-9,-79,4,14);
  line(0xe1dfc9,2,[-4,-76,1,-77,5,-75]);
  line(0x82694f,1,[-4,-71,1,-70]);line(0x82694f,1,[-4,-68,0,-67]);
  poly(0x7d877a,[-5,-65,2,-66,7,-63,11,-65,10,-52,5,-39,-1,-44,-7,-57]);
  poly(0xd3d6bf,[-4,-63,1,-64,5,-61,9,-63,6,-49,3,-43,-1,-49]);
  line(0xf1ead3,1,[0,-62,2,-53,3,-47]);line(0x9ba594,1,[6,-60,5,-50]);
 }else{
  // Angular face, short beard and burgundy head wrap with trailing ribbons.
  poly(0x302631,[-11,-80,-10,-89,0,-94,10,-89,12,-80]);
  poly(0x9d6174,[-8,-86,0,-91,8,-86,10,-82,-1,-83]);
  line(0xdbab96,1,[-9,-81,1,-83,11,-81]);
  poly(0x713e50,[-10,-82,-18,-77,-28-tail,-65,-17,-69,-12,-76]);
  poly(0xa96c7b,[-10,-80,-15,-71,-17-tail,-55,-12,-61,-9,-74]);
  poly(0x252a29,[-4,-65,2,-66,7,-64,9,-65,7,-58,1,-55,-3,-59]);
  line(0x625542,1,[1,-63,3,-59]);
 }
 const m=f.attack?heroMotion(id,f.step,phase):{x:17,y:-43};
 const hx=m.x,hy=m.y-5;
 // Sleeve and bracer follow the hand rather than stretching a rectangular arm.
 poly(cloth,[w-5,-58,w+2,-56,hx+3,hy-3,hx+4,hy+5,hx-3,hy+7,w-7,-49]);
 line(light,2,[w-2,-55,hx-3,hy+2]);
 line(metal,6,[hx-6,hy,hx,hy+2]);line(edge,1,[hx-7,hy-2,hx,hy]);
 if(huang){
  const bx=hx+7,draw=f.attack?[6,17,0,2,0][phase]:0;
  line(0x3e3021,5,[bx-2,hy-30,bx+9,hy-21,bx+14,hy,bx+9,hy+21,bx-2,hy+30]);
  line(0xc9a76b,2,[bx-2,hy-30,bx+7,hy-20,bx+11,hy,bx+7,hy+20,bx-2,hy+30]);
  line(0xe4dbbd,1,[bx-2,hy-30,bx-draw,hy,bx-2,hy+30]);
  if(!f.attack||phase<2){line(0xc8b58a,2,[bx-draw-8,hy,bx+37,hy]);poly(0xe1e5d2,[bx+37,hy-3,bx+44,hy,bx+37,hy+3]);}
  line(cloth,7,[-w+4,-53,-4,hy+10,bx-draw,hy]);
  g.fillStyle(skin).fillRect(bx-draw-3,hy-2,6,5);
 }else if(zhang||zhao){
  const angle=f.attack?(zhao?0:[-.65,-.8,.14,.35,-.2][phase]):-.65;
  const vx=Math.cos(angle),vy=Math.sin(angle);
  line(cloth,7,[-w+3,-53,hx-22*vx,hy-22*vy]);
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(angle);
  g.fillStyle(0x352b24).fillRect(-36,-2,95,5);g.fillStyle(0x9a825b).fillRect(-36,-2,95,1);
  for(const x of [-32,40,50])g.fillStyle(edge).fillRect(x,-3,3,7);
  if(zhang){
   poly(0x526a68,[55,-3,63,-9,68,-6,75,-10,83,-5,94,-2,82,2,75,-3,69,1,62,-2,55,3]);
   line(0xd7dfc9,2,[56,-3,63,-7,69,-4,75,-7,83,-3,94,-2]);
  }else{
   poly(0x6a8e97,[55,-4,65,-8,86,0,65,7,55,3]);
   poly(0xe5e8d8,[55,-3,65,-6,86,0,62,0]);
   poly(0x5f9ead,[50,2,47,14,37,22,44,9,45,2]);
   line(0xb6d3ce,1,[65,-5,65,4]);
  }
  g.restore();
  g.fillStyle(skin).fillRect(hx-24*vx-2,hy-24*vy-2,6,5);
 }else{
  g.save();g.translateCanvas(hx,hy);g.rotateCanvas(f.attack?[.65,.9,-.6,-1,-.3][phase]:-.55);
  g.fillStyle(0x49302a).fillRect(-8,-2,16,5);g.lineStyle(2,edge).strokeCircle(-11,1,4);
  g.fillStyle(edge).fillRect(7,-6,4,13);
  poly(0x51666b,[11,-3,39,-6,54,-12,50,-1,37,5,11,4]);
  poly(0xc1d3cf,[11,-3,39,-5,52,-10,45,-2,34,1,11,1]);
  line(0xf0e8cd,1,[11,4,37,5,50,-1,54,-12]);g.restore();
 }
 g.fillStyle(0x754e38).fillRect(hx-2,hy-2,7,7);g.fillStyle(skin).fillRect(hx-2,hy-2,6,4);g.fillStyle(0xe7c397).fillRect(hx-2,hy-2,5,1);
 if(f.attack&&phase>=2&&phase<=3&&!huang){
  if(zhao){g.lineStyle(2,0xc7eaf0,.7).lineBetween(hx+15,hy,hx+85,hy);}
  else {const r=zhang?66:39;g.lineStyle(f.step===3?5:3,zhang?0xf0cf95:0xefbca7,.7).beginPath().arc(18,-38,r,-1.6,.5).strokePath();}
 }
}
