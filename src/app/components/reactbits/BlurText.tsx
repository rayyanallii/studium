import { motion } from 'motion/react'

import { cx } from '../../lib/cx'

/** Words rise out of a blur as they enter the viewport (React Bits "BlurText"). */
export function BlurText({
  text,
  className,
  stagger = 0.055,
  delay = 0,
}: {
  text: string
  className?: string
  stagger?: number
  delay?: number
}) {
  return (
    <span className={cx('rb-blur-text', className)} aria-label={text}>
      {text.split(' ').map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          aria-hidden="true"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 16 }}
          whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          viewport={{ once: true, margin: '-70px' }}
          transition={{ duration: 0.6, delay: delay + index * stagger, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'inline-block', marginRight: '0.26em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  )
}
