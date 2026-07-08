import { App, FuzzySuggestModal } from 'obsidian';

export class DirectorySuggestModal extends FuzzySuggestModal<string> {
	private readonly directories: string[];
	private readonly onChooseCb: (directory: string) => void;

	constructor(app: App, directories: string[], onChoose: (directory: string) => void) {
		super(app);
		this.directories = directories;
		this.onChooseCb = onChoose;
		this.setPlaceholder('Choose a MADR directory');
	}

	getItems(): string[] {
		return this.directories;
	}

	getItemText(item: string): string {
		return item;
	}

	onChooseItem(item: string): void {
		this.onChooseCb(item);
	}
}
