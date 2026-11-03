// @vitest-environment jsdom
/**
 * Structure-alignment test for the shipped selector sheet.
 *
 * The override matches `data-*` anchors instead of hashed CSS-module class
 * names, so the drift risk to guard is between those anchors and the markup
 * DSH actually emits (verified in the DSH source, `packages/client/ui-chat`):
 *
 *   flow row  [data-chat-flow-kind="user" | "steering" | "turn-tail" | ...]
 *     └─ (assistant only) turn tail  [data-actions-reveal="always" | "hover"]
 *          └─ actions row  [data-clock="start" | "end"]
 *
 * The selectors under test are READ FROM the shipped stylesheet, so this test
 * fails if the stylesheet and the real markup structure diverge.
 *
 * DSH's own hide rules are structural (`data-actions-reveal="hover"` plus a
 * `:has(~ …)` sibling test for user/steering rows). Those are asserted here as
 * plain DOM facts rather than by re-evaluating `:has()`, because jsdom's
 * support for `:has(~ …)` is not reliable enough to be the oracle.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/client/visible-action-row.css'), 'utf8')
const rules = css
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('}')
  .map(part => part.trim())
  .filter(part => part.length > 0)
  .map(part => part.split('{')[0]!.trim())

const currentSelector = rules[0]!
const legacySelector = rules[1]!

/** One message row shaped like the real DSH 0.2.x markup. */
function messageRow(options: {
  flowKind: string
  clock: 'start' | 'end'
  reveal?: 'always' | 'hover'
  id: string
}): string {
  const tail = options.reveal === undefined
    ? ''
    : `<div class="tail" data-actions-reveal="${options.reveal}">`
  const closeTail = options.reveal === undefined ? '' : '</div>'
  return '<div class="flowItem" data-chat-flow-kind="' + options.flowKind + '">'
    + tail
    + '<div class="_1KfHza_actions" data-clock="' + options.clock + '" data-row="' + options.id + '">'
    + '<span class="_1KfHza_timeStart">2026-11-03 23:00</span>'
    + '<button class="_1KfHza_action" aria-label="copy"></button>'
    + '</div>'
    + closeTail
    + '</div>'
}

/** Two user rows and two assistant rows: only the newest of each stays visible. */
function conversation(): void {
  document.body.innerHTML = [
    messageRow({ flowKind: 'user', clock: 'start', id: 'user-old' }),
    messageRow({ flowKind: 'turn-tail', clock: 'end', reveal: 'hover', id: 'assistant-old' }),
    messageRow({ flowKind: 'user', clock: 'start', id: 'user-new' }),
    messageRow({ flowKind: 'turn-tail', clock: 'end', reveal: 'always', id: 'assistant-new' }),
  ].join('')
}

const rowIds = (selector: string): string[] =>
  [...document.querySelectorAll<HTMLElement>(selector)].map(el => el.dataset.row ?? '').sort()

describe('shipped sheet vs real DSH markup', () => {
  it('ships exactly the current rule plus the legacy fallback', () => {
    expect(rules).toHaveLength(2)
    expect(currentSelector).toContain('[data-clock]')
    expect(legacySelector).toContain('[data-time-hover-root]')
  })

  it('the fixture mirrors DSH: newest assistant is `always`, the older one `hover`', () => {
    conversation()
    const reveal = (value: string): string[] =>
      [...document.querySelectorAll<HTMLElement>('[data-actions-reveal="' + value + '"] [data-clock]')]
        .map(el => el.dataset.row ?? '')
    expect(reveal('always')).toEqual(['assistant-new'])
    expect(reveal('hover')).toEqual(['assistant-old'])
  })

  it('the fixture mirrors DSH: only the last user row lacks a later user/steering row', () => {
    conversation()
    const userRows = [...document.querySelectorAll<HTMLElement>('[data-chat-flow-kind="user"]')]
    const followed = (row: Element): boolean => [...(row.parentElement?.children ?? [])]
      .slice([...(row.parentElement?.children ?? [])].indexOf(row) + 1)
      .some(sibling => ['user', 'steering'].includes(sibling.getAttribute('data-chat-flow-kind') ?? ''))
    expect(userRows.map(row => [row.querySelector<HTMLElement>('[data-clock]')!.dataset.row, followed(row)]))
      .toEqual([['user-old', true], ['user-new', false]])
  })

  it('the current rule matches EVERY message action row', () => {
    conversation()
    expect(rowIds(currentSelector)).toEqual(['assistant-new', 'assistant-old', 'user-new', 'user-old'])
  })

  it('the current rule also covers a non-last steering row', () => {
    document.body.innerHTML = [
      messageRow({ flowKind: 'steering', clock: 'start', id: 'steering-old' }),
      messageRow({ flowKind: 'user', clock: 'start', id: 'user-new' }),
    ].join('')
    expect(rowIds(currentSelector)).toEqual(['steering-old', 'user-new'])
  })

  it('the legacy rule matches the pre-0.2 markup and nothing in the new markup', () => {
    document.body.innerHTML = '<div data-time-hover-root>'
      + '<span class="_4uWncW_timeStart">2026-08-26 12:00</span>'
      + '<span class="_4uWncW_timeEnd">2026-08-26 12:00</span>'
      + '</div>'
    expect(document.querySelectorAll(legacySelector)).toHaveLength(2)

    conversation()
    expect(document.querySelectorAll(legacySelector)).toHaveLength(0)
  })
})
