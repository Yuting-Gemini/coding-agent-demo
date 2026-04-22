import type { PodPhase } from '../api'
import { theme } from '../theme'

const COLOR_BY_PHASE: Record<PodPhase, string> = {
  Pending: theme.color.pending,
  Running: theme.color.running,
  Succeeded: theme.color.success,
  Failed: theme.color.failed,
  Unknown: theme.color.textMuted,
}

interface StatusIndicatorProps {
  phase: PodPhase
  detail?: string
}

export function StatusIndicator({ phase, detail }: StatusIndicatorProps) {
  const color = COLOR_BY_PHASE[phase]
  const isAnimated = phase === 'Pending'

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing.sm,
        padding: `${theme.spacing.xs} ${theme.spacing.md}`,
        background: theme.color.surfaceElevated,
        border: `1px solid ${color}`,
        borderRadius: theme.radius.md,
        color: theme.color.text,
        fontFamily: theme.font.base,
        fontSize: theme.font.sizeSm,
      }}
    >
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: color,
          boxShadow: phase === 'Running' ? theme.glow.primary : 'none',
          animation: isAnimated ? 'status-pulse 1.4s ease-in-out infinite' : 'none',
        }}
      />
      <span>
        {phase}
        {detail ? ` — ${detail}` : ''}
      </span>
      <style>{`
        @keyframes status-pulse {
          0%, 100% { opacity: 0.4; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
