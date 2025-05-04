'use client'

/**
 * Animated skeleton card shown while questions stream in.
 * Mirrors the rough shape of a real QuestionCard so the layout
 * doesn't jump when real data replaces the placeholder.
 */
export default function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '16px 18px',
        marginBottom: 12,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        opacity: 0.85,
        animation: 'scaleIn 0.4s var(--ease-spring) both',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Number badge */}
      <div
        className="skeleton"
        style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div className="skeleton" style={{ width: 68, height: 18, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 52, height: 18, borderRadius: 999 }} />
        </div>

        {/* Question text — two lines */}
        <div className="skeleton" style={{ width: '92%',  height: 12, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '64%',  height: 12, marginBottom: 10 }} />

        {/* Why-asked italic */}
        <div className="skeleton" style={{ width: '78%', height: 10, opacity: 0.7 }} />
      </div>

      {/* Star + chevron column */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
      </div>
    </div>
  )
}
