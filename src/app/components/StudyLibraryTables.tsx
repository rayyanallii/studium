import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Check, FileText, Trash2 } from 'lucide-react'
import type { StudyArtifact, StudyMaterial } from '../../shared/study'
import { Badge, Button, Checkbox, Input, Select } from './ui'
import { StudyToolIcon } from './StudyTools'

type Entry = { id: string; title: string; subjectId: string | null; createdAt: number }
const date = (value: number) => Number.isFinite(value) ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'

function LibraryTable<T extends Entry>({ items, label, subjectName, columns, render, selectable = false }: { items: T[]; label: string; subjectName: (id: string | null) => string | null | undefined; columns: ReactNode; render: (item: T) => ReactNode; selectable?: boolean }) {
  const [search, setSearch] = useState(''), [sort, setSort] = useState('newest'), [group, setGroup] = useState('subject')
  const visible = items.filter(item => `${item.title} ${subjectName(item.subjectId) ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title) : (b.createdAt || 0) - (a.createdAt || 0))
  const groups = new Map<string, T[]>()
  for (const item of visible) { const key = group === 'subject' ? item.subjectId || '' : 'all'; groups.set(key, [...(groups.get(key) ?? []), item]) }
  const names = [...groups.keys()].sort((a, b) => (subjectName(a) || 'Unassigned').localeCompare(subjectName(b) || 'Unassigned'))
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-2"><div className="min-w-40 flex-1"><Input aria-label={`Search ${label}`} placeholder={`Search ${label.toLowerCase()}`} value={search} onChange={event => setSearch(event.target.value)} /></div><div className="w-40"><Select aria-label={`Group ${label}`} value={group} onValueChange={setGroup}><option value="subject">By subject</option><option value="none">No grouping</option></Select></div><div className="w-40"><Select aria-label={`Sort ${label}`} value={sort} onValueChange={setSort}><option value="newest">Newest first</option><option value="name">Name A–Z</option></Select></div></div>
    {search && <p className="text-xs text-muted">{visible.length} of {items.length} results</p>}
    {!visible.length && <div className="rounded-card border border-line p-6 text-sm text-muted">No matching {label.toLowerCase()}.<Button size="sm" variant="ghost" onClick={() => setSearch('')}>Clear search</Button></div>}
    {names.map(key => <TableGroup key={`${key}:${search}:${sort}`} name={group === 'subject' ? subjectName(key || null) || 'Unassigned' : label} items={groups.get(key)!} label={label} columns={columns} render={render} selectable={selectable} />)}
  </div>
}

function TableGroup<T extends Entry>({ name, items, label, columns, render, selectable }: { name: string; items: T[]; label: string; columns: ReactNode; render: (item: T) => ReactNode; selectable: boolean }) {
  const [limit, setLimit] = useState(10)
  return <details open className="overflow-hidden rounded-[16px] border border-line bg-panel">
    <summary className="cursor-pointer bg-surface-2/50 px-4 py-3 text-sm font-semibold">{name}<span className="ml-2 font-normal text-muted">{items.length}</span></summary>
    <table className="w-full table-fixed text-left text-sm"><caption className="sr-only">{name} {label.toLowerCase()}</caption><thead className="border-y border-line text-xs font-medium text-faint"><tr>{selectable && <th className="w-10"><span className="sr-only">Select</span></th>}<th scope="col" className="px-4 py-3">Name</th>{columns}<th scope="col" className="w-12"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-line">{items.slice(0, limit).map(item => <tr key={item.id} className="hover:bg-surface-2/40">{render(item)}</tr>)}</tbody></table>
    {items.length > 10 && <div className="flex items-center justify-between border-t border-line px-4 py-3"><span className="text-xs text-muted">Showing {Math.min(limit, items.length)} of {items.length}</span>{limit < items.length ? <Button size="sm" onClick={() => setLimit(value => value + 10)}>Show more</Button> : <Button size="sm" onClick={() => setLimit(10)}>Show less</Button>}</div>}
  </details>
}

export function StudySetsTable({ items, subjectName, onDelete }: { items: StudyArtifact[]; subjectName: (id: string | null) => string | null | undefined; onDelete: (item: StudyArtifact) => void }) {
  return <LibraryTable items={items} label="Study sets" subjectName={subjectName} columns={<><th scope="col" className="hidden w-24 px-3 sm:table-cell">Contents</th><th scope="col" className="hidden w-20 px-3 lg:table-cell">Sources</th><th scope="col" className="hidden w-24 px-3 md:table-cell">Created</th></>} render={item => {
    const count = item.content.cards?.length ?? item.content.questions?.length ?? item.content.sections?.length ?? 0
    const description = `${count} ${item.kind === 'flashcards' ? 'cards' : item.kind === 'quiz' ? 'questions' : 'topics'}`
    return <><td className="px-4 py-3"><Link to={`/study/${item.id}`} className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-blue-500"><StudyToolIcon kind={item.kind} className="hidden size-8 shrink-0 sm:block" /><span className="min-w-0"><span className="block break-words font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted sm:hidden">{description} · {item.sourceIds.length} sources</span></span></Link></td><td className="hidden px-3 text-muted sm:table-cell">{description}</td><td className="hidden px-3 text-muted lg:table-cell">{item.sourceIds.length}</td><td className="hidden px-3 text-xs text-muted md:table-cell">{date(item.createdAt)}</td><td className="pr-3"><Button size="icon-sm" variant="ghost" aria-label={`Delete ${item.title}`} onClick={() => onDelete(item)}><Trash2 /></Button></td></>
  }} />
}

export function SourceMaterialsTable({ items, selection, subjectName, onSelect, onOpen, onDelete }: { items: StudyMaterial[]; selection: string[]; subjectName: (id: string | null) => string | null | undefined; onSelect: (id: string, checked: boolean) => void; onOpen: (item: StudyMaterial) => void; onDelete: (item: StudyMaterial) => void }) {
  return <LibraryTable items={items} label="Source materials" subjectName={subjectName} selectable columns={<><th scope="col" className="hidden w-20 px-3 md:table-cell">Format</th><th scope="col" className="w-20 px-1">Status</th></>} render={item => <><td className="pl-4"><Checkbox label={`Select ${item.title}`} checked={selection.includes(item.id)} onChange={checked => onSelect(item.id, checked)} /></td><td className="px-4 py-3"><button onClick={() => onOpen(item)} className="flex w-full min-w-0 items-center gap-3 text-left"><FileText className="hidden size-4 shrink-0 text-muted sm:block" /><span className="min-w-0"><span className="block break-words font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted">{item.text.length.toLocaleString()} characters</span></span></button></td><td className="hidden px-3 text-xs text-muted md:table-cell">{item.fileName?.split('.').pop()?.toUpperCase() || 'NOTE'}</td><td className="px-1"><Badge tone="success" className="!text-xs"><Check aria-hidden className="size-3 shrink-0" />Ready</Badge></td><td className="pr-3"><Button size="icon-sm" variant="ghost" aria-label={`Delete source ${item.title}`} onClick={() => onDelete(item)}><Trash2 /></Button></td></>} />
}
