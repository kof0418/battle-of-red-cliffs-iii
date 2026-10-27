import type { Input } from './combat.ts';
/** Run combat at 60 Hz, retaining single presses between high-refresh frames. */
export class FixedStep {
  private remaining = 0;
  private pending: Input = { x: 0, y: 0 };
  reset() { this.remaining = 0; this.pending = { x: 0, y: 0 }; }
  advance(seconds: number, input: Input, active: boolean, tick: (dt: number, input: Input) => void) {
    if (!active) { this.reset(); return; }
    if (!Number.isFinite(seconds) || seconds < 0) return;
    this.pending = { partner:input.partner?mergeInput(this.pending.partner,input.partner):undefined,x: input.x, y: input.y, attack: this.pending.attack || input.attack,
      dropWeapon:this.pending.dropWeapon||input.dropWeapon, horseSpecial:this.pending.horseSpecial||input.horseSpecial, throwX: input.throwX??this.pending.throwX, grappleAttack: this.pending.grappleAttack || input.grappleAttack, special: this.pending.special || input.special, jump: this.pending.jump || input.jump, dodge: this.pending.dodge || input.dodge };
    // Bound catch-up after a stall; normal 10–144 Hz rendering preserves elapsed time.
    this.remaining += Math.min(seconds, .25);
    const step = 1 / 60;
    while (this.remaining + 1e-9 >= step) {
      tick(step, this.pending);
      this.pending = { x: input.x, y: input.y,partner:input.partner?{x:input.partner.x,y:input.partner.y}:undefined };
      this.remaining = Math.max(0, this.remaining - step);
    }
  }
}

function mergeInput(previous:Input|undefined,next:Input):Input{
 const result:Input={x:next.x,y:next.y,throwX:next.throwX??previous?.throwX};
 for(const key of ['attack','jump','dodge','special','horseSpecial','dropWeapon','grappleAttack'] as const)result[key]=!!next[key]||!!previous?.[key];
 return result;
}
