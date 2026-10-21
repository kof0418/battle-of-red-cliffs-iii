"""Original formant-synthesized battle cries, no recordings or cloned voices."""
import math, wave, struct
from pathlib import Path
profiles={'guanyu':(112,.72,[760,1130,2500],1),'zhangfei':(83,.84,[680,1050,2350],1),'zhaoyun':(178,.55,[450,1800,2850],2),'huangzhong':(128,.74,[550,1350,2450],2),'weiyan':(150,.62,[820,1250,2650],1)}
out=Path(__file__).resolve().parents[1]/'src/assets/voices'
for name,(pitch,duration,formants,pulses) in profiles.items():
 rate=22050;data=[];phase=0
 harmonics=[]
 for k in range(1,45):
  hz=k*pitch
  weight=sum(math.exp(-.5*((hz-f)/bw)**2)*gain for f,bw,gain in zip(formants,[110,160,220],[1,.7,.35]))/math.sqrt(k)
  harmonics.append((k,weight))
 for i in range(int(rate*duration)):
  t=i/rate;p=t/duration
  f=pitch*(1.14-.28*p+.025*math.sin(t*43)+.012*math.sin(t*137));phase+=2*math.pi*f/rate
  value=sum(w*math.sin(k*phase) for k,w in harmonics)
  envelope=min(1,t/.035)*min(1,(duration-t)/.10)*(1-.35*p)
  if pulses==2:envelope*=.22+.78*abs(math.sin(p*math.pi*2))
  value=math.tanh(value*1.8)*envelope
  data.append(value)
 peak=max(abs(x) for x in data)
 with wave.open(str(out/(name+'.wav')),'wb') as w:
  w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(b''.join(struct.pack('<h',int(x/peak*22000)) for x in data))
 print(name,len(data)/rate)
