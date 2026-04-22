/**
 * FF 風ダークテーマトークン
 *
 * 全コンポーネントは `theme.color.xxx` 経由で色を参照すること。
 * インラインで `#000` 等のハードコードはしない。
 */

export const theme = {
  color: {
    background: '#0a0612',           // 深い紫黒
    surface: '#161226',              // パネル背景
    surfaceElevated: '#1f1a35',      // 強調パネル
    border: '#2d2748',
    primary: '#7df9ff',              // シアン (アクセント)
    primaryHover: '#a3fbff',
    primaryDisabled: '#3a4a5e',
    accent: '#d946ef',               // マゼンタ
    text: '#e9e6f5',
    textMuted: '#9ca3af',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#ef4444',
    pending: '#9ca3af',
    running: '#7df9ff',
    failed: '#ef4444',
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
    xl: '40px',
  },
  font: {
    base: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    sizeSm: '14px',
    sizeMd: '16px',
    sizeLg: '20px',
    sizeXl: '32px',
  },
  glow: {
    primary: '0 0 12px rgba(125, 249, 255, 0.5)',
    accent: '0 0 12px rgba(217, 70, 239, 0.5)',
  },
} as const

export type Theme = typeof theme
