import { describe, expect, it, vi } from 'vitest';

const createMadrInDirectorySpy = vi.fn();
vi.mock('../../src/commands/create-madr', () => ({
	createMadrInDirectory: (...args: unknown[]) => createMadrInDirectorySpy(...args),
}));

import { Menu, TFile, TFolder } from 'obsidian';
import { handleFileMenu } from '../../src/commands/register-folder-menu';
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

describe('handleFileMenu', () => {
	it('adds a create-ADR item when the right-clicked folder is a configured MADR directory', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('decisions');

		handleFileMenu(plugin, menu, folder);

		expect(menu.items).toHaveLength(1);
		expect(menu.items[0]?.getTitle()).toBe('Create new architecture decision record');
	});

	it('does not add an item for a folder outside the configured MADR directories', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('notes');

		handleFileMenu(plugin, menu, folder);

		expect(menu.items).toHaveLength(0);
	});

	it('does not add an item when the right-clicked item is a file, not a folder', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const file = new TFile('decisions/my-decision.md');

		handleFileMenu(plugin, menu, file);

		expect(menu.items).toHaveLength(0);
	});

	it('invokes createMadrInDirectory with the plugin and the right-clicked folder path when clicked', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('decisions');

		handleFileMenu(plugin, menu, folder);
		menu.items[0]?.trigger(new MouseEvent('click'));

		expect(createMadrInDirectorySpy).toHaveBeenCalledWith(plugin, 'decisions');
	});

	it('adds a create-ADR item for a direct subfolder of a configured MADR directory', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('decisions/frontend');

		handleFileMenu(plugin, menu, folder);

		expect(menu.items).toHaveLength(1);
		expect(menu.items[0]?.getTitle()).toBe('Create new architecture decision record');
	});

	it('adds a create-ADR item for a subfolder nested multiple levels deep', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('decisions/frontend/auth');

		handleFileMenu(plugin, menu, folder);

		expect(menu.items).toHaveLength(1);
	});

	it('does not add an item for a folder that merely shares a name prefix with a configured directory', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('decisions-archive');

		handleFileMenu(plugin, menu, folder);

		expect(menu.items).toHaveLength(0);
	});

	it('invokes createMadrInDirectory with the subfolder path, not the parent configured directory', () => {
		const plugin = makePlugin(['decisions']);
		const menu = new Menu();
		const folder = new TFolder('decisions/frontend');

		handleFileMenu(plugin, menu, folder);
		menu.items[0]?.trigger(new MouseEvent('click'));

		expect(createMadrInDirectorySpy).toHaveBeenCalledWith(plugin, 'decisions/frontend');
	});
});
