window.__ModuleLoader__.load({
  id: "dsh-visible-action-row",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";

// src/client/visible-action-row.css
var visible_action_row_default = '/*\n * dsh-visible-action-row override.\n *\n * DSH hides the whole per-message action row \u2014 copy / like / dislike / branch\n * controls, the timestamp, extra actions contributed by other plugins, and the\n * detailed-usage pill \u2014 and reveals it only on hover or focus. The row keeps\n * its space while hidden (opacity, not display), so layout never shifts and\n * the whole feature is a pure visibility override.\n *\n * Two hiding mechanisms exist across DSH versions:\n *\n * - Current (packages/client/ui-chat >= 0.2.x): the actions row\'s root div\n *   carries `data-clock` (MessageIconActions.tsx). MessageIconActions.module.css\n *   hides it under `@media (hover: hover)` for rows whose container has\n *   `data-actions-reveal="hover"` (set by TurnTailNodeView.tsx: the newest\n *   response gets "always"), and for user/steering flow rows followed by\n *   another user/steering row (`:has(~ ...)`). Only the newest turn escapes it.\n * - Legacy (packages/client/ui-conversation <= 0.1.0-rc.x): only the timestamp\n *   span (`timeStart` / `timeEnd`) was hidden inside a `data-time-hover-root`\n *   scope.\n *\n * Both rules below cancel that hiding, so every message\'s action row keeps the\n * visible state the newest turn already has. `!important` is required: the\n * native declaration is an ordinary rule and this plugin\'s stylesheet order is\n * not ours to control. No other property is touched \u2014 fonts, colors, spacing,\n * alignment, button behavior and the row\'s own hover effects stay native.\n */\n[data-chat-flow-kind] [data-clock],\n[data-actions-reveal] [data-clock] {\n  opacity: 1 !important;\n}\n\n/* Legacy DSH builds (ui-conversation <= 0.1.0-rc.x). */\n[data-time-hover-root] :is([class*="timeStart"], [class*="timeEnd"]) {\n  opacity: 1 !important;\n}\n';

// src/client/index.ts
var name = "dsh-visible-action-row";
var STYLE_TAG_ID = "dsh-visible-action-row/visible-action-row.css";
function apply(ctx) {
  const existing = document.querySelector(`style[data-plugin-css=${JSON.stringify(STYLE_TAG_ID)}]`);
  const style = existing != null ? existing : document.createElement("style");
  if (existing === null) {
    style.dataset.plugin = name;
    style.dataset.pluginCss = STYLE_TAG_ID;
    style.textContent = visible_action_row_default;
    document.head.appendChild(style);
  }
  ctx.effect(() => () => {
    style.remove();
  }, `${name}: always-visible action row style`);
}
module.exports = { name, apply };
    return module.exports;
  },
});
