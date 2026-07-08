import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PLACEHOLDER_PATTERN = /Sample|MyPlugin|TODO/;

function collectTsFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			return collectTsFiles(fullPath);
		}
		return entry.name.endsWith('.ts') ? [fullPath] : [];
	});
}

describe('no leftover placeholder names in shipped code (FR-035)', () => {
	const srcDir = join(process.cwd(), 'src');
	const files = collectTsFiles(srcDir);

	it.each(files)('%s contains no placeholder strings', (file) => {
		const contents = readFileSync(file, 'utf-8');
		expect(contents).not.toMatch(PLACEHOLDER_PATTERN);
	});
});
