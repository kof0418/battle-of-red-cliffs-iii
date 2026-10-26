# 赤壁之戰三 v1.10.0 · Mac 版

適用 Apple Silicon（M1 或更新）、macOS 12 以上；Intel 與 Windows 本次不提供。

1. 解壓縮 `Red-Cliffs-III-v1.10.0-macOS-arm64.zip`。
2. 開啟其中的「赤壁之戰三.app」，也可將 App 拖至「應用程式」。
3. 按「開始遊戲」，選擇關羽、張飛、趙雲、黃忠、魏延或呂布，再按出陣。

內容與 Web v1.10.0 同步，六將、五關、30 陣。完全離線執行，不需要伺服器、Node.js、Python 或網路素材服務。

WASD／方向鍵移動、J 攻擊、K／空白鍵跳躍、L 衝撞、P／Esc 暫停。必殺技為下、上、再新按攻擊；騎馬刀波為左、右、再新按攻擊。按鍵可在暫停選單重設。暫停選單可切換原生全螢幕；切離視窗會自動暫停，回來後手動繼續。

沒有戰鬥存檔或操作教學；關閉、返回選將或主選單需重新出征。只保留操作設定、音量與通關戰績。Web 與 Mac 的本機資料各自獨立。

此包使用 ad-hoc 簽署，已驗證簽章完整性；沒有 Apple Developer ID 簽署或公證，跨機器下載後可能受到 macOS Gatekeeper 阻擋。本機已實際開啟驗證選將、戰鬥、暫停及原生全螢幕切換；其他 Mac、實體手把與 iOS／Android 裝置未做硬體驗證。

重新建置：安裝 Node.js 22.18+、Rust 與 macOS 開發工具後，執行 `npm ci`，再執行 `npm run desktop:build:mac`。輸出位於 `src-tauri/target/aarch64-apple-darwin/release/bundle/macos/`。開發用 `npm run desktop:dev`。

v1.10.0：新增攻擊＋跳躍耗血解困；騎乘或已有馬匹時，銅鑼轉為 1000 分。Xbox 標準映射手把：A 攻擊、B 跳躍、X 衝撞、A＋B 解困／放下拾取武器、Menu 暫停、View 設定；實體 Xbox 手把尚未驗證。
