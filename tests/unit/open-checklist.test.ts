import { describe, expect, it, vi } from 'vitest';
import { App, Plugin } from 'obsidian';
import { openChecklist, registerAdrPanelRibbonIcon } from '../../src/commands/open-checklist';
import type MadrPlugin from '../../src/main';
import { CHECKLIST_VIEW_TYPE } from '../../src/views/checklist-view';

function makePlugin(): MadrPlugin {
	return new Plugin(new App()) as unknown as MadrPlugin;
}

describe('openChecklist', () => {
	it('opens a new leaf via getLeftLeaf when no panel is already open', async () => {
		const plugin = makePlugin();
		const { workspace } = plugin.app;
		const getLeftLeafSpy = vi.spyOn(workspace, 'getLeftLeaf');
		const getRightLeafSpy = vi.spyOn(workspace, 'getRightLeaf');

		await openChecklist(plugin);

		expect(getLeftLeafSpy).toHaveBeenCalledWith(false);
		expect(getRightLeafSpy).not.toHaveBeenCalled();
	});

	it('reveals the existing leaf instead of opening a new one when the panel is already open', async () => {
		const plugin = makePlugin();
		const { workspace } = plugin.app;
		const existingLeaf = { setViewState: vi.fn(), openFile: vi.fn() };
		vi.spyOn(workspace, 'getLeavesOfType').mockReturnValue([existingLeaf as never]);
		const getLeftLeafSpy = vi.spyOn(workspace, 'getLeftLeaf');
		const setActiveLeafSpy = vi.spyOn(workspace, 'setActiveLeaf');

		await openChecklist(plugin);

		expect(getLeftLeafSpy).not.toHaveBeenCalled();
		expect(setActiveLeafSpy).toHaveBeenCalledWith(existingLeaf, { focus: true });
	});
});

describe('registerAdrPanelRibbonIcon', () => {
	it('registers a lightbulb ribbon icon that opens the checklist panel when clicked', () => {
		const plugin = makePlugin();
		const addRibbonIconSpy = vi.spyOn(plugin, 'addRibbonIcon');
		const getLeavesOfTypeSpy = vi.spyOn(plugin.app.workspace, 'getLeavesOfType');

		registerAdrPanelRibbonIcon(plugin);

		expect(addRibbonIconSpy).toHaveBeenCalledWith('lightbulb', expect.any(String), expect.any(Function));

		const [, , callback] = addRibbonIconSpy.mock.calls[0] ?? [];
		callback?.(new MouseEvent('click'));

		expect(getLeavesOfTypeSpy).toHaveBeenCalledWith(CHECKLIST_VIEW_TYPE);
	});
});
