import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ChatPanel from '../components/chat/ChatPanel'
import { DashboardLayout } from '../components/layout'
import { Alert, Spinner, buttonClasses } from '../components/ui'
import { getDocument } from '../services/documentsApi'
import type { DocumentItem } from '../types/document'

type Result = { id: string; doc?: DocumentItem; error?: string }

export default function ChatPage() {
  const { id = '' } = useParams()
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    let cancelled = false
    getDocument(id)
      .then((doc) => !cancelled && setResult({ id, doc }))
      .catch((err: unknown) => {
        if (!cancelled) setResult({ id, error: err instanceof Error ? err.message : 'Load nahi hua' })
      })
    return () => { cancelled = true }
  }, [id])

  const loaded = result && result.id === id ? result : null
  const doc = loaded?.doc

  return (
    <DashboardLayout
      title={doc ? `Chat: ${doc.name}` : 'Document chat'}
      actions={<Link to="/dashboard" className={buttonClasses('secondary')}>Dashboard</Link>}
    >
      <div className="mx-auto max-w-3xl">
        {!loaded && <Spinner />}
        {loaded?.error && <Alert variant="error">{loaded.error}</Alert>}
        {doc && doc.status !== 'ready' && (
          <Alert variant="info">Document abhi {doc.status} hai. Ready hone par yahan sawal poochh sakoge. Dashboard par status dekho.</Alert>
        )}
        {doc?.status === 'ready' && <ChatPanel documentId={doc.id} />}
      </div>
    </DashboardLayout>
  )
}
