import { App, Modal } from 'obsidian';
import { getOwnerWindow } from '../window-utils';

export class TitlePromptModal extends Modal {
	private value = '';
	private readonly onSubmitCb: (title: string) => void;

	constructor(app: App, onSubmit: (title: string) => void) {
		super(app);
		this.onSubmitCb = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.titleEl.setText('Create new architecture decision record');

		const input = contentEl.createEl('input', {
			type: 'text',
			placeholder: 'Title of the decision',
			cls: 'madr-title-prompt-input',
		});
		input.addEventListener('input', () => {
			this.value = input.value;
		});
		input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				this.submit();
			}
		});

		const buttonRow = contentEl.createDiv({ cls: 'madr-title-prompt-buttons' });
		buttonRow.createEl('button', { text: 'Create', cls: 'mod-cta' }).addEventListener(
			'click',
			() => this.submit(),
		);
		buttonRow.createEl('button', { text: 'Cancel' }).addEventListener('click', () =>
			this.close(),
		);

		getOwnerWindow(contentEl).requestAnimationFrame(() => input.focus());
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private submit(): void {
		this.close();
		this.onSubmitCb(this.value);
	}
}
