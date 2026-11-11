import { useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { cx } from '../../lib/cx'
import './reactbits.css'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  spotlightColor?: string
  style?: CSSProperties
}

/** Pointer-following radial highlight (React Bits "SpotlightCard"). */
export function SpotlightCard({
  children,
  className,
  spotlightColor = 'rgba(185, 163, 255, 0.14)',
  style,
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [point, setPoint] = useState({ x: 0, y: 0, active: false })

  return (
    <div
      ref={ref}
      className={cx('rb-spotlight', className)}
      style={style}
      onPointerMove={(event) => {
        const box = ref.current?.getBoundingClientRect()
        if (!box) return
        setPoint({ x: event.clientX - box.left, y: event.clientY - box.top, active: true })
      }}
      onPointerLeave={() => setPoint((prev) => ({ ...prev, active: false }))}
    >
      <span
        aria-hidden="true"
        className="rb-spotlight__glow"
        style={{
          opacity: point.active ? 1 : 0,
          background: `radial-gradient(360px circle at ${point.x}px ${point.y}px, ${spotlightColor}, transparent 64%)`,
        }}
      />
      <div className="rb-spotlight__content">{children}</div>
    </div>
  )
}
