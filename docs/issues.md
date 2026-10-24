# Issues

`#N` 流水號；建立遠端 issue 追蹤後加一欄對照，不重新編號（01 §2.3、D57）。

| # | 標題 | 狀態 | 關聯檔案 |
|---|---|---|---|
| #1 | Hold Lot 量測列與留言、半夜電話逐句台詞待撰寫（03 §5.5、§6.4） | open | src/content/minigames.ts |
| #2 | `scn.fab_bay` 約 278 個 mesh，超過 70 個 draw call 預算（01 §9.7、04 §4.1）；Stage 3 的 `static_batcher`＋`InstancedMesh` 必須把它壓進預算，並補上 04 §4 要求的 mesh 數斷言；04 §3 固定光源數量，所以 quality tier 在手機上要把 `staging_light`（第 3 盞固定點光源）強度歸零（負責：Stage 3） | open | src/render/scenes/fab_bay.ts |
