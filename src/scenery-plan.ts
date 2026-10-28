/** Bound texture dimensions, including a partial final tile. */
export const SCENERY_TILE=1024;
export function sceneryTiles(width:number){return Array.from({length:Math.ceil(width/SCENERY_TILE)},(_,i)=>({x:i*SCENERY_TILE,width:Math.min(SCENERY_TILE,width-i*SCENERY_TILE)}));}

/** Inclusive padded bounds avoid seams and retain long weapons before they enter view. */
export function inView(x:number,width:number,left:number,viewport=960,padding=2){return x+width>=left-padding&&x<=left+viewport+padding;}
