export type WeaponId='knife'|'hammer'|'sword'|'axe';
export type LootId='meat'|'bun'|'book'|'gong'|WeaponId;
export const WEAPONS={
 knife:{name:'小刀',uses:1,damage:38,reach:620,push:24,duration:.32,impact:.10},
 hammer:{name:'戰錘',uses:12,damage:45,reach:105,push:65,duration:.58,impact:.25},
 sword:{name:'長劍',uses:18,damage:29,reach:145,push:25,duration:.32,impact:.12},
 axe:{name:'戰斧',uses:14,damage:38,reach:125,push:48,duration:.46,impact:.19},
} as const;
export const isWeapon=(id:LootId):id is WeaponId=>id in WEAPONS;
// A varied, reproducible six-arena supply route; one crate per arena.
export function crateLoot(stage:number,wave:number):LootId{
 return (['meat','knife','bun','sword','hammer','axe'] as const)[(wave-1+stage*2)%6];
}

export const barrelLoot=(stage:number,wave:number):LootId=>(stage+wave)%3===0?'gong':'book';
