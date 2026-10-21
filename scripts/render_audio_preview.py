import json,math,wave,struct
from pathlib import Path
scores=json.load(open('/tmp/music-score-preview.json'));out=Path(__file__).resolve().parents[3]/'audio-preview';out.mkdir(exist_ok=True)
rate=22050
for label,steps in zip(['bamboo','snow','palace'],scores):
 duration=sum(s['interval'] for s in steps)+1;audio=[0.0]*int(duration*rate);start=0
 for step in steps:
  for n in step['notes']:
   freq=440*2**((n['midi']-69)/12);end=440*2**((n['end']-69)/12) if 'end' in n else freq;phase=0
   for j in range(int(n['duration']*rate)):
    t=j/rate;f=freq*(end/freq)**(t/n['duration']);phase+=f/rate
    v=math.sin(2*math.pi*phase) if n['type']=='sine' else (1 if phase%1<.5 else -1) if n['type']=='square' else 2/math.pi*math.asin(math.sin(2*math.pi*phase))
    env=t/.008 if t<.008 else (.0001/n['gain'])**((t-.008)/max(.001,n['duration']-.008))
    idx=int(start*rate)+j
    if idx<len(audio):audio[idx]+=v*env*n['gain']*.8
  start+=step['interval']
 peak=max(abs(x) for x in audio)
 with wave.open(str(out/(label+'.wav')),'wb') as w:
  w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(b''.join(struct.pack('<h',int(max(-.95,min(.95,v))*32767)) for v in audio))
 print(label,'seconds',round(duration,1),'peak',round(peak,3))
parts=[]
for id in ['guanyu','zhangfei','zhaoyun','huangzhong','weiyan']:
 with wave.open(str(Path(__file__).resolve().parents[1]/'src/assets/voices'/(id+'.wav')),'rb') as r:parts.append(r.readframes(r.getnframes()));parts.append(bytes(int(rate*.45)*2))
with wave.open(str(out/'five-hero-cries.wav'),'wb') as w:w.setparams((1,2,rate,0,'NONE','not compressed'));w.writeframes(b''.join(parts))
