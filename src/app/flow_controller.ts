import { machineStatus, presentationMood, timeOfDay, yieldIndex } from '../core/selectors';
import type { ContentBundle, DeepReadonly, GameState, MachineId, MachineStatus, SceneSnapshot } from '../model';
import { InvariantError } from '../utils/errors';

const STAGE1_SCENE = 'scn.fab_bay';

// 01 §9.2：快照只由 selectors 組裝；D87：Stage 1 固定在 fab bay、沒有角色與演出
export function toSceneSnapshot(state: DeepReadonly<GameState>, content: ContentBundle): SceneSnapshot {
  const machines: Record<MachineId, { label: string; status: MachineStatus }> = {};
  for (const def of Object.values(content.machines)) {
    const machine = state.machines[def.id];
    if (machine === undefined) throw new InvariantError(`Machine state missing: machine=${def.id}`);
    machines[def.id] = { label: def.label, status: machineStatus(machine.health, content.balance.machines) };
  }
  return {
    scene: STAGE1_SCENE,
    mood: presentationMood(state, content),
    timeOfDay: timeOfDay(state.time.minuteOfDay),
    machines,
    actors: [],
    highlightHotspots: [],
    yieldIndex: yieldIndex(state, content, STAGE1_SCENE),
    focusActor: null,
    playerSpeedScale: 1,
    phoneGlow: false,
  };
}
