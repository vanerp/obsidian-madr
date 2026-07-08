import { WorkspaceLeaf } from 'obsidian';
import type MadrPlugin from '../main';
import { CHECKLIST_VIEW_TYPE, ChecklistView } from '../views/checklist-view';

export function registerChecklistView(plugin: MadrPlugin): void {
	plugin.registerView(CHECKLIST_VIEW_TYPE, (leaf) => new ChecklistView(leaf, plugin));
}

export async function openChecklist(plugin: MadrPlugin): Promise<void> {
	const { workspace } = plugin.app;

	const existing = workspace.getLeavesOfType(CHECKLIST_VIEW_TYPE)[0];
	const leaf: WorkspaceLeaf | null = existing ?? workspace.getLeftLeaf(false);
	if (!leaf) {
		return;
	}

	if (!existing) {
		await leaf.setViewState({ type: CHECKLIST_VIEW_TYPE, active: true });
	}

	workspace.setActiveLeaf(leaf, { focus: true });
}

export function registerAdrPanelRibbonIcon(plugin: MadrPlugin): void {
	plugin.addRibbonIcon('lightbulb', 'Open architecture decision record panel', () => {
		void openChecklist(plugin);
	});
}
