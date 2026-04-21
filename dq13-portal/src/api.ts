import type { BuildState } from './types.ts'

/**
 * Jenkins API ベース URL
 * Vite の環境変数 VITE_JENKINS_URL で上書き可能。
 * 開発時はプロキシ経由を想定。
 */
const JENKINS_BASE = import.meta.env.VITE_JENKINS_URL || '/jenkins'

/** Jenkins ジョブ名 */
const JOB_NAME = 'build-test-env'

interface TriggerResponse {
  build_number: number;
}

interface BuildStatusResponse {
  status: string;
  result: string | null;
  environment_url?: string;
}

/** ビルドをトリガーする */
export async function triggerBuild(
  masterRevision: string,
  assetBranch: string,
): Promise<{ buildNumber: number }> {
  const url = `${JENKINS_BASE}/job/${encodeURIComponent(JOB_NAME)}/buildWithParameters`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      MASTER_REVISION: masterRevision,
      ASSET_BRANCH: assetBranch,
    }),
  })

  if (!res.ok) {
    throw new Error(`ビルドの起動に失敗しました (${res.status})`)
  }

  const data: TriggerResponse = await res.json()
  return { buildNumber: data.build_number }
}

/** ビルドステータスを取得する */
export async function fetchBuildStatus(
  buildNumber: number,
): Promise<BuildState> {
  const url = `${JENKINS_BASE}/job/${encodeURIComponent(JOB_NAME)}/${buildNumber}/api/json`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`ステータス取得に失敗しました (${res.status})`)
  }

  const data: BuildStatusResponse = await res.json()

  let status: BuildState['status'] = 'PENDING'
  if (data.result === 'SUCCESS') {
    status = 'SUCCESS'
  } else if (data.result === 'FAILURE' || data.result === 'ABORTED') {
    status = 'FAILURE'
  } else if (data.status === 'RUNNING' || data.status === 'IN_PROGRESS') {
    status = 'RUNNING'
  }

  return {
    status,
    buildNumber,
    environmentUrl: data.environment_url || null,
    error: status === 'FAILURE' ? 'ビルドが失敗しました' : null,
  }
}
