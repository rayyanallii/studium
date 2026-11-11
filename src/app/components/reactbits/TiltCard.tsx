import { useRef, useState, type ReactNode } from 'react'

import { cx } from '../../lib/cx'
import './reactbits.css'

/** Subtle pointer-driven 3D tilt for large product frames. */
export function TiltCard({
  children,
  className,
  max = 3,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  return (
    <div
      ref={ref}
      className={cx('rb-tilt', className)}
      style={{ transform: `perspective(1600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      onPointerMove={(event) => {
        const box = ref.current?.getBoundingClientRect()
        if (!box) return
        const px = (event.clientX - box.left) / box.width - 0.5
        const py = (event.clientY - box.top) / box.height - 0.5
        setTilt({ x: -py * max, y: px * max })
      }}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      {children}
    </div>
  )
}
