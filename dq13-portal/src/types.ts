/** マスターデータリビジョン */
export type MasterRevision = string;

/** アセットブランチ */
export type AssetBranch = string;

/** ビルドステータス */
export type BuildStatus = 'IDLE' | 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILURE';

/** ビルドリクエストパラメータ */
export interface BuildParams {
  masterRevision: MasterRevision;
  assetBranch: AssetBranch;
}

/** ビルド状態 */
export interface BuildState {
  status: BuildStatus;
  buildNumber: number | null;
  environmentUrl: string | null;
  error: string | null;
}

/** バリデーションエラー */
export interface ValidationResult {
  valid: boolean;
  message: string | null;
}

/** マスターリビジョンからメジャーバージョンを抽出 (例: "v2.1.0" → 2) */
function parseMajorVersion(revision: string): number | null {
  const match = revision.match(/^v(\d+)\./)
  return match ? parseInt(match[1], 10) : null
}

/** リビジョンが実験的かどうか (-rc, -exp, -alpha, -beta 接尾辞) */
function isExperimentalRevision(revision: string): boolean {
  return /-(rc|exp|alpha|beta)/.test(revision)
}

/**
 * ドメインルールバリデーション
 * - v1.x 系マスター × feature/ ブランチ → NG
 * - release/ ブランチ × 実験的マスターデータ → NG
 */
export function validateCombination(params: BuildParams): ValidationResult {
  const { masterRevision, assetBranch } = params

  if (!masterRevision || !assetBranch) {
    return { valid: false, message: '両方のフィールドを選択してください' }
  }

  const major = parseMajorVersion(masterRevision)

  // v1.x 系マスターデータ × feature/ ブランチ
  if (major !== null && major < 2 && assetBranch.startsWith('feature/')) {
    return {
      valid: false,
      message: `v1.x 系マスターデータ (${masterRevision}) は feature/ ブランチとの互換性がありません`,
    }
  }

  // release/ ブランチ × 実験的マスターデータ
  if (assetBranch.startsWith('release/') && isExperimentalRevision(masterRevision)) {
    return {
      valid: false,
      message: `リリースブランチ (${assetBranch}) に実験的マスターデータ (${masterRevision}) は適用できません`,
    }
  }

  return { valid: true, message: null }
}

/** 選択肢定義 */
export const MASTER_REVISIONS: MasterRevision[] = [
  'v2.2.0-rc',
  'v2.1.0',
  'v2.0.0',
  'v1.9.0',
  'v1.8.0-exp',
]

export const ASSET_BRANCHES: AssetBranch[] = [
  'main',
  'feature/battle-update',
  'feature/new-dungeon',
  'release/v2.1',
  'release/v2.0',
]
