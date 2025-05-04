'use client'

/**
 * "How it works" — 3-step explainer rendered under the hero on the
 * landing state. Adds depth and signals product polish.
 */

const STEPS = [
  {
    n: 1,
    title: 'Paste your job description',
    body: 'Any role, any company. We detect the company name and the technologies it values most.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'Add your résumé',
    body: 'Paste or upload PDF. Save it to your library — next time you only need a new JD.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Get 30 STAR answers',
    body: 'Streamed in seconds. Each one written in first person using your real companies and metrics.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
]

export default function HowItWorks() {
  return (
    <section
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 24px 56px',
      }}
      className="fade-in"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={step.n}
            className="card lift slide-up"
            style={{
              padding: '20px 22px',
              animationDelay: `${i * 80}ms`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #C7D2FE',
                }}
              >
                {step.icon}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--text-4)',
                  letterSpacing: '0.08em',
                }}
              >
                STEP {String(step.n).padStart(2, '0')}
              </span>
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}
            >
              {step.title}
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-3)',
                lineHeight: 1.6,
              }}
            >
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
