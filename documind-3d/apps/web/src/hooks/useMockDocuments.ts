import { useCallback, useEffect, useState } from 'react'
import { MOCK_DOCUMENTS } from '../data/mockDocuments'
import type { DocumentItem } from '../types/document'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; documents: DocumentItem[] }

// Day 12 par yeh hook real API se replace hoga.
export function useMockDocuments(scenario: string | null) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scenario === 'error') {
        setState({ status: 'error', message: 'Documents load nahi ho sake (mock error).' })
      } else {
        setState({
          status: 'success',
          documents: scenario === 'empty' ? [] : MOCK_DOCUMENTS,
        })
      }
    }, 700)
    return () => clearTimeout(timer)
  }, [scenario, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }, [])

  return { state, retry }
}