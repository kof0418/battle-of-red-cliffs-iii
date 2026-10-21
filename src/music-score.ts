export interface ScoreNote {midi:number;duration:number;gain:number;type:OscillatorType;end?:number;}
const scores=[
 {bpm:144,roots:[40,43,45,40,48,43,45,47],motif:[76,0,79,83,81,79,76,74,76,79,83,86,83,81,79,76]},
 {bpm:120,roots:[38,38,41,43,46,41,43,45],motif:[62,69,0,74,72,69,65,62,65,69,74,77,76,74,69,65]},
 {bpm:156,roots:[36,39,44,43,36,44,39,43],motif:[72,75,79,0,82,79,75,72,79,82,84,87,84,82,79,75]},
];
export function musicStep(stage:number,boss:boolean,step:number){
 const score=scores[Math.max(0,Math.min(2,stage-2))],interval=60/(score.bpm+(boss?16:0))/4;
 const bar=Math.floor(step/16)%16,beat=step%16,root=score.roots[bar%8],section=Math.floor(bar/4),notes:ScoreNote[]=[];
 const add=(midi:number,duration:number,gain:number,type:OscillatorType='triangle',end?:number)=>notes.push({midi,duration,gain,type,end});
 // Sixteen bars: establish pulse, build harmony, answer the melody, then a climactic return.
 if(beat%2===0){const pos=(Math.floor(step/2)+(section===2?8:0))%score.motif.length,pitch=score.motif[pos];if(pitch){add(pitch,interval*(beat===14?3.4:1.65),boss?.075:.06,'triangle');if(stage===4)add(pitch-12,interval*1.5,.025,'square');}}
 if(beat%4===0)add(root+(beat===8?12:0),interval*3.4,.15,'triangle');
 if(beat===0&&section!==0)for(const offset of [12,15,19])add(root+offset,interval*12,.027,'triangle');
 if(section>=1||boss){const arpeggio=[0,7,12,15][beat%4];add(root+24+arpeggio,interval*.8,.025,'triangle');}
 // Tuned low drum, snare-like stacked overtones and high ticks.
 if(beat===0||beat===8||(boss&&beat===11)){add(43,.19,.27,'sine',28);add(67,.035,.035,'triangle',45);}
 if(beat===4||beat===12){add(50,.12,.10,'triangle',36);add(98,.07,.035,'square',69);}
 if(beat%2===0)add(116,.025,.013,'square',100);
 if(bar%4===3&&beat>=12)add(58-(beat-12)*3,.10,.11,'triangle',38);
 if(beat===0&&bar%4===0)add(104,.38,.018,'square',86);
 return {interval,notes,bar,section};
}
