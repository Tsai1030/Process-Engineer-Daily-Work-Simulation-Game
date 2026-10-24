# 台灣晶圓廠（Fab）製程工程師：領域知識參考

> 用途：給「以台灣 fab 製程工程師為主角的 3D 養成遊戲（three.js）」做企劃與場景參考。
> 整理日期：2026-10-23。資料來自公開網路（官方招募頁、新聞、學術論文、專利、PTT/Dcard/巴哈心得、廠商文件）。

## 可信度標記

- **[來源]**：有可查證的公開來源（附連結）。
- **[二手]**：來源是論壇心得、求職網站、網友整理或舊資料，可當「氛圍參考」，但數字可能過時或因公司、部門而不同。
- **[未查證]**：沒找到可信來源，是業界常見說法或推論，**只建議當遊戲設定用**，不要當事實寫進教學文案。

> 重要前提：各公司（台積、聯電、力積電、美光、世界先進……）與各廠、各部門的制度差很多。遊戲裡建議用虛構公司名，避免被讀成「某公司內部就是這樣」。

---

## 1. 職位與層級

### 1.1 工程師類職位分工

| 職位 | 常見縮寫 | 白話職責 | 可信度 |
|---|---|---|---|
| 製程工程師 | PE (Process Engineer) | 負責**某一站（模組）**的製程參數與良率，例如黃光、蝕刻、擴散、薄膜；建立與維護製造程式（recipe），監控製程、改善良率、降低耗材成本。大部分時間在開會、處理問題清單和信件，常要短時間產出報告。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer)、[Yourator](https://www.yourator.co/articles/958?locale=en) |
| 設備工程師 | EE (Equipment Engineer) | 顧**機台本身**：故障排除、定期保養（PM）、零件更換、效能優化，讓產線不停機；常和 PE 一起解機台問題。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer)、[Yourator](https://www.yourator.co/articles/958?locale=en) |
| 製程整合工程師 | PIE (Process Integration Engineer) | 管**跨站點的整條製程流程**：用 WAT 電性資料判斷哪裡出問題、評估新製程導入量產；要追每一批貨，所以被叫做「Lot owner」。溝通量大，常要跟客戶報告。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer)、[PTT PIE 心得](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE) |
| 良率（提升）工程師 | YE / YEE | 分析大量製程與測試資料找出影響良率的關鍵；建立缺陷掃描程式、改善物理缺陷（又稱 Defect Team）。工作以 Excel、PPT 報告為主，每天早晚各一次交接會議，常找 PE 溝通。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer)、[Yourator](https://www.yourator.co/articles/958?locale=en) |
| 智慧製造工程師（製造部） | MFG | 新人通常先**輪班帶線**，管產線產出與人員，俗稱「帶線課長」；每天上下午開會、處理產線異常，壓力大。之後可轉常日班做專案。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer) |
| 模組副工程師 | MAE | 偏設備第一線：保養維護（清潔、換耗材、檢查）與值班處理（警報、故障排除）；需輪大夜與假日班。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer) |
| 研發工程師 | RD | 新材料、新架構、更先進節點的開發，成果交給製程團隊量產。 | [二手] [Yourator](https://www.yourator.co/articles/958?locale=en) |

**簡單記法**：PE 顧「一站的配方」、EE 顧「機台」、PIE 顧「整條流程和每批貨」、YE 顧「資料和缺陷」、MFG 顧「產線和人」。

### 1.2 現場（製造部）層級

- **技術員**：無塵室機台操作、產品檢驗（顯微鏡）、報表產出，學歷要求通常是高中職。[來源] [精材徵才資料](https://otc.uch.edu.tw/uploads/asset/data/661ddda48861622c960016db/精材科技股份有限公司.pdf)
- **產線輪班課長**：負責每日產出目標、Cycle time 控管、異常追蹤與改善、管理與培訓技術員。[來源] 台星科徵才資訊（見 [搜尋結果彙整之 cake.me 職缺](https://www.cake.me/companies/509/jobs/595a5f4f-217b-4e67-b2d2-bab8454fc778-manufacturing-production-line-8685ff0f354ac4a9cc0de49b8efcbc)）
- **領班 / 組長**：沒找到公開的正式定義。[未查證] 一般理解是資深技術員帶一個班組，介於技術員與課長之間。
- 遊戲可用的層級（[未查證]，綜合常見說法）：**技術員 → 資深技術員 → 領班/組長 → 輪班課長（多由工程師擔任） → 製造部經理**。

### 1.3 工程師職涯階梯（以台積電職等為例）

網路流傳（2013 年資料，PTT 轉述，**非官方**）的台積電職等與職稱對應：[二手] [PTT Tech_Job 討論（disp.cc 鏡像）](https://disp.cc/ptt/Tech_Job/1MBSH0uo)

| 職等 | 職稱 |
|---|---|
| 31 | 工程師（新人） |
| 32 | 資深工程師 |
| 33 | 主任工程師 |
| 34 | 副理 |
| 35 | 經理 |
| 36 | 部經理 |
| 37–39 | 副處長 → 處長 → 資深處長 |

補充：
- 2026 年報導提到調薪依「考績、年資、職等」決定，並以「33 至 34 職等以上的資深工程師」為例，可見這套職等數字近年仍在使用。[來源] [旺得富/中時 2026](https://wantrich.chinatimes.com/news/20260422900811-420101)
- 台積電有**技術專家**與**管理職**兩條並行路線（工程師 → 資深工程師 → 技術主管或部門經理）。[二手] [Yourator](https://www.yourator.co/articles/958?locale=en)
- 2026 年報導：碩士新進工程師平均整體年薪可達 220 萬元（含分紅，非底薪）。[來源] [聯合新聞網](https://udn.com/news/story/7240/9366095)
- **每一級要幾年升遷：查不到可信來源。** [未查證] 遊戲可自訂，例如每級 2–4 年並受考績影響，但請標示為遊戲設定。

---

## 2. 製程工程師的一天

### 2.1 班別與輪班制度

| 對象 | 班表 | 可信度 |
|---|---|---|
| 台積電技術員 | 每天 12 小時（含 2 小時休息）；日班約 07:20–19:20，夜班接續到隔天早上；約每 5 個月日夜輪調一次。日班月薪約 3.2 萬、夜班約 4.3 萬（官方招募頁所載，以搜尋摘要轉述，頁面本身拒絕直接存取）。 | [來源] [TSMC Careers 職缺頁](https://careers.tsmc.com/en_US/careers/JobDetail/440) |
| 聯電南科固定夜班技術員 | **四班二輪、做二休二**；夜班 19:20–07:20；嘉南地區免費交通車；外縣市新人免費住宿兩個月。 | [來源] [聯電職缺 cake.me](https://www.cake.me/companies/umc/jobs/75090242-9ac7-4aee-917a-16b6c0807178-fixed-night-shift-technician-s-328b7b6090c6f261f021fb32e86081) |
| 「四班二輪」意思 | 4 個班組輪 2 種 12 小時班（日/夜）；做兩天休兩天，每月實際上班約 15 天。 | [二手] [uptogo](https://uptogo.com.tw/職場/求職/技術員/) |
| 製程工程師（PE） | 基本是**常日班**，但每月約一次假日值班，平日加班多。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer) |
| 設備工程師（EE） | 每月約需輪一週大夜，假日也要值班。2023 年報導指出台積電高層表示設備工程師預期一兩年內不用再輪大夜。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer)；[來源] [天下雜誌](https://www.cw.com.tw/article/5119217) |
| 工時爭議 | 2023 年台積電回應：過去兩年每週平均工時未超過 50 小時，設有週工時 60 小時警戒線。 | [來源] [科技新報](https://technews.tw/2023/06/07/tsmc-usa-staff-complain/) |

### 2.2 一天的典型流程（綜合心得與職缺描述）

1. **早上交接**：接夜班狀況，看哪些機台 down、哪些 lot 被 hold、有沒有 inline 異常（high light）。PIE 新人心得：「早上交接所有內容都由我來負責」，原本半小時的交接常拖成一個半小時。[二手] [PTT PIE 心得](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE)
2. **早會**：老闆會在隔天早會追前一天異常的進度和結果；有前輩從早上八點開完早會一路做到隔天早上八點再開早會。[二手] [巴哈姆特 PE 心得](https://forum.gamer.com.tw/Co.php?bsn=60561&sn=135257)
3. **看 SPC 管制圖**：監控 SPC 趨勢掌握產線健康，發現失控（OOC）時依 OCAP 處理，做 lot disposition（批貨處置）。[來源] [Skyworks 職缺](https://careers.skyworksinc.com/job/Process-Technician-5/76844-en_US)、[UMC 製程工程師職缺](https://careers.umc.com/jobin.php?mid=298)
4. **處理異常（excursion）**——PE 心得歸納的四步：[二手] [巴哈姆特 PE 心得](https://forum.gamer.com.tw/Co.php?bsn=60561&sn=135257)
   - **先止血**：查同批、同機台的貨，停止相關生產，避免擴大。
   - **分析原因**：依 4M（人、機、料、法）逐一排除，做再現性測試、顯微鏡觀察。
   - **材料處置**：評估能否補救（rework）、延後出貨、會不會 low yield。
   - **防止再發**：擴大檢查其他機台，檢討保養手冊、檢查頻率、人員訓練。
   - PE **有權要求停機/停產**，但判斷錯了責任很重。
5. **Hold lot**：製造部送來被 hold 的貨，要追問原因、跟學長確認處理方式、向老闆報備。[二手] [PTT PIE 心得](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE)
6. **跨部門扯皮**：「製程會說是設備問題叫設備去查機台，設備會說設備沒問題叫製程去查流程」。設備端 PM 的變動也可能影響製程結果。[二手] [Dcard「產線三寶」](https://www.dcard.tw/f/job/p/235976089)、[PTT PIE 心得](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE)
7. **寫報告 / 開會**：用 Excel、PPT 跑 correlation（例如 WAT 對 inline 參數），向客戶報告 process change 與改善方案；還有客戶會議報告、定期成效報告、週報。[二手] 同上兩篇
8. **其他專案**：新製程測試、製程改善、FMEA、新機台 buy-off、客戶 DOE（實驗設計）。[二手] [巴哈姆特 PE 心得](https://forum.gamer.com.tw/Co.php?bsn=60561&sn=135257)
9. **下班與 on-call**：平日常做到晚上九點半、十點；假日仍要接電話，最晚到半夜十二點。[二手] [PTT PIE 心得](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE)

### 2.3 8D 報告

- 8D 是團隊式的問題解決方法，常用於**客訴或重複發生的缺陷**，源自汽車供應鏈品質管理。[來源] [ASQ](https://asq.org/quality-resources/eight-disciplines-8d)
- 步驟：D0 緊急應變（有些版本才有）→ D1 組隊 → D2 描述問題（5W2H、量化）→ D3 圍堵（containment）→ D4 找真因（5 Whys、魚骨圖；要分「發生原因」和「流出原因」）→ D5 選定矯正措施 → D6 執行並驗證 → D7 預防再發（改管制計畫、作業指導書、訓練）→ D8 結案、表揚團隊。[來源] [ASQ](https://asq.org/quality-resources/eight-disciplines-8d)、[SafetyCulture](https://safetyculture.com/checklists/8d-report/)
- 汽車業常見期限：24 小時內圍堵、30 天內完成真因到驗證（非通用標準）。[來源] [Fabrico](https://www.fabrico.io/blog/8d-problem-solving/)

---

## 3. 新人訓練流程

| 階段 | 內容 | 可信度 |
|---|---|---|
| 報到 | 教育訓練從報到第一天開始；有導師（mentor）與 e-learning 制度縮短磨合期。 | [來源] [遠見雜誌](https://www.gvm.com.tw/article/8196) |
| 集中新訓（台積電） | 新訓中心設於**中科晶圓 15A 廠**，2021 年 6 月啟用；分**設備、製程、系統、值班技能**四大學程；有 20 部實際產線機台、12 部量測及附屬機台供教學，設備元件全拆解讓學員動手；講師平均年資 15 年以上。成效：新人獨立作業時間縮短 10%，累計培育超過萬人。 | [來源] [科技新報 2023](https://technews.tw/2023/08/31/tsmc-rookies-training-center/) |
| 開班節奏 | 每 2 週開一班，4–8 週實務操作；值班技能課程著重異常處理與應變。 | [來源] [自由時報](https://ec.ltn.com.tw/article/breakingnews/3878779) |
| 無塵室規範 | 進入前脫外鞋、換無塵衣與無塵鞋；不可穿厚外套或毛衣進換衣區；頭髮全收進頭罩。 | [來源] [中研院無塵室守則](https://www.phys.sinica.edu.tw/~qmsf/download/CleanroomRules.pdf) |
| OJT | 在產線上由教練帶標準程序、作業手法與安全；目標是新人約前 12 週內達到能貢獻的程度（Applied Materials 例子）。 | [來源] [Applied Materials 職缺](https://jobs.appliedmaterials.com/job/singapore/on-job-training-ojt-champion-7am-4-30pm/95/91539654240) |
| 學長帶人 | 心得常見「照著學長的做」，但也提到很多作業流程沒有正式定義、靠前輩口耳相傳，容易產生偏差；新訓中心成立的原因之一就是「不見得每位新人都能受到師父紮實訓練」。 | [二手] [PTT PIE 心得](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE)、[巴哈姆特](https://forum.gamer.com.tw/Co.php?bsn=60561&sn=135257)；[來源] [自由時報](https://ec.ltn.com.tw/article/breakingnews/3878779) |
| 考核 / 認證 | 沒找到公開的「機台操作認證」細節。[未查證] 業界普遍有「上機證照」概念：考過某機台/某站的操作，才能獨立作業或值班。 | [未查證] |

---

## 4. 主要製程模組

整體流程像蓋房子一層層疊：微影定義圖案 → 蝕刻刻出圖案 → 擴散/植入控制電性 → 薄膜堆疊下一層，重複幾十次。[來源] [陽明交大 半導體製程簡介](https://12u10.lab.nycu.edu.tw/wp-content/uploads/Unit003%E5%8D%8A%E5%B0%8E%E9%AB%94%E8%A3%BD%E7%A8%8B.pdf)

| 模組 | 一句話白話說明 | 工程師常遇到的問題 | 來源 |
|---|---|---|---|
| **黃光（微影，Photo/Litho）** | 塗光阻、烘烤、對準光罩、曝光、顯影，把電路圖「印」到晶圓上。 | **CD（線寬）**跑掉、**overlay（上下層對準）**偏移、**focus（焦距）/dose（劑量）**漂移；focus 錯誤會讓靠 dose 調整的 APC 失準。常用 FEM（focus-exposure matrix）找最佳條件。 | [陽明交大](https://jupiter.math.nycu.edu.tw/~weng/courses/IC_2007/PROJECT_MATH_CLASS3/%25E5%258D%258A%25E5%25B0%258E%25E9%25AB%2594%25E8%25A3%25BD%25E7%25A8%258B%25E7%25B0%25A1%25E4%25BB%258B.pdf)；[SPIE 論文](https://medicalimaging.spiedigitallibrary.org/conference-proceedings-of-spie/7140/71400Q/Focus-and-dose-control-for-high-volume-manufacturing/10.1117/12.805314.full)；[專利 US7678516](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7678516) |
| **蝕刻（Etch）** | 把沒被光阻保護的材料去掉；主流是乾式（電漿）蝕刻，也有用化學液的濕式蝕刻。 | **etch rate 漂移**、均勻度、選擇比；chamber 濕式清潔（PM）後內壁狀態改變，要先跑 **seasoning** 讓腔體回到穩態；腔壁沉積物和塗層剝落造成 **particle**。 | [陽明交大](https://12u10.lab.nycu.edu.tw/wp-content/uploads/Unit003%E5%8D%8A%E5%B0%8E%E9%AB%94%E8%A3%BD%E7%A8%8B.pdf)；[專利 US10354837](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10354837)；[AVS 2000](https://www2.avs.org/symposium2000/Papers/Paper_PS2-MoA4.html) |
| **薄膜（Thin Film：CVD / PVD）** | 在晶圓上「長」一層材料。CVD 靠氣體在表面化學反應成膜；PVD（濺鍍）是把靶材原子打下來鍍上去。 | **膜厚均勻度**（片內、批間）、靶材壽命內的膜性穩定（厚度、缺陷、應力、電阻）、換靶後要重新驗證、多腔體互相干擾。 | [Harvard 講義](https://www.mrsec.harvard.edu/education/ap298r2004/Erli%20chenFabrication%20II%20-%20Deposition-1.pdf)；[專利 US9752228](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9752228) |
| **擴散（Diffusion / 爐管）** | 把整批晶圓放進高溫立式爐管做氧化、擴散、退火（anneal）。 | **溫度均勻度**（片內、上中下位置）；高溫下熱應力造成 **slip（滑移缺陷）**，晶舟頂部和底部最嚴重；進出爐要控溫避免熱衝擊（推入溫度約 650–800°C）。 | [專利 US5279670](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/5279670)；[專利 US8003918](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8003918)；[Semiconductor Digest](https://sst.semiconductor-digest.com/issue/?id=19125) |
| **CMP（化學機械研磨）** | 用研磨液（slurry）加研磨墊，把晶圓表面磨平，讓下一層好疊。 | **dishing（金屬線中間凹下去）**、**erosion（線路密集區被磨過頭）**→ 電阻變大、短路；影響因素：下壓力、轉速、研磨液流量、研磨墊、圖案密度。另有刮傷（scratch）。 | [專利 US6919276](https://patents.google.com/patent/US6919276)；[Semiconductor Digest](https://www.semiconductor-digest.com/?p=5152) |
| **離子植入（Implant）** | 把摻雜離子加速打進矽裡，改變特定區域的導電性。 | **劑量均勻度**（晶圓帶電讓離子束偏折）、**channeling（離子沿晶格鑽太深）**→ 調 tilt/twist 角度、**shadowing（光阻擋住斜打的束）**、交叉污染。 | [Semitracks 2012](https://www.semitracks.com/newsletters/april/2012-april-newsletter.pdf)；[專利 US7544957](https://patents.google.com/patent/US7544957) |
| **濕式清洗（Wet Clean）** | 用化學液把晶圓洗乾淨。經典 RCA 清洗：HF 去薄氧化層 → SC1（氨水+雙氧水）去微粒與有機物 → SC2（鹽酸+雙氧水）去金屬，中間用純水沖洗。 | 微粒、金屬不純物、有機物、表面粗糙度、自然氧化層五大污染源；batch 清洗一輪約 64–70 分鐘、乾燥常是瓶頸；單片清洗產能較難追上。 | [專利 US7449127](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7449127)；[MIT SOP](https://mtlsites.mit.edu/fabrication/sops/rca_icl.pdf)；[陽明交大](https://12u10.lab.nycu.edu.tw/wp-content/uploads/Unit003%E5%8D%8A%E5%B0%8E%E9%AB%94%E8%A3%BD%E7%A8%8B.pdf) |
| **量測（Metrology / 檢測）** | 每站做完抽量：CD-SEM 量線寬、光學機台量 overlay、膜厚、缺陷掃描。資料進 SPC。 | 量測本身有雜訊（CD-SEM noise）；overlay 通常每批或幾乎每批量，蝕刻後 CD 抽量頻率較低；抽樣太少會漏掉異常、太多會拖產能。 | [SPIE 論文](https://medicalimaging.spiedigitallibrary.org/conference-proceedings-of-spie/7140/71400Q/Focus-and-dose-control-for-high-volume-manufacturing/10.1117/12.805314.full)；[SPIE Kim et al.](https://ebooks.spiedigitallibrary.org/profile/Nakyoon.Kim-4079893) |

**WAT / CP / FT（製程後的電性測試）**：
- **WAT**：在 foundry 內，量晶圓切割道（scribe line）上的測試結構，不是量真正的晶片；通過才出貨。PIE 靠它判斷製程異常。[來源] [專利 US8219341](https://patents.google.com/patent/US8219341)、[yieldWerx](https://yieldwerx.com/?p=1123)
- **CP（Circuit Probe / Wafer Sort）**：封裝前用探針卡測每顆晶片。
- **FT（Final Test）**：封裝後的最終測試。
- 生產階段順序：晶圓製造 → CP → 封裝（AP）→ FT → 成品倉。[來源] [專利 US7197369](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7197369)

---

## 5. Fab 實體環境（給 3D 場景用）

### 5.1 無塵室等級

ISO 14644-1 以「每立方公尺中 ≥0.1 µm 微粒數」分級，等級數字 = 允許數量的 10 的次方。[來源] [Berkshire](https://berkshire.com/iso-14644-1-cleanroom-standards/)、[Shield Scientific](https://www.shieldscientific.com/glove-education/cleanroom-classifications/)

| ISO 等級 | ≥0.1 µm 上限（顆/m³） | 舊美規 FED-STD-209E 約等於 |
|---|---|---|
| ISO 3 | 1,000 | Class 1 |
| ISO 4 | 10,000 | Class 10 |
| ISO 5 | 100,000 | Class 100 |
| ISO 6 | 1,000,000 | Class 1,000 |

- 舊說法「Class 100」= 每立方英尺 ≥0.5 µm 微粒不超過 100 顆。業界口語仍常講「Class 1、Class 10」。
- 晶圓裸露的區域（white area）最乾淨，機台背後的維修區（gray area / chase）較髒；300mm 廠晶圓多半關在 FOUP 和機台前端的小環境裡移動。[來源] [專利 US6698991](https://patents.google.com/patent/US6698991)
- 參考：亞利桑那大學奈米無塵室，製程區 Class 10/100、維修 chase 為 Class 10,000。[來源] [SMRT](https://www.smrtinc.com/projects/university-of-arizona-ece-nano-fab-cleanroom/)

### 5.2 進廠流程與無塵衣（兔寶寶裝）

順序（綜合來源，各廠略有不同）：
1. **安檢**：金屬探測門；除了身上衣物鞋襪，其他物品都不能帶入無塵室。[來源] [遠見 2013 南科 14 廠參訪](https://www.gvm.com.tw/article/24918)
2. **手機管制**：台積電等半導體廠管制廠區禁用相機手機多年；進出有嚴格安檢。[來源] [中央社 2019](https://www.cna.com.tw/news/afe/201901140294.aspx)、[聯合新聞網 2024](https://udn.com/news/story/7321/8919064)
3. **脫外鞋 → 換衣區**：不可穿厚外套、毛衣。[來源] [中研院守則](https://www.phys.sinica.edu.tw/~qmsf/download/CleanroomRules.pdf)
4. **自動洗手**：手伸進感應洞自動清洗烘乾。[來源] [遠見](https://www.gvm.com.tw/article/24918)
5. **著裝**（由上而下、由內而外）。中研院規定：**口罩 → 髮罩 → 無塵帽（頭罩） → 無塵鞋 → 無塵衣**；脫的順序反過來。另有業界說法是鞋套 → 頭罩 → 連身衣 → 手套。最後只剩眼睛露在外面，「像要上外太空的太空人」。[來源] [中研院守則](https://www.phys.sinica.edu.tw/~qmsf/download/CleanroomRules.pdf)、[遠見](https://www.gvm.com.tw/article/24918)
6. **風淋室（Air Shower）**：進去後兩側門互鎖，噴嘴吹高速過濾空氣，人要**舉手、原地轉圈**，指示燈亮了才能開另一側門。時間依廠設定，廠商預設約 12 秒；有研究建議至少 20 秒；維基寫 30–45 秒。[來源] [Clean Air Products](https://www.cleanairproducts.com/technical-papers/how-to-spec-an-air-shower)、[Esco](https://escopharma.com/pdf/brochures/cleanroom-air-showers-brochure)、[Semiconductor Digest](https://sst.semiconductor-digest.com/?p=40860)、[Wikipedia](https://en.wikipedia.org/wiki/Air_shower_(room))
7. 更衣時要專心，少講話、少多餘動作（人是最大污染源）。[來源] [Cleanroom Technology](https://cleanroomtechnology.com/how-to-correctly-don-cleanroom-garments-best-practices)

### 5.3 黃光區為什麼是黃色

- 光阻對短波長（藍光、紫外光）敏感，所以黃光區要擋掉 **500 nm 以下**的光，只留黃/橘光，避免光阻提前曝光。[來源] [台大碩論 2015](https://tdr.lib.ntu.edu.tw/handle/123456789/55008)
- 實測黃光區平均照度約 **292 lux、色溫約 2223 K**（很暖、偏暗）。[來源] 同上
- 副作用：人在黃光下**難辨顏色**（色彩測驗錯誤分數 91.5 對白光區 26.8）、視覺疲勞高；研究建議提高照度、定期輪調。緊急設施建議用符號而不只用顏色標示。[來源] 同上；[交大 1998](https://ir.lib.nycu.edu.tw/handle/11536/63829)
- 台積電亞利桑那 Fab 21 影片中，通往無塵室的通道也以黃色照明為主。[來源] [自由時報 2025](https://ec.ltn.com.tw/article/breakingnews/5217439)
- 場景建議 [未查證]：微影區用飽和琥珀黃；其他製程區較常見白光；兩區交界可做出明顯色溫變化。

### 5.4 建築分層（由上到下）

[來源] [Wikipedia: Semiconductor fabrication plant](https://en.wikipedia.org/wiki/Semiconductor_fabrication_plant)
1. **屋頂**：空調箱，吸外氣、淨化、降溫。
2. **送風夾層（plenum）**：把空氣送到天花板的 **FFU（風扇過濾單元）**，FFU 本身就是無塵室天花板，一格一格排滿。
3. **無塵室**（可能多層）：空氣由上往下吹。
4. **高架地板 + 回風夾層**：地板是有孔的格板，空氣往下回流；地板下走管線，也會累積碎屑，要定期吸塵。[來源] [MIT labnetwork](https://mtl.mit.edu/pipermail/labnetwork/2021-December/005121.html)
5. **Sub-fab（下層支援樓）**：真空泵浦、化學品供應、廢氣處理、純水、氣體管線、電控、冷凍設備。
6. **一樓**：電力設備。
- **防震**：深樁打到岩盤、減震器，有些廠用彈簧把無塵室和建築脫開。[來源] 同上 Wikipedia
- **兩種佈局**：
  - **Bay-and-chase**：一條條製程走道（bay），機台只有正面（load port）露在乾淨區，背面在維修走廊（chase/灰區）。
  - **Ballroom**：大通間，支援設備移到樓下。[來源] [專利 US6698991](https://patents.google.com/patent/US6698991)、[MIT labnetwork](https://mtl.mit.edu/pipermail/labnetwork/2020-September/004369.html)

### 5.5 機台、FOUP、天車

- **FOUP（Front-Opening Unified Pod）**：塑膠晶圓盒，從正面開；300mm 一盒 **25 片**，滿載約 **7–9 kg**；顏色可由客戶指定；有些貼 RFID；可以充氣吹淨（purge）。[來源] [Wikipedia FOUP](https://en.wikipedia.org/wiki/FOUP)、[Semitracks 2024](https://www.semitracks.com/newsletters/march/2024-march-newsletter.pdf)
- **OHT / AMHS（天車）**：天花板下的環形軌道，吊掛小車用夾爪與升降機構把 FOUP 從機台 load port 抓起或放下；bay 端頭有 **stocker（自動倉儲）**；也有放在機台前的 buffer 或軌道下暫存。[來源] [Semiconductor Digest](https://sst.semiconductor-digest.com/?p=42076)、[INFORMS 2005](https://www.informs-sim.org/wsc05papers/309.pdf)
- 台積電 14 廠（2013）：頭頂三、四層軌道；最忙的交會口**每小時 1,200 台**小車經過；軌道總長約 **43 公里**；每天運送 60 萬次；每台小車造價約一台進口車。[來源] [遠見](https://www.gvm.com.tw/article/24918)
- 亞利桑那 Fab 21 影片把天車稱為「**銀色高速公路**（silver highway）」，可見數百個 FOUP 在軌道上移動。[來源] [自由時報](https://ec.ltn.com.tw/article/breakingnews/5217439)
- **機台**：一座典型 fab 有數百台設備；300mm 單台設備多在 400 萬美元以上。[來源] [Wikipedia](https://en.wikipedia.org/wiki/Semiconductor_fabrication_plant)
- **EUV 曝光機**（ASML）：約一台校車大小、約 150–180 噸；出貨約 40 個貨櫃、要用多架 747 貨機。[來源] [Reuters via Yahoo](https://finance.yahoo.com/news/explainer-250-million-asml-printer-050227041.html)
- **機台頂端燈號（燈塔）**：工業慣例（IEC 60073）綠＝正常、黃＝異常/注意、紅＝故障/緊急、藍＝需要人處理；fab 實際定義依廠或廠商規範。[來源] [DigiKey](https://www.digikey.com/en/articles/install-easy-to-see-industrial-tower-lighting-to-alert-nearby-operators)、[Balluff](https://www.balluff.com/en-us/blog/understanding-the-significance-and-color-codes-of-stack-lights)
- **人很少**：多數產線員工透過電腦遠端監控機台；報導提到未來一人可管理 75 台機器，部分人員可在辦公室遠端操控，不必穿無塵衣。[來源] [遠見](https://www.gvm.com.tw/article/24918)；另有媒體標題「一個人顧 60 台機器」。[來源] [數位時代 Podcast](https://www.bnext.com.tw/podcast/220/bn-sound-20221018103258-i4ie7iyp)

### 5.6 聲音、顏色、氛圍

- **聲音**：主要是大量 FFU 持續的低頻風聲。一間大學潔淨室實測 FFU 高速 80 dB、中速 74 dB、低速 71 dB；也有廠商說低噪 FFU 只像輕聲說話。加上沒有電話鈴聲、人少講話，整體是「持續的嗡嗡聲 + 安靜」。[來源] [UCR 實驗室紀錄](https://richardsonlab.ucr.edu/ligo-ex/53)、[Schilling Engineering](https://schillingengineering.de/en/cleanroom-knowledge/how-loud-is-it-in-a-cleanroom/)
- **溫濕度**：維持很窄的範圍，主要是為了減少靜電。[來源] [Wikipedia](https://en.wikipedia.org/wiki/Semiconductor_fabrication_plant)
- **顏色與材質**（[未查證]，常見照片印象）：白或淺灰的牆板、有孔的金屬高架地板、不鏽鋼、米白/灰色機台外殼搭配觸控螢幕、頭頂一格格 FFU 面板與銀色天車軌道；人穿白色連身無塵衣，只露眼睛。
- **氛圍**：24 小時不停的產線、遠處燈號閃爍、天車小車頭頂滑過的聲音、黃光區色溫低又暗、看不清顏色的疲勞感。

### 5.7 無塵室外：辦公區、餐廳、宿舍、交通

- **辦公區**：工程師大部分時間在辦公室開會、看資料、寫報告（見第 2 節）。台積電 14 廠辦公區有四層樓高的植生牆與天窗。[來源] [遠見](https://www.gvm.com.tw/article/24918)
- **餐廳**：網友整理稱美食街午晚餐有公司補助，早餐與宵夜補助多給輪班人員。[二手] [NOWnews](https://www.nownews.com/news/5249077)
- **宿舍**：網友整理稱第 1 個月免費、最多住 3 個月（未必是現行規定）；聯電南科技術員職缺寫外縣市新人免費住宿兩個月。[二手] [NOWnews](https://www.nownews.com/news/5249077)；[來源] [聯電職缺](https://www.cake.me/companies/umc/jobs/75090242-9ac7-4aee-917a-16b6c0807178-fixed-night-shift-technician-s-328b7b6090c6f261f021fb32e86081)
- **交通車**：聯電南科技術員職缺有嘉南地區免費交通車；也有竹科技術員職缺標題寫「免費交通車＋租屋補助」。台積電交通車細節查無可信來源。竹科尖峰塞車嚴重，台積電曾試行彈性上下班分流。[來源] [聯電職缺](https://www.cake.me/companies/umc/jobs/75090242-9ac7-4aee-917a-16b6c0807178-fixed-night-shift-technician-s-328b7b6090c6f261f021fb32e86081)、[公視](https://news.pts.org.tw/article/620335)
- **運動設施**：台積電全台 19 座廠區健身房、兩座大型運動館、16 面球場，每年辦運動會。[來源] [104 職場力](https://blog.104.com.tw/hsinchu-tech-fitness/)

---

## 6. 常用術語與行話小辭典

| 術語 | 白話解釋 | 可信度 |
|---|---|---|
| **Wafer（晶圓）** | 一片圓形矽片，主流 300mm（12 吋）。 | [來源] [Wikipedia](https://en.wikipedia.org/wiki/Semiconductor_fabrication_plant) |
| **Lot（批）** | 一起跑製程的一組晶圓，通常一盒 FOUP（最多 25 片）。 | [來源] [專利 US7197369](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7197369) |
| **FOUP** | 裝 lot 的晶圓盒。 | [來源] [Wikipedia](https://en.wikipedia.org/wiki/FOUP) |
| **Recipe（配方 / 製造程式）** | 機台跑某道製程的參數組合（溫度、時間、氣體流量、功率……）；PE 負責建立與維護。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer) |
| **Run card / Route（流程卡）** | 一批貨要依序經過的站點與條件。查無明確定義來源。 | [未查證] |
| **WIP（在製品）** | 還在線上流動、沒做完的貨。 | [來源] [交大論文](https://ir.lib.nycu.edu.tw/handle/11536/39817) |
| **Cycle time** | 一批貨從投片到出貨花的時間；輪班課長要控管。 | [來源] 台星科課長職缺（見 1.2） |
| **PM（Preventive Maintenance）** | 機台定期保養；PM 後機台狀態會變（例如蝕刻腔要 seasoning）。 | [二手] [PTT](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE)；[專利](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10354837) |
| **Down（機台 down）** | 機台停機、不能跑貨（故障或保養中）。 | [未查證] 口語 |
| **Release** | 機台修好、驗證過後「放行」給產線；或 hold 的貨確認沒問題後放行。 | [未查證] 口語 |
| **Hold（hold lot / hold 機台）** | 把貨或機台扣住不准繼續跑，等工程師判斷。 | [二手] [PTT](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE) |
| **Disposition（處置）** | 對異常批貨做決定：放行、重工（rework）、報廢（scrap）、分批（split）等。 | [來源] [UMC 職缺](https://careers.umc.com/jobin.php?mid=298) |
| **SPC** | 統計製程管制：把量測值畫在管制圖上，用規則判斷有沒有失控。 | [來源] [Wikipedia: Western Electric rules](https://en.wikipedia.org/wiki/Western_Electric_rules) |
| **OOC（Out of Control）** | 超出管制界限（通常 ±3σ）或違反趨勢規則，代表製程「怪怪的」，但不一定已經壞。 | [來源] [專利 CN103885423A](https://patents.google.com/patent/CN103885423A/en) |
| **OOS（Out of Spec）** | 超出規格界限，產品可能已經不合格，比 OOC 嚴重。 | [來源] 同上 |
| **WECO rules** | Western Electric 判斷規則，例如一點超出 3σ、連續多點在中心線同一側等。 | [來源] [Wikipedia](https://en.wikipedia.org/wiki/Western_Electric_rules) |
| **OCAP** | Out-of-Control Action Plan：SPC 失控時的標準處置步驟（誰做什麼、要不要 hold）。 | [來源] [camLine](https://camline.com/digital-transformation-on-the-ocap-process-semiconductor-backend) |
| **Excursion** | 製程突然偏離正常（一次異常事件），要找出受影響的機台和批貨。 | [來源] [HAL 論文](https://hal-emse.ccsd.cnrs.fr/emse-00642270v1/document) |
| **High light** | 心得中的口語：被點出來要處理的 inline 異常。 | [二手] [PTT](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE) |
| **Inline** | 製程進行中（還在線上）的量測或檢查。 | [二手] 同上 |
| **控片 / 擋片（Monitor / Dummy wafer）** | 控片用來監控機台狀況，擋片放在機台裡陪跑、穩定製程；用過可回收重用。 | [來源] [交大論文](https://ir.lib.nycu.edu.tw/handle/11536/68667)、[專利 US7375005](https://patents.google.com/patent/US7375005) |
| **Seasoning** | PM 或清腔後先跑一些假片，讓腔體回到穩定狀態。 | [來源] [專利](https://patents.justia.com/patent/20100178415) |
| **CD** | Critical Dimension，關鍵線寬。 | [來源] [專利 US7678516](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7678516) |
| **Overlay** | 上下兩層圖案的對準誤差。 | 同上 |
| **WAT** | 晶圓出廠前量切割道測試結構的電性。 | [來源] [yieldWerx](https://yieldwerx.com/?p=1123) |
| **CP** | 封裝前探針測每顆晶片（Wafer Sort）。 | [來源] 同上 |
| **FT** | 封裝後最終測試。 | [來源] [專利 US10777470](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10777470) |
| **良率（Yield）** | 好晶片佔比。通常分線上良率（晶圓沒被報廢）和晶片良率（CP 測試通過）。 | [未查證] 常見分法 |
| **APC** | 先進製程控制：用前面的量測結果自動微調下一批的參數（例如 WAT APC）。 | [來源] [專利 US8219341](https://patents.google.com/patent/US8219341) |
| **FMEA** | 失效模式與影響分析：事先列出可能出錯的地方與風險。 | [二手] [巴哈姆特](https://forum.gamer.com.tw/Co.php?bsn=60561&sn=135257) |
| **DOE** | 實驗設計：系統性改參數找最佳條件。 | 同上 |
| **Buy-off** | 新機台驗收，確認能達到規格才上線。 | 同上 |
| **4M** | 人、機、料、法；找異常原因的分類方式。 | 同上 |
| **8D** | 結構化問題解決報告（見 2.3）。 | [來源] [ASQ](https://asq.org/quality-resources/eight-disciplines-8d) |
| **ECN（Engineering Change Notice）** | 工程變更通知：改 recipe、流程、材料要走正式變更流程；影響客戶時還要通知客戶（PCN）。沒找到半導體專用定義。 | [未查證] |
| **Module** | 製程模組 / 站別（黃光、蝕刻……），PIE 口中的「module」常指負責該站的 PE 團隊。 | [二手] [PTT](https://www.pttweb.cc/bbs/Tech_Job/M.1572928070.A.4AE) |
| **Lot owner** | 負責追某批貨的人，常指 PIE。 | [二手] [salary.tw](https://salary.tw/insights/article/TSMC_engineer) |
| **帶線** | 輪班管產線（MFG 新人俗稱「帶線課長」）。 | [二手] 同上 |
| **GG** | 網路上對台積電的暱稱（「護國神山」也常見）。 | [二手] [PTT](https://www.ptt.cc/bbs/Tech_Job/M.1629875381.A.08B.html) |

---

## 7. 可做成遊戲機制的工作內容

| # | 機制 | 現實依據 | 玩法構想 |
|---|---|---|---|
| 1 | **看 SPC 抓異常** | SPC + WECO 規則、OOC vs OOS | 管制圖即時跳點，玩家要在 OOS 之前認出 OOC 樣式（一點破 3σ、連 7 點同側、趨勢）。抓太晚 → 良率掉；誤判 → 白白 hold 貨拖慢產出。 |
| 2 | **Hold lot 處置** | Lot disposition | 卡片式決策：放行 / 重工 / 報廢 / 送實驗室 / 分批。每個選項有成本、風險、時間，結果在 WAT/CP 時才揭曉（延遲回饋）。 |
| 3 | **Excursion 偵探** | 止血 → 4M → 處置 → 防止再發 | 調查小遊戲：查同機台、同批、同時段，排除人機料法，找出真因（例如 PM 後沒 seasoning）。止血越快損失越小。 |
| 4 | **調 recipe 參數** | 微影 focus/dose、CMP 下壓力/轉速、蝕刻時間 | 滑桿調參數看模擬結果（CD、均勻度、dishing）；用有限的控片數跑 FEM / DOE，參數之間有耦合，不能只調一個。 |
| 5 | **排機台 PM** | PM、down、release、seasoning | 時間軸排程：PM 不做 → 故障率上升、particle 增加；做了 → 機台停機、WIP 堆積。PM 回來要跑 monitor 才能 release。 |
| 6 | **跟 EE 扯皮 / 跨部門對話** | 「製程叫設備查，設備叫製程查」 | 對話系統：拿證據（SPC 圖、機台 log）說服 EE 停機台；信任度與人際數值影響之後的配合速度。 |
| 7 | **早會與交接** | 早上交接、隔天早會報進度 | 每天開頭的「記憶 + 簡報」小遊戲：從交接訊息挑出最重要的 3 件事；早會被老闆追問，答錯扣考績。 |
| 8 | **寫 8D 報告** | 8D 步驟 | 拼圖式組報告：把找到的證據放進 D2–D7 欄位；D4 真因放錯（只找到表面原因）會被客戶退件。 |
| 9 | **進無塵室著裝** | 著裝順序、風淋 | 第一次進廠的教學關卡：依正確順序穿戴、在風淋室舉手轉圈；順序錯誤會增加微粒數。可做成每天的短儀式（可略過）。 |
| 10 | **天車 / WIP 物流** | OHT、stocker、cycle time | 俯視圖看 FOUP 在軌道上流動、哪站塞車；作為儀表板背景或輪班課長路線的玩法。 |
| 11 | **輪班與疲勞值** | 12 小時班、日夜輪調、on-call、黃光視覺疲勞 | 體力/精神數值：夜班與假日 on-call 會降低判斷精準度；黃光區待久了顏色辨識變差（UI 變色）。 |
| 12 | **職涯升等** | 31 工程師 → 36 部經理；技術/管理雙軌 | 考績（每季/年）累積升等；選技術線（解更難的機台、新製程）或管理線（帶人、多開會）。年資數字屬遊戲設定。 |
| 13 | **新人訓練與上機認證** | 新訓中心、OJT、學長帶 | 前期關卡：學長 NPC 帶 OJT，考過某站的上機認證才解鎖該模組的任務。學長教的「口耳相傳 SOP」可能有錯，是隱藏劇情點。 |
| 14 | **WAT correlation** | PIE 用 Excel 跑 correlation | 散佈圖小遊戲：從多個 inline 參數裡找出和 WAT 異常最相關的一個。 |

---

## 附錄：查證缺口（之後補強時要找的資料）

- 各職等的實際升遷年資（目前只有 2013 年網路資料）。
- 晶圓廠內部「上機認證 / 證照」制度的公開描述。
- Run card、ECN、release、down 等口語在台灣 fab 的正式定義。
- 台積電交通車、宿舍的現行規定。
- 無塵衣顏色是否用來區分身分（訪客、廠商、員工）。
- 機台燈號在 fab 內的實際顏色定義（SEMI 標準或各廠規範）。
