import type { TextId } from '../../model';

// 案例文字見 03 §5.5 案例池表「案例（玩家看到的）」欄
export const minigameText = {
  't.mg.hold_lot.station.aei': 'AEI',
  't.mg.hold_lot.station.adi': 'ADI',
  't.mg.hold_lot.case.flier': '9 點 CD 只有 1 點超規，其他正常（量測飛點）',
  't.mg.hold_lot.case.adi_cd_high': '顯影後 CD 整片偏大，還沒蝕刻',
  't.mg.hold_lot.case.under_etch': 'Etch depth 偏淺、EPD 提早結束',
  't.mg.hold_lot.case.over_etch': 'Etch depth 偏深、下層材料被吃掉',
  't.mg.hold_lot.case.partial_chamber': '只有某些片 particle 超標，規律分布',
  't.mg.hold_lot.case.unknown_defect': 'CD、depth 都正常，但 defect 掃描 adder 偏高、散布無規律',
  't.mg.hold_lot.note.pending': '（留言待撰寫）',
} satisfies Record<TextId, string>;
