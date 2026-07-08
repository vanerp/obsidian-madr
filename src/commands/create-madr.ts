import { Notice, TFile } from 'obsidian';
import type MadrPlugin from '../main';
import { DirectorySuggestModal } from '../modals/directory-suggest-modal';
import { TitlePromptModal } from '../modals/title-prompt-modal';
import { renderMadr3 } from '../templates/madr-3';
import { renderMadr4 } from '../templates/madr-4';
import { toKebabCase } from '../utils/kebab-case';
import { normalizeVaultPath } from '../utils/normalize-path';

export function createMadr(plugin: MadrPlugin): void {
	const directories = plugin.settings.madrDirectories;

	if (directories.length === 0) {
		new Notice('Add a MADR directory in settings before creating a record.');
		return;
	}

	const [onlyDirectory] = directories;
	if (onlyDirectory !== undefined && directories.length === 1) {
		promptForTitle(plugin, onlyDirectory);
		return;
	}

	new DirectorySuggestModal(plugin.app, directories, (directory) => {
		promptForTitle(plugin, directory);
	}).open();
}

export function createMadrInDirectory(plugin: MadrPlugin, directory: string): void {
	promptForTitle(plugin, directory);
}

function promptForTitle(plugin: MadrPlugin, directory: string): void {
	new TitlePromptModal(plugin.app, (title) => {
		void createFile(plugin, directory, title);
	}).open();
}

async function createFile(plugin: MadrPlugin, directory: string, title: string): Promise<void> {
	const slug = toKebabCase(title);
	if (slug.length === 0) {
		new Notice('Enter a title with at least one letter or number.');
		return;
	}

	const path = normalizeVaultPath(`${directory}/${slug}.md`);
	const existing = plugin.app.vault.getAbstractFileByPath(path);
	if (existing) {
		new Notice(`A file already exists at "${path}".`);
		return;
	}

	const { defaultVersion, creationDefaults } = plugin.settings;
	const content =
		defaultVersion === '3.0' ? renderMadr3(creationDefaults) : renderMadr4(creationDefaults);

	const file = await plugin.app.vault.create(path, content);
	if (file instanceof TFile) {
		await plugin.app.workspace.getLeaf(false).openFile(file);
	}
}
