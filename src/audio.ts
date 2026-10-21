import {musicStep} from './music-score.ts';
import {HERO_IDS} from './heroes.ts';
import type {HeroId} from './heroes.ts';
import { DEFAULT_PREFERENCES, type Preferences } from './preferences.ts';
// Five original pentatonic phrases, synthesized locally. No sampled game music.
const THEMES = [
 [62,69,74,72,69,67,69,62,65,69,72,74,72,69,67,65],
 [57,64,67,69,72,69,67,64,60,64,67,72,74,72,67,64],
 [64,67,71,74,71,67,64,62,64,71,74,76,74,71,67,64],
 [55,62,65,67,70,67,65,62,58,62,65,70,67,65,62,55],
 [60,67,72,75,72,67,63,60,67,72,75,79,75,72,67,63],
];
export function weaponVoice(id:HeroId,hit:boolean,heavy:boolean) {
 const voices={
  guanyu:{pitch:210,end:65,duration:.16,type:'triangle'},
  zhangfei:{pitch:95,end:38,duration:.20,type:'sawtooth'},
  zhaoyun:{pitch:670,end:190,duration:.075,type:'triangle'},
  huangzhong:{pitch:890,end:330,duration:.14,type:'sine'},
  weiyan:{pitch:420,end:110,duration:.09,type:'triangle'},
 } as const;
 const v=voices[id];return {...v,pitch:v.pitch*(hit?.65:1)*(heavy?.8:1),duration:v.duration*(heavy?1.25:1),gain:hit?.065:.035};
}
export class Soundtrack {
 private context?: AudioContext;
 private music?: GainNode;
 private effects?: GainNode;
 private preferences: Preferences = { ...DEFAULT_PREFERENCES };
 private notes = new Set<OscillatorNode|AudioBufferSourceNode>();
 private voices=new Map<HeroId,AudioBuffer>();
 private voiceUntil=0;
 private beat = 0;
 private next = 0;
 private theme = '';
 private active = false;
 unlock() {
  try {
   if (!this.context) {
    this.context = new AudioContext();
    const master=this.context.createDynamicsCompressor?.();
    if(master){master.threshold.value=-10;master.knee.value=16;master.ratio.value=5;master.attack.value=.006;master.release.value=.18;master.connect(this.context.destination);}
    this.music = this.context.createGain(); this.music.connect(master??this.context.destination);
    this.effects = this.context.createGain(); this.effects.connect(master??this.context.destination);
    this.configure(this.preferences);
    if(typeof window!=='undefined')for(const id of HERO_IDS){const url=new URL(`./assets/voices/${id}.wav`,import.meta.url);void fetch(url).then(r=>{if(!r.ok)throw Error('voice');return r.arrayBuffer();}).then(b=>this.context!.decodeAudioData(b)).then(b=>this.voices.set(id,b)).catch(()=>{});}
   }
   void this.context.resume().catch(()=>{});
  } catch { /* Audio is optional. */ }
 }
 configure(p: Preferences) {
  this.preferences = {...p};
  if (this.context && this.music && this.effects) {
   this.music.gain.setTargetAtTime(p.muted ? 0 : p.music, this.context.currentTime, .02);
   this.effects.gain.setTargetAtTime(p.muted ? 0 : p.effects, this.context.currentTime, .02);
  }
 }
 private note(frequency: number, time: number, duration: number, gain: number, type: OscillatorType, bus: GainNode, musical: boolean, endFrequency?: number) {
  const context = this.context!;
  const oscillator = context.createOscillator(), envelope = context.createGain();
  oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,time);
  if(endFrequency)oscillator.frequency.exponentialRampToValueAtTime(endFrequency,time+duration);
  envelope.gain.setValueAtTime(0,time); envelope.gain.linearRampToValueAtTime(gain,time+.008);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+duration);
  oscillator.connect(envelope); envelope.connect(bus);
  this.notes.add(oscillator);
  oscillator.onended=()=>{this.notes.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
  oscillator.start(time); oscillator.stop(time+duration+.01);
 }
 weapon(id:HeroId,hit=false,heavy=false) {
  if(!this.context||!this.effects||this.preferences.muted)return;
  const v=weaponVoice(id,hit,heavy);
  this.note(v.pitch,this.context.currentTime,v.duration,v.gain,v.type,this.effects,false,v.end);
  if(hit)this.note(heavy?54:90,this.context.currentTime,.09,.08,'sine',this.effects,false,35);
 }
 effect(frequency: number, duration: number) {
  if (!this.context || !this.effects || this.preferences.muted) return;
  this.note(frequency,this.context.currentTime,duration,.12,'triangle',this.effects,false);
  if(frequency<100)this.note(frequency*.5,this.context.currentTime,duration*1.5,.14,'sine',this.effects,false);
 }
 specialVoice(id:HeroId){
  const ctx=this.context;if(!ctx||!this.effects||this.preferences.muted)return;
  const buffer=this.voices.get(id);
  if(buffer){const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=.5;source.connect(gain);gain.connect(this.effects);this.notes.add(source);source.onended=()=>{this.notes.delete(source);source.disconnect();gain.disconnect();};source.start();}
  else{const pitch={guanyu:112,zhangfei:83,zhaoyun:178,huangzhong:128,weiyan:150}[id];for(const harmonic of [5,8,12])this.note(pitch*harmonic,ctx.currentTime,.42,.045,'sine',this.effects,false,pitch*harmonic*.8);}
  this.voiceUntil=ctx.currentTime+.85;
  this.music?.gain.setTargetAtTime(this.preferences.music*.38,ctx.currentTime,.02);
 }
 pause() {
  this.active=false;
  for(const note of this.notes) {try{note.stop();}catch{/* already ended */}}
  this.notes.clear();
 }
 update(stage: number, boss: boolean, playing: boolean) {
  const context = this.context;
  if (!playing || !context || context.state !== 'running') { if(this.active)this.pause(); return; }
  const theme=`${stage}:${boss}`;
  if(!this.active || theme!==this.theme) {this.pause();this.active=true;this.theme=theme;this.beat=0;this.next=context.currentTime+.03;}
  this.music!.gain.setTargetAtTime(this.preferences.muted?0:this.preferences.music*(context.currentTime<this.voiceUntil?.38:1),context.currentTime,.08);
  const interval=stage>=2?musicStep(stage,boss,this.beat).interval:boss?.19:.25;
  if(this.next<context.currentTime-.5)this.next=context.currentTime;
  while(this.next<context.currentTime+.10) {
   if(stage>=2){for(const n of musicStep(stage,boss,this.beat).notes)this.note(440*2**((n.midi-69)/12),this.next,n.duration,n.gain,n.type,this.music!,true,n.end===undefined?undefined:440*2**((n.end-69)/12));this.next+=interval;this.beat++;continue;}
   const phrase=THEMES[stage%THEMES.length], pitch=phrase[this.beat%phrase.length];
   this.note(440*2**((pitch-69)/12),this.next,interval*.85,.055,'triangle',this.music!,true);
   if(this.beat%4===0)this.note(440*2**((phrase[0]-24-69)/12),this.next,interval*2,.09,'sine',this.music!,true);
   if(this.beat%2===0)this.note(boss?62:48,this.next,.07,.10,'sine',this.music!,true);
   this.next+=interval;this.beat++;
  }
 }
}
