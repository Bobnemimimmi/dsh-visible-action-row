# Changelog

## 0.2.0 — 2026-11-04

Renamed from `dsh-always-status-bar`, and the scope widened from the timestamp to the whole action row.

- Pins the complete per-message action row — copy / like / dislike / branch controls, timestamp, and third-party additions — for every message instead of only the newest turn.
- New package name `dsh-visible-action-row`; the previous package name is deprecated.
- Targets the DSH 0.2.x anchors (`data-clock`, `data-actions-reveal`, `data-chat-flow-kind`) and keeps a fallback rule for pre-0.2 builds.
- Build output no longer depends on the contributor's line endings (`.gitattributes` plus CSS normalization at build time).

## 0.1.0 — 2026-08-27

First public release.

- Always-visible native per-message status line: date | time on every message; run duration, TTFT, and tokens/s on assistant messages.
- Installable from npm (`dsh plugin add dsh-always-status-bar`) or GitHub.
- One scoped CSS override; zero configuration, no persistence, no backend.
