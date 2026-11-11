import type { ReactNode } from 'react'

import { cx } from '../../lib/cx'
import './reactbits.css'

/** A thin light sweeping around the border (React Bits "StarBorder"). */
export function StarBorder({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('rb-star', className)}>
      <span className="rb-star__beam" aria-hidden="true" />
      <span className="rb-star__inner">{children}</span>
    </span>
  )
}
