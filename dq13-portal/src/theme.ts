/**
 * DQ 風シンプル明朗テーマトークン
 *
 * 全コンポーネントは `theme.color.xxx` 経由で色を参照すること。
 * インラインで `#fff` 等のハードコードはしない。
 */

export const theme = {
  color: {
    background: '#f7f9fc',
    surface: '#ffffff',
    border: '#cbd5e0',
    primary: '#2b6cb0',       // DQ 風の落ち着いた青
    primaryHover: '#2c5282',
    primaryDisabled: '#a0aec0',
    text: '#1a202c',
    textMuted: '#4a5568',
    success: '#38a169',
    warning: '#d69e2e',
    danger: '#c53030',
    progressTrack: '#edf2f7',
    progressFill: '#3182ce',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  font: {
    base: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    sizeSm: '14px',
    sizeMd: '16px',
    sizeLg: '20px',
    sizeXl: '28px',
  },
} as const

export type Theme = typeof theme
