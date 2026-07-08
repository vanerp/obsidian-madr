import { App, FuzzySuggestModal, TFolder } from 'obsidian';

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
	private readonly folders: TFolder[];
	private readonly onChooseCb: (folder: TFolder) => void;

	constructor(app: App, folders: TFolder[], onChoose: (folder: TFolder) => void) {
		super(app);
		this.folders = folders;
		this.onChooseCb = onChoose;
		this.setPlaceholder('Choose a folder to add');
	}

	getItems(): TFolder[] {
		return this.folders;
	}

	getItemText(item: TFolder): string {
		return item.path;
	}

	onChooseItem(item: TFolder): void {
		this.onChooseCb(item);
	}
}
