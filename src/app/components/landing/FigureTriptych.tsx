import './FigureTriptych.css'

const figures = [
  {
    title: 'Put the reading in',
    copy: 'Upload a PDF, a Word document or a photo of the handout, or paste your notes. Choose the chapter you are actually revising.',
    art: 'left',
  },
  {
    title: 'Turn it into practice',
    copy: 'Studium writes cards and questions from that chapter alone — usually in under a minute, always from your own material.',
    art: 'center',
  },
  {
    title: 'Come back on purpose',
    copy: 'Put two short sessions in the planner. The timer records what you did, so next week starts with evidence instead of guilt.',
    art: 'right',
  },
]

export function FigureTriptych() {
  return (
    <div className="figures">
      {figures.map((figure) => (
        <article className="figure" key={figure.title}>
          <div className="figure-art" aria-hidden="true">
            <span className="figure-illustration" data-position={figure.art} />
          </div>
          <h3>{figure.title}</h3>
          <p>{figure.copy}</p>
        </article>
      ))}
    </div>
  )
}
