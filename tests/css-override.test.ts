/**
 * Static conformance test for the override sheet.
 *
 * SPEC §7/§13: the plugin may change exactly one aspect — the visibility of
 * the native per-message action row. This test guards that contract
 * mechanically: the sheet holds the current rule plus one legacy fallback,
 * every rule declares only `opacity: 1 !important`, and every rule is scoped
 * to stable `data-*` anchors instead of hashed CSS-module class names.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/visible-action-row.css', import.meta.url), 'utf8')

/** Comment-free, trimmed sheet body. */
const body = css.replace(/\/\*[\s\S]*?\*\//g, '').trim()

function parseRules(sheet: string): Array<{ selector: string; declarations: string[] }> {
  return sheet
    .split('}')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .map((part) => {
      const [selector, block] = part.split('{')
      return {
        selector: selector.trim(),
        declarations: block
          .split(';')
          .map(decl => decl.trim())
          .filter(decl => decl.length > 0),
      }
    })
}

describe('visible-action-row.css override contract', () => {
  const rules = parseRules(body)

  it('holds exactly two rules: the current DSH anchor plus the legacy fallback', () => {
    expect(rules).toHaveLength(2)
  })

  it('pins the current action row through stable data anchors', () => {
    const { selector } = rules[0]!
    expect(selector).toContain('[data-chat-flow-kind] [data-clock]')
    expect(selector).toContain('[data-actions-reveal] [data-clock]')
    // Stable anchors only — never a hashed CSS-module class name.
    expect(selector).not.toMatch(/_[A-Za-z0-9]+_/)
  })

  it('keeps the legacy clock-span fallback for older DSH builds', () => {
    const { selector } = rules[1]!
    expect(selector.startsWith('[data-time-hover-root]')).toBe(true)
    expect(selector).toContain('[class*="timeStart"]')
    expect(selector).toContain('[class*="timeEnd"]')
  })

  it('changes only opacity, and only to fully visible, in every rule', () => {
    for (const rule of rules) {
      expect(rule.declarations).toHaveLength(1)
      const [property, value] = rule.declarations[0]!.split(':')
      expect(property!.trim()).toBe('opacity')
      expect(value!.trim()).toBe('1 !important')
    }
  })

  it('never targets buttons and stays inside the message-row scope', () => {
    for (const rule of rules) {
      expect(rule.selector).not.toContain('button')
      expect(rule.selector).not.toMatch(/\[class\*="action"\]/)
      expect(rule.selector).toMatch(/^\[data-/)
    }
  })

  it('touches no layout, typography, or color properties anywhere in the sheet', () => {
    const forbidden = ['display', 'visibility', 'position', 'font', 'color', 'margin', 'padding', 'width', 'height', 'content', 'transform', 'transition']
    for (const property of forbidden) {
      expect(body).not.toMatch(new RegExp(`(^|[;{])${property}\\s*:`))
    }
  })
})
