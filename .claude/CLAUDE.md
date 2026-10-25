# 專案交接：《上山！穹晶 FAB 7》

> 給接手這個專案的 Claude Code 工作階段。專案規範在根目錄的 `claude.md`（CLAUDE.md），一律遵守；這份只記「做到哪、怎麼合作」。

## 是什麼
three.js＋TypeScript 網頁遊戲：台灣半導體廠製程工程師的職場養成（PUA、加班、on-call），風格 C「卡通渲染劇場」。公司一律虛構（穹晶半導體 FAB 7），不得出現真實公司名、商標、真實人名。

## 文件從哪裡讀
1. `docs/specs/00-index.md`：閱讀順序、文件衝突的優先序（§2）、所有裁決紀錄。
2. `docs/planning/game-design-doc.md`：企劃書（設計意圖）。
3. `docs/specs/01～04`：技術架構、遊戲系統、小遊戲、美術 3D UI（規格書與企劃書衝突時以規格書為準）。
4. `IMPLEMENTATION_PLAN.md`：Stage 1～5 進度、決定紀錄、待人工驗收清單。
5. `docs/issues.md`：#N 流水號的待辦（TODO 必須寫成 `TODO #N`）。
6. `design/style-c-toon.html`：使用者選定的美術範例；範例值優先於 04 的新增值。

## 目前進度（2026-10-25）
- Stage 1「地基」完成，已合併進 `main`，使用者人眼驗收通過。424 個測試、Biome 0 診斷、`bun run build` 的 dist 檢查通過。
- 實作計畫：`docs/superpowers/plans/2026-10-24-stage1-foundation.md`。
- 下一步是 Stage 2（事件引擎與文字版關鍵日）。**開工前關卡**（`IMPLEMENTATION_PLAN.md` Stage 2）：先拍板 D71（`ending` 效果設下的待觸發結局放在 GameState 哪個欄位），並替 `rng.pickWeighted` 的 NaN 權重、`rng.chance` 的無效 `p` 加 fail-fast。延後項目見 `docs/issues.md` #3（Stage 2）、#2／#4（Stage 3）。
- 使用者說「先不要跑第二階段」：等使用者明確開口再開始。

## 合作方式（使用者的偏好）
- 使用者不是業界出身，題材來自朋友的故事；數值、事件、故事線授權由 Claude 設計，自行拍板的事寫成「我的決定」讓使用者可推翻。
- 使用者偏好全自動推進、少問問題；但開始新 stage、push、改寫歷史前要等使用者點頭。
- 用 subagent 分工：依難度選模型（查資料、機械性改動用 haiku／sonnet），**規劃、需求、規格、架構一律用 Opus**。Opus subagent 常撞到用量上限：一次只跑一個、要它分段寫檔，重置後用 SendMessage 接續。
- 流程：superpowers 的 brainstorming → writing-plans → subagent-driven-development（每個 task 一個實作者＋一個 reviewer，最後整條分支審查）。
- 套件管理用 bun（`~/.bun/bin`）；開發與打包用 Vite；測試 `bun test`；Lint／格式化用 Biome。

## Git 規則
- Conventional Commits；commit 訊息**不得**提到任何 AI 工具，也不加 Co-Authored-By（`.githooks/commit-msg` 會擋）。不准 `--no-verify`。
- pre-commit 會跑 `bun run verify`。新環境要先 `bun install`，再 `bun run hooks:install`（設定 `core.hooksPath=.githooks`）。
- 遠端：`origin` = `github.com/Tsai1030/Process-Engineer-Daily-Work-Simulation-Game`。push 由使用者決定，不要自行 push 或改寫已推送的歷史。
