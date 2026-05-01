/**
 * Cloud Run 上の K8s モックを叩く薄い fetch ラッパー。
 *
 * 全 API クライアントはここを経由する。生 `fetch` を直接呼ばないこと。
 *
 * 環境変数:
 * - VITE_K8S_BASE_URL (省略時は Cloud Run の公開モック)
 * - VITE_K8S_NAMESPACE (省略時は "ff17-raid")
 */

const DEFAULT_K8S_BASE_URL =
  'https://coding-agent-demo-mock-258509337164.us-central1.run.app'

const baseUrl: string =
  (import.meta.env.VITE_K8S_BASE_URL as string | undefined) ??
  DEFAULT_K8S_BASE_URL

const namespace: string =
  (import.meta.env.VITE_K8S_NAMESPACE as string | undefined) ?? 'ff17-raid'

export type PodPhase = 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Unknown'

export interface PodSpec {
  metadata: {
    name: string
    namespace?: string
    labels?: Record<string, string>
  }
  spec: {
    containers: Array<{
      name: string
      image: string
      env?: Array<{ name: string; value: string }>
      ports?: Array<{ containerPort: number }>
    }>
  }
}

export interface Pod {
  metadata: { name: string; namespace: string; labels?: Record<string, string> }
  status: {
    phase: PodPhase
    podIP?: string
    hostIP?: string
    startTime?: string
    containerPorts?: Array<{ port: number; protocol: string }>
  }
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

export const k8sApi = {
  listPods: () => request<{ items: Pod[] }>(`/api/v1/namespaces/${namespace}/pods`),
  createPod: (spec: PodSpec) =>
    request<Pod>(`/api/v1/namespaces/${namespace}/pods`, {
      method: 'POST',
      body: JSON.stringify(spec),
    }),
  getPod: (name: string) =>
    request<Pod>(`/api/v1/namespaces/${namespace}/pods/${encodeURIComponent(name)}`),
  deletePod: (name: string) =>
    request<{ status: string }>(`/api/v1/namespaces/${namespace}/pods/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
}

export { HttpError, baseUrl as k8sBaseUrl, namespace as k8sNamespace }
