export type PdfFailure = 'password' | 'corrupt' | 'too-many-pages' | 'too-much-text'

export class PdfExtractError extends Error {
  constructor(public readonly kind: PdfFailure, message: string) {
    super(message)
    this.name = 'PdfExtractError'
  }
}

export type PdfLimits = { maxPages: number; maxChars: number }
export type ExtractedPdf = { pages: string[]; totalChars: number }

export function normalizeText(raw: string): string {
  return raw.split('\u0000').join('').replace(/\r\n?/g, '\n').replace(/[ \t\f\v]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function classify(err: unknown): unknown {
  const name = err instanceof Error ? err.name : ''
  if (name === 'PasswordException') return new PdfExtractError('password', 'PDF password se protected hai. Password hata kar dobara upload karo.')
  if (['InvalidPDFException', 'FormatError', 'MissingPDFException'].includes(name)) return new PdfExtractError('corrupt', 'PDF file corrupt hai ya read nahi ho sakti.')
  return err
}

export async function extractPdfText(data: Buffer, limits: PdfLimits): Promise<ExtractedPdf> {
  const { getDocumentProxy, extractText } = await import('unpdf')
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>
  
  try { 
    pdf = await getDocumentProxy(new Uint8Array(data)) 
  } catch (err) { 
    throw classify(err) 
  }
  
  try {
    if (pdf.numPages > limits.maxPages) {
      throw new PdfExtractError('too-many-pages', `PDF mein ${pdf.numPages} pages hain. Max ${limits.maxPages} pages allowed hain.`)
    }
    const { text } = await extractText(pdf, { mergePages: false })
    const pages = (Array.isArray(text) ? text : [text]).map(normalizeText)
    const totalChars = pages.reduce((sum, p) => sum + p.length, 0)
    if (totalChars > limits.maxChars) throw new PdfExtractError('too-much-text', 'PDF mein text bohat zyada hai (limit se bara).')
    return { pages, totalChars }
  } catch (err) { 
    throw classify(err) 
  } finally { 
    // FIX: Check if destroy function exists to prevent crash
    if (pdf && typeof (pdf as any).destroy === 'function') {
      await (pdf as any).destroy().catch(() => undefined)
    }
  }
}
