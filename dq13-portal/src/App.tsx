import { useState, useCallback, useRef, useEffect } from 'react'
import { theme } from './theme'
import { jenkinsApi, BuildStatus } from './api'
import { Select } from './components/Select'
import { ProgressBar } from './components/ProgressBar'

/* ------------------------------------------------------------------ */
/*  ドメイン定義                                                       */
/* ------------------------------------------------------------------ */

const MASTER_REVISIONS = [
  { value: 'v3.2.0', label: 'v3.2.0 (最新)' },
  { value: 'v3.1.0', label: 'v3.1.0' },
  { value: 'v2.5.0', label: 'v2.5.0' },
  { value: 'v2.4.1', label: 'v2.4.1' },
] as const

const ASSET_BRANCHES = [
  { value: 'main', label: 'main' },
  { value: 'battle-balance', label: 'battle-balance' },
  { value: 'monster-rebalance', label: 'monster-rebalance' },
] as const

type MasterRevision = (typeof MASTER_REVISIONS)[number]['value']
type AssetBranch = (typeof ASSET_BRANCHES)[number]['value']

/** v3 系 × monster-rebalance は不正な組合せ */
function isInvalidCombination(
  master: MasterRevision | '',
  asset: AssetBranch | '',
): boolean {
  return master.startsWith('v3') && asset === 'monster-rebalance'
}

const JOB_NAME = 'build-test-env'
const POLL_INTERVAL_MS = 3000
/** モック想定のビルド所要時間 (プログレス推定用) */
const ESTIMATED_DURATION_MS = 12000

/* ------------------------------------------------------------------ */
/*  ステート型                                                         */
/* ------------------------------------------------------------------ */

type Phase =
  | { kind: 'idle' }
  | { kind: 'triggering' }
  | { kind: 'building'; buildNumber: number; elapsed: number }
  | { kind: 'success'; url: string }
  | { kind: 'failed'; message: string }

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

function App() {
  const [masterRevision, setMasterRevision] = useState<MasterRevision | ''>('')
  const [assetBranch, setAssetBranch] = useState<AssetBranch | ''>('')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const invalid = isInvalidCombination(masterRevision, assetBranch)
  const canSubmit =
    masterRevision !== '' &&
    assetBranch !== '' &&
    !invalid &&
    phase.kind !== 'triggering' &&
    phase.kind !== 'building'

  /* ---- ポーリング停止 ---- */
  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  /* ---- ポーリング開始 ---- */
  const startPolling = useCallback(
    (buildNumber: number) => {
      stopPolling()
      const startedAt = Date.now()

      timerRef.current = setInterval(async () => {
        try {
          const status: BuildStatus = await jenkinsApi.getBuildStatus(
            JOB_NAME,
            buildNumber,
          )

          if (status.building) {
            setPhase({
              kind: 'building',
              buildNumber,
              elapsed: Date.now() - startedAt,
            })
            return
          }

          stopPolling()

          if (status.result === 'SUCCESS') {
            setPhase({
              kind: 'success',
              url: `https://qa-env.dq13.example.com/build/${buildNumber}`,
            })
          } else {
            setPhase({
              kind: 'failed',
              message: `ビルド #${buildNumber} が ${status.result ?? '不明なステータス'} で終了しました`,
            })
          }
        } catch (err) {
          stopPolling()
          setPhase({
            kind: 'failed',
            message:
              err instanceof Error
                ? err.message
                : 'ステータス取得中にエラーが発生しました',
          })
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling],
  )

  /* ---- ビルド開始 ---- */
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setPhase({ kind: 'triggering' })

    try {
      const result = await jenkinsApi.triggerBuild(JOB_NAME, {
        MASTER_REVISION: masterRevision,
        ASSET_BRANCH: assetBranch,
      })

      const buildNumber = result.buildNumber ?? result.queueId
      setPhase({ kind: 'building', buildNumber, elapsed: 0 })
      startPolling(buildNumber)
    } catch (err) {
      setPhase({
        kind: 'failed',
        message:
          err instanceof Error
            ? err.message
            : 'ビルドの開始に失敗しました',
      })
    }
  }, [canSubmit, masterRevision, assetBranch, startPolling])

  /* ---- リセット ---- */
  const handleReset = useCallback(() => {
    stopPolling()
    setPhase({ kind: 'idle' })
  }, [stopPolling])

  /* ---- プログレス値 (0..1) ---- */
  const progressValue =
    phase.kind === 'building'
      ? Math.min(phase.elapsed / ESTIMATED_DURATION_MS, 0.95)
      : phase.kind === 'success'
        ? 1
        : null

  return (
    <main
      style={{
        minHeight: '100vh',
        background: theme.color.background,
        color: theme.color.text,
        fontFamily: theme.font.base,
        padding: theme.spacing.xl,
      }}
    >
      <header style={{ marginBottom: theme.spacing.xl }}>
        <h1
          style={{
            fontSize: theme.font.sizeXl,
            margin: 0,
            color: theme.color.primary,
          }}
        >
          DQ13 QA Portal
        </h1>
        <p
          style={{
            color: theme.color.textMuted,
            fontSize: theme.font.sizeMd,
            marginTop: theme.spacing.xs,
          }}
        >
          マスターデータ × アセットブランチの組合せで、テスト環境を即座に立ち上げます。
        </p>
      </header>

      <section
        style={{
          background: theme.color.surface,
          border: `1px solid ${theme.color.border}`,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          maxWidth: '640px',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}
      >
        {/* ---- プルダウン ---- */}
        <Select<MasterRevision>
          label="マスターデータ リビジョン"
          value={masterRevision}
          options={MASTER_REVISIONS.map((r) => ({ ...r }))}
          onChange={setMasterRevision}
          hint="テスト対象のマスターデータバージョンを選択してください"
        />

        <Select<AssetBranch>
          label="アセットブランチ"
          value={assetBranch}
          options={ASSET_BRANCHES.map((b) => ({ ...b }))}
          onChange={setAssetBranch}
          hint="テスト対象のアセットブランチを選択してください"
          error={
            invalid
              ? 'v3 系マスターと monster-rebalance の組合せは使用できません'
              : undefined
          }
        />

        {/* ---- 送信ボタン ---- */}
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            fontSize: theme.font.sizeMd,
            fontWeight: 'bold',
            color: '#ffffff',
            background: canSubmit
              ? theme.color.primary
              : theme.color.primaryDisabled,
            border: 'none',
            borderRadius: theme.radius.md,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            if (canSubmit)
              (e.currentTarget as HTMLButtonElement).style.background =
                theme.color.primaryHover
          }}
          onMouseLeave={(e) => {
            if (canSubmit)
              (e.currentTarget as HTMLButtonElement).style.background =
                theme.color.primary
          }}
        >
          {phase.kind === 'triggering'
            ? 'ジョブ開始中…'
            : phase.kind === 'building'
              ? 'ビルド中…'
              : '環境構築'}
        </button>

        {/* ---- プログレスバー ---- */}
        {(phase.kind === 'triggering' || phase.kind === 'building') && (
          <ProgressBar
            value={phase.kind === 'triggering' ? null : progressValue}
            label={
              phase.kind === 'building'
                ? `ビルド #${phase.buildNumber} を実行中…`
                : 'ジョブをキューに追加中…'
            }
          />
        )}

        {/* ---- 成功表示 ---- */}
        {phase.kind === 'success' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
            }}
          >
            <ProgressBar value={1} label="ビルド完了" />
            <div
              style={{
                background: theme.color.background,
                border: `1px solid ${theme.color.success}`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              }}
            >
              <p
                style={{
                  margin: 0,
                  marginBottom: theme.spacing.xs,
                  fontWeight: 'bold',
                  color: theme.color.success,
                }}
              >
                ✅ テスト環境が構築されました
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: theme.font.sizeSm,
                  color: theme.color.textMuted,
                }}
              >
                接続先:
              </p>
              <a
                href={phase.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: theme.color.primary,
                  fontFamily: theme.font.mono,
                  fontSize: theme.font.sizeSm,
                  wordBreak: 'break-all',
                }}
              >
                {phase.url}
              </a>
            </div>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                fontSize: theme.font.sizeSm,
                color: theme.color.primary,
                background: 'transparent',
                border: `1px solid ${theme.color.primary}`,
                borderRadius: theme.radius.md,
                alignSelf: 'flex-start',
              }}
            >
              新しいビルドを開始する
            </button>
          </div>
        )}

        {/* ---- エラー表示 ---- */}
        {phase.kind === 'failed' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
            }}
          >
            <div
              style={{
                background: theme.color.background,
                border: `1px solid ${theme.color.danger}`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 'bold',
                  color: theme.color.danger,
                }}
              >
                ❌ ビルドに失敗しました
              </p>
              <p
                style={{
                  margin: 0,
                  marginTop: theme.spacing.xs,
                  fontSize: theme.font.sizeSm,
                  color: theme.color.textMuted,
                }}
              >
                {phase.message}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                fontSize: theme.font.sizeSm,
                color: theme.color.primary,
                background: 'transparent',
                border: `1px solid ${theme.color.primary}`,
                borderRadius: theme.radius.md,
                alignSelf: 'flex-start',
              }}
            >
              やり直す
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
