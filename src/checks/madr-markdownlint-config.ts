// Mirrors https://github.com/adr/madr/blob/develop/template/.markdownlint.yml
export const MADR_MARKDOWNLINT_CONFIG = {
	default: true,
	MD013: false, // line length — MADR intentionally uses long one-sentence-per-line prose
	MD024: false, // duplicate headings — MADR reuses headings like "Examples" across sections
};