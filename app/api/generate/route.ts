import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

// ── Client ───────────────────────────────────────────────────────────────────
const apiKey = process.env.GROQ_API_KEY
const client = apiKey ? new Groq({ apiKey }) : null
const MODEL  = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

// ── Types ────────────────────────────────────────────────────────────────────
type Cat  = 'behavioral' | 'technical' | 'system-design' | 'situational'
type Diff = 'easy' | 'medium' | 'hard'
type Mix  = {
  total: number
  categories?: Partial<Record<Cat, number>>
  difficulties?: Partial<Record<Diff, number>>
}

// ── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(jd: string, resume: string, mix: Mix): string {
  const total = mix.total

  const cats = mix.categories
  const catLines = cats
    ? Object.entries(cats)
        .filter(([, n]) => (n ?? 0) > 0)
        .map(([k, n]) => `  • ${n} ${k}`)
        .join('\n')
    : null

  const diffs = mix.difficulties
  const diffLines = diffs
    ? Object.entries(diffs)
        .filter(([, n]) => (n ?? 0) > 0)
        .map(([k, n]) => `  • ${n} ${k}`)
        .join('\n')
    : null

  // Default distribution if user hasn't customized
  const defaultDistribution = `
Default distribution:
  • Q1–Q8   Behavioral
  • Q9–Q13  Company-specific (use the company's known interview style — Amazon LPs by name, Google's Googleyness, Meta's impact, Netflix judgment, Stripe writing/depth, Uber scale, etc. Name the company in whyAsked.)
  • Q14–Q22 Technical deep-dives on the JD's exact stack
  • Q23–Q26 System design relevant to the product
  • Q27–Q30 Situational hypotheticals from the JD's day-to-day`

  const customDistribution = `
CUSTOM DISTRIBUTION (must match exactly):
${catLines  ? `By category:\n${catLines}\n`  : ''}${diffLines ? `By difficulty:\n${diffLines}\n` : ''}
Important: include company-specific behavioral questions if the JD mentions a known company (Amazon LPs, Google Googleyness, etc.) and name the company in whyAsked.`

  const distribution = (catLines || diffLines) ? customDistribution : defaultDistribution

  return `You are a senior interview coach. Generate ${total} personalized interview Q&As as ${total} JSONL lines.

JOB DESCRIPTION:
${jd}

RESUME:
${resume}

INTERNAL ANALYSIS (silent — do NOT output):
- Detect COMPANY NAME from the JD.
- Detect top 3-5 technologies the JD emphasizes.
- Pull from resume: company names, project names, metrics, real tech used.
${distribution}

OUTPUT RULES:
- Exactly ${total} lines, each one valid JSON object on a single line.
- No commentary, no markdown fences. Use \\n for in-string newlines, \\" for inner quotes.
- Do NOT put raw newlines inside string values — always escape as \\n.

JSON SCHEMA (every field required):
{"id":1-${total},"category":"behavioral|technical|system-design|situational","difficulty":"easy|medium|hard","question":"...","situation":"2-3 sentences with company, project, timeline, scope from resume","task":"2-3 sentences: problem, success criteria, constraints","action":"4-6 NUMBERED STEPS separated by \\n. Format each as '1. ...' '2. ...' etc. Each step names the tool/tech used, the trade-off considered, the alternative rejected, and WHY. Include metrics, debugging, edge cases. 150-250 words total.","result":"2-3 sentences with quantified outcomes — %, scale, business impact","whyAsked":"1 sentence. Name the company's specific value/principle if applicable.","tip":"1 sentence of tactical delivery advice."}

PERSONALIZATION:
- Use ACTUAL company names, projects, technologies from the resume
- Include REAL metrics from the resume
- First-person, natural spoken English
- Do not invent resume details

NOW output all ${total} JSONL lines:`
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function extractErrMsg(err: unknown): string {
  if (!err) return 'Unknown error'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any
  const status = e?.status ? `[${e.status}] ` : ''
  const detail =
    e?.error?.error?.message ||
    e?.error?.message ||
    e?.message ||
    (typeof e === 'string' ? e : 'Unknown error')
  return `${status}${detail}`
}

function clampMix(input: unknown): Mix {
  const safe: Mix = { total: 30 }
  if (input && typeof input === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = input as any
    if (m.categories && typeof m.categories === 'object') {
      safe.categories = {
        behavioral:      Math.max(0, Math.min(30, Number(m.categories.behavioral)      || 0)),
        technical:       Math.max(0, Math.min(30, Number(m.categories.technical)       || 0)),
        'system-design': Math.max(0, Math.min(30, Number(m.categories['system-design']) || 0)),
        situational:     Math.max(0, Math.min(30, Number(m.categories.situational)     || 0)),
      }
    }
    if (m.difficulties && typeof m.difficulties === 'object') {
      safe.difficulties = {
        easy:   Math.max(0, Math.min(30, Number(m.difficulties.easy)   || 0)),
        medium: Math.max(0, Math.min(30, Number(m.difficulties.medium) || 0)),
        hard:   Math.max(0, Math.min(30, Number(m.difficulties.hard)   || 0)),
      }
    }
  }
  // Determine total from category counts if provided, else 30
  if (safe.categories) {
    const sum = Object.values(safe.categories).reduce((a, b) => a + (b ?? 0), 0)
    if (sum > 0) safe.total = Math.min(40, sum)
  }
  return safe
}

// ── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!apiKey || !client) {
    return Response.json(
      { error: 'GROQ_API_KEY is missing. Create a .env.local file with: GROQ_API_KEY=gsk_... (get one at https://console.groq.com/keys), then restart `npm run dev`.' },
      { status: 500 }
    )
  }
  if (apiKey.includes('REPLACE_WITH_YOUR_OWN_KEY') || apiKey.length < 20) {
    return Response.json(
      { error: 'GROQ_API_KEY in .env.local is a placeholder. Replace it with a real key from https://console.groq.com/keys, then restart `npm run dev`.' },
      { status: 500 }
    )
  }

  let jd: string, resume: string, mix: Mix
  try {
    const body = await req.json()
    jd     = body.jd?.trim()
    resume = body.resume?.trim()
    mix    = clampMix(body.mix)
    if (!jd || !resume) throw new Error('missing fields')
  } catch {
    return Response.json({ error: 'Request must include jd and resume fields.' }, { status: 400 })
  }

  let completion
  try {
    completion = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.55,
      max_completion_tokens: 6500,
      messages: [
        {
          role: 'system',
          content:
            'You output strictly newline-delimited JSON (JSONL). One JSON object per line. NEVER put raw newlines inside string values — always escape as \\n. No prose, no markdown fences, no commentary.',
        },
        { role: 'user', content: buildPrompt(jd, resume, mix) },
      ],
    })
  } catch (err) {
    const msg = extractErrMsg(err)
    const lower = msg.toLowerCase()
    console.error('[generate] Groq request failed:', msg, err)

    let friendly: string
    if (msg.includes('413') || lower.includes('tokens per minute') || lower.includes('tpm')) {
      friendly =
        'Hit Groq\'s free-tier rate limit (12,000 tokens/minute). Three ways to fix: ' +
        '(1) Wait ~60 seconds and try again, ' +
        '(2) Shorten the JD or résumé, or ' +
        '(3) Switch to a faster small model — set GROQ_MODEL=llama-3.1-8b-instant in .env.local and restart npm run dev (much higher TPM). ' +
        `Original: ${msg}`
    } else if (msg.includes('429') || lower.includes('rate limit')) {
      friendly = `Groq rate-limited the request. Wait a moment and try again. (${msg})`
    } else if (msg.includes('401') || lower.includes('invalid api key')) {
      friendly = `Invalid Groq API key. Double-check GROQ_API_KEY in .env.local and restart the dev server. (${msg})`
    } else if (lower.includes('model') && (lower.includes('not found') || lower.includes('does not exist') || lower.includes('decommissioned'))) {
      friendly = `Model "${MODEL}" not available. Set GROQ_MODEL in .env.local to a valid model (try "llama-3.3-70b-versatile" or "llama-3.1-8b-instant") and restart. (${msg})`
    } else {
      friendly = `Groq request failed: ${msg}`
    }

    return Response.json({ error: friendly }, { status: 500 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let buffer = ''
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content
          if (!delta) continue
          buffer += delta
          const newlineIdx = buffer.lastIndexOf('\n')
          if (newlineIdx !== -1) {
            const complete = buffer.slice(0, newlineIdx + 1)
            buffer = buffer.slice(newlineIdx + 1)
            controller.enqueue(encoder.encode(complete))
          }
        }
        if (buffer.trim()) controller.enqueue(encoder.encode(buffer + '\n'))
        controller.close()
      } catch (err) {
        const msg = extractErrMsg(err)
        console.error('[generate] stream error:', msg, err)
        controller.enqueue(encoder.encode(JSON.stringify({ error: msg }) + '\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      'X-Accel-Buffering': 'no',
    },
  })
}
