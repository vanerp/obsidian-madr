export function normalizeVaultPath(path: string): string {
	return path
		.split('/')
		.map((segment) => segment.trim())
		.filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
		.join('/');
}

export function isPathUnderDirectory(path: string, directory: string): boolean {
	return path === directory || path.startsWith(`${directory}/`);
}
