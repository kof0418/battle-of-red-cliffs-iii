import type Phaser from 'phaser';
export function drawHorse(g:Phaser.GameObjects.Graphics,x:number,y:number,face:number,time:number,moving:boolean){
 g.save();g.translateCanvas(x,y);g.scaleCanvas(face,1);
 const stride=moving?Math.sin(time*18)*13:0;
 g.fillStyle(0x101b1b,.35).fillEllipse(0,3,92,18);
 for(const [dx,step] of [[-27,stride],[22,-stride],[-16,-stride],[32,stride]]){
  g.lineStyle(7,0x533829).lineBetween(dx,-30,dx+step,-8).lineBetween(dx+step,-8,dx+step+5,0);g.fillStyle(0x1c2525).fillRect(dx+step-1,-3,13,6);
 }
 g.fillStyle(0x825332).fillEllipse(-2,-39,84,43);g.fillStyle(0xa97545).fillEllipse(2,-47,70,22);
 g.fillStyle(0x825332).fillTriangle(22,-37,37,-88,57,-58);g.fillEllipse(47,-76,27,29);g.fillEllipse(59,-68,25,13);
 g.fillStyle(0x302b25).fillTriangle(29,-47,29,-83,43,-88).fillTriangle(37,-86,37,-101,45,-86);
 g.lineStyle(7,0x302b25).lineBetween(-38,-46,-52,-33).lineBetween(-52,-33,-57,-19);
 g.fillStyle(0x171e20).fillRect(51,-82,4,4);g.fillStyle(0xf1dba7).fillRect(52,-82,2,2);
 g.lineStyle(2,0xdfb971).lineBetween(44,-85,55,-62).lineBetween(55,-62,4,-45);
 g.fillStyle(0x64332b).fillRect(-15,-59,29,15);g.lineStyle(3,0xd3ad68).strokeRect(-15,-59,29,15);
 g.restore();
}
export function drawGlaive(g:Phaser.GameObjects.Graphics,x:number,y:number,phase:number,attacking:boolean){
 g.save();g.translateCanvas(x,y);g.rotateCanvas(attacking?[-1.5,-1.2,-.2,.65,-.5][phase]:-.5);
 g.lineStyle(5,0x896039).lineBetween(-22,0,54,0);g.lineStyle(2,0xd9b577).lineBetween(-20,-1,53,-1);
 g.fillStyle(0x6d9697).fillTriangle(48,-4,80,-21,73,9);g.fillStyle(0xe0ece1).fillTriangle(80,-21,85,4,73,9);g.fillStyle(0xd4b46c).fillRect(44,-8,6,16);
 g.restore();g.fillStyle(0xd5ac7c).fillRect(x-4,y-3,8,7);
}
