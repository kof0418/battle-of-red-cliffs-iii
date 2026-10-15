export type Kind = 'hero' | 'soldier' | 'raider' | 'heavy' | 'boss';
export const stats = { hero:{hp:140,speed:170,damage:12}, soldier:{hp:42,speed:65,damage:8}, raider:{hp:32,speed:115,damage:6}, heavy:{hp:76,speed:43,damage:14}, boss:{hp:360,speed:60,damage:19} };
export function inRange(ax:number,ay:number,bx:number,by:number,facing:number,reach:number){return Math.abs(by-ay)<30 && (bx-ax)*facing>-12 && (bx-ax)*facing<reach;}
export function comboStep(previous:number,last:number,now:number){return now-last<650?previous%3+1:1;}
