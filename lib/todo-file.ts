// Reading and writing TODO.md.
//
// The file stays ordinary markdown — the point is that it is just as usable in
// an editor or a diff as it is through the page. So we parse the checkbox
// lines, rewrite only the one byte that changes, and leave every other line
// exactly as it was.

import { promises as fs } from 'node:fs'
import path from 'node:path'

const TODO_PATH = path.join(process.cwd(), 'TODO.md')

export interface TodoItem {
  /** Line number in the file, 0-based. Used to target the write. */
  line: number
  text: string
  done: boolean
}

export interface TodoSection {
  heading: string
  items: TodoItem[]
}

const CHECKBOX = /^(\s*[-*]\s+\[)([ xX])(\]\s+)(.*)$/
const HEADING = /^##\s+(.*)$/

export async function readTodo(): Promise<{ title: string; sections: TodoSection[] }> {
  const raw = await fs.readFile(TODO_PATH, 'utf8')
  const lines = raw.split('\n')

  let title = 'Todo'
  const sections: TodoSection[] = []
  let current: TodoSection | null = null

  lines.forEach((line, i) => {
    if (line.startsWith('# ') && title === 'Todo') {
      title = line.slice(2).trim()
      return
    }
    const h = line.match(HEADING)
    if (h) {
      current = { heading: h[1].trim(), items: [] }
      sections.push(current)
      return
    }
    const c = line.match(CHECKBOX)
    if (c && current) {
      current.items.push({ line: i, text: c[4].trim(), done: c[2].toLowerCase() === 'x' })
    }
  })

  return { title, sections }
}

/**
 * Flip one checkbox. `expectedText` guards against the file having been edited
 * by hand since the page rendered — without it a stale line number would tick
 * the wrong item. Returns false if the line no longer matches.
 */
export async function toggleTodo(line: number, expectedText: string): Promise<boolean> {
  const raw = await fs.readFile(TODO_PATH, 'utf8')
  const lines = raw.split('\n')
  const target = lines[line]
  if (target === undefined) return false

  const m = target.match(CHECKBOX)
  if (!m || m[4].trim() !== expectedText) return false

  const next = m[2].toLowerCase() === 'x' ? ' ' : 'x'
  lines[line] = `${m[1]}${next}${m[3]}${m[4]}`
  await fs.writeFile(TODO_PATH, lines.join('\n'), 'utf8')
  return true
}
