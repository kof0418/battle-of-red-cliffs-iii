/** Bound texture dimensions, including a partial final tile. */
export const SCENERY_TILE=1024;
export function sceneryTiles(width:number){return Array.from({length:Math.ceil(width/SCENERY_TILE)},(_,i)=>({x:i*SCENERY_TILE,width:Math.min(SCENERY_TILE,width-i*SCENERY_TILE)}));}
