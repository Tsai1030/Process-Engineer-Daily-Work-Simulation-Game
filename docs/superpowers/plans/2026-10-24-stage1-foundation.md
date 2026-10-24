# Stage 1 地基 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可編譯、可測試的專案骨架：完整 `model.ts`、`utils/`、Stage 1 的 core 求值器與驗證器、規則常數內容、架構檢查，以及把風格 C 範例的無塵室走道以 three@0.186.1 移植成 `scn.fab_bay`，HUD 與數值面板顯示 `createNewGame()` 的初始狀態。
**Architecture:** 純 TS 的 core（無 DOM、無 three、無系統時間與 `Math.random`）透過參數取得 `ContentBundle`；render 只讀 app 組好的 `SceneSnapshot`；ui 只讀 `core/selectors.ts`、`core/text.ts` 算出的顯示資料；`app/bootstrap.ts` 是唯一的組裝根。層與層的 import 規則由 `test/architecture.test.ts` 掃描原始碼強制。
**Tech Stack:** bun 1.2.21（套件、腳本、`bun test`）、Node 24.14.1（執行 Vite）、`typescript@7.0.2`（退路 `typescript@6.0.3`）、`vite@8.3.4`、`@biomejs/biome@2.5.15`、`three@0.186.1`、`@types/three@0.186.0`、`@types/bun@1.2.21`；純 DOM＋TS（無 UI 框架）。
**Spec:** `docs/specs/00-index.md`（§2 優先序、§9 審查回合 1）、`docs/specs/01-architecture.md`（v1.2，主規格；§15 Stage 1）、`docs/specs/02-game-systems.md`（§0、§1、§3.3、§5.4、§7、§8.2、§14）、`docs/specs/03-minigames.md`（§7.1）、`docs/specs/04-art-3d-ui.md`（§1、§2、§3.1～§3.2、§4.2、§5、§6.4、§8.3、§9.6～§9.7）、`design/style-c-toon.html`（視覺參考）、`CLAUDE.md`。

## Global Constraints

- 套件版本一律確切版本（不加 `^`、`~`）：`three@0.186.1`；dev：`@biomejs/biome@2.5.15`、`@types/bun@1.2.21`、`@types/three@0.186.0`、`typescript@7.0.2`、`vite@8.3.4`；`bunfig.toml` 設 `[install] exact = true`；`bun.lock` 必須提交（01 §1.1、§14.2）。
- 開發依賴只有上面 5 個、執行期只有 `three`；不新增任何依賴（CLAUDE.md「不引入新工具」、01 §2.3）。
- 每個 shell 指令前先確定 `bun` 在 PATH：`export PATH="$HOME/.bun/bin:$PATH"`（本機 bun 在 `~/.bun/bin/bun`，git hook 也靠它）。
- 檔名一律 snake_case，符合 `^[a-z0-9_]+(\.spec|\.test)?\.(ts|css|svg)$`（例外：`vite.config.ts`、`biome.json`、`package.json`、`bunfig.toml`）（01 §2.2）。
- 單元測試 `*.spec.ts` 與原始碼同目錄，只能 import 自己的模組與 `test/fixtures.ts`，不得 import `src/content`；整合測試 `test/*.test.ts` 用真實內容（01 §2.3、§13.2）。
- `src/` 與 `test/` 的每個目錄直接項目數 ≥2（CLAUDE.md「一個目錄不能只有一個檔案」，01 §2.1）。
- logger 與 throw 的訊息是單一模板字串、不含換行，格式 `<什麼失敗>: key=value key=value`（01 §12.2）。
- 不准空的 `catch {}`；`catch` 只能重丟、轉成型別化錯誤再丟、或 `logger.error` 並讓玩家看到（01 §12.4）。
- 除了 `Error` 子類，不准 `class X extends Y`；`src/core`、`src/utils`、`src/content` 不准頂層 `let`（01 §2.2）。
- core 內禁止 `Math.random`、`Date.now`、無參數 `new Date()`、DOM 全域與 `three`（01 §4.2）。
- 所有玩家看得到的文字放在 `src/content/text/*.ts`，邏輯只用 `TextId`；唯一例外是 `ui/view_models.ts` 的格式化字樣（`NT$ 48,200`、`2027/06/13（日）`、`入職第 105 天`，01 §10.3）。
- 不寫重述程式碼的註解；只寫「為什麼」與出處（例：`// 02 §1.3 步驟 2c：專業不降`）。
- `TODO` 一律寫成 `TODO #N`，`#N` 必須登錄在 `docs/issues.md`（01 §2.3、D57）。
- Commit 訊息用 Conventional Commits：第一行符合 `^(feat|fix|build|chore|ci|docs|style|refactor|perf|test)(\([a-z0-9_-]+\))?!?: .{1,72}$`；body 說明「為什麼」；**不得出現 claude／anthropic／chatgpt／openai／copilot／gemini（不分大小寫；`CLAUDE.md` 檔名除外），不加任何 Co-Authored-By trailer**（CLAUDE.md、01 §14.7）。
- 每個 commit 由 pre-commit 跑 `bun run verify`；**不准** `--no-verify`；hook 失敗就修好再 commit（01 §14.8）。
- 每個 task 只做該 task 的範圍；看到後續 stage 的工作（事件、關鍵日、小遊戲邏輯、導航、鏡頭演出、存檔）一律不做。
- 規格衝突時依 00 §2：型別與名稱以 01 為準、規則與數字以 02 為準、視覺以 04 為準、`design/style-c-toon.html` 的範例值優先於 04 的新增值、00 §9 的裁決優先於 01～04 尚未同步的舊文字。本計畫的「Stage 1 決定」一節是對規格空白處的裁決，Task 0 會把它寫回 01 §16。

## Review Focus

1. 健康債升高讓最大體力降到目前體力以下時，玩家再拿到「體力 +10」：一般人預期體力不變（不會因為「補體力」反而變少，也不會出現 −5 的浮字）→ 釘在 Task 9（effects）。
2. 存款變成負數（存款沒有下限，02 §1.1）：數值面板應顯示 `NT$ −1,200`，而不是 `NT$ -1,200` 或 `NT$ 1,200` → 釘在 Task 20（view_models）。
3. 玩家姓名本身含有 `{date}`、`{name}` 這類字樣：台詞代入後應原樣顯示姓名，不被二次代換、也不丟例外 → 釘在 Task 11（text）。
4. 內容作者寫了不存在或格式錯的日期（`2027-02-30`、`2027-6-13`）：應立刻丟 `InvariantError`，而不是被 `Date.UTC` 默默滾到 3 月 2 日 → 釘在 Task 3（date）。
5. 手改或損壞的存檔讓 `rngState` 變成負數、小數或 ≥2³²：`createRng` 應丟 `InvariantError`，而不是默默產生另一串亂數、讓「同一存檔同一結果」失效 → 釘在 Task 5（rng）。

---

## Stage 1 決定（規格空白處的裁決；Task 0 寫進 01 §16 H 組 D65～D92，執行時一律照這裡）

| # | 決定 |
|---|---|
| D65 | **Stage 1 內容切片**：`createNewGame()`（HUD 預覽）與 `validate-content`（`verify` 的一環）都需要一份真實的 `ContentBundle`，但 01 §15 把事件與關鍵日分給 Stage 2、小遊戲領域資料分給 Stage 3。Stage 1 只寫**規則常數與開局狀態**（02 §1.1、§1.2、§5.4、§7.1、§7.4、§8.2、§1.10、§3.3、§14；03 §7.1；04 §6.4、§8.3），它們沒有分給任何 stage，且 Stage 1 的模組會讀；由後續 stage 撰寫的集合（`events`、`endings`、`tasks`、`lifeActions`、劇本關鍵日）在 Stage 1 是空物件；型別強制存在、但資料屬於 Stage 3 的 Hold Lot 量測列、留言與半夜電話逐句台詞，用 `docs/issues.md` 的 #1 追蹤（量測與逐句台詞是空陣列，留言共用一則待撰寫文字） |
| D66 | Task 1 的 `verify` 暫時是 `bun run typecheck && bun run check && bun test`（不含 `validate-content`，因為驗證器與內容還不存在）；Task 13 改回 01 §14.2 的原字串並加上 `validate-content` script |
| D67 | 啟動時只有 `severity: 'error'` 的問題會丟 `ContentError`；warning 不阻擋（依 01 §8.4「警告（不阻擋）」、§8.6「有任何 error」、§8.7「有 error 時 exit code 1」；01 §4.5 骨架的 `issues.length > 0` 視為筆誤） |
| D68 | `content/index.ts` 合併台詞遇到重複 ID 時丟一般的 `Error`（訊息 `Duplicate text id: id=<id>`），因為 content 只能 `import type` model（01 §4.2、§8.1 附註）；不 import `utils/errors` |
| D69 | `PALETTE` 新增 `ink: 0x0a0a0a`、`paper: 0xfffdf4`、`grey: 0xd9d6cc`（頭頂名字 sprite 等 3D 內的 UI 色，04 §5.9），讓 04 §2.8 `palette_sync` 要比對的 `--ink`、`--paper`、`--grey` 有對應值；04 §1.6 同步登記 |
| D70 | 天車吊架照範例畫 4 支（z ＝ 8、2、−4、−10；範例 `for (rz = 8; rz > -16; rz -= 6)`）；04 §5.4 標「範例值」的 z ＝ −16 第 5 支視為筆誤（00 §2-3 範例值優先） |
| D71 | Stage 1 的 `applyEffects` 只實作不依賴 Stage 2 模組的 op：`stat`、`setStat`、`affinity`、`flag`、`counter`、`machine`、`modifier`、`economy`、`phone`、`when`、`chance`；`plantSeed`、`cancelSeed`、`blackBook`、`queueEvent`、`ending`、`addTask`、`advanceTime` 丟 `InvariantError`（訊息 `Effect op not implemented until Stage 2: op=<op> source=<sourceEvent或none>`），Stage 2 與 `seeds`、`black_book`、`clock` 一起補。另：`GameState` 沒有存放「`ending` 效果設下的待處理結局」的欄位（01 §5.3.3-6），Stage 2 開工前要先裁決 |
| D72 | `stat` 夾限不反轉方向：正值效果套用後最多留在原值（原值已高於上限時不往下拉），負值效果最多留在原值；沒有變化就不記錄 delta |
| D73 | `setStat` 不套修正器、精神回復倍率、風向期與溢出；只夾限（`maxStamina` 照算）與取整，記錄實際變化 |
| D74 | `counter` 效果在 core 夾限兩個計數器：`cnt.wip_pressure` 0～100、`cnt.sys_exercise_bonus` 0～10（02 §0.3「core 夾限」）；其他計數器不夾限 |
| D75 | `modifier` 效果：同 ID 的現有修正器以新取代舊（02 §5.11）；`expiresDay = durationDays === null ? null : 今天 ＋ durationDays`；修正器在 `expiresDay === null` 或 `dayIndex ≤ expiresDay` 時生效（含兩端，同伏筆窗口的慣例） |
| D76 | `economy` 效果改住處（且與目前不同）時：房租＝新住處 `rent` 階梯中 `fromMonth ≤ 1` 的最後一筆；`stats.money −= 房租`（房租 >0 時記一筆 `money` delta）、`monthLedger` 加 `{ dayIndex: 今天, kind: 'rent', amount: −房租 }`、`housingSinceDay = 今天`；住處相同時不收房租 |
| D77 | 02 §8.4 生死之交擋鍋的手機訊息：`thread: 'thread.etch_group'`、`from: <角色>`、`text: 't.sys.bonded_help.<slug>'`、`kind: 'chat'`；可擋鍋的角色固定為 02 §8.4 的五位（阿哲、小晴、豪哥、美玲姐、Vivian，依此順序破平手），寫成 `core/effects.ts` 的模組常數 |
| D78 | `isWindPeriod(state, content)`：取 `date` 晚於今天、`variant: 'review'` 的最早劇本關鍵日 R；沒有 R → false；`career.probation` 是 `'pending'` 或 `'retakePending'` 時 R 是試用期考核 → false；否則 `dayIndex(R) − review.windPeriodDays ≤ 今天` 為 true（02 §7.4 的 `reviewDay − 42 ≤ dayIndex < reviewDay`，試用期不算） |
| D79 | `onCallTonight(state, content)`：今天的 `KeyDayDef.onCall` 為 true，或（章節 ≥ `ch3` 而且今天落在「本月第 `onCall.rotationSaturday` 個星期六」所在的週一～週日） |
| D80 | `createNewGame` 中 02 沒寫的初始值：`runId = 'run-<seed>'`、`rngState = seed`、`time.minuteOfDay = balance.sleep.wakeAt`、`time.chapter = campaign.chapters[0].id`、`currentKeyDay` ＝ 日期等於 `campaign.startDate` 的關鍵日（沒有就 null）、`flow = { kind: 'keyDay', phase: 'wake' }`、`economy.commute = 'shuttle'`、`economy.filialAmount = 10000`（02 §7.6「預設」）、`career.bonusMultiplier = 1`、`career.probation = 'pending'` |
| D81 | Stage 1 的 `validateContent` 只做 01 §8.6 的「ID」「參照」「節點圖」「台詞（存在、孤兒、佔位符）」「數值方向」五類；其餘類別依 `IMPLEMENTATION_PLAN.md` 的分配在 Stage 2／3／5 加。參照用通用走訪：任何字串值或物件鍵符合 ID 前綴就視為參照；孤兒台詞檢查排除 `t.ui.`、`t.mg.`、`t.sys.` 開頭的鍵（這些由程式碼引用，01 §8.4、03 §10.3、02 §8.4） |
| D82 | `scaleEffects` 只轉換 02 §5.4 表列出的 op（`stat`、`affinity`、`counter`、`chance`、`when`）；其他 op 原樣回傳，「累積比例」規則屬於 Stage 4 的 `fast_forward` |
| D83 | Stage 1 的 render 介面是 01 §9 的子集：`RenderHost` 只有 `mode`、`apply`、`setMotion`、`renderFrame`、`dispose`；`SceneModule` 沒有 `navigation`；`SceneBuildContext` 是 `{ kit, tracker, textures, quality, logger }`（多了 `textures`、`logger`：CanvasTexture 需要 DOM，注入工廠才能在 bun 測試；少了 `characters`）；Stage 3 補齊。`blendRig`、`LIGHT_OVERLAYS`、`selectOverlays` 隨鏡頭演出在 Stage 3 加。燈號是每台機台各自的 mesh（InstancedMesh 與 `static_batcher` 在 Stage 3）。`scn.fab_bay` 只放 04 §4.2 標「範例值」的物件（新增物件在 Stage 3），右側 ET-07～10 一律 `run`。CanvasTexture 文字用範例的 `Arial Black, Arial, sans-serif`（04 §2.7 字型堆疊與重畫在 Stage 3） |
| D84 | `chr.mom`（04 §6.4 沒列）外觀：`heightScale 0.95`、`skinTone '#f6d6b8'`、`hairColor '#5a4a3a'`、`hairStyle 'short'`、`badgeColor '#9aa3ad'`、`glasses false`、`topColor '#b88a6a'`、`bottomColor '#4a3f35'`；04 §6.4 中名牌為「—」的角色用無名 NPC 的 `#9aa3ad` |
| D85 | 章節日期照 GDD §3.1 原文（序章 03-01～03-05、第一章 03-08～04-16、第二章 04-19～05-31、第三章 06-01～2028-02-29）；章節之間的週末屬於哪一章，由 Stage 4 的 `planSegment` 決定 |
| D86 | HUD 時鐘以 5 遊戲分為單位、向下取整（04 §9.6）；金額的負號用 `−`（U+2212）；夜班標記 22:00～05:59 |
| D87 | Stage 1 的場景快照固定 `scene: 'scn.fab_bay'`、`actors: []`、`playerSpeedScale: 1`、`focusActor: null`、`phoneGlow: false`（Stage 2／3 依流程與走動補）；DEV 網址 `?calib=1` 由 `app/dev_panel.ts` 把機台燈號改成範例畫面（ET-03 down、ET-04 run、ET-05 run、ET-06 warn）並隱藏 UI，供 04 §2.4 並排校準 |
| D88 | 新增 `.gitattributes`（`* text=auto eol=lf`）：Windows 的 `core.autocrlf` 會把檔案轉成 CRLF，Biome 的格式檢查與 `#!/bin/sh` hook 都會因此失敗 |
| D89 | 01 §3 目錄樹以外新增 4 個測試檔：`test/check_commit_message.test.ts`（commit 訊息規則）、`src/utils/errors.spec.ts`（01 §13.1「utils 全部」）、`src/render/scene_manager.spec.ts`、`src/render/scenes/fab_bay.spec.ts`（`scenes/` 至少 2 個項目；04 §4.1 的場景預算測試放這裡，`props.spec.ts` 只測道具） |
| D90 | selectors 中讀內容常數的函式都收 `content`：`mindRecoveryMultiplier(state, content)`、`presentationMood(state, content)`、`yieldIndex(state, content, scene)`；另匯出 `ownedMachineHealthAvg(state, content)`（`conditions` 的 `ownedMachineHealthAvg` 運算式與 `yieldIndex` 共用） |
| D91 | Stage 1 內容的暫缺：工作方針「省」的 `chance 0.25 → queueEvent ev.called_back_at_clockout` 在 Stage 4 隨該事件加入；`balance.minigameRewards = []`（Stage 3 依 02 §1.9 寫換算表）；`valuation` 的 `counterValues`／`flagValues` 只放已登錄的 `sys_` ID 與 `cnt.wip_pressure`，其餘隨事件在 Stage 2／5 加；`review.peers` 依 02 §7.4 |
| D92 | 內容文字來源：角色名＝林課長、阿哲、小晴、豪哥、美玲姐、Vivian、沈部經理、阿安、何佩珊、媽媽、老K（01 §8.3）；職稱＝GDD §7.4 各角色標題括號內去掉年齡的部分（媽媽 `主角的媽媽`、老K `穹晶學院新訓講師`、何佩珊 `人資專員`）；職等名＝02 §7.1 職稱；工作方針說明＝GDD §2.3「意思」欄、生活方針說明＝「每月效果」欄；履歷名＝GDD §3.2 履歷欄、說明＝專屬事件欄；章節名＝GDD §3.2～§3.5 標題（例 `序章「上山」`） |

---

## File Structure

> 標「改」的是既有檔案；其餘都是新增。每個檔案一個職責。目錄樹與 01 §3 一致，差異見 D88、D89。

```text
d:\game2\
├── .gitattributes                 （D88）換行一律 LF
├── .gitignore                     01 §14.6
├── .githooks/pre-commit           bun run verify
├── .githooks/commit-msg           bun run scripts/check_commit_message.ts "$1"
├── package.json                   01 §14.2（Task 1 的 verify 見 D66）
├── bun.lock                       bun install 產生
├── bunfig.toml                    [install] exact = true
├── tsconfig.json                  01 §14.3
├── biome.json                     01 §14.4
├── vite.config.ts                 01 §14.5（正式版 CSP 插件）
├── index.html                     01 §10.1 的圖層容器＋ <!-- CSP --> 佔位
├── IMPLEMENTATION_PLAN.md         01 §15 複本＋待人工驗收清單＋決定紀錄
├── docs/issues.md                 #N 流水號登錄表（D57）
├── docs/specs/00～04（改）         Task 0 同步 N1～N6 與 Stage 1 決定
├── design/calibration/            並排校準截圖（不參與建置）
├── scripts/
│   ├── check_commit_message.ts    Conventional Commits＋禁用字（匯出 checkCommitMessage）
│   ├── check_dist.ts              dist 有 CSP、沒有 DEV 標記、入口 JS gzip ≤350 KB
│   └── validate_content.ts        內容驗證 CLI（01 §8.7）
├── test/
│   ├── fixtures.ts                testContent、buildTestState、minigameContextFor、createFakeTextureFactory
│   ├── architecture.test.ts       分層 import、禁用全域、目錄、檔名、TODO、.only/.skip/.todo、extends、型別重名
│   ├── check_commit_message.test.ts
│   ├── content_integrity.test.ts  真實內容 0 問題、JSON 往返、CLI 輸出
│   └── palette_sync.test.ts       tokens.css 與 PALETTE 一致
└── src/
    ├── main.ts                    bootstrap(document)（01 §4.5 原文）
    ├── model.ts                   01 §5.2 原文
    ├── app/
    │   ├── bootstrap.ts           組裝根（Stage 1：驗證內容、新遊戲、render、HUD、rAF 迴圈）
    │   ├── flow_controller.ts     Stage 1 只有 toSceneSnapshot(state, content)
    │   └── dev_panel.ts           （DEV）DEV_PANEL_MARKER、calibrationOverrides()
    ├── utils/
    │   ├── math.ts / math.spec.ts             clamp、lerp、round1
    │   ├── date.ts / date.spec.ts             dayIndex ↔ ISO、星期、HH:MM
    │   ├── errors.ts / errors.spec.ts         ContentError、SaveError、InvariantError、RenderError
    │   ├── logger.ts / logger.spec.ts         Logger、console 實作、記憶體實作
    │   └── event_bus.ts / event_bus.spec.ts   型別化發布／訂閱
    ├── core/
    │   ├── rng.ts / rng.spec.ts               mulberry32
    │   ├── new_game.ts / new_game.spec.ts     createNewGame
    │   ├── selectors.ts / selectors.spec.ts   衍生值
    │   ├── conditions.ts / conditions.spec.ts Condition、NumExpr 求值
    │   ├── effects.ts / effects.spec.ts       applyEffects（D71 範圍）
    │   ├── stats.ts / stats.spec.ts           scaleEffects
    │   ├── text.ts / text.spec.ts             resolveText
    │   └── content_validator.ts / .spec.ts    validateContent（D81 範圍）
    ├── content/
    │   ├── index.ts               組裝 ContentBundle、合併台詞
    │   ├── economy.ts             stats、ranks、economy、review
    │   ├── balance.ts             balance
    │   ├── resumes.ts             3 種履歷
    │   ├── characters.ts          11 位角色
    │   ├── policies.ts            workPolicies、lifePolicies、lifeActions（空）
    │   ├── world.ts               locations、machines、tasks（空）
    │   ├── campaign.ts            campaign、keyDays（兩個範本）
    │   ├── minigames.ts           03 §7.1 預設組與 rules
    │   ├── flags.ts               flags、counters 登錄表
    │   └── text/{ui,characters,minigames}.ts
    ├── render/
    │   ├── look.ts / look.spec.ts             PALETTE、OUTLINE_T、outlineFor、CALIBRATION、LIGHT_RIGS、legacyToPhysical、selectLightRig、PIXEL_RATIO_CAP
    │   ├── toon_kit.ts / toon_kit.spec.ts     GRADIENT_STEPS、材質快取、hull 工廠
    │   ├── resource_tracker.ts / .spec.ts     登記與釋放
    │   ├── canvas_textures.ts                 CanvasTextureFactory（DOM 實作）
    │   ├── scene_manager.ts / .spec.ts        場景註冊、建構、切換
    │   ├── render_host.ts                     WebGLRenderer、尺寸、context lost、無 3D 備援
    │   ├── props/{machine,foup,oht,fab_shell}.ts、props.spec.ts
    │   └── scenes/fab_bay.ts、fab_bay.spec.ts
    └── ui/
        ├── dom.ts                 h、replaceChildrenKeyed、Component
        ├── view_models.ts / .spec.ts          格式化與 HudView、StatsPanelView
        ├── components/{hud,stats_panel}.ts
        └── styles/{tokens,comic}.css
```

---
## Task 0：把審查回合 1 的 N1～N6 與 Stage 1 決定寫回規格（純文件）

> d:\game2 這時還不是 git repo，所以本 task 沒有 commit；這些修改由 Task 1 的第一個 commit 提交（00 §9.3「Stage 1 開工的第一個 commit 前」）。

**Files:**
- Modify: `docs/specs/01-architecture.md`（表頭版本、§5.2 `EventDef.scene` 註解、§6.4、§6.5 第 10 條、§7.3、§8.5、§16、§18）
- Modify: `docs/specs/02-game-systems.md`（表頭版本、§2.2、§2.6、§2.7 第 5 列、§3.4）
- Modify: `docs/specs/03-minigames.md`（表頭版本、§3.10、§7.2）
- Modify: `docs/specs/04-art-3d-ui.md`（表頭版本、§1.6、§4.5、§5.4）
- Modify: `docs/specs/00-index.md`（表頭版本、§6 #33、§9.3）
- Test: `C:\Users\user\AppData\Local\Temp\claude\d--game2\0cb8ff81-049c-4ede-95ef-11bfa6cf7f05\scratchpad\check_ts_blocks.ts`（既有腳本：抽出 Markdown 中每個 ` ```ts ` 區塊交給 `Bun.Transpiler` 轉譯；用法 `bun <腳本> <markdown 檔>`；輸出 `<檔>: blocks=N failed=M`，有失敗時 exit 1。檔案不在時，照這段描述在同一路徑重寫一份約 40 行的腳本）

**Interfaces:**
- Consumes：00 §9.3 的 N1～N6 裁決；本計畫「Stage 1 決定」D65～D92。
- Produces：01 v1.3、02 v1.3、03 v0.4、04 v1.3、00 v1.2；01 §16 新增 G 組（D59～D64）與 H 組（D65～D92）；01 §18 登錄本計畫新增的名稱（後續 task 依這些名稱實作）。

- [ ] **Step 1：記錄修改前的語法檢查基準**

Run（Git Bash）：
```bash
export PATH="$HOME/.bun/bin:$PATH"; S="C:/Users/user/AppData/Local/Temp/claude/d--game2/0cb8ff81-049c-4ede-95ef-11bfa6cf7f05/scratchpad/check_ts_blocks.ts"
cd /d/game2 && for f in docs/specs/0[1-4]*.md; do bun "$S" "$f"; done
```
Expected：`01… blocks=41 failed=0`、`02… blocks=19 failed=0`、`03… blocks=22 failed=0`、`04… blocks=6 failed=0`。

- [ ] **Step 2：N1（新訓日的著裝移到午餐後）**

1. 01 §6.4 時段表 `gowning` 列「主要內容」欄：把「v1.2：第一章新訓日也有（`dailyCh1`，第一次 QTE 在 03-08）」換成「v1.3（00 §9.3 N1）：第一章新訓日沒有這個時段；著裝 QTE 改在午餐後進 FAB 時進行（見下方新訓日規則）」。
2. 01 §6.4「第一章新訓日」整條換成：
   > **第一章新訓日**（v1.2 審查回合 1 R1-C；v1.3 依 00 §9.3 N1 修訂；03-08、03-17、03-24、04-01 四個 full 關鍵日）：`phases` ＝ wake、commute、shift、clockOut、evening、sleep（沒有 `gowning` 與 `briefing`：早上去的是非無塵室的教室，新訓學員也不參加課內早會）；`scenes.shift = 'scn.academy_classroom'`（2.5D 穹晶學院教室，04 §4.5）。上午在教室跑劇本事件（課程；`gameMinutes` 讓時鐘走到 12:00）→ 12:00 午餐 → 經教室的 `hs.classroom_exit` 前往 `scn.fab_bay`：這一次進無塵室**不套用** §6.5-10 的 +15 自動著裝，改開著裝小遊戲 `interaction = { kind: 'minigame', source: 'gowning', minigame: 'mg.gowning', preset: flag.gowning_tutorial_done ? chapterDefaults[chapter] : 'tutorial' }`（第一章是 `dailyCh1`，第一次 QTE 在 03-08；`autoGowning` 照 03 §3.10 適用），時間成本是預設組的 `gameMinutes`（15，班中實際加上，13:00 → 13:15）→ 下午見習走動與任務。時間預算見 02 §2.6。
3. 01 §6.5 第 10 條：把「新訓日下午從教室進 bay 同樣適用。」換成「新訓日下午從教室進 bay 是例外：改開著裝 QTE（§6.4 新訓日規則，v1.3 N1）。」
4. 02 §2.6 變體表 `full` 列：把「（v1.2：新訓日有 `gowning`、沒有 `briefing`，見下表）」換成「（v1.3：新訓日沒有 `gowning` 與 `briefing`，著裝在午餐後進 FAB 時，見下表）」。
5. 02 §2.6 新訓日預算表：刪除 `gowning 07:25` 那一列；「前往 FAB」列改成「前往 FAB｜教室 `hs.classroom_exit` → 更衣室著裝 QTE（`dailyCh1`；03-08 是第一次 QTE，多 1 則泡泡 +3 秒）→ `scn.fab_bay`（取代 +15 自動著裝，v1.3 N1）｜13｜15｜→ 13:15」；表下加一行「v1.3（N1）：著裝的 15 分取代原本的 +15 自動著裝，午餐後的時刻（13:15）與合計（137 秒）不變。」
6. 02 §2.7 第 5 列 phases 欄：「新訓日（有 gowning、無 briefing，§2.6）」換成「新訓日（午餐後著裝、無 briefing，§2.6）」。
7. 03 §3.10「第一次 QTE」：把「v0.3 審查回合 1 R1-C：新訓日也有 `gowning` 時段，用 `dailyCh1`」換成「v0.4（00 §9.3 N1）：新訓日沒有 `gowning` 時段，著裝 QTE 在午餐後從教室進 FAB 時開啟，用 `dailyCh1`（01 §6.4）」。
8. 03 §7.2 `mg.gowning/daily*` 列「內容位置」欄換成「所有含 `gowning` 時段的關鍵日，以及第一章 4 個新訓日午餐後進 FAB 時（v0.4 N1；第一次 QTE 在 03-08）」。
9. 04 §4.5 `scn.academy_classroom` 的 hotspot 說明：把「走過去＝轉場到 `scn.fab_bay`，01 §6.5-10」換成「走過去＝經更衣室的著裝 QTE（01 §6.4，v1.3 N1）後轉場到 `scn.fab_bay`」。
10. 00 §6 #33「規格書的決定」欄換成「新訓 full 日＝上午 2.5D 教室上課／事件 → 午餐 → 著裝 QTE（`dailyCh1`，第一次在 03-08；v1.2 依 §9.3 N1 移到午餐後）→ 下午 fab 見習與任務；沒有早會」。

- [ ] **Step 3：N2（班中跨場景的觸發事件）**

1. 01 §6.4 在「第一章新訓日」之後新增一條：
   > **場景不同的班中觸發事件**（v1.3，00 §9.3 N2）：由 `clock`、`shiftStart` 檢查點觸發（含劇本關鍵日排在這兩個檢查點的事件）而 `EventDef.scene` 跟玩家目前所在場景不同時，事件在玩家所在場景演出，內容必須以 `phone` 節點（工作機來電或訊息）開場；`EventDef.scene` 只代表事件的主要場景，供 §8.6 的「場景」規則與「一天最多 2 個場景」使用。演出規則由 Stage 2 的 `event_runner` 實作。
2. 01 §5.2 `EventDef.scene` 的註解改成 `/** 主要場景（v1.2 審查回合 1 R1-D：必填；v1.3 N2：班中觸發時若玩家不在此場景，事件以 phone 節點開場、在玩家所在場景演出，§6.4）；只有 presentation 'micro'（手機呈現）可以是 null */`。

- [ ] **Step 4：N3（範例一的後續任務改用 phone 節點）**

01 §8.5（a）`et03FollowupTask` 的 `n_lin` 換成（原本的 `portrait` 刪掉，其他欄位不動）：
```ts
    n_lin: {
      kind: 'phone',
      thread: 'thread.etch_group',
      messages: [{ from: 'chr.lin', text: 't.ev.et03_followup_task.lin', kind: 'chat' }],
      next: 'n_task',
    },
```

- [ ] **Step 5：N4、N5、N6**

1. N4：02 §3.4 價值表 `economy` 列的說明欄末尾加「；孝親費改變時另計媽媽好感：`(filialAffinityPerMonth[新金額] − filialAffinityPerMonth[參考金額]) × economyHorizonMonths × affinityPerPoint`（`affinityOverrides['chr.mom']` 有值時用它），計入 `chr.mom` 的好感維度；參考金額是 `createNewGame` 的 10,000（v1.3，00 §9.3 N4）」。
2. N5：01 §7.3「過濾」最後一條換成「`trigger.when`（或 `condition` 觸發的 `when`）成立；有 `window` 時：一般檢查點看今天的日期在窗口內；`fastForwardSegment` 檢查點看分段範圍 `[segment.fromDay, segment.toDay]` 與窗口**有交集**即可（v1.3，00 §9.3 N5）。」
3. N6：02 §2.2「敏感度」標題括號內末尾加「；N6（00 §9.3）：以新基準的完整重算延到 Stage 3 實測時鐘倍率後一併進行」。

- [ ] **Step 6：01 §16 新增 G 組與 H 組**

在 F 組最後一條（D58）之後加：
- 標題 `**G. 審查回合 1 套用後的新問題（00 §9.3 的 lead 裁決 N1～N6）**`，條目 59～64，各一行：
  - `59. **D59** （N1）新訓日沒有 gowning 時段；著裝 QTE 在午餐後從教室進 FAB 時開啟，取代 +15 自動著裝（§6.4）。`
  - `60. **D60** （N2）班中由 clock／shiftStart 觸發、場景跟玩家所在場景不同的事件，以 phone 節點開場、在玩家所在場景演出；EventDef.scene 只代表主要場景（§6.4）。`
  - `61. **D61** （N3）範例一 ev.et03_followup_task 的 n_lin 改成 phone 節點（林課長在課群組傳訊），符合 §8.6「伏筆」列（§8.5）。`
  - `62. **D62** （N4）economy 估值另計孝親費帶來的媽媽好感：差額 × economyHorizonMonths × affinityPerPoint（02 §3.4）。`
  - `63. **D63** （N5）有 window 的 condition 觸發在 fastForwardSegment 檢查點看分段範圍與窗口有交集（§7.3）。`
  - `64. **D64** （N6）02 §2.2 敏感度表以新基準重算延到 Stage 3 實測後。`
- 標題 `**H. Stage 1 實作計畫的決定（docs/superpowers/plans/2026-10-24-stage1-foundation.md）**`，條目 65～92：逐條複製本計畫「Stage 1 決定」表的 D65～D92，格式 `65. **D65** <決定欄全文>`。

- [ ] **Step 7：本計畫需要的其他規格修正**

1. 04 §1.6 `PALETTE` 程式區塊在 `shadowBlob` 那一行之前加兩行：`  // UI 共用色（04 §5.9 頭頂名字 sprite；palette_sync 比對 --ink、--paper、--grey，01 D69）` 與 `  ink: 0x0a0a0a, paper: 0xfffdf4, grey: 0xd9d6cc,`。
2. 04 §5.4 天車表「吊架 × 5」列改成「吊架 × 4（靜態）」、位置欄改成「z = 8、2、−4、−10（範例值，01 D70）」。
3. 01 §18「各層公開的函式與介面」表：
   - `core/selectors.ts` 列改成 `maxStamina(state, content)`、`mindRecoveryMultiplier(state, content)`、`linAffinity`、`affinityTier`、`machineStatus(health, rules)`、`ownedMachineHealthAvg(state, content)`、`reviewWind`、`isWindPeriod(state, content)`、`onCallTonight(state, content)`、`presentationMood(state, content)`、`timeOfDay(minuteOfDay)`、`yieldIndex(state, content, scene)`。
   - `core/text.ts` 列改成 `resolveText(ref, ctx, vars)`、`TextVars`。
   - `render/scene_manager.ts` 列加 `createSceneManager`、`SceneManager`；`render/look.ts` 列加 `LightRig`、`LightRigId`、`LightRigInput`、`FabZone`。
   - 新增列（名稱照本計畫各 task 的 Interfaces 區塊）：`utils/math.ts`（`clamp`、`lerp`、`round1`）、`utils/date.ts`（`isoToDayIndex`、`dayIndexToIso`、`weekdayOf`、`clockToMinutes`、`minutesToClock`、`formatMonthDay`）、`utils/errors.ts`（`ContentError`、`SaveError`、`InvariantError`、`RenderError`）、`utils/event_bus.ts`（`createEventBus`、`EventBus`）、`render/resource_tracker.ts`（`createResourceTracker`、`ResourceTracker`）、`render/canvas_textures.ts`（`CanvasTextureFactory`、`createCanvasTextureFactory`）、`render/props/*`（`PropHandle`、`createEtchMachine`、`createFoup`、`createOht`、`createFabShell`）、`render/scenes/fab_bay.ts`（`createFabBayScene`、`FAB_BAY_MACHINES`）、`ui/view_models.ts`（`formatMoney`、`formatDateLabel`、`formatClock`、`isNightShift`、`formatDayCount`、`hudView`、`statsPanelView`、`HudView`、`StatsPanelView`、`StatRowView`）、`ui/components/hud.ts`（`createHud`）、`ui/components/stats_panel.ts`（`createStatsPanel`）、`app/flow_controller.ts`（`toSceneSnapshot`）、`app/dev_panel.ts`（`DEV_PANEL_MARKER`、`calibrationOverrides`、`CalibrationOverrides`）。

- [ ] **Step 8：版本與「已同步」標記**

1. 01 版本紀錄表加一列：`v1.3｜2026-10-24｜同步 00 §9.3 的 N1～N6（§5.2 註解、§6.4、§6.5-10、§7.3、§8.5、§16 G 組）；記錄 Stage 1 實作計畫的決定（§16 H 組）與新增名稱（§18）`，表頭「文件版本」改 `v1.3`。
2. 表頭的版本欄各加一段：02 `v1.3（2026-10-24：同步 00 §9.3 N1、N4、N6——§2.2、§2.6、§2.7、§3.4）`；03 `v0.4（2026-10-24：同步 00 §9.3 N1——§3.10、§7.2）`；04 `v1.3（2026-10-24：同步 00 §9.3 N1——§4.5；PALETTE 加 ink／paper／grey（01 D69）；天車吊架 4 支（01 D70））`。
3. 00 表頭版本欄加 `v1.2（2026-10-24：§9.3 N1～N6 已同步）`；§9.3 的 lead 裁決引言之後加一段引言：`**已同步（2026-10-24，Stage 1 計畫 Task 0）**：N1～N6 已寫回 01 v1.3（§5.2 註解、§6.4、§6.5-10、§7.3、§8.5、§16 D59～D64）、02 v1.3（§2.2、§2.6、§2.7、§3.4）、03 v0.4（§3.10、§7.2）、04 v1.3（§4.5）；Stage 1 計畫的決定寫在 01 §16 H 組 D65～D92。`

- [ ] **Step 9：重跑語法檢查**

Run：同 Step 1 的指令。
Expected：`blocks=41 failed=0`、`blocks=19 failed=0`、`blocks=22 failed=0`、`blocks=6 failed=0`（區塊數不變：只改了既有區塊的內容）。

- [ ] **Step 10：自我檢查**

Run：`cd /d/game2 && grep -n "新訓日也有\|新訓日下午從教室進 bay 同樣適用" docs/specs/0[1-4]*.md`
Expected：沒有輸出。再 `grep -c "D92" docs/specs/01-architecture.md` 應 ≥1。

---

## Task 1：專案初始化（git、工具鏈、hooks、`IMPLEMENTATION_PLAN.md`、前兩個 commit）

**Files:**
- Create: `.gitattributes`、`.gitignore`、`bunfig.toml`、`package.json`、`tsconfig.json`、`biome.json`、`vite.config.ts`、`index.html`、`.githooks/pre-commit`、`.githooks/commit-msg`、`scripts/check_commit_message.ts`、`scripts/check_dist.ts`、`src/main.ts`、`src/app/bootstrap.ts`（暫時骨架）、`src/app/dev_panel.ts`、`IMPLEMENTATION_PLAN.md`
- Test: `test/check_commit_message.test.ts`
- 產生：`bun.lock`

**Interfaces:**
- Consumes：Task 0 修改後的規格。
- Produces：
  - `scripts/check_commit_message.ts`：`export function checkCommitMessage(message: string): string | null`（`null`＝通過；字串＝單行拒絕原因）；直接執行時（`if (import.meta.main)`）讀 `process.argv[2]` 指的檔案，拒絕就 `console.error(原因)` 並 `process.exit(1)`。
  - `src/app/dev_panel.ts`：`export const DEV_PANEL_MARKER = '__FAB7_DEV_PANEL__';`
  - `src/app/bootstrap.ts`：`export async function bootstrap(doc: Document): Promise<void>`（Task 19 換成真正的組裝根）。
  - `package.json` scripts：01 §14.2 原文，唯一差異是 `"verify": "bun run typecheck && bun run check && bun test"`，而且還沒有 `validate-content`（D66）。

- [ ] **Step 1：版本控制與換行設定**

```bash
export PATH="$HOME/.bun/bin:$PATH"; cd /d/game2 && git init -b main && bun --version && node --version
```
Expected：`Initialized empty Git repository …`、`1.2.21`、`v24.14.1`。
建立 `.gitattributes`，內容一行 `* text=auto eol=lf`（D88）；`.gitignore` 照 01 §14.6 原文。

- [ ] **Step 2：設定檔**

照原文建立：`bunfig.toml`（01 §14.6）、`package.json`（01 §14.2；`verify` 依 D66，刪掉 `validate-content` 那一行）、`tsconfig.json`（01 §14.3）、`biome.json`（01 §14.4）、`vite.config.ts`（01 §14.5）。
`index.html`：`<!doctype html>`、`<html lang="zh-Hant-TW">`；`<head>` 有 `<meta charset="utf-8">`、`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`、`<title>上山！穹晶 FAB 7</title>`、`<link rel="icon" href="data:,">`、獨立一行 `<!-- CSP -->`（vite 插件替換的佔位）；`<body>` 照 01 §10.1 的 6 個元素原文（`#scene`、`#fx-layer`、`#ui`、`#overlay`、`#modal`、`#live`）加 `<script type="module" src="/src/main.ts"></script>`。

- [ ] **Step 3：安裝並確認版本**

```bash
export PATH="$HOME/.bun/bin:$PATH"; cd /d/game2 && bun install && bunx tsc --version && bunx biome --version && bunx vite --version
```
Expected：產生 `bun.lock`；`Version 7.0.2`；`Version: 2.5.15`；`vite/8.3.4`。

**TypeScript 退路規則（01 D2、§1.1、§17 R4）**：下列任一情況成立就改用 6.0.3，不再嘗試其他 7.x：(a) `bun install` 解析不到 `typescript@7.0.2`；(b) `tsc` 執行檔不存在或 `--version` 不是 `7.0.2`；(c) Step 9 的 `bun run typecheck` 回報 01 §14.3 某個 compiler option 不支援（例：`error TS5023: Unknown compiler option`），或錯誤位置在 `node_modules`（例：`@types/three`）而 `skipLibCheck` 擋不掉；(d) `tsc` 自己崩潰（stack trace、internal error）。改法：
```bash
bun remove typescript && bun add --exact --dev typescript@6.0.3 && bunx tsc --version
```
Expected：`Version 6.0.3`。在 `IMPLEMENTATION_PLAN.md`「決定紀錄」寫一行：日期、觸發條件代號、錯誤訊息第一行、改用 6.0.3。

- [ ] **Step 4：寫 commit 訊息規則的失敗測試**

`test/check_commit_message.test.ts`：
```ts
import { describe, expect, test } from 'bun:test';
import { checkCommitMessage } from '../scripts/check_commit_message';

const LONG_DESCRIPTION = 'x'.repeat(73);
const ACCEPTED: readonly string[] = [
  'chore(repo): initialize bun, vite, typescript and biome toolchain',
  'feat(core)!: drop the legacy spread formula',
  'docs: explain the CLAUDE.md rules for contributors',
  "Merge branch 'main' into stage1",
  'fix(save): reject saves whose checksum does not match\n\nTruncated writes were loading as half-empty states.',
];
const header = (line: string): string => `commit message rejected: header does not match Conventional Commits: "${line}"`;
const REJECTED: readonly (readonly [string, string])[] = [
  ['update stuff', header('update stuff')],
  ['Feat: add hud', header('Feat: add hud')],
  ['fix(Core): clamp stats', header('fix(Core): clamp stats')],
  [`feat: ${LONG_DESCRIPTION}`, header(`feat: ${LONG_DESCRIPTION}`)],
  [
    'feat(core): add rng\n\nCo-Authored-By: Claude <noreply@anthropic.com>',
    'commit message rejected: AI co-author trailer: line="Co-Authored-By: Claude <noreply@anthropic.com>"',
  ],
  ['feat(core): port the evaluator suggested by ChatGPT', 'commit message rejected: mentions an AI tool: word=chatgpt'],
  ['chore: tidy gemini settings', 'commit message rejected: mentions an AI tool: word=gemini'],
];

describe('checkCommitMessage', () => {
  test.each(ACCEPTED)('accepts %p', (message) => {
    expect(checkCommitMessage(message)).toBeNull();
  });
  test.each(REJECTED)('rejects %p with the exact single-line reason', (message, reason) => {
    expect(checkCommitMessage(message)).toBe(reason);
  });
});
```

- [ ] **Step 5：確認測試失敗**

Run：`bun test test/check_commit_message.test.ts`
Expected：FAIL，`Cannot find module '../scripts/check_commit_message'`。

- [ ] **Step 6：實作 `checkCommitMessage(message: string): string | null`（`scripts/check_commit_message.ts`）**

依序檢查，第一個不符就回傳原因：(1) 去掉以 `#` 開頭的行後取第一行；以 `Merge ` 開頭直接通過；第一行不符 `^(feat|fix|build|chore|ci|docs|style|refactor|perf|test)(\([a-z0-9_-]+\))?!?: .{1,72}$` → `commit message rejected: header does not match Conventional Commits: "<第一行>"`；(2) 任何符合 `/^co-authored-by:/i` 的行，移除 `CLAUDE.md` 後含禁用字 → `commit message rejected: AI co-author trailer: line="<該行原文>"`；(3) 全文移除所有 `CLAUDE.md` 後，依 `claude`、`anthropic`、`chatgpt`、`openai`、`copilot`、`gemini` 的順序找（不分大小寫、子字串）→ `commit message rejected: mentions an AI tool: word=<該字>`。CLI 部分見 Interfaces。

- [ ] **Step 7：確認測試通過**

Run：`bun test test/check_commit_message.test.ts`
Expected：PASS（12 個案例）。

- [ ] **Step 8：入口、DEV 標記、打包檢查**

1. `src/main.ts`：01 §4.5 的 `main.ts` 程式區塊原文。
2. `src/app/dev_panel.ts`：只有 `DEV_PANEL_MARKER`（見 Interfaces）。
3. `src/app/bootstrap.ts`（暫時）：設 `doc.body.dataset.stage = '1'`，然後 `if (import.meta.env.DEV) await import('./dev_panel');`。
4. `scripts/check_dist.ts`（01 §14.5）：用 `new Bun.Glob('**/*').scan({ cwd: 'dist' })` 走 `dist/`，依序檢查，失敗時 `console.error` 一行並 `process.exit(1)`：(a) `dist/index.html` 含 `<meta http-equiv="Content-Security-Policy"`，否則 `dist check failed: missing CSP meta: file=dist/index.html`；(b) 每個檔案的文字都不含 `__FAB7_DEV_PANEL__`，否則 `dist check failed: dev panel marker found: file=<dist 內相對路徑>`；(c) 入口 JS ＝ `dist/index.html` 第一個 `<script type="module"` 標籤的 `src`（去掉開頭的 `./` 或 `/`），`Bun.gzipSync(await Bun.file(<路徑>).bytes()).length ≤ 358400`，否則 `dist check failed: entry js too large: file=<path> gzipBytes=<n> limit=358400`。全部通過印 `dist check passed: entry=<path> gzipBytes=<n>`。

- [ ] **Step 9：驗證工具鏈**

```bash
export PATH="$HOME/.bun/bin:$PATH"; cd /d/game2 && bun run typecheck && bunx biome check .; bun run format && bun run check && bun test && bun run build
```
Expected：typecheck 0 錯誤（不是的話套 Step 3 的退路規則）；第一次 `biome check` 若報**設定錯誤**（規則分組或選項名稱跟 2.5.15 不符；不是程式碼的格式問題），依該版 schema 修正 `biome.json`，把修正寫進 01 §14.4（01 §14.4 附註要求）與決定紀錄；`format` 之後 `check` 乾淨；`bun test` 1 個檔案 PASS；`build` 最後一行 `dist check passed: entry=assets/….js gzipBytes=…`。

- [ ] **Step 10：示範打包檢查會擋下除錯面板（不 commit）**

暫時在 `src/main.ts` 的 import 之後加 `import './app/dev_panel';`，執行 `bun run build`。
Expected：FAIL，`dist check failed: dev panel marker found: file=assets/….js`。移除那一行，再 `bun run build` 回到 PASS；把這次輸出的那一行記進決定紀錄。

- [ ] **Step 11：git hooks 與 `IMPLEMENTATION_PLAN.md`**

1. `.githooks/pre-commit`、`.githooks/commit-msg`：01 §14.7 原文。執行 `bun run hooks:install`；`git config core.hooksPath` 應印 `.githooks`。
2. `IMPLEMENTATION_PLAN.md`：最上面 `# IMPLEMENTATION_PLAN`，接著複製 01 §15 從「## 15. MVP 實作階段劃分」下一行到「MVP 之後」表格結束的全文（三條共通規則、Stage 1～5、MVP 之後）；Stage 1 的 `**Status**` 改 `In Progress`。最後加四節：
   - `## Stage 1 執行紀錄`：一行連到 `docs/superpowers/plans/2026-10-24-stage1-foundation.md`；子標題 `### 決定紀錄`（TypeScript 版本、Biome 設定修正、紅燈示範輸出、校準結果，一筆一行）。
   - `## 驗證器規則的 stage 分配（01 D81）`：兩欄表（01 §8.6 類別｜Stage）：`ID、參照、節點圖、台詞（存在、孤兒、佔位符）、數值方向`｜1；`選項、場景、觸發、數值、角色、出處、伏筆、台詞長度 warning`｜2；`小遊戲領域資料、小遊戲預設組`｜3；`劇本、平衡、安全、台詞標記、GAME OVER 與求助專線`｜5。
   - `## Stage 1 內容暫缺（01 D65、D91）`：Hold Lot 量測列與留言、半夜電話逐句台詞（`docs/issues.md` #1，Stage 3）；`balance.minigameRewards`（Stage 3）；工作方針「省」的「下班被叫住」（Stage 4）；事件、劇本關鍵日、結局、任務、夜間行動（Stage 2／5）。
   - `## 待人工驗收清單`：表頭 `| 項目 | 出處 | 代理量測的結果 | 需要誰 | 狀態 |`（01 §15 共通規則 3），先不放列。

- [ ] **Step 12：第一個 commit（規格同步）**

```bash
export PATH="$HOME/.bun/bin:$PATH"; cd /d/game2 && git add .gitattributes CLAUDE.md docs design && git commit -m "docs(specs): sync review round 1 decisions N1-N6 into specs" -m "Index section 9.3 requires the six decisions to be written back before code lands; the Stage 1 plan decisions go to 01 section 16 group H so the specs stay the single source."
```
Expected：pre-commit 跑完 `verify` 全綠，commit-msg 通過；`git log --oneline` 1 筆。

- [ ] **Step 13：第二個 commit（工具鏈）**

```bash
git add .gitignore .githooks bunfig.toml package.json bun.lock tsconfig.json biome.json vite.config.ts index.html scripts test src IMPLEMENTATION_PLAN.md && git add --chmod=+x .githooks/pre-commit .githooks/commit-msg && git commit -m "chore(repo): initialize bun, vite, typescript and biome toolchain" -m "Every later commit is gated by the pre-commit verify run and the commit-msg checker, so both gates must exist before any game code lands."
```
Expected：commit 成功。再確認 hook 會擋：`git commit --allow-empty -m "update stuff"` 印 `commit message rejected: header does not match Conventional Commits: "update stuff"`，`git log --oneline` 仍是 2 筆。

---

## Task 2：統一資料模型 `src/model.ts`

**Files:**
- Create: `src/model.ts`

**Interfaces:**
- Consumes：01 §5.2（已含 Task 0 的 `EventDef.scene` 註解修改）。
- Produces：01 §18「`src/model.ts` 的型別與常數」表的全部名稱；後續 task 一律 `import type { … } from '…/model'`（`VISIBLE_STAT_IDS`、`HIDDEN_STAT_IDS`、`SAVE_SCHEMA_VERSION` 是值，用一般 import）。

- [ ] **Step 1：複製 01 §5.2 程式區塊**

把 01 §5.2 ` ```ts ` 區塊（第一行 `// src/model.ts — 統一資料模型（對映 CLAUDE.md 的 model.py）` 到最後的 `MinigameLogic` 介面）逐字複製成 `src/model.ts`。這是型別檔，沒有可以 TDD 的行為；型別檢查就是它的測試（CLAUDE.md：不測型別檢查已經抓到的事）。

- [ ] **Step 2：型別檢查與格式**

Run：`bun run format && bun run typecheck && bun run check`
Expected：全部 0 錯誤。若 typecheck 在 `model.ts` 報錯，只做讓它通過的最小修改，並把同樣的修改寫回 01 §5.2（維持單一來源），在決定紀錄記一行。`biome format` 造成的純排版差異不必回寫。

- [ ] **Step 3：Commit**

```bash
git add src/model.ts && git commit -m "feat(model): add the unified data model from spec 01 section 5.2" -m "All layers share one set of serializable types; nothing else may redefine them."
```

---
## Task 3：`utils/errors`、`utils/math`、`utils/date`

**Files:**
- Create: `src/utils/errors.ts`、`src/utils/math.ts`、`src/utils/date.ts`
- Test: `src/utils/errors.spec.ts`、`src/utils/math.spec.ts`、`src/utils/date.spec.ts`

**Interfaces:**
- Consumes：`ContentIssue`、`SaveErrorKind`、`SaveSlotId`、`IsoDate`、`ClockTime`（model）。
- Produces：
  ```ts
  // src/utils/errors.ts（01 §12.1；每個類別設定 this.name 為類別名）
  export class ContentError extends Error { readonly issues: readonly ContentIssue[]; static fromIssues(issues: readonly ContentIssue[]): ContentError }
  export class SaveError extends Error { constructor(readonly kind: SaveErrorKind, readonly slot: SaveSlotId | null, readonly detail: string) }
  export class InvariantError extends Error {}
  export class RenderError extends Error { constructor(readonly kind: 'webglUnavailable' | 'contextLost' | 'sceneBuild', readonly detail: string) }
  // src/utils/math.ts
  export function clamp(value: number, lo: number, hi: number): number;
  export function lerp(a: number, b: number, t: number): number;
  export function round1(value: number): number;          // Math.round(value × 10) ÷ 10
  // src/utils/date.ts（dayIndex 0 ＝ 2027-03-01 星期一；星期 0＝一 … 6＝日，02 §0.2）
  export function isoToDayIndex(iso: IsoDate): number;
  export function dayIndexToIso(dayIndex: number): IsoDate;
  export function weekdayOf(dayIndex: number): 0 | 1 | 2 | 3 | 4 | 5 | 6;
  export function clockToMinutes(clock: ClockTime): number;
  export function minutesToClock(minuteOfDay: number): ClockTime;
  export function formatMonthDay(dayIndex: number): string;   // 'M/D'，黑歷史本的 {date}（01 §8.4）
  ```
  訊息格式：`ContentError.fromIssues` → `Content invalid: errors=<error 數> first=<第一個 error 的 id> <path> <message>`（沒有 error 時用第一個 issue）；空陣列 → `InvariantError('ContentError.fromIssues called without issues')`；`SaveError.message` → `Save failed: kind=<kind> slot=<slot 或 none> detail=<detail>`；`RenderError.message` → `Render failed: kind=<kind> detail=<detail>`；日期錯誤 → `Invalid ISO date: value=<原字串>`、`Invalid clock time: value=<原字串>`、`Invalid day index: value=<n>`、`Invalid minute of day: value=<n>`；`clamp` 的 `lo > hi` → `Invalid clamp bounds: lo=<lo> hi=<hi>`。

- [ ] **Step 1：寫失敗測試**

`src/utils/errors.spec.ts`：
```ts
import { describe, expect, test } from 'bun:test';
import type { ContentIssue } from '../model';
import { ContentError, InvariantError, RenderError, SaveError } from './errors';

// 01 §12.2 的訊息範例：3 個 error、前面有 1 個 warning
const ISSUES: readonly ContentIssue[] = [
  { severity: 'warning', id: 'ev.et03_down', path: 'nodes.n_r_stay.text', message: 'narration longer than 120 chars: length=126' },
  { severity: 'error', id: 'ev.et03_down', path: 'nodes.n_choice.choices[2].requires.all[1].flag', message: "unknown flag 'flag.azhe_refuse_coordination'" },
  { severity: 'error', id: 'ev.x', path: 'start', message: "unknown node 'n_x'" },
  { severity: 'error', id: 'ev.y', path: 'start', message: "unknown node 'n_y'" },
];

describe('ContentError.fromIssues', () => {
  test('summarizes the error count and the first error on one line, keeping every issue', () => {
    const error = ContentError.fromIssues(ISSUES);
    expect({ message: error.message, issues: error.issues }).toEqual({
      message: "Content invalid: errors=3 first=ev.et03_down nodes.n_choice.choices[2].requires.all[1].flag unknown flag 'flag.azhe_refuse_coordination'",
      issues: ISSUES,
    });
  });
  test('refuses an empty issue list', () => {
    expect(() => ContentError.fromIssues([])).toThrow(InvariantError);
  });
});

describe('SaveError and RenderError', () => {
  test('carry kind and detail in a single-line message', () => {
    expect([
      new SaveError('checksum', 'slot1', 'expected=1a2b actual=3c4d').message,
      new SaveError('storageUnavailable', null, 'quota').message,
      new RenderError('webglUnavailable', 'context creation failed').message,
    ]).toEqual([
      'Save failed: kind=checksum slot=slot1 detail=expected=1a2b actual=3c4d',
      'Save failed: kind=storageUnavailable slot=none detail=quota',
      'Render failed: kind=webglUnavailable detail=context creation failed',
    ]);
  });
});
```

`src/utils/math.spec.ts`：`describe('clamp')` 用 `test.each([[5, 0, 3, 3], [-1, 0, 3, 0], [2, 0, 3, 2], [3, 0, 3, 3]])` 斷言 `clamp(v, lo, hi)` 等於第 4 欄；`clamp(1, 3, 0)` 丟 `InvariantError`。`describe('lerp')`：`[[0, 10, 0, 0], [0, 10, 1, 10], [0, 10, 0.25, 2.5], [4, -4, 0.5, 0]]`。`describe('round1')`：`[[96.75, 96.8], [96.25, 96.3], [90, 90], [-1.25, -1.2], [0.04, 0]]`（96.75、96.25 在二進位精確表示，是 Task 7 良率指數的實際輸入；−1.25 釘住 `Math.round` 的 .5 往正無限大進位）。

`src/utils/date.spec.ts`：
```ts
import { describe, expect, test } from 'bun:test';
import { InvariantError } from './errors';
import { clockToMinutes, dayIndexToIso, formatMonthDay, isoToDayIndex, minutesToClock, weekdayOf } from './date';

// 預期值以 Date.UTC 另外算出：(Date.UTC(y, m − 1, d) − Date.UTC(2027, 2, 1)) ÷ 86 400 000
const CALENDAR: readonly (readonly [string, number, number])[] = [
  ['2027-03-01', 0, 0],
  ['2027-06-13', 104, 6], // 01 §15：值班夜是星期日
  ['2027-09-09', 192, 3], // 02 T73
  ['2028-01-12', 317, 2], // 02 §7.4 年度考績
  ['2028-02-29', 365, 1], // 01 §15：MVP 期滿日
  ['2030-02-28', 1095, 3], // 完整版期滿日
];
const LAST_FULL_GAME_DAY = 1095;
// Review Focus 4：手打錯的日期必須立刻失敗，不能被 Date.UTC 滾到隔壁日期
const INVALID_ISO = ['2027-02-30', '2027-6-13', '2027-13-01', '2027-06-13T00:00', ''];
const CLOCKS: readonly (readonly [string, number])[] = [['00:00', 0], ['06:30', 390], ['22:47', 1367], ['23:59', 1439]];
const INVALID_CLOCKS = ['24:00', '7:00', '12:60', ''];

describe('isoToDayIndex', () => {
  test.each(CALENDAR)('%p is day index %p', (iso, dayIndex) => {
    expect(isoToDayIndex(iso)).toBe(dayIndex);
  });
  test.each(INVALID_ISO)('rejects %p instead of rolling it over to a neighbouring date', (iso) => {
    expect(() => isoToDayIndex(iso)).toThrow(InvariantError);
  });
});

describe('dayIndexToIso', () => {
  test('round-trips every day of the full three-year game', () => {
    const mismatches = Array.from({ length: LAST_FULL_GAME_DAY + 1 }, (_, day) => day).filter(
      (day) => isoToDayIndex(dayIndexToIso(day)) !== day,
    );
    expect(mismatches).toEqual([]);
  });
  test.each([-1, 1.5, Number.NaN])('rejects the non-integer or negative day index %p', (day) => {
    expect(() => dayIndexToIso(day)).toThrow(InvariantError);
  });
});

describe('weekdayOf', () => {
  test.each(CALENDAR)('%p (day %p) falls on weekday %p where 0 is Monday', (_iso, dayIndex, weekday) => {
    expect(weekdayOf(dayIndex)).toBe(weekday);
  });
});

describe('clockToMinutes and minutesToClock', () => {
  test.each(CLOCKS)('%p is minute %p and back', (clock, minutes) => {
    expect([clockToMinutes(clock), minutesToClock(minutes)]).toEqual([minutes, clock]);
  });
  test.each(INVALID_CLOCKS)('rejects the clock string %p', (clock) => {
    expect(() => clockToMinutes(clock)).toThrow(InvariantError);
  });
  test.each([-1, 1440, 12.5])('rejects the minute of day %p', (minute) => {
    expect(() => minutesToClock(minute)).toThrow(InvariantError);
  });
});

describe('formatMonthDay', () => {
  test.each([[0, '3/1'], [104, '6/13'], [365, '2/29']])('day %p reads %p', (day, text) => {
    expect(formatMonthDay(day)).toBe(text);
  });
});
```

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/utils`
Expected：FAIL，三個 spec 都是 `Cannot find module`。

- [ ] **Step 3：實作三個檔案（簽名與訊息見 Interfaces）**

`date.ts` 用 `Date.UTC` 與 `new Date(<毫秒>)` 的 `getUTC*()` 換算（不用無參數 `new Date()`，01 §4.2）；`isoToDayIndex` 先用 `^\d{4}-\d{2}-\d{2}$` 檢查格式，再把算出的 dayIndex 轉回 ISO 比對原字串，不同就丟（擋下 `2027-02-30` 這種被 `Date.UTC` 滾動的日期）。`clockToMinutes` 用 `^([01]\d|2[0-3]):[0-5]\d$`。

- [ ] **Step 4：確認測試通過**

Run：`bun test src/utils`
Expected：PASS。

- [ ] **Step 5：verify 並 commit**

Run：`bun run verify` → 全綠。
```bash
git add src/utils && git commit -m "feat(utils): add typed errors, math helpers and calendar conversion" -m "Day index 0 is 2027-03-01; invalid ISO dates fail fast instead of rolling over, because content authors type dates by hand."
```

---

## Task 4：`utils/logger`、`utils/event_bus`

**Files:**
- Create: `src/utils/logger.ts`、`src/utils/event_bus.ts`
- Test: `src/utils/logger.spec.ts`、`src/utils/event_bus.spec.ts`

**Interfaces:**
- Consumes：`InvariantError`（Task 3）。
- Produces：
  ```ts
  // src/utils/logger.ts（01 §12.3 原文）
  export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
  export interface Logger { debug(m: string): void; info(m: string): void; warn(m: string): void; error(m: string, cause?: unknown): void; child(module: string): Logger; recent(): readonly string[] }
  export function createConsoleLogger(options: { level: LogLevel; now: () => string; ringSize: number; strictSingleLine?: boolean }): Logger;
  export function createMemoryLogger(): Logger & { lines: string[] };
  // src/utils/event_bus.ts
  export interface EventBus<M extends Record<string, unknown>> {
    on<K extends keyof M>(type: K, listener: (payload: M[K]) => void): () => void;
    emit<K extends keyof M>(type: K, payload: M[K]): void;
  }
  export function createEventBus<M extends Record<string, unknown>>(): EventBus<M>;
  ```
  行為（釘住）：console logger 的一行 ＝ `<now()> <level> <前綴><message>`，前綴是 `child()` 鏈上每一層的 `[module] `（`child('a').child('b')` → `[a] [b] `）；`error` 有 `cause` 時在行尾加 ` cause=<cause instanceof Error ? cause.message : String(cause)>`；低於 `level` 的訊息不輸出也不進環狀緩衝；`recent()` 回傳最近 `ringSize` 行（舊的在前）；輸出用 `console.debug/info/warn/error`；`strictSingleLine: true` 時訊息含 `\n` → 丟 `InvariantError('Log message must be single line: length=<n>')`，否則把 `\r?\n` 換成 `⏎`。memory logger：不分等級全部記錄，一行 ＝ `<level> <前綴><message>`（沒有時間），`lines` 與 `recent()` 是同一份內容，永遠 strict。event bus：同類型的 listener 依訂閱順序呼叫；`emit` 當下才加入的 listener 不會在這次被呼叫；listener 丟出的例外直接往外傳（後面的 listener 不再呼叫，不吞錯）。

- [ ] **Step 1：寫失敗測試**

`src/utils/logger.spec.ts` 的 `describe('createConsoleLogger')`（`beforeEach` 用 `spyOn(console, 'debug' | 'info' | 'warn' | 'error').mockImplementation(() => {})` 讓輸出安靜，`afterEach` 還原）：
1. `'drops messages below the level and timestamps the rest'`：`level: 'warn'`、`now: () => 'T'`、`ringSize: 10`；`child('scheduler')` 送 `info('a')`、`warn('event deferred: event=ev.x')`、`error('boom', new Error('disk'))` → `recent()` 等於 `['T warn [scheduler] event deferred: event=ev.x', 'T error [scheduler] boom cause=disk']`。
2. `'keeps only the newest ringSize lines'`：`ringSize: 2` 送 `warn('1')`、`warn('2')`、`warn('3')` → `['T warn 2', 'T warn 3']`。
3. `'nested children stack their module prefixes'`：`child('a').child('b').warn('x')` → `['T warn [a] [b] x']`。
4. `'strict mode rejects a multi-line message'`：`strictSingleLine: true`，`warn('a\nb')` 丟 `InvariantError`。
5. `'lenient mode folds newlines into the return symbol'`：`warn('a\r\nb\nc')` → `['T warn a⏎b⏎c']`。

`describe('createMemoryLogger')`：`'records every level without a timestamp'`：`debug('d')`、`child('ui').info('i')` → `lines` 等於 `['debug d', 'info [ui] i']`；`'is always strict'`：`info('x\ny')` 丟 `InvariantError`。

`src/utils/event_bus.spec.ts` 的 `describe('createEventBus')`（型別 `{ ping: number; pong: string }`）：
1. `'calls listeners of one type in subscription order with the payload'`：兩個 listener 把 `` `${名字}:${payload}` `` 推進陣列，`emit('ping', 7)` → `['first:7', 'second:7']`，而且 `pong` 的 listener 沒被呼叫。
2. `'an unsubscribed listener is not called again'`。
3. `'a listener added during emit waits for the next emit'`：第一個 listener 在被呼叫時 `on` 一個新的；第一次 emit 後紀錄只有 1 筆、第二次 emit 後 3 筆。
4. `'a throwing listener propagates and stops later listeners'`：第一個丟 `new Error('x')`，`expect(() => bus.emit('ping', 1)).toThrow('x')`，第二個的紀錄是 `[]`。

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/utils/logger.spec.ts src/utils/event_bus.spec.ts`
Expected：FAIL，`Cannot find module`。

- [ ] **Step 3：實作（簽名與行為見 Interfaces）**

`createConsoleLogger` 的子 logger 共用同一個環狀緩衝與等級；`utils/logger.ts` 是 biome 設定允許 `console` 的檔案之一（01 §14.4 overrides）。

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/utils && git commit -m "feat(utils): add single-line logger and typed event bus" -m "Log lines must stay single-line (CLAUDE.md); strict mode turns a violation into an error during development."
```

---

## Task 5：`core/rng`（mulberry32）

**Files:**
- Create: `src/core/rng.ts`
- Test: `src/core/rng.spec.ts`

**Interfaces:**
- Consumes：`InvariantError`。
- Produces：01 §7.7 的 `Rng` 介面與 `createRng(state: number): Rng` 原文。行為釘住：`nextUint32()` 是公開的 mulberry32（`a = (a + 0x6d2b79f5) | 0; t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (t ^ (t >>> 14)) >>> 0`，`getState()` 回傳 `a >>> 0`）；`next() = nextUint32() / 4294967296`；`int(min, max) = min + Math.floor(next() × (max − min + 1))`（非整數或 `min > max` → `InvariantError`）；`chance(p) = next() < p`；`pickWeighted` 先抽一次 `next()`，再乘上「權重 >0 的總和」在累積權重上挑第一個 `r < 累積值` 的項目，總和 ≤0 時回傳 `null`（仍然已經消耗一次）；`forkSeed() = nextUint32()`；`createRng(state)` 在 state 不是 0～4294967295 的整數時丟 `InvariantError('Invalid rng state: value=<state>')`。

- [ ] **Step 1：寫失敗測試**

`src/core/rng.spec.ts`：先放 01 §13.4「範例二」的程式區塊原文（`MULBERRY32_STATE_1_REFERENCE = [2693262067, 11749833, 2265367787]`、往返、`int` 範圍三個測試），再加：
```ts
// 下列預期值都由 state=1 的參考輸出推得（以獨立的參考實作另外算過）：
// 第一個 uint32 ＝ 2693262067 → next() ＝ 2693262067 / 2^32 ≈ 0.62707
// 抽一次之後 state ＝ (1 + 0x6d2b79f5) mod 2^32 ＝ 1831565814
const STATE_AFTER_ONE_DRAW_FROM_1 = 1831565814;
const FIRST_UINT32_FROM_1 = 2693262067;

describe('Rng draws from state 1', () => {
  test('every primitive consumes exactly one step and maps the first output as specified', () => {
    const outcomes = [
      (r: Rng) => r.int(1, 6),                 // 1 + floor(0.627 × 6) = 4
      (r: Rng) => r.chance(0.6),               // 0.627 < 0.6 → false
      (r: Rng) => r.chance(0.7),               // 0.627 < 0.7 → true
      (r: Rng) => r.pickWeighted([{ item: 'a', weight: 1 }, { item: 'b', weight: 1 }, { item: 'c', weight: 2 }]), // 0.627 × 4 = 2.51 → 'c'
      (r: Rng) => r.pickWeighted([{ item: 'a', weight: 0 }, { item: 'b', weight: -1 }]), // 全部 ≤0 → null
      (r: Rng) => r.forkSeed(),
    ].map((draw) => {
      const rng = createRng(1);
      return { value: draw(rng), state: rng.getState() };
    });
    expect(outcomes).toEqual([
      { value: 4, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: false, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: true, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: 'c', state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: null, state: STATE_AFTER_ONE_DRAW_FROM_1 },
      { value: FIRST_UINT32_FROM_1, state: STATE_AFTER_ONE_DRAW_FROM_1 },
    ]);
  });
});

describe('createRng input checks', () => {
  // Review Focus 5：損壞的 rngState 不能默默變成另一串亂數
  test.each([-1, 1.5, 4294967296, Number.NaN])('rejects the state %p', (state) => {
    expect(() => createRng(state)).toThrow(InvariantError);
  });
  test('accepts the largest uint32 state', () => {
    expect(createRng(4294967295).getState()).toBe(4294967295);
  });
  test('rejects an empty int range', () => {
    expect(() => createRng(1).int(3, 1)).toThrow(InvariantError);
  });
});
```
（import 補上 `type Rng`、`InvariantError`。）

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/rng.spec.ts`
Expected：FAIL，`Cannot find module './rng'`。

- [ ] **Step 3：實作 `createRng(state: number): Rng`（`src/core/rng.ts`，演算法見 Interfaces）**

- [ ] **Step 4：確認測試通過**

Run：`bun test src/core/rng.spec.ts`
Expected：PASS（含 01 範例二的 3 個測試）。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/rng.ts src/core/rng.spec.ts && git commit -m "feat(core): add seeded mulberry32 rng with a fixed consumption contract" -m "Every primitive consumes exactly one draw so content tweaks never shift later random sequences; corrupt states fail fast."
```

---

## Task 6：測試用內容 `test/fixtures.ts` 與 `core/new_game`

**Files:**
- Create: `test/fixtures.ts`、`src/core/new_game.ts`
- Test: `src/core/new_game.spec.ts`

**Interfaces:**
- Consumes：model 全部型別；`createRng` 不用（新遊戲不擲骰）；`clockToMinutes`、`isoToDayIndex`（Task 3）；`InvariantError`。
- Produces：
  ```ts
  // src/core/new_game.ts
  export function createNewGame(profile: PlayerProfile, content: ContentBundle, seed: number): GameState;
  // test/fixtures.ts（01 §13.2 骨架，加兩個小工具）
  export const TEST_SEED = 1;
  export const testContent: ContentBundle;
  export interface TestStateOverrides { stats?: Partial<Record<StatId, number>>; flags?: Record<FlagId, boolean>; counters?: Record<CounterId, number> }
  export function buildTestState(overrides?: TestStateOverrides): GameState;
  export function minigameContextFor(overrides?: Partial<MinigameContext>): MinigameContext;
  /** 在測試裡取 Record 的值；不存在就丟 Error（noUncheckedIndexedAccess 下取代 `!`） */
  export function defined<T>(value: T | undefined, label: string): T;
  /** 只覆寫最上層欄位的內容副本 */
  export function contentWith(patch: Partial<ContentBundle>): ContentBundle;
  ```
  `buildTestState`、`minigameContextFor` 的本體照 01 §13.2 原文。

**`createNewGame` 的規則**（02 §1.1、§1.2、§7.6、§8.2、§1.10、D80）：`stats` ＝ 每個 `StatRule.initial`，再以 `resume.initialStats` 覆寫（不是相加）；`relationships` ＝ 每個 `isDirectBoss: false` 的角色 `{ affinity: initialAffinity + (resume.initialAffinity[id] ?? 0), lastInteractionDay: null, coordinateWaiverUsedIn: null }`；`flags` ＝ `resume.initialFlags` 各設 true；`counters` ＝ `{ 'cnt.wip_pressure': balance.wip.initial }`；`machines` ＝ 每個 `MachineDef` 的 `{ health: initialHealth }`；`career` ＝ `{ rank: 'Q1', monthlySalary: ranks.Q1.monthlySalary, probation: 'pending', certificationScore: null, kpiSamples: [], reviews: [], bonusMultiplier: 1, overtimeHoursThisMonth: 0, overtimeHoursDeclaredThisMonth: 0, bossFavorFromOvertimeToday: 0, onCallThisWeek: false, onCallCallsThisMonth: 0 }`；`economy` ＝ `{ housing: 'dorm', housingSinceDay: 0, commute: 'shuttle', filialAmount: 10000, monthLedger: [], payslips: [], totalIncome: 0 }`；`time` ＝ `{ dayIndex: isoToDayIndex(campaign.startDate), minuteOfDay: clockToMinutes(balance.sleep.wakeAt), chapter: campaign.chapters[0].id, keyDaysPlayed: 0, currentKeyDay: <date === startDate 的關鍵日 { id, kind }，沒有就 null> }`；`flow` ＝ `{ kind: 'keyDay', phase: 'wake' }`；`runId: \`run-${seed}\``、`seed`、`rngState: seed`；`events` ＝ `{ seen: {}, cooldowns: {}, queue: [], deferred: [], pendingKeyDays: [], nonScriptedKeyDaysByMonth: {}, interruptsByMonth: {}, today: { dialogue: 0, crisis: 0 }, locationsVisited: [] }`；`choiceTally` ＝ 12 種 `ChoiceType` 全 0；`modifiers: []`、`tasks: []`、`seeds: []`、`blackBook: []`、`policy: null`、`phone: { messages: [] }`、`location: null`、`runStats: { overtimeHours: 0, wokenUpCount: 0, onTimeLeaves: 0 }`、`interaction: null`、`endingResult: null`。錯誤：seed 不是 0～4294967295 的整數 → `InvariantError('Invalid seed: value=<seed>')`；履歷不存在 → `InvariantError('Unknown resume: resume=<id>')`；沒有章節 → `InvariantError('Campaign has no chapters')`。

**`testContent` 的內容**（最小但完整、會通過 Task 12 的 `validateContent`；跟真實內容分開維護，01 §13.2）。可以用 TS 的 spread、`Object.fromEntries` 組資料（這是測試碼，不受 content 層規則限制）：
- `stats`：02 §1.1 表的 15 列（`skill` 22、`bossFavor` 50、`favor` 3、`money` 60000、`scheming` 10、`network` 12，其餘照表；`stamina.max = 'maxStamina'`；`favor.overflowTo = { stat: 'network', perUnit: 3 }`；`integer: true` 只有 `favor`、`money`、`goldenHandcuffs`、`evidence`；`lowLine` 只有 `stamina`、`mind` 為 35）。
- `campaign`：`startDate '2027-03-01'`、`termEndDate '2028-02-29'`、`chapters: [{ id: 'prologue', title: 't.test.chapter', from: '2027-03-01', to: '2028-02-29', fastForward: 'week', keyDays: ['kd.test_start', 'kd.test_review'] }]`、`keyDayTarget { min: 2, max: 2 }`、`termEndings ['end.e99_test']`、`templates { conditional: 'kd.test_template', interrupt: 'kd.test_template' }`。
- `keyDays`：`kd.test_start`（`date '2027-03-01'`、`kind 'scripted'`、`chapter 'prologue'`、`title 't.test.kd'`、`variant 'full'`、`phases` 8 段全部、`events [{ event: 'ev.test_scripted', checkpoint: 'shiftStart' }]`、`tasks ['task.test_spc']`、`onCall false`）；`kd.test_review`（`date '2028-01-12'`、`scripted`、`'prologue'`、`'t.test.kd'`、`variant 'review'`、8 段、`events []`、`tasks []`、`onCall false`）；`kd.test_template`（`date null`、`kind 'conditional'`、`chapter null`、`'t.test.kd'`、`variant 'short'`、`phases ['briefing']`、`events []`、`tasks []`、`onCall false`）。
- `characters`：`chr.lin`（`isDirectBoss true`、`hasPortrait true`、`expressions ['fakeSmileGlare']`、`defaultExpression 'fakeSmileGlare'`、`initialAffinity 0`）、`chr.azhe`（`isDirectBoss false`、`hasPortrait true`、`expressions ['neutral']`、`defaultExpression 'neutral'`、`initialAffinity 10`）、`chr.meiling`（同阿哲，`initialAffinity 10`）；`name`／`role` 用 `t.test.chr.<slug>.name`、`.role`；`appearance` 三位共用一個 `{ outfit: 'cleanroom', skinTone: '#fde7cf', hairColor: '#0a0a0a', hairStyle: 'short', topColor: '#e9eef2', bottomColor: '#3a3f4a', badgeColor: '#9aa3ad', heightScale: 1, glasses: false, modelRef: null }`（`fab` 與 `outside` 同一份）。
- `resumes`：`res.test`：`label`／`description` `'t.test.resume'`、`initialStats { skill: 30 }`、`initialAffinity { 'chr.azhe': 5 }`、`initialFlags ['flag.test_onboarded']`、`minigameTolerance {}`。
- `events`（3 個）：
  - `ev.test_scripted`：`gddRef null`、`category 'main'`、`chapters ['prologue']`、`tags []`、`trigger { kind: 'scripted' }`、`repeatable false`、`overflow 'drop'`、`presentation 'scene'`、`scene 'scn.fab_bay'`、`gameMinutes 20`、`start 'n_line'`、`nodes`：`n_line`（`line`、`speaker 'narrator'`、`text 't.ev.test_scripted.line'`、`next 'n_choice'`）、`n_choice`（`choice`；`choices`：`c_yes`（`label 't.ev.test_scripted.c_yes'`、`type 'endure'`、`effects [{ op: 'stat', stat: 'skill', delta: 2 }, { op: 'plantSeed', seed: 'seed.test_followup' }]`、`next 'n_result'`）、`c_no`（`label 't.ev.test_scripted.c_no'`、`type 'refuse'`、`effects [{ op: 'stat', stat: 'mind', delta: -3 }]`、`next 'n_result'`））、`n_result`（`result`、`text 't.ev.test_scripted.result'`、`next null`）；`seeds [{ id: 'seed.test_followup', window: { minDays: 1, maxDays: 3 }, checkpoints: ['briefing'], chance: 1, outcome: { event: 'ev.test_seeded' }, weight: 1 }]`；`sourceRefs ['〔test〕']`。
  - `ev.test_seeded`：`category 'condition'`、`trigger { kind: 'seed' }`、`presentation 'scene'`、`scene 'scn.office'`、`gameMinutes 5`、`start 'n_msg'`、`nodes { n_msg: { kind: 'phone', thread: 'thread.test', messages: [{ from: 'chr.azhe', text: 't.ev.test_seeded.msg', kind: 'chat' }], next: null } }`、其餘欄位同上（`chapters ['prologue']`、`tags []`、`repeatable false`、`overflow 'drop'`、`sourceRefs []`、`gddRef null`）。
  - `ev.test_micro`：`category 'micro'`、`trigger { kind: 'micro', weight: 1 }`、`presentation 'micro'`、`scene null`、`gameMinutes 0`、`start 'n_tally'`、`nodes { n_tally: { kind: 'effects', effects: [{ op: 'counter', counter: 'cnt.test_tally', delta: 1 }], next: null } }`、`repeatable true`、`overflow 'drop'`。
- `endings`：`end.e99_test`：`name`、`card`、`panels[0]` 都是 `'t.test.ending'`、`tone 'neutral'`、`timing 'term'`、`condition { all: [] }`、`palette 'firstYear'`、`showHelpCard false`。
- `minigames`：每個遊戲一個預設組 `basic`：`mg.gowning` `{ mode: 'qte', variants: [], timeLimitSec: 10 }`／15 分／0 體力，`chapterDefaults { prologue: 'basic' }`，`rules null`；`mg.spc` `{ variant: 'chart', charts: 1, rules: ['beyond3Sigma'], pointIntervalMs: 800, noise: 0, durationSec: 40, tutorial: false }`／30／4，`rules.ocap` 照 03 §7.1；`mg.hold_lot` `{ cards: 1, ambiguity: 0, qTimePressure: false, tutorial: false, consult: false }`／15／3，`rules`：`tutorialCase 'adiCdHigh'`，6 個案例用同一份基底 `{ stage: 'AEI', minAmbiguity: 0, station: 't.test.mg.station', description: 't.test.mg.case', measurements: [], waferPattern: 'allOk', qTimeMinutes: [60, 120], payoffs: { release: 100, rework: 0, scrap: 0, split: 0, fa: 0 }, releaseIsBad: false, scrapIsOver: true, notes: { helpful: N, neutral: N, misleading: null } }`（`N = { from: 'technician', text: 't.test.mg.note', misleading: false }`）；`mg.oncall` `{ stepsRequired: 3, timeLimitSec: 60, blurByStamina: false, tutorial: false, scenario: 'random' }`／20／0，`rules`：5 個情境共用 `{ machine: 'mc.test01', transcript: [], correct: ['checkAlarm', 'abortWafer', 'holdTool'], dangerous: ['resetContinue'] }`、`randomPool ['chamberPressure']`、`tutorialScenario 'chamberPressure'`、`neutralCommands ['waitMorning']`。
- `workPolicies`（4）、`lifePolicies`（6）：`label`、`description` 都是 `'t.test.policy'`、`monthlyEffects []`、`overtimeHoursPerMonth 0`。`lifeActions {}`。
- `ranks`：Q1 58000／Q2 66000／Q3 78000（allowance 6000）／Q4 92000（9000）／Q5 0；`title 't.test.rank'`；`overtimeEligible` Q1、Q2 true，其他 false（02 §7.1）。
- `economy`、`review`、`balance`：所有數字欄位照 02 §14.1～§14.3（Task 13 的真實內容用同一份表）；所有 `Effect[]` 欄位寫 `[]`；`review.peers []`；`review.pip.weeklySuccess 0.5`；`balance.valuation` 的 `affinityOverrides`、`counterValues`、`flagValues`、`modifierValues` 都是 `{}`；`balance.minigameRewards []`；`minigameResultValues` 照 02 §1.9 最後一條。
- `locations`：`loc.test_bay` `{ name: 't.test.loc', scene: 'scn.fab_bay', mode: '3d', cleanroom: true, staminaPerHour: 0, hotspots: ['hs.test_tool'] }`。
- `machines`：`mc.test01`（`label 'T-01'`、`location 'loc.test_bay'`、`hotspot 'hs.test_tool'`、`ownedByPlayer true`、`initialHealth 45`）、`mc.test02`（`'T-02'`、owned、80）、`mc.test03`（`'T-03'`、`ownedByPlayer false`、10）。
- `tasks`：`task.test_spc` `{ title: 't.test.task', location: 'loc.test_bay', hotspot: 'hs.test_tool', action: { kind: 'minigame', minigame: 'mg.spc', preset: 'basic' }, staminaCost: 0, autoCompletable: true }`。
- `flags`：`flag.test_switch`、`flag.test_onboarded`、`flag.sys_bonded_help_azhe`、`flag.sys_bonded_help_meiling`、`flag.sys_stop_sequence_active`（都是 `scope 'run'`、`description` 一句英文）；`counters`：`cnt.test_tally`、`cnt.wip_pressure`、`cnt.sys_exercise_bonus`。
- `text`：上面每一個 `TextId` 各一句短中文（例 `'t.ev.test_scripted.line': '測試台詞'`），另加 `'t.sys.bonded_help.azhe'`、`'t.sys.bonded_help.meiling'`（Task 9 的生死之交訊息），以及 Task 20 的 view_models 會讀的 `t.ui.hud.department`（測試課）、`t.ui.hud.company`（測試公司）、`t.ui.hud.night_shift`（夜班）、`t.ui.hud.wind_flag`（風向期）、`t.ui.stats.title`（新人狀態表）、`t.ui.stats.aria`（角色數值）、`t.ui.stat.stamina`／`.mind`／`.skill`／`.boss_favor`／`.favor`／`.money`（體力／精神／專業／主管好感／同事人情／存款）；`t.test.rank` 的文字是「測試職等」。不放沒有被引用的鍵（`t.ui.`、`t.sys.` 開頭的除外，Task 12 會驗）。

- [ ] **Step 1：寫失敗測試 `src/core/new_game.spec.ts`**

```ts
import { describe, expect, test } from 'bun:test';
import { TEST_SEED, testContent } from '../../test/fixtures';
import type { ChoiceType, GameState, PlayerProfile } from '../model';
import { InvariantError } from '../utils/errors';
import { createNewGame } from './new_game';

const PROFILE: PlayerProfile = { name: '測試員', pronoun: 'neutral', resume: 'res.test', look: 'a' };
const CHOICE_TYPES: readonly ChoiceType[] = [
  'endure', 'refuse', 'coordinate', 'shiftBlame', 'please', 'slack', 'evidence', 'escalate', 'playDumb', 'outburst', 'expertise', 'silence',
];
// 預期值逐欄手寫：02 §1.1 的 initial、res.test 覆寫專業 30、阿哲基礎 10 ＋ 履歷 5、06:30 ＝ 390 分、ET 健康照 fixtures
const EXPECTED: GameState = {
  runId: 'run-1', seed: TEST_SEED, rngState: TEST_SEED, player: PROFILE,
  time: { dayIndex: 0, minuteOfDay: 390, chapter: 'prologue', keyDaysPlayed: 0, currentKeyDay: { id: 'kd.test_start', kind: 'scripted' } },
  flow: { kind: 'keyDay', phase: 'wake' },
  stats: {
    stamina: 80, mind: 70, skill: 30, bossFavor: 50, favor: 3, money: 60000, healthDebt: 0, blame: 0, scheming: 10,
    conscience: 70, lifeSatisfaction: 50, network: 12, visibility: 20, goldenHandcuffs: 0, evidence: 0,
  },
  modifiers: [],
  relationships: {
    'chr.azhe': { affinity: 15, lastInteractionDay: null, coordinateWaiverUsedIn: null },
    'chr.meiling': { affinity: 10, lastInteractionDay: null, coordinateWaiverUsedIn: null },
  },
  career: {
    rank: 'Q1', monthlySalary: 58000, probation: 'pending', certificationScore: null, kpiSamples: [], reviews: [], bonusMultiplier: 1,
    overtimeHoursThisMonth: 0, overtimeHoursDeclaredThisMonth: 0, bossFavorFromOvertimeToday: 0, onCallThisWeek: false, onCallCallsThisMonth: 0,
  },
  economy: { housing: 'dorm', housingSinceDay: 0, commute: 'shuttle', filialAmount: 10000, monthLedger: [], payslips: [], totalIncome: 0 },
  flags: { 'flag.test_onboarded': true },
  counters: { 'cnt.wip_pressure': 40 },
  machines: { 'mc.test01': { health: 45 }, 'mc.test02': { health: 80 }, 'mc.test03': { health: 10 } },
  tasks: [],
  events: { seen: {}, cooldowns: {}, queue: [], deferred: [], pendingKeyDays: [], nonScriptedKeyDaysByMonth: {}, interruptsByMonth: {}, today: { dialogue: 0, crisis: 0 }, locationsVisited: [] },
  seeds: [], blackBook: [],
  choiceTally: Object.fromEntries(CHOICE_TYPES.map((type) => [type, 0])) as Record<ChoiceType, number>,
  policy: null, phone: { messages: [] }, location: null,
  runStats: { overtimeHours: 0, wokenUpCount: 0, onTimeLeaves: 0 },
  interaction: null, endingResult: null,
};
const INVALID_SEEDS = [-1, 1.5, 4294967296];

describe('createNewGame', () => {
  test('builds the complete opening state from stat rules, resume, characters, machines and balance', () => {
    expect(createNewGame(PROFILE, testContent, TEST_SEED)).toEqual(EXPECTED);
  });
  test('the opening state survives a JSON round trip unchanged', () => {
    const state = createNewGame(PROFILE, testContent, TEST_SEED);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
  test.each(INVALID_SEEDS)('rejects the seed %p', (seed) => {
    expect(() => createNewGame(PROFILE, testContent, seed)).toThrow(InvariantError);
  });
  test('rejects an unknown resume with its id in the message', () => {
    expect(() => createNewGame({ ...PROFILE, resume: 'res.nope' }, testContent, TEST_SEED)).toThrow('Unknown resume: resume=res.nope');
  });
});
```
（`as Record<ChoiceType, number>` 是 `Object.fromEntries` 回傳型別的必要轉換；若 biome 不接受就改成逐鍵列出 12 個 0。）

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/new_game.spec.ts`
Expected：FAIL，`Cannot find module '../../test/fixtures'`。

- [ ] **Step 3：建立 `test/fixtures.ts`（內容見上）**

- [ ] **Step 4：再跑一次，確認是「函式不存在」的失敗**

Run：同 Step 2。Expected：FAIL，`Cannot find module './new_game'`。

- [ ] **Step 5：實作 `createNewGame(profile, content, seed): GameState`（`src/core/new_game.ts`，規則見上）**

- [ ] **Step 6：確認測試通過**

Run：`bun test src/core/new_game.spec.ts`。Expected：PASS。

- [ ] **Step 7：verify 並 commit**

```bash
bun run verify && git add test/fixtures.ts src/core/new_game.ts src/core/new_game.spec.ts && git commit -m "feat(core): build the opening game state from content" -m "Unit tests share a small independent content bundle so tuning the real content never breaks them (spec 01 section 13.2)."
```

---
## Task 7：`core/selectors`

**Files:**
- Create: `src/core/selectors.ts`
- Test: `src/core/selectors.spec.ts`

**Interfaces:**
- Consumes：`isoToDayIndex`、`weekdayOf`、`dayIndexToIso`（Task 3）；`round1`；`InvariantError`；fixtures。
- Produces（D90；02 §1.4、01 §9.2）：
  ```ts
  export function maxStamina(state: DeepReadonly<GameState>, content: ContentBundle): number;
  // = stamina.base − ⌊healthDebt ÷ stamina.healthDebtDivisor⌋ + min(stamina.exerciseCap, max(0, cnt.sys_exercise_bonus)) − (policy?.work === 'grind' ? stamina.grindPenalty : 0)
  export function mindRecoveryMultiplier(state: DeepReadonly<GameState>, content: ContentBundle): number; // lifeSatisfaction ≥ highAtOrAbove → highMultiplier；≤ lowAtOrBelow → lowMultiplier；否則 1
  export function linAffinity(bossFavor: number): number;            // bossFavor × 2 − 100
  export function affinityTier(affinity: number): AffinityTier;      // ≤−40 hostile；<0 cold；<40 neutral；<80 trusted；否則 bonded
  export function machineStatus(health: number, rules: BalanceRules['machines']): MachineStatus; // ≥ yellowBelow run；≥ redBelow warn；否則 down
  export function ownedMachineHealthAvg(state: DeepReadonly<GameState>, content: ContentBundle): number; // ownedByPlayer 機台健康平均；沒有負責機台 → InvariantError
  export function timeOfDay(minuteOfDay: number): TimeOfDay;         // 330～419 dawn；420～1049 day；1050～1139 dusk；其他 night
  export function yieldIndex(state: DeepReadonly<GameState>, content: ContentBundle, scene: SceneId): number | null; // 只有 scn.office：round1(90 + ownedMachineHealthAvg ÷ 10)
  export function isWindPeriod(state: DeepReadonly<GameState>, content: ContentBundle): boolean;   // D78
  export function onCallTonight(state: DeepReadonly<GameState>, content: ContentBundle): boolean;  // D79
  export function presentationMood(state: DeepReadonly<GameState>, content: ContentBundle): PresentationMood;
  // flag.sys_stop_sequence_active → calm；mind ≤ safety.warningMindAtOrBelow → warning；mind ≤ safety.lowMindAtOrBelow → low；否則 normal
  ```
  章節順序（`onCallTonight` 的「≥ ch3」）是模組常數 `['prologue', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'finale']`。`reviewWind` 不在 Stage 1（要 NPC 考績模擬，Stage 4）。

- [ ] **Step 1：寫失敗測試**

`src/core/selectors.spec.ts`：測試內用小工具 `stateWith(mutate: (s: GameState) => void): GameState`（`buildTestState()` 後呼叫 `mutate`）。
```ts
// 02 T01～T03（fixtures 的 stamina 規則：base 100、divisor 2、cap 10、grind 10）
describe('maxStamina', () => {
  test.each([
    { healthDebt: 0, exercise: 0, work: 'steady', expected: 100 },
    { healthDebt: 37, exercise: 0, work: 'steady', expected: 82 },   // 100 − ⌊18.5⌋
    { healthDebt: 85, exercise: 12, work: 'grind', expected: 58 },   // 100 − 42 + 10 − 10
    { healthDebt: 0, exercise: -3, work: 'steady', expected: 100 },  // 負的運動加成不扣
  ] as const)('healthDebt $healthDebt, exercise $exercise, policy $work → $expected', ({ healthDebt, exercise, work, expected }) => {
    const state = stateWith((s) => {
      s.stats.healthDebt = healthDebt;
      s.counters['cnt.sys_exercise_bonus'] = exercise;
      s.policy = { work, life: 'rest' };
    });
    expect(maxStamina(state, testContent)).toBe(expected);
  });
});
```
其餘 `describe`（每個都用 `test.each` 表格、`toBe` 或 `toEqual`）：
- `mindRecoveryMultiplier`：lifeSatisfaction `[59, 1]`、`[60, 1.3]`、`[25, 0.7]`、`[26, 1]`（02 T04）。
- `linAffinity` 與 `affinityTier`：bossFavor `[30, -40, 'hostile']`、`[50, 0, 'neutral']`、`[70, 40, 'trusted']`、`[90, 80, 'bonded']`（02 T09）；`affinityTier` 邊界 `[-40, 'hostile']`、`[-39.5, 'cold']`、`[-0.5, 'cold']`、`[0, 'neutral']`、`[39.9, 'neutral']`、`[40, 'trusted']`、`[79.9, 'trusted']`、`[80, 'bonded']`。
- `machineStatus`（rules `{ …, yellowBelow: 40, redBelow: 20 }` 取自 `testContent.balance.machines`）：`[19, 'down']`、`[19.99, 'down']`、`[20, 'warn']`、`[39, 'warn']`、`[39.99, 'warn']`、`[40, 'run']`（01 §15 的 19／20／39／40 邊界，加上快轉衰減會產生的小數）。
- `timeOfDay`：`[0, 'night']`、`[329, 'night']`、`[330, 'dawn']`、`[419, 'dawn']`、`[420, 'day']`、`[1049, 'day']`、`[1050, 'dusk']`、`[1139, 'dusk']`、`[1140, 'night']`、`[1439, 'night']`。
- `ownedMachineHealthAvg` 與 `yieldIndex`：fixtures 負責機台 45、80（`mc.test03` 不算）→ `ownedMachineHealthAvg` 62.5；`yieldIndex(…, 'scn.office')` 96.3（90 ＋ 6.25 → round1）；`yieldIndex(…, 'scn.fab_bay')` null。一個 `toEqual([62.5, 96.3, null])`。
- `isWindPeriod`（D78；fixtures 的考績日 2028-01-12 ＝ 317，風向期 42 天）：`career.probation = 'passed'` 時 dayIndex `[274, false]`、`[275, true]`、`[316, true]`、`[317, false]`；`career.probation = 'pending'`、dayIndex 300 → false。
- `onCallTonight`（D79、02 T30；fixtures 的 `onCall.rotationSaturday` 3）：`{ chapter: 'ch3', day: 170 } → true`（2027-08-18，8/21 是第 3 個星期六，8/16～8/22）、`{ 'ch3', 175 } → false`（8/23）、`{ 'ch1', 44 } → false`（4/14，第一章）；另一案：`contentWith({ keyDays: { …testContent.keyDays, 'kd.test_start': { …defined(testContent.keyDays['kd.test_start'], 'kd'), onCall: true } } })`，`time.currentKeyDay = { id: 'kd.test_start', kind: 'scripted' }`、chapter `prologue` → true。
- `presentationMood`：`[{ mind: 70, stop: true }, 'calm']`、`[{ mind: 15, stop: false }, 'warning']`、`[{ mind: 15.5, stop: false }, 'low']`、`[{ mind: 35, stop: false }, 'low']`、`[{ mind: 35.5, stop: false }, 'normal']`（stop ＝ `flag.sys_stop_sequence_active` 的值）。

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/selectors.spec.ts`
Expected：FAIL，`Cannot find module './selectors'`。

- [ ] **Step 3：實作（公式見 Interfaces）**

`isWindPeriod`：在 `content.keyDays` 中找 `variant === 'review'`、`date !== null`、`isoToDayIndex(date) > today` 的最早一天；`onCallTonight` 的輪值週：取今天所在月 1 號的 dayIndex，往後找第一個 `weekdayOf === 5`（星期六）再 ＋7 × (`rotationSaturday` − 1)，得到 S；今天 ∈ [S − 5, S + 1] 即輪值週。

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/selectors.ts src/core/selectors.spec.ts && git commit -m "feat(core): add derived-value selectors shared by rules, ui and render" -m "One formula per derived value keeps the HUD, the scene snapshot and the rule evaluator in agreement (spec 01 section 4.2)."
```

---

## Task 8：`core/conditions`（`evaluateCondition`、`evaluateNumber`）

**Files:**
- Create: `src/core/conditions.ts`
- Test: `src/core/conditions.spec.ts`

**Interfaces:**
- Consumes：selectors（`linAffinity`、`affinityTier`、`isWindPeriod`、`onCallTonight`、`ownedMachineHealthAvg`）；`isoToDayIndex`、`clockToMinutes`、`weekdayOf`；`InvariantError`。
- Produces：01 §5.3.1 的 `EvalContext`、`evaluateCondition(condition, ctx): boolean`、`evaluateNumber(expr, ctx): number` 原文簽名。語意照 01 §5.3.2 表與 §5.3.4，另外釘住：`affinity`／`affinityOf` 對 `isDirectBoss` 角色讀 `linAffinity(stats.bossFavor)`，對其他角色讀 `relationships[id].affinity`，角色不在 `content.characters` 或沒有關係紀錄 → `InvariantError('Unknown character: character=<id>')`；`rank` 依 Q1 < … < Q5、`cmp` 比的是「目前職等 cmp 條件職等」；`lastReview` 取 `career.reviews` 中該 `kind` 的最後一筆；`choiceMade` ＝ `events.seen[event]?.lastChoice === choice`；`machine`／`machineHealth` 的機台不在 `state.machines` → `InvariantError('Unknown machine: machine=<id>')`；`location` ＝ `state.location === id`；`windPeriod`、`onCallTonight` ＝ selector 結果 `=== value`；`eq`／`neq` 用 `Math.abs(a − b) < 1e-9`；`min`／`max` 空陣列 → `InvariantError('Empty min/max expression')`。

- [ ] **Step 1：寫失敗測試**

`src/core/conditions.spec.ts`：先放 01 §13.4「範例一」程式區塊原文（門檻參數化、空 all／any、雙重否定三個測試），再加：
```ts
const ROOKIE_FLAG = 'flag.test_switch';
// 02 T29：25% ＋（100 − 負責機台平均）× 0.3% ＋ 菜鳥 10%；平均 60 非菜鳥 → 0.37；平均 20 菜鳥 → 0.59
const RING_CHANCE: NumExpr = {
  clamp: { sum: [0.25, { product: [{ sum: [100, { product: [-1, { ownedMachineHealthAvg: true }] }] }, 0.003] }, { if: { flag: ROOKIE_FLAG }, then: 0.1, else: 0 }] },
  lo: 0, hi: 1,
};
describe('evaluateNumber', () => {
  test.each([
    { health: [60, 60], rookie: false, expected: 0.37 },
    { health: [20, 20], rookie: true, expected: 0.59 },
  ])('the GDD 8.12 ring chance with owned health $health and rookie $rookie is $expected', ({ health, rookie, expected }) => {
    const state = buildTestState({ flags: { [ROOKIE_FLAG]: rookie } });
    state.machines['mc.test01'] = { health: health[0] ?? 0 };
    state.machines['mc.test02'] = { health: health[1] ?? 0 };
    expect(evaluateNumber(RING_CHANCE, ctxOf(state))).toBeCloseTo(expected, 10);
  });
  test('empty sum is 0 and empty product is 1', () => {
    const ctx = ctxOf(buildTestState());
    expect([evaluateNumber({ sum: [] }, ctx), evaluateNumber({ product: [] }, ctx)]).toEqual([0, 1]);
  });
  test.each([{ min: [] }, { max: [] }] as const)('an empty %p fails fast', (expr) => {
    expect(() => evaluateNumber(expr, ctxOf(buildTestState()))).toThrow(InvariantError);
  });
});
```
再加一個 `describe('evaluateCondition node semantics')`，用 `test.each` 表格（每列：名稱、對 `buildTestState()` 做的修改、條件、預期布林），至少包含下列列（每一列都會因為一個實際的實作錯誤而失敗）：
- `affinity` 對直屬主管：bossFavor 30 → `{ affinity: 'chr.lin', cmp: 'lte', value: -40 }` true；bossFavor 31 → false。
- `affinityTier`：阿哲 affinity 40 → `{ affinityTier: 'chr.azhe', atLeast: 'trusted' }` true；39 → false。
- `flag` 沒設過 → `{ flag: 'flag.test_switch' }` false、`{ flag: 'flag.test_switch', is: false }` true。
- `counter` 沒設過 → `{ counter: 'cnt.test_tally', cmp: 'eq', value: 0 }` true。
- `dateBetween` `{ from: '2027-03-01', to: '2027-03-01' }`：dayIndex 0 true、1 false。
- `timeBetween` 跨午夜 `{ from: '22:00', to: '06:00' }`：minuteOfDay 1380 true、359 true、360 true、361 false、1319 false。
- `weekdayIn [6]`：dayIndex 104 true、105 false。
- `chapterIn ['ch3']`：chapter 'ch3' true、'prologue' false。
- `resume 'res.test'` true；`pronoun 'she'` false（fixtures 是 neutral）。
- `rank { rank: 'Q2', cmp: 'lt' }`：目前 Q1 → true；`{ rank: 'Q1', cmp: 'gt' }` → false。
- `lastReview { lastReview: 'annual', gradeIn: ['M', 'M-'] }`：沒有紀錄 false；`career.reviews` 推一筆 `kind 'annual'`、`grade 'M'` 的 `ReviewRecord` → true。
- `probation 'pending'` true。
- `eventSeen 'ev.test_scripted'`：沒看過 false；`events.seen['ev.test_scripted'] = { count: 1, lastDay: 0, lastChoice: 'c_yes' }` → true，同時 `choiceMade { event: 'ev.test_scripted', choice: 'c_yes' }` true、`choice: 'c_no'` false。
- `machine { machine: 'mc.test01', cmp: 'lt', value: 50 }` true（45）。
- `location 'loc.test_bay'`：`state.location = null` false、`'loc.test_bay'` true。
- `windPeriod true`：`career.probation = 'passed'`、dayIndex 300 → true。
- `expr { expr: { sum: [0.1, 0.2] }, cmp: 'eq', value: 0.3 }` true（浮點容差）。
另外：`'an unknown character fails fast'`：`{ affinity: 'chr.nobody', cmp: 'gt', value: 0 }` 丟 `InvariantError`。

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/conditions.spec.ts`
Expected：FAIL，`Cannot find module './conditions'`。

- [ ] **Step 3：實作 `evaluateCondition`、`evaluateNumber`（`src/core/conditions.ts`；語意見 Interfaces）**

兩個函式各用一個 `switch`（以判別鍵區分 union 成員，例如 `'all' in condition`）；求值純函式、不消耗 RNG、不改狀態。

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS（含 01 範例一）。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/conditions.ts src/core/conditions.spec.ts && git commit -m "feat(core): evaluate serializable conditions and number expressions" -m "Content must stay data so it can be validated at load time; the evaluator is the only place with behaviour (spec 01 section 5.3)."
```

---

## Task 9：`core/effects`（`applyEffects`，D71 範圍）

**Files:**
- Create: `src/core/effects.ts`
- Test: `src/core/effects.spec.ts`

**Interfaces:**
- Consumes：`evaluateCondition`、`evaluateNumber`、`EvalContext`（Task 8）；`maxStamina`、`mindRecoveryMultiplier`、`isWindPeriod`、`affinityTier`（Task 7）；`createRng`、`Rng`（Task 5）；`clamp`；`InvariantError`。
- Produces：01 §5.3.1 的 `EffectContext`、`EffectResult`、`applyEffects(draft, effects, ctx): EffectResult` 原文簽名。

**套用規則**（01 §5.3.3、02 §1.3，加上 D71～D77）：
- 依陣列順序；`when`、`chance` 深度優先展開；`chance`：`p = clamp(evaluateNumber(p), 0, 1)`，**一定**呼叫一次 `rng.next()`，`< p` 走 `then`，否則走 `else`。
- `stat`：(1) `delta = evaluateNumber(effect.delta)`；(2) 所有 `kind 'statGain'`、`stat` 相同、生效中（D75）的修正器相乘：正值乘 `positiveMultiplier`、負值乘 `negativeMultiplier`；(2b) `mind` 且 delta >0 → × `mindRecoveryMultiplier`；(2c) `skill` 且 delta <0 → 0；(2d) `blame` 且 delta ≥8：在 `BONDED_HELPERS = ['chr.azhe', 'chr.xiaoqing', 'chr.haoge', 'chr.meiling', 'chr.vivian']` 中找 `affinityTier(affinity) === 'bonded'`、而且 `flag.sys_bonded_help_<slug>` 沒設的角色（只看 state 裡有關係紀錄的），取好感最高者（平手依陣列順序）→ delta ＝ 0、設該旗標、推一則手機訊息（D77）；(3) `bossFavor` 且 `isWindPeriod` → × `review.windBossFavorMultiplier`；(4) 夾限：`min`／`max`（`'maxStamina'` 用 `maxStamina(draft, content)`；`null` 不限）；正 delta 的結果不低於原值、負 delta 的結果不高於原值（D72）；(5) 原始結果超過上限、且 `overflowTo` 不為 null → 超出量 × `perUnit` 套到目標數值（只走夾限、取整、記錄，不走修正器與倍率）；(6) `integer: true` → `Math.round`；(7) 實際變化 ≠0 才記入 `deltas`（每次套用一筆，不合併；溢出另記一筆）。
- `setStat`（D73）：`value = evaluateNumber`，夾限與取整後寫入，記錄實際變化。
- `affinity`：對 `isDirectBoss` 角色 → `InvariantError('Affinity effect on direct boss: character=<id>')`；沒有關係紀錄 → `InvariantError('Unknown character: character=<id>')`；夾限 −100～100；`lastInteractionDay = time.dayIndex`；不記入 `deltas`。
- `flag`：寫入。`counter`：加上 delta，`cnt.wip_pressure` 夾限 0～100、`cnt.sys_exercise_bonus` 夾限 0～10（D74）。`machine`：健康加 `healthDelta` 夾限 0～100，機台不存在 → `InvariantError('Unknown machine: machine=<id>')`。
- `modifier`（D75）：移除同 ID 的現有修正器，推入 `{ ...modifier, appliedDay: dayIndex, expiresDay }`。
- `economy`（D76）：`commute`、`filialAmount` 有給就寫入；`housing` 有給且與目前不同 → 收房租、記帳、`housingSinceDay`。
- `phone`：推入 `{ ...message, thread, dayIndex, minuteOfDay, read: false }`，並在 `domainEvents` 推 `{ type: 'phoneMessage', message: <同一筆> }`。
- `plantSeed`、`cancelSeed`、`blackBook`、`queueEvent`、`ending`、`addTask`、`advanceTime` → `InvariantError`（訊息見 D71）。
- `applyEffects` 只產生 `phoneMessage` 領域事件；`statsChanged` 由 Stage 2 的 `step()` 依 `deltas` 發出。

- [ ] **Step 1：寫失敗測試**

`src/core/effects.spec.ts`：共用 `run(state, effects, seed = TEST_SEED)` 回傳 `{ result, state, rngState }`（建立 `createRng(seed)`、`sourceEvent: null`、呼叫 `applyEffects`）。測試表（每個都斷言整個結構）：
```ts
describe('applyEffects stat pipeline', () => {
  // 02 T05：生活滿足 70 → 精神回復 ×1.3，只放大正值
  test('mind recovery multiplier scales gains but not losses', () => {
    const state = buildTestState({ stats: { lifeSatisfaction: 70, mind: 50 } });
    const gain = run(state, [{ op: 'stat', stat: 'mind', delta: 10 }]).result.deltas;
    const loss = run(state, [{ op: 'stat', stat: 'mind', delta: -10 }]).result.deltas;
    expect([gain, loss]).toEqual([[{ stat: 'mind', delta: 13 }], [{ stat: 'mind', delta: -10 }]]);
  });
  // 02 T06：風向期 bossFavor 正負都 ×1.5
  test('wind period multiplies boss favor gains and losses by 1.5', () => { /* probation 'passed'、dayIndex 300；+8 → +12、−12 → −18 */ });
  // 02 T07：人情 5 再 +1 → 人情不變、人脈網 +3，0 變化不記錄
  test('favor overflow converts to network and records only the real change', () => { /* deltas 等於 [{ stat: 'network', delta: 3 }]，stats.favor 5、network 15 */ });
  // 02 T08
  test('negative skill deltas are ignored', () => { /* skill −5 → deltas []、skill 不變 */ });
  test('stamina is capped by maxStamina', () => { /* healthDebt 37（上限 82）、stamina 80、+10 → stamina 82、deltas [{ stamina, 2 }] */ });
  // Review Focus 1（D72）
  test('a stamina gain never lowers stamina that already sits above a reduced maximum', () => {
    /* healthDebt 20（上限 90）、stamina 95、+10 → stamina 95、deltas [] */
  });
  test('statGain modifiers multiply, and expired ones are ignored', () => {
    /* modifiers：A { kind 'statGain', stat 'bossFavor', positiveMultiplier 0.7, negativeMultiplier 1, appliedDay 0, expiresDay 10 }、
       B 同 stat 0.5／1、expiresDay null、C 同 stat 0.1／1 但 expiresDay −1（已過期）；dayIndex 0、非風向期
       bossFavor +10 → +3.5（0.7 × 0.5），−10 → −10 */
  });
  test('integer stats round after clamping', () => { /* favor 3 +0.6 → 4（delta +1）；money 60000 +0.4 → 不變（deltas []） */ });
  test('setStat clamps without modifiers or overflow', () => { /* 有 0.5 的 bossFavor 修正器、風向期；setStat bossFavor 70 → 70（delta +20）；setStat favor 9 → 5、network 不變 */ });
});

describe('applyEffects chance', () => {
  // 01 §5.3.3-4：每個 chance 一定剛好消耗一次 RNG
  test.each([0, 0.5, 1, 1.5])('a chance with p=%p advances the rng by exactly one step', (p) => {
    const { rngState } = run(buildTestState(), [{ op: 'chance', p, then: [{ op: 'flag', flag: 'flag.test_switch', value: true }] }], 1);
    expect(rngState).toBe(1831565814); // state 1 抽一次後的值（Task 5）
  });
  test('the branch follows the first draw: 0.627 is below 0.7 but not below 0.6', () => {
    /* seed 1：p 0.7 → then 生效（flag true）；p 0.6 → else 生效（else 裡把 cnt.test_tally +1） */
  });
});

describe('applyEffects bonded blame shield (02 section 8.4, T62)', () => {
  test('a bonded coworker absorbs the first big blame once and leaves a phone message', () => {
    /* 美玲姐 affinity 85（bonded）、阿哲 85 也 bonded；預期由阿哲擋（同好感依陣列順序）：
       第一次 blame +8 → deltas []、flag.sys_bonded_help_azhe true、phone.messages 1 筆
       { from: 'chr.azhe', text: 't.sys.bonded_help.azhe', kind: 'chat', thread: 'thread.etch_group', dayIndex: 0, minuteOfDay: 390, read: false }、
       domainEvents [{ type: 'phoneMessage', message: <同一筆> }]；
       第二次 blame +8 → 美玲姐擋（flag.sys_bonded_help_meiling true）；第三次 → deltas [{ blame, 8 }] */
  });
  test('blame below 8 is never shielded', () => { /* blame +7 → deltas [{ blame, 7 }] */ });
});

describe('applyEffects other ops', () => {
  // 一個 test 一列，各自斷言下列確切結果：
  // affinity：阿哲 15 +90 → 100、lastInteractionDay 0；對 chr.lin → InvariantError
  // counter：cnt.wip_pressure 95 +10 → 100；cnt.sys_exercise_bonus 9 +2 → 10；cnt.test_tally 不夾限（−3 → −3）
  // machine：mc.test01 45 +70 → 100、−200 → 0；mc.nope → InvariantError
  // modifier：同 ID 第二次套用取代第一次（modifiers 長度 1、appliedDay 是第二次的 dayIndex）；durationDays 3 在 dayIndex 5 → expiresDay 8；null → null
  // economy：dorm → sharedRoom：money −8500（deltas [{ money, −8500 }]）、monthLedger [{ dayIndex: 0, kind: 'rent', amount: −8500 }]、housingSinceDay 0；
  //          再套一次 sharedRoom → 不收房租；filialAmount 20000、commute 'scooter' 直接寫入
  // when：條件成立走 then、不成立走 else、沒有 else 時不做事
});

describe('applyEffects stage 2 ops', () => {
  test.each([
    { op: 'plantSeed', seed: 'seed.test_followup' },
    { op: 'cancelSeed', seed: 'seed.test_followup' },
    { op: 'blackBook', entry: { text: 't.test.ending', weight: 1, polarity: 'negative' } },
    { op: 'queueEvent', event: 'ev.test_micro', when: 'afterCurrent' },
    { op: 'ending', ending: 'end.e99_test' },
    { op: 'addTask', task: 'task.test_spc', when: 'today' },
    { op: 'advanceTime', minutes: 10 },
  ] as const)('%p fails fast until its Stage 2 module exists', (effect) => {
    expect(() => run(buildTestState(), [effect])).toThrow(`Effect op not implemented until Stage 2: op=${effect.op} source=none`);
  });
});
```
（`/* … */` 內是該測試必須斷言的確切值；把它們寫成 `expect({...}).toEqual({...})`。）

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/effects.spec.ts`
Expected：FAIL，`Cannot find module './effects'`。

- [ ] **Step 3：實作 `applyEffects(draft, effects, ctx): EffectResult`（`src/core/effects.ts`；規則見上）**

`EvalContext` 用 `{ state: draft, content: ctx.content }`（draft 也是合法的 `DeepReadonly` 讀取來源）。

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/effects.ts src/core/effects.spec.ts && git commit -m "feat(core): apply content effects through the stat pipeline" -m "Clamping, overflow, modifiers, mind recovery, wind period and the bonded blame shield live in one evaluator; seed, black book and queue ops wait for their Stage 2 modules and fail fast meanwhile."
```

---

## Task 10：`core/stats`（`scaleEffects`）

**Files:**
- Create: `src/core/stats.ts`
- Test: `src/core/stats.spec.ts`

**Interfaces:**
- Consumes：model 的 `Effect`、`NumExpr`。
- Produces：02 §1.3 的 `ScaleOptions` 與 `scaleEffects(effects: readonly Effect[], factor: number, options: ScaleOptions): Effect[]` 原文簽名。規則：`positiveOnly: false`（快轉比例，02 §5.4 表）——`stat`／`affinity`／`counter` 的常數 delta × factor；`stat` 的運算式 delta 包成 `{ product: [delta, factor] }`；`chance` 的常數 `p` → `Math.min(1, p × factor)`、運算式 `p` → `{ min: [{ product: [p, factor] }, 1] }`，內層效果不縮放；`when` 的 `then`／`else` 遞迴當作最上層處理；其他 op 原樣回傳（D82）。`positiveOnly: true`（生活行動減半，02 §1.3）——只把最上層 `stat`、`affinity` 的**正值常數** delta × factor，其餘全部原樣。回傳新陣列，不改輸入。

- [ ] **Step 1：寫失敗測試**

```ts
describe('scaleEffects', () => {
  // 02 T10：「穩」月效果 × 0.25
  test('week fraction scales every top-level constant delta', () => {
    const steady: readonly Effect[] = [
      { op: 'stat', stat: 'skill', delta: 2 }, { op: 'stat', stat: 'bossFavor', delta: 1 },
      { op: 'stat', stat: 'mind', delta: -3 }, { op: 'stat', stat: 'healthDebt', delta: 2 },
    ];
    expect(scaleEffects(steady, 0.25, { positiveOnly: false })).toEqual([
      { op: 'stat', stat: 'skill', delta: 0.5 }, { op: 'stat', stat: 'bossFavor', delta: 0.25 },
      { op: 'stat', stat: 'mind', delta: -0.75 }, { op: 'stat', stat: 'healthDebt', delta: 0.5 },
    ]);
  });
  // 02 T11：chance 的機率縮放、內層 +1 不縮放
  test('chance probability scales but its inner effects do not', () => { /* chance 0.5 → favor +1，×0.25 → chance 0.125 → favor +1 */ });
  test('chance probability never exceeds 1', () => { /* chance 0.8 ×2 → 1；運算式 p → { min: [{ product: [p, 2] }, 1] } */ });
  test('expression deltas are wrapped in a product', () => { /* { stat: 'mind' } delta ×0.5 → { product: [{ stat: 'mind' }, 0.5] } */ });
  test('when branches are scaled as if they were top level', () => { /* when → then [stat +4]、else [counter +2]，×0.5 → +2、+1 */ });
  test('ops outside the scaling table pass through unchanged', () => { /* flag、phone、modifier 原樣 */ });
  // 02 T12：生活行動減半只縮正值
  test('positiveOnly halves only positive top-level stat and affinity constants', () => {
    /* [mind +6, stamina −5, affinity chr.azhe +4, counter +2, chance 0.5 → mind +6]，×0.5 positiveOnly →
       [mind +3, stamina −5, affinity +2, counter +2, chance 0.5 → mind +6] */
  });
  test('does not mutate its input', () => { /* 輸入陣列 deep equal 呼叫前的 structuredClone */ });
});
```

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/stats.spec.ts`。Expected：FAIL，`Cannot find module './stats'`。

- [ ] **Step 3：實作 `scaleEffects`（`src/core/stats.ts`）**

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/stats.ts src/core/stats.spec.ts && git commit -m "feat(core): scale effect lists for fast-forward fractions and halved life actions" -m "Only top-level constants scale so nested chances keep their designed payoffs (spec 02 section 5.4)."
```

---

## Task 11：`core/text`（`resolveText`）

**Files:**
- Create: `src/core/text.ts`
- Test: `src/core/text.spec.ts`

**Interfaces:**
- Consumes：`evaluateCondition`、`EvalContext`；`formatMonthDay`；`InvariantError`。
- Produces：
  ```ts
  export interface TextVars { date?: number; grade?: Grade }
  export function resolveText(ref: TextRef, ctx: EvalContext, vars?: TextVars): string;
  ```
  規則（01 §8.4）：`TextRef` 是 `{ variants, fallback }` 時取第一個 `when` 成立的 `text`，都不成立用 `fallback`；`content.text[id]` 不存在 → `InvariantError('Unknown text: text=<id>')`；佔位符以 `/\{([a-z]+)\}/g` **一次替換完成**（取代後的字串不再掃描）：`{name}` → `player.name`；`{pronoun}` → `he` 他、`she` 她、`neutral` TA；`{date}` → `formatMonthDay(vars.date)`；`{grade}` → `vars.grade`；需要的 var 沒給 → `InvariantError('Missing text variable: text=<id> variable=<name>')`；其他名稱 → `InvariantError('Unknown placeholder: text=<id> placeholder={<name>}')`。

- [ ] **Step 1：寫失敗測試**

測試內用 `contentWith({ text: { ...testContent.text, 't.test.greet': '{name}你好', 't.test.pron': '{pronoun}來了', 't.test.date': '{date} 值班夜先走', 't.test.grade': '等第 {grade}', 't.test.bad': '{nmae}' } })`。`describe('resolveText')` 的 `test.each`：
- `'t.test.greet'`、姓名 `'小明'` → `'小明你好'`。
- `'t.test.pron'`：`he` → `'他來了'`、`she` → `'她來了'`、`neutral` → `'TA來了'`。
- `'t.test.date'`、`vars { date: 104 }` → `'6/13 值班夜先走'`。
- `'t.test.grade'`、`vars { grade: 'M+' }` → `'等第 M+'`。
- variants：`{ variants: [{ when: { pronoun: 'she' }, text: 't.test.pron' }], fallback: 't.test.greet' }`：she → `'她來了'`；neutral → fallback `'小明你好'`。
- **Review Focus 3**：姓名 `'{date}{name}'`、`'t.test.greet'` → `'{date}{name}你好'`（不二次代換、不丟例外）。
錯誤：`'t.test.missing'` 丟 `'Unknown text: text=t.test.missing'`；`'t.test.date'` 沒給 vars 丟 `'Missing text variable: text=t.test.date variable=date'`；`'t.test.bad'` 丟 `'Unknown placeholder: text=t.test.bad placeholder={nmae}'`。

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/text.spec.ts`。Expected：FAIL，`Cannot find module './text'`。

- [ ] **Step 3：實作 `resolveText`（`src/core/text.ts`；用 `String.prototype.replace` 的回呼一次替換）**

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/text.ts src/core/text.spec.ts && git commit -m "feat(core): resolve text references with variants and placeholders" -m "Placeholders are replaced in a single pass so a player name containing braces is shown literally."
```

---

## Task 12：`core/content_validator`（D81 範圍）

**Files:**
- Create: `src/core/content_validator.ts`
- Test: `src/core/content_validator.spec.ts`

**Interfaces:**
- Consumes：model 的 `ContentBundle`、`ContentIssue`、`EventNode`。
- Produces：01 §8.6 的 `validateContent(content: ContentBundle): ContentIssue[]` 原文簽名；問題依「走訪順序」輸出（物件鍵的插入順序），所以同一份內容永遠得到同一份清單。

**Stage 1 的五類規則**（全部 `severity: 'error'`）：
1. **ID**：01 §8.3 的 regex，套用在 `ContentBundle` 每個以 ID 為鍵的 Record 的鍵（`keyDays`、`characters`、`resumes`、`events`、`endings`、`lifeActions`、`locations`、`machines`、`tasks`、`flags`、`counters`、`text`）、`events[*].seeds[*].id`、所有 `modifier` 效果的 `modifier.id`、事件的節點鍵（`^n_[a-z0-9_]+$`）與選項 ID（`^c_[a-z0-9_]+$`）。regex：`ev` `^ev\.[a-z0-9]+(_[a-z0-9]+)*$`、`end` `^end\.e[0-9]{2}[a-z]*_[a-z0-9_]+$`、`t` `^t\.[a-z0-9_]+(\.[a-z0-9_]+)+$`，其他前綴（`chr`、`flag`、`cnt`、`seed`、`loc`、`scn`、`hs`、`mc`、`task`、`kd`、`act`、`res`、`mod`、`thread`）一律 `^<前綴>\.[a-z0-9_]+$`。不符 → `{ id: <該 ID 或所屬定義的鍵>, path: <所在路徑；Record 鍵用 'id'>, message: "invalid id format: '<值>'" }`。另外 Record 值有 `id` 欄位時必須等於鍵：`{ id: <鍵>, path: 'id', message: 'id does not match key: id=<值>' }`。
2. **參照**：從 `ContentBundle` 根部遞迴走訪；**任何字串值或物件鍵**符合 `^(ev|chr|flag|cnt|seed|end|t|loc|hs|mc|task|kd|act|res|mod)\.` 就視為參照，必須存在於：`ev`→`events`、`chr`→`characters`、`flag`→`flags`、`cnt`→`counters`、`seed`→所有事件 `seeds[*].id`、`end`→`endings`、`t`→`text`、`loc`→`locations`、`hs`→所有 `locations[*].hotspots`、`mc`→`machines`、`task`→`tasks`、`kd`→`keyDays`、`act`→`lifeActions`、`res`→`resumes`、`mod`→所有 `modifier` 效果的 ID。**不視為參照**的位置：上面第 1 類列出的「宣告位置」（Record 的鍵、定義自己的 `id`、`seeds[*].id`、`modifier.id`）、`content.text` 的值、`content.counters` 的值、`flags[*].description`、`sourceRefs`。`scn.`、`thread.` 沒有登錄表，不檢查存在。找不到 → `{ id, path, message: "unknown <種類> '<值>'" }`，種類字：event、character、flag、counter、seed、ending、text、location、hotspot、machine、task、key day、life action、resume、modifier。小遊戲預設組：`minigame` 節點的 `{ minigame, preset }`、`TaskDef.action` 的 `minigame`＋`preset`、`chapterDefaults` 的值，必須存在於 `content.minigames[minigame].presets` → `"unknown preset '<minigame>/<preset>'"`。
3. **節點圖**（每個事件）：`start` 存在（否則 path `start`、`"unknown node '<id>'"`）；每個 `next` 類欄位（`line`／`phone`／`result`／`effects` 的 `next`、`choice.choices[i].next`、`choice.countdown.onTimeout.next`、`branch.cases[i].next`、`branch.otherwise`、`roll.outcomes[i].next`、`minigame.next.success`／`partial`／`fail`）不是 null 時必須存在（path 指到那個欄位、`"unknown node '<id>'"`）；`choice` 節點至少 1 個選項（path `nodes.<id>.choices`、`'choice node has no choices'`）；從 `start` 走不到的節點（path `nodes.<id>`、`'node unreachable from start'`）；循環：從 `start` 做 DFS，出邊依上面欄位的列出順序，第一條指回「目前路徑上」節點的邊回報一次（path 指到那個 `next` 欄位、`"node graph cycle back to '<目標>'"`），每個事件最多報一個循環。同一事件內的輸出順序：`start` → 各節點的 `next` 目標（節點宣告順序）→ 空選項 → 不可達（節點宣告順序）→ 循環。
4. **台詞**：每個被參照的 `TextId` 存在（由第 2 類負責）；孤兒文字：`content.text` 中沒有被任何位置參照、而且不是 `t.ui.`、`t.mg.`、`t.sys.` 開頭的鍵 → `{ id: <鍵>, path: 'text', message: 'orphan text: not referenced by any content' }`；佔位符：每段文字中的 `{…}` 只能是 `{name}`、`{pronoun}`、`{date}`、`{grade}` → `{ id: <鍵>, path: 'text', message: "unknown placeholder '{<名稱>}'" }`。
5. **數值方向**：任何位置的 `{ op: 'stat', stat: 'skill', delta: <數字常數 <0> }` → `{ id, path: <到 delta>, message: 'negative skill delta: delta=<n>' }`；`TaskDef.action.kind === 'minigame'` 而 `staminaCost !== 0` → `{ id: <task id>, path: 'staminaCost', message: 'minigame task must not cost stamina: staminaCost=<n>' }`。

**路徑格式**（01 §8.7）：`id` 是問題所在的最上層定義——在以 ID 為鍵的 Record 裡就是那個鍵（例 `'ev.test_scripted'`），在單一物件（`campaign`、`balance`、`economy`、`review`、`minigames`、`stats`、`workPolicies`、`lifePolicies`、`ranks`）裡就是欄位名；`path` 是定義內的路徑，物件鍵用 `.` 連接、陣列用 `[i]`（例 `nodes.n_choice.choices[0].requires.flag`）。

- [ ] **Step 1：寫失敗測試**

`src/core/content_validator.spec.ts`：用 `structuredClone(testContent)` 轉成可變的 `Mutable` 副本（測試內 `type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> }`），再改一處。
```ts
describe('validateContent', () => {
  test('the test fixture content has no issues', () => {
    expect(validateContent(testContent)).toEqual([]);
  });
  test.each([
    {
      name: 'unknown flag in a choice requirement',
      mutate: (c: Mutable<ContentBundle>) => { choiceOf(c, 0).requires = { flag: 'flag.test_switc' }; },
      expected: [{ severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_choice.choices[0].requires.flag', message: "unknown flag 'flag.test_switc'" }],
    },
    {
      name: 'unreachable node',
      mutate: (c) => { eventOf(c).nodes.n_orphan = { kind: 'end' }; },
      expected: [{ severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_orphan', message: 'node unreachable from start' }],
    },
    {
      name: 'cycle',
      mutate: (c) => { resultOf(c).next = 'n_line'; },
      expected: [{ severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_result.next', message: "node graph cycle back to 'n_line'" }],
    },
    {
      name: 'orphan text',
      mutate: (c) => { c.text['t.test.unused'] = '沒有人用'; },
      expected: [{ severity: 'error', id: 't.test.unused', path: 'text', message: 'orphan text: not referenced by any content' }],
    },
    {
      name: 'negative skill effect',
      mutate: (c) => { choiceOf(c, 1).effects = [{ op: 'stat', stat: 'skill', delta: -5 }]; },
      expected: [{ severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_choice.choices[1].effects[0].delta', message: 'negative skill delta: delta=-5' }],
    },
    {
      name: 'unknown node target',
      mutate: (c) => { lineOf(c).next = 'n_missing'; },
      expected: [
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_line.next', message: "unknown node 'n_missing'" },
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_choice', message: 'node unreachable from start' },
        { severity: 'error', id: 'ev.test_scripted', path: 'nodes.n_result', message: 'node unreachable from start' },
      ],
    },
    {
      name: 'unknown preset',
      mutate: (c) => { taskOf(c).action = { kind: 'minigame', minigame: 'mg.spc', preset: 'nope' }; },
      expected: [{ severity: 'error', id: 'task.test_spc', path: 'action.preset', message: "unknown preset 'mg.spc/nope'" }],
    },
    {
      name: 'bad placeholder',
      mutate: (c) => { c.text['t.ev.test_scripted.line'] = '你好 {nmae}'; },
      expected: [{ severity: 'error', id: 't.ev.test_scripted.line', path: 'text', message: "unknown placeholder '{nmae}'" }],
    },
    {
      name: 'key and id disagree',
      mutate: (c) => { taskOf(c).id = 'task.other'; },
      expected: [{ severity: 'error', id: 'task.test_spc', path: 'id', message: 'id does not match key: id=task.other' }],
    },
    {
      name: 'malformed event id in a reference',
      mutate: (c) => { defined(c.keyDays['kd.test_start'], 'kd').events = [{ event: 'ev.Test', checkpoint: 'shiftStart' }]; },
      expected: [{ severity: 'error', id: 'kd.test_start', path: 'events[0].event', message: "unknown event 'ev.Test'" }],
    },
    {
      name: 'minigame task with a stamina cost',
      mutate: (c) => { taskOf(c).staminaCost = 4; },
      expected: [{ severity: 'error', id: 'task.test_spc', path: 'staminaCost', message: 'minigame task must not cost stamina: staminaCost=4' }],
    },
  ])('$name', ({ mutate, expected }) => {
    const content = structuredClone(testContent) as Mutable<ContentBundle>;
    mutate(content);
    expect(validateContent(content)).toEqual(expected);
  });
});
```
（`eventOf`、`choiceOf`、`lineOf`、`resultOf`、`taskOf` 是測試內的小工具，從副本取出 `ev.test_scripted` 的對應節點或 `task.test_spc`，取不到就丟 Error。「unknown node target」的預期也證明「斷掉的邊之後的節點會被報不可達」，順序依規則 3 的輸出順序：先目標不存在、後不可達。若實作的問題順序與此不同但每一筆都正確，要改的是實作的走訪順序（規則 1→2→3→4→5、規則 3 內依上述順序），不是改預期。）

- [ ] **Step 2：確認測試失敗**

Run：`bun test src/core/content_validator.spec.ts`。Expected：FAIL，`Cannot find module './content_validator'`。

- [ ] **Step 3：實作 `validateContent`（`src/core/content_validator.ts`）**

先收集宣告（各登錄表的鍵、所有 seed ID、所有 modifier ID、所有 hotspot），再依規則 1→2→3→4→5 的順序走訪；規則 2 的走訪同時記下「被參照的 TextId」給規則 4 的孤兒檢查用。

- [ ] **Step 4：確認測試通過**

Run：同 Step 2。Expected：PASS（12 個案例）。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/core/content_validator.ts src/core/content_validator.spec.ts && git commit -m "feat(core): validate content ids, references, node graphs and texts" -m "Broken references fail at startup with an id and a field path instead of surfacing deep inside a play session (spec 01 section 8.6)."
```

---
## Task 13：Stage 1 內容切片、`validate-content` CLI、`content_integrity`

**Files:**
- Create: `src/content/index.ts`、`economy.ts`、`balance.ts`、`resumes.ts`、`characters.ts`、`policies.ts`、`world.ts`、`campaign.ts`、`minigames.ts`、`flags.ts`、`src/content/text/ui.ts`、`text/characters.ts`、`text/minigames.ts`、`scripts/validate_content.ts`、`docs/issues.md`
- Modify: `package.json`（`verify` 改回 01 §14.2 原字串、加 `"validate-content": "bun run scripts/validate_content.ts"`）
- Test: `test/content_integrity.test.ts`

**Interfaces:**
- Consumes：model 型別；`validateContent`（Task 12）。
- Produces：
  - `src/content/index.ts`：`export const content: ContentBundle`。
  - `scripts/validate_content.ts`：`export function formatIssueLine(issue: ContentIssue): string`（`` `${severity.padEnd(8)}${id}  ${path}  ${message}` ``，01 §8.7）、`export function formatSummary(issues: readonly ContentIssue[], content: ContentBundle): string`（`` `content validation ${errors > 0 ? 'failed' : 'passed'}: errors=${e} warnings=${w} events=${事件數} texts=${台詞數}` ``）；直接執行時逐行 `console.log` 問題、最後印摘要，有 error 時 `process.exit(1)`。
  - `docs/issues.md`：`# Issues` 標題、一句說明（「`#N` 流水號；建立遠端 issue 追蹤後加一欄對照，不重新編號（01 §2.3、D57）」）、表格 `| # | 標題 | 狀態 | 關聯檔案 |`，第一列 `| #1 | Hold Lot 量測列與留言、半夜電話逐句台詞待撰寫（03 §5.5、§6.4） | open | src/content/minigames.ts |`。

**內容規格**（全部是資料；`satisfies` 型別檢查、不用 `as`；不寫函式、`Math.*`、`undefined`；可以用 `const` 與 spread 重複使用資料，01 §8.2）：

| 檔案 | 匯出 | 來源與編碼 |
|---|---|---|
| `economy.ts` | `stats`、`ranks`、`economy`、`review` | `stats`：02 §1.1 表（同 fixtures）。`ranks`：02 §7.1（`title` 用 `t.rank.q1`～`t.rank.q5`）。`economy`：02 §14.2 逐欄；`declaredOvertimePenalty = { aboveHours: 46, effects: [{ op: 'stat', stat: 'bossFavor', delta: -5 }] }`、`filialAffinityPerMonth = { 0: -6, 5000: -2, 10000: 2, 20000: 6 }`、`yearEndHalfGrades ['D', 'X']`、`yearEndPayDate { month: 1, day: 20 }`、`dormMoveOutMonth 4`、`promotionRaise 1.08`。`review`：02 §14.3 逐欄；`quota` 依 P、M+、M、M−、D 的順序；`peers` 是 02 §7.4 的 9 列（`id` 欄、`name: 't.peer.<id>'`、`base`、`spread`）；`probation = { certificationPass: 60, skillMin: 30, skillMinWeakFoundation: 35, bossFavorMin: 25, retakeFavorAtLeast: 2, retakeFavorCost: 2, retakeEffects: [skill +3, bossFavor +5] }`；`appeal = { base: 0.25, perEvidence: 0.1, cap: 0.75, skillBonusAtOrAbove: 60, skillBonus: 0.1, windowDays: { min: 20, max: 50 } }`；`pip = { weeks: 4, failsToDismiss: 2, weeklySuccess: { clamp: { sum: [0.35, { product: [0.004, { stat: 'skill' }] }, { product: [0.004, { sum: [{ stat: 'mind' }, -50] }] }, { product: [0.002, { stat: 'bossFavor' }] }] }, lo: 0.1, hi: 0.9 }, successEffects: [bossFavor +2], failEffects: [mind −5, counter cnt.sys_pip_fails +1], liftEffects: [blame −15] }`；`unansweredOnCallWarning { count: 3, blameAtOrAbove: 50 }` |
| `balance.ts` | `balance` | 02 §14.1 逐欄。效果陣列：`overtimePerHour` [stamina −6、mind −1.5、healthDebt +0.5、lifeSatisfaction −1]；`takeHomeEffects` [mind −4、lifeSatisfaction −3、healthDebt +1、`{ op: 'when', if: { flag: 'flag.tonight_date_with_aan' }, then: [{ op: 'affinity', character: 'chr.aan', delta: -3 }] }`]；`workday.onTimeEffects` [mind +6、lifeSatisfaction +2]；`workday.unfinishedTaskEffects` [bossFavor −3、blame +1]；`onCall.ringEffects` [mind −8、healthDebt +2]；`onCall.fastForwardRingEffects` [mind −2、healthDebt +0.5]；`safety.leaveEffects` [`setStat` mind 50、healthDebt −10、bossFavor −5、`flag flag.sys_review_cap_m true`]；`safety.shortLeaveEffects` [healthDebt −15、bossFavor −3]；`thresholds.blackoutEffects` [bossFavor −5、healthDebt +8、`setStat` stamina 30]。`microEventsPerSegment { min: 0, max: 2 }`；`statPolarity`：`healthDebt`、`blame`、`goldenHandcuffs` 為 −1，其他 12 項 1；`choiceWeights` 照 02 §3.3（`money` 用 `moneyPerThousand: 1`）；`valuation` 照 02 §3.3 與 §1.9 最後一條，`affinityOverrides { 'chr.aan': 0.5 }`、`counterValues { 'cnt.sys_ps_adjust': 2.5, 'cnt.sys_kpi_penalty': -0.875, 'cnt.wip_pressure': -0.1, 'cnt.sys_oncall_unanswered': -1.5 }`、`flagValues { 'flag.sys_grade_upgrade_requested': 20, 'flag.sys_review_cap_m': -10 }`、`modifierValues {}`（D91）；`minigameRewards []`（D91）；`minigameKpi { excluded: ['mg.gowning'], excludedPresets: ['certification', 'drill'], autoDoneSample: 60, unfinishedSample: 40 }` |
| `resumes.ts` | `resumes` | 02 §1.2 三列：`res.beiwan_materials` `initialStats { skill: 25, bossFavor: 50, favor: 2, money: 60000, network: 15 }`；`res.lujiang_electronics` `{ skill: 18, bossFavor: 55, favor: 3, money: 45000, network: 10, scheming: 15 }`；`res.technician_transfer` `{ skill: 22, bossFavor: 50, favor: 4, money: 260000, network: 10 }`、`initialAffinity { 'chr.meiling': 30 }`、`minigameTolerance { 'mg.spc': 1 }`、`initialFlags ['flag.ex_operator']`；其他兩個的 `initialAffinity {}`、`minigameTolerance {}`、`initialFlags []`；`label`／`description` 用 `t.res.<slug>.label`／`.description`（D92） |
| `characters.ts` | `characters` | 11 位：`chr.lin`、`chr.azhe`、`chr.xiaoqing`、`chr.haoge`、`chr.meiling`、`chr.vivian`、`chr.shen`、`chr.aan`（`hasPortrait true`）、`chr.hr_he`、`chr.mom`、`chr.lao_k`（`hasPortrait false`、`expressions []`、`defaultExpression ''`）。`initialAffinity` 照 02 §8.2（林課長 0、`isDirectBoss true`，其他 false）。有立繪者的 `expressions` ＝ 04 §8.3 該角色表情表「表情 ID」欄、照表列順序；`defaultExpression` ＝ 該角色的「預設」列。`name`／`role` 用 `t.chr.<slug>.name`／`.role`。外觀：先寫每人一份基底（04 §6.4 的 `heightScale`、`skinTone`、`hairColor`、`hairStyle`、`badgeColor`、`glasses`、`topColor`、`bottomColor`；顏色一律 `'#rrggbb'` 字串；名牌「—」用 `'#9aa3ad'`；媽媽照 D84；`modelRef: null`），`appearance = { fab: { ...基底, outfit: 'cleanroom' }, outside: { ...基底, outfit: <阿安、媽媽 'casual'，其他 'office'> } }` |
| `policies.ts` | `workPolicies`、`lifePolicies`、`lifeActions` | 02 §5.4：`grind` [skill +4、bossFavor +6、visibility +5、mind −10、lifeSatisfaction −8]、44 小時；`steady` [skill +2、bossFavor +1、mind −3、healthDebt +2]、18；`save` [mind +5、lifeSatisfaction +6、bossFavor −5、visibility −4]、0（「下班被叫住」見 D91）；`learn` [skill +3、network +3、stamina −5、mind −2、lifeSatisfaction −2、money −3000]、8。`rest` [healthDebt −4、mind +6]；`partner` [affinity chr.aan +8、lifeSatisfaction +6、money −6000]；`family` [affinity chr.mom +8、lifeSatisfaction +3、money −3000]；`social` [`chance 1 → [chance 0.2 → 阿哲 +6，else chance 0.25 → 小晴 +6，else chance 0.3333333333333333 → 豪哥 +6，else chance 0.5 → 美玲姐 +6，else Vivian +6]`、`chance 0.5 → favor +1`、money −2500]；`exercise` [healthDebt −6、counter `cnt.sys_exercise_bonus` +2、mind +2]；`saveMoney` [money +5000、lifeSatisfaction −4]。生活方針的 `overtimeHoursPerMonth` 都是 0。`label`／`description` 用 `t.policy.<snake_id>.label`／`.description`（`saveMoney` → `save_money`）。拚的健康債遞增與「休養／運動歸零連拚月數」是 `fast_forward` 的規則（02 §5.5），不寫在效果裡。`lifeActions = {}` |
| `world.ts` | `locations`、`machines`、`tasks` | `loc.etch_bay` `{ name: 't.loc.etch_bay', scene: 'scn.fab_bay', mode: '3d', cleanroom: true, staminaPerHour: 0, hotspots: ['hs.et03', 'hs.et04', 'hs.et05', 'hs.et06', 'hs.bay_terminal', 'hs.bay_board', 'hs.bay_phone', 'hs.bay_exit', 'hs.photo_gate'] }`（04 §4.2）；`loc.photo_area` `{ name: 't.loc.photo_area', scene: 'scn.fab_bay', mode: '3d', cleanroom: true, staminaPerHour: 3, hotspots: [] }`（GDD §4.1「黃光區每小時體力額外 −3」，值是每小時多扣的量）。`mc.et03`～`mc.et06`：`label 'ET-03'`…、`location 'loc.etch_bay'`、`hotspot 'hs.et03'`…、`ownedByPlayer true`、`initialHealth` 45／70／75／80（02 §1.10）。`tasks = {}` |
| `campaign.ts` | `campaign`、`keyDays` | `campaign`：`startDate '2027-03-01'`、`termEndDate '2028-02-29'`、`chapters`：prologue 2027-03-01～03-05、ch1 03-08～04-16、ch2 04-19～05-31、ch3 06-01～2028-02-29（D85；`fastForward` 前三章 `'week'`、ch3 `'month'`；`title 't.chapter.<id>'`；`keyDays []`）、`keyDayTarget { min: 21, max: 21 }`、`termEndings []`（E17 在 Stage 5 加）、`templates { conditional: 'kd.cond_public_execution', interrupt: 'kd.tpl_interrupt' }`。`keyDays`：`kd.tpl_interrupt` `{ date: null, kind: 'interrupt', chapter: null, title: 't.kd.tpl_interrupt', variant: 'short', phases: ['shift', 'sleep'], shiftWindow: { from: '20:00', to: '23:59' }, endShiftWhenEventsDone: true, events: [], tasks: [], onCall: true }`（02 §5.8）；`kd.cond_public_execution` `{ date: null, kind: 'conditional', chapter: 'ch1', title: 't.kd.cond_public_execution', variant: 'short', phases: ['briefing'], events: [], tasks: [], onCall: false }`（02 §2.7、§6.6） |
| `minigames.ts` | `minigames` | 03 §7.1 程式區塊原文，只把三個 `declare const` 換成：`// TODO #1 Stage 3 依 03 §5.5、§6.4 填入量測列、留言與逐句台詞`，`PENDING_NOTE: HoldLotNote = { from: 'technician', text: 't.mg.hold_lot.note.pending', misleading: false }`，`HOLD_LOT_MEASUREMENTS` 六個案例都是 `[]`，`HOLD_LOT_NOTES` 六個案例都是 `{ helpful: PENDING_NOTE, neutral: PENDING_NOTE, misleading: null }`，`ONCALL_TRANSCRIPTS` 五個情境都是 `[]`（import 補 `HoldLotNote`） |
| `flags.ts` | `flags`、`counters` | 02 §0.3 兩張表的每一列（`_xiaoqing` 這類縮寫展開成完整 ID；`cnt.sys_line_kpi_sum`／`_n`、`cnt.sys_pip_weeks`／`_fails` 各一列）：計數器 → `counters[id] = 意義欄`；旗標 → `flags[id] = { description: 意義欄, scope: scope 欄 }`；另加 `flag.ex_operator`（`run`、「技術員轉職履歷」） |
| `text/ui.ts` | `uiText` | `t.ui.hud.department` 蝕刻課、`t.ui.hud.company` 穹晶半導體 FAB 7、`t.ui.hud.night_shift` 夜班、`t.ui.hud.wind_flag` 風向期、`t.ui.stats.title` 新人狀態表、`t.ui.stats.aria` 角色數值、`t.ui.stat.stamina` 體力、`.mind` 精神、`.skill` 專業、`.boss_favor` 主管好感、`.favor` 同事人情、`.money` 存款；`t.chapter.*`、`t.kd.tpl_interrupt` 插播：假日值班、`t.kd.cond_public_execution` 公開處刑、`t.rank.*`、`t.policy.*`、`t.res.*`、`t.loc.etch_bay` 蝕刻 bay、`t.loc.photo_area` 黃光區、`t.peer.*`（02 §7.4 名字欄原文）；文字來源見 D92 |
| `text/characters.ts` | `characterText` | `t.chr.<slug>.name`、`.role`（D92）；`t.sys.bonded_help.azhe` 這次的鍋我先幫你扛了，欠我一頓宵夜。`.xiaoqing` 我跟課長說那批是我先 hold 的，你先別出聲。`.haoge` EE 那邊我幫你喬好了，這張單不會寫你的名字。`.meiling` 這筆我在交接單上寫清楚了，不會算到你頭上。`.vivian` 會議上我替你說話了，下次報告先給我看。 |
| `text/minigames.ts` | `minigameText` | `t.mg.hold_lot.station.aei` AEI、`.station.adi` ADI；`t.mg.hold_lot.case.flier`、`.adi_cd_high`、`.under_etch`、`.over_etch`、`.partial_chamber`、`.unknown_defect` ＝ 03 §5.5 案例池表「案例（玩家看到的）」欄原文；`t.mg.hold_lot.note.pending` （留言待撰寫） |
| `index.ts` | `content` | 組裝 `ContentBundle`：`events: {}`、`endings: {}`，其餘取自上面各檔；`text` 由三個台詞物件合併，遇到重複鍵丟 `new Error(\`Duplicate text id: id=${id}\`)`（D68；用內建的 `Object.keys`／迴圈，不 import 任何模組） |

- [ ] **Step 1：寫失敗的整合測試 `test/content_integrity.test.ts`**

```ts
import { describe, expect, test } from 'bun:test';
import { formatIssueLine, formatSummary } from '../scripts/validate_content';
import { content } from '../src/content';
import { validateContent } from '../src/core/content_validator';
import type { ContentIssue } from '../src/model';

// 01 §8.7 的輸出範例
const EXAMPLE_ERROR: ContentIssue = { severity: 'error', id: 'ev.et03_down', path: 'nodes.n_choice.choices[2].requires.all[1].flag', message: "unknown flag 'flag.azhe_refuse_coordination'" };
const EXAMPLE_WARNING: ContentIssue = { severity: 'warning', id: 'ev.et03_down', path: 'nodes.n_r_stay.text', message: 'narration longer than 120 chars: length=126' };

describe('real content', () => {
  test('passes the validator with zero issues', () => {
    expect(validateContent(content)).toEqual([]);
  });
  test('survives a JSON round trip unchanged (spec 01 section 1.2.3)', () => {
    expect(JSON.parse(JSON.stringify(content))).toEqual(content);
  });
});

describe('validate-content output', () => {
  test('formats each issue as one aligned line', () => {
    expect([formatIssueLine(EXAMPLE_ERROR), formatIssueLine(EXAMPLE_WARNING)]).toEqual([
      "error   ev.et03_down  nodes.n_choice.choices[2].requires.all[1].flag  unknown flag 'flag.azhe_refuse_coordination'",
      'warning ev.et03_down  nodes.n_r_stay.text  narration longer than 120 chars: length=126',
    ]);
  });
  test('summarizes counts and fails when any error exists', () => {
    const texts = Object.keys(content.text).length;
    expect([formatSummary([EXAMPLE_ERROR, EXAMPLE_WARNING], content), formatSummary([EXAMPLE_WARNING], content)]).toEqual([
      `content validation failed: errors=1 warnings=1 events=0 texts=${texts}`,
      `content validation passed: errors=0 warnings=1 events=0 texts=${texts}`,
    ]);
  });
  test('the CLI exits 0 on the real content and prints the passing summary last', () => {
    const run = Bun.spawnSync(['bun', 'run', 'scripts/validate_content.ts']);
    const lastLine = run.stdout.toString().trim().split('\n').at(-1);
    expect({ exitCode: run.exitCode, lastLine }).toEqual({
      exitCode: 0,
      lastLine: `content validation passed: errors=0 warnings=0 events=0 texts=${Object.keys(content.text).length}`,
    });
  });
});
```

- [ ] **Step 2：確認測試失敗**

Run：`bun test test/content_integrity.test.ts`
Expected：FAIL，`Cannot find module '../scripts/validate_content'`。

- [ ] **Step 3：建立 `docs/issues.md`、全部內容檔與 `scripts/validate_content.ts`（規格見上表與 Interfaces）**

- [ ] **Step 4：確認測試通過**

Run：`bun test test/content_integrity.test.ts`
Expected：PASS。若 `validateContent(content)` 回報問題，修的是內容（照上表重新對照規格），不是驗證器；只有當問題證明驗證器誤判時才回 Task 12 修正並補一個重現誤判的單元測試。

- [ ] **Step 5：把 `verify` 改回規格原文**

`package.json`：加 `"validate-content": "bun run scripts/validate_content.ts"`，`verify` 改成 01 §14.2 原文 `bun run typecheck && bun run check && bun run validate-content && bun test`（D66 結束）。
Run：`bun run validate-content` → 最後一行 `content validation passed: errors=0 warnings=0 events=0 texts=…`；`bun run verify` → 全綠。

- [ ] **Step 6：Commit**

```bash
git add src/content scripts/validate_content.ts test/content_integrity.test.ts docs/issues.md package.json && git commit -m "feat(content): add the Stage 1 rule constants and opening-state content" -m "createNewGame and the startup validator need a real bundle now; authored events, key days and minigame domain rows stay with their own stages (issue #1)."
```

---

## Task 14：`test/architecture.test.ts`（含紅燈示範）

**Files:**
- Test: `test/architecture.test.ts`

**Interfaces:**
- Consumes：`src/`、`test/`、`scripts/` 的檔案文字；`docs/issues.md`。
- Produces：本 task 之後每個 commit 都受下列規則約束（01 §2、§4.2、§4.3）。測試檔內的工具（不匯出）：`listFiles(root): string[]`（`Bun.Glob('**/*')`，路徑用 `/`）、`importsOf(source): { target: string; typeOnly: boolean; dynamic: boolean }[]`（依出現位置排序）、`stripCommentsAndStrings(source): string`（單趟掃描，移除 `//`、`/* */` 註解與 `'…'`、`"…"`、`` `…` `` 字串內容；樣板字串的 `${…}` 一併移除）、`layerOf(path)`。

**規則**（每條一個 `test`，斷言 `expect(violations).toEqual([])`，violation 是 `{ file, detail }`；`detail` 寫出違規的 import 目標、識別字或行號，讓失敗訊息直接指出位置）：

| # | test 名稱 | 規則 |
|---|---|---|
| 1 | `model.ts imports nothing` | `src/model.ts` 沒有任何 import |
| 2 | `every import respects the layer rules of spec 01 section 4.2` | 以 `src/<目錄>/` 決定層；可 import 的層：utils → model、utils；core → model、utils、core；content → model、content；persistence → model、utils、persistence；render → model、utils、render、`three`／`three/addons/**`；audio → model、utils、audio；ui → model、utils、ui、`core/selectors`、`core/text`、`src/assets/*.svg?raw`；app → 全部；main → 只有 `app/bootstrap`。`bun:`、`node:` 內建模組不限。除了 render 的 `three`，src 不准 import 任何 npm 套件。`*.spec.ts` 另外允許 `test/fixtures` |
| 3 | `content imports model only as types` | `src/content/**` 對 `model` 的 import 都是 `import type` |
| 4 | `main.ts imports only app/bootstrap` | — |
| 5 | `nothing imports dev_panel statically` | 只允許 `import('./dev_panel')` 動態載入 |
| 6 | `unit tests do not import real content` | `src/**/*.spec.ts` 不 import `src/content` |
| 7 | `core, utils and content use no forbidden globals` | 在 `stripCommentsAndStrings` 之後找 `\b(window|document|localStorage|navigator|requestAnimationFrame|performance)\b`、`Math\.random`、`Date\.now`、`new Date\(\s*\)`（`*.spec.ts` 也檢查） |
| 8 | `persistence touches window and localStorage only in storage.ts` | `src/persistence/**`（`storage.ts` 除外）不出現 `window`、`localStorage`（Stage 1 沒有這個目錄，規則先在） |
| 9 | `every directory under src and test has at least two entries` | 直接項目（檔案＋子目錄）數 ≥2 |
| 10 | `file names are snake_case with an allowed extension` | `src/`、`test/`、`scripts/` 下每個檔名符合 `^[a-z0-9_]+(\.spec|\.test)?\.(ts|css|svg)$` |
| 11 | `spec files live in src and test files live in test` | — |
| 12 | `no focused, skipped or todo tests are committed` | 測試檔（`*.spec.ts`、`*.test.ts`）不含 `.only(`、`.skip(`、`.todo(`；比對樣式用 `new RegExp('\\.(only|skip|todo)\\(')`，讓本檔不會比對到自己 |
| 13 | `every TODO carries an issue number registered in docs/issues.md` | `src/`、`test/`、`scripts/` 中每個 TODO 後面緊接 ` #<數字>`，而且 `docs/issues.md` 有 `| #<數字> |` 開頭的列；樣式字串用 `'TO' + 'DO'` 組出，讓本檔不會比對到自己 |
| 14 | `core, utils and content have no top-level let` | 行首（無縮排）的 `let ` 或 `export let ` |
| 15 | `only Error subclasses use extends` | `class \w+ extends (\w+)` 的父類別必須是 `Error` |
| 16 | `no other file exports a type named like a model type` | `model.ts` 中 `export (type|interface) <名稱>` 的集合，與其他 `src/**` 檔案 `export (type|interface|class) <名稱>` 不相交 |
| 17 | `content exports no functions` | `src/content/**` 不出現 `export (async )?function` 或 `export const \w+ = (async )?\(` |

- [ ] **Step 1：先寫工具的自我測試**

```ts
describe('architecture scanner', () => {
  test('importsOf finds static, multi-line, side-effect, re-export and dynamic imports but not comments or strings', () => {
    const source = [
      "import type { A } from '../model';",
      'import {\n  b,\n  c,\n} from \'three\';',
      "import './side_effect';",
      "export { d } from './d';",
      "const m = await import('./dev_panel');",
      "// import x from 'commented';",
      'const s = "import y from \'in_string\'";',
    ].join('\n');
    expect(importsOf(source)).toEqual([
      { target: '../model', typeOnly: true, dynamic: false },
      { target: 'three', typeOnly: false, dynamic: false },
      { target: './side_effect', typeOnly: false, dynamic: false },
      { target: './d', typeOnly: false, dynamic: false },
      { target: './dev_panel', typeOnly: false, dynamic: true },
    ]);
  });
  test('stripCommentsAndStrings keeps code identifiers only', () => {
    const source = "const a = 'window'; // document\n/* navigator */ const b = performance; const c = `x${location}`;";
    expect(stripCommentsAndStrings(source).match(/\b[A-Za-z_]\w*\b/g)).toEqual(['const', 'a', 'const', 'b', 'performance', 'const', 'c']);
  });
});
```

- [ ] **Step 2：確認失敗**

Run：`bun test test/architecture.test.ts`
Expected：FAIL，`importsOf is not defined`。

- [ ] **Step 3：實作工具與規則 1～17**

- [ ] **Step 4：確認通過**

Run：`bun test test/architecture.test.ts`
Expected：PASS（2 個自我測試＋17 條規則）。若某條規則對現有程式碼失敗，修程式碼；只有規則誤判時才改規則，並在自我測試加一個重現誤判的案例。

- [ ] **Step 5：紅燈示範（01 §15 Success Criteria，不 commit）**

1. 建立暫時檔 `src/core/arch_probe.ts`：`import { Vector3 } from 'three';` 與 `export const probe = new Vector3();`。
2. Run：`bun test test/architecture.test.ts`
   Expected：FAIL，規則 2 的 violations 含 `{ file: 'src/core/arch_probe.ts', detail: <寫出 three 的訊息> }`（`biome check` 的 `noRestrictedImports` 也會報同一行，`bun run check` 可一併看到）。
3. 刪除 `src/core/arch_probe.ts`，再跑一次 → PASS。
4. 把 Step 2 的失敗輸出（violation 那一行）記進 `IMPLEMENTATION_PLAN.md` 的決定紀錄。

- [ ] **Step 6：verify 並 commit**

```bash
bun run verify && git add test/architecture.test.ts IMPLEMENTATION_PLAN.md && git commit -m "test(arch): enforce layer imports, globals, naming and directory rules" -m "Biome has no dependency-boundary plugin, so the layering of spec 01 section 4.2 is enforced by scanning sources in a plain test."
```

---
## Task 15：`render/look`（色票、校準值、光組、光組選擇）

**Files:**
- Create: `src/render/look.ts`
- Test: `src/render/look.spec.ts`

**Interfaces:**
- Consumes：model 的 `SceneId`、`PresentationMood`、`QualityTier`。
- Produces（04 §2.8 中 Stage 1 的部分，D83）：
  - `PALETTE`：04 §1.6 程式區塊原文（含 Task 0 加入的 `ink`、`paper`、`grey`）。
  - `OUTLINE_T`、`outlineFor(size)`：04 §2.3 程式區塊原文。
  - `legacyToPhysical(legacyIntensity, light)`：04 §2.4 程式區塊原文。
  - `PIXEL_RATIO_CAP: Readonly<Record<QualityTier, number>> = { high: 2, medium: 1.5, low: 1 }`（04 §2.1）。
  - `CALIBRATION`：`{ scheme: 'A', gradientSteps: [23, 96, 255], hemisphere: 1.92, directional: 2.2, alarmBright: 60.6, alarmDark: 5.78, alarmInitial: 38.3, photoBase: 61.5, photoAmplitude: 8.8, pointDecay: 1 } as const`；每個數值旁一行註解寫範例的舊值（例 `// r128 0.8，π × 0.8^2.2`；04 §2.4 校準表）。
  - 04 §3.1 的 `LightRigId`、`FabZone`、`LightRigInput` 型別原文，以及
    ```ts
    export interface LightRig {
      hemisphere: { sky: number; ground: number; intensity: number };
      directional: { color: number; intensity: number; position: readonly [number, number, number] };
      alarm: { color: number; bright: number; dark: number; hz: number; distance: number } | null;
      photo: { color: number; base: number; amplitude: number; distance: number; position: readonly [number, number, number] } | null;
      screen: { color: number; intensity: number; distance: number } | null;
      background: number;
      fog: { color: number; near: number; far: number } | null;
      lampPanel: number | null;
    }
    export const LIGHT_RIGS: Readonly<Record<LightRigId, LightRig>>;
    export function selectLightRig(input: LightRigInput): LightRigId | null; // null ＝ 2.5D 場景，由 BackdropSpec 決定（04 §3.1 第 9 列）
    ```
  `LIGHT_RIGS` 的值逐格取自 04 §3.2 基礎光組表（粗體的 0.186 值，不是括號內的舊值），對應規則：「平行光 關閉（0）」或「0」→ `{ color: 0xffffff, intensity: 0, position: [4, 9, 7] }`（`officeNight` 的位置用 `[-8, 6, 2]`）；點光源欄有「黃光區 …」的光組 `photo = { color: 0xffd000, base: CALIBRATION.photoBase, amplitude: CALIBRATION.photoAmplitude, distance: 26, position: [0, 3.5, -22] }`；`bayAlarm.alarm = { color: 0xff1a1a, bright: CALIBRATION.alarmBright, dark: CALIBRATION.alarmDark, hz: 1.7, distance: 16 }`，`bayAlarm` 的半球光與平行光強度也引用 `CALIBRATION`；`photoAmber.alarm` 與 `bayAlarm.alarm` 相同（「有 down 機台時紅燈保留」）；`officeNight.screen = { color: 0xbcd6ff, intensity: 5.16, distance: 6 }`；「霧 無」→ `null`；「自發光調整 —」→ `lampPanel: null`。`selectLightRig` 照 04 §3.1 決策表 1～8 列；不是 `scn.fab_bay`、`scn.gowning_room`、`scn.office` 的場景在非 calm 時回傳 `null`。

- [ ] **Step 1：寫失敗測試 `src/render/look.spec.ts`**

```ts
// 04 §2.8 的預先手算值（誤差 ±0.5 → toBeCloseTo(x, 0)）
const LEGACY_CASES = [
  { name: 'hemisphere 0.8', intensity: 0.8, light: { kind: 'hemisphere' }, expected: 1.92 },
  { name: 'directional 0.85', intensity: 0.85, light: { kind: 'directional' }, expected: 2.2 },
  { name: 'red bright 3.2', intensity: 3.2, light: { kind: 'point', legacyDistance: 16, refDistance: 2, decay: 1 }, expected: 60.6 },
  { name: 'red dark 1.1', intensity: 1.1, light: { kind: 'point', legacyDistance: 16, refDistance: 2, decay: 1 }, expected: 5.78 },
  { name: 'red initial 2.6', intensity: 2.6, light: { kind: 'point', legacyDistance: 16, refDistance: 2, decay: 1 }, expected: 38.3 },
  { name: 'photo yellow 2.3', intensity: 2.3, light: { kind: 'point', legacyDistance: 26, refDistance: 5, decay: 1 }, expected: 61.5 },
] as const;
describe('legacyToPhysical', () => {
  test.each(LEGACY_CASES)('$name converts to about $expected', ({ intensity, light, expected }) => {
    expect(legacyToPhysical(intensity, light)).toBeCloseTo(expected, 0);
  });
});
```
其餘 `describe`：
- `selectLightRig`（04 §3.1 決策表逐列，一列一案）：`{ scene: 'scn.room', mood: 'calm', … }` → `'calmPaper'`；`fab_bay`、`zone 'photo'`、`anyMachineDown true` → `'photoAmber'`；`fab_bay`、`bay`、down、`daylight 'night'` → `'bayAlarm'`；`fab_bay`、`bay`、沒有 down、`night` → `'bayNight'`；同上 `day` → `'bayDay'`；`scn.gowning_room` → `'gowningWhite'`；`scn.office` `night` → `'officeNight'`；`scn.office` `day` → `'officeDay'`；`scn.room` `normal` → `null`。
- `outlineFor`：`size [x, 0.01, 0.01]` 的 x ＝ `[0.119, 0.015]`、`[0.12, 0.03]`、`[0.399, 0.03]`、`[0.4, 0.04]`、`[1.499, 0.04]`、`[1.5, 0.05]`（04 §2.8 邊界值）。
- `LIGHT_RIGS`：`'every rig with fog uses its background colour, except the two sample-valued rigs'`——`Object.entries(LIGHT_RIGS).filter(([id, rig]) => rig.fog !== null && rig.fog.color !== rig.background).map(([id]) => id)` 等於 `['bayAlarm', 'photoAmber']`（04 §2.5 規則；`bayAlarm` 是範例值、`photoAmber` 是 04 §3.2 表的值，兩者都保留，見本計畫末的「規格矛盾」）。

- [ ] **Step 2：確認失敗**

Run：`bun test src/render/look.spec.ts`。Expected：FAIL，`Cannot find module './look'`。

- [ ] **Step 3：實作 `src/render/look.ts`（內容見 Interfaces）**

- [ ] **Step 4：確認通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/render && git commit -m "feat(render): add palette, r128 calibration constants and light rig selection" -m "three 0.186 uses colour management and physical light units; all converted values live in one module so the side-by-side calibration only edits constants (spec 04 section 2.4)."
```

---

## Task 16：`render/toon_kit` 與 `render/resource_tracker`

**Files:**
- Create: `src/render/toon_kit.ts`、`src/render/resource_tracker.ts`
- Test: `src/render/toon_kit.spec.ts`、`src/render/resource_tracker.spec.ts`

**Interfaces:**
- Consumes：`three`；`outlineFor`、`PALETTE`（Task 15）。
- Produces：
  - `toon_kit.ts`：01 §9.4 的 `OutlineStrategy`、`GRADIENT_STEPS`、`ToonKit`、`createToonKit()` 原文簽名。釘住：gradientMap 照 04 §2.2 程式區塊（`RedFormat`、`NearestFilter`×2、`generateMipmaps = false`、`colorSpace = NoColorSpace`）；`material()` 的快取鍵 `` `${new Color(color).getHexString()}|${map?.uuid ?? ''}|${doubleSided ? 'double' : 'front'}` ``；`vertexColorMaterial()` 回傳同一個 `MeshToonMaterial({ vertexColors: true, color: 0xffffff, gradientMap })`；幾何依參數快取（box 用 `BoxGeometry(w, h, d)`；cylinder 用 `CylinderGeometry(rTop, rBottom, h, 16)`；sphere 用 `SphereGeometry(r, 18, 14)`，段數是範例值）；hull：box `(w + 2t, h + 2t, d + 2t)`、cylinder `(rTop + t, rBottom + t, h + 2t)`、sphere `(r + t)`，掛成本體的子物件、`name = 'outline'`、材質 `outlineMaterial`；`outline` 省略時 ＝ `outlineFor(外框尺寸)`（cylinder ＝ `[2·max(r), h, 2·max(r)]`、sphere ＝ `[2r, 2r, 2r]`），`outline === 0` 不建 hull；`color` 傳 `MeshToonMaterial` 時直接用；primitive 加進 `parent`、位置 `at`，回傳本體 mesh；kit 建立的每個材質與幾何都設 `userData.shared = true`；`dispose()` 釋放所有快取的材質、幾何、gradient 與 outline 材質。
  - `resource_tracker.ts`：
    ```ts
    export interface ResourceTracker {
      track<T extends { dispose(): void }>(resource: T): T;
      /** 走訪 root：Mesh／Sprite 的 geometry、material（陣列也算）、material 上所有 Texture 型別的屬性；跳過 userData.shared === true 的資源 */
      trackObject(root: Object3D): void;
      /** 每個資源剛好 dispose 一次，然後清空；重複呼叫沒有作用 */
      dispose(): void;
      readonly size: number;
    }
    export function createResourceTracker(): ResourceTracker;
    ```

- [ ] **Step 1：寫失敗測試**

`toon_kit.spec.ts` 的 `describe('createToonKit')`：
1. `'the gradient map holds the linearized three steps as an unfiltered red data texture'`：`const map = kit.material(0xffffff).gradientMap` → `expect({ steps: Array.from(map.image.data), format: map.format, min: map.minFilter, mag: map.magFilter, mips: map.generateMipmaps, space: map.colorSpace }).toEqual({ steps: [23, 96, 255], format: RedFormat, min: NearestFilter, mag: NearestFilter, mips: false, space: NoColorSpace })`。
2. `'materials are cached by colour, map and side'`：`[a === kit.material(0xff0000), a === kit.material(0xff0000, { doubleSided: true }), a === kit.material(0x00ff00)]` → `[true, false, false]`。
3. `'box adds a body and a hull grown by the outline on every side'`：`kit.box(group, [2, 1, 0.5], 0xff0000, [1, 2, 3], 0.05)` → `{ inParent: group.children.includes(mesh), position: mesh.position.toArray(), body: mesh.geometry.parameters, hull: outline.geometry.parameters, hullMaterialIsShared: outline.material === kit.outlineMaterial }` 等於 `{ true, [1, 2, 3], { width: 2, height: 1, depth: 0.5 }, { width: 2.1, height: 1.1, depth: 0.6 }, true }`（`parameters` 用 `toMatchObject` 或只取這三個鍵比 `toEqual`；浮點用 `toBeCloseTo`）。
4. `'the default outline follows outlineFor'`：`box(…, [0.3, 0.2, 0.1], …)` 不給 outline → hull 寬 0.36（S 級 0.03）。
5. `'outline 0 builds no hull'`：本體沒有名為 `outline` 的子物件。
6. `'kit resources are marked shared so scene trackers skip them'`：本體的 `material.userData.shared` 與 `geometry.userData.shared` 都是 true。
7. `'the vertex colour material is a single white instance with vertex colours'`：兩次呼叫同一個物件、`vertexColors` true、`color.getHex()` 0xffffff。

`resource_tracker.spec.ts` 的 `describe('createResourceTracker')`：
1. `'trackObject registers each unique geometry, material and texture once and skips shared ones'`：group 內兩個 mesh 共用一個 `BoxGeometry`，第一個用帶 `map` 的 `MeshBasicMaterial`，第二個用 `userData.shared = true` 的材質 → `size` 3。
2. `'dispose releases every resource exactly once even when called twice'`：對每個資源 `addEventListener('dispose', …)` 計數，呼叫 `dispose()` 兩次 → 計數 `[1, 1, 1]`、`size` 0。
3. `'track returns the resource for inline use'`：`tracker.track(texture) === texture`。

- [ ] **Step 2：確認失敗**

Run：`bun test src/render/toon_kit.spec.ts src/render/resource_tracker.spec.ts`。Expected：FAIL，`Cannot find module`。

- [ ] **Step 3：實作兩個檔案（行為見 Interfaces）**

- [ ] **Step 4：確認通過**

Run：同 Step 2。Expected：PASS（three 的幾何、材質、DataTexture 在 bun 裡不需要 WebGL）。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/render && git commit -m "feat(render): add cached toon materials, hull outlines and a resource tracker" -m "Shared kit resources are flagged so scene disposal never frees materials other scenes still use (spec 01 section 9.3)."
```

---

## Task 17：`render/canvas_textures` 與道具（機台、FOUP、天車、廠房外殼）

**Files:**
- Create: `src/render/canvas_textures.ts`、`src/render/props/machine.ts`、`foup.ts`、`oht.ts`、`fab_shell.ts`
- Modify: `test/fixtures.ts`（加 `createFakeTextureFactory`）
- Test: `src/render/props/props.spec.ts`

**Interfaces:**
- Consumes：`ToonKit`（Task 16）；`PALETTE`（Task 15）；model 的 `MachineStatus`、`MotionPolicy`。
- Produces：
  ```ts
  // canvas_textures.ts（顏色貼圖一律 colorSpace = SRGBColorSpace、anisotropy 取 options；floor/wall/hazard 設 RepeatWrapping，repeat 由呼叫端設定）
  export interface CanvasTextureFactory {
    floor(): Texture; wall(): Texture; hazard(): Texture; photoSign(): Texture;
    screen(label: string, status: MachineStatus, inverted: boolean): Texture;
    sign(label: string): Texture;
  }
  export function createCanvasTextureFactory(doc: Document, options: { anisotropy: number }): CanvasTextureFactory;
  // props/machine.ts（01 §9.5）
  export interface PropHandle<S> { readonly root: Object3D; setState(state: S): void; tick(dtSec: number, elapsedSec: number, motion: MotionPolicy): void; dispose(): void }
  export function createEtchMachine(kit: ToonKit, textures: CanvasTextureFactory, params: { label: string; facing: 1 | -1; initial: MachineStatus }): PropHandle<MachineStatus>;
  // props/foup.ts、oht.ts、fab_shell.ts（PropHandle 從 ./machine import type）
  export function createFoup(kit: ToonKit): PropHandle<'normal' | 'hold'>;
  export function createOht(kit: ToonKit): PropHandle<null>;
  export function createFabShell(kit: ToonKit, textures: CanvasTextureFactory): PropHandle<number>; // state ＝ 燈板顏色（LightRig.lampPanel）
  // test/fixtures.ts 新增
  export function createFakeTextureFactory(): CanvasTextureFactory & { readonly created: readonly Texture[] };
  // 每個方法回傳 new Texture() 並推進 created；name 依序是 'floor'、'wall'、'hazard'、'photoSign'、`screen:${label}:${status}:${inverted}`、`sign:${label}`
  ```
  - 貼圖畫法照範例：`floor` L422-431、`wall` L432-440、`hazard` L441-446、`photoSign` L492-496、`screen` L514-526（`'warn'` 用 `#ffd400` 與字樣 `WARN`，取代範例的 `idle`／`IDLE`）、`sign` L527-534；字型照範例的 `Arial Black, Arial, sans-serif`（D83）。
  - `createEtchMachine`：04 §5.1 表中標「範例值」的部件（本體、頂部與底部色帶、EFEM 門板、門把、螢幕邊框、觸控螢幕、機台標牌、燈塔桿、燈號 ×3；Load port 平台與 FOUP 是「新增」，Stage 3 加），座標用 `fx = facing × 1.2`、`dir = facing`（範例 L538-572 的 `dir = -side`）。三顆燈號各自一個 `MeshBasicMaterial`，`name` 為 `lamp_green`、`lamp_yellow`、`lamp_red`；觸控螢幕 `name = 'screen'`、`MeshBasicMaterial`。`setState`：亮燈用 `PALETTE.lamp*On`、其他兩顆 `PALETTE.lamp*Off`；螢幕貼圖 `textures.screen(label, status, false)`，**同一台機台每種狀態只建一次貼圖**（`down` 另有 `inverted: true` 一張）。`tick`：狀態 `down` 時 `t = motion.reduced ? 0 : elapsedSec`，`(t × 1.7) % 1 < 0.5` 為亮相（紅燈 `lampRedOn`、正常螢幕），否則暗相（`lampRedOff`、反白螢幕）。靜態部件 `userData.static = true`（01 §9.4，Stage 3 的 `static_batcher` 用）。
  - `createFoup`：04 §5.3 全表（外殼、把手、前門、hold 標籤）；標籤 `name = 'hold_tag'`，`hold` 時 `PlaneGeometry(0.2, 0.14)`＋`PALETTE.holdTagRed`，`normal` 時 `PlaneGeometry(0.12, 0.08)`＋`PALETTE.holdTagWhite`；初始 `normal`。
  - `createOht`：root 下有靜態的軌道（`box 0.28 × 0.22 × 70` 於 (0, 5.62, −14)）與 4 支吊架（z ＝ 8、2、−4、−10，D70），以及 `name = 'oht_car'` 的群組：車體、紅帶、升降桿 ×2、夾爪、吊掛的 `createFoup`（於 (0, 4.15, 0)），尺寸與描邊照 04 §5.4。`tick`：`oht_car.position.z = motion.reduced ? -2 : 8 - ((elapsedSec × 2.6) % 44)`。`setState(null)` 沒有作用。
  - `createFabShell`：04 §4.2「建築外殼」表中標「範例值」的列（高架地板〔重複次數依 04：21.67 × 166.67〕、側牆 ×2、天花板〔`0x3a3a3f` 純色，FFU 貼圖是新增〕、燈板 10 片〔x ＝ ±3、z ＝ 8、3、−2、−7、−12〕、走道黃線 ×2、黃光區牆 ×2＋後牆、黃光區天花板與地板、斜紋帶、閘口柱 ×4＋橫樑、黃色玻璃 ×2、「PHOTO AREA」標牌），加上 04 §5.5 的黃光區機台 ×2（範例 L488-491 的兩個 box）；燈板共用一個 `MeshBasicMaterial`，`setState(color)` 改它的顏色。bay 頭牆、ETCH BAY 標牌、stocker、MES、白板、分機是「新增」，Stage 3 加。

- [ ] **Step 1：寫失敗測試 `src/render/props/props.spec.ts`**

```ts
// 01 §9.5 的三角形預算（含描邊）
const TRIANGLE_BUDGET = { machine: 1200, foup: 150, ohtCar: 300, fabShell: 2000 } as const;
const triangles = (root: Object3D): number => { /* traverse：Mesh 的 index ? index.count / 3 : position.count / 3 加總 */ };
const MOVING = { reduced: false } as const;
const STILL = { reduced: true } as const;

describe('prop triangle budgets', () => {
  test('every Stage 1 prop stays within its budget from spec 01 section 9.5', () => {
    const kit = createToonKit();
    const textures = createFakeTextureFactory();
    const oht = createOht(kit);
    const measured = {
      machine: triangles(createEtchMachine(kit, textures, { label: 'ET-03', facing: 1, initial: 'down' }).root),
      foup: triangles(createFoup(kit).root),
      ohtCar: triangles(defined(oht.root.getObjectByName('oht_car'), 'oht_car')),
      fabShell: triangles(createFabShell(kit, textures).root),
    };
    const over = Object.entries(measured).filter(([key, count]) => count > TRIANGLE_BUDGET[key as keyof typeof TRIANGLE_BUDGET]);
    expect(over).toEqual([]);
  });
});

describe('createEtchMachine', () => {
  test.each([
    ['run', [PALETTE.lampGreenOn, PALETTE.lampYellowOff, PALETTE.lampRedOff], 'screen:ET-03:run:false'],
    ['warn', [PALETTE.lampGreenOff, PALETTE.lampYellowOn, PALETTE.lampRedOff], 'screen:ET-03:warn:false'],
    ['down', [PALETTE.lampGreenOff, PALETTE.lampYellowOff, PALETTE.lampRedOn], 'screen:ET-03:down:false'],
  ] as const)('status %p lights %p and shows %p at the start of the blink cycle', (status, lamps, screen) => {
    /* 建 machine（initial 'run'）→ setState(status) → tick(0.016, 0, MOVING)
       → expect({ lamps: [三顆燈的 material.color.getHex()], screen: screen mesh 的 map.name }).toEqual({ lamps, screen }) */
  });
  test('a down machine blinks at 1.7 Hz and holds the bright phase under reduced motion', () => {
    /* setState('down')；tick(…, 0.3, MOVING) → 紅燈 lampRedOff、螢幕 'screen:ET-03:down:true'（0.3 × 1.7 = 0.51）
       tick(…, 0.3, STILL) → lampRedOn、'screen:ET-03:down:false' */
  });
  test('switching back and forth reuses one screen texture per status', () => {
    /* run → down → run → down 後，textures.created 中 name 以 'screen:ET-03:' 開頭的有 3 張（run、down、down 反白） */
  });
});

describe('createFoup', () => {
  test('a held FOUP shows the larger red tag and a normal one the small white tag', () => {
    /* setState('hold') → hold_tag 的 geometry.parameters { width: 0.2, height: 0.14 }、顏色 PALETTE.holdTagRed；
       setState('normal') → { 0.12, 0.08 }、PALETTE.holdTagWhite */
  });
});

describe('createOht', () => {
  test.each([[0, MOVING, 8], [10, MOVING, -18], [10, STILL, -2]] as const)(
    'at %ps with %p the car sits at z=%p', (elapsed, motion, z) => { /* tick(0.016, elapsed, motion) 後 oht_car.position.z toBeCloseTo z */ },
  );
});
```
（`/* … */` 內是必須斷言的確切值。）

- [ ] **Step 2：確認失敗**

Run：`bun test src/render/props`。Expected：FAIL，`Cannot find module`。

- [ ] **Step 3：實作 `canvas_textures.ts`、四個道具，並在 `test/fixtures.ts` 加 `createFakeTextureFactory`（規格見 Interfaces）**

- [ ] **Step 4：確認通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/render test/fixtures.ts && git commit -m "feat(render): port the style C machines, OHT, FOUP and fab shell as prop factories" -m "Props are composed factories with injected texture makers, so geometry budgets and blink timing are testable without WebGL or a DOM."
```

---

## Task 18：`render/scene_manager` 與 `render/scenes/fab_bay`

**Files:**
- Create: `src/render/scene_manager.ts`、`src/render/scenes/fab_bay.ts`
- Test: `src/render/scene_manager.spec.ts`、`src/render/scenes/fab_bay.spec.ts`

**Interfaces:**
- Consumes：`ToonKit`、`createResourceTracker`、`CanvasTextureFactory`、道具工廠、`LIGHT_RIGS`、`selectLightRig`、`CALIBRATION`、`PALETTE`；`Logger`；`RenderError`；model 的 `SceneSnapshot`、`SceneId`、`MotionPolicy`、`QualityTier`。
- Produces：
  ```ts
  // scene_manager.ts（01 §9.3 的 Stage 1 子集，D83）
  export interface SceneModule {
    readonly id: SceneId; readonly scene: Scene; readonly camera: PerspectiveCamera;
    enter(snapshot: SceneSnapshot): void; update(snapshot: SceneSnapshot): void;
    tick(dtSec: number, elapsedSec: number, motion: MotionPolicy): void; exit(): void; dispose(): void;
  }
  export interface SceneBuildContext { kit: ToonKit; tracker: ResourceTracker; textures: CanvasTextureFactory; quality: QualityTier; logger: Logger }
  export type SceneFactory = (ctx: SceneBuildContext) => SceneModule;
  export interface SceneManager { show(snapshot: SceneSnapshot): SceneModule; current(): SceneModule | null; disposeAll(): void }
  export function createSceneManager(factories: Readonly<Partial<Record<SceneId, SceneFactory>>>, ctx: Omit<SceneBuildContext, 'tracker'>): SceneManager;
  // scenes/fab_bay.ts
  export const FAB_BAY_MACHINES: {
    readonly left: readonly { id: MachineId; label: string; z: number }[];   // mc.et03 'ET-03' 2、mc.et04 'ET-04' −2、mc.et05 'ET-05' −6、mc.et06 'ET-06' −10；x −4.6、facing 1
    readonly right: readonly { label: string; z: number }[];                // 'ET-07' 0、'ET-08' −4、'ET-09' −8、'ET-10' −12；x 4.6、facing −1、一律 run（D83）
  };
  export const createFabBayScene: SceneFactory;
  ```
  - `scene_manager.show`：快照的場景跟目前相同 → `current.update(snapshot)`；不同 → 目前的 `exit()`＋`dispose()`（Stage 1 沒有快取；LRU 與淡入淡出在 Stage 3 有第二個 3D 場景時加），以 `{ ...ctx, tracker: createResourceTracker() }` 呼叫工廠、`enter(snapshot)`；沒有工廠 → `RenderError('sceneBuild', \`no factory: scene=${id}\`)`。`disposeAll` 釋放目前場景並設為 null。
  - `createFabBayScene`：`Scene` 名稱無要求；組合 `createFabShell`、8 台 `createEtchMachine`、`createOht`、校準用主角（範例 L580-600 的部件與姿勢：位置 (−2.45, 0, 2.3)、`rotation.y = −1.0`、`scale 1.18`；顏色取 `PALETTE.suit`、`suitBoot`、`glove`、`eyeBand`、`mask`、`lanyard`，臉窗用 `PALETTE.skinS2`；`name = 'calibration_hero'`；Stage 3 由 `chibi_builder` 取代）；燈光：`HemisphereLight`、`DirectionalLight`（位置取光組）、三盞 `PointLight`：`name` 為 `alarm_light`、`photo_light`（位置 (0, 3.5, −22)）、`staging_light`（強度 0，Stage 3 的演出光），`decay` 一律 `CALIBRATION.pointDecay`；相機 `PerspectiveCamera(54, 1, 0.1, 120)`，位置 (3.1, 0.6, 8.6)、`up = (sin 0.11, cos 0.11, 0)`、看向 (−1.5, 2.0, 0.6)（範例構圖，04 §4.2）。建完以 `ctx.tracker.trackObject(scene)` 登記；`dispose()` 呼叫 `ctx.tracker.dispose()`。
  - `enter`／`update(snapshot)`：左側機台狀態取 `snapshot.machines[id]?.status`；快照缺少某台 → 保持 `run`，並且每個 ID 只 `logger.warn` 一次 `[fab_bay] machine missing from snapshot: machine=<id>`；光組 ＝ `LIGHT_RIGS[selectLightRig({ scene: 'scn.fab_bay', mood: snapshot.mood, anyMachineDown, zone: 'bay', daylight: snapshot.timeOfDay === 'night' ? 'night' : 'day' })]`，立即套用到半球光、平行光、`scene.background`、`scene.fog`（`null` → 無霧；否則 `new Fog(color, near, far)`）、燈板顏色（`lampPanel` 為 null 時不變）；紅燈錨點 ＝ 距離校準主角 (−2.45, 2.3)（xz）最近的 down 機台的中心 ＋ (facing × 1.5, 3.4, 0.4)（04 §4.2；ET-03 ＝ (−3.1, 3.4, 2.4)）。
  - `tick(dt, elapsed, motion)`：`t = motion.reduced ? 0 : elapsed`；機台與天車各自 `tick`；`photo_light.intensity = photo ? photo.base + photo.amplitude × sin(t × 2) : 0`；`alarm_light.intensity = (有 down 機台 && rig.alarm) ? ((t × rig.alarm.hz) % 1 < 0.5 ? bright : dark) : 0`、`distance = rig.alarm.distance`；校準主角 `position.y = sin(t × 1.6) × 0.012`、頭部 `rotation.x = 0.28 + sin(t × 1.1) × 0.04`（範例 L652-653）。

- [ ] **Step 1：寫失敗測試**

`scene_manager.spec.ts`：用一個會記錄呼叫的假工廠（回傳的 `SceneModule` 把 `enter`／`update`／`exit`／`dispose` 推進共用的 `calls` 陣列，`scene = new Scene()`、`camera = new PerspectiveCamera()`），`ctx` 用 `createToonKit()`、`createFakeTextureFactory()`、`'high'`、`createMemoryLogger()`。
1. `'showing the same scene twice builds it once and then only updates'`：兩次 `show(fab 快照)` → `calls` 等於 `['build:scn.fab_bay', 'enter:scn.fab_bay', 'update:scn.fab_bay']`。
2. `'switching scenes exits and disposes the previous one before building the next'`：fab → office → `[…'build:scn.fab_bay', 'enter:scn.fab_bay', 'exit:scn.fab_bay', 'dispose:scn.fab_bay', 'build:scn.office', 'enter:scn.office']`。
3. `'an unregistered scene fails with a render error'`：`show({ …, scene: 'scn.nope' })` 丟出訊息 `'Render failed: kind=sceneBuild detail=no factory: scene=scn.nope'`。
4. `'disposeAll releases the current scene'`：之後 `current()` 為 null、`calls` 最後是 `'dispose:scn.fab_bay'`。

`fab_bay.spec.ts`：`MOVING = { reduced: false }`、`STILL = { reduced: true }`（同 `props.spec.ts`）；測試內 `snapshotWith(statuses: Partial<Record<MachineId, MachineStatus>>, timeOfDay: TimeOfDay = 'day'): SceneSnapshot`（四台左側機台預設 `run`、`label` 'ET-0x'、`mood 'normal'`、其餘欄位照 D87）；`build()` 用 `createFabBayScene({ kit, tracker: createResourceTracker(), textures: createFakeTextureFactory(), quality: 'high', logger: createMemoryLogger() })`；`light(name)` 用 `scene.getObjectByName` 取燈。
1. `'the calibration frame stays within the fab bay budget'`：快照 ET-03 down、ET-06 warn（範例畫面）→ 三角形總數 ≤ 60 000、`textures.created.length` ≤ 32（04 §4.2 預算表）；斷言 `expect({ trianglesOver: n > 60000, texturesOver: m > 32 }).toEqual({ trianglesOver: false, texturesOver: false })`。
2. `'a down ET-03 puts the alarm light at the sample anchor with the calibrated phases'`：`enter(ET-03 down)`；依序 `tick(0, 0, MOVING)`、`tick(0, 0.3, MOVING)`、`tick(0, 0.3, STILL)` 記錄 `alarm_light.intensity` → `[60.6, 5.78, 60.6]`；`alarm_light.position.toArray()` 逐項 `toBeCloseTo` `[-3.1, 3.4, 2.4]`；`scene.background.getHex()` 0x24050a。
3. `'ET-05 down moves the alarm anchor to its own machine'`：位置 `[-3.1, 3.4, -5.6]`。
4. `'all machines running uses the day rig and no alarm light'`：`background` 0xdfe3e6、`alarm_light.intensity` 0、`scene.fog` 的 `near`／`far` 為 24／80。
5. `'night without alarms uses the night rig'`：`timeOfDay 'night'` → `background` 0x1e2430。
6. `'a snapshot missing a bay machine warns once per machine'`：快照刪掉 `mc.et06` 後 `enter`＋`update` → memory logger 的 `lines` 等於 `['warn [fab_bay] machine missing from snapshot: machine=mc.et06']`。

- [ ] **Step 2：確認失敗**

Run：`bun test src/render/scene_manager.spec.ts src/render/scenes`。Expected：FAIL，`Cannot find module`。

- [ ] **Step 3：實作兩個檔案（行為見 Interfaces）**

- [ ] **Step 4：確認通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/render && git commit -m "feat(render): port the style C corridor as scn.fab_bay with alarm blink and OHT" -m "Coordinates and the camera composition are the sample values; light intensities come from the calibration constants so the side-by-side check only adjusts look.ts."
```

---

## Task 19：`render/render_host` 與 app 組裝（場景出現在瀏覽器）

**Files:**
- Create: `src/render/render_host.ts`、`src/app/flow_controller.ts`
- Modify: `src/app/bootstrap.ts`（換成組裝根）、`src/app/dev_panel.ts`（加校準覆寫）

**Interfaces:**
- Consumes：`createSceneManager`、`createFabBayScene`、`createToonKit`、`createCanvasTextureFactory`、`PIXEL_RATIO_CAP`；`content`；`validateContent`；`createNewGame`；selectors；`createConsoleLogger`；`ContentError`、`InvariantError`。
- Produces：
  ```ts
  // render/render_host.ts（01 §9.2 的 Stage 1 子集，D83）
  export interface RenderHost {
    readonly mode: 'webgl' | 'none';
    apply(snapshot: SceneSnapshot): Promise<void>;
    setMotion(policy: MotionPolicy): void;
    renderFrame(dtMs: number): void;
    dispose(): void;
  }
  export function createRenderHost(doc: Document, options: { logger: Logger; quality: QualityTier | 'auto' }): RenderHost;
  // app/flow_controller.ts（01 §9.2：快照只由 selectors 組裝）
  export function toSceneSnapshot(state: DeepReadonly<GameState>, content: ContentBundle): SceneSnapshot;
  // app/dev_panel.ts
  export interface CalibrationOverrides { machines: Readonly<Partial<Record<MachineId, MachineStatus>>>; hideUi: boolean }
  export function calibrationOverrides(win: Window): CalibrationOverrides | null;
  ```
  - `createRenderHost`：canvas ＝ `doc.getElementById('scene')`（找不到 → `InvariantError('Render canvas missing: id=scene')`）；`'auto'` → `matchMedia('(pointer: coarse)').matches && innerWidth ≤ 760 ? 'medium' : 'high'`（01 §9.7 L1）；`new WebGLRenderer({ canvas, antialias: tier === 'high', alpha: false, powerPreference: 'high-performance' })` 失敗時 `logger.warn('[render] webgl unavailable: detail=<message>')` 並回傳 `mode: 'none'` 的 host（每個方法都不做事、`apply` 立即 resolve；L4 的 CSS 背景在 Stage 3）；成功時照 04 §2.1 程式區塊設定 renderer（`PIXEL_RATIO_CAP[tier]`）；貼圖 anisotropy ＝ `{ high: 4, medium: 2, low: 1 }[tier]`；場景註冊表只有 `{ 'scn.fab_bay': createFabBayScene }`。視窗 `resize`（以及每次 `apply` 之後）：`renderer.setSize(w, h, false)`；目前場景相機 `aspect = w / h`、`fov = clamp(2 × atan(tan(32°) / aspect) × 180 / π, 54, 84)`、`setViewOffset(w, h, 0, h × (w < 760 ? 0.2 : 0.12), w, h)`、`updateProjectionMatrix()`（範例 L620-628）。`webglcontextlost`：`preventDefault()`、暫停、`logger.warn('[render] webgl context lost')`；`webglcontextrestored`：`disposeAll()` 後用最後一份快照重建（5 分鐘內兩次改 L4 在 Stage 3）。`renderFrame(dtMs)`：暫停或沒有場景就返回；累積經過時間，呼叫目前場景 `tick(dtMs ÷ 1000, elapsed ÷ 1000, motion)` 後 `renderer.render`。
  - `toSceneSnapshot`（D87）：`scene: 'scn.fab_bay'`、`mood: presentationMood(state, content)`、`timeOfDay: timeOfDay(state.time.minuteOfDay)`、`machines`：`content.machines` 每台 `{ label: def.label, status: machineStatus(state.machines[id].health, content.balance.machines) }`、`actors: []`、`highlightHotspots: []`、`yieldIndex: yieldIndex(state, content, 'scn.fab_bay')`、`focusActor: null`、`playerSpeedScale: 1`、`phoneGlow: false`。
  - `calibrationOverrides`：網址 `?calib=1` → `{ machines: { 'mc.et03': 'down', 'mc.et04': 'run', 'mc.et05': 'run', 'mc.et06': 'warn' }, hideUi: true }`；否則 null（只在 DEV 被動態載入，01 §2.1）。
  - `bootstrap(doc)`（Stage 1 版，取代 Task 1 的骨架）：依序 (1) logger ＝ `createConsoleLogger({ level: DEV ? 'debug' : 'warn', now: () => new Date().toISOString(), ringSize: 200, strictSingleLine: DEV })`；(2) `validateContent(content)` 中 `severity === 'error'` 的問題 >0 → `throw ContentError.fromIssues(errors)`（D67）；(3) `seed = win.crypto.getRandomValues(new Uint32Array(1))[0]`；`state = createNewGame({ name: '新人', pronoun: 'neutral', resume: 'res.beiwan_materials', look: 'a' }, content, seed)`（Stage 1 預覽用的固定角色；建角頁在後續 stage）；(4) DEV 時 `await import('./dev_panel')` 取 `calibrationOverrides(win)`；(5) `render = createRenderHost(doc, { logger, quality: 'auto' })`、`setMotion({ reduced: win.matchMedia('(prefers-reduced-motion: reduce)').matches })`；(6) `await render.apply(<toSceneSnapshot 的結果；有校準覆寫時把對應機台的 status 換掉>)`；(7) `requestAnimationFrame` 迴圈：`dt = min(250, now − last)`、`render.renderFrame(dt)`（01 §6.6 的上限；`game_loop.ts` 在 Stage 3）。HUD 掛載在 Task 21。

- [ ] **Step 1：實作四個檔案（行為見 Interfaces）**

這一層是 DOM／WebGL 組裝，01 §13.1 規定不寫單元測試；快照用到的公式都已在 Task 7 測過。

- [ ] **Step 2：型別、架構與打包檢查**

Run：`bun run verify && bun run build`
Expected：全綠；`dist check passed: …`（證明 `dev_panel` 與校準覆寫沒有進正式版）。

- [ ] **Step 3：開發伺服器冒煙檢查**

在背景啟動 `bun run dev`（Vite 預設 http://localhost:5173/），然後：`curl -s http://localhost:5173/ | grep -c 'id="scene"'` → `1`；`curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/src/main.ts` → `200`。有瀏覽器時另外打開 `/` 與 `/?calib=1`：前者是日間光組的 bay、天車在動、Console 沒有錯誤；後者整個空間偏紅、ET-03 紅燈閃爍、沒有 UI。檢查完停止 dev server。沒有瀏覽器時只做 `curl` 兩項，畫面留給 Task 22。

- [ ] **Step 4：Commit**

```bash
git add src/render/render_host.ts src/app && git commit -m "feat(app): render the opening state in scn.fab_bay through the render host" -m "bootstrap is the only composition root; the snapshot is assembled from selectors so render never reads core state directly (spec 01 section 9.2)."
```

---
## Task 20：`ui/view_models`、`tokens.css`、`comic.css`、`palette_sync`

**Files:**
- Create: `src/ui/view_models.ts`、`src/ui/styles/tokens.css`、`src/ui/styles/comic.css`
- Test: `src/ui/view_models.spec.ts`、`test/palette_sync.test.ts`

**Interfaces:**
- Consumes：`maxStamina`、`isWindPeriod`（`core/selectors`）；`resolveText`（`core/text`）；`dayIndexToIso`、`weekdayOf`、`minutesToClock`；`PALETTE`（只在 `palette_sync` 測試裡 import）。
- Produces：
  ```ts
  export function formatMoney(amount: number): string;        // 'NT$ 48,200'；四捨五入到整數；負數用 '−'（U+2212，D86）；−0 顯示 'NT$ 0'
  export function formatDateLabel(dayIndex: number): string;  // '2027/06/13（日）'（星期字 一二三四五六日）
  export function formatClock(minuteOfDay: number): string;   // 向下取到 5 分（04 §9.6）：1367 → '22:45'
  export function isNightShift(minuteOfDay: number): boolean; // ≥1320 或 <360（04 §9.6 的 22:00～06:00）
  export function formatDayCount(dayIndex: number): string;   // '入職第 <dayIndex + 1> 天'（01 D25）
  export interface HudView { dateLabel: string; nightLabel: string | null; clock: string; dayCount: string; rankLine: string; company: string; windFlag: string | null }
  export interface StatRowView { stat: 'stamina' | 'mind' | 'skill' | 'bossFavor'; label: string; value: number; max: number; low: boolean; lostCapPct: number }
  export interface StatsPanelView { title: string; ariaLabel: string; rows: readonly StatRowView[]; favor: { label: string; count: number; slots: number }; money: { label: string; text: string } }
  export function hudView(state: DeepReadonly<GameState>, content: ContentBundle): HudView;
  export function statsPanelView(state: DeepReadonly<GameState>, content: ContentBundle): StatsPanelView;
  ```
  - `hudView`：`rankLine = \`${<ranks[rank].title 的文字>} · ${<t.ui.hud.department>}\``；`company = t.ui.hud.company`；`nightLabel = isNightShift ? t.ui.hud.night_shift : null`；`windFlag = isWindPeriod ? t.ui.hud.wind_flag : null`；文字都經 `resolveText`。考績風向小頭像在 Stage 4（`reviewWind`）。
  - `statsPanelView`：四列依序 stamina、mind、skill、bossFavor；`label = t.ui.stat.<snake>`；`value = Math.round(數值)`；`max` ＝ 規則的 `max` 是 `'maxStamina'` 時用 `maxStamina(state, content)`，否則用該數字；`low` ＝ 規則的 `lowLine` 不為 null 而且**儲存值** ≤ `lowLine`（02 §0.2 比較用原值）；`lostCapPct` ＝ 體力列 `100 − max`、其他 0（04 §9.7「被健康債吃掉的上限」）；`favor = { label: t.ui.stat.favor, count: Math.round(favor), slots: <stats.favor.max> }`；`money = { label: t.ui.stat.money, text: formatMoney(money) }`；`title = t.ui.stats.title`、`ariaLabel = t.ui.stats.aria`。
  - `tokens.css`：04 §1.5 程式區塊原文（`bun run format` 可能改引號，允許）。
  - `comic.css`：(a) 基底：`html, body { margin: 0; }`、`body { background: var(--stage); color: var(--ink); font-family: var(--f-body); }`、`#scene { position: fixed; inset: 0; width: 100%; height: 100%; display: block; }`、`#ui { position: fixed; inset: 0; z-index: var(--z-ui); padding: var(--gutter); pointer-events: none; }`、`.visually-hidden`（標準的隱藏但可朗讀寫法）；(b) 範例 `design/style-c-toon.html` L32-66 中 `.top`、`.hudcol`、`.panel`（含 `::after` 網點）、`.hud`（`.date`、`.clock`、`.day`）、`.rank`（`small`）、`.stats`（`h2`）、`.stat-grid`、`.row`、`.row .lab`、`.bar`、`.bar i`、`.row.low .bar i`、`.row.low .lab::after`、`.num`、`.num small`、`.coins`、`.coin`、`.coin.off`、`.coins b`、`.money`、`.money .num` 的規則，以及 L116-131、L141 的 `@media (max-width: 760px)` 中對應的規則；色碼與字級改用 token（`#fff` → `var(--white)`、`#9d000d` → `var(--red-deep)`、範例的 `clamp(…)` 字級 → 對應的 `--fs-*`；`rgba(10,10,10,.28)` 這類透明度變體保留並在行尾註明對應 token）；(c) 新增 `.bar s.cap { float: right; height: 100%; background: repeating-linear-gradient(135deg, var(--ink) 0 3px, transparent 3px 6px); }`（最大體力以外的斜線區）與 `.wind-flag { display: inline-flex; gap: 4px; align-items: center; font-family: var(--f-head); font-weight: 900; font-size: var(--fs-min); color: var(--red); pointer-events: auto; }`；(d) `@media (prefers-reduced-motion: reduce)` 照範例 L148-151 關閉動畫（`.fx-alert` 那行不搬）。04 §1.7 的禁止事項照守（不用模糊陰影、膠囊按鈕）。

- [ ] **Step 1：寫失敗測試**

`src/ui/view_models.spec.ts`：
```ts
describe('formatMoney', () => {
  // Review Focus 2：存款可以是負數（02 §1.1 沒有下限）
  test.each([[48200, 'NT$ 48,200'], [0, 'NT$ 0'], [-1200, 'NT$ −1,200'], [1234567.6, 'NT$ 1,234,568'], [-0.4, 'NT$ 0']])(
    '%p reads %p', (amount, text) => { expect(formatMoney(amount)).toBe(text); },
  );
});
describe('formatDateLabel', () => {
  test.each([[0, '2027/03/01（一）'], [104, '2027/06/13（日）'], [365, '2028/02/29（二）']])('day %p reads %p', (day, text) => {
    expect(formatDateLabel(day)).toBe(text);
  });
});
describe('formatClock', () => {
  test.each([[0, '00:00'], [390, '06:30'], [1367, '22:45'], [1439, '23:55']])('minute %p shows %p', (minute, text) => {
    expect(formatClock(minute)).toBe(text);
  });
});
describe('isNightShift', () => {
  test.each([[1319, false], [1320, true], [359, true], [360, false]])('minute %p is night shift: %p', (minute, night) => {
    expect(isNightShift(minute)).toBe(night);
  });
});
describe('formatDayCount', () => {
  test.each([[0, '入職第 1 天'], [104, '入職第 105 天']])('day %p reads %p', (day, text) => {
    expect(formatDayCount(day)).toBe(text);
  });
});
describe('hudView', () => {
  test('the opening morning shows date, clock, day count and rank without night or wind marks', () => {
    expect(hudView(buildTestState(), testContent)).toEqual({
      dateLabel: '2027/03/01（一）', nightLabel: null, clock: '06:30', dayCount: '入職第 1 天',
      rankLine: '測試職等 · 測試課', company: '測試公司', windFlag: null,
    });
  });
  test('the wind period and night shift add their labels', () => {
    /* probation 'passed'、dayIndex 300、minuteOfDay 1367 → nightLabel '夜班'、windFlag '風向期'、clock '22:45' */
  });
});
describe('statsPanelView', () => {
  test('rows compare stored values with the low line and show the lost stamina cap', () => {
    const view = statsPanelView(buildTestState({ stats: { stamina: 35, mind: 35.4, healthDebt: 20 } }), testContent);
    expect(view.rows).toEqual([
      { stat: 'stamina', label: '體力', value: 35, max: 90, low: true, lostCapPct: 10 },
      { stat: 'mind', label: '精神', value: 35, max: 100, low: false, lostCapPct: 0 }, // 35.4 > 35：顯示 35 但不是「危」（02 §0.2）
      { stat: 'skill', label: '專業', value: 30, max: 100, low: false, lostCapPct: 0 },
      { stat: 'bossFavor', label: '主管好感', value: 50, max: 100, low: false, lostCapPct: 0 },
    ]);
  });
  test('favor coins and money come from the stat rules and formatter', () => {
    expect(statsPanelView(buildTestState(), testContent)).toMatchObject({
      title: '新人狀態表', ariaLabel: '角色數值',
      favor: { label: '同事人情', count: 3, slots: 5 }, money: { label: '存款', text: 'NT$ 60,000' },
    });
  });
});
```
`test/palette_sync.test.ts`（04 §2.8）：
```ts
import { describe, expect, test } from 'bun:test';
import { PALETTE } from '../src/render/look';

const css = await Bun.file('src/ui/styles/tokens.css').text();
const cssColor = (name: string): number | null => {
  const match = css.match(new RegExp(`${name}:\\s*#([0-9a-fA-F]{6})\\s*;`));
  return match?.[1] === undefined ? null : Number.parseInt(match[1], 16);
};
const PAIRS = [
  ['--ink', 'ink'], ['--paper', 'paper'], ['--grey', 'grey'], ['--red', 'holdTagRed'], ['--yellow', 'hazardYellow'],
  ['--glove', 'glove'], ['--amber', 'photoWall'], ['--screen-run', 'screenRun'], ['--screen-warn', 'screenWarn'], ['--screen-down', 'screenDown'],
] as const;

describe('palette sync between tokens.css and render/look.ts', () => {
  test.each(PAIRS)('%p equals PALETTE.%p', (cssName, paletteKey) => {
    expect(cssColor(cssName)).toBe(PALETTE[paletteKey]);
  });
});
```

- [ ] **Step 2：確認失敗**

Run：`bun test src/ui test/palette_sync.test.ts`。Expected：FAIL（`Cannot find module './view_models'`；palette 測試因為 `tokens.css` 不存在而失敗）。

- [ ] **Step 3：實作 `view_models.ts`，建立 `tokens.css`、`comic.css`（規格見 Interfaces），然後 `bun run format`**

- [ ] **Step 4：確認通過**

Run：同 Step 2。Expected：PASS。

- [ ] **Step 5：verify 並 commit**

```bash
bun run verify && git add src/ui test/palette_sync.test.ts && git commit -m "feat(ui): add HUD and stats view models with the style C tokens" -m "Formatting is pure and tested; the CSS tokens are checked against the 3D palette so the two never drift (spec 04 section 2.8)."
```

---

## Task 21：`ui/dom`、`hud`、`stats_panel`，掛到畫面上

**Files:**
- Create: `src/ui/dom.ts`、`src/ui/components/hud.ts`、`src/ui/components/stats_panel.ts`
- Modify: `src/app/bootstrap.ts`

**Interfaces:**
- Consumes：`HudView`、`StatsPanelView`、`hudView`、`statsPanelView`（Task 20）；`calibrationOverrides`（Task 19）。
- Produces：
  - `dom.ts`：01 §10.2 的 `Component<P>`、`h()`、`replaceChildrenKeyed()` 原文簽名。`h`：`attrs` 的字串／數字 → `setAttribute`；`true` → 空字串屬性；`false`／`undefined` → 略過；`on` 開頭而值是函式 → `addEventListener(名稱去掉 on 並轉小寫, 值)`；子節點字串 → text node，`null`／`false` 略過。文字一律走 text node／`textContent`（01 §10.2-2）。
  - `components/hud.ts`：`export function createHud(): Component<HudView>`。結構照範例 L161-168：根是 `.hudcol`，內含 `.panel.hud`（`.date` ＝ `dateLabel` ＋ `nightLabel`、`.clock` ＝ `clock`、`.day` ＝ `dayCount`）、`.rank`（`rankLine` ＋ `<small>company</small>`），以及 `windFlag` 不為 null 時顯示的 `.wind-flag`（16 × 16 的紅色三角旗 inline SVG ＋ 文字，04 §9.6）。
  - `components/stats_panel.ts`：`export function createStatsPanel(): Component<StatsPanelView>`。結構照範例 L169-180：`section.panel.stats[aria-label]`、`h2` 標題、`.stat-grid`；四列 `.row[data-stat]`（`.lab`、`.bar` 內 `<i style="width: value%">` 與 `<s class="cap" style="width: lostCapPct%">`、`.num` ＝ `value` ＋ `<small>/max</small>`，`low` 時加 `.low`）；人情列 `.coins[role=img][aria-label="<label> <count>"]` 內 `slots` 個 `.coin`（超過 `count` 的加 `.off`）與 `<b>count</b>`；存款列 `.row.money`。
  - 兩個元件的 `update()` 冪等（同樣的 props 兩次，DOM 不變；只改 `textContent`、`style.width`、`classList`、`hidden`）。
  - `bootstrap`：在 `render.apply` 之後，`calibrationOverrides?.hideUi` 不為 true 時：`import '../ui/styles/tokens.css'` 與 `comic.css`（模組頂端靜態 import），在 `#ui` 放入 `h('div', { class: 'top' }, hud.el, stats.el)`，並以 `hudView(state, content)`、`statsPanelView(state, content)` 呼叫各自的 `update`（Stage 1 狀態不會變，所以只更新一次；`bind()` 訂閱在 Stage 2 有 `session` 之後）。

- [ ] **Step 1：實作三個檔案並修改 `bootstrap`（行為見 Interfaces）**

DOM 呈現依 01 §13.1 不寫自動測試；顯示的資料已在 Task 20 測過。

- [ ] **Step 2：型別、架構、打包**

Run：`bun run verify && bun run build`。Expected：全綠，`dist check passed`。

- [ ] **Step 3：開發伺服器冒煙檢查**

同 Task 19 Step 3；有瀏覽器時確認左上角是日期面板「2027/03/01（一）」與「06:30」、「入職第 1 天」、職等牌「助理工程師 · 蝕刻課／穹晶半導體 FAB 7」；右上角「新人狀態表」：體力 80／100、精神 70、專業 25、主管好感 50、人情 2 枚、存款 NT$ 60,000（北灣材料所，02 §1.2）；`?calib=1` 時沒有 UI。

- [ ] **Step 4：Commit**

```bash
git add src/ui src/app/bootstrap.ts && git commit -m "feat(ui): show the opening state in the comic HUD and stats panel" -m "Components only receive view props, so the DOM layer stays free of game rules (spec 01 section 10.2)."
```

---

## Task 22：視覺驗收（人工；01 §13.6、04 §2.4）

**Files:**
- Modify: `src/render/look.ts`（加 `CALIBRATION_SAMPLES`；必要時調整 `CALIBRATION`）、`IMPLEMENTATION_PLAN.md`
- Create: `design/calibration/reference_r128.png`、`design/calibration/stage1_round<N>.png`（截圖，不參與建置）

**Interfaces:**
- Consumes：Task 19、21 的頁面；`design/style-c-toon.html`。
- Produces：`export const CALIBRATION_SAMPLES: readonly { id: 'a' | 'b' | 'c' | 'd' | 'e' | 'f'; label: string; x: number; y: number }[]`（`x`、`y` 是 1600×900 畫面上的比例 0～1；04 §2.4 步驟 3 的 6 個物件）；`IMPLEMENTATION_PLAN.md` 的校準紀錄與（需要時）待人工驗收列。

- [ ] **Step 1：算出 6 個取樣點的畫面座標**

在 scratchpad 寫一支一次性的 bun 腳本（不放進 repo）：用 three 建 `PerspectiveCamera`，套用 Task 18 的校準機位與 Task 19 的 FOV／`setViewOffset` 規則（1600×900），把下列世界座標 `project()` 成 0～1 的畫面比例：(a) ET-03 正面螢幕下方本體 (−3.38, 1.0, 2.0)、(b) ET-03 頂面 (−4.6, 2.94, 2.0)、(c) 右側第一台正面 (3.38, 1.0, 0.0)、(d) 鏡頭前 3 m 的地板（從相機位置沿視線方向 3 m 投到 y = 0 的點）、(e) 主角軀幹 (−2.45, 1.4, 2.3)、(f) 黃光區後牆 (0, 3.0, −31.9)。把結果寫成 `CALIBRATION_SAMPLES`（`label` 用 04 §2.4 的中文描述），並在 `look.spec.ts` 加一個斷言「每個取樣點都在 0～1 內」的測試。

- [ ] **Step 2：參考畫面與待測畫面**

照 04 §2.4 步驟 1～2：Chrome、1600×900、`devicePixelRatio` 1、Rendering 模擬 `prefers-reduced-motion: reduce`。參考：開 `design/style-c-toon.html`，對 `#ui`、`.fx`、`.sfx`、`.styletag` 設 `display:none` 後截圖存 `design/calibration/reference_r128.png`。待測：`bun run dev`，開 `http://localhost:5173/?calib=1`，同樣條件截圖存 `design/calibration/stage1_round1.png`。

- [ ] **Step 3：取樣比對與調整（最多 3 輪）**

在兩張圖的 6 個 `CALIBRATION_SAMPLES` 位置各取 5×5 像素平均（DevTools 取色或任何看圖工具），門檻：(a)～(e) 每通道差 ≤12／255，(f) ≤2／255。不合格時依 04 §2.4 步驟 5 的順序一次只改一個 `CALIBRATION` 常數（半球光 → 平行光 → 紅點光 → 黃點光 → 霧），重截 `stage1_round<N>.png`。把最終值與 6 點實測差寫成 `CALIBRATION` 每個常數旁的單行註解，並記進 `IMPLEMENTATION_PLAN.md` 決定紀錄（每輪一行：輪次、改了哪個常數、6 點差值）。3 輪仍不合格 → 依 04 §2.4 步驟 7 改方案 B（備案值見 04 §2.4），重做 Step 2～3，並在 01 §9.9 補一段說明。

- [ ] **Step 4：01 §13.6 視覺一致性清單（逐項勾選並記錄）**

- [ ] 3 階明暗：機台頂面亮、朝光側面亮、背光側面中、底面暗（04 §2.2）。
- [ ] 黑色描邊：預設機位下 4 m 外的機台描邊約 6～9 px（04 §2.3）。
- [ ] 紅燈閃爍：關閉減少動態時 ET-03 紅燈與螢幕以約 1.7 Hz 交替、整個空間染紅；開啟減少動態時固定亮相。
- [ ] 黃光區琥珀色：後牆是飽和琥珀色、不受紅光影響（取樣 (f)）。
- [ ] 天車：關閉減少動態時沿軌道移動並循環；開啟時停在 z ＝ −2。
- [ ] 漫畫面板與數值面板：硬陰影、角落網點、傾斜角度、紅標題貼紙、「危」紅斜紋，與範例並排一致（`/` 頁面，不是 `?calib=1`）。
- [ ] 手機版面：DevTools 寬 390 px 時 HUD 與數值面板照 760 px 以下規則排列、沒有水平捲動。
- [ ] 無 3D：Chrome 以 `--disable-webgl` 啟動（或 DevTools 停用 WebGL）時，頁面仍顯示 HUD 與數值面板、Console 只有一行 `[render] webgl unavailable` 警告、沒有未處理例外。

- [ ] **Step 5：取不到人或瀏覽器時（00 §9 R1-B、01 §15 共通規則 3）**

Step 2～4 需要瀏覽器與人眼。當下做不到時：Step 1 照做；`IMPLEMENTATION_PLAN.md`「待人工驗收清單」加兩列 `| Stage 1 並排校準（6 點取樣） | 01 §15 Stage 1、04 §2.4 | 未量測；CALIBRATION 維持方案 A 起始值 | 使用者 | 暫定通過（待人工驗收） |` 與 `| Stage 1 視覺一致性清單 | 01 §13.6 | 自動測試涵蓋：閃爍相位、紅燈錨點、光組選擇、預算 | 使用者 | 暫定通過（待人工驗收） |`，Stage 1 以「暫定通過（待人工驗收）」收尾，不擋 Stage 2。

- [ ] **Step 6：verify 並 commit**

```bash
bun run verify && git add src/render/look.ts src/render/look.spec.ts design/calibration IMPLEMENTATION_PLAN.md && git commit -m "chore(render): record the stage 1 side-by-side calibration against style C" -m "Sample points and the final light constants are kept next to each other so later scenes can repeat the comparison."
```

---

## Task 23：Stage 1 收尾

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

**Interfaces:**
- Consumes：前面所有 task。
- Produces：Stage 1 的 Status。

- [ ] **Step 1：完整驗證**

Run：`bun run verify && bun run build`
Expected：typecheck 0 錯誤、`biome check` 乾淨、`content validation passed: errors=0 warnings=0 …`、所有測試 PASS、`dist check passed: …`。

- [ ] **Step 2：對照 01 §15 Stage 1 的 Success Criteria**

逐條在 `IMPLEMENTATION_PLAN.md` 的 Stage 1 下寫結果：(1) `verify`、`build` 全綠（貼上 Step 1 的摘要行）；(2) 並排比對結果（Task 22：通過，或「暫定通過（待人工驗收）」）；(3) 紅燈示範（Task 14 Step 5 的輸出行）。

- [ ] **Step 3：更新 Status 並 commit**

Stage 1 `**Status**` 改成 `Complete`；若 Task 22 是暫定通過，改成 `Complete（暫定通過項目見待人工驗收清單）`。`IMPLEMENTATION_PLAN.md` 不刪除（Stage 2～5 還沒做，且待人工驗收清單可能非空）。
```bash
bun run verify && git add IMPLEMENTATION_PLAN.md && git commit -m "docs(plan): mark stage 1 foundation complete" -m "All Stage 1 gates from spec 01 section 15 are recorded with their evidence; manual visual items stay listed until a person reviews them."
```

---

## 附錄 A：01 §15 Stage 1 的覆蓋對照

| 01 §15 Stage 1 項目 | Task |
|---|---|
| 工具鏈、`bun run verify`／`build`、git hooks、`IMPLEMENTATION_PLAN.md` | 1、13（verify 回到原文）、23 |
| `model.ts` 完整 | 2 |
| `utils/` 全部（logger、errors、event_bus、date、math） | 3、4 |
| `rng`（參考值、往返、`int` 範圍） | 5 |
| `conditions`（參數化門檻、空 all／any、雙重否定） | 8 |
| `effects`（夾限、最大體力、人情溢出、修正器、風向期 ×1.5、`chance` 一次 RNG；02 §1.3 的 2b～2d；`economy` 效果） | 9 |
| `stats`（`scaleEffects`） | 10 |
| `text` | 11 |
| `selectors`（`maxStamina` 含拚 −10、`machineStatus` 19／20／39／40、`timeOfDay`、`yieldIndex`） | 7 |
| `content_validator`（參照與 ID；未知旗標、不可達、循環、孤兒台詞、負向 skill） | 12、13 |
| `date`（`2027-06-13` → 104 星期日；`2028-02-29` → 365） | 3 |
| `test/architecture.test.ts`＋紅燈示範 | 14 |
| `look`（`legacyToPhysical`、`selectLightRig`）、`toon_kit`（`GRADIENT_STEPS`）、`resource_tracker`、`scene_manager`、`render_host` | 15、16、18、19 |
| `scn.fab_bay`（靜態場景＋紅燈閃爍＋天車；04 §2.4 並排校準）、`props`（三角形預算） | 17、18、22 |
| `tokens.css`、`hud`、`stats_panel` 以 selectors 顯示 `createNewGame()` 的初始狀態 | 6、20、21 |
| `test/palette_sync.test.ts` | 20 |
| 與 `design/style-c-toon.html` 並排通過 §13.6 視覺清單 | 22 |

## 附錄 B：規格中的矛盾與空白（處理方式）

1. Stage 1 需要真實 `ContentBundle`，但內容分給後續 stage → D65、D91（`docs/issues.md` #1）。
2. 第一個 commit 的 `verify` 含 `validate-content`，但當時驗證器與內容都不存在（01 §14.1 與 §14.2 互相矛盾）→ D66。
3. 01 §4.5 骨架遇到 warning 也丟 `ContentError`，與 §8.4／§8.6／§8.7 矛盾 → D67。
4. 01 §8.1 要 `content/index.ts` 丟 `ContentError`，但 §4.2 禁止 content import utils → D68。
5. 04 §2.8 的 `palette_sync` 要比對 `--ink`／`--paper`／`--grey`，`PALETTE` 卻沒有對應值（`floorTile` 是 `d8d6cc`、`--grey` 是 `d9d6cc`）→ D69。
6. 04 §5.4 標「範例值」的第 5 支吊架（z ＝ −16）在範例裡不存在 → D70。
7. `GameState` 沒有存放 `ending` 效果「待處理結局」的欄位 → D71（Stage 2 開工前需裁決）。
8. 04 §2.5 規定霧色等於背景（只有 `bayAlarm` 例外），但 04 §3.2 的 `photoAmber` 背景 `2b2000`、霧 `3a2c05` → 依 00 §2-5（常數表優先於散文）保留表值；Task 15 的不變量測試把 `photoAmber` 列為第二個例外，建議下次修訂 04 §2.5 時補上。
9. 00 §9.3 N1 說「下午多 15 分餘裕」，但著裝 QTE 的 15 分是取代原本的 +15 自動著裝，午餐後時刻仍是 13:15 → Task 0 Step 2 的 02 §2.6 註記照實寫「時刻與合計不變」。
10. 01 §5.2 `SceneSnapshot` 需要 `playerSpeedScale` 等欄位，但 Stage 1 沒有走動與互動 → D87。
11. 01 §9.3 的 `SceneBuildContext` 沒有貼圖工廠，CanvasTexture 需要 DOM、無法在 bun 測試 → D83。
12. 04 §6.4 沒有媽媽的外觀 → D84；GDD 的章節日期之間有空檔 → D85；02 沒寫的新遊戲初始值 → D80；修正器到期日、`economy` 房租、生死之交訊息的串、風向期與輪值週的判定 → D75～D79。
