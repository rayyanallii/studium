import { cx } from '../lib/cx'

/**
 * The uploaded Studium mark, rendered as a rounded icon tile.
 *
 * `public/brand/studium-mark.png` is cropped from the source artwork by
 * `scripts/make-brand-assets.py`. The artwork sits on white, which is also the
 * colour of its book pages, so it is shown as an app-icon square instead of
 * being keyed to transparency (that would punch holes in the pages).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cx('inline-grid shrink-0 place-items-center overflow-hidden rounded-[7px] bg-white', className)}>
      <img src="/brand/studium-mark.png" alt="" aria-hidden="true" width={48} height={48} draggable={false} className="size-full object-cover" />
    </span>
  )
}
