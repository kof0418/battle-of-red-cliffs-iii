import {parseSave} from './save.ts';
import {parsePreferences,PREFERENCES_KEY} from './preferences.ts';
import {parseBindings,CONTROL_KEY,ACTIONS} from './controls.ts';
import {parseRecords} from './records.ts';
export const PROFILE_KEY='red-banner-profile-v1';
export const PROFILE_KEYS=['red-banner-save-v1',...Array.from({length:3},(_,i)=>`red-banner-manual-${i+1}`),PREFERENCES_KEY,CONTROL_KEY,'red-banner-tutorial-v1',...['v1','v11','v12','v13','v13special'].map(v=>`red-banner-records-${v}`),...['v03','v11','v12','v13','v13special'].map(v=>`red-banner-best-${v}`)];
export type Entries=Record<string,string>;
/** A single localStorage commit keeps a full restore atomic, including quota failure. */
export class ProfileStorage {
 private storage:Pick<Storage,'getItem'|'setItem'>;
 constructor(storage:Pick<Storage,'getItem'|'setItem'>){this.storage=storage;}
 snapshot():Entries {
  const root=this.storage.getItem(PROFILE_KEY);
  if(root!==null){const value=JSON.parse(root);if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([k,v])=>!PROFILE_KEYS.includes(k)||typeof v!=='string'))throw new Error('裝置資料無法讀取；請以完整備份還原。');return value;}
  const out:Entries={};for(const key of PROFILE_KEYS){const value=this.storage.getItem(key);if(value!==null)out[key]=value;}return out;
 }
 getItem(key:string){return this.snapshot()[key]??null;}
 setItem(key:string,value:string){if(!PROFILE_KEYS.includes(key))throw new Error('未知的資料欄位。');this.replace({...this.snapshot(),[key]:value});}
 replace(entries:Entries){this.storage.setItem(PROFILE_KEY,JSON.stringify(entries));}
}
export const MAX_BACKUP_BYTES=1024*1024;
export function exportProfile(storage:ProfileStorage){return JSON.stringify({format:'red-banner-backup',schema:1,createdAt:new Date().toISOString(),entries:storage.snapshot()},null,2);}
export function parseBackup(text:string):Entries {
 if(new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('完整備份超過 1 MB。');
 const b=JSON.parse(text);if(b?.format!=='red-banner-backup'||b.schema!==1||!b.entries||typeof b.entries!=='object'||Array.isArray(b.entries))throw new Error('不是有效的赤壁之戰三完整備份。');
 const result:Entries={};
 for(const [key,value] of Object.entries(b.entries)){
  if(!PROFILE_KEYS.includes(key)||typeof value!=='string')throw new Error('備份含有未知欄位。');
  if(key==='red-banner-save-v1'||key.startsWith('red-banner-manual-')){parseSave(value);result[key]=value;continue;}
  if(key.startsWith('red-banner-best-')){const n=Number(value);if(!Number.isInteger(n)||n<0||n>1e8)throw new Error('最高分無效。');result[key]=String(n);continue;}
  const data=JSON.parse(value);
  if(key===PREFERENCES_KEY){if(!data||typeof data!=='object')throw new Error('設定無效。');result[key]=JSON.stringify(parsePreferences(data));}
  else if(key===CONTROL_KEY){const parsed=parseBindings(data);if(ACTIONS.some(a=>!(a==='special'&&data?.[a]===undefined)&&parsed[a]!==data?.[a]))throw new Error('按鍵設定無效。');result[key]=JSON.stringify(parsed);}
  else if(key==='red-banner-tutorial-v1'){if(typeof data!=='boolean')throw new Error('教學進度無效。');result[key]=JSON.stringify(data);}
  else{if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('戰績無效。');const parsed=parseRecords(data);if(Object.keys(parsed).length!==Object.keys(data).length)throw new Error('戰績無效。');result[key]=JSON.stringify(parsed);}
 }
 return result;
}
