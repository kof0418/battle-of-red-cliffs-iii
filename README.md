# 赤壁之戰三 · v4.0.2

原創三國題材橫向動作遊戲，以 Phaser 3、TypeScript 與 Vite 製作，遊戲畫面為 960 × 540。提供網頁版與 Tauri 2 封裝的 Mac 離線版。

[遊玩網頁版](https://red-banner-three-kingdoms-jl.kof0418.chatgpt.site/)

## 遊戲內容

- 六名武將：關羽、張飛、趙雲、黃忠、魏延、呂布，各有連擊、必殺與摔技。
- 完整九關與五關短戰役，可選起始關卡；九關戰役終章可選追擊或護送路線。
- 單人與本機雙人合作，支援鍵盤、標準映射手把與觸控操作。
- 六步新手教學、自由練習與馬戰練習。
- 拾取武器、補血道具、騎乘戰鬥、敵將圖鑑與逐關評級。
- 結局頁、通關回顧與最近 20 次通關紀錄。

v4.0.2 已改善六將前摔／背摔的抓握、腰肩轉動及收臂銜接；包含先前的頭目牆角脫困、奔來馬匹跨陣／跨關保留、增加敵人補品掉落及可調接關次數。

## 開始遊玩

主選單可直接開始遊戲，或先進入「新手教學／練習場」。選將時選擇武將、戰役長度、起始關卡與遊玩模式，再按出陣。

### 單人預設操作

| 動作 | 鍵盤 |
| --- | --- |
| 移動 | WASD／方向鍵 |
| 攻擊 | J |
| 跳躍／騎乘時下馬 | K／空白鍵 |
| 衝撞／馬匹突擊 | L |
| 暫停與設定 | P／Esc |
| 必殺技 | 下 → 上 → 新按一次攻擊 |
| 騎乘指令技 | 左 → 右 → 新按一次攻擊 |

靠近並推向敵人可抓取；抓住後按左右＋攻擊進行方向摔，或跳躍後按攻擊進行空中摔。完整操作、按鍵重設與手把配置請見遊戲內「設定／操作」。

### 本機雙人

| 玩家 | 移動 | 攻擊 | 跳躍 | 衝撞 |
| --- | --- | --- | --- | --- |
| 1P | WASD | J | K／空白鍵 | L |
| 2P | 方向鍵 | U／數字鍵盤 1 | I／數字鍵盤 2 | O／數字鍵盤 3 |

雙人共用接關額度，各自擁有血量與武器。支援一副鍵盤搭配手把；目前不提供網路連線或三人合作。

### 難度、補給與接關

- 出征前可選休閒、標準或挑戰難度。
- 「設定／操作 → 接關、音效、顯示與按鍵設定」可選 **2／5／10／20／99 次**接關，預設 10 次。
- 途中可調整接關總額，剩餘次數為總額減去本次已使用次數。
- 肉補回 40 點氣血、饅頭補回 25 點；滿血時保留食物。進入下一關前，存活武將補回 12 點氣血。
- 清陣後向右前進；全員敗陣時可消耗接關額度重試當前一陣，分數回退到本陣起點。

### 資料保存

只保存操作設定、音量、最高分及通關回顧，**不保存戰鬥中的進度**。重新整理、關閉或重新出征會開始新的戰役。網頁版與 Mac 版的本機資料各自獨立；瀏覽器無法儲存時仍可遊玩，但資料可能只在當次工作階段保留。

## 本機開發與網頁建置

需要 Node.js 22.18 以上與 npm。在本目錄執行：

```sh
npm ci
npm run dev
```

開發網址以終端顯示為準，預設為 `http://127.0.0.1:5173/`。

```sh
npm test          # 執行遊戲規則與回歸測試
npm run build    # TypeScript 檢查與正式網頁建置
npm run preview  # 預覽正式建置
```

`dist/` 是可部署的靜態網頁，無需後端或外部素材服務。請透過 HTTP 開啟，不要直接雙擊 HTML：

```sh
python3 -m http.server 8080 --directory dist
```

專案亦提供 Docker／Nginx 設定：

```sh
docker compose up --build -d
# 開啟 http://localhost:8080
docker compose down
```

Sites 部署設定位於 `.openai/hosting.json`，靜態輸出目錄為 `dist/`。

## Mac 版與打包

目前 Mac 版為 **v4.0.2**，適用 Apple Silicon（M 系列晶片）、macOS 12 以上，可離線執行。下載包解壓縮後開啟「赤壁之戰三.app」；詳細使用方式見 [MACOS.md](MACOS.md)。

建置需額外安裝 Rust 與 macOS 開發工具：

```sh
npm run desktop:dev
npm run desktop:build:mac
```

預設 App 輸出位置：

```text
src-tauri/target/aarch64-apple-darwin/release/bundle/macos/赤壁之戰三.app
```

若設定 `CARGO_TARGET_DIR`，輸出會改到該目錄下相同的架構與封裝子目錄。更新版本時應同步 `package.json`、`package-lock.json`、`src-tauri/Cargo.toml`、`src-tauri/Cargo.lock` 及 `src-tauri/tauri.conf.json` 的版本資料與視窗標題。

此版採 ad-hoc 簽署，未經 Apple Developer ID 簽署或公證；下載到其他 Mac 時可能出現安全性提示。尚未提供 Intel Mac 與 Windows 發行包。

### 發行壓縮包

```sh
npm run release
```

此指令執行測試與網頁建置，再於 `release/` 產生原始碼、網頁壓縮包及 SHA-256 校驗檔；不會自動建置 Mac App。已有 Mac App 時可一併封裝：

```sh
python3 scripts/package_release.py --mac-app "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/赤壁之戰三.app"
```

## 目錄與文件

| 路徑 | 用途 |
| --- | --- |
| `index.html` | 網頁入口與介面結構 |
| `src/` | 戰鬥規則、繪圖、輸入、音效、設定與樣式 |
| `tests/` | 自動化回歸測試 |
| `dist/` | 正式網頁建置輸出 |
| `src-tauri/` | Mac 桌面程式與封裝設定 |
| `scripts/` | 打包、啟動與檢查工具 |
| `docker/` | Nginx 設定 |
| `legacy/` | 舊版回歸測試依賴，不會編入遊戲 |
| `docs/history/` | 歷史文件，不作為現行遊玩說明 |

更新摘要見 [CHANGELOG.md](CHANGELOG.md)，Mac 使用說明見 [MACOS.md](MACOS.md)。本 README 以現行版本為準，舊版測試數字與功能敘述保留於歷史資料中。

## 上傳 GitHub

請以本目錄作為儲存庫根目錄，使用 Git 上傳原始碼。`.gitignore` 已排除依賴套件、建置輸出、Mac 產物、暫存報告與本機環境設定；新環境執行 `npm ci` 後即可重新建置。保留 `package-lock.json` 與 `src-tauri/Cargo.lock`，讓安裝版本可重現。

`tests/`、`legacy/` 與平衡檢查腳本是維護用工具，應保留於儲存庫；它們不會被打包進正式遊戲。`src/main.ts` 的開發預覽只在開發模式啟用，正式建置會移除。Mac 安裝包與網頁成品可另放 GitHub Releases，無須加入原始碼儲存庫。

## 驗證範圍

v4.0.2 已通過 882 項自動化測試與正式網頁建置；Mac App 已在 Apple Silicon 本機驗證啟動、移動與練習場攻擊，並驗證壓縮包解壓縮後的版本與簽章。自動化測試不代表已完成人工全關卡通關、實體手把或所有手機裝置驗收。
