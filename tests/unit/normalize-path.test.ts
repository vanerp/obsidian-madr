import { describe, expect, it } from 'vitest';
import { isPathUnderDirectory, normalizeVaultPath } from '../../src/utils/normalize-path';

describe('normalizeVaultPath', () => {
	it('trims whitespace and drops empty, dot, and dot-dot segments', () => {
		expect(normalizeVaultPath(' decisions / frontend ')).toBe('decisions/frontend');
		expect(normalizeVaultPath('decisions//frontend')).toBe('decisions/frontend');
		expect(normalizeVaultPath('./decisions/../frontend')).toBe('decisions/frontend');
	});
});

describe('isPathUnderDirectory', () => {
	it('matches the directory itself', () => {
		expect(isPathUnderDirectory('decisions', 'decisions')).toBe(true);
	});

	it('matches a direct child', () => {
		expect(isPathUnderDirectory('decisions/frontend', 'decisions')).toBe(true);
	});

	it('matches a multi-level nested child', () => {
		expect(isPathUnderDirectory('decisions/frontend/auth/my-decision.md', 'decisions')).toBe(true);
	});

	it('does not match an unrelated path', () => {
		expect(isPathUnderDirectory('notes/my-note.md', 'decisions')).toBe(false);
	});

	it('does not match a folder that merely shares a name prefix', () => {
		expect(isPathUnderDirectory('decisions-archive', 'decisions')).toBe(false);
		expect(isPathUnderDirectory('decisions-archive/old.md', 'decisions')).toBe(false);
	});
});
