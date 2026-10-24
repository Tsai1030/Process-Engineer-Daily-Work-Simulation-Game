# Issues

`#N` 流水號；建立遠端 issue 追蹤後加一欄對照，不重新編號（01 §2.3、D57）。

| # | 標題 | 狀態 | 關聯檔案 |
|---|---|---|---|
| #1 | Hold Lot 量測列與留言、半夜電話逐句台詞待撰寫（03 §5.5、§6.4） | open | src/content/minigames.ts |
| #2 | `scn.fab_bay` 約 278 個 mesh，超過 70 個 draw call 預算（01 §9.7、04 §4.1）；Stage 3 的 `static_batcher`＋`InstancedMesh` 必須把它壓進預算，並補上 04 §4 要求的 mesh 數斷言；04 §3 固定光源數量，所以 quality tier 在手機上要把 `staging_light`（第 3 盞固定點光源）強度歸零（負責：Stage 3） | open | src/render/scenes/fab_bay.ts |
| #3 | Stage 1 最終審查延到 Stage 2 的小項：`event_bus` 的 `off()` 會一併移除同一函式的重複訂閱（記錄或修正）；`content_validator` 補菱形節點圖測試與「同一事件內重複伏筆 ID」測試；`architecture.test.ts` 補分層／檔名／禁用全域的自我測試，並讓 `stripCommentsAndStrings` 處理正規表示式字面值；`fx.css` 不得重複 `comic.css` 的減少動態區塊；`comic.css` 的 rgba 色票變體要登記成 token；`view_models.ts` 的 `lowBadge` 註解改成 04 §9.7、「≤」（負責：Stage 2） | open | src/utils/event_bus.ts、src/core/content_validator.spec.ts、test/architecture.test.ts、src/ui/ |
| #4 | Stage 1 最終審查延到 Stage 3 的小項：`blendRig` 把 `calmPaper` 的 null 光源當成強度 0；toon kit 銷毀後再使用要擋下、resource tracker 單一 `dispose()` 丟錯時仍要釋放其餘資源；context restore 重建失敗要寫 log；機台閃爍不要每次切換都設 `needsUpdate`；FOUP `setState` 不要重新配置幾何、初始 down 預先建立反相貼圖；toon kit 以場景貼圖為鍵的材質快取在場景重建後會殘留（帶貼圖的材質改由場景持有）；`check_dist` 掃描加 `dot: true`；03 §7.2 新訓日著裝的「進入點」欄位（負責：Stage 3） | open | src/render/、scripts/check_dist.ts、docs/specs/03-minigames.md |
