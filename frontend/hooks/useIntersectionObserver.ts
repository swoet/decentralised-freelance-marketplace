import { useEffect, useState, RefObject } from 'react'

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverEntry | undefined {
  const { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false } = options

  const [entry, setEntry] = useState<IntersectionObserverEntry>()

  const frozen = entry?.isIntersecting && freezeOnceVisible

  useEffect(() => {
    const node = elementRef?.current
    const hasIOSupport = !!window.IntersectionObserver

    if (!hasIOSupport || frozen || !node) return

    const observerParams = { threshold, root, rootMargin }
    const observer = new IntersectionObserver(([entry]) => setEntry(entry), observerParams)

    observer.observe(node)

    return () => observer.disconnect()
  }, [elementRef, threshold, root, rootMargin, frozen])

  return entry
}

// Hook for lazy loading
export function useLazyLoad(ref: RefObject<Element>) {
  const entry = useIntersectionObserver(ref, {
    threshold: 0.1,
    freezeOnceVisible: true,
  })

  return entry?.isIntersecting ?? false
}
