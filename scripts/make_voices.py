"""Original clean voiced battle cries; no sampled or cloned performer voices.

Smooth harmonic source, fixed vowel resonances and gentle pitch articulation.
No saturation, rapid pitch jitter or amplitude chopping (the old raspy sound).
"""
import math
import wave
import struct
from pathlib import Path

# pitch, duration, vowel formants, ending pitch ratio
profiles = {
    'guanyu': (148, .46, [730, 1120, 2400], .92),
    'zhangfei': (122, .48, [780, 1180, 2300], .88),
    'zhaoyun': (205, .34, [560, 1720, 2600], 1.04),
    'huangzhong': (166, .42, [610, 1280, 2450], .94),
    'weiyan': (184, .36, [800, 1350, 2500], .90),
}
out = Path(__file__).resolve().parents[1] / 'src/assets/voices'
out.mkdir(parents=True, exist_ok=True)
rate = 22050
for name, (pitch, duration, formants, ending) in profiles.items():
    data, phase = [], 0
    for i in range(int(rate * duration)):
        t = i / rate
        p = t / duration
        # Small, smooth rise into the cry, then a controlled ending.
        f = pitch * (1 + .065 * math.sin(math.pi * p) + (ending - 1) * p)
        phase += 2 * math.pi * f / rate
        value = 0
        for k in range(1, 33):
            hz = k * f
            # Fixed formants retain an open vowel as pitch moves. Fundamental
            # and low harmonics keep body, instead of a thin nasal buzz.
            resonance = sum(g * math.exp(-.5 * ((hz - v) / bw) ** 2)
                            for v, bw, g in zip(formants, [180, 240, 320], [1, .65, .16]))
            weight = (.20 + 2.3 * resonance) / k ** 1.65
            weight *= math.exp(-(hz / 3200) ** 2)
            value += weight * math.sin(k * phase)
        attack = math.sin(min(1, t / .035) * math.pi / 2) ** 2
        release = math.sin(min(1, (duration - t) / .12) * math.pi / 2) ** 2
        data.append(value * attack * release * (1 - .25 * p))
    # Remove DC, retain headroom, and never distort or hard-limit the waveform.
    mean = sum(data) / len(data)
    data = [v - mean for v in data]
    peak = max(abs(v) for v in data)
    pcm = [round(v / peak * 21000) for v in data]
    with wave.open(str(out / (name + '.wav')), 'wb') as w:
        w.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
        w.writeframes(struct.pack('<' + 'h' * len(pcm), *pcm))
    print(name, 'seconds', duration, 'peak', max(map(abs, pcm)))
