import { cx } from '../lib/cx'

/**
 * The uploaded Studium mark.
 *
 * `public/brand/studium-mark.png` is generated from the source artwork by
 * `scripts/make-brand-assets.py`, which removes only the outer white canvas and
 * keeps the white book pages. The mark therefore sits directly on the app
 * surface in both themes instead of inside a white tile.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/studium-mark.png"
      alt=""
      aria-hidden="true"
      width={48}
      height={48}
      draggable={false}
      className={cx('shrink-0 select-none object-contain', className)}
    />
  )
}
