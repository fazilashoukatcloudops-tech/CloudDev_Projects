import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import { Alert, Button, Spinner } from '../ui'
import { askQuestion, type AskResult } from '../../services/documentsApi'

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; result: AskResult }
  | { id: number; role: 'error'; text: string }

const SUGGESTIONS = ['Is document ka summary kya hai?', 'Is mein sab se zaroori points kya hain?']

export default function ChatPanel({ documentId }: { documentId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const nextId = useRef(0)
  const bottom = useRef<HTMLDivElement>(null)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  
  useEffect(() => {
    if (bottom.current) {
      bottom.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const send = async (raw: string) => {
    const question = raw.trim()
    if (question.length < 3 || loading) return
    setInput('')
    setLoading(true)
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: question }])
    try {
      const result = await askQuestion(documentId, question)
      if (alive.current) setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', result }])
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Jawab nahi mil saka. Dobara try karo.'
      if (alive.current) setMessages((m) => [...m, { id: nextId.current++, role: 'error', text }])
    } finally {
      if (alive.current) setLoading(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void send(input)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-xl border border-slate-800 bg-slate-900/60">
      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-3 text-sm text-slate-400">
            <p>Document ke baare mein koi bhi sawal poochho. Jawab ke saath sources milenge.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => void send(s)}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl bg-indigo-500 px-4 py-2 text-sm">
              {m.text}
            </div>
          ) : m.role === 'error' ? (
            <Alert key={m.id} variant="error">{m.text}</Alert>
          ) : (
            <div key={m.id} className="max-w-[92%] space-y-2">
              {m.result.notice && <Alert variant="info">{m.result.notice}</Alert>}
              <p className="whitespace-pre-wrap rounded-2xl bg-slate-800 px-4 py-3 text-sm">{m.result.answer}</p>
              {m.result.sources.length > 0 && (
                <details className="text-xs text-slate-400">
                  <summary className="cursor-pointer">Sources ({m.result.sources.length})</summary>
                  <ol className="mt-2 space-y-2">
                    {m.result.sources.map((s) => (
                      <li key={s.chunkId} className="rounded-lg border border-slate-800 p-2">
                        <span className="font-medium text-slate-300">[{s.n}] Page {s.page}</span>
                        <p className="mt-1 whitespace-pre-wrap">{s.snippet}</p>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          ),
        )}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner size="sm" /> Document mein dhoondh raha hoon...
          </div>
        )}
        <div ref={bottom} />
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-slate-800 p-3">
        <textarea
          aria-label="Apna sawal likho"
          rows={2}
          maxLength={1000}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Sawal likho... (Enter = bhejo)"
          className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <Button type="submit" disabled={input.trim().length < 3} loading={loading} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
