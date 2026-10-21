import Phaser from 'phaser';
import {HEROES,HERO_IDS} from './heroes';
import {Campaign} from './combat';
import {drawGuanyu} from './guanyu';
import {drawWarrior} from './warriors';
export function selectionMarkup(){return `<div class="muster"><p class="eyebrow">BATTLE OF RED CLIFFS III · 五將出征</p><h2 id="select-title">選一員虎將，踏上征途。</h2><p class="select-hint">方向鍵 ← → 或 1–5 選將 · Enter 出陣</p><div class="hero-roster">${HERO_IDS.map((id,i)=>{const c=HEROES[id];return `<button class="hero-card" data-hero="${id}" aria-pressed="false" aria-label="${c.name}，${c.weapon}"><img data-portrait="${id}" alt="" width="180" height="180"><small>0${i+1} / ${c.title}</small><strong>${c.name}</strong><span>${c.weapon}</span></button>`;}).join('')}</div><p id="hero-detail"></p><button id="deploy-hero">以關羽出陣 ▶</button><button id="select-settings">設定／操作</button><p id="hero-record" class="hero-record"></p><p class="select-note">三國人物原創造型 · 一場出征，連闖五關</p></div>`;}
/** Generate four idle poses from the exact same graphics routines used in battle. */
export function createPortraits(scene:Phaser.Scene){
 return HERO_IDS.map(id=>{
  const frames:string[]=[];
  for(let frame=0;frame<4;frame++){
   const key=`muster-${id}-${frame}`;
   if(!scene.textures.exists(key)){
    const g=scene.make.graphics({x:0,y:0});g.fillStyle(0x142420).fillRect(0,0,180,180);
    g.fillStyle(0x0a1818,.7).fillEllipse(72,158,46,12);g.save();g.translateCanvas(72,155+(frame%2));
    const f=new Campaign(id).hero;if(id==='guanyu')drawGuanyu(g,f,frame,4);else drawWarrior(g,f,frame,4);
    g.restore();g.generateTexture(key,180,180);g.destroy();
   }
   frames.push(scene.textures.getBase64(key));
  }
  return frames;
 });
}
