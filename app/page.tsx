'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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
type Filter   = 'all' | 'behavioral' | 'technical' | 'system-design' | 'situational'

const FILTER_TABS: { id: Filter; label: string }[] = [
  { id: 'all',           label: 'All' },
  { id: 'behavioral',    label: 'Behavioral' },
  { id: 'technical',     label: 'Technical' },
  { id: 'system-design', label: 'System Design' },
  { id: 'situational',   label: 'Situational' },
]

// ── Inline icons (no emoji in chrome) ────────────────────────────────────────
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
}

// ── Style helpers ────────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 500,
  color: 'var(--text-2)',
  letterSpacing: '-0.005em',
  marginBottom: 8,
  display: 'block',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text)',
  fontSize: 13.5,
  lineHeight: 1.6,
  fontFamily: 'inherit',
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
  const fileRef    = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Scroll to results when first question arrives
  useEffect(() => {
    if (questions.length === 1 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [questions.length])

  // ── PDF upload ─────────────────────────────────────────────────────────
  const handlePdfFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) {
      setError('Please upload a .pdf file.')
      return
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
      setError(err instanceof Error ? err.message : 'PDF upload failed. Please paste your resume as text.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Main generation ────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!jd.trim())     { setError('Please paste a job description.'); return }
    if (!resume.trim()) { setError('Please add your resume (paste or PDF upload).'); return }

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
      let buffer    = ''
      let count     = 0

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
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') {
              throw parseErr
            }
          }
        }
      }

      setLoadingPhase('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setLoadingPhase('')
    }
  }, [jd, resume])

  // ── Derived state ──────────────────────────────────────────────────────
  const filtered = filter === 'all'
    ? questions
    : questions.filter(q => q.category === filter)

  const counts: Record<string, number> = {
    all:             questions.length,
    behavioral:      questions.filter(q => q.category === 'behavioral').length,
    technical:       questions.filter(q => q.category === 'technical').length,
    'system-design': questions.filter(q => q.category === 'system-design').length,
    situational:     questions.filter(q => q.category === 'situational').length,
  }

  const progress   = Math.round((questions.length / 30) * 100)
  const hasResults = questions.length > 0
  const wordCount  = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header
        style={{
          padding: '0 32px',
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
              background: 'var(--text)',
              color: '#FFF',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pill" style={{ color: 'var(--text-3)' }}>
            <Icon.Bolt />
            <span style={{ marginLeft: 1 }}>Powered by Groq</span>
          </span>
        </div>
      </header>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: hasResults ? '36px 28px 96px' : '20px 28px 96px',
          display: 'grid',
          gridTemplateColumns: hasResults ? 'minmax(380px, 440px) 1fr' : '1fr',
          gap: 36,
          alignItems: 'start',
          transition: 'grid-template-columns 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* ── LEFT: Input panel ─────────────────────────────────────────── */}
        <section style={{ position: 'sticky', top: 88 }}>

          {/* Hero (only when no results yet) */}
          {!hasResults && (
            <div style={{ textAlign: 'center', padding: '64px 8px 40px' }} className="fade-in">
              <span
                className="pill slide-up-sm"
                style={{
                  marginBottom: 28,
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
                  fontSize: 'clamp(40px, 5.6vw, 56px)',
                  fontWeight: 600,
                  lineHeight: 1.04,
                  letterSpacing: '-0.035em',
                  marginBottom: 20,
                  color: 'var(--text)',
                }}
              >
                Interview prep,{' '}
                <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400, color: 'var(--text)' }}>
                  written from
                </span>
                <br />
                your <span className="shimmer">actual experience</span>.
              </h1>

              <p
                className="slide-up"
                style={{
                  color: 'var(--text-3)',
                  fontSize: 16,
                  maxWidth: 520,
                  margin: '0 auto',
                  lineHeight: 1.6,
                  animationDelay: '0.05s',
                }}
              >
                Drop in a job description and your résumé. We generate 30 role-specific questions and write each STAR answer from the work you&apos;ve actually done.
              </p>
            </div>
          )}

          {/* Input card */}
          <div
            className="card-elevated slide-up"
            style={{
              padding: 24,
              animationDelay: hasResults ? '0s' : '0.1s',
            }}
          >
            {hasResults && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.005em' }}>
                  Inputs
                </h2>
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
              <div
                style={{
                  fontSize: 11.5, color: 'var(--text-4)', marginTop: 6,
                  textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                }}
              >
                {wordCount(jd)} words
              </div>
            </div>

            {/* Resume — tabs: Paste | PDF */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: 8,
                }}
              >
                <label style={{ ...labelStyle, marginBottom: 0 }}>Your résumé</label>
                <div
                  style={{
                    display: 'inline-flex', gap: 2, padding: 3,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                >
                  {(['paste', 'pdf'] as InputTab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setInputTab(tab)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: 'none',
                        background: inputTab === tab ? 'var(--surface)' : 'transparent',
                        color: inputTab === tab ? 'var(--text)' : 'var(--text-3)',
                        boxShadow: inputTab === tab ? 'var(--shadow-xs)' : 'none',
                        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
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
                  <div
                    style={{
                      fontSize: 11.5, color: 'var(--text-4)', marginTop: 6,
                      textAlign: 'right', fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {wordCount(resume)} words
                  </div>
                </>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setDragOver(false)
                    const file = e.dataTransfer.files[0]
                    if (file) handlePdfFile(file)
                  }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${dragOver ? 'var(--brand)' : 'var(--border-2)'}`,
                    borderRadius: 'var(--r-lg)',
                    padding: '34px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'var(--brand-soft)' : 'var(--surface-2)',
                    transition: 'all 0.18s',
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
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
                      <div
                        style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: 'rgba(5, 150, 105, 0.10)',
                          color: 'var(--success)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <Icon.Check />
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: 13.5, fontWeight: 500 }}>
                        Résumé extracted
                      </p>
                      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 3 }}>
                        {wordCount(resume)} words · click to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-2)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          marginBottom: 12,
                          boxShadow: 'var(--shadow-xs)',
                        }}
                      >
                        <Icon.Upload />
                      </div>
                      <p style={{ color: 'var(--text)', fontSize: 13.5, fontWeight: 500 }}>
                        Drop your résumé PDF
                      </p>
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
                  padding: '10px 12px',
                  marginBottom: 14,
                  fontSize: 12.5,
                  color: '#991B1B',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <span style={{ color: 'var(--danger)', marginTop: 2 }}><Icon.Alert /></span>
                <span style={{ lineHeight: 1.55 }}>{error}</span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={loading || pdfLoading}
              className="btn btn-brand"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {loading ? (
                <>
                  <div className="spinner on-brand" />
                  <span>Generating…</span>
                </>
              ) : (
                <>
                  <Icon.Sparkle />
                  <span>Generate 30 questions</span>
                </>
              )}
            </button>

            {/* Tips */}
            {!hasResults && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                }}
              >
                <p
                  style={{
                    fontSize: 11.5, fontWeight: 600, color: 'var(--text)',
                    marginBottom: 10, letterSpacing: 0,
                  }}
                >
                  For best results
                </p>
                <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.75 }}>
                  <li>Paste the <strong style={{ color: 'var(--text)' }}>full</strong> JD — not just the title</li>
                  <li>Include <strong style={{ color: 'var(--text)' }}>metrics</strong> in your résumé (latency %, scale, team size)</li>
                  <li>List specific <strong style={{ color: 'var(--text)' }}>technologies</strong> per role (Java, Kafka, AWS…)</li>
                  <li>Include <strong style={{ color: 'var(--text)' }}>project names</strong> and quantified outcomes</li>
                </ul>
              </div>
            )}
          </div>

          {!hasResults && (
            <p
              style={{
                marginTop: 18, textAlign: 'center',
                fontSize: 11.5, color: 'var(--text-4)',
              }}
              className="fade-in"
            >
              Your inputs are sent to your Groq endpoint and not stored on this server.
            </p>
          )}
        </section>

        {/* ── RIGHT: Results panel ──────────────────────────────────────── */}
        {hasResults && (
          <section ref={resultsRef} className="slide-up">

            {/* Progress bar (while still loading) */}
            {loading && (
              <div
                className="card"
                style={{
                  padding: '14px 18px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div className="spinner" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 7,
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {loadingPhase}
                      <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', marginLeft: 1 }}>
                        <span className="dot" /><span className="dot" /><span className="dot" />
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 12.5, color: 'var(--text)',
                        fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {questions.length} / 30
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      background: 'var(--surface-3)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: 'var(--brand)',
                        borderRadius: 999,
                        transition: 'width 0.35s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results header */}
            <div
              className="card"
              style={{
                padding: '18px 22px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: 2,
                    letterSpacing: '-0.012em',
                  }}
                >
                  Your interview questions
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  {questions.length} question{questions.length !== 1 ? 's' : ''} generated
                  {!loading && ' · click any card to reveal the STAR answer'}
                </p>
              </div>
              {!loading && <ExportButton questions={questions} />}
            </div>

            {/* Filter tabs */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              {FILTER_TABS.map(tab => {
                const active = filter === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--text)' : 'var(--border)'}`,
                      background: active ? 'var(--text)' : 'var(--surface)',
                      color: active ? '#FFFFFF' : 'var(--text-2)',
                      transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      fontFamily: 'inherit',
                    }}
                  >
                    {tab.label}
                    {counts[tab.id] > 0 && (
                      <span
                        style={{
                          padding: '0 6px',
                          minWidth: 18,
                          height: 18,
                          background: active ? 'rgba(255,255,255,0.18)' : 'var(--surface-2)',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          color: active ? '#FFFFFF' : 'var(--text-3)',
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

            {/* Question cards */}
            <div>
              {filtered.length === 0 && !loading && (
                <div
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-3)',
                    fontSize: 14,
                  }}
                >
                  No questions in this category yet.
                </div>
              )}
              {filtered.map((q, i) => (
                <QuestionCard key={q.id} q={q} index={i} />
              ))}
            </div>

            {/* Footer export (bottom of results) */}
            {!loading && questions.length === 30 && (
              <div
                className="card"
                style={{
                  padding: 22,
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    All 30 questions ready
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                    Export as Markdown to study in Notion or any editor.
                  </p>
                </div>
                <ExportButton questions={questions} />
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 28px 32px',
          fontSize: 11.5,
          color: 'var(--text-4)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span>© {new Date().getFullYear()} Interview Coach</span>
        <span>Built with Next.js · Streaming via Groq</span>
      </footer>
    </div>
  )
}
