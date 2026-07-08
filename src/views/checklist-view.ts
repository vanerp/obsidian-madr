import { debounce, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import type MadrPlugin from '../main';
import { detectVersion, evaluateChecks, isRecognizedAdr } from '../checks/evaluate-checks';
import { createMadr } from '../commands/create-madr';
import { Check } from '../types';

export const CHECKLIST_VIEW_TYPE = 'madr-checklist-view';
const REFRESH_DEBOUNCE_MS = 300;

export class ChecklistView extends ItemView {
	private readonly plugin: MadrPlugin;
	private readonly refresh: () => void;

	constructor(leaf: WorkspaceLeaf, plugin: MadrPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.refresh = debounce(() => void this.render(), REFRESH_DEBOUNCE_MS, true);
	}

	getViewType(): string {
		return CHECKLIST_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Architecture decision record checklist';
	}

	getIcon(): string {
		return 'list-checks';
	}

	async onOpen(): Promise<void> {
		this.registerEvent(this.app.workspace.on('active-leaf-change', this.refresh));
		this.registerEvent(this.app.vault.on('modify', this.refresh));
		await this.render();
	}

	private async render(): Promise<void> {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('madr-checklist-view');

		contentEl
			.createEl('button', {
				text: 'Create new ADR',
				cls: 'mod-cta madr-panel-create-button',
			})
			.addEventListener('click', () => createMadr(this.plugin));

		const checksSection = contentEl.createDiv({ cls: 'madr-panel-checks-section' });

		const activeFile = this.app.workspace.getActiveFile();
		const recognized = activeFile instanceof TFile && isRecognizedAdr(activeFile, this.plugin.settings);

		if (!recognized || activeFile === null) {
			checksSection.createEl('p', {
				cls: 'madr-checklist-empty',
				text: 'Open an architecture decision record to see its checklist.',
			});
			return;
		}

		const fileContent = await this.app.vault.read(activeFile);
		const version = detectVersion(fileContent, this.plugin.settings.defaultVersion);
		const checks = evaluateChecks(fileContent, version);

		const metadataChecks = checks.filter((check) => check.id.startsWith('metadata-'));
		const markdownStyleChecks = checks.filter((check) => check.id.startsWith('markdown-style-'));
		const contentChecks = checks.filter(
			(check) => !check.id.startsWith('metadata-') && !check.id.startsWith('markdown-style-'),
		);

		this.renderGroup(checksSection, 'Metadata', metadataChecks);
		this.renderGroup(checksSection, 'Content', contentChecks);
		if (markdownStyleChecks.length > 0) {
			this.renderGroup(checksSection, 'Markdown style', markdownStyleChecks);
		}
	}

	private renderGroup(container: HTMLElement, heading: string, checks: Check[]): void {
		const group = container.createDiv({ cls: 'madr-checklist-group' });
		group.createEl('p', { cls: 'madr-checklist-group-heading', text: heading });
		const list = group.createEl('ul', { cls: 'madr-checklist-list' });
		for (const check of checks) {
			this.renderCheck(list, check);
		}
	}

	private renderCheck(list: HTMLElement, check: Check): void {
		const item = list.createEl('li', {
			cls: `madr-checklist-item madr-checklist-item--${check.status}`,
		});
		item.createSpan({
			cls: 'madr-checklist-icon',
			text: check.status === 'pass' ? '✓' : '✗',
		});
		item.createSpan({ cls: 'madr-checklist-label', text: check.label });
	}
}
