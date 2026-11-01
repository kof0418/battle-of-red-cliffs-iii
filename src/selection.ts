import Phaser from 'phaser';
import {HEROES,HERO_IDS} from './heroes';
import {Campaign} from './combat';
import {drawGuanyu} from './guanyu';
import {drawWarrior} from './warriors';
export function selectionMarkup(){return `<div class="muster"><p class="eyebrow">BATTLE OF RED CLIFFS III · 六將出征</p><h2 id="select-title">選一員虎將，踏上征途。</h2><p class="select-hint">方向鍵 ← → 或 1–6 選將 · Enter 出陣</p><div class="coop-options"><label>戰役 <select id="campaign-length"><option value="full" selected>完整九關・江岸決戰</option><option value="short">五關短戰役</option></select></label><label>起始關卡 <select id="start-stage" aria-describedby="start-stage-help"></select></label><label>遊玩模式 <select id="play-mode"><option value="solo">單人出征</option><option value="coop">本機雙人合作</option></select></label><label id="partner-choice" hidden>2P 武將 <select id="partner-hero">${HERO_IDS.map(id=>`<option value="${id}" ${id==='zhangfei'?'selected':''}>${HEROES[id].name}</option>`).join('')}</select></label><p id="start-stage-help">從第一關開始可記錄完整戰役成績。</p><p id="coop-help" hidden>1P：WASD＋J／K／L　2P：方向鍵＋U／I／O（或數字鍵盤 1／2／3）。第一支手把操作 2P，第二支操作 1P。雙人共用兩次續關，無友軍傷害。</p></div><section class="mission-brief"><h3 id="mission-title"></h3><p id="mission-goal"></p><details><summary>查看本次戰役路線</summary><div id="select-route"></div></details></section><div class="hero-roster">${HERO_IDS.map((id,i)=>{const c=HEROES[id];return `<button class="hero-card" data-hero="${id}" aria-pressed="false" aria-label="${c.name}，${c.weapon}"><img data-portrait="${id}" alt="" width="180" height="180"><small>0${i+1} / ${c.title}</small><strong>${c.name}</strong><span>${c.weapon}${id==='lubu'?' · 額外武將':''}</span></button>`;}).join('')}</div><p id="hero-detail"></p><section id="hero-abilities" aria-label="武將能力與特色"></section><button id="deploy-hero">以關羽出陣 ▶</button><button id="select-training">以此武將試招</button><button id="select-settings">設定／操作</button><p id="hero-record" class="hero-record"></p><p class="select-note">三國人物原創造型 · 九關完整戰役，亦可選五關短戰役</p></div>`;}
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
