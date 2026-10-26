export interface Horse {id:number;x:number;y:number;target:number;life:number;moving:boolean; falls?:number; awaitSeparation?:boolean; waiting?:boolean; fleeing?:boolean;}
export const MOUNT_SLASH={damage:34,reach:160,push:42,duration:.44,impact:.18};
export const MOUNT_WAVE={damage:48,reach:720,push:40,duration:.8,impact:.32};

export function mountedStrike(step:number,bow=false){
 const combo=Math.max(1,Math.min(3,step));
 return bow?{damage:combo===3?38:30,reach:480,push:30,duration:combo===2?.32:combo===3?.52:.40,impact:.14}
 :combo===2?{damage:30,reach:150,push:30,duration:.32,impact:.12}:combo===3?{damage:42,reach:180,push:65,duration:.56,impact:.22}:MOUNT_SLASH;
}
