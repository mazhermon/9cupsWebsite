import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// readTodo/toggleTodo resolve TODO.md from process.cwd(), so each test runs in
// its own temp directory with its own fixture.
let dir: string
let cwd: string

const FIXTURE = `# 9cups · todo

Intro prose that must survive untouched.

## Section one

- [ ] First thing
- [x] Already done
- [ ] Thing with \`code\` in it

## Section two

- [ ] Only item
`

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'todo-'))
  await fs.writeFile(path.join(dir, 'TODO.md'), FIXTURE, 'utf8')
  cwd = process.cwd()
  vi.spyOn(process, 'cwd').mockReturnValue(dir)
  // lib/todo-file resolves TODO.md once, at module load. Without a reset the
  // second test re-uses the first test's (now deleted) temp directory.
  vi.resetModules()
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.resetModules()
  await fs.rm(dir, { recursive: true, force: true })
})

async function load() {
  const mod = await import('@/lib/todo-file')
  return mod
}

describe('todo-file', () => {
  it('reads the title, sections and items', async () => {
    const { readTodo } = await load()
    const { title, sections } = await readTodo()

    expect(title).toBe('9cups · todo')
    expect(sections.map(s => s.heading)).toEqual(['Section one', 'Section two'])
    expect(sections[0].items.map(i => i.text)).toEqual([
      'First thing',
      'Already done',
      'Thing with `code` in it',
    ])
    expect(sections[0].items.map(i => i.done)).toEqual([false, true, false])
    expect(sections[1].items).toHaveLength(1)
  })

  it('toggles an unchecked item to checked', async () => {
    const { readTodo, toggleTodo } = await load()
    const { sections } = await readTodo()
    const item = sections[0].items[0]

    expect(await toggleTodo(item.line, item.text)).toBe(true)

    const after = await readTodo()
    expect(after.sections[0].items[0].done).toBe(true)
  })

  it('toggles a checked item back to unchecked', async () => {
    const { readTodo, toggleTodo } = await load()
    const { sections } = await readTodo()
    const item = sections[0].items[1]
    expect(item.done).toBe(true)

    await toggleTodo(item.line, item.text)
    const after = await readTodo()
    expect(after.sections[0].items[1].done).toBe(false)
  })

  it('leaves every other line byte-identical', async () => {
    // The file has to stay as good in an editor as it is through the page.
    const { readTodo, toggleTodo } = await load()
    const before = (await fs.readFile(path.join(dir, 'TODO.md'), 'utf8')).split('\n')
    const { sections } = await readTodo()
    const item = sections[0].items[0]

    await toggleTodo(item.line, item.text)
    const after = (await fs.readFile(path.join(dir, 'TODO.md'), 'utf8')).split('\n')

    expect(after).toHaveLength(before.length)
    after.forEach((line, i) => {
      if (i === item.line) return
      expect(line, `line ${i} changed`).toBe(before[i])
    })
  })

  it('refuses to write when the line no longer matches', async () => {
    // Guards against the file being edited by hand between render and submit —
    // a stale line number would otherwise tick the wrong item.
    const { readTodo, toggleTodo } = await load()
    const { sections } = await readTodo()
    const item = sections[0].items[0]

    expect(await toggleTodo(item.line, 'Some other text entirely')).toBe(false)

    const after = await readTodo()
    expect(after.sections[0].items[0].done).toBe(false)
  })

  it('refuses a line number that is out of range', async () => {
    const { toggleTodo } = await load()
    expect(await toggleTodo(9999, 'First thing')).toBe(false)
  })

  it('refuses a line that is not a checkbox', async () => {
    const { toggleTodo } = await load()
    // Line 2 is the intro prose.
    expect(await toggleTodo(2, 'Intro prose that must survive untouched.')).toBe(false)
  })
})
