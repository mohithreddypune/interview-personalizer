'use client'

import { useState } from 'react'
import type { Question } from '@/app/page'

interface Props {
  q: Question
  index: number
  starred: boolean
  onToggleStar: (id: number) => void
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  behavioral:      { label: 'Behavioral',    color: '#B45309', bg: '#FEF3C7' },
  technical:       { label: 'Technical',     color: '#1D4ED8', bg: '#DBEAFE' },
  'system-design': { label: 'System Design', color: '#6D28D9', bg: '#EDE9FE' },
  situational:    { label: 'Situational',   color: '#047857', bg: '#D1FAE5' },
}

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#047857' },
  medium: { label: 'Medium', color: '#B45309' },
  hard:   { label: 'Hard',   color: '#B91C1C' },
}

const STAR_SECTIONS = [
  { key: 'situation', label: 'Situation', color: '#2563EB' },
  { key: 'task',      label: 'Task',      color: '#7C3AED' },
  { key: 'action',    label: 'Action',    color: '#059669' },
  { key: 'result',    label: 'Result',    color: '#D97706' },
] as const

// Renders the section text. For Action, parses numbered steps (1. 2. 3.…) into
// a clean, scannable list. Falls back to pre-wrap paragraph for everything else.
function ActionContent({ text, isAction }: { text: string; isAction: boolean }) {
  if (!isAction) {
    return (
      <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {text}
      </p>
    )
  }

  // Try to detect numbered steps separated by newlines: "1. ... \n 2. ..."
  const stepPattern = /(?:^|\n)\s*(\d+)[.)]\s+/g
  const matches: RegExpExecArray[] = []
  let m: RegExpExecArray | null
  while ((m = stepPattern.exec(text)) !== null) matches.push(m)

  if (matches.length >= 2) {
    const steps: { num: string; body: string }[] = []
    for (let i = 0; i < matches.length; i++) {
      const cur  = matches[i]
      const next = matches[i + 1]
      const start = (cur.index ?? 0) + cur[0].length
      const end   = next ? next.index : text.length
      steps.push({ num: cur[1], body: text.slice(start, end).trim() })
    }
    return (
      <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {steps.map(s => (
          <li key={s.num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span
              style={{
                flexShrink: 0,
                minWidth: 22,
                height: 22,
                borderRadius: 6,
                background: '#ECFDF5',
                color: '#047857',
                fontSize: 11,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 1,
              }}
            >
              {s.num}
            </span>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    )
  }

  // Otherwise: render newline-preserved paragraph
  return (
    <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
      {text}
    </p>
  )
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? '#F59E0B' : 'none'}
    stroke={filled ? '#F59E0B' : 'currentColor'}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const ChevronIcon = ({ rotated }: { rotated: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

export default function QuestionCard({ q, index, starred, onToggleStar }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [copied,   setCopied]   = useState(false)

  const cat  = CATEGORY_META[q.category]     ?? CATEGORY_META.behavioral
  const diff = DIFFICULTY_META[q.difficulty] ?? DIFFICULTY_META.medium

  const fullAnswer =
    `STAR Answer for: "${q.question}"\n\n` +
    `Situation: ${q.situation}\n\n` +
    `Task: ${q.task}\n\n` +
    `Action: ${q.action}\n\n` +
    `Result: ${q.result}\n\n` +
    `Tip: ${q.tip}`

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await navigator.clipboard.writeText(fullAnswer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleStar(q.id)
  }

  return (
    <div
      className={expanded ? '' : 'lift'}
      style={{
        background: 'var(--surface)',
        border: expanded
          ? '1px solid var(--brand)'
          : '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.25s, transform 0.2s',
        boxShadow: expanded ? 'var(--shadow-lg)' : 'var(--shadow-xs)',
        marginBottom: 12,
        animation: 'slideUpSm 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${Math.min(index * 0.025, 0.25)}s`,
      }}
    >
      {/* ── Header (clickable) ─────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        {/* Question number */}
        <span
          style={{
            minWidth: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--surface-2)',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            marginTop: 1,
            border: '1px solid var(--border)',
            flexShrink: 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {String(q.id).padStart(2, '0')}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span
              style={{
                padding: '2px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                color: cat.color,
                background: cat.bg,
              }}
            >
              {cat.label}
            </span>
            <span
              style={{
                padding: '2px 9px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 500,
                color: diff.color,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              {diff.label}
            </span>
          </div>

          {/* Question text */}
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              fontWeight: 500,
              color: 'var(--text)',
              lineHeight: 1.55,
              letterSpacing: '-0.005em',
            }}
          >
            {q.question}
          </p>

          {!expanded && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                color: 'var(--text-3)',
              }}
            >
              {q.whyAsked}
            </p>
          )}
        </div>

        {/* Star button */}
        <span
          role="button"
          tabIndex={0}
          aria-label={starred ? 'Unstar question' : 'Star question'}
          aria-pressed={starred}
          onClick={handleStar}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggleStar(q.id)
            }
          }}
          title={starred ? 'Unstar' : 'Star this question'}
          style={{
            width: 32, height: 32,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8,
            background: starred ? '#FEF3C7' : 'transparent',
            color: starred ? '#F59E0B' : 'var(--text-4)',
            transition: 'background 0.15s, color 0.15s, transform 0.15s',
            flexShrink: 0,
            marginTop: 2,
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = starred ? '#FDE68A' : 'var(--surface-2)'
            e.currentTarget.style.color = '#F59E0B'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = starred ? '#FEF3C7' : 'transparent'
            e.currentTarget.style.color = starred ? '#F59E0B' : 'var(--text-4)'
          }}
        >
          <StarIcon filled={starred} />
        </span>

        {/* Chevron */}
        <span
          style={{
            color: 'var(--text-4)',
            display: 'inline-flex', alignItems: 'center',
            marginTop: 9, flexShrink: 0,
          }}
        >
          <ChevronIcon rotated={expanded} />
        </span>
      </button>

      {/* ── Expanded body ──────────────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 18px 20px' }}>

          {/* Why asked banner */}
          <div
            style={{
              background: 'var(--brand-soft)',
              border: '1px solid #C7D2FE',
              borderRadius: 'var(--r-md)',
              padding: '10px 12px',
              marginBottom: 16,
            }}
          >
            <p style={{ margin: 0, fontSize: 12.5, color: '#3730A3', lineHeight: 1.5 }}>
              <strong style={{ color: '#312E81' }}>Why they ask this:</strong> {q.whyAsked}
            </p>
          </div>

          {/* STAR sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
            {STAR_SECTIONS.map(({ key, label, color }) => {
              const isAction = key === 'action'
              const text     = q[key]
              return (
                <div
                  key={key}
                  style={{
                    background: isAction ? '#FAFAF7' : 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${color}`,
                    borderRadius: 'var(--r-md)',
                    padding: isAction ? '14px 16px' : '11px 13px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: isAction ? 8 : 5,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        color,
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                      {isAction && (
                        <span
                          style={{
                            marginLeft: 8,
                            padding: '1px 7px',
                            background: '#EEF2FF',
                            color: '#4338CA',
                            borderRadius: 999,
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                          }}
                        >
                          DETAILED
                        </span>
                      )}
                    </div>
                  </div>
                  <ActionContent text={text} isAction={isAction} />
                </div>
              )
            })}
          </div>

          {/* Tip box */}
          <div
            style={{
              marginTop: 12,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--r-md)',
              padding: '10px 12px',
            }}
          >
            <p style={{ margin: 0, fontSize: 12.5, color: '#065F46', lineHeight: 1.5 }}>
              <strong style={{ color: '#064E3B' }}>Delivery tip:</strong> {q.tip}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ fontSize: 12.5, padding: '7px 12px' }}
            >
              {copied ? 'Copied!' : (<><CopyIcon /> Copy answer</>)}
            </button>
            <button
              onClick={handleStar}
              className="btn btn-secondary"
              style={{
                fontSize: 12.5,
                padding: '7px 12px',
                color: starred ? '#92400E' : 'var(--text-2)',
                background: starred ? '#FEF3C7' : 'var(--surface)',
                borderColor: starred ? '#FDE68A' : 'var(--border)',
              }}
            >
              <StarIcon filled={starred} />
              {starred ? 'Starred' : 'Star this question'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
