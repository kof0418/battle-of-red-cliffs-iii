export type WeaponId='chain'|'crescent'|'knife'|'hammer'|'sword'|'axe';
export type LootId='meat'|'bun'|'book'|'gong'|WeaponId;
export const WEAPONS={
 chain:{name:'鎖鏈錘',uses:12,damage:24,reach:190,push:12,duration:.68,impact:.24},
 crescent:{name:'回旋月刃',uses:12,damage:22,reach:300,push:16,duration:.60,impact:.16},
 knife:{name:'小刀',uses:1,damage:38,reach:620,push:24,duration:.32,impact:.10},
 hammer:{name:'戰錘',uses:12,damage:45,reach:105,push:65,duration:.58,impact:.25},
 sword:{name:'長劍',uses:18,damage:29,reach:145,push:25,duration:.26,impact:.09},
 axe:{name:'戰斧',uses:14,damage:48,reach:125,push:48,duration:.52,impact:.23},
} as const;
export const isWeapon=(id:LootId):id is WeaponId=>id in WEAPONS;
// A varied, reproducible six-arena supply route; one crate per arena.
export function crateLoot(stage:number,wave:number):LootId{
 if(wave===2)return 'bun';
 if(wave===5)return 'meat';
 const weapons:WeaponId[]=['knife','sword','hammer','axe'];
 const slot=[1,3,4,6].indexOf(wave);
 return weapons[(Math.max(0,slot)+stage)%weapons.length];
}

export const barrelLoot=(stage:number,wave:number):LootId=>(stage+wave)%3===0?'gong':'book';

export const WEAPON_ROLES:Record<WeaponId,string>={chain:'甩出牽引／回掃',crescent:'往返投刃',knife:'單發遠投',sword:'快攻牽制',axe:'破盾重斬',hammer:'暈擊控場'};
/** Only one enemy weapon per arena; caller owns the budget. */
export function enemyWeapon(kind:string):WeaponId|undefined{
 return kind==='spearman'?'sword':kind==='hammer'||kind==='mauler'?'hammer':kind==='raider'?'knife':undefined;
}
export function weaponPickupReady(hero:{x:number;y:number;z:number;vz:number;dodge:number},item:{x:number;y:number}){
 return hero.z===0&&hero.vz===0&&hero.dodge===0&&Math.abs(hero.x-item.x)<=18&&Math.abs(hero.y-item.y)<=18;
}
