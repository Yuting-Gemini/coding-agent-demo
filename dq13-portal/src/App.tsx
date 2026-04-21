import { useState, useCallback, useRef, useEffect } from 'react'
import {
  MASTER_REVISIONS,
  ASSET_BRANCHES,
  validateCombination,
  type BuildState,
  type BuildStatus,
} from './types.ts'
import { triggerBuild, fetchBuildStatus } from './api.ts'
import { theme } from './theme.ts'
import './App.css'

const POLL_INTERVAL_MS = 3000

const STATUS_LABELS: Record<BuildStatus, string> = {
  IDLE: '待機中',
  PENDING: 'キューイング中…',
  RUNNING: 'ビルド実行中…',
  SUCCESS: 'ビルド完了！',
  FAILURE: 'ビルド失敗',
}

const PROGRESS_MAP: Record<BuildStatus, number> = {
  IDLE: 0,
  PENDING: 15,
  RUNNING: 60,
  SUCCESS: 100,
  FAILURE: 100,
}

function App() {
  const [masterRevision, setMasterRevision] = useState('')
  const [assetBranch, setAssetBranch] = useState('')
  const [buildState, setBuildState] = useState<BuildState>({
    status: 'IDLE',
    buildNumber: null,
    environmentUrl: null,
    error: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pollingRef = useRef<number | null>(null)

  const validation = validateCombination({ masterRevision, assetBranch })
  const isTerminal = buildState.status === 'SUCCESS' || buildState.status === 'FAILURE'
  const canSubmit = validation.valid && !isSubmitting && (buildState.status === 'IDLE' || isTerminal)

  const stopPolling = useCallback(() => {
    if (pollingRef.current !== null) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const startPolling = useCallback((buildNumber: number) => {
    stopPolling()
    pollingRef.current = window.setInterval(async () => {
      try {
        const state = await fetchBuildStatus(buildNumber)
        setBuildState(state)
        if (state.status === 'SUCCESS' || state.status === 'FAILURE') {
          stopPolling()
        }
      } catch {
        setBuildState(prev => ({
          ...prev,
          status: 'FAILURE',
          error: 'ステータスの取得に失敗しました',
        }))
        stopPolling()
      }
    }, POLL_INTERVAL_MS)
  }, [stopPolling])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setIsSubmitting(true)
    setBuildState({
      status: 'PENDING',
      buildNumber: null,
      environmentUrl: null,
      error: null,
    })

    try {
      const { buildNumber } = await triggerBuild(masterRevision, assetBranch)
      setBuildState(prev => ({ ...prev, buildNumber, status: 'RUNNING' }))
      startPolling(buildNumber)
    } catch (err) {
      setBuildState({
        status: 'FAILURE',
        buildNumber: null,
        environmentUrl: null,
        error: err instanceof Error ? err.message : 'ビルドの起動に失敗しました',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, masterRevision, assetBranch, startPolling])

  const handleReset = useCallback(() => {
    stopPolling()
    setBuildState({
      status: 'IDLE',
      buildNumber: null,
      environmentUrl: null,
      error: null,
    })
  }, [stopPolling])

  const progressColor = buildState.status === 'SUCCESS'
    ? theme.colors.progressSuccess
    : buildState.status === 'FAILURE'
    ? theme.colors.progressFailure
    : theme.colors.progressFill

  return (
    <div className="portal">
      <header className="portal-header">
        <h1>🏰 DQ13 QA 環境構築ポータル</h1>
        <p>マスターデータとアセットブランチを選択して、テスト環境を起動します</p>
      </header>

      <main className="portal-main">
        <div className="form-card">
          <div className="form-group">
            <label htmlFor="master-revision">マスターデータ リビジョン</label>
            <select
              id="master-revision"
              value={masterRevision}
              onChange={e => setMasterRevision(e.target.value)}
              disabled={isSubmitting || (buildState.status !== 'IDLE' && !isTerminal)}
            >
              <option value="">-- 選択してください --</option>
              {MASTER_REVISIONS.map(rev => (
                <option key={rev} value={rev}>{rev}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="asset-branch">アセットブランチ</label>
            <select
              id="asset-branch"
              value={assetBranch}
              onChange={e => setAssetBranch(e.target.value)}
              disabled={isSubmitting || (buildState.status !== 'IDLE' && !isTerminal)}
            >
              <option value="">-- 選択してください --</option>
              {ASSET_BRANCHES.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          {!validation.valid && validation.message && (
            <div className="validation-error" role="alert">
              ⚠️ {validation.message}
            </div>
          )}

          <div className="form-actions">
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {isSubmitting ? '起動中…' : '🗡️ テスト環境を起動'}
            </button>
            {isTerminal && (
              <button className="btn-secondary" onClick={handleReset}>
                🔄 リセット
              </button>
            )}
          </div>
        </div>

        {buildState.status !== 'IDLE' && (
          <div className="status-card">
            <h2>ビルド状況</h2>
            {buildState.buildNumber !== null && (
              <p className="build-number">ビルド #{buildState.buildNumber}</p>
            )}

            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${PROGRESS_MAP[buildState.status]}%`,
                    backgroundColor: progressColor,
                  }}
                />
              </div>
              <span className="progress-label">
                {STATUS_LABELS[buildState.status]}
              </span>
            </div>

            {buildState.status === 'SUCCESS' && buildState.environmentUrl && (
              <div className="success-info">
                <p>✅ テスト環境が準備できました！</p>
                <a
                  href={buildState.environmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="env-url"
                >
                  {buildState.environmentUrl}
                </a>
              </div>
            )}

            {buildState.status === 'SUCCESS' && !buildState.environmentUrl && (
              <div className="success-info">
                <p>✅ ビルドが完了しました</p>
              </div>
            )}

            {buildState.error && (
              <div className="error-info" role="alert">
                ❌ {buildState.error}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="portal-footer">
        <p>DQ13 QA チーム内部ツール</p>
      </footer>
    </div>
  )
}

export default App
