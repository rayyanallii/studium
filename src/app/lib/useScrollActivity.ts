import { useEffect, useRef, useState } from 'react'

export function useScrollActivity() {
  const [scrolling, setScrolling] = useState(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timeout.current), [])
  return {
    'data-scrolling': scrolling || undefined,
    onScroll: () => {
      setScrolling(true)
      clearTimeout(timeout.current)
      timeout.current = setTimeout(() => setScrolling(false), 800)
    },
  }
}
