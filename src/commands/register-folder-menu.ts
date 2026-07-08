import { Menu, TAbstractFile, TFolder } from 'obsidian';
import type MadrPlugin from '../main';
import { isPathUnderDirectory } from '../utils/normalize-path';
import { createMadrInDirectory } from './create-madr';

export function handleFileMenu(plugin: MadrPlugin, menu: Menu, file: TAbstractFile): void {
	const isRecognizedDirectory =
		file instanceof TFolder &&
		plugin.settings.madrDirectories.some((directory) => isPathUnderDirectory(file.path, directory));

	if (!isRecognizedDirectory) {
		return;
	}

	menu.addItem((item) =>
		item
			.setTitle('Create new architecture decision record')
			.setIcon('file-plus')
			.onClick(() => createMadrInDirectory(plugin, file.path)),
	);
}

export function registerFolderContextMenu(plugin: MadrPlugin): void {
	plugin.registerEvent(
		plugin.app.workspace.on('file-menu', (menu, file) => handleFileMenu(plugin, menu, file)),
	);
}
