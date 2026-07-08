import { beforeEach, describe, expect, it, vi } from 'vitest';

let nextTitle = 'My decision';

const titlePromptSpy = vi.fn();
vi.mock('../../src/modals/title-prompt-modal', () => ({
	TitlePromptModal: vi.fn().mockImplementation(function (
		_app: unknown,
		onSubmit: (title: string) => void,
	) {
		return {
			open: () => {
				titlePromptSpy();
				onSubmit(nextTitle);
			},
		};
	}),
}));

const directorySuggestSpy = vi.fn();
vi.mock('../../src/modals/directory-suggest-modal', () => ({
	DirectorySuggestModal: vi.fn().mockImplementation(function (
		_app: unknown,
		directories: string[],
		onChoose: (directory: string) => void,
	) {
		return {
			open: () => {
				directorySuggestSpy(directories);
				onChoose(directories[0]!);
			},
		};
	}),
}));

vi.mock('obsidian', async () => {
	const actual = await vi.importActual<typeof import('obsidian')>('obsidian');
	return { ...actual, Notice: vi.fn() };
});

import { Notice, TFile } from 'obsidian';
import { createMadr } from '../../src/commands/create-madr';
import type MadrPlugin from '../../src/main';
import { MadrCreationDefaults, MadrVersion } from '../../src/types';

function flushPromises(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function makePlugin(options: {
	madrDirectories: string[];
	existingPaths?: string[];
	defaultVersion?: MadrVersion;
	creationDefaults?: MadrCreationDefaults;
}): {
	plugin: MadrPlugin;
	created: { path: string; content: string }[];
} {
	const created: { path: string; content: string }[] = [];
	const existing = new Set(options.existingPaths ?? []);
	const creationDefaults: MadrCreationDefaults = options.creationDefaults ?? {
		status: '',
		decisionMakers: [],
		consulted: [],
		informed: [],
	};

	const plugin = {
		settings: {
			madrDirectories: options.madrDirectories,
			defaultVersion: options.defaultVersion ?? '4.0',
			creationDefaults,
		},
		app: {
			vault: {
				getAbstractFileByPath: (path: string) => (existing.has(path) ? new TFile(path) : null),
				create: async (path: string, content: string) => {
					created.push({ path, content });
					return new TFile(path);
				},
			},
			workspace: {
				getLeaf: () => ({ openFile: vi.fn() }),
			},
		},
	};

	return { plugin: plugin as unknown as MadrPlugin, created };
}

beforeEach(() => {
	vi.clearAllMocks();
	nextTitle = 'My decision';
});

describe('createMadr', () => {
	it('shows a Notice directing to settings when no directories are configured', () => {
		const { plugin, created } = makePlugin({ madrDirectories: [] });

		createMadr(plugin);

		expect(Notice).toHaveBeenCalledWith(expect.stringContaining('settings'));
		expect(titlePromptSpy).not.toHaveBeenCalled();
		expect(created).toHaveLength(0);
	});

	it('skips the directory picker when exactly one directory is configured', async () => {
		const { plugin, created } = makePlugin({ madrDirectories: ['decisions'] });

		createMadr(plugin);
		await flushPromises();

		expect(directorySuggestSpy).not.toHaveBeenCalled();
		expect(titlePromptSpy).toHaveBeenCalled();
		expect(created).toEqual([{ path: 'decisions/my-decision.md', content: expect.any(String) }]);
	});

	it('shows the directory picker when multiple directories are configured', async () => {
		const { plugin, created } = makePlugin({ madrDirectories: ['decisions', 'adr'] });

		createMadr(plugin);
		await flushPromises();

		expect(directorySuggestSpy).toHaveBeenCalledWith(['decisions', 'adr']);
		expect(created[0]?.path).toBe('decisions/my-decision.md');
	});

	it('rejects a title that kebab-cases to an empty string', async () => {
		const { plugin, created } = makePlugin({ madrDirectories: ['decisions'] });
		nextTitle = '!!!';

		createMadr(plugin);
		await flushPromises();

		expect(Notice).toHaveBeenCalledWith(expect.stringContaining('letter or number'));
		expect(created).toHaveLength(0);
	});

	it('aborts with a Notice when the target path already exists', async () => {
		const { plugin, created } = makePlugin({
			madrDirectories: ['decisions'],
			existingPaths: ['decisions/my-decision.md'],
		});

		createMadr(plugin);
		await flushPromises();

		expect(Notice).toHaveBeenCalledWith(expect.stringContaining('already exists'));
		expect(created).toHaveLength(0);
	});

	it('renders the MADR 4.0 template with creation defaults when defaultVersion is 4.0', async () => {
		const { plugin, created } = makePlugin({
			madrDirectories: ['decisions'],
			defaultVersion: '4.0',
			creationDefaults: {
				status: 'proposed',
				decisionMakers: ['Alice'],
				consulted: ['Bob'],
				informed: ['Carol'],
			},
		});

		createMadr(plugin);
		await flushPromises();

		const content = created[0]?.content ?? '';
		expect(content).toContain('status: "proposed"');
		expect(content).toContain('decision-makers: Alice');
		expect(content).toContain('consulted: Bob');
		expect(content).toContain('informed: Carol');
	});

	it('renders the MADR 3.0 template when defaultVersion is 3.0', async () => {
		const { plugin, created } = makePlugin({
			madrDirectories: ['decisions'],
			defaultVersion: '3.0',
			creationDefaults: {
				status: 'accepted',
				decisionMakers: ['Alice'],
				consulted: ['Bob'],
				informed: ['Carol'],
			},
		});

		createMadr(plugin);
		await flushPromises();

		const content = created[0]?.content ?? '';
		expect(content).toContain('status: accepted');
		expect(content).toContain('deciders: Alice');
		expect(content).toContain('consulted: Bob');
		expect(content).toContain('informed: Carol');
	});
});
