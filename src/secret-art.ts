import type Phaser from 'phaser';import type {Supply} from './combat';
/** Small cracked wall inset, not a second ordinary chest. */
export function drawSecret(g:Phaser.GameObjects.Graphics,p:Supply,near:boolean){
 const x=p.x,y=p.y;g.fillStyle(0x42554e).fillRect(x-27,y-31,54,31);g.lineStyle(2,0x263d38).strokeRect(x-27,y-31,54,31);
 g.lineStyle(2,near?0xe3c787:0x8a9b7e).lineBetween(x-9,y-29,x-2,y-18).lineBetween(x-2,y-18,x-8,y-8).lineBetween(x-8,y-8,x+3,y-2);
 g.lineStyle(1,0x9f9971).lineBetween(x+14,y-25,x+19,y-20).lineBetween(x+19,y-20,x+14,y-15);
 if(p.hp<18)g.lineStyle(3,0xd7b87b).lineBetween(x-20,y-18,x+16,y-4);
}
