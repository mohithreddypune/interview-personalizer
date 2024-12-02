import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

// ── Client ───────────────────────────────────────────────────────────────────
// Groq exposes an OpenAI-compatible chat-completions API. The official
// `groq-sdk` mirrors the OpenAI SDK shape, so streaming works the same way.
const apiKey = process.env.GROQ_API_KEY

const client = apiKey ? new Groq({ apiKey }) : null

// Default to Llama 3.3 70B (versatile) — strong quality + Groq's signature
// low-latency token streaming. Override via GROQ_MODEL in .env.local.
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

// ── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(jd: string, resume: string): string {
  return `You are an elite technical interview coach with 15+ years of experience at top tech companies. Analyze the job description and candidate resume below, then generate exactly 30 highly personalized interview questions with model STAR answers drawn from the candidate's REAL experience.

═══════════════════════════════════════════════════
JOB DESCRIPTION:
${jd}

═══════════════════════════════════════════════════
CANDIDATE RESUME:
${resume}

═══════════════════════════════════════════════════
OUTPUT FORMAT — CRITICAL RULES:
1. Output EXACTLY 30 lines. Each line is one complete, valid JSON object.
2. NO other text before, between, or after the JSON lines. No markdown fences. No commentary.
3. Every string value must be properly escaped (use \\n for newlines inside strings, \\" for quotes).
4. Keep each JSON object on a SINGLE line — no pretty printing.

JSON SCHEMA (all fields required):
{"id":NUMBER,"category":"behavioral"|"technical"|"system-design"|"situational","difficulty":"easy"|"medium"|"hard","question":"QUESTION TEXT","situation":"Specific situation from resume — company name, project name, timeline","task":"Specific task or challenge the candidate had to solve","action":"3-4 concrete steps taken — include actual technologies, methodologies, metrics from resume","result":"Quantified outcome — use real numbers/metrics from resume where possible","whyAsked":"1 sentence: what trait/skill the interviewer is testing","tip":"1 specific, tactical tip for delivering this answer in an interview"}

QUESTION DISTRIBUTION:
- Questions 1–10: Behavioral
- Questions 11–20: Technical deep-dives specific to the JD
- Questions 21–25: System design
- Questions 26–30: Situational/role-specific

PERSONALIZATION RULES:
- Use the candidate's ACTUAL company names, project names, and technologies
- Include REAL metrics from the resume
- Tailor every answer to sound natural in first person
- Do NOT invent details not present in the resume

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
  // Validate API key is present and looks plausible
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

  // Open the upstream stream BEFORE returning, so any auth/model errors
  // surface as a real HTTP 500 with a readable JSON body.
  let completion
  try {
    completion = await client.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.6,
      max_completion_tokens: 8000,
      messages: [
        {
          role: 'system',
          content:
            'You output strictly newline-delimited JSON (JSONL). No prose, no markdown fences, no commentary — only the requested JSON objects, one per line.',
        },
        { role: 'user', content: buildPrompt(jd, resume) },
      ],
    })
  } catch (err) {
    const msg = extractErrMsg(err)
    console.error('[generate] Groq request failed:', msg, err)
    return Response.json(
      {
        error:
          msg.includes('401') || msg.toLowerCase().includes('invalid api key')
            ? `Invalid Groq API key. Double-check GROQ_API_KEY in .env.local and restart the dev server. (${msg})`
            : msg.toLowerCase().includes('model')
            ? `Model "${MODEL}" not available. Set GROQ_MODEL in .env.local to a valid model (try "llama-3.3-70b-versatile"). Original error: ${msg}`
            : `Groq request failed: ${msg}`,
      },
      { status: 500 }
    )
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
