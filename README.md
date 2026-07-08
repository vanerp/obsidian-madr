# MADR Author

Author [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records) directly in your vault.

> **Note:** This plugin was developed with the assistance of agentic AI coding tools and practices. Review the source before trusting it in sensitive vaults.

## What it does

Author MADR-format architecture decision records as regular notes in your vault, with a live checklist that flags missing sections and leftover template placeholders. The plugin makes no network calls of any kind — all reading and writing happens locally against files in your vault.

## Installing

1. Copy `main.js`, `styles.css`, and `manifest.json` into `<vault>/.obsidian/plugins/madr/`.
2. Reload Obsidian (or use the "Reload app without saving" command) and enable "MADR Author" under Settings → Community plugins.

## Using it

1. **Configure a directory.** Open Settings → MADR Author and add one or more vault folders to hold your decision records. You can also set a default MADR version (3.0 or 4.0) and default values for status, decision-makers, consulted, and informed — these prefill every new record.
2. **Create a record.** There are two ways to start a new record:
   - Run the "Create new architecture decision record" command, give it a title, and (if you configured more than one directory) pick which one to save it in.
   - Right-click a configured MADR folder (or any subfolder inside it) in the file explorer and choose "Create new architecture decision record". This skips the directory picker and creates the record directly inside the folder you clicked.

   Either way, the plugin renders the MADR template for your default version into a new note, named from your title, and opens it.
3. **Use the side panel.** Click the lightbulb ribbon icon ("Open architecture decision record panel") or run the "Open architecture decision record checklist" command to open the panel in the sidebar. It has two parts:
   - A **Create new ADR** button at the top, so you can start another record without leaving the panel.
   - A live checklist for whichever record is currently active, split into a **Metadata** group (status, date, decision-makers, consulted, informed), a **Content** group (required sections present, at least one considered option, no leftover placeholder text, no near-empty sections), and a **Markdown style** group (formatting issues found by [markdownlint](https://github.com/DavidAnson/markdownlint), using MADR's own rule set — a single pass entry when the note is clean, or one failing entry per distinct rule violated, each naming the affected line numbers). Each item shows a pass (✓) or fail (✗) mark.

   The panel updates automatically as you edit the open note or switch to a different one, and shows a prompt instead of a checklist when the active note isn't a recognized ADR.

## Developing

```bash
npm install
npm run dev     # rebuilds on change
npm run build   # type-checks and produces a production build
npm test        # runs the unit test suite
npm run lint    # runs eslint, including Obsidian-specific plugin rules
```

Requires Node.js 18 or later.

## Before submitting a release

- [ ] Confirm the plugin `id` in `manifest.json` (`madr`) is still unique against the current [obsidian-releases community-plugins list](https://github.com/obsidianmd/obsidian-releases/blob/master/community-plugins.json).
- [ ] Confirm the git tag and the GitHub release title match `manifest.json`'s `version` field exactly, with no `v` prefix.
- [ ] Confirm `minAppVersion` in `manifest.json` matches the actual minimum Obsidian API surface used by the current code.

## License

0-BSD. See [LICENSE](LICENSE).
