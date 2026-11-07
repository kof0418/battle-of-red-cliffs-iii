# 赤壁之戰三 · v4.0.2

原創三國題材橫向動作遊戲，以 Phaser 3、TypeScript 與 Vite 製作，遊戲畫面為 960 × 540。提供網頁版與 Tauri 2 封裝的 Windows x64／Mac Apple Silicon 離線版。

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

只保存操作設定、音量、最高分及通關回顧，**不保存戰鬥中的進度**。重新整理、關閉或重新出征會開始新的戰役。網頁版、Windows 版與 Mac 版的本機資料各自獨立；瀏覽器無法儲存時仍可遊玩，但資料可能只在當次工作階段保留。

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

## Windows 版與打包

目前 Windows 版為 **v4.0.2 x64**，提供安裝程式與免安裝版。執行方式：

1. 安裝版：執行 `Red-Cliffs-III-v4.0.2-Windows-x64-Setup.exe`，依畫面選擇繁體中文或英文並完成安裝。
2. 免安裝版：解壓縮 `Red-Cliffs-III-v4.0.2-Windows-x64.zip`，雙擊 `Red-Cliffs-III.exe`。
3. 確認主選單顯示 v4.0.2，再開始遊戲或進入新手教學／練習場。

本機整理後的成品位於 `release/`，不隨 Git 原始碼提交；推送原始碼不會自動上傳 Windows 安裝包至 GitHub Releases。Windows 執行檔尚未加數位簽章。

### 從原始碼建置

Windows x64 建置需安裝 Node.js 22.18 以上、Rust（MSVC 工具鏈），以及 Visual Studio Build Tools 的「使用 C++ 的桌面開發」與 Windows SDK。

```sh
npm ci
npm run desktop:build:windows
```

輸出位置：

- 遊戲執行檔：`src-tauri/target/x86_64-pc-windows-msvc/release/three-kingdoms-battle.exe`
- NSIS 安裝程式：`src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/赤壁之戰三_4.0.2_x64-setup.exe`

上述指令產生原始 EXE 與 NSIS 安裝程式，不會自動製作 `release/` 中重新命名的成品或免安裝 ZIP。若設定 `CARGO_TARGET_DIR`，請改至該目錄下的對應輸出路徑尋找成品。

執行需 Microsoft Edge WebView2 Runtime；安裝程式會在缺少時連網下載安裝。安裝好執行環境後即可離線遊玩，遊戲素材已內建，執行時不需要 Node.js、Python 或本機伺服器。Windows 專用設定位於 `src-tauri/tauri.windows.conf.json`，使用獨立的 ICO 圖示與繁體中文／英文 NSIS 安裝介面。

## Mac 版與打包

目前 Mac 版為 **v4.0.2**，適用 Apple Silicon（M 系列晶片）、macOS 12 以上，可離線執行。可從 [GitHub Releases](https://github.com/kof0418/battle-of-red-cliffs-iii/releases/tag/v4.0.2) 下載安裝包。

1. 解壓縮 `Red-Cliffs-III-v4.0.2-macOS-arm64.zip`。
2. 將「赤壁之戰三.app」拖至「應用程式」，再開啟遊戲。
3. 確認主選單顯示 v4.0.2，可先進入「新手教學／練習場」熟悉操作。

執行 Mac 版不需要伺服器、Node.js 或 Python。

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

此版採 ad-hoc 簽署，未經 Apple Developer ID 簽署或公證；下載到其他 Mac 時可能出現安全性提示。尚未提供 Intel Mac 發行包。

### 發行壓縮包

```sh
npm run release
```

此指令執行測試與網頁建置，再於 `release/` 產生原始碼、網頁壓縮包及 SHA-256 校驗檔；不會自動建置或封裝 Windows 桌面版，也不會自動建置 Mac App。已有 Mac App 時可一併封裝：

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
| `src-tauri/` | Windows／Mac 桌面程式與封裝設定 |
| `scripts/` | 打包、啟動與檢查工具 |
| `docker/` | Nginx 設定 |
| `legacy/` | 舊版回歸測試依賴，不會編入遊戲 |
| `docs/history/` | 歷史文件，不作為現行遊玩說明 |

主目錄統一以本 README 提供現行版本、操作、開發與打包說明。

## 上傳 GitHub

請以本目錄作為儲存庫根目錄，使用 Git 上傳原始碼。`.gitignore` 已排除依賴套件、建置輸出、Windows／Mac 產物、暫存報告與本機環境設定；新環境執行 `npm ci` 後即可重新建置。保留 `package-lock.json` 與 `src-tauri/Cargo.lock`，讓安裝版本可重現。

`tests/`、`legacy/` 與平衡檢查腳本是維護用工具，應保留於儲存庫；它們不會被打包進正式遊戲。`src/main.ts` 的開發預覽只在開發模式啟用，正式建置會移除。Windows／Mac 安裝包與網頁成品可另放 GitHub Releases，無須加入原始碼儲存庫。

## 測試與維護工具

以下程式供日後改版驗證，應保留；測試檔名中的版本號代表加入測試的時間，不代表測試已失效。

| 路徑 | 保留原因 |
| --- | --- |
| `tests/*.test.ts` | 驗證戰鬥、摔技、騎乘、關卡、設定、教學與通關紀錄，使用 `npm test` 執行 |
| `legacy/` | 部分回歸測試仍引用舊版資料工具，現行遊戲不匯入 |
| `scripts/balance.ts` | 比較六將不同攻擊距離、場地應對及必殺策略 |
| `scripts/benchmark_balance.ts` | 使用固定策略與指定種子比較六將表現，模擬給予 10 次接關 |
| `scripts/balance-qa.ts` | 比較三種難度、兩種戰役長度及單／雙人模式，模擬使用模型預設的 2 次接關 |
| `src/main.ts` 的開發預覽 | 檢查摔技關鍵影格、角色姿態、場景與音效；僅開發模式啟用，正式建置會移除 |

平衡工具可用 `node --experimental-strip-types scripts/檔名.ts` 執行；模擬結果不等同真人手感或通關保證。`balance-qa.ts` 會覆寫 `docs/performance/v290-balance.json`，重跑後請檢查報告差異。歷史報告中的接關設定可能與目前介面預設值不同。

## 驗證範圍

v4.0.2 已通過 882 項自動化測試、TypeScript 檢查與正式網頁建置。

- Windows x64：已完成 Release 編譯與 NSIS 安裝程式打包，並實際啟動 EXE，確認主選單、選將及進入第一關戰鬥正常；尚未驗證全新電腦上的安裝流程。
- Mac Apple Silicon：已在本機驗證啟動、移動與練習場攻擊，並驗證壓縮包解壓縮後的版本與簽章。

上述驗證不代表已完成人工全關卡通關、實體手把或所有手機裝置驗收。
