# 工程規格書 04：美術、3D 場景與 UI

> **文件定位**：本書是 `src/render/`、`src/ui/`、`src/audio/` 與 `src/assets/` 的**視覺與聽覺規格**。01 定義結構、介面與預算；本書定義「長什麼樣子、多少數值、什麼不能做」。讀完應該能做出跟 `design/style-c-toon.html`（風格 C「卡通渲染劇場」）一致的場景與畫面。
>
> **唯一真相來源**：視覺以 `design/style-c-toon.html` 為準（以下簡稱「範例」）。本書所有數值，凡是標「範例值」的，都是從範例原始碼逐項抄出來的；凡是標「新增」的，是本書依範例風格延伸設計的。
>
> **依據文件**：`CLAUDE.md`、`docs/planning/game-design-doc.md`（GDD）、`docs/research/fab-domain.md`（FD）、`docs/specs/01-architecture.md`（01）。型別與模組名稱一律沿用 01 §5、§9、§10、§18；本書**不重新定義**任何 01 已有的型別。01 不足的地方列在 §14「對 01 的變更請求」。
>
> **範圍界線**：遊戲規則、數值、事件內容屬於 02；小遊戲各自的版面與互動屬於 03。本書提供 03 必須遵守的共用視覺規範與元件樣式（§9.4、§9.27），與 02／03 的配合點列在 §13。
>
> **版本**：v1.3（2026-10-24：同步 00 §9.3 N1——§4.5；PALETTE 加 ink／paper／grey（01 D69）；天車吊架 4 支（01 D70））。v1.2（2026-10-24）：套用審查回合 1 的 lead 裁決（`00-index.md` §9）——新增 2.5D 背景 `scn.academy_classroom`（§4.5）、老K 改為 MVP 文字角色 `chr.lao_k` 與通用講師圖示（§6.4、§8.5）、立繪佔位 SVG 規則與 Stage 5 佔位數 0（§8.1、§12）。v1.1（2026-10-24）：§14 的變更請求已由 01 v1.1 裁決並合併（裁決見 `00-index.md` §4）；機台黃燈改名 `warn`；§13 已與 02 附錄 B.2 雙向對齊；阿哲新增 `concerned` 表情；montage 總長改 ≤3 s；HUD 時鐘 5 分一跳；考績單、獎金單、轉盤鎖住、免人情小章、勞權卡的樣式依整合結果補齊。
>
> **記號**：「L0～L4」是 01 §9.7 的降級階梯；長度單位一律公尺（m）；角度未註明時為度（°）；色碼一律 6 位小寫十六進位。

---

## 目錄

- [0. 一頁摘要](#0-一頁摘要)
- [1. 風格聖經](#1-風格聖經)
  - 1.1 風格一句話與四條原則 · 1.2 色票 · 1.3 字體與字級 · 1.4 線條、陰影、邊框、網點、傾斜 · 1.5 `tokens.css` 完整內容 · 1.6 3D 調色盤 · 1.7 什麼不能做
- [2. 卡通渲染技術規格](#2-卡通渲染技術規格)
  - 2.1 renderer 設定 · 2.2 gradientMap · 2.3 外描邊 · 2.4 r128 → 0.186 色彩與光源校準 · 2.5 霧 · 2.6 後製 · 2.7 CanvasTexture 規則 · 2.8 模組放置
- [3. 氛圍與光色預設](#3-氛圍與光色預設)
  - 3.1 光色是怎麼決定的 · 3.2 基礎光組 · 3.3 疊加光組 · 3.4 `PresentationMood` 對照 · 3.5 特效開關矩陣 · 3.6 轉場
- [4. 3D 場景規格](#4-3d-場景規格)
  - 4.1 共通規則 · 4.2 `scn.fab_bay` · 4.3 `scn.gowning_room` · 4.4 `scn.office` · 4.5 2.5D 背景 · 4.6 L4 靜態背景 · 4.7 完整版場景清單
- [5. 道具目錄](#5-道具目錄)
- [6. Q 版人物規格](#6-q-版人物規格)
- [7. 相機演出系統](#7-相機演出系統)
- [8. 立繪規格](#8-立繪規格)
- [9. UI 畫面規格](#9-ui-畫面規格)
- [10. 聲音規格](#10-聲音規格)
- [11. 無障礙與在地化](#11-無障礙與在地化)
- [12. 美術資產驗收清單](#12-美術資產驗收清單)
- [13. 與 02／03 的介面點](#13-與-0203-的介面點)
- [14. 對 01 的變更請求](#14-對-01-的變更請求)
- [15. 「我的決定」清單](#15-我的決定清單)

---

## 0. 一頁摘要

| 主題 | 結論 |
|---|---|
| 風格 | 「紙白＋墨黑＋警示紅＋黃」四色為主；粗黑描邊、硬陰影、手繪不規則圓角、網點、速度線、狀聲字。漫畫誇張只用在**體制與加害者**身上（P4）。 |
| 3D 著色 | `MeshToonMaterial` ＋ 3 階 `gradientMap`；`BackSide` 外描邊（hull）；不用陰影貼圖、不用後製、不用 PBR。 |
| r128 → 0.186 | 採標準線性流程（01 §9.9）。gradientMap 改成 `[23, 96, 255]`；半球光、平行光強度 ×π 並做 2.2 次方換算；點光源改 `decay = 1` 並以參考距離換算（紅燈 down 時亮 60.6／暗 5.78）。所有 CanvasTexture 設 `SRGBColorSpace`。並排比對的驗收門檻：6 個取樣點 RGB 差 ≤12/255。 |
| 氛圍 | `PresentationMood`（4 值）＋場景＋機台狀態＋玩家所在區域＋鏡頭，決定 8 組基礎光組（含 `calmPaper`）與 4 組疊加光組。`calm`（停下來）優先於一切，關閉所有特效。 |
| MVP 3D 場景 | `scn.fab_bay`（蝕刻 bay＋黃光區入口）、`scn.gowning_room`（更衣室＋風淋室）、`scn.office`（工程師辦公室＋會議角）。場景 draw call 估計：fab bay 約 51、辦公室約 44、更衣室約 28（場景上限 桌機 70／手機 50；01 全域預算 120／60）；三角形各 ≤32,000。 |
| 人物 | 程式拼裝的 Q 版人形，約 3.1 頭身、身高 1.70 m；以剛性權重的 `SkinnedMesh` 合併成「本體＋描邊」2 個 draw call；fab 內靠頭罩名牌（顏色＋單字）辨識。 |
| 立繪 | MVP 8 位、47 個表情差分＋主角頭像 2 版 × 4；SVG viewBox `0 0 240 320`，表情以 `g.expr` 群組切換。 |
| UI | 範例的 `.panel`／`.talk`／`.choice`／`.chip` 系統化成 tokens 與 33 個畫面規格（MVP 29 個）；手機斷點 760px。敏感畫面（停下來、求助卡）**拿掉所有漫畫元素**。 |
| 聲音 | 全部 Web Audio 程式合成：FFU 底噪（褐噪音＋120 Hz 交流聲）、20 個 SFX 配方（11 個新增）、極簡程式 BGM（可降級為無 BGM）。 |
| 對 01 的變更請求 | 19 項，全部是**新增欄位或列舉值**，不刪改既有定義（§14）。 |

---

## 1. 風格聖經

### 1.1 風格一句話與四條原則

> **「漫畫週刊的單色印刷，被一盞警示紅燈和一片黃光照亮。」**

1. **紙與墨**：底色是偏暖的紙白 `#fffdf4`，線條是墨黑 `#0a0a0a`。畫面上任何一個 UI 元素都必須有墨黑外框。
2. **兩個訊號色**：紅 `#e60012` 只代表「危險、壓迫、負面、加害者」；黃 `#ffd400` 只代表「注意、焦點、正面、被選中」。不准拿它們當裝飾色。
3. **印刷感**：陰影是**硬邊位移**（沒有模糊），明暗是**網點**與**三階色塊**（沒有平滑漸層），邊框是**手繪的不規則圓角**。
4. **誇張要選對象**：速度線、放射線、狀聲字、立繪反光，都只用在體制的荒謬與加害者身上；主角的痛苦用安靜的方式呈現（降飽和、內心獨白、留白）。這是 GDD P4 在視覺上的落實。

### 1.2 色票

**UI 色票（CSS 變數）**

| 變數 | 值 | 來源 | 用途 | 禁止用途 |
|---|---|---|---|---|
| `--ink` | `#0a0a0a` | 範例值 | 所有外框、文字、硬陰影、`.chip.pos` 底色 | — |
| `--paper` | `#fffdf4` | 範例值 | 面板底色、反白文字 | — |
| `--red` | `#e60012` | 範例值 | 危、負面 chip、PUA、警報、說話者牌（結果框）、紅印章 | 正面回饋、一般裝飾 |
| `--red-deep` | `#9d000d` | 範例值（`.row.low .bar` 斜紋） | 危險斜紋的暗色 | 文字 |
| `--yellow` | `#ffd400` | 範例值 | 焦點外框、hover、正面 chip 文字、時鐘數字、狀聲字 | 紙白底上的文字（對比 1.4:1） |
| `--grey` | `#d9d6cc` | 範例值 | 數值條底的斜紋、鎖卡斜紋、停用 | 文字 |
| `--white` | `#ffffff` | 範例值（`.talk.result`） | 結果框底、硬幣空位 | — |
| `--ink-soft` | `#5a574f` | 新增 | 內心獨白、次要說明（對紙白 7.1:1） | 主要台詞 |
| `--paper-calm` | `#f4efe3` | 新增 | 「停下來」序列與求助卡的米白紙色 | 一般畫面 |
| `--ink-calm` | `#34322d` | 新增 | 安靜模式的文字（比墨黑柔和，對 `--paper-calm` 11.2:1） | 一般畫面 |
| `--stage` | `#1a0407` | 範例值（`body` 背景） | canvas 未載入前的底色 | — |
| `--screen-run` | `#2bd45a` | 範例值 | 機台螢幕 RUN、手機在線點 | 正面 chip（正面一律用黃） |
| `--screen-warn` | `#ffd400` | 範例值（範例名 `idle`） | 機台螢幕 WARN（`MachineStatus` `'warn'`，01 v1.1） | — |
| `--screen-down` | `#e60012` | 範例值 | 機台螢幕 ALARM | — |
| `--glove` | `#2a6fe0` | 範例值（無塵手套） | 無塵衣的藍色點綴、手機「工作機」藍標 | UI 正負訊號 |
| `--amber` | `#ffd21a` | 範例值（黃光區牆） | 黃光區相關 UI 標示 | 一般 hover |

**狀態對照（語意 token）**

| 語意 | 底 | 字 | 框 | 例 |
|---|---|---|---|---|
| 正面（pos） | `--ink` | `--yellow` | `--ink` | `.chip.pos`、`.delta.pos` |
| 負面（neg） | `--red` | `--paper` | `--ink` | `.chip.neg`、「危」 |
| 焦點／hover | `--yellow` | `--ink` | `--ink` | `.choice:hover`、`:focus-visible` 外框 |
| 鎖定 | `--grey` 斜紋 | `--ink-soft` | `--ink` 虛線 | 鎖卡 |
| 安靜（calm） | `--paper-calm` | `--ink-calm` | `--ink-calm` 2px | 求助卡、停下來 |

**角色名牌色（頭罩名牌、手機頭像外框、立繪名牌底下的小色塊共用）**

| 角色 | 名牌底色 | 字 | 名牌上的單字 | 色盲輔助 |
|---|---|---|---|---|
| 主角 | `#ffd400` | `--ink` | 姓名第一個字 | 頭頂名字一律顯示「你」 |
| 林課長 `chr.lin` | `#e60012` | `--paper` | 林 | 名牌加白色上邊線 |
| 阿哲 `chr.azhe` | `#2a6fe0` | `--paper` | 哲 | — |
| 小晴 `chr.xiaoqing` | `#ff8a00` | `--ink` | 晴 | — |
| 豪哥 `chr.haoge` | `#1f9e4a` | `--paper` | 豪 | 名牌加兩條白斜線 |
| 美玲姐 `chr.meiling` | `#8e44ad` | `--paper` | 玲 | — |
| Vivian `chr.vivian` | `#e8318a` | `--paper` | V | — |
| 沈部經理 `chr.shen` | `#0a0a0a` | `#c9a227` | 沈 | 金色上下邊線 |
| 無名 NPC（技術員等） | `#9aa3ad` | `--ink` | 無 | — |

> 紅（林）與綠（豪哥）在紅綠色盲下容易混淆，所以兩者都另加圖樣，而且名牌永遠有單字。名牌顏色寫進 `CharacterAppearance.badgeColor`（§13）。

### 1.3 字體與字級

| 變數 | 值 | 用途 |
|---|---|---|
| `--f-body` | `"LXGW WenKai TC","Noto Serif TC","Microsoft JhengHei","PingFang TC","Heiti TC","Noto Sans CJK TC",sans-serif`（範例值） | 台詞、旁白、內心獨白、說明文字（手寫感） |
| `--f-head` | `"Noto Sans TC","Microsoft JhengHei","PingFang TC","Heiti TC","Noto Sans CJK TC",Arial,sans-serif`（範例值） | 標題、數字、按鈕、chip、名牌、狀聲字（900 粗黑） |
| `--f-calm` | `"Noto Sans TC","Microsoft JhengHei","PingFang TC",sans-serif`，字重 500 | 「停下來」序列、求助卡、內容提示（GDD §12.1「字體換成較安靜的版本」） |

- **字型載入**（範例值）：`LXGW WenKai TC` 400、700；`Noto Sans TC` 500、700、900；`display=swap`。不新增字重。
- **數字**：時鐘、數值、金額一律 `font-variant-numeric: tabular-nums`，避免跳動。

**字級表**（px；`clamp()` 的中間值是 vw）

| token | 桌機 | 手機 ≤760px | 字體／字重 | 用途 | 來源 |
|---|---|---|---|---|---|
| `--fs-sfx` | `clamp(28px,6vw,70px)` | 同（高度 ≤700 隱藏） | head 900 | 狀聲字主字 | 範例 `.sfx` |
| `--fs-clock` | `clamp(26px,3.4vw,38px)` | 22 | head 900 | HUD 時鐘 | 範例 |
| `--fs-idx` | 34 | 28 | head 900 | 選項卡「壹貳參肆」 | 範例 |
| `--fs-h1` | `clamp(28px,4vw,44px)` | 26 | head 900 | 頁面標題（考績單、結局卡） | 新增 |
| `--fs-h2` | 22 | 18 | head 900 | 區塊標題、存款金額 | 範例 `.money .num` |
| `--fs-line` | `clamp(17px,1.9vw,21px)` | 15 | body 700 | 對話台詞 | 範例 `.talk p` |
| `--fs-card` | `clamp(17px,1.8vw,21px)` | 16 | head 900 | 選項卡標題 | 範例 `.choice .ttl` |
| `--fs-name` | 17 | 12～14 | head 900 | 說話者牌、立繪名牌 | 範例 |
| `--fs-ui` | 15 | 14 | head 700 | 按鈕、清單、設定 | 新增 |
| `--fs-label` | 14 | 12 | head 900 | 數值名稱 | 範例 `.row .lab` |
| `--fs-chip` | 13 | 13 | head 900 | chip | 範例 |
| `--fs-inner` | 15 | 14 | body 400 | 內心獨白 | 新增 |
| `--fs-min` | 12 | 12 | — | **任何有意義文字的下限** | 新增（範例的 11px 小字一律提升到 12px） |

- **行高**：台詞 1.65（手機 1.55，範例值）；標題 1.25；UI 1.35；安靜模式 1.8。
- **字距**：名牌與標籤 `letter-spacing: .1em～.2em`（範例值）；正文 0。
- **文字放大設定**：所有字級乘上 `--text-scale`（1／1.15／1.3），見 §11.2、§14 CR-09。

### 1.4 線條、陰影、邊框、網點、傾斜

**線條粗細**（px）

| token | 值 | 用途（範例出處） |
|---|---|---|
| `--bw-hair` | 2 | 次要分隔、樣式標籤（`.styletag`） |
| `--bw-thin` | 3 | 數值條、chip、名牌、說話者牌、硬幣、手機版數值條改 2 |
| `--bw` | 4 | 面板（`.panel`）、按鈕（`.reset`）、立繪框 |
| `--bw-thick` | 5 | 選項卡（`.choice`） |
| `--bw-double` | 7 | 結果框雙線（`.talk.result`） |
| `--ts-s`／`--ts-m`／`--ts-l` | 3／5／9 | `-webkit-text-stroke`：選項編號／浮字與副標／狀聲字主字（手機 6） |

- 文字描邊一律搭配 `paint-order: stroke fill`（範例值），否則筆畫會被吃掉。
- **正文、台詞、按鈕文字不准加描邊**；描邊只用在 ≥17px 的裝飾性大字（狀聲字、編號、浮字）。

**硬陰影**（一律 0 模糊）

| token | 值 | 用途 |
|---|---|---|
| `--sh-s` | `3px 3px 0 var(--ink)` | 名牌、紅標題貼紙 |
| `--sh-m` | `4px 4px 0 var(--ink)` | 按鈕 |
| `--sh` | `6px 6px 0 var(--ink)` | 面板、選項卡、立繪框 |
| `--sh-l` | `10px 10px 0 var(--ink)` | 選項卡 hover |
| `--sh-press` | `1px 1px 0 var(--ink)`（按鈕）／`2px 2px 0`（卡） | `:active` 按下 |
| `--sh-red` | `5px 5px 0 var(--red)` | 職等牌 |
| `--sh-red-s` | `3px 3px 0 var(--red)` | 立繪名牌 |

- 按下（`:active`）＝往陰影方向位移、陰影縮短（範例：`translate(3px,3px)`／`translate(4px,4px)`）。
- 手機版選項卡陰影降為 `4px 4px 0`（範例值）。

**手繪邊框（不規則圓角）**

| token | 值 | 用途 |
|---|---|---|
| `--r-panel` | `6px 14px 8px 12px / 12px 6px 14px 8px` | `.panel`（範例值） |
| `--r-bubble` | `30px 12px 28px 10px / 14px 26px 12px 28px` | 對話框（範例值） |
| `--r-frame` | `6px` | 立繪框、手機外框內 |
| `--r-chip` | `3px` | chip、數值條、「危」 |
| `--r-doc` | `4px` | 結果框、文件（考績單、薪資單） |
| `--r-round` | `50%` | 硬幣、時鐘圓點 |

- 不准使用對稱的大圓角（膠囊按鈕、`border-radius: 999px`）。

**網點**（halftone；一律用 `radial-gradient`，不用圖片）

| token | 點 | 間距 | 不透明度 | 遮罩 | 用途 |
|---|---|---|---|---|---|
| 面板角落網點 | 墨 50%，實心半徑 1.1px，邊緣 1.6px | 6px | 1 | `linear-gradient(to top left,#000,transparent 42%)` | `.panel::after`（範例值）：右下角網點陰影 |
| 選項卡角落網點 | 墨 80%，1.6px／2.2px | 7px | .5 | 圓形 90px，右上角外露 | `.choice::before`（範例值） |
| 全畫面網點（`dots`） | 墨，28%／31% | 7px | .38 | `radial-gradient(ellipse at 50% 45%,transparent 45%,#000 100%)` | `fx-dots`（範例值），畫面四周 |
| 亮點網點（`sparkleDots`，新增） | 紙白，28%／31% | 9px | .55 | 同上 | 被肯定時取代黑網點 |
| 立繪網點 | 墨圓 r=1.4 | 6px（SVG pattern） | .3（臉）／.55（衣服陰影） | — | 立繪陰影面（範例 `lin-dots`） |
| 3D 牆板網點 | 墨 45%，r=1.6 | 8px | — | 牆板下緣 66 px 帶狀 | 範例 `wallTex` |

- 網點密度規則：**越靠近畫面邊緣越密、越靠近焦點越疏**（全畫面網點的遮罩做法）。不准在台詞文字後面放網點。

**傾斜**（漫畫手作感；只用小角度）

| 元素 | 角度 | 來源 |
|---|---|---|
| HUD 面板 | −1.2° | 範例值 |
| 職等牌 | +0.8° | 範例值 |
| 數值面板 | +0.7°（手機 0） | 範例值 |
| 紅標題貼紙 | −3° | 範例值 |
| 立繪名牌 | −3° | 範例值 |
| 說話者牌 | `skew(-8deg)` | 範例值 |
| 選項卡 1／2／3／4 | −0.9° ／ +0.5°＋下移 3px ／ −0.4° ／ +0.7°（新增） | 範例值＋新增 |
| 按鈕 | −1.5° | 範例值 |
| 狀聲字 | −9° | 範例值 |

- 安靜模式（§3.4 `calm`）所有傾斜歸 0。

### 1.5 `tokens.css` 完整內容

`src/ui/styles/tokens.css`（01 §3、§10.1）。其他 CSS 只能引用變數，不准寫死色碼（例外：`fx.css` 的 `rgba()` 透明度變體，需註明對應的 token）。

```css
/* src/ui/styles/tokens.css — 風格 C 設計 token（04 §1） */
@import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400;700&family=Noto+Sans+TC:wght@500;700;900&display=swap');

:root {
  /* 色票 */
  --ink: #0a0a0a;
  --paper: #fffdf4;
  --red: #e60012;
  --red-deep: #9d000d;
  --yellow: #ffd400;
  --grey: #d9d6cc;
  --white: #ffffff;
  --ink-soft: #5a574f;
  --paper-calm: #f4efe3;
  --ink-calm: #34322d;
  --stage: #1a0407;
  --screen-run: #2bd45a;
  --screen-warn: #ffd400;
  --screen-down: #e60012;
  --glove: #2a6fe0;
  --amber: #ffd21a;

  /* 字體 */
  --f-body: "LXGW WenKai TC", "Noto Serif TC", "Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans CJK TC", sans-serif;
  --f-head: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", "Heiti TC", "Noto Sans CJK TC", Arial, sans-serif;
  --f-calm: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif;

  /* 字級（--text-scale 由 settings 設定：1 | 1.15 | 1.3） */
  --text-scale: 1;
  --fs-sfx: calc(clamp(28px, 6vw, 70px) * var(--text-scale));
  --fs-clock: calc(clamp(26px, 3.4vw, 38px) * var(--text-scale));
  --fs-idx: calc(34px * var(--text-scale));
  --fs-h1: calc(clamp(28px, 4vw, 44px) * var(--text-scale));
  --fs-h2: calc(22px * var(--text-scale));
  --fs-line: calc(clamp(17px, 1.9vw, 21px) * var(--text-scale));
  --fs-card: calc(clamp(17px, 1.8vw, 21px) * var(--text-scale));
  --fs-name: calc(17px * var(--text-scale));
  --fs-ui: calc(15px * var(--text-scale));
  --fs-label: calc(14px * var(--text-scale));
  --fs-chip: calc(13px * var(--text-scale));
  --fs-inner: calc(15px * var(--text-scale));
  --fs-min: calc(12px * var(--text-scale));
  --lh-line: 1.65;
  --lh-ui: 1.35;
  --lh-calm: 1.8;

  /* 線條 */
  --bw-hair: 2px;
  --bw-thin: 3px;
  --bw: 4px;
  --bw-thick: 5px;
  --bw-double: 7px;
  --ts-s: 3px;
  --ts-m: 5px;
  --ts-l: 9px;

  /* 硬陰影 */
  --sh-s: 3px 3px 0 var(--ink);
  --sh-m: 4px 4px 0 var(--ink);
  --sh: 6px 6px 0 var(--ink);
  --sh-l: 10px 10px 0 var(--ink);
  --sh-red: 5px 5px 0 var(--red);
  --sh-red-s: 3px 3px 0 var(--red);

  /* 邊框形狀 */
  --r-panel: 6px 14px 8px 12px / 12px 6px 14px 8px;
  --r-bubble: 30px 12px 28px 10px / 14px 26px 12px 28px;
  --r-frame: 6px;
  --r-chip: 3px;
  --r-doc: 4px;

  /* 網點 */
  --dots-panel: radial-gradient(circle, rgba(10, 10, 10, .5) 1.1px, transparent 1.6px) 0 0 / 6px 6px;
  --dots-card: radial-gradient(circle, rgba(10, 10, 10, .8) 1.6px, transparent 2.2px) 0 0 / 7px 7px;
  --dots-fx: radial-gradient(circle, #000 28%, transparent 31%) 0 0 / 7px 7px;
  --dots-sparkle: radial-gradient(circle, #fffdf4 28%, transparent 31%) 0 0 / 9px 9px;

  /* 斜紋 */
  --stripe-bar: repeating-linear-gradient(135deg, #fff 0 4px, var(--grey) 4px 6px);
  --stripe-danger: repeating-linear-gradient(135deg, var(--red) 0 5px, var(--red-deep) 5px 8px);
  --stripe-locked: repeating-linear-gradient(135deg, var(--grey) 0 6px, var(--paper) 6px 12px);
  --stripe-hazard: repeating-linear-gradient(135deg, var(--yellow) 0 12px, var(--ink) 12px 24px);

  /* 動態（steps 是漫畫感的來源；減少動態時全部歸 0，見 fx.css） */
  --t-press: 120ms steps(2, end);
  --t-pop: 500ms steps(3, end);
  --t-panel-in: 240ms steps(3, end);
  --t-page: 200ms linear;
  --t-delta: 1700ms steps(10, end);
  --t-shake: 500ms steps(2, end);
  --t-alert: 1200ms steps(2, end);
  --t-calm-fade: 4000ms linear;

  /* 圖層 */
  --z-scene: 0;
  --z-fx: 1;
  --z-sfx: 2;
  --z-ui: 3;
  --z-overlay: 4;
  --z-modal: 5;
  --z-live: 6;

  /* 版面 */
  --gutter: 16px;
  --dialog-max: 1080px;
  --portrait-w: 230px;
  --portrait-w-m: 84px;
}

:root[data-text-scale="1.15"] { --text-scale: 1.15; }
:root[data-text-scale="1.3"] { --text-scale: 1.3; }
```

- 斷點只有一個：`@media (max-width: 760px)`（範例值），另有 `(max-width:760px) and (max-height:700px)` 隱藏狀聲字（範例值）。不新增斷點。

### 1.6 3D 調色盤

`src/render/look.ts`（新增檔案，見 §2.8、§14 CR-12）匯出 `PALETTE`。所有道具與場景只能用這張表的顏色；新增顏色要先加進表裡並在本節登記。

```ts
// src/render/look.ts（節錄）— 3D 調色盤；值為 sRGB 色碼，由 three 的色彩管理轉成線性
export const PALETTE = {
  // 建築（範例值）
  floorTile: 0xd8d6cc, floorHole: 0x1b1b1b, wallPanel: 0xefede6, ceiling: 0x3a3a3f,
  ceilingLamp: 0xffe6e0, ffuGrid: 0xc9c7c0, pillar: 0x111111, railSteel: 0x2d2d33,
  // 黃光區（範例值）
  photoWall: 0xffd21a, photoCeiling: 0xe0a800, photoFloor: 0xf2b800, photoGlass: 0xffe14d,
  photoTool: 0x2a2a2a, photoToolTop: 0x111111, hazardYellow: 0xffd400, hazardBlack: 0x000000,
  // 機台（範例值）
  toolBody: 0xe9e6df, toolBand: 0x2b2b2e, toolDoor: 0xcfcac0, toolBlack: 0x111111,
  screenBg: 0x0d1114, screenRun: 0x2bd45a, screenWarn: 0xffd400, screenDown: 0xe60012,
  lampGreenOn: 0x38ff6a, lampYellowOn: 0xffe600, lampRedOn: 0xff2020,
  lampGreenOff: 0x0e3a1a, lampYellowOff: 0x4a4000, lampRedOff: 0x4a0a0a,
  // 搬運（範例值）
  ohtBody: 0xfafafa, ohtStripe: 0xe60012, foupShell: 0xcfe6ff, foupHandle: 0xff8a00, foupDoor: 0x7fa8d0,
  // 人物（範例值）
  suit: 0xf7f7f2, suitBoot: 0xe0e0da, glove: 0x2a6fe0, eyeBand: 0x1d2a3a, mask: 0xffffff, lanyard: 0xe60012,
  // 新增
  holdTagRed: 0xe60012, holdTagYellow: 0xffd400, holdTagWhite: 0xffffff,
  stocker: 0xdcdad2, stockerWindow: 0x9fb8c9, wrapPlastic: 0xe8f1f5,
  gowningTile: 0xe6edf2, benchBlue: 0x2a6fe0, steel: 0xb9bec4, mirrorSilver: 0xd5dde3,
  officeFloor: 0x8c9196, officeWall: 0xf1f3ee, desk: 0xd8d2c4, deskDark: 0x4a4a4f,
  monitorBezel: 0x161616, chair: 0x2b2f3a, whiteboard: 0xfdfdfb, plant: 0x3d8a4f,
  cardboard: 0xc9a77a, tapeYellow: 0xffd400, skinS1: 0xfde7cf, skinS2: 0xf6d6b8, skinS3: 0xeac29e, skinS4: 0xd9a77f,
  // UI 共用色（04 §5.9 頭頂名字 sprite；palette_sync 比對 --ink、--paper、--grey，01 D69）
  ink: 0x0a0a0a, paper: 0xfffdf4, grey: 0xd9d6cc,
  shadowBlob: 0x000000, outline: 0x000000,
} as const;
```

**3D 用色守則**

1. 大面積（牆、地板、機台外殼）只用低彩度的紙白／淺灰（L* ≥ 80）；訊號色只出現在燈號、螢幕、標示、名牌、天車紅帶。
2. 光源顏色決定「情緒」，物件顏色維持中性：同一台機台在日常是米白、在 down 是粉紅，是**光**造成的，不改材質色。
3. 黃光區的牆、天花板、地板用 `MeshBasicMaterial`（不受光，範例值），保證任何光組下都是飽和琥珀色。
4. 自發光物件（燈號亮燈、螢幕、天花板燈板、標牌）一律 `MeshBasicMaterial`（範例值）。

### 1.7 什麼不能做

**風格**
1. 不用模糊陰影（`box-shadow` 有模糊值、`filter: drop-shadow(... >0)`）、不用 `backdrop-filter`、不用毛玻璃。
2. 不用平滑漸層當面板底色或按鈕底色；漸層只准出現在全畫面特效的遮罩與暈影（`fx.css`）。
3. 不用膠囊形按鈕、對稱大圓角、Material／iOS 風格的元件外觀。
4. 不用 emoji、照片、寫實貼圖、商業圖庫插畫。
5. 不在紙白上放黃字；不在墨黑上放 <18px 的紅字（對比 4.1:1）。
6. 不用斜體中文（瀏覽器的假斜體會變形）。
7. 3D 不用 `MeshStandardMaterial`／`MeshPhysicalMaterial`、不用環境貼圖、不用 shadow map、不加第 4 階明暗、不加 bloom、不加後製描邊。
8. 不新增第三種訊號色（例如藍色的「正面」）。藍色只屬於無塵手套與工作機。

**真實性（P1）**
9. 不出現任何真實公司的名稱、商標、廠區代號、產品型號（台積電、聯電、ASML 等）；機台只用「ET-03」這類虛構編號，螢幕文字只用 RUN／WARN／ALARM 與虛構 recipe 名。
10. 黃光區的燈光不准偏白或偏藍；黃光區裡也不准出現藍色自發光物件（真實黃光區濾掉 500 nm 以下，FD §5.3）。

**動態與健康**
11. 任何閃爍 ≤3 次／秒（WCAG 2.3.1）；全畫面紅色閃爍不准超過 1 次／秒（範例 `fx-alert` 為 0.83 次／秒）。
12. 自由走動時鏡頭不准有 roll、不准有呼吸晃動（暈眩）；傾斜構圖只用在對話演出。
13. 減少動態開啟時不准有任何抖動、閃爍、晃動、推拉；改用靜態強調（§7.4、§9.3）。

**敏感（GDD §13，優先於所有風格規則）**
14. 精神低落、身心警訊、停下來序列、求助卡、E12、E13：不准用狀聲字、速度線、放射線、紅色暈影、抖動、搞笑音效。
15. 不准把受害者（主角、小晴、美玲姐生病時）畫成搞笑的表情；誇張的差分只給加害者與體制角色。
16. 不准出現「GAME OVER」字樣、骷髏、墓碑、× 形眼睛（死亡符號）。
17. 頂樓（完整版）：鏡頭不准朝下拍向建築邊緣；圍欄高度 ≥2.2 m 且清楚可見；不准有角色靠近邊緣的動畫（§4.7）。
18. 求助專線號碼不做成 `tel:` 連結，不加任何動畫或特效。

---

## 2. 卡通渲染技術規格

### 2.1 renderer 設定

```ts
// src/render/render_host.ts（建立 renderer 的部分；常數放 render/look.ts）
const renderer = new WebGLRenderer({ canvas, antialias: tier === 'high', alpha: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = SRGBColorSpace;   // three 0.186 預設值，明確寫出
renderer.toneMapping = NoToneMapping;          // 不准改：tone mapping 會把三階色塊壓扁
renderer.shadowMap.enabled = false;            // 01 §9.7：不用 shadow map
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP[tier]));
// ColorManagement.enabled 維持預設 true（§2.4 方案 A）
```

| 常數 | high（L0） | medium（L1） | low（L2） |
|---|---|---|---|
| `PIXEL_RATIO_CAP` | 2 | 1.5 | 1 |
| MSAA（`antialias`） | 開 | 關 | 關 |
| CanvasTexture `anisotropy` | 4 | 2 | 1 |
| 霧 | 開 | 開 | 關 |
| 外描邊 | 全部 | 全部 | 只有機台與人物 |
| 天車移動 | 開 | 開 | 靜止 |
| 告警星芒 sprite（§5.2） | 開 | 開 | 關 |
| 點光源上限 | 3 | 2 | 2 |
| 幀率上限 | 不限（vsync） | 不限 | 30 fps |

- `antialias` 是建立 context 時決定的，所以**降級時不重建 context**：L0 → L1 的 MSAA 改變只在下次載入生效（設定頁提示「重新整理後生效」）。自動降級時其他項目立即生效。

### 2.2 gradientMap（三階明暗）

```ts
// src/render/toon_kit.ts（取代 01 §9.4 骨架中的 [85, 165, 255]，理由見 §2.4）
export const GRADIENT_STEPS = new Uint8Array([23, 96, 255]);
const gradient = new DataTexture(GRADIENT_STEPS, 3, 1, RedFormat);
gradient.minFilter = NearestFilter;
gradient.magFilter = NearestFilter;
gradient.generateMipmaps = false;
gradient.colorSpace = NoColorSpace;   // 資料貼圖，不做色彩轉換
gradient.needsUpdate = true;
```

- **三階的分界**：toon 著色器以 `dot(N, L) × 0.5 + 0.5` 查表，3 個 texel 的分界在 `dot(N,L) = ±1/3`，也就是表面法線與光線夾角約 70.5° 與 109.5°。平行光從 `(4, 9, 7)` 打下來時：頂面＝亮階、朝光的側面＝亮階、背光側面＝中階、底面＝暗階。這就是範例「頂亮、側中、底暗」的來源，**光的方向是構圖的一部分**，不准任意改。
- **全專案只有一張 gradientMap**，人物、道具、建築共用（`ToonKit` 持有）。不准為了「更柔和」加第 4 階。
- **為什麼不是範例的 `[85, 165, 255]`**：範例（r128）不做輸出編碼，85／255 直接顯示成 33% 亮度；0.186 會把線性值編碼成 sRGB，85／255（0.333）會被顯示成 61%，明暗對比被壓平。`[23, 96, 255]` 是 `[85, 165, 255]` 經 sRGB 解碼後的線性值（0.333 → 0.0908、0.647 → 0.376），編碼後剛好顯示回 33%／65%／100%。

### 2.3 外描邊

**MVP：`hull` 策略**（01 §9.4；範例 `put()` 的做法）——同型幾何每邊放大 `t`，用共用的 `BackSide` 黑色 `MeshBasicMaterial`（`0x000000`，範例值）。

**粗細規則**（`t`＝每一邊外擴的世界長度，單位 m）

| 等級 | 物件最大邊長 | `t` | 範例出處 | 例 |
|---|---|---|---|---|
| `L` | ≥1.5 m | 0.05 | `box()` 預設值 | 機台本體、stocker、黃光機台（柱子用 0.04，範例值） |
| `M` | 0.4～1.5 m | 0.04 | 天車本體 0.05、FOUP 0.04、色帶 0.04 | 天車、FOUP、桌子、置物櫃 |
| `S` | 0.12～0.4 m | 0.03 | `cyl()`／`sph()` 預設值 | 燈號、手臂、腿、頭、手套 |
| `XS` | <0.12 m | 0.015 | 拉鍊 0.01、手把 0.02 | 名牌、拉鍊、把手、按鈕 |
| 建築 | 地板、牆、天花板 | **不做 hull** | 範例的線條畫在 CanvasTexture 裡 | 牆板接縫、地板孔格 |

- **用 `outlineFor()`（`look.ts`）查表**，道具不准寫死數字；範例中有個別例外（天車本體 0.05、柱子 0.04）時，以範例值覆寫並在道具表（§5）註明。

```ts
export const OUTLINE_T = { L: 0.05, M: 0.04, S: 0.03, XS: 0.015 } as const;
export function outlineFor(size: readonly [number, number, number]): number {
  const longest = Math.max(size[0], size[1], size[2]);
  if (longest >= 1.5) return OUTLINE_T.L;
  if (longest >= 0.4) return OUTLINE_T.M;
  if (longest >= 0.12) return OUTLINE_T.S;
  return OUTLINE_T.XS;
}
```

- **距離規則**：hull 是世界座標的厚度，所以遠處自然變細——這是刻意的景深感，不做螢幕空間補償。驗收目標：`default` 鏡頭（§7.2）下，1080p 畫面中 4 m 外的機台描邊 6～9 px、6.5 m 外的人物描邊 4～6 px、20 m 外 ≤2 px。描邊殼的材質 `fog: true`（預設值），遠處會被霧吃掉，這就是描邊的 LOD。
- **薄板例外**：厚度 <0.1 m 的薄板（螢幕邊框、門板），`t` 不得超過板厚的 40%（範例的 0.08 m 門板用 0.03 m）。
- **透明物件不做描邊**（黃光區玻璃、鏡子）。
- **自發光物件**：燈號殼有描邊（範例值），螢幕與標牌**沒有**描邊（貼在有描邊的邊框上）。
- **L2**：只保留機台本體、人物的描邊殼；其他靜態描邊殼不建立（在 `static_batcher` 合併前就略過）。

**Stage 6：`normalExtrude` 策略**（glTF `SkinnedMesh`，01 §9.6）

| 參數 | 值 | 說明 |
|---|---|---|
| 世界厚度 `uOutlineWorld` | 0.018 m | 對應 MVP 程式化人物 `S` 級 0.03 m 的觀感（glTF 表面較平滑、輪廓較連續，看起來會比 hull 粗，所以取較小值） |
| 螢幕夾限 | 1.5～4 px（1080p） | 頂點著色器：`w = clamp(uOutlineWorld, minPx × depth × k, maxPx × depth × k)`，`k = 2·tan(fov/2) / viewportHeight` |
| 法線 | 平滑法線 | 載入時依頂點位置合併、平均法線，存成自訂屬性 `outlineNormal`；硬邊模型直接用原法線會裂開 |
| 顏色 | `0x000000` | 同 hull |
| 實作 | `MeshBasicMaterial({ side: BackSide })` ＋ `onBeforeCompile` 在 `#include <skinning_vertex>` 之後沿 `outlineNormal` 外推 | 跟著骨架變形 |

### 2.4 r128 → three 0.186 色彩與光源校準（01 §9.9、§17 R3）

**差異來源（四個）**

| # | r128（範例） | 0.186 | 影響 |
|---|---|---|---|
| 1 | 沒有色彩管理；色碼直接進著色器運算；輸出不編碼 | 色碼視為 sRGB，轉線性後運算，輸出編碼成 sRGB | 受光物件整體變亮、明暗對比變平 |
| 2 | 傳統光源模式：半球光、平行光、點光源的照度在著色器內 ×π，再乘上 1/π 的 Lambert | 物理光源模式：不再 ×π | 同樣的強度數字，受光面暗到約 1/π |
| 3 | 點光源預設 `decay = 1`，衰減＝`(1 − d/distance)^decay` | 衰減＝`1 / d^decay × (1 − (d/distance)^4)^2`，預設 `decay = 2` | 遠近光量分布不同 |
| 4 | `CanvasTexture` 不做色彩轉換 | 預設 `NoColorSpace` 被當成線性 → 顯示變淡 | 貼圖褪色 |

**方案比較**

| 方案 | 做法 | 優點 | 缺點 |
|---|---|---|---|
| **A：標準線性流程（採用）** | 保持 0.186 預設；gradientMap 線性化；光源用下式換算；貼圖設 `SRGBColorSpace` | 跟 01 §9.9 一致；Stage 6 的 glTF（sRGB 貼圖）不用特殊處理；未來加任何 three 功能都不會踩到「關掉色彩管理」的邊緣情況 | 多光源疊加處的亮度與範例不完全相同，需要並排微調 |
| B：模擬舊流程（備案） | `ColorManagement.enabled = false`、`outputColorSpace = LinearSRGBColorSpace`、貼圖 `NoColorSpace`、gradientMap 維持 `[85,165,255]`、光源只補 ×π 與衰減 | 幾乎逐像素重現範例 | 非標準設定；glTF 貼圖要逐張改 `colorSpace`；跟 01 §9.9 文字不一致 |

**決定**：採用 A。依 CLAUDE.md「3 次嘗試」規則：Stage 1 並排校準調整 3 輪仍不合格，就改用 B，並向 01 提出修改 §9.9（§15 #4）。

**換算公式**（`look.ts` 的 `legacyToPhysical()`，純函式、有單元測試）

```ts
/** 把 r128 傳統模式的光源強度，換算成 0.186 物理模式下「看起來一樣」的強度 */
export function legacyToPhysical(
  legacyIntensity: number,
  light: { kind: 'hemisphere' | 'directional' } | { kind: 'point'; legacyDistance: number; refDistance: number; decay: number },
): number {
  // 線性化：近似 sRGB 解碼（2.2 次方），乘法在冪次下可分離
  const gammaToLinear = (x: number): number => Math.pow(x, 2.2);
  if (light.kind !== 'point') return Math.PI * gammaToLinear(legacyIntensity);
  const d = light.refDistance;
  const legacyFalloff = Math.max(0, 1 - d / light.legacyDistance);            // r128，decay = 1
  const cutoffWindow = Math.pow(Math.max(0, 1 - Math.pow(d / light.legacyDistance, 4)), 2);
  const physicalFalloff = cutoffWindow / Math.max(Math.pow(d, light.decay), 0.01); // 0.186
  return (Math.PI * gammaToLinear(legacyIntensity * legacyFalloff)) / physicalFalloff;
}
```

- **推導**：r128 受光面輸出 ≈ `albedo × g × color × I × f(d)`（sRGB 數值直接運算、直接顯示）；0.186 輸出 ＝ `encode(lin(albedo) × g' × lin(color) × I' × f'(d) ÷ π)`。在 2.2 次方近似下各乘項可以分別線性化，所以 `g' = lin(g)`、`I' = π · lin(I · f(d)) / f'(d)`。點光源的距離分布不可能每個距離都相同，所以在**參考距離**（光源到主要受光物件）上對齊。
- **點光源一律 `decay = 1`、`distance` 沿用範例**：試算過 `decay = 2` 時 ET-03 對面的機台只剩範例的約 20% 亮度（紅光太局部，失去「整個空間染紅」）；`decay = 0` 則 6 m 外亮到範例的 2 倍；`decay = 1` 在 2～6 m 範圍內誤差最小（約 −30%），由並排校準補足。

**校準表（方案 A 起始值）**——範例的光源全部換算如下，寫成 `look.ts` 的 `CALIBRATION` 常數：

| 項目 | 範例（r128） | 參考距離 | 0.186 起始值 | 備註 |
|---|---|---|---|---|
| gradientMap | `[85,165,255]`、`LuminanceFormat` | — | **`[23,96,255]`**、`RedFormat` | §2.2 |
| `HemisphereLight` | `0xffb4aa`／`0x38090e`，0.8 | — | 同色，**1.92** | π × 0.8^2.2 |
| `DirectionalLight` | `0xffe2dc`，0.85，位置 `(4,9,7)` | — | 同色，**2.20**，同位置 | π × 0.85^2.2 |
| `PointLight` 紅（亮相） | `0xff1a1a`，3.2，distance 16 | 2.0 m（燈→ET-03 正面） | 同色，**60.6**，`decay 1`，distance 16 | 閃爍亮相；也是減少動態時的固定值（範例在減少動態下固定亮相） |
| `PointLight` 紅（暗相） | 1.1 | 2.0 m | **5.78** | 閃爍暗相 |
| `PointLight` 紅（建構值） | 2.6 | 2.0 m | **38.3** | 第一幀之前的值 |
| `PointLight` 黃 | `0xffd000`，2.3 ± 0.15，distance 26 | 5.0 m（燈→黃光區機台） | 同色，**61.5**，振幅 **±8.8**（53～71），`decay 1`，distance 26 | `sin(t × 2)` 呼吸（週期 3.14 s） |
| `scene.background` | `0x24050a` | — | 不變 | 色彩管理會往返轉換，顯示相同 |
| `Fog` | `0x2a0508`，18～72 | — | 不變 | 霧在線性空間混色，中距離略不同，校準時一併看 |
| `MeshBasicMaterial` 色 | 全部 | — | 不變 | 不受光，往返後相同 |
| `CanvasTexture` | 未設定 | — | `colorSpace = SRGBColorSpace` | 地板、牆、斜紋、螢幕、標牌、名牌 |
| `toneMapping` | 無 | — | `NoToneMapping` | 不准開 |

**方案 B 備案值**（只補 ×π 與衰減，不做 2.2 次方）：半球光 2.51、平行光 2.67、紅（亮）17.6、紅（暗）6.05、紅（建構值）14.3、黃 29.3（±2.4）；gradientMap 維持 `[85,165,255]`。

**並排比對步驟**（Stage 1，01 §15 Success Criteria）

1. **參考畫面**：Chrome，視窗 1600×900、`devicePixelRatio` 1（DevTools 裝置模擬）。DevTools → Rendering →「Emulate CSS media feature prefers-reduced-motion: reduce」。開 `design/style-c-toon.html`，在 DevTools 對 `#ui`、`.fx`、`.sfx`、`.styletag` 設 `display:none`。範例在減少動態下 `t = 0`：紅燈固定亮相（3.2）、黃燈 2.3、天車停在 `z = −2`、主角不晃——這是一張確定的靜止畫面。截圖存 `design/calibration/reference_r128.png`（不參與建置）。
2. **待測畫面**：`bun run dev`，網址加 `?calib=1`（DEV 專用，`app/dev_panel.ts` 讀取）：載入 `scn.fab_bay`、光組 `bayAlarm` 固定亮相、天車停在 `z = −2`、鏡頭用範例的固定機位（`BASE (3.1, 0.6, 8.6)`、`TARGET (−1.5, 2.0, 0.6)`、roll 0.11、FOV 依範例公式、`viewOffset` 12%）、主角放在範例位置 `(−2.45, 0, 2.3)`、`rotation.y = −1.0`、`scale 1.18`（**只有校準模式**用範例的人物比例，正式遊戲用 §6 的比例）、隱藏 UI。同樣條件截圖。
3. **取樣**：在兩張圖的 6 個物件上各取 5×5 像素平均（座標以畫面比例記錄在 `look.ts` 的 `CALIBRATION_SAMPLES`）：
   (a) ET-03 本體正面（紅光主照區）、(b) ET-03 頂面、(c) 右側第一台機台正面（遠離紅光）、(d) 鏡頭前 3 m 的地板、(e) 主角軀幹、(f) 黃光區後牆（`MeshBasicMaterial`）。
4. **門檻**：(a)～(e) 每個通道差 ≤12／255；(f) ≤2／255（不受光，超過代表貼圖或色彩空間設錯）。
5. **調整順序**（一次只動一個常數）：半球光（影響全部）→ 平行光（b、c、e）→ 紅點光（a）→ 黃點光 → 霧的 near／far（c、d）。每輪重新截圖。
6. **記錄**：最後的數值與 6 點的實測差寫進 `CALIBRATION` 常數旁的單行註解，並記錄在 `IMPLEMENTATION_PLAN.md` 的 Stage 1。
7. **3 輪不合格** → 改用方案 B，重做 1～6，並向 01 提出 §9.9 的修改。

**其他光組怎麼換算**：§3 的每組光都同時列出「等效舊值」與 0.186 值。新增或調整光組時，一律先用範例的觀感思考舊值，再用 `legacyToPhysical()` 換算，不准直接猜 0.186 的數字。

### 2.5 霧

| 規則 | 內容 |
|---|---|
| 種類 | 只用線性 `Fog`（範例值）；不用 `FogExp2`（指數霧會吃掉近處對比） |
| 顏色 | **必須等於該光組的 `scene.background`**（例外：`bayAlarm` 的背景 `0x24050a`、霧 `0x2a0508`，範例值，保留） |
| 距離 | 依光組（§3.2）；長走道的原則是「鏡頭前 18 m 內完全清楚、70 m 外完全被吃掉」 |
| 描邊 | 描邊殼材質 `fog: true`，跟本體一起淡出 |
| 自發光 | 天花板燈板、螢幕、標牌、黃光區牆面都 `fog: true`（three 預設） |
| L2 | 關閉霧（01 §9.7）；同時把 `camera.far` 從 120 降到 60，背景色維持光組的背景色 |

### 2.6 後製：不使用

01 §9.7 規定不用 `EffectComposer`。每一種「看起來像後製」的效果改用下列方式：

| 效果 | 做法 | 成本 |
|---|---|---|
| 集中線、網點、紅色暈影、暖色光暈 | DOM 全畫面層 `#fx-layer`（範例的 `.fx-*`） | 合成器一層；GPU 幾乎為 0 |
| 降飽和（精神低落、身心警訊） | L0／L1：`#scene` 加 CSS `filter: saturate(.7)`／`(.5)`；L2：光組顏色往灰階內插 30%／50%（§3.3） | CSS filter 在全螢幕 canvas 上多一次合成，預估 ≤0.5 ms／幀（Stage 3 實測記錄）；L2 為 0 |
| 「停下來」轉米白 | DOM 紙色遮罩（`--paper-calm`，不透明度 0 → .88，4 s）＋光組 `calmPaper` | 0 |
| 燈號光暈 | 不做 bloom；改用 down 機台燈號旁的「告警星芒」平面 sprite（兩色、硬邊，§5.2） | 1 draw call |
| 黃光區「看不清顏色」 | 光組 `photoAmber`（琥珀色光）讓藍色手套、綠色螢幕自然變暗變濁 | 0 |
| 鏡子 | 不做反射；鏡子後面放一個鏡像的主角實例（`scale.x = −1`，§4.3） | 2 draw calls |

### 2.7 CanvasTexture 規則

1. **色彩空間**：`texture.colorSpace = SRGBColorSpace`（所有顏色貼圖）。漏設是範例移植最常見的錯誤，`canvas_textures.ts` 的工廠統一設定，道具不准自己 `new CanvasTexture()`。
2. **尺寸**：重複貼圖 128² 或 256²；標牌 ≤1024×256；**圖集**（atlas）≤1024×512，每個場景最多 3 張（§14 CR-11）。重複貼圖必須是 2 的冪次；螢幕類貼圖可沿用範例的 256×160（three 0.186 只用 WebGL2，非 2 的冪次也能用 mipmap）。
3. **線條**：canvas 內的框線粗細 ＝ 貼圖邊長 × 3% 左右（128 → 4～6 px、256 → 8 px，範例值）；顏色純黑 `#000`。
4. **文字**：用 `--f-head` 的字型堆疊、字重 900；英數標籤在 Noto 之後加 `"Arial Black"` 當備援。繪製前等 `document.fonts.load('900 38px "Noto Sans TC"')`，最多等 1500 ms；之後字型才到的話重畫一次並 `needsUpdate = true`。
5. **網點**：用 `arc()` 畫實心圓，不用 canvas 的 `filter`、`shadowBlur`。
6. **過濾**：重複貼圖與含文字貼圖都用預設 mipmap；`anisotropy` 依畫質（§2.1）。
7. **總數**：同一場景 ≤32 張（01 §9.7）。§4 每個場景列出清單。
8. **貼圖記憶體**：每張用 `w × h × 4 × 1.33`（含 mipmap）估算，場景合計 ≤24 MB。

### 2.8 模組放置

| 檔案 | 內容 | 測試 |
|---|---|---|
| `render/look.ts`（新增，§14 CR-12） | `PALETTE`、`OUTLINE_T`、`outlineFor()`、`CALIBRATION`、`CALIBRATION_SAMPLES`、`LIGHT_RIGS`、`LIGHT_OVERLAYS`、`legacyToPhysical()`、`selectLightRig()`、`selectOverlays()`、`blendRig()`、`PIXEL_RATIO_CAP` | `look.spec.ts`：`legacyToPhysical` 的參數化案例（預先手算：0.8 → 1.92、0.85 → 2.20、紅亮 → 60.6，誤差 ±0.5）、`selectLightRig` 決策表逐列、`blendRig` 在 t=0／t=1 等於兩端、`outlineFor` 邊界值（0.119／0.12／0.399／0.4／1.499／1.5） |
| `render/toon_kit.ts` | `GRADIENT_STEPS`、gradientMap、材質快取、hull 工廠、`vertexColorMaterial()`（§6.6、§14 CR-13） | 既有 `toon_kit.spec.ts` 加：同色同參數只建 1 個材質 |
| `render/canvas_textures.ts` | 所有 CanvasTexture 工廠與圖集；統一 `SRGBColorSpace` | 畫面人工驗收 |
| `test/palette_sync.test.ts`（新增） | 讀取 `src/ui/styles/tokens.css` 的文字，斷言 `--ink`、`--paper`、`--red`、`--yellow`、`--grey`、`--glove`、`--amber`、`--screen-*` 與 `PALETTE` 的對應值相等 | 防止 CSS 與 3D 色票漂移 |

---

## 3. 氛圍與光色預設

### 3.1 光色是怎麼決定的

render 只看得到 `SceneSnapshot`（01 §5、§9.2）、自己的玩家位置與目前鏡頭。光色由一個純函式決定：

```ts
// src/render/look.ts（render 內部型別，不進 model.ts）
export type LightRigId =
  | 'bayDay' | 'bayNight' | 'bayAlarm' | 'photoAmber'
  | 'gowningWhite' | 'officeDay' | 'officeNight' | 'calmPaper';
export type LightOverlayId = 'pressure' | 'support' | 'lowSpirit' | 'warningSpirit';
export type FabZone = 'bay' | 'photo';

export interface LightRigInput {
  scene: SceneId;
  mood: PresentationMood;
  anyMachineDown: boolean;            // snapshot.machines 中屬於本場景者有 status 'down'
  zone: FabZone | null;               // 玩家目前所在區（render 自己知道）
  daylight: 'day' | 'night';          // snapshot.timeOfDay === 'night' ? 'night' : 'day'（§14 CR-01）
}
export function selectLightRig(input: LightRigInput): LightRigId;
export function selectOverlays(input: { mood: PresentationMood; shot: CameraShotId }): readonly LightOverlayId[];
```

**`selectLightRig` 決策表**（由上往下，第一個成立者）

| # | 條件 | 光組 |
|---|---|---|
| 1 | `mood === 'calm'` | `calmPaper` |
| 2 | `scene === 'scn.fab_bay'` 且 `zone === 'photo'` | `photoAmber` |
| 3 | `scene === 'scn.fab_bay'` 且 `anyMachineDown` | `bayAlarm` |
| 4 | `scene === 'scn.fab_bay'` 且 `daylight === 'night'` | `bayNight` |
| 5 | `scene === 'scn.fab_bay'` | `bayDay` |
| 6 | `scene === 'scn.gowning_room'` | `gowningWhite` |
| 7 | `scene === 'scn.office'` 且 `daylight === 'night'` | `officeNight` |
| 8 | `scene === 'scn.office'` | `officeDay` |
| 9 | 2.5D 場景 | 由 `BackdropSpec.lighting` 決定（§4.5）；`calm` 時仍套 #1 |

**`selectOverlays` 決策表**（可以疊加；`mood === 'calm'` 時一律回傳空陣列）

| 條件 | 疊加 |
|---|---|
| `shot === 'puaLowAngle'` | `pressure` |
| `shot === 'praisePullBack'` | `support` |
| `mood === 'low'` | `lowSpirit` |
| `mood === 'warning'` | `warningSpirit` |

> 「夜班」在真實 fab 裡燈光不會變（24 小時同亮度）。`bayNight` 只動環境光與霧、讓天花板燈板稍暗，是**刻意的戲劇化**，配合「夜班人少、只剩機台燈」的情緒（§15 #9）。

### 3.2 基礎光組

強度欄位格式：**0.186 值〔等效舊值〕**。點光源一律 `decay = 1`。位置是場景座標（§4）。

| 光組 | 半球光 天／地，強度 | 平行光 色，強度，位置 | 點光源 | 背景 | 霧 色，near～far | 自發光調整 | 情緒 |
|---|---|---|---|---|---|---|---|
| `bayDay` | `f2f4ff`／`6b6f7a`，**2.49**〔0.9〕 | `fff6ea`，**1.67**〔0.75〕，(4,9,7) | 黃光區 `ffd000` 61.5±8.8，(0,3.5,−22)，distance 26 | `dfe3e6` | `dfe3e6`，24～80 | 燈板 `f4f6ff` | 日常：乾淨、冷白、只有嗡嗡聲 |
| `bayAlarm` | `ffb4aa`／`38090e`，**1.92**〔0.8〕 | `ffe2dc`，**2.20**〔0.85〕，(4,9,7) | 紅 `ff1a1a`：亮 60.6／暗 5.78，1.7 Hz、工作比 50%，位於 down 機台錨點（§4.2），distance 16；＋黃光區同 `bayDay` | `24050a` | `2a0508`，18～72 | 燈板 `ffe6e0` | 危機：範例本身 |
| `bayNight` | `e6ecff`／`2c3140`，**1.92**〔0.8〕 | `dfe6ff`，**1.02**〔0.6〕，(4,9,7) | 黃光區同 `bayDay` | `1e2430` | `1e2430`，14～60 | 燈板 `d0d8ec` | 夜班：遠處沉進藍黑、人少 |
| `photoAmber` | `ffc040`／`4a3000`，**1.43**〔0.7〕 | `ffd27a`，**0.684**〔0.5〕，(4,9,7) | 黃光區同 `bayDay`；有 down 機台時紅燈保留 | `2b2000` | `3a2c05`，10～40 | — | 黃光區：暖、暗、悶；回頭看 bay 也是一片琥珀霧（FD §5.3：約 292 lux、2223 K） |
| `gowningWhite` | `ffffff`／`9aa3ad`，**3.14**〔1.0〕 | `ffffff`，**1.43**〔0.7〕，(3,8,5) | 無 | `eef3f6` | 無 | 燈板 `ffffff`；風淋室燈號另計（§4.3） | 更衣室：純白，藍手套是唯一的顏色 |
| `officeDay` | `f1f8ee`／`8b8f80`，**2.20**〔0.85〕 | `f4ffe9`，**1.43**〔0.7〕，(−8,6,2)（窗側） | 無 | `9cc3e6`（窗外） | 無 | 日光燈板 `eef7e8` | 辦公室：日光燈的綠白色（GDD §11） |
| `officeNight` | `1d2333`／`0a0c12`，**0.312**〔0.35〕 | 關閉（0） | 螢幕光 `bcd6ff` **5.16**〔1.6，參考距離 0.8 m〕，位於玩家座位螢幕前 0.35 m、桌面上 0.45 m，distance 6 | `0b1020` | `0b1020`，8～22 | 燈板只亮最靠近玩家的一排，`2a3040` | 加班夜：只剩你的螢幕 |
| `calmPaper` | `ffffff`／`e9e4d6`，**3.14**〔1.0〕 | 0 | 全部 0 | `f4efe3` | `f4efe3`，4～26 | 燈號停止閃爍、星芒隱藏、天車停住 | 停下來：所有東西溶進紙色 |

- **紅燈跟著內容走**：`bayAlarm` 的紅燈放在「down 機台錨點」；有 2 台以上 down 時仍只用 1 盞紅燈（放在離玩家最近的那台），其他 down 機台只有燈號、螢幕與星芒。
- **手機（L1、L2）點光源 ≤2**：優先序 紅燈 ＞ `pressure` ＞ 黃光區 ＞ `support` ＞ 螢幕光。被擠掉的光源強度設 0（不移除，避免重新編譯著色器）。
- **光源數量固定**：每個場景在建構時就建立它可能用到的全部光源（`fab_bay`：半球 1、平行 1、點 3；`office`：半球 1、平行 1、點 2；`gowning_room`：半球 1、平行 1、點 1），切換光組只改顏色與強度。**不准在執行期新增或移除光源**（three 會重新編譯所有材質，造成卡頓）。

### 3.3 疊加光組

| 疊加 | 內容 | 進場 | 離場 |
|---|---|---|---|
| `pressure`（PUA） | 啟用點光源 `ff3344` **4.05**〔1.4，參考 1.0 m〕，distance 5，位於說話者往鏡頭方向 0.8 m、離地 0.4 m（**從下往上打的紅色輪廓光**）；半球光強度 ×0.8；霧 near ×0.7、far ×0.85 | 跟 `puaLowAngle` 同步 0.6 s | 0.4 s（跟鏡頭回 `default` 同步） |
| `support`（被肯定） | 啟用點光源 `ffd27a` **4.47**〔1.2，參考 1.5 m〕，distance 8，位於說話者往鏡頭方向 1.0 m、離地 1.6 m；半球天空色往 `fff1c2` 內插 25%，強度 ×1.1 | 跟 `praisePullBack` 同步 0.8 s | 0.4 s |
| `lowSpirit`（精神 ≤35） | L0／L1：`#scene` 的 CSS `filter: saturate(.7)`；L2：所有光源、背景、霧的顏色往各自的灰階（Rec.709 亮度）內插 30% | 1.5 s | 1.5 s |
| `warningSpirit`（精神 ≤15） | 同上，`saturate(.5)`／內插 50%；半球光強度 ×0.9 | 1.5 s | 1.5 s |

- `pressure` 與 `support` 用的是場景預先建立的同一盞「演出用點光源」，所以不會同時存在（鏡頭同一時間只有一顆）。

### 3.4 `PresentationMood` 對照（01 §10.5；值不變，本書補上視覺細節）

| `mood` | 3D | UI | 音效 |
|---|---|---|---|
| `normal` | 依 §3.1 | 一般 | 一般 |
| `low` | 疊加 `lowSpirit` | 對話框邊框 4px → 3px；台詞文字微抖（`translate(±0.5px)`，`steps(2)`、0.6 s 週期；減少動態時不抖）；數值面板「危」常亮 | BGM 少一個聲部（§10.4） |
| `warning` | 疊加 `warningSpirit` | 同 `low`；對方台詞部分字被墨點遮住（`inkBlots`，§9.10）；SFX 字卡停用（§3.5） | 同上；幻覺震動（設定可關閉） |
| `calm` | `calmPaper`；鏡頭固定（§7.5）；人物改 `idle`／`tired` | 所有特效關閉；HUD 與數值面板淡出到 0；面板改成安靜樣式（§9.24）；字體 `--f-calm` | 音樂 1.5 s 淡出 → 只剩 FFU 底噪 → 6 s 淡出到無聲 |

### 3.5 特效開關矩陣

✔＝依 `StagingCue` 正常播放；△＝降低強度；✘＝強制關閉（即使內容的 `StagingCue` 指定了也不播）。

| 特效 | `normal` | `low` | `warning` | `calm` | 減少動態 |
|---|---|---|---|---|---|
| `speedLines` 集中線 | ✔（.42；PUA .7） | ✔ | △（最高 .3） | ✘ | 靜態顯示，不做透明度動畫 |
| `dots` 邊緣網點 | ✔ .38 | ✔ | ✔ | ✘ | 同左（本來就靜態） |
| `alert` 紅色暈影 | ✔（1.2 s `steps(2)`） | ✔ | △（不脈動，固定 .5） | ✘ | 固定不透明度 .7（範例值） |
| `radialBackdrop` 立繪紅白放射 | ✔ | ✔ | ✔ | ✘ | 同左（靜態） |
| `desaturate` | ✔ | 自動 | 自動 | ✘ | 同左 |
| `shakeDialog` 對話框抖 1 格 | ✔ | ✔ | ✘ | ✘ | ✘，改成邊框加粗 1 格 |
| `inkBlots` 墨點遮字 | ✔ | ✔ | ✔ | ✘ | 同左（靜態） |
| `warmGlow`（新增，CR-02） | ✔ | ✔ | ✔ | ✘ | 靜態 |
| `sparkleDots`（新增，CR-02） | ✔ | ✔ | ✔ | ✘ | 靜態 |
| SFX 字卡（`sfxCard`） | ✔（抖動 0.5 s `steps(2)`） | ✔ | ✘ | ✘ | 顯示但不抖 |
| 搞笑音效（`tsk`、`huh`、`slap`） | ✔ | ✔ | ✘ | ✘ | ✔（聲音不是動態） |
| 數值浮字 `delta_pop` | ✔ | ✔ | ✔ | ✘（只寫入 `#live`） | 不位移，原地淡入淡出 |
| 機台燈號閃爍 | ✔ 1.7 Hz | ✔ | ✔ | ✘（固定亮） | ✘（固定亮，範例值） |
| 鏡頭演出 | ✔ | ✔ | ✔ | ✘ | 直接到終點（§7.4） |
| 打字效果 | ✔ | ✔ | ✔ | 依設定，但 `fast` 以上視為 `normal`（安靜、慢一點） | `instant` |

- 矩陣由 `ui/components/fx_layer.ts` 與 `render/camera_director.ts` 各自實作，**判斷順序固定**：先看 `calm`，再看減少動態，最後看 `mood`。
- 內容作者不需要知道這張表：`StagingCue` 照寫，被壓掉是 UI／render 的責任（GDD §13 的安全網）。

### 3.6 轉場

| 變化 | 時間 | 曲線 | 減少動態 |
|---|---|---|---|
| 光組切換（一般） | 0.8 s | 線性內插顏色與強度（`blendRig`） | 0.3 s |
| 走進／走出黃光區（跨過 `z = −16`） | 1.2 s | 線性 | 0.3 s |
| 機台 down 發生 | 立即切到 `bayAlarm`，第一個閃爍相位從「亮」開始 | 硬切（危機感） | 立即，固定亮 |
| 進入 `calm` | 光 3 s、DOM 紙色遮罩 4 s | 線性 | 光 0.3 s、遮罩 1 s（顏色淡入不是動態，保留短淡入讓畫面不突兀） |
| 離開 `calm` | 遮罩 2 s 淡出 | 線性 | 0.5 s |
| 場景切換 | DOM 淡出 200 ms → 切換 → 淡入 200 ms（01 §9.3） | 線性 | 直接切 |

---

## 4. 3D 場景規格

### 4.1 共通規則

| 項目 | 規則 |
|---|---|
| 單位與座標 | 1 unit ＝ 1 m；y 軸向上、地板 y = 0。`scn.fab_bay` 沿用範例座標：+z 朝 bay 頭（入口），−z 朝深處（黃光區）；−x 是玩家負責的 ET-03～06 那一側 |
| 真實比例的刻意放寬 | 走道寬 6.8 m（真實約 3 m）、天花板 6 m（真實約 3.5～4.5 m）：第三人稱鏡頭需要空間。機台、FOUP、load port 高度、門、桌椅維持真實比例（§5） |
| 場景常數 | 每個場景檔匯出 `<SCENE>_SPOTS`（`SceneActor.spot` 的座標與朝向）、`<SCENE>_NAV: NavigationSpec`（01 §9.10）、`<SCENE>_TEXTURES`（貼圖清單，給預算測試） |
| `spot` 命名 | 場景內唯一的 snake_case 字串；未知的 `spot` → `logger.warn` 並放在場景的 `entry` spot（不丟例外，畫面不能因為內容打錯字而中斷） |
| hotspot | ID 由 `content/world.ts` 宣告（§13）；場景負責位置與半徑；預設半徑 1.2 m |
| hotspot 高亮 | `snapshot.highlightHotspots` 內的 hotspot：地面黃色圓環（外徑 0.9 m、寬 0.08 m，`MeshBasicMaterial` `--yellow`，`steps` 式 1 Hz 縮放 1 → 1.08；減少動態時靜止）＋目標上方 2.6 m 的倒三角箭頭（黃＋描邊，上下彈 0.1 m、1 Hz `steps(2)`；減少動態時靜止） |
| 玩家移動 | 走路 1.6 m/s、轉身 540°/s；`snapshot.playerSpeedScale`（§14 CR-15）乘上去（體力 ≤20 時 0.7，GDD §4.1） |
| 腳下假影 | 每個人物一個黑色圓形 `CircleGeometry(0.35, 16)`、不透明度 .22、離地 0.01 m；同場景用一個 `InstancedMesh`（01 §9.7「腳下用圓形假影」） |
| 背景人物 | 場景可以放 render 自己的「無名技術員」（灰色名牌，§1.2）：`bayDay` 1 位、其他光組 0 位；不參與任何互動，不算在 `snapshot.actors` 裡；計入同畫面角色上限 |
| 入場鏡頭 | 每個 3D 場景進入時有 1.2 s 的建立鏡頭（場景內部行為，不是 `CameraShotId`），之後轉 `default`；減少動態時直接 `default` |
| 預算測試 | `props.spec.ts`（01 §9.5）擴充：建構每個場景（不需要 WebGL），斷言三角形數、網格數、貼圖數不超過本節表格 |

### 4.2 `scn.fab_bay`：無塵室蝕刻 bay ＋ 黃光區入口

> 對應 GDD §11「無塵室主走道（蝕刻 bay）」與「黃光區（Photo）入口」；Stage 1 移植範例場景時，座標**完全沿用範例**，以下標「範例值」者不准改。

**平面配置圖**（俯視；示意，每格約 0.5 m × 2 m，精確座標以下方物件表為準）

```text
           x = -6      -4      -2       0       2       4       6
               ┊       ┊       ┊       ┊       ┊       ┊       ┊
 z = +12   ████████████████████▌ D(門) ▐█████████████████████████  bay 頭牆（新增）
 z = +10   █ P               K                        ┌───────┐ █  P 分機電話  K MES 終端
 z =  +8   █ B                             ═══════════│  STK  │ █  B 交接白板  ═ 天車支線
 z =  +6   █ B                                        └───────┘ █  STK 自動倉儲（stocker）
 z =  +4   █               ┆           ║           ┆            █  ┆ 黃色走道線 x = ±3.15（範例值）
 z =  +2   █ ┌─────┐*      ┆           ║           ┆            █  ║ 天車軌道 x = 0、高 5.62 m
 z =   0   █ │ET-03│f      ┆           ║           ┆  ┌─────┐   █  * 燈塔  f FOUP（load port）
 z =  −2   █ ├─────┤*      ┆           ║           ┆ *│ET-07│   █
 z =  −4   █ │ET-04│f      ┆           ║           ┆  ├─────┤   █
 z =  −6   █ ├─────┤*      ┆           ║           ┆ *│ET-08│   █
 z =  −8   █ │ET-05│f      ┆           ║           ┆  ├─────┤   █
 z = −10   █ ├─────┤*      ┆           ║           ┆ *│ET-09│   █
 z = −12   █ │ET-06│f      ┆           ║           ┆  ├─────┤   █
 z = −14   █ └─────┘       ┆           ║           ┆ *│ET-10│   █
 z = −16   ██▒▒▒▒▒▒▒▒▒▒▒█[  閘口 PHOTO AREA  ]█▒▒▒▒▒▒▒▒▒▒▒▒▒██  ▒ 黃色玻璃隔間  █ 黑柱（範例值）
 z = −17   ▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚▚  黑黃斜紋帶 z = −16.4（範例值）
 z = −20   ▓ ┌────┐                                            ▓  ▓ 黃光區（飽和琥珀）
 z = −22   ▓ │曝光│                    ☼                       ▓  ☼ 黃點光 (0, 3.5, −22)
 z = −24   ▓ └────┘                                  ┌────┐    ▓
 z = −26   ▓                                         │塗佈│    ▓
 z = −28   ▓                                         └────┘    ▓
 z = −32   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  黃光區後牆（範例值）
```

**建築外殼**（`props/fab_shell.ts`）

| 物件 | 尺寸／位置 | 材質 | 描邊 | 來源 |
|---|---|---|---|---|
| 高架地板 | `PlaneGeometry(13, 100)`，中心 (0, 0, −30) | toon `0xffffff` ＋ 地板貼圖（§5.10），**重複 21.67 × 166.67**（0.6 m 方格） | 無 | 範例值；重複次數改成真實 0.6 m 格板（範例為 24 × 100，§15 #10） |
| 側牆 ×2 | `PlaneGeometry(28, 6)`，x = ±6.2，中心 z = −2（z ＋12～−16） | toon `0xffffff` ＋ 牆板貼圖，重複 (7, 1)，雙面 | 無 | 範例值 |
| bay 頭牆（新增） | `PlaneGeometry(12.4, 6)`，z = +12；中央開門 2.0 × 2.4 m | 同牆板 | 門框 `toolBlack` box 0.12 m，`S` 描邊 | 新增 |
| 天花板 | `PlaneGeometry(13, 60)`，y = 6，中心 z = −14 | toon `0x3a3a3f` ＋ FFU 格線貼圖（1.2 × 0.6 m 一格，§5.11） | 無 | 範例值＋格線（GDD「頭頂 FFU 格子」） |
| 燈板 | `BoxGeometry(0.9, 0.05, 3)`，x = ±3，z = 8、3、−2、−7、−12，y = 5.96 | basic，依光組（範例 `0xffe6e0`） | 無 | 範例值 |
| 走道黃線 ×2 | `BoxGeometry(0.1, 0.1, 40)`，x = ±3.15，y = 0.04，中心 z = −8 | toon `0xffd400` | 0.02（範例值） | 範例值 |
| 黃光區牆 ×2＋後牆 | 側：`PlaneGeometry(16, 6)`，x = ±6.2，中心 z = −24；後：`PlaneGeometry(13, 6)`，z = −32 | basic `0xffd21a` 雙面 | 無 | 範例值 |
| 黃光區天花板／地板 | 天：`PlaneGeometry(13, 16)` y = 6，basic `0xe0a800`；地：y = 0.02，basic `0xf2b800` | — | 無 | 範例值 |
| 斜紋帶 | `PlaneGeometry(13, 0.8)`，z = −16.4，y = 0.04，斜紋貼圖重複 (16, 1) | basic | 無 | 範例值 |
| 閘口柱 ×4＋橫樑 | 柱 `BoxGeometry(0.3, 6, 0.3)` x = −6、−2.4、2.4、6，z = −16；樑 `BoxGeometry(13, 0.3, 0.3)` y = 5.85 | toon `0x111111` | 0.04 | 範例值 |
| 黃色玻璃 ×2 | `PlaneGeometry(3.4, 5.6)`，x = ±4.2，y = 2.9，z = −16 | basic `0xffe14d`，`opacity .22`，雙面 | 無（透明） | 範例值 |
| 「PHOTO AREA」標牌 | `PlaneGeometry(4, 1)`，(0, 5.1, −15.8) | basic ＋ 標牌貼圖 | 無 | 範例值 |
| 「ETCH BAY E1」標牌（新增） | `PlaneGeometry(3, 0.75)`，(0, 4.9, 11.95)，面向 −z | basic ＋ 標牌貼圖 | 無 | 新增 |

**機台與設備**（細節見 §5）

| 物件 | 數量 | 位置（中心） | 朝向 | 狀態來源 |
|---|---|---|---|---|
| 蝕刻機台 ET-03～06（可互動） | 4 | x = −4.6；z = 2、−2、−6、−10（範例值） | 正面朝 +x | `snapshot.machines['mc.et03'…]` |
| 蝕刻機台 ET-07～10（佈景） | 4 | x = +4.6；z = 0、−4、−8、−12（範例值位置） | 正面朝 −x | render 固定：ET-07 包膜、燈號全暗（裝機中，GDD 大D 的 buy-off 線；不使用 `MachineStatus`，§5.1），ET-08～10 `run` |
| 黃光區機台 | 2 | 曝光機 (−4.4, 1.3, −21)、塗佈顯影機 (4.4, 1.3, −25)（範例值） | — | 佈景 |
| FOUP（load port 上） | 每台機台 2 個，共 16 | 機台正面 load port（§5.3） | — | down 機台的 FOUP 自動掛紅色 hold 標籤；其他白標籤 |
| 天車（OHT）＋FOUP | 1 台（L0、L1） | 軌道 x = 0、y = 5.2；z 從 +8 往 −36 循環，2.6 m/s（範例值） | — | render 自己動；L2 停在 z = −2（範例的減少動態位置） |
| 天車軌道 | 1 條＋吊架 4 支＋stocker 支線 | 軌道 `BoxGeometry(0.28, 0.22, 70)` (0, 5.62, −14)（範例值）；支線 `BoxGeometry(4.7, 0.22, 0.28)` (2.35, 5.62, 8.5) | — | 靜態 |
| Stocker（新增） | 1 | x 3.4～6.2、z 6～11、高 3.6 | 窗面朝 −x | 靜態（FD §5.5：bay 端頭的自動倉儲） |
| MES 終端（新增） | 1 | (−2.6, 0, 9.6) | 螢幕朝 +x | 靜態（hotspot） |
| 交接白板（新增） | 1 | 牆面 x = −6.15，z 5.5～8.5，下緣 0.9 m | 朝 +x | 靜態 |
| 分機電話（新增） | 1 | 牆面 (−6.15, 1.4, 10.8) | 朝 +x | 靜態 |

**hotspot**（ID 建議值，以 `content/world.ts` 為準；§13）

| hotspot | 位置 (x, z) | 半徑 | 地點 | 用途 |
|---|---|---|---|---|
| `hs.et03` | (−2.8, 2.75) | 1.2 | `loc.etch_bay` | ET-03 觸控螢幕（範例一的主舞台） |
| `hs.et04` | (−2.8, −1.25) | 1.2 | `loc.etch_bay` | ET-04 |
| `hs.et05` | (−2.8, −5.25) | 1.2 | `loc.etch_bay` | ET-05 |
| `hs.et06` | (−2.8, −9.25) | 1.2 | `loc.etch_bay` | ET-06 |
| `hs.bay_terminal` | (−1.9, 9.6) | 1.0 | `loc.etch_bay` | MES 終端：SPC 獵人、Hold Lot 判官的進入點（03） |
| `hs.bay_board` | (−5.0, 7.0) | 1.2 | `loc.etch_bay` | 交接白板 |
| `hs.bay_phone` | (−5.1, 10.6) | 0.9 | `loc.etch_bay` | 分機電話 |
| `hs.bay_exit` | (0, 11.0) | 1.2 | `loc.etch_bay` | 離開無塵室（回更衣室／辦公室） |
| `hs.photo_gate` | (0, −15.0) | 1.5 | `loc.etch_bay` | 黃光區閘口（第一次進入的提示） |

**地點分區**（`NavigationSpec.zones`）：`loc.etch_bay` z ∈ [−16, 12]；`loc.photo_area` z ∈ [−32, −16)。跨線時 render 同時更新 `FabZone`（§3.1）。

**可走範圍與障礙**（`FAB_BAY_NAV`）

- `walkable`：x ∈ [−5.7, 5.7]、z ∈ [−30.5, 11.4]。
- 障礙（AABB，已含 0.3 m 人物半徑）：左側機台 x ∈ [−5.9, −3.1] × 各機台 z ± 1.9；右側機台 x ∈ [3.1, 5.9] × 各機台 z ± 1.9；stocker x ∈ [3.1, 6.5] × z ∈ [5.7, 11.3]；MES 終端 x ∈ [−3.2, −2.0] × z ∈ [9.0, 10.2]；玻璃隔間 x ∈ [−6.5, −2.1] ∪ [2.1, 6.5] × z ∈ [−16.45, −15.55]；黃光區機台各自外擴 0.3 m。
- 結果：機台區只能走在 x ∈ [−3.1, 3.1] 的走道；閘口寬 4.2 m。

**`spot` 清單**（`SceneActor.spot`）

| spot | 位置 (x, z) | 朝向（yaw，0＝面向 −z） | 用途 |
|---|---|---|---|
| `entry` | (0, 10.4) | 0 | 從更衣室進來、場景預設 |
| `bay_board` | (−4.8, 7.0) | +90°（面向 −x） | 看白板 |
| `bay_phone` | (−5.0, 10.6) | +90° | 接分機 |
| `bay_terminal` | (−1.9, 9.6) | +90° | 操作 MES |
| `et03_front`～`et06_front` | (−2.7, zᵢ + 0.6)，zᵢ ＝ 2、−2、−6、−10 | +90° | 站在機台螢幕前 |
| `et03_aisle`～`et06_aisle` | (−1.0, zᵢ + 1.0) | +110° | 第二個人站在旁邊（例：林課長在 ET-03 旁邊講話） |
| `et03_crouch` | (−3.0, 1.6) | +90° | 蹲在 down 掉的機台前（`crouch`） |
| `aisle_mid` | (0.6, −4.0) | 180° | 走道中間、面向入口 |
| `photo_gate` | (0, −14.4) | 0 | 閘口前 |
| `photo_inside` | (1.2, −20.0) | +90° | 黃光區內 |
| `bg_tech_path` | (−1.5, −24) ↔ (1.5, −24) | — | 背景技術員來回走 |

**down 機台的紅燈錨點**：機台中心 ＋ (`facing` × 1.5, 3.4, 0.4)。ET-03 為 (−3.1, 3.4, 2.4)，等於範例的 `redLight.position`。

**鏡頭預設**（`default` 的參數見 §7.2；本場景覆寫值）

| 用途 | 位置 | 目標 | FOV | roll |
|---|---|---|---|---|
| 入場鏡頭（1.2 s） | (0, 2.6, 11.0) → 跟隨鏡頭 | (0, 1.6, −6) | 54 | 0 |
| `default` 跟隨 | 玩家後方 6.5 m、高 2.2 m（§7.2）；位置夾限 x ∈ [−3.0, 3.0]、y ≤ 5.0、z ≤ 11.6 | 玩家 ＋ (0, 0.82, 0)（俯角 12°） | 依寬高比 54～84 | 0 |
| 範例構圖（`puaLowAngle` 終點的參考） | (3.1, 0.6, 8.6) | (−1.5, 2.0, 0.6) | 54 | 0.11 |

**L3 定點機位**（`NavigationSpec.viewpoints`）

| viewpoint | 位置 | 目標 | FOV | 包含的 hotspot |
|---|---|---|---|---|
| `vp_bay_head` | (2.0, 2.4, 11.2) | (−3.0, 1.4, 6.5) | 60 | `hs.bay_board`、`hs.bay_phone`、`hs.bay_terminal`、`hs.bay_exit` |
| `vp_et03_04` | (2.2, 2.0, 4.6) | (−3.4, 1.4, 0.4) | 56 | `hs.et03`、`hs.et04` |
| `vp_et05_06` | (2.2, 2.0, −3.4) | (−3.4, 1.4, −7.6) | 56 | `hs.et05`、`hs.et06` |
| `vp_photo_gate` | (0, 2.2, −9.0) | (0, 2.0, −20) | 58 | `hs.photo_gate` |

**光源配置**：建構時建立 半球 1、平行 1、點光源 3（紅燈、黃光區、演出用），強度與顏色依 §3.2、§3.3。

**預算**

| 項目 | 估計（L0） | 上限 | 說明 |
|---|---|---|---|
| 三角形 | 約 32,000 | 60,000 | 外殼 ≤2,000；機台 8 × ≤1,200；FOUP 18 × ≤150；天車 ≤300；stocker ≤400；黃光區機台 2 × ≤240；燈號 24 顆（instanced）約 3,100；人物 5 × ≤2,500 |
| draw calls | 約 51（5 位人物） | 桌機 70、手機 50 | 靜態 toon 依材質合併約 10；靜態描邊殼 1；靜態 basic 約 9（燈板、黃牆、黃天、黃地、斜紋、玻璃、2 個標牌、標籤圖集）；螢幕圖集 1；down 螢幕 ≤2；燈號 instanced 本體 1＋描邊 1；天車（依材質合併）5；hold 標籤 instanced 1；星芒 ≤1；人物 5 × 4（本體、描邊、頭罩名牌、頭頂名字）；假影 instanced 1；hotspot 高亮 ≤2 |
| 貼圖 | 17 張 | 32 | 地板 128²、牆板 256²、天花板 128²、斜紋 128²、PHOTO 標牌 512×128、ETCH BAY 標牌 512×128、機台標籤圖集 1024×256、螢幕圖集 1024×512、down 螢幕 2 張 × 2 台、白板 512×256、stocker 256²、MES 螢幕 256×160、包膜 256²、星芒 128²、名牌圖集 1024×512（全域共用，不計入場景 tracker） |
| 貼圖記憶體 | 約 11 MB | 24 MB | §2.7 |
| 光源 | 半球 1、平行 1、點 3 | 01 §9.7 | 手機點光源啟用 ≤2（§3.2） |

**各畫質等級的差異**

| 等級 | 差異 |
|---|---|
| L0 | 全部如上 |
| L1 | 像素比 1.5、無 MSAA；點光源同時啟用 ≤2；背景技術員 0 位 |
| L2 | 像素比 1；霧關閉、`camera.far = 60`；天車停在 z = −2；只有機台本體與人物有描邊（外殼柱、黃線、天車、FOUP、stocker 的描邊殼不建立）；星芒關閉；燈號閃爍照常（這是遊戲資訊，不是裝飾）；30 fps |
| L3 | 同 L2 的畫質；導航 `hotspot`，鏡頭只在 4 個 viewpoint 間切換（0.4 s 淡切，減少動態時直接切）；只在快照或鏡頭改變時重畫；玩家人物放在該 viewpoint 的對應 spot |
| L4 | 不建立 3D；顯示 §4.6 的 CSS 靜態背景＋DOM 地點與 hotspot 清單 |

### 4.3 `scn.gowning_room`：更衣室＋風淋室

> 對應 GDD §8.1、§11「更衣室」「風淋室」、FD §5.2（換鞋 → 自動洗手 → 依序著裝 → 風淋室舉手轉圈）。

**平面配置圖**（俯視；1 格約 0.5 m）

```text
          x = -4    -3    -2    -1     0     1     2     3     4
              ┊     ┊     ┊     ┊     ┊     ┊     ┊     ┊     ┊
 z = +4.0  ████▌ 入口（門禁大廳） ▐██████████████████████████████
 z = +3.0  █ W(洗手機)                                  ▤▤▤▤▤▤ █  ▤ 鞋櫃（外鞋）
 z = +2.0  █                                            ▤▤▤▤▤▤ █
 z = +1.5  █ ═════════════ 跨越椅（髒區｜潔淨區分界）══════════ █
 z = +0.5  █ ╪ 無塵衣掛架                                ▦ 耗材架 █  ▦ 口罩／髮罩／頭罩／鞋／衣／手套 6 格
 z = −1.0  █ ╪                                           ▦       █
 z = −2.5  █ ╪                     ★ 著裝順序看板（右牆）  ▦       █
 z = −4.0  ██████[ 全身鏡 ]███████████████▌風淋入口▐████████████
 z = −4.8                                 │  ⇉  ⇇  │              ⇉⇇ 噴嘴
 z = −5.6                                 └─▌出口▐─┘ ● 燈號（紅→綠）
                                              ↓ 往 scn.fab_bay
```

**物件清單**

| 物件 | 尺寸 | 位置 | 材質／色 | 描邊 | 備註 |
|---|---|---|---|---|---|
| 房間 | 8 × 8 × 3.0 m（x −4～4、z −4～4） | — | 地 `gowningTile` 貼圖（白底藍點塑膠地板）；牆 `wallPanel`；天花板白 | 無 | — |
| 風淋室 | 內部 1.4 W × 1.6 D × 2.3 H | x 1.6～3.0、z −5.6～−4.0 | 不鏽鋼 `steel`＋噴嘴貼圖 | 外殼 `L` | 兩側門互鎖（FD §5.2） |
| 風淋門 ×2 | 0.9 × 2.1 m | z = −4.0、z = −5.6 | `steel`＋窗 `stockerWindow` | `M` | 開關動畫 0.4 s 滑動；減少動態時直接開 |
| 風淋燈號 | 球 r = 0.08 ×2（紅、綠） | 出口門上方 (2.3, 2.4, −5.55) | basic；亮紅 `ff2020`／亮綠 `38ff6a`／暗色同 §1.6 | `S` | 3D 只表現「待機紅、完成綠」；倒數與轉圈的演出在 03 的 DOM 畫面 |
| 跨越椅 | 7.2 × 0.45 × 0.4 m | z = 1.5 | 椅面 `benchBlue`、腳 `steel` | `L` | 真實更衣室的髒／潔淨分界 |
| 自動洗手機 | 0.6 × 1.2 × 0.45 m | (−3.65, 0, 3.0) | `steel`，感應孔黑 | `M` | `hs.gown_wash` |
| 鞋櫃 | 3.0 × 1.2 × 0.4 m，6 × 3 格 | 右牆 x = 3.8，z 1.9～3.9 | `desk` ＋格線貼圖 | `L` | — |
| 無塵衣掛架 | 桿 3.6 m ＋ 6 件掛著的衣服（扁膠囊） | 左牆 x = −3.7，z −3.0～0.6 | 衣 `suit`、桿 `steel` | 衣 `M` | `hs.gown_rack` |
| 耗材架 | 1.2 × 1.8 × 0.4 m，6 格 | 右牆 x = 3.8，z −2.8～0.2 | 架 `steel`；6 個盒子用 6 種圖示貼紙（口罩、髮罩、頭罩、鞋、衣、手套） | `M` | 03 的著裝小遊戲沿用同一組圖示（§9.27） |
| 著裝順序看板 | 1.4 × 0.9 m | 右牆 (3.95, 1.6, −2.5) | basic ＋ 看板貼圖：「著裝順序 ① 口罩 ② 髮罩 ③ 頭罩 ④ 無塵鞋 ⑤ 無塵衣 ⑥ 手套」（GDD §8.1） | 無 | 文字用 `--f-head` 900 |
| 全身鏡 | 1.5 × 2.0 m | 後牆 x −2.5～−1.0、z = −3.98 | basic `mirrorSilver`；鏡框 `toolBlack` | 框 `S` | 見下方「假鏡子」；`hs.gown_mirror` |

**假鏡子**：不做反射。鏡子後方放一個主角 `CharacterRig` 的鏡像實例（`root.scale.x = −1`，位置對鏡面 z = −3.98 對稱），每幀複製主角的位置、朝向與動作；只有主角距離鏡子 ≤4 m 時才顯示與更新。鏡框外側用牆擋住，看不到鏡像的「房間」。主角穿無塵衣時鏡中只露出眼睛（GDD §11「鏡子裡的你只露出眼睛」，這是無塵衣模型自然的結果）。L2 以下改成鏡面上一張靜態的「鏡中剪影」貼圖。

**hotspot**：`hs.gown_wash` (−3.0, 3.0)、`hs.gown_rack` (−2.9, −1.2)、`hs.gown_mirror` (−1.75, −3.2)、`hs.air_shower` (2.3, −3.3)、`hs.gown_exit`（風淋室出口內側 (2.3, −5.2)，風淋完成後才由內容啟用）。全部 `loc.gowning_room`。

**spot**：`entry` (−2.5, 3.4, yaw 0)、`wash` (−3.0, 3.0, +90°)、`rack` (−2.9, −1.2, +90°)、`mirror` (−1.75, −2.9, 0)、`shower_queue` (2.3, −3.0, 0)、`shower_inside` (2.3, −4.8, 0)、`meiling_check` (0.6, −2.0, −135°)（美玲姐檢查服裝的位置，GDD §8.1 好感 +1）。

**鏡頭**：房間只有 3 m 高，跟隨鏡頭會撞到天花板，所以本場景使用**分區固定機位＋自由走動**：玩家可以自由走，鏡頭依玩家所在分區切到下表機位，並以 yaw ±15° 追蹤玩家（彈簧阻尼）。

| 分區 | 範圍 | 機位 | 目標 | FOV |
|---|---|---|---|---|
| 入口與洗手 | z ≥ 1.5 | (3.4, 2.5, 3.6) | (−1.0, 1.0, 0.5) | 62 |
| 著裝區 | −4.0 ≤ z < 1.5 | (3.2, 2.5, 1.2) | (−2.0, 1.0, −3.0) | 62 |
| 風淋室 | z < −4.0 | (−0.5, 2.3, −2.6) | (2.3, 1.2, −4.8) | 56 |

L3 的 viewpoint 就是這 3 個機位。

**光源**：`gowningWhite`；建構時建立 半球 1、平行 1、點 1（演出用）。

**預算**：三角形約 14,000（上限 30,000）；draw calls 約 28（上限 桌機 45、手機 35）；貼圖 8 張（地板 128²、牆 256²、噴嘴 128²、鞋櫃 256²、看板 512×256、耗材圖示圖集 512×128、鏡中剪影 256×512、名牌圖集共用）；同畫面人物 ≤3（主角、鏡像、美玲姐或技術員）。

**各等級差異**：L1 無 MSAA；L2 鏡子改靜態貼圖、門不做滑動動畫；L3 三個機位、玩家放在對應 spot；L4 CSS 背景（§4.6）。

### 4.4 `scn.office`：工程師辦公室＋會議角

> 對應 GDD §11「工程師辦公室」「會議室」（01 §3 把會議角放在 `office.ts`）、序章「被清空的座位」、早會（01 §6.4 `briefing` 用 `scn.office`）。

**平面配置圖**（俯視；1 格約 0.5 m）

```text
          x = -8      -6      -4      -2       0       2       4       6       8
              ┊       ┊       ┊       ┊       ┊       ┊       ┊       ┊       ┊
 z = -5.5  ███[ 白板 ]███████████[ 良率大螢幕 ]███████████[ 投影幕 ]████████████
 z = -4.5  ▯                          ┌──┐                 ┌─────────────┐     █  ▯ 窗（左牆，看得到廠房）
 z = -3.8  ▯                          │林│ 課長座位        │  會議長桌   │     █
 z = -2.8  ▯                          └──┘                 │  6 人       │  ⎙  █  ⎙ 印表機
 z = -1.5  ▯    ┌────┬────┐      ┌────┬────┐              └─────────────┘     █
 z = -0.8  ▯    │    │    │      │    │    │                                  █
 z = -0.1  ▯    └────┴────┘      └────┴────┘                     ✿            █  ✿ 盆栽
 z = +1.9  ▯    ┌────┬────┐      ┌────┬────┐                                  █
 z = +2.6  ▯    │    │    │      │ ▒  │ ★  │  ▒ 被清空的座位  ★ 你的座位      █
 z = +3.3  ▯    └────┴────┘      └────┴────┘                              ▐門▌  門 → 走廊（往更衣室）
 z = +5.5  ████████████████████████████████████████████████████████████████████
```

**物件清單**

| 物件 | 數量 | 尺寸 | 位置 | 材質 | 描邊 |
|---|---|---|---|---|---|
| 房間 | 1 | 16 × 11 × 3.0 m（x −8～8、z −5.5～5.5） | — | 地毯方塊 `officeFloor` 貼圖；牆 `officeWall`；天花板白＋日光燈板 | 無 |
| 窗 | 4 | 2.0 × 1.4 m，下緣 0.9 m | 左牆 x = −7.98，z = −4、−1.5、1、3.5 | basic ＋ 窗景圖集（日：灰白廠房＋藍天；夜：黑底＋廠房點點燈） | 框 `XS` |
| 島型座位 | 4 島 × 4 席 ＝ 16 席 | 桌 1.4 × 0.75（高）× 0.7 m | 島中心 (−5.0, −0.8)、(−1.2, −0.8)、(−5.0, 2.6)、(−1.2, 2.6) | 桌面 `desk`、桌腳與隔板 `deskDark` | 桌 `M` |
| 螢幕 | 16＋1 | 0.6 × 0.38 m | 每張桌子上 | 框 `monitorBezel`；畫面用螢幕圖集（不同的 SPC 圖、mail、Excel 格子） | 框 `XS` |
| 椅子 | 16＋1＋6 | 座 0.5 × 0.5 m，高 0.45 m，椅背 0.5 m | 每張桌子後、課長、會議桌 | `chair` | `S` |
| 課長座位 | 1 | 桌 1.8 × 0.8 m，面向 +z（面對全課） | (0, −3.8) | `desk`＋桌上家庭照片框、2 支手機 | `M` |
| 白板 | 1 | 3.0 × 1.2 m | 後牆 x −6～−3，下緣 0.9 m | basic ＋ 白板貼圖（手寫的 lot 清單與 PM 排程） | 框 `XS` |
| 良率大螢幕 | 1 | 2.4 × 1.35 m | 後牆中央，下緣 1.4 m | basic ＋ 大螢幕貼圖：「FAB 7 良率指數」＋數字（`snapshot.yieldIndex`，§14 CR-04；`null` 時顯示「--.-%」） | 框 `S` |
| 會議長桌 | 1 | 3.2 × 0.75 × 1.2 m | (5.3, −2.8) | `desk` | `L` |
| 投影幕 | 1 | 2.6 × 1.5 m | 後牆 x 4.0～6.6 | basic，`officeDay` 時白、PUA 演出時換成紅白放射貼圖（GDD §11「PUA 時切換成紅白放射背景」） | 框 `XS` |
| 印表機 | 1 | 0.7 × 1.1 × 0.6 m | (7.3, 1.5) | `toolBody`＋`toolBand` | `M` |
| 盆栽 | 2 | 盆 0.4 m、葉球 r 0.45 | (3.6, 0.6)、(7.2, 4.6) | 盆 `deskDark`、葉 `plant` | `S` |
| 被清空的座位 | 1 | 桌上一個紙箱（0.45 × 0.3 × 0.35 m）＋3 張便利貼 | (−1.9, 2.25) | 紙箱 `c9a77a`（登記到 `PALETTE.cardboard`） | `M` |

**hotspot**：`hs.office_seat`（你的座位 (−0.5, 3.0)）、`hs.office_empty_seat`（(−1.9, 3.0)，序章）、`hs.office_lin`（課長座位前 (0, −2.9)）、`hs.office_board` (−4.5, −4.6)、`hs.office_screen` (0, −4.4)、`hs.office_meeting` (5.3, −1.6)、`hs.office_printer` (6.6, 1.5)、`hs.office_exit` (7.3, 3.5)。全部 `loc.office`。

**spot**：`entry` (7.0, 3.5, −90°)、`player_seat` (−0.5, 2.95, 0)、`empty_seat` (−1.9, 2.95, 0)、`lin_desk` (0, −4.4, 180°)、`lin_standing` (−1.0, −3.2, 160°)、`board_front` (−4.5, −4.4, 0)、`meeting_head` (7.1, −2.8, −90°)、`meeting_l1`～`meeting_l3`（z −3.6，x 4.2、5.3、6.4，yaw 180°）、`meeting_r1`～`meeting_r3`（z −2.0，同 x，yaw 0）、`printer` (6.5, 1.5, −90°)。

**鏡頭**

| 用途 | 位置 | 目標 | FOV | 備註 |
|---|---|---|---|---|
| `default` 跟隨 | 玩家後方 5.0 m、高 2.4 m；y ≤ 2.75、位置夾限在房間內縮 0.3 m | 玩家 ＋ (0, 0.97, 0)（俯角 16°） | 依寬高比 54～84 | 天花板 3 m |
| `topDownDesk` 錨點 | 玩家座位桌面中心 (−0.5, 0.76, 2.25) ＋ (0, 1.6, 0.001) | 桌面中心 | 40 | 考績公布（§7.2） |
| 早會（入場鏡頭） | (2.6, 2.3, 0.5) | (5.5, 0.9, −3.2) | 56 | 會議角 |

**L3 viewpoint**：`vp_office_team` (6.5, 2.6, 5.0) → (−2, 0.8, 0)，含座位類 hotspot；`vp_office_meeting` (2.6, 2.3, 0.5) → (5.5, 0.9, −3.2)，含會議與印表機；`vp_office_back` (−6.8, 2.5, 4.5) → (0, 1.2, −4.5)，含白板、大螢幕、課長座位、出口。

**光源**：`officeDay`／`officeNight`；建構時建立 半球 1、平行 1、點 2（螢幕光、演出用）。

**預算**：三角形約 30,000（上限 60,000）；draw calls 約 44（6 位人物；上限 桌機 70、手機 50）；貼圖 11 張（地毯 128²、牆 256²、窗景圖集 1024×512、白板 512×256、大螢幕 512×256、螢幕圖集 1024×512、投影幕 2 張 512×256、便利貼 128²、紙箱 128²、名牌圖集共用）。

**各等級差異**：L1 無 MSAA、點光源 ≤2；L2 桌椅與螢幕不做描邊、只有人物與課長桌有描邊；L3 三個 viewpoint；L4 CSS 背景。

### 4.5 2.5D 背景（`scenes/backdrop_2_5d.ts`，01 §9.11）

2.5D 場景是固定鏡頭的小房間，用 `BackdropSpec`（01 §9.11）描述。MVP 需要的 6 個如下（v1.2 審查回合 1 R1-C 新增 `scn.academy_classroom`；ID 沿用本節的 `scn.` 前綴，因為 `SceneId` 的型別是 `` `scn.${string}` ``）；`props.kind` 與 `lighting` 中標 ＊ 的值是 01 目前沒有、本書請求新增的（§14 CR-07）。

| `SceneId` | 用途 | `room`（W × D × H，牆色，地色） | `props` | `lighting`（依 `timeOfDay`，CR-01） | `camera`（位置 → 目標，FOV，roll） |
|---|---|---|---|---|---|
| `scn.room` | 起床、夜間、就寢、on-call（01 §6.4） | 3.2 × 3.6 × 2.6，`f3e6d3`，`b98d62`（木地板） | `bed` (−0.9,0,−0.8)、`desk` (1.0,0,−1.5)、`phone` (−0.6,0.5,−0.4)、`window`＊ (0,1.3,−1.79)、`calendar`＊ (1.55,1.5,−0.8) | dawn → `dawnBlue`；day → `coldWhite`；dusk、night → `warmLamp`；`phoneGlow` 為 true → `phoneGlow` | (1.4,1.7,2.2) → (−0.3,0.7,−0.8)，50°，0 |
| `scn.bus` | 通勤交通車（GDD §11） | 2.6 × 6.0 × 2.4，`d9dde2`，`5a5f66` | `busSeat` × 6 排（x ±0.75，z −2.5～2.5 每 1 m）、`busWindow`＊ 左右各一條（窗外是園區塞車的捲動貼圖） | dawn → `dawnBlue`；其他 → `coldWhite` | (0.2,1.5,2.8) → (−0.75,1.0,−0.5)，55°，0 |
| `scn.hr_room` | HR 面談、PIP、E10 | 3.6 × 3.6 × 2.7，`f7f8f8`，`d8dbdd` | `hrDesk`＊ (0,0,−0.4)、`tissueBox`＊ (0.55,0.76,−0.4)（GDD 細節：面紙盒）、`folder`＊ (−0.3,0.76,−0.3) | 一律 `coldWhite`，強度 ×1.25（「過度明亮的冷白光」） | (0,1.25,1.6) → (0,1.0,−0.6)，48°，0 |
| `scn.cinema` | 電影院的 call 機（GDD §5.5 範例六） | 8 × 8 × 5，`1a1a24`，`2a1e22` | `cinemaSeats` × 4 排、`screen`＊ (0,2.5,−3.9) | 一律 `screenBlue`；`phoneGlow` 為 true 時疊上手機冷白光 | (2.4,1.4,1.2) → (0,1.0,0)，45°，0.03 |
| `scn.academy_classroom`（v1.2） | 穹晶學院教室：第一章新訓日的上午課程與事件（#6 開訓、SOP 排序題、#7 默畫機台、值班演練說明、併入時的 #8 公開處刑；01 §6.4） | 7.2 × 6.0 × 2.9，`eef1f3`，`b8bec4`（淺灰塑膠地板） | `longTable` × 3 排（x 0，z −0.4、0.8、2.0；每排 3 個人形 spot）、`desk`（講桌）(1.9,0,−2.0)、`screen` (0,1.7,−2.95)、`projector` (0,2.7,0.6)、`window`＊ 左牆 (−3.59,1.5,0.5) | 一律 `coldWhite`（日光燈＋投影）；`dawn` → `dawnBlue`（不會用到，保底） | (3.0,1.9,3.4) → (−0.2,1.0,−1.2)，50°，0 |
| `scn.clinic` | 醫務室（體力歸零「眼前一黑」） | 4 × 4 × 2.7，`eef5ef`，`cfd8d1` | `clinicBed`＊ (−1.0,0,−0.8)、`bpMonitor`＊ (0.6,0.8,−1.6)、`curtain`＊ (0.2,0,−0.2) | 一律 `softGreen`＊（柔和的白綠色，GDD §11） | (1.6,1.5,1.8) → (−0.6,0.6,−0.8)，50°，0 |

**2.5D 光組**（`lighting` 值；格式同 §3.2）

| `lighting` | 半球光 | 平行光 | 點光源 | 背景 | 情緒 |
|---|---|---|---|---|---|
| `warmLamp` | `ffe0b8`／`3a2a20`，0.84〔0.55〕 | 0 | 檯燈 `ffb45a` 3.60〔1.4，參考 0.8 m，distance 5〕，位於 `desk` 上方 0.5 m | `2a1d16` | 夜晚的房間 |
| `phoneGlow` | `20283a`／`05070c`，0.31〔0.35〕 | 0 | 手機 `dfe8ff` 1.13〔1.1，參考 0.4 m，distance 3〕，位於 `phone` 上方 0.15 m | `05070c` | 凌晨 on-call：只剩手機的冷白光照在臉上（GDD §11） |
| `dawnBlue` | `b8c8e8`／`39404f`，1.43〔0.7〕 | `ffe8c8`，0.84〔0.55〕，從窗外低角度 | 無 | `8fa3c4` | 清晨的藍灰色 |
| `coldWhite` | `ffffff`／`b8bcc0`，3.14〔1.0〕 | `ffffff`，1.43〔0.7〕 | 無 | `e9ecef` | 冷白、太亮 |
| `screenBlue` | `1a2140`／`05060c`，0.19〔0.28〕 | 0 | 銀幕 `7aa8ff` 14.8〔1.6，參考 4 m，distance 12〕，位於 `screen` 前 0.5 m | `05060c` | 黑暗中的銀幕藍光 |
| `redGold` | `ffcf8a`／`5a1a10`，2.20〔0.85〕 | `ffd27a`，1.43〔0.7〕 | 無 | `5a1a10` | 老家（完整版） |
| `softGreen`＊ | `f0fff4`／`a7b8aa`，2.49〔0.9〕 | `ffffff`，1.02〔0.6〕 | 無 | `e6f0e8` | 醫務室 |

- 2.5D 場景的人物用 Q 版人形（便服或辦公室服），固定在 `spot`；不能走動；`hotspot` 用 DOM 清單（跟 L4 相同的元件，§4.6）。
- **`scn.academy_classroom` 的 hotspot 與 spot**（v1.2）：hotspot `hs.classroom_seat`（你的座位，上午課程的進入點）、`hs.classroom_exit`（「下午見習：前往 FAB」，午餐後才由內容啟用；走過去＝經更衣室的著裝 QTE（01 §6.4，v1.3 N1）後轉場到 `scn.fab_bay`）；全部 `loc.academy_classroom`（`cleanroom: false`、`mode: '2.5d'`）。spot：`lectern` (1.9,−2.0, 180°，老K 的 Q 版人形，§6.4)、`player_seat` (0.6,0.8, 180°)、`classmate_1`～`classmate_8`（其餘座位；小晴、豪哥固定在 `player_seat` 兩側，其他是無名同期，背景人物上限同 §6.2）。
- 2.5D 場景不受 L0～L3 影響（都很輕），只受 L4（WebGL 不可用）影響。
- **捲動貼圖**（交通車窗外）：`map.offset.x += 0.02 × dt`；減少動態時靜止。

### 4.6 L4 靜態背景（無 3D 模式）

WebGL 不可用時（01 §9.7 L4），每個場景改成 CSS 組成的漫畫格背景，加上 DOM 的地點與 hotspot 清單。需要 UI 層的新元件 `scene_fallback`（§14 CR-08）。

```text
桌機（1280×720）                                   手機（390×844）
┌──────────────────────────────────────────────┐  ┌────────────────────────┐
│[HUD]                              [數值面板]  │  │[HUD 一列]              │
│ ┌──────────────────────────────────────────┐ │  │[數值 2 欄]             │
│ │ 漫畫格背景：天花板黑帶＋FFU 格線             │ │  │┌──────────────────────┐│
│ │ 牆板米白＋下緣網點                          │ │  ││ 場景格（16:9 縮小）   ││
│ │ ▮▮ ▮▮ ▮▮ ▮▮  ← 機台剪影（燈號＝DOM 小圓點）  │ │  ││ ▮▮ ▮▮ ▮▮ ▮▮          ││
│ │ 地板淺灰＋孔格網點                          │ │  │└──────────────────────┘│
│ └──────────────────────────────────────────┘ │  │ 地點：蝕刻 bay ▾        │
│  地點：［蝕刻 bay］［黃光區入口］              │  │ ┌────────────────────┐ │
│  可以去：［ET-03 ● ALARM］［ET-04 ● RUN］…     │  │ │ ET-03  ● ALARM  ▶ │ │
│          ［MES 終端］［交接白板］［分機電話］   │  │ │ ET-04  ● RUN    ▶ │ │
└──────────────────────────────────────────────┘  │ └────────────────────┘ │
                                                  └────────────────────────┘
```

| 場景 | CSS 組成（由上而下的圖層） |
|---|---|
| `scn.fab_bay` | 天花板 `#3a3a3f` 帶＋`repeating-linear-gradient` 的 FFU 格線；牆 `--paper` ＋ 下緣 `--dots-panel`；4 個機台剪影（inline SVG 方塊，燈號是 DOM 圓點，顏色與文字依 `snapshot.machines`）；地板 `--grey` ＋ 孔格網點；下緣 `--stripe-hazard` 細帶。`bayAlarm` 時外框加 `fx-alert` 的靜態紅暈（不脈動） |
| `scn.gowning_room` | 白牆＋藍色長椅色帶＋掛衣剪影；右側風淋室的不鏽鋼方塊＋紅／綠燈 |
| `scn.office` | 綠白牆＋窗格（日／夜兩色）＋桌子剪影列＋大螢幕方塊（良率數字是 DOM 文字） |
| 2.5D 場景 | 牆色＋地色兩塊＋1 個主要道具剪影（床、座椅列、桌子、銀幕、病床、教室長桌列）＋光組的主色暈影 |

- 機台狀態在 L4 一律用**文字＋形狀**表示（`● RUN`／`▲ WARN`／`■ ALARM`），不只靠顏色。
- 背景 SVG 剪影全部 inline 在 CSS 的 `data:` URI（每個 ≤2 KB），不另外載入檔案。

### 4.7 完整版場景清單（列出，不在 MVP 實作）

| 場景 | 形式 | 主要物件 | 光組（新增） | 特別規範 |
|---|---|---|---|---|
| 門禁大廳＋安檢 | 3D 小 | 置物櫃（手機寄放）、金屬探測門、警衛、玻璃門 | `lobbyCold`：冷白、玻璃反光（用 basic 的斜向亮條貼圖） | MVP 用一張 DOM 轉場卡「手機寄放」 |
| 灰區（chase） | 3D | 機台背板、管線束、泵浦、維修燈 | `chaseGrey`：冷灰藍、暗；FFU 底噪 +4 dB | 從 bay 機台之間的維修門進入 |
| 薄膜／擴散／CMP 區 | 3D | 爐管（直立圓柱）、研磨機台 | 擴散 `heatOrange`、CMP `slateBlue`（點綴色） | 走道換材質沿用 `fab_shell` |
| 量測區 | 3D | CD-SEM、膜厚量測機 | `metroBlue`：冷藍螢幕光 | — |
| Sub-fab | 3D | 真空泵、化學品管路、低矮天花板 2.6 m | `subfabOrange`：橘色旋轉警示燈（1 Hz，減少動態時固定） | — |
| 會議室（獨立） | 3D 小 | 投影幕、長桌 | 冷色、投影機藍光；PUA 時紅白放射 | MVP 由辦公室會議角代替 |
| 部經理辦公室 | 2.5D | 大辦公桌、落地窗外的廠區 | `backlitSilhouette`：強逆光，沈部經理是剪影（立繪剪影版同步） | — |
| 公司餐廳美食街 | 3D 小 | 攤位、餐桌 | 暖色、人聲 | 背景人物上限 8 |
| 茶水間 | 3D 小 | **飲水機**、咖啡機、冰箱 | 窄小暖黃 | E15「泡麵泡不爛」 |
| 頂樓休息平台 | 3D 小 | 空調機房、長椅、**高圍欄** | `dawnRoof`：黎明粉橘、開闊 | **GDD §13.4（強制）**：圍欄高 ≥2.2 m、垂直欄杆間距 ≤0.1 m、頂端內彎，顏色用高對比的 `toolBand`＋黃色頂緣，從任何鏡頭角度都清楚可見；可走範圍距圍欄 ≥2.5 m；鏡頭俯角限制為 ≤0°（**永遠不往下拍**）、鏡頭不得放在可走範圍以外；沒有任何靠近邊緣的 spot 或動作；只有長椅、日出、聊天的 spot；精神 ≤35 時場景一定有阿哲或老K 的 actor |
| 停車場 | 3D 小 | 林課長的車（車內亮著手機） | `sodiumNight`：深夜鈉燈橘 | 「課長的夜晚」 |
| 健身房／運動館、金沙街、老家、約會餐廳、醫院（E13） | 2.5D | 依 GDD §11 | `gymBright`、`streetNeon`（晨光黃／霓虹粉）、`redGold`、`diningWarm`、`softGreen` | 醫院不出現醫療細節（GDD §13） |
| 外派廠（櫻花／沙漠） | 3D | `scn.fab_bay` 換材質與標示語言 | 櫻花 `sakuraPink`、沙漠 `desertOrange` | 標示語言換成日文／英文 |

---

## 5. 道具目錄

> 每個道具是 `props/*.ts` 的一個 `create*()` 工廠，回傳 01 §9.5 的 `PropHandle<S>`。尺寸單位 m；「本體」與「描邊」都計入三角形預算；描邊欄的代號見 §2.3（範例有特定值時直接寫數字）。真實比例參考 FD §5；刻意誇張處另註。

### 5.1 蝕刻機台 `createEtchMachine`（`props/machine.ts`）

真實參考：300 mm 乾式蝕刻機台寬約 2.5～3 m、高約 2.5～2.8 m；只有正面（EFEM 與 load port）露在潔淨區，背面在灰區（FD §5.4 bay-and-chase）。

| 部件 | 幾何（W × H × D，x 方向為「深度」時另註） | 位置（機台本地座標；`fx = −facing × 1.2` 為正面，`dir = facing`） | 色 | 描邊 | 來源 |
|---|---|---|---|---|---|
| 本體 | box 2.4 × 2.7 × 3.2 | (0, 1.35, 0) | `toolBody` | 0.05 | 範例值 |
| 頂部色帶 | box 2.44 × 0.28 × 3.24 | (0, 2.8, 0) | `toolBand` | 0.04 | 範例值 |
| 底部色帶 | box 2.44 × 0.3 × 3.24 | (0, 0.15, 0) | `toolBand` | 0.04 | 範例值 |
| EFEM 門板 | box 0.08 × 1.4 × 1.3 | (fx + dir·0.04, 1.1, −0.85) | `toolDoor` | 0.03 | 範例值 |
| 門把 | box 0.1 × 0.5 × 0.06 | (fx + dir·0.1, 1.1, −0.3) | `toolBlack` | 0.02 | 範例值 |
| 螢幕邊框 | box 0.14 × 0.8 × 1.25 | (fx + dir·0.07, 1.7, 0.75) | `toolBlack` | 0.04 | 範例值 |
| 觸控螢幕 | plane 1.1 × 0.68 | (fx + dir·0.15, 1.7, 0.75)，朝外 | basic ＋ 螢幕圖集／down 專用貼圖 | 無 | 範例值 |
| 機台標牌 | plane 1.2 × 0.3 | (fx + dir·0.04, 2.4, 0.75) | basic ＋ 標籤圖集（白底黑框黑字「ET-03」） | 無 | 範例值 |
| Load port 平台（新增） | box 0.5（外伸）× 0.06 × 1.3 | (fx + dir·0.25, 0.88, −0.85) | `toolBand` | 0.03 | 新增：真實 load port 高約 0.9 m（SEMI 標準） |
| FOUP × 2（新增） | §5.3 | 平台上，z = −1.17、−0.53 | — | — | 新增 |
| 燈塔桿 | cylinder r 0.035，h 0.4，16 段 | (dir·0.9, 3.1, 1.3) | `toolBlack` | 0.03 | 範例值 |
| 燈號 × 3 | cylinder r 0.12，h 0.17，16 段 | 同 x、z；y = 3.34（綠）、3.54（黃）、3.74（紅） | §5.2 | 0.03 | 範例值 |

- **狀態** `setState(MachineStatus)`：

| 狀態 | 燈號 | 螢幕 | 其他 |
|---|---|---|---|
| `run` | 綠亮（`lampGreenOn`），其他暗色 | 黑底、綠色頂條、「RUN」34px | — |
| `warn` | 黃亮（`lampYellowOn`） | 黑底、黃色頂條、「WARN」34px | — |
| `down` | 紅燈閃爍 1.7 Hz、工作比 50%（範例 `(t × 1.7) % 1 < 0.5`） | 正常／反白兩張貼圖隨閃爍交替（範例 `screenTex(name,'down',inv)`），「ALARM」46px | 告警星芒（§5.2）；FOUP 掛紅色 hold 標籤；可能是紅點光源錨點（§3.2） |

- **色盲輔助**（不只靠顏色）：①燈號位置固定（紅在最上，IEC 60073 慣例，FD §5.5）；②螢幕文字 RUN／WARN／ALARM；③只有 `down` 會閃爍；④只有 `down` 有星芒；⑤設定「色彩輔助」開啟時，機台上方 3.9 m 多一個狀態圖示 sprite：`run` 無、`warn` 黃色三角形「▲」、`down` 紅色方塊「■」＋白色驚嘆號。
- **ET-07 包膜變體**（佈景）：外加一層 box 2.5 × 2.8 × 3.3、basic `wrapPlastic`、`opacity .55`（無描邊），表面貼黃黑膠帶貼圖兩條（`tapeYellow`）；標牌「ET-07 BUY-OFF」；燈號全暗。
- **三角形**：本體與部件約 300（含描邊）；燈號 3 × 128 ＝ 384（算在 instanced 燈號）；合計 ≤700，符合 01 的 ≤1,200。
- **合併**：本體、色帶、門板、門把、邊框、平台、燈塔桿標記 `userData.static = true` 交給 `static_batcher`；螢幕、燈號、FOUP 標籤、星芒不合併。

### 5.2 燈塔燈號與告警星芒

| 項目 | 規格 |
|---|---|
| 燈號網格 | 同一場景所有燈號共用 1 個 `InstancedMesh`（`CylinderGeometry(0.12, 0.12, 0.17, 16)`）＋ 1 個描邊 `InstancedMesh`（`CylinderGeometry(0.15, 0.15, 0.23, 16)`、`BackSide` 黑） |
| 材質 | 全部 `MeshBasicMaterial`，用 `setColorAt()` 設定每顆的亮色／暗色（範例的暗燈用 toon，這裡統一 basic 以合併成 1 個 draw call；暗色值沿用範例 `lampOff`，視覺差異可忽略） |
| 閃爍 | 所有 down 機台共用同一個相位（同一個時鐘），1.7 Hz、50%；減少動態與 `calm`：固定亮 |
| 告警星芒 | 每台 down 機台一個 `Sprite`，0.9 × 0.9 m，中心在紅燈旁 (+0.0, +0.05, 0)，貼圖 128²：8 角星，內黃 `ffd400`、外紅 `e60012`、墨黑 4px 外框，**硬邊無漸層**；亮相 scale 1.0、暗相 0.75；`depthWrite: false`；L2、減少動態（固定 1.0）、`calm`（隱藏） |

### 5.3 FOUP `createFoup`（`props/foup.ts`）

真實參考：300 mm FOUP 約 0.39 W × 0.34 H × 0.33 D、滿載 7～9 kg、25 片（FD §5.5）。範例放大約 1.2 倍以便辨識，沿用。

| 部件 | 幾何 | 位置 | 色 | 描邊 |
|---|---|---|---|---|
| 外殼 | box 0.46 × 0.4 × 0.46 | (0, 0, 0) | `foupShell` | 0.04（範例值） |
| 頂部把手 | box 0.34 × 0.06 × 0.12 | (0, 0.25, 0) | `foupHandle` | 0.03（範例值） |
| 前門 | box 0.4 × 0.3 × 0.02 | (0, −0.02, 0.24) | `foupDoor` | 0.02（範例值） |
| Hold 標籤（新增） | plane；hold：0.2 × 0.14，紅 `holdTagRed`；正常：0.12 × 0.08，白 `holdTagWhite` | 前門右上角，離門 0.005 | basic，instanced | 無 |

- `setState('normal' | 'hold')`：hold 標籤**大小也不同**（色盲輔助：大紅牌＝hold）。
- 三角形 ≤80（含描邊），符合 01 的 ≤150。

### 5.4 天車（OHT）＋軌道 `createOht`（`props/oht.ts`）

真實參考：天花板下環形軌道，小車用夾爪與升降機構抓放 FOUP（FD §5.5「銀色高速公路」）。

| 部件 | 幾何 | 位置（天車本地；天車根節點 y = 0） | 色 | 描邊 |
|---|---|---|---|---|
| 車體 | box 0.9 × 0.34 × 1.7 | (0, 5.2, 0) | `ohtBody` | 0.05（範例值） |
| 前端紅帶 | box 0.92 × 0.1 × 0.5 | (0, 5.2, 0.55) | `ohtStripe` | 0.03（範例值） |
| 升降桿 × 2 | box 0.08 × 0.5 × 0.08 | (±0.26, 4.8, 0) | `toolBlack` | 0.02（範例值） |
| 夾爪 | box 0.7 × 0.12 × 0.7 | (0, 4.5, 0) | `railSteel` | 0.04（範例值） |
| 吊掛 FOUP | §5.3 | (0, 4.15, 0) | — | — |
| 軌道（靜態） | box 0.28 × 0.22 × 70 | 場景 (0, 5.62, −14) | `railSteel` | 0.04（範例值） |
| 吊架 × 4（靜態） | box 0.12 × 0.4 × 0.12 | z = 8、2、−4、−10（範例值，01 D70），y = 5.82 | `railSteel` | 0.03（範例值） |
| Stocker 支線（靜態，新增） | box 4.7 × 0.22 × 0.28 | (2.35, 5.62, 8.5) | `railSteel` | 0.04 |

- **動畫**：`z = 8 − ((t × 2.6) mod 44)`，2.6 m/s（範例值）。完整版：在 stocker 支線與 load port 上方停 2 s、夾爪下降 3.3 m（1.2 s，ease-in-out）、再上升。
- **減少動態**：停在 z = −2（範例值）。L2：同。`calm`：停在當下位置。
- 車體部件在天車群組內依材質合併（車體、紅帶、黑、鋼 → 4 個網格＋1 個描邊網格）；三角形約 200，符合 ≤300。

### 5.5 其他 bay 設備

| 道具 | 檔案 | 尺寸 | 組成 | 色 | 描邊 | 三角形 | 動畫 |
|---|---|---|---|---|---|---|---|
| Stocker | `props/fab_shell.ts` | 2.8 × 3.6 × 5.0 | 本體 box；−x 面窗帶 plane 1.6 × 4.2（貼圖：格狀排列的 FOUP 剪影）；頂部 OHT 埠 box 0.9 × 0.4 × 1.0；小燈塔（綠常亮） | `stocker`、`stockerWindow`、`toolBand` | 本體 `L`、埠 `M` | ≤400 | 無 |
| MES 終端 | `props/fab_shell.ts` | 座 0.5 × 1.05 × 0.4；螢幕 0.6 × 0.4 × 0.06，後仰 15°，中心高 1.25 | 2 box ＋ 螢幕 plane（256×160：「MES」頂條＋lot 清單格線） | `toolBand`、`monitorBezel` | `M` | ≤150 | 無 |
| 交接白板 | `props/fab_shell.ts` | 3.0 × 1.2 × 0.04，下緣 0.9；筆槽 box 3.0 × 0.04 × 0.08 | box ＋ basic 貼圖 512×256：LXGW 手寫體的交接清單（「ET-03 PM 22:00」「lot A7 hold 待判」「ET-05 seasoning 中」） | `whiteboard`、框 `steel` | 框 `XS` | ≤100 | 無 |
| 分機電話 | `props/fab_shell.ts` | 本體 0.22 × 0.3 × 0.08；話筒 box 0.06 × 0.24 × 0.06 | 2 box ＋ 紅色小標牌「分機 7301」 | `toolBody`、`toolBlack`、紅 | `XS` | ≤60 | 無（來電時的演出在 UI） |
| 黃光區機台 × 2 | `props/fab_shell.ts` | 本體 2.2 × 2.6 × 2.6；頂 1.6 × 0.5 × 1.8 | 範例值；正面加一條 basic 窗帶 1.4 × 0.3（`ffd27a` 暗化 50%） | `photoTool`、`photoToolTop` | 0.05 | ≤240 | 無 |

### 5.6 建築貼圖（`canvas_textures.ts`）

| 貼圖 | 尺寸 | 畫法 | 重複 | 來源 |
|---|---|---|---|---|
| 高架地板 `floorTex` | 128² | 底 `#d8d6cc`；4 × 4 個實心孔 r = 7 px `#1b1b1b`，間距 32 px、起點 16；外框 6 px `#000` | (21.67, 166.67)，一格 0.6 m | 範例值（重複改為真實 0.6 m 格板） |
| 牆板 `wallTex` | 256² | 底 `#efede6`；外框 8 px；y = 190 處 4 px 橫線；橫線以下 8 px 間距網點 r = 1.6、`rgba(0,0,0,.45)` | (7, 1) | 範例值 |
| 斜紋 `hazardTex` | 128² | 底 `#ffd400`；黑色 45° 斜帶，寬 16 px、間距 32 px | (16, 1) | 範例值 |
| FFU 天花板（新增） | 128²（代表 1.2 × 1.2 m＝兩片 1.2 × 0.6 m 的 FFU） | 底 `#ffffff`（乘上材質色 `3a3a3f`）；外框與中線 4 px `#000`；每片中央 0.8 × 0.4 比例的細網點區（濾網），點 r = 1、`#bbbbbb` | (10.83, 50) | 新增（GDD「頭頂 FFU 格子」、FD §5.4） |
| 螢幕 `screenTex` | 256×160（圖集 1024×512 放 8 格） | 範例 `screenTex()` 原樣：底 `#0d1114`；頂條 36 px（狀態色）；機台名 900 28px；狀態字 900 34px（ALARM 46px）；6 條假數據條 | — | 範例值 |
| 機台標牌 `signTex` | 256×64（圖集 1024×256） | 範例 `signTex()` 原樣：白底、8 px 黑框、900 38px 黑字置中 | — | 範例值 |
| PHOTO AREA 標牌 | 512×128 | 黑底、`#ffd400` 900 64px「PHOTO AREA」 | — | 範例值 |
| ETCH BAY 標牌（新增） | 512×128 | 白底 8 px 黑框；900 56px「ETCH BAY E1」；右下角紅色小字「蝕刻課」 | — | 新增 |

### 5.7 更衣室道具（`scenes/gowning_room.ts` 內的小工廠；只有本場景用，不放 `props/`）

| 道具 | 尺寸 | 組成 | 色 | 描邊 | 三角形 |
|---|---|---|---|---|---|
| 跨越椅 | 7.2 × 0.45 × 0.4 | 椅面 box ＋ 4 支腳 box | `benchBlue`、`steel` | `L`／`XS` | ≤120 |
| 自動洗手機 | 0.6 × 1.2 × 0.45 | 本體 box ＋ 感應孔（黑 plane 0.3 × 0.15） | `steel`、黑 | `M` | ≤40 |
| 鞋櫃 | 3.0 × 1.2 × 0.4 | box ＋ 6 × 3 格線貼圖 | `desk` | `L` | ≤30 |
| 掛著的無塵衣 × 6 | 0.5 × 1.3 × 0.12 | 扁膠囊（`CapsuleGeometry` r 0.06 縮放 x 4）＋ 衣架鉤 | `suit` | `M` | 6 × ≤120 |
| 耗材架 | 1.2 × 1.8 × 0.4，6 格 | 框 box ＋ 6 個盒子（盒面貼 §9.27 的 6 個著裝圖示） | `steel`、盒 `ffffff` | `M` | ≤200 |
| 風淋室 | 外殼 1.6 × 2.5 × 1.8；內 1.4 × 2.3 × 1.6 | 4 面板 ＋ 2 扇門 ＋ 2 面噴嘴貼圖（深色圓孔格） ＋ 2 顆燈號 | `steel`、黑孔、燈 basic | 外殼 `L`、門 `M`、燈 `S` | ≤400 |
| 全身鏡 | 1.5 × 2.0 | plane ＋ 框 4 box | `mirrorSilver`、`toolBlack` | 框 `S` | ≤60 |

### 5.8 辦公室道具（`scenes/office.ts` 內的小工廠）

| 道具 | 尺寸 | 組成 | 色 | 描邊 | 三角形 |
|---|---|---|---|---|---|
| 辦公桌 | 1.4 × 0.75 × 0.7 | 桌面 box 0.03 厚 ＋ 2 片側板 ＋ 前擋板；島型 4 張共用 1 片 1.2 m 高的隔板 | `desk`、`deskDark` | `M` | ≤80／張 |
| 螢幕 | 0.6 × 0.38，底座 0.2 | 邊框 box ＋ 畫面 plane（螢幕圖集）＋ 支架 box | `monitorBezel` | `XS` | ≤50 |
| 椅子 | 座 0.5 × 0.5、座高 0.45、椅背 0.5 × 0.5 | 座 box ＋ 背 box ＋ 柱 cylinder ＋ 5 爪 box | `chair` | `S` | ≤160 |
| 課長桌飾 | 相框 0.15 × 0.2；手機 × 2 0.07 × 0.15 | box | 框 `toolBlack`、照片 basic（兩個小孩的剪影貼圖）、手機黑 | `XS` | ≤60 |
| 會議長桌 | 3.2 × 0.75 × 1.2 | 桌面 ＋ 2 片桌腳板 | `desk` | `L` | ≤60 |
| 印表機 | 0.7 × 1.1 × 0.6 | 本體 ＋ 出紙匣 ＋ 小螢幕 | `toolBody`、`toolBand` | `M` | ≤80 |
| 盆栽 | 盆 0.4 × 0.45、葉球 r 0.45 | cylinder ＋ 3 個 sphere（10 × 8 段） | `deskDark`、`plant` | `S` | ≤500 |
| 紙箱（被清空的座位） | 0.45 × 0.3 × 0.35 | box ＋ 2 片開口翻蓋 | `cardboard` | `M` | ≤60 |

### 5.9 人物頭頂名字 sprite（全域共用）

| 項目 | 規格 |
|---|---|
| 圖集 | 1024×512，32 格（每格 256×64），由 `asset_sources` 在啟動時依角色清單繪製，不屬於任何場景的 tracker |
| 每格畫法 | 底 `--paper`、4 px 墨框（手繪感：四角各自 ±2 px 不規則）；左側 40 × 40 的名牌色方塊（§1.2）；右側姓名 900 34px 墨黑 |
| sprite | 0.9 × 0.225 m，位於頭頂上方 0.35 m；`sizeAttenuation: true`；`depthTest: true`（被機台擋住時不穿透） |
| 顯示規則 | fab 內的有名字角色一律顯示（GDD §12.2）；距鏡頭 >14 m 隱藏；對話演出鏡頭（`puaLowAngle`、`closeUp`、`topDownDesk`）時隱藏；fab 外只在 hotspot 靠近時顯示；主角顯示「你」 |

### 5.10 完整版道具清單

曝光機（EUV 校車大小，FD §5.5）、塗佈顯影機（含顏色標籤，GDD §8.10）、爐管（直立圓柱＋晶舟）、CMP 研磨機（轉盤動畫）、CD-SEM、膜厚量測機、真空泵（sub-fab，振動動畫）、化學品管路（顏色分類＋流向箭頭）、灰區管線束、機台背板、金屬探測門、置物櫃、飲水機、咖啡機、冰箱、長椅、高圍欄（§4.7）、林課長的車、餐廳攤位、跑步機。全部遵守 §2.3 描邊與 §1.6 色票；每個新道具要先登記三角形預算再實作。

---

## 6. Q 版人物規格

### 6.1 比例

**約 3.1 頭身、`heightScale = 1` 時身高 1.70 m**。範例的主角是部件組成的基礎（圓柱腿、圓柱軀幹、球頭、眼帶、口罩、藍手套、紅掛繩），但範例主角約 5.4 頭身、世界高度 2.54 m（被放大來當前景）；正式遊戲改成 Q 版比例：頭放大、腿縮短，讓 fab 內靠頭罩名牌辨識時名牌夠大。

**部件表**（`heightScale = 1`；所有尺寸再乘以 `heightScale`；x 為左右、z 為前方）

| 部件 | 骨骼 | 幾何（段數） | 尺寸 | 位置（中心） | 無塵衣色 | 便服／辦公服色 | 描邊 |
|---|---|---|---|---|---|---|---|
| 腳 × 2 | `legL`／`legR` | box | 0.17 × 0.11 × 0.28 | (±0.11, 0.055, 0.03) | `suitBoot` | `shoeColor`（固定 `2b2b2e`） | `S` |
| 腿 × 2 | `legL`／`legR` | cylinder r 0.085／0.095（12） | h 0.50 | (±0.11, 0.36, 0) | `suit` | `bottomColor` | `S` |
| 軀幹 | `spine` | cylinder r 0.19／0.25（12） | h 0.56 | (0, 0.89, 0) | `suit` | `topColor` | `M` |
| 手臂 × 2 | `armL`／`armR`（肩關節 (±0.25, 1.12, 0)） | cylinder r 0.06／0.065（12） | 長 0.44，向下 | 肩下 0.22 | `suit` | `topColor` | `S` |
| 手 × 2 | 同手臂 | sphere r 0.07（8 × 6） | — | 肩下 0.47 | `glove` | `skinTone` | `S` |
| 頭／頭罩 | `head`（頸關節 (0, 1.17, 0)） | sphere r 0.27（12 × 10） | — | (0, 1.42, 0) | `suit`（頭罩） | `skinTone`＋髮型（§6.3） | `S` |
| 臉窗 | `head` | sphere r 0.175（10 × 8） | — | (0, 1.40, 0.12) | `skinTone` | —（便服直接是臉） | 無 |
| 眼帶 | `head` | box | 0.30 × 0.075 × 0.06 | (0, 1.465, 0.265) | `eyeBand` | —（便服改成兩個眼睛 box 0.035 × 0.07 × 0.02，x ±0.075） | 無 |
| 口罩 | `head` | box | 0.28 × 0.12 × 0.07 | (0, 1.35, 0.27) | `mask` | —（便服改成嘴巴線 box 0.07 × 0.012 × 0.01） | 無 |
| 頭罩名牌 | `head` | plane（獨立網格，名牌圖集 UV） | 0.22 × 0.075 | (0, 1.60, 0.235)，`rotation.x = −0.5` | `badgeColor`＋白字（§1.2） | 不顯示 | 無 |
| 拉鍊 | `spine` | box | 0.035 × 0.5 × 0.02 | (0, 0.9, 0.245) | `glove` | — | 無 |
| 掛繩＋識別證 | `spine` | box × 2 | 繩 0.025 × 0.26 × 0.02；證 0.09 × 0.12 × 0.02 | 繩 (0.13, 1.0, 0.235)；證 (0.13, 0.84, 0.245) | `lanyard`、白 | 辦公服才有 | 無 |
| 眼鏡（`glasses: true`） | `head` | 兩個 `TorusGeometry(0.045, 0.008, 6, 10)`＋鼻樑 box | — | (±0.075, 1.43, 0.255) | 只在便服／辦公服顯示（無塵衣的眼帶已代表護目鏡） | `toolBlack` | 無 |

- **輪廓測試**：全身塗黑時要能分辨：無塵衣（大圓頭、無頭髮輪廓）vs 便服（各自的髮型輪廓）。
- **身高差**：`heightScale` 建議值見 §6.4；範圍 0.92～1.08，超出會破壞 Q 版比例。

### 6.2 三角形與 draw call

| 項目 | 無塵衣 | 便服 |
|---|---|---|
| 本體三角形 | 約 840 | 約 1,150（髮型 ≤300） |
| 描邊三角形 | 約 640（頭、手、腿、手臂、軀幹、腳） | 約 900（含髮型外殼） |
| 合計 | 約 1,480 | 約 2,050 |
| 01 上限 | ≤2,500 | ≤2,500 |
| draw calls | 本體 1 ＋ 描邊 1 ＋ 頭罩名牌 1 ＋ 頭頂名字 sprite 1 ＝ **4** | 本體 1 ＋ 描邊 1 ＋ sprite（只在 fab 外的 hotspot 附近）＝ 2～3 |
| 01 上限 | ≤6 | ≤6 |

### 6.3 組裝方式：剛性權重的 `SkinnedMesh`

程式化動作需要部件各自轉動，但 01 要求合併後 ≤6 個 draw call。做法：

1. 建 7 根骨骼：`root`（腰，y 0.61）→ `spine`、`legL`（(−0.11, 0.61)）、`legR`；`spine` → `head`（y 1.17）、`armL`、`armR`（肩）。
2. 每個部件的幾何先套用自己的本地變換，再寫入頂點屬性：`skinIndex = (骨骼索引, 0, 0, 0)`、`skinWeight = (1, 0, 0, 0)`、`color = 部件色`（用 `new Color(hex)` 取得的線性分量；不要再手動轉換）。
3. 用 `mergeGeometries` 合併成**本體**（`ToonKit.vertexColorMaterial()`：`MeshToonMaterial({ vertexColors: true, color: 0xffffff, gradientMap })`，§14 CR-13）與**描邊**（各部件的放大殼，`outlineMaterial`）兩個 `SkinnedMesh`，綁同一個 `Skeleton`。
4. 頭罩名牌與眼鏡是掛在 `head` 骨骼下的獨立小網格（名牌要用圖集貼圖；眼鏡只有部分角色有）。
5. 好處：2 個主要 draw call；動畫只轉骨骼；跟 Stage 6 的 glTF `SkinnedMesh` 走同一條渲染路徑（`normalExtrude` 也能直接套用）。

**髮型**（`hairStyle`，§14 CR-06；全部用 primitive 拼，掛在 `head`）

| `hairStyle` | 組成 | 用於 |
|---|---|---|
| `slick` | 頭頂半球殼（sphere r 0.285，取上半，`scale.y 0.7`）＋側分線 box 0.2 × 0.02 × 0.02 | 林課長 |
| `spiky` | 頭頂殼 ＋ 5 個 cone（r 0.05、h 0.12）朝上後方 | 阿哲 |
| `ponytail` | 頭頂殼 ＋ 瀏海 box ＋ 後方 cone（r 0.08、h 0.3，往下） | 小晴 |
| `curly` | 頭頂殼 ＋ 7 個 sphere（r 0.07）沿頭頂分布 | 豪哥 |
| `perm` | 頭頂殼放大 1.08 ＋ 9 個 sphere（r 0.06） ＋ 1 縷白髮 box | 美玲姐 |
| `long` | 頭頂殼 ＋ 後方 box 0.42 × 0.45 × 0.08（垂到肩） | Vivian |
| `swept` | 頭頂殼 `scale.y 0.6` ＋ 後梳 box | 沈部經理（`hairColor` 灰白） |
| `bob` | 頭頂殼 ＋ 兩側 box 0.08 × 0.25 × 0.25 | 阿安、主角外型 B |
| `short` | 頭頂殼 | 主角外型 A、無名 NPC |

### 6.4 角色外觀表（`CharacterAppearance`，值寫在 `content/characters.ts`；§13）

| 角色 | `heightScale` | `skinTone` | `hairColor` | `hairStyle`＊ | `badgeColor` | `glasses` | 辦公服 `topColor`／`bottomColor`＊ | 識別特徵（3D） |
|---|---|---|---|---|---|---|---|---|
| 主角 A／B | 1.00 | `fde7cf` | `2b211c` | `short`／`bob` | `ffd400` | false | `e9eef2`／`3a3f4a` | 頭頂「你」 |
| 林課長 | 1.02 | `fde7cf` | `0a0a0a` | `slick` | `e60012` | true | `e9eef2`／`2b2f3a` | 眼鏡、紅掛繩 |
| 阿哲 | 1.04 | `eac29e` | `0a0a0a` | `spiky` | `2a6fe0` | false | `2b3a55`（深藍連帽外套）／`3a3f4a` | 刺頭 |
| 小晴 | 0.95 | `f6d6b8` | `2b211c` | `ponytail` | `ff8a00` | false | `bfe8d6`（薄荷色開襟衫）／`4a4f57` | 馬尾 |
| 豪哥 | 1.00 | `eac29e` | `2b211c` | `curly` | `1f9e4a` | false | `4a4f57`（EE 深灰 polo）／`2b2f3a` | 捲髮 |
| 美玲姐 | 0.94 | `f6d6b8` | `4a3a2e` | `perm` | `8e44ad` | false | `9cc7e6`（技術員淺藍外套）／`3a3f4a` | 燙髮、一縷白髮 |
| Vivian | 0.98 | `fde7cf` | `0a0a0a` | `long` | `e8318a` | false | `1d1d22`（黑西裝外套）／`1d1d22` | 長直髮 |
| 沈部經理 | 1.06 | `eac29e` | `8d8a84` | `swept` | `0a0a0a`（金邊） | false | `23262e`（深色西裝）／`23262e`；領帶 `7a1424` | 最高、灰白後梳 |
| 阿安 | 0.97 | `f6d6b8` | `2b211c` | `bob` | —（不進 fab） | false | `c9733a`（暖橘棕開襟衫）／`5a4a3a` | 只在 fab 外出現 |
| 何佩珊（HR，MVP 只有文字） | 0.96 | `fde7cf` | `2b211c` | `bob` | — | false | `f7f8f8`／`3a3f4a` | 2.5D HR 面談室的人形 |
| 老K `chr.lao_k`（新訓講師，MVP 只有文字；v1.2） | 1.00 | `eac29e` | `8d8a84`（花白） | `short` | —（MVP 只在教室出現） | true（圓框） | `6b5a48`（開襟毛衣）／`3a3f4a` | 2.5D 教室講桌旁的人形 |
| 無名技術員 | 1.00 | 隨機 S1～S4 | — | `short` | `9aa3ad` | false | — | 只穿無塵衣 |

＊ `hairStyle`、`topColor`、`bottomColor` 是 §14 CR-06 新增欄位。

### 6.5 程式化動作（`CharacterClip`，01 §5.2）

動作是骨骼旋轉的時間函式（`character_rig.ts`），單位 rad；`t` 為秒；轉換時 0.25 s 交叉淡入（`fadeSec` 預設值）。

| `CharacterClip` | 用途 | 參數 | 減少動態 |
|---|---|---|---|
| `idle` | 待機 | `root.y = 0.008·sin(2π·0.5t)`；`spine.x = 0.03·sin(2π·0.25t)`；`head.y = 0.05·sin(2π·0.13t)`；手臂 ±0.04 | 靜止姿勢（`spine.x = 0.03`） |
| `walk` | 走路 | 頻率 `f = 速度 / 1.1`（1.6 m/s → 1.45 Hz）；腿 `±0.55·sin(2πft)`（左右反相）；手臂 `∓0.45·sin(2πft)`；`spine.x = 0.08`；`root.y = 0.03·|sin(2πft)|` | 保留腿與手臂擺動（功能性），去掉 `root.y` 起伏 |
| `talk` | 說話 | `head.x = 0.08·sin(2π·2.2t)·g(t)`，`g(t) = sin(0.7t) > 0 ? 1 : 0`（一陣一陣地點頭）；`armR.x = −0.6 + 0.2·sin(2π·0.3t)`（手勢） | 靜止姿勢（`armR.x = −0.6`） |
| `crouch` | 蹲在機台前 | 0.3 s 內：`root.y −0.32`、雙腿 `x = −1.2`（單節腿，做成跪姿）、`spine.x = 0.35`、`head.x = −0.2`（抬頭看螢幕） | 直接到終點 |
| `tired` | 疲憊、低頭 | `spine.x = 0.28`、`head.x = 0.35`（低頭）、手臂 `x = 0.1`；呼吸 `spine.x += 0.05·sin(2π·0.18t)` | 靜止姿勢 |
| `point` | 指點 | `armR.x = −1.45`（向前平舉），`armR.y` 朝 `setLookTarget` 方向；`armR.x += 0.05·sin(2π·1.2t)` | 靜止 |
| `bow` | 鞠躬（單次） | 0.5 s `spine.x` 0 → 0.7、停 0.6 s、0.5 s 回到 0，之後自動回 `idle` | 直接顯示鞠躬姿勢 1.0 s 後回 `idle` |
| `armsUp`＊ | 風淋室舉手（§14 CR-10） | 雙臂 `x = −2.9`（向上伸直）；轉圈由 03 的小遊戲狀態透過 `setLookTarget` 以外的方式控制——MVP 不轉圈，只舉手 | 同 |

- **視線**（`setLookTarget`）：頭部 yaw 夾限 ±60°、pitch ±25°，角速度上限 6 rad/s；`null` 時回正。
- **說話者動作**：app 把正在說話的角色 `clip` 設成 `talk`（`SceneActor.clip`）；不需要 render 知道誰在說話。
- **禁止的動作**：倒地、跌倒、死亡、靠近任何高處邊緣（GDD §13）。Stage 6 換成 glTF 時，模型包裡的 `Death` 之類動畫一律不對照、不打包。

### 6.6 Stage 6 換成 glTF 骨架模型的風格對齊要求（01 §9.6、§15 Stage 6）

| 項目 | 要求 | 驗收方法 |
|---|---|---|
| 比例 | 3.0～3.5 頭身；`heightScale = 1` 時 1.62～1.78 m；頭寬 ≥ 肩寬 × 0.9 | 跟程式化版本並排，正面、側面輪廓疊圖 |
| 材質 | 全部換成 `ToonKit` 材質（01 §9.6 步驟 2），只保留色塊；**拿掉**法線貼圖、粗糙度、金屬度、AO、環境貼圖；臉部可以保留一張 ≤256² 的 sRGB 顏色貼圖（眼睛） | 檢查 `material.type === 'MeshToonMaterial'` |
| 配色 | 部件色一律從 §1.6 `PALETTE` 與 §6.4 外觀表取；無塵衣 `suit`、手套 `glove`、名牌 `badgeColor` | `palette_sync` 類測試擴充 |
| 描邊 | `normalExtrude`，0.018 m，1.5～4 px 夾限（§2.3）；不得出現描邊裂縫（平滑法線） | 4 個方向截圖 |
| 名牌 | 頭罩名牌仍是掛在頭骨骼下的獨立平面（同程式化版本），尺寸 0.22 × 0.075 | 目視 |
| 動作 | `CharacterClip` 對照表（放在 `appearance.modelRef` 對應的設定）：`idle → Idle`、`walk → Walk`、`talk → Idle＋程式化點頭`、`crouch → 蹲姿（若無則程式化）`、`tired → 程式化`、`point → 若有指向動畫則用，否則程式化手臂`、`bow → 若無則程式化`；模型包沒有的動作，用 §6.5 的程式化骨骼旋轉補上 | 每個 clip 播一次 |
| 預算 | 每個角色模型 ≤2,500 三角形（不含描邊；`normalExtrude` 描邊再加同數量）；≤3 個材質；骨骼 ≤24 | `chibi_builder.spec.ts` 類的預算測試套用到載入結果 |
| 授權 | 只用 CC0；記錄在 `public/models/LICENSES.txt`（01 §9.6） | 人工 |

---

## 7. 相機演出系統

### 7.1 架構

- 01 §9.8 的 8 顆鏡頭（`CameraShotId`）全部沿用，名稱不變。`evaluateShot(shot, base, elapsedSec, motion)` 是純函式；`base` 是**鏡頭起點姿勢**。
- 有些鏡頭需要「拍誰」：`puaLowAngle`、`praisePullBack`、`closeUp` 拍 `snapshot.focusActor`（§14 CR-05：app 把當前台詞的說話者填進去）；沒有 `focusActor` 時拍玩家。render 內部的 `resolveShotAnchors(snapshot, spots)` 算出錨點，再交給 `evaluateShot` 用的終點計算（`camera_director.ts` 內部函式，不進 model）。
- **持續規則**：一顆鏡頭從 `playShot()` 開始，持續到下一個 `camera` 提示或事件結束；事件結束時 0.4 s 回到 `default`（01 §9.8）。
- **安全規則**（所有鏡頭）：鏡頭位置夾限在場景的可視範圍（§4 各場景）；不做碰撞射線；頂樓（完整版）俯角 ≤0°。

### 7.2 八顆鏡頭的參數

符號：`S`＝錨點角色位置；`hs`＝其 `heightScale`；`P`＝玩家；`dirSP`＝水平方向 S → P 的單位向量；`yaw(v, θ)`＝把向量繞 y 軸轉 θ。

| 鏡頭 | 終點位置 | 終點目標 | FOV | roll | 進場 | 用途 |
|---|---|---|---|---|---|---|
| `default` | `P − forward × 6.5 + (0, 2.2, 0)`（fab）；`× 5.0 + (0, 2.4, 0)`（辦公室）；更衣室用分區機位（§4.3） | `P + (0, 0.82, 0)`（fab，俯角 12°）；`P + (0, 0.97, 0)`（辦公室，俯角 16°） | `clamp(54, 84, 2·atan(tan 32° / aspect))`（範例公式） | 0 | 臨界阻尼彈簧，ω = 5 rad/s；從其他鏡頭回來 0.4 s ease-out | 走動 |
| `puaLowAngle` | `S + yaw(dirSP, +25°) × 3.36`，`y = 目標.y − 0.90`（仰角 15°） | `S + (0, 1.25·hs, 0)` | 同 `default` | 0.11 → 0.19 rad（約 6° → 11°） | 起點距離 4.48 m（＝終點 ÷ 0.75）、同角度；0.6 s ease-out cubic 推近 | 主管 PUA（GDD §12.1） |
| `dilemmaSway` | 起點姿勢繞目標 yaw `±2° × sin(2π × 0.25 t)` | 起點目標 | 起點 | 起點 | 立即開始 | 兩難陷阱 |
| `handheld` | 起點 ＋ 每軸 `0.03 × (sin(2π·1.7t + φ) + 0.6·sin(2π·2.9t + φ'))／1.6`（φ 每軸不同） | 起點目標 | 起點 | 起點 ± 0.008 rad（同頻率） | 立即 | 機台 down |
| `quake` | 起點 ＋ 隨機方向位移，振幅 `0.12 × (1 − t/3)`，以 12 Hz **階梯取樣**（漫畫感）；方向由 `hash(floor(t × 12))` 決定（可重現，不用 `Math.random`） | 起點目標 | 起點 | 起點 ± 0.02 rad（同取樣） | 立即，3 s 後自動停 | 地震 |
| `praisePullBack` | 起點沿視線往後到距離 × 1.15，`y + 0.3` | 起點目標 | 起點 + 4° | → 0 | 0.8 s ease-in-out sine | 被肯定、成長 |
| `closeUp` | `S + forwardS × 1.6 + (0, 1.42·hs, 0)`（正面） | `S + (0, 1.42·hs, 0)` | 35 | 0 | 0.5 s ease-out cubic | 升等 |
| `topDownDesk` | 桌面錨點 ＋ (0, 1.6, 0.001) | 桌面錨點 | 40 | 0 | 0.6 s ease-in-out | 考績公布；場景沒有桌面錨點時維持目前鏡頭並 `logger.warn`（一次） |

- **拖曳環顧**（範例值）：`default` 下拖曳滑鼠或觸控，yaw 夾限 ±0.3 rad、pitch ±0.12 rad；以 `1 − e^(−5·dt)` 內插（範例的每幀 0.08 換算成與幀率無關）。演出鏡頭期間停用拖曳。
- **構圖位移**（範例值）：`camera.setViewOffset(w, h, 0, h × shift, w, h)`，`shift` 桌機 0.12、手機（寬 <760）0.20，讓主體落在畫面上半，留下方給對話框。一律套用，不隨鏡頭變化。
- **自由走動舒適性**：`default` 的 roll 恆為 0、沒有呼吸晃動（範例的 `sin(t × 0.3)` 漂移只保留在 `puaLowAngle` 終點的靜態構圖）。

### 7.3 演出配方（給內容作者，§13 與 02 對齊）

以下是 GDD §12.1 每種情境建議的 `StagingCue` 寫法。疊加光組、特效降級都由 render／UI 自動處理（§3），內容作者只寫這一行。

| 情境 | `camera` | `fx` | `sfx` | `sfxCard`（例） | `bgm` | 立繪 | 自動附加 |
|---|---|---|---|---|---|---|---|
| **主管 PUA** | `puaLowAngle` | `speedLines`、`dots`、`radialBackdrop`、`shakeDialog` | `tsk`／`huh`／`slap` 擇一（可省略） | 「嘖」「蛤？」「啪」 | `lowpass` | 加害者用誇張差分（例：`fakeSmileGlare`） | `pressure` 光；集中線 .42 → .7；內心獨白小字（§9.10） |
| **兩難陷阱** | `dilemmaSway` | — | `heartbeat` | — | `lowpass` | 對方面無表情（例：林課長 `amnesia`、沈部經理 `coldEye`） | 選項卡紅框＋微抖、倒數條（§9.12） |
| **危機：機台 down** | `handheld` | `alert` | `beepAlarm` | 「嗶——嗶——!!」／副標「ET-03 停機」（範例值） | `crisis` | — | `bayAlarm` 光（由機台狀態觸發，不靠 cue） |
| **危機：地震** | `quake` | `dots`、`shakeDialog` | `rumble` | 「轟——」 | `crisis` | — | 手機訊息狂刷（02 內容） |
| **被肯定、成長** | `praisePullBack` | `warmGlow`＊、`sparkleDots`＊ | `stingPraise`＊ | — | `normal` | 對方的稀有差分（例：林課長 `genuineSmile`） | `support` 光；數值浮字黃字 |
| **升等** | `closeUp` | `warmGlow`＊ | `stamp` | 「升」（紅色印章，§9.17） | `normal` | — | 職等牌翻轉（UI） |
| **考績公布** | `topDownDesk` | — | `stamp` | — | `lowpass` | 林課長依等第（P／M+ → `genuineSmile` 或 `fakeSmileGlare`；M／M− → `fakeSmileGlare`；D／X → `displeased`） | 考績單頁（§9.16） |
| **精神低落** | 不寫（自動） | 不寫 | 不寫 | — | 不寫 | — | `mood: 'low'` 自動處理 |
| **停下來** | **不准寫任何 cue** | **不准** | **不准** | **不准** | **不准** | 主角 `tired` 頭像 | `mood: 'calm'`；§9.24 |

＊ `warmGlow`、`sparkleDots`、`stingPraise` 是 §14 CR-02、CR-03 新增的列舉值。

- 「停下來」序列與求助相關事件（`content/events/safety.ts`）的節點**不得有 `stage`**：01 v1.1 的驗證器已加入這條規則（§14 CR-14、01 §8.6）；即使漏寫，`calm` 也會在執行期全部壓掉（§3.5）。

### 7.4 減少動態與 `MotionPolicy`

`MotionPolicy.reduced === true` 時（01 §9.8、§10.6）：

| 鏡頭 | 替代 |
|---|---|
| `default` | 跟隨改成較硬的彈簧（ω = 10），沒有拖曳慣性 |
| `puaLowAngle` | 直接切到終點（含 0.19 rad 的靜態 roll，這是構圖不是動態） |
| `dilemmaSway`、`handheld`、`quake` | 不產生任何位移；`quake` 改成 0.05 rad 的靜態傾斜 ＋ UI 的靜態「轟——」字卡 |
| `praisePullBack`、`closeUp`、`topDownDesk` | 直接切到終點 |
| 回 `default` | 直接切 |
| 場景入場鏡頭 | 略過 |

靜態強調的對照（UI 側，§9.3）：抖動 → 邊框加粗一格；閃爍 → 固定亮；浮字位移 → 原地顯示；推近 → 直接切換構圖。

### 7.5 `calm` 下的鏡頭

- 停止接受新的 `playShot()`（記錄 `logger.info`，不是錯誤）。
- 目前鏡頭凍結在當下姿勢；roll 在 2 s 內線性回到 0（減少動態時立即）；拖曳環顧停用；跟隨停止（玩家此時不會移動）。
- 離開 `calm` 時 0.4 s 回到 `default`。

---

## 8. 立繪規格

### 8.1 SVG 製作規範（所有立繪共用）

**畫布**（範例值）：`viewBox="0 0 240 320"`、`preserveAspectRatio="xMidYMax slice"`；半身像，下緣在胸口截斷。

| 區域 | 範圍（viewBox 座標） | 說明 |
|---|---|---|
| 頭部中心 | (120, 130) | 臉寬 78～162（84 單位），髮頂 y ≈ 46，下巴 y ≈ 198 |
| 眼睛線 | y ≈ 128 | 眉毛 y 96～110 |
| 嘴巴 | y ≈ 160～185 | — |
| 肩膀 | y 214～240 | 肩寬 8～232（可依角色縮放 ±15%） |
| 手機頭像裁切 | `viewBox="64 40 112 112"` | 只看頭部（§9.18） |
| 手機版對話頭像裁切 | `viewBox="48 36 144 176"` | 84px 寬的頭肩像（§9.8） |

**光源方向**：左上。陰影面（右側）用該角色的網點 pattern 覆蓋（範例：襯衫右側 `opacity .55`、臉部 `opacity .3`）。

**圖層結構**（由下到上；`<slug>` 是角色 ID 去掉 `chr.`，例如 `lin`）

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" preserveAspectRatio="xMidYMax slice"
     data-character="chr.lin" data-default="fakeSmileGlare" data-glare-on="fakeSmileGlare displeased rage">
  <defs>
    <pattern id="lin-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="#0a0a0a"/></pattern>
  </defs>
  <g class="base"><!-- 身體、衣服、脖子、臉型、耳朵、頭髮；不含眉、眼、嘴 --></g>
  <g class="expr expr-fakeSmileGlare"><!-- 眉、眼、嘴、臉頰線、該表情專屬的符號（汗、怒、問號） --></g>
  <g class="expr expr-displeased">…</g>
  <!-- 每個表情一個群組 -->
  <g class="acc"><!-- 配件：眼鏡、耳環（蓋在表情上面） --></g>
  <g class="glare"><!-- 鏡片反光斜線（只在 data-glare-on 列出的表情顯示） --></g>
  <g class="silhouette"><!-- 只有沈部經理：逆光剪影，整片蓋住上面所有圖層 --></g>
</svg>
```

**線條與顏色**

| 項目 | 規格（範例值） |
|---|---|
| 外輪廓 | `stroke-width="6"`、`#0a0a0a`、`stroke-linejoin="round"`、`stroke-linecap="round"` |
| 眉毛 | 7～8 |
| 眼睛、嘴巴 | 4～6 |
| 細節（皺紋、睫毛、牙齒線、鬍渣） | 2.5～3 |
| 鏡片反光 | 3，`#ffffff`，`opacity .85` |
| 配件框 | 4～5 |
| 允許的填色 | 角色表（§8.3）列出的膚色、髮色、衣服色；鏡片 `#bfe3f5`（`fill-opacity .55`）；淚與汗 `#bfe3f5`；紅暈斜線 `#ff8fa3`（`opacity .6`，只用在 §8.3 指定的表情）；警示紅 `#e60012` 只用於掛繩、怒氣符號 ✕；紙白 `#fffdf4`／白 `#ffffff` |

**禁止**：漸層（`linearGradient`、`radialGradient`）、`filter`、`<text>`、`<image>`、`<foreignObject>`、`<script>`、`<style>`、`style=""` 屬性、事件屬性（`onload` 等）、任何外部 `href`、沒有加 `<slug>-` 前綴的 `id`、檔案 >30 KB、路徑節點 >400 個。

**佔位 SVG**（v1.2 審查回合 1 R1-A）：立繪、主角頭像、結局插圖由實作者自己產出；還沒畫好時可以先放佔位檔，但佔位檔必須具備完整結構（同上的圖層、`data-character`、`data-default`、每個表情一個 `g.expr-<id>`，表情內容可以只是簡單的眉眼嘴線條），並在根 `<svg>` 加 `data-placeholder="true"`。佔位檔照樣要通過下面的自動檢查；測試另外輸出佔位數，Stage 5 出口斷言佔位數為 0（01 §15）。

**自動檢查**（`test/portrait_assets.test.ts`，新增的整合測試，§14 CR-12）：對 `src/assets/portrait_*.svg` 逐一檢查 viewBox、上述禁止項、`id` 前綴、檔案大小；並讀取 `content.characters`，斷言 `CharacterDef.expressions` 的每個表情都有對應的 `g.expr-<id>`、`defaultExpression` 等於 `data-default`、SVG 裡沒有多餘的表情群組。

### 8.2 表情切換（`ui/components/portrait.ts`）

- 立繪 SVG 以 `?raw` 匯入（01 §10.2：資產可信，可以用 `innerHTML` 插入）；每個角色只解析一次並快取。
- 切換表情：移除舊群組的 `is-on`、加到新群組；在 `<svg>` 設 `data-expr`；若 `data-glare-on` 包含新表情，在 `.portrait` 容器設 `data-glare="on"`。
- CSS（`comic.css`）：

```css
.portrait .expr { display: none; }
.portrait .expr.is-on { display: inline; }
.portrait .glare { display: none; }
.portrait[data-glare="on"] .glare { display: inline; }
.portrait .silhouette { display: none; }
.portrait [data-expr="silhouette"] .silhouette { display: inline; }
```

- **切換動效**：新表情出現時整張立繪 `translateY(−4px) → 0`，200 ms `steps(2)`（漫畫的「彈一下」）；減少動態與 `calm` 時不動。
- **朗讀**：`<svg role="img">` 的 `aria-label` 隨表情更新，文字來自 `t.ui.portrait_alt.<slug>.<expression>`（§13：02 的內容需要提供；缺字時退回「<角色名>半身立繪」）。
- **立繪背景**（`.portrait::before`，範例值的變體；用 `data-backdrop` 切換）

| `data-backdrop` | 觸發 | 樣式 |
|---|---|---|
| `plain`（預設） | — | `--paper` 底 ＋ 右下角 `--dots-panel` 網點；4px 墨框；`--sh` 陰影 |
| `radial` | `StagingCue.fx` 含 `radialBackdrop` | 範例值：`repeating-conic-gradient(from 0deg at 50% 62%, var(--red) 0 4deg, var(--paper) 4deg 9deg)` |
| `warm` | `fx` 含 `warmGlow`＊ | `repeating-conic-gradient(from 0deg at 50% 62%, var(--yellow) 0 6deg, var(--paper) 6deg 12deg)` |
| `calm` | `mood === 'calm'` | `--paper-calm` 平塗、2px `--ink-calm` 框、無陰影、無網點 |

- **名牌**（範例 `.nameplate`）：墨底、紙白字、3px 紙白框、−3°、`--sh-red-s`；fab 內的角色在名字左邊加一個 10 × 16px 的名牌色塊（跟 3D 頭罩名牌對應，§1.2）。

### 8.3 MVP 8 位角色

> 誇張程度依 P4 分級：**體制／加害者**（林課長、沈部經理、Vivian 對立時）可以用誇張、荒謬的差分；**受害者與脆弱時刻**（小晴哭、美玲姐不舒服、阿哲低落、Vivian 脆弱、阿安哭）用克制、真實的畫法，不加搞笑符號。

#### ① 林課長 `chr.lin` → `portrait_lin.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 42 歲；油頭旁分（範例的髮型路徑，右上有一撮分線尖角）；圓臉；方框大鏡片眼鏡；淺灰藍襯衫、沒打領帶；紅色識別證掛繩＋白色識別證；胸前口袋插兩支紅筆（全部是範例值） |
| 配色 | 膚 `#fde7cf`、髮 `#0a0a0a`（白色高光線）、襯衫 `#e9eef2`、鏡片 `#bfe3f5` .55、掛繩 `#e60012` |
| 識別特徵 | 剪影：寬肩＋旁分尖角；永遠的眼鏡反光 |
| 預設 | `fakeSmileGlare` |

| 表情 ID | 名稱（GDD §12.2） | 畫法 | 反光 |
|---|---|---|---|
| `fakeSmileGlare` | 假笑・反光 | 範例 `smileg`：上揚眉（7）、閉眼弧 ∩（4）、大笑嘴＋3 條牙齒線、法令紋 | ✔ |
| `displeased` | 不悅 | 範例 `sourg`：倒八字眉（8）、平眼線＋瞳孔點、下彎嘴、紅色 ✕ 怒氣符號、太陽穴兩條直線 | ✔ |
| `rage` | 暴怒 | 陡 V 字眉（9）、小圓眼、張開的方形嘴＋一排牙、兩個紅 ✕ | ✔ |
| `amnesia` | 失憶臉（「這個我們之前沒討論過吧？」） | 眉毛平平抬高、瞳孔看左上、小 o 嘴、頭右上方一個手繪問號路徑（墨 5） | ✘ |
| `privateTired` | 私下疲憊 | 眉放鬆下垂、半閉眼＋下眼袋弧線（2.5）、嘴角微下、下巴鬍渣點、一撮亂髮 | ✘ |
| `guilty` | 心虛 | 瞳孔偏右、內側眉微抬、抖動的小鋸齒嘴、左太陽穴一滴汗 | ✘ |
| `pleading` | 求助 | 內側眉大幅上揚（八字反過來）、圓眼＋白色高光點、小張嘴 | ✘ |
| `genuineSmile` | 真心笑（稀有） | 柔和的月牙眼（露一點瞳孔）、不露齒的自然微笑、雙頰各 3 條紅暈斜線、眉放鬆；搭配 `warm` 背景 | ✘ |

#### ② 阿哲 `chr.azhe` → `portrait_azhe.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 31 歲；刺蝟短髮（頭頂 5 根尖刺）；單眼皮細長眼＋明顯眼袋；下巴網點鬍渣；耳後夾一支筆（mentor 的小細節）；深藍連帽外套（頸後看得到帽兜的圓弧）＋灰 T 恤；紅掛繩 |
| 配色 | 膚 `#eac29e`、髮 `#0a0a0a`、外套 `#2b3a55`、T 恤 `#9aa3ad` |
| 識別特徵 | 剪影：刺頭＋頸後帽兜 |
| 預設 | `focused` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `disgusted` | 嫌棄 | 一眼瞇、一眼半閉、單邊挑眉、嘴歪向右的「ㄟ」形 |
| `sigh` | 嘆氣 | 閉眼線、眉下垂、嘴邊一朵 3 個圓弧的小氣團（墨 3） |
| `focused` | 專注 | 窄眼、方形瞳孔、平直低眉、抿嘴 |
| `laugh` | 笑 | ^ ^ 眼、D 形張嘴（墨填色＋上排白牙） |
| `drunk` | 喝醉 | 雙頰紅暈斜線、下垂彎眼、波浪嘴、額前一根亂髮 |
| `down` | 低落（克制） | 垂眼、內側眉上揚、小平嘴；臉部網點加深到 .45 |
| `surprised` | 驚訝 | 圓眼＋點瞳孔、眉毛抬高、O 嘴 |
| `concerned` | 關心（克制；v1.1 新增，02 §11.4 關心對話的來電者） | 內側眉微抬、柔和的眼（瞳孔正視）、嘴角平直略下；不加任何符號 |

#### ③ 小晴 `chr.xiaoqing` → `portrait_xiaoqing.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 26 歲；高馬尾（從頭右後方翹起）；齊瀏海；大眼；左耳一顆白色無線耳機（一直被客戶追著跑）；薄荷色開襟衫＋白 T；紅掛繩 |
| 配色 | 膚 `#f6d6b8`、髮 `#2b211c`、開襟衫 `#bfe8d6`、T 恤 `#ffffff` |
| 識別特徵 | 剪影：高馬尾 |
| 預設 | `cheerful` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `cheerful` | 開朗 | 大眼＋2 個高光點、張嘴笑 |
| `grinding` | 拚命（黑眼圈） | 眼下黑眼圈斜線（墨 .5）、堅定的眉、緊閉嘴、一滴汗、一撮掉下來的頭髮 |
| `crying` | 哭（克制） | 閉緊的眼弧、兩道細淚（`#bfe3f5` 填色、墨 3）、顫抖的嘴；**不畫噴泉式眼淚** |
| `blank` | 放空 | 小點眼、平嘴、沒有眉的起伏；臉上覆一層 .2 網點 |
| `angry` | 生氣 | V 字眉、銳利眼、張嘴的梯形 |
| `relieved` | 釋懷 | 溫和閉眼弧、柔和微笑、眉放鬆；搭配 `warm` 背景 |

#### ④ 豪哥 `chr.haoge` → `portrait_haoge.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 27 歲；蓬鬆捲髮＋頭頂一撮翹毛；圓臉、下顎較寬；粗眉；EE 課深灰 polo，胸前口袋插 3 支筆＋三用電錶的紅黑探棒線 |
| 配色 | 膚 `#eac29e`、髮 `#2b211c`、polo `#4a4f57`、探棒 `#e60012`／`#0a0a0a` |
| 識別特徵 | 剪影：捲髮＋翹毛 |
| 預設 | `smugJoke` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `smugJoke` | 嘴砲笑 | 單邊挑眉、半閉眼、右嘴角上揚、牙齒一點反光 |
| `meltdown` | 崩潰 | 抖動的圓圈眼（**不是 × 眼**）、張大的波浪嘴、頭髮多翹 3 根、2 滴汗；荒謬感指向「體制逼人」，不是嘲笑他 |
| `serious` | 認真 | 平直眉、專注眼、直線嘴 |
| `proud` | 得意 | 閉眼笑、眉毛上揚、頭旁一顆黃色星芒（墨框） |
| `sunnyAfter` | 離職後的陽光臉 | 大笑眼、亮眼高光、頭髮整齊；搭配 `warm` 背景 |

#### ⑤ 美玲姐 `chr.meiling` → `portrait_meiling.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 45 歲；短燙捲髮（阿姨捲）＋右額前一縷白髮；細長眉；法令紋；技術員淺藍外套（立領、拉鍊）；左臂黃色領班臂章（墨框斜線圖樣）；胸前掛著一副老花眼鏡（掛繩，沒戴） |
| 配色 | 膚 `#f6d6b8`、髮 `#4a3a2e`＋白髮 `#ffffff`、外套 `#9cc7e6`、臂章 `#ffd400` |
| 識別特徵 | 剪影：燙捲＋立領 |
| 預設 | `stern` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `stern` | 嚴肅 | 平直下壓的眉、細眼、下彎直線嘴 |
| `kind` | 慈祥 | 月牙笑眼、圓臉頰 |
| `eyeRoll` | 白眼 | 瞳孔在眼睛最上緣、嘴歪噘、單邊挑眉 |
| `unwell` | 身體不舒服（克制） | 皺眉、半閉眼、抿唇、2 滴汗；臉上覆一層 `#fffdf4` .25（臉色發白）；不加任何搞笑符號 |
| `proud` | 驕傲 | 下巴微抬、閉眼笑、眉上揚 |

#### ⑥ Vivian `chr.vivian` → `portrait_vivian.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 30 歲；黑長直髮從右肩垂下；上挑的眼線；細眉；金色小耳環；黑色西裝外套＋白色尖領襯衫；紅掛繩 |
| 配色 | 膚 `#fde7cf`、髮 `#0a0a0a`（白色高光）、外套 `#1d1d22`、襯衫 `#ffffff`、耳環 `#c9a227` |
| 識別特徵 | 剪影：單側長髮＋尖領 |
| 預設 | `sneer` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `sneer` | 冷笑 | 單邊嘴角上揚、半閉眼、挑眉 |
| `smug` | 得意 | 閉眼笑、下巴抬起 |
| `anxious` | 焦慮 | 內側眉上揚、瞳孔偏向一側、門牙咬住下唇、一滴汗 |
| `angry` | 憤怒 | 銳利 V 字眉、下眼瞼繃緊、咬牙露齒 |
| `fragile` | 脆弱（克制） | 濕潤的眼（2 個高光＋下眼瞼一條淚線，不落下）、柔和上揚的眉、小嘴；第五章「你以為我不想準時下班？」的那一刻 |

#### ⑦ 沈部經理 `chr.shen` → `portrait_shen.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 50 歲；灰白後梳油頭；粗黑眉（跟灰髮形成對比）；方下巴、深法令紋；深色西裝＋酒紅領帶＋金色公司徽章別針；肩膀寬到幾乎填滿畫布 |
| 配色 | 膚 `#eac29e`、髮 `#8d8a84`（白色高光）、眉 `#0a0a0a`、西裝 `#23262e`、領帶 `#7a1424`、別針 `#c9a227` |
| 識別特徵 | 剪影：最寬的肩＋後梳髮 |
| 預設 | `authority` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `authority` | 威嚴 | 厚重平直眉、小而銳利的眼、緊閉直線嘴 |
| `speechPassion` | 演講熱情 | 嘴巴張大＋上下排牙、眉毛高抬、眼睛圓睜（早會大魔王的「熱愛」） |
| `coldEye` | 冷眼 | 半閉眼、瞳孔往下看、無表情的嘴 |
| `satisfied` | 滿意 | 淺淺的笑、放鬆的眼、下巴微抬 |
| `silhouette` | 逆光剪影版 | `g.silhouette`：沿外輪廓外擴 1 單位的整片 `#0a0a0a`，左側邊緣加 3 單位的 `#fffdf4` 輪廓光線；完全蓋住下方圖層（GDD §11 部經理辦公室的強烈逆光） |

#### ⑧ 阿安 `chr.aan` → `portrait_aan.svg`

| 項目 | 設定 |
|---|---|
| 外型 | 28 歲國小老師；及肩柔軟頭髮塞在耳後；圓領上衣＋暖橘棕開襟衫；袖口沾著粉筆灰（白色小點）；不掛識別證（fab 外的人） |
| 配色 | 膚 `#f6d6b8`、髮 `#2b211c`、開襟衫 `#c9733a`、上衣 `#f3e6d3`、粉筆灰 `#ffffff` |
| 識別特徵 | 剪影：及肩髮＋柔和的肩線；全角色裡唯一沒有掛繩的人（「生活的錨」） |
| 預設 | `gentle` |

| 表情 ID | 名稱 | 畫法 |
|---|---|---|
| `gentle` | 溫柔 | 柔和的眼、淺笑 |
| `hopeful` | 期待 | 眼睛 2 個高光、眉上揚、微張的笑 |
| `disappointed` | 失望（克制） | 垂眼、嘴平微下、內側眉上揚 |
| `angry` | 生氣（克制） | 中度 V 字眉、緊閉下彎的嘴；不畫鼓臉之類的可愛化處理 |
| `crying` | 哭（克制） | 同小晴的畫法 |
| `laugh` | 笑 | 閉眼弧、開口笑 |

#### 主角頭像 → `portrait_player_a.svg`／`portrait_player_b.svg`（§14 CR-19）

- `viewBox="0 0 120 120"`，只有頭部；在對話框說話者為 `'player'` 時顯示在說話者牌左側（72 × 72，§9.8），以及「停下來」序列的來電畫面。
- 外型 A：短髮（`short`）；外型 B：鮑伯頭（`bob`）。兩者都是 `#fde7cf` 膚色、`#2b211c` 髮色、白襯衫領口。
- 外型由建角時選擇（預設依代名詞：他 → A、她 → B、TA → 玩家選），存成 `PlayerProfile.look`（CR-19）。
- **MVP 表情**（各 4 個）：`normal`、`tired`（停下來序列必需，GDD §12.1）、`shocked`、`laugh`。完整版加 `angry`、`crying`、`fakeSmile`（E02：戴上眼鏡、畫法照林課長的 `fakeSmileGlare`）。

### 8.4 數量與工時估計

| 角色 | 表情數 | 檔案 | 預估工時（底圖 2 h ＋ 每個表情 0.5 h） |
|---|---|---|---|
| 林課長 | 8 | `portrait_lin.svg` | 6 h |
| 阿哲 | 8 | `portrait_azhe.svg` | 6 h |
| 小晴 | 6 | `portrait_xiaoqing.svg` | 5 h |
| 豪哥 | 5 | `portrait_haoge.svg` | 4.5 h |
| 美玲姐 | 5 | `portrait_meiling.svg` | 4.5 h |
| Vivian | 5 | `portrait_vivian.svg` | 4.5 h |
| 沈部經理 | 4＋剪影 | `portrait_shen.svg` | 5 h |
| 阿安 | 6 | `portrait_aan.svg` | 5 h |
| 主角 A／B | 4 × 2 | `portrait_player_a.svg`、`portrait_player_b.svg` | 2 × 3 h |
| **MVP 合計** | **48 ＋ 8 ＝ 56** | 10 個檔案 | 約 46.5 h |

### 8.5 完整版其餘角色

| 角色 | 表情（GDD §12.2） | 外型重點 |
|---|---|---|
| 大D `chr.big_d` | `scornful`、`serious`、`firedUp`、`approving`（4） | 38 歲 EE 副理；平頭、粗手臂、捲起袖子的工作襯衫、腰間掛一串工具；名牌深綠 |
| 何佩珊（HR）`chr.hr_he` | `standardSmile`、`professionalSmile`（眼睛沒笑）、`troubled`、`whisper`（4） | 34 歲；低馬尾、珍珠耳環、米白套裝、HR 名牌夾 |
| 媽媽 `chr.mom` | `proud`、`worried`、`nagging`、`weary`（4） | 58 歲；短燙髮、圍裙、老花眼鏡掛在頭上；只在老家、手機出現 |
| 小廖 `chr.xiaoliao` | `nervous`、`admiring`、`aggrieved`、`confident`、`cold`（5） | 24 歲；跟主角外型 A 相似（鏡像角色）但更瘦、新的識別證反光 |
| 老K `chr.lao_k`（v1.2：ID 改用拼音；MVP 已加入為**文字角色**，完整版才畫立繪） | `gentle`、`wistful`、`sickSmile`（3） | 44 歲；花白短髮、圓框眼鏡、開襟毛衣；`sickSmile` 要克制，不畫病容 |
| 葛協調員 `chr.ge` | `obstructive`、`aggrieved`、`firm`（3） | 40 歲；稀疏頭頂、手上永遠拿著排班表夾板 |
| 森田課長 `chr.morita` | `fiery`、`meltdown`（2） | 日籍代理課長；整齊三七分、細框眼鏡、筆挺西裝 |
| 主角（完整） | `normal`、`tired`、`shocked`、`angry`、`crying`、`laugh`、`fakeSmile`（7 × 2） | 見 §8.3 |

**MVP 的老K（v1.2 審查回合 1 矛盾 5）**：`chr.lao_k` 跟 `chr.mom` 一樣是有名字、沒有立繪的文字角色（`hasPortrait: false`、`expressions: []`）。對話框只顯示名牌；03 的教學泡泡（`coach_mark`）在說話者是老K 時改用**通用講師圖示**：48 × 48px 的 inline SVG，4px 墨線圓框、`--paper` 底，內畫一支斜放的教鞭與一副簡化的圓框眼鏡線條（墨線 4px，不用 `<text>`、不用漸層），`aria-label` 用「講師」。2.5D 教室裡的 Q 版人形照 §6.4。

---

## 9. UI 畫面規格

### 9.1 圖層、版面格線與斷點

| 圖層（01 §10.1） | z（`tokens.css`） | 內容 | `pointer-events` |
|---|---|---|---|
| `#scene` canvas | `--z-scene` 0 | 3D／2.5D；L4 時隱藏，由 `scene_fallback` 取代（§9.26） | auto（點地板走路） |
| `#fx-layer` | `--z-fx` 1 | 集中線、網點、紅暈、暖光、紙色遮罩；SFX 字卡在 z 2 | none |
| `#ui` | `--z-ui` 3 | HUD、數值面板、對話、選項、任務便利貼、互動提示 | none（子元件 auto，範例值） |
| `#overlay` | `--z-overlay` 4 | 手機、小遊戲外框、全畫面頁面；開啟時 3D 壓暗（§9.27） | auto |
| `#modal` | `--z-modal` 5 | 錯誤卡、求助資訊卡、確認對話 | auto，焦點陷阱 |
| `#live` | — | 朗讀區（視覺隱藏） | — |

- **外距**（範例值）：`#ui` 上 `max(16px, env(safe-area-inset-top))`、左右 16px、下 `max(30px, calc(env(safe-area-inset-bottom) + 24px))`。
- **桌機版面**：上方一列（左：HUD＋職等牌直排；右：數值面板 `min(310px,100%)`）；下方對話區 `max-width: 1080px` 置中、`max-height: 62%`（範例值）。
- **手機（≤760px）**：上方 HUD 與職等牌橫排、數值面板滿寬 2 欄；對話區 `max-height: 68%`、立繪 84px（範例值）。
- 只有一個斷點 760px（§1.5）。橫向手機（高度 ≤500px）沿用手機版，但對話區 `max-height: 78%`、數值面板強制收合（§9.7）。

### 9.2 共用元件樣式（`comic.css`）

| class | 外觀 | 來源 |
|---|---|---|
| `.panel` | `--paper` 底、`--bw` 墨框、`--r-panel`、`--sh`；`::after` 右下角網點 | 範例值 |
| `.panel--doc` | 文件紙：`--white` 底、`--bw-thin` 墨框、`--r-doc`、`--sh-m`；頁首一條 `--bw-double` 雙線 | 新增（考績單、薪資單、lot 卡） |
| `.panel--calm` | `--paper-calm` 底、2px `--ink-calm` 框、`--r-doc`、**無陰影、無網點、無傾斜** | 新增（§9.24） |
| `.sticker` | 紅底紙白字、`--bw-thin` 墨框、−3°、`--sh-s`，絕對定位在面板左上 (−8, −14) | 範例 `.stats h2` |
| `.btn` | `--yellow` 底、`--bw` 墨框、`--sh-m`、−1.5°、`--f-head` 900 17px、padding 6×20 | 範例 `.reset` |
| `.btn--plain` | `--paper` 底，其他同 `.btn` | 新增（次要按鈕） |
| `.btn--danger` | `--red` 底、`--paper` 字（只用在不可逆操作的第二次確認） | 新增 |
| `.chip` | `--bw-thin` 墨框、`--r-chip`、`--f-head` 900 13px、padding 2×8；`.pos` 墨底黃字；`.neg` 紅底紙白字；**一律帶 ＋／− 符號** | 範例值 |
| `.speaker` | 墨底黃字、`skew(−8deg)`、絕對定位在對話框左上 (18, −17) | 範例值 |
| `.nameplate` | 墨底紙白字、3px 紙白框、−3°、`--sh-red-s` | 範例值 |
| `.stamp` | 紅色印章：透明底、`--red` 3px 雙框（`outline` 3px offset 3px）、`--red` 字 900、−12°；內部 `--dots-card` 紅色版網點做出「蓋得不均勻」的質感 | 新增 |
| `.note` | 便利貼：`--yellow` 底、`--bw-thin` 墨框、±2° 隨機（依 key 雜湊固定）、`--sh-s`、`--f-body` 15px | 新增（GDD §12.3 #10） |
| `.keycap` | 鍵帽：`--paper` 底、`--bw-thin` 墨框、底部 `0 3px 0 var(--ink)`、`--f-head` 900 13px、最小 28 × 28 | 新增（互動提示） |
| `.bar` | 數值條：`--bw-thin` 墨框、`--stripe-bar` 底、`<i>` 墨色填滿；`.low` 時填滿改 `--stripe-danger` | 範例值 |
| `.coin` | 18px 圓、`--bw-thin` 墨框、`--yellow`、內陰影；空位白底虛線框 | 範例值 |
| `.bubble` | 漫畫對白框（手機訊息用）：`--paper` 底、`--bw-thin` 墨框、`--r-bubble` 縮半、尖角三角形 | 新增 |
| `.phone-frame` | 手機外框：墨色 10px 邊框、圓角 `18px 26px 20px 24px / 24px 18px 26px 20px`（手繪不對稱，裝置外型的例外）、`--sh` | 新增 |

### 9.3 狀態規範

| 狀態 | 按鈕 `.btn` | 選項卡 `.choice` | 清單列（設定、手機、hotspot 清單） |
|---|---|---|---|
| 預設 | 如上 | `--paper`、`--bw-thick` 墨框、`--sh`、傾斜 | `--paper`、底線 `--bw-hair` |
| hover（指標裝置） | 紅底紙白字（範例值） | 黃底、`translate(−3px,−4px) rotate(0)`、`--sh-l`（範例值） | 黃底 |
| `:focus-visible` | 4px `--yellow` 外框、offset 3px、`0 0 0 8px var(--ink)`（範例值） | 同左 | 同左 |
| `:active` | `translate(3px,3px)`、`--sh-press`（範例值） | `translate(4px,4px)`、`2px 2px 0`（範例值） | 墨底黃字 |
| 停用 `aria-disabled` | `--grey` 底、`--ink-soft` 字、無陰影、`cursor: not-allowed`（仍可聚焦、朗讀原因） | — | 同左 |
| 鎖定（鎖卡） | — | §9.11 | — |
| 危（`.low`） | — | — | 「危」標籤：紅底白字 10px→**12px**（§1.3 下限）、`--r-chip` |
| 選中（設定的分段鈕） | 黃底＋墨字＋內框 `inset 0 0 0 2px var(--ink)` | — | 左側 6px 墨色豎條 |
| 安靜（`calm`） | `--paper-calm` 底、2px `--ink-calm` 框、無陰影、無傾斜；hover＝底線加粗；focus＝2px `--ink-calm` 外框 offset 3px | 同左，無編號字、無網點 | 同左 |

**減少動態的靜態強調**（`[data-reduce-motion]`，01 §10.6）

| 動態版 | 減少動態版 |
|---|---|
| 抖動（對話框、選項卡、錯誤回饋） | 邊框 +1px（例：4 → 5px）0.3 s 後恢復 |
| 閃爍（燈號、倒數最後 3 秒） | 固定亮色＋文字標記 |
| 位移浮出（數值浮字） | 原地淡入淡出（透明度變化不算位移動態，保留） |
| 推近、旋轉（鏡頭、轉盤） | 直接切到終點 |
| 印章落下（縮放＋旋轉） | 直接顯示蓋好的印章 |
| 卡片滑入滑出 | 直接替換 |
| 3D 壓暗淡入 | 直接到終點 |

### 9.4 動效規範

所有 UI 動畫用 CSS `steps()`（範例的漫畫感來源），只有淡入淡出用 `linear`。關鍵影格放在 `fx.css`。

| 名稱 | 用途 | 時間與曲線 | 內容 | 來源 |
|---|---|---|---|---|
| `pop` | 硬幣增加、印章小圖 | 500 ms `steps(3)` | `scale(1.7) rotate(−20deg)` → `none` | 範例值 |
| `float` | 數值浮字 | 1700 ms `steps(10)` forwards | `translateY(8px) scale(1.5)` 透明 → 15% 不透明 → `translateY(−14px)` 透明 | 範例值 |
| `shake` | 狀聲字 | 500 ms `steps(2)` 無限 | −9° ↔ −8° 位移 (3, −2) | 範例值 |
| `alert` | 紅色暈影 | 1200 ms `steps(2)` 無限 | 不透明度 .35 ↔ 1 | 範例值 |
| `panelIn` | 面板、結果框、頁面出現 | 240 ms `steps(3)` | `translateY(12px)` 透明 → 0 | 新增 |
| `stampDown` | 考績等第、升等、小遊戲印章 | 300 ms `steps(3)` | `scale(1.6) rotate(−4deg)` 透明 → `scale(1) rotate(−12deg)` 不透明；落下瞬間對所在面板做 1 格 `translate(2px,2px)` 震動 | 新增 |
| `cardDeal` | 選項卡出現 | 每張 120 ms `steps(2)`，依序延遲 60 ms | `translateY(20px)` → 各自傾斜角 | 新增 |
| `slideSwap` | lot 卡換張、月曆翻頁 | 240 ms `steps(3)` | 舊卡往左出、新卡從右進 | 新增 |
| `dialSnap` | 方針轉盤 | 240 ms `steps(4)` | 旋轉到目標格 | 新增 |
| `buzz` | 手機來電震動 | 每 120 ms `steps(2)`，震 400 ms 停 200 ms | `rotate(±1deg) translateX(±3px)` | 新增 |
| `inkBlotIn` | 墨點遮字 | 400 ms `steps(3)` | 墨點 `scale(0.2)` → 1 | 新增 |
| `calmFade` | 進入安靜模式 | 4000 ms `linear` | 紙色遮罩 0 → .88 | 新增 |

- `[data-reduce-motion]` 下：`*{animation:none!important;transition:none!important}`（範例值），例外只有 `calmFade`、`panelIn` 的透明度部分改成 200 ms `linear` 淡入。
- `calm` 下：除了 `calmFade` 以外的所有關鍵影格都停用（`[data-mood="calm"] *{animation:none!important}`，`calmFade` 用 `!important` 例外選擇器）。

### 9.5 畫面清單

| # | 畫面 | GDD §12.3 | 檔案（01 §3） | MVP | 規格 |
|---|---|---|---|---|---|
| 1 | 標題畫面 | #1 | `pages/title_page.ts` | ✔ | §9.25 |
| 2 | 內容提示 | §13.2 | `pages/content_notice_page.ts` | ✔ | §9.25 |
| 3 | 建角 | #2 | `pages/character_creation_page.ts` | ✔ | §9.25 |
| 4 | HUD | #3 | `components/hud.ts` | ✔ | §9.6 |
| 5 | 數值面板（收合／展開） | #3、#4 | `components/stats_panel.ts` | ✔ | §9.7 |
| 6 | 對話框＋立繪 | #5 | `components/dialogue_box.ts`、`portrait.ts` | ✔ | §9.8、§9.9 |
| 7 | 內心獨白、墨點遮字 | §12.1 | `components/dialogue_box.ts` | ✔ | §9.10 |
| 8 | 選項卡（含鎖卡、門檻章） | #6 | `components/choice_cards.ts` | ✔ | §9.11 |
| 9 | 倒數條 | #6 | `components/countdown_bar.ts` | ✔ | §9.12 |
| 10 | 結果框 | #7 | `components/result_box.ts` | ✔ | §9.13 |
| 11 | 數值浮字 | — | `components/delta_pop.ts` | ✔ | §9.14 |
| 12 | 任務便利貼＋互動提示 | #10 | `components/task_notes.ts` | ✔ | §9.15 |
| 13 | 考績單（含黑歷史本簡版） | #12、#16 | `pages/review_sheet_page.ts` | ✔ | §9.16 |
| 14 | 薪資單＋升等演出 | #13 | `pages/payslip_page.ts` | ✔ | §9.17 |
| 15 | 手機：啾訊群組、私訊、工作機來電、人生 App、通訊錄 | #8 | `components/phone.ts` | ✔（論壇、銀行為完整版） | §9.18 |
| 16 | 下班卡、夜間生活清單 | §2.2 | `components/clock_out_card.ts`、`evening_actions.ts` | ✔ | §9.19 |
| 17 | 行事曆＋方針雙轉盤 | #9 | `pages/policy_dial_page.ts` | ✔ | §9.20 |
| 18 | 快轉 montage | §2.3 | `pages/montage_page.ts` | ✔ | §9.21 |
| 19 | 微事件 toast | §2.3 | `components/micro_event_toast.ts` | ✔ | §9.22 |
| 20 | 結局卡與統計 | #18 | `pages/ending_page.ts` | ✔ | §9.23 |
| 21 | 停下來序列 | §13.3 | 由 `dialogue_box`／`choice_cards`／`phone` 的 `calm` 樣式組成 | ✔ | §9.24 |
| 22 | 求助資訊卡 | #21 | `components/help_card.ts` | ✔ | §9.24 |
| 23 | 設定 | #19 | `pages/settings_page.ts` | ✔ | §9.26 |
| 24 | 存讀檔 | #20 | `pages/save_slots_page.ts` | ✔ | §9.26 |
| 25 | 暫停 | — | `pages/pause_page.ts` | ✔ | §9.26 |
| 26 | 錯誤頁 | — | `pages/error_page.ts` | ✔ | §9.26 |
| 27 | 一般提示 toast | — | `components/toast.ts` | ✔ | §9.26 |
| 28 | L4 場景替代＋hotspot 清單 | — | `components/scene_fallback.ts`（CR-08） | ✔ | §4.6、§9.26 |
| 29 | 小遊戲共用外框、結果卡、印章 | #11 | `components/minigame_frame.ts` | ✔ | §9.27 |
| 30 | 工時申報 | #14 | — | 完整版 | 撕線式表單＋實際／申報兩條滑桿（申報條超過「被關心」門檻時林課長小頭像皺眉） |
| 31 | 健檢報告 | #15 | — | 完整版 | `.panel--doc`；紅字項目放大到 `--fs-h2`、加紅框；不用狀聲字 |
| 32 | 圖鑑（話術、機台、術語、人物、結局、成就） | #17 | — | 完整版 | 卡牌收集冊：每張卡 `.panel` 縮小版、未解鎖為網點剪影＋問號 |
| 33 | 灰區論壇、銀行、人生 App 完整功能 | #8 | — | 完整版 | 論壇：直式推文串、推／噓用墨／紅 chip |

### 9.6 HUD（`components/hud.ts`）

**元件**：日期面板（範例 `.hud`：日期 `2027/06/13（日）夜班`、時鐘墨底黃字斜切、「入職第 105 天」紅字）、職等牌（範例 `.rank`：墨底紙白、紅硬陰影、副標黃字）、風向旗（新增）、考績風向小頭像（新增）。

```text
桌機（左上）                                         手機（頂端一列，換行）
╭─────────────────────────────╮                      ╭───────────────────────╮┌────────────────┐
│2027/06/13（日）夜班 ▌22:47▐ │  ⚑ 風向期            │06/13（日）夜班 ▌22:47▐ ││助理工程師·蝕刻課│
│入職第 105 天                 │                      ╰───────────────────────╯└────────────────┘
╰─────────────────────────────╯                      第 105 天  ⚑風向  (☺)
┌───────────────────────┐ (☺)
│助理工程師 · 蝕刻課      │ ← 考績風向：林課長小頭像
│穹晶半導體 FAB 7         │
└───────────────────────┘
```

| 元件 | 規格 |
|---|---|
| 時鐘 | `--fs-clock`、`tabular-nums`；班中時鐘每 150 ms 走 1 遊戲分（02 §2.3），所以數字以 5 遊戲分為單位顯示（約每 0.75 秒更新一次，避免閃爍；不做翻牌動畫）；提早收尾時直接跳到新時刻 |
| 夜班標記 | 22:00～06:00 日期後加「夜班」（範例值） |
| 風向旗（`selectors.isWindPeriod`） | 紅色三角旗 SVG 16 × 16 ＋「風向期」900 12px；只在考績前 6 週出現（GDD §2.5） |
| 考績風向小頭像（`selectors.reviewWind`） | 28 × 28 方形、`--bw-thin` 墨框；3 個簡化表情 SVG（`smile`：月牙眼＋弧嘴、`flat`：一字嘴、`frown`：八字眉＋下彎嘴），林課長的眼鏡輪廓；`title` 與 `aria-label`「考績風向：笑／平／皺眉」 |
| 升等 | 職等牌翻轉：`rotateX(0 → 90° → 0)` 各 160 ms `steps(2)`，中間換字；翻好後蓋紅色 `.stamp`「升」（`stampDown`）；減少動態：直接換字＋印章 |
| `calm` | 整個 HUD 2 s 淡出到 0（不移除，保留 DOM 給讀屏：`aria-hidden` 不變） |

### 9.7 數值面板（`components/stats_panel.ts`）

**展開**（範例 `.stats`）：紅標題貼紙「新人狀態表」；體力（`/selectors.maxStamina`）、精神、專業、主管好感：名稱＋數值條＋數字；同事人情：5 枚硬幣＋數字；存款：虛線上緣、`NT$ 48,200`。低於 `lowLine`（35）→ `.low`：紅斜紋條＋「危」。

```text
桌機（右上，310px）                      手機：收合列（對話、選擇、小遊戲時自動收合）
╭[新人狀態表]──────────────────╮          ┌──────────────────────────────────┐
│體力    ▓▓▓▓▓░░░░░   42 /100 │          │體42 精35危 專28 主51 情●●● NT$48k ▾│
│精神危  ▓▓▓▓░░░░░░   35 /100 │          └──────────────────────────────────┘
│專業    ▓▓▓░░░░░░░   28 /100 │          手機：展開（點收合列）
│主管好感 ▓▓▓▓▓░░░░░   51 /100 │          ╭[新人狀態表]──────────────────╮
│同事人情 ●●●○○ 3              │          │體力▓▓▓ 42      精神危▓▓ 35  │
│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌│          │專業▓ 28        主管好感▓▓ 51│
│存款              NT$ 48,200 │          │人情 ●●●○○ 3   存款 NT$48,200│
│ ▸ 考績風向・伏筆 2           │ ← 點擊    ╰──────────────────────────────╯
╰─────────────────────────────╯
```

- **收合列**（新增，只在手機）：一行 6 個縮寫（體／精／專／主／情／存款千元），`.low` 的項目後面加紅底「危」；高度 32px。手機在 `Interaction` 為事件、小遊戲、手機時自動收合，回到自由走動時恢復玩家上次的狀態。
- **展開內容**（GDD #4）：桌機點標題或 `▸` 展開下半部：考績風向（大一點的林課長小頭像＋文字）、等待中的伏筆數量（「好像有 2 件事還沒結束」——只顯示數量，不顯示內容），`.panel` 往下延伸 `panelIn`。
- **最大體力**：體力條的長度代表 100，最大體力以外的部分畫成墨色斜線區（「被健康債吃掉的上限」，P3 的可見代價）。
- **數值變化**：條與數字用 900 ms ease-out cubic 補間（範例的 `tween`；減少動態時直接跳到新值）。
- `calm`：淡出到 0。

### 9.8 對話框（`components/dialogue_box.ts`）

```text
桌機（底部置中，max 1080px）
   ┌立繪 230px──┐  ╭[林課長]───────────────────────────────────────────────╮
   │ ▓▓ 紅白放射 │◀ │這批 lot 客戶明天早上要，ET-03 又 down 了。你今晚留下來   │
   │   (SVG)    │  │盯一下吧？年輕人多學一點，對你以後有好處。               ▼│
   │[林課長]▮   │  ╰───────────────────────────────────────────────────────╯
   └────────────┘    （……又來了。）                ← 內心獨白（§9.10）
                   ┌壹────────────┐ ┌貳────────────┐ ┌參────────────┐
                   │留下來加班     │ │準時下班，明早 │ │找學長阿哲幫忙 │  ← 選項卡（§9.11）
                   │[體力 −18]…    │ │再處理  […]    │ │分擔  […]      │
                   └──────────────┘ └──────────────┘ └──────────────┘

手機
┌84px─┐╭[林課長]────────────────╮
│頭肩像│◀│這批 lot 客戶明天早上要，│
│[林] │ │ET-03 又 down 了。……    ▼│
└─────┘╰────────────────────────╯
 （……又來了。）
┌壹 留下來加班────────────────────┐
│[體力 −18][精神 −10][主管好感 +8]│
└────────────────────────────────┘
┌貳 準時下班，明早再處理──────────┐ …（單欄）
```

| 元件 | 規格 |
|---|---|
| 對話框 | 範例 `.talk`：`.panel` ＋ `--r-bubble`、padding 26×22、台詞 `--fs-line` 700、行高 1.65；左側尖角指向立繪 |
| 說話者牌 | 範例 `.speaker`；旁白 `narrator` 時不顯示尖角、說話者牌為紙白底墨字「旁白」；`player` 時說話者牌左邊加 72 × 72 主角頭像（§8.3） |
| 繼續提示 | 右下角 `▼` 墨色三角，`steps(2)` 1 Hz 上下 2px（減少動態時靜止） |
| 打字效果 | `settings.textSpeed`：slow 25 字／秒、normal 45、fast 90、instant；標點後停頓：「，、」80 ms、「。！？」200 ms、「……」「——」300 ms；Space／Enter／點擊一次顯示全文（01 §10.6） |
| PUA（`shakeDialog`） | 對話框 1 格抖動 `translate(2px,−1px)` 120 ms 後回位（減少動態：邊框 +1px 0.3 s） |
| 精神低落 | 框線 4 → 3px、台詞微抖（§3.4） |
| `calm` | 改 `.panel--calm`；台詞改 `--f-calm` 500、`--lh-calm`；說話者牌改成單純的墨色文字；無尖角；無傾斜 |

### 9.9 立繪元件（`components/portrait.ts`）

- 桌機 230px 寬、`max-height: 300px`，`align-self: end`、`margin-top: −30px`（範例值）；手機 84px 寬、高 110px，使用 §8.1 的頭肩裁切 viewBox。
- 背景、名牌、表情切換見 §8.2。沒有立繪的說話者（`hasPortrait: false`、HR、旁白）→ 立繪欄位收起，對話框佔滿寬度（手機版不留 84px 空白）。
- 結果框顯示時，立繪維持最後一句台詞的表情；若內容在結果框指定表情（§14 CR-17），切換到指定表情（範例：選「貳」後林課長換成 `displeased`）。

### 9.10 內心獨白與墨點遮字

| 元件 | 規格 |
|---|---|
| 內心獨白（`speaker: 'inner'`，GDD §12.1） | 不開新的對話框；顯示在對話框下方 8px，`--f-body` 400、`--fs-inner`、`--ink-soft`、全形括號「（……又來了。）」；背景透明，但加 `text-shadow: 0 0 0 transparent` 以外不加任何效果；手機同；朗讀前綴「你心想：」 |
| 墨點遮字（`inkBlots`，精神 ≤15，GDD §12.1） | 對方台詞中由 UI 以固定規則挑字遮住：每 7 個字遮 1～2 個（依台詞的字元雜湊決定，同一句每次一樣），**不遮標點、數字、角色名、選項會用到的關鍵詞**（內容可以在台詞中用 `〔〕` 標記不可遮的詞，§13）；墨點是 1.1em 的不規則墨色圓斑 SVG（4 種形狀輪替）蓋在字上，`inkBlotIn`；被遮的字在 DOM 裡仍存在，朗讀時照常讀出（讀屏玩家不受懲罰，與 03 §6.3 的遮字塊原則一致） |

### 9.11 選項卡（`components/choice_cards.ts`）

```text
桌機：3 張（範例值）；4 張時改 4 欄（容器 <800px 時 2 × 2）
┌──────────────壹┐ ┌──────────────貳┐ ┌──────────────參┐ ┌[門檻解鎖]────肆┐
│留下來加班       │ │準時下班，明早再 │ │找學長阿哲幫忙   │ │先調 log 看是不是│
│                 │ │處理             │ │分擔             │ │gauge 飄掉       │
│[體力 −18][精神… │ │[精神 +6][主管…  │ │[人情 −1][體力…  │ │[體力 −6][專業+2]│
└────────────────┘ └────────────────┘ └────────────────┘ └────────────────┘
鎖卡：
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌肆┐
╎▨▨▨▨▨▨▨▨▨▨▨▨▨▨▨▨╎   ▨ 灰色斜紋底
╎  🔒（鎖頭 SVG） ╎
╎ 先調 log 看是不… ╎   標題 --ink-soft
╎  需要專業 45     ╎   lockedHint：900 15px 墨字，白底小牌
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
```

| 部位／狀態 | 規格 |
|---|---|
| 卡 | 範例 `.choice`：`--bw-thick` 墨框、`--sh`、`min-height: 118px`、padding 14、右上網點圓（`::before`）；傾斜依序 −0.9°／+0.5°（下移 3px）／−0.4°／+0.7°（§1.4） |
| 編號 | 範例 `.idx`：「壹貳參肆」（`ChoiceCardView.index` 0～3）、`--fs-idx` 900、紅字 3px 墨描邊、右上 (−4, −8) |
| 標題 | `--fs-card` 900、行高 1.25、右側留 34px 給編號；`text-wrap: balance`；≤18 字（01 §8.4） |
| chip | 卡片底部（`margin-top: auto`）；只顯示可見數值（GDD §5.1-2）；排序依 `VISIBLE_STAT_IDS` 順序 |
| 門檻章（`thresholdStamp: true`） | 左上 `.stamp`「門檻解鎖」900 13px、−12°、位置 (−6, −10)；`cardDeal` 結束後 `stampDown`；編號「肆」改成墨底黃字的方塊（區別一般卡） |
| 免人情（`favorWaived: true`，01 v1.1、02 §8.4） | 卡片右下角 `.stamp` 小章「免人情」900 12px、+8°、墨框黃底；chip 已由 core 扣掉人情；朗讀附加「這次不用花人情」 |
| 鎖卡（`locked: true`） | 底 `--stripe-locked`；框 `--bw-thick` **虛線**墨框；無陰影；無傾斜；中央鎖頭 SVG（28 × 32，墨線 4）；標題 `--ink-soft`；下方 `lockedHint`（例「需要專業 45」）白底小牌 900 15px；**不顯示 chip**；hover 不浮起、`cursor: not-allowed`；按下 → 1 格抖動＋`cardLocked` 音效＋把條件寫入 `#live`（減少動態：邊框 +1px）；`aria-disabled="true"`、仍可聚焦（01 §10.6） |
| 兩難陷阱 | 有 `countdownSec` 且 `camera: 'dilemmaSway'` 時：所有可選卡框線改 `--red`、每 0.5 s 1 格抖動 ±1px（減少動態：只有紅框） |
| 鍵盤 | 1～4 直接選、方向鍵 roving（01 §10.6）；焦點樣式 §9.3 |
| 手機 | 單欄、`min-height: 0`、padding 10×12、陰影 4px、無傾斜、標題 16px（範例值）；每張卡 ≥56px 高（觸控目標） |
| 出現 | `cardDeal`；焦點移到第一張可選卡 |
| `calm`（停下來的 3 個選項） | `.panel--calm` 樣式的清單列：無編號字、無 chip、無網點、無傾斜、無倒數；每列前面一個 8px 的 `--ink-calm` 方點；hover 底線加粗 |

### 9.12 倒數條（`components/countdown_bar.ts`）

```text
┌選項卡們…────────────────────────────────────────────────┐
└────────────────────────────────────────────────────────┘
▕████████████████████████████░░░░░░░░░░░░░▏ 6      ← 選項卡下方 10px、與選項區同寬
```

| 項目 | 規格 |
|---|---|
| 外觀 | 高 14px、`--bw-thin` 墨框、`--r-chip`；填滿 `--stripe-danger`（紅斜紋）由右往左縮短；右側秒數 900 17px `tabular-nums` |
| 時間 | `countdownSec × settings.countdownScale`（01 §10.4） |
| 最後 3 秒 | 秒數改紅底紙白字；1 Hz `steps(2)` 外框粗細 3 ↔ 5px（不是閃爍顏色）；`countdownTick` 音效每秒一次（最後 3 秒音高提高）；減少動態：只改紅底 |
| 逾時 | 所有卡變灰（`--grey` 濾色）、選項區中央蓋一個墨色 `.stamp`「沉默」（GDD §5.1-6）600 ms，然後進結果框 |
| 朗讀 | `role="timer"`，只在開始時朗讀一次「有 8 秒可以決定」（01 §10.6） |

### 9.13 結果框（`components/result_box.ts`）

```text
╭[旁白]────────────────────────────────────────────────────────╮  ← 範例 .talk.result：白底 7px 雙線框、
│ 你吞下一句「好」，轉身走向 ET-03。課長拍拍你的肩：「很好，    │     說話者牌紅底紙白「旁白」
│ 有擔當。」凌晨四點機台才恢復，你的腰已經不是自己的了。       │
│ ┊ 風聲：好像有人記住了這件事。                                │  ← 風聲小字
│ [體力 −18][精神 −10][主管好感 +8][專業 +3]          [繼續 ▶] │
╰──────────────────────────────────────────────────────────────╯
```

| 元件 | 規格 |
|---|---|
| 框 | 範例值：`--white` 底、`border-style: double`、`--bw-double`、`--r-doc`、無尖角 |
| chip | `EventView.result.chips`；左下 |
| 風聲（`rumor`） | `--f-body` 400 15px、`--ink-soft`；左側 3px 紅色虛線豎條、padding-left 8；前綴「風聲：」；朗讀前綴「風聲」 |
| 繼續 | `.btn`「繼續 ▶」；出現時取得焦點（01 §10.6） |
| 勞權小知識卡（GDD §13.5） | 資料是事件裡 `phone` 節點的 `system` 訊息（02 §11.6，例：「勞動部勞工諮詢申訴專線：1955。」，01 D50）；事件進行中的 `system` 訊息一律用 `.panel--calm` 的一行小卡顯示在結果框下方，不打開手機；**不加任何漫畫效果**、號碼純文字 |

### 9.14 數值浮字與朗讀（`components/delta_pop.ts`）

- 範例 `.delta`：出現在對應數值列右上 (0, −14)，900 20px、5px 墨描邊；負值紅字、正值黃字；`float` 1.7 s。
- 同一數值連續變化：新的浮字往上錯開 18px，不重疊。手機收合列時，浮字出現在收合列對應縮寫的上方。
- 人情硬幣增加：新硬幣 `pop` ＋ `coinPop` 音效（範例值）。
- `#live` 朗讀：一個 `statsChanged` 合併成一句（01 §10.6）：「體力 −18，精神 −10，主管好感 +8，專業 +3」。
- 隱藏數值永遠不出浮字（GDD §5.1-2）。

### 9.15 任務便利貼與互動提示（`components/task_notes.ts`）

```text
桌機（數值面板下方，右側）               手機（右下角，安全區上方）
┌────────────────────┐                  ┌───────┐
│□ SPC：ET-04 AEI CD  │ ← .note           │任務 2/4│ ← 點開成清單（從底部 panelIn）
│□ Hold Lot ×3        │                  └───────┘
│■ ET-03 PM 交接 ─────│ ← 完成：紅線劃掉    ┌──────────┐
│□ 回 mail            │                  │  [E]     │ ← 互動鈕 56×56，靠近 hotspot 才出現
└────────────────────┘                  │ 查看ET-03 │
        畫面中下： ┌──────────────────┐   └──────────┘
                  │[E] 查看 ET-03      │ ← 互動提示（.panel 小、.keycap）
                  └──────────────────┘
```

| 元件 | 規格 |
|---|---|
| 便利貼 | `.note`；每項一行，`□`／`■` 為 14px 方框；完成時紅色 3px 劃線由左到右 300 ms `steps(3)`（減少動態：直接出現） |
| 點擊 | 3D 導引到 hotspot（app 處理，01 §10.4）；被導引的 hotspot 出現高亮（§4.1） |
| 提早收尾 | 全部完成時清單下方出現 `.btn--plain`「提早收尾」（01 D37） |
| 互動提示 | 靠近 hotspot（`HotspotSignal 'near'`）時畫面中下方出現：`.keycap`「E」＋動詞＋對象（「查看 ET-03」，文字來自 `t.ui.hotspot.<id>`）；手機改成右下角 56 × 56 的 `.btn` |
| `calm` | 隱藏 |

### 9.16 考績單（`pages/review_sheet_page.ts`）

```text
桌機（topDownDesk 鏡頭之後，文件從下方滑入）       手機（滿版，可捲動）
┌──────────────────────────────────────────┐      ┌──────────────────────┐
│ 穹晶半導體  員工績效考核表          ═══════│      │穹晶半導體 績效考核表 │
│ 期間 2027 年度   姓名 ○○○   職等 Q1       │      │2027 年度 ○○○ Q1    │
│ ┌KPI──────┬──────┐  ┌等第──────────┐       │      │KPI 68  考績積分 61  │
│ │小遊戲平均│ 72   │  │  ┌────────┐  │       │      │┌等第────────────┐ │
│ │產線      │ 61   │  │  │  M−    │← 印章 │      ││ [便利貼：掀開] │ │
│ │考績積分  │ 61   │  │  └────────┘  │       │      │└────────────────┘ │
│ └─────────┴──────┘  └──────────────┘       │      │主管評語：           │
│ 主管評語（林課長的筆跡）：                  │      │「6/13 值班夜準時下班 │
│ 「6/13 值班夜準時下班，責任感待加強。」      │      │  ，責任感待加強。」  │
│ 「水準之上。But……」                        │      │調薪 +2.0%            │
│ 調薪 +2.0%    季分紅倍率 ×0.85              │      │[繼續]                │
│                                   [繼續 ▶] │      └──────────────────────┘
└──────────────────────────────────────────┘
```

| 元件 | 規格 |
|---|---|
| 紙 | `.panel--doc`，公文樣式：頁首雙線、欄位表格線 `--bw-hair`、欄名 `--f-head` 700 13px、值 900 |
| 等第區 | 一開始蓋著一張 `.note` 便利貼（「等第」手寫）；Space／點擊 → 便利貼掀起（`rotate(−8deg) translate(40px,−60px)` 透明，240 ms `steps(3)`）→ 等第印章 `stampDown`＋`stamp` 音效（GDD §12.1「掀開便利貼，等第印章以 steps 動畫蓋下」） |
| 等第印章 | 方形紅印：`--red` 雙框、字 900 64px；P／M+ 為紅色；D 下方加小字「擋片」、X 加「重新評估」；減少動態：便利貼不顯示、印章直接蓋好 |
| 主管評語 | `ReviewRecord.citedEntries`（01 §7.6、02 §9.3：P／M+ 正面優先、其他負面優先，core 已排好）：`--f-body` 700、每筆前面日期「6/13」；所有等第都顯示，D／X 不足 3 筆時全部顯示；評語底下有紅筆波浪底線（SVG）；第一次顯示時旁邊多一個 `.note` 便利貼寫教學旁白 `t.ui.black_book_tutorial` |
| 立繪 | 桌機右下角林課長立繪 160px（表情依等第，§7.3） |
| 朗讀 | 頁面標題、等第（「等第 M 減」）、評語逐筆 |

### 9.17 薪資單與升等（`pages/payslip_page.ts`）

```text
          ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  ← 撕線：上緣虛線＋半圓缺口列
          │ 穹晶半導體  2027/07 薪資單 │  ← 數字是 02 §7.11 案例 B
          │ 本薪              66,000  │
          │ 加班費（18 h）      7,200  │
          │ on-call 津貼        1,100  │
          │ 預扣（8%）         −5,944  │  ← 負數紅字、帶「−」
          │ ═══════════════════════════│
          │ 實發           NT$ 68,356  │  ← 900 22px
          │                 [收下 ▶]   │
          └───────────────────────────┘
```

| 元件 | 規格 |
|---|---|
| 紙 | 寬 360px（手機 100% − 32px）、`--white`、`--bw-thin` 墨框；上緣撕線：`border-top: 3px dashed` ＋ `radial-gradient` 半圓缺口列（每 16px 一個 r 5 的缺口） |
| 數字 | `tabular-nums`、右對齊；千分位；負數紅字＋「−」（不只靠顏色） |
| 出現 | 從畫面下方 `panelIn`（GDD §12.1「薪資單滑入畫面」） |
| 升等時 | 職等牌翻轉＋「升」印章（§9.6）之後薪資單滑入，本薪列旁加紅色 `.stamp` 小印「調」 |
| 獎金單（`Payslip.base = 0`，季分紅與年終各一張，02 §7.5） | 同一張紙，標題改「獎金單」並在右上蓋黃底墨框小章「獎金」；只列分紅或年終、倍率（例「×0.85」）與預扣 10%；不顯示本薪、加班、on-call 列 |

### 9.18 手機（`components/phone.ts`）

```text
桌機：右側 360 × min(720px, 86vh)       手機：滿版
┌▐██████████████████▌┐                 ┌────────────────────────┐
│ 22:47        ▮▮▮ ▭  │ ← 狀態列         │22:47  ← ET 課群組（12） │
│◀ ET 課群組（12）    │ ← 墨底黃字標題    │                        │
│ ┌哲┐╭────────────╮ │                 │┌哲┐╭──────────────╮    │
│ └──┘│ET-03 又 down │ │ ← 對方：紙白對白框│└──┘│ET-03 又 down │    │
│     ╰────────────╯ │                 │    ╰──────────────╯    │
│      ╭──────────╮   │                 │       ╭────────────╮   │
│      │我在路上了  │◀ │ ← 自己：黃底     │       │我在路上了   │◀  │
│      ╰──────────╯   │                 │       ╰────────────╯   │
│ ── 03:12 系統 ──    │ ← 系統：置中灰字  │   ── 03:12 系統 ──     │
│[啾訊][通訊錄][人生] │ ← 底部 App 列     │[啾訊][通訊錄][人生]     │
└────────────────────┘                 └────────────────────────┘
工作機來電（覆蓋整個手機畫面）
┌▐██████████████████▌┐
│   [工作機]（藍標）  │ ← --glove 藍底紙白字
│                    │
│      ┌美玲姐┐       │ ← 頭像 96px、名牌色外框
│    美玲姐 來電      │ ← 900 28px
│   夜班領班 · 分機   │
│                    │
│ [ 接聽 ]  [ 不接 ]  │ ← 接聽 .btn（黃）；不接 .btn--plain；**不用紅／綠**
└────────────────────┘
```

| 元件 | 規格 |
|---|---|
| 外框 | `.phone-frame`；螢幕底 `--paper`；狀態列時間 `tabular-nums` |
| 群組標題 | 墨底黃字 900 15px；返回 `◀` |
| 訊息 | 對方：`.bubble` 紙白＋左側 32 × 32 頭像（§8.1 頭像裁切，外框依好感段落）；自己：`--yellow` 底對白框靠右；系統訊息：置中 12px `--ink-soft`；訊息出現 `panelIn` |
| 未讀 | 墨底黃字的數字徽章（**不用紅點**：紅色保留給危險） |
| 頭像外框（好感段落，GDD §4.2） | `hostile` 紅色雙線 3px；`cold` 墨色虛線 3px；`neutral` 墨色實線 3px；`trusted` 黃 3px＋墨 1px；`bonded` 黃 5px＋紅硬陰影 2px；外框旁加段落文字（朗讀與色盲） |
| 工作機來電 | `--glove` 藍色「工作機」標籤（工作機與私人手機的唯一區分色）；`buzz` 震動＋`vibrate` 音效；減少動態：不震，標籤旁顯示「震動中」文字＋震動圖示 |
| 「停下來」來電 | 私人手機、**無震動、無工作機標籤**；`softRing` 音效；`.panel--calm` 樣式；按鈕只有「接聽」（GDD §13.3） |
| 人生 App（MVP：離職，01 §10.4） | 清單只有一列「離職」；點下 → 確認頁：「確定要離職嗎？這會結束這一輪。」＋`.btn--plain`「再想想」＋`.btn--danger`「我確定」（第二步，出現 2 s 後才可按，防誤觸；倒數以文字顯示，不做動畫） |
| 求助資訊 | 通訊錄最上方固定一列「求助資訊」→ 開啟 §9.24 的求助卡（GDD §13.3「手機設定頁裡一直都有」） |
| 鍵盤 | P 開關、Esc 關閉、Tab 在訊息與按鈕間移動；焦點陷阱 |

### 9.19 下班卡與夜間生活

```text
下班卡（打卡機演出；桌機置中 420px、手機滿寬）
┌○──○──○──○──○──○──○──○─┐ ← 上緣打孔列
│  17:30  下班卡            │
│ ┌────────────────────┐  │
│ │   準時下班           │  │ ← .btn 大
│ └────────────────────┘  │
│  加班  ◀ 1 ━━●━━━━ 5 ▶ 小時│ ← 刻度滑桿（1～5，鍵盤 ← →）
│        預計 20:30 下班     │
│ ┌──────────┐┌─────────┐ │
│ │ 加班 3 小時 ││ 帶回家做 │ │
│ └──────────┘└─────────┘ │
└──────────────────────────┘
```

| 元件 | 規格 |
|---|---|
| 卡 | `.panel--doc` ＋ 上緣打孔列（`radial-gradient` 圓孔）；確認時卡片下緣蓋上墨色時間戳記「17:30」（`stampDown`，`stamp` 音效） |
| 滑桿 | 方形滑塊 20 × 28、墨框黃底；軌道 `--bw-thin`；5 個刻度；`role="slider"`；不畫數值 chip（規則在 core；文字說明來自 `t.ui.clock_out.*`，§13） |
| 夜間生活清單 | 2 欄（手機 1 欄）的小卡（`.choice` 縮小版：無編號、`min-height: 72px`）；每張：圖示（§9.21 的 pictogram）＋名稱＋一行說明（`t.ui.life_action.<id>.desc`）＋可見數值 chip（core 依 01 §7.8 的規則算好，放在 `Interaction.eveningActions.options[].chips`，01 D45） |

### 9.20 行事曆＋方針雙轉盤（`pages/policy_dial_page.ts`）

```text
桌機
┌[快轉：2027 年 7 月]──────────────────────────────────────────────┐
│ ┌月曆紙（手寫字）─────────────────┐  ┌工作方針──┐ ┌生活方針──┐ │
│ │ 一 二 三 四 五 六 日              │  │    ▼     │ │    ▼     │ │
│ │     1  2  3 ☎4  5  6             │  │  ╱拚╲    │ │ ╱休養╲   │ │
│ │  7  8  9 10 11 12 [值]13          │  │ 學 ● 穩  │ │存錢●伴侶 │ │
│ │ ……  ⚑風向期 ……  「考」28          │  │  ╲省╱    │ │運動 家人 │ │
│ └────────────────────────────────┘  │ 穩：偶爾加班│ │ 社交     │ │
│                                     └─────────┘ └─────────┘ │
│                                         [開始快轉 ▶]          │
└──────────────────────────────────────────────────────────────┘
手機：月曆收成一條（本段的特殊日清單）→ 工作轉盤 → 生活轉盤 → 按鈕，直向捲動
```

| 元件 | 規格 |
|---|---|
| 月曆紙 | `--paper`、`--f-body` 700 手寫字、格線 `--bw-hair`；標記：on-call（☎ 墨線圖示）、假日值班（墨底白字「值」）、考績週（紅色圈字「考」，`.stamp` 縮小版）、風向期（紅三角旗）、薪資日（「$」）；週快轉時只顯示 7 格 |
| 轉盤 | SVG 圓盤（直徑 220，手機 min(78vw, 280)）：紙白底、4px 墨框、扇形分格墨線 3、每格標籤 900 17px；上方紅色三角指針；目前選擇的扇形填 `--yellow`；拖曳、點扇形、或 ← →／↑ ↓ 切換；`dialSnap`；`role="radiogroup"`，每格 `role="radio"` |
| 說明 | 轉盤下方一行說明（`t.ui.policy.<id>.desc`，02 提供，不在 UI 算效果） |
| 安全提示 | 精神 ≤15 或體力 ≤20 時，app 先跑「關心」對話（GDD §2.3），本頁只在「休養」扇形加一個墨框小標「建議」（`flag.sys_suggest_rest` 時預選休養） |
| 鎖住（休養期、02 §5.10） | 兩個轉盤固定在「省＋休養」：扇形全部 `--stripe-locked`、指針改墨色、中央一行 `--ink-soft`「休養期間，先照顧自己」；不能拖曳、`aria-disabled`；只有「開始快轉」可按 |

### 9.21 快轉 montage（`pages/montage_page.ts`）

```text
桌機：3 格橫排                                   手機：3 格直排
┌────────────┐┌────────────┐┌────────────┐     ┌──────────────────┐
│▌早會被電▐   ││▌蹲在 ET-04 ││▌交通車上   │     │▌早會被電▐         │
│  (圖示)     ││ 前面▐(圖示) ││ 睡著▐(圖示)│     │   (圖示)          │
│     「啪」  ││            ││   Zzz      │     └──────────────────┘
└────────────┘└────────────┘└────────────┘     （第 2、3 格往下）
                                [跳過 ▶▶]
```

| 元件 | 規格 |
|---|---|
| 格 | `.panel`、`--bw-thick` 墨框、各自傾斜 −1°／+0.6°／−0.4°；格間距 12px；比例 4:3 |
| 格內容 | 左上黃底墨框的旁白框（漫畫敘述框，`--f-head` 900 15px，文字 `t.ui.montage.*`）＋中央 pictogram＋可選狀聲字（`--fs-h2` 描邊字） |
| pictogram | `src/assets/montage_icons.svg`（`<symbol>` 圖集，§14 CR-19）：viewBox `0 0 160 120`、墨線 5、風格同立繪；MVP 18 個：早會被電、蹲在機台前、交通車睡著、加班時鐘、泡麵、健身、電影院、打給家人、讀 paper、滑論壇、存錢筒、躺床休養、聚餐、PM 清單、SPC 圖、半夜來電、月曆翻頁、薪資單 |
| 選格規則 | 依本段的方針組合查表（`montage_page.ts` 內的 `MONTAGE_BY_POLICY`：工作方針 2 格＋生活方針 1 格），不讀遊戲規則 |
| 節奏 | 每格 `panelIn` 依序出現，間隔 1.0 s；點擊或 Space 立即顯示下一格；總長 ≤3 s（02 §5.2 的快轉預算；v1.1 由 ≤6 s 縮短）；「跳過」 |
| 減少動態 | 3 格同時出現 |

### 9.22 微事件 toast（`components/micro_event_toast.ts`）

```text
桌機（右下，340px）                手機（底部，滿寬，安全區上方）
┌[啾訊]───────────────────┐       ┌[啾訊] 小晴 ─────────────────┐
│小晴：週六要不要一起去…   │       │週六要不要一起去爬山？        │
│[好啊]  [下次吧]（預設）  │       │[好啊]        [下次吧]（預設）│
│▕██████████░░░▏ 3         │       │▕████████░░░░░░▏ 3            │
└─────────────────────────┘       └─────────────────────────────┘
```

- `.panel` 縮小版；預設選項按鈕旁加 `--ink-soft` 小字「（預設）」；倒數條同 §9.12 的縮小版（高 8px），時間 `5 × countdownScale`；`aria-live="polite"`；焦點**不**自動移入（避免打斷），但 Tab 第一個可到。

### 9.23 結局畫面（`pages/ending_page.ts`）

```text
桌機（漫畫最後一頁：4 小格＋1 大格，GDD §12.1）
┌──────┐┌──────┐┌──────┐┌──────┐
│ 格 1  ││ 格 2  ││ 格 3  ││ 格 4  │  ← panels[0..3]：旁白框＋pictogram
└──────┘└──────┘└──────┘└──────┘
┌────────────────────────────────┐
│          大格（插圖 SVG）        │  ← ending_<slug>.svg（§14 CR-19）
│                「撐過第一年」    │
└────────────────────────────────┘
╭[結局卡]─────────────────────────╮
│ E17 · 撐過第一年                 │  ← --fs-h1
│ 「明天也要上山。」                │  ← card 文字
╰─────────────────────────────────╯
┌[這一年的數字]───┐┌[你是什麼樣的工程師]──────────┐
│總加班  312 h    ││ 硬扛 ██████████ 62%          │
│被叫醒  9 次     ││ 協調 ███ 18%                 │
│準時下班 41 次   ││ 拒絕 ██ 12%  其他 8%          │
│收入 NT$ 812,400 ││                              │
│健康債  38       │└─────────────────────────────┘
└────────────────┘
┌[林課長的黑歷史本]（可捲動，全文）──────────────────┐
│ 6/13 值班夜準時下班……                               │
└────────────────────────────────────────────────────┘
「如果那天地震夜你沒有回去……」         [回標題] [再玩一次]
手機：全部單欄直排；4 小格變 2 × 2
```

| 元件 | 規格 |
|---|---|
| 調色（`EndingDef.palette`） | 本書定義的鍵（§13）：`firstYear`（紙白＋黃）、`badgeErased`（冷灰 `#d9dde2`＋墨）、`pip`（冷白＋紅）、`normalLife`（暖橘 `#f6d6b8`＋墨）、`hospital`（柔和白綠 `#e6f0e8`＋希望黃細線）、`rest`（**安靜模式**，見下） |
| 格 | 依序 `panelIn`，間隔 1.2 s；點擊加速 |
| 選項人格 | 水平條：每種 `ChoiceType` 一列（只列 ≥5% 的前 4 種，其餘合併「其他」），條為墨色、最高那條為黃底墨框；百分比文字；不用多色圓餅 |
| 數字 | `tabular-nums`；隱藏數值第一次公開時，每列 `panelIn` |
| E12〈先停下來〉（`tone: 'sensitive'`、`palette: 'rest'`） | **全部改成安靜樣式**：`.panel--calm`、`--f-calm`、無傾斜、無網點、無狀聲字、無音效（只有很輕的 BGM 鋼琴版或無聲）；4 格是細線插圖（線寬 3、`--ink-calm`）：遞出假單 → 診間門口（無醫療細節）→ 老家陽台的陽光 → 出門散步；結局卡「先停下來，不是輸。」；最後一定顯示求助資訊卡（`showHelpCard: true`）；**不出現「GAME OVER」**（GDD §13.3） |
| E13 | 同一般結局但不用紅色、不用狀聲字（GDD §13.1「帶著希望」） |

### 9.24 「停下來」序列與求助資訊卡（GDD §13.3；安靜優先於風格）

**原則**：這一段**拿掉所有漫畫元素**——沒有狀聲字、集中線、網點、紅色、抖動、傾斜、硬陰影、選項編號、數值 chip、倒數、打字音效。只用紙、字與留白。

```text
步驟 1：轉場（mood 進入 calm）        步驟 2：來電                     步驟 3：選擇（無倒數）
┌──────────────────────────┐       ┌──────────────────────────┐    ┌──────────────────────────┐
│                          │       │                          │    │                          │
│  （畫面 4 秒內溶成米白紙色） │       │      ┌─────┐             │    │  ・請假，去看醫生。         │
│                          │       │      │ 頭像 │  阿安       │    │                          │
│  今天早上，你在交通車上，   │       │      └─────┘             │    │  ・我想離開這份工作，先休息。│
│  發現自己怎麼樣都站不起來。 │       │  「你還好嗎？你聽起來很累。」│    │                          │
│                          │       │                          │    │  ・我想先跟人聊聊。         │
│                    繼續   │       │              接聽          │    │                          │
└──────────────────────────┘       └──────────────────────────┘    └──────────────────────────┘
```

| 步驟 | 規格 |
|---|---|
| 1 轉場 | `mood: 'calm'`：3D 轉 `calmPaper`（§3.2）、`#fx-layer` 紙色遮罩 `calmFade` 4 s、HUD 與數值面板淡出；音樂淡出 → 只剩 FFU 底噪 → 6 s 淡到無聲（§10）；旁白用 `.panel--calm`、`--f-calm` 500 18px、行高 1.8、置中、最大寬 32em；「繼續」是純文字按鈕（底線） |
| 2 來電 | 好感最高的人（阿安／小晴／媽媽，02 §11.2）：私人手機的安靜版（§9.18）、`softRing`、頭像 96px 用該角色的溫和表情（阿安 `gentle`、小晴 `relieved`；媽媽在 MVP 沒有立繪，只顯示名字「媽媽」與一個 `--ink-calm` 細線的電話圖示）、只有「接聽」。身心警訊的關心對話（02 §11.4）來電者多了阿哲，頭像用 `concerned`，樣式同一般工作外的來電 |
| 3 選擇 | §9.11 的 `calm` 清單樣式；3 個選項；**沒有倒數、沒有 chip、沒有編號**；焦點在第一項 |
| 「我想先跟人聊聊」 | 開啟求助資訊卡（下表）→ 關閉後顯示 2 格靜態線條插圖（「撥出電話」→「對方接起來」，**不模擬諮商內容**），每格 2 s 或點擊，之後回到步驟 3 |
| 「請假，去看醫生」 | 安靜樣式的結果文字＋成就「好好照顧自己」通知（`.panel--calm` 一行，無音效）；之後 mood 離開 `calm`（遮罩 2 s 淡出） |
| 「我想離開這份工作」 | 進入 E12（§9.23） |

**求助資訊卡**（`components/help_card.ts`，GDD §13.3、01 §10.4）

```text
┌──────────────────────────────────────┐
│ 如果你在現實中也有類似的感受，         │
│ 你不需要一個人撐。                     │
│                                      │
│ 安心專線　1925（24 小時）              │
│ 生命線　　1995                         │
│ 張老師　　1980                         │
│                                      │
│                          我知道了     │
└──────────────────────────────────────┘
```

| 項目 | 規格 |
|---|---|
| 位置 | `#modal`，置中，寬 min(480px, 100% − 32px)；背景遮罩 `--paper-calm` .9（不是黑色） |
| 樣式 | `.panel--calm`；文字 `--f-calm` 500 17px、`--ink-calm`；號碼 700 22px `tabular-nums`，與名稱用全形空白對齊 |
| 號碼 | **純文字**（`<p>`），可選取、可複製；**不做 `tel:` 連結**、不做按鈕（GDD §13.3） |
| 禁止 | 動畫（只允許 200 ms 淡入）、音效、圖示、插圖、顏色強調、倒數、自動關閉 |
| 入口 | 停下來序列、設定頁「求助資訊」、手機通訊錄最上方、E12 片尾、精神 ≤15 時手機會出現（01 §10.4） |
| 朗讀 | `role="dialog"`、`aria-labelledby` 指向第一句；關閉後焦點回到開啟前的元素 |

### 9.25 標題、內容提示、建角

```text
標題（桌機；背景是 bayDay 的 3D 走道慢慢自轉，L4 時為 CSS 背景）
┌──────────────────────────────────────────────────────┐
│   ╔═════════════════════════════╗                     │
│   ║ 上山！穹晶 FAB 7             ║ ← --fs-h1 ×1.6，9px 墨描邊、紅硬陰影（狀聲字樣式）
│   ╚═════════════════════════════╝   ＱＱ ← 紅色麥克筆塗鴉 SVG（GDD #1）
│   ┌開始新遊戲┐                                      │
│   ┌繼續──────┐  ← 沒有存檔時 aria-disabled                │
│   ┌設定──────┐                                      │
│   ┌內容提示──┐                                      │
│                              本作為虛構作品 ← 12px    │
└──────────────────────────────────────────────────────┘
```

| 畫面 | 規格 |
|---|---|
| 標題 | 按鈕縱排、`.btn`（第一個黃、其餘 `.btn--plain`）、每個傾斜 −1.5°／+0.8° 交錯；背景 3D 鏡頭繞 bay 走道 0.02 rad/s 緩慢自轉（減少動態：靜止）；「QQ」塗鴉是紅色麥克筆筆觸（線寬 10、末端漸細的路徑），不嘲笑任何人 |
| 內容提示（第一次開始前） | 半安靜樣式：`.panel`（保留墨框與陰影，因為是遊戲包裝的一部分），但不用狀聲字與網點；內容：「本作包含職場霸凌、過勞、心理健康議題……本作為虛構作品……」；底部固定一行「求助資訊」文字按鈕；`.btn`「我知道了，開始」；設定頁可再看（GDD §13.2） |
| 建角 | 3 張履歷卡（§9.11 的卡片樣式，編號「壹貳參」，chip 顯示起始數值差異）；姓名輸入框（`--bw` 墨框、`--f-body` 20px、最多 8 字、只用 `textContent` 顯示，01 §10.2）；代名詞 3 格分段鈕「他／她／TA」；外型 A／B 兩格頭像選擇（CR-19）；`.btn`「報到」 |

### 9.26 設定、存讀檔、暫停、錯誤、toast、L4 清單

```text
設定（桌機 640px 置中；手機滿版）
┌[設定]────────────────────────────────────────────┐
│ 減少動態      [系統][開][關]                       │ ← 分段鈕：方形格，選中黃底
│ 文字速度      [慢][普通][快][立即]                  │
│ 文字大小      [標準][大][特大]           ← CR-09   │
│ 倒數倍率      [×1][×1.5][×2]                       │
│ 自動著裝      [開][關]                             │
│ 操作模式      [自動][自由走動][定點鏡頭]             │
│ 畫質          [自動][高][中][低]   重新整理後生效的項目以小字標示 │
│ 色彩輔助      [開][關]                             │
│ 幻覺震動      [開][關]                             │
│ 主音量  ━━━━●━━ 80   音樂 ━━●━━ 60   ← CR-09        │
│ 音效    ━━━━●━━ 80   環境 ━━━●━ 70                 │
│ 內容提示  [查看]      求助資訊  [查看]               │
└──────────────────────────────────────────────────┘
存讀檔
┌[存檔]──────────────────────────────────────────────┐
│ ┌自動────────────┐ ┌欄位 1──────────┐ ┌欄位 2─────┐ │ ← 檔案夾卡（.panel--doc＋上緣分頁標籤）
│ │第三章 · 第 105 天│ │序章 · 第 3 天  │ │（空）      │ │
│ │Q1 · ○○○       │ │                │ │            │ │
│ │[讀取]           │ │[讀取][覆寫][刪除]│ │[存到這裡]  │ │
│ └────────────────┘ └────────────────┘ └────────────┘ │
│ [匯出存檔字串] [匯入]                                 │
└──────────────────────────────────────────────────────┘
```

| 畫面 | 規格 |
|---|---|
| 設定 | 每列：名稱 `--f-head` 700 15px（左）＋控制項（右）；分段鈕＝相鄰方格、`--bw-thin` 墨框、選中黃底＋內框；滑桿＝§9.19；變更立即生效並存檔（01 §11.6）；手機每列改上下排 |
| 存讀檔 | 檔案夾卡；「刪除」與「覆寫」需要頁內第二次確認（`.btn--danger`「確定刪除」，**不用** `confirm()`）；匯出／匯入用 `<textarea>`（墨框、等寬字型 `ui-monospace, Consolas, monospace` 13px） |
| 暫停 | `#overlay` 置中 `.panel`：繼續（黃）／存檔／設定／回標題（第二次確認）；背景 3D 壓暗 .45 |
| 錯誤頁 | `.panel` ＋ 紅標題貼紙「出錯了」；單行錯誤訊息（01 §12.2）`--f-head` 700；可行動按鈕（重試、回標題、匯出存檔）；不用狀聲字、不加誇張表情（玩家此時是困擾的，不是被逗的） |
| toast | 頂部置中（手機滿寬）`.panel` 小版、3～5 s 自動消失（可關閉 `×`）；畫質降級提示附「復原」按鈕（01 §9.7） |
| L4 場景替代（`scene_fallback`） | §4.6；地點按鈕列＋hotspot 清單；清單列含狀態文字（`● RUN`），點擊等同 `activate`；定點鏡頭模式（L3）也顯示同一份清單在右側（手機為底部抽屜），方便不用點 3D |

### 9.27 小遊戲共用外框，以及給 03 的共用視覺規範

> 回應 03 §10.2 的 A-1～A-10。小遊戲各自的版面與互動規則以 03 為準；以下是它們**必須遵守**的樣式。

**A-1 外框**（`components/minigame_frame.ts`）

```text
┌[SPC 獵人]▌ET-04 · AEI CD (nm)       時限 ▕██████░░▏ 31s   [?][Ⅱ]┐ ← 標題列
│                                                                │
│                     （03 的遊戲內容區）                          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ ← → 選點・Enter 標記・數字選類型與處置・Esc 取消／暫停              │ ← 操作提示列
└────────────────────────────────────────────────────────────────┘
```

| 部位 | 規格 |
|---|---|
| 外框 | `.panel`（`--bw` 墨框、`--sh`），桌機 `min(1100px, 100% − 32px)` × `min(680px, 100% − 64px)`，手機滿版（含安全區）；開啟時 `panelIn` |
| 3D 壓暗 | `#overlay` 背後鋪 `rgba(10,10,10,.45)`（夜間、`phoneGlow` 場景 .3）；3D 繼續渲染但 app 可降到「有變化才繪製」 |
| 標題籤 | `.sticker`（紅底紙白、−3°）放在外框左上；副標（例「ET-04 · AEI CD (nm)」）緊接在右、墨字 700 15px |
| 計時條 | 同 §9.12 的樣式（高 12px），剩餘 ≤5 s 時秒數紅底、框線粗細 3 ↔ 5px 1 Hz（不閃色）；減少動態：只改紅底 |
| `?`／`Ⅱ` | 36 × 36 `.btn--plain` 方鈕 |
| 操作提示列 | 外框底部 `--bw-thin` 上框線、`--paper` 底、`--f-head` 700 13px、`.keycap` 標鍵；手機隱藏（改成 `?` 說明） |
| 觸控目標 | 所有可點元素 ≥44 × 44（手機 ≥48 高，03 已列）；格位與按鈕間距 ≥8px |

**A-2 結果卡與印章**

| 印章文字（03 §2.5） | 顏色 | 用於 |
|---|---|---|
| `RELEASE` | 墨色印章（墨框墨字） | success |
| `HOLD` | 黃底墨字印章（墨框） | partial、SPC 標記小印 |
| `SCRAP` | 紅色印章 | fail |
| `REWORK`、`SPLIT`、`FA` | 墨色印章 | Hold Lot 各處置（03 §5.9） |
| `OVER Q → REWORK` | 紅色印章、兩行 | Q-time 逾時 |
| `退回重穿` | 紅色印章（中文 900） | 著裝失敗 |

- 印章外觀：`.stamp` 系統（雙框、−12°、網點質感）；英文印章字 `--f-head` 900 + `letter-spacing: .08em`；大小：結果卡 120 × 64、lot 卡上 96 × 52、SPC 點上的小印 28 × 16。
- 旋轉：−12°，每次蓋章在 −14°～−9° 之間依結果雜湊固定一個值（看起來像手蓋的，但可重現）。
- 動畫：`stampDown` 300 ms `steps(3)`＋`stamp` 音效；**減少動態：直接顯示蓋好的印章**（不縮放、不旋轉動畫，旋轉角保留）。
- 結果卡：`.panel` 置中 420px；分數 `--fs-h1` 900 `tabular-nums`（Hold Lot 不顯示分數，03 §5.6）；1～3 行事實 `--f-body` 700；一句評語 `--ink-soft`；`.btn`「繼續 ▶」。

**A-3 SPC 管制圖（Canvas 2D）**

| 元素 | 樣式（亮色版／深色版） |
|---|---|
| 背景 | `#fffdf4` ／ `#0d1114`（機台螢幕色，logTrace 用） |
| 格線 | 每 5 點一條直線 1px `#d9d6cc` ／ `#2b2f3a` |
| CL 中心線 | 2px 實線 `#0a0a0a` ／ `#e9eef2` |
| ±2σ | 1.5px 虛線 `[6, 4]` `#5a574f` ／ `#9aa3ad` |
| UCL／LCL | 3px 實線 `#0a0a0a` ／ `#e9eef2` |
| USL／LSL | 2px 點線 `[2, 4]` `#e60012`（兩版同） |
| 一般點 | 實心圓 r 4、墨色、外圈 2px 紙白（深色版：紙白點、墨外圈） |
| 新點 | 雙圈 ◉（外圈 r 7 墨線 2） |
| OOC | **空心菱形** ◇ 邊長 10、墨線 2.5（03 §4.9：形狀編碼） |
| OOS | **實心三角** ▲ 邊長 11、`#e60012` 填色＋墨線 1.5 |
| 游標 | 黃色 `#ffd400` 方框 16 × 16、墨線 2 |
| 已標記 | 墨色方框 14 × 14 ＋ `HOLD` 小印章 |
| 假點 | 不透明度 .55 的一般點，0.4 s 後淡出（減少動態：靜態淡入淡出，03 §1.5） |
| 標籤文字 | `900 12px "Noto Sans TC", "Microsoft JhengHei", sans-serif`（與 `--f-head` 一致；Canvas 不吃 CSS 變數，常數寫在 `ui/minigames/spc_view.ts`，`test/palette_sync.test.ts` 一併檢查色碼）；數字 `tabular-nums` 不可用時以等寬對齊 |
| 線寬縮放 | 所有線寬 × `devicePixelRatio`（上限 2）；canvas 尺寸以 CSS px × DPR 建立，避免模糊 |
| logTrace 鋸齒圈 | 成功時紅色 3px 手繪橢圓（4 段貝茲，起訖點錯開 8°）圈住異常段 |
| OOS 演出 | 外框紅暈 0.5 s（`alert` 單次）＋`beepAlarm`＋字卡「OOS！」；減少動態只有字卡 |

**A-4 半夜電話**

- 背景：2.5D `scn.room` 的 `phoneGlow` 光組（§4.5），3D 壓暗 .3。
- 工作機面板：`.phone-frame` 的深色版：螢幕底 `#141821`、文字 `#e9eef2`、說話者牌黃字墨底不變、`--glove` 藍色「工作機」標籤。
- **遮字塊**：`▒` 不是字型字元的視覺依賴——用 `<span class="garble" aria-label="聽不清楚">` 包住原文長度的方塊：背景 `repeating-linear-gradient(90deg, #5a574f 0 3px, transparent 3px 5px)`、高 1em、寬＝字數 × 1em；**不用 CSS blur**（03 §1.5）。
- 睡意晃動（可關閉，跟「減少動態」與 `phantomVibration` 無關，用小遊戲自己的設定或減少動態）：整個面板 `translate` ±2px、0.25 Hz 正弦（這是 `linear` 的例外，因為要表現昏沉）；暗角：`radial-gradient(ellipse, transparent 55%, rgba(5,7,12,.7) 100%)`；減少動態：都關閉。
- 危險指令的「畫面一瞬間紅」：`alert` 單次 300 ms、不重複（符合 ≤3 次／秒）；減少動態：改成面板紅框 0.3 s。
- 指令清單：危險與一般指令外觀**完全相同**（03 §6.9），本書不提供任何警示樣式給它們。

**A-5 lot 卡（流程卡樣式）**

- `.panel--doc`；頁首「LOT」標籤列墨底紙白；欄位表格線 `--bw-hair`；量測表數值 `tabular-nums` 右對齊；OOS 值後面加 `▼OOS` 紅字＋三角形狀（不只靠顏色）。
- 客戶等級徽章：`★Hot Lot` 黃底墨框墨字（緊急）、一般客戶無徽章、`晨曦科技` 名稱 700。
- 手寫留言欄：淡黃 `#fff6c2` 底、`--f-body` 400 15px、左側 3px 墨色豎線、前綴留言者（「製造部：」）。
- wafer map（25 格）：5 × 5 方格（每格 14px、間距 2px）；正常＝白格墨框、異常＝墨色實心、**有疑慮＝斜線填滿**、報廢＝× 號（形狀編碼，色盲安全）。
- 換卡：`slideSwap`；蓋章見 A-2。

**A-6 著裝與風淋室**

- **3D 換裝時機（決定）**：3D 角色在小遊戲進行中維持 `casual`；小遊戲結束時（success 或 partial，或自動著裝）app 把主角的 `SceneActor.outfit` 換成 `cleanroom`，render 在下一次 `apply` 時直接替換模型（遮在小遊戲外框收起的 `panelIn` 反向動畫後面，不做逐件換裝）。「退回重穿」時維持 `casual`。
- **紙娃娃**：DOM SVG（`src/assets/gowning_doll.svg`，CR-19），viewBox `0 0 160 240`、6 個疊層群組 `g.layer-mask`、`layer-hairnet`、`layer-hood`、`layer-boots`、`layer-suit`、`layer-gloves`（依穿戴順序由下到上疊，頭罩戴上後臉只露眼睛）；風格同立繪（墨線 5、無塵衣 `#f7f7f2`、手套 `#2a6fe0`）。
- **置物架圖示**：`src/assets/gowning_icons.svg`，6 個 `<symbol>`（口罩、髮罩、頭罩、無塵鞋、無塵衣、手套），viewBox `0 0 64 64`、墨線 4；與 3D 耗材架盒面貼紙共用同一組（§5.7）。
- **風淋室**：**不 3D 化**（3D 只有靜態的風淋室外觀與紅綠燈，§4.3）；DOM 演出：畫面左右兩側水平風線（`fx-speed` 的變體：`repeating-linear-gradient` 的白色細線＋往中央的 `mask`，從兩側以 `steps(4)` 每 120 ms 位移）；減少動態：關閉風線，只保留「風淋中」文字標示。
- **指示燈**：直徑 28px 圓形燈＋文字（「●等待」紅／「●可通行」綠）——文字永遠在（色盲）；燈轉綠時一次 `pop`。
- **轉圈盤**：SVG 圓環（直徑 220，手機 視窗寬 − 64），墨線 4、紙白底；目前角度的墨點 r 10；已累積的圓弧畫成 6px 黃色弧＋墨邊。
- **選錯回饋**：格子 1 格抖動＋紅框（減少動態：紅框 0.3 s，03 已列）。

**A-7 音效**：新增 `airShower`、`whoosh`、`ding`（§10.3、§14 CR-03）；其餘沿用 `stamp`、`beepAlarm`、`vibrate`。

**A-8 減少動態與色彩輔助（統一規範）**

1. 所有動畫只透過 `fx.css` 的關鍵影格與 `[data-reduce-motion]` 選擇器控制；小遊戲的 JS 動畫（canvas、拖曳回彈）讀 `MotionPolicy.reduced`，為真時直接到終點。
2. 任何狀態都必須有**形狀或文字**的第二編碼（03 已全部列出；本書的色票提供顏色、形狀表見 A-3、A-5）。
3. `colorAssist` 開啟時：小遊戲畫面加大形狀標記 20%、狀態文字改成墨底白字的標籤；不改色票。
4. `calm` 期間不會進入小遊戲（02 的流程保證）；萬一進入，外框改 `.panel--calm`、關閉所有特效。

**A-9 手機版面**：沿用 760px 斷點與安全區（§9.1）；外框滿版時上緣 `max(8px, env(safe-area-inset-top))`、下緣 `max(8px, env(safe-area-inset-bottom))`；底部固定的按鈕列高 ≥56px。

**A-10 黃光區之眼（完整版）**：3D 端由 `photoAmber` 光組自然染色（§3.2）；DOM 端在小遊戲外框加 `.amber-filter`：`background` 疊一層 `rgba(255,190,40,.38)` 的 `mix-blend-mode: multiply` 層（不用 CSS `filter` 的 hue-rotate，避免文字也被染色到不可讀；文字與按鈕在濾層之上）；提示從顏色漸變為符號時，符號用墨色、尺寸 ≥18px。效能：一層合成，可忽略。

---

## 10. 聲音規格

> 01 D18：MVP 音效全部用 Web Audio 程式合成，不放音檔。實作在 `src/audio/synth.ts`（配方）與 `audio_service.ts`（匯流排、播放、音量）。audio 不決定「何時播」，由 app 依領域事件呼叫（01 §4）。

### 10.1 匯流排與基本規則

```text
          ┌ bgm（預設 0.22）──┐
 來源 ──▶ ├ sfx（預設 0.80）──┤──▶ master（預設 0.80）──▶ DynamicsCompressor ──▶ destination
          ├ ambience（0.70）──┤        threshold −18 dB、ratio 3、attack 5 ms、release 120 ms
          └ ui（0.60）────────┘
```

- `AudioContext` 在第一次使用者手勢（標題畫面「開始新遊戲」／「繼續」）時建立或 `resume()`；之前**不發任何聲音**。
- 分頁隱藏（`visibilitychange`）時 `suspend()`，回來時 `resume()`。
- 每個 SFX 有並發上限 3（同一個 ID 第 4 次觸發時丟掉最舊的）；全部 SFX 同時 ≤8 個 voice。
- 所有增益變化用 `setTargetAtTime`（時間常數 0.03 s），避免爆音。
- 音量（§10.5）以 0～1 線性值儲存，套用時轉成 `gain = value²`（接近聽感的對數曲線）。
- 響度目標：SFX 峰值約 −10 dBFS；環境音約 −30 LUFS；BGM 約 −24 LUFS。fab 的真實底噪是 71～80 dB SPL（FD §5.6），**遊戲只取它的音色、不模擬音壓**（長時間遊玩與聽力保護）。

### 10.2 環境音（ambience 匯流排）

| 環境 `AmbienceKind`（§14 CR-18） | 組成 | 位準 | 用於 |
|---|---|---|---|
| `fab`（FFU 底噪） | ① 褐噪音（2 s 迴圈緩衝，由白噪音積分產生）→ 低通 220 Hz（Q 0.5）→ 0.60；② 白噪音 → 帶通 1,100 Hz（Q 0.4）→ 0.04（風聲的「嘶」）；③ 正弦 120 Hz → 0.015、240 Hz → 0.006（台灣市電 60 Hz 的倍頻交流聲）；④ 低通截止頻率以 0.07 Hz 的 LFO ±20 Hz 緩慢起伏 | 匯流排 0.70 | `scn.fab_bay`（bay 區） |
| `photo` | 同 `fab`；另外 BGM 匯流排插入帶通 700 Hz（Q 0.9）——GDD §12.4「BGM 加上帶通濾波，聽起來悶悶的」 | 同上 | 玩家在 `loc.photo_area` |
| `gowning` | `fab` −6 dB（門外傳進來的 FFU）＋偶發的衣物摩擦聲（白噪音帶通 3 kHz、150 ms，每 6～14 s 一次，0.02） | 同上 | `scn.gowning_room` |
| `office` | 空調：褐噪音 → 低通 120 Hz → 0.25；鍵盤聲：每 0.4～3 s 隨機一下（白噪音高通 2.5 kHz、12 ms、0.015），夜晚改成每 2～6 s | 同上 | `scn.office` |
| `night_room` | 冰箱壓縮機：正弦 55 Hz＋110 Hz（0.01）、每 40 s 啟停一次 | 同上 | `scn.room` 夜晚 |
| `none` | 無 | — | 其他 2.5D、標題 |

- **天車經過**（`fab` 內）：每 8～20 s 一次，白噪音 → 帶通掃頻 500 → 900 → 450 Hz（1.8 s）、增益包絡三角形峰值 0.05、`StereoPanner` −0.6 → +0.6。MVP 不跟 3D 天車的位置同步（render 不能直接呼叫 audio；§15 #22）。
- **危機時**：`bayAlarm` 期間 `fab` 底噪壓低 6 dB（GDD §12.1「FFU 底噪被壓低」）；`beepAlarm` 播完 3 輪後，改為每 6 s 一次、音量 ×0.4 的提醒嗶聲，直到機台恢復或離開 bay。
- **灰區（完整版）**：`fab` +4 dB、加泵浦脈動（正弦 30 Hz、AM 1.5 Hz）。
- **`calm`**：BGM 1.5 s 淡出 → 只剩當下環境音 → 6 s 淡出到 0（GDD §13.3「只剩 FFU 底噪，然後是安靜」）；期間只允許 `softRing` 與 `uiTap`。

### 10.3 音效配方（sfx／ui 匯流排）

| `SfxId` | 用途 | 合成方式 | 頻率與包絡 | 增益 | 匯流排 |
|---|---|---|---|---|---|
| `beepAlarm` | 機台 down 警報（「嗶——嗶——」） | 方波 → 低通 3.5 kHz | 1,320 Hz；開 0.45 s／關 0.25 s × 3；起音 5 ms、釋放 20 ms | 0.16 | sfx |
| `chirp` | 啾訊通知「啾」 | 正弦，指數掃頻 | 第一聲 1,800 → 3,200 Hz 70 ms；間隔 40 ms；第二聲 2,400 → 3,600 Hz 60 ms；起音 3 ms、指數衰減 | 0.12 | ui |
| `vibrate` | 工作機震動（on-call 焦慮的核心） | 方波 → 低通 380 Hz，再以 28 Hz 正弦做 AM（深度 0.6） | 170 Hz；開 0.4 s／關 0.2 s × 2，來電期間每 1.6 s 重複 | 0.22 | sfx |
| `stamp` | 印章、打卡 | ① 正弦 95 → 55 Hz 140 ms 指數衰減（咚）；② 白噪音 25 ms 帶通 220 Hz（Q 1.2）；③ 白噪音高通 3 kHz 6 ms（喀） | 同左 | 0.35 | sfx |
| `tsk` | 「嘖」 | 白噪音 → 高通 3.2 kHz → 帶通 5 kHz（Q 2） | 45 ms；起音 1 ms、衰減 40 ms | 0.12 | sfx |
| `huh` | 「蛤？」 | 鋸齒波滑音 → 帶通 900 Hz（Q 3）＋ 帶通 1,700 Hz（Q 4，混 0.4）（卡祖笛般的人聲共振峰） | 210 → 330 Hz 260 ms；起音 20 ms、釋放 80 ms | 0.10 | sfx |
| `slap` | 「啪」 | 白噪音 → 帶通 1.3 kHz（Q 0.8）＋ 正弦 180 Hz 30 ms | 70 ms；起音 1 ms、指數衰減 60 ms | 0.28 | sfx |
| `heartbeat` | 兩難陷阱的心跳 | 兩下正弦（低通 150 Hz） | 第一下 62 → 42 Hz 90 ms；間隔 160 ms；第二下 55 → 40 Hz 80 ms（×0.7）；週期 0.9 s（66 bpm），倒數最後 3 s 改 0.66 s（90 bpm） | 0.25 | sfx |
| `rumble` | 地震 | 褐噪音 → 低通 90 Hz ＋ 正弦 32 Hz（0.3） | 3 s：起音 0.2 s、持續 1.2 s、釋放 1.6 s | 0.40 | sfx |
| `stingPraise`＊ | 被肯定（GDD「吉他短樂句」） | 撥弦：三角波＋鋸齒波（0.3）→ 低通 2.4 kHz，每音指數衰減 400 ms | 琶音 E4 330／G♯4 415／B4 494 Hz，間隔 90 ms | 0.14 | sfx |
| `uiTap`＊ | 按鈕按下（只有按下，**不做 hover 音**） | 正弦 880 Hz 25 ms ＋ 白噪音高通 2 kHz 5 ms | 起音 1 ms | 0.05 | ui |
| `cardLocked`＊ | 按到鎖卡 | 方波 110 Hz 70 ms → 低通 400 Hz ＋ 低通噪音 40 ms | — | 0.10 | ui |
| `countdownTick`＊ | 倒數每秒 | 正弦 1,000 Hz 20 ms；最後 3 s 改 1,400 Hz | 起音 1 ms | 0.05 | ui |
| `pageTurn`＊ | 翻頁、掀便利貼、月曆 | 白噪音 → 帶通掃頻 2 kHz → 600 Hz（Q 0.7） | 180 ms，三角形包絡 | 0.10 | ui |
| `softRing`＊ | 「停下來」序列的來電（**取代震動**） | 正弦兩音 | 660 Hz 350 ms → 880 Hz 350 ms；起音 40 ms、釋放 300 ms；每 2 s 一組，最多 3 組 | 0.08 | ui |
| `airShower`＊ | 風淋室（**持續音**，03 A-7） | 白噪音 → 帶通 2.5 kHz（Q 0.5）→ 低通 6 kHz | 起音 0.15 s、持續到 `stopLoop`、釋放 0.4 s | 0.18 | sfx |
| `whoosh`＊ | 換上一件裝備「咻」（03 A-7） | 白噪音 → 帶通掃頻 600 → 2,400 Hz（Q 1.5） | 160 ms | 0.10 | sfx |
| `ding`＊ | 風淋燈轉綠「叮」（03 A-7） | 正弦 1,568 Hz ＋ 3,136 Hz（0.3） | 起音 2 ms、指數衰減 600 ms | 0.12 | sfx |
| `doorSlide`＊ | 風淋門、自動門 | 白噪音 → 低通 800 Hz 400 ms ＋ 正弦 70 Hz；結尾 60 ms 的「喀」 | — | 0.12 | sfx |
| `coinPop`＊ | 人情 +1（−1 時音程反向） | 正弦 1,320 → 1,980 Hz 60 ms ＋ 2,640 Hz 30 ms；−1：990 → 660 Hz | — | 0.10 | ui |

＊ §14 CR-03 新增的 `SfxId`。

- **幻覺震動**（GDD §12.1，精神 ≤15）：`vibrate` 單次 0.4 s、增益 0.15；`settings.phantomVibration = false` 時不播。
- **不使用** `navigator.vibrate()`（實體震動）：在使用者沒預期的時候震動手機太突兀，而且 iOS 不支援（§15 #21）。

### 10.4 BGM（程式合成，極簡）

| `BgmMode` | 內容 | 位準 |
|---|---|---|
| `normal` | 漫畫劇場風的「爵士放克（極簡版）」：96 BPM、E 小調五聲音階、8 小節迴圈。聲部：①貝斯（三角波，E2 82 Hz 起的 8 分音符走句）；②鼓（大鼓：正弦 60 → 40 Hz 80 ms 在 1、3 拍；邊擊：白噪音高通 1.8 kHz 30 ms 在 2、4 拍）；③電鋼琴（方波 → 低通 1.2 kHz，Em7 ↔ A7 每小節交替的反拍和弦）；④腳踏鈸（白噪音高通 7 kHz 30 ms、8 分音符、0.03） | 匯流排 0.22 |
| `normal`＋`mood: 'low'`／`'warning'` | 拿掉③電鋼琴（GDD §12.1「BGM 少一個聲部」） | 同上 |
| `lowpass` | 整條 BGM 過低通 600 Hz ＋ 低頻 drone（正弦 55 Hz、0.03）（GDD「BGM 加低通濾波，再疊一層低頻 drone」） | 同上 |
| `crisis` | 120 BPM 打擊樂：中鼓（正弦 110 → 70 Hz 120 ms）8 分音符型態＋每拍的低音脈衝；沒有和弦 | 同上 |
| `silent` | 1.5 s 淡出 | — |
| 結局 | 「鋼琴」：正弦＋二倍頻（0.25）、指數衰減 1.2 s；70 BPM 分解和弦；好結局 E 大調、壞結局 E 小調（GDD「好壞各一首變奏」）；E12 只用 3 個音的極慢版本或無聲 | 0.18 |

- **排程**：前瞻排程器，每 25 ms 檢查、排入未來 120 ms 內的音符（`AudioContext.currentTime` 為準，不用 `setTimeout` 計時音符）。
- **降級**：若 Stage 3 實測 BGM 合成在手機上造成掉幀（音訊執行緒以外的排程成本 >0.5 ms／幀），MVP 改成**無 BGM**：`BgmMode` 只影響環境音的濾波與 drone，SFX 照常（§15 #20）。之後的音檔方案走同一個 `AudioService` 介面（01 §1.1）。

### 10.5 音量、靜音與設定

| 設定 | 預設 | 範圍 | 位置 |
|---|---|---|---|
| 主音量 `masterVolume`（01 既有） | 0.8 | 0～1 | 設定頁 |
| 音樂 `bgmVolume`＊ | 0.6 | 0～1 | 設定頁 |
| 音效 `sfxVolume`＊（含 ui 匯流排） | 0.8 | 0～1 | 設定頁 |
| 環境 `ambienceVolume`＊ | 0.7 | 0～1 | 設定頁 |
| 幻覺震動 `phantomVibration`（01 既有） | true | 開／關 | 設定頁 |

＊ §14 CR-09 新增。

- **靜音**：主音量 0 即靜音；暫停頁與 HUD 不另放靜音鈕（設定頁一處管理）。鍵盤 `M` 切換主音量 0 ↔ 上一次的值（輸入框有焦點時不作用）。
- 減少動態**不影響**聲音；`calm` 的音訊規則見 §10.2。

---

## 11. 無障礙與在地化

### 11.1 對比度（WCAG 2.2，以相對亮度計算）

| 前景／背景 | 對比 | 可用於 |
|---|---|---|
| `--ink` ／ `--paper` | 19.4 : 1 | 一切文字 |
| `--yellow` ／ `--ink`（時鐘、正面 chip、說話者牌） | 13.8 : 1 | 一切文字 |
| `--ink` ／ `--yellow`（hover、黃按鈕、便利貼） | 13.8 : 1 | 一切文字 |
| `--ink` ／ `--grey` | 13.6 : 1 | 停用與鎖卡上的文字 |
| `--ink-soft` ／ `--paper` | 7.1 : 1 | 內心獨白、說明 |
| `--ink-soft` ／ `--grey` | 5.0 : 1 | 鎖卡標題 |
| `--ink-calm` ／ `--paper-calm` | 11.2 : 1 | 安靜模式 |
| `--paper` ／ `--red`（負面 chip、紅貼紙、「危」） | 4.7 : 1 | 一般文字（≥13px 粗體） |
| `--paper` ／ `--glove`（工作機標籤） | 4.6 : 1 | 一般文字 |
| `--red` ／ `--ink` | 4.1 : 1 | **只用於 ≥18.66px 粗體或裝飾大字**（選項編號、狀聲字陰影） |
| `--screen-run` ／ 螢幕底 `#0d1114` | 9.6 : 1 | 3D 螢幕文字 |
| `--yellow` ／ `--paper` | 1.4 : 1 | **禁止當文字**（§1.7） |

- `test/palette_sync.test.ts` 順便以同樣的公式計算上表，斷言前 10 列 ≥4.5（第 10 列 ≥3.0）。

### 11.2 字級

- 有意義文字 ≥12px（`--fs-min`）；台詞桌機 17～21px、手機 15px（範例值）；選項標題手機 16px。
- 設定「文字大小」：標準 ×1、大 ×1.15、特大 ×1.3（`--text-scale`，§14 CR-09），由 `<html data-text-scale>` 控制；放大後版面不得截字：對話區改為捲動（`overflow-y: auto`，範例已有）、選項卡在特大時一律單欄。
- 不用 `vw` 單獨決定字級（範例的 `clamp()` 有下限，保留）。

### 11.3 色盲安全（不只靠顏色）

| 資訊 | 顏色以外的編碼 |
|---|---|
| 機台狀態 | 燈號位置（紅在最上）、螢幕文字 RUN／WARN／ALARM、只有 down 會閃、星芒、L4 的 `● ▲ ■` 文字（§5.1、§4.6） |
| 正負數值 | chip 一律 ＋／− 符號（01 §10.6）；浮字也帶符號 |
| 危險數值 | 「危」字標籤＋紅斜紋（斜紋本身是圖樣） |
| 鎖卡 | 鎖頭圖示＋虛線框＋條件文字 |
| hold FOUP | 標籤尺寸較大（§5.3） |
| 角色名牌 | 名牌上的單字＋頭頂名字＋林／豪哥的額外圖樣（§1.2） |
| 好感段落 | 外框樣式（雙線／虛線／實線／粗）＋文字（§9.18） |
| 黃光區 | 閘口標牌文字「PHOTO AREA」＋斜紋帶；完整版小遊戲的符號提示（§9.27 A-10、FD §5.3「用符號而不只用顏色」） |
| SPC、lot、wafer map | 形狀編碼（§9.27 A-3、A-5） |
| `colorAssist` 開啟 | 機台上方的狀態圖示 sprite、小遊戲形狀放大、chip 加 ↑↓ 箭頭 |

### 11.4 鍵盤與焦點

- 焦點樣式：範例值 `outline: 4px solid var(--yellow); outline-offset: 3px; box-shadow: 0 0 0 8px var(--ink)`；安靜模式改 2px `--ink-calm`。**任何元件都不准 `outline: none` 而不提供替代**。
- 焦點順序：DOM 順序＝視覺閱讀順序（HUD → 數值面板 → 任務便利貼 → 對話 → 選項 → 倒數）；選項出現時焦點跳到第一張可選卡、結果框跳到「繼續」（01 §10.6）。
- 3D 互動：靠近 hotspot 時互動提示的 `.keycap`「E」也是可聚焦的按鈕（Tab 可到，Enter 觸發）。
- 手機「手機」「暫停」常駐按鈕（01 §10.7）各 48 × 48，放右上與左上安全區內。

### 11.5 朗讀

| 對象 | 規格 |
|---|---|
| canvas | `aria-label` 隨場景更新（`t.ui.scene_label.<scene>`，例「穹晶半導體 FAB 7 蝕刻 bay，ET-03 停機中」） |
| 立繪 | `role="img"`、`aria-label` 隨表情（§8.2） |
| 對話 | `#live` 不重複朗讀對話（對話框本身 `aria-live="polite"`，範例值）；內心獨白前綴「你心想」 |
| 數值 | 一次變化合併一句（§9.14） |
| 倒數 | `role="timer"`，只在開始時朗讀（01 §10.6） |
| 狀聲字、特效 | `aria-hidden="true"`（範例值）；但機台 down 的資訊由對話文字或 `#live`「ET-03 停機」提供 |
| 遮字（墨點、`▒`） | 墨點：原字照讀；半夜電話的遮字塊：讀「聽不清楚」（03 §6.3） |

### 11.6 動態與閃爍

- 閃爍 ≤3 次／秒；全畫面紅色變化 ≤1 次／秒（§1.7）。
- 減少動態的來源：`prefers-reduced-motion` 或設定（01 §10.6）；`<html data-reduce-motion>`；CSS 規則見 §9.4；鏡頭見 §7.4；3D 燈號固定亮、天車停止、星芒固定。
- 鏡頭：自由走動時無 roll、無晃動；演出鏡頭最大 roll 0.19 rad、只在對話期間。

### 11.7 中文排版

| 規則 | 做法 |
|---|---|
| 標點 | 全形標點；破折號「——」、刪節號「……」（01 §8.4）；英文術語與數字前後保留半形空白（內容負責，範例「ET-03 又 down 了」）；UI **不啟用** `text-autospace`（避免與內容的空白重複） |
| 避頭尾 | `line-break: strict`（逗號、句號、右括號不在行首；左括號不在行尾）；`word-break: normal` |
| 不斷開 | 「——」「……」與數字＋單位（「44 h」「NT$ 48,200」）：UI 以 `textContent` 拆段後包 `<span class="nobr">`（`white-space: nowrap`），不使用 `innerHTML` |
| 長字串 | lot ID、存檔字串用 `overflow-wrap: anywhere` |
| 換行美化 | 段落 `text-wrap: pretty`；標題、選項卡標題 `text-wrap: balance`；不支援的瀏覽器自然退回 |
| 行首縮排 | 標點擠壓 `text-spacing-trim: trim-start`（漸進增強，`@supports` 包起來） |
| 每行長度 | 對話框桌機每行約 34～40 個全形字（`max-width` 已限制）；安靜模式 ≤32em |
| 數字格式 | 金額 `NT$ 48,200`（`NT$` 後半形空白，範例值）；日期 `2027/06/13（日）`；時間 24 小時制 `22:47`；百分比 `62%`；全部在 `ui/view_models.ts`（01 §10.3） |
| 字體備援 | `display=swap`；備援字堆疊含 Microsoft JhengHei、PingFang TC、Noto Sans CJK TC（範例值）；Google Fonts 載不到時版面不得錯亂（備援字的字寬接近） |

### 11.8 在地化準備

- 所有玩家可見文字都走 `TextId`（01 §2）；SVG 立繪與 pictogram **不含文字**；3D 標牌文字從 `t.ui.sign.*` 取（英文標牌「PHOTO AREA」「ETCH BAY E1」也放在文字表裡，方便外派廠換語言，§4.7）。
- 機台編號（ET-03）、印章英文（RELEASE、HOLD）屬於業界用語，不翻譯（P1）。

---

## 12. 美術資產驗收清單

對齊並擴充 01 §13.6。每個 stage 結束時人工逐條勾選，結果記在 `IMPLEMENTATION_PLAN.md`。

| 類別 | 檢查項目 | 階段 |
|---|---|---|
| **視覺一致性**（01 §13.6） | ☐ 跟 `design/style-c-toon.html` 並排，6 個取樣點通過 §2.4 門檻 ☐ 3 階明暗清楚（頂亮、側中、底暗） ☐ 黑色描邊無裂縫、粗細符合 §2.3 ☐ 紅燈閃爍 1.7 Hz ☐ 黃光區琥珀色與範例一致（取樣點 f） ☐ 漫畫面板、chip、選項卡、對話框跟範例逐項相同 ☐ 所有 CanvasTexture 不褪色（`SRGBColorSpace`） | Stage 1 |
| **色票** | ☐ `palette_sync` 測試綠燈 ☐ 沒有寫死在元件裡的色碼 ☐ 紅、黃只出現在訊號用途 | 每個 stage |
| **場景** | ☐ 三個 3D 場景的物件、hotspot、spot 位置符合 §4 ☐ `scene_hotspots` 測試綠燈 ☐ 預算測試（三角形、網格、貼圖）綠燈 ☐ 入場鏡頭、分區機位（更衣室）正確 ☐ 假鏡子只在 4 m 內更新 ☐ 走道寬、天花板高的刻意放寬沒有讓機台看起來像玩具（真實比例的部件維持） | Stage 3 |
| **光組** | ☐ 8 組基礎光、4 組疊加光逐一切換截圖 ☐ 光源數量在建構後不變（`renderer.info.programs` 不增加） ☐ 手機點光源 ≤2 ☐ `calm` 下所有點光源為 0 | Stage 3、5 |
| **人物** | ☐ 3.1 頭身、1.70 m ☐ 無塵衣版只露眼睛、名牌可讀（6.5 m 外仍能分辨顏色與單字） ☐ 7 種 `CharacterClip` 逐一播放 ☐ 每個角色 ≤2,500 三角形、≤6 draw call ☐ 頭頂名字 sprite 的顯示規則 | Stage 3 |
| **立繪** | ☐ `portrait_assets` 測試綠燈（viewBox、禁止項、表情群組齊全） ☐ 佔位數 0：沒有任何 `data-placeholder="true"`（含主角頭像、結局插圖；v1.2 R1-A） ☐ 8 位角色剪影塗黑後可分辨 ☐ 84px 手機裁切下表情可讀 ☐ 受害者與脆弱表情沒有搞笑符號（P4） ☐ `aria-label` 齊全 | Stage 5 |
| **UI** | ☐ 29 個 MVP 畫面（§9.5）桌機與 390px 手機截圖 ☐ 鎖卡、門檻章、倒數、結果框、風聲、勞權小知識卡 ☐ 文字大小 ×1.3 下不截字 ☐ 760px 以下版面與安全區（01 §13.6） | Stage 2～5 |
| **動態** | ☐ 開啟系統減少動態：沒有抖動、閃爍、鏡頭晃動、推拉、印章落下（01 §13.6） ☐ 閃爍頻率 ≤3 Hz ☐ 走動時鏡頭無 roll | Stage 3、5 |
| **敏感**（GDD §13） | ☐ 停下來序列：無任何漫畫元素、無倒數、無 chip、無「GAME OVER」 ☐ 求助卡：純文字號碼、無 `tel:`、無動畫、四個入口都能開 ☐ E12：安靜樣式、片尾求助卡 ☐ `warning` 時 SFX 字卡與搞笑音效被壓掉 ☐ 頂樓（完整版）圍欄 ≥2.2 m、鏡頭俯角 ≤0° | Stage 5 |
| **無障礙** | ☐ 對比表（§11.1）測試綠燈 ☐ 不碰滑鼠完成一個關鍵日（01 §13.6） ☐ 焦點永遠可見 ☐ 色盲模擬（Chrome DevTools 的 Deuteranopia、Protanopia）下所有狀態可分辨 ☐ 讀屏走一次對話＋選擇＋結果 | Stage 5 |
| **聲音** | ☐ 首次手勢前無聲 ☐ 20 個 SFX 逐一試聽、無爆音 ☐ 四條音量滑桿生效 ☐ `calm` 的淡出序列 ☐ 分頁隱藏時暫停 | Stage 3、5 |
| **效能**（01 §13.6） | ☐ 桌機內顯 `scn.fab_bay` ≥60 fps、draw call ≤70 ☐ 2021 中階手機 ≥30 fps、draw call ≤50 ☐ 場景切換 10 次後記憶體回到基準 ☐ CSS 降飽和濾鏡的實測成本記錄 | Stage 3 |
| **降級**（01 §13.6） | ☐ L2：只有機台與人物描邊、霧關閉、30 fps ☐ L3：4＋3＋3 個機位都能玩完一天 ☐ L4：CSS 背景＋清單能玩完一天、機台狀態有文字 | Stage 3 |
| **Stage 6（glTF）** | ☐ §6.6 全部項目 ☐ 跟程式化版本並排的輪廓疊圖 | Stage 6 |

---

## 13. 與 02／03 的介面點

> **v1.1 狀態**：§13.1 的 G-1～G-17 已由 02 v1.1 附錄 B.2 逐項回覆，全部解決（`SceneSnapshot` 新欄位的算法在 01 §9.2；G-16 自動著裝依 01 D44 合併；G-7 結局調色寫進 02 §10.2）。反方向 02 提出的 B-04-01～15 也在同一張表回應。§13.2 對 03 的 A-1～A-10 不變，03 v0.2 已確認。跨文件總表見 `00-index.md` §5。

### 13.1 需要 02（遊戲系統與內容）配合

| # | 介面點 | 04 提供 | 需要 02 決定或提供 |
|---|---|---|---|
| G-1 | 地點、hotspot、spot | §4.2～§4.4 的 hotspot ID、位置、`spot` 清單 | `content/world.ts` 宣告的 `LocationDef.hotspots`、`MachineDef.hotspot`、`TaskDef.hotspot` 使用這些 ID（或通知 04 改名）；`SceneActor.spot` 只用 §4 的名稱 |
| G-2 | 角色外觀 | §6.4 外觀表（含 CR-06 新欄位）、§1.2 名牌色 | `content/characters.ts` 的 `appearance` 照填 |
| G-3 | 表情 ID | §8.3 每位角色的表情 ID 與預設表情 | `CharacterDef.expressions`、`defaultExpression` 照填；台詞的 `PortraitRef.expression` 只用這些 ID |
| G-4 | 立繪替代文字 | 文字鍵格式 `t.ui.portrait_alt.<slug>.<expression>` | 在 `content/text/ui.ts` 提供 56 句替代文字 |
| G-5 | 演出配方 | §7.3 配方表 | 事件的 `stage` 照配方寫；`content/events/safety.ts` 的節點**不寫 `stage`**（CR-14） |
| G-6 | 「停下來」來電者 | §9.24 的安靜來電畫面 | 決定來電者（阿安／小晴／媽媽，GDD §13.3「好感最高者」）並以 `phone` 節點提供；對應的頭像表情 |
| G-7 | 結局調色 | `EndingDef.palette` 的 6 個鍵（§9.23）；`tone: 'sensitive'` 必須用 `rest` | `content/endings.ts` 照填；`panels` 的台詞長度每格 ≤40 字 |
| G-8 | 快轉文字 | `montage_page` 的選格表 | `t.ui.montage.<policy>.<n>` 的旁白字（每格 ≤12 字） |
| G-9 | 方針與夜間行動的說明 | 轉盤與清單樣式（§9.19、§9.20） | `t.ui.policy.<id>.desc`、`t.ui.life_action.<id>.desc`；若要在夜間行動卡上顯示 chip，請 core 提供已算好的 `StatChip[]`（UI 不自己從效果算） |
| G-10 | 互動動詞 | 互動提示格式「E 查看 ET-03」 | `t.ui.hotspot.<id>`（每個 hotspot 一句動詞＋對象） |
| G-11 | 墨點不可遮的詞 | §9.10：台詞中 `〔〕` 包住的詞不被墨點遮 | 確認台詞可以使用這個標記（01 驗證器需放行，CR-14），UI 顯示時去掉括號 |
| G-12 | 呈現快照新欄位 | CR-01、CR-04、CR-05、CR-15、CR-16 的定義 | `toSceneSnapshot` 的計算規則：`timeOfDay` 時段切點、`yieldIndex` 的來源、`focusActor`＝目前台詞說話者、`playerSpeedScale`（體力 ≤20 → 0.7）、`phoneGlow`（夜間＋工作機來電） |
| G-13 | 結果框表情 | CR-17 | 範例一「貳」的結果節點填 `portrait: { character: 'chr.lin', expression: 'displeased' }` |
| G-14 | 機台狀態門檻 | 燈號、螢幕、光組以 `MachineStatus` 呈現 | `selectors.machineStatus` 的門檻（GDD §4.2：<40 黃、<20 紅） |
| G-15 | 考績與薪資單資料 | §9.16、§9.17 的欄位 | 考績單欄位（KPI、積分、調薪、分紅倍率、引用的 3 筆黑歷史本）、薪資單行項目由 core 產生（01 `Payslip`） |
| G-16 | 自動著裝的開放時機 | 設定頁一律顯示該項 | GDD 說「連續 10 次全對後可以開」；04 建議為了無障礙一開始就能開（§15 #23），02 決定 |
| G-17 | 主角外型 | CR-19 的 `PlayerProfile.look` | 建角流程寫入 |

### 13.2 需要 03（小遊戲）配合（回應 03 §10.2）

| # | 03 的需求 | 04 的決定 | 位置 |
|---|---|---|---|
| A-1 | 外框樣式、壓暗程度 | `.panel` 外框、紅標題籤、壓暗 .45（夜間 .3） | §9.27 |
| A-2 | 印章外觀與動畫 | `.stamp` 系統、−12°±、`stampDown`、減少動態直接顯示 | §9.27 |
| A-3 | SPC 管制圖 | 亮色／深色兩版色表、線寬、形狀、Canvas 字型常數 | §9.27 |
| A-4 | 半夜電話 | 深色手機面板、`phoneGlow` 背景、遮字塊 CSS、晃動與暗角 | §9.27、§4.5 |
| A-5 | lot 卡 | 流程卡樣式、留言欄、徽章、wafer map 形狀編碼 | §9.27 |
| A-6 | 著裝、3D 換裝時機、風淋室 3D 化 | 小遊戲結束時一次換成 `cleanroom`；風淋室**不** 3D 化（DOM 演出）；紙娃娃與圖示 SVG 規格 | §9.27、§4.3 |
| A-7 | 音效 | 新增 `airShower`、`whoosh`、`ding`（CR-03） | §10.3 |
| A-8 | 減少動態、色彩輔助 | 統一規範 4 條 | §9.27 |
| A-9 | 手機版面 | 760px、安全區、底部按鈕列 ≥56px | §9.27 |
| A-10 | 黃光濾鏡 | 3D 用 `photoAmber`；DOM 用 multiply 濾層，文字在濾層之上 | §9.27 |
| — | 03 使用的資產檔 | `gowning_doll.svg`、`gowning_icons.svg` 由 04 規格、美術製作（CR-19）；`spc_view.ts` 的 Canvas 色碼常數必須等於 §9.27 表格，`palette_sync` 測試會檢查 | §9.27 |
| — | 03 不可以做的事 | 新增色碼、新增字型或字重、使用模糊／漸層面板、在危險指令上加任何視覺暗示、在 `calm` 中進入小遊戲 | §1.7、§9.27 |

---

## 14. 對 01 的變更請求

> 本書**沒有修改 01**。以下全部是**新增**（欄位、列舉值、檔案、方法），不刪改既有定義，所以不影響 01 已寫好的範例與測試。依 01 §5.1-5，需要以 PR 修改 `model.ts`。
>
> **v1.1 裁決**（理由見 `00-index.md` §4，已合併進 01 v1.1）：CR-01～08、10～19 全部接受；CR-09 **修改後接受**：四個欄位直接放進 `SettingsData` v1，不升 `schemaVersion`、不寫遷移（尚未發佈，01 D43）。CR-19 的結局插圖檔名依結局 ID 改成 `ending_e10mvp.svg`、`ending_e13mvp.svg`。表下第一條「01 §9.8 鏡頭參數表」的解讀（鏡頭 y ＝ 玩家 ＋ 2.2、看向玩家 ＋ 0.82）已寫進 01 §9.8。

| # | 改什麼 | 為什麼 | 建議定義 |
|---|---|---|---|
| CR-01 | `SceneSnapshot` 加 `timeOfDay` | render 沒有時間資訊，無法選夜班、辦公室加班夜、房間清晨／夜晚的光組（§3.1、§4.5） | `export type TimeOfDay = 'dawn' \| 'day' \| 'dusk' \| 'night';`（05:30～07:00 dawn、07:00～17:30 day、17:30～19:00 dusk、其他 night）；`SceneSnapshot.timeOfDay: TimeOfDay` |
| CR-02 | `ScreenFx` 加 `'warmGlow' \| 'sparkleDots'` | GDD §12.1「被肯定」需要黃色光暈與亮點網點，現有列舉只有負面演出 | 直接併入既有聯集 |
| CR-03 | `SfxId` 加 11 個 | 演出、UI 回饋、安靜來電、03 的風淋與換裝（§10.3、03 A-7） | `'stingPraise' \| 'uiTap' \| 'cardLocked' \| 'countdownTick' \| 'pageTurn' \| 'softRing' \| 'airShower' \| 'whoosh' \| 'ding' \| 'doorSlide' \| 'coinPop'` |
| CR-04 | `SceneSnapshot` 加 `yieldIndex` | 辦公室大螢幕顯示良率指數（GDD §4.2 半可見數值） | `yieldIndex: number \| null`（0～100，一位小數；不在辦公室時可為 null） |
| CR-05 | `SceneSnapshot` 加 `focusActor` | `puaLowAngle`、`closeUp` 需要知道拍誰；render 不讀 `EventView` | `focusActor: CharacterId \| 'player' \| null`（app 填目前台詞的說話者） |
| CR-06 | `CharacterAppearance` 加 3 個欄位 | 便服人物需要髮型與衣服顏色才能分辨（§6.3、§6.4） | `export type HairStyle = 'short' \| 'slick' \| 'spiky' \| 'ponytail' \| 'curly' \| 'perm' \| 'long' \| 'swept' \| 'bob';`；`hairStyle: HairStyle; topColor: string; bottomColor: string;` |
| CR-07 | `BackdropSpec` 擴充 | MVP 的 5 個 2.5D 場景需要更多道具種類；房間的光色隨時間變化（§4.5） | `props.kind` 加 `'window' \| 'calendar' \| 'busWindow' \| 'hrDesk' \| 'tissueBox' \| 'folder' \| 'screen' \| 'clinicBed' \| 'bpMonitor' \| 'curtain'`；`lighting` 型別加 `'softGreen'`，並改成 `lighting: { base: BackdropLighting; byTime?: Partial<Record<TimeOfDay, BackdropLighting>>; phoneGlow?: BackdropLighting }`（`BackdropLighting` 為現有 6 值＋`softGreen`）。`BackdropSpec` 在 render 內，不是 model 型別，改 01 §9.11 文字即可 |
| CR-08 | 新 UI 元件 `ui/components/scene_fallback.ts` | L4（無 3D）需要 CSS 場景背景與 hotspot 清單；L3 也要清單（§4.6、§9.26） | `Component<{ scene: SceneId; machines: SceneSnapshot['machines']; hotspots: readonly { id: HotspotId; label: string; status: string \| null }[] }>`；app 在 `render.mode === 'none'` 或導航為 `hotspot` 時掛上 |
| CR-09 | `SettingsData` 加 4 個欄位 | 文字大小（無障礙）、分軌音量（§10.5、§11.2） | `textScale: 1 \| 1.15 \| 1.3; bgmVolume: number; sfxVolume: number; ambienceVolume: number;`；`schemaVersion` 2，`migrations.ts` 補預設值（1、0.6、0.8、0.7） |
| CR-10 | `CharacterClip` 加 `'armsUp'` | 風淋室舉手（GDD §8.1、FD §5.2） | 併入既有聯集 |
| CR-11 | 01 §9.7 貼圖規則 | 圖集能把 8 張螢幕、8 個標牌、32 個名字各合成 1 個 draw call | 「單張 ≤512²（標牌 ≤1024×256；**圖集 ≤1024×512，每場景 ≤3 張**）」 |
| CR-12 | 新檔案 | 視覺常數集中、色票同步、立繪資產檢查（§2.8、§8.1、§11.1） | `src/render/look.ts`、`src/render/look.spec.ts`、`test/palette_sync.test.ts`、`test/portrait_assets.test.ts`；加入 01 §3 樹狀圖 |
| CR-13 | `ToonKit` 加方法、改 gradient 值 | 人物用剛性權重 `SkinnedMesh`＋頂點色（§6.3）；`[85,165,255]` 在 0.186 會被壓平（§2.2） | `vertexColorMaterial(): MeshToonMaterial`；01 §9.4 骨架的 `new Uint8Array([85, 165, 255])` 改成 `GRADIENT_STEPS`（`[23, 96, 255]`），§9.4 說明文字同步 |
| CR-14 | `content_validator` 加 3 條規則 | GDD §13 的安全網、墨點標記（§7.3、§9.10） | ①`content/events/safety.ts` 的事件（或 `tags` 含 `'safety'`）任何節點有 `stage` → error；②`EndingDef.tone === 'sensitive'` 時 `palette` 必須是 `'rest'`、`showHelpCard` 必須為 true → error；③台詞中的 `〔〕` 必須成對 → error |
| CR-15 | `SceneSnapshot` 加 `playerSpeedScale` | GDD §4.1「體力 ≤20 時走路速度 −30%」，render 不知道體力 | `playerSpeedScale: number`（1 或 0.7） |
| CR-16 | `SceneSnapshot` 加 `phoneGlow` | 凌晨 on-call 時房間只剩手機冷白光（GDD §11、03 A-4） | `phoneGlow: boolean` |
| CR-17 | 結果節點可指定表情 | 範例選「貳」後林課長換成不悅臉（`portrait.classList.toggle('sour', c.sour)`），01 的 `result` 節點沒有立繪欄位 | `EventNode` 的 `result` 加 `portrait?: PortraitRef`；`EventView` 的 `result` 加 `portrait: PortraitRef \| null` |
| CR-18 | `AudioService` 介面方法 | 持續音（風淋）、環境切換、分軌音量、危機壓低（§10） | `playSfx(id: SfxId): void; startLoop(id: SfxId): void; stopLoop(id: SfxId): void; setBgm(mode: BgmMode, mood: PresentationMood): void; setAmbience(kind: AmbienceKind): void; setVolumes(v: { master: number; bgm: number; sfx: number; ambience: number }): void; duckAmbience(db: number): void;`；`AmbienceKind = 'fab' \| 'photo' \| 'gowning' \| 'office' \| 'night_room' \| 'none'` 定義在 `audio_service.ts`（只在 audio 與 app 使用的服務介面型別，01 §2.1 的例外 (1)） |
| CR-19 | 主角外型與新資產 | 主角頭像 2 版（GDD §12.2）、montage 與結局插圖、03 的著裝圖 | `PlayerProfile.look: 'a' \| 'b'`；`src/assets/` 新增 `portrait_player_a.svg`、`portrait_player_b.svg`、`montage_icons.svg`、`ending_e09.svg`、`ending_e10mvp.svg`、`ending_e12.svg`、`ending_e13mvp.svg`、`ending_e17mvp.svg`、`ending_e21.svg`、`gowning_doll.svg`、`gowning_icons.svg`、`ui_icons.svg`（鎖頭、風向旗、風向小頭像 3 種、鍵帽圖示） |

- **01 §9.8 鏡頭參數表**：01 註明「04 可調」，本書 §7.2 的數值即為定案，不列為變更請求；但 `default` 的「高度 2.2 m、俯角 12°」在本書解讀為「鏡頭 y = 玩家 + 2.2、看向玩家 + 0.82」，請 01 確認文字。
- **01 §9.5 預算表**：本書的道具三角形估計都在 01 上限內；人物的 draw call 是 4（含頭罩名牌與名字 sprite），在 01 的 ≤6 內。

---

## 15. 「我的決定」清單

> 以下都是本書自行拍板、使用者沒有明確指定的決定。每一條都可以推翻；推翻時請同步修改對應章節。

**A. 風格**
1. 範例的 5 個主色之外只新增 `--ink-soft`、`--paper-calm`、`--ink-calm` 三個中性色與 `--amber`、`--glove` 兩個範例既有色；**不新增任何訊號色**（§1.2）。
2. 角色在 fab 內的識別採「名牌色＋名牌單字＋頭頂名字」三重編碼；林課長紅、豪哥綠另加圖樣（§1.2）。
3. 範例中 11px 的小字一律提升到 12px（§1.3）。

**B. 渲染**
4. r128 → 0.186 採**標準線性流程（方案 A）**；並排校準 3 輪不合格才改模擬舊流程（方案 B）（§2.4）。
5. gradientMap 改成 `[23, 96, 255]`，讓 0.186 顯示出與範例相同的 33%／65%／100% 三階（§2.2）。
6. 點光源一律 `decay = 1`、`distance` 沿用範例，以參考距離換算強度（§2.4）。
7. 不使用後製；降飽和用 CSS filter（L0／L1）或光色內插（L2），「停下來」用 DOM 紙色遮罩（§2.6）。
8. 光源數量在場景建構時固定，切換光組只改顏色與強度，避免著色器重新編譯（§3.2）。
9. `bayNight` 是刻意的戲劇化：真實 fab 夜裡燈光不變（§3.1）。
10. 高架地板貼圖的重複改成真實的 0.6 m 方格（範例是 0.54 × 1.0 m）（§4.2）。
11. 走道寬 6.8 m、天花板 6 m 維持範例的放大比例（為了鏡頭），機台、load port、FOUP、門、桌椅維持真實比例（§4.1）。
12. 右側佈景機台從範例的 CVD／PVD／CMP 改成 ET-07～10：bay-and-chase 佈局下同一條 bay 通常是同一模組（FD §5.4），ET-07 做成裝機中的包膜機台呼應大D 的 buy-off 線（§4.2）。

**C. 場景與人物**
13. 更衣室天花板只有 3 m，改用「分區固定機位＋自由走動」，不用跟隨鏡頭（§4.3）。
14. 鏡子不做反射，用鏡像的人物實例（§4.3）。
15. 人物改成約 3.1 頭身、1.70 m 的 Q 版比例（範例主角約 5.4 頭身、被放大當前景）；校準模式仍用範例比例（§6.1、§2.4）。
16. 人物以剛性權重的 `SkinnedMesh`＋頂點色合併，每人 2 個主要 draw call，並跟 Stage 6 的 glTF 走同一條路（§6.3）。
17. 立繪永遠畫辦公室穿著，不畫無塵衣版本；fab 內以名牌色塊連結 3D（§8.2）。
18. 03 的著裝：3D 角色在小遊戲結束時一次換成無塵衣；風淋室不 3D 化（§9.27 A-6）。

**D. UI**
19. 手機在對話、選擇、小遊戲時自動收合數值面板成一行（§9.7）。
20. 鎖卡不顯示 chip、只顯示條件（§9.11）。
21. 未讀徽章用墨底黃字，不用紅點；工作機來電的按鈕用黃／紙白，不用紅綠（§9.18）。
22. 「停下來」的 3 個選項不顯示 chip 與編號（§9.24）。
23. 設定頁的「自動著裝」一開始就能開（無障礙考量），與 GDD「10 次全對後解鎖」不同（§13 G-16）。v1.1 定案（01 D44）：一開始就能開，但教學完成後才生效。
24. 「人生 App」離職的第二步按鈕延遲 2 秒才能按，防誤觸（§9.18）。

**E. 聲音**
25. BGM 也程式合成（極簡 4 聲部）；若手機實測掉幀，MVP 改成無 BGM（§10.4）。
26. 不使用 `navigator.vibrate()`（§10.3）。
27. 天車經過的聲音不跟 3D 位置同步（render 不能直接呼叫 audio），隨機 8～20 s 一次（§10.2）。
28. 「停下來」的來電用柔和的 `softRing`，不用 on-call 焦慮的震動聲（§10.3、§9.24）。
29. 環境音取 fab 底噪的音色、不模擬 71～80 dB 的真實音壓（§10.1）。

**F. v1.2 審查回合 1**（lead 裁決見 `00-index.md` §9）
30. 教室背景用 `scn.academy_classroom`（不是裁決舉例的 `bd.` 前綴）：本書 2.5D 場景一律 `scn.`，`SceneId` 型別也要求 `scn.`（§4.5）。
31. 教室只用現有的道具種類（`longTable`、`desk`、`screen`、`projector`、`window`）與 `coldWhite` 光組，不新增 `BackdropPropKind`／`BackdropLighting`（§4.5）。
32. 通用講師圖示是 UI 圖示，不是立繪，所以不受 §8.1 的立繪檢查約束，但同樣不用 `<text>` 與漸層（§8.5）。

---
