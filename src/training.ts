import {Campaign,type Effect} from './combat.ts';
import type {HeroId} from './heroes.ts';
export const LESSONS=[
 {title:'移動與換線',hint:'向左右或上下移動，累積走過一段距離。'},
 {title:'三段連擊',hint:'靠近陪練兵，連按或長按攻擊，打出第三段連擊。'},
 {title:'跳躍攻擊',hint:'先跳躍，再於空中按攻擊。'},
 {title:'抓取與摔投',hint:'不按攻擊，走近並推向陪練兵；抓住後按左右＋攻擊，或跳躍後攻擊。趙雲可用跳躍重摔。'},
 {title:'指令必殺',hint:'快速依序按「下 → 上 → 攻擊」。方向輸入後須重新按下攻擊鍵。'},
 {title:'解困技',hint:'站在地面，同按攻擊＋跳躍。命中耗血 8，揮空不扣血；持拾取武器時會改為放下武器。'},
] as const;
/** A separate, unranked campaign uses the same combat rules as the main game. */
export class TrainingSession{
 mountedPractice=false;model!:Campaign;lesson=0;completed=new Set<number>();free=false;distance=0;feedback='';private grabbed=false;private lastX=250;private lastY=412;
 hero:HeroId;
 constructor(hero:HeroId){this.hero=hero;this.reset();}
 reset(){
  const m=this.model=new Campaign(this.hero,'easy',0,'short');m.start();m.ranked=false;
  m.pending=[];m.supplies=[];m.barrels=[];m.secrets=[];m.pickups=[];m.props=[];m.horses=[];m.bombs=[];m.projectiles=[];
  m.hero.x=250;m.hero.y=412;m.hero.inv=10;
  const dummy=m.fighter('soldier',this.lesson===1?320:365,412);dummy.max=dummy.hp=10000;dummy.stun=10;dummy.cooldown=10;m.enemies=[dummy];
  if(this.mountedPractice)m.horses=[{id:9000,x:340,y:412,target:340,life:999,moving:false,waiting:true,falls:0}];
  m.message='練習場 · 陪練不會主動攻擊';m.messageUntil=3;this.distance=0;this.grabbed=false;this.lastX=250;this.lastY=412;this.feedback='';
 }
 enableHorse(){this.mountedPractice=true;this.reset();}
 select(index:number){this.mountedPractice=false;this.free=index===LESSONS.length;this.lesson=Math.max(0,Math.min(index,LESSONS.length-1));this.reset();}
 beforeStep(){const m=this.model;m.hero.inv=Math.max(m.hero.inv,1);for(const e of m.enemies){e.stun=Math.max(e.stun,1);e.cooldown=10;e.hp=e.max;if(!this.free&&this.lesson===1&&!m.grapple){e.x=320;e.y=412;}}if(!m.enemies.length){const e=m.fighter('soldier',this.lesson===1?320:365,412);e.max=e.hp=10000;e.stun=10;m.enemies=[e];}}
 observe(events:readonly Effect[]){
  const h=this.model.hero;this.distance+=Math.hypot(h.x-this.lastX,h.y-this.lastY);this.lastX=h.x;this.lastY=h.y;
  if(events.some(e=>e.type==='grab'))this.grabbed=true;
  const success=[this.distance>=80,events.some(e=>e.type==='swing'&&e.step===3),h.z>0&&h.attack?.move==='aerial',this.grabbed&&events.some(e=>e.type==='throw'),events.some(e=>e.type==='special-start'),events.some(e=>e.type==='rescue')][this.lesson];
  if(!this.free&&success&&!this.completed.has(this.lesson)){this.completed.add(this.lesson);this.feedback='成功！'+LESSONS[this.lesson].title+'已完成';}
  else if(this.free){const action=events.find(e=>['throw','special-start','rescue','grab'].includes(e.type));if(action)this.feedback=({throw:'摔投成功', 'special-start':'必殺施放成功',rescue:action.value?'解困命中 · 氣血 −8':'解困揮空 · 不扣血',grab:'抓取成功'} as Record<string,string>)[action.type];}
 }
}
