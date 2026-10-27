import type {HeroId} from './heroes.ts';
export function specialMotion(id:HeroId,progress:number){
 const p=Math.max(0,Math.min(1,progress)),lift=Math.sin(p*Math.PI);
 if(id==='lubu')return {lift:lift*12,angle:Math.sin(p*Math.PI*3)*24};
 if(id==='guanyu')return {lift:lift*30,angle:p<.7?-Math.sin(p*5)*32:0};
 if(id==='zhangfei')return {lift:p<.55?0:Math.sin((p-.55)/.45*Math.PI)*4,angle:p<.2?-12:p<.55?18:8};
 if(id==='zhaoyun')return {lift:lift*44,angle:p<.25?-25:p<.7?32:12};
 if(id==='huangzhong')return {lift:0,angle:Math.sin(p*Math.PI*2)*6};
 return {lift:lift*30,angle:-360*p};
}
