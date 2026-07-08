import { lint as lintSync } from 'markdownlint/sync';
import { Check } from '../types';
import { MADR_MARKDOWNLINT_CONFIG } from './madr-markdownlint-config';

interface RuleViolationGroup {
	ruleId: string;
	ruleDescription: string;
	lineNumbers: number[];
}

export function evaluateMarkdownStyleChecks(fileContent: string): Check[] {
	let errors;
	try {
		const results = lintSync({ strings: { note: fileContent }, config: MADR_MARKDOWNLINT_CONFIG });
		errors = results.note ?? [];
	} catch (error) {
		console.error('madr: markdownlint failed to lint the current note', error);
		return [];
	}

	if (errors.length === 0) {
		return [
			{
				id: 'markdown-style-well-formed',
				label: 'Markdown formatting follows MADR conventions',
				kind: 'markdown-style',
				status: 'pass',
			},
		];
	}

	const groupsByRuleId = new Map<string, RuleViolationGroup>();
	for (const error of errors) {
		const ruleId = error.ruleNames[0] ?? 'unknown';
		const group = groupsByRuleId.get(ruleId);
		if (group) {
			group.lineNumbers.push(error.lineNumber);
		} else {
			groupsByRuleId.set(ruleId, {
				ruleId,
				ruleDescription: error.ruleDescription,
				lineNumbers: [error.lineNumber],
			});
		}
	}

	return Array.from(groupsByRuleId.values()).map((group) => {
		const lineLabel = group.lineNumbers.length === 1 ? `line ${group.lineNumbers[0]}` : `lines ${group.lineNumbers.join(', ')}`;
		return {
			id: `markdown-style-${group.ruleId.toLowerCase()}`,
			label: `${group.ruleDescription} (${lineLabel})`,
			kind: 'markdown-style',
			status: 'fail',
		};
	});
}
