import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import type { ZxcvbnResult } from '@zxcvbn-ts/core';

const options = {
	translations: zxcvbnEnPackage.translations,
	graphs: zxcvbnCommonPackage.adjacencyGraphs,
	dictionary: {
		...zxcvbnCommonPackage.dictionary,
		...zxcvbnEnPackage.dictionary,
	},
}

zxcvbnOptions.setOptions(options)

export function getPasswordStrength(email: string, password: string): ZxcvbnResult {
	return zxcvbn(password, [email]);
}

export function isPasswordStrongEnough(email: string, password: string): boolean {
	const passwordStrength = getPasswordStrength(email, password);
	return passwordStrength.score >= 3;
}
