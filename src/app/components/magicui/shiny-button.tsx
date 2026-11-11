import React from 'react'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cx } from '../../lib/cx'

export interface ShinyButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode
  className?: string
}

export const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        initial={{ '--x': '100%', scale: 1 } as any}
        animate={{ '--x': '-100%' } as any}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          repeatDelay: 1.2,
          type: 'spring',
          stiffness: 20,
          damping: 15,
          mass: 2,
        }}
        {...(props as any)}
        className={cx(
          'relative inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-medium text-white transition-all duration-300 whitespace-nowrap select-none',
          'bg-linear-to-r from-[#6350ae] via-[#7b61df] to-[#6350ae] bg-size-[200%_100%]',
          'border border-[#8f75fa]/60 shadow-[0_4px_20px_rgba(99,80,174,0.45)]',
          'hover:shadow-[0_6px_28px_rgba(123,95,255,0.65)] hover:border-[#a78bfa]',
          className,
        )}
      >
        <span
          className="relative z-10 flex items-center gap-2 text-sm font-medium tracking-tight text-white whitespace-nowrap"
          style={{
            maskImage:
              'linear-gradient(-75deg,rgba(255,255,255,1) calc(var(--x) + 20%),rgba(255,255,255,0.3) calc(var(--x) + 30%),rgba(255,255,255,1) calc(var(--x) + 100%))',
            WebkitMaskImage:
              'linear-gradient(-75deg,rgba(255,255,255,1) calc(var(--x) + 20%),rgba(255,255,255,0.3) calc(var(--x) + 30%),rgba(255,255,255,1) calc(var(--x) + 100%))',
          }}
        >
          {children}
        </span>
        <span
          style={{
            mask: 'linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box, linear-gradient(rgb(0,0,0), rgb(0,0,0))',
            WebkitMask:
              'linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box, linear-gradient(rgb(0,0,0), rgb(0,0,0))',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
          }}
          className="pointer-events-none absolute inset-0 z-10 block rounded-[inherit] bg-[linear-gradient(-75deg,rgba(255,255,255,0.1)_calc(var(--x)+20%),rgba(255,255,255,0.6)_calc(var(--x)+25%),rgba(255,255,255,0.1)_calc(var(--x)+100%))] p-px"
        />
      </motion.button>
    )
  },
)

ShinyButton.displayName = 'ShinyButton'
