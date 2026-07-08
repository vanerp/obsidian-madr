import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import MadrPlugin from './main';
import { FolderSuggestModal } from './modals/folder-suggest-modal';
import { MadrSettings, MadrVersion } from './types';
import { normalizeVaultPath } from './utils/normalize-path';

function parseNameList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

export type { MadrSettings } from './types';

export const DEFAULT_SETTINGS: MadrSettings = {
	madrDirectories: [],
	defaultVersion: '4.0',
	creationDefaults: {
		status: '',
		decisionMakers: [],
		consulted: [],
		informed: [],
	},
};

export class MadrSettingTab extends PluginSettingTab {
	plugin: MadrPlugin;

	constructor(app: App, plugin: MadrPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName('MADR directories').setHeading();

		for (const directory of this.plugin.settings.madrDirectories) {
			new Setting(containerEl).setName(directory).addExtraButton((button) =>
				button
					.setIcon('trash')
					.setTooltip('Remove directory')
					.onClick(() => {
						void this.removeDirectory(directory);
					}),
			);
		}

		new Setting(containerEl)
			.setName('Add folder')
			.setDesc('Choose a vault folder to use for storing architecture decision records.')
			.addButton((button) =>
				button.setButtonText('Add folder').onClick(() => {
					this.openFolderPicker();
				}),
			);

		new Setting(containerEl).setName('Record defaults').setHeading();

		new Setting(containerEl)
			.setName('Default version')
			.setDesc('MADR template version used for newly created records.')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('3.0', '3.0')
					.addOption('4.0', '4.0')
					.setValue(this.plugin.settings.defaultVersion)
					.onChange((value) => {
						void this.updateSettings((settings) => {
							settings.defaultVersion = value as MadrVersion;
						});
					}),
			);

		new Setting(containerEl)
			.setName('Default status')
			.setDesc('Status frontmatter value applied to newly created records. Leave empty to skip.')
			.addText((text) =>
				text.setValue(this.plugin.settings.creationDefaults.status).onChange((value) => {
					void this.updateSettings((settings) => {
						settings.creationDefaults.status = value;
					});
				}),
			);

		new Setting(containerEl)
			.setName('Default decision-makers')
			.setDesc('Comma-separated names applied to newly created records.')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.creationDefaults.decisionMakers.join(', '))
					.onChange((value) => {
						void this.updateSettings((settings) => {
							settings.creationDefaults.decisionMakers = parseNameList(value);
						});
					}),
			);

		new Setting(containerEl)
			.setName('Default consulted')
			.setDesc('Comma-separated names applied to newly created records.')
			.addText((text) =>
				text.setValue(this.plugin.settings.creationDefaults.consulted.join(', ')).onChange((value) => {
					void this.updateSettings((settings) => {
						settings.creationDefaults.consulted = parseNameList(value);
					});
				}),
			);

		new Setting(containerEl)
			.setName('Default informed')
			.setDesc('Comma-separated names applied to newly created records.')
			.addText((text) =>
				text.setValue(this.plugin.settings.creationDefaults.informed.join(', ')).onChange((value) => {
					void this.updateSettings((settings) => {
						settings.creationDefaults.informed = parseNameList(value);
					});
				}),
			);
	}

	private async updateSettings(mutate: (settings: MadrSettings) => void): Promise<void> {
		mutate(this.plugin.settings);
		await this.plugin.saveSettings();
	}

	private openFolderPicker(): void {
		const configured = new Set(this.plugin.settings.madrDirectories);
		const folders = this.plugin.app.vault
			.getAllLoadedFiles()
			.filter((file): file is TFolder => file instanceof TFolder)
			.filter((folder) => !configured.has(normalizeVaultPath(folder.path)));

		new FolderSuggestModal(this.plugin.app, folders, (folder) => {
			void this.addDirectory(folder.path);
		}).open();
	}

	private async addDirectory(path: string): Promise<void> {
		const normalized = normalizeVaultPath(path);
		if (normalized.length === 0 || this.plugin.settings.madrDirectories.includes(normalized)) {
			return;
		}

		this.plugin.settings.madrDirectories.push(normalized);
		await this.plugin.saveSettings();
		this.display();
	}

	private async removeDirectory(directory: string): Promise<void> {
		const index = this.plugin.settings.madrDirectories.indexOf(directory);
		if (index === -1) {
			return;
		}

		this.plugin.settings.madrDirectories.splice(index, 1);
		await this.plugin.saveSettings();
		this.display();
	}
}
