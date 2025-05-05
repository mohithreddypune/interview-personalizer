'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How is this different from generic AI interview prep tools?',
    a: 'Every question is grounded in YOUR real résumé — actual company names, project names, and metrics. The Action sections walk through 4-6 numbered steps with specific technologies, trade-offs, and decisions you actually made. Generic tools give you generic STAR templates; this writes the answer for you.',
  },
  {
    q: 'Which companies does it know?',
    a: 'It detects company names from your job description and adapts to that company\'s known interview style. Amazon questions reference Leadership Principles by name (Customer Obsession, Ownership, etc.). Google questions emphasize Googleyness and structured problem solving. Netflix taps judgment and the keeper test. Meta, Microsoft, Apple, Stripe, Uber, Airbnb, and others have their own patterns. For unknown companies, it falls back to the JD\'s stated values.',
  },
  {
    q: 'Is my résumé sent anywhere?',
    a: 'Your résumé is sent once to the Groq API to generate questions — never stored on our servers. Saved résumés live in your browser\'s localStorage on your device only. Clear your browser data and they\'re gone.',
  },
  {
    q: 'Can I customize how many questions of each type?',
    a: 'Yes. Click "Customize question mix" on the input form. You can set exact counts per category (Behavioral, Technical, System Design, Situational) and per difficulty (Easy, Medium, Hard). The model honors your distribution.',
  },
  {
    q: 'Why are some answers cut off or missing?',
    a: 'Free-tier Groq has a 12,000 tokens-per-minute cap. If a generation hits the limit you\'ll see an explanatory message in the app. Switch the model to llama-3.1-8b-instant via the GROQ_MODEL environment variable for a much higher cap (30k TPM).',
  },
  {
    q: 'Can I use this offline?',
    a: 'The UI installs as a Progressive Web App (look for "Install app" in the header). But generation requires an internet connection to call Groq. You can browse, star, search, and export previously generated questions offline.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '24px 24px 80px',
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
          FAQ
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
          Frequently asked.
        </h2>
      </div>

      <div
        className="card"
        style={{
          padding: 6,
        }}
      >
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <div
              key={item.q}
              style={{
                borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%',
                  padding: '18px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'background 0.15s var(--ease-out)',
                  borderRadius: 'var(--r-md)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span
                  style={{
                    fontSize: 14.5,
                    fontWeight: 500,
                    color: 'var(--text)',
                    letterSpacing: '-0.012em',
                    lineHeight: 1.45,
                  }}
                >
                  {item.q}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    color: 'var(--text-3)',
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 0.22s var(--ease-spring)',
                    marginTop: 2,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div
                  className="slide-up-sm"
                  style={{
                    padding: '0 20px 18px',
                    fontSize: 13.5,
                    color: 'var(--text-3)',
                    lineHeight: 1.65,
                  }}
                >
                  {item.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
