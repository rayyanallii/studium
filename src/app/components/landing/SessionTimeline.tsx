const entries = [
  {
    title: 'Open the chapter, not the whole course',
    copy: 'You pick the one PDF and the topic on this week’s problem set. No deck-building, no blank page.',
  },
  {
    title: 'Twelve cards from the source',
    copy: 'The wording comes from your material, so each card matches what your lecturer actually said.',
  },
  {
    title: 'Get a few wrong on purpose',
    copy: 'The quiz marks each answer and drops you back into the exact paragraph behind the one you missed.',
  },
  {
    title: 'Leave with a time on the calendar',
    copy: 'Book the review before you close the tab. Studium keeps the minutes you focused next to the session.',
  },
]

export function SessionTimeline() {
  return (
    <div className="timeline">
      {entries.map((entry, index) => (
        <article className="tl-row" key={entry.title}>
          <span className="tl-dot" aria-hidden="true" data-first={index === 0 ? 'true' : undefined} />
          <h3>{entry.title}</h3>
          <p className="tl-copy">{entry.copy}</p>
        </article>
      ))}
      <div className="tl-end">
        <p>One chapter. Two passes. Something you can measure.</p>
      </div>
    </div>
  )
}
