# IMPLEMENTATION_PLAN

> Stage 1 開工時，把本節複製成專案根目錄的 `IMPLEMENTATION_PLAN.md`，隨進度更新 Status；全部完成後刪除該檔案（CLAUDE.md）。每個 stage 結束時都必須能編譯、`bun run verify` 全綠、可以展示。

**v1.2（審查回合 1）的三條共通規則**

1. **誰產出美術與內容（R1-A）**：實作者（Claude）在各 stage 中自行產出全部 MVP 的 SVG 立繪、主角頭像、結局插圖、圖示與中文台詞；業界朋友與使用者只負責**審核**。允許佔位 SVG：佔位檔必須具備完整的表情群組結構（04 §8.1 的圖層、每個 `g.expr-<id>` 都在），並在根 `<svg>` 標 `data-placeholder="true"`；`portrait_assets.test.ts` 的結構檢查對佔位檔照樣通過，另外輸出佔位數。Stage 5 出口要求佔位數為 0。
2. **內容撰寫軌道（R1-A）**：從 Stage 3 開始與程式平行：Stage 3 寫序章～第一章（事件、台詞、立繪，可以先佔位），Stage 4 寫第二～三章，Stage 5 收尾、換掉佔位、跑平衡與審核。
3. **人工驗收的暫定通過（R1-B）**：需要測試者或實機的出口條件（時鐘倍率校正、效能、一輪時長、業界審核、敏感審稿）在當下取不到人或裝置時，stage 以「**暫定通過（待人工驗收）**」收尾，並在 `IMPLEMENTATION_PLAN.md` 末尾的「待人工驗收清單」留一列（項目、出處、代理量測的結果、需要誰、狀態）。測試者＝使用者與其業界朋友。效能的代理量測：Chrome DevTools Performance 面板的 CPU 4× 降速，班中 ≥30 fps；實機到位再補測並更新清單。暫定通過不擋下一個 stage 開工；`IMPLEMENTATION_PLAN.md` 要等清單清空才能刪除。

### Stage 1：地基（工具鏈、統一模型、求值器、範例場景移植）
**Goal**：可編譯、可測試的專案骨架。`model.ts` 完整（§5.2）；`utils/` 全部；`core/` 的 `rng`、`conditions`、`effects`（含 02 §1.3 的 2b～2d、`economy` 效果）、`stats`（`scaleEffects`）、`text`、`selectors`（02 §1.4：`maxStamina(state, content)`、`machineStatus`、`timeOfDay`、`yieldIndex`）、`content_validator`（參照與 ID 規則）；`test/architecture.test.ts`；render 的 `look`（04 §2.8：色票、校準值）、`toon_kit`（`GRADIENT_STEPS`）、`resource_tracker`、`scene_manager`、`render_host`，並把風格 C 範例的無塵室走道移植成 `scn.fab_bay`（靜態場景＋紅燈閃爍＋天車，依 04 §2.4 並排校準）；UI 的 `tokens.css`（04 §1.5）、`hud`、`stats_panel` 以 selectors 顯示 `createNewGame()` 的初始狀態；`test/palette_sync.test.ts`。
**Success Criteria**：
- `bun run verify` 與 `bun run build` 全綠。
- `bun run dev` 的畫面與 `design/style-c-toon.html` 並排比對，通過 §13.6「視覺一致性」清單（光源強度已重新校準，§9.9）。
- 故意加一個 `src/core` → `three` 的 import，`architecture.test.ts` 會失敗（紅燈示範後移除）。
**Tests**：`rng`（參考值、往返、`int` 範圍）；`conditions`（參數化門檻、空 `all`／`any`、雙重否定）；`effects`（夾限、最大體力、人情溢出、修正器乘數、風向期 ×1.5、`chance` 恰好消耗一次 RNG）；`date`（`2027-06-13` → dayIndex 104、星期日；`2028-02-29` → 365）；`content_validator`（未知旗標、不可達節點、循環、孤兒台詞、負向 `skill`）；`selectors`（`machineStatus` 的 19／20／39／40 邊界、`maxStamina` 含「拚」−10）；`look`（`legacyToPhysical`、`selectLightRig`，04 §2.8）；`architecture` 全部規則；`props`（三角形預算）；整合 `palette_sync`。
**Status**：In Progress

### Stage 2：事件引擎與文字版關鍵日
**Goal**：`step`、`session`、`flow`、`clock`、`event_scheduler`（含 `tagMultiplier`、`safety` 例外）、`event_runner`（含結果框表情、`favorWaived`）、`seeds`（小遊戲來源不重複）、`black_book`（02 §9.3 的雙排序）、`key_day_planner`（劇本關鍵日）、`thresholds`（`runThresholdMonitor` 的框架：歸零、健康債門檻、借錢排入；安全事件內容在 Stage 5）完成；UI 的 `dialogue_box`、`portrait`、`choice_cards`（鎖卡、門檻章、倒數）、`result_box`、`fx_layer`、`delta_pop`；內容：§8.5 範例一完整，加上序章 D1（#1 工號被消失）。班中時段先用 DOM 的 hotspot 清單代替 3D 走動（也就是 L4 的雛形）。
**Success Criteria**：
- 在瀏覽器裡只用鍵盤玩完 06/13 值班夜的 4 條路線（含鎖卡與門檻卡）。
- 無頭測試：固定種子選「貳」→ 伏筆依種子決定是否觸發 → 黑歷史本有一筆、`citeWhen` 正確。
- `validate-content` 對範例一 0 個 error、0 個 warning（v1.1 已刪除 waiver）。
**Tests**：`event_runner`（9 種節點逐一、鎖卡丟 `InvariantError`、chip 只取最上層可見數值、自動鎖卡說明）；`event_scheduler`（優先序、名額、冷卻、overflow 三種處置、**候選陣列打亂順序結果不變**）；`seeds`（窗口、只擲一次、容量淘汰、`onExpire`、快轉中求值）；`black_book`（分數、淘汰、引用前 3 筆、`citeWhen`、P／M+ 正面優先）；`thresholds`（02 §1.6 的同批跨門檻順序）；`flow`（轉移表）；`clock`（跨 16:30、下班等互動結束）；`step`（狀態不可變：輸入物件在呼叫後不變）。
**Status**：Not Started

### Stage 3：3D 班中、四個小遊戲、一天完整循環
**Goal**：render 的 `navigation`（自由走動＋定點模式）、`camera_director`（8 顆鏡頭）、`chibi_builder`、`static_batcher`、`quality`（L0～L4）、`gowning_room`、`office`、`backdrop_2_5d`；app 的 `input_router`、`game_loop`（時鐘倍率 150 ms／遊戲分）、`minigame_host`；core 的 `minigames/difficulty`、`minigames/procgen`、4 個小遊戲邏輯（著裝＋風淋、SPC 獵人含 `logTrace` 變體、Hold Lot 判官、半夜電話，玩法依 03 規格書）、`minigame_rewards`（02 §1.9 換算表）、`workday`（下班卡、加班、帶回家做、夜間行動、睡眠回復、on-call 判定、提早收尾）；ui 的 4 個小遊戲畫面、`minigame_frame`、`coach_mark`、`scene_fallback`（L3／L4）、任務便利貼、下班卡、夜間行動；`audio` 程式合成音效（`AudioService`，§10.8）；班中跨場景（§6.5-10）與 2.5D 教室 `scn.academy_classroom`（新訓日）；小遊戲的領域資料放進 `content/minigames.ts` 的 `rules`（03 §7.1）。內容撰寫軌道開始（序章～第一章，§15 共通規則 2）。
**Success Criteria**：
- 一個完整的 `full` 關鍵日實測 2.5～4 分鐘（02 §2.2 預估中位數 166 秒；記錄實測值，依 02 §2.3 的調整規則重算 `realMsPerGameMinute`）。取不到 ≥2 位測試者時：實作者自測 ≥10 天、倍率維持 150，**暫定通過（待人工驗收）**。
- 手機（2021 中階機）班中 ≥30 fps、桌機內顯 ≥60 fps。沒有實機時：Chrome DevTools CPU 4× 降速下班中 ≥30 fps，**暫定通過（待人工驗收）**。
- L3、L4 都能完整玩一天。
- 場景來回切換 10 次後 GPU 記憶體回到基準。
**Tests**：4 個小遊戲邏輯（03 各節 X.11：成績、成敗、時間成本、疲勞與壓力變難、同種子結果相同）；`difficulty`、`procgen`；`minigame_rewards`（換算表、教學只套正值、KPI 排除）；`workday`（02 §13.2：每小時效果、主管好感當日上限 +4、自動完成任務、睡眠回復 45／39／23）；`navigation`（牆邊滑動、障礙、hotspot 距離）；`camera_director`（插值、減少動態直接到終點）；`quality`（降級決策表）；`static_batcher`（合併後網格數）；整合 `scene_hotspots`。
**Status**：Not Started

### Stage 4：快轉、經濟、考績、存檔
**Goal**：`fast_forward`（02 §5：方針轉盤只在區塊開始、`planSegment`、`tiny` 分段、模擬前判定插播、「拚」的健康債遞增、快轉 on-call）、`economy`（02 §1.8 的日曆掛鉤與月結、房租、薪資、加班費、季分紅、年終 1/20、薪資單）、`review`（02 §7：試用期考核、9 位 NPC、強制分配、風向期、黑歷史本 PS 修正、申訴、PIP）；`persistence` 全部（codec、guard、migrations 框架、repository、設定、meta、匯出匯入）；自動存檔與手動存檔；UI 的 `phone`、`policy_dial_page`、`montage_page`、`micro_event_toast`、`review_sheet_page`、`payslip_page`、`save_slots_page`、`settings_page`。
**Success Criteria**：
- 從 2027-03-01 用「穩」方針快轉到 2028-01 年度考績，薪資單金額與依 GDD §9.3 手算的結果一致。
- 存檔 → 讀檔 → 繼續，跟不中斷的結果完全相同。
- 6 種壞檔（parse、format、checksum、versionTooNew、shape、contentMismatch）都顯示正確的錯誤卡，而且不會自動刪檔。
- 停用 localStorage 時遊戲可玩，並顯示「本次存檔不會保留」。
**Tests**：`economy`（02 §7.11 案例 A、B：預扣 8%、季分紅 = 月薪 × 3.5 × 倍率、試用期不發、6 月起 ×1.0）；`review`（02 §13.3 與 §7.11 案例 C：強制分配名額、全員 PS ≥55 仍有 D、PS <40 給 X、平手時玩家排後面）；`fast_forward`（週效果 1/4、`tiny` 分段不消耗 RNG、插播每月 1 次、5 號跨越產生薪資單）；`save_codec`（checksum 不符被拒）；`save_guard`（每種壞檔）；`migrations`（用假的 v0 → v1 驗證框架）；整合 `save_roundtrip`。
**Status**：Not Started

### Stage 5：MVP 內容、結局、§13 安全處理、驗收
**Goal**：GDD §15.1 的全部內容：21 個關鍵日、約 20 個事件（#1、3、4、5、7、8、10、11、12、13、14、16、17、18、19、20、21、22、23、32）加上子事件、微事件、日常隨機池；8 位角色的 SVG 立繪與表情差分（04 §8）＋主角頭像 2 版（全部由實作者產出，換掉所有佔位檔）；MVP 6 個結局（E09、E10 簡版 PIP、E12、E13 簡版、E21、E17mvp）與結局插圖；GDD §13 全部（內容提示、停下來序列、求助資訊卡、身心警訊的關心對話、勞權小知識卡；`thresholds` 的安全事件）；設定頁全部選項；無障礙走查；效能驗收；`content_balance` 對全部 MVP 事件綠燈（先用調校權調數值，§13.5；若有新的豁免必須在 `docs/issues.md` 開號）；建立 `docs/balance-changelog.md`。
**Success Criteria**：
- `playthrough.test.ts` 3 個種子都抵達 MVP 結局、沒有例外、劇本關鍵日 21 個。
- 人工驗收 §13.6 全部項目通過；GDD §13 逐條勾選。
- 2 位測試者實測一輪 50～60 分鐘（GDD §15.1；02 §2.7 預估 59.3 分）。取不到測試者時以實作者自測＋02 §2.7 的預算表暫定通過（待人工驗收）。
- 業界審核（00-index §7 #1：內容資料裡的情境、正確順序、危險指令、OCAP 小卡、Hold Lot 案例）與敏感審稿（#2）完成；取不到審稿人時暫定通過（待人工驗收），審核後的修改只動內容與測試期望值。
- 立繪、主角頭像、結局插圖的佔位數為 0（`portrait_assets.test.ts` 的 Stage 5 出口斷言：沒有任何 `data-placeholder="true"`）。
- 沒有不帶 issue 編號的 TODO；待人工驗收清單已清空後，`IMPLEMENTATION_PLAN.md` 刪除（清單未清空時保留，只留清單）。
**Tests**：整合 `content_integrity`、`content_balance`、`playthrough`、`portrait_assets`；`endings`（中途結局監看、期滿判定順序、覆蓋規則）；安全事件（精神歸零 → 停下來序列；第二次歸零 → E12；`calm` 氛圍關閉所有特效）；台詞檢查（求助專線、沒有「GAME OVER」）。
**Status**：Not Started

### MVP 之後（不在 MVP 範圍，先列出以便提醒）

| 階段 | 內容 | ⚠ 需要提醒使用者的事 |
|---|---|---|
| **Stage 6：角色換成骨架模型** | 新增 `render/characters/gltf_character.ts`（`GLTFLoader`、`SkeletonUtils.clone`、`AnimationMixer`、動作名稱對照）、`normalExtrude` 描邊、`public/models/` 與授權紀錄；`CharacterAppearance.modelRef` 開始有值；重新做效能驗收。呼叫端不需要修改（§9.6） | **到這個階段時要提醒使用者**：角色要從程式拼的 Q 版人形換成 CC0 骨架模型（例如 Quaternius），請使用者確認要用哪一套模型包，以及風格是否需要調整 |
| **Stage 7：Blender headless 管線**（選用） | `scripts/blender/` 的 Python 腳本，用 `blender -b -P <腳本>` 批次處理模型：改色、合併網格、減面、統一比例、匯出 glTF | **這個階段需要在本機安裝 Blender**（建議 LTS 版本）。到這個階段時要提醒使用者安裝；MVP 與 Stage 6 都不需要 Blender |
| Stage 8 起：完整版 | 第四、五章、12 個小遊戲、21 個結局、成就與圖鑑、工時申報、健檢報告（由 02、03 規格書展開）。延後到這裡合併的變更請求（00-index §4）：02/CR-13 `Condition.choiceTally`、03/CR-10 著裝連續全對、03/CR-12 8 個新 `MinigameId`＋`caseFile`＋`snapshot`；同時重新評估 02/CR-07、02/CR-12（系統計數器升級成具名欄位） | — |

## Stage 1 執行紀錄

計畫全文：`docs/superpowers/plans/2026-10-24-stage1-foundation.md`

### 決定紀錄

- 2026-10-24 TypeScript：`bun install` 解析到 `typescript@7.0.2`，`tsc --version` 為 7.0.2，`bun run typecheck` 0 錯誤，不觸發退路規則（a）～（d），維持 7.0.2。
- 2026-10-24 Biome：2.5.15 接受 01 §14.4 的 `biome.json`，沒有設定錯誤；只有 info 層級提示（`linter.rules.recommended` 已棄用、建議改 `preset`），不阻擋，設定維持原文。
- 2026-10-24 紅燈示範（打包檢查擋下除錯面板）：規則是標記必須被面板一定會執行的程式碼引用（dev_panel.ts 模組層級副作用 `document.documentElement.dataset['devPanel'] = DEV_PANEL_MARKER`），否則 tree-shaking 會移除它而檢查漏報。照原文只加 `import './app/dev_panel';` 後 `bun run build` 輸出：`dist check failed: dev panel marker found: file=assets/index-CShtIfB2.js`；移除該行後回到 PASS。
- 2026-10-24 `scripts/check_dist.ts` 在 Windows 上把 `Bun.Glob` 回傳的反斜線路徑轉成 `/`，訊息才與計畫的 `assets/….js` 格式一致。
- 2026-10-25 紅燈示範（分層 import 規則）：暫時加入 `src/core/arch_probe.ts`（`import { Vector3 } from 'three';`）後 `bun test test/architecture.test.ts` 輸出 `"detail": "core may not import package three", "file": "src/core/arch_probe.ts"`（`every import respects the layer rules of spec 01 section 4.2` FAIL），`bun run check` 的 `lint/style/noRestrictedImports` 同時報同一行；刪除該檔後 19 個測試全數 PASS。
- 2026-10-25 `test/architecture.test.ts` 的 `stripCommentsAndStrings` 回傳與原文等長的字串（註解與字串內容換成空白、換行保留），讓 `importsOf` 能用遮罩後的位置回原文取 import 目標、行號也不位移。
- 2026-10-25 並排校準方法（04 §2.4）：headless Chrome（swiftshader WebGL）以 DevTools Protocol 設 1600×900、DPR 1、`prefers-reduced-motion: reduce`；參考頁 `design/style-c-toon.html`（r128 由 cdnjs 載入成功）注入 `#ui,.fx,.sfx,.styletag{display:none}` 後截圖；待測頁 `http://localhost:5173/?calib=1`。6 點座標見 `look.ts` 的 `CALIBRATION_SAMPLES`，每點 5×5 平均；下列差值為待測 − 參考（R,G,B），括號內為最大通道差。
- 2026-10-25 校準第 1 輪（方案 A 起始值，未改）：a 0,−90,−72（90）、b 0,−59,−53（59）、c 0,−86,−72（86）、d +182,+137,+123（182）、e 0,−41,−52（52）、f 0,0,0（0）；a～e 不合格。截圖 `design/calibration/stage1_round1.png`。
- 2026-10-25 校準第 2 輪（`hemisphere` 1.92 → 10.8）：a 0,−6,+5（6）、b 0,+2,+4（4）、c 0,−23,−14（23）、d +182,+194,+196（196）、e 0,0,0（0）、f 0,0,0（0）；c、d 不合格。截圖 `stage1_round2.png`。
- 2026-10-25 校準第 3 輪（`directional` 2.2 → 2.8）：a 0,−1,+10（10）、b 0,+7,+7（7）、c 0,−13,−5（13）、d +182,+194,+196（196）、e 0,0,0（0）、f 0,0,0（0）；c 差 1、d 不合格。截圖 `stage1_round3.png`。
- 2026-10-25 校準第 4 輪（紅點光不調：a 已合格；`photoBase` 61.5 → 92）：6 點與第 3 輪完全相同（黃光到不了 c），已還原成 61.5；最終值＝第 3 輪，畫面＝`stage1_round3.png`。截圖 `stage1_round4.png`。
- 2026-10-25 校準結論：3 輪後方案 A 仍有 c（綠差 13，門檻 12）與 d 不合格。d 不是光源差：範例與移植的地板格線／網點位置錯開，取樣點在範例落在黑格線上、在移植落在白磚上；在兩邊都是白磚的鄰近點 (0.5119, 0.7233) 量得差 0,0,0。方案 B 需要改 `render_host.ts`（`ColorManagement`、`outputColorSpace`）與 `canvas_textures.ts`（`colorSpace`），超出本 task 允許修改的範圍，**未套用**；以不提交的試驗量過一次 04 §2.4 的 B 備案值：a 22、b 25、c 29、d 196、e 0、f 0，比調整後的 A 差，因此不建議改 B、也不改 01 §9.9。未取樣區域的差異：遠處地板偏白（藍 +33）、天花板紅色偏暗（紅 −37），c 與這兩處需要使用者以人眼裁決。
- 2026-10-25 01 §13.6 視覺一致性清單（Stage 1 能量測的部分）：
  - 3 階明暗：機台各面的色帶結構與範例一致；校準機位低於機台頂，看不到頂面與底面 → 待人工驗收（`/` 頁面）。
  - 黑色描邊：與範例逐列比對相同（y＝450 掃描線各段黑線寬度完全一致，ET-03 左緣 7 px、ET-04 左緣 6 px）；預設機位 4 m 內沒有機台，「4 m 外 6～9 px」未直接量測。
  - 紅燈閃爍：關閉減少動態時 ET-03 紅燈（74,10,10 ↔ 255,32,32）、螢幕與天花板紅光同步交替，與範例一致；開啟減少動態時連續 4 張截圖逐像素相同且為亮相。頻率 1.7 Hz 由 `fab_bay.spec.ts` 的相位測試涵蓋（headless 的 rAF 節奏無法量 Hz）。暗相的牆面染紅比範例淡（待測 255,242,224、範例 255,206,195）→ 待人工驗收。
  - 黃光區琥珀色：取樣 f 差 0,0,0（196,153,21），不受紅光影響。通過。
  - 天車：關閉減少動態時連拍可見沿軌道移動；開啟時停在與範例相同的位置（z ＝ −2）。通過。
  - 漫畫面板與數值面板（`/` 頁面）：硬陰影、角落網點、傾斜、紅標題貼紙與範例一致；「危」紅斜紋在開局狀態不會出現（數值都高於門檻），未能並排 → 待人工驗收。
  - 手機版面：DevTools 模擬寬 390 px，HUD 與數值面板依 760 px 以下規則上下排列、左右 16 px、`scrollWidth` ＝ 390，沒有水平捲動，與範例 390 px 版面一致。通過。
  - 無 3D：Chrome 以 `--disable-webgl --disable-3d-apis` 啟動，`body[data-render="none"]`、HUD 與數值面板正常顯示、沒有未處理例外；本專案只輸出一行 `warn [render] webgl unavailable: detail=…`，但 three 本身在丟例外前另外印了 3 行 `console.error`（`A WebGL context could not be created…`）→ 「Console 只有一行」嚴格來說不符，待使用者裁決是否接受。
- 2026-10-25 Stage 1 收尾「範例值優先」（00 §2-3）的三處修正：①燈塔桿改用新色票 `toolPole: 0x222222`（範例 `style-c-toon.html` L560；原本誤用 `toolBlack` 0x111111）；②校準主角的臉改用新色票 `heroSkin: 0xf1c9a5`（範例 L597；原本用 `skinS2` 0xf6d6b8）；③地板貼圖重複改回範例的 24 × 100（範例 L431；原本為了真實 0.6 m 格板改成 21.67 × 166.67，04 §15 #10 撤回）。已同步 04 §1.6、§4.2、§5.1、§5.6、§15。
- 2026-10-25 校準第 5 輪（只改地板重複 24 × 100；光源常數不變，方法同上，參考圖沿用 `reference_r128.png`）：

  | 點 | 參考 RGB | 待測 RGB | 差 (R,G,B) | 最大差 | 門檻 | 結果 |
  |---|---|---|---|---|---|---|
  | a | 255,239,210 | 255,238,220 | 0,−1,+10 | 10 | 12 | 合格 |
  | b | 194,177,163 | 194,184,170 | 0,+7,+7 | 7 | 12 | 合格 |
  | c | 255,255,225 | 255,242,220 | 0,−13,−5 | 13 | 12 | 差 1 |
  | d | 73,61,59 | 89,77,73 | +16,+16,+14 | 16 | 12 | 差 4 |
  | e | 255,255,255 | 255,255,255 | 0,0,0 | 0 | 12 | 合格 |
  | f | 196,153,21 | 196,153,21 | 0,0,0 | 0 | 2 | 合格 |

  d 從 196 降到 16：格線與網點已與範例對齊（兩邊的取樣點都落在同一條黑格線的交叉處），剩下的差是格線邊緣的貼圖濾波（anisotropy 與 mip 取樣不同造成的反鋸齒邊色），不是光源差；鄰近白磚點 (0.5119, 0.7267) 差 0,0,0。地板區 (700,620)–(1000,760) 的平均絕對差從第 3 輪的 59.8,75.8,77.9 降到 3.5,4.2,3.6；全畫面從 25.8,29.6,30.5 降到 8.2,6.5,6.0。截圖 `design/calibration/stage1_round5.png`。
- 2026-10-25 預設光組（非校準）：`bayDay`／`bayNight` 維持 04 §2.4 公式換算值（半球 2.49／平行 1.67、半球 1.92／平行 1.02），只有 `bayAlarm` 用並排校準調出來的 10.8／2.8——範例只有告警場景，沒有日間／夜間可對照，套用校準值沒有依據。日間預設畫面截圖 `design/calibration/stage1_bay_day.png`（與第 5 輪同一次量測、`/`、減少動態），列入待人工驗收。

## 驗證器規則的 stage 分配（01 D81）

| 01 §8.6 類別 | Stage |
|---|---|
| ID、參照、節點圖、台詞（存在、孤兒、佔位符）、數值方向 | 1 |
| 選項、場景、觸發、數值、角色、出處、伏筆、台詞長度 warning | 2 |
| 小遊戲領域資料、小遊戲預設組 | 3 |
| 劇本、平衡、安全、台詞標記、GAME OVER 與求助專線 | 5 |

## Stage 1 內容暫缺（01 D65、D91）

- Hold Lot 量測列與留言、半夜電話逐句台詞（`docs/issues.md` #1，Stage 3）。
- `balance.minigameRewards`（Stage 3）。
- 工作方針「省」的「下班被叫住」（Stage 4）。
- 事件、劇本關鍵日、結局、任務、夜間行動（Stage 2／5）。

## 待人工驗收清單

| 項目 | 出處 | 代理量測的結果 | 需要誰 | 狀態 |
|---|---|---|---|---|
| Stage 1 並排校準（6 點取樣） | 01 §15 Stage 1、04 §2.4 | 方案 A 調 3 輪（半球光 10.8、平行光 2.8）＋第 5 輪地板重複改回 24 × 100：a 10、b 7、c 13、d 16（格線已對齊，剩邊緣濾波差；鄰近白磚 0）、e 0、f 0；c 超門檻 1、d 超門檻 4 但非光源差；方案 B 需改 render 程式碼未套用（試驗值更差）。截圖 `design/calibration/stage1_round5.png` | 使用者 | 暫定通過（待人工驗收） |
| Stage 1 視覺一致性清單 | 01 §13.6 | 自動測試涵蓋：閃爍相位、紅燈錨點、光組選擇、預算；headless 量測：描邊、黃光區、天車、減少動態、390 px 版面、無 3D 通過；待人眼：頂／底面明暗、暗相染紅程度、「危」斜紋、three 的 3 行 console.error | 使用者 | 暫定通過（待人工驗收） |
| 預設 bay 日間／夜間光組（範例沒有對照） | 04 §2.4、§3.2 | `bayDay`／`bayNight` 用公式換算值，無法並排；日間截圖 `design/calibration/stage1_bay_day.png` | 使用者（人眼看 `/`） | 待人工驗收 |
