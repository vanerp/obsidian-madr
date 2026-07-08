import { Plugin } from 'obsidian';
import { createMadr } from './commands/create-madr';
import {
	openChecklist,
	registerAdrPanelRibbonIcon,
	registerChecklistView,
} from './commands/open-checklist';
import { registerFolderContextMenu } from './commands/register-folder-menu';
import { DEFAULT_SETTINGS, MadrSettings, MadrSettingTab } from './settings';

export default class MadrPlugin extends Plugin {
	settings!: MadrSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MadrSettingTab(this.app, this));
		registerChecklistView(this);
		registerFolderContextMenu(this);
		registerAdrPanelRibbonIcon(this);

		this.addCommand({
			id: 'create-decision-record',
			name: 'Create new architecture decision record',
			checkCallback: (checking) => {
				if (!checking) {
					createMadr(this);
				}
				return true;
			},
		});

		this.addCommand({
			id: 'open-adr-checklist',
			name: 'Open architecture decision record checklist',
			checkCallback: (checking) => {
				if (!checking) {
					void openChecklist(this);
				}
				return true;
			},
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MadrSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
