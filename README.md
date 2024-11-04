# Interview Coach

Personalized interview prep, written from your résumé. Drop in a job description and your résumé — Groq generates 30 role-specific questions with model STAR answers grounded in your real experience.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq%20Llama%203.3-F55036)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Features

- **30 personalized questions** across behavioral, technical, system design, and situational categories
- **STAR answers** drawn from your actual companies, projects, and metrics
- **Streaming UI** — questions render as they arrive, no waiting for the full response
- **PDF résumé upload** with text extraction
- **Markdown export** for Notion or any editor
- **Filter and copy** — slice by category, copy any answer to clipboard

## Stack

- [Next.js 14](https://nextjs.org/) (App Router) + TypeScript
- [Groq](https://groq.com/) (`llama-3.3-70b-versatile`) for streaming inference
- `pdf-parse` for résumé extraction
- Zero UI framework — clean, custom-styled components

## Quick start

```bash
# 1. Clone
git clone https://github.com/<your-username>/interview-personalizer.git
cd interview-personalizer

# 2. Install
npm install

# 3. Add your Groq key
cp .env.local.example .env.local
# then edit .env.local and paste a key from https://console.groq.com/keys

# 4. Run
npm run dev
# → http://localhost:3000
```

## Environment variables

| Variable        | Required | Default                    | Notes |
|-----------------|:--------:|---------------------------|-------|
| `GROQ_API_KEY`  | yes      | —                         | Get one at [console.groq.com/keys](https://console.groq.com/keys) |
| `GROQ_MODEL`    | no       | `llama-3.3-70b-versatile` | Any current Groq chat model |

## Project structure

```
app/
  api/
    generate/route.ts    # Groq streaming endpoint (JSONL response)
    parse-pdf/route.ts   # PDF → text via pdf-parse
  globals.css            # Design tokens + animations
  layout.tsx             # Root layout
  page.tsx               # Single-page app shell
components/
  QuestionCard.tsx       # Expandable STAR card
  ExportButton.tsx       # Markdown download / Notion copy
```

## Deploy

The app is a standard Next.js 14 project — works on any Node host.

**One-click on Vercel:** push to GitHub, then [import the repo on Vercel](https://vercel.com/new) and add `GROQ_API_KEY` in the project's Environment Variables. Build command and output directory are auto-detected.

## License

MIT — see [LICENSE](./LICENSE).
