import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { renderMadr3 } from '../../src/templates/madr-3';
import { renderMadr4 } from '../../src/templates/madr-4';
import { MadrCreationDefaults } from '../../src/types';

const emptyDefaults: MadrCreationDefaults = {
	status: '',
	decisionMakers: [],
	consulted: [],
	informed: [],
};

const filledDefaults: MadrCreationDefaults = {
	status: 'accepted',
	decisionMakers: ['Alice'],
	consulted: ['Bob'],
	informed: ['Carol'],
};

function extractFrontmatter(content: string): string {
	const match = /^---\n([\s\S]*?)\n---/.exec(content);
	if (!match?.[1]) {
		throw new Error('No frontmatter block found');
	}
	return match[1];
}

describe('frontmatter is valid YAML (regression: unquoted placeholder braces broke Obsidian rendering)', () => {
	it.each([
		['renderMadr3 with empty defaults', () => renderMadr3(emptyDefaults)],
		['renderMadr3 with filled defaults', () => renderMadr3(filledDefaults)],
		['renderMadr4 with empty defaults', () => renderMadr4(emptyDefaults)],
		['renderMadr4 with filled defaults', () => renderMadr4(filledDefaults)],
	])('%s produces a parseable frontmatter block', (_label, render) => {
		const frontmatter = extractFrontmatter(render());

		expect(() => parse(frontmatter)).not.toThrow();

		const parsed = parse(frontmatter) as Record<string, unknown>;
		expect(typeof parsed.status).toBe('string');
		expect(typeof parsed.date).toBe('string');
		expect(typeof parsed.consulted).toBe('string');
		expect(typeof parsed.informed).toBe('string');
	});

	it('parses the deciders field as a string for a freshly created 3.0 file', () => {
		const parsed = parse(extractFrontmatter(renderMadr3(emptyDefaults))) as Record<string, unknown>;
		expect(typeof parsed.deciders).toBe('string');
	});

	it('parses the decision-makers field as a string for a freshly created 4.0 file', () => {
		const parsed = parse(extractFrontmatter(renderMadr4(emptyDefaults))) as Record<string, unknown>;
		expect(typeof parsed['decision-makers']).toBe('string');
	});
});
