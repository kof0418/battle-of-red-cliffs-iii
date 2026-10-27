import type {HeroId} from './heroes.ts';
// Hand position, torso lean and weapon angle for five impact-aligned poses.
type Pose=[number,number,number,number];
const MOTION:Record<HeroId,Pose[][]>={
 guanyu:[[[5,-46,-7,-1.5],[0,-48,-10,-1.8],[32,-42,6,1.5],[38,-37,8,1.7],[17,-48,0,-.25]],[[10,-24,-5,1.1],[3,-22,-8,1.3],[25,-68,3,-.2],[20,-77,-2,-.5],[17,-48,0,-.25]],[[2,-76,-7,-.1],[-3,-91,-11,-.2],[30,-20,14,2.7],[35,-10,18,2.95],[17,-48,0,-.25]]],
 zhangfei:[[[6,-42,-9,.1],[-3,-43,-14,.05],[45,-42,17,0],[49,-41,19,0],[17,-43,0,-.65]],[[-16,-50,-16,2.6],[-26,-58,-21,2.9],[27,-36,20,2.8],[36,-31,23,3.1],[17,-43,0,-.65]],[[3,-77,-8,-1.4],[0,-98,-14,-1.65],[20,-9,23,.9],[28,-4,28,1.1],[17,-43,0,-.65]]],
 zhaoyun:[[[5,-40,-6,-.1],[-10,-42,-12,-.05],[48,-40,13,0],[55,-39,16,.04],[17,-43,0,-.65]],[[10,-22,-7,.8],[0,-16,-11,1.1],[25,-70,1,-1.1],[18,-82,-6,-1.5],[17,-43,0,-.65]],[[0,-66,-12,-2.1],[-17,-72,-18,-2.8],[33,-30,14,.65],[41,-24,20,1.6],[17,-43,0,-.65]]],
 huangzhong:[[[20,-42,-1,0],[25,-43,-4,0],[26,-42,3,0],[25,-41,2,0],[17,-43,0,0]],[[13,-37,-4,0],[17,-38,-9,0],[21,-37,7,0],[19,-35,5,0],[17,-43,0,0]],[[24,-48,-7,0],[30,-49,-12,0],[32,-48,5,0],[29,-45,8,0],[17,-43,0,0]]],
 weiyan:[[[0,-30,-9,1.0],[-8,-24,-13,1.3],[31,-48,11,-.65],[36,-54,15,-1.1],[17,-43,0,-.55]],[[10,-51,-5,-1.4],[7,-58,-11,-1.65],[8,-57,-15,-1.7],[10,-50,-9,-1.5],[17,-43,0,-.55]],[[12,-56,-7,-1.3],[-10,-61,-16,-1.8],[-8,-53,-22,-1.7],[0,-45,-12,-1.4],[17,-43,0,-.55]]],
 lubu:[[[0,-55,-9,-1.6],[-12,-61,-15,-2.1],[34,-39,12,.45],[40,-31,17,1.0],[17,-43,0,-.6]],[[4,-43,-8,.06],[-17,-43,-17,0],[49,-44,18,0],[56,-43,21,.04],[17,-43,0,-.6]],[[2,-81,-9,-1.4],[-7,-101,-16,-1.65],[31,-13,24,1.25],[40,-4,29,1.5],[17,-43,0,-.6]]],
};
export function attackPhase(elapsed:number,impact:number,duration:number){
 if(elapsed<impact*.5)return 0;if(elapsed<impact)return 1;
 if(elapsed<impact+(duration-impact)*.25)return 2;
 if(elapsed<impact+(duration-impact)*.65)return 3;return 4;
}
export function heroMotion(id:HeroId,combo:number,phase:number){
 const p=Math.max(0,Math.min(4,phase)),[x,y,lean,angle]=MOTION[id][Math.max(0,Math.min(2,combo-1))][p];
 return {x,y,lean,angle,phase:p,stride:p===4?0:combo===3?9:6,crouch:id==='huangzhong'&&combo===2&&p<4?12:p===2&&combo===3?(id==='zhangfei'?12:5):0};
}
export function aerialMotion(id:HeroId,descending:boolean,follow=false){
 const thrust=id==='zhaoyun',bow=id==='huangzhong';
 if(id==='weiyan')return {x:descending?35:0,y:descending?-34:-70,lean:descending?24:-15,angle:descending?1.05:-1.5,stride:descending?16:10,crouch:0,phase:descending?2:1};
 if(id==='lubu')return {x:descending?28:0,y:descending?-8:-93,lean:descending?20:-12,angle:descending?1.35:-1.6,stride:12,crouch:descending?9:0,phase:descending?2:1};
 if(id==='guanyu')return {x:descending?34:10,y:descending?-12:-78,lean:descending?18:-8,angle:descending?2.7:-.1,stride:8,crouch:descending?5:0,phase:descending?2:1};
 if(id==='zhangfei')return {x:descending?12:4,y:descending?-65:-72,lean:descending?-13:-4,angle:descending?1.3:-1.5,stride:14,crouch:descending?8:0,phase:descending?2:1};
 if(follow&&thrust)return {x:50,y:-19,lean:23,angle:.6,stride:14,crouch:2,phase:2};
 if(thrust)return {x:descending?22:8,y:descending?-38:-74,lean:descending?8:-7,angle:descending?1.05:-1.35,stride:7,crouch:0,phase:descending?2:1};
 if(bow)return {x:descending?30:8,y:descending?-33:-58,lean:descending?7:-12,angle:descending?.4:-1,stride:11,crouch:0,phase:descending?2:1};
 return {x:descending?(thrust?38:bow?26:30):10,y:descending?-26:-65,lean:descending?12:-6,angle:descending?(thrust?.3:bow?.65:.9):-1.1,stride:descending?10:6,crouch:0,phase:descending?2:1};
}
export function grappleMotion(id:HeroId,pose:string,progress=0,back=false){
 const heavy=id==='zhangfei'||id==='lubu',p=Math.max(0,Math.min(1,progress));
 if(pose==='throw'&&id==='weiyan')return {x:24-38*Math.sin(p*Math.PI),y:-40-18*Math.sin(p*Math.PI),lean:-24*Math.sin(p*Math.PI),stride:18,crouch:10*Math.sin(p*Math.PI)};
 if(pose==='throw'&&id==='lubu')return {x:18+16*Math.sin(p*Math.PI),y:-104+74*Math.sin(p*Math.PI),lean:20*Math.sin(p*Math.PI),stride:20,crouch:7*Math.sin(p*Math.PI)};
 if(pose==='throw'&&id==='zhaoyun')return {x:28+18*Math.sin(p*Math.PI),y:-48+22*Math.sin(p*Math.PI),lean:14*Math.sin(p*Math.PI),stride:14,crouch:7*Math.sin(p*Math.PI)};
 if(pose==='throw'&&id==='huangzhong')return {x:15-30*Math.sin(p*Math.PI),y:-72+15*Math.sin(p*Math.PI),lean:-10*Math.sin(p*Math.PI),stride:8,crouch:2};
 if(pose==='throw'&&id==='zhangfei')return {x:27,y:-96+Math.sin(p*Math.PI)*70,lean:18*Math.sin(p*Math.PI),stride:16,crouch:8*Math.sin(p*Math.PI)};
 if(pose==='throw')return {x:back?26-42*Math.sin(p*Math.PI):26,y:-66+Math.sin(p*Math.PI)*26,lean:(back?-1:1)*(heavy?10:7)*Math.sin(p*Math.PI),stride:10,crouch:Math.sin(p*Math.PI)*4};
 if(pose==='lift')return {x:27,y:-96,lean:-4,stride:9,crouch:2};
 if(pose==='air')return {x:27,y:-66,lean:-5,stride:8,crouch:0};
 return {x:27,y:-49,lean:heavy?-3:-1,stride:7,crouch:2};
}

export function closeMotion(move:'kick'|'bow-strike',phase:number,combo=3){
 const active=phase===2||phase===3;
 if(move==='bow-strike'){
  const x=combo===1?(active?34:14):combo===2?(active?26:2):(active?20:5),y=combo===1?(active?-35:-46):combo===2?(active?-25:-60):(active?-15:-82);
  return {x,y,lean:active?(combo===2?-8:combo===3?14:8):-4,angle:combo===1?.65:combo===2?1.6:active?.4:-.9,stride:combo===3?12:8,crouch:active&&combo===3?8:0,phase};
 }
 if(move==='kick'&&combo===2)return {x:active?8:13,y:active?-57:-49,lean:active?-15:-5,angle:active?-1.7:-1.2,stride:0,crouch:active?4:0,phase};
 return move==='kick'?{x:active?-8:12,y:active?-53:-58,lean:active?-22:-10,angle:-1.7,stride:0,crouch:active?3:0,phase}
 :{x:active?32:14,y:active?-35:-46,lean:active?8:-3,angle:.65,stride:active?8:0,crouch:0,phase};
}

export function mountedMotion(phase:number,back=false,charging=false){
 const active=phase===2||phase===3;

 return {x:(back?-1:1)*(active?28:18),y:-50,lean:charging?12:back?-7:active?6:0,angle:0,stride:0,crouch:0,phase};
}

/** Bow release point after the same rider scale, lean and saddle lift as Actor.draw.
 * Ground lane coordinates stay separate so mounted arrows still hit same-lane foes.
 */
export function mountedArrowVisual(face:number,shotFace:number,originOffset=20){
 const relative=shotFace*face,m=mountedMotion(2,relative<0);
 const angle=m.lean*face*Math.PI/180,scale=1.12;
 const x=(m.x+40*relative)*scale*face,y=(m.y-5)*scale;
 return {drawOffsetX:x*Math.cos(angle)-y*Math.sin(angle)-shotFace*originOffset,
  drawHeight:42-(x*Math.sin(angle)+y*Math.cos(angle))};
}

/** Release follows the rendered bow hand; collision remains on the ground lane. */
export function groundArrowVisual(face:number,step:number,originOffset=20){
 const m=heroMotion('huangzhong',step,2),angle=m.lean*face*Math.PI/180,scale=1.12;
 const x=(m.x+47)*scale*face,y=(m.y-5)*scale;
 return {drawOffsetX:x*Math.cos(angle)-y*Math.sin(angle)-face*originOffset,drawHeight:-(x*Math.sin(angle)+y*Math.cos(angle)+m.crouch)};
}
