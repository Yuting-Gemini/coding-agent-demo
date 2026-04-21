import type { BuildState } from './types.ts'

const JENKINS_BASE = import.meta.env.VITE_JENKINS_URL || '/jenkins'
const JOB_NAME = 'build-test-env'

interface TriggerResponse {
  queued: boolean;
  build_number: number;
}

interface BuildStatusResponse {
  number: number;
  result: string | null;
  building: boolean;
  duration: number;
  url: string;
}

export async function triggerBuild(
  masterRevision: string,
  assetBranch: string,
): Promise<{ buildNumber: number }> {
  const params = new URLSearchParams({
    MASTER_REVISION: masterRevision,
    ASSET_BRANCH: assetBranch,
  })

  const url = `${JENKINS_BASE}/job/${encodeURIComponent(JOB_NAME)}/buildWithParameters?${params.toString()}`

  const res = await fetch(url, { method: 'POST' })

  if (!res.ok) {
    throw new Error(`ビルドの起動に失敗しました (${res.status})`)
  }

  const data: TriggerResponse = await res.json()
  return { buildNumber: data.build_number }
}

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
  } else if (data.building) {
    status = 'RUNNING'
  }

  return {
    status,
    buildNumber,
    environmentUrl: status === 'SUCCESS'
      ? `https://qa-env-${buildNumber}.dq13.internal`
      : null,
    error: status === 'FAILURE' ? 'ビルドが失敗しました' : null,
  }
}
