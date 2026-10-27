import type {HeroId} from './heroes.ts';
// Hand position, torso lean and weapon angle for five impact-aligned poses.
type Pose=[number,number,number,number];
const MOTION:Record<HeroId,Pose[][]>={
 guanyu:[[[5,-46,-7,-1.5],[0,-48,-10,-1.8],[32,-42,6,1.5],[38,-37,8,1.7],[17,-48,0,-.25]],[[10,-24,-5,1.1],[3,-22,-8,1.3],[25,-68,3,-.2],[20,-77,-2,-.5],[17,-48,0,-.25]],[[2,-76,-7,-.1],[-3,-91,-11,-.2],[30,-20,14,2.7],[35,-10,18,2.95],[17,-48,0,-.25]]],
 zhangfei:[[[6,-42,-9,.1],[-3,-43,-14,.05],[45,-42,17,0],[49,-41,19,0],[17,-43,0,-.65]],[[-16,-50,-16,2.6],[-26,-58,-21,2.9],[27,-36,20,2.8],[36,-31,23,3.1],[17,-43,0,-.65]],[[3,-77,-8,-1.4],[0,-98,-14,-1.65],[20,-9,23,.9],[28,-4,28,1.1],[17,-43,0,-.65]]],
 zhaoyun:[[[4,-39,-4,-.05],[0,-39,-7,0],[43,-38,8,0],[38,-38,9,0],[17,-43,0,-.65]],[[7,-30,-4,.25],[2,-28,-7,.35],[46,-48,7,-.15],[40,-51,9,-.2],[17,-43,0,-.65]],[[0,-48,-6,-.15],[-5,-50,-9,-.2],[53,-38,10,0],[47,-35,11,.08],[17,-43,0,-.65]]],
 huangzhong:[[[15,-41,-2,0],[19,-41,-5,0],[20,-40,3,0],[18,-40,2,0],[17,-43,0,0]],[[12,-46,-3,-.12],[17,-49,-6,-.12],[22,-47,4,-.12],[19,-45,2,-.08],[17,-43,0,0]],[[11,-39,-4,.05],[17,-39,-8,.05],[25,-39,5,.05],[21,-40,3,0],[17,-43,0,0]]],
 weiyan:[[[2,-26,-6,.65],[5,-22,-8,.9],[34,-44,9,-.6],[24,-54,7,-1],[17,-43,0,-.55]],[[3,-60,-4,-1],[0,-65,-7,-1.25],[35,-30,8,.65],[29,-22,9,1],[17,-43,0,-.55]],[[0,-64,-7,-1.1],[-4,-70,-10,-1.4],[39,-36,11,.15],[43,-21,12,.85],[17,-43,0,-.55]]],
 lubu:[[[3,-64,-6,-.8],[7,-70,-9,-1],[39,-32,9,.12],[43,-18,11,.55],[17,-43,0,-.6]],[[6,-28,-5,.65],[2,-24,-8,.85],[37,-56,8,-.65],[34,-67,10,-.95],[17,-43,0,-.6]],[[0,-72,-8,-1.1],[-4,-79,-11,-1.45],[43,-30,11,.5],[46,-18,12,.9],[17,-43,0,-.6]]],
};
export function attackPhase(elapsed:number,impact:number,duration:number){
 if(elapsed<impact*.5)return 0;if(elapsed<impact)return 1;
 if(elapsed<impact+(duration-impact)*.25)return 2;
 if(elapsed<impact+(duration-impact)*.65)return 3;return 4;
}
export function heroMotion(id:HeroId,combo:number,phase:number){
 const p=Math.max(0,Math.min(4,phase)),[x,y,lean,angle]=MOTION[id][Math.max(0,Math.min(2,combo-1))][p];
 return {x,y,lean,angle,phase:p,stride:p===4?0:combo===3?9:6,crouch:p===2&&combo===3?(id==='zhangfei'?12:5):0};
}
export function aerialMotion(id:HeroId,descending:boolean,follow=false){
 const thrust=id==='zhaoyun',bow=id==='huangzhong';
 if(id==='guanyu')return {x:descending?34:10,y:descending?-12:-78,lean:descending?18:-8,angle:descending?2.7:-.1,stride:8,crouch:descending?5:0,phase:descending?2:1};
 if(id==='zhangfei')return {x:descending?12:4,y:descending?-65:-72,lean:descending?-13:-4,angle:descending?1.3:-1.5,stride:14,crouch:descending?8:0,phase:descending?2:1};
 if(follow&&thrust)return {x:44,y:-18,lean:18,angle:.65,stride:12,crouch:2,phase:2};
 return {x:descending?(thrust?38:bow?26:30):10,y:descending?-26:-65,lean:descending?12:-6,angle:descending?(thrust?.3:bow?.65:.9):-1.1,stride:descending?10:6,crouch:0,phase:descending?2:1};
}
export function grappleMotion(id:HeroId,pose:string,progress=0,back=false){
 const heavy=id==='zhangfei'||id==='lubu',p=Math.max(0,Math.min(1,progress));
 if(pose==='throw'&&id==='zhangfei')return {x:27,y:-96+Math.sin(p*Math.PI)*70,lean:18*Math.sin(p*Math.PI),stride:16,crouch:8*Math.sin(p*Math.PI)};
 if(pose==='throw')return {x:back?26-42*Math.sin(p*Math.PI):26,y:-66+Math.sin(p*Math.PI)*26,lean:(back?-1:1)*(heavy?10:7)*Math.sin(p*Math.PI),stride:10,crouch:Math.sin(p*Math.PI)*4};
 if(pose==='lift')return {x:27,y:-96,lean:-4,stride:9,crouch:2};
 if(pose==='air')return {x:27,y:-66,lean:-5,stride:8,crouch:0};
 return {x:27,y:-49,lean:heavy?-3:-1,stride:7,crouch:2};
}

export function closeMotion(move:'kick'|'bow-strike',phase:number,combo=3){
 const active=phase===2||phase===3;
 if(move==='kick'&&combo===2)return {x:12,y:-50,lean:active?-5:0,angle:-1.2,stride:0,crouch:2,phase};
 return move==='kick'?{x:active?-2:12,y:-52,lean:active?-9:0,angle:-1.2,stride:0,crouch:0,phase}
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
