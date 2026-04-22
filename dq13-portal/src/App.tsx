import { theme } from './theme'

function App() {
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
        }}
      >
        <p style={{ margin: 0, color: theme.color.textMuted }}>
          ここに各種ポータル機能が実装されます。Coding Agent が Issue を読んで自動生成します。
        </p>
      </section>
    </main>
  )
}

export default App
