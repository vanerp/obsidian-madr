/**
 * Minimal stand-in for the `obsidian` package, which ships type
 * declarations only (no runtime JS) — see obsidian.d.ts's `main: ""`.
 * Aliased in vitest.config.ts so unit tests can exercise code that
 * extends Obsidian's base classes without the real app present.
 */

function empty(this: HTMLElement) {
	while (this.firstChild) {
		this.removeChild(this.firstChild);
	}
}

interface CreateElOptions {
	text?: string;
	cls?: string | string[];
	attr?: Record<string, string>;
	type?: string;
	placeholder?: string;
	value?: string;
}

function applyElOptions(el: HTMLElement, options?: CreateElOptions) {
	if (!options) return el;
	if (options.text !== undefined) el.textContent = options.text;
	if (options.cls !== undefined) {
		const classes = (Array.isArray(options.cls) ? options.cls : [options.cls]).flatMap((cls) =>
			cls.split(/\s+/).filter((token) => token.length > 0),
		);
		el.classList.add(...classes);
	}
	if (options.attr) {
		for (const [key, value] of Object.entries(options.attr)) {
			el.setAttribute(key, value);
		}
	}
	if (options.type !== undefined) el.setAttribute('type', options.type);
	if (options.placeholder !== undefined) el.setAttribute('placeholder', options.placeholder);
	if (options.value !== undefined) (el as HTMLInputElement).value = options.value;
	return el;
}

function createEl(this: HTMLElement, tag: string, options?: CreateElOptions): HTMLElement {
	const el = applyElOptions(document.createElement(tag), options);
	this.appendChild(el);
	return el;
}

function createDiv(this: HTMLElement, options?: CreateElOptions): HTMLElement {
	return createEl.call(this, 'div', options);
}

function createSpan(this: HTMLElement, options?: CreateElOptions): HTMLElement {
	return createEl.call(this, 'span', options);
}

function setText(this: HTMLElement, text: string) {
	this.textContent = text;
}

function addClass(this: HTMLElement, ...classes: string[]) {
	this.classList.add(...classes);
}

function removeClass(this: HTMLElement, ...classes: string[]) {
	this.classList.remove(...classes);
}

function toggleClass(this: HTMLElement, classes: string | string[], value: boolean) {
	const list = Array.isArray(classes) ? classes : [classes];
	for (const cls of list) {
		this.classList.toggle(cls, value);
	}
}

for (const [name, fn] of Object.entries({
	empty,
	createEl,
	createDiv,
	createSpan,
	setText,
	addClass,
	removeClass,
	toggleClass,
})) {
	if (!(name in HTMLElement.prototype)) {
		Object.defineProperty(HTMLElement.prototype, name, {
			value: fn,
			writable: true,
			configurable: true,
		});
	}
}

export function debounce<T extends unknown[], V>(
	cb: (...args: T) => V,
	_timeout?: number,
	_resetTimer?: boolean,
): ((...args: T) => void) & { cancel: () => void } {
	const debounced = (...args: T): void => {
		cb(...args);
	};
	debounced.cancel = () => {};
	return debounced;
}

export class TAbstractFile {
	path: string;
	name: string;

	constructor(path: string) {
		this.path = path;
		this.name = path.split('/').pop() ?? path;
	}
}

export class TFile extends TAbstractFile {
	extension: string;
	basename: string;

	constructor(path: string) {
		super(path);
		const dotIndex = this.name.lastIndexOf('.');
		if (dotIndex > 0) {
			this.basename = this.name.slice(0, dotIndex);
			this.extension = this.name.slice(dotIndex + 1);
		} else {
			this.basename = this.name;
			this.extension = '';
		}
	}
}

export class TFolder extends TAbstractFile {
	children: TAbstractFile[] = [];
}

export class MenuItem {
	private title = '';
	private icon: string | null = null;
	private clickHandler?: (evt: MouseEvent | KeyboardEvent) => unknown;

	setTitle(title: string): this {
		this.title = title;
		return this;
	}

	setIcon(icon: string | null): this {
		this.icon = icon;
		return this;
	}

	onClick(cb: (evt: MouseEvent | KeyboardEvent) => unknown): this {
		this.clickHandler = cb;
		return this;
	}

	trigger(evt: MouseEvent | KeyboardEvent): void {
		this.clickHandler?.(evt);
	}

	getTitle(): string {
		return this.title;
	}

	getIcon(): string | null {
		return this.icon;
	}
}

export class Menu {
	items: MenuItem[] = [];

	addItem(cb: (item: MenuItem) => unknown): this {
		const item = new MenuItem();
		cb(item);
		this.items.push(item);
		return this;
	}
}

export class Vault {
	async create(path: string, _data: string): Promise<TFile> {
		return new TFile(path);
	}

	async read(_file: TFile): Promise<string> {
		return '';
	}

	async process(_file: TFile, fn: (data: string) => string): Promise<string> {
		return fn('');
	}

	async trash(_file: TAbstractFile, _system: boolean): Promise<void> {}

	getAbstractFileByPath(_path: string): TAbstractFile | null {
		return null;
	}

	getAllLoadedFiles(): TAbstractFile[] {
		return [];
	}

	on(name: string, _callback: (...args: never[]) => unknown): unknown {
		return { name };
	}
}

export class WorkspaceLeaf {
	async setViewState(_state: unknown): Promise<void> {}
	async openFile(_file: TFile): Promise<void> {}
}

export class Workspace {
	getActiveFile(): TFile | null {
		return null;
	}

	getLeaf(_newLeaf?: boolean): WorkspaceLeaf {
		return new WorkspaceLeaf();
	}

	getRightLeaf(_split: boolean): WorkspaceLeaf | null {
		return new WorkspaceLeaf();
	}

	getLeftLeaf(_split: boolean): WorkspaceLeaf | null {
		return new WorkspaceLeaf();
	}

	setActiveLeaf(_leaf: WorkspaceLeaf, _options?: unknown): void {}

	on(name: string, _callback: (...args: never[]) => unknown): unknown {
		return { name };
	}

	revealLeaf(_leaf: WorkspaceLeaf): void {}

	getLeavesOfType(_type: string): WorkspaceLeaf[] {
		return [];
	}
}

export class App {
	vault = new Vault();
	workspace = new Workspace();
}

export class Notice {
	message: string;

	constructor(message: string) {
		this.message = message;
	}
}

export class Component {
	registerEvent(_eventRef: unknown): void {}

	registerInterval(id: number): number {
		return id;
	}

	registerDomEvent(
		_el: EventTarget,
		_type: string,
		_callback: (...args: never[]) => unknown,
	): void {}
}

export interface Command {
	id: string;
	name: string;
	icon?: string;
	mobileOnly?: boolean;
	repeatable?: boolean;
	callback?: () => unknown;
	checkCallback?: (checking: boolean) => boolean | void;
}

export class Plugin extends Component {
	app: App;

	constructor(app: App) {
		super();
		this.app = app;
	}

	async loadData(): Promise<unknown> {
		return undefined;
	}

	async saveData(_data: unknown): Promise<void> {}

	addSettingTab(_tab: unknown): void {}

	addCommand(_command: Command): void {}

	registerView(_type: string, _factory: (leaf: WorkspaceLeaf) => ItemView): void {}

	addRibbonIcon(
		_icon: string,
		_title: string,
		_callback: (evt: MouseEvent) => unknown,
	): HTMLElement {
		return document.createElement('div');
	}
}

export class PluginSettingTab {
	app: App;
	containerEl: HTMLElement;

	constructor(app: App, _plugin: Plugin) {
		this.app = app;
		this.containerEl = document.createElement('div');
	}
}

export class Modal {
	app: App;
	contentEl: HTMLElement;
	titleEl: HTMLElement;

	constructor(app: App) {
		this.app = app;
		this.contentEl = document.createElement('div');
		this.titleEl = document.createElement('div');
	}

	open(): void {
		this.onOpen();
	}

	close(): void {
		this.onClose();
	}

	onOpen(): void {}
	onClose(): void {}
}

export abstract class FuzzySuggestModal<T> extends Modal {
	abstract getItems(): T[];
	abstract getItemText(item: T): string;
	abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void;

	setPlaceholder(_placeholder: string): void {}
	setInstructions(_instructions: unknown[]): void {}
}

export class ItemView extends Component {
	app: App;
	containerEl: HTMLElement;
	contentEl: HTMLElement;
	leaf: WorkspaceLeaf;

	constructor(leaf: WorkspaceLeaf) {
		super();
		this.leaf = leaf;
		this.app = new App();
		this.containerEl = document.createElement('div');
		this.containerEl.appendChild(document.createElement('div'));
		this.contentEl = document.createElement('div');
		this.containerEl.appendChild(this.contentEl);
	}

	getViewType(): string {
		return '';
	}

	getDisplayText(): string {
		return '';
	}

	async onOpen(): Promise<void> {}
	async onClose(): Promise<void> {}
}

export class TextComponent {
	inputEl: HTMLInputElement;
	private onChangeCb?: (value: string) => void;

	constructor(containerEl: HTMLElement) {
		this.inputEl = document.createElement('input');
		containerEl.appendChild(this.inputEl);
	}

	setPlaceholder(placeholder: string): this {
		this.inputEl.placeholder = placeholder;
		return this;
	}

	setValue(value: string): this {
		this.inputEl.value = value;
		return this;
	}

	getValue(): string {
		return this.inputEl.value;
	}

	onChange(cb: (value: string) => void): this {
		this.onChangeCb = cb;
		this.inputEl.addEventListener('input', () => this.onChangeCb?.(this.inputEl.value));
		return this;
	}
}

export class DropdownComponent {
	selectEl: HTMLSelectElement;
	private onChangeCb?: (value: string) => void;

	constructor(containerEl: HTMLElement) {
		this.selectEl = document.createElement('select');
		containerEl.appendChild(this.selectEl);
	}

	addOption(value: string, display: string): this {
		const option = document.createElement('option');
		option.value = value;
		option.textContent = display;
		this.selectEl.appendChild(option);
		return this;
	}

	setValue(value: string): this {
		this.selectEl.value = value;
		return this;
	}

	getValue(): string {
		return this.selectEl.value;
	}

	onChange(cb: (value: string) => void): this {
		this.onChangeCb = cb;
		this.selectEl.addEventListener('change', () => this.onChangeCb?.(this.selectEl.value));
		return this;
	}
}

export class ButtonComponent {
	buttonEl: HTMLButtonElement;
	private onClickCb?: () => void;

	constructor(containerEl: HTMLElement) {
		this.buttonEl = document.createElement('button');
		containerEl.appendChild(this.buttonEl);
	}

	setButtonText(text: string): this {
		this.buttonEl.textContent = text;
		return this;
	}

	setIcon(icon: string): this {
		this.buttonEl.setAttribute('data-icon', icon);
		return this;
	}

	setTooltip(tooltip: string): this {
		this.buttonEl.setAttribute('aria-label', tooltip);
		return this;
	}

	setCta(): this {
		return this;
	}

	setWarning(): this {
		return this;
	}

	onClick(cb: () => void): this {
		this.onClickCb = cb;
		this.buttonEl.addEventListener('click', () => this.onClickCb?.());
		return this;
	}
}

export class ExtraButtonComponent {
	extraSettingsEl: HTMLElement;
	private onClickCb?: () => void;

	constructor(containerEl: HTMLElement) {
		this.extraSettingsEl = document.createElement('div');
		this.extraSettingsEl.setAttribute('role', 'button');
		this.extraSettingsEl.setAttribute('tabindex', '0');
		containerEl.appendChild(this.extraSettingsEl);
	}

	setIcon(icon: string): this {
		this.extraSettingsEl.setAttribute('data-icon', icon);
		return this;
	}

	setTooltip(tooltip: string): this {
		this.extraSettingsEl.setAttribute('aria-label', tooltip);
		return this;
	}

	onClick(cb: () => void): this {
		this.onClickCb = cb;
		this.extraSettingsEl.addEventListener('click', () => this.onClickCb?.());
		return this;
	}
}

export class Setting {
	settingEl: HTMLElement;
	nameEl: HTMLElement;
	descEl: HTMLElement;
	controlEl: HTMLElement;

	constructor(containerEl: HTMLElement) {
		this.settingEl = document.createElement('div');
		this.settingEl.classList.add('setting-item');
		this.nameEl = document.createElement('div');
		this.nameEl.classList.add('setting-item-name');
		this.descEl = document.createElement('div');
		this.descEl.classList.add('setting-item-description');
		this.controlEl = document.createElement('div');
		this.controlEl.classList.add('setting-item-control');
		this.settingEl.appendChild(this.nameEl);
		this.settingEl.appendChild(this.descEl);
		this.settingEl.appendChild(this.controlEl);
		containerEl.appendChild(this.settingEl);
	}

	setName(name: string): this {
		this.nameEl.textContent = name;
		return this;
	}

	setDesc(desc: string): this {
		this.descEl.textContent = desc;
		return this;
	}

	setHeading(): this {
		this.settingEl.classList.add('setting-item-heading');
		return this;
	}

	setClass(cls: string): this {
		this.settingEl.classList.add(cls);
		return this;
	}

	addText(cb: (component: TextComponent) => void): this {
		cb(new TextComponent(this.controlEl));
		return this;
	}

	addDropdown(cb: (component: DropdownComponent) => void): this {
		cb(new DropdownComponent(this.controlEl));
		return this;
	}

	addButton(cb: (component: ButtonComponent) => void): this {
		cb(new ButtonComponent(this.controlEl));
		return this;
	}

	addExtraButton(cb: (component: ExtraButtonComponent) => void): this {
		cb(new ExtraButtonComponent(this.controlEl));
		return this;
	}
}
