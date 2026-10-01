import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isPrivateEnabled } from '@/lib/private-gate'
import { readTodo, toggleTodo } from '@/lib/todo-file'

export const metadata: Metadata = {
  title: 'Todo · 9cups',
  // Belt and braces: this route 404s without the flag, but if it is ever
  // reachable it should never be indexed.
  robots: { index: false, follow: false },
}

// The file changes between requests, so nothing here can be cached.
export const dynamic = 'force-dynamic'

/** Render markdown inline code spans. Nearly every item names a file path, and
 *  showing the backticks raw makes them harder to read, not easier. Deliberately
 *  only backticks — this is a private checklist, not a markdown renderer. */
function withCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2
      ? <code key={i}>{part.slice(1, -1)}</code>
      : <span key={i}>{part}</span>,
  )
}

export default async function TodoPage() {
  if (!isPrivateEnabled()) notFound()

  const { title, sections } = await readTodo()
  const total = sections.reduce((n, s) => n + s.items.length, 0)
  const done = sections.reduce((n, s) => n + s.items.filter(i => i.done).length, 0)

  async function toggle(formData: FormData) {
    'use server'
    // Gate the action too. A server action is a POST endpoint: gating only the
    // page would leave the write reachable.
    if (!isPrivateEnabled()) return
    const line = Number(formData.get('line'))
    const text = String(formData.get('text') ?? '')
    if (!Number.isInteger(line)) return
    await toggleTodo(line, text)
    revalidatePath('/todo')
  }

  return (
    <main className="page-shell todo" id="main">
      <header className="page-head">
        <p className="todo-flag">Local only · not on the live site</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-lede">
          Writes straight to <code>TODO.md</code>, so it stays readable in an editor
          and in a diff. {done} of {total} done.
        </p>
        <div className="todo-bar" role="img" aria-label={`${done} of ${total} complete`}>
          <span style={{ width: total ? `${(done / total) * 100}%` : '0%' }} />
        </div>
      </header>

      {sections.map(section => (
        <section key={section.heading} className="todo-section">
          <h2 className="todo-heading">{section.heading}</h2>
          <ul className="todo-list">
            {section.items.map(item => (
              <li key={item.line}>
                {/* A form per item, so this works with no client JavaScript at
                    all — the control is a real submit button. */}
                <form action={toggle} className="todo-form">
                  <input type="hidden" name="line" value={item.line} />
                  <input type="hidden" name="text" value={item.text} />
                  <button
                    type="submit"
                    className="todo-item"
                    data-done={item.done}
                    aria-pressed={item.done}
                  >
                    <span className="todo-box" aria-hidden="true">
                      {item.done && (
                        <svg viewBox="0 0 16 16" focusable="false">
                          <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor"
                            strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className="todo-text">{withCode(item.text)}</span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}
