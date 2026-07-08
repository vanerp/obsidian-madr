import { describe, expect, it, vi } from 'vitest';
import { evaluateMarkdownStyleChecks } from '../../src/checks/markdown-style';

const CLEAN_RECORD = `# My decision

## Context and Problem Statement

We need to decide how to store configuration for the plugin going forward.

## Considered Options

* Use the Obsidian data.json API
* Use a custom config file

## Decision Outcome

Chosen option "Use the Obsidian data.json API", because it integrates natively with the plugin lifecycle.
`;

describe('evaluateMarkdownStyleChecks', () => {
	it('returns a single passing check for content with no rule violations', () => {
		const checks = evaluateMarkdownStyleChecks(CLEAN_RECORD);

		expect(checks).toHaveLength(1);
		expect(checks[0]).toMatchObject({ id: 'markdown-style-well-formed', kind: 'markdown-style', status: 'pass' });
	});

	it('reports one failing check naming the rule and line number for a single-line violation', () => {
		const content = `# Title

## Section

Some content here.

# Second title
`;
		const checks = evaluateMarkdownStyleChecks(content);

		expect(checks).toHaveLength(1);
		const check = checks[0];
		expect(check?.id).toBe('markdown-style-md025');
		expect(check?.status).toBe('fail');
		expect(check?.label).toContain('Multiple top-level headings in the same document');
		expect(check?.label).toContain('line 7');
	});

	it('lists every affected line number when the same rule fires on multiple lines', () => {
		const content = `# Title

## Heading one.

## Heading two!
`;
		const checks = evaluateMarkdownStyleChecks(content);
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['markdown-style-md026']?.status).toBe('fail');
		expect(byId['markdown-style-md026']?.label).toContain('lines 3, 5');
	});

	it('reports two separate failing checks when two distinct rules are violated', () => {
		const content = `# Title

## Heading one.

#### Skipped heading level
`;
		const checks = evaluateMarkdownStyleChecks(content);
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['markdown-style-md026']?.status).toBe('fail');
		expect(byId['markdown-style-md001']?.status).toBe('fail');
	});

	it('does not flag long prose lines with links or repeated headings (MADR conventions)', () => {
		const longLine =
			'This is a very long line of prose that goes on and on well past the typical eighty column style guide ' +
			'limit and also happens to contain a [detailed configuration comparison](https://example.com) right in the middle of it for good measure.';
		const content = `# Title

## Context and Problem Statement

${longLine}

## Considered Options

* Option A

## Decision Outcome

Chosen option A because it is simplest given our constraints and requirements today.

## Examples

First examples section.

## Examples

Second examples section reusing the same heading text on purpose.
`;
		const checks = evaluateMarkdownStyleChecks(content);
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['markdown-style-md013']).toBeUndefined();
		expect(byId['markdown-style-md024']).toBeUndefined();
	});

	it('returns an empty array without throwing when markdownlint itself fails', async () => {
		vi.resetModules();
		vi.doMock('markdownlint/sync', () => ({
			lint: () => {
				throw new Error('boom');
			},
		}));
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const { evaluateMarkdownStyleChecks: evaluateWithMock } = await import('../../src/checks/markdown-style');
		const checks = evaluateWithMock(CLEAN_RECORD);

		expect(checks).toEqual([]);
		expect(consoleErrorSpy).toHaveBeenCalled();

		consoleErrorSpy.mockRestore();
		vi.doUnmock('markdownlint/sync');
		vi.resetModules();
	});
});