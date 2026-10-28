import type Phaser from 'phaser';import {WORLD_WIDTH,arenaStart,type Level} from './levels';
/** Four original panoramas, cached by the existing tiled scenery renderer. */
export function drawFinalBackground(scene:Phaser.Scene,l:Level){
 const layer=scene.add.container(0,0).setDepth(-100),g=scene.add.graphics();layer.add(g);
 const bridge=l.theme==='bridge',fleet=l.theme==='fleet',fire=l.theme==='inferno',gorge=l.theme==='gorge';
 const sky=bridge?0x243347:fleet?0x29495a:fire?0x4c252a:0x867858,water=bridge?0x294f5d:fleet?0x285969:0x493c43;
 g.fillStyle(sky).fillRect(0,0,WORLD_WIDTH,540);
 for(let i=0;i<32;i++){const x=i*200;g.fillStyle(gorge?0x6a6855:0x253e50).fillTriangle(x-100,320,x+70,95+(i%4)*32,x+260,320);g.fillStyle(gorge?0xa18c62:0x40596b,.45).fillTriangle(x+70,95+(i%4)*32,x+95,260,x+260,320);}
 g.fillStyle(gorge?0xd5b876:fire?0xdd8a51:0xc5cfc1,.65).fillCircle(750,135,gorge?46:32);
 if(!gorge){g.fillStyle(water).fillRect(0,245,WORLD_WIDTH,295);for(let i=0;i<700;i++)g.fillStyle(i%3?0x6d9699:0xb3b4a1,.35).fillRect(i*137%WORLD_WIDTH,260+i*31%270,12+i%27,2);}
 const floor=bridge?0x656f70:fleet?0x6b5847:fire?0x594337:0x81745a;
 g.fillStyle(floor).fillRect(0,338,WORLD_WIDTH,180);
 for(let x=0;x<WORLD_WIDTH;x+=42)for(let row=0;row<5;row++){g.lineStyle(1,bridge?0x3c4b54:0x3c3d35,.7).strokeRect(x+row%2*20,342+row*35,41,34);g.fillStyle(0xd2bb8c,.2).fillRect(x+4,346+row*35,12,2);}
 g.fillStyle(0x263d40).fillRect(0,520,WORLD_WIDTH,20);
 for(let n=0;n<l.sections.length;n++){
  const base=arenaStart(n+1,l),x=base+100,span=(l.ends??[])[n]-base;
  layer.add(scene.add.text(x,304,`${n+1} · ${l.sections[n]}`,{fontFamily:'serif',fontSize:'17px',color:'#eee0b2'}));
  if(bridge){
   for(let dx=0;dx<span;dx+=180){const p=base+dx;g.fillStyle(0x869092).fillRect(p,317,19,33).fillRect(p,505,19,32);g.fillStyle(0xc0c5b5).fillRect(p-3,314,25,7);g.lineStyle(5,0x9a9f91).lineBetween(p+9,326,p+178,326).lineBetween(p+9,515,p+178,515);}
   const tower=x+430;g.fillStyle(0x455561).fillRect(tower,180,100,151);for(let r=0;r<6;r++)for(let c=0;c<4;c++)g.lineStyle(1,0x81918c).strokeRect(tower+c*25,180+r*24,24,23);g.fillStyle(0x1e2e38).fillRect(tower+32,253,38,78);g.fillStyle(0x263543).fillTriangle(tower-20,180,tower+50,120,tower+120,180);g.lineStyle(4,0xb0a376).lineBetween(x-40,270,tower+50,160).lineBetween(tower+50,160,tower+400,260);
   for(let j=0;j<5;j++)g.lineStyle(2,0xb6aa82).lineBetween(x+j*90,268-j*18,x+j*90,329);
  }else if(fleet||fire){
   const mast=x+370;g.fillStyle(fire?0x37272b:0x685039).fillRect(mast,92,12,245);g.lineStyle(3,0xb39b70).lineBetween(mast-165,286,mast+6,108).lineBetween(mast+6,108,mast+170,286);
   g.fillStyle(fire?0x813a30:0xb1aa83).fillTriangle(mast+16,115,mast+16,268,mast+160,255);for(let y=140;y<262;y+=23)g.lineStyle(2,fire?0x3d2c27:0x7a856f).lineBetween(mast+20,y,mast+110,y+10);
   g.fillStyle(0x3c3d35).fillRect(x+590,245,125,89);g.fillStyle(0x88724c).fillRect(x+586,239,133,12);for(let c=0;c<5;c++)g.lineStyle(2,0xb59d65).lineBetween(x+600+c*23,254,x+600+c*23,332);
   for(let j=0;j<4;j++){const bx=x+j*65;g.fillStyle(0x433c30).fillRect(bx,276,50,55);g.lineStyle(3,0x9c8359).strokeRect(bx,276,50,55).lineBetween(bx,276,bx+50,331);}
   if(fire){for(let j=0;j<7;j++){const fx=x+180+j*45;g.fillStyle(0xa4482c).fillTriangle(fx,333,fx+20,240-j%3*24,fx+45,333);g.fillStyle(0xed9a42).fillTriangle(fx+10,330,fx+24,275,fx+36,330);g.fillStyle(0xf5d179).fillTriangle(fx+19,327,fx+27,300,fx+31,327);g.fillStyle(0x2a292d,.6).fillEllipse(fx-20,180,55,90);}for(let j=0;j<30;j++)g.fillStyle(0xf2bd6d,.7).fillRect(x+j*23,145+j*53%180,2,3);}
   else{for(let j=0;j<5;j++)g.lineStyle(3,0xb5a378).strokeEllipse(x+30+j*55,320,42,12);g.fillStyle(0x223740).fillRect(x+780,192,72,142);g.fillStyle(0x768f8d).fillRect(x+771,186,90,10);}
  }else{
   for(const side of [0,740]){const c=x+side;g.fillStyle(0x605e4d).beginPath().moveTo(c-80,337).lineTo(c-45,285).lineTo(c-55,250).lineTo(c-5,218).lineTo(c+30,156).lineTo(c+49,196).lineTo(c+45,235).lineTo(c+94,275).lineTo(c+118,292).lineTo(c+165,337).closePath().fillPath();g.fillStyle(0xa18e64).beginPath().moveTo(c+30,156).lineTo(c+49,196).lineTo(c+45,235).lineTo(c+94,275).lineTo(c+118,292).lineTo(c+165,337).lineTo(c+45,310).closePath().fillPath();for(let r=0;r<6;r++)g.lineStyle(2,0x4b5149).lineBetween(c-r*7,220+r*17,c+75+r*7,233+r*17);}
   g.fillStyle(0x4e4434).fillRect(x+320,243,120,91);g.fillStyle(0xa49061).fillTriangle(x+295,246,x+380,187,x+465,246);g.fillStyle(0x302f2a).fillRect(x+359,281,44,53);g.lineStyle(4,0xd4bc85).lineBetween(x+300,246,x+460,246);
   for(let j=0;j<7;j++)g.fillStyle(0x9f916e).fillEllipse(x+j*95,329,36,12);
  }
 }
 layer.add(scene.add.text(28,277,l.title,{fontFamily:'serif',fontSize:'22px',color:'#f0dbac'}));
 return layer;
}
