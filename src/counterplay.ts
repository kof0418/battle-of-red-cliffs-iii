/** Readable counterplay: aims commit at windup, responses never grant invulnerability. */
export const LOB={flight:.55,radius:54,damage:12};
export function adaptiveMove(kind:string):'sweep'|'charge'|'fan'|'ring'|'cross'{
 return kind==='marshal'?'charge':kind==='hunter'?'fan':kind==='frostlord'?'ring':kind==='regent'?'cross':'sweep';
}
export function attackFamily(move:string,weapon?:string){
 return move==='special'?'special':move==='wave'?'ranged':move==='aerial'?'aerial':weapon?'pickup':move==='mounted'?'mounted':'melee';
}
export function distributeTarget<T extends {id:number;x:number;y:number}>(enemy:{x:number;y:number},players:T[],assignments:number[],locked?:number){
 const score=(p:T)=>Math.hypot(p.x-enemy.x,(p.y-enemy.y)*2)+assignments.filter(id=>id===p.id).length*95;
 const sorted=[...players].sort((a,b)=>score(a)-score(b)||a.id-b.id),old=players.find(p=>p.id===locked);
 return old&&sorted[0]&&score(old)<=score(sorted[0])+100?old:sorted[0];
}
