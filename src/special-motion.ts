import type {HeroId} from './heroes.ts';
export function specialMotion(id:HeroId,progress:number){
 const p=Math.max(0,Math.min(1,progress)),lift=Math.sin(p*Math.PI);
 if(id==='guanyu')return {lift:lift*18,angle:p<.7?-Math.sin(p*5)*28:0};
 if(id==='zhangfei')return {lift:lift*3,angle:Math.sin(p*Math.PI)*12};
 if(id==='zhaoyun')return {lift:lift*36,angle:Math.sin(p*Math.PI)*42};
 if(id==='huangzhong')return {lift:lift*10,angle:Math.sin(p*Math.PI*4)*20};
 return {lift:lift*30,angle:-360*p};
}
