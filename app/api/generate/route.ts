import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

// ── Client ───────────────────────────────────────────────────────────────────
const apiKey = process.env.GROQ_API_KEY
const client = apiKey ? new Groq({ apiKey }) : null
const MODEL  = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

// ── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(jd: string, resume: string): string {
  return `You are a senior interview coach. Generate 30 personalized interview Q&As as 30 JSONL lines.

JOB DESCRIPTION:
${jd}

RESUME:
${resume}

INTERNAL ANALYSIS (silent — do NOT output):
- Detect COMPANY NAME from the JD.
- Detect top 3-5 technologies the JD emphasizes.
- Pull from resume: company names, project names, metrics, real tech used.

QUESTION DISTRIBUTION:
Q1–Q8   Behavioral (leadership, conflict, ownership, failure, ambiguity, mentorship, impact, prioritization)
Q9–Q13  COMPANY-SPECIFIC. Use the company's known interview style. Name the company in whyAsked.
        Examples: Amazon → tie to Leadership Principles by name (Customer Obsession, Ownership, Invent and Simplify, Bias for Action, Dive Deep, Have Backbone, Deliver Results). Google → Googleyness, structured problem solving. Meta → impact, move fast. Microsoft → growth mindset. Apple → quality bar. Netflix → judgment, keeper test. Stripe → user obsession, writing. Uber/Lyft → scale.
        If company unknown/startup: lean on JD's stated values and stack.
Q14–Q22 Technical deep-dives on the exact stack in the JD.
Q23–Q26 System design relevant to the product.
Q27–Q30 Situational hypotheticals from the JD's day-to-day.

OUTPUT RULES:
- Exactly 30 lines, each one valid JSON object on a single line.
- No commentary, no markdown fences. Use \\n for in-string newlines, \\" for inner quotes.

JSON SCHEMA (every field required):
{"id":1-30,"category":"behavioral|technical|system-design|situational","difficulty":"easy|medium|hard","question":"...","situation":"2-3 sentences with company, project, timeline, scope from resume","task":"2-3 sentences: problem, success criteria, constraints","action":"4-6 NUMBERED STEPS separated by \\n. Format each as '1. ...' '2. ...' etc. Each step names the tool/tech used, the trade-off considered, the alternative rejected, and WHY. Include metrics, debugging, edge cases. 150-250 words total.","result":"2-3 sentences with quantified outcomes — %, scale, business impact","whyAsked":"1 sentence. Name the company's specific value/principle if applicable.","tip":"1 sentence of tactical delivery advice."}

PERSONALIZATION:
- Use ACTUAL company names, projects, technologies from the resume
- Include REAL metrics from the resume
- First-person, natural spoken English
- Do not invent resume details

NOW output all 30 JSONL lines:`
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

// ── Route Handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!apiKey || !client) {
    return Response.json(
      {
        error:
          'GROQ_API_KEY is missing. Create a .env.local file in the project root with: GROQ_API_KEY=gsk_... (get one at https://console.groq.com/keys), then restart `npm run dev`.',
      },
      { status: 500 }
    )
  }
  if (apiKey.includes('REPLACE_WITH_YOUR_OWN_KEY') || apiKey.length < 20) {
    return Response.json(
      {
        error:
          'GROQ_API_KEY in .env.local is a placeholder. Replace it with a real key from https://console.groq.com/keys, then restart `npm run dev`.',
      },
      { status: 500 }
    )
  }

  let jd: string, resume: string
  try {
    const body = await req.json()
    jd = body.jd?.trim()
    resume = body.resume?.trim()
    if (!jd || !resume) throw new Error('missing fields')
  } catch {
    return Response.json(
      { error: 'Request must include jd and resume fields.' },
      { status: 400 }
    )
  }

  let completion
  try {
    completion = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.55,
      // Sized to fit Groq free-tier 12k TPM cap. Input prompt is ~3-5k tokens,
      // leaving ~6k for the output. Action sections stay rich (4-6 numbered
      // steps avg) but won't blow the per-minute budget.
      max_completion_tokens: 6500,
      messages: [
        {
          role: 'system',
          content:
            'You output strictly newline-delimited JSON (JSONL). No prose, no markdown fences, no commentary — only the requested JSON objects, one per line. The "action" field must be richly detailed (200-350 words), with numbered steps and concrete technical decisions.',
        },
        { role: 'user', content: buildPrompt(jd, resume) },
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
