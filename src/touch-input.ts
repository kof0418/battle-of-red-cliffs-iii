/** Pointer ownership avoids releasing an action still held by another finger. */
export class TouchInput {
 private pointers=new Map<number,Set<string>>();
 held=new Set<string>();
 change(pointer:number,actions:Iterable<string>){
  const previous=this.held;const next=new Set(actions);
  if(next.size)this.pointers.set(pointer,next);else this.pointers.delete(pointer);
  this.held=new Set([...this.pointers.values()].flatMap(set=>[...set]));
  return [...this.held].filter(action=>!previous.has(action));
 }
 owns(pointer:number){return this.pointers.has(pointer);}
 release(pointer:number){return this.change(pointer,[]);}
 reset(){this.pointers.clear();this.held.clear();}
}
/** Eight sectors plus a neutral centre; coordinates are relative to the full pad. */
export function directionAt(x:number,y:number,width:number,height:number):string[]{
 const dx=(x-width/2)/(width/2),dy=(y-height/2)/(height/2);
 if(Math.hypot(dx,dy)<.2)return [];
 const octant=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
 return [['right'],['right','down'],['down'],['left','down'],['left'],['left','up'],['up'],['right','up']][octant];
}
export function touchLayout(width:number,height:number,large=false){
 const landscape=width>height,scale=large&&landscape?1.15:1;
 const cell=Math.round(Math.min(76,Math.max(60,(landscape?height:width)*.16))*scale);
 const action=Math.round(Math.min(84,Math.max(64,(landscape?height:width)*.19))*scale);
 return {cell,action,pad:cell*3,landscape};
}
