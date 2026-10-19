/** UI wall-clock countdown: gameplay time and rewards do not advance. */
export class ResumeCountdown {
 remaining=0;
 start(){this.remaining=3;}
 cancel(){this.remaining=0;}
 tick(seconds:number){this.remaining=Math.max(0,this.remaining-Math.max(0,Math.min(seconds,.25)));return this.remaining===0;}
}
export const LESSONS=[
 {title:'一、走位與面向',text:'用移動鍵或左搖桿上下左右走位。攻擊朝人物面向的同一路線；先靠近，再轉向敵人。'},
 {title:'二、三段連擊',text:'連按攻擊鍵，或開啟長按連擊。前兩擊銜接第三擊，傷害與擊退更強；受擊會中斷連擊。'},
 {title:'三、跳躍與閃身',text:'跳躍可避開地面招式，高處無法打中地面敵人。閃身有短暫無敵與冷卻，落地有短暫硬直。必殺技預設 I／手把 Y・△，地面施放耗 12 氣血、冷卻 8 秒，短暫無敵可解圍。'},
 {title:'四、箭雨與火線',text:'框線會先預警 1.4 秒，箭雨需移出框線或閃身，不能靠跳躍；火線可以跳過。餘燼已沒有傷害。警戒區會輪替至上下邊緣。'},
 {title:'五、補給與保存',text:'破箱後走近藥包補血，滿血時保留。設定頁有三個手動槽、完整備份與歷史戰績。載入後按繼續，倒數三秒再開戰。'},
];
