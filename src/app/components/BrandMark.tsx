import { cx } from '../lib/cx'

export function BrandMark({
  className,
  alt = 'Studium',
  src = '/brand/studium-wordmark-white.png',
}: {
  className?: string
  alt?: string
  src?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={1671}
      height={941}
      draggable={false}
      className={cx('studium-wordmark block shrink-0 select-none object-contain', className)}
    />
  )
}
