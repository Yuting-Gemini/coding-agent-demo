import { useState, useCallback, useRef, useEffect } from 'react'
import { theme } from './theme'
import { Select } from './components/Select'
import { StatusIndicator } from './components/StatusIndicator'
import { k8sApi } from './api'
import type { Pod, PodPhase } from './api'
import {
  BOSSES,
  DEBUFFS,
  getBoss,
  EQUIP_LEVEL_MIN,
  EQUIP_LEVEL_MAX,
  clampEquipLevel,
  isEquipLevelOutOfRange,
} from './domain'
import type { BossId, DebuffId } from './domain'
import { notifySlack } from './notify'

const POLL_INTERVAL_MS = 3000

type LaunchState =
  | { step: 'idle' }
  | { step: 'launching' }
  | { step: 'polling'; podName: string; phase: PodPhase }
  | { step: 'running'; podName: string; pod: Pod }
  | { step: 'error'; message: string }

function App() {
  const [bossId, setBossId] = useState<BossId | ''>('')
  const [phase, setPhase] = useState<string>('')
  const [equipLevel, setEquipLevel] = useState<string>('50')
  const [debuff, setDebuff] = useState<DebuffId>('none')
  const [launchState, setLaunchState] = useState<LaunchState>({ step: 'idle' })

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const selectedBoss = bossId ? getBoss(bossId) : null

  // ボス変更時にフェーズをリセット
  const handleBossChange = useCallback((val: BossId) => {
    setBossId(val)
    setPhase('')
  }, [])

  const phaseOptions = selectedBoss
    ? selectedBoss.phases.map((p) => ({
        value: String(p),
        label: `フェーズ ${p}`,
      }))
    : []

  const parsedLevel = Number(equipLevel)
  const isLevelValid =
    !isNaN(parsedLevel) &&
    parsedLevel >= EQUIP_LEVEL_MIN &&
    parsedLevel <= EQUIP_LEVEL_MAX

  const levelWarning =
    isLevelValid && selectedBoss && isEquipLevelOutOfRange(parsedLevel, selectedBoss.recommendedLevel)
      ? `推奨レベル ${selectedBoss.recommendedLevel} ± 20 の範囲外です`
      : null

  const canLaunch =
    bossId !== '' &&
    phase !== '' &&
    isLevelValid &&
    launchState.step === 'idle'

  const handleLaunch = useCallback(async () => {
    if (!bossId || !phase || !isLevelValid) return

    setLaunchState({ step: 'launching' })

    const podName = `raid-${bossId}-${Date.now()}`

    try {
      await k8sApi.createPod({
        metadata: {
          name: podName,
          namespace: 'ff17-raid',
          labels: {
            app: 'ff17-raid-sandbox',
            boss: bossId,
            phase: phase,
          },
        },
        spec: {
          containers: [
            {
              name: 'raid-sim',
              image: 'ff17/raid-simulator:latest',
              env: [
                { name: 'BOSS_ID', value: bossId },
                { name: 'PHASE', value: phase },
                { name: 'EQUIP_LEVEL', value: String(clampEquipLevel(parsedLevel)) },
                { name: 'DEBUFF', value: debuff },
              ],
              ports: [{ containerPort: 8080 }],
            },
          ],
        },
      })

      setLaunchState({ step: 'polling', podName, phase: 'Pending' })

      pollRef.current = setInterval(async () => {
        try {
          const pod = await k8sApi.getPod(podName)
          const podPhase = pod.status.phase

          if (podPhase === 'Running') {
            stopPolling()
            setLaunchState({ step: 'running', podName, pod })
            const ip = pod.status.podIP ?? 'N/A'
            const port = pod.status.containerPorts?.[0]?.port ?? 'N/A'
            notifySlack(
              `サンドボックス起動完了: ${bossId} フェーズ${phase} — 接続先 ${ip}:${port}`,
            )
          } else if (podPhase === 'Failed') {
            stopPolling()
            setLaunchState({ step: 'error', message: 'Pod の起動に失敗しました' })
          } else {
            setLaunchState({ step: 'polling', podName, phase: podPhase })
          }
        } catch (err) {
          stopPolling()
          setLaunchState({
            step: 'error',
            message: err instanceof Error ? err.message : 'ポーリング中にエラーが発生しました',
          })
        }
      }, POLL_INTERVAL_MS)
    } catch (err) {
      setLaunchState({
        step: 'error',
        message: err instanceof Error ? err.message : 'Pod の作成に失敗しました',
      })
    }
  }, [bossId, phase, parsedLevel, isLevelValid, debuff, stopPolling])

  const handleReset = useCallback(() => {
    stopPolling()
    setLaunchState({ step: 'idle' })
  }, [stopPolling])

  const isFormDisabled = launchState.step !== 'idle'

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
            textShadow: theme.glow.primary,
            letterSpacing: '0.05em',
          }}
        >
          FF17 Raid Sandbox
        </h1>
        <p
          style={{
            color: theme.color.textMuted,
            fontSize: theme.font.sizeMd,
            marginTop: theme.spacing.xs,
          }}
        >
          ボス × フェーズ × デバフを指定して、即座にレイド戦闘環境を起動します。
        </p>
      </header>

      <section
        style={{
          background: theme.color.surface,
          border: `1px solid ${theme.color.border}`,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
          maxWidth: '720px',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}
      >
        {/* --- パラメータ選択 --- */}
        <Select<BossId>
          label="対象ボス"
          value={bossId}
          options={BOSSES.map((b) => ({ value: b.id as BossId, label: b.name }))}
          onChange={handleBossChange}
          hint={selectedBoss ? `推奨 Lv.${selectedBoss.recommendedLevel}` : undefined}
        />

        <Select<string>
          label="開始フェーズ"
          value={phase}
          options={phaseOptions}
          onChange={setPhase}
          hint={
            selectedBoss && selectedBoss.phases.length === 1
              ? 'このボスはフェーズ 1 のみです'
              : undefined
          }
        />

        {/* 装備レベル */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xs,
            fontFamily: theme.font.base,
            fontSize: theme.font.sizeMd,
            color: theme.color.text,
          }}
        >
          <span style={{ color: theme.color.textMuted }}>装備レベル</span>
          <input
            type="number"
            min={EQUIP_LEVEL_MIN}
            max={EQUIP_LEVEL_MAX}
            value={equipLevel}
            disabled={isFormDisabled}
            onChange={(e) => setEquipLevel(e.target.value)}
            style={{
              padding: theme.spacing.sm,
              fontSize: theme.font.sizeMd,
              border: `1px solid ${
                !isLevelValid && equipLevel !== ''
                  ? theme.color.danger
                  : levelWarning
                    ? theme.color.warning
                    : theme.color.border
              }`,
              borderRadius: theme.radius.md,
              background: theme.color.surface,
              color: theme.color.text,
              appearance: 'none',
              MozAppearance: 'textfield',
            }}
          />
          {!isLevelValid && equipLevel !== '' && (
            <span style={{ fontSize: theme.font.sizeSm, color: theme.color.danger }}>
              {EQUIP_LEVEL_MIN}〜{EQUIP_LEVEL_MAX} の範囲で入力してください
            </span>
          )}
          {levelWarning && (
            <span style={{ fontSize: theme.font.sizeSm, color: theme.color.warning }}>
              ⚠ {levelWarning}
            </span>
          )}
        </label>

        <Select<DebuffId>
          label="デバフ"
          value={debuff}
          options={DEBUFFS.map((d) => ({ value: d.id as DebuffId, label: d.name }))}
          onChange={setDebuff}
        />

        {/* --- 起動ボタン --- */}
        <button
          disabled={!canLaunch}
          onClick={handleLaunch}
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            fontSize: theme.font.sizeMd,
            fontWeight: 700,
            color: canLaunch ? theme.color.background : theme.color.textMuted,
            background: canLaunch ? theme.color.primary : theme.color.primaryDisabled,
            border: 'none',
            borderRadius: theme.radius.md,
            boxShadow: canLaunch ? theme.glow.primary : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
            marginTop: theme.spacing.sm,
          }}
        >
          {launchState.step === 'launching' ? '起動中…' : 'サンドボックス起動'}
        </button>

        {/* --- ステータス表示 --- */}
        {launchState.step === 'polling' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            <StatusIndicator phase={launchState.phase} detail={launchState.podName} />
            <div
              style={{
                fontSize: theme.font.sizeSm,
                color: theme.color.textMuted,
              }}
            >
              Pod の起動を待機しています…
            </div>
          </div>
        )}

        {launchState.step === 'running' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            <StatusIndicator phase="Running" detail={launchState.podName} />
            <div
              style={{
                background: theme.color.surfaceElevated,
                border: `1px solid ${theme.color.primary}`,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
                fontFamily: theme.font.mono,
                fontSize: theme.font.sizeMd,
                boxShadow: theme.glow.primary,
              }}
            >
              <div style={{ color: theme.color.textMuted, marginBottom: theme.spacing.xs }}>
                接続先
              </div>
              <div>
                <span style={{ color: theme.color.primary }}>
                  {launchState.pod.status.podIP ?? 'N/A'}
                </span>
                <span style={{ color: theme.color.textMuted }}>:</span>
                <span style={{ color: theme.color.accent }}>
                  {launchState.pod.status.containerPorts?.[0]?.port ?? 'N/A'}
                </span>
              </div>
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                fontSize: theme.font.sizeSm,
                color: theme.color.textMuted,
                background: 'transparent',
                border: `1px solid ${theme.color.border}`,
                borderRadius: theme.radius.md,
                alignSelf: 'flex-start',
              }}
            >
              新しいサンドボックスを起動
            </button>
          </div>
        )}

        {launchState.step === 'error' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            }}
          >
            <div style={{ color: theme.color.danger, fontSize: theme.font.sizeMd }}>
              ✗ {launchState.message}
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                fontSize: theme.font.sizeSm,
                color: theme.color.textMuted,
                background: 'transparent',
                border: `1px solid ${theme.color.border}`,
                borderRadius: theme.radius.md,
                alignSelf: 'flex-start',
              }}
            >
              リトライ
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
