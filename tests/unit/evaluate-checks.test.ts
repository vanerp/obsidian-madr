import { TFile } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { detectVersion, evaluateChecks, isRecognizedAdr } from '../../src/checks/evaluate-checks';
import { renderMadr3 } from '../../src/templates/madr-3';
import { renderMadr4 } from '../../src/templates/madr-4';
import { MadrCreationDefaults, MadrSettings } from '../../src/types';
import { MADR_3_INCOMPLETE } from '../fixtures/madr-3-samples';

const NO_DEFAULTS: MadrCreationDefaults = {
	status: '',
	decisionMakers: [],
	consulted: [],
	informed: [],
};

function makeSettings(madrDirectories: string[]): MadrSettings {
	return {
		madrDirectories,
		defaultVersion: '4.0',
		creationDefaults: NO_DEFAULTS,
	};
}

function fillRequiredSections(template: string): string {
	return template
		.replace('# {short title, representative of solved problem and found solution}', '# My decision')
		.replace('# {short title of solved problem and solution}', '# My decision')
		.replace(
			/\{Describe the context and problem statement[\s\S]*?issue management systems\.\}/,
			'We need to decide how to store configuration for the plugin going forward.',
		)
		.replace('* {title of option 1}', '* Use the Obsidian data.json API')
		.replace('* {title of option 2}', '* Use a custom config file')
		.replace('* {title of option 3}', '* …')
		.replace(
			/Chosen option: "\{title of option 1\}", because\s*\{justification\. e\.g\., only option, which meets k\.o\. criterion decision driver \| which resolves force \{force\} \| … \| comes out best \(see below\)\}\./,
			'Chosen option: "Use the Obsidian data.json API", because it integrates natively with the plugin lifecycle.',
		);
}

describe('isRecognizedAdr', () => {
	it('recognizes a markdown file located under a configured MADR directory', () => {
		const settings = makeSettings(['decisions']);
		const file = new TFile('decisions/my-decision.md');

		expect(isRecognizedAdr(file, settings)).toBe(true);
	});

	it('rejects a markdown file outside every configured MADR directory', () => {
		const settings = makeSettings(['decisions']);
		const file = new TFile('notes/my-decision.md');

		expect(isRecognizedAdr(file, settings)).toBe(false);
	});

	it('rejects a non-markdown file even inside a configured MADR directory', () => {
		const settings = makeSettings(['decisions']);
		const file = new TFile('decisions/attachment.png');

		expect(isRecognizedAdr(file, settings)).toBe(false);
	});

	it('recognizes a markdown file nested multiple directories deep under a configured MADR directory', () => {
		const settings = makeSettings(['decisions']);
		const file = new TFile('decisions/frontend/auth/my-decision.md');

		expect(isRecognizedAdr(file, settings)).toBe(true);
	});
});

describe('detectVersion', () => {
	it('detects 4.0 from a decision-makers frontmatter key', () => {
		expect(detectVersion('---\ndecision-makers: Alice\n---\n# Title', '3.0')).toBe('4.0');
	});

	it('detects 3.0 from a deciders frontmatter key', () => {
		expect(detectVersion('---\ndeciders: Alice\n---\n# Title', '4.0')).toBe('3.0');
	});

	it('falls back to the provided default when neither key is present', () => {
		expect(detectVersion('---\nstatus: proposed\n---\n# Title', '4.0')).toBe('4.0');
		expect(detectVersion('---\nstatus: proposed\n---\n# Title', '3.0')).toBe('3.0');
	});
});

describe('evaluateChecks', () => {
	it('fails structural and content-quality checks for a freshly created, completely unfilled 4.0 file', () => {
		const content = renderMadr4(NO_DEFAULTS);
		const checks = evaluateChecks(content, '4.0');

		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));
		expect(byId['section-context-and-problem-statement-present']?.status).toBe('fail');
		expect(byId['section-considered-options-has-items']?.status).toBe('fail');
		expect(byId['section-decision-outcome-present']?.status).toBe('fail');
		expect(byId['content-no-placeholder-text']?.status).toBe('fail');
		expect(byId['content-no-thin-sections']?.status).toBe('fail');
		expect(byId['section-title-present']?.status).toBe('fail');
		expect(byId['metadata-status-present']?.status).toBe('fail');
		expect(byId['metadata-decision-makers-present']?.status).toBe('fail');
		expect(byId['metadata-consulted-present']?.status).toBe('fail');
		expect(byId['metadata-informed-present']?.status).toBe('fail');
		expect(byId['metadata-date-present']?.status).toBe('pass');
		for (const check of checks) {
			expect(check.status === 'fail' ? check.label.length > 0 : true).toBe(true);
		}
	});

	it('passes all metadata checks for a record with every field replaced with a real value', () => {
		const content = renderMadr4({
			status: 'accepted',
			decisionMakers: ['Alice'],
			consulted: ['Bob'],
			informed: ['Carol'],
		});
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['metadata-status-present']?.status).toBe('pass');
		expect(byId['metadata-date-present']?.status).toBe('pass');
		expect(byId['metadata-decision-makers-present']?.status).toBe('pass');
		expect(byId['metadata-consulted-present']?.status).toBe('pass');
		expect(byId['metadata-informed-present']?.status).toBe('pass');
	});

	it('reports a mix when only some metadata fields are filled in', () => {
		const content = renderMadr4({
			status: 'accepted',
			decisionMakers: [],
			consulted: [],
			informed: [],
		});
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['metadata-status-present']?.status).toBe('pass');
		expect(byId['metadata-decision-makers-present']?.status).toBe('fail');
		expect(byId['metadata-consulted-present']?.status).toBe('fail');
		expect(byId['metadata-informed-present']?.status).toBe('fail');
	});

	it('reads the deciders key (not decision-makers) for a filled-in 3.0 record\'s metadata check', () => {
		const content = renderMadr3({
			status: 'accepted',
			decisionMakers: ['Alice'],
			consulted: [],
			informed: [],
		});
		const checks = evaluateChecks(content, '3.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['metadata-decision-makers-present']?.status).toBe('pass');
	});

	it('passes structural checks for a fully filled-in 4.0 file', () => {
		const content = fillRequiredSections(renderMadr4(NO_DEFAULTS));
		const checks = evaluateChecks(content, '4.0');

		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));
		expect(byId['section-title-present']?.status).toBe('pass');
		expect(byId['section-context-and-problem-statement-present']?.status).toBe('pass');
		expect(byId['section-considered-options-has-items']?.status).toBe('pass');
		expect(byId['section-decision-outcome-present']?.status).toBe('pass');
		expect(byId['content-no-placeholder-text']?.status).toBe('fail');
	});

	it('fails structural checks for a file missing a required section', () => {
		const content = `# My decision

## Context and Problem Statement

We need to decide how to store configuration for the plugin going forward.
`;
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-context-and-problem-statement-present']?.status).toBe('pass');
		expect(byId['section-considered-options-has-items']?.status).toBe('fail');
		expect(byId['section-decision-outcome-present']?.status).toBe('fail');
	});

	it('flags a thin required section as content-quality fail', () => {
		const content = `# My decision

## Context and Problem Statement

TBD

## Considered Options

* Option A

## Decision Outcome

We chose option A because it was simplest to implement given our constraints.
`;
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['content-no-thin-sections']?.status).toBe('fail');
	});

	it('evaluates a filled-in 3.0 file with its version-specific deciders field', () => {
		const content = fillRequiredSections(renderMadr3({ ...NO_DEFAULTS, decisionMakers: ['Alice'] }));
		expect(detectVersion(content, '4.0')).toBe('3.0');

		const checks = evaluateChecks(content, '3.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));
		expect(byId['section-considered-options-has-items']?.status).toBe('pass');
		expect(byId['section-decision-outcome-present']?.status).toBe('pass');
	});

	it('fails structural checks for a 3.0 file missing required sections', () => {
		expect(detectVersion(MADR_3_INCOMPLETE, '4.0')).toBe('3.0');

		const checks = evaluateChecks(MADR_3_INCOMPLETE, '3.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-context-and-problem-statement-present']?.status).toBe('pass');
		expect(byId['section-considered-options-present']?.status).toBe('fail');
		expect(byId['section-decision-outcome-present']?.status).toBe('fail');
	});

	it('passes "has at least one option" when some options are real and others are still placeholders', () => {
		const content = renderMadr4(NO_DEFAULTS).replace('* {title of option 1}', '* Use Redis');
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-considered-options-has-items']?.status).toBe('pass');
	});

	it('fails "has at least one option" when every option is still a placeholder, even alongside the template\'s trailing "…" line', () => {
		const content = renderMadr4(NO_DEFAULTS);
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-considered-options-has-items']?.status).toBe('fail');
	});

	it('fails structural and content-quality checks for a freshly created, completely unfilled 3.0 file', () => {
		const content = renderMadr3(NO_DEFAULTS);
		const checks = evaluateChecks(content, '3.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-context-and-problem-statement-present']?.status).toBe('fail');
		expect(byId['section-considered-options-has-items']?.status).toBe('fail');
		expect(byId['section-decision-outcome-present']?.status).toBe('fail');
		expect(byId['content-no-thin-sections']?.status).toBe('fail');
		expect(byId['metadata-status-present']?.status).toBe('fail');
		expect(byId['metadata-decision-makers-present']?.status).toBe('fail');
		expect(byId['metadata-date-present']?.status).toBe('pass');
	});

	it('recognizes "Considered options" (lowercase "o") the same as "Considered Options" in a fully filled-in 4.0 file', () => {
		const content = fillRequiredSections(renderMadr4(NO_DEFAULTS)).replace(
			'## Considered Options',
			'## Considered options',
		);
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-considered-options-present']?.status).toBe('pass');
		expect(byId['section-considered-options-has-items']?.status).toBe('pass');
		expect(byId['content-no-thin-sections']?.status).toBe('pass');
	});

	it('recognizes required section headings in any letter case in a fully filled-in 4.0 file', () => {
		const content = fillRequiredSections(renderMadr4(NO_DEFAULTS))
			.replace('## Context and Problem Statement', '## CONTEXT AND PROBLEM STATEMENT')
			.replace('## Decision Outcome', '## dEcIsIoN oUtCoMe');
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-context-and-problem-statement-present']?.status).toBe('pass');
		expect(byId['section-decision-outcome-present']?.status).toBe('pass');
		expect(byId['content-no-thin-sections']?.status).toBe('pass');
	});

	it('still fails to recognize a heading that differs from the canonical wording by more than letter case', () => {
		const content = fillRequiredSections(renderMadr4(NO_DEFAULTS)).replace(
			'## Considered Options',
			'## Considered Option',
		);
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-considered-options-present']?.status).toBe('fail');
		expect(byId['section-considered-options-has-items']?.status).toBe('fail');
	});

	it('recognizes required section headings in any letter case in a fully filled-in 3.0 file', () => {
		const content = fillRequiredSections(renderMadr3({ ...NO_DEFAULTS, decisionMakers: ['Alice'] }))
			.replace('## Considered Options', '## considered options')
			.replace('## Decision Outcome', '## DECISION OUTCOME');
		const checks = evaluateChecks(content, '3.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['section-considered-options-present']?.status).toBe('pass');
		expect(byId['section-considered-options-has-items']?.status).toBe('pass');
		expect(byId['section-decision-outcome-present']?.status).toBe('pass');
		expect(byId['content-no-thin-sections']?.status).toBe('pass');
	});

	it('includes a failing markdown-style-* entry alongside the structural checks when the note has a formatting problem', () => {
		const content = `${fillRequiredSections(renderMadr4(NO_DEFAULTS))}\n# A second top-level heading\n`;
		const checks = evaluateChecks(content, '4.0');
		const byId = Object.fromEntries(checks.map((check) => [check.id, check]));

		expect(byId['markdown-style-md025']?.status).toBe('fail');
		expect(byId['markdown-style-md025']?.label).toContain('Multiple top-level headings in the same document');
		expect(byId['section-title-present']?.status).toBe('pass');
	});

	it('reports zero markdown-style-* failures for a real MADR template with a long link line and a duplicated heading', () => {
		const longLine =
			'Configuration needs to survive plugin updates and be easy for users to inspect, and we found a ' +
			'[detailed comparison of Obsidian storage APIs](https://example.com/storage-comparison) that informed this decision.';
		const content = fillRequiredSections(renderMadr4(NO_DEFAULTS))
			.replace(
				'We need to decide how to store configuration for the plugin going forward.',
				longLine,
			)
			.concat('\n## Decision Outcome\n\nRestating the outcome under a duplicated heading on purpose.\n');

		const checks = evaluateChecks(content, '4.0');
		const markdownStyleFailures = checks.filter(
			(check) => check.kind === 'markdown-style' && check.status === 'fail',
		);

		expect(markdownStyleFailures).toEqual([]);
		expect(Object.fromEntries(checks.map((check) => [check.id, check]))['markdown-style-well-formed']?.status).toBe(
			'pass',
		);
	});
});
