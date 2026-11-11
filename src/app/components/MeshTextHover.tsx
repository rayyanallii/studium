import { useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'

interface MeshTextHoverProps {
  children: ReactNode
  className?: string
  glowColor?: string
}

export function MeshTextHover({
  children,
  className,
  glowColor = 'rgba(167, 139, 250, 0.45)',
}: MeshTextHoverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cx('relative inline-block cursor-default select-none', className)}
    >
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-0 transition-opacity duration-300 blur-2xl"
        style={{
          opacity: hovered ? 1 : 0,
          background: `radial-gradient(circle 180px at ${coords.x}px ${coords.y}px, ${glowColor}, transparent 70%)`,
        }}
      />
      <span className="relative z-10 transition-colors duration-200">{children}</span>
    </div>
  )
}
