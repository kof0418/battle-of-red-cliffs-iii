# 赤旌 · Three Kingdoms Battle

v0.1 原創三國街機橫向動作原型。Phaser 3 + TypeScript + Vite，960 × 540 像素畫面。角色、場景與音效均由程式原創繪製／合成，沒有使用《吞食天地 II》的圖像、音樂、角色造型或地圖。

## 遊玩

Enter 或點擊遊戲開始；WASD／方向鍵上下左右走位；J 攻擊（連按觸發三段連擊）；K／空白鍵跳躍；P 暫停；R 重新開始。手機畫面提供觸控按鈕。切離視窗會暫停，回來按 P。

主角沈烈以長刀攻擊前方同一深度的敵人；第三段傷害與擊退更強。跳到高處可避開地面攻擊。敵人頭上的金色提示表示即將出招，可上下走位閃避。清場回復 25 點生命並向右前進，通過兩陣後挑戰守關將軍。擊倒最後一陣所有敵人獲勝，生命歸零可重試。

敵兵：步卒（均衡）、游騎（快速）、重甲（耐打）、鐵獄守將（高血量、長距離重擊）。三波敵人、生命條、命中停頓、震動、擊退、合成音效、計分、勝敗與重開皆已實作。此版沒有存檔或多人連線。

## 開發與建置

建議 Node.js 22.12+ 與 npm。使用鎖定檔可重現安裝。

```sh
npm ci
npm run dev
# http://127.0.0.1:5173
npm test
npm run build
npm run preview
```

`dist/` 是完整靜態網站，正式執行不需要 Node.js、資料庫或外部素材服務。也可執行 `python3 -m http.server 8080 --directory dist`。請透過 HTTP 開啟，不要雙擊 HTML。相對資源路徑支援子目錄部署。

## Docker / Nginx

```sh
docker compose up --build -d
# http://localhost:8080
docker compose down
```

也可把 `dist/` 放到任何靜態網站伺服器。參考 `docker/nginx.conf`；正式對外服務的 HTTPS 由部署端反向代理管理。

## Tauri 2 桌面架構

`src-tauri/` 提供 Rust 入口、Tauri 2 設定、開發與建置掛鉤。共用 Web 核心，無需複製遊戲邏輯。

```sh
npm run desktop:dev
npm run desktop:build
```

先安裝 Rust stable 與目標平台工具鏈。Windows 需 MSVC C++ Build Tools、Windows SDK 與 WebView2；macOS 需 Xcode command-line tools。Windows 安裝程式請在 Windows 建置，macOS app 請在 macOS 建置。離線 Windows 發行還需決定 WebView2 離線安裝策略；正式發行前補齊圖示、簽章及公證。本次交付為封裝骨架，未宣稱已產出 EXE／APP。

## 原始碼

- `src/main.ts`：Phaser 場景、程序像素繪圖、輸入、敵人 AI、波次與 HUD。
- `src/combat.ts`：角色數值、深度與方向命中判定、連擊窗口。
- `src/style.css`：街機外框、響應式版面與觸控操作。
- `tests/combat.test.ts`：方向、攻擊距離、深度、連擊與角色差異測試。

下一版可拆分場景與角色系統、加入逐格動畫、敵人繞行及 Boss 多階段招式。此原型採程序化像素人物，不是完整美術製作版。
