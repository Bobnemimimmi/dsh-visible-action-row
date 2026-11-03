/**
 * dsh-visible-action-row — Browser half (the `./client` bundle).
 *
 * Classic-script bundle: registers a lazy factory with
 * `window.__ModuleLoader__` (the DSH client module system). The factory
 * returns the Cordis plugin shape the boot Loader imports; `apply` injects
 * one `<style data-plugin>` tag whose rules keep the native per-message
 * action row visible.
 *
 * Facts located in the DSH source checkout (0.2.2-alpha.2) and cross-checked
 * against the packaged desktop bundle (app.asar, 0.2.1-rc.5); both ship the
 * same `packages/client/ui-chat` browser bundle:
 * - The actions row is `MessageIconActions`' root div and carries the stable
 *   `data-clock="start" | "end"` attribute (`ui-chat/src/client/chat/
 *   MessageIconActions.tsx`).
 * - Assistant rows: `chat/TurnTailNodeView.tsx` sets
 *   `data-actions-reveal="always"` on the newest response and `"hover"`
 *   otherwise.
 * - User rows: hidden by `:has(~ :is([data-chat-flow-kind='user'],
 *   [data-chat-flow-kind='steering']))` in `MessageIconActions.module.css`,
 *   so only the last user row stays visible; every flow row carries
 *   `data-chat-flow-kind` (`chat/ChatNodeSeat.tsx`).
 * - Hiding is opacity-only (`opacity: 0` inside `@media (hover: hover)`),
 *   so a pure CSS visibility override is the whole feature: no DOM scanning,
 *   no observers, no polling, no React changes.
 * - CSS-module class names are hashed at build time, so the override targets
 *   the stable `data-*` anchors instead (see `visible-action-row.css`).
 */
import css from './visible-action-row.css'

// The bundle is a classic script wrapped by build.mjs in the same handoff
// shape as DSH's own client bundles: `var module = { exports: {} }` is
// declared in the banner before this body runs. Everything is exported via
// `module.exports` at the end — no ES export syntax, so the emitted file is
// a plain classic script with no module semantics.
declare const module: { exports: { name: string; apply: typeof apply } }

/** Cordis plugin name; must equal the package name (the graph row id). */
const name = 'dsh-visible-action-row'

/** Stable style tag id, mirroring the native `data-plugin-css` naming (`<id>/<file>`). */
const STYLE_TAG_ID = 'dsh-visible-action-row/visible-action-row.css'

/** Minimal structural view of the Cordis context this plugin uses. */
interface VisibleActionRowContext {
  effect(execute: () => () => void, label: string): unknown
}

/**
 * Inject the always-visible override, scoped to this plugin's fiber: the
 * effect disposer removes the style tag when the plugin unloads, restoring
 * native hover-only behavior with no page reload and no leftover CSS.
 * Re-application is idempotent (the native pipeline uses the same
 * `data-plugin-css` uniqueness guard).
 * @param ctx - the client plugin context.
 */
function apply(ctx: VisibleActionRowContext): void {
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`)
  const style: HTMLStyleElement = existing ?? document.createElement('style')
  if (existing === null) {
    style.dataset.plugin = name
    style.dataset.pluginCss = STYLE_TAG_ID
    style.textContent = css
    document.head.appendChild(style)
  }
  ctx.effect(() => () => {
    style.remove()
  }, `${name}: always-visible action row style`)
}

module.exports = { name, apply }
