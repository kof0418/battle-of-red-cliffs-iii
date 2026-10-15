# v0.4 部署與移轉

## 已編譯 Web 包

使用 `*-web.zip`，依 QUICKSTART.md 啟動。正式執行不需 Node.js；檔案可由 Nginx、Apache、NAS 靜態網站服務提供。不要使用 file://。

## 原始碼開發

需要 Node.js 22.18+。在專案目錄執行：

```sh
npm ci
npm test
npm run build
npm run dev
```

`dist/` 是完整發布內容。重新產生發行包：

```sh
npm test
npm run build
python3 scripts/package_release.py
```

輸出至 `release/`：完整 source ZIP、精簡 Web ZIP 與 SHA-256 校驗值。也可用 `--output /absolute/path` 指定輸出位置。

## Docker + Nginx

需要已啟動的 Docker Engine／Docker Desktop 與 Compose。

```sh
docker compose up --build -d
docker compose ps
# http://127.0.0.1:8080/
# http://127.0.0.1:8080/healthz
docker compose down
```

預設只綁定本機 127.0.0.1。可複製 `.env.example` 為 `.env` 設定 `GAME_PORT=8081`；若需要對外提供服務，將 `GAME_BIND` 設為合適的伺服器介面，再由自己的 HTTPS 反向代理接入。遊戲不需要掛載資料庫或可寫入磁碟。

Docker 建置會先執行 28 項測試再編譯，執行階段只有 Nginx。`/healthz` 提供健康檢查；HTML 不快取，帶內容雜湊的 assets 使用長期快取；缺少的資源回傳 404。

本次已在 macOS arm64 的 Docker Desktop Linux 容器驗證建置、Nginx 設定、healthy 狀態、健康端點與瀏覽器遊玩／存檔匯入。amd64 伺服器可自行建置，尚未在 amd64 實機驗證。基礎映像使用 Node 22 與 Nginx Alpine 標籤；長期部署時可自行固定映像 digest。

## 存檔移轉

v0.4 新增 schema 1 JSON 存檔。按「匯出存檔」下載，在另一網址按「匯入並載入」。保存角色位置、血量、敵人、道具、招式進度、分數、關卡與續關餘額；載入後暫停。只接受相容格式與合理欄位，檔案上限 128 KB。

這是單人遊戲存檔，不具防修改／反作弊功能。沒有伺服器雲端同步。v0.3 只有最高分，沒有可移轉的戰鬥存檔；同一網址的 v0.3 最高分仍保留。

## Tauri 2

沿用 `src-tauri/`，版本 0.4.0。這次提供的是 Web／Docker 發行；尚未產出 Windows EXE 或 macOS APP。Windows 版須在具備 Rust、MSVC 與 WebView2 的環境建置，正式發行仍需補圖示、簽章和離線 WebView2 策略。
