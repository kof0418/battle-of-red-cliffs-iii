/** UI wall-clock countdown: gameplay time and rewards do not advance. */
export class ResumeCountdown {
 remaining=0;
 start(){this.remaining=3;}
 cancel(){this.remaining=0;}
 tick(seconds:number){this.remaining=Math.max(0,this.remaining-Math.max(0,Math.min(seconds,.25)));return this.remaining===0;}
}
