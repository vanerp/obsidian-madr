import { TFile } from 'obsidian';
import { Check, MadrSettings, MadrVersion } from '../types';
import { MADR_3_TEMPLATE } from '../templates/madr-3';
import { MADR_4_TEMPLATE } from '../templates/madr-4';
import { toKebabCase } from '../utils/kebab-case';
import { isPathUnderDirectory, normalizeVaultPath } from '../utils/normalize-path';
import { evaluateMarkdownStyleChecks } from './markdown-style';

const REQUIRED_SECTIONS = ['Context and Problem Statement', 'Considered Options', 'Decision Outcome'];
const PLACEHOLDER_PATTERN = /\{[^}]+\}/;
const THIN_SECTION_MIN_LENGTH = 10;

interface ParsedSection {
	heading: string;
	body: string;
}

interface ParsedRecord {
	title: string | null;
	sections: ParsedSection[];
}

// Each version's own unfilled template, parsed once, so a section can be
// compared against exactly what it looked like before any user edit.
const PRISTINE_SECTION_BODIES: Record<MadrVersion, Map<string, string>> = {
	'3.0': new Map(parseRecord(MADR_3_TEMPLATE).sections.map((section) => [section.heading, section.body.trim()])),
	'4.0': new Map(parseRecord(MADR_4_TEMPLATE).sections.map((section) => [section.heading, section.body.trim()])),
};

/**
 * A section counts as "still the unfilled placeholder" when it's empty, or
 * when its text is textually identical to that version's own pristine
 * template for this heading — any user edit at all, even a partial one that
 * leaves some placeholder text behind, makes it differ from the pristine text.
 */
function isUnfilledPlaceholder(body: string, sectionName: string, version: MadrVersion): boolean {
	const trimmed = body.trim();
	if (trimmed.length === 0) {
		return true;
	}
	const pristine = PRISTINE_SECTION_BODIES[version].get(sectionName);
	return pristine !== undefined && trimmed === pristine;
}

// A user's heading is matched by wording, not by exact letter case — someone
// typing "Considered options" instead of "Considered Options" still means it.
function headingMatches(heading: string, name: string): boolean {
	return heading.toLowerCase() === name.toLowerCase();
}

// Each version's own unfilled frontmatter block, so a metadata field can be
// compared against exactly what it looked like before any user edit — the
// same strategy as PRISTINE_SECTION_BODIES, applied to frontmatter lines.
const PRISTINE_FRONTMATTER: Record<MadrVersion, string> = {
	'3.0': extractFrontmatter(MADR_3_TEMPLATE),
	'4.0': extractFrontmatter(MADR_4_TEMPLATE),
};

interface MetadataField {
	id: string;
	label: string;
	key(version: MadrVersion): string;
}

const METADATA_FIELDS: MetadataField[] = [
	{ id: 'metadata-status-present', label: 'Status', key: () => 'status' },
	{ id: 'metadata-date-present', label: 'Date', key: () => 'date' },
	{
		id: 'metadata-decision-makers-present',
		label: 'Decision-makers',
		key: (version) => (version === '3.0' ? 'deciders' : 'decision-makers'),
	},
	{ id: 'metadata-consulted-present', label: 'Consulted', key: () => 'consulted' },
	{ id: 'metadata-informed-present', label: 'Informed', key: () => 'informed' },
];

function extractFrontmatterValue(frontmatter: string, key: string): string {
	const match = new RegExp(`^${key}:\\s*(.*)$`, 'm').exec(frontmatter);
	return (match?.[1] ?? '').trim();
}

/**
 * A metadata field counts as "still the unfilled placeholder" when it's
 * empty, or when its value is textually identical to that version's own
 * pristine frontmatter for this key.
 */
function isUnfilledMetadataField(frontmatter: string, key: string, version: MadrVersion): boolean {
	const value = extractFrontmatterValue(frontmatter, key);
	if (value.length === 0) {
		return true;
	}
	return value === extractFrontmatterValue(PRISTINE_FRONTMATTER[version], key);
}

export function isRecognizedAdr(file: TFile, settings: MadrSettings): boolean {
	if (file.extension !== 'md') {
		return false;
	}

	const path = normalizeVaultPath(file.path);
	return settings.madrDirectories.some((directory) => isPathUnderDirectory(path, directory));
}

export function detectVersion(fileContent: string, fallback: MadrVersion): MadrVersion {
	const frontmatter = extractFrontmatter(fileContent);
	if (/^decision-makers:/m.test(frontmatter)) {
		return '4.0';
	}
	if (/^deciders:/m.test(frontmatter)) {
		return '3.0';
	}
	return fallback;
}

export function evaluateChecks(fileContent: string, version: MadrVersion): Check[] {
	const { title, sections } = parseRecord(fileContent);
	const checks: Check[] = [];

	const frontmatter = extractFrontmatter(fileContent);
	for (const field of METADATA_FIELDS) {
		const key = field.key(version);
		const filled = !isUnfilledMetadataField(frontmatter, key, version);
		checks.push({
			id: field.id,
			label: filled ? `${field.label} is filled in` : `${field.label} is missing or still the placeholder`,
			kind: 'structural',
			status: filled ? 'pass' : 'fail',
		});
	}

	const titleFilled = title !== null && title.length > 0 && !PLACEHOLDER_PATTERN.test(title);
	checks.push({
		id: 'section-title-present',
		label: titleFilled ? 'Title is set' : 'Title is missing or still the placeholder text',
		kind: 'structural',
		status: titleFilled ? 'pass' : 'fail',
	});

	for (const sectionName of REQUIRED_SECTIONS) {
		const section = sections.find((candidate) => headingMatches(candidate.heading, sectionName));
		const present = !isUnfilledPlaceholder(section?.body ?? '', sectionName, version);
		checks.push({
			id: `section-${toKebabCase(sectionName)}-present`,
			label: present ? `${sectionName} is filled in` : `${sectionName} is missing or empty`,
			kind: 'structural',
			status: present ? 'pass' : 'fail',
		});
	}

	const optionsSection = sections.find((candidate) => headingMatches(candidate.heading, 'Considered Options'));
	const hasListedOption =
		optionsSection !== undefined && !isUnfilledPlaceholder(optionsSection.body, 'Considered Options', version);
	checks.push({
		id: 'section-considered-options-has-items',
		label: hasListedOption
			? 'Considered options lists at least one option'
			: 'Considered options has no listed options',
		kind: 'structural',
		status: hasListedOption ? 'pass' : 'fail',
	});

	const combinedBody = [title ?? '', ...sections.map((section) => section.body)].join('\n');
	const hasPlaceholderText = PLACEHOLDER_PATTERN.test(combinedBody);
	checks.push({
		id: 'content-no-placeholder-text',
		label: hasPlaceholderText
			? 'Some sections still contain unfilled template placeholder text'
			: 'No leftover placeholder text',
		kind: 'content-quality',
		status: hasPlaceholderText ? 'fail' : 'pass',
	});

	const hasThinSection = REQUIRED_SECTIONS.some((sectionName) => {
		const section = sections.find((candidate) => headingMatches(candidate.heading, sectionName));
		const rawTrimmedLength = section?.body.trim().length ?? 0;
		if (rawTrimmedLength === 0) {
			return false;
		}
		if (isUnfilledPlaceholder(section?.body ?? '', sectionName, version)) {
			return true;
		}
		return rawTrimmedLength < THIN_SECTION_MIN_LENGTH;
	});
	checks.push({
		id: 'content-no-thin-sections',
		label: hasThinSection
			? 'A required section has very little content'
			: 'Required sections have substantive content',
		kind: 'content-quality',
		status: hasThinSection ? 'fail' : 'pass',
	});

	checks.push(...evaluateMarkdownStyleChecks(fileContent));

	return checks;
}

function extractFrontmatter(fileContent: string): string {
	const match = /^---\n([\s\S]*?)\n---/.exec(fileContent);
	return match?.[1] ?? '';
}

function stripFrontmatter(fileContent: string): string {
	return fileContent.replace(/^---\n[\s\S]*?\n---\n?/, '');
}

function parseRecord(fileContent: string): ParsedRecord {
	const lines = stripFrontmatter(fileContent).split('\n');
	let title: string | null = null;
	const sections: ParsedSection[] = [];
	let current: ParsedSection | null = null;

	for (const line of lines) {
		const titleMatch: RegExpExecArray | null = title === null ? /^#\s+(.*)$/.exec(line) : null;
		if (titleMatch) {
			title = (titleMatch[1] ?? '').trim();
			continue;
		}

		const headingMatch = /^#{2,6}\s+(.*)$/.exec(line);
		if (headingMatch) {
			if (current) {
				sections.push(current);
			}
			current = { heading: (headingMatch[1] ?? '').trim(), body: '' };
			continue;
		}

		if (current) {
			current.body += `${line}\n`;
		}
	}

	if (current) {
		sections.push(current);
	}

	return { title, sections };
}
