# Obsidian community plugin review compliance

Status of all 35 rules from `specs/003-store-review-compliance/spec.md`, re-evaluated as of 2026-07-06 now that `001-madr-authoring` has implemented the plugin's real commands, settings, and checklist view. Verified via `npm run lint` (0 errors, 1 non-blocking warning), `npm test` (8 files, 53 tests, all passing), and `npm run build` — see `specs/001-madr-authoring/quickstart.md` for the manual validation script.

Legend: **Fixed** = was a violation, now corrected. **Pass** = already compliant, no change needed. **Not yet applicable** = the code this rule governs doesn't exist yet (deferred to `001-madr-authoring`). **Open question** = can't be resolved with confidence from inside this repo.

## Manifest and listing

| Rule | Status | Detail |
|---|---|---|
| FR-001 — id doesn't contain "obsidian"; not already taken | Fixed / Open question | Plugin directory and manifest `id` changed from `obisdian-madr` to `madr` (no longer contains "obsidian"). Whether `madr` is already taken by another listed plugin **cannot be checked from this repo** — it requires searching the live `obsidian-releases` community-plugins list at submission time. Tracked as a checklist item in `README.md`. |
| FR-002 — name doesn't end in "Plugin", doesn't repeat id | Fixed | Name changed to "MADR Author" (was "Obsidian Sample Plugin" — ended in "Plugin" and referenced the id). |
| FR-003 — description doesn't start with "This plugin", no "Obsidian", ends with punctuation | Fixed | Description changed to "Author Markdown Any Decision Records directly in your vault." |
| FR-004 — `minAppVersion` is real and current | Fixed | Resolved by `001-madr-authoring` T031: set to `1.1.0`, the actual floor required by the implemented code. `Workspace.revealLeaf` (`@since` 1.7.2) was avoided in favor of `Workspace.setActiveLeaf` (`@since` 0.16.3) in `src/commands/open-checklist.ts` specifically to keep `minAppVersion` low, per `obsidian.d.ts` `@since` tags for every Obsidian API called in `src/`. |
| FR-005 — `fundingUrl` only if donations are accepted | Fixed | `fundingUrl` field removed from `manifest.json`; this plugin does not accept donations. |
| FR-006 — git tag / GitHub release matches manifest `version` | **Open question** | The plugin's directory is a nested git repo whose `origin` remote still points at `obsidianmd/obsidian-sample-plugin`, and its only tag (`1.0.0`) is leftover template history from 2020 — not a release of this plugin. No real release has been cut yet, so there's nothing to check against `manifest.json`'s `version` (also `1.0.0`, coincidentally). Before any actual release: re-point `origin` to the real repository and tag the first real release to match `manifest.json` exactly (no `v` prefix). |
| FR-007 — `README.md` and `LICENSE` exist | Pass | Both present at the plugin root; rewritten (see FR-009) to describe this plugin instead of the template. |
| FR-008 — author is "Tijs van Erp", `authorUrl` matches | Fixed | Was `author: "Obsidian"` with no `authorUrl`. Now `author: "Tijs van Erp"`, `authorUrl: "https://github.com/tijsvanerp"`. |
| FR-009 — id/name changed from Obsidian-referencing placeholders | Fixed | `id: "madr"`, `name: "MADR Author"` (previously referenced "obsidian" and "sample plugin"). `README.md` and `LICENSE` (copyright line) also rewritten to match. |

## Security

| Rule | Status | Detail |
|---|---|---|
| FR-010 — no `innerHTML`/`outerHTML`/string-built HTML | Pass | Confirmed via `grep` across `src/` and `eslint-plugin-obsidianmd` lint — zero matches. |
| FR-011 — no `eval`/dynamic `Function` | Pass | Confirmed via `grep` — zero matches. |
| FR-012 — no obfuscated/minified source committed | Pass | `main.js` (the minified build output) is git-ignored and not tracked; only readable, unminified TypeScript source is committed. |
| FR-013 — network calls declared and match documentation | Pass | The plugin makes zero network calls (confirmed via `grep` for `fetch`/`XMLHttpRequest`/`axios`/`requestUrl` — no matches). `README.md` states this explicitly. |

## Memory and lifecycle

| Rule | Status | Detail |
|---|---|---|
| FR-014 — listeners/intervals/subscriptions clean up automatically | Pass | No manual `addEventListener`/`setInterval`/`setTimeout` calls exist anywhere in `src/`. Enforced going forward by `tests/unit/lifecycle.test.ts`. |
| FR-015 — no cached view/component references on the plugin instance | Pass | `MadrPlugin` only stores `settings` (a plain data object) on `this` — no view/component reference is cached. Must be re-verified once real view-lookup code is added. |
| FR-016 — `onunload` doesn't force-close panes/views | Pass | `onunload()` is empty; it can't be forcing anything closed. |

## Type safety

| Rule | Status | Detail |
|---|---|---|
| FR-017 — `instanceof` over casting for file/folder objects | Pass | `src/commands/create-madr.ts` checks `file instanceof TFile` before opening a newly created file; `src/views/checklist-view.ts` checks `activeFile instanceof TFile` before evaluating it; `src/settings.ts` filters `getAllLoadedFiles()` with `file instanceof TFolder`. No type assertions on file/folder objects anywhere in `src/`. |
| FR-018 — correct multi-window handling | Fixed (ahead of need) | Added `src/window-utils.ts` (`getOwnerWindow`/`getOwnerDocument`), resolving the owning window/document from an element's `ownerDocument` rather than assuming the global `window`/`document`. Future UI code must route through these helpers. |

## UI and text

| Rule | Status | Detail |
|---|---|---|
| FR-019 — sentence case for interface text | Pass | All settings labels/descriptions (`src/settings.ts`) and view text (`src/views/checklist-view.ts`) are sentence case — e.g. "MADR directories", "Add folder", "Default decision-makers", "Architecture decision record checklist". The one acronym-detection false positive (`getDisplayText()` originally returning "ADR checklist") was resolved by spelling out "Architecture decision record checklist" instead. |
| FR-020 — command names don't contain "command" or repeat the plugin name | Pass | `src/main.ts` registers "Create new architecture decision record" and "Open architecture decision record checklist" — neither contains "command" or repeats the plugin name "MADR Author". |
| FR-021 — no default hotkeys | Pass | Both `addCommand` calls in `src/main.ts` omit `hotkeys` entirely. |
| FR-022 — settings headings use the framework's heading helper | Pass | `MadrSettingTab.display()` adds no heading element at all (raw or via helper) — trivially satisfies "no raw HTML heading tags." Enforced by `tests/unit/settings-tab.test.ts`. |

## File operations

| Rule | Status | Detail |
|---|---|---|
| FR-023 — open-file edits go through the live editor | Not yet applicable | `001-madr-authoring` only ever creates new files (`vault.create`) or reads existing ones (`vault.read`, for the checklist) — it never edits the content of an already-open file. There is still nothing to check against this rule; would apply if a future feature edits existing ADRs in place. |
| FR-024 — background edits use an atomic modify, not read-then-write | Not yet applicable | Same reasoning as FR-023: no feature modifies the content of an existing file at all, in the foreground or background. Would apply if a future feature does so. |
| FR-025 — deletion goes through the trash function | Not yet applicable | No file-deletion feature exists in `001-madr-authoring`. Would apply if one is added. |
| FR-026 — files are looked up directly by path | Pass | `src/commands/create-madr.ts` uses `vault.getAbstractFileByPath(path)` for the filename-collision check — never iterates `vault.getFiles()` to find one file. |

## Styling

| Rule | Status | Detail |
|---|---|---|
| FR-027 — no inline styles in code | Pass | No code sets `.style.*` or an inline `style=` attribute anywhere. |
| FR-028 — use the app's existing CSS variables | Pass | `styles.css` (added by T030 for the checklist view) uses only Obsidian CSS variables — `--text-muted`, `--size-4-2`, `--size-4-1`, `--font-bold`, `--text-success`, `--text-error`, `--text-normal` — no hardcoded colors, spacing, or type values. |
| FR-029 — no runtime-injected `<style>`/`<link>` tags | Pass | No code creates `style` or `link` elements at runtime. |

## Accessibility

| Rule | Status | Detail |
|---|---|---|
| FR-030 — keyboard operability of interactive elements | Pass | All interactive controls (`src/settings.ts`) are built via `Setting`'s `addText`/`addDropdown`/`addButton`/`addExtraButton`, which render native `<input>`/`<select>`/`<button>` elements — natively focusable and keyboard-operable. No custom click-only `<div>`s. |
| FR-031 — icon-only buttons have a screen-reader label | Pass | The icon-only "remove directory" button (`src/settings.ts`, `addExtraButton` with `setIcon('trash')`) has `.setTooltip('Remove directory')`, which Obsidian renders as an `aria-label`. Verified by `tests/unit/settings-tab.test.ts`. |
| FR-032 — visible focus states | Pass | `styles.css` sets no `outline`/`:focus` overrides — default Obsidian focus styles remain untouched on every control. |

## Code quality

| Rule | Status | Detail |
|---|---|---|
| FR-033 — `const`/`let`, never `var` | Pass | No `var` declarations anywhere in `src/`; enforced by lint (`no-var`). |
| FR-034 — `async`/`await`, not chained `.then()` | Pass | `loadSettings()`/`saveSettings()`/`onload()` all use `async`/`await`; zero `.then()` chains in `src/`. |
| FR-035 — no leftover placeholder names or "TODO" markers | Fixed | Removed all references to "Sample", "MyPlugin", and "TODO" from `src/` (demo modal, demo settings, demo commands). Enforced going forward by `npm run check:placeholders` and `tests/unit/no-placeholders.test.ts`. |

## Summary of what was fixed

Real violations found and corrected during `003-store-review-compliance`: **FR-002, FR-003, FR-005, FR-008, FR-009, FR-018 (proactively), FR-035** — mostly manifest/listing metadata that referenced the sample-plugin template, plus removal of all demo/placeholder code, plus a multi-window helper added ahead of need.

`001-madr-authoring` then closed out every rule that had been deferred as "not yet applicable": it resolved **FR-004** (`minAppVersion` set to `1.1.0`) and, once real commands/settings/file-operations/checklist-view code existed, confirmed **FR-017, FR-019, FR-020, FR-021, FR-026, FR-028, FR-030, FR-031, FR-032** all pass — no second compliance pass or rework was needed because the implementation patterns recorded in `specs/003-store-review-compliance/data-model.md` and `research.md` were followed from the start (e.g. avoiding `Workspace.revealLeaf` in favor of the version-compatible `setActiveLeaf` specifically to keep FR-004's floor low).

**FR-023, FR-024, FR-025** remain **not yet applicable**: `001-madr-authoring` only creates new files and reads existing ones for the checklist — it never edits or deletes an existing file's content, so there is nothing yet to check against the live-editor, atomic-modify, or trash-deletion rules. They'll apply if a future feature edits or deletes ADRs in place.

Rules that were already compliant with no change needed: **FR-007, FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-016, FR-022, FR-027, FR-029, FR-033, FR-034**.

## Couldn't fix / unresolved (open questions)

1. **FR-001 (id uniqueness)** — Whether `madr` is already taken by another community plugin can't be checked from inside this repo; requires a live lookup against the `obsidian-releases` community-plugins list immediately before submission.
2. **FR-006 (git tag/release matching)** — The plugin's nested git repo still has its `origin` remote pointing at the upstream `obsidian-sample-plugin` template, and its one existing tag (`1.0.0`) is leftover template history rather than a real release. This should be cleaned up (repoint `origin`, avoid confusing the leftover tag with a real release) before the first actual release is cut — a repository-hygiene action outside the scope of source-code changes.
3. **Minor, non-blocking**: `npm run lint` reports one warning — `obsidianmd/settings-tab/prefer-setting-definitions` on `src/settings.ts` — a style recommendation from the Obsidian lint plugin, not one of the 35 specified rules.
