import { NextRequest } from 'next/server'

// pdf-parse is imported dynamically to avoid Next.js build-time issues
// (the library reads test files at module load time using fs.readFileSync)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return new Response(
        JSON.stringify({ error: 'No file uploaded.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Convert the File/Blob to a Node Buffer for pdf-parse
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Dynamic import avoids the "test file not found" error at build time
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)

    // Clean up the extracted text: collapse excessive whitespace
    const text = data.text
      .replace(/\r\n/g, '\n')       // normalize line endings
      .replace(/\n{3,}/g, '\n\n')   // collapse 3+ blank lines to 2
      .trim()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Could not extract text from this PDF. Try pasting your resume instead.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ text, pages: data.numpages }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PDF parse failed'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
