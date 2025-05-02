'use client'

const STATS = [
  { value: '30',  label: 'Questions per session', sub: 'across 4 categories' },
  { value: '<60s', label: 'Average generation time', sub: 'streamed live as written' },
  { value: '100%', label: 'Personalized to you',    sub: 'pulled from your résumé' },
]

export default function StatsStrip() {
  return (
    <section
      className="fade-in"
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '8px 24px 32px',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 0,
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFBF7 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className="slide-up"
            style={{
              padding: '28px 28px',
              borderRight: i < STATS.length - 1 ? '1px solid var(--border)' : 'none',
              animationDelay: `${i * 90}ms`,
              position: 'relative',
            }}
          >
            <p
              className="serif"
              style={{
                fontSize: 'clamp(36px, 4.5vw, 52px)',
                fontWeight: 400,
                color: 'var(--text)',
                lineHeight: 1,
                letterSpacing: '-0.025em',
                marginBottom: 10,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--text-2)',
                marginBottom: 2,
                letterSpacing: '-0.01em',
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-3)',
                letterSpacing: '-0.005em',
              }}
            >
              {s.sub}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
