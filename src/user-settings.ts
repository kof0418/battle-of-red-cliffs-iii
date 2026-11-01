const allowed=(k:string)=>k==='red-banner-journal-v4'||k==='red-banner-controls-v1'||k==='red-banner-preferences-v1'||k.startsWith('red-banner-records-')||k.startsWith('red-banner-best-');
/** Persistent preferences and scores only; campaign snapshots are never read or written. */
export class UserSettings {
 private memory:Record<string,string>={};
 private storage:()=>Pick<Storage,'getItem'|'setItem'>;
 constructor(storage:()=>Pick<Storage,'getItem'|'setItem'>=()=>localStorage){this.storage=storage;}
 private read(){
  try {const s=JSON.parse(this.storage().getItem('red-cliffs-settings-v1')??'null');if(s&&typeof s==='object'&&!Array.isArray(s))return s as Record<string,string>;
   const legacy=JSON.parse(this.storage().getItem('red-banner-profile-v1')??'{}');return legacy&&typeof legacy==='object'?legacy:{};
  }catch{return {};}
 }
 getItem(key:string):string|null {if(!allowed(key))return null;const value=this.memory[key]??this.read()[key];if(typeof value==='string')return value;try{return this.storage().getItem(key);}catch{return null;}}
 setItem(key:string,value:string){if(!allowed(key))throw new Error('僅保存操作設定與戰績。');this.memory[key]=value;
  const entries=Object.fromEntries(Object.entries({...this.read(),...this.memory}).filter(([k,v])=>allowed(k)&&typeof v==='string'));
  this.storage().setItem('red-cliffs-settings-v1',JSON.stringify(entries));
 }
}
