export type MadrVersion = '3.0' | '4.0';

export interface MadrCreationDefaults {
	status: string;
	decisionMakers: string[];
	consulted: string[];
	informed: string[];
}

export interface MadrSettings {
	madrDirectories: string[];
	defaultVersion: MadrVersion;
	creationDefaults: MadrCreationDefaults;
}

export type CheckKind = 'structural' | 'content-quality' | 'markdown-style';
export type CheckStatus = 'pass' | 'fail';

export interface Check {
	id: string;
	label: string;
	kind: CheckKind;
	status: CheckStatus;
}
