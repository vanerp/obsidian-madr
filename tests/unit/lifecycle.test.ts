import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const mainTsPath = join(process.cwd(), 'src/main.ts');
const source = readFileSync(mainTsPath, 'utf-8');

describe('main.ts lifecycle regression guard (FR-014)', () => {
	it('never calls addEventListener directly (must use registerDomEvent instead)', () => {
		expect(source).not.toMatch(/\.addEventListener\(/);
	});

	it('only calls setInterval/setTimeout as an argument to registerInterval', () => {
		const rawTimerCalls = source.match(/(?<!register)(?:Interval|Timeout)\(/g) ?? [];
		const registeredTimerCalls =
			source.match(/registerInterval\(\s*window\.set(?:Interval|Timeout)\(/g) ?? [];
		expect(rawTimerCalls.length).toBe(registeredTimerCalls.length);
	});
});
