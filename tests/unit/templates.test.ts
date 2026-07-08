import { describe, expect, it, vi } from 'vitest';
import { renderMadr3 } from '../../src/templates/madr-3';
import { renderMadr4 } from '../../src/templates/madr-4';
import { MadrCreationDefaults } from '../../src/types';

const emptyDefaults: MadrCreationDefaults = {
	status: '',
	decisionMakers: [],
	consulted: [],
	informed: [],
};

describe('renderMadr3', () => {
	it('keeps the heading placeholder untouched and keeps required sections', () => {
		const content = renderMadr3(emptyDefaults);
		expect(content).toContain('# {short title of solved problem and solution}');
		expect(content).toContain('## Context and Problem Statement');
		expect(content).toContain('## Considered Options');
		expect(content).toContain('## Decision Outcome');
		expect(content).toMatch(/^deciders:/m);
	});

	it('fills the date field with the current local date instead of the placeholder', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 6, 6));

		const content = renderMadr3(emptyDefaults);
		expect(content).toContain('date: "2026-07-06"');

		vi.useRealTimers();
	});

	it('applies creation defaults into frontmatter', () => {
		const content = renderMadr3({
			status: 'accepted',
			decisionMakers: ['Alice', 'Bob'],
			consulted: ['Carol'],
			informed: ['Dave'],
		});
		expect(content).toContain('status: accepted');
		expect(content).toContain('deciders: Alice, Bob');
		expect(content).toContain('consulted: Carol');
		expect(content).toContain('informed: Dave');
	});

	it('leaves placeholders untouched when defaults are empty', () => {
		const content = renderMadr3(emptyDefaults);
		expect(content).toContain('deciders: "{list everyone involved in the decision}"');
	});
});

describe('renderMadr4', () => {
	it('keeps the heading placeholder untouched and keeps required sections', () => {
		const content = renderMadr4(emptyDefaults);
		expect(content).toContain('# {short title, representative of solved problem and found solution}');
		expect(content).toContain('## Context and Problem Statement');
		expect(content).toContain('## Considered Options');
		expect(content).toContain('## Decision Outcome');
		expect(content).toMatch(/^decision-makers:/m);
	});

	it('fills the date field with the current local date instead of the placeholder', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 6, 6));

		const content = renderMadr4(emptyDefaults);
		expect(content).toContain('date: "2026-07-06"');

		vi.useRealTimers();
	});

	it('applies creation defaults into frontmatter', () => {
		const content = renderMadr4({
			status: 'proposed',
			decisionMakers: ['Alice'],
			consulted: [],
			informed: [],
		});
		expect(content).toContain('status: "proposed"');
		expect(content).toContain('decision-makers: Alice');
	});
});
