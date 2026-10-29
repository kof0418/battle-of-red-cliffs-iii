import {drawSwordSoldier} from './soldier-art';
import {contactMotion,planted,sampleHero,localContact} from './choreography';
import {drawFinalBoss} from './final-boss-art';
import {mountedPosePhase} from './horse';
import {vanguardSpecialPose} from './vanguard-art';
import {rangedSpecialPose} from './ranged-art';
import {duelSpecialPose} from './duel-art';
import {drawHeavyInfantry} from './heavy-infantry';
import {drawHorse} from './horse-art';
import {specialMotion} from './special-motion';
import {drawWarrior} from './warriors';
import {drawGuanyu} from './guanyu';
import { HEROES } from './heroes';
import Phaser from 'phaser';
import {attackPhase,aerialMotion,grappleMotion,closeMotion,mountedMotion} from './motion';
import { isBoss, type Fighter } from './combat';
/** Reused graphics; sample actions refresh at 30 Hz, other poses keep their coarse cache. */
export class Actor {
  body: Phaser.GameObjects.Container;
  ink: Phaser.GameObjects.Graphics;
  shadow: Phaser.GameObjects.Ellipse;
  private pose = '';
  constructor(scene: Phaser.Scene, readonly id: number) {
    this.ink = scene.add.graphics(); this.body = scene.add.container(0, 0, [this.ink]);
    this.shadow = scene.add.ellipse(0, 0, 43, 12, 0x101c1a, .4);
  }
  setVisible(visible:boolean){this.body.setVisible(visible);this.shadow.setVisible(visible);}
  draw(f: Fighter, time: number, captive?:Fighter) {
    const champion = f.kind === 'hero' ? HEROES[f.heroId ?? 'guanyu'] : undefined;
    const frame = Math.floor(time * 12), boss = isBoss(f.kind), s = boss ? 1.5 : f.kind==='brute'?1.28:f.kind==='mauler'?1.24:f.heroId === 'zhangfei' ? 1.24 : 1.12;
    const step = f.attack ? Math.min(3, Math.floor(f.attack.elapsed / f.attack.duration * 4)) : 0;
    const rawPhase=f.attack?attackPhase(f.attack.elapsed,f.attack.impact,f.attack.duration):4,phase=f.mounted&&f.attack?.move==='mounted'?mountedPosePhase(f.step,f.heroId==='huangzhong',f.attack.elapsed,rawPhase):rawPhase;
    const motion=champion&&f.attack?(f.attack.move==='special'&&(f.heroId==='zhaoyun'||f.heroId==='huangzhong')?rangedSpecialPose(f):f.attack.move==='special'&&(f.heroId==='guanyu'||f.heroId==='zhangfei')?duelSpecialPose(f):f.attack?.move==='special'&&(f.heroId==='weiyan'||f.heroId==='lubu')?vanguardSpecialPose(f):f.mounted?mountedMotion(phase,f.attack.face!==f.face,f.attack.move==='ride-charge',f.step,f.heroId==='huangzhong'):f.attack.move==='kick'||f.attack.move==='bow-strike'?closeMotion(f.attack.move,phase,f.step):f.attack.move==='aerial'?aerialMotion(f.heroId!,f.vz<0,(f.airStrikes??0)===2):contactMotion(f,phase)):null;
    const grip=champion&&f.grapplePose?grappleMotion(f.heroId!,f.grapplePose,f.grappleProgress,f.grappleBack,f.mounted):null;
    const special=f.attack?.move==='special'?specialMotion(f.heroId!,f.attack.elapsed/f.attack.duration):null;
    const bob = f.moving && !f.attack && f.z === 0 ? frame % 2 * 2 : 0;
    this.body.setPosition(Math.round(f.x), Math.round(f.y - f.z - (f.mounted?42:0) - bob - (special?.lift??0)+(planted(f)?0:(grip?.crouch??motion?.crouch??0)))).setDepth(f.y+(grip?.5:0)).setScale(s * f.face, s);
    this.body.setAngle(planted(f)?0:f.mounted?0:(f.knockdown??0)>0?-f.face*90:(f.grapplePose==='thrown'||f.grapplePose==='throw')?(f.mounted?0:f.grappleSpin||f.heroId==='guanyu'&&f.z>0?f.throwSpin??0:grip?grip.lean*f.face:f.throwSpin??0):f.grapplePose==='held'?f.face*22:f.grapplePose==='air-held'?f.face*80:f.grapplePose==='air'?f.face*-5:special ? special.angle*f.face : f.dodge > 0 ? f.face * 30 : f.hp<=0 ? -f.face*78 : (f.throwRecovery??0)>0?f.face*6:f.stun > 0 ? -f.face * 13 : (grip?.lean??motion?.lean??0)*f.face);
    // Rotate thrown bodies around the torso rather than their feet.
    if(f.heroId==='weiyan'&&f.attack?.move==='special'||!f.mounted&&f.grapplePose==='throw'&&(f.grappleSpin||f.heroId==='guanyu'&&f.z>0)||f.grapplePose==='held'||f.grapplePose==='thrown'||f.grapplePose==='air-held'||(f.knockdown??0)>0){
      const angle=this.body.angle*Math.PI/180,center=42*s;
      this.body.x-=Math.sin(angle)*center;
      this.body.y+=center*(Math.cos(angle)-1);
      if((f.knockdown??0)>0)this.body.y+=center-8;
    }
    this.body.setAlpha(f.inv > 0 && frame % 2 === 0 ? .6 : 1);
    this.shadow.setPosition(f.x, f.y + 3).setDepth(f.y - 1).setScale(s * (1 - f.z / 250));
    const captiveScale=captive?(isBoss(captive.kind)?1.5:captive.kind==='brute'?1.28:captive.kind==='mauler'?1.24:1.12):1;
    const gripPoint=captive&&sampleHero(f)&&!f.mounted?localContact(captive.x,captive.y-captive.z-42*captiveScale,this.body.x,this.body.y,this.body.angle*Math.PI/180,s*f.face,s):undefined;
    const key = `${Math.round(gripPoint?.x??0)}/${Math.round(gripPoint?.y??0)}/${sampleHero(f)||f.kind==='soldier'?Math.floor((f.attack?.elapsed??0)*30):0}/${sampleHero(f)||f.kind==='soldier'?Math.floor(f.stun*30):0}/${f.grappleSpin}/${phase}/${f.heroId}/${frame % 4}/${f.moving}/${step}/${f.step}/${f.stun > 0}/${f.z > 0}/${Math.ceil(f.hp)}/${f.attack?.move}/${f.dodge > 0}/${f.grapplePose}/${f.grappleBack}/${f.equipped?.id}/${f.attack?.weapon}/${f.mounted}/${(f.guard??0)>0}/${f.vz<0}/${Math.floor((f.grappleProgress??0)*5)}/${(f.throwRecovery??0)>0}`;
    if (key === this.pose) return; this.pose = key;
    const g = this.ink; g.clear();
    if(f.mounted)drawHorse(g,0,38,1,time,f.moving);
    if (f.kind === 'hero' && f.heroId === 'guanyu') { drawGuanyu(g,f,frame,phase,gripPoint); return; }
    if (champion) { drawWarrior(g,f,frame,phase,gripPoint);
      return; }
    if(f.kind==='soldier'){drawSwordSoldier(g,f,frame);return;}
    if(drawFinalBoss(g,f,time))return;
    if(f.kind==='brute'||f.kind==='mauler'){drawHeavyInfantry(g,f,frame);return;}
    const color = f.kind==='hunter'?0x5c8969:f.kind==='frostlord'?0x9bb7c9:f.kind==='regent'?0xb44735:f.kind==='thrower'?0x826747:f.kind==='archer'?0x698357:f.kind==='spearman'?0x627f99:f.kind==='hammer'?0x986447:f.kind === 'hero' ? champion!.color : f.kind === 'raider' ? 0xc4a15e : f.kind === 'heavy' ? 0x8499a1 : f.kind === 'marshal' ? 0x618eaa : 0xad4e43;
    const walk = f.moving && !f.attack ? [-5, 0, 5, 0][frame % 4] : 0;
    const stride = f.z > 0 ? 6 : walk;
    // Cape, boots, segmented armour, face and original helmet silhouette.
    g.fillStyle(0x432e2c).fillTriangle(-9, -48, -31 - frame % 3 * 2, -16, 0, -19);
    g.fillStyle(0x233431).fillRect(-12 - stride / 2, -20, 11, 17 + stride).fillRect(3 + stride / 2, -20, 10, 17 - stride);
    g.fillStyle(0x182524).fillRect(-15 - stride / 2, -5 + stride, 14, 6).fillRect(3 + stride / 2, -5 - stride, 15, 6);
    g.fillStyle(color).fillRect(-15, -47, 30, 29).fillTriangle(-14, -29, -20, -13, 19, -13);
    g.fillStyle(0xd2b97f).fillRect(-17, -48, 35, 6).fillRect(-14, -25, 30, 5);
    g.fillStyle(0x264445).fillRect(-8, -40, 4, 12).fillRect(2, -40, 4, 12);
    for (let row = 0; row < 3; row++) g.fillStyle(0xe0cb95, .35).fillRect(-11, -39 + row * 5, 23, 1);
    g.fillStyle(0xe2b588).fillRect(-7, -64, 18, 16);
    g.fillStyle(0x242e2c).fillRect(-10, -69, 23, 9).fillRect(-9, -59, 5, 15).fillRect(5, -56, 3, 3);
    g.fillStyle(color).fillRect(-12, -65, 27, 5);
    g.fillStyle(0xe0bc70).fillRect(-2, -74, 6, 12);
    g.fillStyle(0x9e493d).fillTriangle(1, -75, -14 - frame % 3, -87, -6, -74);
    if(f.kind==='hunter'){g.fillStyle(0x355841).fillTriangle(-18,-65,1,-94,19,-65);}
    if(f.kind==='frostlord'){g.fillStyle(0xd4edf0).fillTriangle(-17,-62,-26,-91,-4,-70).fillTriangle(14,-62,23,-91,3,-70);}
    if(f.kind==='regent'){g.fillStyle(0xd8ad55).fillRect(-12,-77,26,12);g.fillTriangle(-12,-77,-12,-88,-3,-77).fillTriangle(4,-77,11,-91,14,-77);g.lineStyle(5,0xe3d6aa).lineBetween(-20,-44,-48,-71);}
    if (f.kind === 'marshal') { g.fillStyle(0xb7d3cc).fillTriangle(-9, -69, -18, -91, 0, -71).fillTriangle(7, -69, 15, -91, 0, -71); }
    if (f.kind === 'boss') { g.fillStyle(0xe0bd74).fillTriangle(-12, -65, -22, -79, -7, -68).fillTriangle(11, -65, 19, -81, 5, -68); }
    if(['held','air-held','thrown'].includes(f.grapplePose??'')){
      // A captive cannot keep swinging a weapon or shield through the grabbing arms.
      g.lineStyle(7,color).lineBetween(-12,-48,-18,-29).lineBetween(12,-48,17,-28);
      g.fillStyle(0xe2b588).fillRect(-21,-31,7,7).fillRect(14,-30,7,7);
      g.fillStyle(0x17251f).fillRect(-20,-96,40,4);g.fillStyle(boss?0xd97856:0xd5ab70).fillRect(-20,-96,40*f.hp/f.max,4);return;
    }
    // Each slash has a distinct silhouette: forward cut, rising cut, sweeping finisher.
    const attacking = !!f.attack;
    const y = motion ? motion.y : attacking ? (f.step === 2 ? [-26, -31, -59, -48][step] : [-53, -38, -28, -42][step]) : -40;
    const handX = motion ? motion.x : attacking ? [8, 23, 34, 17][step] : 17;
    g.fillStyle(color).fillRect(9, -44, handX - 1, 10);
    g.fillStyle(0xe2b588).fillRect(handX, y, 8, 8);
    if(f.kind==='thrower'){
      g.fillStyle(0x4e3428).fillEllipse(handX+12,y,24,27);g.fillStyle(0xb5834c).fillEllipse(handX+10,y-3,17,18);g.fillStyle(0x263633).fillRect(handX+4,y-18,16,6);g.lineStyle(2,0xe8b565).lineBetween(handX+13,y-18,handX+17,y-24);
      g.fillStyle(0x725334).fillRect(-24,-48,14,27);g.lineStyle(2,0xd3bb7e).lineBetween(-23,-50,-12,-47);
    }else if ((f.kind==='archer'||f.kind==='hunter')||f.heroId === 'huangzhong') {
      const bowX = handX + 10;
      g.lineStyle(4, 0xc4a66b).beginPath().arc(bowX - 8, y, 27, -1.2, 1.2).strokePath();
      g.lineStyle(1, 0xf3e3be).lineBetween(bowX + 2, y - 25, bowX - (attacking ? [8,19,0,2,0][phase] : 0), y).lineBetween(bowX - (attacking ? [8,19,0,2,0][phase] : 0), y, bowX + 2, y + 25);
      g.lineStyle(2, 0xf0d8a0).lineBetween(bowX - 20, y, bowX + 26, y);
    } else if (f.kind==='spearman'||f.heroId === 'zhaoyun' || f.heroId === 'zhangfei') {
      const tip = handX + (attacking ? f.kind==='spearman'?110:63 : 38), sy = y + 3;
      g.lineStyle(4, 0x8c7352).lineBetween(handX - 35, sy + (attacking ? 0 : 34), tip, sy - (attacking ? 0 : 30));
      g.fillStyle(0xdbe4dc).fillTriangle(tip, sy - (attacking ? 5 : 35), tip + 22, sy - (attacking ? 0 : 38), tip, sy - (attacking ? -5 : 25));
      if (f.heroId === 'zhangfei') g.lineStyle(3, 0xc7d4c8).lineBetween(tip, sy-5, tip+7, sy-10).lineBetween(tip+7, sy-10, tip+13, sy-5);
    } else if (f.heroId === 'weiyan') {
      g.fillStyle(0xcbd9d5).fillTriangle(handX + 3, y, handX + 40, y - 23, handX + 16, y + 4);
      g.lineStyle(4, 0xc4a46a).lineBetween(handX - 2, y - 5, handX + 13, y + 9);
    } else if(f.kind==='regent'||f.kind==='raider'||f.kind==='heavy'){
      const length=f.kind==='raider'?32:44;g.lineStyle(4,0xa18354).lineBetween(handX,y+8,handX+7,y-6);g.fillStyle(0xc6d5cf).fillTriangle(handX+5,y-4,handX+length,y-25,handX+15,y+1);g.lineStyle(2,0xf0e5bc).lineBetween(handX+7,y-5,handX+length,y-25);
    } else if(f.kind==='hammer'||f.kind==='frostlord'){
      const hx=attacking?handX+15:handX,hy=attacking?y-28:y-10;
      g.lineStyle(6,0x785138).lineBetween(handX,y+15,hx,hy-22);g.fillStyle(0x323d43).fillRect(hx-18,hy-37,36,23);g.fillStyle(0xa9aaa0).fillRect(hx-17,hy-36,34,5);g.lineStyle(2,0xd3b279).strokeRect(hx-18,hy-37,36,23);
    } else {
      g.lineStyle(4, 0x765b3f).lineBetween(handX + 4, y - 20, handX + 4, y + 35);
      g.fillStyle(0xd0ddd1).fillTriangle(handX + 6, y - 20, handX + 27, y - 35, handX + 7, y - 1);
    }
    if (f.kind === 'heavy') {
      const guarding=(f.guard??0)>0,x=guarding?9:-25,y=guarding?-54:-43,w=guarding?23:16,height=guarding?42:31;
      g.fillStyle(0x344e55).fillRect(x,y,w,height);g.lineStyle(guarding?3:2,guarding?0xffdc8e:0xc8b680).strokeRect(x,y,w,height);
      if(guarding){g.lineStyle(2,0xc4d8cb).lineBetween(x+4,y+8,x+w-4,y+8);g.fillStyle(0xd5b277).fillCircle(x+w/2,y+height/2,4);}
    }
    if (attacking && f.kind === 'hero' && f.heroId !== 'huangzhong' && phase >= 2 && phase <= 3) {
      if(f.heroId==='zhaoyun') {
        g.lineStyle(3,0xc7f0f1,.8).lineBetween(22,-39,94,-39);
        if(f.step===3)for(const dy of [-9,9])g.lineStyle(2,0x96d4df,.6).lineBetween(28,-39+dy,88,-39+dy);
      } else {
      const radius = (f.step === 3 ? 66 : 49)*(f.heroId==='weiyan'?.72:1), start = f.heroId==='zhangfei'?-2.1:f.step === 2 ? -.2 : -1.4;
      g.lineStyle(f.step === 3 ? 8 : 4, 0xffdfa0, .9).beginPath().arc(18, -32, radius, start, start + 2).strokePath();
      g.lineStyle(2, 0xffffdd, .9).beginPath().arc(18, -32, radius + 7, start + .2, start + 1.8).strokePath();
    }
    }
    if (f.attack && f.kind !== 'hero') {
      if(!f.attack.hit){g.fillStyle(0xffc163).fillTriangle(-4,-89,4,-89,0,-79);g.fillStyle(0x25352d).fillRect(-20,-106,40,3);g.fillStyle(0xffd98b).fillRect(-20,-106,40*Math.min(1,f.attack.elapsed/f.attack.impact),3);}
      else if(boss){g.lineStyle(2,0x94e3ca).strokeCircle(0,-86,6);}
    }
    if (f.kind !== 'hero') { g.fillStyle(0x17251f).fillRect(-20, -96, 40, 4); g.fillStyle(boss ? 0xd97856 : 0xd5ab70).fillRect(-20, -96, 40 * f.hp / f.max, 4); }
  }
  fall(scene:Phaser.Scene) {
    this.shadow.destroy();
    scene.tweens.add({targets:this.body,angle:this.body.scaleX<0?85:-85,y:this.body.y+14,alpha:0,duration:320,onComplete:()=>this.body.destroy(true)});
  }
  destroy() { this.body.destroy(true); this.shadow.destroy(); }
}
