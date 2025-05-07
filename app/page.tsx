'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import QuestionCard from '@/components/QuestionCard'
import ExportButton from '@/components/ExportButton'
import SkeletonCard    from '@/components/SkeletonCard'
import HowItWorks      from '@/components/HowItWorks'
import StatsStrip      from '@/components/StatsStrip'
import CompaniesStrip  from '@/components/CompaniesStrip'
import Features        from '@/components/Features'
import FAQ             from '@/components/FAQ'

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

interface SavedResume {
  id:      string
  name:    string
  content: string
  addedAt: number
}

type Cat  = 'behavioral' | 'technical' | 'system-design' | 'situational'
type Diff = 'easy' | 'medium' | 'hard'

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

const STARRED_KEY  = 'interview-coach.starred.v1'
const RESUMES_KEY  = 'interview-coach.resumes.v1'

const DEFAULT_CATEGORIES: Record<Cat, number> = {
  behavioral: 8, technical: 9, 'system-design': 4, situational: 4,
}
const DEFAULT_DIFFICULTIES: Record<Diff, number> = {
  easy: 5, medium: 14, hard: 6,
}

// ── Sample data (used by the "Try with sample" button) ──────────────────────
const SAMPLE_JD = `Senior Software Engineer — Payments Platform
About Stripe
Stripe builds economic infrastructure for the internet. We are looking for a Senior Software Engineer to join our Payments Platform team, owning critical services that move billions of dollars annually.

Responsibilities
• Design and ship high-throughput, low-latency services in Java and Go
• Lead architectural decisions for payment authorization, capture, and settlement flows
• Partner with product, design, and risk teams to deliver features end-to-end
• Mentor mid-level engineers and raise the team's quality bar
• Own production reliability — be on-call and drive incident postmortems

Requirements
• 5+ years of backend experience at scale
• Deep expertise in distributed systems (Kafka, gRPC, PostgreSQL)
• Strong fundamentals in API design, idempotency, and eventual consistency
• Experience with financial systems or regulated environments is a plus
• Excellent written and verbal communication`

const SAMPLE_RESUME = `Mohith Reddy Pune — Full-Stack Software Engineer
3+ years building scalable enterprise applications

EXPERIENCE
Software Engineer — Morgan Stanley (2022–Present)
• Led migration of legacy SOAP services to Spring Boot REST, reducing p99 latency by 42% (450ms → 260ms)
• Designed Kafka-based event pipeline handling 1.6M transactions/day with 99.97% delivery SLA
• Mentored 3 junior engineers; introduced code review rubric adopted across the team of 12

Software Developer — Infosys (2021–2022)
• Built React/Angular dashboards for a Fortune-500 retail client serving 280k daily active users
• Cut bundle size 38% via code-splitting and dynamic imports, dropping TTI from 4.1s to 2.4s
• Wrote integration tests in Jest + Cypress, raising coverage from 41% to 78%

PROJECTS
Interview Coach (2024) — AI-personalized interview prep tool. Next.js, Groq Llama 3.3, streaming JSONL.

SKILLS
Java, Spring Boot, Go, Kafka, PostgreSQL, React, Angular, TypeScript, AWS (EC2, S3, Lambda), Docker, Kubernetes, Jenkins`

// ── PWA install ──────────────────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// ── Inline icons ─────────────────────────────────────────────────────────────
const Icon = {
  Logo: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/></svg>),
  Sparkle: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>),
  Upload: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>),
  Check: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  Alert: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>),
  Search: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  Download: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  Keyboard: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="10"/><line x1="10" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="14" y2="10"/><line x1="18" y1="10" x2="18" y2="10"/><line x1="6" y1="14" x2="18" y2="14"/></svg>),
  X: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Plus: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  Trash: () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
  Sliders: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>),
  Chevron: ({ rotated }: { rotated: boolean }) => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: rotated ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>),
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
const numInputStyle: React.CSSProperties = {
  width: 56, padding: '5px 8px',
  border: '1px solid var(--border)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--text)',
  fontSize: 13, fontVariantNumeric: 'tabular-nums', textAlign: 'center',
  fontFamily: 'inherit',
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
  const [scrolled, setScrolled] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  // Saved résumés
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null)
  const [showSaveInput, setShowSaveInput]   = useState(false)
  const [saveName,      setSaveName]        = useState('')
  const [showResumeManager, setShowResumeManager] = useState(false)

  // Customize mix
  const [customizing,    setCustomizing]    = useState(false)
  const [categoryCounts, setCategoryCounts] = useState<Record<Cat, number>>(DEFAULT_CATEGORIES)
  const [difficultyCounts, setDifficultyCounts] = useState<Record<Diff, number>>(DEFAULT_DIFFICULTIES)

  const fileRef    = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  // ── localStorage hydrate ────────────────────────────────────────────
  // Hydration must complete BEFORE save effects run, otherwise React's
  // initial render writes the empty default arrays back over the stored data.
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(STARRED_KEY)
      if (s) setStarred(new Set(JSON.parse(s)))
      const r = localStorage.getItem(RESUMES_KEY)
      if (r) {
        const parsed = JSON.parse(r)
        if (Array.isArray(parsed)) setSavedResumes(parsed)
      }
    } catch { /* noop */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(starred))) } catch {}
  }, [starred, hydrated])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(RESUMES_KEY, JSON.stringify(savedResumes)) } catch {}
  }, [savedResumes, hydrated])

  // ── PWA install ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e as BeforeInstallPromptEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // ── Scroll listener for the floating "back to top" button ──────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
  }

  // Scroll to results when first arrives
  useEffect(() => {
    if (questions.length === 1 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [questions.length])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const inField = tag === 'INPUT' || tag === 'TEXTAREA'
      if (e.key === 'Escape') {
        if (showShortcuts)        { setShowShortcuts(false); return }
        if (showResumeManager)    { setShowResumeManager(false); return }
        if (search)               { setSearch(''); return }
      }
      if (inField) return
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(s => !s) }
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus() }
      if (e.key.toLowerCase() === 'a') setFilter('all')
      if (e.key.toLowerCase() === 's') setFilter('starred')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [search, showShortcuts, showResumeManager])

  const toggleStar = useCallback((id: number) => {
    setStarred(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  // ── Toast ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'info' } | null>(null)
  const showToast = (msg: string, kind: 'success' | 'info' = 'success') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 2400)
  }

  // ── Try with sample data ───────────────────────────────────────────
  const fillSample = () => {
    setJd(SAMPLE_JD)
    setResume(SAMPLE_RESUME)
    setActiveResumeId(null)
    setInputTab('paste')
    setError('')
    showToast('Sample data loaded — click Generate', 'info')
  }

  // ── Saved résumés ───────────────────────────────────────────────────
  const handleSaveResume = () => {
    const name = (saveName.trim() || `Résumé ${savedResumes.length + 1}`).slice(0, 60)
    const id = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
    const next: SavedResume = { id, name, content: resume, addedAt: Date.now() }
    setSavedResumes(prev => [next, ...prev])
    setActiveResumeId(id)
    setShowSaveInput(false)
    setSaveName('')
    showToast(`Saved "${name}"`)
  }

  const handleSelectSaved = (id: string) => {
    const r = savedResumes.find(x => x.id === id)
    if (!r) return
    setResume(r.content)
    setActiveResumeId(id)
    setInputTab('paste')
    showToast(`Loaded "${r.name}"`, 'info')
  }

  const handleDeleteSaved = (id: string) => {
    const r = savedResumes.find(x => x.id === id)
    setSavedResumes(prev => prev.filter(x => x.id !== id))
    if (activeResumeId === id) setActiveResumeId(null)
    if (r) showToast(`Deleted "${r.name}"`, 'info')
  }

  // ── PDF upload ──────────────────────────────────────────────────────
  const handlePdfFile = async (file: File) => {
    if (!file.name.endsWith('.pdf')) { setError('Please upload a .pdf file.'); return }
    setError('')
    setPdfLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/parse-pdf', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'PDF parse failed')
      setResume(json.text)
      setActiveResumeId(null)
      setInputTab('paste')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF upload failed.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ── Generate ────────────────────────────────────────────────────────
  const totalRequested = useMemo(() => {
    if (!customizing) return 30
    return Object.values(categoryCounts).reduce((a, b) => a + (b || 0), 0)
  }, [customizing, categoryCounts])

  const generate = useCallback(async () => {
    if (!jd.trim())     { setError('Please paste a job description.'); return }
    if (!resume.trim()) { setError('Please add your résumé.'); return }
    if (customizing && totalRequested === 0) {
      setError('Customize: at least one category must be > 0.')
      return
    }

    setError('')
    setLoading(true)
    setQuestions([])
    setFilter('all')
    setLoadingPhase('Analyzing job requirements')

    const mix = customizing ? {
      categories:   categoryCounts,
      difficulties: difficultyCounts,
    } : undefined

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd: jd.trim(), resume: resume.trim(), mix }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || `Server error ${res.status}`)
      }

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let count  = 0
      const seen = new Set<number>()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          // Try parse — silently skip malformed lines (some models leak raw \n
          // mid-string and the line splits awkwardly)
          let parsed: Record<string, unknown> | null = null
          try { parsed = JSON.parse(trimmed) } catch { continue }
          if (!parsed) continue

          if (typeof parsed.error === 'string') {
            throw new Error(parsed.error)
          }

          const q = parsed as unknown as Question
          if (q && q.question && typeof q.id === 'number' && !seen.has(q.id)) {
            seen.add(q.id)
            count++
            setLoadingPhase(`Generating question ${count} of ${totalRequested}`)
            setQuestions(prev => [...prev, q])
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
  }, [jd, resume, customizing, categoryCounts, difficultyCounts, totalRequested])

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

  const progress    = totalRequested > 0 ? Math.round((questions.length / totalRequested) * 100) : 0
  const hasResults  = questions.length > 0
  const wordCount   = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

  const catTotal  = Object.values(categoryCounts).reduce((a, b) => a + (b || 0), 0)
  const diffTotal = Object.values(difficultyCounts).reduce((a, b) => a + (b || 0), 0)

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header
        style={{
          padding: '0 24px', height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(250, 250, 247, 0.78)',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <a
          href="/"
          onClick={e => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            textDecoration: 'none',
            padding: '6px 8px',
            margin: '-6px -8px',
            borderRadius: 10,
            transition: 'background 0.15s var(--ease-out), transform 0.15s var(--ease-out)',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          aria-label="Home"
        >
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #1F1F22 0%, #0A0A0A 100%)',
            color: '#FFF',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 0.5px 0 rgba(255,255,255,0.16), 0 1px 2px rgba(0,0,0,0.15)',
          }}>
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
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {installPrompt && (
            <button onClick={handleInstall} className="btn btn-secondary" style={{ fontSize: 12.5, padding: '7px 12px' }}>
              <Icon.Download /><span>Install app</span>
            </button>
          )}
          <button onClick={() => setShowShortcuts(true)} className="btn btn-ghost" title="Keyboard shortcuts (?)" style={{ fontSize: 12.5, padding: '7px 10px' }}>
            <Icon.Keyboard />
          </button>
        </div>
      </header>

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <main
        style={{
          maxWidth: 1320, margin: '0 auto',
          padding: hasResults ? '32px 24px 96px' : '20px 24px 96px',
          display: 'grid',
          gridTemplateColumns: hasResults ? 'minmax(380px, 460px) 1fr' : '1fr',
          gap: 32, alignItems: 'start',
          transition: 'grid-template-columns 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* ── LEFT: Input panel ───────────────────────────────────── */}
        <section style={{ position: hasResults ? 'sticky' : 'static', top: 88 }}>

          {!hasResults && (
            <div style={{ textAlign: 'center', padding: '52px 8px 36px' }} className="fade-in">
              <span className="pill slide-up-sm" style={{ marginBottom: 24, padding: '5px 12px', color: 'var(--text-2)' }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                Live · {totalRequested} questions in seconds
              </span>
              <h1 className="slide-up aurora-text" style={{ fontSize: 'clamp(36px, 5vw, 50px)', fontWeight: 600, lineHeight: 1.06, letterSpacing: '-0.035em', marginBottom: 18 }}>
                Interview prep,{' '}
                <span className="serif" style={{ fontStyle: 'italic', fontWeight: 400 }}>written from</span>
                <br />
                your actual experience.
              </h1>
              <p className="slide-up" style={{ color: 'var(--text-3)', fontSize: 15.5, maxWidth: 520, margin: '0 auto', lineHeight: 1.6, animationDelay: '0.05s' }}>
                Drop in a job description and your résumé. Get role-specific questions and STAR answers from the work you&apos;ve actually done.
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

            {/* JD */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Job description</label>
              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                placeholder="Paste the full posting — role, responsibilities, requirements, tech stack…"
                rows={7}
                style={textareaStyle}
              />
              <div style={{ fontSize: 11.5, color: 'var(--text-4)', marginTop: 6, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {wordCount(jd)} words
              </div>
            </div>

            {/* Résumé */}
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

              {/* Saved résumés dropdown */}
              {savedResumes.length > 0 && (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 500 }}>Saved:</span>
                  <select
                    value={activeResumeId ?? ''}
                    onChange={e => {
                      if (e.target.value) handleSelectSaved(e.target.value)
                      else { setResume(''); setActiveResumeId(null) }
                    }}
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      fontSize: 13, color: 'var(--text)', fontFamily: 'inherit',
                      cursor: 'pointer', outline: 'none',
                    }}
                  >
                    <option value="">— choose a saved résumé —</option>
                    {savedResumes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setShowResumeManager(true)}
                    className="btn btn-ghost"
                    style={{ fontSize: 11.5, padding: '4px 8px' }}
                  >
                    Manage
                  </button>
                </div>
              )}

              {inputTab === 'paste' ? (
                <>
                  <textarea
                    value={resume}
                    onChange={e => { setResume(e.target.value); setActiveResumeId(null) }}
                    placeholder="Paste your full résumé — or pick a saved one above."
                    rows={9}
                    style={textareaStyle}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    {/* Save action */}
                    {resume.trim() && !activeResumeId && (
                      showSaveInput ? (
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <input
                            autoFocus
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveResume() }}
                            placeholder="Name (e.g. SWE Resume v3)"
                            style={{
                              padding: '5px 10px', fontSize: 12,
                              border: '1px solid var(--border)', borderRadius: 6,
                              background: 'var(--surface)', fontFamily: 'inherit',
                              outline: 'none', width: 180,
                            }}
                          />
                          <button onClick={handleSaveResume} className="btn btn-primary" style={{ fontSize: 12, padding: '5px 10px' }}>
                            Save
                          </button>
                          <button onClick={() => { setShowSaveInput(false); setSaveName('') }} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 8px' }}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowSaveInput(true)} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 8px', color: 'var(--brand)' }}>
                          <Icon.Plus /> Save this résumé
                        </button>
                      )
                    )}
                    {activeResumeId && (
                      <span style={{ fontSize: 11.5, color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon.Check /> Using saved résumé
                      </span>
                    )}
                    <span style={{ fontSize: 11.5, color: 'var(--text-4)', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                      {wordCount(resume)} words
                    </span>
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
                    borderRadius: 'var(--r-lg)', padding: '34px 20px',
                    textAlign: 'center', cursor: 'pointer',
                    background: dragOver ? 'var(--brand-soft)' : 'var(--surface-2)',
                    transition: 'all 0.18s',
                  }}
                >
                  <input
                    ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
                    onChange={e => { const file = e.target.files?.[0]; if (file) handlePdfFile(file) }}
                  />
                  {pdfLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                      <div className="spinner" /><span style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Extracting text…</span>
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

            {/* Customize question mix */}
            <div style={{ marginBottom: 18, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setCustomizing(c => !c)}
                style={{
                  width: '100%', padding: '11px 14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: customizing ? 'var(--surface-2)' : 'var(--surface)',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                  <Icon.Sliders />
                  Customize question mix
                  {customizing && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', fontWeight: 400 }}>
                      · {catTotal} questions
                    </span>
                  )}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {!customizing && (
                    <span style={{ fontSize: 11.5, color: 'var(--text-4)' }}>random mix · 30 questions</span>
                  )}
                  <span style={{ color: 'var(--text-3)' }}><Icon.Chevron rotated={customizing} /></span>
                </span>
              </button>

              {customizing && (
                <div style={{ padding: '14px 16px 16px', borderTop: '1px solid var(--border)' }} className="slide-up-sm">

                  {/* Categories */}
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                      By category
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 8, alignItems: 'center' }}>
                      {(Object.keys(DEFAULT_CATEGORIES) as Cat[]).map(cat => (
                        <CountRow
                          key={cat}
                          label={cat === 'system-design' ? 'System Design' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                          value={categoryCounts[cat]}
                          onChange={n => setCategoryCounts(prev => ({ ...prev, [cat]: n }))}
                        />
                      ))}
                      <div style={{ fontSize: 12, color: 'var(--text-3)', paddingTop: 6 }}>Total</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: catTotal === 0 ? 'var(--danger)' : 'var(--text)', paddingTop: 6, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                        {catTotal}
                      </div>
                    </div>
                  </div>

                  {/* Difficulties */}
                  <div>
                    <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                      By difficulty
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 8, alignItems: 'center' }}>
                      {(['easy', 'medium', 'hard'] as Diff[]).map(d => (
                        <CountRow
                          key={d}
                          label={d.charAt(0).toUpperCase() + d.slice(1)}
                          value={difficultyCounts[d]}
                          onChange={n => setDifficultyCounts(prev => ({ ...prev, [d]: n }))}
                        />
                      ))}
                      <div style={{ fontSize: 12, color: 'var(--text-3)', paddingTop: 6 }}>Total</div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', paddingTop: 6, fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                        {diffTotal}
                      </div>
                    </div>
                  </div>

                  {/* Reset */}
                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                      Difficulty totals don&apos;t need to match — they&apos;re a hint to the model.
                    </span>
                    <button
                      onClick={() => { setCategoryCounts(DEFAULT_CATEGORIES); setDifficultyCounts(DEFAULT_DIFFICULTIES) }}
                      className="btn btn-ghost"
                      style={{ fontSize: 11.5, padding: '5px 8px' }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="slide-up-sm" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 14, fontSize: 12.5, color: '#991B1B', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
                <><Icon.Sparkle /><span>Generate {totalRequested} questions</span></>
              )}
            </button>

            {!hasResults && (
              <>
                {/* Try with sample */}
                <div
                  style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    background: 'linear-gradient(180deg, var(--brand-soft) 0%, rgba(238, 242, 255, 0.5) 100%)',
                    border: '1px solid #C7D2FE',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: '#3730A3', marginBottom: 1 }}>
                      First time?
                    </p>
                    <p style={{ fontSize: 11.5, color: '#4338CA' }}>
                      Load a Stripe JD + sample résumé to see how it works.
                    </p>
                  </div>
                  <button
                    onClick={fillSample}
                    className="btn"
                    style={{
                      background: '#FFFFFF',
                      color: 'var(--brand)',
                      border: '1px solid #C7D2FE',
                      fontSize: 12, padding: '6px 12px', fontWeight: 600,
                      boxShadow: 'var(--shadow-xs)',
                      flexShrink: 0,
                    }}
                  >
                    Try sample
                  </button>
                </div>

                <div style={{ marginTop: 14, padding: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>For best results</p>
                  <ul style={{ paddingLeft: 16, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.7 }}>
                    <li>Paste the <strong style={{ color: 'var(--text)' }}>full</strong> JD — not just the title</li>
                    <li>Include <strong style={{ color: 'var(--text)' }}>metrics</strong> in your résumé</li>
                    <li>List specific <strong style={{ color: 'var(--text)' }}>technologies</strong> per role</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {!hasResults && (
            <p style={{ marginTop: 16, textAlign: 'center', fontSize: 11.5, color: 'var(--text-4)' }} className="fade-in">
              Saved résumés stay on this device only — never sent anywhere except to generate.
            </p>
          )}
        </section>

        {/* ── RIGHT: Results ────────────────────────────────────────── */}
        {hasResults && (
          <section ref={resultsRef} className="slide-up">
            {loading && (
              <div className="card" style={{ padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="spinner" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{loadingPhase}</span>
                    <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {questions.length} / {totalRequested}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--brand)', borderRadius: 999, transition: 'width 0.35s ease' }} />
                  </div>
                </div>
              </div>
            )}

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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 12 }}>
              <span style={{ color: 'var(--text-4)' }}><Icon.Search /></span>
              <input
                ref={searchRef} type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Search questions, situations, results…  (press / to focus)'
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13.5, color: 'var(--text)', fontFamily: 'inherit' }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="btn btn-ghost" style={{ padding: 5, color: 'var(--text-3)' }}>
                  <Icon.X />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {FILTER_TABS.map(tab => {
                const active = filter === tab.id
                const isStar = tab.id === 'starred'
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    style={{
                      padding: '6px 12px', borderRadius: 999,
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
                      <span style={{ padding: '0 6px', minWidth: 18, height: 18, background: active ? 'rgba(255,255,255,0.18)' : 'var(--surface-2)', borderRadius: 999, fontSize: 11, fontWeight: 600, color: active ? '#FFF' : 'var(--text-3)', fontVariantNumeric: 'tabular-nums', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {counts[tab.id]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

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
                <QuestionCard key={q.id} q={q} index={i} starred={starred.has(q.id)} onToggleStar={toggleStar} />
              ))}

              {/* Skeleton placeholders for remaining questions while streaming */}
              {loading && filter === 'all' && !search && (
                <>
                  {Array.from({ length: Math.max(0, Math.min(6, totalRequested - questions.length)) }).map((_, i) => (
                    <SkeletonCard key={`sk-${i}`} delay={i * 60} />
                  ))}
                </>
              )}
            </div>

            {!loading && questions.length >= totalRequested && (
              <div className="card" style={{ padding: 22, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    All {questions.length} questions ready
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

      {/* Landing-state sections (hidden once questions appear) */}
      {!hasResults && (
        <>
          <StatsStrip />
          <CompaniesStrip />
          <HowItWorks />
          <Features />
          <FAQ />
        </>
      )}

      <footer style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px 32px', fontSize: 11.5, color: 'var(--text-4)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>© {new Date().getFullYear()} Interview Coach</span>
        <span>Press <kbd style={kbdStyle}>?</kbd> for keyboard shortcuts</span>
      </footer>

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card-elevated slide-up-sm" style={{ padding: 28, maxWidth: 380, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Keyboard shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="btn btn-ghost" style={{ padding: 6 }}><Icon.X /></button>
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

      {/* Resume manager modal */}
      {showResumeManager && (
        <div onClick={() => setShowResumeManager(false)} style={modalBackdropStyle}>
          <div onClick={e => e.stopPropagation()} className="card-elevated slide-up-sm" style={{ padding: 28, maxWidth: 480, width: '100%', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Saved résumés</h3>
              <button onClick={() => setShowResumeManager(false)} className="btn btn-ghost" style={{ padding: 6 }}><Icon.X /></button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 16 }}>
              Stored on this device. Pick to load it as your résumé.
            </p>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savedResumes.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>
                  No saved résumés yet.
                </p>
              ) : (
                savedResumes.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: r.id === activeResumeId ? 'var(--brand-soft)' : 'var(--surface-2)' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.name}
                      </p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                        {wordCount(r.content)} words · saved {new Date(r.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => { handleSelectSaved(r.id); setShowResumeManager(false) }}
                        className="btn btn-secondary"
                        style={{ fontSize: 11.5, padding: '5px 10px' }}
                      >
                        {r.id === activeResumeId ? 'In use' : 'Use'}
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(r.id)}
                        className="btn btn-ghost"
                        style={{ fontSize: 11.5, padding: '5px 8px', color: 'var(--danger)' }}
                        title="Delete"
                      >
                        <Icon.Trash />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll-to-top floating button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        title="Back to top"
        style={{
          position: 'fixed',
          right: 22,
          bottom: 22,
          zIndex: 90,
          width: 42, height: 42,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
          color: 'var(--text-2)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
          pointerEvents: scrolled ? 'auto' : 'none',
          transition: 'opacity 0.25s var(--ease-out), transform 0.25s var(--ease-spring), background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"/>
          <polyline points="5 12 12 5 19 12"/>
        </svg>
      </button>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            padding: '10px 16px',
            background: toast.kind === 'success' ? '#0F172A' : '#1E293B',
            color: '#FFFFFF',
            borderRadius: 999,
            boxShadow: '0 14px 32px -8px rgba(15,23,42,0.35), 0 4px 12px -2px rgba(15,23,42,0.20)',
            fontSize: 13,
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            animation: 'toastIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: toast.kind === 'success' ? 'var(--success)' : 'var(--brand)',
            color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.Check />
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────
function CountRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label="Decrease"
          style={stepBtn}
        >−</button>
        <input
          type="number"
          min={0}
          max={30}
          value={value}
          onChange={e => onChange(Math.max(0, Math.min(30, parseInt(e.target.value || '0', 10))))}
          style={numInputStyle}
        />
        <button
          onClick={() => onChange(Math.min(30, value + 1))}
          aria-label="Increase"
          style={stepBtn}
        >+</button>
      </div>
    </>
  )
}

const stepBtn: React.CSSProperties = {
  width: 24, height: 24, borderRadius: 6,
  border: '1px solid var(--border)', background: 'var(--surface)',
  color: 'var(--text-2)', cursor: 'pointer', fontSize: 14,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', userSelect: 'none', transition: 'background 0.15s, border-color 0.15s',
}

const kbdStyle: React.CSSProperties = {
  display: 'inline-block', padding: '2px 8px', fontSize: 11.5,
  fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  color: 'var(--text-2)', background: 'var(--surface)',
  border: '1px solid var(--border)', borderBottomWidth: 2,
  borderRadius: 5, fontWeight: 600,
}

const modalBackdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(10, 10, 10, 0.45)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: 20,
  animation: 'fadeIn 0.18s ease',
}
