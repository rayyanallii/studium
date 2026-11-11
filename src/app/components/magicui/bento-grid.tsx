import { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { cx } from '../../lib/cx'

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode
  className?: string
}

interface BentoCardProps extends ComponentPropsWithoutRef<'div'> {
  name: string
  className?: string
  background?: ReactNode
  Icon: React.ElementType
  description: string
  href: string
  cta: string
}

export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div
      className={cx('grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) {
  return (
    <div
      key={name}
      className={cx(
        'group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl',
        'bg-[#12111d] border border-[#242136] p-6 shadow-sm',
        'transition-all duration-300 hover:border-[#6350ae]/60 hover:shadow-lg hover:shadow-[#6350ae]/10',
        className,
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0">{background}</div>
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300">
        <div className="flex size-11 items-center justify-center rounded-xl bg-[#1e1b30] text-[#a78bfa] border border-[#2e2a48]">
          <Icon className="size-5" />
        </div>
        <h3 className="text-xl font-medium text-white tracking-tight mt-4">{name}</h3>
        <p className="max-w-lg text-sm text-[#9b99aa] leading-relaxed">{description}</p>
      </div>

      <div className="pointer-events-none z-10 flex transform-gpu flex-row items-center pt-4 transition-all duration-300">
        <Link
          to={href}
          className="pointer-events-auto inline-flex items-center gap-1.5 text-xs font-medium text-[#c4b5fd] hover:text-white transition-colors"
        >
          <span>{cta}</span>
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
