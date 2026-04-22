/**
 * Cloud Run 上の Jenkins モックを叩く薄い fetch ラッパー。
 *
 * 全 API クライアントはここを経由する。生 `fetch` を直接呼ばないこと。
 *
 * 環境変数:
 * - VITE_JENKINS_BASE_URL (省略時は Cloud Run の公開モック)
 */

const DEFAULT_JENKINS_BASE_URL =
  'https://coding-agent-demo-mock-258509337164.us-central1.run.app'

const baseUrl: string =
  (import.meta.env.VITE_JENKINS_BASE_URL as string | undefined) ??
  DEFAULT_JENKINS_BASE_URL

export interface JenkinsJob {
  name: string
  url: string
  buildable: boolean
}

export interface JenkinsJobDetail {
  name: string
  description: string
  parameterDefinitions?: Array<{
    name: string
    type: 'StringParameterDefinition' | 'ChoiceParameterDefinition'
    choices?: string[]
    defaultParameterValue?: { value: string }
  }>
}

export interface BuildTriggerResult {
  queueId: number
  buildNumber: number
}

export interface BuildStatus {
  number: number
  result: 'SUCCESS' | 'FAILURE' | 'ABORTED' | null
  building: boolean
  duration: number
  url: string
}

class HttpError extends Error {
  constructor(public status: number, public body: string) {
    super(`HTTP ${status}: ${body}`)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new HttpError(res.status, body)
  }
  return (await res.json()) as T
}

export const jenkinsApi = {
  listJobs: () => request<{ jobs: JenkinsJob[] }>('/api/json'),
  getJob: (name: string) => request<JenkinsJobDetail>(`/job/${name}/api/json`),
  triggerBuild: (name: string, params: Record<string, string>) => {
    const body = new URLSearchParams(params).toString()
    return request<BuildTriggerResult>(`/job/${name}/buildWithParameters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  },
  getBuildStatus: (name: string, buildNumber: number) =>
    request<BuildStatus>(`/job/${name}/${buildNumber}/api/json`),
}

export { HttpError, baseUrl as jenkinsBaseUrl }
