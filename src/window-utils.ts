/**
 * Obsidian supports pop-out windows; a plugin must resolve the document/window
 * that actually owns a given element instead of assuming the app's main window.
 */
export function getOwnerWindow(el: HTMLElement): Window {
	return el.ownerDocument.defaultView ?? window;
}

export function getOwnerDocument(el: HTMLElement): Document {
	return el.ownerDocument;
}
