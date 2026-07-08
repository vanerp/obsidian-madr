import { App, TFolder } from 'obsidian';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let nextFolders: TFolder[] = [];

vi.mock('../../src/modals/folder-suggest-modal', () => ({
	FolderSuggestModal: vi.fn().mockImplementation(function (
		_app: unknown,
		_folders: TFolder[],
		onChoose: (folder: TFolder) => void,
	) {
		return {
			open: () => {
				const [first] = nextFolders;
				if (first) {
					onChoose(first);
				}
			},
		};
	}),
}));

import { MadrSettingTab } from '../../src/settings';
import type MadrPlugin from '../../src/main';
import { MadrSettings } from '../../src/types';

function makePlugin(madrDirectories: string[]): {
	plugin: MadrPlugin;
	settings: MadrSettings;
	saveSettings: ReturnType<typeof vi.fn>;
} {
	const settings: MadrSettings = {
		madrDirectories,
		defaultVersion: '4.0',
		creationDefaults: { status: '', decisionMakers: [], consulted: [], informed: [] },
	};
	const saveSettings = vi.fn(async () => {});
	const plugin = {
		app: new App(),
		settings,
		saveSettings,
	} as unknown as MadrPlugin;

	return { plugin, settings, saveSettings };
}

beforeEach(() => {
	nextFolders = [];
});

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('MadrSettingTab.display() (FR-019, FR-030-FR-032 no-heading check)', () => {
	it('renders without throwing and adds no heading elements', () => {
		const { plugin } = makePlugin([]);
		const tab = new MadrSettingTab(plugin.app, plugin);

		expect(() => tab.display()).not.toThrow();

		const headings = tab.containerEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
		expect(headings.length).toBe(0);
	});

	it('lists configured directories with a remove control', () => {
		const { plugin } = makePlugin(['decisions']);
		const tab = new MadrSettingTab(plugin.app, plugin);

		tab.display();

		expect(tab.containerEl.textContent).toContain('decisions');
		const removeButton = tab.containerEl.querySelector('[aria-label="Remove directory"]');
		expect(removeButton).not.toBeNull();
	});

	it('adds a folder via the folder picker and persists it', async () => {
		const { plugin, settings, saveSettings } = makePlugin([]);
		nextFolders = [new TFolder('decisions')];
		const tab = new MadrSettingTab(plugin.app, plugin);
		tab.display();

		const addButton = Array.from(tab.containerEl.querySelectorAll('button')).find(
			(el) => el.textContent === 'Add folder',
		);
		addButton?.dispatchEvent(new Event('click'));
		await flushPromises();

		expect(settings.madrDirectories).toEqual(['decisions']);
		expect(saveSettings).toHaveBeenCalledTimes(1);
	});

	it('removes a directory and persists the change across a re-render', async () => {
		const { plugin, settings, saveSettings } = makePlugin(['decisions']);
		const tab = new MadrSettingTab(plugin.app, plugin);
		tab.display();

		const removeButton = tab.containerEl.querySelector('[aria-label="Remove directory"]');
		removeButton?.dispatchEvent(new Event('click'));
		await flushPromises();

		expect(settings.madrDirectories).toEqual([]);
		expect(saveSettings).toHaveBeenCalledTimes(1);
		expect(tab.containerEl.textContent).not.toContain('decisions');
	});
});

describe('MadrSettingTab.display() record defaults (FR-011, FR-013)', () => {
	function findTextInput(tab: MadrSettingTab, settingName: string): HTMLInputElement {
		const settingEl = Array.from(tab.containerEl.querySelectorAll('.setting-item')).find((el) =>
			el.querySelector('.setting-item-name')?.textContent?.includes(settingName),
		);
		const input = settingEl?.querySelector('input');
		if (!input) {
			throw new Error(`No text input found for setting "${settingName}"`);
		}
		return input;
	}

	it('changes the default version and persists it', async () => {
		const { plugin, settings, saveSettings } = makePlugin([]);
		const tab = new MadrSettingTab(plugin.app, plugin);
		tab.display();

		const select = tab.containerEl.querySelector('select');
		expect(select).not.toBeNull();
		if (select) {
			select.value = '3.0';
			select.dispatchEvent(new Event('change'));
		}
		await flushPromises();

		expect(settings.defaultVersion).toBe('3.0');
		expect(saveSettings).toHaveBeenCalledTimes(1);
	});

	it('updates default status and persists it', async () => {
		const { plugin, settings, saveSettings } = makePlugin([]);
		const tab = new MadrSettingTab(plugin.app, plugin);
		tab.display();

		const input = findTextInput(tab, 'Default status');
		input.value = 'proposed';
		input.dispatchEvent(new Event('input'));
		await flushPromises();

		expect(settings.creationDefaults.status).toBe('proposed');
		expect(saveSettings).toHaveBeenCalledTimes(1);
	});

	it('parses comma-separated decision-makers, consulted, and informed lists', async () => {
		const { plugin, settings } = makePlugin([]);
		const tab = new MadrSettingTab(plugin.app, plugin);
		tab.display();

		const decisionMakers = findTextInput(tab, 'Default decision-makers');
		decisionMakers.value = 'Alice, Bob ,  Carol';
		decisionMakers.dispatchEvent(new Event('input'));

		const consulted = findTextInput(tab, 'Default consulted');
		consulted.value = 'Dana';
		consulted.dispatchEvent(new Event('input'));

		const informed = findTextInput(tab, 'Default informed');
		informed.value = '';
		informed.dispatchEvent(new Event('input'));
		await flushPromises();

		expect(settings.creationDefaults.decisionMakers).toEqual(['Alice', 'Bob', 'Carol']);
		expect(settings.creationDefaults.consulted).toEqual(['Dana']);
		expect(settings.creationDefaults.informed).toEqual([]);
	});
});
