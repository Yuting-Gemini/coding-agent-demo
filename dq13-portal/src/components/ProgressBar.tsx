import { theme } from '../theme'

interface ProgressBarProps {
  /** 0..1 の進捗。null の場合は不確定 (アニメーション) 表示 */
  value: number | null
  label?: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const percent = value === null ? null : Math.max(0, Math.min(1, value)) * 100

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
        fontFamily: theme.font.base,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: theme.font.sizeSm,
            color: theme.color.textMuted,
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          width: '100%',
          height: '12px',
          background: theme.color.progressTrack,
          borderRadius: theme.radius.sm,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: percent === null ? '40%' : `${percent}%`,
            height: '100%',
            background: theme.color.progressFill,
            transition: 'width 0.3s ease-in-out',
            animation: percent === null ? 'progress-indeterminate 1.4s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      {percent !== null && (
        <span
          style={{
            fontSize: theme.font.sizeSm,
            color: theme.color.textMuted,
            textAlign: 'right',
          }}
        >
          {Math.round(percent)}%
        </span>
      )}
      <style>{`
        @keyframes progress-indeterminate {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  )
}
