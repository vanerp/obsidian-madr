import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMadrSpy = vi.fn();
vi.mock('../../src/commands/create-madr', () => ({
	createMadr: (...args: unknown[]) => createMadrSpy(...args),
}));

import { TFile, WorkspaceLeaf } from 'obsidian';
import { ChecklistView } from '../../src/views/checklist-view';
import type MadrPlugin from '../../src/main';
import { MadrSettings } from '../../src/types';

function makePlugin(madrDirectories: string[]): MadrPlugin {
	const settings: MadrSettings = {
		madrDirectories,
		defaultVersion: '4.0',
		creationDefaults: { status: '', decisionMakers: [], consulted: [], informed: [] },
	};
	return { settings } as MadrPlugin;
}

describe('ChecklistView', () => {
	beforeEach(() => {
		createMadrSpy.mockClear();
	});

	it('always renders the Create new ADR button when no file is active', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(null);

		await view.onOpen();

		const button = view.contentEl.querySelector('button.madr-panel-create-button');
		expect(button?.textContent).toBe('Create new ADR');
	});

	it('renders the Create new ADR button and reuses createMadr when clicked, even with a recognized ADR active', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		const file = new TFile('decisions/my-decision.md');
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();

		const button = view.contentEl.querySelector<HTMLButtonElement>('button.madr-panel-create-button');
		button?.click();

		expect(createMadrSpy).toHaveBeenCalledWith(plugin);
	});

	it('shows only the empty-state message inside the checks section when no recognized ADR is active', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(null);

		await view.onOpen();

		const section = view.contentEl.querySelector('.madr-panel-checks-section');
		expect(section?.querySelector('.madr-checklist-empty')).not.toBeNull();
		expect(section?.querySelector('.madr-checklist-list')).toBeNull();
	});

	it('shows the checks list inside the checks section when a recognized ADR is active', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		const file = new TFile('decisions/my-decision.md');
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();

		const section = view.contentEl.querySelector('.madr-panel-checks-section');
		expect(section?.querySelector('.madr-checklist-list')).not.toBeNull();
		expect(section?.querySelector('.madr-checklist-empty')).toBeNull();
	});

	it('shows the checks list for a record nested multiple directories deep under a configured MADR directory', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		const file = new TFile('decisions/frontend/auth/my-decision.md');
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();

		const section = view.contentEl.querySelector('.madr-panel-checks-section');
		expect(section?.querySelector('.madr-checklist-list')).not.toBeNull();
		expect(section?.querySelector('.madr-checklist-empty')).toBeNull();
	});

	it('toggles between the checks list and the empty-state message when the active file changes', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		const file = new TFile('decisions/my-decision.md');
		const activeFileSpy = vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();
		let section = view.contentEl.querySelector('.madr-panel-checks-section');
		expect(section?.querySelector('.madr-checklist-list')).not.toBeNull();

		activeFileSpy.mockReturnValue(null);
		await (view as unknown as { render(): Promise<void> }).render();

		section = view.contentEl.querySelector('.madr-panel-checks-section');
		expect(section?.querySelector('.madr-checklist-empty')).not.toBeNull();
		expect(section?.querySelector('.madr-checklist-list')).toBeNull();
	});

	it('splits checks into a Metadata group, a Content group, and a Markdown style group', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		const file = new TFile('decisions/my-decision.md');
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();

		const groups = view.contentEl.querySelectorAll('.madr-checklist-group');
		expect(groups).toHaveLength(3);

		const headings = Array.from(groups).map((group) => group.querySelector('.madr-checklist-group-heading')?.textContent);
		expect(headings).toEqual(['Metadata', 'Content', 'Markdown style']);

		const metadataGroup = groups[0];
		expect(metadataGroup?.querySelectorAll('.madr-checklist-item').length).toBeGreaterThan(0);
		expect(metadataGroup?.textContent).toContain('Status');
		expect(metadataGroup?.textContent).not.toContain('Title is');

		const contentGroup = groups[1];
		expect(contentGroup?.querySelectorAll('.madr-checklist-item').length).toBeGreaterThan(0);
		expect(contentGroup?.textContent).toContain('Title is');
		expect(contentGroup?.textContent).not.toContain('Status');

		const markdownStyleGroup = groups[2];
		expect(markdownStyleGroup?.querySelectorAll('.madr-checklist-item').length).toBeGreaterThan(0);
	});

	it('shows a single passing Markdown style entry for a clean recognized ADR', async () => {
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistView(new WorkspaceLeaf(), plugin);
		const file = new TFile('decisions/my-decision.md');
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();

		const groups = view.contentEl.querySelectorAll('.madr-checklist-group');
		const markdownStyleGroup = Array.from(groups).find(
			(group) => group.querySelector('.madr-checklist-group-heading')?.textContent === 'Markdown style',
		);

		const items = markdownStyleGroup?.querySelectorAll('.madr-checklist-item') ?? [];
		expect(items).toHaveLength(1);
		expect(items[0]?.classList.contains('madr-checklist-item--pass')).toBe(true);
		expect(markdownStyleGroup?.textContent).toContain('Markdown formatting follows MADR conventions');
	});

	it('omits the Markdown style group entirely when markdownlint fails to lint the note', async () => {
		vi.resetModules();
		vi.doMock('markdownlint/sync', () => ({
			lint: () => {
				throw new Error('boom');
			},
		}));
		vi.spyOn(console, 'error').mockImplementation(() => {});

		const { ChecklistView: ChecklistViewWithMock } = await import('../../src/views/checklist-view');
		const { TFile: TFileWithMock, WorkspaceLeaf: WorkspaceLeafWithMock } = await import('obsidian');
		const plugin = makePlugin(['decisions']);
		const view = new ChecklistViewWithMock(new WorkspaceLeafWithMock(), plugin);
		const file = new TFileWithMock('decisions/my-decision.md');
		vi.spyOn(view.app.workspace, 'getActiveFile').mockReturnValue(file);
		vi.spyOn(view.app.vault, 'read').mockResolvedValue('# My decision\n');

		await view.onOpen();

		const groups = view.contentEl.querySelectorAll('.madr-checklist-group');
		const headings = Array.from(groups).map((group) => group.querySelector('.madr-checklist-group-heading')?.textContent);
		expect(headings).toEqual(['Metadata', 'Content']);

		vi.doUnmock('markdownlint/sync');
		vi.resetModules();
	});
});
