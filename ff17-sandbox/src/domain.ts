/**
 * ボス定義・フェーズ制約・装備レベルバリデーション等のドメインロジック。
 *
 * 型レベルでフェーズ数を制約し、UI でも利用する。
 */

export interface BossDefinition {
  id: string
  name: string
  /** このボスで選択可能なフェーズ番号 */
  phases: readonly number[]
  /** 推奨装備レベル */
  recommendedLevel: number
}

export const BOSSES: readonly BossDefinition[] = [
  { id: 'ifrit', name: 'イフリート', phases: [1, 2, 3], recommendedLevel: 50 },
  { id: 'shiva', name: 'シヴァ', phases: [1, 2, 3], recommendedLevel: 60 },
  { id: 'bahamut', name: 'バハムート', phases: [1, 2, 3], recommendedLevel: 80 },
  { id: 'slime', name: 'スライム', phases: [1], recommendedLevel: 10 },
  { id: 'goblin', name: 'ゴブリン', phases: [1, 2], recommendedLevel: 25 },
] as const

export type BossId = (typeof BOSSES)[number]['id']

export const DEBUFFS = [
  { id: 'none', name: 'なし' },
  { id: 'poison', name: '毒' },
  { id: 'slow', name: 'スロウ' },
  { id: 'blind', name: '暗闇' },
  { id: 'silence', name: 'サイレス' },
] as const

export type DebuffId = (typeof DEBUFFS)[number]['id']

export function getBoss(id: BossId): BossDefinition {
  const boss = BOSSES.find((b) => b.id === id)
  if (!boss) throw new Error(`Unknown boss: ${id}`)
  return boss
}

export const EQUIP_LEVEL_MIN = 1
export const EQUIP_LEVEL_MAX = 100
export const EQUIP_LEVEL_WARNING_RANGE = 20

/** 装備レベルがボス推奨レベル ±20 の範囲外か判定 */
export function isEquipLevelOutOfRange(
  equipLevel: number,
  recommendedLevel: number,
): boolean {
  return (
    equipLevel < recommendedLevel - EQUIP_LEVEL_WARNING_RANGE ||
    equipLevel > recommendedLevel + EQUIP_LEVEL_WARNING_RANGE
  )
}

export function clampEquipLevel(value: number): number {
  return Math.max(EQUIP_LEVEL_MIN, Math.min(EQUIP_LEVEL_MAX, Math.round(value)))
}
