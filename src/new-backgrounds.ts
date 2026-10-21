import Phaser from 'phaser';
import {WORLD_WIDTH,arenaStart,type Level} from './levels';
/** Original pixel scenery for the forest, alpine fortress and imperial city. */
export function drawNewBackground(scene:Phaser.Scene,level:Level){
 const layer=scene.add.container(0,0).setDepth(-100),g=scene.add.graphics();layer.add(g);
 const forest=level.theme==='bamboo',snow=level.theme==='snow';
 g.fillStyle(forest?0x243e38:snow?0x8cabbc:0x3b2732).fillRect(0,0,WORLD_WIDTH,540);
 for(let i=0;i<42;i++){const x=i*150;g.fillStyle(forest?0x1d352f:snow?0x526f88:0x6e4140).fillTriangle(x-90,310,x+70,100+i%4*30,x+250,310);if(snow)g.fillStyle(0xd9e3e4).fillTriangle(x+30,155+i%4*30,x+70,100+i%4*30,x+116,164+i%4*30);}
 g.fillStyle(forest?0x162c2a:snow?0x7798a9:0x4f3533).fillRect(0,270,WORLD_WIDTH,75);
 g.fillStyle(forest?0x4b5541:snow?0xc1cbd0:0x64594f).fillRect(0,335,WORLD_WIDTH,205);
 for(let x=0;x<WORLD_WIDTH;x+=65){
  if(forest){g.fillStyle(0x68816a,.25).fillEllipse(x,347,80,10);}
  else{for(let row=0;row<5;row++)g.lineStyle(1,snow?0x889fa9:0x3c3736,.5).strokeRect(x+(row%2)*32,345+row*38,64,36);}
 }
 if(forest){
  for(let x=0;x<WORLD_WIDTH;x+=53){const top=115+(x*13)%100;g.fillStyle(x%3?0x315b42:0x52784d).fillRect(x,top,7,222-top);g.fillRect(x+5,top,5,335-top);for(let y=top+13;y<325;y+=27){g.fillStyle(0x8c9d66).fillRect(x, y,10,3);g.lineStyle(2,0x3a694a).lineBetween(x+4,y,x-24,y-19).lineBetween(x+6,y,x+32,y-12);g.fillStyle(0x73916a).fillTriangle(x-25,y-19,x-5,y-29,x-12,y-14).fillTriangle(x+16,y-17,x+36,y-12,x+26,y-7);}}
  g.fillStyle(0x91b991,.08).fillRect(0,230,WORLD_WIDTH,27);
 }else if(snow){
  for(let x=0;x<WORLD_WIDTH;x+=150){g.fillStyle(0x354f60).fillRect(x+25,231,7,105);for(let k=0;k<3;k++){g.fillStyle(0x496874).fillTriangle(x-4-k*5,280+k*19,x+29,202+k*22,x+61+k*5,280+k*19);g.fillStyle(0xd1e1e0).fillTriangle(x+7-k*4,257+k*19,x+29,202+k*22,x+47+k*4,257+k*19);}}
  for(let i=0;i<850;i++)g.fillStyle(0xe8efec,.65).fillRect(i*173%WORLD_WIDTH,95+i*37%440,2,2);
 }else{
  for(let x=0;x<WORLD_WIDTH;x+=210){g.fillStyle(0x883f32).fillRect(x+12,221,135,109);g.fillStyle(0x242e30).fillTriangle(x-12,224,x+78,170,x+172,224);g.lineStyle(4,0xc4a466).lineBetween(x-10,224,x+170,224);g.fillStyle(0x42282a).fillRect(x+49,259,55,71);for(let n=0;n<4;n++)g.lineStyle(2,0x99704a).lineBetween(x+53+n*14,261,x+53+n*14,326);}
 }
 for(let section=0;section<6;section++){
  const x=arenaStart(section+1)+150;
  if(forest){
   if(section%2===0){g.fillStyle(0x345f63).fillRect(x+110,305,340,28);for(let n=0;n<14;n++)g.fillStyle(0x88b8a5,.6).fillRect(x+120+n*22,312+n%3*5,15,2);g.fillStyle(0x888d73).fillRect(x+195,284,170,14);for(let n=0;n<5;n++)g.fillRect(x+195+n*40,282,8,40);}
   else{g.fillStyle(0x80694c).fillRect(x+220,238,130,91);g.fillStyle(0x323e32).fillTriangle(x+190,240,x+282,190,x+375,240);g.fillStyle(0x24352d).fillRect(x+265,270,41,59);g.lineStyle(3,0xa69968).lineBetween(x+195,240,x+370,240);}
   for(let n=0;n<6;n++)g.fillStyle(0x70876a).fillEllipse(x+n*87,327,42,17);
  }else if(snow){
   const tower=x+230;g.fillStyle(0x536779).fillRect(tower,187,160,147);for(let row=0;row<5;row++)for(let col=0;col<5;col++)g.lineStyle(1,0x9aa9af).strokeRect(tower+col*32,195+row*27,31,26);
   g.fillStyle(0xe2e9e6).fillRect(tower-12,181,184,13);for(let n=0;n<5;n++){g.fillStyle(0x6b7c89).fillRect(tower+n*34,162,24,22);g.fillStyle(0xecf0eb).fillRect(tower+n*34-3,158,30,5);g.fillStyle(0xc2dbe0).fillTriangle(tower+n*34,194,tower+n*34+6,218,tower+n*34+9,194);}
   g.fillStyle(0x243f51).fillRect(tower+55,269,48,65);g.fillStyle(0x78a7b9).fillEllipse(x+500,318,130,25);g.lineStyle(2,0xcde5e5).lineBetween(x+450,313,x+530,322);
  }else{
   const palace=x+260;g.fillStyle(0x9d4939).fillRect(palace,215,210,119);g.fillStyle(0x27292a).fillTriangle(palace-35,219,palace+105,145,palace+245,219);g.lineStyle(5,0xd0ae60).lineBetween(palace-35,219,palace+245,219);g.fillStyle(0x38272b).fillRect(palace+72,260,68,74);
   for(const dx of [15,184]){g.fillStyle(0xc4a573).fillRect(palace+dx,222,9,110);g.fillStyle(0x8a3a2d).fillRect(palace+dx-10,240,29,32);g.fillStyle(0xf3b267).fillRect(palace+dx-7,245,23,20);}
   for(let n=0;n<4;n++){const fx=x+40+n*26;g.fillStyle(0x9b4b2d).fillTriangle(fx,330,fx+17,266-n%2*20,fx+34,330);g.fillStyle(0xe69a48).fillTriangle(fx+7,327,fx+19,287,fx+27,327);g.fillStyle(0xf4cf80).fillTriangle(fx+13,324,fx+20,304,fx+24,324);}
  }
  layer.add(scene.add.text(x,303,`${section+1} · ${level.sections[section]}`,{fontFamily:'serif',fontSize:'16px',color:snow?'#f1efdc':'#d4c9a0'}));
 }
 for(let i=0;i<650;i++){const x=i*137%WORLD_WIDTH,y=348+i*43%185;g.fillStyle(forest?0x99a56a:snow?0xf0f0df:0xbb9970,.35).fillRect(x,y,forest?7:4,2);}
 return layer;
}
