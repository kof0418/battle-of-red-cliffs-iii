/// <reference types="vite/client" />
import {cacheScenery} from './scenery-cache';
import {PerformanceQA} from './performance-qa';
import {drawStageProp} from './stage-props';
import {PROPS,RHYTHMS} from './encounters';
import {DIFFICULTIES,bossPhase} from './tactics';
import {drawHorse} from './horse-art';
import {drawLoot,drawWeapon} from './loot-art';
import {WEAPONS} from './loot';
import {WORLD_WIDTH,LEVELS} from './levels';
import {CommandBank,type InputSource} from './command-input';
import {TouchInput,directionAt,touchLayout} from './touch-input';
import {enterFullscreen,toggleFullscreen} from './immersive';
import {THROWS,bossGrabWindow} from './throws';
import {SPECIALS} from './specials';
import Phaser from 'phaser';
import {UserSettings} from './user-settings';
const profileStorage = new UserSettings();
import { FixedStep } from './fixed-step';
import { PAD_ACTIONS,PAD_LABELS,DEFAULT_PAD_BINDINGS,remapPad,ACTIONS, ACTION_LABELS, DEFAULT_BINDINGS, CONTROL_KEY, VALID_KEYS, parseBindings, remap, keyAction, PadInput, type Bindings, type Action } from './controls';
let bindings: Bindings = {...DEFAULT_BINDINGS};
try { bindings = parseBindings(JSON.parse(profileStorage.getItem(CONTROL_KEY) ?? 'null')); } catch {}
const keyboardHeld = new Set<string>();
import { Soundtrack } from './audio';
import { readPreferences, PREFERENCES_KEY } from './preferences';
import { parseRecords, recordVictory, recordsKey, bestKey, type Records } from './records';
let preferences = readPreferences({ getItem: key => profileStorage.getItem(key) });
const soundtrack = new Soundtrack(); soundtrack.configure(preferences);
let settingsOpen = false;
let pendingExit:'title'|'select'|null=null;
let titleScreen = true;
let settingsReturnFocus: HTMLElement | null = null;
let records: Records = {};
try { records = parseRecords(JSON.parse(profileStorage.getItem(recordsKey(preferences.difficulty)) ?? '{}')); } catch { /* optional storage */ }
window.addEventListener('pointerdown', () => soundtrack.unlock(), { capture: true });
window.addEventListener('keydown', () => soundtrack.unlock(), { capture: true });
import { HEROES, HERO_IDS, type HeroId } from './heroes';
import { selectionMarkup, createPortraits } from './selection';
let selectedHero: HeroId = 'guanyu';
document.querySelector('#hero-select')!.innerHTML = selectionMarkup();
function setText(selector: string, value: string) { const el = document.querySelector(selector)!; if (el.textContent !== value) el.textContent = value; }
import './style.css';
import { desktop } from './desktop';
if (desktop) {
 document.documentElement.classList.add('desktop');
 document.querySelector('.tag')!.textContent = 'MAC EDITION / v1.11.0';
}
import { Campaign, isBoss, nearPickup, type Input, type Effect } from './combat';
import { Actor } from './actor';
import { drawBackground } from './background';

const held = new Set<string>(), pressed = new Set<string>();
const commands=new CommandBank(),touchInput=new TouchInput();let directionPointer:number|null=null;
function queueAction(action:string,source:InputSource='keyboard'){
 const scene=current(),m=scene?.model;
 if(m?.grapple){commands.reset();if(action==='attack'){
  const keys=[...keyboardHeld].map(k=>keyAction(k,bindings));
  if(keys.includes('left')||held.has('left')||scene.padHeld.has('left'))pressed.add('throw-left');
  else if(keys.includes('right')||held.has('right')||scene.padHeld.has('right'))pressed.add('throw-right');
 }pressed.add(action);return;}
 if(m?.status==='playing'&&!m.paused&&!settingsOpen&&commands.press(source,action,performance.now(),!!m.hero.mounted))pressed.add(m.hero.mounted?'horse-special':'command-special');
 else pressed.add(action);
}
function clearTouches(){touchInput.reset();directionPointer=null;held.clear();document.querySelectorAll('#touch .is-held').forEach(el=>el.classList.remove('is-held'));}
function syncTouches(){held.clear();for(const action of touchInput.held)held.add(action);document.querySelectorAll<HTMLElement>('#touch [data-key]').forEach(el=>el.classList.toggle('is-held',held.has(el.dataset.key!)));}
const touchDevice=navigator.maxTouchPoints>0||matchMedia('(any-pointer:coarse)').matches;
if(touchDevice)document.body.classList.add('touch-controls');
function syncViewport(){
 const width=window.visualViewport?.width??innerWidth,height=window.visualViewport?.height??innerHeight,layout=touchLayout(width,height,preferences.largeTouch);
 const style=document.documentElement.style;style.setProperty('--screen-w',`${width}px`);style.setProperty('--screen-h',`${height}px`);style.setProperty('--pad-cell',`${layout.cell}px`);style.setProperty('--action-size',`${layout.action}px`);style.setProperty('--utility-top',`${layout.landscape?Math.round(height*.18):10}px`);
}
syncViewport();
async function mobileFullscreen(){if(touchDevice){await enterFullscreen(document);syncViewport();requestAnimationFrame(()=>current()?.scale.refresh());}}

let muted = preferences.muted;
function tone(frequency = 130, duration = .07) { soundtrack.effect(frequency, duration); }
function readBest() { try { const n = Number(profileStorage.getItem(bestKey(preferences.difficulty))); return Number.isFinite(n) && n >= 0 && n <= 1e8 ? n : 0; } catch { return 0; } }
class Battle extends Phaser.Scene {
  private posePreview=false;
  private performanceQA?:PerformanceQA;
  model = new Campaign(selectedHero,preferences.difficulty,1+Math.floor(Math.random()*3)); actors = new Map<number, Actor>();
  propLabel!:Phaser.GameObjects.Text;
  hud!: Phaser.GameObjects.Graphics; danger!: Phaser.GameObjects.Graphics;
  supplies!: Phaser.GameObjects.Graphics; backdrop?: Phaser.GameObjects.Container; drawnStage = -1;
  label!: Phaser.GameObjects.Text; healthLabel!: Phaser.GameObjects.Text; stageLabel!: Phaser.GameObjects.Text; scoreLabel!: Phaser.GameObjects.Text; notice!: Phaser.GameObjects.Text; combo!: Phaser.GameObjects.Text; bossLabel!: Phaser.GameObjects.Text;
  overlay?: Phaser.GameObjects.Container; overlayState = ''; best = readBest(); recorded = false;
  portraits:string[][]=[]; portraitFrame=-1; selectionKey=''; shellKey='';progressKey='';

  clock = new FixedStep();
  pad = new PadInput();padHeld=new Set<string>();padConnected=false;
  autoAttackAt = 0;
  constructor() { super('Battle'); }
  create() {
    const restore=()=>{this.drawnStage=-1;this.shellKey='';};this.game.renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL,restore);
    this.events.once('shutdown',()=>{soundtrack.pause();this.game.renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL,restore);this.actors.clear();});
    this.portraits=createPortraits(this);this.portraitFrame=-1;this.selectionKey='';this.shellKey='';
    this.model = new Campaign(selectedHero,preferences.difficulty,1+Math.floor(Math.random()*3)); this.actors.clear(); this.overlayState = ''; this.overlay = undefined; this.recorded = false; this.drawnStage = -1; this.backdrop = undefined;
    selectedHero = this.model.hero.heroId ?? 'guanyu';
    this.clock.reset(); this.pad.reset();this.padHeld.clear();clearTouches(); keyboardHeld.clear();
    this.autoAttackAt = 0;setText('#command-feedback','');
    document.querySelector('#sound')!.textContent = `聲音：${muted ? '關' : '開'}`;
    clearTouches(); pressed.clear();commands.reset();
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 540);
    this.supplies = this.add.graphics().setDepth(349.5);
    this.danger = this.add.graphics().setDepth(349);
    // Keyboard actions use physical codes and the saved binding map.
    // Event buffering avoids missing a short tap between rendered frames.
    const onKey = (event: KeyboardEvent) => {
      if(titleScreen && !settingsOpen){if(event.code==='Enter'){event.preventDefault();document.querySelector<HTMLButtonElement>('#title-start')!.click();}return;}
      if (settingsOpen || event.ctrlKey || event.metaKey || event.altKey) return;
      const mapped = keyAction(event.code, bindings);
      if (mapped) { event.preventDefault(); keyboardHeld.add(event.code); }
      if (event.repeat) return;
      if (this.model.status === 'ready') {
        let index = HERO_IDS.indexOf(selectedHero);
        if (event.code === 'ArrowRight') index = (index + 1) % HERO_IDS.length;
        else if (event.code === 'ArrowLeft') index = (index + HERO_IDS.length - 1) % HERO_IDS.length;
        else if (/^Digit[1-6]$/.test(event.code)) index = Number(event.code.slice(-1)) - 1;
        else index = -1;
        if (index >= 0) { event.preventDefault(); selectedHero = HERO_IDS[index]; this.model.selectHero(selectedHero); return; }
      }
      if (mapped) queueAction(mapped);
    };
    window.addEventListener('keydown', onKey);
    this.events.once('shutdown', () => window.removeEventListener('keydown', onKey));
    const onPointer = () => this.activate();
    this.input.on('pointerdown', onPointer);
    this.events.once('shutdown', () => this.input.off('pointerdown', onPointer));
    this.propLabel=this.add.text(0,0,'',{fontFamily:'sans-serif',fontSize:'12px',color:'#f2d896',stroke:'#1b3028',strokeThickness:3}).setOrigin(.5).setDepth(8000);
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(9000);
    this.label = this.add.text(26, 20, '', { fontFamily: 'monospace', fontSize: '15px', color: '#f0dfae' }).setScrollFactor(0).setDepth(9001);
    this.healthLabel = this.add.text(26, 36, '', { fontFamily:'sans-serif', fontSize:'11px',color:'#d8c99f' }).setScrollFactor(0).setDepth(9001);
    this.stageLabel = this.add.text(480, 18, '', {fontFamily:'monospace',fontSize:'14px',color:'#f0dfae',align:'center',lineSpacing:5}).setOrigin(.5,0).setScrollFactor(0).setDepth(9001);
    this.scoreLabel = this.add.text(930, 18, '', {fontFamily:'monospace',fontSize:'14px',color:'#f0dfae',align:'right',lineSpacing:5}).setOrigin(1,0).setScrollFactor(0).setDepth(9001);
    this.notice = this.add.text(480, 111, '', { fontFamily: 'sans-serif', fontSize: '17px', color: '#f4d28d', stroke: '#1d2d28', strokeThickness: 4 }).setOrigin(.5).setScrollFactor(0).setDepth(9001);
    this.combo = this.add.text(920, 125, '', { fontFamily: 'monospace', fontSize: '38px', color: '#f9d38a', align: 'right', stroke: '#25312b', strokeThickness: 4 }).setOrigin(1, 0).setScrollFactor(0).setDepth(9001);
    this.bossLabel = this.add.text(480, 483, '', { fontFamily: 'sans-serif', fontSize: '13px', color: '#f9d38a',stroke:'#172022',strokeThickness:3 }).setOrigin(.5).setScrollFactor(0).setDepth(9001);
    // Local visual QA fixture. Vite removes this branch from production builds.
    if (import.meta.env.DEV) {
      const preview = new URLSearchParams(location.search).get('preview');
      if(preview)titleScreen=false;
      if(preview==='warrior-motion'){
        this.posePreview=true;
        const params=new URLSearchParams(location.search),pose=params.get('pose'),combo=Math.max(1,Math.min(3,Number(params.get('combo'))||1));
        this.model.start();this.model.enemies=[];this.model.supplies=[];this.model.barrels=[];this.model.paused=true;
        HERO_IDS.forEach((id,i)=>{
          const f=i===0?this.model.hero:this.model.fighter('hero',0,0);f.heroId=id;f.x=140+(i%3)*310;f.y=i<3?270:470;f.face=1;f.step=combo;
          if(pose==='grapple'){f.grapplePose='hold';const e=this.model.fighter('heavy',f.x+27,f.y);e.grapplePose='held';e.face=-1;this.model.enemies.push(e);}
          else if(pose==='slam'){f.grapplePose='throw';f.grappleProgress=.6;f.z=25;const e=this.model.fighter('heavy',f.x+16,f.y);e.grapplePose='thrown';e.throwSpin=90;e.z=49;e.face=-1;this.model.enemies.push(e);}
          else {const spec=this.model.slash(combo);f.attack={move:pose==='air'?'aerial':pose==='styles'&&id==='huangzhong'?'bow-strike':pose==='styles'&&id==='weiyan'?'kick':'slash',elapsed:spec.impact,duration:spec.duration,impact:spec.impact,hit:true,face:1,x:f.x,y:f.y};if(pose==='air'){f.z=45;f.vz=-160;}}
          if(i)this.model.enemies.push(f);
        });
        this.model.message='六將動作檢查';this.model.messageUntil=99;
      }
      if(preview==='mounted-roster'){
        this.posePreview=true;this.model.start();this.model.enemies=[];this.model.supplies=[];this.model.barrels=[];this.model.paused=true;
        HERO_IDS.forEach((id,i)=>{
          const f=i===0?this.model.hero:this.model.fighter('hero',0,0);f.heroId=id;f.x=135+(i%3)*310;f.y=i<3?290:490;f.face=1;f.mounted=true;f.step=3;
          f.attack={move:'mounted',elapsed:.23,duration:.56,impact:.22,hit:true,face:id==='weiyan'?-1:1,x:f.x,y:f.y};if(i)this.model.enemies.push(f);
          this.add.text(f.x,f.y-165,HEROES[id].name+(id==='weiyan'?' · 回身攻擊':id==='huangzhong'?' · 馬上弓箭':''),{fontFamily:'sans-serif',fontSize:'16px',color:'#f4d28d'}).setOrigin(.5).setDepth(9002);
        });
        this.model.message='六將馬戰 · 原配兵器';this.model.messageUntil=99;
      }
      if(preview==='cavalry'){
        this.model.stage=1;this.model.start();this.model.hero.x=350;this.model.hero.mounted=true;this.model.hero.inv=99;this.model.supplies=[];this.model.barrels=[];
        const safe=new URLSearchParams(location.search).has('safe');const e=this.model.fighter('marshal',safe?500:580,412);e.mounted=true;e.cooldown=safe?99:.3;this.model.enemies=[e];this.model.pending=[];
      }
      if(preview==='throws'){
        this.posePreview=true;this.model.start();this.model.enemies=[];this.model.supplies=[];this.model.barrels=[];this.model.paused=true;
        const samples=[{kind:'soldier' as const,x:165,back:false,title:'向前拋摔'},{kind:'mauler' as const,x:485,back:true,title:'重裝過肩背摔'},{kind:'boss' as const,x:800,back:true,title:'頭目抓摔'}];
        samples.forEach((sample,i)=>{
          const q=new Campaign(i===1?'zhangfei':'guanyu');q.start();q.hero.x=sample.x;q.hero.y=420;
          const target=q.fighter(sample.kind,sample.x+25,420);q.enemies=[target];q.tryGrab({x:1,y:0});q.beginThrow(sample.back?-1:1,false);q.updateGrapple(.15,{x:0,y:0});
          q.hero.id=1100+i*2;target.id=1101+i*2;if(i===0)this.model.hero=q.hero;else this.model.enemies.push(q.hero);this.model.enemies.push(target);
          this.add.text(sample.x,220,sample.title,{fontFamily:'sans-serif',fontSize:'16px',color:'#f4d28d'}).setOrigin(.5).setDepth(9002);
        });
        this.model.message='前摔／背摔與重量差異';this.model.messageUntil=99;
      }
      if(preview==='tactics'){
        this.posePreview=true;this.model.stage=4;this.model.start();this.model.wave=6;this.model.hero.x=280;this.model.supplies=[];this.model.barrels=[];
        const boss=this.model.fighter('regent',500,412);boss.hp=boss.max*.25;boss.attack={move:'cross',elapsed:.5,duration:1.47,impact:.87,hit:false,face:-1,x:280,y:412};
        const shield=this.model.fighter('heavy',710,430);shield.guard=.6;shield.face=-1;
        const raider=this.model.fighter('raider',160,365);raider.moving=true;this.model.enemies=[boss,shield,raider];this.model.paused=true;this.model.message='十字斬 · 離開交叉線';this.model.messageUntil=99;
      }
      if(preview==='stage-grade'){this.model.start();this.model.stageResults=[{stage:0,seconds:128,damage:24,retries:0,bestHit:24,interactions:2,grade:'S',points:96,bonus:5000}];this.model.status='stage-clear';this.model.wave=6;this.model.enemies=[];this.model.pending=[];}
      if(preview==='stage-prop'){this.posePreview=true;this.model.stage=Math.max(0,Math.min(4,Number(new URLSearchParams(location.search).get('stage'))||0));this.model.start();this.model.spawn();this.model.pending=[];this.model.hero.x=500;this.model.hero.y=354;this.model.paused=true;this.model.message=RHYTHMS[this.model.stage];this.model.messageUntil=99;}
      if(preview==='rescue'){this.model.start();this.model.hero.x=480;this.model.supplies=[];this.model.barrels=[];this.model.enemies=[this.model.fighter('soldier',430,412),this.model.fighter('heavy',535,412)];this.model.enemies.forEach(e=>e.cooldown=99);}
      if(preview==='scenery'){
        const params=new URLSearchParams(location.search);this.model.stage=Math.max(0,Math.min(4,Number(params.get('stage'))||0));this.model.start();this.model.cameraLeft=Math.max(0,Math.min(WORLD_WIDTH-960,Number(params.get('scroll'))||600));this.model.hero.x=this.model.cameraLeft+480;this.model.enemies=[];this.model.pending=[];this.model.paused=true;this.posePreview=true;
        const button=document.createElement('button');button.id='restore-probe';button.textContent='驗證背景恢復';button.style.cssText='position:fixed;z-index:99999;top:8px;left:8px';document.body.append(button);button.onclick=()=>{const renderer=this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;const ext=renderer.gl?.getExtension('WEBGL_lose_context');if(!ext){button.textContent='不支援模擬';return;}ext.loseContext();setTimeout(()=>ext.restoreContext(),150);};this.events.once('shutdown',()=>button.remove());
      }
      if(preview==='audio'){
        this.model.stage=4;this.model.start();this.model.paused=true;
        const button=document.createElement('button'),report=document.createElement('pre');button.id='audio-probe-start';button.textContent='開始音效壓力測試';report.id='audio-probe-report';button.style.cssText=report.style.cssText='position:fixed;z-index:99999;top:8px;left:8px;background:#10201f;color:white;padding:12px';document.body.append(button,report);report.hidden=true;
        let timer:ReturnType<typeof setInterval>|undefined;button.onclick=()=>{button.hidden=true;report.hidden=false;soundtrack.configure({...preferences,muted:false,music:.5,effects:.65});soundtrack.unlock();const start=performance.now();let count=0;
          timer=setInterval(()=>{soundtrack.update(4,true,true);const id=HERO_IDS[count++%6];soundtrack.specialImpact(id,true);soundtrack.specialStrike(id,count%3===0);soundtrack.weapon(id,true,true);soundtrack.hitImpact(true);report.textContent=JSON.stringify({running:true,...soundtrack.diagnostics()},null,2);if(performance.now()-start>=10000){clearInterval(timer);const before=soundtrack.diagnostics();soundtrack.pause();report.textContent=JSON.stringify({done:true,beforePause:before,afterPause:soundtrack.diagnostics()},null,2);}},40);
        };this.events.once('shutdown',()=>{clearInterval(timer);button.remove();report.remove();soundtrack.configure(preferences);});
      }
      if(preview==='performance'){
        const configure=(stage:number)=>{this.model=new Campaign('guanyu','hard',1);this.model.stage=stage;this.model.start();this.model.wave=5;this.model.spawn();this.model.pending=[];this.model.hero.x=500;this.model.hero.hp=this.model.hero.max=999999;this.model.enemies.forEach((e,i)=>{e.x=340+(i%4)*75;e.y=375+i%3*35;e.hp=e.max=999999;});this.model.supplies=[];this.model.barrels=[];this.model.paused=false;};
        this.performanceQA=new PerformanceQA(configure,()=>({children:this.children.length,textures:this.textures.getTextureKeys().length,actors:this.actors.size,audio:soundtrack.diagnostics(),heapBytes:(performance as Performance&{memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize??null}),Number(new URLSearchParams(location.search).get('cycles'))||2);
        const pre=()=>this.performanceQA?.preRender(),post=()=>this.performanceQA?.postRender();this.game.events.on('prerender',pre);this.game.events.on('postrender',post);this.events.once('shutdown',()=>{this.game.events.off('prerender',pre);this.game.events.off('postrender',post);this.performanceQA?.destroy();this.performanceQA=undefined;});
      }
      if(preview==='mobile'){document.body.classList.add('touch-controls');this.posePreview=true;this.model.start();this.model.paused=true;syncViewport();}
      if(preview==='transition'){this.model.start();this.model.enemies=[];this.model.hero.x=850;this.model.cameraLeft=510;this.model.clearedAt=0;this.model.time=2;}
      if(preview==='infantry'){this.model.start();this.model.hero.x=280;this.model.enemies=[this.model.fighter('brute',500,410),this.model.fighter('mauler',680,435)];this.model.enemies.forEach(e=>e.cooldown=100);this.model.paused=true;}
      if(preview==='horses'){this.model.start();this.model.hero.x=450;this.model.hero.mounted=true;this.model.enemies=[];this.model.pickups=[{id:800,x:300,y:475,amount:0,loot:'book'},{id:801,x:380,y:475,amount:0,loot:'gong'}];this.model.summonHorses();this.model.paused=true;}
      if(preview==='loot'){this.model.start();this.model.hero.x=450;this.model.hero.equipped={id:'axe',uses:14};this.model.supplies=[{id:700,x:300,y:354,hp:24},{id:701,x:720,y:499,hp:24}];this.model.pickups=(['meat','bun','knife','sword','hammer','axe'] as const).map((loot,i)=>({id:710+i,x:250+i*100,y:475,amount:loot==='meat'?40:loot==='bun'?25:0,loot}));this.model.enemies=[];this.model.paused=true;}
      if(preview==='grapple'||preview==='grapple-collision'){document.body.classList.add('touch-controls');this.model.start();this.model.hero.x=400;this.model.hero.y=412;const e=this.model.fighter('heavy',428,412);e.cooldown=10;this.model.enemies=[e];this.model.supplies=[];if(preview==='grapple-collision'){for(const offset of [55,90]){const t=this.model.fighter('heavy',400+offset,412);t.stun=10;this.model.enemies.push(t);}}this.model.tryGrab({x:1,y:0});this.model.paused=true;}
      if(preview==='expanded'||preview==='expanded-river'){this.model.stage=preview==='expanded-river'?1:0;this.model.wave=3;this.model.status='playing';this.model.spawn();this.model.hero.x=2950;this.model.paused=true;}
      if(preview&&['bamboo','snow','palace'].includes(preview)){this.model.stage=['bamboo','snow','palace'].indexOf(preview)+2;this.model.wave=5;this.model.status='playing';this.model.spawn();this.model.hero.x=4800;this.model.paused=true;}
      if (preview === 'river') { this.model.stage = 1; this.model.start(); }
      if (preview === 'continue') { this.model.start(); this.model.hero.hp = 0; this.model.status = 'lost'; }
      if (preview === 'intermission') { this.model.start(); this.model.wave = this.model.level.waves.length; this.model.enemies = []; this.model.status = 'stage-clear'; }
    }
    this.draw();
    if (settingsOpen) { this.input.keyboard!.enabled = false; }
  }
  activate() {
    const m = this.model;
    if (settingsOpen || titleScreen) return;
    if (m.status === 'ready') {
      m.start();
    }
    else if (m.paused) this.resume();
    else if (m.status === 'stage-clear') { m.nextStage(); this.recorded = false; }
    else if (m.status === 'lost' && m.continues > 0) { m.continueRun(); this.recorded = false; }
    else if (m.status === 'lost' || m.status === 'won') this.scene.restart({});
  }
  resume() { if(this.model.paused)this.model.togglePause(); }
  actionDown(action: string) { return [...keyboardHeld].some(code => keyAction(code, bindings) === action); }
  update(_time: number, delta: number) {
    this.performanceQA?.before();
    const m = this.model;
    if(this.performanceQA&&!this.performanceQA.done){m.paused=false; m.hero.inv=1;}
    let pads: (Gamepad | null)[] = [];
    try { pads = Array.from(navigator.getGamepads?.() ?? []); } catch { /* unavailable */ }
    const pad = this.pad.read(pads,preferences.pad);this.padHeld=pad.held;this.padConnected=pad.connected;
    if (!document.hasFocus()) { this.pad.reset(); pad.held.clear(); pad.pressed.clear(); }
    if (pad.disconnected) suspend();
    setText('#pad-status', pad.connected ? `${pad.family} 手把已連接 · 左搖桿／方向鍵移動 · ${PAD_LABELS[preferences.pad.attack]} 攻擊 · ${PAD_LABELS[preferences.pad.jump]} 跳躍 · ${PAD_LABELS[preferences.pad.dodge]} 衝撞 · Start 暫停 · Back 設定` : '支援 Xbox USB／藍牙手把（瀏覽器標準映射）；連接後按任意鍵並放開。');
    if (pad.pressed.has('settings') || pad.pressed.has('pause')) { if(settingsOpen)closeSettings();else openSettings(); }
    else if(settingsOpen) { handleMenuPad(pad.pressed); }
    else if(m.status === 'ready') {
      if(pad.pressed.has('left') || pad.pressed.has('right')) {
        selectedHero = HERO_IDS[(HERO_IDS.indexOf(selectedHero) + (pad.pressed.has('right') ? 1 : HERO_IDS.length-1)) % HERO_IDS.length];
        m.selectHero(selectedHero);
      }
      if(pad.pressed.has('attack') || pad.pressed.has('pause')){if(titleScreen)document.querySelector<HTMLButtonElement>('#title-start')!.click();else this.activate();}
    } else if(m.status !== 'playing') {
      if(pad.pressed.has('attack') || pad.pressed.has('pause')){if(titleScreen)document.querySelector<HTMLButtonElement>('#title-start')!.click();else this.activate();}
    } else { for(const action of pad.pressed)queueAction(action,'pad'); }
    if (pressed.delete('restart')) { requestRestart(); return; }
    if (pressed.delete('start')) this.activate();
    if (pressed.delete('pause')) {toggleSettings();return;}
    const autoAttack = preferences.autoAttack && !settingsOpen && (this.actionDown('attack') || held.has('attack') || pad.held.has('attack')) && m.time >= this.autoAttackAt;
    if(autoAttack) this.autoAttackAt = m.time + .20;
    const input: Input = {
      dropWeapon:(pressed.has('attack')||pressed.has('jump'))&&(pressed.has('attack')||this.actionDown('attack')||held.has('attack')||pad.held.has('attack'))&&(pressed.has('jump')||this.actionDown('jump')||held.has('jump')||pad.held.has('jump')),
      x: Number(this.actionDown('right') || pad.held.has('right') || held.has('right')) - Number(this.actionDown('left') || pad.held.has('left') || held.has('left')),
      y: Number(this.actionDown('down') || pad.held.has('down') || held.has('down')) - Number(this.actionDown('up') || pad.held.has('up') || held.has('up')),
      throwX: pressed.delete('throw-left')?-1:pressed.delete('throw-right')?1:undefined, grappleAttack: pressed.has('attack'), attack: pressed.delete('attack') || autoAttack, jump: pressed.delete('jump'), dodge: pressed.delete('dodge'), special: pressed.delete('command-special'),horseSpecial:pressed.delete('horse-special'),
    };
    if(this.performanceQA&&!this.performanceQA.done){input.attack=Math.floor(m.time*5)%2===0;input.special=(m.hero.specialCooldown??0)<=0;input.jump=Math.floor(m.time*2)%2===0;}
    const mountedBefore=m.hero.mounted;
    this.clock.advance(delta / 1000, input, m.status === 'playing' && !m.paused, (dt, stepInput) => {
      m.tick(dt, stepInput);
      for (const event of m.events) this.effect(event);
    });
    if(mountedBefore!==m.hero.mounted){commands.reset();pressed.delete('horse-special');pressed.delete('command-special');}
    if(!(import.meta.env.DEV&&new URLSearchParams(location.search).get('preview')==='audio'))soundtrack.update(m.stage, m.enemies.some(e => isBoss(e.kind)), m.status === 'playing' && !m.paused && !settingsOpen && !document.hidden);
    if ((m.status === 'won' || m.status === 'lost') && !this.recorded) {
      if(m.status === 'won' && m.ranked) {
        records = recordVictory(records, m.hero.heroId ?? 'guanyu', m.score, m.rank);
        try { profileStorage.setItem(recordsKey(m.difficulty), JSON.stringify(records)); } catch { /* session record still available */ }
        tone(740, .35);
      }
      this.recorded = true; if(m.ranked) this.best = Math.max(this.best, m.score);
      try { profileStorage.setItem(bestKey(m.difficulty), String(this.best)); } catch { /* Storage is optional. */ }
    }
    this.tweens.timeScale = m.paused ? 0 : 1;
    this.cameras.main.scrollX = m.cameraLeft;
    if((m.status==='playing'&&!m.paused)||m.status==='ready'||this.shellKey!==`${m.paused?'paused':m.status}/${titleScreen}/${settingsOpen}`)this.draw();
    if(this.performanceQA?.done){m.paused=true;soundtrack.pause();}
  }
  effect(e: Effect) {
    if(e.type==='enemy-dismount'){
      const fx=this.add.graphics().setPosition(e.x,e.y).setDepth(e.y);drawHorse(fx,0,0,1,0,true);fx.setScale(e.value??1,1);
      this.tweens.add({targets:fx,x:e.x+(e.value??1)*420,alpha:0,duration:900,onComplete:()=>fx.destroy()});tone(120,.15);setText('#command-feedback','敵方騎將落馬，進入步戰');
    }else if(e.type==='rescue'){
      setText('#command-feedback','解困震退 · 氣血 -8');soundtrack.specialImpact(e.heroId??'guanyu');
      const ring=this.add.ellipse(e.x,e.y-30,100,68,0xf3d7a0,.25).setStrokeStyle(5,0xffe4af).setDepth(e.y+100);
      this.tweens.add({targets:ring,scaleX:2.5,scaleY:2,alpha:0,duration:preferences.reducedMotion?180:400,onComplete:()=>ring.destroy()});
      const label=this.add.text(e.x,e.y-110,'解困 -8',{fontSize:'20px',color:'#ffcf8e',stroke:'#28332a',strokeThickness:3}).setOrigin(.5).setDepth(8000);this.tweens.add({targets:label,y:label.y-20,alpha:0,duration:700,onComplete:()=>label.destroy()});
    }else if(e.type==='bonus'){
      tone(780,.15);const label=this.add.text(e.x,e.y-45,'銅鑼 +1000',{fontSize:'20px',color:'#ffdc8c',stroke:'#27332e',strokeThickness:3}).setDepth(8000);this.tweens.add({targets:label,y:label.y-35,alpha:0,duration:850,onComplete:()=>label.destroy()});
    }else if(e.type==='weapon-drop'){
      const fx=this.add.graphics().setPosition(e.x,e.y-40).setDepth(e.y+1);drawWeapon(fx,e.weapon!,0,0,.8);this.tweens.add({targets:fx,y:e.y,angle:110,alpha:0,duration:600,onComplete:()=>fx.destroy()});tone(130,.15);
    }else if(e.type==='gong'||e.type==='mount'||e.type==='blade-wave'||e.type==='book'){
      if(e.type==='blade-wave')soundtrack.specialImpact(e.heroId??'guanyu',true);else if(e.type==='gong')soundtrack.gong();else tone(e.type==='book'?780:280,.2);
      if(e.type==='book'){const label=this.add.text(e.x,e.y-45,'兵書 +1500',{fontSize:'20px',color:'#ffdc8c',stroke:'#27332e',strokeThickness:3}).setDepth(8000);this.tweens.add({targets:label,y:label.y-35,alpha:0,duration:850,onComplete:()=>label.destroy()});}
    }else if(e.type==='grapple-hit'||e.type==='grab-air'){setText('#command-feedback',e.type==='grab-air'?'空中抓住敵人':`抓住打擊${e.value}/2`);
    }else if(e.type==='grab'||e.type==='escape'||e.type==='throw'){setText('#command-feedback',e.type==='throw'?`${THROWS[e.heroId!].name}命中`:e.type==='grab'?'抓住敵人':'敵人掙脫');tone(e.type==='throw'?70:180,.12);if(e.type==='throw'){const dust=this.add.ellipse(e.x,e.y,80,18,0xe2c18c,.7).setDepth(e.y+1);this.tweens.add({targets:dust,scaleX:1.8,alpha:0,duration:320,onComplete:()=>dust.destroy()});}
    }else if(e.type==='special-start'){setText('#command-feedback',`使出${SPECIALS[e.heroId!].name}`);soundtrack.specialImpact(e.heroId!);
    }else if(e.type==='special') {
      const id=e.heroId!,spec=SPECIALS[id],face=e.value??1;
      soundtrack.specialStrike(id,!!e.heavy);
      const fx=this.add.graphics().setPosition(e.x,e.y-30).setScale(face,1).setDepth(8000);
      fx.lineStyle(4,spec.color,.9);
      if(id==='lubu'||id==='guanyu'||id==='zhangfei'||id==='huangzhong'){
        fx.strokeEllipse(0,25,spec.reach*2,spec.depth*2);
        if(id==='guanyu'||id==='huangzhong')fx.lineStyle(7,spec.color,.6).beginPath().arc(0,0,100,-2.5,1.5).strokePath();
        else for(let i=0;i<8;i++){const a=i*Math.PI/4;fx.lineBetween(Math.cos(a)*30,25+Math.sin(a)*20,Math.cos(a)*110,25+Math.sin(a)*70);}
      }else if(id==='zhaoyun'){
        for(const dy of [-18,0,18])fx.lineStyle(dy===0?6:2,spec.color,.9).lineBetween(10,dy,175,dy-20);
        fx.fillStyle(0xffffff).fillTriangle(180,-20,158,-29,158,-11);
      }else for(let i=0;i<3;i++)fx.lineStyle(5-i,spec.color,.9).beginPath().arc(15,-i*8,85+i*12,-1.4,.9).strokePath();
      this.tweens.add({targets:fx,alpha:0,duration:500,onComplete:()=>fx.destroy()});
    } else if (e.type === 'arrow') {
      const reach=e.value??300,face=Math.sign(reach),arrow=this.add.graphics().setPosition(e.x,e.y).setDepth(e.y+41);
      arrow.lineStyle(e.heavy?3:2,0xcbb98b).lineBetween(-face*23,0,face*4,0);
      arrow.fillStyle(0xe6ece2).fillTriangle(face*12,0,face*2,-4,face*2,4);
      arrow.lineStyle(2,0xe5d8b7).lineBetween(-face*20,0,-face*27,-4).lineBetween(-face*20,0,-face*27,4);
      this.tweens.add({targets:arrow,x:e.x+reach,y:e.y+(e.dy??0),duration:Math.max(80,Math.abs(reach)/850*1000),onComplete:()=>arrow.destroy()});
    } else if (e.type === 'hit') {
      if(e.heroId){soundtrack.weapon(e.heroId,true,!!e.heavy);soundtrack.hitImpact(!!e.heavy);if(!preferences.reducedMotion){this.tweens.killTweensOf(this.combo);this.combo.setScale(1.18);this.tweens.add({targets:this.combo,scale:1,duration:160});}}else tone(e.heavy ? 85 : 180, e.heavy ? .14 : .07);
      if (!preferences.reducedMotion) this.cameras.main.shake(e.heavy ? 100 : 45, e.heavy ? .004 : .0015);
      const damage = this.add.text(e.x, e.y - 20, String(e.value), { fontFamily: 'monospace', fontSize: e.heavy ? '24px' : '18px', color: '#ffe2a1', stroke: '#493e2c', strokeThickness: 3 }).setOrigin(.5).setDepth(8000);
      this.tweens.add({ targets: damage, y: damage.y - 28, alpha: 0, duration: 470, onComplete: () => damage.destroy() });
      for (let i = 0; i < 7; i++) {
        const spark = this.add.rectangle(e.x, e.y, i % 2 ? 3 : 6, 3, i % 2 ? 0xeaa351 : 0xfff1b5).setDepth(8000);
        this.tweens.add({ targets: spark, x: spark.x + Math.cos(i * 1.1) * 35, y: spark.y + Math.sin(i * 1.1) * 26, alpha: 0, duration: 220, onComplete: () => spark.destroy() });
      }
    } else if(e.type==='equip'){tone(720,.12);
    } else if (e.type === 'heal') {
      tone(580, .16);
      const heal = this.add.text(e.x, e.y, `+${e.value}`, { fontFamily: 'monospace', fontSize: '23px', color: '#c9f2b7', stroke: '#24392b', strokeThickness: 3 }).setOrigin(.5).setDepth(8000);
      this.tweens.add({ targets: heal, y: heal.y - 30, alpha: 0, duration: 700, onComplete: () => heal.destroy() });
    } else if (e.type === 'death' || e.type === 'dodge' || e.type === 'crate') {
      const dust = this.add.ellipse(e.x, e.y, 40, 10, 0xd5b97c, .6).setDepth(e.y);
      this.tweens.add({ targets: dust, scaleX: 2, scaleY: 2, alpha: 0, duration: 300, onComplete: () => dust.destroy() });
    } else if(e.type==='scene-action'){
      tone(e.value===1?260:90,.2);const kind=e.value??0;
      const pulse=kind===2?this.add.rectangle(e.x,425,150,160,0x9bc577,.35):kind===1?this.add.rectangle(this.model.cameraLeft+480,425,940,150,0x6ac5d5,.3):this.add.ellipse(e.x,e.y,kind===4?440:250,kind===4?150:190,kind===3?0xbde1e3:0xe6c983,.35);
      pulse.setDepth(355);this.tweens.add({targets:pulse,alpha:0,duration:650,onComplete:()=>pulse.destroy()});
      const text=this.add.text(e.x,e.y-80,PROPS[kind].name+'發動',{fontSize:'18px',color:'#e7dda8',stroke:'#1b3028',strokeThickness:3}).setOrigin(.5).setDepth(8000);this.tweens.add({targets:text,y:text.y-25,alpha:0,duration:950,onComplete:()=>text.destroy()});
    } else if(e.type==='reinforcement'){tone(250,.12);
    } else if(e.type==='block'||e.type==='guard-break'){
      tone(e.type==='block'?620:140,e.type==='block'?.07:.18);
      const ring=this.add.circle(e.x,e.y,e.type==='block'?12:22,0xffdc8e,.2).setStrokeStyle(2,0xffdc8e).setDepth(e.y+100);this.tweens.add({targets:ring,scale:1.6,alpha:0,duration:180,onComplete:()=>ring.destroy()});
    } else if (e.type === 'swing') soundtrack.weapon(e.heroId ?? 'guanyu',false,e.value===3);
    else if(e.type==='volley'||e.type==='fire')tone(e.type==='fire'?65:480,.16);
    else if (e.type === 'jump') tone(300, .07);
    else if (e.type === 'wave') tone(410, .18);
  }
  draw() {
    const m = this.model, live = new Set<number>();
    const touchPhase=commands.phase('touch',performance.now(),!!m.hero.mounted);setText('#touch-command',touchPhase===1?(m.hero.mounted?'→':'↑'):touchPhase===2?'斬':'移');
    document.querySelector('#touch [data-key=attack]')!.classList.toggle('command-ready',touchPhase===2);
    if (this.drawnStage !== m.stage) {
      this.backdrop?.destroy(true); this.backdrop = cacheScenery(this,drawBackground(this, m.level),WORLD_WIDTH); this.drawnStage = m.stage;
    }
    const supply = this.supplies; supply.clear();
    for (const box of m.supplies) {
      supply.fillStyle(0x142524,.45).fillEllipse(box.x,box.y+3,66,18);
      supply.fillStyle(0x795333).fillRect(box.x-28,box.y-48,56,48);
      supply.fillStyle(0xad8050).fillRect(box.x-28,box.y-48,56,8);
      supply.lineStyle(2,0x4b3224);for(let x=-18;x<28;x+=11)supply.lineBetween(box.x+x,box.y-39,box.x+x,box.y);
      supply.lineStyle(4,0xd4b47a).strokeRect(box.x-28,box.y-48,56,48);
      supply.fillStyle(0x465051).fillRect(box.x-28,box.y-33,56,6).fillRect(box.x-28,box.y-12,56,6);
      if(box.hp<24)supply.lineStyle(3,0x2b241e).lineBetween(box.x-5,box.y-44,box.x+6,box.y-25).lineBetween(box.x+6,box.y-25,box.x-3,box.y-8);
    }
    for(const barrel of m.barrels){
      const x=barrel.x,y=barrel.y;supply.fillStyle(0x583d29).fillRoundedRect(x-23,y-53,46,53,12);supply.fillStyle(0x997144).fillEllipse(x,y-48,46,15);
      supply.lineStyle(2,0x442f23);for(const dx of [-13,-3,9])supply.lineBetween(x+dx,y-40,x+dx,y-4);
      supply.lineStyle(5,0x66726c).strokeEllipse(x,y-35,46,12).strokeEllipse(x,y-9,46,12);
      if(barrel.hp<24)supply.lineStyle(3,0x252c25).lineBetween(x-4,y-45,x+6,y-23).lineBetween(x+6,y-23,x-3,y-3);
    }
    for(const prop of m.props)if(prop.hp>0)drawStageProp(supply,prop);
    const prop=m.props.find(p=>p.hp>0);this.propLabel.setVisible(!!prop);if(prop)this.propLabel.setPosition(prop.x,prop.y-82).setText(PROPS[m.stage].name+' · 可擊破');
    for(const horse of m.horses)drawHorse(supply,horse.x,horse.y,-1,m.time,horse.moving);
    for(const item of m.pickups)drawLoot(supply,item.loot??'bun',item.x,item.y-13+Math.sin(m.time*5)*3);
    for(const p of m.projectiles){if(p.wave&&!p.arrow){supply.lineStyle(10,0xf5d78c,.55).beginPath().arc(p.x,p.y-37,44,p.face>0?-1.2:1.9,p.face>0?1.2:4.3).strokePath();supply.lineStyle(3,0xfff8d6,.95).beginPath().arc(p.x,p.y-37,49,p.face>0?-1.2:1.9,p.face>0?1.2:4.3).strokePath();}else if(p.arrow){const y=p.y-40;supply.lineStyle(p.piercing?3:2,0xcbb98b).lineBetween(p.x-p.face*23,y,p.x+p.face*4,y);supply.fillStyle(0xe6ece2).fillTriangle(p.x+p.face*12,y,p.x+p.face*2,y-4,p.x+p.face*2,y+4);supply.lineStyle(2,0xe5d8b7).lineBetween(p.x-p.face*20,y,p.x-p.face*27,y-4).lineBetween(p.x-p.face*20,y,p.x-p.face*27,y+4);}else drawWeapon(supply,'knife',p.x,p.y-38,p.face,0);}
    for (const f of [m.hero, ...m.enemies]) {
      live.add(f.id);
      let actor = this.actors.get(f.id); if (!actor) { actor = new Actor(this, f.id); this.actors.set(f.id, actor); }
      actor.draw(f, m.time);
    }
    for (const [id, actor] of this.actors) if (!live.has(id)) { actor.fall(this); this.actors.delete(id); }
    const d = this.danger; d.clear();
    const field=m.field;
    if(field) {
      const color=field.kind==='fire'?0xff9a52:0x91d5dc;
      d.fillStyle(color,field.active?.08:.10+field.progress*.15).fillRect(field.x,field.y,field.width,field.height);
      d.lineStyle(field.active?4:2,color,.95).strokeRect(field.x,field.y,field.width,field.height);
      // A growing bar communicates timing without relying on flashing or colour alone.
      d.fillStyle(0xf7e9b3,.9).fillRect(field.x,field.y-6,field.width*field.progress,3);
      if(field.active)for(let x=field.x+12;x<field.x+field.width;x+=24) {
        if(field.kind==='volley') {d.lineStyle(2,0xe3e7cc).lineBetween(x-13,field.y-23,x,field.y+25);d.fillStyle(0xe3e7cc).fillTriangle(x,field.y+27,x-6,field.y+17,x+2,field.y+16);}
        else if(m.time-field.impactAt<.08){d.fillStyle(0xe9b25d).fillTriangle(x-9,field.y+30,x+2,field.y-14,x+10,field.y+30);}else{d.fillStyle(0x9b7454,.45).fillRect(x,field.y+25,9,3);}
      }
    }
    for (const e of m.enemies) {
      const a = e.attack; if (!a || a.hit) continue;
      const progress=Math.min(1,a.elapsed/a.impact),pulse=.12+progress*.2;
      d.fillStyle(0xffd58b,.95).fillRect(e.x-22,e.y-112,44*progress,3);
      d.fillStyle(0xe77948, pulse); d.lineStyle(2, 0xffb568, .85);
      if(a.move==='fan'){for(const slope of [-.3,0,.3]){d.lineStyle(20,0xe4b85b,.16).lineBetween(a.x,a.y,a.x+a.face*330,a.y+slope*330);d.lineStyle(2,0xffd78b,.9).lineBetween(a.x,a.y,a.x+a.face*330,a.y+slope*330);}}
      else if(a.move==='ring'){d.lineStyle(106,0x99dbe6,.20).strokeCircle(a.x,a.y,101);d.lineStyle(2,0xd8f1ed,.9).strokeCircle(a.x,a.y,48).strokeCircle(a.x,a.y,155);}
      else if(a.move==='cross'){d.fillRect(a.x-28,a.y-155,56,310).fillRect(a.x-180,a.y-24,360,48);d.strokeRect(a.x-28,a.y-155,56,310).strokeRect(a.x-180,a.y-24,360,48);}
      else if (a.move === 'sweep') { d.fillRect(a.x - 170, a.y - 49, 340, 98); d.strokeRect(a.x - 170, a.y - 49, 340, 98); }
      else if (a.move === 'slam') { d.fillEllipse(a.x, a.y, 246, 176); d.strokeEllipse(a.x, a.y, 246, 176); }
      else { const w = a.move==='cavalry'?230:a.move === 'charge' ? 250 : e.kind==='archer'?340:e.kind==='spearman'?145:e.kind==='brute'?85:e.kind === 'heavy' ? 88 : 73; const x = a.face > 0 ? a.x : a.x - w; d.fillRect(x, a.y - 29, w, 58); d.strokeRect(x, a.y - 29, w, 58); }
    }
    if(m.reinforcementHint){d.fillStyle(0xe4c783,.85).fillTriangle(m.cameraLeft+930,390,m.cameraLeft+945,405,m.cameraLeft+930,420);if(m.pending[0]?.side==='pincer')d.fillTriangle(m.cameraLeft+30,390,m.cameraLeft+15,405,m.cameraLeft+30,420);}
    const g = this.hud; g.clear(); g.fillStyle(0x0b191b, .95).fillRect(0, 0, 960, 87);
    g.fillStyle(0xa88a50).fillRect(0, 86, 960, 1); g.fillStyle(0x293a35).fillRect(26, 49, 240, 12);
    g.fillStyle(0xb7c58b).fillRect(28, 51, 236 * m.hero.hp / m.hero.max, 8);
    g.fillStyle(0x263e3b).fillRect(26, 69, 80, 4); g.fillStyle(0x67b9a7).fillRect(26, 69, 80 * (1 - (m.hero.mounted?(m.hero.rideDashCooldown??0)/1.15:m.hero.dodgeCooldown/.95)), 4);
    g.fillStyle(0x806940).fillRect(350, 62, 250, 3); g.fillStyle(0xe5c681).fillRect(350, 62, 250 * m.hero.x / WORLD_WIDTH, 3);
    this.label.setText(`${m.champion.name} / ${m.champion.title}`);
    this.healthLabel.setText(`氣血 ${Math.ceil(m.hero.hp)} / ${m.hero.max}   ${m.hero.mounted?(m.hero.heroId==='huangzhong'?'騎射 · 衝突擊／左右＋攻擊貫穿箭':'騎乘 · 衝突擊／左右＋攻擊刀波'):m.hero.equipped?WEAPONS[m.hero.equipped.id].name+(m.hero.equipped.id==='knife'?' · 單次投擲':' · 耐擊 '+(2-(m.hero.equipped.hits??0))):'衝撞 '+bindings.dodge.slice(3)}`);
    this.stageLabel.setText(`赤壁之戰三 · v1.11.0 · ${DIFFICULTIES[m.difficulty].name}\n關 ${m.stage + 1}/${LEVELS.length} · 陣 ${m.wave || 1}/${m.level.waves.length} · ${m.level.sections[Math.max(0,m.wave-1)]}`);
    this.scoreLabel.setText(`SCORE ${String(m.score).padStart(6,'0')}\nBEST ${this.best}`);
    const fullNearSupply = m.hero.hp >= m.hero.max && m.pickups.some(item => item.amount>0&&nearPickup(m.hero, item));
    this.notice.setText(m.grapple?(m.grapple.phase==='hold'?`抓住 ${m.grapple.hits}/2 · ${Math.max(0,m.grapple.deadline-m.time).toFixed(1)}秒 · 跳＋攻擊空中摔／左右＋攻擊`:m.grapple.phase==='jump'?'空中抓住！按攻擊共同落地重摔':m.grapple.air?'共同落地重摔':m.grapple.back?'過肩背摔':'向前拋摔') : field ? (field.active?'爆發已結束 · 餘燼不再造成傷害':field.kind==='volley'?'箭雨警戒 · 移出框線，跳躍無法躲避':'火船來襲 · 離開火線或跳躍／衝撞') : m.reinforcementHint ? m.reinforcementHint : fullNearSupply ? '氣血已滿 · 補給保留，受傷後再取' : m.time < m.messageUntil ? m.message : prop&&Math.abs(prop.x-m.hero.x)<130&&Math.abs(prop.y-m.hero.y)<65?PROPS[m.stage].hint:'');
    this.combo.setText(m.hits > 0 ? `${m.hits} HIT${m.hits>1?'S':''}` : '');
    if(m.hits>0){const remaining=Phaser.Math.Clamp((m.hitDeadline-m.time)/1.7,0,1);g.fillStyle(0x20312d,.95).fillRect(780,171,140,6);g.fillStyle(remaining<.3?0xe77754:0xf9d38a).fillRect(780,171,140*remaining,6);}

    const boss = m.enemies.find(e => isBoss(e.kind));
    this.bossLabel.setText(boss ? `${m.level.boss} · ${['試探','變招','決戰'][bossPhase(boss.hp,boss.max)]}${boss.mounted?' · 騎將／重擊可落馬':(boss.knockdown??0)>0||boss.grapplePose?' · 倒地／擒拿中':(boss.grappleCooldown??0)>0?' · 擒拿冷卻':boss.inv>0&&boss.stun<=0?' · 起身保護':bossGrabWindow(boss.attack)==='recovery'?' · 收招可抓':bossGrabWindow(boss.attack)==='windup'?' · 蓄力可抓':bossGrabWindow(boss.attack)==='unsafe'?' · 出招中':' · 近身可抓'}　${Math.ceil(boss.hp)} / ${boss.max}` : '');
    if (boss) { g.fillStyle(0x142322, .95).fillRect(280, 498, 400, 25); g.fillStyle(0xb65440).fillRect(288, 505, 384 * boss.hp / boss.max, 10); }
    const state = m.paused && !(import.meta.env.DEV&&this.posePreview) ? 'paused' : m.status;
    const overlayKey=state;
    const shellKey=`${state}/${titleScreen}/${settingsOpen}`;
    if(this.shellKey!==shellKey){this.shellKey=shellKey;
    document.querySelector<HTMLElement>('#hero-select')!.hidden = state !== 'ready' || titleScreen;
    document.querySelector<HTMLElement>('#title-screen')!.hidden = !titleScreen;
    document.querySelector<HTMLElement>('#title-screen')!.inert = settingsOpen;
    document.body.dataset.screen = titleScreen?'title':state;
    document.querySelector<HTMLElement>('#advance')!.classList.toggle('terminal-action', ['lost','won','stage-clear'].includes(state));
    if(!document.documentElement.hasAttribute('data-ready')){document.documentElement.setAttribute('data-ready','');requestAnimationFrame(()=>this.scale.refresh());}
    document.querySelector<HTMLElement>('#app')!.inert = state === 'ready' || settingsOpen;
    document.querySelector<HTMLElement>('#hero-select')!.inert = settingsOpen;
    }
    if(state==='ready')setText('.select-hint',this.padConnected?`方向鍵／左搖桿選將 · ${PAD_LABELS[preferences.pad.attack]} 出陣`:document.body.classList.contains('touch-controls')?'點選武將，再按出陣':'方向鍵 ← → 或 1–6 選將 · Enter 出陣');
    const selectionKey=`${m.hero.heroId}/${records[m.hero.heroId??'guanyu']?.score??0}`;
    if(state==='ready' && this.selectionKey!==selectionKey){this.selectionKey=selectionKey;
    for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-hero]'))) card.setAttribute('aria-pressed', String(card.dataset.hero === m.hero.heroId));
    document.querySelector('#hero-detail')!.textContent = `${m.champion.name} · ${m.champion.description} 必殺：${SPECIALS[m.hero.heroId!].name}。摔技：${THROWS[m.hero.heroId!].name}。`;
    const personal = records[m.hero.heroId ?? 'guanyu'];
    setText('#hero-record', personal ? `此武將已通關 · v1.11.0 最高 ${personal.score} 分 · 最佳評級 ${personal.rank}` : '此武將尚未通關 · 完成五關留下戰績');
    setText('#deploy-hero', `以${m.champion.name}出陣 ▶`);
    }
    if(state==='ready'&&!titleScreen&&!settingsOpen){const frame=Math.floor((performance.now()/1000)*4)%4;if(frame!==this.portraitFrame){this.portraitFrame=frame;HERO_IDS.forEach((id,i)=>{document.querySelector<HTMLImageElement>(`[data-portrait="${id}"]`)!.src=this.portraits[i][frame];});}}
    if (overlayKey !== this.overlayState) {
      this.overlayState = overlayKey; this.overlay?.destroy(true); this.overlay = undefined;
      if (state !== 'playing') this.showOverlay(state);
    }
    const pause = document.querySelector<HTMLButtonElement>('#pause');
    if (pause) { setText('#pause',this.padConnected?'Ⅱ Start':document.body.classList.contains('touch-controls')?'Ⅱ':'Ⅱ Esc'); pause.disabled = m.status === 'ready'; }
    const status = document.querySelector('#game-status');
    if (status) setText('#game-status', state === 'ready' ? '等待出陣' : state === 'paused' ? '已暫停' : state === 'won' ? `五關完成 · ${m.score} 分` : state === 'lost' ? `敗陣 · 續關剩 ${m.continues} 次` : state === 'stage-clear' ? `第 ${m.stage+1} 關完成` : `第 ${m.stage + 1} 關 · ${m.remainingEnemies} 名敵人（含援軍）`);
    const action = document.querySelector<HTMLButtonElement>('#advance');
    if (action) {
      action.hidden = state === 'playing' || state === 'paused';
      setText('#advance', state === 'ready' ? '出陣 ▶' : state === 'stage-clear' ? `前往${LEVELS[m.stage+1]?.title} ▶` : state === 'lost' && m.continues > 0 ? `續關 (${m.continues}) ▶` : '重新出征 ↻');
    }
    setText('#credits',`續關 ${m.continues} / 2`);
    const progressKey=`${m.stage}/${state}`;if(progressKey!==this.progressKey){this.progressKey=progressKey;
    for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'))) {
      const index = Number(card.dataset.stage); card.dataset.state = index < m.stage || state === 'won' || (state === 'stage-clear' && index === m.stage) ? 'cleared' : index === m.stage ? 'current' : 'locked';
      card.querySelector('small')!.textContent = card.dataset.state === 'cleared' ? '已突破' : card.dataset.state === 'current' ? '目前關卡' : '突破前關後開放';
    }}
  }
  showOverlay(state: string) {
    const m = this.model;
    const title = state === 'ready' ? '赤壁之戰三' : state === 'paused' ? '暫 停' : state === 'stage-clear' ? '關 隘 已 破' : state === 'won' ? '凱 旋 而 歸' : '勝 敗 乃 常';
    const sub = state === 'ready' ? '五關戰役 · 赤壁之戰三 v1.11.0' : state === 'paused' ? `${m.level.title}　／　戰場等你歸來` : state === 'stage-clear' ? m.level.story : state === 'won' ? `評級 ${m.rank}　得分 ${m.score}　最高連擊 ${m.bestCombo}　末陣獎勵 +${Math.max(0,m.waveReward)}` : `當前：${m.level.title} 第 ${m.wave} 陣　／　續關剩 ${m.continues} 次`;
    const action = state === 'ready' ? '按 ENTER 或點擊出陣' : state === 'paused' ? (document.body.classList.contains('touch-controls')?'點擊戰場中央，或由 Ⅱ 選單繼續':`按 ${bindings.pause.slice(3)}／手把 Start 或「繼續」`) : state === 'stage-clear' ? `按 ENTER 前往${LEVELS[m.stage+1]?.title} · 氣血與武器延續` : state === 'lost' && m.continues > 0 ? '按 ENTER 或點擊續關 · 重打當前一陣' : '按 ENTER、R 或點擊重新出征';
    const hint = state === 'won' ? m.level.story : state === 'lost' ? '續關退回本陣起始分數；R 重開全程。' : document.body.classList.contains('touch-controls')?'方向盤移動 · 斬攻擊 · 躍跳躍 · 衝衝撞':this.padConnected?`${PAD_LABELS[preferences.pad.attack]} 攻擊 · ${PAD_LABELS[preferences.pad.jump]} 跳躍 · ${PAD_LABELS[preferences.pad.dodge]} 衝撞` : `${bindings.attack.slice(3)} 連斬　${bindings.jump.slice(3)} 跳躍　${bindings.dodge.slice(3)} 衝撞　／　打破木箱、走近食物補血`;
    const bg = this.add.rectangle(480, 282, 960, 410, 0x0b1416, .84);
    const text = (y: number, value: string, size: number, color: string) => this.add.text(480, y, value, { fontFamily: 'serif', fontSize: `${size}px`, color, wordWrap: { width: 830 }, align: 'center' }).setOrigin(.5);
    const result=m.stageResults.find(r=>r.stage===m.stage);
    const gradeLine=result&&(state==='stage-clear'||state==='won')?`${Math.round(result.seconds)}秒 · 受傷${result.damage} · ${result.bestHit} HIT · 續關${result.retries} · 機關${result.interactions}/2 · +${result.bonus}分`:'';
    this.overlay = this.add.container(0, 0, [bg, text(result?183:207, title, result?52:62, '#e8c27e'),text(242,result&&(state==='stage-clear'||state==='won')?'本關評價 '+result.grade:'',30,'#e8c27e'), text(286, sub, 18, '#ddd2b6'), text(350, action, 18, '#e9bd64'), text(313,gradeLine,14,'#e8c27e'),text(399, hint, 14, '#9eaf9b'),text(443,state==='won'?m.stageResults.map(r=>`第${r.stage+1}關 ${r.grade}`).join('　'):'',14,'#ddd2b6')]).setScrollFactor(0).setDepth(10000);
  }
}
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 960, height: 540, pixelArt: true, roundPixels: true,
  backgroundColor: '#24393d', scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: document.documentElement }, scene: Battle, banner: false });
document.querySelector('#sound')!.addEventListener('click', () => { preferences.muted = !preferences.muted; savePreferences(); });
document.querySelector('#fullscreen')!.addEventListener('click', async () => { if (desktop) { try { await desktop.invoke('toggle_fullscreen'); } catch { setText('#settings-status','無法切換全螢幕。'); } return; } await toggleFullscreen(document);refreshViewport(); });
document.querySelector('#advance')!.addEventListener('click', () => { current().activate(); current().draw(); });
document.querySelector('#pause')!.addEventListener('click',openSettings);
document.querySelector('#restart')!.addEventListener('click', requestRestart);
const directionPad=document.querySelector<HTMLElement>('.touch-directions')!;
function moveDirection(e:PointerEvent){
 const box=directionPad.getBoundingClientRect();const actions=directionAt(e.clientX-box.left,e.clientY-box.top,box.width,box.height);
 for(const action of touchInput.change(e.pointerId,actions))queueAction(action,'touch');syncTouches();
}
directionPad.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(directionPointer!==null)return;directionPointer=e.pointerId;directionPad.setPointerCapture(e.pointerId);moveDirection(e);});
directionPad.addEventListener('pointermove',e=>{if(e.pointerId===directionPointer){e.preventDefault();moveDirection(e);}});
function releaseTouch(e:PointerEvent){const owned=touchInput.owns(e.pointerId)||directionPointer===e.pointerId;touchInput.release(e.pointerId);if(e.pointerId===directionPointer)directionPointer=null;syncTouches();if(e.type==='pointercancel'||(e.type==='lostpointercapture'&&owned))commands.reset();}
for(const event of ['pointerup','pointercancel','lostpointercapture'])directionPad.addEventListener(event,e=>releaseTouch(e as PointerEvent));
document.querySelectorAll<HTMLElement>('.touch-actions [data-key]').forEach(el=>{
 el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture(e.pointerId);for(const action of touchInput.change(e.pointerId,[el.dataset.key!]))queueAction(action,'touch');syncTouches();});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,e=>releaseTouch(e as PointerEvent));
 el.addEventListener('contextmenu',e=>e.preventDefault());
});
directionPad.addEventListener('contextmenu',e=>e.preventDefault());
document.querySelector('#touch-fullscreen')!.addEventListener('click',async()=>{await toggleFullscreen(document);syncViewport();current().scale.refresh();});
let resizeFrame=0;
function refreshViewport(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{syncViewport();current()?.scale.refresh();});}
window.addEventListener('resize',refreshViewport);window.visualViewport?.addEventListener('resize',refreshViewport);document.addEventListener('fullscreenchange',()=>{clearTouches();commands.reset();refreshViewport();});document.addEventListener('webkitfullscreenchange',()=>{clearTouches();commands.reset();refreshViewport();});
window.addEventListener('orientationchange',()=>{clearTouches();commands.reset();refreshViewport();});

function suspend() {
  soundtrack.pause();
  current()?.clock.reset(); current()?.pad.reset();current()?.padHeld.clear(); keyboardHeld.clear();
  clearTouches(); pressed.clear();commands.reset();
  const scene = game.scene.getScene('Battle') as Battle;
  if (scene?.model.status === 'playing') { scene.model.paused = true; scene.input.keyboard?.resetKeys(); }
}
window.addEventListener('blur', suspend);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });

const current = () => game.scene.getScene('Battle') as Battle;
document.querySelectorAll<HTMLElement>('[data-hero]').forEach(card => card.addEventListener('click', () => {
  const id = card.dataset.hero as HeroId;
  if (current().model.selectHero(id)) selectedHero = id;
}));
document.querySelector('#deploy-hero')!.addEventListener('click', () => { void mobileFullscreen(); current().activate(); current().draw(); });
document.querySelector('#reselect')!.addEventListener('click', requestRestart);


function savePreferences() {
  muted = preferences.muted; soundtrack.configure(preferences);
  setText('#sound', `聲音：${muted ? '關' : '開'}`);
  try { profileStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); setText('#settings-status','設定已保存於此裝置。'); }
  catch { setText('#settings-status','設定僅本次有效；此裝置不允許儲存。'); }
}
function openSettings() {
  if(settingsOpen) return;
  setText('#menu-resume',current().model.status==='playing'?'繼續遊戲 · Esc':'返回 · Esc');
  document.querySelector<HTMLDetailsElement>('#options-details')!.open=false;
  settingsReturnFocus = document.activeElement as HTMLElement;
  suspend(); settingsOpen = true;
  current().input.keyboard!.enabled = false;
  document.querySelector<HTMLElement>('#settings-panel')!.setAttribute('data-open','');
  document.querySelector<HTMLElement>('#settings-panel')!.hidden = false;
  document.querySelector<HTMLInputElement>('#music-volume')!.value = String(preferences.music * 100);
  document.querySelector<HTMLInputElement>('#effects-volume')!.value = String(preferences.effects * 100);
  document.querySelector<HTMLInputElement>('#mute-all')!.checked = preferences.muted;
  document.querySelector<HTMLInputElement>('#reduce-motion')!.checked = preferences.reducedMotion;
  document.querySelector<HTMLInputElement>('#auto-attack')!.checked = preferences.autoAttack;
  document.querySelector<HTMLInputElement>('#large-touch')!.checked=preferences.largeTouch;
  document.querySelector<HTMLInputElement>('#show-touch')!.checked=document.body.classList.contains('touch-controls');
  renderPadControls();
  const difficulty=document.querySelector<HTMLSelectElement>('#difficulty')!;difficulty.value=preferences.difficulty;difficulty.disabled=current().model.status!=='ready';
  renderControls(); renderHistory();
  refreshVolumeLabels(); current().draw();
  document.querySelector<HTMLButtonElement>('#menu-resume')!.focus();
}
function closeSettings(resume=true) {
  pendingExit=null;
  settingsOpen = false; document.querySelector<HTMLElement>('#settings-panel')!.removeAttribute('data-open'); document.querySelector<HTMLElement>('#settings-panel')!.hidden = true;
  current().input.keyboard!.enabled = true; current().input.keyboard!.resetKeys();
  pressed.clear();clearTouches(); keyboardHeld.clear();commands.reset(); current().pad.reset();current().padHeld.clear(); current().draw();
  document.querySelector<HTMLElement>('#restart-confirm')!.hidden=true;
  if(resume && current().model.status==='playing' && current().model.paused)current().resume();
  current().draw();settingsReturnFocus?.focus();
}
document.querySelector<HTMLSelectElement>('#difficulty')!.addEventListener('change',event=>{
  const value=(event.target as HTMLSelectElement).value;
  if(current().model.status!=='ready'||!(value in DIFFICULTIES))return;
  preferences.difficulty=value as typeof preferences.difficulty;current().model.difficulty=preferences.difficulty;
  try{records=parseRecords(JSON.parse(profileStorage.getItem(recordsKey(preferences.difficulty))??'{}'));}catch{records={};}
  current().best=readBest();current().selectionKey='';savePreferences();renderHistory();
});
function refreshVolumeLabels() {
  setText('#music-value', `${Math.round(preferences.music*100)}%`);
  setText('#effects-value', `${Math.round(preferences.effects*100)}%`);
}
for(const id of ['settings-open','select-settings']) document.getElementById(id)!.addEventListener('click',openSettings);
document.getElementById('settings-close')!.addEventListener('click',()=>closeSettings());
for(const [id,key] of [['music-volume','music'],['effects-volume','effects']] as const) {
 document.getElementById(id)!.addEventListener('input',e=>{
  preferences[key] = Number((e.target as HTMLInputElement).value)/100;savePreferences();refreshVolumeLabels();
  if(key==='effects')tone(440,.10);
 });
}
for(const [id,key] of [['mute-all','muted'],['reduce-motion','reducedMotion'],['auto-attack','autoAttack'],['large-touch','largeTouch']] as const) {
 document.getElementById(id)!.addEventListener('change',e=>{preferences[key]=(e.target as HTMLInputElement).checked;savePreferences();syncViewport();current().scale.refresh();});
}
window.addEventListener('keydown', e => {
 if(e.code==='Escape' || (keyAction(e.code,bindings)==='pause' && (current()?.model.status==='playing'||settingsOpen) && !(e.target instanceof HTMLSelectElement))){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)toggleSettings();return;}
 if(settingsOpen && e.code==='Tab') {
  const controls=menuControls();
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
 }
},true);

window.addEventListener('keyup', e => keyboardHeld.delete(e.code));
function renderControls() {
 const area=document.querySelector('#custom-controls')!;
 area.innerHTML='<h3>自訂按鍵</h3><div class="binding-grid">'+ACTIONS.map(a=>`<label>${ACTION_LABELS[a]}<select data-binding="${a}" aria-label="${ACTION_LABELS[a]}按鍵">${VALID_KEYS.map(k=>`<option value="${k}" ${bindings[a]===k?'selected':''}>${k.slice(3)}</option>`).join('')}</select></label>`).join('')+'</div><button id="reset-bindings">恢復預設按鍵</button>';
 area.querySelectorAll<HTMLSelectElement>('[data-binding]').forEach(el=>el.addEventListener('change',()=>{
  try {bindings=remap(bindings,el.dataset.binding as Action,el.value);persistBindings();}
  catch(e){setText('#binding-status',String(e));el.value=bindings[el.dataset.binding as Action];}
 }));
 document.querySelector('#reset-bindings')!.addEventListener('click',()=>{bindings={...DEFAULT_BINDINGS};persistBindings();renderControls();});
 updateKeyGuide();
}
function updateKeyGuide(){
 const label=(a:Action)=>bindings[a].slice(3);
 setText('#key-guide',`${label('up')}${label('left')}${label('down')}${label('right')}／方向鍵移動 · ${label('attack')} 攻擊 · ${label('jump')}／空白鍵跳躍 · 攻擊＋跳躍 解困（耗血8；持拾取武器時丟下） · ${label('dodge')} 步戰衝撞／馬上突擊 · 馬上反方向＋攻擊回身 · ↓↑＋攻擊 必殺 · ${label('pause')} 暫停`);
 const keys=document.querySelectorAll('.controls kbd');
 if(keys.length>=8){keys[0].textContent=`${label('up')} ${label('left')} ${label('down')} ${label('right')}`;keys[2].textContent=label('attack');keys[3].textContent=label('jump');keys[5].textContent=label('dodge');keys[6].textContent=label('pause');}
}
function persistBindings(){
 keyboardHeld.clear();pressed.clear();
 try{profileStorage.setItem(CONTROL_KEY,JSON.stringify(bindings));setText('#binding-status','按鍵已保存。');}
 catch{setText('#binding-status','本機無法保存，按鍵設定僅本次有效。');}
 updateKeyGuide();
}
renderControls();

function toggleSettings(){if(pendingExit){cancelExit();return;}if(settingsOpen)closeSettings();else openSettings();}
function requestExit(target:'title'|'select'){
 if(current().model.status!=='playing'){leaveBattle(target);return;}
 openSettings();pendingExit=target;
 setText('#exit-description',`確定結束本次出征並返回${target==='title'?'主選單':'選將'}？目前戰役進度不會保留。`);
 document.querySelector<HTMLElement>('#restart-confirm')!.hidden=false;
 document.querySelector<HTMLButtonElement>('#restart-no')!.focus();
}
function cancelExit(){pendingExit=null;document.querySelector<HTMLElement>('#restart-confirm')!.hidden=true;document.querySelector<HTMLButtonElement>('#menu-resume')!.focus();}
function leaveBattle(target:'title'|'select'){pendingExit=null;suspend();closeSettings(false);titleScreen=target==='title';current().scene.restart({});}
function requestRestart(){requestExit('select');}
document.querySelector('#restart-yes')!.addEventListener('click',()=>{if(pendingExit)leaveBattle(pendingExit);});
document.querySelector('#restart-no')!.addEventListener('click',cancelExit);
function menuControls(){if(pendingExit)return Array.from(document.querySelectorAll<HTMLElement>('#restart-confirm button'));return Array.from(document.querySelectorAll<HTMLElement>('#settings-panel input, #settings-panel select, #settings-panel button, #settings-panel summary')).filter(el=>!el.hasAttribute('disabled')&&el.getClientRects().length>0);}
function handleMenuPad(actions:Set<string>){
 if(actions.has('jump')){if(pendingExit)cancelExit();else closeSettings();return;}
 const controls=menuControls();if(!controls.length)return;
 let index=controls.indexOf(document.activeElement as HTMLElement);
 if(actions.has('up')||actions.has('down')){index=(Math.max(0,index)+(actions.has('down')?1:controls.length-1))%controls.length;controls[index].focus();controls[index].scrollIntoView({block:'nearest'});}
 const el=document.activeElement;
 const direction=actions.has('right')?1:actions.has('left')?-1:0;
 if(direction&&el instanceof HTMLSelectElement){el.selectedIndex=(el.selectedIndex+direction+el.options.length)%el.options.length;el.dispatchEvent(new Event('change',{bubbles:true}));}
 else if(direction&&el instanceof HTMLInputElement&&el.type==='range'){el.value=String(Math.max(Number(el.min),Math.min(Number(el.max),Number(el.value)+direction*Number(el.step||1))));el.dispatchEvent(new Event('input',{bubbles:true}));}
 if(actions.has('attack')&&el instanceof HTMLElement)el.click();
}
function renderPadControls(){
 const root=document.querySelector('#pad-controls')!;root.replaceChildren();
 for(const action of PAD_ACTIONS){const label=document.createElement('label');label.textContent=ACTION_LABELS[action];const select=document.createElement('select');select.setAttribute('aria-label',`手把${ACTION_LABELS[action]}按鈕`);
  PAD_LABELS.forEach((name,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=name;option.selected=preferences.pad[action]===i;select.append(option);});
  select.addEventListener('change',()=>{try{preferences.pad=remapPad(preferences.pad,action,Number(select.value));current().pad.reset();commands.reset();savePreferences();setText('#pad-binding-status','手把配置已更新，放開按鈕後繼續。');}catch(error){setText('#pad-binding-status',(error as Error).message);}renderPadControls();});label.append(select);root.append(label);
 }
}
document.querySelector('#reset-pad')!.addEventListener('click',()=>{preferences.pad={...DEFAULT_PAD_BINDINGS};current().pad.reset();commands.reset();savePreferences();renderPadControls();});
function renderHistory(){
 const area=document.querySelector('#history')!;area.innerHTML='<h3>歷史戰績</h3>';
 for(const [version,key] of [['目前休閒','v150-easy'],['目前標準','v14loot'],['目前挑戰','v150-hard'],['1.0','v1'],['1.1','v11'],['1.2','v12'],['1.3','v13'],['1.3 必殺技','v13special'],['指令必殺','v13command'],['摔技版','v13grapple'],['雙關擴充','v13expanded'],['五關戰役','v13five']]){
  const title=document.createElement('p');title.textContent=`v${version}`;area.append(title);
  let rows:Records={};try{rows=parseRecords(JSON.parse(profileStorage.getItem(`red-banner-records-${key}`)??'{}'));}catch{}
  const list=document.createElement('p');list.className='history-row';list.textContent=HERO_IDS.map(id=>`${HEROES[id].name}：${rows[id]?`${rows[id]!.score} 分／${rows[id]!.rank}`:'尚無紀錄'}`).join('　');area.append(list);
 }
}
document.querySelector('#title-start')!.addEventListener('click',()=>{titleScreen=false;current().draw();document.querySelector<HTMLButtonElement>('#deploy-hero')!.focus();});
document.querySelector('#title-settings')!.addEventListener('click',openSettings);
document.querySelector('#menu-resume')!.addEventListener('click',()=>closeSettings());
document.querySelector('#menu-reselect')!.addEventListener('click',()=>requestExit('select'));
document.querySelector('#menu-home')!.addEventListener('click',()=>requestExit('title'));

document.querySelector('#show-touch')!.addEventListener('change',e=>{document.body.classList.toggle('touch-controls',(e.target as HTMLInputElement).checked);clearTouches();commands.reset();syncViewport();requestAnimationFrame(()=>current().scale.refresh());});
