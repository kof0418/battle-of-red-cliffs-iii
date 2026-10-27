export interface Horse {id:number;x:number;y:number;target:number;life:number;moving:boolean; falls?:number; awaitSeparation?:boolean; waiting?:boolean; fleeing?:boolean; remountAt?:number;}
export const MOUNT_SLASH={damage:34,reach:160,push:42,duration:.44,impact:.18};
export const MOUNT_WAVE={damage:48,reach:720,push:40,duration:.8,impact:.32};

export function mountedStrike(step:number,bow=false){
 const combo=Math.max(1,Math.min(3,step));
 return bow?{damage:combo===2?14:combo===3?38:30,reach:480,push:combo===2?12:30,duration:combo===2?.46:combo===3?.52:.40,impact:combo===2?.10:.14}
 :combo===2?{damage:30,reach:150,push:30,duration:.32,impact:.12}:combo===3?{damage:42,reach:180,push:65,duration:.56,impact:.22}:MOUNT_SLASH;
}

/** Original mounted follow-ups: short repeated contacts, not an extra command button. */
export function mountedContacts(step:number,bow:boolean){return step===2?(bow?[.10,.22,.34]:[.12,.26]):[];}
export function cavalryRecovery(a:{move:string;elapsed:number;impact:number}|null|undefined){return !!a&&a.move==='cavalry'&&a.elapsed>=a.impact+.42;}
export const MOUNT_THROW={lift:.26,flight:.46,height:112,distance:230,damage:48};

/** Reset the rider's visible windup before each rapid contact. */
export function mountedPosePhase(step:number,bow:boolean,elapsed:number,fallback:number){
 if(step!==2)return fallback;
 const times=mountedContacts(step,bow);
 const previous=[...times].reverse().find(t=>elapsed>=t);
 return previous!==undefined&&elapsed-previous<.065?2:elapsed<times[times.length-1]?1:4;
}
