import { useState, useCallback } from 'react'

export function useClipboard(timeout: number = 2000) {
  const [isCopied, setIsCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard not supported')
        return false
      }

      try {
        await navigator.clipboard.writeText(text)
        setIsCopied(true)

        setTimeout(() => {
          setIsCopied(false)
        }, timeout)

        return true
      } catch (error) {
        console.error('Failed to copy:', error)
        setIsCopied(false)
        return false
      }
    },
    [timeout]
  )

  return { isCopied, copy }
}
