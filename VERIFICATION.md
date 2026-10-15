# v0.4 驗證紀錄

2026-10-15

- 本機 TypeScript 型別檢查與 Vite production bundle 通過。
- 28 項測試通過；新增存檔獨立快照、恢復後戰鬥一致、狀態及續關保留、資料驗證、欄位白名單、ID 重新編號與儲存失敗測試。原有兩關通關模擬仍通過。
- 實際使用交付的 Python 啟動程式提供正式 Web 版，瀏覽器驗證保存、重新整理、載入後暫停與 JSON 下載。
- 已將本機版匯出的 JSON 經瀏覽器檔案選擇器匯入另一連接埠的 Docker 版，確認關卡、血量與分數一致，且停在暫停狀態；未見瀏覽器 error 日誌。
- Docker Desktop（macOS arm64 / Linux container）已完成映像建置。映像建置內也通過 28 項測試與正式編譯。
- Compose 設定檢查、Nginx 設定檢查、Docker healthy 狀態與 /healthz 回應均通過。
- 發行包產生器會驗證 ZIP CRC 並附 SHA-256 校驗值；Web 包含 dist 與無第三方依賴的 Python 啟動程式。
- 未驗證 Windows 啟動腳本、amd64 容器、跨瀏覽器及實機手機多點觸控。Tauri 2 仍是封裝骨架，沒有產出 EXE／APP。
