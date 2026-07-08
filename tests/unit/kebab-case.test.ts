import { describe, expect, it } from 'vitest';
import { toKebabCase } from '../../src/utils/kebab-case';

describe('toKebabCase', () => {
	it('lowercases and joins words with hyphens', () => {
		expect(toKebabCase('Use PostgreSQL for storage')).toBe('use-postgresql-for-storage');
	});

	it('collapses runs of punctuation and whitespace into a single hyphen', () => {
		expect(toKebabCase('Use  --  Postgres!!  now')).toBe('use-postgres-now');
	});

	it('trims leading and trailing hyphens', () => {
		expect(toKebabCase('  --Adopt Kubernetes--  ')).toBe('adopt-kubernetes');
	});

	it('returns an empty string for punctuation-only input', () => {
		expect(toKebabCase('!!! ??? ---')).toBe('');
	});

	it('returns an empty string for empty input', () => {
		expect(toKebabCase('')).toBe('');
	});
});
