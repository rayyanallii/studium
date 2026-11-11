import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cx } from '../../lib/cx'

export interface AnimatedListProps {
  className?: string
  children: ReactNode[]
  delay?: number
}

export function AnimatedList({ className, children, delay = 1000 }: AnimatedListProps) {
  const [index, setIndex] = useState(0)
  const childrenArray = useMemo(() => children, [children])

  useEffect(() => {
    if (index >= childrenArray.length - 1) return
    const timeout = setTimeout(() => {
      setIndex(prevIndex => prevIndex + 1)
    }, delay)

    return () => clearTimeout(timeout)
  }, [index, delay, childrenArray.length])

  const itemsToShow = useMemo(
    () => childrenArray.slice(0, index + 1).reverse(),
    [index, childrenArray],
  )

  return (
    <div className={cx('flex flex-col items-center gap-3', className)}>
      <AnimatePresence>
        {itemsToShow.map(item => (
          <AnimatedListItem key={(item as any).key}>{item}</AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function AnimatedListItem({ children }: { children: ReactNode }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring' as const, stiffness: 350, damping: 40 },
  }

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  )
}
