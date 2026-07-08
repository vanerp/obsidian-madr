import { describe, expect, it } from 'vitest';
import { formatDateISO } from '../../src/utils/format-date';

describe('formatDateISO', () => {
	it('formats a date with a double-digit month and day', () => {
		expect(formatDateISO(new Date(2026, 10, 23))).toBe('2026-11-23');
	});

	it('zero-pads a single-digit month and day', () => {
		expect(formatDateISO(new Date(2026, 0, 5))).toBe('2026-01-05');
	});
});
