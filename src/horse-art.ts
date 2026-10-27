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
export function drawGlaive(g:Phaser.GameObjects.Graphics,x:number,y:number,phase:number,attacking:boolean,angle?:number){
 g.save();g.translateCanvas(x,y);g.rotateCanvas(angle??(attacking?[-1.5,-1.2,-.2,.65,-.5][phase]:-.5));
 g.lineStyle(5,0x896039).lineBetween(-22,0,54,0);g.lineStyle(2,0xd9b577).lineBetween(-20,-1,53,-1);
 g.fillStyle(0x6d9697).fillTriangle(48,-4,80,-21,73,9);g.fillStyle(0xe0ece1).fillTriangle(80,-21,85,4,73,9);g.fillStyle(0xd4b46c).fillRect(44,-8,6,16);
 g.restore();g.fillStyle(0xd5ac7c).fillRect(x-4,y-3,8,7);
}

/** Original mounted silhouettes: own historical weapon, with an independent rear attack direction. */
export function drawMountedWeapon(g:Phaser.GameObjects.Graphics,f:import('./combat').Fighter,x:number,y:number,phase:number){
 const id=f.heroId??'guanyu',relative=f.grapplePose==='throw'?(f.grappleBack?-1:1):f.attack?f.attack.face*f.face:1,charging=f.attack?.move==='ride-charge';
 g.save();g.translateCanvas(x,y);g.scaleCanvas(relative,1);
 const throwing=f.grapplePose==='throw',throwAngle=(f.grappleProgress??0)<.36?-1.1:.65,attackAngle=f.step===2?0:f.step===3?(phase<2?-1.5:1.0):undefined;
 if(id==='huangzhong'){
  const pull=f.attack&&phase<2?14:0;
  g.lineStyle(5,0x513b26).beginPath().arc(12,0,29,-1.25,1.25).strokePath();g.lineStyle(2,0xe2c78f).beginPath().arc(12,0,27,-1.25,1.25).strokePath();
  g.lineStyle(1,0xf3dfb5).lineBetween(21,-26,14-pull,0).lineBetween(14-pull,0,21,26);
  if(!f.attack||phase<2){g.lineStyle(2,0xc4aa74).lineBetween(-8-pull,0,44,0);g.fillStyle(0xe0e7db).fillTriangle(52,0,42,-4,42,4);}
 }else if(id==='guanyu'){drawGlaive(g,0,0,charging?2:phase,!!f.attack,throwing?throwAngle:charging?0:attackAngle);}
 else{
  const angle=throwing?throwAngle:charging?0:f.attack?(attackAngle??[-1,-.65,0,.5,-.35][phase]):-.4;g.rotateCanvas(angle);
  if(id==='weiyan'){
   g.lineStyle(5,0x67432e).lineBetween(-10,0,8,0);g.lineStyle(3,0xd7b66e).lineBetween(7,-8,7,8);g.fillStyle(0xadc8c6).fillTriangle(10,-4,65,-12,53,5);g.lineStyle(2,0xf0ecd4).lineBetween(10,4,53,5);
  }else{
   g.lineStyle(5,0x6e4f32).lineBetween(-35,0,58,0);g.lineStyle(2,0xd0b073).lineBetween(-34,-1,58,-1);
   g.fillStyle(0xc0d6d6).fillTriangle(55,-5,id==='lubu'?98:88,0,55,5);
   if(id==='zhangfei')g.lineStyle(3,0xd7e4d5).lineBetween(55,-3,65,-8).lineBetween(65,-8,74,-4).lineBetween(74,-4,81,-7);
   if(id==='lubu'){g.lineStyle(5,0xbad0ce).beginPath().arc(65,0,21,-1.5,-.25).strokePath();g.beginPath().arc(65,0,21,.25,1.5).strokePath();}
  }
 }
 if(f.attack&&phase>=2&&phase<=3&&id!=='huangzhong')g.lineStyle(f.step===3?5:2,0xf0d7a1,.65).beginPath().arc(0,0,68,-1.2,.6).strokePath();
 g.restore();g.fillStyle(0xd5ac7c).fillRect(x-4,y-3,8,7);
}
