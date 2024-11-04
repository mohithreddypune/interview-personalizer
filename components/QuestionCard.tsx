'use client'

import { useState } from 'react'
import type { Question } from '@/app/page'

interface Props {
  q: Question
  index: number
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  behavioral:      { label: 'Behavioral',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  technical:       { label: 'Technical',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  'system-design': { label: 'System Design', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  situational:     { label: 'Situational',   color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
}

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: '#34D399' },
  medium: { label: 'Medium', color: '#F59E0B' },
  hard:   { label: 'Hard',   color: '#F87171' },
}

const STAR_SECTIONS = [
  { key: 'situation', label: 'Situation', icon: '🏢', color: '#60A5FA' },
  { key: 'task',      label: 'Task',      icon: '🎯', color: '#A78BFA' },
  { key: 'action',    label: 'Action',    icon: '⚡', color: '#34D399' },
  { key: 'result',    label: 'Result',    icon: '📈', color: '#F59E0B' },
] as const

export default function QuestionCard({ q, index }: Props) {
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullAnswer)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={expanded ? '' : 'lift'}
      style={{
        background:
          'linear-gradient(180deg, rgba(17, 26, 46, 0.78) 0%, rgba(11, 18, 32, 0.78) 100%)',
        backdropFilter: 'blur(12px) saturate(1.15)',
        WebkitBackdropFilter: 'blur(12px) saturate(1.15)',
        border: expanded
          ? '1px solid rgba(124,107,255,0.45)'
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
        transition: 'border-color 0.2s, box-shadow 0.25s, transform 0.25s',
        boxShadow: expanded
          ? '0 0 0 1px rgba(124,107,255,0.18), 0 14px 44px rgba(0,0,0,0.45), 0 0 30px rgba(124,107,255,0.12)'
          : '0 4px 16px rgba(0,0,0,0.30)',
        marginBottom: 12,
        animation: 'slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${Math.min(index * 0.025, 0.25)}s`,
      }}
    >
      {/* ── Header (clickable) ─────────────────────────────────────── */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Question number */}
        <span
          style={{
            minWidth: 36,
            height: 36,
            borderRadius: 10,
            background:
              'linear-gradient(135deg, rgba(124,107,255,0.22) 0%, rgba(34,211,238,0.16) 100%)',
            color: '#C4BEFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12.5,
            fontWeight: 700,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            marginTop: 1,
            border: '1px solid rgba(124,107,255,0.25)',
            flexShrink: 0,
          }}
        >
          {String(q.id).padStart(2, '0')}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                color: cat.color,
                background: cat.bg,
                border: `1px solid ${cat.color}33`,
              }}
            >
              {cat.label}
            </span>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                color: diff.color,
                background: `${diff.color}1A`,
                border: `1px solid ${diff.color}33`,
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
              lineHeight: 1.6,
              letterSpacing: '-0.005em',
            }}
          >
            {q.question}
          </p>

          {/* Why asked */}
          {!expanded && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: 'var(--text-subtle)',
                fontStyle: 'italic',
              }}
            >
              {q.whyAsked}
            </p>
          )}
        </div>

        {/* Chevron */}
        <span
          style={{
            color: 'var(--text-subtle)',
            fontSize: 16,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s',
            marginTop: 8,
            flexShrink: 0,
          }}
        >
          ▾
        </span>
      </button>

      {/* ── Expanded body ──────────────────────────────────────────── */}
      {expanded && (
        <div style={{ padding: '0 22px 22px' }}>

          {/* Why asked banner */}
          <div
            style={{
              background:
                'linear-gradient(180deg, rgba(124,107,255,0.10) 0%, rgba(34,211,238,0.06) 100%)',
              border: '1px solid rgba(124,107,255,0.22)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 18,
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 14 }}>🎤</span>
            <p style={{ margin: 0, fontSize: 12.5, color: '#C4BEFF', lineHeight: 1.55 }}>
              <strong style={{ color: '#E0DCFF' }}>Why they ask this:</strong> {q.whyAsked}
            </p>
          </div>

          {/* STAR sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STAR_SECTIONS.map(({ key, label, icon, color }) => (
              <div
                key={key}
                style={{
                  background: 'rgba(20, 30, 52, 0.55)',
                  border: `1px solid ${color}26`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 10,
                  padding: '13px 15px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginBottom: 7,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: '0.10em',
                      color,
                      textTransform: 'uppercase',
                    }}
                  >
                    {label}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13.5,
                    color: '#D6D9E0',
                    lineHeight: 1.68,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {q[key]}
                </p>
              </div>
            ))}
          </div>

          {/* Tip box */}
          <div
            style={{
              marginTop: 14,
              background:
                'linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.04) 100%)',
              border: '1px solid rgba(16,185,129,0.22)',
              borderRadius: 10,
              padding: '11px 14px',
              display: 'flex',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
            <p style={{ margin: 0, fontSize: 12.5, color: '#6EE7B7', lineHeight: 1.55 }}>
              <strong style={{ color: '#A7F3D0' }}>Delivery tip:</strong> {q.tip}
            </p>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            style={{
              marginTop: 16,
              padding: '9px 16px',
              background: copied ? 'rgba(52,211,153,0.16)' : 'rgba(124,107,255,0.14)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.40)' : 'rgba(124,107,255,0.32)'}`,
              borderRadius: 10,
              color: copied ? '#34D399' : '#C4BEFF',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {copied ? '✓ Copied!' : '⧉ Copy answer to clipboard'}
          </button>
        </div>
      )}
    </div>
  )
}
