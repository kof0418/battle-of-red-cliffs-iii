import type {HeroId} from './heroes.ts';
// Hand position, torso lean and weapon angle for five impact-aligned poses.
type Pose=[number,number,number,number];
const MOTION:Record<HeroId,Pose[][]>={
 guanyu:[[[6,-63,-5,-.9],[10,-57,-7,-.6],[32,-38,7,.05],[37,-29,9,.45],[17,-48,0,-.25]],[[8,-30,-6,1],[9,-25,-9,.85],[29,-58,5,-.75],[25,-66,8,-1],[17,-48,0,-.25]],[[3,-70,-8,-1.25],[0,-77,-10,-1.5],[36,-35,10,.35],[40,-21,12,.9],[17,-48,0,-.25]]],
 zhangfei:[[[1,-63,-6,-.65],[6,-68,-9,-.9],[29,-32,9,.14],[35,-25,11,.4],[17,-43,0,-.65]],[[5,-28,-6,.7],[0,-23,-8,.9],[30,-57,7,-.7],[32,-65,9,-1],[17,-43,0,-.65]],[[0,-71,-8,-1],[0,-78,-11,-1.3],[36,-29,11,.5],[40,-17,12,.9],[17,-43,0,-.65]]],
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
 return {x,y,lean,angle,phase:p,stride:p===4?0:combo===3?9:6,crouch:p===2&&combo===3?3:0};
}
export function aerialMotion(id:HeroId,descending:boolean){
 const thrust=id==='zhaoyun',bow=id==='huangzhong';
 return {x:descending?(thrust?38:bow?26:30):10,y:descending?-26:-65,lean:descending?12:-6,angle:descending?(thrust?.3:bow?.65:.9):-1.1,stride:descending?10:6,crouch:0,phase:descending?2:1};
}
export function grappleMotion(id:HeroId,pose:string,progress=0,back=false){
 const heavy=id==='zhangfei'||id==='lubu',p=Math.max(0,Math.min(1,progress));
 if(pose==='throw')return {x:back?26-42*Math.sin(p*Math.PI):26,y:-66+Math.sin(p*Math.PI)*26,lean:(back?-1:1)*(heavy?10:7)*Math.sin(p*Math.PI),stride:10,crouch:Math.sin(p*Math.PI)*4};
 if(pose==='air')return {x:27,y:-66,lean:-5,stride:8,crouch:0};
 return {x:27,y:-49,lean:heavy?-3:-1,stride:7,crouch:2};
}

export function closeMotion(move:'kick'|'bow-strike',phase:number){
 const active=phase===2||phase===3;
 return move==='kick'?{x:active?-2:12,y:-52,lean:active?-9:0,angle:-1.2,stride:0,crouch:0,phase}
 :{x:active?32:14,y:active?-35:-46,lean:active?8:-3,angle:.65,stride:active?8:0,crouch:0,phase};
}

export function mountedMotion(phase:number,back=false,charging=false){
 const active=phase===2||phase===3;
 return {x:(back?-1:1)*(active?28:18),y:-50,lean:charging?12:back?-7:active?6:0,angle:0,stride:0,crouch:0,phase};
}
