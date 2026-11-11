import { useEffect, useRef, useState } from 'react'
import { useInView } from 'motion/react'

import { cx } from '../../lib/cx'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/—'

/** Mono label that decrypts itself once, on view (React Bits "DecryptedText"). */
export function DecryptedText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [output, setOutput] = useState(text)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (reduced.current) setOutput(text)
  }, [text])

  useEffect(() => {
    if (!inView || reduced.current) return
    let frame = 0
    const id = window.setInterval(() => {
      frame += 1
      const revealed = Math.floor(frame / 1.6)
      setOutput(
        text
          .split('')
          .map((char, index) => {
            if (index < revealed || char === ' ') return char
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          })
          .join(''),
      )
      if (revealed > text.length) window.clearInterval(id)
    }, 34)
    return () => window.clearInterval(id)
  }, [inView, text])

  return (
    <span ref={ref} className={cx('rb-decrypt', className)} aria-label={text}>
      <span aria-hidden="true">{output}</span>
    </span>
  )
}
