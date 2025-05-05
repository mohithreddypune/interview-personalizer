'use client'

const FEATURES = [
  {
    title: 'Company-aware questions',
    body: 'Detects the company in your JD and uses their known interview rubric — Amazon LPs by name, Google\'s Googleyness, Netflix judgment.',
    accent: '#4F46E5',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 21l-4.35-4.35"/><circle cx="11" cy="11" r="7"/><path d="M11 8v3l2 2"/>
      </svg>
    ),
  },
  {
    title: 'Numbered Action steps',
    body: 'Each STAR answer breaks the Action into 4–6 numbered steps — exact tool, the trade-off, the alternative rejected, and why.',
    accent: '#059669',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    title: 'Saved résumé library',
    body: 'Save multiple résumés on-device. Switch between them per role — paste new JDs without re-uploading every time.',
    accent: '#7C3AED',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    title: 'Custom question mix',
    body: 'Pick the exact split — Behavioral / Technical / System Design / Situational, plus Easy / Medium / Hard counts.',
    accent: '#D97706',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
        <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
        <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
      </svg>
    ),
  },
  {
    title: 'Star, search, export',
    body: 'Star important questions, search across all answers, export the full set or just your starred ones as Markdown.',
    accent: '#0EA5E9',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    title: 'Install as a desktop app',
    body: 'Full PWA support. Install from Chrome\'s address bar — it opens in its own window with no browser chrome.',
    accent: '#EC4899',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
]

export default function Features() {
  return (
    <section
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '24px 24px 56px',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }} className="fade-in">
        <p
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--brand)',
            marginBottom: 8,
          }}
        >
          What you get
        </p>
        <h2
          className="serif"
          style={{
            fontSize: 'clamp(28px, 3.5vw, 38px)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            color: 'var(--text)',
          }}
        >
          Built for serious interview prep.
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="card lift slide-up"
            style={{
              padding: '22px 22px 20px',
              animationDelay: `${i * 70}ms`,
            }}
          >
            <div
              style={{
                width: 38, height: 38,
                borderRadius: 10,
                background: `${f.accent}14`,
                color: f.accent,
                border: `1px solid ${f.accent}30`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              {f.icon}
            </div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text)',
                marginBottom: 6,
                letterSpacing: '-0.012em',
              }}
            >
              {f.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
