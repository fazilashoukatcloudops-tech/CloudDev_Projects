import { useEffect, useRef } from 'react'
import type { DocumentItem, DocumentStatus } from '../types/document'
import { useToast } from '../components/toast'

export function useStatusNotifications(documents: DocumentItem[]) {
  const { notify } = useToast()
  const previous = useRef<Map<string, DocumentStatus>>(new Map())

  useEffect(() => {
    for (const doc of documents) {
      const before = previous.current.get(doc.id)
      if (!before || before === doc.status) continue
      if (doc.status === 'ready') notify(`${doc.name} process ho gayi aur ready hai.`, 'success')
      if (doc.status === 'failed') notify(`${doc.name} process nahi ho saki.`, 'error')
    }
    previous.current = new Map(documents.map((d) => [d.id, d.status]))
  }, [documents, notify])
}
