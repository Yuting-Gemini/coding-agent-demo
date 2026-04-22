import { theme } from '../theme'

interface Option<T extends string> {
  value: T
  label: string
  disabled?: boolean
}

interface SelectProps<T extends string> {
  label: string
  value: T | ''
  options: Option<T>[]
  onChange: (value: T) => void
  hint?: string
  error?: string
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
  error,
}: SelectProps<T>) {
  return (
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
      <span style={{ color: theme.color.textMuted }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        style={{
          padding: theme.spacing.sm,
          fontSize: theme.font.sizeMd,
          border: `1px solid ${error ? theme.color.danger : theme.color.border}`,
          borderRadius: theme.radius.md,
          background: theme.color.surface,
          color: theme.color.text,
          appearance: 'none',
        }}
      >
        <option value="" disabled>
          選択してください
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <span style={{ fontSize: theme.font.sizeSm, color: theme.color.textMuted }}>
          {hint}
        </span>
      )}
      {error && (
        <span style={{ fontSize: theme.font.sizeSm, color: theme.color.danger }}>
          {error}
        </span>
      )}
    </label>
  )
}
