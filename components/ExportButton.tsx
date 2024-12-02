'use client'

import { useState } from 'react'
import type { Question } from '@/app/page'

interface Props {
  questions: Question[]
  starred?: Set<number>
}

function toMarkdown(questions: Question[], opts: { onlyStarred?: boolean; starred?: Set<number> } = {}): string {
  const list = opts.onlyStarred && opts.starred
    ? questions.filter(q => opts.starred!.has(q.id))
    : questions

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const categories = [
    { id: 'behavioral',    label: 'Behavioral Questions'    },
    { id: 'technical',     label: 'Technical Questions'      },
    { id: 'system-design', label: 'System Design Questions'  },
    { id: 'situational',   label: 'Situational Questions'    },
  ]

  const titleSuffix = opts.onlyStarred ? ' — Starred' : ''
  const header = `# Interview Preparation Guide${titleSuffix}\n\n**Generated:** ${date}  \n**Questions:** ${list.length}\n\n---\n\n`

  const toc = categories
    .map(c => {
      const count = list.filter(q => q.category === c.id).length
      return count > 0 ? `- ${c.label} (${count})` : null
    })
    .filter(Boolean)
    .join('\n')

  const body = categories
    .map(({ id, label }) => {
      const qs = list.filter(q => q.category === id)
      if (qs.length === 0) return ''
      const blocks = qs.map(q =>
        `### Q${q.id}. ${q.question}\n\n` +
        `> **Difficulty:** ${q.difficulty} | **Why asked:** ${q.whyAsked}\n\n` +
        `**Situation**\n${q.situation}\n\n` +
        `**Task**\n${q.task}\n\n` +
        `**Action**\n${q.action}\n\n` +
        `**Result**\n${q.result}\n\n` +
        `> **Tip:** ${q.tip}\n\n---\n`
      ).join('\n')
      return `## ${label}\n\n${blocks}`
    })
    .filter(Boolean)
    .join('\n')

  return header + `## Table of Contents\n\n${toc || '_(empty)_'}\n\n---\n\n` + body
}

export default function ExportButton({ questions, starred }: Props) {
  const [copied, setCopied]   = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  if (questions.length === 0) return null
  const starredCount = starred?.size ?? 0

  const download = (md: string, filename: string) => {
    const blob = new Blob([md], { type: 'text/markdown; charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = () => {
    download(toMarkdown(questions), 'interview-prep.md')
    setShowMenu(false)
  }

  const handleDownloadStarred = () => {
    download(toMarkdown(questions, { onlyStarred: true, starred }), 'interview-prep-starred.md')
    setShowMenu(false)
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(toMarkdown(questions))
    setCopied(true)
    setShowMenu(false)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: 8 }}>
      <button
        onClick={() => setShowMenu(s => !s)}
        className="btn btn-primary"
        style={{ fontSize: 12.5, padding: '8px 14px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {copied ? 'Copied!' : 'Export'}
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          />
          <div
            className="card-elevated slide-up-sm"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              minWidth: 240,
              padding: 6,
              zIndex: 51,
            }}
          >
            <button onClick={handleDownloadAll} style={menuItemStyle}>
              <span>Download all (.md)</span>
              <span style={badgeStyle}>{questions.length}</span>
            </button>
            <button
              onClick={handleDownloadStarred}
              style={{ ...menuItemStyle, opacity: starredCount === 0 ? 0.5 : 1 }}
              disabled={starredCount === 0}
            >
              <span>Download starred only</span>
              <span style={badgeStyle}>{starredCount}</span>
            </button>
            <div style={{ height: 1, background: 'var(--border)', margin: '4px 8px' }} />
            <button onClick={handleCopyAll} style={menuItemStyle}>
              <span>Copy all to clipboard</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: 'none',
  background: 'transparent',
  fontSize: 13,
  color: 'var(--text)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.12s',
}

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  padding: '1px 7px',
  background: 'var(--surface-2)',
  borderRadius: 999,
  color: 'var(--text-3)',
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
}
