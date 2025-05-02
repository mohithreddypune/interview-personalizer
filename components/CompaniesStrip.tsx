'use client'

/**
 * Horizontal strip showing the companies whose interview styles are
 * supported by the company-aware question generator. Anchors the
 * "personalized prep" claim with concrete examples.
 */
const COMPANIES = [
  'Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Netflix',
  'Stripe', 'Uber', 'Airbnb', 'OpenAI', 'Anthropic', 'Tesla',
]

export default function CompaniesStrip() {
  return (
    <section
      className="fade-in"
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '8px 24px 40px',
        textAlign: 'center',
      }}
    >
      <p
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-4)',
          marginBottom: 18,
        }}
      >
        Tailored for top tech interviews
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '10px 28px',
        }}
      >
        {COMPANIES.map(c => (
          <span
            key={c}
            style={{
              fontSize: 15.5,
              fontWeight: 500,
              color: 'var(--text-3)',
              letterSpacing: '-0.012em',
              opacity: 0.85,
              transition: 'opacity 0.18s var(--ease-out), color 0.18s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '0.85'
              e.currentTarget.style.color = 'var(--text-3)'
            }}
          >
            {c}
          </span>
        ))}
      </div>
    </section>
  )
}
