import en from './en.json';
import ja from './ja.json';

export type Locale = 'en' | 'ja';

type DeepStringRecord = { [key: string]: string | DeepStringRecord };

const locales: Record<Locale, DeepStringRecord> = { en, ja };

export function parseLocale(acceptLanguage: string): Locale {
	if (!acceptLanguage) return 'en';

	const tags = acceptLanguage
		.split(',')
		.map((tag, i) => {
			const [langQ, qPart] = tag.split(';').map((s) => s.trim());
			const lang = langQ.toLowerCase();
			let q = 1.0;
			if (qPart) {
				const m = qPart.match(/^q=([\d.]+)$/);
				q = m ? parseFloat(m[1]) : 0;
			}
			return { lang, q, i };
		})
		.filter(({ lang }) => lang && lang !== '*')
		.sort((a, b) => b.q - a.q || a.i - b.i);

	for (const { lang } of tags) {
		const primary = lang.split('-')[0];
		if (primary === 'ja') return 'ja';
		if (primary === 'en') return 'en';
	}

	return 'en';
}

function resolve(obj: DeepStringRecord, key: string): string {
	const parts = key.split('.');
	let cur: string | DeepStringRecord = obj;
	for (const part of parts) {
		if (typeof cur !== 'object' || cur === null) return key;
		cur = (cur as DeepStringRecord)[part];
		if (cur === undefined) return key;
	}
	return typeof cur === 'string' ? cur : key;
}

export function createTranslator(locale: Locale): (key: string) => string {
	const strings = locales[locale];
	return (key: string) => resolve(strings, key);
}
