import { parseSave, type SaveData } from './save.ts';
export const SLOT_COUNT=3;
const key=(index:number)=>{if(!Number.isInteger(index)||index<0||index>=SLOT_COUNT)throw new Error('無效的存檔槽。');return `red-banner-manual-${index+1}`;};
export function readSlot(storage:Pick<Storage,'getItem'>,index:number):SaveData|null {
 const text=storage.getItem(key(index));return text?parseSave(text):null;
}
export function writeSlot(storage:Pick<Storage,'setItem'>,index:number,save:SaveData) {
 const text=JSON.stringify(parseSave(JSON.stringify(save)));storage.setItem(key(index),text);
}
