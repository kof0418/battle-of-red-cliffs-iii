/** Development-only reproducible renderer probe. Never loaded by a release build. */
export class PerformanceQA {
 private elapsed=0;private index=0;private last=0;private renderStart=0;
 private frames:number[]=[];private render:number[]=[];private samples:unknown[]=[];
 readonly report=document.createElement('pre');done=false;
 constructor(private configure:(stage:number)=>void,private resources:()=>unknown,private cycles=2,private stages=9,private players=1){
  this.cycles=Math.max(1,Math.min(5,Math.floor(cycles)));
  this.report.id='performance-report';this.report.style.cssText='position:fixed;z-index:99999;left:8px;top:8px;max-height:95vh;overflow:auto;background:#10201fee;color:#fff;padding:10px;font:12px monospace;pointer-events:none';document.body.append(this.report);
  this.configure(0);
 }
 before(){const now=performance.now();if(this.last&&!this.done){const delta=now-this.last;this.elapsed+=delta;if(this.elapsed>750)this.frames.push(delta);}this.last=now;}
 preRender(){this.renderStart=performance.now();}
 postRender(){
  if(this.done)return;if(this.elapsed>750)this.render.push(performance.now()-this.renderStart);
  if(this.elapsed<4000){this.report.textContent=`${this.stages}關 ${this.players}P 效能量測 ${this.index+1}/${this.stages*this.cycles}`;return;}
  const sorted=[...this.frames].sort((a,b)=>a-b),mean=this.frames.reduce((a,b)=>a+b,0)/this.frames.length;
  this.samples.push({cycle:Math.floor(this.index/this.stages)+1,stage:this.index%this.stages+1,frames:sorted.length,fps:+(1000/mean).toFixed(1),p95ms:+sorted[Math.floor(sorted.length*.95)].toFixed(2),over33ms:sorted.filter(x=>x>33.34).length,renderCPUms:+(this.render.reduce((a,b)=>a+b,0)/this.render.length).toFixed(3),resources:this.resources()});
  this.index++;this.elapsed=0;this.frames=[];this.render=[];
  if(this.index>=this.stages*this.cycles){this.done=true;this.report.textContent=JSON.stringify({done:true,stages:this.stages,players:this.players,samples:this.samples},null,2);return;}
  this.configure(this.index%this.stages);this.last=performance.now();
 }
 destroy(){this.report.remove();}
}
