'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import QuestionCard from '@/components/QuestionCard'
import ExportButton from '@/components/ExportButton'

// ── Types ────────────────────────────────────────────────────────────────────
export interface Question {
  id:         number
  category:   'behavioral' | 'technical' | 'system-design' | 'situational'
  difficulty: 'easy' | 'medium' | 'hard'
  question:   string
  situation:  string
  task:       string
  action:     string
  result:     string
  whyAsked:   string
  tip:        string
}

type InputTab = 'paste' | 'pdf'
type Filter   = 'all' | 'starred' | 'behavioral' | 'technical' | 'system-design' | 'situational'

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'starred',       label: 'Starred' },
  { id: 'behavioral',    label: 'Behavioral' },
  { id: 'technical',     label: 'Technical' },
  { id: 'system-design', label: 'System Design' },
  { id: 'situational',   label: 'Situational' },
]

const STARRED_KEY = 'interview-coach.starred.v1'

// ── BeforeInstallPromptEvent (PWA) ───────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Inline icons ─────────────────────────────────────────────────────────────
const Icon = {
  Logo: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  ),
  Sparkle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Alert: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Bolt: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  Search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Download: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Keyboard: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10" /><line x1="10" y1="10" x2="10" y2="10" />
      <line x1="14" y1="10" x2="14" y2="10" /><line x1="18" y1="10" x2="18" y2="10" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
}

// ── Style helpers ────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 500, color: 'var(--text-2)',
  letterSpacing: '-0.005em', marginBottom: 8, display: 'block',
}
const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', color: 'var(--text)',
  fontSize: 13.5, lineHeight: 1.6, fontFamily: 'inherit',
  resize: 'vertical' as const,
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Home() {
  const [jd,           setJd]           = useState('')
  const [resume,       setResume]       = useState('')
  const [questions,    setQuestions]    = useState<Question[]>([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [filter,       setFilter]       = useState<Filter>('all')
  const [inputTab,     setInputTab]     = useState<InputTab>('paste')
  const [pdfLoading,   setPdfLoading]   = useState(false)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [dragOver,     setDragOver]     = useState(false)
  const [search,       setSearch]       = useState('')
  const [starred,      setStarred]      = useState<Set<number>>(new Set())
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const fileRef    = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  // ── Persist starred to localStorage ─────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STARRED_KEY)
      if (raw) setStarred(new Set(JSON.parse(raw)))
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(starred)))
    } catch { /* noop */ }
  }, [starred])

  // ── PWA install ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  // ── Scroll to results when first question arrives ───────────────────
  useEffect(() => {
    if (questions.length === 1 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [questions.length])

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const inField = tag === 'INPUT' || tag === 'TEXTAREA'
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return }
        if (search)        { setSearch(''); return }
      }
      if (inField) return
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(s => !s) }
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key.toLowerCase() === 'a') setFilter('all')
      if (e.key.toLowerCase() === 's') setFilter('starred')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [search, showShortcuts])

  // ── Star toggle ─────────────────────────────────────────────────────
  const toggleStar = useCallback((id: number) => {
    setStarred(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  // ── PDF upload ──────────────────────────────────────────────────────
  const handlePdfFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a .pdf file.'); return
    }
    setError('')
    setPdfLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'PDF parse failed')
      setResume(json.text)
      setInputTab('paste')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF upload failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Generate ────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!jd.trim())     { setError('Please paste a job description.'); return }
    if (!resume.trim()) { setError('Please add your résumé (paste or PDF upload).'); return }

    setError('')
    setLoading(true)
    setQuestions([])
    setFilter('all')
    setLoadingPhase('Analyzing job requirements')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim(), resume: resume.trim() }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Server error ${res.status}`)
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let count  = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.question) {
              count++
              setLoadingPhase(`Generating question ${count} of 30`)
              setQuestions(prev => [...prev, parsed as Question])
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') throw parseErr
          }
        }
      }

      setLoadingPhase('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
      setLoadingPhase('')
    }
  }, [jd, resume])

  // ── Derived state ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = questions
    if (filter === 'starred')      list = list.filter(q => starred.has(q.id))
    else if (filter !== 'all')     list = list.filter(q => q.category === filter)
    if (search.trim()) {
      const s = search.toLowerCase()
      list = list.filter(q =>
        q.question.toLowerCase().includes(s) ||
        q.situation.toLowerCase().includes(s) ||
        q.action.toLowerCase().includes(s) ||
        q.result.toLowerCase().includes(s) ||
        q.whyAsked.toLowerCase().includes(s)
      )
    }
    return list
  }, [questions, filter, starred, search])

  const counts: Record<Filter, number> = {
    all:             questions.length,
    starred:         starred.size,
    behavioral:      questions.filter(q => q.category === 'behavioral').length,
    technical:       questions.filter(q => q.category === 'technical').length,
    'system-design': questions.filter(q => q.category === 'system-design').length,
    situational:     questions.filter(q => q.category === 'situational').length,
  }

  const progress   = Math.round((questions.length / 30) * 100)
  const hasResults = questions.length > 0
  const wordCount  = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header
        style={{
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(250, 250, 247, 0.78)',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--text)', color: '#FFF',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon.Logo />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontWeight: 600, fontSize: 14.5, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Interview Coach
            </span>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              Personalized prep, written from your résumé
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {installPrompt && (
            <button onClick={handleInstall} className="btn btn-secondary" style={{ fontSize: 12.5, padding: '7px 12px' }}>
              <Icon.Download />
              <span>Install app</span>
            </button>
          )}
          <button
            onClick={() => setShowShortcuts(true)}
            className="btn btn-ghost"
            title="Keyboard shortcuts (?)"
            style={{ fontSize: 12.5, padding: '7px 10px' }}
          >
            <Icon.Keyboard />
          </button>
          <span className="pill" style={{ color: 'var(--text-3)' }}>
            <Icon.Bolt />
            <span style={{ marginLeft: 1 }}>Powered by Groq</span>
          </span>
        </div>
      </header>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: hasResults ? '32px 24px 96px' : '20px 24px 96px',
          display: 'grid',
          gridTemplateColumns: hasResults ? 'minmax(380px, 440px) 1fr' : '1fr',
          gap: 32,
          alignItems: 'start',
          transition: 'grid-template-columns 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* ── LEFT: Input panel ───────────────────────────────────── */}
        <section style={{ position: 'sticky', top: 88 }}>

          {!hasResults && (
            <div style={{ textAlign: 'center', padding: '64px 8px 40px' }} className="fade-in">
              <span
                className="pill slide-up-sm"
                style={{
                  marginBottom: 26,
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-2)',
                  padding: '5px 12px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--success)',
                  }}
                />
                Live · 30 questions in seconds
              </span>

              <h1
                className="slide-up"
                style={{
                  fontSize: 'clamp(36px, 5vw, 52px)',
                  fontWeight: 600,
                  lineHeight: 1.06,
                  letterSpacing: '-0.035em',
                  marginBottom: 18,
                  color: 'var(--text)',
                }}
              >
                Interview prep,{' '}
                <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>
                  written from
                </span>
                <br />
                your <span className="shimmer">actual experience</span>.
              </h1>

              <p
                className="slide-up"
                style={{
                  color: 'var(--text-3)',
                  fontSize: 15.5,
                  maxWidth: 520, margin: '0 auto',
                  lineHeight: 1.6,
                  animationDelay: '0.05s',
                }}
              >
                Drop in a job description and your résumé. We generate 30 role-specific questions and write each STAR answer from the work you&apos;ve actually done.
              </p>
            </div>
          )}

          {/* Input card */}
          <div className="card-elevated slide-up" style={{ padding: 24, animationDelay: hasResults ? '0s' : '0.1s' }}>
            {hasResults && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' }}>Inputs</h2>
                <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>Streaming live</span>
              </div>
            )}

            {/* Job Description */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Job description</label>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the full posting — role, responsibilities, requirements, tech stack…"
                rows={8}
                style={textareaStyle}
              />
              <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 6, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {wordCount(jd)} words
              </div>
            </div>

            {/* Resume */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Your résumé</label>
                <div style={{ display: 'inline-flex', gap: 2, padding: 3, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
                  {(['paste', 'pdf'] as InputTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setInputTab(tab)}
                      style={{
                        padding: '4px 10px', borderRadius: 6,
                        fontSize: 11.5, fontWeight: 500, cursor: 'pointer', border: 'none',
                        background: inputTab === tab ? 'var(--surface)' : 'transparent',
                        color: inputTab === tab ? 'var(--text)' : 'var(--text-3)',
                        boxShadow: inputTab === tab ? 'var(--shadow-xs)' : 'none',
                        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {tab === 'paste' ? 'Paste text' : 'Upload PDF'}
                    </button>
                  ))}
                </div>
              </div>

              {inputTab === 'paste' ? (
                <>
                  <textarea
                    value={resume}
                    onChange={e => setResume(e.target.value)}
                    placeholder="Paste your full résumé — work experience, projects, skills, metrics…"
                    rows={10}
                    style={textareaStyle}
                  />
                  <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 6, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {wordCount(resume)} words
                  </div>
                </>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault(); setDragOver(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handlePdfFile(file)
                  }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragOver ? 'var(--brand)' : 'var(--border-2)'}`,
                    borderRadius: 'var(--r-lg)',
                    padding: '34px 20px',
                    textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? 'var(--brand-soft)' : 'var(--surface-2)',
                    transition: 'all 0.18s',
                  }}
                >
                  <input
                    ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handlePdfFile(file)
                    }}
                  />
                  {pdfLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div className="spinner" />
                      <span style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Extracting text…</span>
                    </div>
                  ) : resume ? (
                    <div>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#D1FAE5', color: 'var(--success)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                        <Icon.Check />
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: 13.5, fontWeight: 500 }}>Résumé extracted</p>
                      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 3 }}>
                        {wordCount(resume)} words · click to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: 'var(--shadow-xs)' }}>
                        <Icon.Upload />
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: 13.5, fontWeight: 500 }}>Drop your résumé PDF</p>
                      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 3 }}>
                        or click to browse · PDF, max ~5 MB
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="slide-up-sm"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--r-md)',
                  padding: '12px 14px',
                  marginBottom: 14,
                  fontSize: 12.5,
                  color: '#991B1B',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }}><Icon.Alert /></span>
                <div style={{ lineHeight: 1.55, minWidth: 0, wordBreak: 'break-word' }}>{error}</div>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || pdfLoading}
              className="btn btn-brand"
              style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500 }}
            >
              {loading ? (
                <><div className="spinner on-brand" /><span>Generating…</span></>
              ) : (
                <><Icon.Sparkle /><span>Generate 30 questions</span></>
              )}
            </button>

            {!hasResults && (
              <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>
                  For best results
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.75 }}>
                  <li>Paste the <strong style={{ color: 'var(--text)' }}>full</strong> JD — not just the title</li>
                  <li>Include <strong style={{ color: 'var(--text)' }}>metrics</strong> in your résumé</li>
                  <li>List specific <strong style={{ color: 'var(--text)' }}>technologies</strong> per role</li>
                  <li>Include <strong style={{ color: 'var(--text)' }}>project names</strong> and outcomes</li>
                </ul>
              </div>
            )}
          </div>

          {!hasResults && (
            <p style={{ marginTop: 18, textAlign: 'center', fontSize: 11.5, color: 'var(--text-4)' }} className="fade-in">
              Your inputs are sent to your Groq endpoint and not stored on this server.
            </p>
          )}
        </section>

        {/* ── RIGHT: Results ────────────────────────────────────────── */}
        {hasResults && (
          <section ref={resultsRef} className="slide-up">

            {/* Progress bar */}
            {loading && (
              <div className="card" style={{ padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="spinner" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{loadingPhase}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {questions.length} / 30
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', borderRadius: 999, transition: 'width 0.35s ease' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Header + export */}
            <div className="card" style={{ padding: '18px 22px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 2, letterSpacing: '-0.012em' }}>
                  Your interview questions
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  {questions.length} generated{starred.size > 0 ? ` · ${starred.size} starred` : ''}
                  {!loading && ' · click any card for the answer'}
                </p>
              </div>
              {!loading && <ExportButton questions={questions} starred={starred} />}
            </div>

            {/* Search */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                marginBottom: 12,
              }}
            >
              <span style={{ color: 'var(--text-4)' }}><Icon.Search /></span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search questions, situations, results…  (press / to focus)'
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 13.5, color: 'var(--text)',
                  fontFamily: 'inherit',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="btn btn-ghost" style={{ padding: 5, color: 'var(--text-3)' }}>
                  <Icon.X />
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {FILTER_TABS.map(tab => {
                const active = filter === tab.id
                const isStar = tab.id === 'starred'
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                      background: active ? 'var(--text)' : 'var(--surface)',
                      color: active ? '#FFF' : 'var(--text-2)',
                      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      fontFamily: 'inherit',
                    }}
                  >
                    {isStar && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill={active ? '#FCD34D' : '#F59E0B'} stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    )}
                    {tab.label}
                    {counts[tab.id] > 0 && (
                      <span
                        style={{
                          padding: '0 6px', minWidth: 18, height: 18,
                          background: active ? 'rgba(255,255,255,0.18)' : 'var(--surface-2)',
                          borderRadius: 999, fontSize: 11, fontWeight: 600,
                          color: active ? '#FFF' : 'var(--text-3)',
                          fontVariantNumeric: 'tabular-nums',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {counts[tab.id]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Cards */}
            <div>
              {filtered.length === 0 && !loading && (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)', fontSize: 14 }}>
                  {filter === 'starred'
                    ? 'No starred questions yet — tap the star on any question to save it here.'
                    : search
                    ? `No matches for "${search}".`
                    : 'No questions in this category yet.'}
                </div>
              )}
              {filtered.map((q, i) => (
                <QuestionCard
                  key={q.id} q={q} index={i}
                  starred={starred.has(q.id)}
                  onToggleStar={toggleStar}
                />
              ))}
            </div>

            {/* Done card */}
            {!loading && questions.length === 30 && (
              <div className="card" style={{ padding: 22, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    All 30 questions ready
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    Export full set or just your starred ones.
                  </p>
                </div>
                <ExportButton questions={questions} starred={starred} />
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        style={{
          maxWidth: 1320, margin: '0 auto',
          padding: '0 24px 32px',
          fontSize: 11.5, color: 'var(--text-4)',
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}
      >
        <span>© {new Date().getFullYear()} Interview Coach</span>
        <span>Built with Next.js · Streaming via Groq · Press <kbd style={kbdStyle}>?</kbd> for shortcuts</span>
      </footer>

      {/* ── Shortcuts modal ──────────────────────────────────────────── */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10, 10, 10, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            animation: 'fadeIn 0.18s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card-elevated slide-up-sm"
            style={{ padding: 28, maxWidth: 380, width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Keyboard shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="btn btn-ghost" style={{ padding: 6 }}>
                <Icon.X />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: '/',   desc: 'Focus search' },
                { key: 'a',   desc: 'Show all questions' },
                { key: 's',   desc: 'Show starred only' },
                { key: '?',   desc: 'Toggle this help' },
                { key: 'Esc', desc: 'Close / clear search' },
              ].map(s => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, color: 'var(--text-2)' }}>{s.desc}</span>
                  <kbd style={kbdStyle}>{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  fontSize: 11.5,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  color: 'var(--text-2)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderBottomWidth: 2,
  borderRadius: 5,
  fontWeight: 600,
}
