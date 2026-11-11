import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { DateTime } from 'luxon'
import type { StudySession } from '../../shared/types'

export function useSessionDrag(scroller: RefObject<HTMLDivElement | null>, timezone: string, startHour: number, hourHeight: number, moving: boolean, onMove: (session: StudySession, startsAt: number) => void) {
  const [drag, setDrag] = useState<StudySession | null>(null)
  const [target, setTarget] = useState<{ day: string; minutes: number } | null>(null)
  const active = useRef<{ session: StudySession; pointer: number; x: number; y: number; startX: number; startY: number; offset: number; moved: boolean; element: HTMLButtonElement } | null>(null)
  const destination = useRef<typeof target>(null)
  const suppressClick = useRef(false)
  const frame = useRef(0)
  const locate = () => {
    const current = active.current, container = scroller.current
    if (!current || !container) return null
    const bounds = container.getBoundingClientRect()
    if (current.x < bounds.left || current.x > bounds.right || current.y < bounds.top || current.y > bounds.bottom) return null
    const column = [...container.querySelectorAll<HTMLElement>('[data-calendar-day]')].find(element => { const rect = element.getBoundingClientRect(); return current.x >= rect.left && current.x < rect.right })
    if (!column) return null
    const duration = (current.session.endsAt - current.session.startsAt) / 60000
    const max = Math.floor((1440 - duration) / 15) * 15
    const minutes = Math.max(0, Math.min(max, Math.round(((current.y - column.getBoundingClientRect().top - current.offset) / hourHeight * 60 + startHour * 60) / 15) * 15))
    return { day: column.dataset.calendarDay!, minutes }
  }
  const update = () => { destination.current = locate(); setTarget(destination.current) }
  const tick = () => {
    const current = active.current, container = scroller.current
    if (!current?.moved || !container) return
    const bounds = container.getBoundingClientRect()
    const dy = current.y < bounds.top + 80 ? -8 : current.y > bounds.bottom - 45 ? 8 : 0
    const dx = current.x < bounds.left + 30 ? -8 : current.x > bounds.right - 30 ? 8 : 0
    if (dy || dx) { container.scrollBy(dx, dy); update() }
    frame.current = requestAnimationFrame(tick)
  }
  const clear = () => {
    cancelAnimationFrame(frame.current)
    const current = active.current
    active.current = null; destination.current = null; setDrag(null); setTarget(null)
    if (current?.element.hasPointerCapture(current.pointer)) current.element.releasePointerCapture(current.pointer)
  }
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && active.current) { suppressClick.current = active.current.moved; clear() } }
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('keydown', escape); cancelAnimationFrame(frame.current) }
  }, [])
  return { drag, target, handlers: (session: StudySession) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (moving || session.status === 'completed' || event.button !== 0 || !event.isPrimary) return
      suppressClick.current = false
      active.current = { session, pointer: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, offset: event.clientY - event.currentTarget.getBoundingClientRect().top, moved: false, element: event.currentTarget }
      event.currentTarget.setPointerCapture(event.pointerId)
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = active.current
      if (!current || current.pointer !== event.pointerId) return
      current.x = event.clientX; current.y = event.clientY
      if (!current.moved && Math.hypot(current.x - current.startX, current.y - current.startY) >= 6) { current.moved = true; setDrag(session); frame.current = requestAnimationFrame(tick) }
      if (current.moved) { event.preventDefault(); update() }
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = active.current
      if (!current || current.pointer !== event.pointerId) return
      const next = locate()
      suppressClick.current = current.moved
      if (current.moved && next && !moving) {
        const time = DateTime.fromISO(next.day, { zone: timezone }).set({ hour: Math.floor(next.minutes / 60), minute: next.minutes % 60 })
        if (time.isValid && time.hour * 60 + time.minute === next.minutes && time.toMillis() !== current.session.startsAt) onMove(current.session, time.toMillis())
      }
      clear()
    },
    onPointerCancel: () => { suppressClick.current = Boolean(active.current?.moved); clear() },
    onLostPointerCapture: () => { if (active.current) { suppressClick.current = active.current.moved; clear() } },
  }), consumeClick: () => { const value = suppressClick.current; suppressClick.current = false; return value } }
}
