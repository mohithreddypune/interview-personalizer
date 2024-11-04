'use client'

import { useState } from 'react'
import type { Question } from '@/app/page'

interface Props {
  questions: Question[]
}

// Generates a Notion-compatible Markdown study guide from all questions.
// Notion imports standard Markdown perfectly — paste or use the Import feature.
function toMarkdown(questions: Question[]): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const categories = [
    { id: 'behavioral',    label: '🧠 Behavioral Questions'    },
    { id: 'technical',     label: '⚙️ Technical Questions'      },
    { id: 'system-design', label: '🏗️ System Design Questions'  },
    { id: 'situational',   label: '🎭 Situational Questions'    },
  ]

  const header = `# 🎯 Interview Preparation Guide\n\n**Generated:** ${date}  \n**Questions:** ${questions.length}\n\n---\n\n`

  const toc = categories
    .map(c => {
      const count = questions.filter(q => q.category === c.id).length
      return count > 0 ? `- [${c.label}](#${c.id}) (${count} questions)` : null
    })
    .filter(Boolean)
    .join('\n')

  const body = categories
    .map(({ id, label }) => {
      const qs = questions.filter(q => q.category === id)
      if (qs.length === 0) return ''

      const blocks = qs
        .map(
          q =>
            `### Q${q.id}. ${q.question}\n\n` +
            `> **Difficulty:** ${q.difficulty} | **Why asked:** ${q.whyAsked}\n\n` +
            `#### 📍 Situation\n${q.situation}\n\n` +
            `#### 🎯 Task\n${q.task}\n\n` +
            `#### ⚡ Action\n${q.action}\n\n` +
            `#### 📈 Result\n${q.result}\n\n` +
            `> 💡 **Tip:** ${q.tip}\n\n---\n`
        )
        .join('\n')

      return `## ${label}\n\n${blocks}`
    })
    .filter(Boolean)
    .join('\n')

  return header + `## Table of Contents\n\n${toc}\n\n---\n\n` + body
}

export default function ExportButton({ questions }: Props) {
  const [copied, setCopied] = useState(false)

  if (questions.length === 0) return null

  const handleDownload = () => {
    const md   = toMarkdown(questions)
    const blob = new Blob([md], { type: 'text/markdown; charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'interview-prep-guide.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyAll = async () => {
    const md = toMarkdown(questions)
    await navigator.clipboard.writeText(md)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const baseBtn: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    transition: 'transform 0.15s ease, background 0.2s, border-color 0.2s, box-shadow 0.2s',
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <button
        onClick={handleDownload}
        style={{
          ...baseBtn,
          background:
            'linear-gradient(135deg, rgba(124,107,255,0.20) 0%, rgba(34,211,238,0.16) 100%)',
          border: '1px solid rgba(124,107,255,0.40)',
          color: '#C4BEFF',
          boxShadow: '0 4px 14px rgba(124,107,255,0.18)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(124,107,255,0.28)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,107,255,0.18)'
        }}
      >
        <span>↓</span> Download .md
      </button>

      <button
        onClick={handleCopyAll}
        style={{
          ...baseBtn,
          background: copied ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${copied ? 'rgba(52,211,153,0.40)' : 'rgba(255,255,255,0.10)'}`,
          color: copied ? '#34D399' : 'var(--text-muted)',
        }}
        onMouseEnter={e => {
          if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
        }}
        onMouseLeave={e => {
          if (!copied) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        }}
      >
        {copied ? '✓ Copied to clipboard!' : '⧉ Copy for Notion'}
      </button>

      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--text-subtle)',
          fontStyle: 'italic',
        }}
      >
        Notion → Import → Markdown & CSV
      </span>
    </div>
  )
}
